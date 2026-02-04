<template>
    <div ref="sheetRef" :style="sheetStyle" class="
            z-50 flex flex-col bg-gray-800/95 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden transition-colors duration-300
            
            /* --- MOBİL (Bottom Sheet) --- */
            fixed bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-x
            
            /* Sürükleme sırasında animasyonu kapat ki takılmasın, bırakınca aç */
            transition-[height] ease-out

            /* --- DESKTOP (Floating Sidebar) --- */
            md:absolute md:top-20 md:right-4 md:bottom-auto md:left-auto md:w-72 md:h-auto md:rounded-2xl md:border
            md:animate-fade-in-right md:max-h-[calc(100vh-200px)]
        " :class="{ 'duration-0': isDragging, 'duration-300': !isDragging }">

        <div @touchstart="startDrag" @mousedown="startDrag"
            class="p-2 md:p-4 border-b border-white/10 flex flex-col justify-center bg-gray-900/50 shrink-0 cursor-ns-resize touch-none select-none">
            <div class="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-3 md:hidden"></div>

            <div class="flex justify-between items-center w-full px-2">
                <div class="flex items-center gap-2 overflow-hidden">
                    <div class="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse"></div>
                    <span class="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">
                        🎨 {{ t('scenes.editor.paintMode.title') }}
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    <button 
                        @click.stop="undo" 
                        :disabled="!canUndo"
                        :title="canUndo ? t('scenes.editor.paintMode.undo') + ' (Ctrl+Z)' : t('scenes.editor.paintMode.noUndoActions')"
                        class="text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        :class="canUndo ? 'hover:bg-white/10 rounded' : ''">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button @click.stop="$emit('close')" class="text-gray-400 hover:text-white transition-colors p-1">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-gray-800/50">

            <div class="bg-purple-600/10 border border-purple-500/20 p-3 rounded-xl space-y-2">
                <div class="flex items-start gap-2">
                    <div class="p-1.5 bg-purple-500 rounded-lg text-white shrink-0 mt-0.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="flex flex-col text-xs space-y-1">
                        <p class="text-white font-semibold">{{ t('scenes.editor.paintMode.howToUse') }}</p>
                        <!-- Web kontrolleri -->
                        <ul class="hidden md:block text-gray-300 space-y-0.5 text-[11px] leading-relaxed">
                            <li>• <strong>{{ t('scenes.editor.paintMode.leftClickDrag') }}:</strong> {{ t('scenes.editor.paintMode.paintParts') }}</li>
                            <li>• <strong>{{ t('scenes.editor.paintMode.rightClick') }}:</strong> {{ t('scenes.editor.paintMode.rotateCamera') }}</li>
                            <li>• <strong>{{ t('scenes.editor.paintMode.spaceDrag') }}:</strong> {{ t('scenes.editor.paintMode.panScene') }}</li>
                            <li>• <strong>{{ t('scenes.editor.paintMode.scroll') }}:</strong> {{ t('scenes.editor.paintMode.zoomInOut') }}</li>
                        </ul>
                        <!-- Mobil kontrolleri -->
                        <ul class="md:hidden text-gray-300 space-y-0.5 text-[11px] leading-relaxed">
                            <li>• <strong>{{ t('scenes.editor.paintMode.singleTap') }}:</strong> {{ t('scenes.editor.paintMode.paintPart') }}</li>
                            <li>• <strong>{{ t('scenes.editor.paintMode.singleFingerDrag') }}:</strong> {{ t('scenes.editor.paintMode.rotate') }}</li>
                            <li>• <strong>{{ t('scenes.editor.paintMode.twoFingers') }}:</strong> {{ t('scenes.editor.paintMode.zoomPan') }}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div>
                <label class="text-xs font-bold text-gray-400 mb-2 block">{{ t('scenes.editor.paintMode.surfaceColor') }}</label>
                <div class="flex overflow-x-auto pb-2 gap-2 mb-2 md:grid md:grid-cols-5 md:pb-0 scrollbar-hide">
                    <button v-for="color in presetColors" :key="color" @click="updateColor(color)"
                        class="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 transition-transform hover:scale-110 focus:ring-2 ring-offset-2 ring-offset-gray-800 shrink-0"
                        :class="currentColor === color ? 'border-white ring-2 ring-purple-500' : 'border-transparent'"
                        :style="{ backgroundColor: color }">
                    </button>
                </div>
                <div class="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                    <input type="color" v-model="currentColor" @input="updateColor(currentColor)"
                        class="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0">
                    <span class="text-xs text-gray-300 font-mono">{{ currentColor.toUpperCase() }}</span>
                </div>
            </div>

            <div class="h-px bg-white/10"></div>

            <!-- Materyal Preset'leri -->
            <div>
                <label class="text-xs font-bold text-gray-400 mb-2 block">{{ t('scenes.editor.paintMode.materialType') }}</label>
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <button 
                        v-for="(preset, index) in materialPresets" 
                        :key="index"
                        @click="applyMaterialPreset(index)"
                        class="flex items-center gap-2 p-2 rounded-lg border transition-all text-left"
                        :class="selectedPreset === index 
                            ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' 
                            : 'bg-white/5 border-white/10 hover:border-purple-500/50'">
                        <span class="text-lg">{{ preset.icon }}</span>
                        <span class="text-[10px] text-gray-300 font-medium leading-tight">
                            {{ preset.name.replace(/[💎🔩✨🧱🏀🪟]\s/, '') }}
                        </span>
                    </button>
                </div>
            </div>

            <div class="h-px bg-white/10"></div>

            <div class="space-y-4 pb-10 md:pb-0">
                <div>
                    <div class="flex justify-between mb-2">
                        <label class="text-xs font-bold text-gray-400">{{ t('scenes.editor.paintMode.metallicManual') }}</label>
                        <span class="text-xs text-purple-400">{{ Math.round(metalness * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" v-model.number="metalness" 
                        @input="onManualMetalnessChange"
                        class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-none">
                </div>
                <div>
                    <div class="flex justify-between mb-2">
                        <label class="text-xs font-bold text-gray-400">{{ t('scenes.editor.paintMode.roughnessManual') }}</label>
                        <span class="text-xs text-purple-400">{{ Math.round(roughness * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" v-model.number="roughness" 
                        @input="onManualRoughnessChange"
                        class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-none">
                </div>
            </div>

            <div v-if="lastPaintedMesh" class="bg-green-500/10 border border-green-500/20 p-2 rounded-lg">
                <p class="text-xs text-green-300">
                    ✓ {{ t('scenes.editor.paintMode.lastPainted') }}: <strong>{{ lastPaintedMesh }}</strong>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits(['close', 'paint', 'undo']);

const presetColors = [
    '#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e',
    '#eab308', '#a855f7', '#ec4899', '#64748b', '#78350f'
];

// Materyal preset'leri
const materialPresets = [
    { name: '💎 Parlak Metal', metalness: 1.0, roughness: 0.1, icon: '💎' },
    { name: '🔩 Mat Metal', metalness: 1.0, roughness: 0.7, icon: '🔩' },
    { name: '✨ Parlak Plastik', metalness: 0.0, roughness: 0.1, icon: '✨' },
    { name: '🧱 Mat Plastik', metalness: 0.0, roughness: 0.8, icon: '🧱' },
    { name: '🏀 Kauçuk', metalness: 0.0, roughness: 1.0, icon: '🏀' },
    { name: '🪟 Cam', metalness: 0.0, roughness: 0.0, icon: '🪟' }
];

const currentColor = ref('#ffffff');
const metalness = ref(0);
const roughness = ref(0.5);
const lastPaintedMesh = ref<string | null>(null);
const selectedPreset = ref<number | null>(null);

// Undo history
interface PaintAction {
    mesh: any;
    meshName: string;
    previousMaterial: {
        color: string;
        metalness: number;
        roughness: number;
    };
}

const paintHistory = ref<PaintAction[]>([]);
const maxHistorySize = 50;
const canUndo = computed(() => paintHistory.value.length > 0);

const sheetHeight = ref(35);
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);
const isMobile = ref(false);

const checkMobile = () => {
    isMobile.value = window.innerWidth < 768;
};

const sheetStyle = computed(() => {
    if (isMobile.value) {
        return { height: `${sheetHeight.value}vh` };
    }
    return {};
});

const startDrag = (e: TouchEvent | MouseEvent) => {
    if (!isMobile.value) return;

    isDragging.value = true;
    startHeight.value = sheetHeight.value;

    if ('touches' in e && e.touches.length > 0) {
        startY.value = (e as any).touches ? (e as any).touches[0].clientY : (e as any).clientY;
    } else {
        startY.value = (e as MouseEvent).clientY;
    }

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
};

const onDrag = (e: TouchEvent | MouseEvent | Event) => {
    if (!isDragging.value) return;
    
    if (e.type === 'touchmove') {
        (e as TouchEvent).preventDefault();
    }

    let currentY = 0;

    if ('touches' in e && (e as TouchEvent).touches.length > 0) {
        currentY = (e as any).touches ? (e as any).touches[0].clientY : (e as any).clientY;
    } else {
        currentY = (e as MouseEvent).clientY;
    }
    
    const deltaY = startY.value - currentY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    let newHeight = startHeight.value + deltaVh;

    if (newHeight < 15) newHeight = 15;
    if (newHeight > 85) newHeight = 85;

    sheetHeight.value = newHeight;
};

const stopDrag = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('touchend', stopDrag);
};

// Klavye kısayolları
const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl+Z veya Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
};

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
    window.removeEventListener('keydown', handleKeyPress);
});

const updateColor = (color: string) => {
    currentColor.value = color;
};

const applyMaterialPreset = (index: number) => {
    const preset = materialPresets[index];
    if (!preset) return;
    metalness.value = preset.metalness;
    roughness.value = preset.roughness;
    selectedPreset.value = index;
};

// Manuel değişiklikte preset seçimini sıfırla
const onManualMetalnessChange = () => {
    selectedPreset.value = null;
};

const onManualRoughnessChange = () => {
    selectedPreset.value = null;
};

// Dışarıdan çağrılacak - mesh boyandığında
const notifyPaint = (meshName: string, mesh: any, previousMaterial: { color: string; metalness: number; roughness: number }) => {
    lastPaintedMesh.value = meshName;
    
    // History'ye ekle
    paintHistory.value.push({
        mesh,
        meshName,
        previousMaterial
    });
    
    // Max limit kontrolü
    if (paintHistory.value.length > maxHistorySize) {
        paintHistory.value.shift();
    }
    
    setTimeout(() => {
        lastPaintedMesh.value = null;
    }, 2000);
};

// Geri al fonksiyonu
const undo = () => {
    if (!canUndo.value) return;
    
    const lastAction = paintHistory.value.pop();
    if (!lastAction) return;
    
    const { mesh, previousMaterial } = lastAction;
    
    // Materyal'i geri yükle
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (mat) {
        mat.color.set(previousMaterial.color);
        mat.metalness = previousMaterial.metalness;
        mat.roughness = previousMaterial.roughness;
    }
    
    // Mesh'in bağlı olduğu sceneItem'i bul ve save için emit et
    let parent = mesh.parent;
    let sceneItemId: number | null = null;
    while (parent) {
        if (parent.userData?.itemId) {
            sceneItemId = parent.userData.itemId;
            break;
        }
        parent = parent.parent;
    }
    
    if (sceneItemId) {
        // Parent'a kaydetmesi için bildir
        emit('undo', sceneItemId, mesh.name, previousMaterial);
    }
};

// Mevcut malzeme ayarlarını döndür
const getCurrentMaterial = () => {
    return {
        color: currentColor.value,
        metalness: metalness.value,
        roughness: roughness.value
    };
};

// Parent component'e expose et
defineExpose({
    getCurrentMaterial,
    notifyPaint,
    undo,
    canUndo
});
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.md\:animate-fade-in-right {
    animation: fadeInRight 0.3s ease-out;
}

@keyframes fadeInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-slide-up {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}
</style>
