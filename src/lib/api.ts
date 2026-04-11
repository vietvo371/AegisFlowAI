import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

/**
 * Cấu trúc chuẩn của API Response từ AegisFlow AI Backend
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  errors?: Record<string, string[]>;
}

/**
 * Khởi tạo Axios instance
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor: Tự động đính kèm Token và Ngôn ngữ
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    // Lấy token từ localStorage (hoặc cookie nếu dùng SSR)
    const token = localStorage.getItem('aegisflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Đính kèm ngôn ngữ hiện tại để Backend trả về thông báo tương ứng
    const locale = localStorage.getItem('aegisflow_locale') || 'vi';
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

/**
 * Response Interceptor: Xử lý thông báo và lỗi tập trung
 */
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const method = response.config.method?.toLowerCase();
    
    // Tự động hiển thị thông báo thành công cho các thao tác thay đổi dữ liệu
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      if (response.data?.success && response.data?.message) {
        toast.success(response.data.message);
      }
    }
    
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (!error.response) {
      toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.message || 'Đã xảy ra lỗi hệ thống.';

    switch (status) {
      case 401:
        // Chưa đăng nhập hoặc token hết hạn
        if (typeof window !== 'undefined') {
          localStorage.removeItem('aegisflow_token');
          // Không văng toast lỗi nếu đang ở trang chủ hoặc login để tránh spam
          if (!['/', '/login'].includes(window.location.pathname)) {
            toast.error(message);
            window.location.href = '/login';
          }
        }
        break;
      
      case 403:
        toast.error('Bạn không có quyền thực hiện thao tác này.');
        break;

      case 404:
        toast.error('Không tìm thấy tài nguyên yêu cầu.');
        break;

      case 422:
        // Lỗi validation dữ liệu (thường xử lý riêng tại Form, nhưng toast để user biết chung)
        toast.error(message);
        break;

      case 500:
        toast.error('Lỗi máy chủ hệ thống. Vui lòng thử lại sau.');
        break;

      default:
        toast.error(message);
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
