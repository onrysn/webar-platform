// ChunkUploader.ts
import { ref, computed } from 'vue';
import { apiService } from '../services/httpService/apiService';
import SparkMD5 from 'spark-md5';

export interface ChunkUploaderOptions {
  file: File;
  fileType: 'glb' | 'usdz' | 'fbx' | 'step';
  chunkSize?: number; // Default: 5MB
  tempId?: string;
  companyId?: number;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface ChunkUploaderState {
  uploadId: string | null;
  status: 'idle' | 'preparing' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';
  progress: number;
  uploadedChunks: number[];
  totalChunks: number;
  error: string | null;
  canResume: boolean;
}

export class ChunkUploader {
  private file: File;
  private fileType: 'glb' | 'usdz' | 'fbx' | 'step';
  private chunkSize: number;
  private tempId?: string;
  private companyId?: number;
  private onProgressCallback?: (progress: number) => void;
  private onChunkCompleteCallback?: (chunkIndex: number, totalChunks: number) => void;
  private onCompleteCallback?: (result: any) => void;
  private onErrorCallback?: (error: Error) => void;

  public state = ref<ChunkUploaderState>({
    uploadId: null,
    status: 'idle',
    progress: 0,
    uploadedChunks: [],
    totalChunks: 0,
    error: null,
    canResume: false
  });

  private abortController: AbortController | null = null;
  private isPaused = false;
  private fileHash: string | null = null;

  constructor(options: ChunkUploaderOptions) {
    this.file = options.file;
    this.fileType = options.fileType;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB default
    this.tempId = options.tempId;
    this.companyId = options.companyId;
    this.onProgressCallback = options.onProgress;
    this.onChunkCompleteCallback = options.onChunkComplete;
    this.onCompleteCallback = options.onComplete;
    this.onErrorCallback = options.onError;

    this.state.value.totalChunks = Math.ceil(this.file.size / this.chunkSize);
  }

  /**
   * Dosya hash'ini hesapla (MD5)
   */
  private async calculateFileHash(): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      const chunks = Math.ceil(this.file.size / this.chunkSize);
      let currentChunk = 0;

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
          currentChunk++;

          if (currentChunk < chunks) {
            loadNext();
          } else {
            resolve(spark.end());
          }
        }
      };

      fileReader.onerror = () => reject(new Error('Hash hesaplama hatası'));

      const loadNext = () => {
        const start = currentChunk * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        fileReader.readAsArrayBuffer(this.file.slice(start, end));
      };

      loadNext();
    });
  }

  /**
   * Chunk hash'ini hesapla (MD5)
   */
  private async calculateChunkHash(chunk: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
          resolve(spark.end());
        }
      };

      reader.onerror = () => reject(new Error('Chunk hash hesaplama hatası'));
      reader.readAsArrayBuffer(chunk);
    });
  }

  /**
   * Upload başlat
   */
  async start(): Promise<void> {
    try {
      this.state.value.status = 'preparing';
      this.state.value.error = null;
      this.isPaused = false;

      // Dosya hash'ini hesapla
      this.fileHash = await this.calculateFileHash();

      // Upload session başlat
      const initResponse = await apiService.post('/ar-model/initiate-chunked-upload', {
        fileName: this.file.name,
        fileSize: this.file.size,
        fileType: this.fileType,
        chunkSize: this.chunkSize,
        totalChunks: this.state.value.totalChunks,
        fileHash: this.fileHash,
        tempId: this.tempId,
        companyId: this.companyId
      });

      this.state.value.uploadId = initResponse.data.uploadId;
      this.state.value.status = 'uploading';

      // Chunk'ları yükle
      await this.uploadChunks();

    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Devam ettir (resume)
   */
  async resume(uploadId?: string): Promise<void> {
    try {
      if (uploadId) {
        this.state.value.uploadId = uploadId;
      }

      if (!this.state.value.uploadId) {
        throw new Error('Upload ID bulunamadı');
      }

      this.state.value.status = 'preparing';
      this.state.value.error = null;
      this.isPaused = false;

      // Mevcut durumu al
      const statusResponse = await apiService.get(
        `/ar-model/chunked-upload-status/${this.state.value.uploadId}`
      );

      this.state.value.uploadedChunks = statusResponse.data.uploadedChunks;
      this.state.value.progress = statusResponse.data.progress;
      this.state.value.status = 'uploading';

      // Kalan chunk'ları yükle
      await this.uploadChunks();

    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Chunk'ları yükle
   */
  private async uploadChunks(): Promise<void> {
    this.abortController = new AbortController();

    for (let i = 0; i < this.state.value.totalChunks; i++) {
      if (this.isPaused) {
        this.state.value.status = 'paused';
        return;
      }

      // Zaten yüklenmiş chunk'ları atla
      if (this.state.value.uploadedChunks.includes(i)) {
        continue;
      }

      try {
        await this.uploadChunk(i);
      } catch (error: any) {
        if (error.message === 'PAUSED') {
          this.state.value.status = 'paused';
          return;
        }
        throw error;
      }
    }

    // Tüm chunk'lar yüklendi, complete çağır
    await this.complete();
  }

  /**
   * Tek bir chunk yükle
   */
  private async uploadChunk(chunkIndex: number): Promise<void> {
    if (this.isPaused) {
      throw new Error('PAUSED');
    }

    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);

    // Chunk hash hesapla
    const chunkHash = await this.calculateChunkHash(chunk);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', this.state.value.uploadId!);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunkHash', chunkHash);

    try {
      await apiService.post('/ar-model/upload-chunk', formData, {
        signal: this.abortController?.signal,
        onUploadProgress: (progressEvent) => {
          // Chunk içindeki progress'i hesaba katarak genel progress güncelle
          const chunkProgress = progressEvent.loaded / (progressEvent.total || chunk.size);
          const baseProgress = (this.state.value.uploadedChunks.length / this.state.value.totalChunks) * 100;
          const currentChunkContribution = (chunkProgress / this.state.value.totalChunks) * 100;
          const totalProgress = Math.min(baseProgress + currentChunkContribution, 100);

          this.state.value.progress = Math.round(totalProgress * 100) / 100;
          this.onProgressCallback?.(this.state.value.progress);
        }
      });

      // Chunk başarıyla yüklendi
      this.state.value.uploadedChunks.push(chunkIndex);
      this.onChunkCompleteCallback?.(chunkIndex, this.state.value.totalChunks);
    } catch (error: any) {
      // Abort signal kontrolü
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || this.isPaused) {
        throw new Error('PAUSED');
      }
      throw error;
    }
  }

  /**
   * Upload tamamla
   */
  private async complete(): Promise<void> {
    if (!this.state.value.uploadId) {
      throw new Error('Upload ID bulunamadı');
    }

    const response = await apiService.post('/ar-model/complete-chunked-upload', {
      uploadId: this.state.value.uploadId,
      fileHash: this.fileHash
    });

    this.state.value.status = 'completed';
    this.state.value.progress = 100;
    this.onProgressCallback?.(100);
    this.onCompleteCallback?.(response.data);
  }

  /**
   * Upload duraklat
   */
  pause(): void {
    this.isPaused = true;
    this.abortController?.abort();
    this.state.value.status = 'paused';
    this.state.value.canResume = true;
  }

  /**
   * Upload iptal et
   */
  async cancel(): Promise<void> {
    try {
      this.isPaused = true;
      this.abortController?.abort();

      if (this.state.value.uploadId) {
        await apiService.post(`/ar-model/cancel-chunked-upload/${this.state.value.uploadId}`);
      }

      this.state.value.status = 'cancelled';
      this.state.value.canResume = false;
    } catch (error: any) {
      console.error('Cancel error:', error);
    }
  }

  /**
   * Hata yönetimi
   */
  private handleError(error: any): void {
    // Pause durumunda hata verme (normal akış)
    if (error.message === 'PAUSED' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      // Bu normal bir pause işlemi, hata olarak işaretleme
      return;
    }

    const message = error.response?.data?.message || error.message || 'Upload hatası';
    this.state.value.status = 'error';
    this.state.value.error = message;
    this.onErrorCallback?.(new Error(message));
  }

  /**
   * Computed properties
   */
  get isUploading() {
    return computed(() => this.state.value.status === 'uploading');
  }

  get isPausedState() {
    return computed(() => this.state.value.status === 'paused');
  }

  get isCompleted() {
    return computed(() => this.state.value.status === 'completed');
  }

  get hasError() {
    return computed(() => this.state.value.status === 'error');
  }
}
