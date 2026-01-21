/**
 * PBR Texture Loader Utility
 * Three.js için PBR texture'ları yükler ve MeshStandardMaterial oluşturur
 */

import * as THREE from 'three';
import type { PBRTextureSet, PBRTextureMaps } from '../config/pbrTextures';
import { arSceneService } from '../../../services/arSceneService';

export interface PBRMaterialOptions {
  textureScale?: number;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  color?: string | number;
}

/**
 * Backend'den texture bilgisini alıp PBR material oluşturur
 */
export async function createPBRMaterialFromId(
  textureId: number,
  options: PBRMaterialOptions = {}
): Promise<THREE.MeshStandardMaterial> {
  try {
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
      };

      return await createPBRMaterial(textureSet, materialOptions);
    }

    // Simple texture ise basit material
    if (texture.textureUrl) {
      return await createSimpleMaterial(texture.textureUrl, options);
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
 */
function loadTexture(
  loader: THREE.TextureLoader,
  url: string,
  scale: number,
  colorSpace: THREE.ColorSpace
): Promise<THREE.Texture> {
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
        resolve(texture);
      },
      undefined,
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

  const material = new THREE.MeshStandardMaterial({
    // Base Color
    map: textures.baseColorMap,
    color: options.color !== undefined ? new THREE.Color(options.color) : 0xffffff,
    
    // Normal Map - 3D derinlik hissi için kritik
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(
      options.normalScale || 2.0,
      options.normalScale || 2.0
    ),
    
    // Roughness - Yüzey pürüzlülüğü
    roughnessMap: textures.roughnessMap,
    roughness: options.roughnessValue !== undefined ? options.roughnessValue : 0.9,
    
    // Metalness - Metalik yüzeyler için (çoğu zemin 0)
    metalnessMap: textures.metalnessMap,
    metalness: options.metalnessValue !== undefined ? options.metalnessValue : 0.0,
    
    // Ambient Occlusion - Gölge detayları
    aoMap: textures.aoMap,
    aoMapIntensity: options.aoIntensity !== undefined ? options.aoIntensity : 1.2,
    
    // Render settings
    side: THREE.DoubleSide,
    // Işık etkileşimini artır
    envMapIntensity: 1.0,
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
          roughness: options.roughnessValue !== undefined ? options.roughnessValue : 0.8,
          metalness: options.metalnessValue !== undefined ? options.metalnessValue : 0.1,
          side: THREE.DoubleSide,
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
