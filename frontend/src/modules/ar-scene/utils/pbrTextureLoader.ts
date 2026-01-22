/**
 * PBR Texture Loader Utility
 * Three.js için PBR texture'ları yükler ve MeshStandardMaterial oluşturur
 */

import * as THREE from 'three';
import type { PBRTextureSet, PBRTextureMaps } from '../config/pbrTextures';
import { arSceneService } from '../../../services/arSceneService';

// Texture cache - Aynı texture'ı tekrar yüklememek için
const textureCache = new Map<string, THREE.Texture>();
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

// Loading callbacks
type LoadingCallback = (progress: number, total: number, item: string) => void;
let globalLoadingCallback: LoadingCallback | null = null;

export function setTextureLoadingCallback(callback: LoadingCallback | null) {
  globalLoadingCallback = callback;
}

export interface PBRMaterialOptions {
  textureScale?: number;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  color?: string | number;
  useProgressiveLoading?: boolean; // Önce thumbnail sonra full resolution
  // Three.js material parameters ekstra (stencil, polygon offset vb.)
  [key: string]: any;
}

/**
 * Backend'den texture bilgisini alıp PBR material oluşturur
 */
export async function createPBRMaterialFromId(
  textureId: number,
  options: PBRMaterialOptions = {}
): Promise<THREE.MeshStandardMaterial> {
  try {
    // Cache kontrolü
    const cacheKey = `pbr_${textureId}_${JSON.stringify(options)}`;
    if (materialCache.has(cacheKey)) {
      console.log(`Material cache'den alındı: ${textureId}`);
      return materialCache.get(cacheKey)!.clone();
    }

    // Backend'den tüm texture'ları al (cache'leme için)
    const textures = await arSceneService.listFloorTextures();
    const texture = textures.find(t => t.id === textureId);
    
    if (!texture) {
      throw new Error(`Texture bulunamadı: ${textureId}`);
    }

    // PBR texture ise PBR material oluştur
    if (texture.type === 'PBR' && texture.baseColorUrl) {
      const maps: PBRTextureMaps = {
        baseColor: texture.baseColorUrl,
        normal: texture.normalUrl || '',
        roughness: texture.roughnessUrl || '',
        metallic: texture.metallicUrl,
        ao: texture.aoUrl,
      };

      const textureSet: PBRTextureSet = {
        id: texture.id.toString(),
        name: texture.name,
        category: (texture.category as any) || 'concrete',
        thumbnail: texture.thumbnailUrl,
        maps,
        defaultScale: texture.defaultScale || 2.0,
      };

      // Texture'dan gelen değerleri kullan
      const materialOptions: PBRMaterialOptions = {
        textureScale: options.textureScale || texture.defaultScale || 2.0,
        roughnessValue: options.roughnessValue ?? texture.roughnessValue ?? 0.9,
        metalnessValue: options.metalnessValue ?? texture.metalnessValue ?? 0.0,
        aoIntensity: options.aoIntensity ?? texture.aoIntensity ?? 1.2,
        normalScale: options.normalScale ?? texture.normalScale ?? 2.0,
        color: options.color,
        useProgressiveLoading: options.useProgressiveLoading ?? true,
      };

      const material = await createPBRMaterial(textureSet, materialOptions);
      materialCache.set(cacheKey, material);
      return material;
    }

    // Simple texture ise basit material
    if (texture.textureUrl) {
      const material = await createSimpleMaterial(texture.textureUrl, options);
      materialCache.set(cacheKey, material);
      return material;
    }

    // Hiçbiri yoksa düz renk
    throw new Error('Geçersiz texture formatı');
  } catch (error) {
    console.error('PBR Material oluşturma hatası:', error);
    throw error;
  }
}

/**
 * PBR texture haritalarını yükler
 * Opsiyonel haritalar (metallic, ao) varsa yükler, yoksa null döner
 */
export async function loadPBRTextures(
  maps: PBRTextureMaps,
  options: PBRMaterialOptions = {}
): Promise<{
  baseColorMap: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  metalnessMap: THREE.Texture | null;
  aoMap: THREE.Texture | null;
}> {
  const textureLoader = new THREE.TextureLoader();
  const scale = options.textureScale || 1.0;

  // Paralel yükleme için promise'ları topla
  const loadPromises: Promise<THREE.Texture | null>[] = [
    loadTexture(textureLoader, maps.baseColor, scale, THREE.SRGBColorSpace),
    loadTexture(textureLoader, maps.normal, scale, THREE.LinearSRGBColorSpace),
    loadTexture(textureLoader, maps.roughness, scale, THREE.LinearSRGBColorSpace),
    maps.metallic ? loadTexture(textureLoader, maps.metallic, scale, THREE.LinearSRGBColorSpace) : Promise.resolve(null),
    maps.ao ? loadTexture(textureLoader, maps.ao, scale, THREE.LinearSRGBColorSpace) : Promise.resolve(null),
  ];

  // Tüm texture'ları paralel yükle
  const results = await Promise.allSettled(loadPromises);

  return {
    baseColorMap: results[0]?.status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<THREE.Texture | null>).value : null,
    normalMap: results[1]?.status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<THREE.Texture | null>).value : null,
    roughnessMap: results[2]?.status === 'fulfilled' ? (results[2] as PromiseFulfilledResult<THREE.Texture | null>).value : null,
    metalnessMap: results[3]?.status === 'fulfilled' ? (results[3] as PromiseFulfilledResult<THREE.Texture | null>).value : null,
    aoMap: results[4]?.status === 'fulfilled' ? (results[4] as PromiseFulfilledResult<THREE.Texture | null>).value : null,
  };
}

/**
 * Tek bir texture'ı yükler ve yapılandırır
 * Cache desteği ve progress callback ile
 */
function loadTexture(
  loader: THREE.TextureLoader,
  url: string,
  scale: number,
  colorSpace: THREE.ColorSpace
): Promise<THREE.Texture> {
  // Cache kontrolü
  if (textureCache.has(url)) {
    console.log(`Texture cache'den alındı: ${url.split('/').pop()}`);
    return Promise.resolve(textureCache.get(url)!.clone());
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Scale'i repeat olarak uygula (daha fazla tekrar = daha küçük texture)
        const repeatValue = 1 / scale;
        texture.repeat.set(repeatValue, repeatValue);
        texture.colorSpace = colorSpace;
        texture.needsUpdate = true;
        texture.anisotropy = 16; // Texture kalitesini artır
        
        // Cache'e ekle
        textureCache.set(url, texture);
        
        // Progress callback
        if (globalLoadingCallback) {
          const fileName = url.split('/').pop() || 'texture';
          globalLoadingCallback(1, 1, fileName);
        }
        
        resolve(texture);
      },
      (progress) => {
        // Loading progress callback
        if (globalLoadingCallback && progress.total > 0) {
          const fileName = url.split('/').pop() || 'texture';
          globalLoadingCallback(progress.loaded, progress.total, fileName);
        }
      },
      (error) => {
        console.warn(`Texture yükleme hatası: ${url}`, error);
        reject(error);
      }
    );
  });
}

/**
 * PBR texture setinden MeshStandardMaterial oluşturur
 */
export async function createPBRMaterial(
  textureSet: PBRTextureSet,
  options: PBRMaterialOptions = {}
): Promise<THREE.MeshStandardMaterial> {
  const scale = options.textureScale || textureSet.defaultScale || 1.0;
  
  const textures = await loadPBRTextures(textureSet.maps, { ...options, textureScale: scale });

  // Options'dan özel parametreleri çıkar
  const { 
    textureScale, 
    roughnessValue, 
    metalnessValue, 
    aoIntensity, 
    normalScale, 
    color,
    ...extraParams 
  } = options;

  const material = new THREE.MeshStandardMaterial({
    // Base Color
    map: textures.baseColorMap,
    color: color !== undefined ? new THREE.Color(color) : 0xffffff,
    
    // Normal Map - 3D derinlik hissi için kritik
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(
      normalScale || 2.0,
      normalScale || 2.0
    ),
    
    // Roughness - Yüzey pürüzlülüğü
    roughnessMap: textures.roughnessMap,
    roughness: roughnessValue !== undefined ? roughnessValue : 0.9,
    
    // Metalness - Metalik yüzeyler için (çoğu zemin 0)
    metalnessMap: textures.metalnessMap,
    metalness: metalnessValue !== undefined ? metalnessValue : 0.0,
    
    // Ambient Occlusion - Gölge detayları
    aoMap: textures.aoMap,
    aoMapIntensity: aoIntensity !== undefined ? aoIntensity : 1.2,
    
    // Render settings
    side: THREE.DoubleSide,
    // Işık etkileşimini artır
    envMapIntensity: 1.0,

    // Ekstra parametreleri ekle (stencil, polygonOffset vb.)
    ...extraParams
  });

  return material;
}

/**
 * Basit (legacy) texture'dan material oluşturur
 */
export async function createSimpleMaterial(
  textureUrl: string,
  options: PBRMaterialOptions = {}
): Promise<THREE.MeshStandardMaterial> {
  const textureLoader = new THREE.TextureLoader();
  const scale = options.textureScale || 1.0;

  // Options'dan özel parametreleri çıkar
  const { 
    textureScale, 
    roughnessValue, 
    metalnessValue, 
    aoIntensity, 
    normalScale, 
    color,
    ...extraParams 
  } = options;

  return new Promise((resolve, reject) => {
    textureLoader.load(
      textureUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(scale, scale);
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: roughnessValue !== undefined ? roughnessValue : 0.8,
          metalness: metalnessValue !== undefined ? metalnessValue : 0.1,
          side: THREE.DoubleSide,
          // Ekstra parametreleri ekle
          ...extraParams
        });

        resolve(material);
      },
      undefined,
      (error) => {
        console.error(`Texture yükleme hatası: ${textureUrl}`, error);
        reject(error);
      }
    );
  });
}

/**
 * Texture'ları dispose eder (bellek temizliği)
 */
export function disposePBRMaterial(material: THREE.MeshStandardMaterial): void {
  if (material.map) material.map.dispose();
  if (material.normalMap) material.normalMap.dispose();
  if (material.roughnessMap) material.roughnessMap.dispose();
  if (material.metalnessMap) material.metalnessMap.dispose();
  if (material.aoMap) material.aoMap.dispose();
  material.dispose();
}

/**
 * Texture cache'ini temizler
 */
export function clearTextureCache(): void {
  console.log(`Texture cache temizleniyor: ${textureCache.size} texture`);
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
  
  console.log(`Material cache temizleniyor: ${materialCache.size} material`);
  materialCache.forEach(material => disposePBRMaterial(material));
  materialCache.clear();
}

/**
 * Cache istatistiklerini döndürür
 */
export function getCacheStats(): { textures: number; materials: number } {
  return {
    textures: textureCache.size,
    materials: materialCache.size
  };
}
