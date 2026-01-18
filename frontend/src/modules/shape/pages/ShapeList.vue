<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Şekiller <span class="text-[11px] text-slate-500">(Süper Admin)</span></h1>
        <p class="text-xs text-slate-500">Sahne işaretleri için SVG şekillerini yönetin</p>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="search" type="text" placeholder="Ara..." class="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-48" />
        <button @click="openCreate" class="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">Yeni Şekil</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="s in filtered" :key="s.id" class="p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all">
        <div class="flex items-start gap-3">
          <span class="text-2xl">{{ s.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-slate-800 truncate">{{ s.labelTR }}<span v-if="s.labelEN" class="text-xs text-slate-400"> · {{ s.labelEN }}</span></div>
            <div class="text-[11px] text-slate-500">Kod: {{ s.code }} · Kategori: {{ s.category }}</div>
            <div v-if="s.tags?.length" class="mt-2 flex flex-wrap gap-1">
              <span v-for="t in s.tags" :key="t" class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] border border-slate-200">#{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="mt-3 flex gap-2 justify-end">
          <button @click="edit(s)" class="px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50">Düzenle</button>
          <button @click="remove(s.id)" class="px-3 py-1.5 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Sil</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white p-5 rounded-2xl w-full max-w-md space-y-4 border border-slate-200 shadow-xl">
        <div class="font-bold text-slate-800">{{ editing ? 'Şekli Güncelle' : 'Yeni Şekil' }}</div>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase">Kod</label>
              <input v-model="form.code" placeholder="Örn: rect" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase">İkon</label>
              <input v-model="form.icon" placeholder="Emoji" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase">SVG Path</label>
            <textarea v-model="form.svgPath" placeholder="SVG path" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase">Etiket (TR)</label>
              <input v-model="form.labelTR" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase">Etiket (EN)</label>
              <input v-model="form.labelEN" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase">Kategori</label>
            <select v-model="form.category" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase">Etiketler</label>
            <input v-model="tagsInput" placeholder="Virgülle ayırın" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <input type="checkbox" v-model="form.isActive" id="isActive" />
              <label for="isActive" class="text-sm">Aktif</label>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase">Sıra</label>
              <input v-model.number="form.sortOrder" type="number" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="close" class="px-3 py-2 rounded-lg border">İptal</button>
          <button @click="save" class="px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold">Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { shapeService, type ShapeDto } from '../../../services/shapeService';
import type { ShapeCategory } from '@prisma/client';

const items = ref<ShapeDto[]>([]);
const showModal = ref(false);
const editing = ref(false);
const editId = ref<number | null>(null);
const search = ref('');

const categories = Object.values(({} as any).ShapeCategory || { BASIC: 'BASIC', GEOMETRIC: 'GEOMETRIC', ARCHITECTURAL: 'ARCHITECTURAL', ARROWS: 'ARROWS', SYMBOLS: 'SYMBOLS', CONTROLS: 'CONTROLS', ICONS: 'ICONS', NATURE: 'NATURE', OBJECTS: 'OBJECTS', CUSTOM: 'CUSTOM' });

const form = reactive({
  code: '', icon: '', svgPath: '', labelTR: '', labelEN: '', descTR: '', descEN: '',
  category: 'BASIC' as ShapeCategory, tags: [] as string[], isActive: true, sortOrder: 0
});
const tagsInput = ref('');

onMounted(async () => { items.value = await shapeService.list(); });

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter(s => (s.labelTR || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q));
});

function openCreate() { editing.value = false; editId.value = null; Object.assign(form, { code: '', icon: '', svgPath: '', labelTR: '', labelEN: '', descTR: '', descEN: '', category: 'BASIC', tags: [], isActive: true, sortOrder: 0 }); tagsInput.value=''; showModal.value = true; }
function edit(s: ShapeDto) { editing.value = true; editId.value = s.id; Object.assign(form, { code: s.code, icon: s.icon, svgPath: s.svgPath, labelTR: s.labelTR, labelEN: s.labelEN || '', descTR: s.descTR || '', descEN: s.descEN || '', category: s.category, tags: s.tags, isActive: s.isActive, sortOrder: s.sortOrder }); tagsInput.value = s.tags.join(','); showModal.value = true; }
function close() { showModal.value = false; }

async function save() {
  form.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
  if (!editing.value) {
    const created = await shapeService.create(form as any);
    items.value.unshift(created);
  } else {
    const updated = await shapeService.update(editId.value!, form as any);
    const idx = items.value.findIndex(i => i.id === editId.value);
    if (idx >= 0) items.value[idx] = updated;
  }
  showModal.value = false;
}

async function remove(id: number) { await shapeService.remove(id); items.value = items.value.filter(i => i.id !== id); }
</script>
