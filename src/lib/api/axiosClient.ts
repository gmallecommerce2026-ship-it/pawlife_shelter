// src/api/axiosClient.ts (hoặc lib/axiosClient.ts — tuỳ cấu trúc thư mục web đang dùng)
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // VD: https://api.pawlife.vn
  withCredentials: true, // 🔑 QUAN TRỌNG: BE của bạn đọc accessToken từ cookie
                          // (xem extractJwtFromCookie trong jwt.strategy.ts) — nếu
                          // web KHÔNG dùng cookie mà dùng Bearer token trong localStorage,
                          // bỏ dòng này và dùng interceptor Authorization header thay thế.
});

// Nếu web lưu accessToken riêng (không dùng cookie như mobile), thêm interceptor:
axiosClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động logout khi token hết hạn / session bị revoke (401 từ jwt.strategy.ts)
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: điều hướng về /login, xoá token lưu trữ...
    }
    return Promise.reject(error);
  },
);

export default axiosClient;