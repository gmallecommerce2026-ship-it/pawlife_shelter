import { apiClient } from '@/lib/api/ApiClient';
import { ShelterNfcCard, ShelterNfcEvent, ShelterNfcScan, ShelterNfcStats } from '@/types/nfcCard';

/**
 * Thẻ NFC của shelter (màn Thẻ NFC và chi tiết pet).
 * Backend: nfc-shelter.controller.ts — chỉ thành viên shelter được gọi.
 * Gán thẻ mới vẫn làm trên app (đọc chip NFC cần phần cứng điện thoại).
 */

export interface ShelterNfcPage {
  items: ShelterNfcCard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ShelterNfcQuery {
  page?: number;
  pageSize?: number;
  state?: 'ACTIVE' | 'DISABLED' | 'ALL';
  q?: string;
  sort?: 'recent' | 'scans' | 'name';
  petId?: string;
}

const toQueryString = (query: ShelterNfcQuery) => {
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === 'ALL') return;
    qs.set(k, String(v));
  });
  return qs.toString();
};

/** GET /nfc/shelter/tags */
export const listShelterNfcCards = async (query: ShelterNfcQuery = {}): Promise<ShelterNfcPage> => {
  const res: any = await apiClient.get(`/nfc/shelter/tags?${toQueryString(query)}`);
  return {
    items: res?.items ?? [],
    total: res?.total ?? 0,
    page: res?.page ?? 1,
    pageSize: res?.pageSize ?? 20,
  };
};

/** GET /nfc/shelter/stats */
export const getShelterNfcStats = (): Promise<ShelterNfcStats> =>
  apiClient.get('/nfc/shelter/stats');

/** GET /nfc/shelter/tags/export.csv — trả về nội dung CSV dạng text */
export const exportShelterNfcCsv = (query: ShelterNfcQuery = {}): Promise<string> =>
  apiClient.get(`/nfc/shelter/tags/export.csv?${toQueryString(query)}`);

/** GET /nfc/shelter/tags/:id/scans */
export const getShelterNfcScans = (cardId: string): Promise<ShelterNfcScan[]> =>
  apiClient.get(`/nfc/shelter/tags/${encodeURIComponent(cardId)}/scans`);

/** GET /nfc/shelter/tags/:id/events */
export const getShelterNfcEvents = (cardId: string): Promise<ShelterNfcEvent[]> =>
  apiClient.get(`/nfc/shelter/tags/${encodeURIComponent(cardId)}/events`);

/** PATCH /nfc/shelter/tags/:id/state — cần quyền Gán thẻ */
export const setShelterNfcCardState = (cardId: string, state: 'ACTIVE' | 'DISABLED') =>
  apiClient.patch(`/nfc/shelter/tags/${encodeURIComponent(cardId)}/state`, { state });

/** DELETE /nfc/shelter/tags/:id/link-pet — cần quyền Gán thẻ */
export const unlinkShelterNfcCard = (cardId: string) =>
  apiClient.delete(`/nfc/shelter/tags/${encodeURIComponent(cardId)}/link-pet`);
