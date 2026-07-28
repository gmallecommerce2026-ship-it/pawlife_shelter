// src/lib/api/ApiClient.ts

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(baseUrl: string, getToken: () => string | null) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  private normalizeUrl(path: string): string {
    const cleanBase = this.baseUrl.replace(/\/+$/, ''); // Bỏ dấu / ở cuối base
    const cleanPath = path.replace(/^\/+/, ''); // Bỏ dấu / ở đầu path
    return `${cleanBase}/${cleanPath}`;
  }

  private async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const fullUrl = this.normalizeUrl(path);
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    // Log dev mode để debug dễ hơn
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [API] ${options.method || 'GET'} ${fullUrl}`);
    }

    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers as any,
    };



    // [FIX QUAN TRỌNG] Tự động đính kèm Token nếu có
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // 2. Xử lý lỗi từ Backend (4xx, 5xx)
      if (!res.ok) {
        let errorMessage = `API Error: ${res.status} (${res.statusText})`;
        try {
          // Cố gắng đọc message JSON từ server trả về
          const errorBody = await res.json();
          // Ưu tiên hiển thị message từ backend
          errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody);
        } catch (e) {
          // Nếu không phải JSON (vd: lỗi 500 trang HTML), giữ nguyên text mặc định
        }
        throw new Error(errorMessage);
      }

      // 3. Xử lý Data trả về (Tự động Parse JSON)

      // Nếu là 204 No Content -> trả về null
      if (res.status === 204) return null as T;

      // Kiểm tra Content-Type để parse cho đúng
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json() as T;
      }

      // Trường hợp hiếm: Text hoặc Blob (nếu không phải JSON)
      // Trả về text để tránh crash
      // Lưu ý: Nếu các module cũ đang mong đợi đối tượng "Response" gốc, 
      // đoạn này sẽ trả về string -> Có thể cần điều chỉnh module gọi.
      // Tuy nhiên, đa số logic React (như useCartStore) đều cần data JSON.
      return await res.text() as unknown as T;

    } catch (error) {
      console.error(`❌ [API Error] ${fullUrl}:`, error);
      throw error;
    }
  }

  // --- CÁC METHOD (Thêm Generics <T> để gợi ý code tốt hơn) ---

  get<T = any>(path: string, options: RequestInit & { params?: Record<string, any> } = {}) {
    let url = path;

    if (options.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
      delete options.params;
    }

    return this.request<T>(url, { ...options, method: 'GET' });
  }

  post<T = any>(path: string, body?: any) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, { method: 'POST', body: isFormData ? body : JSON.stringify(body) });
  }

  put<T = any>(path: string, body?: any) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, { method: 'PUT', body: isFormData ? body : JSON.stringify(body) });
  }

  patch<T = any>(path: string, body?: any) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, { method: 'PATCH', body: isFormData ? body : JSON.stringify(body) });
  }

  delete<T = any>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Giữ nguyên logic sendBeacon vì nó hoạt động độc lập
  sendBeacon(path: string, body: any, customHeaders: Record<string, string> = {}) {
    const fullUrl = this.normalizeUrl(path);
    const token = this.getToken();

    const headers: any = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // [FIX] Thay đổi điều kiện kiểm tra để TypeScript không báo lỗi
    // Cũ: if (typeof navigator !== 'undefined' && navigator.sendBeacon)
    // Mới: Kiểm tra kỹ xem nó có phải là function không
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // Tạo Blob để đảm bảo headers content-type chính xác khi dùng beacon
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

      // sendBeacon trả về true nếu push vào queue thành công
      const success = navigator.sendBeacon(fullUrl, blob);
      if (success) return; // Nếu gửi thành công thì dừng, không cần fallback
    }

    // Fallback: Nếu không có sendBeacon hoặc gửi thất bại, dùng fetch bình thường
    fetch(fullUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      keepalive: true,
    }).catch((err) => console.warn('Tracking error:', err));
  }
}

export const apiClient = new ApiClient(
  // Ưu tiên biến môi trường, fallback về localhost
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
);