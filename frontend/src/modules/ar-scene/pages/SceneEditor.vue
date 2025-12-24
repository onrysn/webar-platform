<template>
    <div class="flex h-screen overflow-hidden bg-gray-100 text-gray-900">

        <div class="w-80 flex flex-col border-r border-gray-300 bg-white shadow-lg z-10">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 class="font-bold text-gray-800 truncate w-32" :title="sceneData?.name">
                        {{ sceneData?.name || 'Yükleniyor...' }}
                    </h2>
                    <p v-if="sceneData?.settings" class="text-[10px] text-gray-500">
                        {{ sceneData.settings.width }}m x {{ sceneData.settings.depth }}m
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <div class="relative">
                        <button @click="showDownloadMenu = !showDownloadMenu"
                            :disabled="isExporting"
                            class="text-xs flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50">
                            <svg v-if="!isExporting" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <svg v-else class="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ isExporting ? 'Hazırlanıyor...' : 'İndir' }}
                        </button>

                        <div v-if="showDownloadMenu" 
                             class="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col py-1">
                            <button @click="handleExport('glb')" class="text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700 w-full">
                                .GLB (Android)
                            </button>
                            <button @click="handleExport('usdz')" class="text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700 w-full">
                                .USDZ (iOS)
                            </button>
                        </div>
                        
                        <div v-if="showDownloadMenu" @click="showDownloadMenu = false" class="fixed inset-0 z-40 cursor-default"></div>
                    </div>

                    <button @click="$router.back()"
                        class="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors">Çıkış</button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                <div v-if="sceneItems.length === 0" class="text-center text-xs text-gray-400 mt-4">
                    Henüz model eklenmedi.
                </div>
                <div v-for="item in sceneItems" :key="item.id" @click="selectItemFromTree(item.id)"
                    class="p-2 rounded cursor-pointer flex justify-between items-center group transition-all border border-transparent"
                    :class="selectedItemId === item.id ? 'bg-blue-100 border-blue-300 text-blue-700' : 'hover:bg-gray-100 hover:border-gray-200'">
                    <span class="text-sm truncate font-medium">{{ item.name || item.model.fileName }}</span>
                    <button @click.stop="deleteItem(item.id)"
                        class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="p-4 border-t border-gray-200 bg-gray-50">
                <button @click="showModelSelector = true"
                    class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clip-rule="evenodd" />
                    </svg>
                    Model Ekle
                </button>
            </div>
        </div>

        <div class="flex-1 relative bg-gray-200">
            <canvas ref="canvasRef" class="w-full h-full block outline-none"></canvas>

            <div v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p class="text-gray-600 font-medium">Sahne Hazırlanıyor...</p>
                </div>
            </div>

            <div
                class="absolute top-4 left-4 bg-white/90 border border-gray-200 p-3 rounded-lg shadow-md text-xs text-gray-600 pointer-events-none select-none">
                <p class="font-bold text-gray-800 mb-1">Kontroller</p>
                <p>Sol Tık: Seç / Çevir</p>
                <p>Sağ Tık: Kaydır</p>
                <div class="border-t border-gray-200 my-1"></div>
                <p>Modlar: <b>W</b>: Taşı | <b>E</b>: Döndür | <b>R</b>: Ölçekle</p>
            </div>
        </div>

        <div v-if="showModelSelector"
            class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                class="bg-white text-gray-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold text-lg text-gray-800">Kütüphaneden Model Seç</h3>
                    <button @click="showModelSelector = false"
                        class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50">
                    <div v-for="model in availableModels" :key="model.id" @click="addModelToScene(model)"
                        class="bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                        <div
                            class="aspect-square bg-gray-100 rounded mb-2 overflow-hidden flex items-center justify-center relative">
                            <img v-if="model.thumbnailPath" :src="getThumbnailUrl(model.thumbnailPath)"
                                class="w-full h-full object-cover">
                            <div v-else class="text-gray-400 text-xs font-medium">Görsel Yok</div>
                        </div>
                        <p class="text-xs font-semibold truncate text-gray-700">{{ model.fileName }}</p>
                    </div>
                </div>
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
import type { ARModelDto } from '../../ar-model/dto/arModel.dto';
import { offsetPolygon } from '../../../utils/mathUtils';

// --- CONSTANTS: SHAPE LIBRARY ---
const SHAPE_LIBRARY = [
    // ==========================================
    // 1. TEMEL GEOMETRİ (BASIC GEOMETRY)
    // ==========================================
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

    // ==========================================
    // 2. MİMARİ & YAPI (ARCHITECTURE)
    // ==========================================
    { id: 'l-shape', label: 'L Köşe', icon: 'L', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 -0.1 L -0.1 -0.1 L -0.1 0.5 L -0.5 0.5 Z' },
    { id: 't-shape', label: 'T Profil', icon: 'T', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 -0.15 L 0.15 -0.15 L 0.15 0.5 L -0.15 0.5 L -0.15 -0.15 L -0.5 -0.15 Z' },
    { id: 'u-shape', label: 'U Profil', icon: '∪', path: 'M -0.5 -0.5 L -0.15 -0.5 L -0.15 0.15 L 0.15 0.15 L 0.15 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z' },
    { id: 'stairs', label: 'Merdiven', icon: '📶', path: 'M -0.5 0.5 L -0.5 -0.5 L -0.2 -0.5 L -0.2 -0.2 L 0.1 -0.2 L 0.1 0.1 L 0.4 0.1 L 0.4 0.5 Z' },
    { id: 'door', label: 'Kapı Yayı', icon: '🚪', path: 'M -0.5 0.5 L -0.5 -0.5 L -0.4 -0.5 L -0.4 0.5 Z M -0.4 -0.5 A 1 1 0 0 1 0.6 0.5 L 0.5 0.5 A 0.9 0.9 0 0 0 -0.4 -0.4 Z' },
    { id: 'arc-wall', label: 'Yay Duvar', icon: '🌈', path: 'M -0.5 0.5 L -0.5 0.2 A 0.5 0.5 0 0 1 0.5 0.2 L 0.5 0.5 L 0.2 0.5 A 0.2 0.2 0 0 0 -0.2 0.5 Z' },
    { id: 'pillar', label: 'Kolon', icon: '🏛️', path: 'M -0.3 -0.5 L 0.3 -0.5 L 0.3 -0.4 L 0.2 -0.4 L 0.2 0.4 L 0.3 0.4 L 0.3 0.5 L -0.3 0.5 L -0.3 0.4 L -0.2 0.4 L -0.2 -0.4 L -0.3 -0.4 Z' },

    // ==========================================
    // 3. YÖNLENDİRME & OKLAR (ARROWS)
    // ==========================================
    { id: 'arrow-up', label: 'İleri Ok', icon: '⬆️', path: 'M -0.15 0.5 L -0.15 -0.1 L -0.4 -0.1 L 0 -0.5 L 0.4 -0.1 L 0.15 -0.1 L 0.15 0.5 Z' },
    { id: 'arrow-down', label: 'Geri Ok', icon: '⬇️', path: 'M -0.15 -0.5 L -0.15 0.1 L -0.4 0.1 L 0 0.5 L 0.4 0.1 L 0.15 0.1 L 0.15 -0.5 Z' },
    { id: 'arrow-left', label: 'Sola Ok', icon: '⬅️', path: 'M 0.5 -0.15 L -0.1 -0.15 L -0.1 -0.4 L -0.5 0 L -0.1 0.4 L -0.1 0.15 L 0.5 0.15 Z' },
    { id: 'arrow-right', label: 'Sağa Ok', icon: '➡️', path: 'M -0.5 -0.15 L 0.1 -0.15 L 0.1 -0.4 L 0.5 0 L 0.1 0.4 L 0.1 0.15 L -0.5 0.15 Z' },
    { id: 'arrow-double-v', label: 'Dikey Çift', icon: '↕️', path: 'M -0.15 -0.2 L -0.4 -0.2 L 0 -0.5 L 0.4 -0.2 L 0.15 -0.2 L 0.15 0.2 L 0.4 0.2 L 0 0.5 L -0.4 0.2 L -0.15 0.2 Z' },
    { id: 'arrow-double-h', label: 'Yatay Çift', icon: '↔️', path: 'M -0.2 -0.15 L -0.2 -0.4 L -0.5 0 L -0.2 0.4 L -0.2 0.15 L 0.2 0.15 L 0.2 0.4 L 0.5 0 L 0.2 -0.4 L 0.2 -0.15 Z' },
    { id: 'chevron-up', label: 'Yön (Chevron)', icon: '⏫', path: 'M -0.5 -0.1 L 0 -0.5 L 0.5 -0.1 L 0.5 0.2 L 0 -0.2 L -0.5 0.2 Z M -0.5 0.2 L 0 -0.2 L 0.5 0.2 L 0.5 0.5 L 0 0.1 L -0.5 0.5 Z' },
    { id: 'u-turn-left', label: 'U Dönüşü', icon: '↩️', path: 'M 0.2 0.5 L 0.2 -0.1 A 0.2 0.2 0 0 0 -0.2 -0.1 L -0.2 0.1 L 0 0.1 L -0.35 0.5 L -0.7 0.1 L -0.5 0.1 L -0.5 -0.1 A 0.5 0.5 0 0 1 0.5 -0.1 L 0.5 0.5 Z' },
    { id: 'curve-arrow', label: 'Dönüş', icon: '⤴️', path: 'M -0.4 0.4 L -0.4 0 A 0.4 0.4 0 0 1 0 -0.4 L 0.1 -0.4 L 0.1 -0.55 L 0.5 -0.25 L 0.1 0.05 L 0.1 -0.1 L 0 -0.1 A 0.1 0.1 0 0 0 -0.1 0 L -0.1 0.4 Z' },

    // ==========================================
    // 4. ARAYÜZ & İKONLAR (UI & ICONS)
    // ==========================================
    { id: 'check', label: 'Onay', icon: '✅', path: 'M -0.4 0 L -0.15 0.25 L 0.4 -0.3 L 0.3 -0.4 L -0.15 0.05 L -0.3 -0.1 Z' },
    { id: 'info', label: 'Bilgi', icon: 'ℹ️', path: 'M -0.1 -0.1 L 0.1 -0.1 L 0.1 0.4 L -0.1 0.4 Z M 0 -0.4 A 0.1 0.1 0 1 1 0 -0.2 A 0.1 0.1 0 1 1 0 -0.4 Z' },
    { id: 'warning', label: 'Uyarı', icon: '⚠️', path: 'M 0 -0.5 L 0.45 0.35 L -0.45 0.35 Z M -0.05 -0.1 L 0.05 -0.1 L 0.05 0.15 L -0.05 0.15 Z M -0.05 0.2 L 0.05 0.2 L 0.05 0.3 L -0.05 0.3 Z' },
    { id: 'question', label: 'Soru', icon: '❓', path: 'M -0.1 0.2 L 0.1 0.2 L 0.1 0.4 L -0.1 0.4 Z M -0.2 -0.1 L -0.1 -0.1 C -0.1 0.1 0.1 0.1 0.1 -0.1 C 0.1 -0.3 -0.2 -0.3 -0.2 -0.5 C -0.2 -0.8 0.4 -0.8 0.4 -0.5 L 0.2 -0.5 C 0.2 -0.6 -0.0 -0.6 -0.0 -0.5 C -0.0 -0.4 0.2 -0.3 0.2 -0.1 C 0.2 0.3 -0.2 0.1 -0.2 0.1 Z' },
    { id: 'pause', label: 'Duraklat', icon: '⏸️', path: 'M -0.3 -0.4 L -0.1 -0.4 L -0.1 0.4 L -0.3 0.4 Z M 0.1 -0.4 L 0.3 -0.4 L 0.3 0.4 L 0.1 0.4 Z' },
    { id: 'play', label: 'Oynat', icon: '▶️', path: 'M -0.2 -0.4 L 0.4 0 L -0.2 0.4 Z' },
    { id: 'stop', label: 'Dur', icon: '⏹️', path: 'M -0.4 -0.4 L 0.4 -0.4 L 0.4 0.4 L -0.4 0.4 Z' },
    { id: 'menu', label: 'Menü', icon: '☰', path: 'M -0.4 -0.4 L 0.4 -0.4 L 0.4 -0.2 L -0.4 -0.2 Z M -0.4 -0.1 L 0.4 -0.1 L 0.4 0.1 L -0.4 0.1 Z M -0.4 0.2 L 0.4 0.2 L 0.4 0.4 L -0.4 0.4 Z' },

    // ==========================================
    // 5. YER & LOKASYON (LOCATION)
    // ==========================================
    { id: 'pin', label: 'Konum/Pin', icon: '📍', path: 'M 0 -0.5 A 0.3 0.3 0 1 1 0 0.1 L 0 0.5 L 0 0.1 A 0.3 0.3 0 1 1 0 -0.5 Z M 0 -0.35 A 0.1 0.1 0 1 0 0 -0.15 A 0.1 0.1 0 1 0 0 -0.35 Z' },
    { id: 'home', label: 'Ev', icon: '🏠', path: 'M 0 -0.5 L 0.5 -0.1 L 0.4 -0.1 L 0.4 0.5 L 0.1 0.5 L 0.1 0.1 L -0.1 0.1 L -0.1 0.5 L -0.4 0.5 L -0.4 -0.1 L -0.5 -0.1 Z' },
    { id: 'flag', label: 'Bayrak', icon: '🚩', path: 'M -0.4 -0.5 L -0.4 0.5 L -0.3 0.5 L -0.3 0 L 0.4 -0.25 L -0.3 -0.5 Z' },
    { id: 'map', label: 'Harita', icon: '🗺️', path: 'M -0.5 -0.4 L -0.2 -0.5 L 0.2 -0.4 L 0.5 -0.5 L 0.5 0.4 L 0.2 0.5 L -0.2 0.4 L -0.5 0.5 Z M -0.2 -0.5 L -0.2 0.4 M 0.2 -0.4 L 0.2 0.5' },

    // ==========================================
    // 6. GÜNLÜK NESNELER & EMOJİLER (OBJECTS)
    // ==========================================
    { id: 'user', label: 'Kullanıcı', icon: '👤', path: 'M 0 -0.4 A 0.2 0.2 0 1 1 0 0 A 0.2 0.2 0 1 1 0 -0.4 Z M -0.4 0.5 A 0.4 0.4 0 0 1 0.4 0.5 L -0.4 0.5 Z' },
    { id: 'heart', label: 'Kalp', icon: '❤️', path: 'M 0 0.2 C 0.1 -0.1 0.5 -0.4 0.5 -0.15 C 0.5 0.1 0.1 0.3 0 0.5 C -0.1 0.3 -0.5 0.1 -0.5 -0.15 C -0.5 -0.4 -0.1 -0.1 0 0.2 Z' },
    { id: 'lightning', label: 'Şimşek', icon: '⚡', path: 'M 0.1 -0.5 L -0.3 0 L 0 0 L -0.1 0.5 L 0.3 0 L 0 0 Z' },
    { id: 'cloud', label: 'Bulut', icon: '☁️', path: 'M -0.2 0.2 L 0.2 0.2 A 0.15 0.15 0 0 0 0.2 -0.1 A 0.2 0.2 0 0 0 -0.2 -0.1 A 0.15 0.15 0 0 0 -0.2 0.2 Z' },
    { id: 'moon', label: 'Hilal', icon: '🌙', path: 'M 0.1 -0.4 A 0.4 0.4 0 1 1 0.1 0.4 A 0.3 0.3 0 1 0 0.1 -0.4 Z' },
    { id: 'sun', label: 'Güneş', icon: '☀️', path: 'M 0 0 m -0.2 0 a 0.2 0.2 0 1 0 0.4 0 a 0.2 0.2 0 1 0 -0.4 0 M 0 -0.3 L 0 -0.45 M 0.21 -0.21 L 0.32 -0.32 M 0.3 0 L 0.45 0 M 0.21 0.21 L 0.32 0.32 M 0 0.3 L 0 0.45 M -0.21 0.21 L -0.32 0.32 M -0.3 0 L -0.45 0 M -0.21 -0.21 L -0.32 -0.32' }, // Rays as lines, SVG loader handles strokes if specified or simplified
    { id: 'drop', label: 'Su Damlası', icon: '💧', path: 'M 0 -0.5 Q 0.4 0 0.4 0.25 A 0.4 0.4 0 1 1 -0.4 0.25 Q -0.4 0 0 -0.5 Z' },
    { id: 'fire', label: 'Ateş', icon: '🔥', path: 'M 0 -0.5 Q 0.4 0 0.3 0.3 A 0.3 0.3 0 1 1 -0.3 0.3 Q -0.4 0 0 -0.5 Z M 0 0 Q 0.1 0.2 0 0.4 Q -0.1 0.2 0 0 Z' },
    { id: 'leaf', label: 'Yaprak', icon: '🍃', path: 'M -0.4 0.4 Q -0.4 -0.4 0.4 -0.4 Q 0.4 0.4 -0.4 0.4 Z M -0.4 0.4 L 0.2 -0.2' },
    { id: 'box', label: 'Kutu', icon: '📦', path: 'M -0.4 -0.3 L 0.4 -0.3 L 0.4 0.4 L -0.4 0.4 Z M -0.4 -0.3 L -0.5 -0.5 L 0.5 -0.5 L 0.4 -0.3 M 0 -0.3 L 0 0.4' },
    { id: 'lock', label: 'Kilit', icon: '🔒', path: 'M -0.3 0 L 0.3 0 L 0.3 0.5 L -0.3 0.5 Z M -0.2 0 L -0.2 -0.2 A 0.2 0.2 0 1 1 0.2 -0.2 L 0.2 0 Z' },
    { id: 'key', label: 'Anahtar', icon: '🔑', path: 'M -0.3 -0.3 A 0.2 0.2 0 1 1 -0.1 -0.1 L 0.4 0.4 L 0.4 0.5 L 0.3 0.5 L 0.3 0.4 L 0.2 0.4 L 0.2 0.3 L -0.1 -0.1 Z M -0.25 -0.25 A 0.05 0.05 0 1 0 -0.2 -0.2 Z' },
    { id: 'tool', label: 'Tamir/Ayarlar', icon: '🔧', path: 'M -0.4 -0.2 L -0.2 -0.4 L 0.4 0.2 L 0.2 0.4 Z M -0.5 -0.5 L -0.3 -0.5 L -0.3 -0.3 L -0.5 -0.3 Z' }, // Simplified Wrench
    { id: 'camera', label: 'Kamera', icon: '📷', path: 'M -0.4 -0.2 L -0.1 -0.2 L 0 -0.3 L 0.3 -0.3 L 0.4 -0.2 L 0.4 0.3 L -0.4 0.3 Z M 0 0.05 A 0.15 0.15 0 1 0 0 0.06 Z' },
    { id: 'mail', label: 'Mektup', icon: '✉️', path: 'M -0.5 -0.3 L 0.5 -0.3 L 0.5 0.3 L -0.5 0.3 Z M -0.5 -0.3 L 0 0.1 L 0.5 -0.3' },
    { id: 'bubble', label: 'Balon', icon: '💬', path: 'M -0.5 -0.3 L 0.5 -0.3 L 0.5 0.2 L 0.1 0.2 L -0.2 0.5 L -0.2 0.2 L -0.5 0.2 Z' }
];

// --- STATE ---
const route = useRoute();
const sceneId = Number(route.params.id);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const isLoading = ref(true);
const isExporting = ref(false);
const showDownloadMenu = ref(false);

const sceneData = ref<ARSceneDto | null>(null);
const sceneItems = ref<SceneItemDto[]>([]);

const showModelSelector = ref(false);
const availableModels = ref<ARModelDto[]>([]);
const selectedItemId = ref<number | null>(null);

// Mouse
const mouseStart = new THREE.Vector2();

// --- Three.js Globals ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let orbit: OrbitControls;
let transformControl: TransformControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let animationId: number;

const itemsMap = new Map<number, THREE.Object3D>();

// --- LIFECYCLE ---
onMounted(async () => {
    if (!sceneId) return;

    try {
        await loadSceneData();
        availableModels.value = await arModelService.listModels();

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
    cancelAnimationFrame(animationId);
    renderer?.dispose();
    if (transformControl) {
        transformControl.detach();
        transformControl.dispose();
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
});

// --- API ---
const loadSceneData = async () => {
    sceneData.value = await arSceneService.getScene(sceneId);
    sceneItems.value = sceneData.value.items;
};

const getThumbnailUrl = (path: string) => arModelService.getPreviewUrl(path);

// --- YARDIMCI: Grid Texture ---
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
    // Eğer doku URL'i varsa
    if (layer.textureUrl) {
        const loader = new TextureLoader();
        try {
            // .load() yerine .loadAsync() kullanıyoruz ve işlemin bitmesini bekliyoruz
            const texture = await loader.loadAsync(layer.textureUrl);
            
            // Dokuyu tekrarla
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            
            // GLTF Export için önemli: Texture'ın dikey çevrilmesini kapatıyoruz
            // Bu satır "No valid image data found" hatasını çözmeye yardımcı olur.
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
            // Hata olursa (örn: link kırık) varsayılan renk ile devam et
            return new THREE.MeshStandardMaterial({
                color: layer.color || '#94a3b8',
                roughness: 0.8,
                metalness: 0.1
            });
        }
    } 
    // Doku yoksa düz renk materyali döndür
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

    // 1. ZEMİN NOKTALARINI HAZIRLA
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

    // 2. MERKEZ NOKTASINI HESAPLA
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

    // 3. PERIMETER GRUBU OLUŞTUR
    const perimeterGroup = new THREE.Group();
    perimeterGroup.name = "GeneratedPerimeterGroup";
    perimeterGroup.position.x = -center.x;
    perimeterGroup.position.z = center.y;

    // --- SOĞAN KABUĞU DÖNGÜSÜ ---
    let currentInnerBoundary = [...basePoints]; 

    // ÖNEMLİ: await kullanabilmek için standart for döngüsü kullanıyoruz
    for (let index = 0; index < layers.length; index++) {
        const layer = layers[index];

        // A. DIŞ SINIRI HESAPLA
        const currentOuterBoundary = offsetPolygon(currentInnerBoundary, Number(layer.width));
        if (!currentOuterBoundary || currentOuterBoundary.length < 3) continue;

        // B. SHAPE OLUŞTUR
        const shape = new THREE.Shape();
        const p0 = currentOuterBoundary[0];
        if (p0) shape.moveTo(p0.x, -p0.z); 
        for (let i = 1; i < currentOuterBoundary.length; i++) {
            const p = currentOuterBoundary[i];
            if (p) shape.lineTo(p.x, -p.z);
        }
        shape.closePath();

        // C. DELİK OLUŞTUR
        const holePath = new THREE.Path();
        const h0 = currentInnerBoundary[0];
        if (h0) holePath.moveTo(h0.x, -h0.z);
        for (let i = 1; i < currentInnerBoundary.length; i++) {
            const hp = currentInnerBoundary[i];
            if (hp) holePath.lineTo(hp.x, -hp.z);
        }
        holePath.closePath();
        shape.holes.push(holePath);

        // D. EXTRUDE
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: Number(layer.height),
            bevelEnabled: false
        });

        // E. MATERYAL VE MESH (BURADA BEKLİYORUZ)
        // Texture'ın inmesini ve materyalin oluşmasını bekliyoruz
        const material = await createPerimeterMaterial(layer);
        
        const mesh = new THREE.Mesh(geometry, material);

        // F. POZİSYONLAMA
        mesh.rotation.x = -Math.PI / 2; 
        mesh.position.y = layer.elevation ? Number(layer.elevation) : 0;
        mesh.renderOrder = index + 1;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        perimeterGroup.add(mesh);

        // G. REFERANS GÜNCELLEME
        currentInnerBoundary = currentOuterBoundary;
    }

    targetScene.add(perimeterGroup);
};

// =======================================================
// EXPORT & CONVERT
// =======================================================
const getSceneAsBlob = async (): Promise<Blob> => {
    
    if (!scene) {
        throw new Error("Sahne bulunamadı");
    }

    const exporter = new GLTFExporter();
    // CSG (Evaluator) işlemini zemin şekilleri için kaldırdık, çünkü 2D şekilleri siliyor.
    const settings = sceneData.value?.settings || {};

    // --- ADIM 1: ARAYÜZ ELEMANLARINI GİZLE ---
    const controlsObj = transformControl as unknown as THREE.Object3D;
    controlsObj.visible = false;

    const gridMesh = scene.getObjectByName("GridMesh");
    if (gridMesh) gridMesh.visible = false;

    const baseFloor = scene.getObjectByName("BaseFloor");
    const floorGroup = baseFloor?.parent;
    const originalPositions = new Map<THREE.Object3D, number>();
    if (floorGroup) {
        floorGroup.children.forEach((child) => {
            if (child.name !== "BaseFloor" && child.name !== "GridMesh") {
                originalPositions.set(child, child.position.z);
                child.position.z = -child.position.z; 
            }
        });
    }

    // --- ADIM 3: ÇEVRE DUVARLARINI OLUŞTUR VE EKLE ---
    // Duvarların (texture'ların) tam yüklenmesi için await kullanıyoruz.
    await buildPerimeterLayers(scene, settings);

    // --- ADIM 4: EXPORT ---
    return new Promise((resolve, reject) => {
        exporter.parse(
            scene,
            (gltf) => {
                const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
                
                // İşlem bitti, sahneyi eski haline getir
                restoreSceneState(controlsObj, gridMesh, floorGroup);
                resolve(blob);
            },
            (error) => {
                restoreSceneState(controlsObj, gridMesh, floorGroup);
                reject(error);
            },
            { binary: true, onlyVisible: true }
        );
    });
};

const restoreSceneState = (
    controls: THREE.Object3D, 
    grid: THREE.Object3D | undefined | null, 
    floorGroup: THREE.Object3D | undefined | null
) => {
    // 1. Kontrolleri aç
    controls.visible = true;
    if (grid) grid.visible = true;

    // 2. Oluşturulan Duvar Grubunu Sil
    const generatedPerimeter = scene.getObjectByName("GeneratedPerimeterGroup");
    if (generatedPerimeter) {
        scene.remove(generatedPerimeter);
        // Bellek temizliği (isteğe bağlı ama iyi olur)
        generatedPerimeter.traverse((child) => {
             if ((child as THREE.Mesh).isMesh) {
                 (child as THREE.Mesh).geometry.dispose();
                 // Materyal dispose işlemleri...
             }
        });
    }

    // 3. Kesilen şekilleri düzeltmek için sahneyi yeniden yükle
    // CSG işlemi orijinal meshlerin geometrisini kalıcı bozduğu için en temizi budur.
    if (floorGroup) {
        scene.remove(floorGroup);
    }
    
    // Sahneyi veriden tekrar oluştur
    // Not: Bu işlem çok hızlı olduğu için kullanıcı sadece bir 'blink' görür.
    initThreeJS(); 
    loadSceneObjects();
};

const handleExport = async (format: 'glb' | 'usdz') => {
    if (isExporting.value) return;
    showDownloadMenu.value = false;
    isExporting.value = true;

    try {
        const glbBlob = await getSceneAsBlob();
        const fileName = sceneData.value?.name || 'sahne';

        if (format === 'glb') {
            triggerDownload(glbBlob, `${fileName}.glb`);
        } else {
            await convertAndDownloadUsdz(glbBlob, fileName);
        }

    } catch (error) {
        console.error("Export hatası:", error);
        alert("Export sırasında bir hata oluştu: " + error);
    } finally {
        isExporting.value = false;
    }
};

const convertAndDownloadUsdz = async (glbBlob: Blob, baseName: string) => {
    const data = await arModelService.convertGlbToUsdz(glbBlob, `${baseName}.glb`);
    if (data.usdz && data.usdz.url) {
        const downloadUrl = arModelService.getPreviewUrl(data.usdz.url);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${baseName}.usdz`; 
        document.body.appendChild(link);
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

    // Ayarlar
    const settings = sceneData.value?.settings || {};
    const sceneWidth = settings.width || 20;
    const sceneDepth = settings.depth || 20;
    const bgColor = settings.backgroundColor || '#f5f5f5';
    const floorColor = settings.floorColor || '#ffffff';
    const floorType = settings.floorType || 'rectangle';
    const floorTextureUrl = settings.floorTextureUrl;
    const floorLayers = settings.floorLayers || [];
    const points = settings.floorPoints || [];
    const texScale = settings.textureScale || 1; 

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    const maxDim = Math.max(sceneWidth, sceneDepth);
    scene.fog = new THREE.Fog(bgColor, 30, maxDim * 8);

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

    // --- ZEMİN (Base Floor) GEOMETRİSİ ---
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
        // Önceki düzeltme: Geometriyi pozitif alana taşı
        geometry.translate(sceneWidth / 2, sceneDepth / 2, 0);
    }

    // --- OFFSET HESAPLAMA ---
    geometry.computeBoundingBox();
    const centerOffset = new THREE.Vector3();
    if (geometry.boundingBox) {
        geometry.boundingBox.getCenter(centerOffset);
    }
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

    // --- ZEMİN MATERYALİ (STENCIL WRITE EKLENDİ) ---
    // Ortak ayarlar
    const baseMaterialParams = {
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits: 2,
        depthWrite: false,
        
        // >>> MASK LEME AYARLARI (YAZMA) <<<
        stencilWrite: true,
        stencilRef: 1,                    // Referans ID: 1
        stencilFunc: THREE.AlwaysStencilFunc, // Her zaman çiz
        stencilZPass: THREE.ReplaceStencilOp  // Çizilen pikselin stencil değerini '1' yap
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

    // Base mesh'in render order'ı en düşük olsun (0)
    const baseMesh = new THREE.Mesh(geometry, baseMaterial);
    baseMesh.receiveShadow = true;
    baseMesh.name = "BaseFloor";
    baseMesh.renderOrder = 0; // İlk bu çizilmeli ki stencil buffer dolsun

    // --- GRID ---
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
    
    // Grid her zaman en üstte görünsün
    gridMesh.renderOrder = 999; 

    // --- FLOOR GROUP ---
    const floorGroup = new THREE.Group();
    floorGroup.add(baseMesh);
    floorGroup.add(gridMesh);

    // --- FLOOR LAYERS (SVG Şekiller - MASK UYGULAMALI) ---
    if (floorLayers.length > 0) {
        // 1. Z-Index Sıralaması
        const sortedLayers = [...floorLayers].sort((a, b) => a.zIndex - b.zIndex);
        const svgLoader = new SVGLoader(); 

        sortedLayers.forEach((layer, index) => {
            const shapeDef = SHAPE_LIBRARY.find(s => s.id === layer.shapeId) || SHAPE_LIBRARY[0];
            if (!shapeDef) return;

            // ÖNEMLİ: SVG Wrapper (loader.parse bunu bekler)
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
            
            // Geometriyi ortala (Scale ve Rotate işlemleri merkezden olsun diye)
            layerGeo.computeBoundingBox();
            const center = new THREE.Vector3();
            if(layerGeo.boundingBox) layerGeo.boundingBox.getCenter(center);
            layerGeo.translate(-center.x, -center.y, -center.z);

            // --- KATMAN MATERYALİ (STENCIL READ EKLENDİ) ---
            const layerMat = new THREE.MeshBasicMaterial({
                color: layer.color,
                transparent: true,
                opacity: layer.opacity !== undefined ? layer.opacity : 1,
                side: THREE.DoubleSide,
                depthWrite: false, 
                depthTest: true,

                // >>> MASKELEME AYARLARI (OKUMA) <<<
                stencilWrite: true,
                stencilRef: 1,                   // Zeminin ID'si ile eşleşmeli (1)
                stencilFunc: THREE.EqualStencilFunc, // Sadece değer '1' ise çiz (Zeminin olduğu yer)
            });

            const layerMesh = new THREE.Mesh(layerGeo, layerMat);

            // Scale (Genişlik ve Yükseklik)
            layerMesh.scale.set(layer.width, layer.height, 1);

            // Pozisyonlama (Offset ve Z-Fighting önleme)
            const correctedX = layer.x - centerOffset.x;
            const correctedZ = layer.z - centerOffset.y;
            
            // Fiziksel olarak çok az yukarı kaldırıyoruz (Y Ekseni)
            const zFightOffset = 0.005 * (index + 1);
            layerMesh.position.set(correctedX, correctedZ, zFightOffset);

            // Render Order: 
            layerMesh.renderOrder = layer.zIndex; 

            // Rotasyon
            layerMesh.rotation.z = -layer.rotation;

            floorGroup.add(layerMesh);
        });
    }

    floorGroup.rotation.x = Math.PI / 2;

    scene.add(floorGroup);

    await buildPerimeterLayers(scene, settings);

    // --- KAMERA & RENDERER ---
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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    
    // --- KAMERA AÇISI KISITLAMASI ---
    orbit.maxPolarAngle = Math.PI / 2 - 0.05; 

    transformControl = markRaw(new TransformControls(camera, renderer.domElement));
    transformControl.addEventListener('dragging-changed', (event) => { orbit.enabled = !event.value; });
    transformControl.addEventListener('mouseUp', async () => {
        if (transformControl.object && selectedItemId.value) {
            await saveTransform(selectedItemId.value, transformControl.object);
        }
    });
    scene.add(transformControl.getHelper());

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvasRef.value.addEventListener('mousedown', onMouseDown);
    canvasRef.value.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    animate();
};

const handleResize = () => {
    if (!canvasRef.value || !camera || !renderer) return;
    const width = canvasRef.value.parentElement?.clientWidth || window.innerWidth;
    const height = canvasRef.value.parentElement?.clientHeight || window.innerHeight;
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
            const blob = await arModelService.getModelFileBlob(item.model.id, 'glb', 'view');
            const url = URL.createObjectURL(blob);
            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;

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
        } catch (err) {
            console.error(`Item ${item.id} yüklenemedi:`, err);
        }
    }
};

const addModelToScene = async (arModel: ARModelDto) => {
    isLoading.value = true;
    showModelSelector.value = false;

    try {
        const loader = new GLTFLoader();
        const blob = await arModelService.getModelFileBlob(arModel.id, 'glb', 'view');
        const url = URL.createObjectURL(blob);
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;

        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const newX = -center.x;
        const newY = -box.min.y;
        const newZ = -center.z;
        model.position.set(newX, newY, newZ);

        const newItem = await arSceneService.addItem({
            sceneId: sceneId,
            modelId: arModel.id,
            name: arModel.fileName,
            position: { x: newX, y: newY, z: newZ }
        });

        sceneItems.value.push(newItem);

        model.userData = { isSceneItem: true, itemId: newItem.id };
        scene.add(model);
        itemsMap.set(newItem.id, model);
        selectItemFromTree(newItem.id);

    } catch (err) {
        console.error("Model ekleme hatası:", err);
        alert("Model eklenirken bir sorun oluştu.");
    } finally {
        isLoading.value = false;
    }
};

// --- ETKİLEŞİM ---
const onMouseDown = (event: MouseEvent) => {
    mouseStart.set(event.clientX, event.clientY);
};

const onMouseUp = (event: MouseEvent) => {
    if (!canvasRef.value) return;
    const distance = mouseStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (distance > 5) return;

    const rect = canvasRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    
    const hit = intersects.find(i => {
        let obj = i.object;
        while (obj.parent && obj.parent !== scene) {
            if (obj.userData?.isSceneItem) return true;
            obj = obj.parent;
        }
        return obj.userData?.isSceneItem;
    });

    if (hit) {
        let target = hit.object;
        while (target.parent && target.parent !== scene && !target.userData?.itemId) {
            target = target.parent!;
        }
        if (target.userData?.itemId) selectItemFromTree(target.userData.itemId);
    } else {
        transformControl.detach();
        selectedItemId.value = null;
    }
};

const selectItemFromTree = (itemId: number) => {
    selectedItemId.value = itemId;
    const mesh = itemsMap.get(itemId);
    if (mesh) transformControl.attach(mesh);
};

const handleKeyDown = (event: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    switch (event.key.toLowerCase()) {
        case 'w': transformControl.setMode('translate'); break;
        case 'e': transformControl.setMode('rotate'); break;
        case 'r': transformControl.setMode('scale'); break;
        case 'delete':
        case 'backspace':
            if (selectedItemId.value) deleteItem(selectedItemId.value);
            break;
    }
};

const saveTransform = async (itemId: number, obj: THREE.Object3D) => {
    try {
        await arSceneService.updateItem(itemId, {
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
        });
        console.log("Transform saved");
    } catch (err) {
        console.error("Save error", err);
    }
};

const deleteItem = async (itemId: number) => {
    if (!confirm("Bu objeyi silmek istediğinize emin misiniz?")) return;
    try {
        await arSceneService.removeItem(itemId);
        const mesh = itemsMap.get(itemId);
        if (mesh) {
            transformControl.detach();
            scene.remove(mesh);
            itemsMap.delete(itemId);
        }
        sceneItems.value = sceneItems.value.filter(i => i.id !== itemId);
        selectedItemId.value = null;
    } catch (err) {
        console.error(err);
        alert("Silinemedi");
    }
};
</script>