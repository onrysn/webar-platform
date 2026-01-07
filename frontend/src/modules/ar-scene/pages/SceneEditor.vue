<template>
    <div class="relative w-full h-screen overflow-hidden bg-gray-900 text-gray-100 font-sans select-none">

        <div class="absolute inset-0 z-0 touch-none">
            <canvas ref="canvasRef" class="w-full h-full block outline-none"></canvas>
        </div>

        <div v-if="isLoading"
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p class="text-white font-medium tracking-wide animate-pulse">3D Sahne Hazırlanıyor...</p>
        </div>

        <div class="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-500"
            :class="saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'">

            <div v-if="saveStatus === 'saving'"
                class="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
                <svg class="animate-spin h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                <span class="text-xs text-gray-300 font-medium whitespace-nowrap">Kaydediliyor...</span>
            </div>

            <div v-if="saveStatus === 'saved'"
                class="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 shadow-xl">
                <svg class="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-xs text-green-100 font-medium whitespace-nowrap">Kaydedildi</span>
            </div>

            <div v-if="saveStatus === 'error'"
                class="flex items-center gap-2 bg-red-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/50 shadow-xl">
                <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs text-white font-medium whitespace-nowrap">Kayıt Hatası</span>
            </div>
        </div>

        <div class="absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
            <div
                class="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md p-2 pr-4 rounded-xl border border-white/10 shadow-lg">
                <button @click="$router.back()"
                    class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h1 class="font-bold text-sm text-white leading-tight truncate max-w-[150px] sm:max-w-xs">{{
                        sceneData?.name || 'Yükleniyor...' }}</h1>
                    <p v-if="sceneData?.settings" class="text-[10px] text-gray-400">
                        {{ sceneData.settings.width }}m x {{ sceneData.settings.depth }}m
                    </p>
                </div>
            </div>

            <div class="flex gap-2 pointer-events-auto">
                <button @click="showSidebar = !showSidebar"
                    class="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg text-white hover:bg-white/10 transition-colors"
                    :class="showSidebar ? 'bg-blue-600/80 border-blue-500' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div class="relative">
                    <button @click="showDownloadMenu = !showDownloadMenu" :disabled="isExporting"
                        class="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="isExporting" class="flex items-center gap-2">
                            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                        </span>
                        <span v-else class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Dışa Aktar
                        </span>
                    </button>

                    <div v-if="showDownloadMenu"
                        class="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div class="p-2 space-y-1">
                            <button @click="handleExport('glb')"
                                class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-700 text-sm text-gray-200 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-green-500"></span> Android (GLB)
                            </button>
                            <button @click="handleExport('usdz')"
                                class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-700 text-sm text-gray-200 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-blue-500"></span> iOS (USDZ)
                            </button>
                        </div>
                    </div>
                    <div v-if="showDownloadMenu" @click="showDownloadMenu = false" class="fixed inset-0 z-[-1]"></div>
                </div>
            </div>
        </div>

        <transition name="slide-fade">
            <div v-if="showSidebar"
                class="absolute top-20 left-4 bottom-24 w-64 md:w-72 bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden transform transition-transform">

                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Sahne Objeleri</span>
                    <span class="bg-gray-700 text-xs px-2 py-0.5 rounded text-gray-300">{{ sceneItems.length }}</span>
                </div>

                <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    <div v-if="sceneItems.length === 0"
                        class="flex flex-col items-center justify-center h-40 text-gray-500 text-xs text-center p-4">
                        <svg class="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        Model ekleyerek başlayın.
                    </div>

                    <div v-for="item in sceneItems" :key="item.id" @click="selectItemFromTree(item.id)"
                        class="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border border-transparent"
                        :class="selectedItemId === item.id ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'hover:bg-white/5 text-gray-300'">

                        <div class="flex items-center gap-3 truncate">
                            <div class="w-2 h-2 rounded-full"
                                :class="selectedItemId === item.id ? 'bg-blue-400' : 'bg-gray-600'"></div>
                            <span class="text-sm truncate">{{ item.name || item.model.fileName }}</span>
                        </div>

                        <button @click.stop="deleteItem(item.id)"
                            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="p-4 border-t border-white/10 bg-gray-900/50">
                    <button @click="showModelSelector = true"
                        class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Model Ekle
                    </button>
                </div>
            </div>
        </transition>

        <div
            class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <button @click="setTransformMode('translate')"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="currentTransformMode === 'translate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
                <span class="text-[10px] font-bold">Taşı</span>
            </button>

            <button @click="setTransformMode('rotate')"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="currentTransformMode === 'rotate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="text-[10px] font-bold">Döndür</span>
            </button>

            <button @click="setTransformMode('scale')"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="currentTransformMode === 'scale' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span class="text-[10px] font-bold">Ölçekle</span>
            </button>

            <div class="w-px h-8 bg-white/20 mx-1"></div>

            <button @click="togglePaintMode"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="isPaintMode ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400 ring-offset-2 ring-offset-black' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <span class="text-xl">🎨</span>
                <span class="text-[10px] font-bold">Boya</span>
            </button>

            <button @click="deleteSelectedItem" :disabled="!selectedItemId"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px] text-red-400 hover:text-red-200 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span class="text-[10px] font-bold">Sil</span>
            </button>
        </div>

        <div v-if="showModelSelector"
            class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold text-lg text-gray-800">Kütüphaneden Ekle</h3>
                    <button @click="showModelSelector = false"
                        class="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto bg-gray-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div v-for="model in availableModels" :key="model.id" @click="addModelToScene(model)"
                        class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all duration-200 flex flex-col overflow-hidden relative">
                        <div class="aspect-square bg-gray-100 relative">
                            <img v-if="model.thumbnailPath" :src="getThumbnailUrl(model.thumbnailPath)"
                                class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
                            <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                Görsel Yok</div>
                            <div
                                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span
                                    class="bg-white/90 text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Ekle
                                    +</span>
                            </div>
                        </div>
                        <div class="p-3">
                            <p class="text-sm font-bold text-gray-800 truncate">{{ model.fileName }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <MaterialEditor v-if="isPaintMode && selectedSubMesh" :selectedMesh="selectedSubMesh"
        @close="selectedSubMesh = null" @update="handleMaterialUpdate" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, markRaw, shallowRef } from 'vue';
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
import MaterialEditor from '../components/MaterialEditor.vue';

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
const sceneId = Number(route.params.id);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const isLoading = ref(true);
const isExporting = ref(false);

// [YENİ] UI Durumları
const showSidebar = ref(true);
const showModelSelector = ref(false);
const showDownloadMenu = ref(false);
const currentTransformMode = ref<'translate' | 'rotate' | 'scale'>('translate');

const sceneData = ref<ARSceneDto | null>(null);
const sceneItems = ref<SceneItemDto[]>([]);
const availableModels = ref<ARModelDto[]>([]);
const selectedItemId = ref<number | null>(null);
const isPaintMode = ref(false);
const selectedSubMesh = shallowRef<THREE.Mesh | null>(null);
const saveStatus = ref<'idle' | 'saved' | 'saving' | 'error'>('idle');
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Mouse
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
    // [YENİ] Mobilde sidebar'ı varsayılan olarak kapalı başlat
    if (window.innerWidth < 768) {
        showSidebar.value = false;
    }

    if (!sceneId) return;

    try {
        await loadSceneData();
        const ownerCompanyId = sceneData.value?.companyId;
        availableModels.value = await arModelService.listModels(ownerCompanyId);

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

// [EKLE] DEBOUNCED AUTO-SAVE TETİKLEYİCİSİ
const triggerAutoSave = (itemId: number) => {
    saveStatus.value = 'saving';
    if (saveTimeout) clearTimeout(saveTimeout);

    // 1.5 saniye bekle, sonra kaydet
    saveTimeout = setTimeout(async () => {
        await performSave(itemId);
    }, 1500);
};

// [EKLE] GERÇEK KAYIT İŞLEMİ
const performSave = async (itemId: number) => {
    try {
        const item = sceneItems.value.find(i => i.id === itemId);
        const mesh = itemsMap.get(itemId);

        if (!item || !mesh) return;
        const updateData = {
            position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
            rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
            scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
            materialConfig: item.materialConfig || {}
        };

        await arSceneService.updateItem(itemId, updateData);

        saveStatus.value = 'saved';
        setTimeout(() => {
            if (saveStatus.value === 'saved') {
                saveStatus.value = 'idle';
            }
        }, 2000);

    } catch (err) {
        console.error("Auto-save error:", err);
        saveStatus.value = 'error';
    }
};

const getThumbnailUrl = (path: string) => arModelService.getPreviewUrl(path);

// --- [YENİ] UI AKSİYONLARI ---
const setTransformMode = (mode: 'translate' | 'rotate' | 'scale') => {
    currentTransformMode.value = mode;
    if (transformControl) {
        transformControl.setMode(mode);
    }
};

const deleteSelectedItem = () => {
    if (selectedItemId.value) {
        deleteItem(selectedItemId.value);
    }
};

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
// EXPORT & CONVERT
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


// --- MOD DEĞİŞTİRME ---
const togglePaintMode = () => {
    isPaintMode.value = !isPaintMode.value;

    if (isPaintMode.value && window.innerWidth < 768) {
        showSidebar.value = false;
    }
    
    // Mod değişince seçimleri sıfırla
    selectedItemId.value = null; // Ana grup seçimi
    selectedSubMesh.value = null; // Alt parça seçimi
    transformControl.detach();

    if (isPaintMode.value) {
        transformControl.enabled = false; // Gizmo'yu kapat
        document.body.style.cursor = 'crosshair'; // İmleci değiştir
    } else {
        transformControl.enabled = true;
        document.body.style.cursor = 'default';
    }
};

// --- MATERYAL GÜNCELLEME ---
const handleMaterialUpdate = (data: any) => {
    if (!selectedSubMesh.value) return;

    let parent = selectedSubMesh.value.parent;
    let sceneItemId: number | null = null;

    while (parent) {
        if (parent.userData?.itemId) {
            sceneItemId = parent.userData.itemId;
            break;
        }
        parent = parent.parent;
    }

    if (sceneItemId) {
        const item = sceneItems.value.find(i => i.id === sceneItemId);
        if (item) {
            if (!item.materialConfig) item.materialConfig = {};

            // Yerel state'i güncelle
            item.materialConfig[data.meshName] = {
                color: data.color,
                metalness: data.metalness,
                roughness: data.roughness
            };

            // [EKLE] Oto-Kayıt Tetikle
            triggerAutoSave(sceneItemId);
        }
    }
};


// =======================================================
// THREE.JS INIT
// =======================================================
const initThreeJS = async () => {
    if (!canvasRef.value) return;

    const settings = sceneData.value?.settings || {};
    const sceneWidth = settings.width || 20;
    const sceneDepth = settings.depth || 20;
    // [GÜNCELLEME]: Kullanıcının belirttiği rengi kullan, yoksa gri yap.
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

    // [GÜNCELLEME]: Transform Controls'u UI state ile bağla
    transformControl = markRaw(new TransformControls(camera, renderer.domElement));
    transformControl.addEventListener('dragging-changed', (event) => { orbit.enabled = !event.value; });
    transformControl.addEventListener('mouseUp', async () => {
        if (transformControl.object && selectedItemId.value) {
            await saveTransform(selectedItemId.value);
        }
    });
    // Başlangıç modunu ayarla
    transformControl.setMode(currentTransformMode.value);
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
    // Full screen olduğu için window boyutunu kullanmak daha güvenlidir
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
            const blob = await arModelService.getModelFileBlob(item.model.id, 'glb', 'view');
            const url = URL.createObjectURL(blob);
            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;

            if (item.materialConfig) {
                model.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        
                        const config = (item.materialConfig as any)?.[mesh.name];

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
                                
                                mesh.userData.hasCustomMaterial = true;
                            }
                        }
                    }
                });
            }

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

    // Tıklama hassasiyetini biraz artırdık (5 -> 10)
    const distance = mouseStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (distance > 10) return;

    const rect = canvasRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (isPaintMode.value) {
        console.log("🎨 Boyama Modu: Tıklama algılandı.");

        // Sahnedeki her şeyi kontrol et
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length === 0) {
            console.log("❌ Hiçbir nesneye denk gelmedi.");
            selectedSubMesh.value = null;
            return;
        }

        // SceneItem'a ait olan ilk MESH'i bul
        const hit = intersects.find(i => {
            // Sadece Mesh olsun
            if (!(i.object as THREE.Mesh).isMesh) return false;

            // Grid veya Helper olmasın, bir SceneItem parçası mı?
            let p = i.object.parent;
            while (p) {
                if (p.userData?.isSceneItem) return true;
                p = p.parent;
            }
            return false;
        });

        if (hit) {
            const mesh = hit.object as THREE.Mesh;
            console.log("✅ PARÇA SEÇİLDİ:", mesh.name || 'İsimsiz Parça');
            // ShallowRef güncellemesi
            selectedSubMesh.value = mesh;
        } else {
            console.log("⚠️ Tıklanan nesne bir model parçası değil (Grid veya zemin olabilir).");
            selectedSubMesh.value = null;
        }

    } else {
        // --- NORMAL MOD (Mevcut kodunuz) ---
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
    }
};

const selectItemFromTree = (itemId: number) => {
    selectedItemId.value = itemId;
    const mesh = itemsMap.get(itemId);
    if (mesh) transformControl.attach(mesh);
};

// [GÜNCELLEME]: Klavye kısayollarını UI State ile eşle
const handleKeyDown = (event: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    switch (event.key.toLowerCase()) {
        case 'w':
            setTransformMode('translate');
            break;
        case 'e':
            setTransformMode('rotate');
            break;
        case 'r':
            setTransformMode('scale');
            break;
        case 'delete':
        case 'backspace':
            deleteSelectedItem();
            break;
    }
};

const saveTransform = async (itemId: number) => {
    triggerAutoSave(itemId);
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

<style scoped>
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