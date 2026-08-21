// src/services/applicationService.ts
import { apiClient } from '@/lib/api/ApiClient';

// LƯU Ý: apiClient.request() đã tự động parse res.json() và trả về
// TRỰC TIẾP body JSON, không phải axios response { data: ... }.
// Backend luôn trả { success: true, data }, nên res CHÍNH LÀ { success, data }
// => chỉ cần đọc res.data một lớp duy nhất, KHÔNG BAO GIỜ res.data.data.
const unwrapList = <T = any>(res: any): T[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data; // phòng hờ nếu 1 endpoint nào đó lỡ bọc thêm lớp
  return [];
};

const unwrapItem = <T = any>(res: any): T => {
  if (res?.data !== undefined) return res.data;
  return res;
};

export const applicationService = {
  // Lấy danh sách đơn của Shelter
  getShelterApplications: async (shelterId: string, status?: string) => {
    const res = await apiClient.get(`/applications/shelter/${shelterId}`, {
      params: { status },
    });
    return unwrapList(res);
  },

  // Thêm Ghi chú nội bộ
  addNote: async (applicationId: string, content: string) => {
    const res = await apiClient.post(`/applications/${applicationId}/notes`, {
      content,
    });
    return unwrapItem(res);
  },

  // Gán Tag cho đơn
  addTag: async (applicationId: string, payload: { tagId?: string; name?: string }) => {
    const res = await apiClient.post(`/applications/${applicationId}/tags`, payload);
    return unwrapItem(res);
  },

  // Gỡ Tag khỏi đơn
  removeTag: async (applicationId: string, tagId: string) => {
    const res = await apiClient.delete(`/applications/${applicationId}/tags/${tagId}`);
    return unwrapItem(res);
  },

  // Cập nhật trạng thái đơn (Duyệt, Từ chối, Yêu cầu bổ sung)
  updateStatus: async (
    applicationId: string,
    status: string,
    rejectionReason?: string,
  ) => {
    const res = await apiClient.patch(`/applications/${applicationId}/status`, {
      status,
      rejectionReason,
    });
    return unwrapItem(res);
  },

  // Đặt lịch hẹn phỏng vấn
  scheduleAppointment: async (applicationId: string, dto: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/appointments`, dto);
    return unwrapItem(res); // hoặc return res.data;
  },

  // ==========================================
  // TÀI LIỆU BỔ SUNG (REQUIRED DOCUMENTS)
  // ==========================================

  // Lấy danh sách tài liệu của 1 đơn (dùng chung adopter/shelter).
  // Gộp chung getApplicationDocuments + getDocuments cũ (2 hàm trùng nhau) thành 1.
  getDocuments: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/documents`);
    return unwrapList(res); // FIX: trước đây res.data.data -> luôn undefined
  },

  // Shelter yêu cầu bổ sung tài liệu (1 hoặc nhiều loại cùng lúc)
  requestDocuments: async (
    applicationId: string,
    documents: { key: string; label: string; description: string }[],
  ) => {
    const res = await apiClient.post(`/applications/${applicationId}/documents`, {
      documents,
    });
    return unwrapList(res); // trả về mảng ApplicationDocument vừa tạo
  },

  // Applicant nộp tài liệu (chỉ chủ đơn mới gọi được — backend check userId)
  submitDocument: async (
    applicationId: string,
    docId: string,
    payload: { fileUrl: string; fileName?: string; fileSizeLabel?: string },
  ) => {
    const res = await apiClient.post(
      `/applications/${applicationId}/documents/${docId}/submit`,
      payload,
    );
    return unwrapItem(res);
  },

  // Shelter duyệt (accept/reject) 1 tài liệu đã nộp
  reviewDocument: async (
    applicationId: string,
    docId: string,
    payload: { status: 'ACCEPTED' | 'REJECTED'; reason?: string },
  ) => {
    const res = await apiClient.patch(
      `/applications/${applicationId}/documents/${docId}/review`,
      payload,
    );
    return unwrapItem(res);
  },

  // Shelter gỡ 1 yêu cầu tài liệu (chỉ khi status vẫn PENDING_SUBMISSION)
  removeDocument: async (applicationId: string, docId: string) => {
    const res = await apiClient.delete(`/applications/${applicationId}/documents/${docId}`);
    return unwrapItem(res);
  },
};