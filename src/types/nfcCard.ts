// Shape khớp GET /nfc/shelter/tags (backend: nfc-shelter.service.ts).
// Thẻ có id nội bộ (dùng cho API). KHÔNG có UID chip trên FE.
export type NfcCardState = 'ACTIVE' | 'DISABLED' | 'UNASSIGNED';
export type NfcCardPetStatus = 'AVAILABLE' | 'PENDING' | 'FOSTERING' | 'REJECTED' | 'HEALTH_ISSUE' | 'ADOPTED';

export interface ShelterNfcCard {
  /** id nội bộ của thẻ, dùng trong URL API */
  id: string;
  /** Mã hiển thị ngắn do backend sinh từ id (KHÔNG phải UID chip) */
  code: string;
  state: NfcCardState;
  petId: string | null;
  petName: string | null;
  petImage?: string | null;
  petSpecies?: 'DOG' | 'CAT';
  petBreed?: string | null;
  petStatus?: NfcCardPetStatus | null;
  chipType: 'NTAG213' | 'NTAG215' | 'NTAG216';
  /** Thời điểm thẻ được gán cho pet hiện tại */
  linkedAt: string | null;
  lastScannedAt?: string | null;
  scanCount: number;
}

export const NFC_STATE_META: Record<NfcCardState, { label: string; bg: string; color: string; dot: string }> = {
  ACTIVE:     { label: 'Đang hoạt động', bg: '#E8F9EE', color: '#00963D', dot: '#00AC47' },
  DISABLED:   { label: 'Đã vô hiệu',     bg: '#FFE9E9', color: '#C23030', dot: '#F46767' },
  UNASSIGNED: { label: 'Chưa gán pet',   bg: '#F1F1F4', color: '#6B6880', dot: '#A5A3B5' },
};

export const fmtDateTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtDay = (iso?: string | null): string => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return 'Chưa từng quét';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return fmtDay(iso);
};
