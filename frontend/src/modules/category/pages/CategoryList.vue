<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Kategoriler</h1>
              <p class="text-sm text-slate-500 mt-0.5">Model ve sahne kategorilerinizi yönetin</p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <input v-model="search" type="text" placeholder="Kategori ara..." 
              class="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64 transition-all" />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button @click="openCreate" 
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Kategori
          </button>
        </div>
      </div>

      <!-- Super Admin company filter -->
      <div v-if="isSuperAdmin" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <div class="flex items-center gap-2 text-slate-500 min-w-max">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span class="text-sm font-bold">Şirket:</span>
          </div>
          <select v-model="selectedFilterCompanyId" @change="refetch" 
            class="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
            <option :value="null">Tüm Şirketler</option>
            <option v-for="c in companiesList" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button v-if="selectedFilterCompanyId" @click="clearFilter" 
            class="px-3 py-2 text-xs text-red-600 font-bold hover:bg-red-50 rounded-lg transition-all">
            Temizle
          </button>
        </div>
      </div>

      <!-- Type Tabs -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex border-b border-slate-200">
          <button @click="activeTab = 'MODEL'" 
            :class="['flex-1 px-6 py-4 text-sm font-bold transition-all relative', 
              activeTab === 'MODEL' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50']">
            <div class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Model Kategorileri
              <span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                {{ modelCategories.length }}
              </span>
            </div>
            <div v-if="activeTab === 'MODEL'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
          </button>
          <button @click="activeTab = 'SCENE'" 
            :class="['flex-1 px-6 py-4 text-sm font-bold transition-all relative', 
              activeTab === 'SCENE' ? 'text-purple-600 bg-purple-50/50' : 'text-slate-600 hover:bg-slate-50']">
            <div class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              Sahne Kategorileri
              <span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                {{ sceneCategories.length }}
              </span>
            </div>
            <div v-if="activeTab === 'SCENE'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
          </button>
        </div>

        <!-- Categories Grid -->
        <div class="p-6">
          <!-- Loading State -->
          <div v-if="categories.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="n in 6" :key="n" class="animate-pulse">
              <div class="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl border border-slate-200 p-5 h-48">
                <div class="flex justify-between mb-4">
                  <div class="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div class="flex gap-2">
                    <div class="w-8 h-8 bg-slate-200 rounded-lg"></div>
                    <div class="w-8 h-8 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div class="h-4 bg-slate-200 rounded w-full"></div>
                  <div class="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="activeCategories.length === 0" class="text-center py-16 animate-in fade-in zoom-in-95 duration-300">
            <div class="mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500 delay-100"
              :class="activeTab === 'MODEL' ? 'bg-gradient-to-br from-indigo-100 to-indigo-50' : 'bg-gradient-to-br from-purple-100 to-purple-50'">
              <svg xmlns="http://www.w3.org/2000/svg" 
                :class="['h-12 w-12', activeTab === 'MODEL' ? 'text-indigo-500' : 'text-purple-500']" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2 animate-in slide-in-from-bottom-4 duration-500 delay-200">
              {{ activeTab === 'MODEL' ? 'Model kategorisi yok' : 'Sahne kategorisi yok' }}
            </h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto animate-in slide-in-from-bottom-4 duration-500 delay-300">
              {{ activeTab === 'MODEL' ? '3D modellerinizi düzenlemek için kategoriler oluşturun' : 'AR sahnelerinizi organize etmek için kategoriler oluşturun' }}
            </p>
            <button @click="openCreate" 
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all animate-in slide-in-from-bottom-4 duration-500 delay-400"
              :class="activeTab === 'MODEL' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500' : 'bg-gradient-to-r from-purple-600 to-purple-500'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ activeTab === 'MODEL' ? 'Model Kategorisi Oluştur' : 'Sahne Kategorisi Oluştur' }}
            </button>
          </div>
          
          <!-- Categories List -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div v-for="c in activeCategories" :key="c.id" 
              class="group relative bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 p-5 hover:shadow-lg transition-all duration-300 animate-in zoom-in-95"
              :style="{ animationDelay: `${activeCategories.indexOf(c) * 50}ms` }">
              
              <!-- Category Icon -->
              <div class="absolute -top-3 -left-3 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                :class="activeTab === 'MODEL' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'">
                <svg v-if="activeTab === 'MODEL'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                </svg>
              </div>

              <!-- Action Buttons -->
              <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="edit(c)" 
                  class="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button @click="remove(c.id)" 
                  class="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div class="mt-8 space-y-3">
                <div>
                  <h3 class="font-bold text-slate-900 text-lg">{{ c.name }}</h3>
                  <p v-if="c.description" class="text-sm text-slate-500 mt-1 line-clamp-2">{{ c.description }}</p>
                  <p v-else class="text-sm text-slate-400 italic mt-1">Açıklama yok</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                    #{{ c.id }}
                  </span>
                  <span v-if="c.parentId" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Alt kategori: #{{ c.parentId }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Modal -->
      <div v-if="showModal" @click.self="close" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200" @click.stop>
          
          <!-- Modal Header -->
          <div class="relative bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <button @click="close" 
              class="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-white">{{ editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori Oluştur' }}</h2>
                <p class="text-indigo-100 text-sm mt-1">{{ editing ? 'Kategori bilgilerini güncelleyin' : 'Yeni bir kategori ekleyin' }}</p>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-8 space-y-6">
            
            <!-- Category Type Selection -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-slate-700 mb-3">Kategori Tipi</label>
              <div class="grid grid-cols-2 gap-4">
                <button @click="form.categoryType = 'MODEL'" type="button"
                  :class="['relative p-4 rounded-2xl border-2 transition-all duration-200 group', 
                    form.categoryType === 'MODEL' 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50']">
                  <div class="flex flex-col items-center gap-2">
                    <div :class="['w-12 h-12 rounded-xl flex items-center justify-center transition-all', 
                      form.categoryType === 'MODEL' 
                        ? 'bg-indigo-500 shadow-lg shadow-indigo-200' 
                        : 'bg-slate-100 group-hover:bg-slate-200']">
                      <svg xmlns="http://www.w3.org/2000/svg" 
                        :class="['h-6 w-6', form.categoryType === 'MODEL' ? 'text-white' : 'text-slate-600']" 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div class="text-center">
                      <div :class="['font-bold text-sm', form.categoryType === 'MODEL' ? 'text-indigo-700' : 'text-slate-700']">
                        Model
                      </div>
                      <div class="text-xs text-slate-500 mt-0.5">3D modeller için</div>
                    </div>
                  </div>
                  <div v-if="form.categoryType === 'MODEL'" 
                    class="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>

                <button @click="form.categoryType = 'SCENE'" type="button"
                  :class="['relative p-4 rounded-2xl border-2 transition-all duration-200 group', 
                    form.categoryType === 'SCENE' 
                      ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50']">
                  <div class="flex flex-col items-center gap-2">
                    <div :class="['w-12 h-12 rounded-xl flex items-center justify-center transition-all', 
                      form.categoryType === 'SCENE' 
                        ? 'bg-purple-500 shadow-lg shadow-purple-200' 
                        : 'bg-slate-100 group-hover:bg-slate-200']">
                      <svg xmlns="http://www.w3.org/2000/svg" 
                        :class="['h-6 w-6', form.categoryType === 'SCENE' ? 'text-white' : 'text-slate-600']" 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                      </svg>
                    </div>
                    <div class="text-center">
                      <div :class="['font-bold text-sm', form.categoryType === 'SCENE' ? 'text-purple-700' : 'text-slate-700']">
                        Sahne
                      </div>
                      <div class="text-xs text-slate-500 mt-0.5">AR sahneler için</div>
                    </div>
                  </div>
                  <div v-if="form.categoryType === 'SCENE'" 
                    class="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <!-- Name Input -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-slate-700">
                Kategori Adı <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input v-model="form.name" type="text" placeholder="Örn: Mobilya, Oturma Odaları..." 
                  class="w-full px-4 py-3 pl-12 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-900 placeholder:text-slate-400" />
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>

            <!-- Description Input -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-slate-700">Açıklama</label>
              <textarea v-model="form.description" rows="3" placeholder="Kategori açıklaması (opsiyonel)" 
                class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none"></textarea>
            </div>

            <!-- Parent Category Selection -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-slate-700">Üst Kategori</label>
              <div class="relative">
                <select v-model="form.parentId" 
                  class="w-full px-4 py-3 pl-12 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-900 appearance-none cursor-pointer">
                  <option :value="undefined">Ana Kategori (Üst yok)</option>
                  <option v-for="cat in parentCategoryOptions" :key="cat.id" :value="cat.id">
                    {{ cat.name }} (#{{ cat.id }})
                  </option>
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button @click="close" 
              class="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white hover:border-slate-300 transition-all">
              İptal
            </button>
            <button @click="save" :disabled="!form.name.trim()"
              :class="['px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg', 
                form.name.trim() 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed']">
              {{ editing ? 'Güncelle' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { categoriesStore } from '../../../store/modules/categories';
import { useAuthStore } from '../../../store/modules/auth';
import { companyService } from '../../../services/companyService';
import type { CompanyDto } from '../../companies/dto/company.dto';
import type { CategoryDto } from '../../../services/categoryService';

const toast = useToast();
const auth = useAuthStore();
const isSuperAdmin = computed(() => auth.user?.role === 'SUPER_ADMIN');
const companiesList = ref<CompanyDto[]>([]);
const selectedFilterCompanyId = ref<number | null>(null);
const categories = categoriesStore;
const showModal = ref(false);
const editing = ref(false);
const editId = ref<number | null>(null);
const search = ref('');
const activeTab = ref<'MODEL' | 'SCENE'>('MODEL');

const form = reactive({ 
  name: '', 
  description: '', 
  categoryType: 'MODEL' as 'MODEL' | 'SCENE',
  parentId: undefined as number | undefined 
});

onMounted(async () => {
  if (isSuperAdmin.value) {
    try { companiesList.value = await companyService.getAllCompanies(); } catch (e) { /* ignore */ }
  }
  await refetch();
});

const refetch = async () => {
  let targetId: number | undefined;
  if (isSuperAdmin.value) {
    // Super admin: Filtre seçiliyse o şirketi, yoksa tümünü getir (undefined)
    targetId = selectedFilterCompanyId.value ?? undefined;
  } else {
    // Diğer roller: Kendi şirketini kullan
    targetId = auth.user?.companyId ?? undefined;
  }
  await categories.fetch(targetId);
};

const clearFilter = async () => { 
  selectedFilterCompanyId.value = null; 
  await refetch(); 
};

// Filtered categories by search
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return categories.items;
  return categories.items.filter((c: any) => (c.name || '').toLowerCase().includes(q));
});

// Categories by type
const modelCategories = computed(() => 
  filtered.value.filter((c: CategoryDto) => c.categoryType === 'MODEL')
);

const sceneCategories = computed(() => 
  filtered.value.filter((c: CategoryDto) => c.categoryType === 'SCENE')
);

const activeCategories = computed(() => 
  activeTab.value === 'MODEL' ? modelCategories.value : sceneCategories.value
);

// Parent category options (same type, excluding self when editing)
const parentCategoryOptions = computed(() => {
  return categories.items.filter((c: CategoryDto) => {
    // Same type as current form
    if (c.categoryType !== form.categoryType) return false;
    // Exclude self when editing
    if (editing.value && c.id === editId.value) return false;
    return true;
  });
});

function openCreate() {
  editing.value = false; 
  editId.value = null; 
  form.name = ''; 
  form.description = ''; 
  form.categoryType = activeTab.value; // Auto-select current tab type
  form.parentId = undefined; 
  showModal.value = true;
}

function edit(c: CategoryDto) {
  editing.value = true; 
  editId.value = c.id; 
  form.name = c.name; 
  form.description = c.description || ''; 
  form.categoryType = c.categoryType;
  form.parentId = c.parentId ?? undefined; 
  showModal.value = true;
}

function close() { 
  showModal.value = false; 
}

async function save() {
  if (!form.name.trim()) return;
  
  try {
    if (!editing.value) {
      const payload: any = { 
        name: form.name, 
        description: form.description || undefined, 
        categoryType: form.categoryType,
        parentId: form.parentId 
      };
      if (isSuperAdmin.value && selectedFilterCompanyId.value) {
        payload.companyId = selectedFilterCompanyId.value;
      }
      await categories.create(payload);
      toast.success(`"${form.name}" kategorisi oluşturuldu`);
    } else {
      await categories.update(editId.value!, { 
        name: form.name, 
        description: form.description || undefined, 
        categoryType: form.categoryType,
        parentId: form.parentId ?? null 
      });
      toast.success(`"${form.name}" kategorisi güncellendi`);
    }
    showModal.value = false;
  } catch (error: any) {
    console.error('Kategori kaydedilemedi:', error);
    toast.error(error?.response?.data?.message || 'Kategori kaydedilemedi');
  }
}

async function remove(id: number) {
  const category = categories.items.find(c => c.id === id);
  if (!confirm(`"${category?.name}" kategorisini silmek istediğinizden emin misiniz?`)) return;
  try {
    await categories.remove(id);
    toast.success('Kategori başarıyla silindi');
  } catch (error: any) {
    console.error('Kategori silinemedi:', error);
    toast.error(error?.response?.data?.message || 'Kategori silinemedi');
  }
}
</script>
