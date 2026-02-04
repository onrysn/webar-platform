<template>
  <div class="pbr-texture-form">
    <div class="header">
      <button @click="goBack" class="btn-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        {{ t('common.back') }}
      </button>
      <h1>{{ isEdit ? t('pbrTextures.form.editTitle') : t('pbrTextures.form.title') }}</h1>
    </div>

    <div class="content">
      <!-- Form -->
      <div class="form-section">
        <form @submit.prevent="handleSubmit">
          <!-- Basic Info -->
          <div class="form-group">
            <label>{{ t('pbrTextures.form.name') }} *</label>
            <input
              v-model="form.name"
              type="text"
              required
              :placeholder="t('pbrTextures.textureNamePlaceholder')"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('pbrTextures.form.type') }} *</label>
              <select v-model="form.type" required>
                <option value="PBR">{{ t('pbrTextures.typePBR') }}</option>
                <option value="SIMPLE">{{ t('pbrTextures.typeSimple') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.category') }}</label>
              <input
                v-model="form.category"
                type="text"
                list="categories"
                :placeholder="t('pbrTextures.form.categoryPlaceholder')"
              />
              <datalist id="categories">
                <option v-for="cat in existingCategories" :key="cat" :value="cat" />
              </datalist>
            </div>
          </div>

          <!-- PBR Maps -->
          <div v-if="form.type === 'PBR'" class="pbr-maps">
            <h3>{{ t('pbrTextures.form.layers') }}</h3>
            
            <div class="form-group">
              <label>{{ t('pbrTextures.form.baseColor') }} *</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleFileChange($event, 'baseColor')"
                :required="form.type === 'PBR' && !isEdit"
              />
              <small v-if="form.baseColorUrl" class="file-info">
                {{ t('pbrTextures.form.current') }} {{ form.baseColorUrl }}
              </small>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.normalMap') }}</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleFileChange($event, 'normal')"
              />
              <small v-if="form.normalUrl" class="file-info">
                {{ t('pbrTextures.form.current') }} {{ form.normalUrl }}
              </small>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.roughnessMap') }}</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleFileChange($event, 'roughness')"
              />
              <small v-if="form.roughnessUrl" class="file-info">
                {{ t('pbrTextures.form.current') }} {{ form.roughnessUrl }}
              </small>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.metallicMap') }}</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleFileChange($event, 'metallic')"
              />
              <small v-if="form.metallicUrl" class="file-info">
                {{ t('pbrTextures.form.current') }} {{ form.metallicUrl }}
              </small>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.aoMap') }}</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleFileChange($event, 'ao')"
              />
              <small v-if="form.aoUrl" class="file-info">
                {{ t('pbrTextures.form.current') }} {{ form.aoUrl }}
              </small>
            </div>
          </div>

          <!-- PBR Settings -->
          <div v-if="form.type === 'PBR'" class="pbr-settings">
            <h3>{{ t('pbrTextures.form.settings') }}</h3>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('pbrTextures.form.scale') }} ({{ form.defaultScale }})</label>
                <input
                  v-model.number="form.defaultScale"
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
              </div>

              <div class="form-group">
                <label>{{ t('pbrTextures.form.roughness') }} ({{ form.roughnessValue }})</label>
                <input
                  v-model.number="form.roughnessValue"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('pbrTextures.form.metalness') }} ({{ form.metalnessValue }})</label>
                <input
                  v-model.number="form.metalnessValue"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>

              <div class="form-group">
                <label>{{ t('pbrTextures.form.aoIntensity') }} ({{ form.aoIntensity }})</label>
                <input
                  v-model.number="form.aoIntensity"
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                />
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.normalScale') }} ({{ form.normalScale }})</label>
              <input
                v-model.number="form.normalScale"
                type="range"
                min="0"
                max="5"
                step="0.1"
              />
            </div>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label>{{ t('pbrTextures.form.tags') }}</label>
            <input
              v-model="tagsInput"
              type="text"
              :placeholder="t('pbrTextures.form.tagsPlaceholder')"
            />
            <small>{{ t('pbrTextures.form.tagsExample') }}</small>
          </div>

          <!-- Settings -->
          <div class="form-row">
            <div class="form-group">
              <label>
                <input v-model="form.isActive" type="checkbox" />
                {{ t('pbrTextures.form.active') }}
              </label>
            </div>

            <div class="form-group">
              <label>{{ t('pbrTextures.form.order') }}</label>
              <input
                v-model.number="form.sortOrder"
                type="number"
                min="0"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" @click="goBack" class="btn btn-secondary">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.saving') : (isEdit ? t('common.update') : t('common.create')) }}
            </button>
          </div>
        </form>
      </div>

      <!-- Live Preview -->
      <div class="preview-section">
        <h3>{{ t('pbrTextures.form.livePreview') }}</h3>
        <PbrTexturePreview
          v-if="form.type === 'PBR'"
          :base-color-url="form.baseColorUrl"
          :normal-url="form.normalUrl"
          :roughness-url="form.roughnessUrl"
          :metallic-url="form.metallicUrl"
          :ao-url="form.aoUrl"
          :roughness-value="form.roughnessValue"
          :metalness-value="form.metalnessValue"
          :ao-intensity="form.aoIntensity"
          :normal-scale="form.normalScale"
          :default-scale="form.defaultScale"
        />
        <div v-else class="preview-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>{{ t('pbrTextures.form.previewPlaceholder') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { pbrTextureService } from '../../../services/pbrTextureService';
import PbrTexturePreview from '../../../components/PbrTexturePreview.vue';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const isEdit = computed(() => !!route.params.id);
const existingCategories = ref<string[]>([]);
const submitting = ref(false);

const uploadedFiles = ref<{

  normal?: File;
  roughness?: File;
  metallic?: File;
  ao?: File;
}>({});

const form = ref({
  name: '',
  type: 'PBR' as 'PBR' | 'SIMPLE',
  baseColorUrl: '',
  normalUrl: '',
  roughnessUrl: '',
  metallicUrl: '',
  aoUrl: '',
  defaultScale: 2.0,
  roughnessValue: 0.9,
  metalnessValue: 0.0,
  aoIntensity: 1.2,
  normalScale: 2.0,
  category: '',
  isActive: true,
  sortOrder: 0,
});

const tagsInput = ref('');

const fetchCategories = async () => {
  try {
    existingCategories.value = await pbrTextureService.getCategories();
  } catch (error) {
    console.error('Kategoriler yüklenemedi:', error);
  }
};

const fetchTexture = async (id: number) => {
  try {
    const texture = await pbrTextureService.getOne(id);
    form.value = {
      name: texture.name,
      type: texture.type,
      baseColorUrl: texture.baseColorUrl || '',
      normalUrl: texture.normalUrl || '',
      roughnessUrl: texture.roughnessUrl || '',
      metallicUrl: texture.metallicUrl || '',
      aoUrl: texture.aoUrl || '',
      defaultScale: texture.defaultScale || 2.0,
      roughnessValue: texture.roughnessValue || 0.9,
      metalnessValue: texture.metalnessValue || 0.0,
      aoIntensity: texture.aoIntensity || 1.2,
      normalScale: texture.normalScale || 2.0,
      category: texture.category || '',
      isActive: texture.isActive,
      sortOrder: texture.sortOrder,
    };
    tagsInput.value = texture.tags?.join(', ') || '';
  } catch (error) {
    console.error('Texture yüklenemedi:', error);
    alert('Texture yüklenirken bir hata oluştu');
    goBack();
  }
};

const handleFileChange = (event: Event, fieldName: string) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    uploadedFiles.value[fieldName as keyof typeof uploadedFiles.value] = target.files[0];
    
    // Preview için URL oluştur
    const previewUrl = URL.createObjectURL(target.files[0]);
    switch (fieldName) {
      case 'baseColor':
        form.value.baseColorUrl = previewUrl;
        break;
      case 'normal':
        form.value.normalUrl = previewUrl;
        break;
      case 'roughness':
        form.value.roughnessUrl = previewUrl;
        break;
      case 'metallic':
        form.value.metallicUrl = previewUrl;
        break;
      case 'ao':
        form.value.aoUrl = previewUrl;
        break;
    }
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    // Önce dosyaları yükle (varsa)
    let uploadedUrls: any = {};
    if (Object.keys(uploadedFiles.value).length > 0) {
      if (!form.value.name) {
        alert('Dosyaları yüklemek için önce texture adı girmelisiniz!');
        submitting.value = false;
        return;
      }
      
      uploadedUrls = await pbrTextureService.uploadTextures(
        form.value.name,
        uploadedFiles.value
      );
    }

    const dto: any = {
      ...form.value,
      // Use baseColor as thumbnail for PBR textures
      thumbnailUrl: uploadedUrls.thumbnailUrl || uploadedUrls.baseColorUrl || form.value.baseColorUrl,
      // Upload edilen URL'leri kullan, yoksa mevcut form değerlerini kullan
      baseColorUrl: uploadedUrls.baseColorUrl || form.value.baseColorUrl,
      normalUrl: uploadedUrls.normalUrl || form.value.normalUrl,
      roughnessUrl: uploadedUrls.roughnessUrl || form.value.roughnessUrl,
      metallicUrl: uploadedUrls.metallicUrl || form.value.metallicUrl,
      aoUrl: uploadedUrls.aoUrl || form.value.aoUrl,
      tags: tagsInput.value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
    };

    if (isEdit.value) {
      await pbrTextureService.update(Number(route.params.id), dto);
    } else {
      await pbrTextureService.create(dto);
    }

    router.push('/dashboard/pbr-textures');
  } catch (error: any) {
    console.error('Kaydetme hatası:', error);
    alert(error.response?.data?.message || 'Kaydetme sırasında bir hata oluştu');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push('/dashboard/pbr-textures');
};

onMounted(async () => {
  await fetchCategories();
  if (isEdit.value) {
    await fetchTexture(Number(route.params.id));
  }
});
</script>

<style scoped>
.pbr-texture-form {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e9ecef;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a1a;
}

.content {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 2rem;
}

.form-section {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group input[type="file"],
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-group input[type="file"] {
  padding: 0.5rem;
  cursor: pointer;
}

.form-group input[type="file"]::-webkit-file-upload-button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 1rem;
}

.form-group input[type="file"]::-webkit-file-upload-button:hover {
  background: #0056b3;
}

.file-info {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #e7f3ff;
  border-left: 3px solid #007bff;
  border-radius: 4px;
  color: #004085;
  font-size: 0.75rem;
  word-break: break-all;
}

.form-group input[type="range"] {
  width: 100%;
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.pbr-maps,
.pbr-settings {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.pbr-maps h3,
.pbr-settings h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.preview-section {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.preview-section h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  color: #6c757d;
  gap: 1rem;
}

.preview-placeholder svg {
  opacity: 0.5;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }

  .preview-section {
    position: static;
  }
}
</style>
