/**
 * SceneExportService — Backend-side scene reconstruction & GLB/USDZ export.
 *
 * Uses Three.js to build geometry (ExtrudeGeometry, ShapeGeometry, etc.)
 * and @gltf-transform for GLB serialization (no browser/canvas needed).
 *
 * Flow:
 * 1. Load scene data + settings from DB
 * 2. Build floor (ShapeGeometry / PlaneGeometry) with textures
 * 3. Build floor layers (shapes on floor)
 * 4. Build perimeter layers (walls, sidewalks, curbs)
 * 5. Load & place 3D model GLBs (decrypt from disk)
 * 6. Serialize to GLB via @gltf-transform
 * 7. Optionally convert to USDZ via converter microservice
 * 8. Return temp file URLs
 */
import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { execSync } from 'child_process';
import * as THREE from 'three';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

import { PrismaService } from '../../prisma/prisma.service';
import { ARModelService } from '../ar-model/ar-model.service';
import { offsetPolygon } from './utils/offset-polygon';
import { generateFilletPath } from './utils/generate-fillet-path';
import { parseSVGPathToShapes } from './utils/svg-path-parser';

// ─── Types ────────────────────────────────────────────
interface ExportOptions {
    sceneName?: string;
    convertToUsdz?: boolean;
}

interface ExportResult {
    exportId: string;
    sceneName: string;
    glb: { fileName: string; url: string; size: number };
    usdz?: { fileName: string; url: string; size: number };
    usdzError?: string;
}

const WRAP_REPEAT = 10497; // WebGL REPEAT constant for glTF

// ─── Service ──────────────────────────────────────────
@Injectable()
export class SceneExportService {
    private readonly logger = new Logger(SceneExportService.name);
    private readonly converterUrl =
        process.env.CONVERTER_URL || 'http://converter:3001';
    private readonly EXPORT_ROOT = path.join(
        process.cwd(),
        'uploads',
        'temp',
        'exports',
    );
    private readonly TEXTURE_ROOT = '/shared/textures';
    private cachedIO: NodeIO | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly arModelService: ARModelService,
    ) {
        if (!fs.existsSync(this.EXPORT_ROOT)) {
            fs.mkdirSync(this.EXPORT_ROOT, { recursive: true });
        }
        setInterval(() => this.cleanExpiredExports(), 30 * 60 * 1000);
    }

    // =================== PUBLIC API ===================

    async exportScene(
        token: string,
        options: ExportOptions = {},
    ): Promise<ExportResult> {
        // 1. Load scene with full model records (need file paths for decryption)
        const sceneData = await this.prisma.aRScene.findUnique({
            where: { shareToken: token },
            include: {
                items: { include: { model: true } },
            },
        });
        if (!sceneData) throw new NotFoundException('Scene not found');

        const sceneName = options.sceneName || sceneData.name || 'scene';
        const safeName = sceneName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

        try {
            // 2. Build gltf-transform Document from scene data (floor, walls, layers)
            this.logger.log(`Building GLB for scene "${sceneName}"…`);
            const doc = await this.buildGltfDocument(sceneData);

            // 3. Write scene-only GLB to temp
            const io = await this.getNodeIO();
            const tempDir = path.join(this.EXPORT_ROOT, `tmp_${uuidv4().slice(0, 8)}`);
            fs.mkdirSync(tempDir, { recursive: true });

            const glbFiles: string[] = [];
            const sceneGlbPath = path.join(tempDir, 'scene.glb');
            fs.writeFileSync(sceneGlbPath, Buffer.from(await io.writeBinary(doc)));
            glbFiles.push(sceneGlbPath);

            // 4. Write each model GLB with transforms applied
            for (const item of sceneData.items || []) {
                try {
                    const modelGlbPath = await this.writeModelGlb(io, item, tempDir);
                    if (modelGlbPath) glbFiles.push(modelGlbPath);
                } catch (err) {
                    this.logger.error(`Model GLB write failed for item ${item.id}:`, err);
                }
            }

            // 5. Create final export directory
            const exportId = `export_${Date.now()}_${uuidv4().slice(0, 8)}`;
            const exportDir = path.join(this.EXPORT_ROOT, exportId);
            fs.mkdirSync(exportDir, { recursive: true });

            const glbFileName = `${safeName}.glb`;
            const outputGlbPath = path.join(exportDir, glbFileName);

            // 6. Merge all GLBs using gltf-transform CLI (handles all extensions, textures, etc.)
            if (glbFiles.length === 1) {
                fs.copyFileSync(glbFiles[0], outputGlbPath);
            } else {
                const args = glbFiles.map((f) => `"${f}"`).join(' ');
                execSync(`gltf-transform merge ${args} "${outputGlbPath}"`, {
                    timeout: 60000,
                    stdio: 'pipe',
                });
                this.logger.log(`Merged ${glbFiles.length} GLBs via CLI`);

                // CLI merge creates separate scenes per input file.
                // Consolidate all nodes into a single scene so AR viewers show everything.
                const mergedDoc = await io.readBinary(new Uint8Array(fs.readFileSync(outputGlbPath)));
                const allScenes = mergedDoc.getRoot().listScenes();
                if (allScenes.length > 1) {
                    const mainScene = allScenes[0];
                    for (let i = 1; i < allScenes.length; i++) {
                        const secondary = allScenes[i];
                        for (const child of [...secondary.listChildren()]) {
                            mainScene.addChild(child);
                        }
                        secondary.dispose();
                    }
                    this.logger.log(`Consolidated ${allScenes.length} scenes into one`);
                }
                const consolidated = await io.writeBinary(mergedDoc);
                fs.writeFileSync(outputGlbPath, Buffer.from(consolidated));
            }

            // Cleanup temp directory
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch { /* ignore */ }

            const glbBuffer = fs.readFileSync(outputGlbPath);

            this.logger.log(
                `GLB built: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB`,
            );

            const result: ExportResult = {
                exportId,
                sceneName,
                glb: {
                    fileName: glbFileName,
                    url: `/temp/exports/${exportId}/${glbFileName}`,
                    size: glbBuffer.length,
                },
            };

            // 7. Optional USDZ conversion (uses uncompressed GLB — converter doesn't support Draco)
            if (options.convertToUsdz) {
                try {
                    const usdz = await this.convertGlbToUsdz(
                        outputGlbPath,
                        safeName,
                        exportDir,
                        exportId,
                    );
                    result.usdz = usdz;
                    this.logger.log(
                        `USDZ converted: ${(usdz.size / 1024 / 1024).toFixed(2)} MB`,
                    );
                } catch (err) {
                    this.logger.error('USDZ conversion failed:', err);
                    result.usdzError = 'USDZ dönüşümü başarısız oldu.';
                }
            }

            // 8. Apply Draco compression to the final GLB for smaller file size
            try {
                execSync(`gltf-transform draco "${outputGlbPath}" "${outputGlbPath}"`, {
                    timeout: 120000,
                    stdio: 'pipe',
                });
                const compressedBuffer = fs.readFileSync(outputGlbPath);
                this.logger.log(
                    `Draco compressed: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB → ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`,
                );
                result.glb.size = compressedBuffer.length;
            } catch (err) {
                this.logger.warn('Draco compression failed, using uncompressed GLB:', err?.message || err);
            }

            // 8. Expiry metadata (1 hour)
            fs.writeFileSync(
                path.join(exportDir, '.meta.json'),
                JSON.stringify({
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 60 * 60 * 1000,
                    token,
                }),
            );

            return result;
        } catch (err) {
            this.logger.error('Scene export failed:', err);
            throw new InternalServerErrorException(
                `Scene export hatası: ${err}`,
            );
        }
    }

    // =================== DOCUMENT BUILDING ===================

    private async buildGltfDocument(sceneData: any): Promise<Document> {
        const doc = new Document();
        const buf = doc.createBuffer('main');
        const gltfScene = doc.createScene('Scene');
        const settings = (sceneData.settings || {}) as any;

        // Floor + floor layers
        const { floorNode, centerOffset } = await this.addFloor(
            doc,
            buf,
            settings,
        );
        gltfScene.addChild(floorNode);
        await this.addFloorLayers(doc, buf, floorNode, settings, centerOffset);

        // Perimeter layers (walls, sidewalks, etc.)
        await this.addPerimeterLayers(doc, buf, gltfScene, settings);

        // NOTE: 3D models are NOT added here. They are merged at the GLB file level
        // in exportScene() using gltf-transform CLI merge to avoid Document.merge()
        // limitations in @gltf-transform v4.

        return doc;
    }

    // ────────── FLOOR ──────────

    private async addFloor(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        settings: any,
    ) {
        const floorType = settings.floorType || 'rectangle';
        const points = settings.floorPoints || [];
        const w = Number(settings.width) || 5;
        const d = Number(settings.depth) || 4;
        const texScale = Number(settings.textureScale) || 1;

        // Build geometry (XY plane — will be rotated to XZ by parent)
        let geometry: THREE.BufferGeometry;
        if (floorType === 'custom' && points.length > 2) {
            const shape = new THREE.Shape();
            shape.moveTo(points[0].x, points[0].z);
            for (let i = 1; i < points.length; i++) {
                shape.lineTo(points[i].x, points[i].z);
            }
            shape.closePath();
            geometry = new THREE.ShapeGeometry(shape);
        } else {
            geometry = new THREE.PlaneGeometry(w, d);
            geometry.translate(w / 2, d / 2, 0);
        }

        // Center offset
        geometry.computeBoundingBox();
        const centerOffset = new THREE.Vector3();
        if (geometry.boundingBox) geometry.boundingBox.getCenter(centerOffset);
        geometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);

        // Custom UVs with texture repeat baked in
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const posAttr = geometry.attributes.position as THREE.BufferAttribute;
        const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
        if (posAttr && uvAttr) {
            const repeatFactor = texScale > 0 ? 1 / texScale : 1;
            for (let i = 0; i < posAttr.count; i++) {
                const px = posAttr.getX(i);
                const py = posAttr.getY(i);
                uvAttr.setXY(
                    i,
                    (px - box.min.x) * repeatFactor,
                    (py - box.min.y) * repeatFactor,
                );
            }
            uvAttr.needsUpdate = true;
        }

        geometry.computeVertexNormals();

        // Create glTF primitive
        const primitive = this.geometryToPrimitive(doc, buf, geometry);

        // Material
        const material = await this.createFloorMaterial(doc, buf, settings);
        primitive.setMaterial(material);

        const mesh = doc.createMesh('BaseFloor');
        mesh.addPrimitive(primitive);

        const meshNode = doc.createNode('BaseFloor').setMesh(mesh);

        // Floor group — rotation.x = π/2 rotates XY plane to XZ (horizontal)
        const floorNode = doc.createNode('FloorGroup');
        floorNode.setRotation(this.eulerToQuat(Math.PI / 2, 0, 0));
        floorNode.addChild(meshNode);

        return { floorNode, centerOffset };
    }

    // ────────── FLOOR LAYERS ──────────

    private async addFloorLayers(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        floorNode: ReturnType<Document['createNode']>,
        settings: any,
        centerOffset: THREE.Vector3,
    ) {
        const floorLayers = settings.floorLayers || [];
        if (floorLayers.length === 0) return;

        // Load shape library from DB
        const shapeLibrary = await this.prisma.shape.findMany({
            where: { isActive: true, isDeleted: false },
            orderBy: [{ sortOrder: 'asc' }],
        });

        const sortedLayers = [...floorLayers].sort(
            (a: any, b: any) => a.zIndex - b.zIndex,
        );

        for (let index = 0; index < sortedLayers.length; index++) {
            const layer = sortedLayers[index];
            let layerGeo: THREE.BufferGeometry | null = null;

            try {
                if (
                    layer.geometryType === 'freehand' &&
                    layer.points?.length >= 3
                ) {
                    // Freehand shape: generate fillet path then parse
                    const svgPath = generateFilletPath(layer.points, true);
                    if (svgPath) {
                        const shapes = parseSVGPathToShapes(svgPath);
                        if (shapes.length > 0) {
                            layerGeo = new THREE.ShapeGeometry(shapes);
                        }
                    }
                } else {
                    // Preset shape from library
                    const shapeDef =
                        shapeLibrary.find((s) => s.code === layer.shapeId) ||
                        shapeLibrary[0];
                    if (shapeDef?.svgPath) {
                        const shapes = parseSVGPathToShapes(shapeDef.svgPath);
                        if (shapes.length > 0) {
                            layerGeo = new THREE.ShapeGeometry(shapes);
                            // Center the shape
                            layerGeo.computeBoundingBox();
                            const ctr = new THREE.Vector3();
                            if (layerGeo.boundingBox)
                                layerGeo.boundingBox.getCenter(ctr);
                            layerGeo.translate(-ctr.x, -ctr.y, -ctr.z);
                        }
                    }
                }
            } catch (err) {
                this.logger.warn(
                    `Floor layer ${index} geometry failed:`,
                    err,
                );
                continue;
            }

            if (!layerGeo) continue;
            layerGeo.computeVertexNormals();

            const primitive = this.geometryToPrimitive(doc, buf, layerGeo);

            // Layer material
            const mat = await this.createLayerMaterial(doc, buf, layer, index);
            primitive.setMaterial(mat);

            const mesh = doc.createMesh(`FloorLayer_${index}`);
            mesh.addPrimitive(primitive);

            // Position: adjust by centerOffset (maps XY group coords to world)
            const correctedX = layer.x - centerOffset.x;
            const correctedZ = layer.z - centerOffset.y; // centerOffset.y ~ Z
            const zFightOffset = 0.001 * (index + 1);

            const layerNode = doc
                .createNode(`FloorLayer_${layer.geometryType}_${index}`)
                .setMesh(mesh)
                .setTranslation([correctedX, correctedZ, -zFightOffset]);

            // Scale only for preset shapes
            if (layer.geometryType !== 'freehand') {
                layerNode.setScale([
                    layer.width || 1,
                    layer.height || 1,
                    1,
                ]);
            }

            // Rotation (around Z axis in XY plane)
            if (layer.rotation) {
                layerNode.setRotation(
                    this.eulerToQuat(0, 0, -layer.rotation),
                );
            }

            floorNode.addChild(layerNode);
        }
    }

    // ────────── PERIMETER LAYERS ──────────

    private async addPerimeterLayers(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        gltfScene: ReturnType<Document['createScene']>,
        settings: any,
    ) {
        const layers = settings.perimeterLayers || [];
        if (layers.length === 0) return;

        // Base polygon
        let basePoints: { x: number; z: number }[] = [];
        if (
            settings.floorType === 'custom' &&
            Array.isArray(settings.floorPoints) &&
            settings.floorPoints.length > 2
        ) {
            basePoints = settings.floorPoints.map((p: any) => ({
                x: Number(p.x),
                z: Number(p.z),
            }));
        } else {
            const w = Number(settings.width) || 5;
            const d = Number(settings.depth) || 4;
            basePoints = [
                { x: 0, z: 0 },
                { x: w, z: 0 },
                { x: w, z: d },
                { x: 0, z: d },
            ];
        }

        // Compute center for the perimeter group position
        const tempShape = new THREE.Shape();
        const tp0 = basePoints[0];
        if (tp0) {
            tempShape.moveTo(tp0.x, -tp0.z);
            for (let i = 1; i < basePoints.length; i++) {
                const tp = basePoints[i];
                if (tp) tempShape.lineTo(tp.x, -tp.z);
            }
        }
        const tempGeom = new THREE.ShapeGeometry(tempShape);
        tempGeom.computeBoundingBox();
        const center = new THREE.Vector3();
        if (tempGeom.boundingBox) tempGeom.boundingBox.getCenter(center);

        const perimeterGroup = doc.createNode('GeneratedPerimeterGroup');
        perimeterGroup.setTranslation([-center.x, 0, center.y]);

        let currentInnerBoundary = [...basePoints];

        for (let index = 0; index < layers.length; index++) {
            const layer = layers[index];
            const outerBoundary = offsetPolygon(
                currentInnerBoundary,
                Number(layer.width),
            );
            if (!outerBoundary || outerBoundary.length < 3) continue;

            // Outer shape
            const shape = new THREE.Shape();
            const p0 = outerBoundary[0];
            if (p0) shape.moveTo(p0.x, -p0.z);
            for (let i = 1; i < outerBoundary.length; i++) {
                const p = outerBoundary[i];
                if (p) shape.lineTo(p.x, -p.z);
            }
            shape.closePath();

            // Inner hole
            const holePath = new THREE.Path();
            const h0 = currentInnerBoundary[0];
            if (h0) holePath.moveTo(h0.x, -h0.z);
            for (let i = 1; i < currentInnerBoundary.length; i++) {
                const hp = currentInnerBoundary[i];
                if (hp) holePath.lineTo(hp.x, -hp.z);
            }
            holePath.closePath();
            shape.holes.push(holePath);

            // Extrude geometry
            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: Number(layer.height) || 0.1,
                bevelEnabled: false,
            });
            geometry.computeVertexNormals();

            // Apply texture scale to UVs if textured
            if (layer.textureId || layer.textureUrl) {
                const scale = layer.textureScale || 1;
                const repeat = scale * 0.5;
                const uvs = geometry.attributes.uv as THREE.BufferAttribute;
                if (uvs) {
                    for (let i = 0; i < uvs.count; i++) {
                        uvs.setXY(
                            i,
                            uvs.getX(i) * repeat,
                            uvs.getY(i) * repeat,
                        );
                    }
                }
            }

            const primitive = this.geometryToPrimitive(doc, buf, geometry);

            // Material
            const mat = await this.createPerimeterMaterial(doc, buf, layer);
            primitive.setMaterial(mat);

            const mesh = doc.createMesh(`Perimeter_${index}`);
            mesh.addPrimitive(primitive);

            // Rotation.x = -π/2 to rotate from XY to XZ
            const meshNode = doc
                .createNode(`Perimeter_${layer.type || 'wall'}_${index}`)
                .setMesh(mesh)
                .setRotation(this.eulerToQuat(-Math.PI / 2, 0, 0))
                .setTranslation([
                    0,
                    layer.elevation ? Number(layer.elevation) : 0,
                    0,
                ]);

            perimeterGroup.addChild(meshNode);
            currentInnerBoundary = outerBoundary;
        }

        gltfScene.addChild(perimeterGroup);
    }

    // ────────── MODELS (per-file GLB for CLI merge) ──────────

    /**
     * Write a single model item as a standalone GLB file with position/rotation/scale
     * applied via a wrapper node. Returns the file path, or null on failure.
     */
    private async writeModelGlb(
        io: Awaited<ReturnType<typeof this.getNodeIO>>,
        item: any,
        tempDir: string,
    ): Promise<string | null> {
        const model = item.model;
        if (!model?.filePath || !model.iv || !model.authTag) {
            this.logger.warn(`Item ${item.id}: missing model file info`);
            return null;
        }

        // Decrypt model file
        const glbBuffer = this.arModelService.decryptFile(
            model.filePath,
            model.iv,
            model.authTag,
        );

        // Read into a document
        const modelDoc = await io.readBinary(new Uint8Array(glbBuffer));

        // Strip Draco compression extension — geometry is already decompressed
        // by the decoder on read, but writeBinary would try to re-encode without
        // the encoder installed. Removing the extension writes uncompressed geometry.
        for (const ext of modelDoc.getRoot().listExtensionsUsed()) {
            if (ext.extensionName === 'KHR_draco_mesh_compression') {
                ext.dispose();
            }
        }

        // Apply material config overrides
        if (item.materialConfig && typeof item.materialConfig === 'object') {
            this.applyMaterialConfig(modelDoc, item.materialConfig);
        }

        // Create a wrapper node with position/rotation/scale
        const pos = item.position || { x: 0, y: 0, z: 0 };
        const rot = item.rotation || { x: 0, y: 0, z: 0 };
        const scl = item.scale || { x: 1, y: 1, z: 1 };

        const wrapper = modelDoc
            .createNode(`Item_${item.id}`)
            .setTranslation([pos.x, pos.y, pos.z])
            .setRotation(this.eulerToQuat(rot.x, rot.y, rot.z))
            .setScale([scl.x, scl.y, scl.z]);

        // Re-parent model scene children under wrapper
        const modelScene = modelDoc.getRoot().listScenes()[0];
        if (modelScene) {
            const children = [...modelScene.listChildren()];
            for (const child of children) {
                wrapper.addChild(child);
            }
            modelScene.addChild(wrapper);
        }

        // Write to temp GLB
        const modelGlbPath = path.join(tempDir, `model_${item.id}.glb`);
        const modelGlbData = await io.writeBinary(modelDoc);
        fs.writeFileSync(modelGlbPath, Buffer.from(modelGlbData));

        this.logger.debug(
            `Model GLB written: item=${item.id} model=${model.fileName}`,
        );
        return modelGlbPath;
    }

    /**
     * Apply per-mesh material color/metalness/roughness overrides
     * matching the frontend applyMaterialConfig logic
     */
    private applyMaterialConfig(modelDoc: Document, config: any) {
        for (const node of modelDoc.getRoot().listNodes()) {
            const meshObj = node.getMesh();
            if (!meshObj) continue;

            const nodeName = node.getName();
            const cfg = config[nodeName];
            if (!cfg) continue;

            for (const prim of meshObj.listPrimitives()) {
                const mat = prim.getMaterial();
                if (!mat) continue;

                // Clone material to avoid affecting other primitives
                const newMat = mat.clone();
                if (cfg.color) {
                    const c = new THREE.Color(cfg.color);
                    newMat.setBaseColorFactor([c.r, c.g, c.b, 1]);
                }
                if (cfg.metalness !== undefined) {
                    newMat.setMetallicFactor(cfg.metalness);
                }
                if (cfg.roughness !== undefined) {
                    newMat.setRoughnessFactor(cfg.roughness);
                }
                prim.setMaterial(newMat);
            }
        }
    }

    // =================== GEOMETRY CONVERSION ===================

    /**
     * Convert a Three.js BufferGeometry to @gltf-transform Primitive
     */
    private geometryToPrimitive(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        geometry: THREE.BufferGeometry,
    ) {
        const prim = doc.createPrimitive();

        // Positions
        const pos = geometry.attributes.position;
        if (pos) {
            prim.setAttribute(
                'POSITION',
                doc
                    .createAccessor()
                    .setType('VEC3')
                    .setArray(new Float32Array(pos.array))
                    .setBuffer(buf),
            );
        }

        // Normals
        const norm = geometry.attributes.normal;
        if (norm) {
            prim.setAttribute(
                'NORMAL',
                doc
                    .createAccessor()
                    .setType('VEC3')
                    .setArray(new Float32Array(norm.array))
                    .setBuffer(buf),
            );
        }

        // UVs
        const uv = geometry.attributes.uv;
        if (uv) {
            prim.setAttribute(
                'TEXCOORD_0',
                doc
                    .createAccessor()
                    .setType('VEC2')
                    .setArray(new Float32Array(uv.array))
                    .setBuffer(buf),
            );
        }

        // Indices
        if (geometry.index) {
            prim.setIndices(
                doc
                    .createAccessor()
                    .setType('SCALAR')
                    .setArray(new Uint32Array(geometry.index.array))
                    .setBuffer(buf),
            );
        }

        return prim;
    }

    // =================== MATERIALS ===================

    private async createFloorMaterial(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        settings: any,
    ) {
        const mat = doc.createMaterial('FloorMaterial');
        mat.setDoubleSided(true);
        mat.setRoughnessFactor(0.8);
        mat.setMetallicFactor(0.1);

        // PBR floor texture
        if (settings.floorTextureId) {
            await this.applyPBRTexture(
                doc,
                buf,
                mat,
                settings.floorTextureId,
            );
            return mat;
        }

        // Legacy simple texture
        if (settings.floorTextureUrl) {
            const tex = this.loadTextureFile(
                doc,
                buf,
                settings.floorTextureUrl,
            );
            if (tex) {
                mat.setBaseColorTexture(tex);
                const texInfo = mat.getBaseColorTextureInfo();
                if (texInfo) {
                    texInfo.setWrapS(WRAP_REPEAT);
                    texInfo.setWrapT(WRAP_REPEAT);
                }
            }
            return mat;
        }

        // Flat color fallback
        const color = new THREE.Color(settings.floorColor || '#ffffff');
        mat.setBaseColorFactor([color.r, color.g, color.b, 1]);
        return mat;
    }

    private async createLayerMaterial(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        layer: any,
        index: number,
    ) {
        const mat = doc.createMaterial(`LayerMat_${index}`);
        mat.setDoubleSided(true);

        const opacity = layer.opacity !== undefined ? layer.opacity : 1;
        if (opacity < 1) {
            mat.setAlphaMode('BLEND' as any);
            mat.setBaseColorFactor([1, 1, 1, opacity]);
        }

        // PBR texture
        if (layer.texture?.id) {
            await this.applyPBRTexture(
                doc,
                buf,
                mat,
                layer.texture.id,
                layer.texture.scale,
            );
            return mat;
        }

        // Simple texture
        if (layer.texture?.url) {
            const tex = this.loadTextureFile(doc, buf, layer.texture.url);
            if (tex) {
                mat.setBaseColorTexture(tex);
                const texInfo = mat.getBaseColorTextureInfo();
                if (texInfo) {
                    texInfo.setWrapS(WRAP_REPEAT);
                    texInfo.setWrapT(WRAP_REPEAT);
                }
            }
            return mat;
        }

        // Color only
        const color = new THREE.Color(layer.color || '#cccccc');
        const rgba: [number, number, number, number] = [
            color.r,
            color.g,
            color.b,
            opacity,
        ];
        mat.setBaseColorFactor(rgba);
        mat.setRoughnessFactor(0.8);
        mat.setMetallicFactor(0.1);
        return mat;
    }

    private async createPerimeterMaterial(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        layer: any,
    ) {
        const mat = doc.createMaterial(`PerimeterMat_${layer.type || 'wall'}`);
        mat.setDoubleSided(true);
        mat.setRoughnessFactor(0.9);
        mat.setMetallicFactor(0.1);

        // PBR texture
        if (layer.textureId) {
            await this.applyPBRTexture(
                doc,
                buf,
                mat,
                layer.textureId,
                layer.textureScale,
            );
            return mat;
        }

        // Legacy texture
        if (layer.textureUrl) {
            const tex = this.loadTextureFile(doc, buf, layer.textureUrl);
            if (tex) {
                mat.setBaseColorTexture(tex);
                const texInfo = mat.getBaseColorTextureInfo();
                if (texInfo) {
                    texInfo.setWrapS(WRAP_REPEAT);
                    texInfo.setWrapT(WRAP_REPEAT);
                }
            }
            return mat;
        }

        // Color
        const color = new THREE.Color(layer.color || '#94a3b8');
        mat.setBaseColorFactor([color.r, color.g, color.b, 1]);
        return mat;
    }

    /**
     * Apply PBR texture maps from FloorTexture DB record to a material.
     * Loads baseColor + normalMap + aoMap. Uses scalar roughness/metalness.
     */
    private async applyPBRTexture(
        doc: Document,
        buf: ReturnType<Document['createBuffer']>,
        mat: ReturnType<Document['createMaterial']>,
        textureId: number,
        _overrideScale?: number,
    ) {
        const texRecord = await this.prisma.floorTexture.findUnique({
            where: { id: textureId },
        });
        if (!texRecord) return;

        mat.setRoughnessFactor(texRecord.roughnessValue ?? 0.9);
        mat.setMetallicFactor(texRecord.metalnessValue ?? 0.0);

        // Base color map
        if (texRecord.baseColorUrl) {
            const tex = this.loadTextureFile(doc, buf, texRecord.baseColorUrl);
            if (tex) {
                mat.setBaseColorTexture(tex);
                const info = mat.getBaseColorTextureInfo();
                if (info) {
                    info.setWrapS(WRAP_REPEAT);
                    info.setWrapT(WRAP_REPEAT);
                }
            }
        }

        // Normal map
        if (texRecord.normalUrl) {
            const tex = this.loadTextureFile(doc, buf, texRecord.normalUrl);
            if (tex) {
                mat.setNormalTexture(tex);
                mat.setNormalScale(texRecord.normalScale ?? 2.0);
                const info = mat.getNormalTextureInfo();
                if (info) {
                    info.setWrapS(WRAP_REPEAT);
                    info.setWrapT(WRAP_REPEAT);
                }
            }
        }

        // AO map (glTF reads R channel for occlusion)
        if (texRecord.aoUrl) {
            const tex = this.loadTextureFile(doc, buf, texRecord.aoUrl);
            if (tex) {
                mat.setOcclusionTexture(tex);
                mat.setOcclusionStrength(texRecord.aoIntensity ?? 1.2);
                const info = mat.getOcclusionTextureInfo();
                if (info) {
                    info.setWrapS(WRAP_REPEAT);
                    info.setWrapT(WRAP_REPEAT);
                }
            }
        }
    }

    // =================== TEXTURE LOADING ===================

    /**
     * Load a texture image file from the container filesystem.
     * DB stores URLs like "/textures/pbr/wood/baseColor.jpg"
     * Container path: "/shared/textures/pbr/wood/baseColor.jpg"
     */
    private loadTextureFile(
        doc: Document,
        _buf: ReturnType<Document['createBuffer']>,
        urlOrPath: string,
    ): ReturnType<Document['createTexture']> | null {
        try {
            const filePath = this.textureUrlToPath(urlOrPath);
            if (!fs.existsSync(filePath)) {
                this.logger.warn(`Texture file not found: ${filePath}`);
                return null;
            }

            const data = fs.readFileSync(filePath);
            const mimeType = this.getMimeType(filePath);

            const texture = doc
                .createTexture(path.basename(filePath))
                .setImage(new Uint8Array(data))
                .setMimeType(mimeType);

            return texture;
        } catch (err) {
            this.logger.warn(`Failed to load texture ${urlOrPath}:`, err);
            return null;
        }
    }

    private textureUrlToPath(url: string): string {
        // "/textures/pbr/..." → "/shared/textures/pbr/..."
        if (url.startsWith('/textures/')) {
            return url.replace('/textures/', this.TEXTURE_ROOT + '/');
        }
        // Already an absolute path
        if (url.startsWith('/')) return url;
        // Relative → resolve from cwd
        return path.join(process.cwd(), url);
    }

    private getMimeType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.png':
                return 'image/png';
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.webp':
                return 'image/webp';
            default:
                return 'image/png';
        }
    }

    // =================== GLTF IO ===================

    private async getNodeIO(): Promise<NodeIO> {
        if (this.cachedIO) return this.cachedIO;

        const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

        // Register Draco decoder for reading compressed model GLBs
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const draco3d = require('draco3dgltf');
            const decoder = await draco3d.createDecoderModule();
            io.registerDependencies({ 'draco3d.decoder': decoder });
            this.logger.log('Draco decoder registered');
        } catch (err) {
            this.logger.warn('Draco decoder not available:', err);
        }

        this.cachedIO = io;
        return io;
    }

    // =================== USDZ CONVERSION ===================

    private async convertGlbToUsdz(
        glbPath: string,
        baseName: string,
        exportDir: string,
        exportId: string,
    ): Promise<{ fileName: string; url: string; size: number }> {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(glbPath), {
            filename: `${baseName}.glb`,
            contentType: 'model/gltf-binary',
        });

        const convertResp = await fetch(`${this.converterUrl}/api/convert`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        if (!convertResp.ok) {
            const text = await convertResp.text();
            throw new Error('Converter servisi hatası: ' + text);
        }

        const convertJson = (await convertResp.json()) as {
            id: string;
            name: string;
        };
        const downloadUrl = `${this.converterUrl}/api/download?id=${encodeURIComponent(convertJson.id)}&name=${encodeURIComponent(convertJson.name)}`;

        const usdzResp = await fetch(downloadUrl);
        if (!usdzResp.ok) {
            throw new Error(
                'USDZ indirme hatası: ' + (await usdzResp.text()),
            );
        }

        const usdzBuffer = await usdzResp.buffer();
        const usdzFileName = `${baseName}.usdz`;
        const usdzPath = path.join(exportDir, usdzFileName);
        fs.writeFileSync(usdzPath, usdzBuffer);

        return {
            fileName: usdzFileName,
            url: `/temp/exports/${exportId}/${usdzFileName}`,
            size: usdzBuffer.length,
        };
    }

    // =================== CLEANUP ===================

    private cleanExpiredExports() {
        if (!fs.existsSync(this.EXPORT_ROOT)) return;

        const dirs = fs.readdirSync(this.EXPORT_ROOT);
        for (const dir of dirs) {
            const dirPath = path.join(this.EXPORT_ROOT, dir);
            const metaPath = path.join(dirPath, '.meta.json');
            try {
                if (fs.existsSync(metaPath)) {
                    const meta = JSON.parse(
                        fs.readFileSync(metaPath, 'utf8'),
                    );
                    if (meta.expiresAt && Date.now() > meta.expiresAt) {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        this.logger.debug(`Expired export cleaned: ${dir}`);
                    }
                } else {
                    const stat = fs.statSync(dirPath);
                    if (Date.now() - stat.mtimeMs > 2 * 60 * 60 * 1000) {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                    }
                }
            } catch (err) {
                this.logger.warn(`Export cleanup error (${dir}):`, err);
            }
        }
    }

    // =================== HELPERS ===================

    /**
     * Convert Euler angles (XYZ order) to quaternion [x, y, z, w]
     */
    private eulerToQuat(
        x: number,
        y: number,
        z: number,
    ): [number, number, number, number] {
        const euler = new THREE.Euler(x, y, z, 'XYZ');
        const q = new THREE.Quaternion().setFromEuler(euler);
        return [q.x, q.y, q.z, q.w];
    }
}
