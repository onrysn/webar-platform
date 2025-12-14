<template>
    <div class="flex h-screen overflow-hidden bg-gray-100 text-gray-900">

        <div class="w-80 flex flex-col border-r border-gray-300 bg-white shadow-lg z-10">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 class="font-bold text-gray-800">{{ sceneData?.name || 'Sahne Yükleniyor...' }}</h2>
                <button @click="$router.back()"
                    class="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors">Çıkış</button>
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
                class="absolute top-4 left-4 bg-white/90 border border-gray-200 p-3 rounded-lg shadow-md text-xs text-gray-600 pointer-events-none">
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

// --- AYARLAR ---
// Sahne boyutlarını buradan yönetebilirsiniz
const SCENE_SIZE_WIDTH = 20; // 20 Metre genişlik
const SCENE_SIZE_DEPTH = 20; // 20 Metre derinlik

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

// --- Three.js Logic ---
const initThreeJS = () => {
    if (!canvasRef.value) return;

    scene = new THREE.Scene();
    // 1. AÇIK TEMA RENGİ (Çok açık gri / Beyazımsı)
    scene.background = new THREE.Color(0xf5f5f5);

    // Sis efekti (Opsiyonel: Sonsuzluğu yumuşatır)
    scene.fog = new THREE.Fog(0xf5f5f5, 10, 50);

    // 2. SAHNE ZEMİNİ (Physical Floor)
    // Gölgelerin düşmesi için gerçek bir zemin geometrisi
    const floorGeometry = new THREE.PlaneGeometry(SCENE_SIZE_WIDTH, SCENE_SIZE_DEPTH);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Yatay konuma getir
    floor.receiveShadow = true; // Zemin gölgeleri kabul etsin
    scene.add(floor);

    // 3. Grid Helper (Açık tema için renkler koyulaştırıldı)
    // GridHelper(size, divisions, centerColor, gridColor)
    const gridHelper = new THREE.GridHelper(Math.max(SCENE_SIZE_WIDTH, SCENE_SIZE_DEPTH), 20, 0x888888, 0xdddddd);
    gridHelper.position.y = 0.01; // Z-fighting önlemek için zeminden çok az yukarı
    scene.add(gridHelper);

    // 4. IŞIKLANDIRMA (Açık tema ve gölgeler için optimize edildi)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6)); // Ortam ışığı

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true; // Güneş ışığı gölge yapsın

    // Gölge kalitesi ve alanı ayarları
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 15;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Camera
    const width = canvasRef.value.clientWidth;
    const height = canvasRef.value.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(8, 8, 12);
    camera.lookAt(0, 0, 0);

    // Renderer (ShadowMap aktif edildi)
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // <--- GÖLGE MOTORU AKTİF
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true; // Yumuşak duruş
    orbit.dampingFactor = 0.05;
    orbit.maxPolarAngle = Math.PI / 2 - 0.05; // Kameranın zeminin altına girmesini engelle
    orbit.update();

    // Transform Controls
    transformControl = markRaw(new TransformControls(camera, renderer.domElement));
    transformControl.addEventListener('dragging-changed', (event) => {
        orbit.enabled = !event.value;
    });
    transformControl.addEventListener('mouseUp', async () => {
        if (transformControl.object && selectedItemId.value) {
            await saveTransform(selectedItemId.value, transformControl.object);
        }
    });
    scene.add(transformControl.getHelper());

    // Raycaster
    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.5;
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
    orbit.update(); // Damping için gerekli
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

            // Gölge Özelliğini Aç (Mevcut modeller için)
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
        // 1. Modeli yükle
        const loader = new GLTFLoader();
        const blob = await arModelService.getModelFileBlob(arModel.id, 'glb', 'view');
        const url = URL.createObjectURL(blob);
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;

        // 2. Reset Transform & Update Matrix
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        // 3. Gölge Ayarlarını Aç
        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // 4. Bounding Box & Merkezleme Mantığı
        const box = new THREE.Box3().setFromObject(model);

        if (box.isEmpty()) {
            console.warn("Model boyutu hesaplanamadı.");
        }

        const center = new THREE.Vector3();
        box.getCenter(center);

        // X ve Z: Ortala
        // Y: Zemine Oturt
        const newX = -center.x;
        const newY = -box.min.y;
        const newZ = -center.z;

        // Görsel uygula
        model.position.set(newX, newY, newZ);

        // 5. Backend'e Hesaplanan Koordinatları Gönder
        const newItem = await arSceneService.addItem({
            sceneId: sceneId,
            modelId: arModel.id,
            name: arModel.fileName,
            position: { x: newX, y: newY, z: newZ }
        });

        sceneItems.value.push(newItem);

        // 6. Sahneye Ekle
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