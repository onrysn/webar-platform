<template>
    <div v-if="selectedMesh"
        class="absolute right-4 top-20 w-72 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300 animate-fade-in-right">

        <div class="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50">
            <div class="flex items-center gap-2 overflow-hidden">
                <div class="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <span class="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">
                    {{ selectedMesh.name || 'İsimsiz Parça' }}
                </span>
            </div>
            <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">

            <div class="flex items-center justify-between bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl">
                <div class="flex items-center gap-2">
                    <div class="p-1.5 bg-blue-500 rounded-lg text-white">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-white">Fırça Modu</span>
                        <span class="text-[10px] text-gray-400">Seçilen ayarları tıkla uygula</span>
                    </div>
                </div>

                <button @click="isBrushActive = !isBrushActive"
                    class="w-10 h-5 rounded-full transition-colors relative focus:outline-none"
                    :class="isBrushActive ? 'bg-blue-500' : 'bg-gray-600'">
                    <div class="w-3 h-3 bg-white rounded-full absolute top-1 transition-transform shadow-sm"
                        :class="isBrushActive ? 'left-6' : 'left-1'"></div>
                </button>
            </div>

            <div>
                <label class="text-xs font-bold text-gray-400 mb-3 block">Yüzey Rengi</label>
                <div class="grid grid-cols-5 gap-2 mb-3">
                    <button v-for="color in presetColors" :key="color" @click="updateColor(color)"
                        class="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 focus:ring-2 ring-offset-2 ring-offset-gray-800"
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

            <div class="space-y-5">
                <div>
                    <div class="flex justify-between mb-2">
                        <label class="text-xs font-bold text-gray-400">Metalik</label>
                        <span class="text-xs text-blue-400">{{ Math.round(metalness * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" v-model.number="metalness" @input="updateMaterial"
                        class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    <div class="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>Plastik</span>
                        <span>Metal</span>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between mb-2">
                        <label class="text-xs font-bold text-gray-400">Pürüzlülük</label>
                        <span class="text-xs text-blue-400">{{ Math.round(roughness * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" v-model.number="roughness" @input="updateMaterial"
                        class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    <div class="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>Parlak</span>
                        <span>Mat</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps<{
    selectedMesh: THREE.Mesh | null;
}>();

const emit = defineEmits(['close', 'update']);

const presetColors = [
    '#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e',
    '#eab308', '#a855f7', '#ec4899', '#64748b', '#78350f'
];

// --- STATE ---
const currentColor = ref('#ffffff');
const metalness = ref(0);
const roughness = ref(0.5);
const isBrushActive = ref(false); // Fırça Modu Durumu

// --- FONKSİYONLAR ---

// 1. Modelden veriyi oku (Fırça modu kapalıyken kullanılır)
const readMaterialProperties = (mesh: THREE.Mesh) => {
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;

    if (material && (material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        const stdMat = material as THREE.MeshStandardMaterial;
        currentColor.value = '#' + stdMat.color.getHexString();
        metalness.value = stdMat.metalness;
        roughness.value = stdMat.roughness;
    }
};

// 2. Renk güncelleme wrapper'ı
const updateColor = (color: string) => {
    currentColor.value = color;
    updateMaterial();
};

// 3. Materyali Modele Uygula
const updateMaterial = () => {
    if (!props.selectedMesh) return;

    const mesh = props.selectedMesh;

    // Materyali al veya oluştur
    let material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;

    // Eğer bu materyal daha önce özelleştirilmemişse (default shared material ise), klonla.
    if (!mesh.userData.hasCustomMaterial && material) {
        material = material.clone();
        mesh.material = material;
        mesh.userData.hasCustomMaterial = true;
    }

    // Değerleri uygula
    const stdMat = material as THREE.MeshStandardMaterial;
    stdMat.color.set(currentColor.value);
    stdMat.metalness = metalness.value;
    stdMat.roughness = roughness.value;

    // Değişikliği üst bileşene bildir (DB kayıt için)
    emit('update', {
        meshName: mesh.name,
        color: currentColor.value,
        metalness: metalness.value,
        roughness: roughness.value
    });
};

// --- WATCHER: Sihir Burada Gerçekleşiyor ---
watch(() => props.selectedMesh, (newMesh) => {
    if (newMesh) {
        if (isBrushActive.value) {
            // SENARYO A: Fırça Modu AÇIK
            // Yeni bir parçaya tıklandığında, mevcut UI ayarlarını (currentColor vb.)
            // bu yeni parçaya ZORLA uygula.
            updateMaterial();
        } else {
            // SENARYO B: Fırça Modu KAPALI (Varsayılan)
            // Yeni bir parçaya tıklandığında, o parçanın kendi rengini oku
            // ve slider'ları ona göre güncelle.
            readMaterialProperties(newMesh);
        }
    }
}, { immediate: true });

</script>

<style scoped>
.animate-fade-in-right {
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

/* Custom Scrollbar */
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

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
}
</style>