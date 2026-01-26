<template>
  <div class="pbr-texture-list">
    <div class="header">
      <h1>PBR Texture Yönetimi</h1>
      <button @click="goToCreate" class="btn btn-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Yeni Texture
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Kategori:</label>
        <select v-model="filters.category" @change="fetchTextures">
          <option value="">Tümü</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Tip:</label>
        <select v-model="filters.type" @change="fetchTextures">
          <option value="">Tümü</option>
          <option value="SIMPLE">Simple</option>
          <option value="PBR">PBR</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Durum:</label>
        <select v-model="filters.isActive" @change="fetchTextures">
          <option value="">Tümü</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Texture'lar yükleniyor...</p>
    </div>

    <!-- Texture Grid -->
    <div v-else-if="textures.length > 0" class="texture-grid">
      <div
        v-for="texture in textures"
        :key="texture.id"
        class="texture-card"
        :class="{ inactive: !texture.isActive }"
      >
        <div class="texture-thumbnail">
          <img :src="texture.thumbnailUrl" :alt="texture.name" />
          <span class="texture-type" :class="texture.type.toLowerCase()">
            {{ texture.type }}
          </span>
        </div>
        
        <div class="texture-info">
          <h3>{{ texture.name }}</h3>
          <p v-if="texture.category" class="category">{{ texture.category }}</p>
          <div v-if="texture.tags && texture.tags.length > 0" class="tags">
            <span v-for="tag in texture.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <div class="texture-actions">
          <button @click="goToEdit(texture.id)" class="btn btn-sm btn-secondary" title="Düzenle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Düzenle
          </button>
          <button @click="confirmDelete(texture)" class="btn btn-sm btn-danger" title="Sil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Sil
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <p>Henüz texture eklenmemiş</p>
      <button @click="goToCreate" class="btn btn-primary">İlk Texture'ı Ekle</button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteModal.show" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal" @click.stop>
        <h3>Texture Sil</h3>
        <p>
          <strong>{{ deleteModal.texture?.name }}</strong> texture'ını silmek istediğinize emin misiniz?
          Bu işlem geri alınamaz.
        </p>
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="btn btn-secondary">İptal</button>
          <button @click="deleteTexture" class="btn btn-danger" :disabled="deleteModal.deleting">
            {{ deleteModal.deleting ? 'Siliniyor...' : 'Sil' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { pbrTextureService, type PbrTexture } from '../../../services/pbrTextureService';

const router = useRouter();

const textures = ref<PbrTexture[]>([]);
const categories = ref<string[]>([]);
const loading = ref(false);

const filters = ref({
  category: '',
  type: '',
  isActive: '',
});

const deleteModal = ref({
  show: false,
  texture: null as PbrTexture | null,
  deleting: false,
});

const fetchTextures = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.isActive) params.isActive = filters.value.isActive === 'true';

    textures.value = await pbrTextureService.getAll(params);
  } catch (error) {
    console.error('Texture\'lar yüklenemedi:', error);
    alert('Texture\'lar yüklenirken bir hata oluştu');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    categories.value = await pbrTextureService.getCategories();
  } catch (error) {
    console.error('Kategoriler yüklenemedi:', error);
  }
};

const goToCreate = () => {
  router.push('/dashboard/pbr-textures/create');
};

const goToEdit = (id: number) => {
  router.push(`/dashboard/pbr-textures/${id}/edit`);
};

const confirmDelete = (texture: PbrTexture) => {
  deleteModal.value.show = true;
  deleteModal.value.texture = texture;
};

const closeDeleteModal = () => {
  if (deleteModal.value.deleting) return;
  deleteModal.value.show = false;
  deleteModal.value.texture = null;
};

const deleteTexture = async () => {
  if (!deleteModal.value.texture) return;

  deleteModal.value.deleting = true;
  try {
    await pbrTextureService.delete(deleteModal.value.texture.id);
    closeDeleteModal();
    await fetchTextures();
  } catch (error) {
    console.error('Texture silinemedi:', error);
    alert('Texture silinirken bir hata oluştu');
    deleteModal.value.deleting = false;
  }
};

onMounted(() => {
  fetchTextures();
  fetchCategories();
});
</script>

<style scoped>
.pbr-texture-list {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a1a;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
}

.filter-group select {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  font-size: 0.875rem;
  min-width: 150px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.texture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.texture-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.texture-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.texture-card.inactive {
  opacity: 0.6;
}

.texture-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 75%;
  background: #f8f9fa;
  overflow: hidden;
}

.texture-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.texture-type {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.texture-type.pbr {
  background: #28a745;
  color: white;
}

.texture-type.simple {
  background: #6c757d;
  color: white;
}

.texture-info {
  padding: 1rem;
}

.texture-info h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.category {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  padding: 0.125rem 0.5rem;
  background: #e9ecef;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #495057;
}

.texture-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #dee2e6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: #6c757d;
}

.empty-state svg {
  opacity: 0.5;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 0.5rem 1rem;
  flex: 1;
  font-size: 0.8125rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.modal h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.modal p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
