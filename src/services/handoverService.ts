// services/handoverService.ts
// Web shelter: nhập mã 6 ký tự adopter đọc (sau khi chạm thẻ NFC trên app) để hoàn tất bàn giao.
import { apiClient } from '@/lib/api/ApiClient';

export const confirmHandoverCode = (code: string) =>
  apiClient.post('/handovers/shelter/confirm', { code }) as unknown as Promise<{ success: boolean; petId: string }>;
