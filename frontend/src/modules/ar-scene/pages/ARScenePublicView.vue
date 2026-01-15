<template>
    <div class="mobile-vh w-full bg-gray-900 flex flex-col relative overflow-hidden font-sans select-none">

        <div v-if="isLoading"
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p class="text-white font-medium tracking-wide animate-pulse">Sahne Yükleniyor...</p>
        </div>

        <div class="absolute inset-0 z-0 touch-none bg-gradient-to-br from-gray-800 to-gray-900">
            <canvas ref="canvasRef" class="w-full h-full block outline-none"></canvas>
        </div>

        <div
            class="absolute top-0 left-0 right-0 p-6 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
            <div class="max-w-7xl mx-auto flex items-start justify-between">
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-white drop-shadow-md leading-tight">
                        {{ sceneData?.name || 'Yükleniyor...' }}
                    </h1>

                    <p v-if="sceneData?.settings"
                        class="text-sm text-gray-300 font-medium mt-1 flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {{ sceneData.settings.width }}m x {{ sceneData.settings.depth }}m
                    </p>
                </div>

                <div class="hidden md:block text-right">
                    <span
                        class="text-[10px] text-white/40 uppercase tracking-widest border border-white/20 px-2 py-1 rounded">
                        Scene Editor
                    </span>
                </div>
            </div>
        </div>

        <div class="ar-button-container absolute left-0 right-0 z-30 flex justify-center px-4">
            <div class="relative">
                <button @click="handleViewInAR" :disabled="isExporting"
                    class="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-full shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-105 active:scale-95 group disabled:opacity-75 disabled:cursor-not-allowed">

                    <span v-if="isExporting" class="flex items-center gap-2">
                        <svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        <span class="hidden sm:inline font-medium">Hazırlanıyor...</span>
                    </span>

                    <template v-else>
                        <div class="relative w-5 h-5">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 group-hover:animate-bounce"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                            </svg>
                        </div>
                        <span class="font-bold tracking-wide text-sm sm:text-base">AR'da Görüntüle</span>
                    </template>

                </button>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue';
import { useRoute } from 'vue-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { TextureLoader } from 'three';

// Service Imports
import { arSceneService } from '../../../services/arSceneService';
import { arModelService } from '../../../services/arModelService';

// DTO Imports
import type { ARSceneDto, SceneItemDto } from '../dto/arScene.dto';
import { offsetPolygon } from '../../../utils/mathUtils';

// --- CONSTANTS: SHAPE LIBRARY ---
const SHAPE_LIBRARY = [
    { id: 'rect', label: 'Kare/Dikdörtgen', icon: '⬛', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z' },
    { id: 'circle', label: 'Daire', icon: '⚪', path: 'M 0 0 m -0.5 0 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0' },
    { id: 'triangle', label: 'Üçgen', icon: '🔺', path: 'M 0 -0.5 L 0.5 0.5 L -0.5 0.5 Z' },
    { id: 'right-triangle', label: 'Dik Üçgen', icon: '📐', path: 'M -0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z' },
    { id: 'diamond', label: 'Eşkenar Dörtgen', icon: '🔶', path: 'M 0 -0.5 L 0.5 0 L 0 0.5 L -0.5 0 Z' },
    { id: 'trapezoid', label: 'Yamuk', icon: '⏢', path: 'M -0.3 -0.5 L 0.3 -0.5 L 0.5 0.5 L -0.5 0.5 Z' },
    { id: 'parallelogram', label: 'Paralelkenar', icon: '▰', path: 'M -0.5 -0.5 L 0.3 -0.5 L 0.5 0.5 L -0.3 0.5 Z' },
    { id: 'pentagon', label: 'Beşgen', icon: '⬠', path: 'M 0 -0.5 L 0.48 -0.15 L 0.29 0.45 L -0.29 0.45 L -0.48 -0.15 Z' },
    { id: 'hexagon', label: 'Altıgen', icon: '🛑', path: 'M -0.25 -0.43 L 0.25 -0.43 L 0.5 0 L 0.25 0.43 L -0.25 0.43 L -0.5 0 Z' },
    { id: 'octagon', label: 'Sekizgen', icon: '✴️', path: 'M -0.2 -0.5 L 0.2 -0.5 L 0.5 -0.2 L 0.5 0.2 L 0.2 0.5 L -0.2 0.5 L -0.5 0.2 L -0.5 -0.2 Z' },
    { id: 'star-5', label: 'Yıldız (5)', icon: '⭐', path: 'M 0 -0.5 L 0.11 -0.15 L 0.47 -0.15 L 0.18 0.06 L 0.29 0.4 L 0 0.19 L -0.29 0.4 L -0.18 0.06 L -0.47 -0.15 L -0.11 -0.15 Z' },
    { id: 'star-4', label: 'Yıldız (4)', icon: '✨', path: 'M 0 -0.5 Q 0.1 -0.1 0.5 0 Q 0.1 0.1 0 0.5 Q -0.1 0.1 -0.5 0 Q -0.1 -0.1 0 -0.5 Z' },
    { id: 'donut', label: 'Halka', icon: '⭕', path: 'M 0 0 m -0.5 0 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0 M 0 0 m -0.3 0 a 0.3 0.3 0 1 1 0.6 0 a 0.3 0.3 0 1 1 -0.6 0' },
    { id: 'plus', label: 'Artı', icon: '➕', path: 'M -0.15 -0.5 L 0.15 -0.5 L 0.15 -0.15 L 0.5 -0.15 L 0.5 0.15 L 0.15 0.15 L 0.15 0.5 L -0.15 0.5 L -0.15 0.15 L -0.5 0.15 L -0.5 -0.15 L -0.15 -0.15 Z' },
    { id: 'cross', label: 'Çarpı', icon: '❌', path: 'M -0.4 -0.3 L -0.3 -0.4 L 0 -0.1 L 0.3 -0.4 L 0.4 -0.3 L 0.1 0 L 0.4 0.3 L 0.3 0.4 L 0 0.1 L -0.3 0.4 L -0.4 0.3 L -0.1 0 Z' },
    { id: 'l-shape', label: 'L Köşe', icon: 'L', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 -0.1 L -0.1 -0.1 L -0.1 0.5 L -0.5 0.5 Z' },
    { id: 't-shape', label: 'T Profil', icon: 'T', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 -0.15 L 0.15 -0.15 L 0.15 0.5 L -0.15 0.5 L -0.15 -0.15 L -0.5 -0.15 Z' },
    { id: 'u-shape', label: 'U Profil', icon: '∪', path: 'M -0.5 -0.5 L -0.15 -0.5 L -0.15 0.15 L 0.15 0.15 L 0.15 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z' },
    { id: 'stairs', label: 'Merdiven', icon: '📶', path: 'M -0.5 0.5 L -0.5 -0.5 L -0.2 -0.5 L -0.2 -0.2 L 0.1 -0.2 L 0.1 0.1 L 0.4 0.1 L 0.4 0.5 Z' },
    { id: 'door', label: 'Kapı Yayı', icon: '🚪', path: 'M -0.5 0.5 L -0.5 -0.5 L -0.4 -0.5 L -0.4 0.5 Z M -0.4 -0.5 A 1 1 0 0 1 0.6 0.5 L 0.5 0.5 A 0.9 0.9 0 0 0 -0.4 -0.4 Z' },
    { id: 'arc-wall', label: 'Yay Duvar', icon: '🌈', path: 'M -0.5 0.5 L -0.5 0.2 A 0.5 0.5 0 0 1 0.5 0.2 L 0.5 0.5 L 0.2 0.5 A 0.2 0.2 0 0 0 -0.2 0.5 Z' },
    { id: 'pillar', label: 'Kolon', icon: '🏛️', path: 'M -0.3 -0.5 L 0.3 -0.5 L 0.3 -0.4 L 0.2 -0.4 L 0.2 0.4 L 0.3 0.4 L 0.3 0.5 L -0.3 0.5 L -0.3 0.4 L -0.2 0.4 L -0.2 -0.4 L -0.3 -0.4 Z' },
    { id: 'arrow-up', label: 'İleri Ok', icon: '⬆️', path: 'M -0.15 0.5 L -0.15 -0.1 L -0.4 -0.1 L 0 -0.5 L 0.4 -0.1 L 0.15 -0.1 L 0.15 0.5 Z' },
    { id: 'arrow-down', label: 'Geri Ok', icon: '⬇️', path: 'M -0.15 -0.5 L -0.15 0.1 L -0.4 0.1 L 0 0.5 L 0.4 0.1 L 0.15 0.1 L 0.15 -0.5 Z' },
    { id: 'arrow-left', label: 'Sola Ok', icon: '⬅️', path: 'M 0.5 -0.15 L -0.1 -0.15 L -0.1 -0.4 L -0.5 0 L -0.1 0.4 L -0.1 0.15 L 0.5 0.15 Z' },
    { id: 'arrow-right', label: 'Sağa Ok', icon: '➡️', path: 'M -0.5 -0.15 L 0.1 -0.15 L 0.1 -0.4 L 0.5 0 L 0.1 0.4 L 0.1 0.15 L -0.5 0.15 Z' },
    { id: 'arrow-double-v', label: 'Dikey Çift', icon: '↕️', path: 'M -0.15 -0.2 L -0.4 -0.2 L 0 -0.5 L 0.4 -0.2 L 0.15 -0.2 L 0.15 0.2 L 0.4 0.2 L 0 0.5 L -0.4 0.2 L -0.15 0.2 Z' },
    { id: 'arrow-double-h', label: 'Yatay Çift', icon: '↔️', path: 'M -0.2 -0.15 L -0.2 -0.4 L -0.5 0 L -0.2 0.4 L -0.2 0.15 L 0.2 0.15 L 0.2 0.4 L 0.5 0 L 0.2 -0.4 L 0.2 -0.15 Z' },
    { id: 'chevron-up', label: 'Yön (Chevron)', icon: '⏫', path: 'M -0.5 -0.1 L 0 -0.5 L 0.5 -0.1 L 0.5 0.2 L 0 -0.2 L -0.5 0.2 Z M -0.5 0.2 L 0 -0.2 L 0.5 0.2 L 0.5 0.5 L 0 0.1 L -0.5 0.5 Z' },
    { id: 'u-turn-left', label: 'U Dönüşü', icon: '↩️', path: 'M 0.2 0.5 L 0.2 -0.1 A 0.2 0.2 0 0 0 -0.2 -0.1 L -0.2 0.1 L 0 0.1 L -0.35 0.5 L -0.7 0.1 L -0.5 0.1 L -0.5 -0.1 A 0.5 0.5 0 0 1 0.5 -0.1 L 0.5 0.5 Z' },
    { id: 'curve-arrow', label: 'Dönüş', icon: '⤴️', path: 'M -0.4 0.4 L -0.4 0 A 0.4 0.4 0 0 1 0 -0.4 L 0.1 -0.4 L 0.1 -0.55 L 0.5 -0.25 L 0.1 0.05 L 0.1 -0.1 L 0 -0.1 A 0.1 0.1 0 0 0 -0.1 0 L -0.1 0.4 Z' },
    { id: 'check', label: 'Onay', icon: '✅', path: 'M -0.4 0 L -0.15 0.25 L 0.4 -0.3 L 0.3 -0.4 L -0.15 0.05 L -0.3 -0.1 Z' },
    { id: 'info', label: 'Bilgi', icon: 'ℹ️', path: 'M -0.1 -0.1 L 0.1 -0.1 L 0.1 0.4 L -0.1 0.4 Z M 0 -0.4 A 0.1 0.1 0 1 1 0 -0.2 A 0.1 0.1 0 1 1 0 -0.4 Z' },
    { id: 'warning', label: 'Uyarı', icon: '⚠️', path: 'M 0 -0.5 L 0.45 0.35 L -0.45 0.35 Z M -0.05 -0.1 L 0.05 -0.1 L 0.05 0.15 L -0.05 0.15 Z M -0.05 0.2 L 0.05 0.2 L 0.05 0.3 L -0.05 0.3 Z' },
    { id: 'question', label: 'Soru', icon: '❓', path: 'M -0.1 0.2 L 0.1 0.2 L 0.1 0.4 L -0.1 0.4 Z M -0.2 -0.1 L -0.1 -0.1 C -0.1 0.1 0.1 0.1 0.1 -0.1 C 0.1 -0.3 -0.2 -0.3 -0.2 -0.5 C -0.2 -0.8 0.4 -0.8 0.4 -0.5 L 0.2 -0.5 C 0.2 -0.6 -0.0 -0.6 -0.0 -0.5 C -0.0 -0.4 0.2 -0.3 0.2 -0.1 C 0.2 0.3 -0.2 0.1 -0.2 0.1 Z' },
    { id: 'pause', label: 'Duraklat', icon: '⏸️', path: 'M -0.3 -0.4 L -0.1 -0.4 L -0.1 0.4 L -0.3 0.4 Z M 0.1 -0.4 L 0.3 -0.4 L 0.3 0.4 L 0.1 0.4 Z' },
    { id: 'play', label: 'Oynat', icon: '▶️', path: 'M -0.2 -0.4 L 0.4 0 L -0.2 0.4 Z' },
    { id: 'stop', label: 'Dur', icon: '⏹️', path: 'M -0.4 -0.4 L 0.4 -0.4 L 0.4 0.4 L -0.4 0.4 Z' },
    { id: 'menu', label: 'Menü', icon: '☰', path: 'M -0.4 -0.4 L 0.4 -0.4 L 0.4 -0.2 L -0.4 -0.2 Z M -0.4 -0.1 L 0.4 -0.1 L 0.4 0.1 L -0.4 0.1 Z M -0.4 0.2 L 0.4 0.2 L 0.4 0.4 L -0.4 0.4 Z' },
    { id: 'pin', label: 'Konum/Pin', icon: '📍', path: 'M 0 -0.5 A 0.3 0.3 0 1 1 0 0.1 L 0 0.5 L 0 0.1 A 0.3 0.3 0 1 1 0 -0.5 Z M 0 -0.35 A 0.1 0.1 0 1 0 0 -0.15 A 0.1 0.1 0 1 0 0 -0.35 Z' },
    { id: 'home', label: 'Ev', icon: '🏠', path: 'M 0 -0.5 L 0.5 -0.1 L 0.4 -0.1 L 0.4 0.5 L 0.1 0.5 L 0.1 0.1 L -0.1 0.1 L -0.1 0.5 L -0.4 0.5 L -0.4 -0.1 L -0.5 -0.1 Z' },
    { id: 'flag', label: 'Bayrak', icon: '🚩', path: 'M -0.4 -0.5 L -0.4 0.5 L -0.3 0.5 L -0.3 0 L 0.4 -0.25 L -0.3 -0.5 Z' },
    { id: 'map', label: 'Harita', icon: '🗺️', path: 'M -0.5 -0.4 L -0.2 -0.5 L 0.2 -0.4 L 0.5 -0.5 L 0.5 0.4 L 0.2 0.5 L -0.2 0.4 L -0.5 0.5 Z M -0.2 -0.5 L -0.2 0.4 M 0.2 -0.4 L 0.2 0.5' },
    { id: 'user', label: 'Kullanıcı', icon: '👤', path: 'M 0 -0.4 A 0.2 0.2 0 1 1 0 0 A 0.2 0.2 0 1 1 0 -0.4 Z M -0.4 0.5 A 0.4 0.4 0 0 1 0.4 0.5 L -0.4 0.5 Z' },
    { id: 'heart', label: 'Kalp', icon: '❤️', path: 'M 0 0.2 C 0.1 -0.1 0.5 -0.4 0.5 -0.15 C 0.5 0.1 0.1 0.3 0 0.5 C -0.1 0.3 -0.5 0.1 -0.5 -0.15 C -0.5 -0.4 -0.1 -0.1 0 0.2 Z' },
    { id: 'lightning', label: 'Şimşek', icon: '⚡', path: 'M 0.1 -0.5 L -0.3 0 L 0 0 L -0.1 0.5 L 0.3 0 L 0 0 Z' },
    { id: 'cloud', label: 'Bulut', icon: '☁️', path: 'M -0.2 0.2 L 0.2 0.2 A 0.15 0.15 0 0 0 0.2 -0.1 A 0.2 0.2 0 0 0 -0.2 -0.1 A 0.15 0.15 0 0 0 -0.2 0.2 Z' },
    { id: 'moon', label: 'Hilal', icon: '🌙', path: 'M 0.1 -0.4 A 0.4 0.4 0 1 1 0.1 0.4 A 0.3 0.3 0 1 0 0.1 -0.4 Z' },
    { id: 'sun', label: 'Güneş', icon: '☀️', path: 'M 0 0 m -0.2 0 a 0.2 0.2 0 1 0 0.4 0 a 0.2 0.2 0 1 0 -0.4 0 M 0 -0.3 L 0 -0.45 M 0.21 -0.21 L 0.32 -0.32 M 0.3 0 L 0.45 0 M 0.21 0.21 L 0.32 0.32 M 0 0.3 L 0 0.45 M -0.21 0.21 L -0.32 0.32 M -0.3 0 L -0.45 0 M -0.21 -0.21 L -0.32 -0.32' },
    { id: 'drop', label: 'Su Damlası', icon: '💧', path: 'M 0 -0.5 Q 0.4 0 0.4 0.25 A 0.4 0.4 0 1 1 -0.4 0.25 Q -0.4 0 0 -0.5 Z' },
    { id: 'fire', label: 'Ateş', icon: '🔥', path: 'M 0 -0.5 Q 0.4 0 0.3 0.3 A 0.3 0.3 0 1 1 -0.3 0.3 Q -0.4 0 0 -0.5 Z M 0 0 Q 0.1 0.2 0 0.4 Q -0.1 0.2 0 0 Z' },
    { id: 'leaf', label: 'Yaprak', icon: '🍃', path: 'M -0.4 0.4 Q -0.4 -0.4 0.4 -0.4 Q 0.4 0.4 -0.4 0.4 Z M -0.4 0.4 L 0.2 -0.2' },
    { id: 'box', label: 'Kutu', icon: '📦', path: 'M -0.4 -0.3 L 0.4 -0.3 L 0.4 0.4 L -0.4 0.4 Z M -0.4 -0.3 L -0.5 -0.5 L 0.5 -0.5 L 0.4 -0.3 M 0 -0.3 L 0 0.4' },
    { id: 'lock', label: 'Kilit', icon: '🔒', path: 'M -0.3 0 L 0.3 0 L 0.3 0.5 L -0.3 0.5 Z M -0.2 0 L -0.2 -0.2 A 0.2 0.2 0 1 1 0.2 -0.2 L 0.2 0 Z' },
    { id: 'key', label: 'Anahtar', icon: '🔑', path: 'M -0.3 -0.3 A 0.2 0.2 0 1 1 -0.1 -0.1 L 0.4 0.4 L 0.4 0.5 L 0.3 0.5 L 0.3 0.4 L 0.2 0.4 L 0.2 0.3 L -0.1 -0.1 Z M -0.25 -0.25 A 0.05 0.05 0 1 0 -0.2 -0.2 Z' },
    { id: 'tool', label: 'Tamir/Ayarlar', icon: '🔧', path: 'M -0.4 -0.2 L -0.2 -0.4 L 0.4 0.2 L 0.2 0.4 Z M -0.5 -0.5 L -0.3 -0.5 L -0.3 -0.3 L -0.5 -0.3 Z' },
    { id: 'camera', label: 'Kamera', icon: '📷', path: 'M -0.4 -0.2 L -0.1 -0.2 L 0 -0.3 L 0.3 -0.3 L 0.4 -0.2 L 0.4 0.3 L -0.4 0.3 Z M 0 0.05 A 0.15 0.15 0 1 0 0 0.06 Z' },
    { id: 'mail', label: 'Mektup', icon: '✉️', path: 'M -0.5 -0.3 L 0.5 -0.3 L 0.5 0.3 L -0.5 0.3 Z M -0.5 -0.3 L 0 0.1 L 0.5 -0.3' },
    { id: 'bubble', label: 'Balon', icon: '💬', path: 'M -0.5 -0.3 L 0.5 -0.3 L 0.5 0.2 L 0.1 0.2 L -0.2 0.5 L -0.2 0.2 L -0.5 0.2 Z' }
];

// --- STATE ---
const route = useRoute();
const shareToken = route.params.token as string;
const canvasRef = ref<HTMLCanvasElement | null>(null);

const isLoading = ref(true);
const isExporting = ref(false);

const showSidebar = ref(true);

const sceneData = ref<ARSceneDto | null>(null);
const sceneItems = ref<SceneItemDto[]>([]);
const isIOSDevice = () => {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
        || /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isAndroidDevice = () => {
    return /Android/.test(navigator.userAgent);
};

const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

const mouseStart = new THREE.Vector2();

// --- Three.js Globals ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let orbit: OrbitControls;
let transformControl: TransformControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2 = new THREE.Vector2();
let animationId: number;

const itemsMap = new Map<number, THREE.Object3D>();

// --- LIFECYCLE ---
onMounted(async () => {
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    setTimeout(() => {
        window.scrollTo(0, 1);
    }, 100);

    if (window.innerWidth < 768) {
        showSidebar.value = false;
    }

    if (!shareToken) {
        console.error("Token bulunamadı!");
        isLoading.value = false;
        return;
    }

    try {
        await loadSceneData();
        await nextTick();
        initThreeJS();
        await loadSceneObjects();
    } catch (error) {
        console.error("Başlatma hatası:", error);
    } finally {
        isLoading.value = false;
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);

    cancelAnimationFrame(animationId);
    renderer?.dispose();
    if (transformControl) {
        transformControl.detach();
        transformControl.dispose();
    }
    window.removeEventListener('resize', handleResize);
});

// --- API ---
const loadSceneData = async () => {
    sceneData.value = await arSceneService.getSharedScene(shareToken);
    sceneItems.value = sceneData.value.items;
};

// --- YARDIMCI: Grid Texture & Floor Generation (Orjinal kod ile aynı) ---
const createGridTexture = () => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    return texture;
};

const createPerimeterMaterial = async (layer: any) => {
    if (layer.textureUrl) {
        const loader = new TextureLoader();
        try {
            const texture = await loader.loadAsync(layer.textureUrl);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.flipY = false;

            const scale = layer.textureScale || 1;
            texture.repeat.set(scale * 0.5, scale * 0.5);

            return new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.9,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
        } catch (error) {
            console.warn("Doku yüklenemedi, renk kullanılıyor:", error);
            return new THREE.MeshStandardMaterial({
                color: layer.color || '#94a3b8',
                roughness: 0.8,
                metalness: 0.1
            });
        }
    }
    else {
        return new THREE.MeshStandardMaterial({
            color: layer.color || '#94a3b8',
            roughness: 0.8,
            metalness: 0.1
        });
    }
};

const buildPerimeterLayers = async (targetScene: THREE.Scene, settings: any) => {
    const layers = settings.perimeterLayers || [];
    if (layers.length === 0) return;

    let basePoints: { x: number, z: number }[] = [];

    if (settings.floorType === 'custom' && Array.isArray(settings.floorPoints) && settings.floorPoints.length > 2) {
        basePoints = settings.floorPoints.map((p: any) => ({ x: Number(p.x), z: Number(p.z) }));
    } else {
        const w = Number(settings.width) || 5;
        const d = Number(settings.depth) || 4;
        basePoints = [
            { x: 0, z: 0 },
            { x: w, z: 0 },
            { x: w, z: d },
            { x: 0, z: d }
        ];
    }

    const tempShape = new THREE.Shape();
    const tp0 = basePoints[0];
    if (tp0) {
        tempShape.moveTo(tp0.x, -tp0.z);
        for (let i = 1; i < basePoints.length; i++) {
            const tp = basePoints[i];
            if (tp) tempShape.lineTo(tp.x, -tp.z);
        }
    }
    const tempGeom = new THREE.ShapeGeometry(tempShape);
    tempGeom.computeBoundingBox();
    const center = new THREE.Vector3();
    if (tempGeom.boundingBox) tempGeom.boundingBox.getCenter(center);

    const perimeterGroup = new THREE.Group();
    perimeterGroup.name = "GeneratedPerimeterGroup";
    perimeterGroup.position.x = -center.x;
    perimeterGroup.position.z = center.y;

    let currentInnerBoundary = [...basePoints];

    for (let index = 0; index < layers.length; index++) {
        const layer = layers[index];
        const currentOuterBoundary = offsetPolygon(currentInnerBoundary, Number(layer.width));
        if (!currentOuterBoundary || currentOuterBoundary.length < 3) continue;

        const shape = new THREE.Shape();
        const p0 = currentOuterBoundary[0];
        if (p0) shape.moveTo(p0.x, -p0.z);
        for (let i = 1; i < currentOuterBoundary.length; i++) {
            const p = currentOuterBoundary[i];
            if (p) shape.lineTo(p.x, -p.z);
        }
        shape.closePath();

        const holePath = new THREE.Path();
        const h0 = currentInnerBoundary[0];
        if (h0) holePath.moveTo(h0.x, -h0.z);
        for (let i = 1; i < currentInnerBoundary.length; i++) {
            const hp = currentInnerBoundary[i];
            if (hp) holePath.lineTo(hp.x, -hp.z);
        }
        holePath.closePath();
        shape.holes.push(holePath);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: Number(layer.height),
            bevelEnabled: false
        });

        const material = await createPerimeterMaterial(layer);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = layer.elevation ? Number(layer.elevation) : 0;
        mesh.renderOrder = index + 1;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        perimeterGroup.add(mesh);
        currentInnerBoundary = currentOuterBoundary;
    }

    targetScene.add(perimeterGroup);
};


// =======================================================
// EXPORT & CONVERT (Viewers can also export usually)
// =======================================================
const getSceneAsBlob = async (): Promise<Blob> => {
    if (!scene) throw new Error("Sahne bulunamadı");

    const exporter = new GLTFExporter();
    const settings = sceneData.value?.settings || {};

    const controlsObj = transformControl as unknown as THREE.Object3D;
    controlsObj.visible = false;

    const gridMesh = scene.getObjectByName("GridMesh");
    if (gridMesh) gridMesh.visible = false;

    const baseFloor = scene.getObjectByName("BaseFloor");
    const floorGroup = baseFloor?.parent;
    if (floorGroup) {
        floorGroup.children.forEach((child) => {
            if (child.name !== "BaseFloor" && child.name !== "GridMesh") {
                child.position.z = -child.position.z;
            }
        });
    }

    await buildPerimeterLayers(scene, settings);

    const options = {
        binary: true,
        onlyVisible: true,
        maxTextureSize: 1024
    };

    return new Promise((resolve, reject) => {
        exporter.parse(
            scene,
            (gltf) => {
                const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
                restoreSceneState(controlsObj, gridMesh, floorGroup);
                resolve(blob);
            },
            (error) => {
                restoreSceneState(controlsObj, gridMesh, floorGroup);
                reject(error);
            },
            options
        );
    });
};

const restoreSceneState = (
    controls: THREE.Object3D,
    grid: THREE.Object3D | undefined | null,
    floorGroup: THREE.Object3D | undefined | null
) => {
    controls.visible = true;
    if (grid) grid.visible = true;

    const generatedPerimeter = scene.getObjectByName("GeneratedPerimeterGroup");
    if (generatedPerimeter) {
        scene.remove(generatedPerimeter);
        generatedPerimeter.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).geometry.dispose();
            }
        });
    }

    if (floorGroup) {
        scene.remove(floorGroup);
    }

    initThreeJS();
    loadSceneObjects();
};

const handleViewInAR = async () => {
    const isIOS = isIOSDevice();
    const isAndroid = isAndroidDevice();

    if (!isIOS && !isAndroid) {
        alert("AR deneyimi yalnızca mobil cihazlarda (iPhone, iPad ve Android) çalışır. Lütfen sayfayı telefonunuzdan açın.");
        return;
    }

    if (isExporting.value) return;
    isExporting.value = true;

    try {
        const glbBlob = await getSceneAsBlob();
        const fileName = sceneData.value?.name || 'sahne';
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (isIOS) {
            console.log("🍏 iOS Cihazı Algılandı - USDZ dönüşümü başlatılıyor...");
            await convertAndDownloadUsdz(glbBlob, safeFileName);
        }
        else if (isAndroid) {
            console.log("🤖 Android Cihazı Algılandı - GLB indiriliyor...");
            triggerDownload(glbBlob, `${safeFileName}.glb`);
        }

    } catch (error) {
        console.error("AR Export hatası:", error);
        alert("AR Görüntüleme başlatılamadı: " + error);
    } finally {
        isExporting.value = false;
    }
};

const convertAndDownloadUsdz = async (glbBlob: Blob, baseName: string) => {
    const data = await arModelService.convertSharedGlbToUsdz(glbBlob, `${baseName}.glb`);

    if (data.usdz && data.usdz.url) {
        const downloadUrl = arModelService.getPreviewUrl(data.usdz.url);

        const link = document.createElement('a');
        link.setAttribute('rel', 'ar');
        link.href = downloadUrl;
        link.download = `${baseName}.usdz`;

        document.body.appendChild(link);

        const img = document.createElement('img');
        link.appendChild(img);

        link.click();
        document.body.removeChild(link);
    } else {
        throw new Error("Sunucudan USDZ linki alınamadı.");
    }
};

const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};


// =======================================================
// THREE.JS INIT
// =======================================================
const initThreeJS = async () => {
    if (!canvasRef.value) return;

    const settings = sceneData.value?.settings || {};
    const sceneWidth = settings.width || 20;
    const sceneDepth = settings.depth || 20;
    const bgColor = settings.backgroundColor || '#e5e7eb';
    const floorColor = settings.floorColor || '#ffffff';
    const floorType = settings.floorType || 'rectangle';
    const floorTextureUrl = settings.floorTextureUrl;
    const floorLayers = settings.floorLayers || [];
    const points = settings.floorPoints || [];
    const texScale = settings.textureScale || 1;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    const maxDim = Math.max(sceneWidth, sceneDepth);
    scene.fog = new THREE.Fog(bgColor, 60, maxDim * 16);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    const d = maxDim * 1.2;
    dirLight.shadow.camera.left = -d; dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d; dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    // --- ZEMİN ---
    let geometry: THREE.BufferGeometry;
    if (floorType === 'custom' && points.length > 2) {
        const shape = new THREE.Shape();
        const p0 = points[0];
        if (p0) shape.moveTo(p0.x, p0.z);
        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            if (p) shape.lineTo(p.x, p.z);
        }
        shape.closePath();
        geometry = new THREE.ShapeGeometry(shape);
    } else {
        geometry = new THREE.PlaneGeometry(sceneWidth, sceneDepth);
        geometry.translate(sceneWidth / 2, sceneDepth / 2, 0);
    }

    geometry.computeBoundingBox();
    const centerOffset = new THREE.Vector3();
    if (geometry.boundingBox) geometry.boundingBox.getCenter(centerOffset);
    geometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);

    // UV Map
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const posAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const uvAttribute = geometry.attributes.uv as THREE.BufferAttribute;
    if (posAttribute && uvAttribute) {
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const y = posAttribute.getY(i);
            const u = (x - box.min.x);
            const v = (y - box.min.y);
            uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
    }

    const baseMaterialParams = {
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits: 2,
        depthWrite: false,
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp
    };

    let baseMaterial: THREE.MeshStandardMaterial;
    if (floorTextureUrl) {
        const loader = new TextureLoader();
        const texture = loader.load(floorTextureUrl);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        const safeScale = texScale > 0 ? texScale : 1;
        const repeatFactor = 1 / safeScale;
        texture.repeat.set(repeatFactor, repeatFactor);
        texture.colorSpace = THREE.SRGBColorSpace;
        baseMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            ...baseMaterialParams
        });
    } else {
        baseMaterial = new THREE.MeshStandardMaterial({
            color: floorColor,
            ...baseMaterialParams
        });
    }

    const baseMesh = new THREE.Mesh(geometry, baseMaterial);
    baseMesh.receiveShadow = true;
    baseMesh.name = "BaseFloor";
    baseMesh.renderOrder = 0;

    const gridTexture = createGridTexture();
    if (gridTexture) gridTexture.repeat.set(1, 1);
    const gridMaterial = new THREE.MeshBasicMaterial({
        map: gridTexture,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });
    const gridMesh = new THREE.Mesh(geometry, gridMaterial);
    gridMesh.name = "GridMesh";
    gridMesh.visible = settings.gridVisible !== false;
    gridMesh.renderOrder = 999;

    const floorGroup = new THREE.Group();
    floorGroup.add(baseMesh);
    floorGroup.add(gridMesh);

    if (floorLayers.length > 0) {
        const sortedLayers = [...floorLayers].sort((a, b) => a.zIndex - b.zIndex);
        const svgLoader = new SVGLoader();

        sortedLayers.forEach((layer, index) => {
            const shapeDef = SHAPE_LIBRARY.find(s => s.id === layer.shapeId) || SHAPE_LIBRARY[0];
            if (!shapeDef) return;

            const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${shapeDef.path}" /></svg>`;
            const shapeData = svgLoader.parse(svgMarkup);
            if (!shapeData.paths || shapeData.paths.length === 0) return;

            const shapes: THREE.Shape[] = [];
            shapeData.paths.forEach((path) => {
                const pathShapes = path.toShapes(true);
                shapes.push(...pathShapes);
            });
            if (shapes.length === 0) return;

            const layerGeo = new THREE.ShapeGeometry(shapes);
            layerGeo.computeBoundingBox();
            const center = new THREE.Vector3();
            if (layerGeo.boundingBox) layerGeo.boundingBox.getCenter(center);
            layerGeo.translate(-center.x, -center.y, -center.z);

            const layerMat = new THREE.MeshBasicMaterial({
                color: layer.color,
                transparent: true,
                opacity: layer.opacity !== undefined ? layer.opacity : 1,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: true,
                stencilWrite: true,
                stencilRef: 1,
                stencilFunc: THREE.EqualStencilFunc,
            });

            const layerMesh = new THREE.Mesh(layerGeo, layerMat);
            layerMesh.scale.set(layer.width, layer.height, 1);
            const correctedX = layer.x - centerOffset.x;
            const correctedZ = layer.z - centerOffset.y;
            const zFightOffset = 0.005 * (index + 1);
            layerMesh.position.set(correctedX, correctedZ, zFightOffset);
            layerMesh.renderOrder = layer.zIndex;
            layerMesh.rotation.z = -layer.rotation;
            floorGroup.add(layerMesh);
        });
    }

    floorGroup.rotation.x = Math.PI / 2;
    scene.add(floorGroup);

    await buildPerimeterLayers(scene, settings);

    // [GÜNCELLEME]: Canvas boyutunu doğru elementten al
    const width = canvasRef.value.clientWidth;
    const height = canvasRef.value.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const camDist = maxDim * 1.5;
    camera.position.set(camDist, camDist, camDist);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.value,
        antialias: true,
        stencil: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.maxPolarAngle = Math.PI / 2 - 0.05;

    // [GÜNCELLEME]: Transform Controls (Yetki Kontrollü)
    transformControl = markRaw(new TransformControls(camera, renderer.domElement));
    transformControl.enabled = false;

    scene.add(transformControl.getHelper());

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvasRef.value.addEventListener('mousedown', onMouseDown);
    canvasRef.value.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', handleResize);

    animate();
};

const handleResize = () => {
    if (!canvasRef.value || !camera || !renderer) return;

    setViewportHeight();

    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

const animate = () => {
    animationId = requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
};

// --- MODEL İŞLEMLERİ ---
const loadSceneObjects = async () => {
    if (!sceneData.value) return;
    const loader = new GLTFLoader();

    for (const item of sceneData.value.items) {
        try {
            // BURASI KRİTİK: getModelFileBlob yerine getSharedModelBlob kullanıyoruz
            const blob = await arSceneService.getSharedModelBlob(shareToken, item.model.id);
            const url = URL.createObjectURL(blob);

            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;

            // ... Materyal ve Transform işlemleri (Aynı kalacak) ...
            if (item.materialConfig) {
                applyMaterialConfig(model, item.materialConfig);
            }

            // Gölge Ayarları
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const pos = item.position;
            const rot = item.rotation;
            const scl = item.scale;

            model.position.set(pos.x, pos.y, pos.z);
            model.rotation.set(rot.x, rot.y, rot.z);
            model.scale.set(scl.x, scl.y, scl.z);

            model.userData = { isSceneItem: true, itemId: item.id };
            scene.add(model);
            itemsMap.set(item.id, model);

            // URL'i temizle
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error(`Item ${item.id} yüklenemedi:`, err);
        }
    }
};

const applyMaterialConfig = (model: THREE.Group, materialConfig: any) => {
    model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const config = materialConfig?.[mesh.name];
            if (config) {
                let material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                if (material) {
                    material = material.clone();
                    if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                        const stdMat = material as THREE.MeshStandardMaterial;
                        if (config.color) stdMat.color.set(config.color);
                        if (config.metalness !== undefined) stdMat.metalness = config.metalness;
                        if (config.roughness !== undefined) stdMat.roughness = config.roughness;
                    }
                    mesh.material = material;
                }
            }
        }
    });
};

// --- ETKİLEŞİM ---
const onMouseDown = (event: MouseEvent) => {
    mouseStart.set(event.clientX, event.clientY);
};

const onMouseUp = (event: MouseEvent) => {
    if (!canvasRef.value) return;
    const distance = mouseStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (distance > 10) return;

    const rect = canvasRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
};

</script>

<style scoped>
/* ✅ Mobil viewport height düzeltmesi */
.mobile-vh {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
    min-height: -webkit-fill-available;
}

/* Modern tarayıcılar için dynamic viewport height desteği */
@supports (height: 100dvh) {
    .mobile-vh {
        height: 100dvh;
    }
}

/* ✅ AR butonu için safe area ve dinamik bottom pozisyonlama */
.ar-button-container {
    bottom: 2rem;
    bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom)));
    padding-bottom: env(safe-area-inset-bottom, 0);
}

/* iOS notch/home indicator desteği */
@supports (padding: max(0px)) {
    .ar-button-container {
        padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
    }
}

/* Tablet ve büyük ekranlar için ek margin */
@media (min-width: 768px) {
    .ar-button-container {
        bottom: 3rem;
    }
}

/* Landscape mode için özel ayar */
@media (orientation: landscape) and (max-height: 500px) {
    .ar-button-container {
        bottom: 1rem;
    }
}

/* Canvas touch optimize */
canvas {
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
}

/* 🆕 EKLE: Body overflow kontrolü (mobil için) */
:global(body) {
    overflow: hidden;
    background-color: #111827;
    position: fixed;
    /* iOS Safari için */
    width: 100%;
    height: 100%;
}

/* Orijinal CSS Aynen Kalmalı */
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

.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateX(-20px);
    opacity: 0;
}

.animate-fade-in-up {
    animation: fadeInUp 0.2s ease-out forwards;
}

.animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>