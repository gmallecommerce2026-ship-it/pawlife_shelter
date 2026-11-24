// services/handoverService.ts
// Web shelter: nhập mã 6 ký tự adopter đọc (sau khi chạm thẻ NFC trên app) để hoàn tất bàn giao,
// hoặc gửi lại yêu cầu nhận hồ sơ (kèm QR / NFC) cho adopter khi đơn đã ở cột Hoàn thành.
import { apiClient } from '@/lib/api/ApiClient';

export type HandoverMethodsInput = { qr: boolean; nfc: boolean };

export const confirmHandoverCode = (code: string) =>
  apiClient.post('/handovers/shelter/confirm', { code }) as unknown as Promise<{ success: boolean; petId: string }>;

/** Thu hồi pet từ đơn ở cột Bàn giao: trả pet về trạng thái trước đó và chuyển đơn sang cột đích */
export const recallApplicationPet = (applicationId: string, status: string, reviewNote?: string) =>
  apiClient.post(`/shelter-dashboard/applications/${applicationId}/recall`, { status, reviewNote }) as unknown as Promise<{
    success: boolean;
    status: string;
  }>;

export const resendHandoverRequest = (applicationId: string, handoverMethods: HandoverMethodsInput) =>
  apiClient.post(`/shelter-dashboard/applications/${applicationId}/handover/resend`, { handoverMethods }) as unknown as Promise<{
    success: boolean;
    handoverId: string;
  }>;
