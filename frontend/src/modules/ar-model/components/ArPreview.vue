<template>
  <div class="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
    
    <canvas ref="canvasRef" class="w-full h-full block outline-none cursor-move"></canvas>
    
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-semibold text-gray-700">Model Yükleniyor...</span>
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
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';

defineOptions({ name: 'ArPreview' });

const props = defineProps<{
  src?: string | null;  // URL desteği (Backend temp path)
  file?: File | null;   // Local dosya desteği
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

// --- Screenshot Metodu (Dışarıya Açık) ---
const takeScreenshot = (mimeType = 'image/png', quality = 0.8): string | null => {
  if (!renderer || !scene || !camera) return null;
  renderer.render(scene, camera); // Son kareyi render al
  return renderer.domElement.toDataURL(mimeType, quality);
};

// Metodu dışarı açıyoruz
defineExpose({ takeScreenshot });

const initThreeJS = () => {
  if (!canvasRef.value || renderer) return;

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value, 
    alpha: true, 
    antialias: true,
    preserveDrawingBuffer: true // Screenshot için zorunlu
  });
  
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  scene = new THREE.Scene();
  
  // Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-5, 2, -5);
  scene.add(fillLight);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 5);

  controls = new OrbitControls(camera, canvasRef.value);
  controls.enableDamping = true;
  
  // Resize Observer
  const resizeObserver = new ResizeObserver(entries => {
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

const loadModel = async () => {
  if ((!props.src && !props.file) || !scene) return;
  
  loading.value = true;
  error.value = null;

  // Eski modeli temizle
  if (currentModel) {
    scene.remove(currentModel);
    // Cleanup geometry/materials here ideally
    currentModel = null;
  }

  try {
    let url = '';
    let ext = '';

    // Kaynak belirleme (URL öncelikli, yoksa File)
    if (props.src) {
      url = props.src;
      ext = url.split('.').pop()?.toLowerCase() || 'glb';
    } else if (props.file) {
      url = URL.createObjectURL(props.file);
      ext = props.file.name.split('.').pop()?.toLowerCase() || 'glb';
    }

    let object: THREE.Object3D | null = null;

    if (ext.includes('glb') || ext.includes('gltf')) {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      object = gltf.scene;
    } 
    else if (ext === 'fbx') {
      const loader = new FBXLoader();
      object = await loader.loadAsync(url);
    }
    else if (ext === 'usdz') {
      const loader = new USDZLoader();
      object = await loader.loadAsync(url);
    }
    else {
      throw new Error(`Desteklenmeyen format: ${ext}`);
    }

    if (object) {
      currentModel = object;
      scene.add(object);
      fitCameraToSelection(camera!, controls!, [object]);
    }

  } catch (err: any) {
    console.error("Yükleme hatası:", err);
    error.value = "Model yüklenemedi. Formatı veya yolu kontrol edin.";
  } finally {
    loading.value = false;
  }
};

const fitCameraToSelection = (camera: THREE.PerspectiveCamera, controls: OrbitControls, selection: THREE.Object3D[]) => {
  const box = new THREE.Box3();
  for (const object of selection) box.expandByObject(object);
  
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);
  
  controls.maxDistance = distance * 10;
  controls.target.copy(center);
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  camera.position.copy(controls.target).sub(camera.position.clone().normalize().multiplyScalar(distance));
  controls.update();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls?.update();
  renderer?.render(scene!, camera!);
};

onMounted(async () => {
  await nextTick();
  initThreeJS();
  loadModel();
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  renderer?.dispose();
});

// Hem src hem file değiştiğinde tetikle
watch(() => [props.src, props.file], () => {
  loadModel();
});
</script>