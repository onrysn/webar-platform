// src/modules/ar-scene/composables/useARExport.ts
// Queue-based export composable — job is queued on backend, status polled until complete.

import { ref, computed, onBeforeUnmount } from 'vue';
import { arSceneService } from '../../../services/arSceneService';
import type { SceneExportResponse } from '../dto/arScene.dto';

export type ExportStatus =
  | 'idle'
  | 'queued'
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

const POLL_INTERVAL = 1500; // 1.5 saniye
const POLL_TIMEOUT = 300000; // 5 dakika maksimum bekleme

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

  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  const updateProgress = (
    status: ExportStatus,
    message: string,
    progress: number,
  ) => {
    exportProgress.value = { status, message, progress };
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  };

  // Component unmount olduğunda polling'i durdur
  onBeforeUnmount(() => {
    stopPolling();
  });

  /**
   * Backend'e export işini kuyruğa ekletir, polling ile takip eder.
   * İş tamamlandığında SceneExportResponse döner.
   */
  const exportSceneFromBackend = async (
    token: string,
    options: {
      sceneName?: string;
      convertToUsdz?: boolean;
    } = {},
  ): Promise<SceneExportResponse> => {
    stopPolling();
    const convertToUsdz = options.convertToUsdz !== false;

    updateProgress('queued', 'Export kuyruğa ekleniyor...', 5);

    console.log(`📦 Backend export başlatılıyor (queue)...`);

    try {
      // 1. Job'ı kuyruğa ekle
      const { jobId } = await arSceneService.startExport(
        token,
        options.sceneName || 'scene',
        convertToUsdz,
      );

      console.log(`🔄 Job kuyruğa eklendi: ${jobId}`);
      updateProgress('queued', 'Kuyrukta bekleniyor...', 10);

      // 2. Polling ile durumu takip et
      const result = await pollJobStatus(jobId);

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
      stopPolling();
      const msg = err instanceof Error ? err.message : String(err);
      updateProgress('error', msg || 'Export başarısız oldu.', 0);
      throw err;
    }
  };

  /**
   * Job durumunu polling ile takip eder.
   * Tamamlanana veya hata olana kadar bekler.
   */
  const pollJobStatus = (jobId: string): Promise<SceneExportResponse> => {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Timeout kontrolü
          if (Date.now() - startTime > POLL_TIMEOUT) {
            reject(new Error('Export zaman aşımına uğradı. Lütfen tekrar deneyin.'));
            return;
          }

          const status = await arSceneService.getExportStatus(jobId);

          switch (status.status) {
            case 'queued':
              updateProgress('queued', status.progressMessage || 'Kuyrukta bekleniyor...', 10);
              break;
            case 'active': {
              const progress = Math.max(15, Math.min(95, status.progress || 15));
              const message = status.progressMessage || 'Sahne oluşturuluyor...';
              updateProgress('exporting', message, progress);
              break;
            }
            case 'completed':
              if (status.result) {
                resolve(status.result);
                return;
              }
              reject(new Error('Export sonucu alınamadı.'));
              return;
            case 'failed':
              reject(new Error(status.error || 'Export başarısız oldu.'));
              return;
          }

          // Devam et
          pollTimer = setTimeout(poll, POLL_INTERVAL);
        } catch (err) {
          reject(err);
        }
      };

      poll();
    });
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

  const resetExport = () => {
    stopPolling();
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
