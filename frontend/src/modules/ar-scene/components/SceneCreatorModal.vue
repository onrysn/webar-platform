<template>
    <div v-if="isOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all"
        @keydown.window.ctrl.z="removeLastPoint">

        <div
            class="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[92vh] border border-slate-200/50">

            <div
                class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div class="flex items-center gap-4">
                    <div
                        class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <span v-if="mode === 'create'" class="text-2xl">✨</span>
                        <span v-else class="text-2xl">🛠️</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-xl text-slate-800 tracking-tight leading-none">
                            {{ mode === 'create' ? 'Yeni Sahne Tasarla' : 'Sahneyi Düzenle' }}
                        </h3>
                        <p class="text-xs text-slate-500 mt-1.5 font-medium">AR deneyiminiz için sınırları belirleyin
                        </p>
                    </div>
                </div>
                <button @click="close"
                    class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all text-2xl">&times;</button>
            </div>

            <div class="flex flex-col md:flex-row flex-1 overflow-hidden">

                <div
                    class="p-6 space-y-8 w-full md:w-80 lg:w-[380px] overflow-y-auto border-r border-slate-100 bg-slate-50/40 custom-scrollbar">
                    <section class="space-y-4">
                        <div class="flex items-center justify-between">
                            <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Genel Bilgiler
                            </h4>
                            <div class="bg-indigo-100/50 border border-indigo-100 px-3 py-1 rounded-lg">
                                <span class="text-[10px] font-bold text-indigo-400 uppercase mr-1">Alan:</span>
                                <span class="text-xs font-black text-indigo-700">{{ calculatedArea }} m²</span>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div
                                class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 transition-all group">
                                <label
                                    class="block text-[10px] font-bold text-slate-400 uppercase mb-1 group-focus-within:text-indigo-500 transition-colors">Sahne
                                    Adı</label>
                                <input v-model="form.name" type="text" placeholder="Örn: Oturma Odası"
                                    class="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:font-normal">
                            </div>
                            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div class="flex justify-between mb-3">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase">Duvar
                                        Yüksekliği</label>
                                    <span
                                        class="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{{
                                            form.wallHeight }}m</span>
                                </div>
                                <input type="range" v-model.number="form.wallHeight" min="0" max="5" step="0.1"
                                    class="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                                <p class="text-[9px] text-slate-400 mt-2 text-center" v-if="form.wallHeight === 0">Duvar
                                    yok, sadece zemin planlanıyor.</p>
                            </div>
                        </div>
                    </section>

                    <section class="space-y-4">
                        <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Oda Geometrisi</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <button v-for="shape in shapes" :key="shape.id" @click="setShape(shape.id)"
                                class="relative border-2 rounded-2xl p-3 text-center transition-all flex flex-col items-center gap-2 group"
                                :class="form.shapeType === shape.id ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-100/50' : 'border-white bg-white hover:border-slate-200'">
                                <span class="text-2xl group-hover:scale-110 transition-transform duration-300">{{
                                    shape.icon }}</span>
                                <span class="text-[11px] font-black"
                                    :class="form.shapeType === shape.id ? 'text-indigo-700' : 'text-slate-600'">{{
                                        shape.label }}</span>
                                <div v-if="form.shapeType === shape.id"
                                    class="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse">
                                </div>
                            </button>
                        </div>
                        <div v-if="form.shapeType !== 'custom'"
                            class="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div v-if="form.shapeType === 'circle'"
                                class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Çap (m)</label>
                                <input v-model.number="form.width" type="number" min="1" step="0.1"
                                    class="w-full text-center text-lg font-black text-slate-700 outline-none">
                            </div>
                            <div v-else class="grid grid-cols-2 gap-3">
                                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Genişlik
                                        (m)</label>
                                    <input v-model.number="form.width" type="number" min="1" step="0.1"
                                        class="w-full text-center text-lg font-black text-slate-700 outline-none">
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Derinlik
                                        (m)</label>
                                    <input v-model.number="form.depth" type="number" min="1" step="0.1"
                                        class="w-full text-center text-lg font-black text-slate-700 outline-none">
                                </div>
                            </div>
                        </div>
                        <div v-else
                            class="bg-slate-800 p-4 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                            <div
                                class="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity">
                            </div>
                            <p class="text-[10px] font-black uppercase opacity-80 mb-1">Serbest Çizim Modu</p>
                            <p class="text-[11px] font-medium leading-relaxed text-slate-300">Sağ taraftaki alana
                                tıklayarak odanızın köşelerini belirleyin.</p>
                        </div>
                    </section>

                    <section class="space-y-4">
                        <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Malzeme ve Renk
                        </h4>
                        <div class="space-y-4">
                            <div class="grid grid-cols-4 gap-2">
                                <button @click="selectedTexture = null"
                                    class="aspect-square rounded-xl border-2 flex items-center justify-center bg-white shadow-sm transition-all"
                                    :class="selectedTexture === null ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'">
                                    <span class="opacity-30 text-xl grayscale">🎨</span>
                                </button>
                                <button v-for="tex in textureList" :key="tex.id"
                                    @click="selectedTexture = tex.textureUrl"
                                    class="aspect-square rounded-xl border-2 overflow-hidden transition-all shadow-sm group relative"
                                    :class="selectedTexture === tex.textureUrl ? 'border-indigo-600 ring-2 ring-indigo-50 ring-offset-1' : 'border-transparent hover:border-slate-200'">
                                    <img :src="tex.thumbnailUrl"
                                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div v-if="selectedTexture === tex.textureUrl"
                                        class="absolute inset-0 bg-indigo-900/10 flex items-center justify-center">
                                        <div class="w-2 h-2 bg-white rounded-full shadow-md"></div>
                                    </div>
                                </button>
                            </div>
                            <div v-if="selectedTexture"
                                class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in slide-in-from-top-2">
                                <label
                                    class="block text-[10px] font-black text-indigo-400 uppercase tracking-wider">Doku
                                    Ölçeği</label>
                                <div class="flex gap-2">
                                    <button v-for="val in [1, 2, 4, 8]" :key="val" @click="form.textureScale = val"
                                        class="flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                                        :class="form.textureScale === val ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-100'">
                                        {{ val }}x
                                    </button>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="group relative flex flex-col justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300"
                                    :class="{ 'opacity-50 cursor-not-allowed bg-slate-50 grayscale': !!selectedTexture }">
                                    <span
                                        class="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Zemin</span>
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-6 h-6 rounded-full border border-slate-200 shadow-sm ring-1 ring-white"
                                            :style="{ backgroundColor: form.floorColor }"></div>
                                        <span class="text-xs font-bold text-slate-700 font-mono">{{ form.floorColor
                                        }}</span>
                                    </div>
                                    <input v-model="form.floorColor" :disabled="!!selectedTexture" type="color"
                                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                </div>
                                <div
                                    class="group relative flex flex-col justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300">
                                    <span
                                        class="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Arka
                                        Plan</span>
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-6 h-6 rounded-full border border-slate-200 shadow-sm ring-1 ring-white"
                                            :style="{ backgroundColor: form.bgColor }"></div>
                                        <span class="text-xs font-bold text-slate-700 font-mono">{{ form.bgColor
                                        }}</span>
                                    </div>
                                    <input v-model="form.bgColor" type="color"
                                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="flex-1 bg-slate-100/50 flex flex-col relative overflow-hidden"
                    :style="{ backgroundColor: form.bgColor }">
                    <div
                        class="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm/50">
                        <div class="flex items-center gap-3">
                            <span
                                class="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-slate-200">2D
                                Planlayıcı</span>
                            <span
                                class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100"
                                v-if="form.shapeType === 'custom'">
                                Nokta Sayısı: <span class="text-indigo-600">{{ customPoints.length }}</span>
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <template v-if="form.shapeType === 'custom'">
                                <button @click="removeLastPoint"
                                    class="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200">
                                    <span>↩</span> Geri Al
                                </button>
                                <button @click="clearCustomDrawing"
                                    class="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100">
                                    <span>🗑</span> Temizle
                                </button>
                                <div class="w-px h-4 bg-slate-300 mx-2"></div>
                            </template>
                            <button @click="resetView"
                                class="flex items-center gap-2 px-4 py-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100">
                                <span>⟲</span> Odakla
                            </button>
                        </div>
                    </div>

                    <div class="w-full h-full relative" ref="svgContainer" :style="{ cursor: cursorStyle }"
                        @wheel.prevent="handleWheel" @mousedown="startPan" @mouseup="stopDrag" @mouseleave="stopDrag"
                        @mousemove="handleMouseMove" @click="handleSvgClick" @contextmenu.prevent="removeLastPoint">

                        <svg ref="svgEl" width="100%" height="100%" :viewBox="dynamicViewBox"
                            class="block w-full h-full pointer-events-none drop-shadow-2xl">

                            <defs>
                                <pattern id="gridMinor" width="1" height="1" patternUnits="userSpaceOnUse">
                                    <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#94a3b8" stroke-width="0.02"
                                        opacity="0.3" />
                                </pattern>
                                <pattern id="gridMajor" width="5" height="5" patternUnits="userSpaceOnUse">
                                    <rect width="5" height="5" fill="url(#gridMinor)" />
                                    <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#64748b" stroke-width="0.05"
                                        opacity="0.4" />
                                </pattern>
                                <pattern id="floorTexUI" patternUnits="userSpaceOnUse" :width="form.textureScale"
                                    :height="form.textureScale">
                                    <image v-if="selectedTexture" :href="selectedTexture" :xlink:href="selectedTexture"
                                        x="0" y="0" :width="form.textureScale" :height="form.textureScale"
                                        preserveAspectRatio="xMidYMid slice" />
                                </pattern>
                            </defs>

                            <rect x="-400" y="-400" width="800" height="800" fill="url(#gridMajor)" />

                            <path :d="finalPath"
                                :fill="(form.shapeType !== 'custom' || isClosed) ? (selectedTexture ? 'url(#floorTexUI)' : form.floorColor) : 'none'"
                                :stroke="(form.shapeType === 'custom' && !isClosed) ? '#4f46e5' : '#4f46e5'"
                                :stroke-width="0.15"
                                :stroke-dasharray="(form.shapeType === 'custom' && !isClosed) ? '0.3,0.3' : '0'"
                                class="transition-all duration-300 ease-out"
                                :opacity="(form.shapeType !== 'custom' || isClosed) ? 0.95 : 0.6" />

                            <g v-for="(label, idx) in segmentLabels" :key="'lbl-' + idx">
                                <rect :x="label.midX - 0.7" :y="label.midZ - 0.35" width="1.4" height="0.7" rx="0.2"
                                    fill="white" class="drop-shadow-sm" stroke="#e2e8f0" stroke-width="0.02"
                                    opacity="0.9" />
                                <text :x="label.midX" :y="label.midZ + 0.1" font-size="0.35" text-anchor="middle"
                                    font-weight="800" fill="#334155" font-family="Inter, sans-serif">
                                    {{ label.length }}m
                                </text>
                            </g>

                            <g v-if="form.shapeType === 'custom'">

                                <line v-if="lastPoint && !isClosed" :x1="lastPoint.x" :y1="lastPoint.z" :x2="mousePos.x"
                                    :y2="mousePos.z" stroke="#6366f1" stroke-width="0.1" stroke-dasharray="0.2,0.2"
                                    opacity="0.6" class="pointer-events-none" />

                                <circle v-if="!isClosed" :cx="mousePos.x" :cy="mousePos.z" r="0.2"
                                    :fill="isSnapToStart ? '#22c55e' : 'rgba(99, 102, 241, 0.5)'" stroke="white"
                                    stroke-width="0.05" class="animate-pulse pointer-events-none" />

                                <circle v-for="(p, i) in customPoints" :key="i" :cx="p.x" :cy="p.z" :r="0.25"
                                    :fill="i === 0 && isSnapToStart ? '#22c55e' : '#4f46e5'" stroke="white"
                                    stroke-width="0.08" :class="draggingPointIndex === null
                                        ? 'pointer-events-auto hover:scale-125 transition-transform cursor-grab'
                                        : 'pointer-events-none'" @mousedown.stop="startDragPoint(i)" />
                            </g>
                        </svg>
                    </div>

                    <div class="absolute bottom-6 left-8 pointer-events-none">
                        <div
                            class="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-200 shadow-xl flex gap-3 items-center">
                            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span v-if="form.shapeType === 'custom'"
                                class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                Sol Tık: Nokta Ekle <span class="mx-1 text-slate-300">|</span> Sağ Tık: Nokta Sil
                            </span>
                            <span v-else class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                {{ form.shapeType === 'circle' ? 'Daire' : form.shapeType === 'ellipse' ? 'Elips' :
                                    'Dikdörtgen' }} Modu
                                Aktif
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="px-8 py-5 bg-white border-t border-slate-100 flex justify-end gap-4 items-center">
                <button @click="close"
                    class="px-6 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-[0.2em]">Vazgeç</button>
                <button @click="handleSave"
                    :disabled="!form.name || (form.shapeType === 'custom' && customPoints.length < 3)"
                    class="px-8 py-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-3 group">
                    <span>{{ mode === 'create' ? 'Sahneyi Yayınla' : 'Kaydet' }}</span>
                    <span class="text-base group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { arSceneService } from '../../../services/arSceneService';

const svgEl = ref<SVGSVGElement | null>(null);
const props = defineProps<{ isOpen: boolean; mode: 'create' | 'edit'; initialData?: any; }>();
const emit = defineEmits(['close', 'save']);

const form = reactive({
    name: '',
    width: 5,
    depth: 4,
    shapeType: 'rectangle',
    bgColor: '#f8fafc',
    floorColor: '#ffffff',
    wallHeight: 2.8,
    textureScale: 2
});

const textureList = ref<any[]>([]);
const selectedTexture = ref<string | null>(null);
const customPoints = ref<{ x: number, z: number }[]>([]);
const mousePos = reactive({ x: 0, z: 0 });
const svgContainer = ref<HTMLDivElement | null>(null);
const viewPort = reactive({ x: -2, y: -2, zoom: 15, isDragging: false, lastMouseX: 0, lastMouseY: 0 });

const draggingPointIndex = ref<number | null>(null);
const isClosed = ref(false);
const isSnapToStart = ref(false);
const hoveredPointIndex = ref<number | null>(null);
// Container Boyutlarını Takip Etmek için (Drift sorununu çözer)
const containerSize = reactive({ width: 100, height: 100 });
let resizeObserver: ResizeObserver | null = null;

const startDragPoint = (index: number) => { draggingPointIndex.value = index; };
const stopDrag = () => { draggingPointIndex.value = null; viewPort.isDragging = false; };

const shapes = [
    { id: 'rectangle', label: 'Dikdörtgen', icon: '⬛' },
    { id: 'circle', label: 'Daire', icon: '⚪' },
    { id: 'ellipse', label: 'Elips', icon: '⬬' },
    { id: 'custom', label: 'Serbest', icon: '✏️' }
];

const calculatedArea = computed(() => {
    if (form.shapeType === 'rectangle') return (form.width * form.depth).toFixed(2);
    else if (form.shapeType === 'circle') { const r = form.width / 2; return (Math.PI * r * r).toFixed(2); }
    else if (form.shapeType === 'ellipse') return (Math.PI * (form.width / 2) * (form.depth / 2)).toFixed(2);
    else if (form.shapeType === 'custom') {
        const points = customPoints.value;
        if (points.length < 3) return '0.00';
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const p1 = points[i];
            const p2 = points[j];
            if (!p1 || !p2) continue;
            area += p1.x * p2.z;
            area -= p2.x * p1.z;
        }
        return Math.abs(area / 2).toFixed(2);
    }
    return '0.00';
});

const calculatePresetPoints = (type: string, w: number, d: number) => {
    if (type === 'rectangle') return [{ x: 0, z: 0 }, { x: w, z: 0 }, { x: w, z: d }, { x: 0, z: d }];
    if (type === 'circle' || type === 'ellipse') {
        const segments = 72;
        const pts = [];
        const rx = w / 2;
        const ry = type === 'circle' ? w / 2 : d / 2;
        const cx = rx;
        const cy = ry;
        for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            pts.push({ x: cx + rx * Math.cos(theta), z: cy + ry * Math.sin(theta) });
        }
        return pts;
    }
    return [];
};

const segmentLabels = computed(() => {
    if (['circle', 'ellipse'].includes(form.shapeType)) return [];
    let pts: any[] = [];
    if (form.shapeType === 'custom') pts = customPoints.value;
    else pts = calculatePresetPoints(form.shapeType, form.width, form.depth);
    if (pts.length < 2) return [];
    const labels = [];
    const loopCount = (form.shapeType !== 'custom' || isClosed.value) ? pts.length : pts.length - 1;
    for (let i = 0; i < loopCount; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
        if (length < 0.1) continue;
        labels.push({ length: length.toFixed(1), midX: (p1.x + p2.x) / 2, midZ: (p1.z + p2.z) / 2 });
    }
    return labels;
});

const finalPath = computed(() => {
    let pts: any[] = [];
    if (form.shapeType === 'custom') {
        pts = customPoints.value;
        if (pts.length < 2 && !isClosed.value) return '';
        const path = 'M ' + pts.map(p => `${p.x} ${p.z}`).join(' L ');
        return isClosed.value ? path + ' Z' : path;
    } else {
        pts = calculatePresetPoints(form.shapeType, form.width, form.depth);
        if (pts.length < 2) return '';
        const path = 'M ' + pts.map(p => `${p.x} ${p.z}`).join(' L ');
        return path + ' Z';
    }
});

const dynamicViewBox = computed(() => {
    const aspectRatio = containerSize.width / containerSize.height;
    // Zoom değeri ViewBox yüksekliği olsun, Genişliği ise Orana göre hesaplayalım.
    const viewBoxHeight = viewPort.zoom;
    const viewBoxWidth = viewPort.zoom * aspectRatio;
    return `${viewPort.x} ${viewPort.y} ${viewBoxWidth} ${viewBoxHeight}`;
});
const lastPoint = computed(() => customPoints.value.length ? customPoints.value[customPoints.value.length - 1] : null);

const handleWheel = (e: WheelEvent) => {
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    const newZoom = viewPort.zoom * delta;
    if (newZoom > 1 && newZoom < 500) viewPort.zoom = newZoom;
};

const startPan = (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault(); viewPort.isDragging = true;
        viewPort.lastMouseX = e.clientX; viewPort.lastMouseY = e.clientY;
    }
};

const handleMouseMove = (e: MouseEvent) => {
    if (!svgEl.value) return;

    if (viewPort.isDragging) {
        // Pan işlemi (Değişmedi, aynı mantık)
        // Matrix kullanmadan basit pan
        const startPoint = svgEl.value.createSVGPoint();
        startPoint.x = e.clientX;
        startPoint.y = e.clientY;

        const endPoint = svgEl.value.createSVGPoint();
        endPoint.x = viewPort.lastMouseX;
        endPoint.y = viewPort.lastMouseY;

        const start = startPoint.matrixTransform(svgEl.value.getScreenCTM()!.inverse());
        const end = endPoint.matrixTransform(svgEl.value.getScreenCTM()!.inverse());

        viewPort.x -= (start.x - end.x);
        viewPort.y -= (start.y - end.y);

        viewPort.lastMouseX = e.clientX;
        viewPort.lastMouseY = e.clientY;
        return;
    }

    const pt = svgEl.value.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.value.getScreenCTM();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm.inverse());

    let targetX = Math.round(svgPoint.x * 100) / 100;
    let targetZ = Math.round(svgPoint.y * 100) / 100;

    hoveredPointIndex.value = null;
    if (form.shapeType === 'custom' && customPoints.value.length > 0) {
        for (let i = 0; i < customPoints.value.length; i++) {
            const p = customPoints.value[i];
            if (!p) continue;
            const dist = Math.hypot(targetX - p.x, targetZ - p.z);
            if (dist < 0.3) {
                hoveredPointIndex.value = i;
                break;
            }
        }
    }

    isSnapToStart.value = false;
    if (form.shapeType === 'custom' && !isClosed.value && customPoints.value.length > 2 && draggingPointIndex.value === null) {
        const startNode = customPoints.value[0];
        if (startNode) {
            const dist = Math.hypot(targetX - startNode.x, targetZ - startNode.z);
            if (dist < 0.5) {
                targetX = startNode.x;
                targetZ = startNode.z;
                isSnapToStart.value = true;
                hoveredPointIndex.value = 0;
            }
        }
    }

    mousePos.x = targetX;
    mousePos.z = targetZ;

    if (draggingPointIndex.value !== null) {
        customPoints.value[draggingPointIndex.value] = { x: mousePos.x, z: mousePos.z };
    }
};

const cursorStyle = computed(() => {
    if (viewPort.isDragging) return 'grabbing';
    if (draggingPointIndex.value !== null) return 'grabbing';
    if (hoveredPointIndex.value !== null) return 'grab';
    if (form.shapeType === 'custom' && !isClosed.value) return 'crosshair';
    return 'default';
});

const handleSvgClick = () => {
    if (form.shapeType !== 'custom') return;
    if (draggingPointIndex.value !== null) return;
    if (isClosed.value) return;

    if (isSnapToStart.value) {
        isClosed.value = true;
        isSnapToStart.value = false;
    } else {
        customPoints.value.push({ ...mousePos });
    }
};

const resetView = () => {
    // Odaklamada da Aspect Ratio'yu hesaba katmalıyız
    const aspectRatio = containerSize.width / containerSize.height;
    viewPort.zoom = 15;

    if (form.shapeType !== 'custom') {
        const vbW = viewPort.zoom * aspectRatio;
        const vbH = viewPort.zoom;
        // Şeklin ortasını (form.width/2) ViewBox'ın ortasına (vbW/2) eşitle
        viewPort.x = (form.width / 2) - (vbW / 2);
        viewPort.y = (form.depth / 2) - (vbH / 2);
    } else {
        // Custom modda 0,0'a göre ortala
        const vbW = viewPort.zoom * aspectRatio;
        const vbH = viewPort.zoom;
        viewPort.x = -(vbW / 2);
        viewPort.y = -(vbH / 2);
    }
};

const resetForm = () => {
    // Formu sıfırla
    Object.assign(form, {
        name: '',
        width: 5,
        depth: 4,
        shapeType: 'rectangle',
        bgColor: '#f8fafc',
        floorColor: '#ffffff',
        wallHeight: 2.8,
        textureScale: 2
    });

    // State'leri temizle
    customPoints.value = [];
    selectedTexture.value = null;
    isClosed.value = false;
    isSnapToStart.value = false;
    draggingPointIndex.value = null;
    hoveredPointIndex.value = null;
    
    // Kamerayı varsayılana çek
    resetView();
};

const clearCustomDrawing = () => {
    customPoints.value = [];
    isClosed.value = false;       // KRİTİK DÜZELTME: Kilit kaldırılsın
    isSnapToStart.value = false;  // Magnet sıfırlansın
    draggingPointIndex.value = null;
};

const removeLastPoint = () => {
    if (isClosed.value) isClosed.value = false;
    else customPoints.value.pop();
};

const setShape = (id: string) => {
    form.shapeType = id;
    if (id === 'custom') {
        customPoints.value = [];
        isClosed.value = false;
    }
    if (id === 'circle') { form.width = 5; form.depth = 5; }
};

const close = () => emit('close');

const handleSave = () => {
    let pts = form.shapeType === 'custom' ? [...customPoints.value] : calculatePresetPoints(form.shapeType, form.width, form.depth);
    let finalWidth = form.width;
    let finalDepth = form.depth;

    if (form.shapeType === 'custom' && pts.length > 0) {
        const xs = pts.map(p => p.x);
        const zs = pts.map(p => p.z);
        finalWidth = Math.max(...xs) - Math.min(...xs);
        finalDepth = Math.max(...zs) - Math.min(...zs);
    }

    emit('save', {
        name: form.name,
        settings: {
            floorType: form.shapeType,
            floorPoints: pts,
            wallHeight: form.wallHeight,
            floorTextureUrl: selectedTexture.value,
            textureScale: form.textureScale,
            backgroundColor: form.bgColor,
            floorColor: form.floorColor,
            width: finalWidth,
            depth: finalDepth,
            gridVisible: true
        }
    });
};

onMounted(async () => {
    try { textureList.value = await arSceneService.listFloorTextures(); }
    catch (e) { console.error("Dokular yüklenemedi", e); }

    if (svgContainer.value) {
        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                containerSize.width = entry.contentRect.width;
                containerSize.height = entry.contentRect.height;
            }
        });
        resizeObserver.observe(svgContainer.value);
    }
    window.addEventListener('mouseup', stopDrag);
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener('mouseup', stopDrag);
});

watch(() => props.isOpen, (val) => {
    if (val) {
        resetForm();

        if (props.mode === 'edit' && props.initialData) {
            const s = props.initialData.settings;
            
            Object.assign(form, {
                name: props.initialData.name,
                width: s.width || 5,
                depth: s.depth || 4,
                shapeType: s.floorType || 'rectangle',
                bgColor: s.backgroundColor || '#f8fafc',
                floorColor: s.floorColor || '#ffffff',
                wallHeight: s.wallHeight ?? 2.8,
                textureScale: s.textureScale || 2
            });
            
            selectedTexture.value = s.floorTextureUrl;
            
            if (s.floorPoints) {
                customPoints.value = [...s.floorPoints];
                if (form.shapeType === 'custom' && customPoints.value.length > 2) {
                    isClosed.value = true;
                }
            }

            setTimeout(() => {
                if (svgContainer.value) {
                    const rect = svgContainer.value.getBoundingClientRect();
                    const aspect = rect.width / rect.height;
                    
                    const maxDim = Math.max(form.width, form.depth);
                    let calculatedZoom = maxDim * 1.5;
                    if (calculatedZoom > 490) calculatedZoom = 490;
                    
                    viewPort.zoom = calculatedZoom;
                    
                    // Ortala
                    if (form.shapeType !== 'custom') {
                        const vbW = calculatedZoom * aspect;
                        viewPort.x = (form.width / 2) - (vbW / 2);
                        viewPort.y = (form.depth / 2) - (calculatedZoom / 2);
                    } else {
                        viewPort.x = -5; 
                        viewPort.y = -5;
                    }
                }
            }, 100);
        }
    }
});
</script>