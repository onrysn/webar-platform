<template>
  <div class="pbr-preview" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Texture yükleniyor...</p>
    </div>
    
    <!-- Controls -->
    <div class="controls">
      <button @click="resetCamera" class="control-btn" title="Kamerayı Sıfırla">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
      </button>
      <button @click="toggleRotation" class="control-btn" :title="autoRotate ? 'Otomatik Dönüşü Durdur' : 'Otomatik Dönüş'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path v-if="autoRotate" d="M12 6v6l4 2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface PbrTextureProps {
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metallicUrl?: string;
  aoUrl?: string;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  defaultScale?: number;
}

const props = withDefaults(defineProps<PbrTextureProps>(), {
  roughnessValue: 0.9,
  metalnessValue: 0.0,
  aoIntensity: 1.2,
  normalScale: 2.0,
  defaultScale: 2.0,
});

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(false);
const autoRotate = ref(true);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let mesh: THREE.Mesh;
let animationId: number;
const textureLoader = new THREE.TextureLoader();

const initScene = () => {
  if (!containerRef.value || !canvasRef.value) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  // Camera
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(3, 2, 3);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(5, 10, 5);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = autoRotate.value;
  controls.autoRotateSpeed = 2;

  // Plane Mesh
  const geometry = new THREE.SphereGeometry(1.5, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: props.roughnessValue,
    metalness: props.metalnessValue,
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Handle resize
  const handleResize = () => {
    if (!containerRef.value) return;
    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', handleResize);

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Load initial textures
  loadTextures();
};

const loadTextures = async () => {
  if (!mesh) return;
  
  isLoading.value = true;
  const material = mesh.material as THREE.MeshStandardMaterial;
  
  try {
    const loadPromises: Promise<void>[] = [];

    // Base Color
    if (props.baseColorUrl) {
      loadPromises.push(
        new Promise((resolve) => {
          textureLoader.load(props.baseColorUrl!, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(props.defaultScale, props.defaultScale);
            texture.colorSpace = THREE.SRGBColorSpace;
            material.map = texture;
            material.needsUpdate = true;
            resolve();
          });
        })
      );
    }

    // Normal Map
    if (props.normalUrl) {
      loadPromises.push(
        new Promise((resolve) => {
          textureLoader.load(props.normalUrl!, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(props.defaultScale, props.defaultScale);
            material.normalMap = texture;
            material.normalScale = new THREE.Vector2(props.normalScale, props.normalScale);
            material.needsUpdate = true;
            resolve();
          });
        })
      );
    }

    // Roughness Map
    if (props.roughnessUrl) {
      loadPromises.push(
        new Promise((resolve) => {
          textureLoader.load(props.roughnessUrl!, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(props.defaultScale, props.defaultScale);
            material.roughnessMap = texture;
            material.roughness = props.roughnessValue;
            material.needsUpdate = true;
            resolve();
          });
        })
      );
    } else {
      material.roughness = props.roughnessValue;
    }

    // Metallic Map
    if (props.metallicUrl) {
      loadPromises.push(
        new Promise((resolve) => {
          textureLoader.load(props.metallicUrl!, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(props.defaultScale, props.defaultScale);
            material.metalnessMap = texture;
            material.metalness = props.metalnessValue;
            material.needsUpdate = true;
            resolve();
          });
        })
      );
    } else {
      material.metalness = props.metalnessValue;
    }

    // AO Map
    if (props.aoUrl) {
      loadPromises.push(
        new Promise((resolve) => {
          textureLoader.load(props.aoUrl!, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(props.defaultScale, props.defaultScale);
            material.aoMap = texture;
            material.aoMapIntensity = props.aoIntensity ?? 1.2;
            material.needsUpdate = true;
            resolve();
          });
        })
      );
    }

    await Promise.all(loadPromises);
  } catch (error) {
    console.error('Texture yükleme hatası:', error);
  } finally {
    isLoading.value = false;
  }
};

const resetCamera = () => {
  camera.position.set(3, 2, 3);
  controls.reset();
};

const toggleRotation = () => {
  autoRotate.value = !autoRotate.value;
  controls.autoRotate = autoRotate.value;
};

// Watch for prop changes
watch(
  () => [
    props.baseColorUrl,
    props.normalUrl,
    props.roughnessUrl,
    props.metallicUrl,
    props.aoUrl,
    props.roughnessValue,
    props.metalnessValue,
    props.aoIntensity,
    props.normalScale,
    props.defaultScale,
  ],
  () => {
    loadTextures();
  }
);

onMounted(() => {
  initScene();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});
</script>

<style scoped>
.pbr-preview {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: white;
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}
</style>
