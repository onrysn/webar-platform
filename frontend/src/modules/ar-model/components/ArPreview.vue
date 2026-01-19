<template>
  <div class="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group touch-none">
    
    <canvas ref="canvasRef" class="w-full h-full block outline-none cursor-move"></canvas>
    
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-semibold text-gray-700">Model Hazırlanıyor...</span>
      </div>
    </div>

    <div v-if="error" class="absolute inset-0 flex flex-col items-center justify-center bg-red-50 z-20 p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="text-red-600 font-medium text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';

defineOptions({ name: 'ArPreview' });

const props = defineProps<{
  src?: string | null;  // URL (Backend path veya Blob URL)
  file?: File | null;   // Local dosya objesi
  format?: string;      // 'glb', 'fbx', 'usdz' (Manuel zorlama)
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Three.js Değişkenleri
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let currentModel: THREE.Object3D | null = null;
let animationId: number | null = null;
let localBlobUrl: string | null = null; // Bellek temizliği için referans

// Screenshot Al (Parent component kullanabilir)
const takeScreenshot = (mimeType = 'image/png', quality = 0.8): string | null => {
  if (!renderer || !scene || !camera) return null;
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL(mimeType, quality);
};

// Dışarıya metodu açıyoruz
defineExpose({ takeScreenshot });

const initThreeJS = () => {
  if (!canvasRef.value || renderer) return;

  // Renderer Ayarları
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value, 
    alpha: true, 
    antialias: true,
    preserveDrawingBuffer: true // Screenshot için gerekli
  });
  
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Sahne
  scene = new THREE.Scene();
  
  // Işıklandırma (Standart AR sahnesi simülasyonu)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  // Kamera
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 3);

  // Kontroller
  controls = new OrbitControls(camera, canvasRef.value);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Canvas Resize Yönetimi
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

  // 1. Temizlik
  if (currentModel) {
    scene.remove(currentModel);
    disposeObject(currentModel);
    currentModel = null;
  }
  if (localBlobUrl) {
    URL.revokeObjectURL(localBlobUrl);
    localBlobUrl = null;
  }

  try {
    let url = '';
    // Değişkeni string olarak başlatıyoruz
    let ext: string = ''; 

    // 2. URL ve Uzantı Mantığı
    if (props.file) {
      localBlobUrl = URL.createObjectURL(props.file);
      url = localBlobUrl;
      // Fallback ekliyoruz
      ext = (props.file.name.split('.').pop() || '').toLowerCase();
    } 
    else if (props.src) {
      url = props.src;
      
      if (props.format) {
        ext = props.format.toLowerCase();
      } else {
        // Fallback ekliyoruz
        ext = (url.split('.').pop() || '').toLowerCase();
        
        if (url.startsWith('blob:')) ext = 'glb';
      }
    }

    if (ext.includes('?')) {
        ext = ext.split('?')[0] || '';
    }

    // 3. Yükleyiciler
    let object: THREE.Object3D | null = null;

    if (ext === 'glb' || ext === 'gltf') {
      const loader = new GLTFLoader();
      
      // Draco decoder yapılandırması
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      dracoLoader.setDecoderConfig({ type: 'js' });
      loader.setDRACOLoader(dracoLoader);
      
      const gltf = await loader.loadAsync(url);
      object = gltf.scene;
      
      // Temizlik
      dracoLoader.dispose();
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
      throw new Error(`Format belirlenemedi veya desteklenmiyor: .${ext}`);
    }

    // 4. Sahneye Ekleme
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center); 

      currentModel = object;
      scene.add(object);
      fitCameraToSelection(camera!, controls!, [object]);
    }

  } catch (err: any) {
    console.error("Yükleme hatası:", err);
    error.value = "Model görüntülenemiyor.";
  } finally {
    loading.value = false;
  }
};

// Kamera Odaklama Yardımcısı
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
  
  const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance);

  controls.maxDistance = distance * 10;
  controls.target.copy(center);
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy(controls.target).sub(direction);
  
  // FBX gibi bazı formatlarda pozisyon 0 gelebilir, manuel düzeltme
  if (camera.position.lengthSq() === 0) {
      camera.position.set(0, 0, distance);
  }

  controls.update();
};

// Bellek Temizliği (Dispose)
const disposeObject = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
        } else if (mesh.material) {
            mesh.material.dispose();
        }
      }
    });
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
  if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
  if (currentModel) disposeObject(currentModel);
  renderer?.dispose();
});

// Props değiştiğinde yeniden yükle
watch(() => [props.src, props.file], () => {
  loadModel();
});
</script>