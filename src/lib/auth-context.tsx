'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

/**
 * Interface cho đối tượng Người dùng (User)
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;       // Map từ BE
  avatar_url?: string;   // BE có thể trả về avatar
  roles?: string[];      // BE trả về mảng roles
  role: string;          // FE sử dụng chuỗi đơn
  permissions: string[];
  is_active?: boolean;   // BE trả về boolean
  status: 'active' | 'inactive' | 'suspended';
}

/**
 * Hàm chuẩn hóa dữ liệu người dùng từ Backend sang định dạng Frontend mong đợi
 */
const normalizeUser = (data: any): User => {
  if (!data) return data;
  
  return {
    ...data,
    // Ưu tiên avatar từ BE map vào avatar_url
    avatar_url: data.avatar || data.avatar_url,
    // Ưu tiên lấy role đầu tiên từ mảng roles của BE
    role: data.role || data.roles?.[0] || 'citizen',
    // Map is_active sang status
    status: data.status || (data.is_active ? 'active' : 'inactive'),
    // Đảm bảo permissions luôn là mảng
    permissions: data.permissions || [],
  };
};

/**
 * Các hàm và trạng thái cung cấp bởi AuthContext
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider: Bao bọc ứng dụng để cung cấp trạng thái xác thực
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo Auth khi ứng dụng được tải
  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aegisflow_token') : null;
      
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(normalizeUser(res.data.data.user));
          } else {
            throw new Error('Không thể tải thông tin người dùng');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('aegisflow_token');
          document.cookie = 'aegisflow_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Đăng nhập người dùng
   */
  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        localStorage.setItem('aegisflow_token', token);
        document.cookie = `aegisflow_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        setUser(normalizeUser(userData));
      }
    } catch (error) {
      // Lỗi đã được xử lý bởi interceptor trong api.ts (hiển thị toast)
      throw error;
    }
  };

  /**
   * Đăng ký người dùng mới
   */
  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      
      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        localStorage.setItem('aegisflow_token', token);
        document.cookie = `aegisflow_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        setUser(normalizeUser(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Đăng xuất
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('aegisflow_token');
      document.cookie = 'aegisflow_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
  };

  /**
   * Làm mới dữ liệu người dùng
   */
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(normalizeUser(res.data.data.user));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook tùy chỉnh để sử dụng AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
