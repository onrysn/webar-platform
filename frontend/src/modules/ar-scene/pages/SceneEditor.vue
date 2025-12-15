<template>
    <div class="flex h-screen overflow-hidden bg-gray-100 text-gray-900">

        <div class="w-80 flex flex-col border-r border-gray-300 bg-white shadow-lg z-10">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 class="font-bold text-gray-800 truncate w-32" :title="sceneData?.name">
                        {{ sceneData?.name || 'Yükleniyor...' }}
                    </h2>
                    <p v-if="sceneData?.settings" class="text-[10px] text-gray-500">
                        {{ sceneData.settings.width }}m x {{ sceneData.settings.depth }}m
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <button @click="exportScene"
                        class="text-xs flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
                        title="GLB Olarak İndir">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        İndir
                    </button>
                    <button @click="$router.back()"
                        class="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors">Çıkış</button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                <div v-for="item in sceneItems" :key="item.id" @click="selectItemFromTree(item.id)"
                    class="p-2 rounded cursor-pointer flex justify-between items-center group transition-all border border-transparent"
                    :class="selectedItemId === item.id ? 'bg-blue-100 border-blue-300 text-blue-700' : 'hover:bg-gray-100 hover:border-gray-200'">
                    <span class="text-sm truncate font-medium">{{ item.name }}</span>
                    <button @click.stop="deleteItem(item.id)"
                        class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="p-4 border-t border-gray-200 bg-gray-50">
                <button @click="showModelSelector = true"
                    class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clip-rule="evenodd" />
                    </svg>
                    Model Ekle
                </button>
            </div>
        </div>

        <div class="flex-1 relative bg-gray-200">
            <canvas ref="canvasRef" class="w-full h-full block outline-none"></canvas>

            <div v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p class="text-gray-600 font-medium">Sahne Hazırlanıyor...</p>
                </div>
            </div>

            <div
                class="absolute top-4 left-4 bg-white/90 border border-gray-200 p-3 rounded-lg shadow-md text-xs text-gray-600 pointer-events-none select-none">
                <p class="font-bold text-gray-800 mb-1">Kontroller</p>
                <p>Sol Tık: Seç / Çevir</p>
                <p>Sağ Tık: Kaydır</p>
                <div class="border-t border-gray-200 my-1"></div>
                <p>Modlar: <b>W</b>: Taşı | <b>E</b>: Döndür | <b>R</b>: Ölçekle</p>
            </div>
        </div>

        <div v-if="showModelSelector"
            class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                class="bg-white text-gray-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold text-lg text-gray-800">Kütüphaneden Model Seç</h3>
                    <button @click="showModelSelector = false"
                        class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50">
                    <div v-for="model in availableModels" :key="model.id" @click="addModelToScene(model)"
                        class="bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                        <div
                            class="aspect-square bg-gray-100 rounded mb-2 overflow-hidden flex items-center justify-center relative">
                            <img v-if="model.thumbnailPath" :src="getThumbnailUrl(model.thumbnailPath)"
                                class="w-full h-full object-cover">
                            <div v-else class="text-gray-400 text-xs font-medium">Görsel Yok</div>
                        </div>
                        <p class="text-xs font-semibold truncate text-gray-700">{{ model.fileName }}</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue';
import { useRoute } from 'vue-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'; // Export Kütüphanesi

import { arSceneService } from '../../../services/arSceneService';
import { arModelService } from '../../../services/arModelService';
import type { ARSceneDto, SceneItemDto } from '../dto/arScene.dto';
import type { ARModelDto } from '../../ar-model/dto/arModel.dto';

const route = useRoute();
const sceneId = Number(route.params.id);

// --- State ---
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const sceneData = ref<ARSceneDto | null>(null);
const sceneItems = ref<SceneItemDto[]>([]);
const showModelSelector = ref(false);
const availableModels = ref<ARModelDto[]>([]);
const selectedItemId = ref<number | null>(null);

// Mouse Takibi
const mouseStart = new THREE.Vector2();

// --- Three.js Globals ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let orbit: OrbitControls;
let transformControl: TransformControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let animationId: number;

const itemsMap = new Map<number, THREE.Object3D>();

onMounted(async () => {
    if (!sceneId) return;

    try {
        await loadSceneData();
        availableModels.value = await arModelService.listModels();

        await nextTick();
        initThreeJS();
        await loadSceneObjects();
    } catch (error) {
        console.error("Başlatma hatası:", error);
    } finally {
        isLoading.value = false;
    }
});

onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    renderer?.dispose();
    if (transformControl) {
        transformControl.detach();
        transformControl.dispose();
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
});

// --- API ---
const loadSceneData = async () => {
    sceneData.value = await arSceneService.getScene(sceneId);
    sceneItems.value = sceneData.value.items;
};

const getThumbnailUrl = (path: string) => arModelService.getPreviewUrl(path);

// --- YARDIMCI FONKSİYON: Dinamik Grid Dokusu ---
const createGridTexture = () => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;

    return texture;
};

// --- EXPORT FONKSİYONU ---
const exportScene = () => {
    if (!scene) return;

    const exporter = new GLTFExporter();

    // --- 1. TransformControls Gizleme ---
    // TypeScript hatasını aşmak için objeyi THREE.Object3D olarak tanıtıyoruz
    const controlsObj = transformControl as unknown as THREE.Object3D;
    const prevControlsVisible = controlsObj.visible;
    controlsObj.visible = false;

    // --- 2. Grid'i Gizleme ---
    // initThreeJS fonksiyonunda grid'e "GridMesh" adını vermiştik.
    // getObjectByName ile doğrudan bulabiliriz, döngüye gerek yok.
    const gridMesh = scene.getObjectByName("GridMesh");
    let prevGridVisible = true;

    if (gridMesh) {
        prevGridVisible = gridMesh.visible;
        gridMesh.visible = false; // Grid'i gizle ki .glb dosyasında çıkmasın
    }

    // --- 3. Export İşlemi ---
    exporter.parse(
        scene,
        (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${sceneData.value?.name || 'sahne'}.glb`;
            link.click();
            URL.revokeObjectURL(link.href);

            // --- 4. Görünürlüğü Geri Yükle (Başarılı) ---
            controlsObj.visible = prevControlsVisible;
            if (gridMesh) gridMesh.visible = prevGridVisible;
        },
        (error) => {
            console.error('Export error:', error);
            alert('Export başarısız.');

            // --- 5. Görünürlüğü Geri Yükle (Hata Durumu) ---
            controlsObj.visible = prevControlsVisible;
            if (gridMesh) gridMesh.visible = prevGridVisible;
        },
        {
            binary: true,
            onlyVisible: true // Sadece görünür (visible=true) objeleri dosyaya yazar
        }
    );
};

// --- Three.js Logic ---
const initThreeJS = () => {
    if (!canvasRef.value) return;

    const settings = sceneData.value?.settings || {};
    const sceneWidth = settings.width || 20;
    const sceneDepth = settings.depth || 20;
    const bgColor = settings.backgroundColor || '#f5f5f5';
    const floorColor = settings.floorColor || '#ffffff';
    const floorType = settings.floorType || 'rectangle';
    const points = settings.floorPoints || [];

    scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    const maxDim = Math.max(sceneWidth, sceneDepth);
    scene.fog = new THREE.Fog(bgColor, 30, maxDim * 8);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;

    const d = maxDim * 1.2;
    dirLight.shadow.camera.left = -d; dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d; dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    // --- GEOMETRİ ---
    let geometry: THREE.BufferGeometry;

    if (floorType === 'custom' && points.length > 2) {
        const shape = new THREE.Shape();
        const p0 = points[0];
        if (p0) shape.moveTo(p0.x, p0.z);
        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            if (p) shape.lineTo(p.x, p.z);
        }
        shape.closePath();
        geometry = new THREE.ShapeGeometry(shape);
    } else {
        geometry = new THREE.PlaneGeometry(sceneWidth, sceneDepth);
    }

    geometry.center();

    // --- UV MAP ---
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const posAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const uvAttribute = geometry.attributes.uv as THREE.BufferAttribute;

    if (posAttribute && uvAttribute) {
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const y = posAttribute.getY(i);
            const u = (x - box.min.x);
            const v = (y - box.min.y);
            uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
    }

    // --- ZEMİN ---
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    const baseMesh = new THREE.Mesh(geometry, baseMaterial);
    baseMesh.receiveShadow = true;
    baseMesh.name = "BaseFloor";

    // --- GRID ---
    const gridTexture = createGridTexture();
    if (gridTexture) gridTexture.repeat.set(1, 1);

    const gridMaterial = new THREE.MeshBasicMaterial({
        map: gridTexture,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const gridMesh = new THREE.Mesh(geometry, gridMaterial);
    gridMesh.name = "GridMesh"; // Export ederken bulmak için isim verdik

    const floorGroup = new THREE.Group();
    floorGroup.add(baseMesh);
    floorGroup.add(gridMesh);

    if (floorType === 'custom') {
        floorGroup.rotation.x = Math.PI / 2;
        floorGroup.scale.y = -1;
    } else {
        floorGroup.rotation.x = -Math.PI / 2;
    }
    scene.add(floorGroup);

    // --- KAMERA & RENDERER ---
    const width = canvasRef.value.clientWidth;
    const height = canvasRef.value.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const camDist = maxDim * 1.0;
    camera.position.set(camDist, camDist * 1.2, camDist);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- KONTROLLER ---
    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.maxPolarAngle = Math.PI / 2 - 0.02;
    orbit.target.set(0, 0, 0);
    orbit.update();

    transformControl = markRaw(new TransformControls(camera, renderer.domElement));
    transformControl.addEventListener('dragging-changed', (event) => { orbit.enabled = !event.value; });
    transformControl.addEventListener('mouseUp', async () => {
        if (transformControl.object && selectedItemId.value) {
            await saveTransform(selectedItemId.value, transformControl.object);
        }
    });
    scene.add(transformControl.getHelper());

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvasRef.value.addEventListener('mousedown', onMouseDown);
    canvasRef.value.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    animate();
};

const handleResize = () => {
    if (!canvasRef.value || !camera || !renderer) return;
    const width = canvasRef.value.parentElement?.clientWidth || window.innerWidth;
    const height = canvasRef.value.parentElement?.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

const animate = () => {
    animationId = requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
};

// --- Model Logic ---
const loadSceneObjects = async () => {
    if (!sceneData.value) return;
    const loader = new GLTFLoader();

    for (const item of sceneData.value.items) {
        try {
            const blob = await arModelService.getModelFileBlob(item.model.id, 'glb', 'view');
            const url = URL.createObjectURL(blob);
            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;

            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const pos = item.position as any;
            const rot = item.rotation as any;
            const scl = item.scale as any;

            model.position.set(pos.x, pos.y, pos.z);
            model.rotation.set(rot.x, rot.y, rot.z);
            model.scale.set(scl.x, scl.y, scl.z);

            model.userData = { isSceneItem: true, itemId: item.id };
            scene.add(model);
            itemsMap.set(item.id, model);
        } catch (err) {
            console.error(`Item ${item.id} yüklenemedi:`, err);
        }
    }
};

const addModelToScene = async (arModel: ARModelDto) => {
    isLoading.value = true;
    showModelSelector.value = false;

    try {
        const loader = new GLTFLoader();
        const blob = await arModelService.getModelFileBlob(arModel.id, 'glb', 'view');
        const url = URL.createObjectURL(blob);
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;

        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        if (box.isEmpty()) console.warn("Model boyutu hesaplanamadı.");

        const center = new THREE.Vector3();
        box.getCenter(center);

        const newX = -center.x;
        const newY = -box.min.y;
        const newZ = -center.z;

        model.position.set(newX, newY, newZ);

        const newItem = await arSceneService.addItem({
            sceneId: sceneId,
            modelId: arModel.id,
            name: arModel.fileName,
            position: { x: newX, y: newY, z: newZ }
        });

        sceneItems.value.push(newItem);

        model.userData = { isSceneItem: true, itemId: newItem.id };
        scene.add(model);
        itemsMap.set(newItem.id, model);
        selectItemFromTree(newItem.id);

    } catch (err) {
        console.error("Model ekleme hatası:", err);
        alert("Model eklenirken bir sorun oluştu.");
    } finally {
        isLoading.value = false;
    }
};

// --- Seçim Mantığı ---
const onMouseDown = (event: MouseEvent) => {
    mouseStart.set(event.clientX, event.clientY);
};

const onMouseUp = (event: MouseEvent) => {
    if (!canvasRef.value) return;

    const distance = mouseStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (distance > 5) return;

    const rect = canvasRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (selectedItemId.value && transformControl) {
        const gizmoChildren = (transformControl as any).children || [];
        if (gizmoChildren.length > 0) {
            const gizmoIntersects = raycaster.intersectObjects(gizmoChildren, true);
            if (gizmoIntersects.length > 0) return;
        }
    }

    const intersects = raycaster.intersectObjects(scene.children, true);
    const hit = intersects.find(i => {
        let obj = i.object;
        while (obj.parent && obj.parent !== scene) {
            if (obj.userData?.isSceneItem) return true;
            obj = obj.parent;
        }
        return obj.userData?.isSceneItem;
    });

    if (hit) {
        let target = hit.object;
        while (target.parent && target.parent !== scene && !target.userData?.itemId) {
            target = target.parent!;
        }
        if (target.userData?.itemId) selectItemFromTree(target.userData.itemId);
    } else {
        transformControl.detach();
        selectedItemId.value = null;
    }
};

const selectItemFromTree = (itemId: number) => {
    selectedItemId.value = itemId;
    const mesh = itemsMap.get(itemId);
    if (mesh) transformControl.attach(mesh);
};

const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
        case 'w': transformControl.setMode('translate'); break;
        case 'e': transformControl.setMode('rotate'); break;
        case 'r': transformControl.setMode('scale'); break;
        case 'delete':
        case 'backspace':
            if (selectedItemId.value) deleteItem(selectedItemId.value);
            break;
    }
};

const saveTransform = async (itemId: number, obj: THREE.Object3D) => {
    try {
        await arSceneService.updateItem(itemId, {
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
        });
        console.log("Transform saved");
    } catch (err) {
        console.error("Save error", err);
    }
};

const deleteItem = async (itemId: number) => {
    if (!confirm("Bu objeyi silmek istediğinize emin misiniz?")) return;
    try {
        await arSceneService.removeItem(itemId);
        const mesh = itemsMap.get(itemId);
        if (mesh) {
            transformControl.detach();
            scene.remove(mesh);
            itemsMap.delete(itemId);
        }
        sceneItems.value = sceneItems.value.filter(i => i.id !== itemId);
        selectedItemId.value = null;
    } catch (err) {
        console.error(err);
        alert("Silinemedi");
    }
};
</script>