import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useToast } from "vue-toastification";
import router from "../../router";

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 600000,
});

// REQUEST INTERCEPTOR
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const toast = useToast();
    
    // Hata detaylarını al
    const status = error.response?.status;
    const message = error.response?.data?.message || "Beklenmedik bir hata oluştu.";

    // --- SENARYO 1: ŞİRKET/ABONELİK KISITLAMASI (GUARD 403) ---
    if (status === 403) {
      // Backend'den gelen spesifik mesajları kontrol et
      if (message.includes('askıya alınmıştır') || message.includes('abonelik süresi')) {
        
        // Sonsuz döngüyü engelle: Zaten o sayfadaysak tekrar yönlendirme yapma
        if (router.currentRoute.value.name !== 'SubscriptionLocked') {
          
          // Toast göstermek yerine direkt sayfaya yönlendiriyoruz.
          // router.replace kullanıyoruz ki "Geri" tuşuna basınca tekrar hatalı sayfaya dönmesin.
          router.replace({ 
            name: 'SubscriptionLocked', 
            query: { reason: message } // Hata mesajını sayfaya taşı
          });
        }

        // Promise'i reject etmeye devam et (Loading state'leri kapatmak için)
        return Promise.reject(error);
      }
    }

    // --- SENARYO 2: OTURUM DÜŞMESİ (401) ---
    if (status === 401) {
      console.warn("Yetkisiz erişim - oturum sonlandırılıyor.");
      
      // Kullanıcı neden atıldığını bilsin
      toast.error("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");

      localStorage.removeItem("token");
      
      // router.push ile Login sayfasına at
      // (Not: Sayfayı tamamen yenilemek istersen window.location.href kalabilir)
      setTimeout(() => {
        router.push('/login'); 
      }, 1000);
    }

    // Diğer tüm hatalar için (400, 404, 500 vb.) hatayı fırlat
    // Böylece bileşenler kendi içlerinde (catch bloğunda) loading'i kapatabilir.
    return Promise.reject(error);
  }
);

export default http;