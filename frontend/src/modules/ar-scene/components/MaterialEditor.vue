<template>
    <div v-if="selectedMesh" ref="sheetRef" :style="sheetStyle" class="
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
                    <div class="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <span class="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">
                        {{ selectedMesh.name || 'İsimsiz Parça' }}
                    </span>
                </div>
                <button @click.stop="$emit('close')" class="text-gray-400 hover:text-white transition-colors p-1">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-gray-800/50">

            <div class="flex items-center justify-between bg-blue-600/10 border border-blue-500/20 p-2.5 rounded-xl">
                <div class="flex items-center gap-2">
                    <div class="p-1.5 bg-blue-500 rounded-lg text-white">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-white">Fırça Modu</span>
                        <span class="text-[10px] text-gray-400 hidden sm:block">Seçilen ayarları tıkla uygula</span>
                    </div>
                </div>
                <button @click="isBrushActive = !isBrushActive"
                    class="w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0"
                    :class="isBrushActive ? 'bg-blue-500' : 'bg-gray-600'">
                    <div class="w-3 h-3 bg-white rounded-full absolute top-1 transition-transform shadow-sm"
                        :class="isBrushActive ? 'left-6' : 'left-1'"></div>
                </button>
            </div>

            <div>
                <label class="text-xs font-bold text-gray-400 mb-2 block">Yüzey Rengi</label>
                <div class="flex overflow-x-auto pb-2 gap-2 mb-2 md:grid md:grid-cols-5 md:pb-0 scrollbar-hide">
                    <button v-for="color in presetColors" :key="color" @click="updateColor(color)"
                        class="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 transition-transform hover:scale-110 focus:ring-2 ring-offset-2 ring-offset-gray-800 shrink-0"
                        :class="currentColor === color ? 'border-white ring-2 ring-blue-500' : 'border-transparent'"
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

            <div class="space-y-4 pb-10 md:pb-0">
                <div>
                    <div class="flex justify-between mb-2">
                        <label class="text-xs font-bold text-gray-400">Metalik</label>
                        <span class="text-xs text-blue-400">{{ Math.round(metalness * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" v-model.number="metalness" @input="updateMaterial"
                        class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-none">
                </div>
                <div>
                    <div class="flex justify-between mb-2">
                        <label class="text-xs font-bold text-gray-400">Pürüzlülük</label>
                        <span class="text-xs text-blue-400">{{ Math.round(roughness * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" v-model.number="roughness" @input="updateMaterial"
                        class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-none">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const props = defineProps<{
    selectedMesh: THREE.Mesh | null;
}>();

const emit = defineEmits(['close', 'update']);

const presetColors = [
    '#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e',
    '#eab308', '#a855f7', '#ec4899', '#64748b', '#78350f'
];

const currentColor = ref('#ffffff');
const metalness = ref(0);
const roughness = ref(0.5);
const isBrushActive = ref(false);

const sheetHeight = ref(30);
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

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
});

const readMaterialProperties = (mesh: THREE.Mesh) => {
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (material && (material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        const stdMat = material as THREE.MeshStandardMaterial;
        currentColor.value = '#' + stdMat.color.getHexString();
        metalness.value = stdMat.metalness;
        roughness.value = stdMat.roughness;
    }
};

const updateColor = (color: string) => {
    currentColor.value = color;
    updateMaterial();
};

const updateMaterial = () => {
    if (!props.selectedMesh) return;
    const mesh = props.selectedMesh;
    let material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;

    if (!mesh.userData.hasCustomMaterial && material) {
        material = material.clone();
        mesh.material = material;
        mesh.userData.hasCustomMaterial = true;
    }

    const stdMat = material as THREE.MeshStandardMaterial;
    stdMat.color.set(currentColor.value);
    stdMat.metalness = metalness.value;
    stdMat.roughness = roughness.value;

    emit('update', {
        meshName: mesh.name,
        color: currentColor.value,
        metalness: metalness.value,
        roughness: roughness.value
    });
};

watch(() => props.selectedMesh, (newMesh) => {
    if (newMesh) {
        if (isMobile.value) sheetHeight.value = 30;

        if (isBrushActive.value) {
            updateMaterial();
        } else {
            readMaterialProperties(newMesh);
        }
    }
}, { immediate: true });

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