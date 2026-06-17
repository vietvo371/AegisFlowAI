'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useFcmToken } from '@/hooks/useFcmToken';
import {
  clearPortalToken,
  getPortalForPath,
  getPortalForRole,
  migrateLegacyToken,
  PORTAL_SIGNIN_PATH,
  setPortalToken,
} from '@/lib/auth-sessions';

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

type RawUser = Partial<User> & {
  roles?: string[];
  status?: User['status'];
};

type ApiError = {
  name?: string;
  code?: string;
};

/**
 * Hàm chuẩn hóa dữ liệu người dùng từ Backend sang định dạng Frontend mong đợi
 */
const normalizeUser = (data: RawUser): User => {
  
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
  } as User;
};

/**
 * Các hàm và trạng thái cung cấp bởi AuthContext
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: unknown) => Promise<void>;
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
  const pathname = usePathname();
  const portal = getPortalForPath(pathname);

  // Khởi tạo Auth khi ứng dụng được tải
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const token = migrateLegacyToken(portal);
      
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            // /auth/me trả về data trực tiếp là UserResource, không phải data.user
            const userData = res.data.data?.user ?? res.data.data;
            setUser(normalizeUser(userData));
          } else {
            throw new Error('Không thể tải thông tin người dùng');
          }
        } catch (error: unknown) {
          // Ignore abort errors (user navigated away)
          if ((error as ApiError)?.name === 'AbortError' || (error as ApiError)?.code === 'ERR_CANCELED') {
            return;
          }
          console.error('Auth initialization error:', error);
          clearPortalToken(portal);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [portal]);

  /**
   * Đăng nhập người dùng
   */
  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        const normalizedUser = normalizeUser(userData);
        setPortalToken(getPortalForRole(normalizedUser.role), token);
        if (!portal || getPortalForRole(normalizedUser.role) === portal) {
          setUser(normalizedUser);
        }
      }
    } catch (error) {
      // Lỗi đã được xử lý bởi interceptor trong api.ts (hiển thị toast)
      throw error;
    }
  };

  /**
   * Đăng ký người dùng mới
   */
  const register = async (data: unknown) => {
    try {
      const res = await api.post('/auth/register', data);
      
      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        const normalizedUser = normalizeUser(userData);
        setPortalToken(getPortalForRole(normalizedUser.role), token);
        if (!portal || getPortalForRole(normalizedUser.role) === portal) {
          setUser(normalizedUser);
        }
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
      clearPortalToken(portal);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = portal ? PORTAL_SIGNIN_PATH[portal] : '/signin';
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
        const userData = res.data.data?.user ?? res.data.data;
        setUser(normalizeUser(userData));
      }
    } catch (error: unknown) {
      // Ignore abort errors (user navigated away)
      if ((error as ApiError)?.name === 'AbortError' || (error as ApiError)?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Refresh user error:', error);
    }
  };

  // Register FCM token after user logs in
  useFcmToken(!!user);

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
