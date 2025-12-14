<template>
    <div class="flex h-screen overflow-hidden bg-gray-900 text-white">

        <div class="w-80 flex flex-col border-r border-gray-700 bg-gray-800">
            <div class="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 class="font-bold">{{ sceneData?.name || 'Sahne Yükleniyor...' }}</h2>
                <button @click="$router.back()" class="text-xs text-gray-400 hover:text-white">Çıkış</button>
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                <div v-for="item in sceneItems" :key="item.id" @click="selectItemFromTree(item.id)"
                    class="p-2 rounded cursor-pointer flex justify-between items-center group"
                    :class="selectedItemId === item.id ? 'bg-blue-600' : 'hover:bg-gray-700'">
                    <span class="text-sm truncate">{{ item.name }}</span>
                    <button @click.stop="deleteItem(item.id)"
                        class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="p-4 border-t border-gray-700">
                <button @click="showModelSelector = true"
                    class="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clip-rule="evenodd" />
                    </svg>
                    Model Ekle
                </button>
            </div>
        </div>

        <div class="flex-1 relative bg-black">
            <canvas ref="canvasRef" class="w-full h-full block outline-none"></canvas>

            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Sahne Hazırlanıyor...</p>
                </div>
            </div>


            <div class="absolute top-4 left-4 bg-black/60 p-2 rounded text-xs text-gray-300 pointer-events-none">
                <p>Sol Tık: Seç / Sürükle</p>
                <p>Modlar: <b>W</b>: Taşı | <b>E</b>: Döndür | <b>R</b>: Ölçekle</p>
            </div>
        </div>

        <div v-if="showModelSelector" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div
                class="bg-white text-gray-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="font-bold text-lg">Kütüphaneden Model Seç</h3>
                    <button @click="showModelSelector = false" class="text-gray-500 hover:text-black">Kapat</button>
                </div>
                <div class="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="model in availableModels" :key="model.id" @click="addModelToScene(model)"
                        class="border rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                        <div class="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                            <img v-if="model.thumbnailPath" :src="getThumbnailUrl(model.thumbnailPath)"
                                class="w-full h-full object-cover">
                            <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No
                                Image</div>
                        </div>
                        <p class="text-xs font-semibold truncate">{{ model.fileName }}</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'; // markRaw eklendi
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
    // TransformControls dispose edilmeli
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
    scene.background = new THREE.Color(0x222222);

    // Grid & Lights
    scene.add(new THREE.GridHelper(20, 20));
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Camera
    const width = canvasRef.value.clientWidth;
    const height = canvasRef.value.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Controls
    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.update();

    // Transform Controls - markRaw kullanarak Vue proxy'sinden koruyoruz
    transformControl = markRaw(new TransformControls(camera, renderer.domElement));

    // 1. Orbit Çakışmasını Önle
    transformControl.addEventListener('dragging-changed', (event) => {
        orbit.enabled = !event.value;
    });

    // 2. Kaydetme
    transformControl.addEventListener('mouseUp', async () => {
        if (transformControl.object && selectedItemId.value) {
            await saveTransform(selectedItemId.value, transformControl.object);
        }
    });

    // 3. Sahneye Ekle (STANDART YÖNTEM)
    // 'as unknown as THREE.Object3D' kullanımı TypeScript hatasını susturur ama
    // çalışma zamanında nesne bozuksa yine hata verir. 
    // NOT: Eğer burada "object not an instance" hatası alırsanız aşağıdaki Terminal komutunu uygulayın.
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
        // 1. Modeli yükle (Henüz sahneye eklemiyoruz)
        const loader = new GLTFLoader();
        const blob = await arModelService.getModelFileBlob(arModel.id, 'glb', 'view');
        const url = URL.createObjectURL(blob);
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;

        // 2. Modelin Transformlarını Sıfırla ve Matrisleri Güncelle
        // (Bu adım, hesaplamanın doğru yapılması için kritiktir)
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        // 3. Bounding Box (Sınır Kutusu) Hesapla
        const box = new THREE.Box3().setFromObject(model);

        // Kutunun boyutları geçerli mi kontrol et (Boş model hatasını önler)
        if (box.isEmpty()) {
            console.warn("Model boyutu hesaplanamadı, varsayılan pozisyon kullanılıyor.");
        }

        const center = new THREE.Vector3();
        box.getCenter(center); // Görsel merkez noktası
        const size = new THREE.Vector3();
        box.getSize(size);

        // 4. Yeni Pozisyonu Hesapla (Merkezleme Mantığı)
        // X ve Z: Modelin görsel merkezini (0,0) noktasına getirmek için tersi kadar öteliyoruz.
        // Y: Modelin en alt noktasını (min.y) zemine (0) oturtmak için tersi kadar öteliyoruz.
        const newX = -center.x;
        const newY = -box.min.y;
        const newZ = -center.z;

        // Görsel olarak uygula
        model.position.set(newX, newY, newZ);

        // 5. Backend'e HESAPLANAN bu yeni koordinatları gönder
        // Böylece sayfa yenilendiğinde model yine merkezde ve zeminde olur.
        const newItem = await arSceneService.addItem({
            sceneId: sceneId,
            modelId: arModel.id,
            name: arModel.fileName,
            position: { x: newX, y: newY, z: newZ } // <--- Kritik nokta burası
        });

        sceneItems.value.push(newItem);

        // 6. Sahneye Ekle ve Yapılandır
        model.userData = { isSceneItem: true, itemId: newItem.id };
        scene.add(model);
        itemsMap.set(newItem.id, model);

        // Eklenen objeyi seçili hale getir
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

    // Gizmo Kontrolü (Type Casting ile güvenli hale getirildi)
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