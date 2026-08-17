// src/services/applicationService.ts
import { apiClient } from '@/lib/api/ApiClient';

// LƯU Ý: apiClient.request() đã tự động parse res.json() và trả về
// TRỰC TIẾP body JSON, không phải axios response { data: ... }.
// Backend luôn trả { success: true, data }, nên chỉ cần đọc res.data
// (KHÔNG phải res.data.data như code cũ — bug này khiến addTag/addNote/
// updateStatus luôn nhận dữ liệu undefined, phải chờ onRefresh() mới lành).

export const applicationService = {
    // Lấy danh sách đơn của Shelter
    getShelterApplications: async (shelterId: string, status?: string) => {
        const res = await apiClient.get(`/applications/shelter/${shelterId}`, {
            params: { status },
        });
        return res.data;
    },

    // Thêm Ghi chú nội bộ
    addNote: async (applicationId: string, content: string) => {
        const res = await apiClient.post(`/applications/${applicationId}/notes`, {
            content,
        });
        return res.data;
    },

    // Gán Tag cho đơn
    addTag: async (applicationId: string, payload: { tagId?: string; name?: string }) => {
        const res = await apiClient.post(`/applications/${applicationId}/tags`, payload);
        return res.data;
    },

    // Gỡ Tag khỏi đơn
    removeTag: async (applicationId: string, tagId: string) => {
        const res = await apiClient.delete(
            `/applications/${applicationId}/tags/${tagId}`,
        );
        return res;
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
        return res.data;
    },

    // Đặt lịch hẹn phỏng vấn
    scheduleAppointment: async (applicationId: string, data: any) => {
        const res = await apiClient.post(
            `/applications/${applicationId}/appointments`,
            data,
        );
        return res.data;
    },

    // ==========================================
    // TÀI LIỆU BỔ SUNG (REQUIRED DOCUMENTS)
    // ==========================================

    // Lấy danh sách tài liệu của 1 đơn (dùng chung adopter/shelter)
    getApplicationDocuments: async (applicationId: string) => {
        const res = await apiClient.get(`/applications/${applicationId}/documents`);
        return res.data;
    },

    // Shelter yêu cầu bổ sung tài liệu (1 hoặc nhiều loại cùng lúc)
    requestDocuments: async (
        applicationId: string,
        documents: { key: string; label: string; description: string }[],
    ) => {
        const res = await apiClient.post(`/applications/${applicationId}/documents`, {
            documents,
        });
        return res.data;
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
        return res.data;
    },
    simulateSubmitDocument: async (applicationId: string, docId: string) => {
        const res = await apiClient.post(
            `/applications/${applicationId}/documents/${docId}/simulate-submit`,
        );
        return res.data;
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
        return res.data;
    },

    // Shelter gỡ 1 yêu cầu tài liệu
    removeDocument: async (applicationId: string, docId: string) => {
        const res = await apiClient.delete(
            `/applications/${applicationId}/documents/${docId}`,
        );
        return res;
    },
};