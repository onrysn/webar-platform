<template>
    <div v-if="isOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all"
        @click.self="close" role="dialog" aria-modal="true" :aria-labelledby="'scene-modal-title'"
        @keydown.window.ctrl.z="removeLastPoint" @keydown.window.escape="cancelTool"
        @keydown.window.delete="removeLayer" tabindex="-1">

        <div ref="modalRoot"
            :class="['bg-white rounded-3xl md:rounded-3xl shadow-2xl w-full max-w-[95vw] xl:max-w-[1600px] overflow-hidden flex flex-col min-h-[60vh] max-h-[92vh] md:h-[92vh] border border-slate-200/50 transform transition-all duration-200', isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-90']">

            <div
                class="px-4 md:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div class="flex items-center gap-4">
                    <div
                        class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <span v-if="mode === 'create'" class="text-2xl">✨</span>
                        <span v-else class="text-2xl">🛠️</span>
                    </div>
                    <div>
                        <h3 id="scene-modal-title"
                            class="font-extrabold text-xl text-slate-800 tracking-tight leading-none">
                            {{ mode === 'create' ? 'Yeni Sahne Tasarla' : 'Sahneyi Düzenle' }}
                        </h3>
                        <p class="text-xs text-slate-500 mt-1.5 font-medium">AR deneyiminiz için sınırları belirleyin
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="close" aria-label="Kapat"
                        class="p-3 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all text-2xl">&times;</button>
                </div>
            </div>

            <div class="flex flex-col md:flex-row flex-1 overflow-hidden">

                <!-- Mobile overlay to close bottom-sheet -->
                <div v-if="showSidebar" @click="toggleSidebar" class="fixed inset-0 z-40 bg-black/30 md:hidden"></div>

                <div :class="['p-6 space-y-8 overflow-y-auto custom-scrollbar', showSidebar ? 'fixed inset-x-0 bottom-0 rounded-t-3xl w-full z-50 bg-white border-t border-slate-200 p-6 md:static md:w-80 md:h-auto md:rounded-none md:border-r md:border-t-0 md:block' : 'hidden md:block md:w-80 lg:w-[380px]']"
                    :style="showSidebar ? { height: sheetHeight + 'px' } : {}" ref="sheetEl">

                    <div v-if="showSidebar" class="md:hidden w-full flex justify-center mb-2 -mt-2">
                        <div @mousedown.prevent.stop="startSheetDrag" @touchstart.prevent.stop="startSheetDrag"
                            role="button" aria-label="Sürükle"
                            style="touch-action: none; -webkit-user-select: none; user-select: none;"
                            :class="['w-16 h-2 rounded-full bg-slate-200 pt-4 pb-2', isDraggingSheet ? 'cursor-grabbing' : 'cursor-grab']">
                        </div>
                    </div>
                    <div class="flex items-center justify-between md:hidden mb-4">
                        <h4 class="text-sm font-black">Ayarlar</h4>
                        <div class="flex items-center gap-2">
                            <button @click="toggleSidebar" aria-label="Kapat ayarlar"
                                class="p-2 text-slate-600 text-xl">&times;</button>
                            <button @click="toggleSidebar" aria-label="Tamam"
                                class="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">Tamam</button>
                        </div>
                    </div>

                    <!-- Drag handle for bottom-sheet (mobile) -->

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
                                <button @click="clearTexture()"
                                    class="aspect-square rounded-xl border-2 flex items-center justify-center bg-white shadow-sm transition-all"
                                    :class="selectedTexture === null ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'">
                                    <span class="opacity-30 text-xl grayscale">🎨</span>
                                </button>
                                <button v-for="tex in textureList" :key="tex.id"
                                    @click="selectTexture(tex)"
                                    class="aspect-square rounded-xl border-2 overflow-hidden transition-all shadow-sm group relative"
                                    :class="(tex.type === 'PBR' ? selectedTexture === tex.id : selectedTexture === tex.textureUrl) ? 'border-indigo-600 ring-2 ring-indigo-50 ring-offset-1' : 'border-transparent hover:border-slate-200'">
                                    <img :src="tex.thumbnailUrl"
                                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div v-if="tex.type === 'PBR'" class="absolute bottom-0 right-0 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded-tl">
                                        PBR
                                    </div>
                                </button>
                            </div>
                            <div v-if="selectedTexture"
                                class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                                <label
                                    class="block text-[10px] font-black text-indigo-400 uppercase tracking-wider">Doku
                                    Ölçeği</label>
                                <div class="flex gap-2">
                                    <button v-for="val in [1, 2, 4, 8]" :key="val" @click="form.textureScale = val"
                                        class="flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                                        :class="form.textureScale === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100'">
                                        {{ val }}x
                                    </button>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-3 bg-white rounded-2xl border border-slate-200 relative">
                                    <span class="text-[9px] font-black uppercase text-slate-400">Zemin</span>
                                    <div class="flex items-center gap-2 mt-2">
                                        <div class="w-6 h-6 rounded-full border border-slate-200"
                                            :style="{ backgroundColor: form.floorColor }"></div>
                                        <input v-model="form.floorColor" :disabled="!!selectedTexture" type="color"
                                            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                                    </div>
                                </div>
                                <div class="p-3 bg-white rounded-2xl border border-slate-200 relative">
                                    <span class="text-[9px] font-black uppercase text-slate-400">Arka Plan</span>
                                    <div class="flex items-center gap-2 mt-2">
                                        <div class="w-6 h-6 rounded-full border border-slate-200"
                                            :style="{ backgroundColor: form.bgColor }"></div>
                                        <input v-model="form.bgColor" type="color"
                                            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="space-y-4 border-t border-slate-200 pt-5">

                        <div class="flex justify-between items-end">
                            <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Zemin
                                İşaretleri</h4>
                            <button @click="openToolLibrary"
                                class="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                                Tümünü Gör <span>→</span>
                            </button>
                        </div>

                        <div class="grid grid-cols-4 gap-2">
                            <!-- Freehand Tool (Always first) -->
                            <button @click="selectTool('freehand')"
                                class="group relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-200"
                                :class="activeTool === 'freehand' || isFreehandMode
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'">
                                <span class="text-xl group-hover:scale-110 transition-transform duration-300">✏️</span>
                            </button>

                            <button v-for="tool in quickAccessTools.slice(0, 7)" :key="tool.id" @click="selectTool(tool.id)"
                                class="group relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-200"
                                :class="activeTool === tool.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'">
                                <span class="text-xl group-hover:scale-110 transition-transform duration-300">{{
                                    tool.icon }}</span>
                            </button>

                            <button @click="openToolLibrary"
                                class="aspect-square rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <span class="text-xl">+</span>
                            </button>
                        </div>

                        <div v-if="isFreehandMode"
                            class="bg-slate-900 text-white p-3 rounded-xl flex gap-3 items-center shadow-lg animate-in fade-in slide-in-from-bottom-2">
                            <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                                ✏️
                            </div>
                            <div class="flex-1">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serbest Çizim</p>
                                <p class="text-xs font-bold">
                                    {{ freehandPoints.length === 0 ? 'Tıklayarak nokta ekleyin...' : 
                                       freehandPoints.length < 3 ? `${freehandPoints.length} nokta (Min: 3)` :
                                       `${freehandPoints.length} nokta - Başlangıca tıklayın` }}
                                </p>
                            </div>
                            <button @click="cancelFreehandDrawing" class="text-slate-400 hover:text-white px-2">✕</button>
                        </div>

                        <div v-if="activeTool"
                            class="bg-slate-900 text-white p-3 rounded-xl flex gap-3 items-center shadow-lg animate-in fade-in slide-in-from-bottom-2">
                            <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                                {{shapeLibrary.find(t => t.id === activeTool)?.icon}}
                            </div>
                            <div class="flex-1">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mod Aktif</p>
                                <p class="text-xs font-bold">{{shapeLibrary.find(t => t.id === activeTool)?.label}}
                                    çiziliyor...</p>
                            </div>
                            <button @click="cancelTool" class="text-slate-400 hover:text-white px-2">✕</button>
                        </div>

                        <div v-if="selectedLayerId && !activeTool"
                            class="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">

                            <div class="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-0 opacity-50">
                            </div>

                            <div class="flex justify-between items-center border-b border-slate-100 pb-3 relative z-10">
                                <div class="flex flex-col">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase">Obje Adı</label>
                                    <input type="text" v-model="layers.find(l => l.id === selectedLayerId)!.name"
                                        class="bg-transparent text-sm font-black text-slate-700 outline-none w-32 focus:text-indigo-600 border-b border-transparent focus:border-indigo-200 transition-colors" />
                                </div>
                                <div class="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <button @click="bringToFront" title="Öne Getir"
                                        class="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-400 hover:text-indigo-600 hover:shadow transition-all">
                                        ▲
                                    </button>
                                    <button @click="sendToBack" title="Arkaya Gönder"
                                        class="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-400 hover:text-amber-600 hover:shadow transition-all">
                                        ▼
                                    </button>
                                    <button @click="removeLayer" title="Sil"
                                        class="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-400 hover:text-red-500 hover:shadow transition-all">
                                        🗑
                                    </button>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3 relative z-10">
                                <div
                                    class="bg-slate-50 p-2 rounded-xl border border-slate-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    <label class="text-[8px] font-bold text-slate-400 uppercase block mb-1">Genişlik
                                        (m)</label>
                                    <input type="number" step="0.1"
                                        v-model.number="layers.find(l => l.id === selectedLayerId)!.width"
                                        class="w-full bg-transparent text-sm font-black text-slate-700 outline-none">
                                </div>
                                <div
                                    class="bg-slate-50 p-2 rounded-xl border border-slate-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    <label class="text-[8px] font-bold text-slate-400 uppercase block mb-1">Yükseklik
                                        (m)</label>
                                    <input type="number" step="0.1"
                                        v-model.number="layers.find(l => l.id === selectedLayerId)!.height"
                                        class="w-full bg-transparent text-sm font-black text-slate-700 outline-none">
                                </div>
                            </div>

                            <div
                                class="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 relative z-10">
                                <span class="text-[10px] font-bold text-slate-500 pl-1">Renk</span>
                                <div class="flex items-center gap-2 relative">
                                    <span class="text-[10px] font-mono text-slate-400 uppercase">{{layers.find(l =>
                                        l.id === selectedLayerId)?.color}}</span>
                                    <div class="w-8 h-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                        :style="{ backgroundColor: layers.find(l => l.id === selectedLayerId)?.color }">
                                    </div>
                                    <input type="color" v-model="layers.find(l => l.id === selectedLayerId)!.color"
                                        class="opacity-0 w-full h-full absolute inset-0 cursor-pointer">
                                </div>
                            </div>

                            <div class="space-y-3 relative z-10 pt-1">
                                <div>
                                    <div class="flex justify-between mb-1.5">
                                        <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                            <span>↻</span> Döndür
                                        </span>
                                        <span
                                            class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{{layers.find(l => l.id === selectedLayerId)?.rotation}}°</span>
                                    </div>
                                    <input type="range" min="0" max="360" step="5"
                                        v-model.number="layers.find(l => l.id === selectedLayerId)!.rotation"
                                        class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500">
                                </div>

                                <div>
                                    <div class="flex justify-between mb-1.5">
                                        <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                            <span>◐</span> Opaklık
                                        </span>
                                        <span
                                            class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{{Math.round((layers.find(l => l.id === selectedLayerId)?.opacity || 0) * 100)}}%</span>
                                    </div>
                                    <input type="range" min="0.1" max="1" step="0.05"
                                        v-model.number="layers.find(l => l.id === selectedLayerId)!.opacity"
                                        class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500">
                                </div>
                            </div>

                            <!-- Layer Texture Section -->
                            <div class="border-t border-slate-100 pt-3 space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-slate-500 uppercase">Doku</span>
                                    <button v-if="selectedLayer?.texture" @click="clearLayerTexture(selectedLayerId!)"
                                        class="text-[9px] text-red-500 hover:text-red-600 font-bold">
                                        Temizle
                                    </button>
                                </div>
                                <div class="grid grid-cols-4 gap-2">
                                    <button @click="openLayerTexturePicker(selectedLayerId!)"
                                        :class="['aspect-square rounded-xl border-2 flex items-center justify-center transition-all',
                                            selectedLayer?.texture ? 'border-slate-200' : 'border-indigo-300 bg-indigo-50']">
                                        <span v-if="!selectedLayer?.texture" class="text-2xl">+</span>
                                        <img v-else :src="selectedLayer.texture.thumbnailUrl" 
                                            class="w-full h-full object-cover rounded-lg" />
                                    </button>
                                </div>
                                <div v-if="selectedLayer?.texture" class="bg-indigo-50 p-2 rounded-xl">
                                    <label class="text-[9px] font-bold text-indigo-600 uppercase block mb-1">Ölçek</label>
                                    <div class="flex gap-1">
                                        <button v-for="val in [1, 2, 4, 8]" :key="val" 
                                            @click="selectedLayer.texture!.scale = val"
                                            :class="['flex-1 py-1 text-[10px] font-bold rounded transition-all',
                                                selectedLayer.texture.scale === val 
                                                    ? 'bg-indigo-600 text-white' 
                                                    : 'bg-white text-indigo-600 hover:bg-indigo-100']">
                                            {{val}}x
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Freehand Point Fillet Section -->
                            <div v-if="selectedLayer?.geometryType === 'freehand' && selectedLayer.points" 
                                class="border-t border-slate-100 pt-3 space-y-3">
                                <div class="flex justify-between items-center">
                                    <h5 class="text-[10px] font-bold text-slate-500 uppercase">Köşe Düzenleme</h5>
                                    <span class="text-[9px] text-slate-400">{{selectedLayer.points.length}} nokta</span>
                                </div>
                                
                                <!-- Selected Point Editor -->
                                <div v-if="selectedPoint" 
                                    class="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-200 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-black text-indigo-700">P{{selectedPointIndex! + 1}}</span>
                                        <button @click="selectedPointIndex = null" 
                                            class="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                                    </div>
                                    <div>
                                        <div class="flex justify-between items-center mb-1">
                                            <label class="text-[9px] font-bold text-indigo-600 uppercase">Pah Yarıçapı</label>
                                            <span class="text-[10px] font-mono font-bold text-indigo-700">
                                                {{(selectedPoint.fillet?.radius || 0).toFixed(2)}}m 
                                                <span class="text-slate-400 font-normal">/ {{maxFilletRadius.toFixed(2)}}m</span>
                                            </span>
                                        </div>
                                        <input type="range" min="0" :max="maxFilletRadius" step="0.01"
                                            :value="Math.min(selectedPoint.fillet?.radius || 0, maxFilletRadius)"
                                            @input="layerManager.setPointFillet(selectedLayerId!, selectedPointIndex!, parseFloat(($event.target as HTMLInputElement).value), selectedPoint.fillet?.type || 'arc')"
                                            class="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                                    </div>
                                    <div v-if="selectedPoint.fillet && selectedPoint.fillet.radius > 0" 
                                        class="flex gap-2">
                                        <button @click="layerManager.setPointFillet(selectedLayerId!, selectedPointIndex!, selectedPoint.fillet.radius, 'arc')"
                                            :class="['flex-1 py-2 rounded-lg text-[10px] font-bold border-2 transition-all',
                                                selectedPoint.fillet.type === 'arc' 
                                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                                    : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400']">
                                            ○ Yuvarlak
                                        </button>
                                        <button @click="layerManager.setPointFillet(selectedLayerId!, selectedPointIndex!, selectedPoint.fillet.radius, 'chamfer')"
                                            :class="['flex-1 py-2 rounded-lg text-[10px] font-bold border-2 transition-all',
                                                selectedPoint.fillet.type === 'chamfer' 
                                                    ? 'bg-amber-600 text-white border-amber-600' 
                                                    : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400']">
                                            ◇ Kesik
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Layer Texture Picker Modal -->
                        <Teleport to="body">
                            <div v-if="layerTexturePickerOpen" @click.self="closeLayerTexturePicker"
                                class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                                <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                        <h3 class="text-lg font-black text-slate-800">Doku Seç</h3>
                                        <button @click="closeLayerTexturePicker" class="text-slate-400 hover:text-slate-600 text-2xl">
                                            ×
                                        </button>
                                    </div>
                                    <div class="p-6 overflow-y-auto">
                                        <div class="grid grid-cols-4 gap-3">
                                            <button v-for="tex in textureList" :key="tex.id" @click="selectLayerTexture(tex)"
                                                class="aspect-square rounded-xl border-2 overflow-hidden hover:border-indigo-600 transition-all">
                                                <img :src="tex.thumbnailUrl" class="w-full h-full object-cover" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Teleport>

                        <div v-if="activeTool"
                            class="bg-slate-900 text-white p-3 rounded-xl flex gap-3 items-center shadow-lg animate-in fade-in slide-in-from-bottom-2">
                            <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                                {{shapeLibrary.find(t => t.id === activeTool)?.icon}}
                            </div>
                            <div class="flex-1">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mod Aktif</p>
                                <p class="text-xs font-bold">{{shapeLibrary.find(t => t.id === activeTool)?.label}}
                                    çiziliyor...</p>
                            </div>
                            <button @click="cancelTool" class="text-slate-400 hover:text-white px-2">✕</button>
                        </div>

                        <Teleport to="body">
                            <div v-if="showToolLibrary" @click.self="closeToolLibrary"
                                class="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 p-0 transition-all duration-300"
                                role="dialog" aria-modal="true">

                                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>

                                <div
                                    class="relative w-full max-w-4xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">

                                    <div
                                        class="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center gap-3 bg-white z-20 shrink-0">
                                        <div
                                            class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full md:hidden">
                                        </div>

                                        <div class="flex-1 relative mt-2 md:mt-0">
                                            <span
                                                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                            <input v-model="toolSearch" placeholder="Şekil veya ikon ara..." autofocus
                                                class="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 placeholder:font-normal focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                                        </div>
                                        <button @click="closeToolLibrary"
                                            class="w-10 h-10 mt-2 md:mt-0 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors text-xl font-bold">
                                            &times;
                                        </button>
                                    </div>

                                    <div class="md:hidden shrink-0 border-b border-slate-100 bg-white z-10 py-2">
                                        <div class="flex overflow-x-auto px-4 gap-2 hide-scrollbar snap-x">
                                            <button v-for="cat in toolCategories" :key="cat.id"
                                                @click="activeCategory = cat.id"
                                                class="flex-none snap-start whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-bold border transition-all select-none"
                                                :class="activeCategory === cat.id
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                    : 'bg-white text-slate-500 border-slate-200'">
                                                {{ cat.label }}
                                            </button>
                                        </div>
                                    </div>

                                    <div class="flex flex-1 overflow-hidden relative">
                                        <div
                                            class="w-48 bg-slate-50 border-r border-slate-100 p-2 overflow-y-auto hidden md:flex flex-col gap-1 shrink-0">
                                            <button v-for="cat in toolCategories" :key="cat.id"
                                                @click="activeCategory = cat.id"
                                                class="px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex justify-between items-center group"
                                                :class="activeCategory === cat.id
                                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'">
                                                {{ cat.label }}
                                                <span v-if="activeCategory === cat.id"
                                                    class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                            </button>
                                        </div>

                                        <div
                                            class="flex-1 p-4 md:p-6 overflow-y-auto bg-white custom-scrollbar pb-20 md:pb-6">
                                            <div v-if="libraryTools.length === 0"
                                                class="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                                                <span class="text-4xl mb-2">🤔</span>
                                                <p class="text-sm">Sonuç bulunamadı.</p>
                                            </div>

                                            <div
                                                class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                                                <button v-for="tool in libraryTools" :key="tool.id"
                                                    @click="selectToolFromLibrary(tool.id)"
                                                    class="aspect-square flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all active:scale-95 group relative touch-manipulation"
                                                    :class="activeTool === tool.id ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''">
                                                    <span
                                                        class="text-3xl md:text-3xl mb-1 drop-shadow-sm group-hover:scale-110 transition-transform duration-200">
                                                        {{ tool.icon }}
                                                    </span>
                                                    <span
                                                        class="text-[9px] font-bold text-slate-500 text-center leading-tight line-clamp-2 group-hover:text-indigo-700">
                                                        {{ tool.label }}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Teleport>
                    </section>
                    <section class="space-y-4 border-t border-slate-200 pt-4">
                        <div class="flex justify-between items-center">
                            <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Çevre
                                Katmanları</h4>
                            <div class="flex gap-2">
                                <button @click="addPerimeterLayer('sidewalk')" title="Kaldırım Ekle"
                                    class="w-6 h-6 bg-slate-100 hover:bg-indigo-100 text-slate-500 rounded text-xs">+</button>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div v-for="(layer, index) in form.perimeterLayers" :key="layer.id"
                                class="bg-white border border-slate-200 rounded-xl p-3 relative group transition-all hover:shadow-md">

                                <button @click="removePerimeterLayer(index)"
                                    class="absolute top-2 right-2 text-slate-300 hover:text-red-500">&times;</button>

                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-lg">{{ layer.type === 'wall' ? '🧱' : layer.type === 'grass' ?
                                        '🌿' : '🚶' }}</span>
                                    <select v-model="layer.type"
                                        class="text-[10px] font-bold bg-transparent outline-none cursor-pointer">
                                        <option value="wall">Duvar</option>
                                        <option value="sidewalk">Kaldırım</option>
                                        <option value="curb">Bordür</option>
                                        <option value="grass">Çim</option>
                                    </select>
                                    <span class="text-[9px] text-slate-400 bg-slate-50 px-1.5 rounded">#{{ index + 1
                                    }}</span>
                                </div>

                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[8px] font-bold text-slate-400 uppercase block">Genişlik
                                            (m)</label>
                                        <input type="number" v-model.number="layer.width" step="0.1"
                                            class="w-full bg-slate-50 text-[10px] font-bold p-1 rounded border border-transparent focus:border-indigo-300 outline-none">
                                    </div>
                                    <div>
                                        <label class="text-[8px] font-bold text-slate-400 uppercase block">Yükseklik
                                            (m)</label>
                                        <input type="number" v-model.number="layer.height" step="0.1"
                                            class="w-full bg-slate-50 text-[10px] font-bold p-1 rounded border border-transparent focus:border-indigo-300 outline-none">
                                    </div>

                                    <div class="col-span-2 flex gap-2 mt-1">

                                        <div
                                            class="flex-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                                            <label
                                                class="text-[8px] font-bold text-slate-400 uppercase block mb-1">Renk</label>
                                            <div class="flex items-center gap-2 relative">
                                                <div class="w-full h-6 rounded border border-slate-200"
                                                    :style="{ backgroundColor: layer.color }"></div>
                                                <input type="color" v-model="layer.color" :disabled="!!layer.textureUrl"
                                                    class="opacity-0 w-full h-full absolute top-0 left-0 cursor-pointer">
                                            </div>
                                        </div>

                                        <div
                                            class="flex-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex flex-col justify-between relative">
                                            <label class="text-[8px] font-bold text-slate-400 uppercase block mb-1">Doku
                                                / Desen</label>

                                            <button
                                                @click="activeTextureLayerIndex = (activeTextureLayerIndex === index ? null : index)"
                                                class="w-full h-6 rounded border border-slate-200 flex items-center justify-center overflow-hidden transition-all"
                                                :class="(layer.textureUrl || layer.textureId) ? 'bg-white' : 'bg-white text-slate-300 hover:text-indigo-500'">

                                                <img v-if="layer.textureUrl" :src="layer.textureUrl"
                                                    class="w-full h-full object-cover">
                                                <img v-else-if="layer.textureId" :src="getLayerTextureThumbnail(layer.textureId)"
                                                    class="w-full h-full object-cover">
                                                <span v-else class="text-xs">Seç +</span>
                                            </button>

                                            <div v-if="activeTextureLayerIndex === index"
                                                class="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-200">

                                                <div
                                                    class="grid grid-cols-4 gap-1 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                    <button @click="layer.textureUrl = null; layer.textureId = undefined"
                                                        class="aspect-square rounded-md border flex items-center justify-center text-xs text-slate-400 hover:bg-slate-50"
                                                        :class="!layer.textureUrl && !layer.textureId ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'">
                                                        🚫
                                                    </button>
                                                    <button v-for="tex in textureList" :key="tex.id"
                                                        @click="tex.type === 'PBR' ? (layer.textureId = tex.id, layer.textureUrl = null) : (layer.textureUrl = tex.textureUrl, layer.textureId = undefined)"
                                                        class="aspect-square rounded-md border overflow-hidden hover:opacity-80 relative"
                                                        :class="(tex.type === 'PBR' ? layer.textureId === tex.id : layer.textureUrl === tex.textureUrl) ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200'">
                                                        <img :src="tex.thumbnailUrl" class="w-full h-full object-cover">
                                                        <div v-if="tex.type === 'PBR'" class="absolute bottom-0 right-0 bg-indigo-600 text-white text-[6px] font-bold px-0.5 rounded-tl">PBR</div>
                                                    </button>
                                                </div>

                                                <div v-if="layer.textureUrl || layer.textureId" class="border-t border-slate-100 pt-2">
                                                    <label
                                                        class="text-[8px] font-bold text-slate-400 uppercase block mb-1">Ölçek:
                                                        {{ layer.textureScale }}x</label>
                                                    <input type="range" v-model.number="layer.textureScale" min="0.5"
                                                        max="5" step="0.5"
                                                        class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                                                </div>

                                                <div class="text-center mt-1">
                                                    <button @click="activeTextureLayerIndex = null"
                                                        class="text-[9px] text-indigo-600 font-bold hover:underline">Tamam</button>
                                                </div>
                                            </div>

                                            <div v-if="activeTextureLayerIndex === index"
                                                @click.stop="activeTextureLayerIndex = null"
                                                class="fixed inset-0 z-40 cursor-default"
                                                style="background: transparent;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button v-if="form.perimeterLayers.length === 0" @click="addPerimeterLayer('sidewalk')"
                                class="w-full py-2 text-[10px] text-slate-400 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50">
                                + Katman Ekle (Duvar, Kaldırım, Çim...)
                            </button>
                        </div>
                    </section>
                </div>

                <div class="flex-1 bg-slate-100/50 flex flex-col relative overflow-hidden"
                    :class="showSidebar ? 'md:opacity-100 opacity-40' : ''" :style="{ backgroundColor: form.bgColor }">

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
                        @wheel.prevent="handleWheel" @mousedown="handleMouseDown" @mouseup="stopDrag"
                        @mouseleave="stopDrag" @mousemove="handleMouseMove" @click="handleSvgClickWithFreehand"
                        @contextmenu.prevent="isFreehandMode ? removeFreehandLastPoint : removeLastPoint">

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
                                    <image v-if="selectedTexture && selectedTextureData" 
                                        :href="selectedTextureData.type === 'PBR' ? selectedTextureData.baseColorUrl : selectedTextureData.textureUrl" 
                                        :xlink:href="selectedTextureData.type === 'PBR' ? selectedTextureData.baseColorUrl : selectedTextureData.textureUrl"
                                        x="0" y="0" :width="form.textureScale" :height="form.textureScale"
                                        preserveAspectRatio="xMidYMid slice" />
                                    <image v-else-if="selectedTexture" 
                                        :href="String(selectedTexture)" 
                                        :xlink:href="String(selectedTexture)"
                                        x="0" y="0" :width="form.textureScale" :height="form.textureScale"
                                        preserveAspectRatio="xMidYMid slice" />
                                </pattern>
                                <pattern v-for="layer in form.perimeterLayers" :key="'pat-' + layer.id"
                                    :id="'tex-' + layer.id" patternUnits="userSpaceOnUse" :width="layer.textureScale"
                                    :height="layer.textureScale">

                                    <image v-if="layer.textureUrl" :href="layer.textureUrl"
                                        :xlink:href="layer.textureUrl" x="0" y="0" :width="layer.textureScale"
                                        :height="layer.textureScale" preserveAspectRatio="xMidYMid slice" />
                                    <image v-else-if="layer.textureId" :href="getLayerTextureUrl(layer.textureId)"
                                        :xlink:href="getLayerTextureUrl(layer.textureId)" x="0" y="0" :width="layer.textureScale"
                                        :height="layer.textureScale" preserveAspectRatio="xMidYMid slice" />
                                </pattern>
                            </defs>

                            <rect x="-400" y="-400" width="800" height="800" fill="url(#gridMajor)" />

                            <path v-for="(layer, idx) in svgPerimeterPaths" :key="'p-layer-' + idx" :d="finalPath"
                                fill="none" :stroke="(layer.textureUrl || layer.textureId) ? `url(#tex-${layer.id})` : layer.color"
                                :stroke-width="layer.totalStrokeWidth" stroke-linejoin="round" stroke-linecap="round"
                                class="transition-all duration-300" />

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
                                    font-weight="800" fill="#334155" font-family="Inter, sans-serif">{{ label.length
                                    }}m</text>
                            </g>

                            <g v-for="layer in layers" :key="layer.id"
                                :transform="`translate(${layer.x}, ${layer.z}) rotate(${layer.rotation})`"
                                @mousedown="startDragLayer(layer.id, $event)"
                                class="cursor-move group pointer-events-auto" :opacity="layer.opacity">

                                <g v-if="selectedLayerId === layer.id" class="pointer-events-none">
                                    <rect :x="-layer.width / 2 - 0.1" :y="-layer.height / 2 - 0.1"
                                        :width="layer.width + 0.2" :height="layer.height + 0.2" fill="none"
                                        stroke="#6366f1" stroke-width="0.05" stroke-dasharray="0.1, 0.1" />

                                    <text v-if="isDrawing && selectedLayerId === layer.id" :x="0"
                                        :y="-layer.height / 2 - 0.2" text-anchor="middle" font-size="0.3"
                                        font-weight="bold" fill="#6366f1" style="text-shadow: 0px 0px 4px white;">
                                        {{ layer.width.toFixed(2) }}m x {{ layer.height.toFixed(2) }}m
                                    </text>
                                </g>

                                <!-- Layer fill with texture or color -->
                                <defs v-if="layer.texture">
                                    <pattern :id="`layerTex-${layer.id}`" patternUnits="userSpaceOnUse" 
                                        :width="layer.texture.scale" :height="layer.texture.scale">
                                        <image :href="layer.texture.url || getTextureUrlById(layer.texture.id)" 
                                            :width="layer.texture.scale" :height="layer.texture.scale" />
                                    </pattern>
                                </defs>

                                <path :d="getShapePath(layer)" 
                                    :fill="layer.texture ? `url(#layerTex-${layer.id})` : layer.color" 
                                    stroke="black"
                                    stroke-width="0.02" stroke-opacity="0.1" vector-effect="non-scaling-stroke"
                                    :transform="layer.geometryType === 'preset' ? `scale(${layer.width}, ${layer.height})` : undefined"
                                    class="transition-colors drop-shadow-sm" />
                                
                                <!-- Freehand point visualization (when selected) -->
                                <g v-if="selectedLayerId === layer.id && layer.geometryType === 'freehand' && layer.points">
                                    <circle v-for="(point, idx) in layer.points" :key="'point-' + idx"
                                        :cx="point.x" :cy="point.z" :r="0.08"
                                        :fill="selectedPointIndex === idx ? '#f59e0b' : '#6366f1'"
                                        stroke="white" stroke-width="0.04"
                                        style="cursor: pointer;"
                                        class="pointer-events-auto"
                                        @click.stop="selectLayerPoint(layer.id, idx)" />
                                    <text v-for="(point, idx) in layer.points" :key="'label-' + idx"
                                        :x="point.x" :y="point.z - 0.25"
                                        text-anchor="middle" font-size="0.2" font-weight="bold"
                                        fill="#1e293b" class="pointer-events-none"
                                        style="text-shadow: 0 0 3px white, 0 0 3px white; user-select: none;">P{{idx + 1}}</text>
                                </g>
                            </g>

                            <!-- Freehand Drawing Preview -->
                            <g v-if="isFreehandMode">
                                <path v-if="freehandPoints.length > 0" 
                                    :d="generateFreehandPreviewPath()" 
                                    fill="none" 
                                    stroke="#4f46e5" 
                                    stroke-width="0.15" 
                                    stroke-dasharray="0.3,0.3" 
                                    opacity="0.8" 
                                    class="pointer-events-none" />
                                
                                <!-- Preview line to mouse -->
                                <line v-if="freehandPoints.length > 0 && !freehandClosed && freehandPoints[freehandPoints.length - 1]" 
                                    :x1="freehandPoints[freehandPoints.length - 1]!.x" 
                                    :y1="freehandPoints[freehandPoints.length - 1]!.z" 
                                    :x2="mousePos.x" 
                                    :y2="mousePos.z" 
                                    stroke="#4f46e5" 
                                    stroke-width="0.1" 
                                    stroke-dasharray="0.2,0.2" 
                                    opacity="0.6" 
                                    class="pointer-events-none" />
                                
                                <!-- Freehand points -->
                                <circle v-for="(p, i) in freehandPoints" :key="i" 
                                    :cx="p.x" :cy="p.z" :r="0.25"
                                    :fill="i === 0 && freehandPoints.length >= 3 && isNearPoint(mousePos, p, 0.5) ? '#10b981' : '#4f46e5'"
                                    stroke="white" stroke-width="0.08" 
                                    class="pointer-events-auto cursor-pointer"
                                    @click.stop="i === 0 && freehandPoints.length >= 3 ? completeFreehandDrawing() : null" />
                                
                                <!-- Mouse cursor preview -->
                                <circle v-if="!freehandClosed" 
                                    :cx="mousePos.x" :cy="mousePos.z" :r="0.12"
                                    fill="#4f46e5" opacity="0.6" 
                                    stroke="white" stroke-width="0.04" 
                                    class="animate-pulse pointer-events-none" />
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
                                    stroke-width="0.08" :style="{ cursor: draggingPointIndex === null ? 'grab' : 'grabbing' }"
                                    :class="draggingPointIndex === null ? 'pointer-events-auto' : 'pointer-events-none'" 
                                    @mousedown.stop="startDragPoint(i)" />
                            </g>
                        </svg>
                    </div>

                    <div class="absolute bottom-6 left-8 pointer-events-none">
                        <div
                            class="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-200 shadow-xl flex gap-3 items-center">
                            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span v-if="isFreehandMode"
                                class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                Sol Tık: Nokta Ekle <span class="mx-1 text-slate-300">|</span> Sağ Tık: Geri Al
                            </span>
                            <span v-else-if="form.shapeType === 'custom'"
                                class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                Sol Tık: Nokta Ekle <span class="mx-1 text-slate-300">|</span> Sağ Tık: Nokta Sil
                            </span>
                            <span v-else class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                {{ form.shapeType === 'circle' ? 'Daire' : form.shapeType === 'ellipse' ? 'Elips' :
                                    'Dikdörtgen' }} Modu Aktif
                            </span>
                        </div>
                    </div>

                    <!-- Mobile: floating settings button (moved to avoid overlap with footer save) -->
                    <button v-if="!showSidebar" @click="openSidebar" aria-label="Ayarlar"
                        class="md:hidden fixed bottom-20 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-lg">Ayarlar</button>
                </div>
            </div>

            <div
                class="px-4 md:px-8 py-4 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3 items-center">
                <button @click="close"
                    class="w-full md:w-auto px-6 py-3 text-[12px] font-black text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-[0.15em]">Vazgeç</button>
                <button @click="handleSave"
                    :disabled="!form.name || (form.shapeType === 'custom' && customPoints.length < 3)"
                    class="w-full md:w-auto px-6 py-4 md:py-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-[12px] font-black uppercase tracking-[0.15em] shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 group">
                    <span>{{ mode === 'create' ? 'Sahneyi Yayınla' : 'Kaydet' }}</span>
                    <span class="text-base group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { arSceneService } from '../../../services/arSceneService';
import type { FloorLayer, LayerPoint, LayerTexture } from '../../../types/geometry';
import { useLayerManager } from '../../../composables/useLayerManager';
import { isNearPoint } from '../../../utils/geometryEngine';

// --- TİP TANIMLARI ---

// --- SABİTLER ---
// --- NEW: Dynamic Shape Library from backend ---
import { shapesStore } from '../../../store/modules/shapes';
const shapeLibrary = computed(() => shapesStore.items.map(s => ({ id: s.code, label: s.labelTR || s.labelEN || s.code, icon: s.icon, path: s.svgPath, category: s.category })));
// Ensure shapes are loaded when component mounts
onMounted(async () => {
    if (!shapesStore.items || shapesStore.items.length === 0) {
        try { await shapesStore.fetch(undefined, true); } catch (e) { /* silent */ }
    }
});

const shapes = [
    { id: 'rectangle', label: 'Dikdörtgen', icon: '⬛' },
    { id: 'circle', label: 'Daire', icon: '⚪' },
    { id: 'ellipse', label: 'Elips', icon: '⬬' },
    { id: 'custom', label: 'Serbest', icon: '✏️' }
];

const toolCategories = computed(() => {
    const cats = new Set<string>();
    shapesStore.items.forEach(s => cats.add(s.category));
    return [{ id: 'all', label: 'Tümü' }, ...Array.from(cats).map(c => ({ id: c.toLowerCase(), label: c }))];
});

const props = defineProps<{ isOpen: boolean; mode: 'create' | 'edit'; initialData?: any; }>();
const emit = defineEmits(['close', 'save']);
const svgEl = ref<SVGSVGElement | null>(null);
const svgContainer = ref<HTMLDivElement | null>(null);
const activeTextureLayerIndex = ref<number | null>(null);

const showSidebar = ref(false);
const modalRoot = ref<HTMLElement | null>(null);

const toggleSidebar = () => { showSidebar.value = !showSidebar.value; };

const sheetHeight = ref(Math.round(Math.min(window.innerHeight * 0.45, 520)));
let sheetMaxHeight = Math.round(window.innerHeight - 96);
const isDraggingSheet = ref(false);
const sheetStartY = ref(0);
const sheetStartHeight = ref(0);
const activeCategory = ref('all');

const libraryTools = computed(() => {
    const q = toolSearch.value.trim().toLowerCase();

    // Önce kategoriye göre filtrele
    let list = shapeLibrary.value;
    if (activeCategory.value !== 'all') {
        list = list.filter(t => t.category?.toLowerCase() === activeCategory.value);
    }

    // Sonra aramaya göre filtrele
    if (!q) return list;
    return list.filter(t => t.label.toLowerCase().includes(q));
});

const quickAccessTools = computed(() => shapeLibrary.value.slice(0, 8));

const updateSheetMax = () => { sheetMaxHeight = Math.round(window.innerHeight - 96); if (sheetHeight.value > sheetMaxHeight) sheetHeight.value = sheetMaxHeight; };

const openSidebar = () => {
    updateSheetMax();
    showSidebar.value = true;
    // open in medium state
    sheetHeight.value = Math.round(Math.min(window.innerHeight * 0.45, sheetMaxHeight));
};


const startSheetDrag = (e: MouseEvent | TouchEvent) => {
    // Sadece mobilde çalışsın (768px altı)
    if (window.innerWidth >= 768) return;

    e.preventDefault();
    e.stopPropagation();

    isDraggingSheet.value = true;
    sheetStartHeight.value = sheetHeight.value;

    // --- GÜVENLİ YÖNTEM ---
    // Önce ilk parmağı almaya çalışıyoruz
    const firstTouch = 'touches' in e ? e.touches[0] : null;

    // Eğer parmak varsa onun Y'sini, yoksa Mouse Y'sini alıyoruz
    const clientY = firstTouch ? firstTouch.clientY : (e as MouseEvent).clientY;

    sheetStartY.value = clientY;

    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', sheetDragMove);
    window.addEventListener('touchmove', sheetDragMove, { passive: false });
    window.addEventListener('mouseup', sheetDragEnd);
    window.addEventListener('touchend', sheetDragEnd);
};

const sheetDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingSheet.value) return;

    e.preventDefault();
    e.stopPropagation();

    // --- GÜVENLİ YÖNTEM ---
    const firstTouch = 'touches' in e ? e.touches[0] : null;
    const clientY = firstTouch ? firstTouch.clientY : (e as MouseEvent).clientY;

    const delta = sheetStartY.value - clientY;
    let newHeight = sheetStartHeight.value + delta;

    if (newHeight < 150) newHeight = 150;
    if (newHeight > window.innerHeight - 96) newHeight = window.innerHeight - 96;

    window.requestAnimationFrame(() => {
        sheetHeight.value = Math.round(newHeight);
    });
};

const sheetDragEnd = () => {
    isDraggingSheet.value = false;

    // Seçim engelini kaldır
    document.body.style.userSelect = '';

    window.removeEventListener('mousemove', sheetDragMove);
    window.removeEventListener('touchmove', sheetDragMove); // Listener'ı temizle
    window.removeEventListener('mouseup', sheetDragEnd);
    window.removeEventListener('touchend', sheetDragEnd);
};

// Update max on resize
window.addEventListener('resize', updateSheetMax);

// Tool library (minimal UI + searchable modal)
const showToolLibrary = ref(false);
const toolSearch = ref('');
const openToolLibrary = () => { showToolLibrary.value = true; };
const closeToolLibrary = () => { showToolLibrary.value = false; };
const selectToolFromLibrary = (id: string) => { selectTool(id); closeToolLibrary(); };

// Modal open animation state (mobile center scale)
const isShowing = ref(false);


// --- STATE ---
const form = reactive({
    name: '',
    width: 5,
    depth: 4,
    shapeType: 'rectangle',
    bgColor: '#f8fafc',
    floorColor: '#ffffff',
    wallHeight: 2.8,
    textureScale: 2,
    perimeterLayers: [] as {
        id: string;
        type: 'wall' | 'sidewalk' | 'grass' | 'curb';
        width: number;
        height: number;
        color: string;
        elevation: number;
        // YENİ EKLENEN ALANLAR:
        textureUrl: string | null;  // Doku görselinin URL'i (Legacy)
        textureId?: number;         // PBR Texture ID
        textureScale: number;       // Doku sıklığı (1x, 2x...)
    }[]
});

const addPerimeterLayer = (type: string) => {
    form.perimeterLayers.push({
        id: crypto.randomUUID(),
        type: type as any,
        width: 0.5,
        height: type === 'wall' ? 2.0 : 0.1,
        color: type === 'grass' ? '#4ade80' : '#94a3b8',
        elevation: 0,
        textureUrl: null,
        textureId: undefined,
        textureScale: 1
    });
};

const removePerimeterLayer = (index: number) => {
    form.perimeterLayers.splice(index, 1);
};

const svgPerimeterPaths = computed(() => {
    // 1. Katmanları kopyala
    const layers = [...form.perimeterLayers];

    // Toplam genişliği hesaplayarak dıştan içe doğru gitmeliyiz
    // Ama SVG 'stroke' merkezden büyür. 
    // Strateji: Her katman için birikimli genişlikte bir stroke çizip en arkaya atmak.

    let cumulativeWidth = 0;

    // Katmanları tersten değil, düzden gezip birikimli width hesaplayacağız
    // Çizimi ise Vue template'de "reverse" sırayla yapacağız ki geniş olan arkada kalsın.

    const calculatedLayers = layers.map(layer => {
        cumulativeWidth += layer.width;
        return {
            ...layer,
            totalStrokeWidth: cumulativeWidth * 2 // SVG stroke yarı yarıya içe girer, bu yüzden 2 katı
        };
    });

    // En dıştaki en önce çizilmeli (HTML sırasında en üstte = en arkada)
    // Bu yüzden listeyi ters çevirip template'e yolluyoruz.
    return calculatedLayers.reverse();
});

const textureList = ref<any[]>([]);
const selectedTexture = ref<string | number | null>(null); // ID veya URL olabilir
const selectedTextureData = ref<any | null>(null); // Seçili texture'ın tam data'sı

// Helper: Perimeter layer texture ID'sinden thumbnail URL al
const getLayerTextureThumbnail = (textureId?: number): string => {
    if (!textureId) return '';
    const texture = textureList.value.find((t: any) => t.id === textureId);
    return texture?.thumbnailUrl || '';
};

// Helper: Perimeter layer texture ID'sinden gerçek texture URL al (SVG pattern için)
const getLayerTextureUrl = (textureId?: number): string => {
    if (!textureId) return '';
    const texture = textureList.value.find((t: any) => t.id === textureId);
    // PBR ise baseColor, simple ise textureUrl
    return texture?.type === 'PBR' ? texture.baseColorUrl : texture.textureUrl || '';
};

const customPoints = ref<{ x: number, z: number }[]>([]);
const mousePos = reactive({ x: 0, z: 0 });
const viewPort = reactive({ x: -2, y: -2, zoom: 15, isDragging: false, lastMouseX: 0, lastMouseY: 0 });

// Layer Management
const layerManager = useLayerManager();
const { layers, selectedLayerId, draggingLayerId, selectedLayer } = layerManager;

const activeTool = ref<string | null>(null);
const isDrawing = ref(false);
const drawStartPos = reactive({ x: 0, z: 0 });
// Yeni: Sürükleme sırasında mouse'un şeklin merkezine olan uzaklığı (Smooth drag için)
const dragOffset = reactive({ x: 0, z: 0 });

// Freehand Drawing State
const freehandPoints = ref<LayerPoint[]>([]);
const isFreehandMode = ref(false);
const freehandClosed = ref(false);
const editingFreehandLayerId = ref<string | null>(null);
const selectedPointIndex = ref<number | null>(null);

// Select a specific point on a layer
const selectLayerPoint = (layerId: string, pointIndex: number) => {
    selectedLayerId.value = layerId;
    selectedPointIndex.value = pointIndex;
    
    // Scroll to the selected point editor in sidebar
    nextTick(() => {
        const sidebar = document.querySelector('.custom-scrollbar');
        const selectedPointEditor = document.querySelector('.bg-gradient-to-br.from-indigo-50.to-purple-50');
        
        if (sidebar && selectedPointEditor) {
            selectedPointEditor.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    });
};

// Watch for layer changes to reset point selection
watch(selectedLayerId, () => {
    selectedPointIndex.value = null;
});

// Selected point for editing
const selectedPoint = computed(() => {
    if (!selectedLayer.value || selectedPointIndex.value === null) return null;
    if (selectedLayer.value.geometryType !== 'freehand' || !selectedLayer.value.points) return null;
    return selectedLayer.value.points[selectedPointIndex.value];
});

// Calculate maximum fillet radius for selected point based on angle
const maxFilletRadius = computed(() => {
    if (!selectedLayer.value || selectedPointIndex.value === null) return 1;
    if (selectedLayer.value.geometryType !== 'freehand' || !selectedLayer.value.points) return 1;
    
    const points = selectedLayer.value.points;
    if (points.length < 3) return 1;
    
    const idx = selectedPointIndex.value;
    const prevIdx = (idx - 1 + points.length) % points.length;
    const nextIdx = (idx + 1) % points.length;
    
    const curr = points[idx];
    const prev = points[prevIdx];
    const next = points[nextIdx];
    
    if (!curr || !prev || !next) return 1;
    
    // Calculate vectors from current point to adjacent points
    const v1 = { x: prev.x - curr.x, z: prev.z - curr.z };
    const v2 = { x: next.x - curr.x, z: next.z - curr.z };
    
    // Calculate vector magnitudes
    const mag1 = Math.sqrt(v1.x * v1.x + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.z * v2.z);
    
    if (mag1 === 0 || mag2 === 0) return 1;
    
    // Normalize vectors
    v1.x /= mag1; v1.z /= mag1;
    v2.x /= mag2; v2.z /= mag2;
    
    // Calculate angle using dot product
    const dotProduct = v1.x * v2.x + v1.z * v2.z;
    const angleRadians = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    const angleDegrees = angleRadians * (180 / Math.PI);
    
    // Calculate max radius based on angle:
    // - Sharp angles (< 30°): 0.2m
    // - Right angles (~90°): 1.5m
    // - Obtuse angles (> 120°): 3m
    // - Near-straight (> 160°): 5m
    let maxRadius: number;
    if (angleDegrees < 30) {
        maxRadius = 0.2;
    } else if (angleDegrees < 60) {
        maxRadius = 0.2 + (angleDegrees - 30) / 30 * 0.6; // 0.2 -> 0.8
    } else if (angleDegrees < 90) {
        maxRadius = 0.8 + (angleDegrees - 60) / 30 * 0.7; // 0.8 -> 1.5
    } else if (angleDegrees < 120) {
        maxRadius = 1.5 + (angleDegrees - 90) / 30 * 1.0; // 1.5 -> 2.5
    } else if (angleDegrees < 150) {
        maxRadius = 2.5 + (angleDegrees - 120) / 30 * 1.0; // 2.5 -> 3.5
    } else {
        maxRadius = 3.5 + (angleDegrees - 150) / 30 * 1.5; // 3.5 -> 5.0
    }
    
    // Also consider edge lengths to prevent overflow
    const edgeLimit = Math.min(mag1, mag2) / 2;
    
    // Use the smaller of angle-based or edge-based limit
    return Math.max(0.1, Math.min(maxRadius, edgeLimit));
});

// Layer Texture State
const layerTexturePickerOpen = ref(false);
const editingTextureLayerId = ref<string | null>(null);

const draggingPointIndex = ref<number | null>(null);
const isClosed = ref(false);
const isSnapToStart = ref(false);
const hoveredPointIndex = ref<number | null>(null);
const containerSize = reactive({ width: 100, height: 100 });
let resizeObserver: ResizeObserver | null = null;

// Açılır kapanır durumunda odak ve body overflow yönetimi
watch(() => props.isOpen, (open) => {
    if (open) {
        showSidebar.value = false; // mobilde sidebar otomatik kapalı başlasın
        document.body.style.overflow = 'hidden';
        isShowing.value = false;
        updateSheetMax();
        // set default sheet height when opening but only if it was previously closed
        sheetHeight.value = Math.round(Math.min(window.innerHeight * 0.45, sheetMaxHeight));
        
        // Eğer yeni sahne oluşturma modundaysa state'leri temizle
        if (props.mode === 'create') {
            selectedTexture.value = null;
            selectedTextureData.value = null;
        }
        
        nextTick(() => {
            modalRoot.value?.focus();
            // animate in
            isShowing.value = true;
        });
        // Load shapes when opening if not present
        if (!shapesStore.items || shapesStore.items.length === 0) {
            shapesStore.fetch(undefined, true).catch(() => {});
        }
    } else {
        isShowing.value = false;
        document.body.style.overflow = '';
    }
});

// Tool library Escape handler (close with ESC)
watch(showToolLibrary, (open) => {
    const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeToolLibrary();
    };
    if (open) {
        window.addEventListener('keydown', handler);
        nextTick(() => { /* focus search input if present */ });
    } else {
        window.removeEventListener('keydown', handler);
    }
});

onUnmounted(() => { document.body.style.overflow = ''; window.removeEventListener('resize', updateSheetMax); });


// --- COMPUTED ---
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

const getSignedArea = (points: { x: number, z: number }[]) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;

        const p1 = points[i];
        const p2 = points[j];

        if (!p1 || !p2) continue;

        area += (p2.x - p1.x) * (p2.z + p1.z);
    }
    return area;
};

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
    const viewBoxHeight = viewPort.zoom;
    const viewBoxWidth = viewPort.zoom * aspectRatio;
    return `${viewPort.x} ${viewPort.y} ${viewBoxWidth} ${viewBoxHeight}`;
});

const lastPoint = computed(() => customPoints.value.length ? customPoints.value[customPoints.value.length - 1] : null);

const cursorStyle = computed(() => {
    if (isFreehandMode.value) return 'crosshair';
    if (activeTool.value) return 'crosshair';
    if (isDrawing.value) return 'crosshair';
    if (viewPort.isDragging) return 'grabbing';
    if (draggingPointIndex.value !== null) return 'grabbing';
    if (draggingLayerId.value !== null) return 'grabbing';
    if (hoveredPointIndex.value !== null) return 'grab';
    if (form.shapeType === 'custom' && !isClosed.value) return 'crosshair';
    return 'default';
});

// --- METODLAR ---

const selectTool = (toolId: string) => {
    if (activeTool.value === toolId) {
        cancelTool();
    } else {
        // Check if freehand tool
        if (toolId === 'freehand') {
            startFreehandDrawing();
        } else {
            activeTool.value = toolId;
            selectedLayerId.value = null;
        }
    }
};

const cancelTool = () => {
    activeTool.value = null;
    isDrawing.value = false;
    
    // Cancel freehand mode
    if (isFreehandMode.value) {
        if (freehandPoints.value.length > 0 && !confirm('Çizimi iptal etmek istediğinize emin misiniz?')) {
            return;
        }
        cancelFreehandDrawing();
    }
};

const getShapePath = (layer: FloorLayer) => {
    if (layer.geometryType === 'freehand' && layer.points) {
        return layerManager.getLayerPath(layer);
    }
    return shapeLibrary.value.find(s => s.id === layer.shapeId)?.path || '';
};

// MOUSE EVENT: Down (Container)
const handleMouseDown = (e: MouseEvent) => {
    // FREEHAND MODE: İgnore (handled by click)
    if (isFreehandMode.value) {
        return;
    }

    // 1. ÇİZİM BAŞLANGICI
    if (activeTool.value) {
        e.stopPropagation();
        isDrawing.value = true;
        drawStartPos.x = mousePos.x;
        drawStartPos.z = mousePos.z;

        const shapeDef = shapeLibrary.value.find(s => s.id === activeTool.value);
        layerManager.createPresetLayer(
            activeTool.value,
            shapeDef?.label || 'Şekil',
            mousePos.x,
            mousePos.z,
            0.1,
            0.1
        );
        draggingLayerId.value = selectedLayerId.value;
        return;
    }

    // 2. BOŞLUĞA TIKLAMA (SEÇİMİ KALDIR ve PAN YAP)
    // Şekiller üzerindeki mousedown eventinde 'stop' olduğu için,
    // eğer olay buraya kadar ulaştıysa kesinlikle boşluğa (background'a) tıklanmıştır.
    selectedLayerId.value = null;
    selectedPointIndex.value = null;

    // Pan işlemini başlat (Sol tık veya Orta tık)
    if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        viewPort.isDragging = true;
        viewPort.lastMouseX = e.clientX;
        viewPort.lastMouseY = e.clientY;
    }
};

// MOUSE EVENT: Move
const handleMouseMove = (e: MouseEvent) => {
    if (!svgEl.value) return;

    // --- Pan İşlemi ---
    if (viewPort.isDragging) {
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

    // --- Koordinat Hesaplama ---
    const pt = svgEl.value.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.value.getScreenCTM();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm.inverse());
    let targetX = Math.round(svgPoint.x * 100) / 100;
    let targetZ = Math.round(svgPoint.y * 100) / 100;

    // Custom shape snap
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

    // --- ÇİZİM GÜNCELLEME (Boyutlandırma) ---
    if (isDrawing.value && draggingLayerId.value) {
        const layer = layers.value.find(l => l.id === draggingLayerId.value);
        if (layer) {
            let newWidth = Math.abs(mousePos.x - drawStartPos.x);
            let newHeight = Math.abs(mousePos.z - drawStartPos.z);

            if (e.shiftKey) {
                const maxDim = Math.max(newWidth, newHeight);
                newWidth = maxDim;
                newHeight = maxDim;
            }

            layer.width = newWidth;
            layer.height = newHeight;
            layer.x = (drawStartPos.x + mousePos.x) / 2;
            layer.z = (drawStartPos.z + mousePos.z) / 2;
        }
        return;
    }

    // --- KATMAN TAŞIMA (Sürükleme) ---
    // draggingLayerId var ama çizim modunda değilsek -> Taşıma
    if (draggingLayerId.value && !isDrawing.value) {
        const layer = layers.value.find(l => l.id === draggingLayerId.value);
        if (layer) {
            // Offset'i kullanarak yumuşak taşıma
            layer.x = mousePos.x - dragOffset.x;
            layer.z = mousePos.z - dragOffset.z;
        }
        return;
    }

    // --- NOKTA TAŞIMA (Custom Shape) ---
    if (draggingPointIndex.value !== null) {
        customPoints.value[draggingPointIndex.value] = { x: mousePos.x, z: mousePos.z };
    }
};

// MOUSE EVENT: Up / Leave
const stopDrag = () => {
    if (isDrawing.value) {
        const layer = layers.value.find(l => l.id === draggingLayerId.value);
        if (layer && (layer.width < 0.1 || layer.height < 0.1)) {
            layer.width = 1.0;
            layer.height = 1.0;
        }
        isDrawing.value = false;
        activeTool.value = null;
        selectedLayerId.value = draggingLayerId.value;
    }

    draggingPointIndex.value = null;
    draggingLayerId.value = null;
    viewPort.isDragging = false;
};

// Helperlar
const handleWheel = (e: WheelEvent) => {
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    const newZoom = viewPort.zoom * delta;
    if (newZoom > 1 && newZoom < 500) viewPort.zoom = newZoom;
};

const handleSvgClick = () => {
    if (form.shapeType !== 'custom') return;
    if (draggingPointIndex.value !== null) return;
    if (isClosed.value) return;
    if (activeTool.value) return;

    if (isSnapToStart.value) {
        isClosed.value = true;
        isSnapToStart.value = false;
    } else {
        customPoints.value.push({ ...mousePos });
    }
};

// --- FREEHAND DRAWING METHODS ---

const startFreehandDrawing = () => {
    isFreehandMode.value = true;
    freehandPoints.value = [];
    freehandClosed.value = false;
    activeTool.value = 'freehand';
    selectedLayerId.value = null;
};

const cancelFreehandDrawing = () => {
    isFreehandMode.value = false;
    freehandPoints.value = [];
    freehandClosed.value = false;
    activeTool.value = null;
    editingFreehandLayerId.value = null;
    selectedPointIndex.value = null;
};

const addFreehandPoint = () => {
    if (freehandClosed.value) return;
    
    // Check if snapping to start
    if (freehandPoints.value.length >= 3) {
        const startPoint = freehandPoints.value[0];
        if (startPoint && isNearPoint(mousePos, startPoint, 0.5)) {
            // Close the path
            completeFreehandDrawing();
            return;
        }
    }
    
    // Add new point
    freehandPoints.value.push({ x: mousePos.x, z: mousePos.z });
};

const removeFreehandLastPoint = () => {
    if (freehandClosed.value) {
        freehandClosed.value = false;
    } else {
        freehandPoints.value.pop();
    }
};

const completeFreehandDrawing = () => {
    if (freehandPoints.value.length < 3) {
        alert('En az 3 nokta gereklidir!');
        return;
    }
    
    freehandClosed.value = true;
    
    // Create layer
    layerManager.createFreehandLayer('Serbest Şekil', freehandPoints.value);
    
    // Reset freehand state
    cancelFreehandDrawing();
};

const handleSvgClickWithFreehand = () => {
    // Handle freehand mode
    if (isFreehandMode.value) {
        addFreehandPoint();
        return;
    }
    
    // Original custom shape logic
    handleSvgClick();
};

// Layer texture methods
const openLayerTexturePicker = (layerId: string) => {
    editingTextureLayerId.value = layerId;
    layerTexturePickerOpen.value = true;
};

const closeLayerTexturePicker = () => {
    layerTexturePickerOpen.value = false;
    editingTextureLayerId.value = null;
};

const selectLayerTexture = (texture: any) => {
    if (!editingTextureLayerId.value) return;
    
    const layerTexture: LayerTexture = {
        id: texture.type === 'PBR' ? texture.id : undefined,
        url: texture.type === 'SIMPLE' ? texture.textureUrl : undefined,
        scale: texture.defaultScale || 2,
        thumbnailUrl: texture.thumbnailUrl
    };
    
    layerManager.setLayerTexture(editingTextureLayerId.value, layerTexture);
    closeLayerTexturePicker();
};

const clearLayerTexture = (layerId: string) => {
    layerManager.setLayerTexture(layerId, null);
};

// Helper: Get texture URL by ID
const getTextureUrlById = (id?: number): string => {
    if (!id) return '';
    const texture = textureList.value.find((t: any) => t.id === id);
    return texture?.type === 'PBR' ? texture.baseColorUrl : texture?.textureUrl || '';
};

// Helper: Generate freehand preview path
const generateFreehandPreviewPath = (): string => {
    if (freehandPoints.value.length === 0) return '';
    
    const firstPoint = freehandPoints.value[0];
    if (!firstPoint) return '';
    
    let path = `M ${firstPoint.x} ${firstPoint.z}`;
    for (let i = 1; i < freehandPoints.value.length; i++) {
        const p = freehandPoints.value[i];
        if (!p) continue;
        path += ` L ${p.x} ${p.z}`;
    }
    
    if (freehandClosed.value) {
        path += ' Z';
    }
    
    return path;
};

const resetView = () => {
    const aspectRatio = containerSize.width / containerSize.height;
    viewPort.zoom = 15;
    if (form.shapeType !== 'custom') {
        const vbW = viewPort.zoom * aspectRatio;
        const vbH = viewPort.zoom;
        viewPort.x = (form.width / 2) - (vbW / 2);
        viewPort.y = (form.depth / 2) - (vbH / 2);
    } else {
        const vbW = viewPort.zoom * aspectRatio;
        const vbH = viewPort.zoom;
        viewPort.x = -(vbW / 2);
        viewPort.y = -(vbH / 2);
    }
};

const resetForm = () => {
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
    customPoints.value = [];
    selectedTexture.value = null;
    isClosed.value = false;
    isSnapToStart.value = false;
    draggingPointIndex.value = null;
    hoveredPointIndex.value = null;
    layerManager.clearLayers();
    activeTool.value = null;
    cancelFreehandDrawing();
    resetView();
};

const clearCustomDrawing = () => {
    customPoints.value = [];
    isClosed.value = false;
    isSnapToStart.value = false;
    draggingPointIndex.value = null;
};

const removeLastPoint = () => {
    if (isClosed.value) isClosed.value = false;
    else customPoints.value.pop();
};

const startDragPoint = (index: number) => { draggingPointIndex.value = index; };

// ŞEKİL SÜRÜKLEME BAŞLANGICI
const startDragLayer = (id: string, e: MouseEvent) => {
    // Eğer çizim modundaysak sürüklemeyi engelle (yeni şekil çiziyoruzdur)
    if (activeTool.value) return;

    e.stopPropagation(); // Arka plan pan işlemini durdur

    const layer = layers.value.find(l => l.id === id);
    if (layer) {
        // Tıklanan nokta ile şekil merkezi arasındaki farkı kaydet (Offset)
        dragOffset.x = mousePos.x - layer.x;
        dragOffset.z = mousePos.z - layer.z;

        draggingLayerId.value = id;
        selectedLayerId.value = id;
    }
};

const removeLayer = () => {
    if (!selectedLayerId.value) return;
    layerManager.removeLayer(selectedLayerId.value);
};

const bringToFront = () => {
    if (!selectedLayerId.value) return;
    layerManager.bringToFront(selectedLayerId.value);
};

const sendToBack = () => {
    if (!selectedLayerId.value) return;
    layerManager.sendToBack(selectedLayerId.value);
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
    let pts = form.shapeType === 'custom'
        ? [...customPoints.value]
        : calculatePresetPoints(form.shapeType, form.width, form.depth);

    if (form.shapeType === 'custom' && pts.length > 2) {
        if (getSignedArea(pts) > 0) {
            console.log("Çizim yönü otomatik düzeltildi (CCW -> CW)");
            pts.reverse();
        }
    }

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
            // PBR texture desteği
            floorTextureId: typeof selectedTexture.value === 'number' ? selectedTexture.value : undefined,
            floorTextureUrl: typeof selectedTexture.value === 'string' ? selectedTexture.value : undefined,
            textureScale: form.textureScale,
            backgroundColor: form.bgColor,
            floorColor: form.floorColor,
            width: finalWidth,
            depth: finalDepth,
            gridVisible: true,
            floorLayers: layers.value,
            perimeterLayers: form.perimeterLayers
        }
    });
};

// Texture seçimi handler'ı
const selectTexture = (texture: any) => {
    if (texture.type === 'PBR') {
        selectedTexture.value = texture.id; // PBR için ID
        selectedTextureData.value = texture;
    } else {
        selectedTexture.value = texture.textureUrl; // Simple için URL
        selectedTextureData.value = texture;
    }
    // Default scale'i uygula
    if (texture.defaultScale) {
        form.textureScale = texture.defaultScale;
    }
};

// Texture seçimini temizle
const clearTexture = () => {
    selectedTexture.value = null;
    selectedTextureData.value = null;
};

// Texture'ları yükle
const loadTexturesFromProps = () => {
    // Önce temizle
    selectedTexture.value = null;
    selectedTextureData.value = null;
    
    // Eğer props'tan texture bilgisi geldiyse yükle
    if (props.initialData?.settings?.floorTextureId) {
        const texture = textureList.value.find((t: any) => t.id === props.initialData.settings.floorTextureId);
        if (texture) {
            selectedTexture.value = texture.id;
            selectedTextureData.value = texture;
        }
    } else if (props.initialData?.settings?.floorTextureUrl) {
        // SIMPLE texture için URL'den texture data'sını bul
        const texture = textureList.value.find((t: any) => t.textureUrl === props.initialData.settings.floorTextureUrl);
        if (texture) {
            selectedTexture.value = texture.textureUrl;
            selectedTextureData.value = texture;
        } else {
            // Legacy texture için fake texture data oluştur
            selectedTexture.value = props.initialData.settings.floorTextureUrl;
            selectedTextureData.value = {
                type: 'SIMPLE',
                textureUrl: props.initialData.settings.floorTextureUrl,
                name: 'Legacy Texture'
            };
        }
    }
};

onMounted(async () => {
    try { 
        textureList.value = await arSceneService.listFloorTextures();
        loadTexturesFromProps();
    }
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

// props.initialData değiştiğinde texture'ları yeniden yükle
watch(() => props.initialData, () => {
    if (textureList.value.length > 0) {
        loadTexturesFromProps();
    }
}, { deep: true });

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
                textureScale: s.textureScale || 2,
                perimeterLayers: s.perimeterLayers
                    ? s.perimeterLayers.map((layer: any) => ({ // <--- DÜZELTME BURADA
                        ...layer,
                        textureUrl: layer.textureUrl || null,
                        textureScale: layer.textureScale ?? 1,
                    }))
                    : []
            });
            // Texture yükle (PBR veya Simple)
            if (s.floorTextureId) {
                selectedTexture.value = s.floorTextureId;
                const texture = textureList.value.find((t: any) => t.id === s.floorTextureId);
                if (texture) {
                    selectedTextureData.value = texture;
                }
            } else if (s.floorTextureUrl) {
                selectedTexture.value = s.floorTextureUrl;
            }
            if (s.floorPoints) {
                customPoints.value = [...s.floorPoints];
                if (form.shapeType === 'custom' && customPoints.value.length > 2) isClosed.value = true;
            }
            if (s.floorLayers) {
                layers.value = [...s.floorLayers];
            }
            setTimeout(() => {
                if (svgContainer.value) {
                    const rect = svgContainer.value.getBoundingClientRect();
                    const aspect = rect.width / rect.height;
                    const maxDim = Math.max(form.width, form.depth);
                    let calculatedZoom = maxDim * 1.5;
                    if (calculatedZoom > 490) calculatedZoom = 490;
                    viewPort.zoom = calculatedZoom;
                    if (form.shapeType !== 'custom') {
                        const vbW = calculatedZoom * aspect;
                        viewPort.x = (form.width / 2) - (vbW / 2);
                        viewPort.y = (form.depth / 2) - (calculatedZoom / 2);
                    } else {
                        viewPort.x = -5; viewPort.y = -5;
                    }
                }
            }, 100);
        }
    }
});
</script>