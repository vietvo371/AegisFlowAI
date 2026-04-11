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
  avatar_url?: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
}

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
            setUser(res.data.data.user);
          } else {
            throw new Error('Không thể tải thông tin người dùng');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('aegisflow_token');
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
        setUser(userData);
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
        setUser(userData);
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
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
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
        setUser(res.data.data.user);
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
