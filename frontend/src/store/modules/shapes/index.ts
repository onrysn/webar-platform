import { reactive } from "vue";
import { shapeService, type ShapeDto } from "../../../services/shapeService";
import type { ShapeCategory } from "@prisma/client";

export const shapesStore = reactive({
  items: [] as ShapeDto[],
  loading: false,
  error: null as string | null,

  async fetch(category?: ShapeCategory, activeOnly?: boolean) {
    this.loading = true; this.error = null;
    try {
      this.items = await shapeService.list(category, activeOnly);
    } catch (e: any) {
      this.error = e?.response?.data?.message || e?.message || "Şekiller yüklenemedi";
    } finally { this.loading = false; }
  }
});
