<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">AR Sahnelerim</h1>
          <p class="text-gray-500 text-sm mt-1">Projelerinizi ve 3D alanlarınızı yönetin</p>
        </div>
        <button @click="openModal('create')" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Yeni Sahne
        </button>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="scene in scenes" :key="scene.id" 
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group relative">
          
          <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button @click.stop="openModal('edit', scene)" class="p-2 bg-white rounded-full shadow hover:text-blue-600 text-gray-500" title="Düzenle">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button @click.stop="deleteScene(scene.id)" class="p-2 bg-white rounded-full shadow hover:text-red-600 text-gray-500" title="Sil">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>

          <div @click="goToEditor(scene.id)" class="cursor-pointer">
            <div class="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden border border-gray-100">
               <div v-if="scene.settings?.backgroundColor" class="absolute inset-0 opacity-50" 
                    :style="{ backgroundColor: scene.settings.backgroundColor }"></div>
               <div v-if="scene.settings?.floorColor" class="absolute w-16 h-16 rounded shadow-sm transform rotate-45 border border-black/10"
                    :style="{ backgroundColor: scene.settings.floorColor }"></div>
               <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
               </svg>
            </div>
            
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors truncate w-40" :title="scene.name">
                    {{ scene.name }}
                </h3>
                <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {{ new Date(scene.createdAt).toLocaleDateString('tr-TR') }}
                </p>
              </div>
              <span class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium border border-blue-100">
                {{ scene.items?.length || 0 }} Obje
              </span>
            </div>
            
            <div class="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-xs text-gray-500 items-center">
               <span v-if="scene.settings?.floorType === 'custom'" class="flex items-center gap-1">📐 Özel Şekil</span>
               <span v-else class="flex items-center gap-1">📏 {{ scene.settings?.width || 20 }}m x {{ scene.settings?.depth || 20 }}m</span>
            </div>
          </div>
        </div>
        
        <div v-if="scenes.length === 0" class="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
          <p class="text-gray-500">Henüz hiç sahne oluşturmadınız.</p>
          <button @click="openModal('create')" class="text-blue-600 text-sm font-semibold mt-2 hover:underline">İlk Sahneni Oluştur</button>
        </div>
      </div>

      <div v-if="modal.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
          
          <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <h3 class="font-bold text-xl text-gray-800">{{ modal.mode === 'create' ? 'Yeni Sahne Oluştur' : 'Sahneyi Düzenle' }}</h3>
            <button @click="modal.isOpen = false" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          
          <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            <div class="p-6 space-y-5 w-full md:w-1/3 overflow-y-auto border-r border-gray-200 bg-white">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sahne Adı</label>
                <input v-model="form.name" type="text" class="w-full border border-gray-300 p-2 rounded-lg outline-none focus:border-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Oda Şekli</label>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="shape in shapes" :key="shape.id" @click="setShape(shape.id)"
                    class="border rounded p-2 text-center text-xs hover:border-blue-500 transition-colors flex flex-col items-center gap-1"
                    :class="form.shapeType === shape.id ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-600'">
                    <span class="text-lg">{{ shape.icon }}</span> {{ shape.label }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div :class="{ 'opacity-50 pointer-events-none': form.shapeType === 'custom' }">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Genişlik (m)</label>
                  <input v-model.number="form.width" type="number" min="1" class="w-full border border-gray-300 p-2 rounded-lg">
                </div>
                <div :class="{ 'opacity-50 pointer-events-none': form.shapeType === 'custom' }">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Derinlik (m)</label>
                  <input v-model.number="form.depth" type="number" min="1" class="w-full border border-gray-300 p-2 rounded-lg">
                </div>
              </div>

              <div v-if="['l-shape', 'u-shape'].includes(form.shapeType)">
                 <label class="block text-sm font-medium text-gray-700 mb-1">Kol Kalınlığı (m)</label>
                 <div class="flex items-center gap-2">
                    <input type="range" v-model.number="form.thickness" :min="1" :max="Math.min(form.width, form.depth)/2" step="0.5" class="w-full">
                    <span class="text-xs font-bold w-8">{{ form.thickness }}</span>
                 </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Zemin Rengi</label>
                  <div class="flex items-center gap-2 border p-1 rounded-lg">
                    <input v-model="form.floorColor" type="color" class="h-8 w-8 rounded cursor-pointer border-none bg-transparent">
                    <span class="text-xs uppercase">{{ form.floorColor }}</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Arkaplan</label>
                  <div class="flex items-center gap-2 border p-1 rounded-lg">
                    <input v-model="form.bgColor" type="color" class="h-8 w-8 rounded cursor-pointer border-none bg-transparent">
                    <span class="text-xs uppercase">{{ form.bgColor }}</span>
                  </div>
                </div>
              </div>

              <div v-if="form.shapeType === 'custom'" class="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-100">
                  <p class="font-bold mb-1">Nasıl Çizilir?</p>
                  <ul class="list-disc pl-4 space-y-1">
                      <li>Grid üzerine <strong>Sol Tık</strong> ile nokta ekleyin.</li>
                      <li><strong>Sağ Tık</strong> ile son noktayı silin.</li>
                      <li><strong>Orta Tuş</strong> veya <strong>Space</strong> ile kaydırın.</li>
                      <li><strong>Tekerlek</strong> ile yakınlaşın.</li>
                  </ul>
              </div>
            </div>

            <div class="w-full md:w-2/3 bg-gray-100 flex flex-col relative overflow-hidden">
                
                <div class="absolute top-4 left-4 z-20 flex gap-2">
                    <div class="bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-lg px-3 py-1 text-xs font-medium text-gray-600 flex items-center gap-2">
                        <span>Önizleme</span>
                        <button @click="resetView" class="hover:text-blue-600 p-1 rounded" title="Görünümü Sıfırla">⟲</button>
                    </div>
                </div>

                <div class="absolute top-4 right-4 z-20 text-[10px] text-gray-500 bg-white/80 px-2 py-1 rounded border">
                    X: {{ mousePos.x }}m, Z: {{ mousePos.z }}m
                </div>

                <div class="w-full h-full cursor-crosshair relative"
                     :class="{ 'cursor-grabbing': viewPort.isDragging }"
                     ref="svgContainer"
                     @wheel.prevent="handleWheel"
                     @mousedown="startPan"
                     @mouseup="stopPan"
                     @mouseleave="stopPan"
                     @mousemove="handleMouseMove"
                     @click="handleSvgClick"
                     @contextmenu.prevent="removeLastPoint">
                    
                    <svg width="100%" height="100%" :viewBox="dynamicViewBox" class="block w-full h-full pointer-events-none">
                        
                        <defs>
                            <pattern id="meterGrid" width="1" height="1" patternUnits="userSpaceOnUse">
                                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e5e7eb" stroke-width="0.05"/>
                            </pattern>
                            <pattern id="largeGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                                <rect width="5" height="5" fill="url(#meterGrid)" />
                                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#d1d5db" stroke-width="0.1"/>
                            </pattern>
                        </defs>

                        <rect x="-100" y="-100" width="300" height="300" fill="url(#largeGrid)" />

                        <line x1="-100" y1="0" x2="100" y2="0" stroke="#ef4444" stroke-width="0.1" opacity="0.5" />
                        <line x1="0" y1="-100" x2="0" y2="100" stroke="#3b82f6" stroke-width="0.1" opacity="0.5" />

                        <path :d="finalPath" :fill="form.floorColor" stroke="#3b82f6" stroke-width="0.2" opacity="0.8" />

                        <g v-if="form.shapeType === 'custom'">
                            <circle v-for="(p, i) in customPoints" :key="i" :cx="p.x" :cy="p.z" r="0.3" fill="#3b82f6" stroke="white" stroke-width="0.05" />
                            
                            <path :d="customPathString" fill="none" stroke="#3b82f6" stroke-width="0.1" stroke-dasharray="0.3,0.3" />
                            
                            <line v-if="lastPoint" 
                                  :x1="lastPoint.x" :y1="lastPoint.z"
                                  :x2="mousePos.x" :y2="mousePos.z"
                                  stroke="#9ca3af" stroke-width="0.1" />
                            
                            <circle :cx="mousePos.x" :cy="mousePos.z" r="0.3" fill="rgba(0,0,0,0.2)" />
                        </g>

                        <g v-if="form.shapeType !== 'custom'">
                            <text :x="form.width/2" y="-1" font-size="1" text-anchor="middle" fill="#666">{{ form.width }}m</text>
                            <text x="-1" :y="form.depth/2" font-size="1" text-anchor="middle" fill="#666" transform="rotate(-90)">{{ form.depth }}m</text>
                        </g>

                    </svg>
                </div>
            </div>

          </div>
          
          <div class="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <button @click="modal.isOpen = false" class="text-gray-600 px-4 py-2 text-sm">Vazgeç</button>
            <button @click="saveScene" :disabled="!form.name" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {{ modal.mode === 'create' ? 'Oluştur' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { arSceneService } from '../../../services/arSceneService';
import type { ARSceneDto } from '../dto/arScene.dto';

// --- TİPLER ---
interface Point {
  x: number;
  z: number;
}

const router = useRouter();
const scenes = ref<ARSceneDto[]>([]);
const loading = ref(true);
const COMPANY_ID = 1; 
const SNAP_STEP = 1; // Grid yapışma aralığı (metre)

// --- MODAL & FORM ---
const modal = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  editingId: null as number | null
});

const form = reactive({
  name: '',
  width: 10,
  depth: 10,
  thickness: 3,
  shapeType: 'rectangle', 
  bgColor: '#f5f5f5',
  floorColor: '#ffffff'
});

const customPoints = ref<Point[]>([]);
const mousePos = reactive<Point>({ x: 0, z: 0 });
const svgContainer = ref<HTMLDivElement | null>(null);

const shapes = [
  { id: 'rectangle', label: 'Dikdörtgen', icon: '⬛' },
  { id: 'l-shape', label: 'L Şekli', icon: 'L' },
  { id: 'u-shape', label: 'U Şekli', icon: 'U' },
  { id: 'custom', label: 'Özel Çizim', icon: '✏️' }
];

// --- ZOOM & PAN (VIEWPORT) ---
const viewPort = reactive({
  x: -5,
  y: -5,
  zoom: 30, // Görünen alan genişliği (metre)
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
});

const dynamicViewBox = computed(() => `${viewPort.x} ${viewPort.y} ${viewPort.zoom} ${viewPort.zoom}`);

const resetView = () => {
  viewPort.x = -5; viewPort.y = -5; viewPort.zoom = 30;
};

// --- HESAPLAMALAR ---
const lastPoint = computed(() => customPoints.value.length > 0 ? customPoints.value[customPoints.value.length - 1] : null);

const calculatePresetPoints = (type: string, w: number, d: number, t: number): Point[] => {
    if (type === 'rectangle') return [{x:0,z:0}, {x:w,z:0}, {x:w,z:d}, {x:0,z:d}];
    
    if (type === 'l-shape') {
        const safeThick = Math.min(t, Math.min(w, d) - 1); 
        return [{ x: 0, z: 0 }, { x: safeThick, z: 0 }, { x: safeThick, z: d - safeThick }, { x: w, z: d - safeThick }, { x: w, z: d }, { x: 0, z: d }];
    }
    if (type === 'u-shape') {
        const safeThick = Math.min(t, w/2 - 1);
        return [{ x: 0, z: 0 }, { x: safeThick, z: 0 }, { x: safeThick, z: d - safeThick }, { x: w - safeThick, z: d - safeThick }, { x: w - safeThick, z: 0 }, { x: w, z: 0 }, { x: w, z: d }, { x: 0, z: d }];
    }
    return [];
};

// --- SVG PATH ---
const customPathString = computed(() => {
    if (customPoints.value.length === 0) return '';
    const p0 = customPoints.value[0];
    if (!p0) return '';
    let d = `M ${p0.x} ${p0.z}`;
    for (let i = 1; i < customPoints.value.length; i++) {
        const p = customPoints.value[i];
        if (p) d += ` L ${p.x} ${p.z}`;
    }
    return d;
});

const finalPath = computed(() => {
    let pts: Point[] = [];
    if (form.shapeType === 'custom') {
        if (customPoints.value.length < 3) return '';
        pts = customPoints.value;
    } else {
        pts = calculatePresetPoints(form.shapeType, form.width, form.depth, form.thickness);
    }
    
    if (pts.length === 0) return '';
    const p0 = pts[0];
    if(!p0) return '';

    let d = `M ${p0.x} ${p0.z}`;
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if(p) d += ` L ${p.x} ${p.z}`;
    }
    d += ' Z';
    return d;
});

// --- EVENTS ---
const handleWheel = (e: WheelEvent) => {
  const zoomSpeed = 0.05;
  const newZoom = viewPort.zoom + (e.deltaY > 0 ? 1 : -1) * viewPort.zoom * zoomSpeed;
  if (newZoom > 2 && newZoom < 150) viewPort.zoom = newZoom;
};

const startPan = (e: MouseEvent) => {
  // Orta Tuş veya Space+Sol
  if (e.button === 1 || (e.button === 0 && (e as any).code === 'Space')) { 
    e.preventDefault();
    viewPort.isDragging = true;
    viewPort.lastMouseX = e.clientX;
    viewPort.lastMouseY = e.clientY;
  } else if (e.button === 0 && form.shapeType === 'custom') {
      // Sol tık çizim içindir, pan başlatma
  }
};

const stopPan = () => { viewPort.isDragging = false; };

const handleMouseMove = (e: MouseEvent) => {
  if (viewPort.isDragging && svgContainer.value) {
    const rect = svgContainer.value.getBoundingClientRect();
    const meterPerPixel = viewPort.zoom / rect.width;
    viewPort.x -= (e.clientX - viewPort.lastMouseX) * meterPerPixel;
    viewPort.y -= (e.clientY - viewPort.lastMouseY) * meterPerPixel;
    viewPort.lastMouseX = e.clientX;
    viewPort.lastMouseY = e.clientY;
    return;
  }

  // Draw Logic
  if (!svgContainer.value || form.shapeType !== 'custom') return;
  const rect = svgContainer.value.getBoundingClientRect();
  const pxX = e.clientX - rect.left;
  const pxY = e.clientY - rect.top;

  const rawX = viewPort.x + (pxX / rect.width) * viewPort.zoom;
  const rawY = viewPort.y + (pxY / rect.height) * viewPort.zoom;

  mousePos.x = Math.round(rawX / SNAP_STEP) * SNAP_STEP;
  mousePos.z = Math.round(rawY / SNAP_STEP) * SNAP_STEP;
  
  if(mousePos.x < 0) mousePos.x = 0; // Negatif engelleme opsiyonel
  if(mousePos.z < 0) mousePos.z = 0;
};

const handleSvgClick = () => {
  if (viewPort.isDragging || form.shapeType !== 'custom') return;
  
  // Çift tıklamayı engelle (Basit kontrol)
  const last = customPoints.value.length > 0 ? customPoints.value[customPoints.value.length - 1] : null;
  if (last && last.x === mousePos.x && last.z === mousePos.z) return;

  customPoints.value.push({ x: mousePos.x, z: mousePos.z });
};

const removeLastPoint = () => {
  if (form.shapeType === 'custom' && customPoints.value.length > 0) {
    customPoints.value.pop();
  }
};

const setShape = (id: string) => {
  form.shapeType = id;
  if (id === 'custom') customPoints.value = [];
};

// --- API ---
const fetchScenes = async () => {
  try { scenes.value = await arSceneService.listScenes(COMPANY_ID); } 
  catch (e) { console.error(e); } 
  finally { loading.value = false; }
};

const openModal = (mode: 'create' | 'edit', scene?: ARSceneDto) => {
  modal.mode = mode;
  resetView();
  
  if (mode === 'edit' && scene && scene.settings) {
    modal.editingId = scene.id;
    form.name = scene.name;
    form.width = scene.settings.width || 10;
    form.depth = scene.settings.depth || 10;
    form.bgColor = scene.settings.backgroundColor || '#f5f5f5';
    form.floorColor = (scene.settings as any).floorColor || '#ffffff';
    form.shapeType = scene.settings.floorType === 'custom' ? 'custom' : 'rectangle';
    
    if (form.shapeType === 'custom' && scene.settings.floorPoints) {
        customPoints.value = [...scene.settings.floorPoints];
    } else {
        customPoints.value = [];
    }
  } else {
    // Reset Form
    form.name = ''; form.width = 10; form.depth = 10; form.thickness = 3;
    form.shapeType = 'rectangle'; form.bgColor = '#f5f5f5'; form.floorColor = '#ffffff';
    customPoints.value = [];
  }
  modal.isOpen = true;
};

const saveScene = async () => {
  loading.value = true;
  try {
    let finalPoints: Point[] = [];
    
    if (form.shapeType === 'custom') {
        if (customPoints.value.length < 3) {
            alert("En az 3 nokta gereklidir.");
            loading.value = false;
            return;
        }
        finalPoints = customPoints.value;
    } else {
        finalPoints = calculatePresetPoints(form.shapeType, form.width, form.depth, form.thickness);
    }

    // Bounding Box (Genişlik/Derinlik Hesabı)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    finalPoints.forEach(p => {
        if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x;
        if(p.z < minZ) minZ = p.z; if(p.z > maxZ) maxZ = p.z;
    });
    const realWidth = (maxX - minX) || form.width;
    const realDepth = (maxZ - minZ) || form.depth;

    const payloadSettings = {
      floorType: form.shapeType === 'rectangle' ? 'rectangle' : 'custom',
      width: realWidth,
      depth: realDepth,
      backgroundColor: form.bgColor,
      floorColor: form.floorColor,
      floorPoints: finalPoints,
      gridVisible: true
    };

    const data = { name: form.name, settings: payloadSettings as any };

    if (modal.mode === 'create') {
      await arSceneService.createScene({ ...data, companyId: COMPANY_ID });
    } else if (modal.mode === 'edit' && modal.editingId) {
      await arSceneService.updateScene(modal.editingId, data);
    }

    modal.isOpen = false;
    await fetchScenes();
  } catch (err) {
    console.error(err);
    alert("Hata oluştu.");
  } finally {
    loading.value = false;
  }
};

const deleteScene = async (id: number) => {
    if(!confirm('Silmek istediğinize emin misiniz?')) return;
    // await arSceneService.deleteScene(id); // Backend implementasyonu
    console.log("Deleted", id);
};
const goToEditor = (id: number) => router.push(`/editor/scene/${id}`);

onMounted(fetchScenes);
</script>