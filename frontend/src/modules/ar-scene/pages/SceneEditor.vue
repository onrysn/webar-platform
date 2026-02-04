<template>
    <div class="relative w-full h-screen overflow-hidden bg-gray-900 text-gray-100 font-sans select-none">

        <div class="absolute inset-0 z-0 touch-none">
            <canvas ref="canvasRef" class="w-full h-full block outline-none"></canvas>
        </div>

        <div v-if="isLoading || isExporting"
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p class="text-white font-medium tracking-wide animate-pulse">
                {{ isExporting ? currentExportMessage : loadingMessage }}
            </p>
            <div v-if="(isLoading && loadingProgress > 0) || (isExporting && currentExportProgress > 0)" class="mt-4 w-64">
                <div class="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div class="bg-blue-500 h-full transition-all duration-300" 
                         :style="{ width: (isExporting ? currentExportProgress : loadingProgress) + '%' }"></div>
                </div>
                <p class="text-xs text-gray-400 mt-2 text-center">
                    {{ Math.round(isExporting ? currentExportProgress : loadingProgress) }}%
                </p>
            </div>
        </div>

        <div v-if="canEdit"
            class="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-500"
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
                <span class="text-xs text-gray-300 font-medium whitespace-nowrap">{{ t('scenes.editor.saving') }}</span>
            </div>

            <div v-if="saveStatus === 'saved'"
                class="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 shadow-xl">
                <svg class="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-xs text-green-100 font-medium whitespace-nowrap">{{ t('scenes.editor.saved') }}</span>
            </div>

            <div v-if="saveStatus === 'error'"
                class="flex items-center gap-2 bg-red-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/50 shadow-xl">
                <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs text-white font-medium whitespace-nowrap">{{ t('messages.error.saveError') }}</span>
            </div>
        </div>

        <div class="absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-center pointer-events-none">
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
                    <h1
                        class="font-bold text-sm text-white leading-tight truncate max-w-[150px] sm:max-w-xs flex items-center gap-2">
                        {{ sceneData?.name || t('common.loading') }}
                        <span v-if="!canEdit"
                            class="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-normal">{{ t('common.view') }}</span>
                    </h1>
                    <p v-if="sceneData?.settings" class="text-[10px] text-gray-400">
                        {{ sceneData.settings.width }}m x {{ sceneData.settings.depth }}m
                    </p>
                </div>
            </div>

            <div class="flex gap-2 items-center pointer-events-auto">
                <!-- Her cihazda görünen temel kontroller -->
                <div class="flex gap-2">
                    <button @click="showSidebar = !showSidebar"
                        class="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg text-white hover:bg-white/10 transition-colors"
                        :class="showSidebar ? 'bg-blue-600/80 border-blue-500' : ''">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <button @click="showLightingPanel = !showLightingPanel"
                        class="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg text-white hover:bg-black/20 transition-colors"
                        :class="showLightingPanel ? 'bg-yellow-600/80 border-yellow-500' : ''"
                        :title="t('scenes.editor.lightingSettings')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </button>
                </div>

                <!-- Tablet / Desktop aksiyon butonları -->
                <div class="hidden sm:flex gap-2">
                    <button @click="openShareModal"
                        class="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {{ t('scenes.share') }}
                    </button>
                    <button @click="showQuoteModal = true"
                        class="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg font-bold text-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {{ t('scenes.editor.requestQuote') }}
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
                                {{ t('common.export') }}
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
                    <button @click="downloadSceneScreenshot"
                        class="flex items-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl shadow-lg font-bold text-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16v16H4V4zm4 8h8m-4-4v8" />
                        </svg>
                        {{ t('scenes.editor.takeScreenshot') }}
                    </button>
                </div>

                <!-- Mobil aksiyon menüsü -->
                <div class="relative sm:hidden">
                    <button @click="showMobileActions = !showMobileActions"
                        class="flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg text-xs font-semibold transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6h.01M12 12h.01M12 18h.01" />
                        </svg>
                        {{ t('common.actions') }}
                    </button>

                    <div v-if="showMobileActions"
                        class="absolute right-0 top-full mt-2 w-52 bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up backdrop-blur-xl">
                        <div class="p-1 divide-y divide-gray-800 text-sm text-gray-100">
                            <button @click="showMobileActions = false; openShareModal()"
                                class="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800 text-left">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                {{ t('scenes.share') }}
                            </button>
                            <button @click="showMobileActions = false; showQuoteModal = true"
                                class="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800 text-left">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {{ t('scenes.editor.requestQuote') }}
                            </button>
                            <div class="py-1">
                                <p class="px-3 pb-1 text-[10px] uppercase tracking-wide text-gray-400">{{ t('common.export') }}</p>
                                <button @click="showMobileActions = false; handleExport('glb')" :disabled="isExporting"
                                    class="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800 text-left disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span class="flex-1">{{ t('scenes.editor.exportAndroid') }}</span>
                                </button>
                                <button @click="showMobileActions = false; handleExport('usdz')" :disabled="isExporting"
                                    class="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800 text-left disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span class="flex-1">{{ t('scenes.editor.exportIos') }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div v-if="showMobileActions" @click="showMobileActions = false" class="fixed inset-0 z-[-1]"></div>
                </div>
            </div>
        </div>

        <transition name="slide-fade">
            <div v-if="showSidebar"
                class="absolute top-20 left-4 bottom-24 w-64 md:w-72 bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden transform transition-transform">

                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ t('scenes.editor.sceneObjects') }}</span>
                    <span class="bg-gray-700 text-xs px-2 py-0.5 rounded text-gray-300">{{ sceneItems.length }}</span>
                </div>

                <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    <div v-if="sceneItems.length === 0"
                        class="flex flex-col items-center justify-center h-40 text-gray-500 text-xs text-center p-4">
                        <svg class="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <span v-if="canEdit">{{ t('scenes.editor.startByAddingModel') }}</span>
                        <span v-else>{{ t('scenes.editor.noObjectsInScene') }}</span>
                    </div>

                    <div v-for="item in sceneItems" :key="item.id" @click="selectItemFromTree(item.id)"
                        class="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border border-transparent"
                        :class="selectedItemId === item.id ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'hover:bg-white/5 text-gray-300'">

                        <div class="flex items-center gap-3 truncate">
                            <div class="w-2 h-2 rounded-full"
                                :class="selectedItemId === item.id ? 'bg-blue-400' : 'bg-gray-600'"></div>
                            <span class="text-sm truncate">{{ item.name || item.model.fileName }}</span>
                        </div>

                        <button v-if="canEdit" @click.stop="deleteItem(item.id)"
                            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div v-if="canEdit" class="p-4 border-t border-white/10 bg-gray-900/50">
                    <button @click="showModelSelector = true"
                        class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        {{ t('scenes.editor.addModel') }}
                    </button>
                </div>
            </div>
        </transition>

        <div v-if="canEdit"
            class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <button @click="setTransformMode('translate')"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="currentTransformMode === 'translate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
                <span class="text-[10px] font-bold">{{ t('scenes.editor.transform.move') }}</span>
            </button>

            <button @click="setTransformMode('rotate')"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="currentTransformMode === 'rotate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="text-[10px] font-bold">{{ t('scenes.editor.transform.rotate') }}</span>
            </button>

            <button @click="setTransformMode('scale')"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="currentTransformMode === 'scale' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span class="text-[10px] font-bold">{{ t('scenes.editor.transform.scale') }}</span>
            </button>

            <div class="w-px h-8 bg-white/20 mx-1"></div>

            <button @click="togglePaintMode"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px]"
                :class="isPaintMode ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400 ring-offset-2 ring-offset-black' : 'text-gray-400 hover:text-white hover:bg-white/10'">
                <span class="text-xl">🎨</span>
                <span class="text-[10px] font-bold">{{ t('scenes.editor.paintMode.title') }}</span>
            </button>

            <button @click="deleteSelectedItem" :disabled="!selectedItemId"
                class="p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px] text-red-400 hover:text-red-200 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span class="text-[10px] font-bold">{{ t('common.delete') }}</span>
            </button>
        </div>

        <div v-if="showModelSelector && canEdit"
            class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold text-lg text-gray-800">{{ t('scenes.editor.addFromLibrary') }}</h3>
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
                                {{ t('common.noData') }}</div>
                            <div
                                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span
                                    class="bg-white/90 text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{{ t('common.add') }}
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
    <div v-if="showShareModal && canEdit"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
        @click.self="showShareModal = false">
        <div
            class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

            <div class="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                <h3 class="font-bold text-lg text-white flex items-center gap-2">
                    🌍 {{ t('scenes.editor.shareSettings') }}
                </h3>
                <button @click="showShareModal = false"
                    class="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>

            <div class="p-6 space-y-6">

                <!-- Member kullanıcılar için gizlenen ayarlar -->
                <div v-if="authStore.user?.role !== 'MEMBER'" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-white">🔒 {{ t('scenes.editor.privateScene') }}</p>
                            <p class="text-xs text-gray-400">{{ t('scenes.editor.privateSceneDesc') }}</p>
                        </div>
                        <button @click="togglePrivacy"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                            :class="sceneData?.isPrivate ? 'bg-blue-600' : 'bg-gray-700'">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                                :class="sceneData?.isPrivate ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>

                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-white">👥 {{ t('scenes.editor.teamCanEdit') }}</p>
                            <p class="text-xs text-gray-400">{{ t('scenes.editor.teamCanEditDesc') }}</p>
                        </div>
                        <button @click="toggleMemberEdit"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                            :class="sceneData?.memberCanEdit ? 'bg-blue-600' : 'bg-gray-700'">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                                :class="sceneData?.memberCanEdit ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>
                </div>

                <div class="h-px bg-gray-800 w-full"></div>

                <div class="space-y-3">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ t('scenes.editor.publicAccessLink') }}</p>

                    <div v-if="publicShareUrl" class="bg-black/40 p-3 rounded-xl border border-gray-700 space-y-3">
                        <div class="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
                            <input readonly :value="publicShareUrl"
                                class="bg-transparent text-xs text-gray-300 w-full outline-none font-mono" />
                            <button @click="copyLink"
                                class="text-blue-400 hover:text-blue-300 text-xs font-bold px-2">{{ t('companies.apiKey.copy') }}</button>
                        </div>

                        <div class="flex gap-2">
                            <a :href="publicShareUrl" target="_blank"
                                class="flex-1 py-2 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                                {{ t('scenes.editor.testLink') }} ↗
                            </a>
                            <button @click="revokeLink"
                                class="px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors">
                                {{ t('scenes.editor.revokeLink') }}
                            </button>
                        </div>
                    </div>

                    <div v-else class="text-center py-4 bg-gray-800/30 rounded-xl border border-gray-800 border-dashed">
                        <p class="text-sm text-gray-400 mb-3">{{ t('scenes.editor.sceneNotShared') }}</p>
                        <button @click="generateLink"
                            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors">
                            🔗 {{ t('scenes.editor.createShareLink') }}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
    
    <!-- Aydınlatma Kontrol Paneli -->
    <div v-if="showLightingPanel"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
        @click.self="showLightingPanel = false">
        <div
            class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

            <div class="p-5 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-yellow-600/20 to-orange-600/20">
                <h3 class="font-bold text-lg text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {{ t('scenes.editor.lightingSettings') }}
                </h3>
                <button @click="showLightingPanel = false"
                    class="text-gray-400 hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                <!-- Ambient Light Kontrolü -->
                <div class="space-y-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                        <h4 class="text-sm font-bold text-white">{{ t('scenes.editor.lighting.ambient') }}</h4>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.intensity') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="range" min="0" max="2" step="0.1" 
                                :value="lightingSettings.ambientIntensity"
                                @input="updateAmbientIntensity(parseFloat(($event.target as HTMLInputElement).value))"
                                class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                            <span class="text-xs text-white font-mono w-12 text-right">{{ lightingSettings.ambientIntensity.toFixed(1) }}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.color') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="color" 
                                :value="lightingSettings.ambientColor"
                                @input="updateAmbientColor(($event.target as HTMLInputElement).value)"
                                class="w-12 h-8 rounded border-2 border-gray-600 cursor-pointer">
                            <span class="text-xs text-white font-mono">{{ lightingSettings.ambientColor }}</span>
                        </div>
                    </div>
                </div>

                <!-- Directional Light Kontrolü -->
                <div class="space-y-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <h4 class="text-sm font-bold text-white">{{ t('scenes.editor.lighting.directional') }}</h4>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.intensity') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="range" min="0" max="3" step="0.1" 
                                :value="lightingSettings.directionalIntensity"
                                @input="updateDirectionalIntensity(parseFloat(($event.target as HTMLInputElement).value))"
                                class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500">
                            <span class="text-xs text-white font-mono w-12 text-right">{{ lightingSettings.directionalIntensity.toFixed(1) }}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.color') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="color" 
                                :value="lightingSettings.directionalColor"
                                @input="updateDirectionalColor(($event.target as HTMLInputElement).value)"
                                class="w-12 h-8 rounded border-2 border-gray-600 cursor-pointer">
                            <span class="text-xs text-white font-mono">{{ lightingSettings.directionalColor }}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.positionX') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="range" min="-50" max="50" step="1" 
                                :value="lightingSettings.directionalX"
                                @input="updateDirectionalPosition(parseFloat(($event.target as HTMLInputElement).value), lightingSettings.directionalY, lightingSettings.directionalZ)"
                                class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500">
                            <span class="text-xs text-white font-mono w-12 text-right">{{ lightingSettings.directionalX }}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.positionY') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="range" min="5" max="100" step="1" 
                                :value="lightingSettings.directionalY"
                                @input="updateDirectionalPosition(lightingSettings.directionalX, parseFloat(($event.target as HTMLInputElement).value), lightingSettings.directionalZ)"
                                class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500">
                            <span class="text-xs text-white font-mono w-12 text-right">{{ lightingSettings.directionalY }}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-xs text-gray-400 block">{{ t('scenes.editor.lighting.positionZ') }}</label>
                        <div class="flex items-center gap-3">
                            <input type="range" min="-50" max="50" step="1" 
                                :value="lightingSettings.directionalZ"
                                @input="updateDirectionalPosition(lightingSettings.directionalX, lightingSettings.directionalY, parseFloat(($event.target as HTMLInputElement).value))"
                                class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500">
                            <span class="text-xs text-white font-mono w-12 text-right">{{ lightingSettings.directionalZ }}</span>
                        </div>
                    </div>
                </div>

                <!-- Sıfırlama Butonu -->
                <button @click="resetLighting"
                    class="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ t('scenes.editor.lighting.resetToDefault') }}
                </button>
            </div>
        </div>
    </div>
    
    <!-- Kalıcı Boya Paneli -->
    <MaterialPaintPanel 
        v-if="canEdit && isPaintMode" 
        ref="paintPanelRef"
        @close="togglePaintMode" 
        @undo="handlePaintUndo"
    />
    
    <!-- Boya Modu Tooltip -->
    <Transition name="fade">
        <div v-if="showPaintTooltip" 
            class="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] pointer-events-none">
            <div class="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <!-- Web tooltip -->
                <span class="hidden md:block">🎨 Sol Tıkla/Sürükle: Boya | Sağ Tıkla: Döndür | Space+Sürükle: Kaydır</span>
                <!-- Mobil tooltip -->
                <span class="md:hidden">🎨 Tıkla: Boya | Sürükle: Döndür | 2 Parmak: Zoom</span>
            </div>
        </div>
    </Transition>
    
    <!-- Teklif İsteme Modalı -->
    <QuoteRequestModal 
        v-if="showQuoteModal" 
        :sceneId="sceneId" 
        @close="showQuoteModal = false" 
        @success="showQuoteModal = false" 
    />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, markRaw, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { TextureLoader } from 'three';
import { useARExport } from '../composables/useARExport';

// Service Imports
import { arSceneService } from '../../../services/arSceneService';
import { arModelService } from '../../../services/arModelService';

// DTO Imports
import type { ARSceneDto, SceneItemDto } from '../dto/arScene.dto';
import type { ARModelDto } from '../../ar-model/dto/arModel.dto';
import { offsetPolygon } from '../../../utils/mathUtils';
import MaterialPaintPanel from '../components/MaterialPaintPanel.vue';
import QuoteRequestModal from '../../quote-request/components/QuoteRequestModal.vue';
import { useAuthStore } from '../../../store/modules/auth';
import { shapesStore } from '../../../store/modules/shapes';
import type { FloorLayer } from '../../../types/geometry';
import { generateFilletPath } from '../../../utils/geometryEngine';

// --- DYNAMIC SHAPE LIBRARY ---
const shapeLibrary = computed(() =>
    shapesStore.items.map(s => ({ id: s.code, label: s.labelTR, icon: s.icon, path: s.svgPath }))
);

// --- STATE ---
const route = useRoute();
const { t } = useI18n();
const authStore = useAuthStore();
const sceneId = Number(route.params.id);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const isLoading = ref(true);
const loadingMessage = ref('3D Sahne Hazırlanıyor...');
const loadingProgress = ref(0);

// AR Export Composable
const { 
    exportProgress, 
    isExporting, 
    exportSceneToGLB, 
    convertToUSDZ,
    resetExport 
} = useARExport();

// Export progress tracking
const currentExportMessage = computed(() => exportProgress.value.message);
const currentExportProgress = computed(() => exportProgress.value.progress);

// [YENİ] UI Durumları
const showSidebar = ref(true);
const showModelSelector = ref(false);
const showDownloadMenu = ref(false);
const showQuoteModal = ref(false);
const showMobileActions = ref(false);
const currentTransformMode = ref<'translate' | 'rotate' | 'scale'>('translate');

const sceneData = ref<ARSceneDto | null>(null);
const sceneItems = ref<SceneItemDto[]>([]);
const availableModels = ref<ARModelDto[]>([]);
const selectedItemId = ref<number | null>(null);
const isPaintMode = ref(false);
const saveStatus = ref<'idle' | 'saved' | 'saving' | 'error'>('idle');
const showPaintTooltip = ref(false);
const isPainting = ref(false);
const spacePressed = ref(false);
const paintPanelRef = ref<InstanceType<typeof MaterialPaintPanel> | null>(null);
const showShareModal = ref(false);
const publicShareUrl = ref<string | null>(null);
const showLightingPanel = ref(false);
const lightingSettings = ref({
    ambientIntensity: 0.7,
    ambientColor: '#ffffff',
    directionalIntensity: 1.2,
    directionalColor: '#ffffff',
    directionalX: 15,
    directionalY: 30,
    directionalZ: 15
});
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const isMember = computed(() => authStore.user?.role === 'MEMBER');

const canEdit = computed(() => {
    return !isMember.value || sceneData.value?.memberCanEdit === true;
});

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
let ambientLight: THREE.AmbientLight;
let directionalLight: THREE.DirectionalLight;

const itemsMap = new Map<number, THREE.Object3D>();

// --- LIFECYCLE ---
onMounted(async () => {
    // Texture loading callback'i ayarla
    const { setTextureLoadingCallback } = await import('../utils/pbrTextureLoader');
    let totalTextures = 0;
    let loadedTextures = 0;
    
    setTextureLoadingCallback((_loaded, total, item) => {
        if (total > 0) {
            totalTextures++;
            loadedTextures++;
            loadingProgress.value = (loadedTextures / Math.max(totalTextures, 5)) * 100;
            loadingMessage.value = `Texture yükleniyor: ${item}`;
        }
    });

    // Load dynamic shapes for floor marks
    try { 
        loadingMessage.value = 'Şekil kütüphanesi yükleniyor...';
        await shapesStore.fetch(undefined, true); 
    } catch {}
    
    // [YENİ] Mobilde sidebar'ı varsayılan olarak kapalı başlat
    if (window.innerWidth < 768) {
        showSidebar.value = false;
    }

    if (!sceneId) return;

    try {
        loadingMessage.value = 'Sahne bilgileri yükleniyor...';
        loadingProgress.value = 10;
        await loadSceneData();
        
        loadingMessage.value = 'Modeller listeleniyor...';
        loadingProgress.value = 20;
        const ownerCompanyId = sceneData.value?.companyId;
        availableModels.value = await arModelService.listModels(ownerCompanyId);

        loadingMessage.value = '3D sahne oluşturuluyor...';
        loadingProgress.value = 40;
        await nextTick();
        initThreeJS();
        
        loadingMessage.value = 'Modeller yükleniyor...';
        loadingProgress.value = 60;
        await loadSceneObjects();
        
        loadingProgress.value = 100;
    } catch (error) {
        console.error("Başlatma hatası:", error);
    } finally {
        isLoading.value = false;
    }
});

onBeforeUnmount(() => {
    renderer?.dispose();
    if (transformControl) {
        transformControl.detach();
        transformControl.dispose();
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', handleResize);
});

// --- API ---
const loadSceneData = async () => {
    sceneData.value = await arSceneService.getScene(sceneId);
    sceneItems.value = sceneData.value.items;
    if (sceneData.value.shareToken) {
        // window.location.origin kullanımı frontend'in çalıştığı domaini alır
        publicShareUrl.value = `${window.location.origin}/view/scene/${sceneData.value.shareToken}`;
    } else {
        publicShareUrl.value = null;
    }
    
    // Kaydedilmiş aydınlatma ayarlarını yükle
    if (sceneData.value.settings?.lighting) {
        const saved = sceneData.value.settings.lighting;
        lightingSettings.value = {
            ambientIntensity: saved.ambientIntensity ?? 0.7,
            ambientColor: saved.ambientColor ?? '#ffffff',
            directionalIntensity: saved.directionalIntensity ?? 1.2,
            directionalColor: saved.directionalColor ?? '#ffffff',
            directionalX: saved.directionalX ?? 15,
            directionalY: saved.directionalY ?? 30,
            directionalZ: saved.directionalZ ?? 15
        };
    }
};

// [EKLE] DEBOUNCED AUTO-SAVE TETİKLEYİCİSİ
const triggerAutoSave = (itemId: number) => {
    if (!canEdit.value) return;

    saveStatus.value = 'saving';
    if (saveTimeout) clearTimeout(saveTimeout);

    // 1.5 saniye bekle, sonra kaydet
    saveTimeout = setTimeout(async () => {
        await performSave(itemId);
    }, 1500);
};

// [EKLE] GERÇEK KAYIT İŞLEMİ
const performSave = async (itemId: number) => {
    if (!canEdit.value) return;

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
    if (!canEdit.value) return;

    currentTransformMode.value = mode;
    if (transformControl) {
        transformControl.setMode(mode);
        renderScene();
    }
};

const deleteSelectedItem = () => {
    if (!canEdit.value) return;

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
    // PBR Texture desteği
    if (layer.textureId) {
        try {
            const { createPBRMaterialFromId } = await import('../utils/pbrTextureLoader');
            const material = await createPBRMaterialFromId(
                layer.textureId,
                {
                    textureScale: layer.textureScale || 1,
                    roughnessValue: 0.9,
                    metalnessValue: 0.1,
                    side: THREE.DoubleSide
                }
            );
            return material;
        } catch (error) {
            console.warn("PBR texture yüklenemedi:", error);
        }
    }
    
    // Legacy simple texture
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
        }
    }
    
    // Düz renk
    return new THREE.MeshStandardMaterial({
        color: layer.color || '#94a3b8',
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
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
        // Çevre katmanı sadece D IŞA DOĞRU büyüsün
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
        // Sonraki katman için, outer boundary yeni inner boundary olur
        currentInnerBoundary = currentOuterBoundary;
    }

    targetScene.add(perimeterGroup);
};

// =======================================================
// EXPORT & CONVERT
// =======================================================

const handleExport = async (format: 'glb' | 'usdz') => {
    if (isExporting.value) return;
    showDownloadMenu.value = false;

    try {
        // Scene'i GLB olarak export et
        const glbBlob = await exportSceneToGLB(
            scene,
            sceneData.value?.settings,
            {
                buildPerimeterLayers,
                isMobile: false // Editor'da mobil optimizasyonu yapmayız
            }
        );
        
        const fileName = sceneData.value?.name || 'sahne';
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (format === 'glb') {
            // GLB'yi indir
            const link = document.createElement('a');
            link.href = URL.createObjectURL(glbBlob);
            link.download = `${safeFileName}.glb`;
            link.click();
            URL.revokeObjectURL(link.href);
            
            console.log("✅ GLB indirildi!");
        } else {
            // USDZ'ye çevir ve indir
            const usdzUrl = await convertToUSDZ(glbBlob, `${safeFileName}.glb`);
            
            const link = document.createElement('a');
            link.href = usdzUrl;
            link.download = `${safeFileName}.usdz`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log("✅ USDZ indirildi!");
        }
        
        // Export state'i sıfırla
        setTimeout(() => {
            resetExport();
        }, 1000);

    } catch (error) {
        console.error("Export hatası:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes('zaman aşımı')) {
            alert("⏱️ İşlem çok uzun sürdü. Sahne çok karmaşık olabilir. Lütfen daha az obje ile tekrar deneyin.");
        } else if (errorMsg.includes('memory') || errorMsg.includes('bellek')) {
            alert("📊 Yetersiz bellek. Lütfen sayfayı yenileyip tekrar deneyin.");
        } else {
            alert("Export sırasında bir hata oluştu: " + errorMsg);
        }
        resetExport();
    }
};

// --- MOD DEĞİŞTİRME ---
const togglePaintMode = () => {
    if (!canEdit.value) return;

    isPaintMode.value = !isPaintMode.value;

    if (isPaintMode.value && window.innerWidth < 768) {
        showSidebar.value = false;
    }

    // Mod değişince seçimleri sıfırla
    selectedItemId.value = null;
    transformControl.detach();

    if (isPaintMode.value) {
        transformControl.enabled = false; // Gizmo'yu kapat
        document.body.style.cursor = 'crosshair'; // İmleci değiştir
        
        // Orbit kontrollerini boya modu için ayarla
        orbit.mouseButtons = {
            LEFT: null as any, // Sol tuş boyama için boş
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE // Sağ tuş rotate
        };
        // Mobilde orbit her zaman aktif - tek parmak rotate, sadece tıklama boyar
        orbit.touches = {
            ONE: THREE.TOUCH.ROTATE, // Tek parmak döndürme
            TWO: THREE.TOUCH.DOLLY_PAN // İki parmak zoom/pan
        };
        
        // Tooltip göster
        showPaintTooltip.value = true;
        setTimeout(() => {
            showPaintTooltip.value = false;
        }, 5000);
    } else {
        transformControl.enabled = true;
        document.body.style.cursor = 'default';
        
        // Orbit kontrollerini normale döndür
        orbit.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        orbit.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
    }
    
    renderScene(); // Mod değişiminde render
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
    ambientLight = new THREE.AmbientLight(0xffffff, lightingSettings.value.ambientIntensity);
    ambientLight.color.set(lightingSettings.value.ambientColor);
    scene.add(ambientLight);
    
    directionalLight = new THREE.DirectionalLight(0xffffff, lightingSettings.value.directionalIntensity);
    directionalLight.color.set(lightingSettings.value.directionalColor);
    directionalLight.position.set(
        lightingSettings.value.directionalX,
        lightingSettings.value.directionalY,
        lightingSettings.value.directionalZ
    );
    directionalLight.castShadow = true;
    const d = maxDim * 1.2;
    directionalLight.shadow.camera.left = -d; directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d; directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight);

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
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    };

    let baseMaterial: THREE.MeshStandardMaterial;
    
    // PBR Texture desteği
    if (settings.floorTextureId) {
        // PBR texture ID'si varsa backend'den texture bilgisini al ve PBR material oluştur
        try {
            const { createPBRMaterialFromId } = await import('../utils/pbrTextureLoader');
            baseMaterial = await createPBRMaterialFromId(
                settings.floorTextureId,
                {
                    textureScale: texScale,
                    roughnessValue: 0.8,
                    metalnessValue: 0.1,
                    ...baseMaterialParams
                }
            );
        } catch (error) {
            console.error('PBR texture yükleme hatası:', error);
            // Fallback: düz renk
            baseMaterial = new THREE.MeshStandardMaterial({
                color: floorColor,
                ...baseMaterialParams
            });
        }
    } else if (floorTextureUrl) {
        // Legacy simple texture desteği
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
        // Renk bazlı material
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

    console.log('[Editor] Floor layers sayısı:', floorLayers.length, 'Layers:', floorLayers);
    console.log('[Editor] Shape library:', shapeLibrary.value);

    if (floorLayers.length > 0) {
        const sortedLayers = [...floorLayers].sort((a, b) => a.zIndex - b.zIndex);
        const svgLoader = new SVGLoader();
        const textureLoader = new THREE.TextureLoader();

        for (let index = 0; index < sortedLayers.length; index++) {
            const layer = sortedLayers[index] as FloorLayer;
            let layerGeo: THREE.BufferGeometry | null = null;

            // Handle freehand geometry with fillets
            if (layer.geometryType === 'freehand' && layer.points && layer.points.length >= 3) {
                const svgPath = generateFilletPath(layer.points, true);
                const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${svgPath}" /></svg>`;
                const shapeData = svgLoader.parse(svgMarkup);
                
                if (shapeData.paths && shapeData.paths.length > 0) {
                    const shapes: THREE.Shape[] = [];
                    shapeData.paths.forEach((path) => {
                        const pathShapes = path.toShapes(true);
                        shapes.push(...pathShapes);
                    });
                    
                    if (shapes.length > 0) {
                        layerGeo = new THREE.ShapeGeometry(shapes);
                    }
                }
            }
            // Handle preset geometry
            else {
                const shapeDef = shapeLibrary.value.find(s => s.id === layer.shapeId) || shapeLibrary.value[0];
                if (shapeDef) {
                    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${shapeDef.path}" /></svg>`;
                    const shapeData = svgLoader.parse(svgMarkup);
                    
                    if (shapeData.paths && shapeData.paths.length > 0) {
                        const shapes: THREE.Shape[] = [];
                        shapeData.paths.forEach((path) => {
                            const pathShapes = path.toShapes(true);
                            shapes.push(...pathShapes);
                        });
                        
                        if (shapes.length > 0) {
                            layerGeo = new THREE.ShapeGeometry(shapes);
                            layerGeo.computeBoundingBox();
                            const center = new THREE.Vector3();
                            if (layerGeo.boundingBox) layerGeo.boundingBox.getCenter(center);
                            layerGeo.translate(-center.x, -center.y, -center.z);
                        }
                    }
                }
            }

            if (!layerGeo) continue;

            let layerMat: THREE.Material;

            // Load layer texture if available
            if (layer.texture && layer.texture.id) {
                // PBR texture - use MeshStandardMaterial
                try {
                    const { createPBRMaterialFromId } = await import('../utils/pbrTextureLoader');
                    const scale = layer.texture.scale || 1;
                    layerMat = await createPBRMaterialFromId(
                        layer.texture.id,
                        {
                            textureScale: scale,
                            roughnessValue: 0.8,
                            metalnessValue: 0.1
                        }
                    );
                    // Apply layer specific properties
                    layerMat.transparent = layer.opacity !== undefined && layer.opacity < 1;
                    layerMat.opacity = layer.opacity !== undefined ? layer.opacity : 1;
                    layerMat.side = THREE.DoubleSide;
                    layerMat.polygonOffset = true;
                    layerMat.polygonOffsetFactor = -1 - index;
                    layerMat.polygonOffsetUnits = -1 - index;
                    layerMat.depthTest = true;
                } catch (err) {
                    console.warn('[Editor] Layer PBR texture yüklenemedi:', layer.texture.id, err);
                    layerMat = new THREE.MeshBasicMaterial({
                        color: layer.color,
                        transparent: layer.opacity !== undefined && layer.opacity < 1,
                        opacity: layer.opacity !== undefined ? layer.opacity : 1,
                        side: THREE.DoubleSide,
                        polygonOffset: true,
                        polygonOffsetFactor: -1 - index,
                        polygonOffsetUnits: -1 - index,
                        depthTest: true
                    });
                }
            } else if (layer.texture && layer.texture.url) {
                // Simple texture - use MeshBasicMaterial
                try {
                    const tex = await textureLoader.loadAsync(layer.texture.url);
                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                    const scale = layer.texture.scale || 1;
                    tex.repeat.set(scale, scale);
                    layerMat = new THREE.MeshBasicMaterial({
                        map: tex,
                        transparent: layer.opacity !== undefined && layer.opacity < 1,
                        opacity: layer.opacity !== undefined ? layer.opacity : 1,
                        side: THREE.DoubleSide,
                        polygonOffset: true,
                        polygonOffsetFactor: -1 - index,
                        polygonOffsetUnits: -1 - index,
                        depthTest: true
                    });
                } catch (err) {
                    console.warn('[Editor] Layer simple texture yüklenemedi:', layer.texture.url, err);
                    layerMat = new THREE.MeshBasicMaterial({
                        color: layer.color,
                        transparent: layer.opacity !== undefined && layer.opacity < 1,
                        opacity: layer.opacity !== undefined ? layer.opacity : 1,
                        side: THREE.DoubleSide,
                        polygonOffset: true,
                        polygonOffsetFactor: -1 - index,
                        polygonOffsetUnits: -1 - index,
                        depthTest: true
                    });
                }
            } else {
                // No texture - use color
                layerMat = new THREE.MeshBasicMaterial({
                    color: layer.color,
                    transparent: layer.opacity !== undefined && layer.opacity < 1,
                    opacity: layer.opacity !== undefined ? layer.opacity : 1,
                    side: THREE.DoubleSide,
                    polygonOffset: true,
                    polygonOffsetFactor: -1 - index,
                    polygonOffsetUnits: -1 - index,
                    depthTest: true
                });
            }

            const correctedX = layer.x - centerOffset.x;
            const correctedZ = layer.z - centerOffset.y;
            const zFightOffset = 0.001 * (index + 1);
            
            const layerMesh = new THREE.Mesh(layerGeo, layerMat);
            
            // Scale only for preset shapes
            if (layer.geometryType === 'preset') {
                layerMesh.scale.set(layer.width, layer.height, 1);
            }
            
            layerMesh.position.set(correctedX, correctedZ, zFightOffset);
            layerMesh.renderOrder = 100 + layer.zIndex;
            layerMesh.rotation.z = -layer.rotation;
            layerMesh.name = `FloorLayer_${layer.geometryType}_${index}`;
            floorGroup.add(layerMesh);
        }
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
    
    // Sadece kullanıcı kamerayı hareket ettirdiğinde render yap
    orbit.addEventListener('change', renderScene);

    // [GÜNCELLEME]: Transform Controls'u UI state ile bağla
    transformControl = markRaw(new TransformControls(camera, renderer.domElement));
    
    // Transform değiştiğinde render yap
    transformControl.addEventListener('change', renderScene);
    transformControl.addEventListener('dragging-changed', (event) => { 
        orbit.enabled = !event.value;
        renderScene();
    });
    
    // Eğer düzenleme yetkisi YOKSA (canEdit = false), kontrolü devre dışı bırak
    if (!canEdit.value) {
        transformControl.enabled = false;
    } else {
        // Yetki VARSA eventleri bağla ve modu ayarla
        transformControl.addEventListener('mouseUp', async () => {
            if (transformControl.object && selectedItemId.value) {
                await saveTransform(selectedItemId.value);
                renderScene();
            }
        });
        // Başlangıç modunu ayarla
        transformControl.setMode(currentTransformMode.value);
    }
    
    scene.add(transformControl.getHelper());

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvasRef.value.addEventListener('mousedown', onMouseDown);
    canvasRef.value.addEventListener('mouseup', onMouseUp);
    canvasRef.value.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    startRendering();
};

const handleResize = () => {
    if (!canvasRef.value || !camera || !renderer) return;
    // Full screen olduğu için window boyutunu kullanmak daha güvenlidir
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderScene(); // Resize'da bir kez render
};

// On-demand rendering - sadece gerektiğinde render yap
let renderRequested = false;
const renderScene = () => {
    if (!renderer || !scene || !camera) return;
    
    // Eğer zaten bir render bekliyor ise tekrar isteme
    if (renderRequested) return;
    
    renderRequested = true;
    requestAnimationFrame(() => {
        renderRequested = false;
        orbit.update();
        renderer.render(scene, camera);
    });
};

// İlk render
const startRendering = () => {
    renderScene();
};

// --- MODEL İŞLEMLERİ ---
const loadSceneObjects = async () => {
    if (!sceneData.value) return;
    const loader = new GLTFLoader();
    
    // Draco decoder yapılandırması
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);

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
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Item ${item.id} yüklenemedi:`, err);
        }
    }
    
    // Draco loader'ı temizle
    dracoLoader.dispose();
    
    // Modeller yüklendikten sonra ilk render
    renderScene();
};

const addModelToScene = async (arModel: ARModelDto) => {
    if (!canEdit.value) return;

    isLoading.value = true;
    showModelSelector.value = false;

    try {
        const loader = new GLTFLoader();
        
        // Draco decoder yapılandırması
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);
        
        const blob = await arModelService.getModelFileBlob(arModel.id, 'glb', 'view');
        const url = URL.createObjectURL(blob);
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;
        
        // Draco loader'ı temizle
        dracoLoader.dispose();

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
        
        renderScene(); // Yeni model eklendiğinde render

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
    
    // Boya modunda sol tuş ile boyamaya başla
    // MOBİLDE: Sürükleme başlatma, sadece tek tıklamada boya
    // WEB: Sürükleme boyama aktif
    const isMobile = window.innerWidth < 768;
    if (isPaintMode.value && event.button === 0 && !spacePressed.value && !isMobile) {
        isPainting.value = true;
        // İlk tıklama için hemen boya
        paintAtMouse(event);
    }
};

const onMouseMove = (event: MouseEvent) => {
    // Sürüklerken boyama (sadece web'de)
    const isMobile = window.innerWidth < 768;
    if (isPainting.value && !spacePressed.value && !isMobile) {
        paintAtMouse(event);
    }
};

const onMouseUp = (event: MouseEvent) => {
    if (!canvasRef.value) return;
    
    // Boyama bitir (web)
    if (isPainting.value) {
        isPainting.value = false;
        return;
    }

    // Tıklama hassasiyetini biraz artırdık (5 -> 10)
    const distance = mouseStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (distance > 10) return;

    const rect = canvasRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // MOBİLDE: Boya modunda tek tıklama boyama
    const isMobile = window.innerWidth < 768;
    if (isPaintMode.value && isMobile && event.button === 0) {
        paintAtMouse(event);
        return;
    }

    // Sadece normal modda seçim yap
    if (!isPaintMode.value) {
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
            renderScene();
        }
    }
};

// --- BOYAMA FONKSİYONU ---
const paintAtMouse = (event: MouseEvent) => {
    if (!canvasRef.value || !paintPanelRef.value) return;
    
    const rect = canvasRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // SceneItem'a ait olan ilk MESH'i bul
    const hit = intersects.find(i => {
        if (!(i.object as THREE.Mesh).isMesh) return false;
        let p = i.object.parent;
        while (p) {
            if (p.userData?.isSceneItem) return true;
            p = p.parent;
        }
        return false;
    });
    
    if (!hit) return;
    
    const mesh = hit.object as THREE.Mesh;
    const material = paintPanelRef.value.getCurrentMaterial();
    
    // Materyal uygula
    let mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    
    // Önceki materyal bilgisini kaydet (undo için)
    const previousMaterial = mat ? {
        color: '#' + (mat as THREE.MeshStandardMaterial).color.getHexString(),
        metalness: (mat as THREE.MeshStandardMaterial).metalness || 0,
        roughness: (mat as THREE.MeshStandardMaterial).roughness || 0.5
    } : {
        color: '#ffffff',
        metalness: 0,
        roughness: 0.5
    };
    
    if (!mesh.userData.hasCustomMaterial && mat) {
        mat = mat.clone();
        mesh.material = mat;
        mesh.userData.hasCustomMaterial = true;
    }
    
    const stdMat = mat as THREE.MeshStandardMaterial;
    stdMat.color.set(material.color);
    stdMat.metalness = material.metalness;
    stdMat.roughness = material.roughness;
    
    // Parçanın bağlı olduğu sceneItem'i bul ve kaydet
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
        const item = sceneItems.value.find(i => i.id === sceneItemId);
        if (item) {
            if (!item.materialConfig) item.materialConfig = {};
            item.materialConfig[mesh.name] = {
                color: material.color,
                metalness: material.metalness,
                roughness: material.roughness
            };
            triggerAutoSave(sceneItemId);
        }
    }
    
    // Panele bildirim gönder (undo history ile birlikte)
    paintPanelRef.value.notifyPaint(mesh.name || 'İsimsiz Parça', mesh, previousMaterial);
    
    // Boyama sonrası render
    renderScene();
};

// Boyama undo handler - materyal bilgisini güncelle ve kaydet
const handlePaintUndo = (sceneItemId: number, meshName: string, previousMaterial: { color: string; metalness: number; roughness: number }) => {
    // SceneItem'daki materialConfig'i güncelle
    const item = sceneItems.value.find(i => i.id === sceneItemId);
    if (item && item.materialConfig) {
        // Önceki materyali geri yükle
        item.materialConfig[meshName] = {
            color: previousMaterial.color,
            metalness: previousMaterial.metalness,
            roughness: previousMaterial.roughness
        };
    }
    
    // Auto-save tetikle
    triggerAutoSave(sceneItemId);
    
    // Undo sonrası render
    renderScene();
};

const selectItemFromTree = (itemId: number) => {
    selectedItemId.value = itemId;
    const mesh = itemsMap.get(itemId);
    if (mesh && canEdit.value) {
        transformControl.attach(mesh);
    } else {
        transformControl.detach();
    }
    renderScene();
};

// [GÜNCELLEME]: Klavye kısayollarını UI State ile eşle
const handleKeyDown = (event: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    
    // SPACE tuşu - boya modunda pan için
    if (event.code === 'Space' && isPaintMode.value) {
        event.preventDefault();
        if (!spacePressed.value) {
            spacePressed.value = true;
            document.body.style.cursor = 'grab';
            // SPACE basılıyken orbit'e geçici pan yetkisi ver
            orbit.mouseButtons.LEFT = THREE.MOUSE.PAN;
        }
        return;
    }
    
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

const handleKeyUp = (event: KeyboardEvent) => {
    // SPACE bırakıldığında pan modundan çık
    if (event.code === 'Space' && isPaintMode.value) {
        event.preventDefault();
        spacePressed.value = false;
        document.body.style.cursor = 'crosshair';
        // Pan yetkisini geri al
        orbit.mouseButtons.LEFT = null as any;
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
        renderScene(); // Silme sonrası render
    } catch (err) {
        console.error(err);
        alert("Silinemedi");
    }
};


// --- PAYLAŞIM YÖNETİMİ ---
const openShareModal = () => {
    showShareModal.value = true;
};

const togglePrivacy = async () => {
    if (!sceneData.value) return;
    const newState = !sceneData.value.isPrivate;

    // Optimistik güncelleme (Hemen UI'da değişsin)
    sceneData.value.isPrivate = newState;

    try {
        await arSceneService.updateScene(sceneId, { isPrivate: newState });
    } catch (e) {
        console.error("Gizlilik güncellenemedi", e);
        sceneData.value.isPrivate = !newState; // Geri al
    }
};

const toggleMemberEdit = async () => {
    if (!sceneData.value) return;
    const newState = !sceneData.value.memberCanEdit;

    sceneData.value.memberCanEdit = newState;

    try {
        await arSceneService.updateScene(sceneId, { memberCanEdit: newState });
    } catch (e) {
        console.error("Yetki güncellenemedi", e);
        sceneData.value.memberCanEdit = !newState;
    }
};

const generateLink = async () => {
    try {
        const res = await arSceneService.generateShareToken(sceneId);
        // Backend tam URL dönüyorsa onu kullan, yoksa token'dan türet
        publicShareUrl.value = res.url || `${window.location.origin}/view/scene/${res.shareToken}`;

        // Local datayı da güncelle ki modal kapatılıp açılınca gitmesin
        if (sceneData.value) sceneData.value.shareToken = res.shareToken;
    } catch (e) {
        console.error("Link oluşturulamadı", e);
        alert("Link oluşturulurken hata oluştu.");
    }
};

const revokeLink = async () => {
    if (!confirm("Bu linki iptal ederseniz, daha önce paylaştığınız kişiler sahneye erişemeyecek. Devam edilsin mi?")) return;

    try {
        await arSceneService.revokeShareToken(sceneId);
        publicShareUrl.value = null;
        if (sceneData.value) sceneData.value.shareToken = null;
    } catch (e) {
        console.error("Link iptal edilemedi", e);
        alert("Link iptal edilirken hata oluştu.");
    }
};

// --- AYDINLATMA KONTROL FONKSİYONLARI ---
const updateAmbientIntensity = (value: number) => {
    lightingSettings.value.ambientIntensity = value;
    if (ambientLight) {
        ambientLight.intensity = value;
    }
    saveLightingSettings();
    renderScene();
};

const updateAmbientColor = (color: string) => {
    lightingSettings.value.ambientColor = color;
    if (ambientLight) {
        ambientLight.color.set(color);
    }
    saveLightingSettings();
    renderScene();
};

const updateDirectionalIntensity = (value: number) => {
    lightingSettings.value.directionalIntensity = value;
    if (directionalLight) {
        directionalLight.intensity = value;
    }
    saveLightingSettings();
    renderScene();
};

const updateDirectionalColor = (color: string) => {
    lightingSettings.value.directionalColor = color;
    if (directionalLight) {
        directionalLight.color.set(color);
    }
    saveLightingSettings();
    renderScene();
};

const updateDirectionalPosition = (x: number, y: number, z: number) => {
    lightingSettings.value.directionalX = x;
    lightingSettings.value.directionalY = y;
    lightingSettings.value.directionalZ = z;
    if (directionalLight) {
        directionalLight.position.set(x, y, z);
    }
    saveLightingSettings();
    renderScene();
};

const resetLighting = () => {
    lightingSettings.value = {
        ambientIntensity: 0.7,
        ambientColor: '#ffffff',
        directionalIntensity: 1.2,
        directionalColor: '#ffffff',
        directionalX: 15,
        directionalY: 30,
        directionalZ: 15
    };
    if (ambientLight) {
        ambientLight.intensity = 0.7;
        ambientLight.color.set('#ffffff');
    }
    if (directionalLight) {
        directionalLight.intensity = 1.2;
        directionalLight.color.set('#ffffff');
        directionalLight.position.set(15, 30, 15);
    }
    saveLightingSettings();
    renderScene();
};

// Aydınlatma ayarlarını backend'e kaydet
let lightingSaveTimeout: ReturnType<typeof setTimeout> | null = null;
const saveLightingSettings = async () => {
    if (!canEdit.value || !sceneData.value) return;
    
    // Debounce: 1 saniye bekle
    if (lightingSaveTimeout) clearTimeout(lightingSaveTimeout);
    
    lightingSaveTimeout = setTimeout(async () => {
        try {
            const currentSettings = sceneData.value!.settings || {};
            await arSceneService.updateScene(sceneId, {
                settings: {
                    ...currentSettings,
                    lighting: {
                        ambientIntensity: lightingSettings.value.ambientIntensity,
                        ambientColor: lightingSettings.value.ambientColor,
                        directionalIntensity: lightingSettings.value.directionalIntensity,
                        directionalColor: lightingSettings.value.directionalColor,
                        directionalX: lightingSettings.value.directionalX,
                        directionalY: lightingSettings.value.directionalY,
                        directionalZ: lightingSettings.value.directionalZ
                    }
                }
            });
            console.log('✅ Aydınlatma ayarları kaydedildi');
        } catch (error) {
            console.error('❌ Aydınlatma kaydetme hatası:', error);
        }
    }, 1000);
};

const copyLink = () => {
    if (publicShareUrl.value) {
        navigator.clipboard.writeText(publicShareUrl.value);
        // İsterseniz ufak bir toast mesajı eklenebilir
        // alert("Kopyalandı!"); 
    }
};

// 🆕 Sahne ekran görüntüsü al ve indir (güncel)
function downloadSceneScreenshot() {
    if (!canvasRef.value || !renderer || !scene || !camera) return;
    // Eğer loading veya export overlay açıksa uyarı ver
    if (isLoading.value || isExporting.value) {
        alert('Sahne tam yüklenmeden ekran görüntüsü alınamaz.');
        return;
    }
    // --- Yüksek çözünürlük için geçici olarak pixelRatio ve boyut artır ---
    const scale = 3; // 2 veya 3 önerilir
    const origWidth = renderer.domElement.width;
    const origHeight = renderer.domElement.height;
    const origPixelRatio = renderer.getPixelRatio();

    renderer.setPixelRatio(scale * origPixelRatio);
    renderer.setSize(origWidth, origHeight, false);
    renderer.render(scene, camera);

    const canvas = canvasRef.value;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = (sceneData.value?.name || 'ar-scene') + '_screenshot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // --- Eski çözünürlüğe geri dön ---
    renderer.setPixelRatio(origPixelRatio);
    renderer.setSize(origWidth, origHeight, false);
    renderer.render(scene, camera);
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
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