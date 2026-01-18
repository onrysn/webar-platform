import { reactive } from "vue";
import { categoryService, type CategoryDto, type CreateCategoryPayload, type UpdateCategoryPayload } from "../../../services/categoryService";

export const categoriesStore = reactive({
  items: [] as CategoryDto[],
  loading: false,
  error: null as string | null,

  async fetch(companyId?: number, parentId?: number) {
    this.loading = true; this.error = null;
    try {
      this.items = await categoryService.list(companyId, parentId);
    } catch (e: any) {
      this.error = e?.response?.data?.message || e?.message || "Kategori yüklenemedi";
    } finally { this.loading = false; }
  },

  async create(payload: CreateCategoryPayload) {
    const created = await categoryService.create(payload);
    this.items.unshift(created);
    return created;
  },

  async update(id: number, payload: UpdateCategoryPayload) {
    const updated = await categoryService.update(id, payload);
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) this.items[idx] = updated;
    return updated;
  },

  async remove(id: number) {
    await categoryService.remove(id);
    this.items = this.items.filter(i => i.id !== id);
  }
});
