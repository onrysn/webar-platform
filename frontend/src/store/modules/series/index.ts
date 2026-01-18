import { reactive } from "vue";
import { seriesService, type SeriesDto, type CreateSeriesPayload, type UpdateSeriesPayload } from "../../../services/seriesService";

export const seriesStore = reactive({
  items: [] as SeriesDto[],
  loading: false,
  error: null as string | null,

  async fetch(companyId?: number) {
    this.loading = true; this.error = null;
    try {
      this.items = await seriesService.list(companyId);
    } catch (e: any) {
      this.error = e?.response?.data?.message || e?.message || "Seri yüklenemedi";
    } finally { this.loading = false; }
  },

  async create(payload: CreateSeriesPayload) {
    const created = await seriesService.create(payload);
    this.items.unshift(created);
    return created;
  },

  async update(id: number, payload: UpdateSeriesPayload) {
    const updated = await seriesService.update(id, payload);
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) this.items[idx] = updated;
    return updated;
  },

  async remove(id: number) {
    await seriesService.remove(id);
    this.items = this.items.filter(i => i.id !== id);
  }
});
