import { apiClient } from '@/lib/api/ApiClient';
import { ShelterNfcCard } from '@/types/nfcCard';

/**
 * Thẻ NFC của shelter (màn Thẻ NFC).
 * Backend: nfc-shelter.controller.ts — chỉ thành viên shelter được gọi.
 * Gán thẻ mới được làm trên app (đọc chip NFC cần phần cứng điện thoại).
 */

/** GET /nfc/shelter/tags */
export const listShelterNfcCards = async (): Promise<ShelterNfcCard[]> => {
  const res: any = await apiClient.get('/nfc/shelter/tags');
  return Array.isArray(res) ? res : res?.data ?? [];
};

/** DELETE /nfc/shelter/tags/:id/link-pet — cần quyền Gán thẻ */
export const unlinkShelterNfcCard = (cardId: string) =>
  apiClient.delete(`/nfc/shelter/tags/${encodeURIComponent(cardId)}/link-pet`);
