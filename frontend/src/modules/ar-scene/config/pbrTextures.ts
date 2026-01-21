/**
 * PBR Texture Definitions
 * Her texture seti için gerekli harita dosyalarını tanımlar
 */

export interface PBRTextureMaps {
  baseColor: string;
  normal: string;
  roughness: string;
  metallic?: string; // Opsiyonel - bazı texture'larda olmayabilir
  ao?: string; // Opsiyonel - bazı texture'larda olmayabilir
}

export interface PBRTextureSet {
  id: string;
  name: string;
  category: 'wood' | 'stone' | 'metal' | 'fabric' | 'ceramic' | 'concrete';
  thumbnail?: string;
  maps: PBRTextureMaps;
  defaultScale?: number;
}

