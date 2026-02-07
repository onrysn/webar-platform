// src/modules/ar-scene/composables/useARExport.ts
// Simplified composable — all GLB export is done on the backend.
// Frontend only calls the API and uses returned URLs.

import { ref, computed } from 'vue';
import { arSceneService } from '../../../services/arSceneService';
import type { SceneExportResponse } from '../dto/arScene.dto';

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

export function useARExport() {
  const exportProgress = ref<ExportProgress>({
    status: 'idle',
    message: '',
    progress: 0,
  });

  const isExporting = computed(
    () =>
      exportProgress.value.status !== 'idle' &&
      exportProgress.value.status !== 'ready' &&
      exportProgress.value.status !== 'error',
  );

  const updateProgress = (
    status: ExportStatus,
    message: string,
    progress: number,
  ) => {
    exportProgress.value = { status, message, progress };
  };

  /**
   * Backend'den sahneyi export etmesini ister.
   * Backend Three.js ile sahneyi sıfırdan GLB olarak oluşturur, opsiyonel USDZ dönüşümü yapar.
   * Mobil cihazlardaki export yükünü tamamen sunucuya alır.
   */
  const exportSceneFromBackend = async (
    token: string,
    options: {
      sceneName?: string;
      convertToUsdz?: boolean;
    } = {},
  ): Promise<SceneExportResponse> => {
    updateProgress('preparing', 'Sahne hazırlanıyor...', 10);

    const convertToUsdz = options.convertToUsdz !== false;

    console.log(`📦 Backend export başlatılıyor...`);

    try {
      updateProgress('exporting', 'Sunucu tarafında sahne oluşturuluyor...', 30);

      // Backend'e export isteği gönder (tüm iş sunucuda yapılır)
      const result = await arSceneService.exportSceneForAR(
        token,
        options.sceneName || 'scene',
        convertToUsdz,
      );

      updateProgress('ready', 'Export tamamlandı!', 100);

      console.log(`✅ Export tamamlandı!`);
      if (result.glb) {
        console.log(`  GLB: ${result.glb.sizeFormatted} - ${result.glb.url}`);
      }
      if (result.usdz) {
        console.log(`  USDZ: ${result.usdz.sizeFormatted} - ${result.usdz.url}`);
      }

      return result;
    } catch (err) {
      updateProgress('error', 'Export başarısız oldu.', 0);
      throw err;
    }
  };

  /**
   * AR görüntülemeyi başlatır - URL tabanlı
   * iOS: AR Quick Look (USDZ URL)
   * Android: Google Scene Viewer (GLB URL)
   */
  const startARView = async (
    exportResult: SceneExportResponse,
  ): Promise<void> => {
    const isIOS =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (!isIOS && !isAndroid) {
      throw new Error('AR yalnızca mobil cihazlarda desteklenir');
    }

    if (isIOS) {
      if (!exportResult.usdz?.url) {
        throw new Error('USDZ dosyası hazırlanmamış');
      }
      const usdzFullUrl = arSceneService.getExportFileUrl(
        exportResult.usdz.url,
      );
      openARQuickLook(usdzFullUrl, exportResult.sceneName || 'scene');
    } else {
      if (!exportResult.glb?.url) {
        throw new Error('GLB dosyası hazırlanmamış');
      }
      const glbFullUrl = arSceneService.getExportFileUrl(
        exportResult.glb.url,
      );
      openGoogleSceneViewer(glbFullUrl, exportResult.sceneName || 'scene');
    }
  };

  /**
   * iOS AR Quick Look'u USDZ URL ile açar
   */
  const openARQuickLook = (usdzUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.setAttribute('rel', 'ar');
    link.href = usdzUrl;
    link.download = `${fileName}.usdz`;

    document.body.appendChild(link);

    // AR Quick Look <a rel="ar"> linki için img child gerekli
    const img = document.createElement('img');
    link.appendChild(img);

    link.click();
    document.body.removeChild(link);
  };

  /**
   * Android Google Scene Viewer ile GLB'yi AR olarak gösterir
   */
  const openGoogleSceneViewer = (glbUrl: string, fileName: string) => {
    const encodedUrl = encodeURIComponent(glbUrl);
    const encodedTitle = encodeURIComponent(fileName);

    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodedUrl}&mode=ar_preferred&title=${encodedTitle}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodedUrl};end;`;

    const link = document.createElement('a');
    link.href = intentUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export işlemini sıfırlar
   */
  const resetExport = () => {
    exportProgress.value = {
      status: 'idle',
      message: '',
      progress: 0,
    };
  };

  return {
    exportProgress,
    isExporting,
    exportSceneFromBackend,
    startARView,
    resetExport,
    updateProgress,
  };
}
