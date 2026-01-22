// src/modules/ar-scene/composables/useARExport.ts
import { ref, computed } from 'vue';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { arModelService } from '../../../services/arModelService';

export type ExportStatus = 
  | 'idle' 
  | 'preparing' 
  | 'exporting' 
  | 'converting' 
  | 'ready' 
  | 'error';

interface ExportProgress {
  status: ExportStatus;
  message: string;
  progress: number; // 0-100
}

interface ExportResult {
  glbBlob: Blob;
  usdzUrl?: string;
  fileName: string;
}

export function useARExport() {
  const exportProgress = ref<ExportProgress>({
    status: 'idle',
    message: '',
    progress: 0
  });

  const isExporting = computed(() => 
    exportProgress.value.status !== 'idle' && 
    exportProgress.value.status !== 'ready' && 
    exportProgress.value.status !== 'error'
  );

  const updateProgress = (status: ExportStatus, message: string, progress: number) => {
    exportProgress.value = { status, message, progress };
  };

  /**
   * Scene'i GLB olarak export eder
   * Mobil cihazlarda texture optimizasyonu yapar
   */
  const exportSceneToGLB = async (
    scene: THREE.Scene,
    sceneSettings: any,
    options: {
      buildPerimeterLayers?: (scene: THREE.Scene, settings: any) => Promise<void>;
      isMobile?: boolean;
    } = {}
  ): Promise<Blob> => {
    updateProgress('preparing', 'Sahne hazırlanıyor...', 10);

    const isMobile = options.isMobile ?? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const maxTextureSize = isMobile ? 512 : 1024;
    
    console.log(`📦 Export başlatılıyor... (Mobil: ${isMobile}, Max Texture: ${maxTextureSize})`);
    
    updateProgress('exporting', 'Sahne dışa aktarılıyor...', 30);

    // Export için scene hazırlığı
    const cleanup = prepareSceneForExport(scene);

    try {
      // Perimeter layers ekle
      if (options.buildPerimeterLayers && sceneSettings) {
        await options.buildPerimeterLayers(scene, sceneSettings);
      }

      updateProgress('exporting', '3D modeller işleniyor...', 50);

      const exporter = new GLTFExporter();
      const exportOptions = {
        binary: true,
        onlyVisible: true,
        maxTextureSize: maxTextureSize,
        embedImages: true
      };

      const blob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Export işlemi zaman aşımına uğradı"));
        }, isMobile ? 30000 : 60000);
        
        try {
          exporter.parse(
            scene,
            (gltf) => {
              clearTimeout(timeout);
              const resultBlob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
              console.log(`✅ Export başarılı! Boyut: ${(resultBlob.size / 1024 / 1024).toFixed(2)} MB`);
              resolve(resultBlob);
            },
            (error) => {
              clearTimeout(timeout);
              console.error("❌ Export hatası:", error);
              reject(error);
            },
            exportOptions
          );
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });

      updateProgress('exporting', 'Export tamamlandı!', 80);
      
      return blob;
    } finally {
      // Scene'i eski haline getir
      cleanup();
    }
  };

  /**
   * GLB'yi USDZ'ye çevirir (iOS için)
   */
  const convertToUSDZ = async (glbBlob: Blob, fileName: string): Promise<string> => {
    updateProgress('converting', 'iOS için dönüştürülüyor...', 85);
    
    const data = await arModelService.convertSharedGlbToUsdz(glbBlob, fileName);
    
    if (!data.usdz || !data.usdz.url) {
      throw new Error("USDZ dönüşümü başarısız");
    }

    updateProgress('ready', 'Hazır!', 100);
    
    return arModelService.getPreviewUrl(data.usdz.url);
  };

  /**
   * AR görüntülemeyi başlatır
   * Platform algılaması yapıp uygun formatta dosyayı hazırlar
   */
  const startARView = async (result: ExportResult): Promise<void> => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (!isIOS && !isAndroid) {
      throw new Error("AR yalnızca mobil cihazlarda desteklenir");
    }

    if (isIOS) {
      if (!result.usdzUrl) {
        throw new Error("USDZ dosyası hazırlanmamış");
      }
      openARQuickLook(result.usdzUrl, result.fileName);
    } else {
      downloadForAndroid(result.glbBlob, result.fileName);
    }
  };

  /**
   * iOS AR Quick Look'u açar
   */
  const openARQuickLook = (usdzUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.setAttribute('rel', 'ar');
    link.href = usdzUrl;
    link.download = `${fileName}.usdz`;

    document.body.appendChild(link);

    const img = document.createElement('img');
    link.appendChild(img);

    link.click();
    document.body.removeChild(link);
  };

  /**
   * Android için GLB indirir
   */
  const downloadForAndroid = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.glb`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  /**
   * Scene'i export için hazırlar ve cleanup fonksiyonu döner
   */
  const prepareSceneForExport = (scene: THREE.Scene) => {
    const transformControl = scene.getObjectByName('TransformControlsGizmo')?.parent;
    const gridMesh = scene.getObjectByName('GridMesh');
    const baseFloor = scene.getObjectByName('BaseFloor');
    const floorGroup = baseFloor?.parent;

    // Mevcut durumları kaydet
    const savedStates = {
      controlsVisible: transformControl?.visible,
      gridVisible: gridMesh?.visible,
      childrenZPositions: new Map<THREE.Object3D, number>()
    };

    // Controls ve grid'i gizle
    if (transformControl) transformControl.visible = false;
    if (gridMesh) gridMesh.visible = false;

    // Floor children Z pozisyonlarını ters çevir
    if (floorGroup) {
      floorGroup.children.forEach((child) => {
        if (child.name !== 'BaseFloor' && child.name !== 'GridMesh') {
          savedStates.childrenZPositions.set(child, child.position.z);
          child.position.z = -child.position.z;
        }
      });
    }

    // Cleanup fonksiyonu
    return () => {
      // Controls ve grid'i geri yükle
      if (transformControl && savedStates.controlsVisible !== undefined) {
        transformControl.visible = savedStates.controlsVisible;
      }
      if (gridMesh && savedStates.gridVisible !== undefined) {
        gridMesh.visible = savedStates.gridVisible;
      }

      // Z pozisyonlarını geri yükle
      savedStates.childrenZPositions.forEach((z, child) => {
        child.position.z = z;
      });

      // Generated perimeter'ı temizle
      const generatedPerimeter = scene.getObjectByName('GeneratedPerimeterGroup');
      if (generatedPerimeter) {
        scene.remove(generatedPerimeter);
        
        // Memory cleanup
        generatedPerimeter.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            
            const material = mesh.material;
            if (Array.isArray(material)) {
              material.forEach(mat => disposeMaterial(mat));
            } else {
              disposeMaterial(material);
            }
          }
        });
      }
    };
  };

  /**
   * Material'i ve texture'larını dispose eder
   */
  const disposeMaterial = (material: THREE.Material) => {
    if (!material) return;
    
    const mat = material as any;
    Object.keys(mat).forEach(key => {
      const value = mat[key];
      if (value && typeof value === 'object' && 'minFilter' in value) {
        value.dispose();
      }
    });
    material.dispose();
  };

  /**
   * Export işlemini sıfırlar
   */
  const resetExport = () => {
    exportProgress.value = {
      status: 'idle',
      message: '',
      progress: 0
    };
  };

  return {
    exportProgress,
    isExporting,
    exportSceneToGLB,
    convertToUSDZ,
    startARView,
    resetExport,
    updateProgress
  };
}
