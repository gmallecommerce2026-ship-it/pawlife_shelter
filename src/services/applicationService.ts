// src/services/applicationService.ts
import { apiClient } from '@/lib/api/ApiClient';

export const applicationService = {
    // Lấy danh sách đơn của Shelter
    getShelterApplications: async (shelterId: string, status?: string) => {
        const res = await apiClient.get(`/applications/shelter/${shelterId}`, {
            params: { status },
        });
        return res.data.data;
    },

    // Thêm Ghi chú nội bộ
    addNote: async (applicationId: string, content: string) => {
        const res = await apiClient.post(`/applications/${applicationId}/notes`, {
            content,
        });
        return res.data.data;
    },

    // Gán Tag cho đơn
    addTag: async (applicationId: string, payload: { tagId?: string; name?: string }) => {
        const res = await apiClient.post(`/applications/${applicationId}/tags`, payload);
        return res.data.data;
    },

    // Gỡ Tag khỏi đơn
    removeTag: async (applicationId: string, tagId: string) => {
        const res = await apiClient.delete(
            `/applications/${applicationId}/tags/${tagId}`,
        );
        return res.data;
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
        return res.data.data;
    },

    // Đặt lịch hẹn phỏng vấn
    scheduleAppointment: async (applicationId: string, data: any) => {
        const res = await apiClient.post(
            `/applications/${applicationId}/appointments`,
            data,
        );
        return res.data.data;
    },
};