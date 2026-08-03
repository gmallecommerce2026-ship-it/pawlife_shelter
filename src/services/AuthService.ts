// src/services/AuthService.ts
import { apiClient } from '@/lib/api/ApiClient'; // Giữ nguyên import này của bạn
import { useUserStore } from '@/store/useUserStore';

// Định nghĩa kiểu dữ liệu gửi đi
interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const AuthService = {
  // 1. GỌI API ĐĂNG KÝ (Tạo user + Gửi OTP)
  async register(data: RegisterData) {
    // API này sẽ trả về message thành công và kích hoạt gửi mail bên server
    return apiClient.post('/auth/register', data);
  },

  // 2. Gửi lại OTP (Chỉ dùng khi user bấm nút "Gửi lại mã")
  async sendOtp(email: string) {
    return apiClient.post('/auth/send-otp', { email });
  },
  // thêm vào AuthService, giữ nguyên các hàm cũ
  async registerShelter(payload: {
    email: string;
    password: string;
    name: string;
    phone: string;
    address: string;
    lat?: number;
    lng?: number;
  }) {
    const res = await apiClient.post<{ accessToken?: string; message: string; user: any }>(
      '/auth/register-shelter-direct',
      payload,
    );
    // apiClient.post trả thẳng JSON body, KHÔNG có field "data" bọc ngoài như axios
    if (res?.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('token', res.accessToken);
    }
    return res;
  },
  // 3. Xác thực OTP -> Login
  async verifyOtp(email: string, otp: string) {
    const res = await apiClient.post('/auth/verify-otp', { email, otp });

    if (res?.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.access_token);
        document.cookie = `token=${res.access_token}; path=/; max-age=86400;`;
      }
      useUserStore.getState().setUser(res.user);
      return res.user;
    }
    throw new Error('Xác thực thất bại');
  },
  async login(email: string, password: string) {
    const res = await apiClient.post('/auth/login', { email, password });

    // SỬA Ở ĐÂY: access_token -> accessToken
    if (res?.accessToken) {
      if (typeof window !== 'undefined') {
        // Lưu đồng thời 2 key để ApiClient và axiosClient đều đọc được
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('accessToken', res.accessToken);
      }
      useUserStore.getState().setUser(res.user);
      return res;
    }
    throw new Error('Đăng nhập thất bại');
  },
  // ... (Các hàm getMe, logout giữ nguyên)
  async getMe() {
    try {
      const user = await apiClient.get('/auth/me');
      if (user) {
        useUserStore.getState().setUser(user);
        return user;
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
      this.logout();
    }
    return null;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; max-age=0;';
    }
    useUserStore.getState().logout();
    window.location.href = '/login';
  }
};