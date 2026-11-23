// ⚠️ MOCK — FE-first. Shape bám theo backend: bảng NfcTag (state, linkedAt, lastScannedAt,
// scanCount, linkCount) + Pet. Khi có API (vd GET /nfc/shelter/tags) chỉ cần thay MOCK_NFC_CARDS.
export type NfcCardState = 'ACTIVE' | 'DISABLED' | 'UNASSIGNED';
export type NfcCardPetStatus = 'AVAILABLE' | 'ADOPTED' | 'FOSTERING';

export interface ShelterNfcCard {
  id: string;
  /** Mã hiển thị ngắn (KHÔNG phải UID chip) */
  code: string;
  state: NfcCardState;
  petId: string | null;
  petName: string | null;
  petImage?: string | null;
  petSpecies?: 'DOG' | 'CAT';
  petBreed?: string | null;
  petStatus?: NfcCardPetStatus | null;
  chipType: 'NTAG213' | 'NTAG215' | 'NTAG216';
  issuedAt: string; // ISO
  lastScannedAt?: string | null;
  scanCount: number;
  issuedBy: string;
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

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const PETS: Array<Pick<ShelterNfcCard, 'petName' | 'petSpecies' | 'petBreed' | 'petStatus'>> = [
  { petName: 'Max',   petSpecies: 'DOG', petBreed: 'Labrador Retriever', petStatus: 'ADOPTED' },
  { petName: 'Mochi', petSpecies: 'CAT', petBreed: 'Mèo Anh lông ngắn',  petStatus: 'AVAILABLE' },
  { petName: 'Bông',  petSpecies: 'DOG', petBreed: 'Poodle',             petStatus: 'ADOPTED' },
  { petName: 'Luna',  petSpecies: 'CAT', petBreed: 'Mèo tam thể',        petStatus: 'FOSTERING' },
  { petName: 'Cốm',   petSpecies: 'DOG', petBreed: 'Corgi',              petStatus: 'AVAILABLE' },
  { petName: 'Lu',    petSpecies: 'DOG', petBreed: 'Chó cỏ',             petStatus: 'ADOPTED' },
  { petName: 'Miu',   petSpecies: 'CAT', petBreed: 'Mèo Ba Tư',          petStatus: 'AVAILABLE' },
];

// ⚠️ SEED TẠM để test UI — XOÁ khi nối API thật.
export const MOCK_NFC_CARDS: ShelterNfcCard[] = [
  ...PETS.map((p, i): ShelterNfcCard => ({
    id: `mock-nfc-${i + 1}`,
    code: `PL-${(4821 + i * 37).toString().padStart(5, '0')}`,
    state: i === 5 ? 'DISABLED' : 'ACTIVE',
    petId: `mock-pet-${i + 1}`,
    ...p,
    chipType: i % 3 === 0 ? 'NTAG215' : 'NTAG213',
    issuedAt: daysAgo(10 + i * 9),
    lastScannedAt: i === 4 ? null : daysAgo(i * 2),
    scanCount: [38, 12, 27, 5, 0, 61, 9][i],
    issuedBy: i % 2 ? 'Trần Minh Anh' : 'Nguyễn Thu Hà',
  })),
  ...[0, 1].map((i): ShelterNfcCard => ({
    id: `mock-nfc-free-${i}`,
    code: `PL-${(5100 + i * 11).toString().padStart(5, '0')}`,
    state: 'UNASSIGNED',
    petId: null,
    petName: null,
    chipType: 'NTAG213',
    issuedAt: daysAgo(3 + i),
    lastScannedAt: null,
    scanCount: 0,
    issuedBy: 'Nguyễn Thu Hà',
  })),
];
