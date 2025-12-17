<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">

            <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                <h3 class="font-bold text-xl text-gray-800">{{ mode === 'create' ? 'Yeni Sahne Oluştur' : 'Sahneyi Düzenle'
                    }}</h3>
                <button @click="close" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div class="flex flex-col md:flex-row flex-1 overflow-hidden">

                <div class="p-6 space-y-5 w-full md:w-1/3 overflow-y-auto border-r border-gray-200 bg-white">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sahne Adı</label>
                        <input v-model="form.name" type="text"
                            class="w-full border border-gray-300 p-2 rounded-lg outline-none focus:border-blue-500">
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
                            <input v-model.number="form.width" type="number" min="1"
                                class="w-full border border-gray-300 p-2 rounded-lg">
                        </div>
                        <div :class="{ 'opacity-50 pointer-events-none': form.shapeType === 'custom' }">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Derinlik (m)</label>
                            <input v-model.number="form.depth" type="number" min="1"
                                class="w-full border border-gray-300 p-2 rounded-lg">
                        </div>
                    </div>

                    <div v-if="['l-shape', 'u-shape'].includes(form.shapeType)">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kol Kalınlığı (m)</label>
                        <div class="flex items-center gap-2">
                            <input type="range" v-model.number="form.thickness" :min="1"
                                :max="Math.min(form.width, form.depth) / 2" step="0.5" class="w-full">
                            <span class="text-xs font-bold w-8">{{ form.thickness }}</span>
                        </div>
                    </div>

                    <div class="space-y-3 pt-2 border-t border-gray-100">
                        <h4 class="text-xs font-bold text-gray-500 uppercase">Zemin Kaplaması</h4>

                        <div class="grid grid-cols-4 gap-2">
                            <div @click="selectedTexture = null"
                                class="aspect-square rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:border-blue-400 transition-all"
                                :class="selectedTexture === null ? 'border-blue-600 ring-2 ring-blue-50' : 'border-gray-100'">
                                <span class="text-xl opacity-50">🚫</span>
                                <span class="text-[10px] text-gray-500 mt-1">Yok</span>
                            </div>

                            <div v-for="tex in textureList" :key="tex.id" @click="selectedTexture = tex.textureUrl"
                                class="aspect-square rounded-lg border-2 cursor-pointer relative overflow-hidden group hover:border-blue-400 transition-all"
                                :class="selectedTexture === tex.textureUrl ? 'border-blue-600 ring-2 ring-blue-50' : 'border-transparent'">
                                <img :src="tex.thumbnailUrl" class="w-full h-full object-cover" />
                                <div
                                    class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                                    {{ tex.name }}
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mt-2">
                            <div :class="{ 'opacity-50': selectedTexture }">
                                <label class="block text-xs font-medium text-gray-500 mb-1">Zemin Rengi</label>
                                <div class="flex items-center gap-2 border p-1 rounded-lg">
                                    <input v-model="form.floorColor" :disabled="!!selectedTexture" type="color"
                                        class="h-8 w-8 rounded cursor-pointer border-none bg-transparent">
                                    <span class="text-xs uppercase">{{ form.floorColor }}</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1">Arkaplan</label>
                                <div class="flex items-center gap-2 border p-1 rounded-lg">
                                    <input v-model="form.bgColor" type="color"
                                        class="h-8 w-8 rounded cursor-pointer border-none bg-transparent">
                                    <span class="text-xs uppercase">{{ form.bgColor }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="form.shapeType === 'custom'"
                        class="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-100">
                        <p class="font-bold mb-1">Nasıl Çizilir?</p>
                        <ul class="list-disc pl-4 space-y-1">
                            <li><strong>Sol Tık:</strong> Nokta ekle</li>
                            <li><strong>Sağ Tık:</strong> Son noktayı sil</li>
                            <li><strong>Orta Tuş/Space:</strong> Kaydır</li>
                            <li><strong>Tekerlek:</strong> Yakınlaş</li>
                        </ul>
                    </div>
                </div>

                <div class="w-full md:w-2/3 bg-gray-100 flex flex-col relative overflow-hidden">
                    <div class="absolute top-4 left-4 z-20 flex gap-2">
                        <div
                            class="bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-lg px-3 py-1 text-xs font-medium text-gray-600 flex items-center gap-2">
                            <span>Önizleme</span>
                            <button @click="resetView" class="hover:text-blue-600 p-1 rounded">⟲</button>
                        </div>
                    </div>

                    <div class="w-full h-full cursor-crosshair relative"
                        :class="{ 'cursor-grabbing': viewPort.isDragging }" ref="svgContainer"
                        @wheel.prevent="handleWheel" @mousedown="startPan" @mouseup="stopPan" @mouseleave="stopPan"
                        @mousemove="handleMouseMove" @click="handleSvgClick" @contextmenu.prevent="removeLastPoint">

                        <svg width="100%" height="100%" :viewBox="dynamicViewBox"
                            class="block w-full h-full pointer-events-none">
                            <defs>
                                <pattern id="meterGrid" width="1" height="1" patternUnits="userSpaceOnUse">
                                    <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e5e7eb" stroke-width="0.05" />
                                </pattern>
                                <pattern id="largeGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                                    <rect width="5" height="5" fill="url(#meterGrid)" />
                                    <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#d1d5db" stroke-width="0.1" />
                                </pattern>

                                <pattern v-if="selectedTexture" id="floorTexture" patternUnits="userSpaceOnUse"
                                    width="5" height="5">
                                    <image :href="selectedTexture" x="0" y="0" width="5" height="5"
                                        preserveAspectRatio="xMidYMid slice" />
                                </pattern>
                            </defs>

                            <rect x="-100" y="-100" width="300" height="300" fill="url(#largeGrid)" />

                            <line x1="-100" y1="0" x2="100" y2="0" stroke="#ef4444" stroke-width="0.1" opacity="0.5" />
                            <line x1="0" y1="-100" x2="0" y2="100" stroke="#3b82f6" stroke-width="0.1" opacity="0.5" />

                            <path :d="finalPath" :fill="selectedTexture ? 'url(#floorTexture)' : form.floorColor"
                                stroke="#3b82f6" stroke-width="0.2" opacity="0.9" />

                            <g v-if="form.shapeType === 'custom'">
                                <circle v-for="(p, i) in customPoints" :key="i" :cx="p.x" :cy="p.z" r="0.3"
                                    fill="#3b82f6" stroke="white" stroke-width="0.05" />
                                <path :d="customPathString" fill="none" stroke="#3b82f6" stroke-width="0.1"
                                    stroke-dasharray="0.3,0.3" />
                                <line v-if="lastPoint" :x1="lastPoint.x" :y1="lastPoint.z" :x2="mousePos.x"
                                    :y2="mousePos.z" stroke="#9ca3af" stroke-width="0.1" />
                                <circle :cx="mousePos.x" :cy="mousePos.z" r="0.3" fill="rgba(0,0,0,0.2)" />
                            </g>

                            <g v-if="form.shapeType !== 'custom'">
                                <text :x="form.width / 2" y="-1" font-size="1" text-anchor="middle" fill="#666">{{
                                    form.width }}m</text>
                                <text x="-1" :y="form.depth / 2" font-size="1" text-anchor="middle" fill="#666"
                                    transform="rotate(-90)">{{ form.depth }}m</text>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                <button @click="close" class="text-gray-600 px-4 py-2 text-sm">Vazgeç</button>
                <button @click="handleSave" :disabled="!form.name"
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                    {{ mode === 'create' ? 'Oluştur' : 'Kaydet' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { arSceneService } from '../../../services/arSceneService';

// --- PROPS & EMITS ---
const props = defineProps<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: any; // ARSceneDto
}>();

const emit = defineEmits(['close', 'save']);

// --- STATE ---
const form = reactive({
    name: '',
    width: 10,
    depth: 10,
    thickness: 3,
    shapeType: 'rectangle',
    bgColor: '#f5f5f5',
    floorColor: '#ffffff'
});

// Texture Yönetimi (YENİ)
const textureList = ref<any[]>([]); // Backend'den gelen liste
const selectedTexture = ref<string | null>(null); // Seçilen URL

const customPoints = ref<{ x: number, z: number }[]>([]);
const mousePos = reactive({ x: 0, z: 0 });
const svgContainer = ref<HTMLDivElement | null>(null);

const viewPort = reactive({
    x: -5, y: -5, zoom: 30, isDragging: false, lastMouseX: 0, lastMouseY: 0
});

const shapes = [
    { id: 'rectangle', label: 'Dikdörtgen', icon: '⬛' },
    { id: 'l-shape', label: 'L Şekli', icon: 'L' },
    { id: 'u-shape', label: 'U Şekli', icon: 'U' },
    { id: 'custom', label: 'Özel Çizim', icon: '✏️' }
];

// --- LIFECYCLE ---
onMounted(async () => {
    try {
        // Backend'den texture listesini çek
        // Servisinizde 'listTextures' metodunun tanımlı olduğundan emin olun (önceki adımda eklemiştik)
        if(arSceneService.listFloorTextures) {
             const res = await arSceneService.listFloorTextures();
             textureList.value = res;
        } else {
            console.warn("arSceneService.listFloorTextures metodu bulunamadı.");
        }
    } catch (e) {
        console.error("Texture listesi yüklenemedi:", e);
    }
});

// --- WATCHERS ---
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        resetView();
        if (props.mode === 'edit' && props.initialData) {
            const s = props.initialData;
            form.name = s.name;
            form.width = s.settings.width || 10;
            form.depth = s.settings.depth || 10;
            form.bgColor = s.settings.backgroundColor || '#f5f5f5';
            form.floorColor = s.settings.floorColor || '#ffffff';
            form.shapeType = s.settings.floorType === 'custom' ? 'custom' : 'rectangle';

            // Veritabanından gelen URL'i set et
            selectedTexture.value = s.settings.floorTextureUrl || null;

            if (form.shapeType === 'custom' && s.settings.floorPoints) {
                customPoints.value = [...s.settings.floorPoints];
            } else {
                customPoints.value = [];
            }
        } else {
            // Reset Form
            Object.assign(form, { name: '', width: 10, depth: 10, thickness: 3, shapeType: 'rectangle', bgColor: '#f5f5f5', floorColor: '#ffffff' });
            customPoints.value = [];
            selectedTexture.value = null;
        }
    }
});

// --- DRAWING & SVG LOGIC ---
const SNAP_STEP = 1;
const dynamicViewBox = computed(() => `${viewPort.x} ${viewPort.y} ${viewPort.zoom} ${viewPort.zoom}`);
const lastPoint = computed(() => customPoints.value.length > 0 ? customPoints.value[customPoints.value.length - 1] : null);

const calculatePresetPoints = (type: string, w: number, d: number, t: number) => {
    if (type === 'rectangle') return [{ x: 0, z: 0 }, { x: w, z: 0 }, { x: w, z: d }, { x: 0, z: d }];
    if (type === 'l-shape') {
        const safeThick = Math.min(t, Math.min(w, d) - 1);
        return [{ x: 0, z: 0 }, { x: safeThick, z: 0 }, { x: safeThick, z: d - safeThick }, { x: w, z: d - safeThick }, { x: w, z: d }, { x: 0, z: d }];
    }
    if (type === 'u-shape') {
        const safeThick = Math.min(t, w / 2 - 1);
        return [{ x: 0, z: 0 }, { x: safeThick, z: 0 }, { x: safeThick, z: d - safeThick }, { x: w - safeThick, z: d - safeThick }, { x: w - safeThick, z: 0 }, { x: w, z: 0 }, { x: w, z: d }, { x: 0, z: d }];
    }
    return [];
};

const customPathString = computed(() => {
    if (customPoints.value.length === 0) return '';
    return 'M ' + customPoints.value.map(p => `${p.x} ${p.z}`).join(' L ');
});

const finalPath = computed(() => {
    let pts: any[] = [];
    if (form.shapeType === 'custom') {
        if (customPoints.value.length < 3) return '';
        pts = customPoints.value;
    } else {
        pts = calculatePresetPoints(form.shapeType, form.width, form.depth, form.thickness);
    }
    if (pts.length === 0) return '';
    return 'M ' + pts.map(p => `${p.x} ${p.z}`).join(' L ') + ' Z';
});

// Viewport Actions
const resetView = () => { viewPort.x = -5; viewPort.y = -5; viewPort.zoom = 30; };
const handleWheel = (e: WheelEvent) => {
    const newZoom = viewPort.zoom + (e.deltaY > 0 ? 1 : -1) * viewPort.zoom * 0.05;
    if (newZoom > 2 && newZoom < 150) viewPort.zoom = newZoom;
};
const startPan = (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e as any).code === 'Space')) {
        e.preventDefault(); viewPort.isDragging = true;
        viewPort.lastMouseX = e.clientX; viewPort.lastMouseY = e.clientY;
    }
};
const stopPan = () => { viewPort.isDragging = false; };
const handleMouseMove = (e: MouseEvent) => {
    if (viewPort.isDragging && svgContainer.value) {
        const rect = svgContainer.value.getBoundingClientRect();
        const mpp = viewPort.zoom / rect.width;
        viewPort.x -= (e.clientX - viewPort.lastMouseX) * mpp;
        viewPort.y -= (e.clientY - viewPort.lastMouseY) * mpp;
        viewPort.lastMouseX = e.clientX; viewPort.lastMouseY = e.clientY;
        return;
    }
    if (!svgContainer.value || form.shapeType !== 'custom') return;
    const rect = svgContainer.value.getBoundingClientRect();
    const rawX = viewPort.x + ((e.clientX - rect.left) / rect.width) * viewPort.zoom;
    const rawY = viewPort.y + ((e.clientY - rect.top) / rect.height) * viewPort.zoom;
    mousePos.x = Math.max(0, Math.round(rawX / SNAP_STEP) * SNAP_STEP);
    mousePos.z = Math.max(0, Math.round(rawY / SNAP_STEP) * SNAP_STEP);
};
const handleSvgClick = () => {
    if (!viewPort.isDragging && form.shapeType === 'custom') {
        const last = lastPoint.value;
        if (last && last.x === mousePos.x && last.z === mousePos.z) return;
        customPoints.value.push({ x: mousePos.x, z: mousePos.z });
    }
};
const removeLastPoint = () => { if (customPoints.value.length > 0) customPoints.value.pop(); };

const setShape = (id: string) => {
    form.shapeType = id;
    if (id === 'custom') customPoints.value = [];
};

const close = () => emit('close');

const handleSave = () => {
    let finalPoints: any[] = [];
    if (form.shapeType === 'custom') {
        if (customPoints.value.length < 3) return alert("En az 3 nokta gereklidir.");
        finalPoints = customPoints.value;
    } else {
        finalPoints = calculatePresetPoints(form.shapeType, form.width, form.depth, form.thickness);
    }

    const xs = finalPoints.map(p => p.x);
    const zs = finalPoints.map(p => p.z);
    const realWidth = (Math.max(...xs) - Math.min(...xs)) || form.width;
    const realDepth = (Math.max(...zs) - Math.min(...zs)) || form.depth;

    const payload = {
        name: form.name,
        settings: {
            floorType: form.shapeType === 'rectangle' ? 'rectangle' : 'custom',
            width: realWidth,
            depth: realDepth,
            backgroundColor: form.bgColor,
            floorColor: form.floorColor,
            floorPoints: finalPoints,
            gridVisible: true,
            // Sadece seçili URL'i gönderiyoruz (String)
            floorTextureUrl: selectedTexture.value
        }
    };

    emit('save', payload);
};
</script>