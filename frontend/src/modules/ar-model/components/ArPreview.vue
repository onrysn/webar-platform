<template>
  <div class="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
    
    <canvas ref="canvasRef" class="w-full h-full block outline-none cursor-move"></canvas>
    
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-semibold text-gray-700">Model Hazırlanıyor...</span>
      </div>
    </div>

    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-red-50 z-20 p-6 text-center">
      <p class="text-red-600 font-medium text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
// USDZLoader importu
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';

defineOptions({ name: 'ThreeViewer' });

const props = defineProps<{
  file: File | null;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let currentModel: THREE.Object3D | null = null;
let animationId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

// --- Three.js Başlatma ---
const initThreeJS = () => {
  if (!canvasRef.value || renderer) return;

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value, 
    alpha: true, 
    antialias: true,
    preserveDrawingBuffer: true
  });
  
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  // Renk yönetimi USDZ için önemlidir
  renderer.outputColorSpace = THREE.SRGBColorSpace; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  scene = new THREE.Scene();
  // Hafif gri bir zemin rengi eklenebilir veya alpha:true ile transparan kalabilir
  // scene.background = new THREE.Color(0xf3f4f6); 

  // Işıklandırma (USDZ dokularının parlamaması veya karanlık kalmaması için)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 5); // Başlangıç pozisyonu

  controls = new OrbitControls(camera, canvasRef.value);
  controls.enableDamping = true;
  
  resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      if(!entry.contentRect) continue;
      const { width, height } = entry.contentRect;
      if (renderer && camera && width > 0 && height > 0) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }
  });
  resizeObserver.observe(canvasRef.value);

  animate();
};

// --- Dosya İşleme ---
const processFile = async (file: File) => {
  error.value = null;
  loading.value = true;
  
  // Eski modeli temizle
  if (currentModel && scene) {
    scene.remove(currentModel);
    cleanObject(currentModel);
    currentModel = null;
  }

  try {
    await nextTick();
    initThreeJS();

    const buffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop()?.toLowerCase();
    let object: THREE.Object3D | null = null;

    if (ext === 'glb' || ext === 'gltf') {
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(buffer, '');
      object = gltf.scene;
    } 
    else if (ext === 'fbx') {
      const loader = new FBXLoader();
      object = loader.parse(buffer, '');
    }
    // ARTIK ÇALIŞACAK OLAN KISIM:
    else if (ext === 'usdz') {
      const loader = new USDZLoader();
      // USDZLoader bir THREE.Group döndürür
      object = await loader.parse(buffer);
    }
    else {
      throw new Error('Desteklenmeyen format: ' + ext);
    }

    if (object) {
      currentModel = object;
      scene?.add(object);
      
      // USDZ bazen çok küçük veya çok büyük gelebilir, ölçekleme gerekebilir
      // Ancak fitCameraToSelection bunu görsel olarak çözecektir.
      fitCameraToSelection(camera!, controls!, [object]);
    }

  } catch (err: any) {
    console.error("Yükleme hatası:", err);
    error.value = "Dosya açılamadı. Hata: " + (err.message || 'Bilinmiyor');
  } finally {
    loading.value = false;
  }
};

// --- Yardımcılar ---
const fitCameraToSelection = (camera: THREE.PerspectiveCamera, controls: OrbitControls, selection: THREE.Object3D[]) => {
  const box = new THREE.Box3();
  for (const object of selection) box.expandByObject(object);
  
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.5 * Math.max(fitHeightDistance, fitWidthDistance);
  
  controls.maxDistance = distance * 10;
  controls.target.copy(center);
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  camera.position.copy(controls.target).sub(camera.position.clone().normalize().multiplyScalar(distance));
  controls.update();
};

const cleanObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    if ((child as any).geometry) (child as any).geometry.dispose();
    if ((child as any).material) {
      if (Array.isArray((child as any).material)) {
        (child as any).material.forEach((m: any) => m.dispose());
      } else {
        (child as any).material.dispose();
      }
    }
  });
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls?.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

onMounted(() => {
  if (props.file) processFile(props.file);
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  renderer?.dispose();
  if (currentModel) cleanObject(currentModel);
});

watch(() => props.file, (newFile) => {
  if (newFile) processFile(newFile);
});
</script>