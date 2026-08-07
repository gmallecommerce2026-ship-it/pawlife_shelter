// src/constants/petStatus.ts
import { PetStatus } from '@/types/pet';

export interface PetStatusMeta {
  bg: string;
  border: string;
  color: string;
  label: string;
}

// ⚠️ Đây là NGUỒN DUY NHẤT định nghĩa trạng thái Pet.
// Muốn thêm/sửa/xoá trạng thái -> chỉ sửa ở đây, mọi nơi khác tự động đồng bộ.
export const PET_STATUS_CONFIG: Record<PetStatus, PetStatusMeta> = {
  AVAILABLE: { bg: '#DEFFDF', border: '#00AC47', color: '#00AC47', label: 'Chờ nhận nuôi' },
  PENDING: { bg: '#FFF8E5', border: '#FFBA00', color: '#FFBA00', label: 'Đang xét duyệt' },
  REJECTED: { bg: '#FFE2E2', border: '#9F0712', color: '#9F0712', label: 'Không đủ điều kiện' },
  HEALTH_ISSUE: { bg: '#FFEDD4', border: '#A13A17', color: '#A13A17', label: 'Vấn đề sức khoẻ' },
  ADOPTED: { bg: '#F0F0F0', border: '#BDBDBD', color: '#757575', label: 'Đã nhận nuôi' },
};

export const PET_STATUS_DEFAULT: PetStatusMeta = {
  bg: '#F5F5F5', border: '#D1D5DB', color: '#8E8E93', label: 'Không rõ',
};

// Thứ tự hiển thị trong dropdown / filter
export const PET_STATUS_ORDER: PetStatus[] = [
  'AVAILABLE',
  'PENDING',
  'HEALTH_ISSUE',
  'REJECTED',
  'ADOPTED',
];

export const getPetStatusMeta = (status?: string | null): PetStatusMeta =>
  (status && PET_STATUS_CONFIG[status as PetStatus]) || PET_STATUS_DEFAULT;