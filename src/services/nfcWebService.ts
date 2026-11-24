import { apiClient } from '@/lib/api/ApiClient';
import { apiErrorMessage } from '@/services/nfcPermissionService';

/**
 * ĐỌC / GÁN THẺ NFC TRÊN WEB — mirror luồng của app (services/nfcService.ts + app/nfc-reader.tsx).
 *
 * Đọc UID bằng Web NFC (NDEFReader). Chỉ chạy được trên Chrome for Android, qua HTTPS,
 * và phải được gọi từ thao tác của người dùng. iOS Safari và desktop không hỗ trợ.
 * Mọi quyết định (thẻ nào được gán, gán cho pet nào, shelter nào) do BE kiểm tra.
 */

export const WEB_NFC_ERR = {
  NOT_SUPPORTED: 'WEB_NFC_NOT_SUPPORTED',
  PERMISSION: 'WEB_NFC_PERMISSION',
  READ_FAILED: 'WEB_NFC_READ_FAILED',
  CANCELLED: 'WEB_NFC_CANCELLED',
  TAG_NOT_FOUND: 'NFC_TAG_NOT_FOUND',
} as const;

export type LocalizedText = string | { en?: string; vi?: string } | null | undefined;

/** Khớp NfcTagResult của BE (nfc.types.ts) — chỉ các trường web cần */
export type NfcTagResult =
  | { outcome: 'disabled'; uid: string }
  | {
      outcome: 'pet';
      uid: string;
      status: 'ACTIVE' | 'DISABLED' | 'LOST';
      pet: { id: string; name: LocalizedText; avatarUrl?: string | null; breed?: LocalizedText; qrValue: string };
      owner: { name: string; isCurrentUser: boolean };
      canUnlink?: boolean;
    }
  | { outcome: 'brand'; uid: string; brand: { id: string; name: string } }
  | { outcome: 'empty'; uid: string; canLink?: boolean };

/** Trình duyệt có đọc được NFC không (Chrome Android + HTTPS) */
export const isWebNfcSupported = (): boolean =>
  typeof window !== 'undefined' && window.isSecureContext && 'NDEFReader' in window;

/** "04:a3:b2..." -> "04A3B2..." (đúng với BE normalizeUid) */
const normalizeUid = (raw: string) => (raw ?? '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();

/**
 * Chờ người dùng chạm thẻ rồi trả UID. Hủy bằng AbortSignal (đóng modal / bấm Hủy).
 * Lỗi trả về là mã WEB_NFC_ERR.
 */
export const readWebNfcUid = (signal: AbortSignal): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    if (!isWebNfcSupported()) {
      reject(new Error(WEB_NFC_ERR.NOT_SUPPORTED));
      return;
    }
    if (signal.aborted) {
      reject(new Error(WEB_NFC_ERR.CANCELLED));
      return;
    }

    const reader = new (window as any).NDEFReader();
    const onAbort = () => reject(new Error(WEB_NFC_ERR.CANCELLED));
    signal.addEventListener('abort', onAbort, { once: true });

    reader.onreading = (event: { serialNumber: string }) => {
      signal.removeEventListener('abort', onAbort);
      const uid = normalizeUid(event.serialNumber);
      if (uid.length < 8) reject(new Error(WEB_NFC_ERR.READ_FAILED));
      else resolve(uid);
    };
    reader.onreadingerror = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new Error(WEB_NFC_ERR.READ_FAILED));
    };

    reader.scan({ signal }).catch((err: any) => {
      signal.removeEventListener('abort', onAbort);
      if (signal.aborted) reject(new Error(WEB_NFC_ERR.CANCELLED));
      else if (err?.name === 'NotAllowedError') reject(new Error(WEB_NFC_ERR.PERMISSION));
      else reject(new Error(WEB_NFC_ERR.READ_FAILED));
    });
  });

/** POST /nfc/scan — hỏi BE về UID (giống scanTagByUid của app) */
export const scanNfcUid = (uid: string): Promise<NfcTagResult> =>
  apiClient.post('/nfc/scan', { uid }) as unknown as Promise<NfcTagResult>;

/** POST /nfc/tags/:uid/link-pet — gán thẻ cho pet (pet của shelter: không cần grant) */
export const linkNfcTagToPet = (uid: string, petId: string) =>
  apiClient.post(`/nfc/tags/${encodeURIComponent(uid)}/link-pet`, { petId });

/** DELETE /nfc/tags/:uid/link-pet — gỡ thẻ khỏi pet */
export const unlinkNfcTagFromPet = (uid: string) =>
  apiClient.delete(`/nfc/tags/${encodeURIComponent(uid)}/link-pet`);

/** Thông báo lỗi thân thiện cho cả lỗi Web NFC và lỗi API */
export const describeNfcError = (err: any, fallback: string): string => {
  switch (err?.message) {
    case WEB_NFC_ERR.NOT_SUPPORTED:
      return 'Trình duyệt này không đọc được thẻ NFC. Hãy dùng Chrome trên Android và mở trang qua HTTPS.';
    case WEB_NFC_ERR.PERMISSION:
      return 'Trình duyệt chưa được cấp quyền NFC. Hãy bật quyền NFC cho trang này rồi thử lại.';
    case WEB_NFC_ERR.READ_FAILED:
      return 'Không đọc được thẻ. Đặt thẻ sát mặt sau điện thoại và thử lại.';
    case WEB_NFC_ERR.CANCELLED:
      return '';
    default:
      if (err?.response?.data?.i18n?.key === 'error.nfc_tag_not_found') {
        return 'Thẻ này không thuộc hệ thống PawLife.';
      }
      return apiErrorMessage(err, fallback);
  }
};
