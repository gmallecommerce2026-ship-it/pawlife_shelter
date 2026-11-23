import { apiClient } from '@/lib/api/ApiClient';

/**
 * PHÂN QUYỀN NFC — mirror y hệt module NFC reader trong app (services/nfcPermissionService.ts).
 *
 *   LINKER  : gán thẻ NFC cho pet
 *   GRANTER : LINKER + cấp / thu hồi quyền LINKER
 *   MANAGER : GRANTER + cấp / thu hồi quyền GRANTER (và LINKER)
 *   Root    : (email trong NFC_ROOT_EMAILS ở BE) cấp mọi cấp độ, thu hồi tất cả
 *
 * - Người khác chỉ cấp được cấp THẤP HƠN cấp của mình.
 * - Chỉ thu hồi được người do CHÍNH MÌNH cấp (root: thu hồi tất cả; thu hồi là dây chuyền).
 * ⚠️ FE chỉ ẩn/hiện UI, BE kiểm tra lại mọi rule.
 *
 * Endpoint dùng chung với app: GET /nfc/permissions/me, GET|POST /nfc/permissions, DELETE /nfc/permissions/:userId
 * Mock mode (mặc định bật cho tới khi nối API): đặt NEXT_PUBLIC_NFC_MOCK=false để gọi API thật.
 */
export type NfcLevel = 'LINKER' | 'GRANTER' | 'MANAGER';

export interface NfcMyPermission { isRoot: boolean; level: NfcLevel | null }

export interface NfcGrant {
  userId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  level: NfcLevel;
  grantedAt?: string;
  /** Chỉ có khi người xem là root */
  grantedByName?: string | null;
  canRevoke: boolean;
}

export const NO_NFC_PERMISSION: NfcMyPermission = { isRoot: false, level: null };
export const NFC_LEVELS: NfcLevel[] = ['LINKER', 'GRANTER', 'MANAGER'];
const RANK: Record<NfcLevel, number> = { LINKER: 1, GRANTER: 2, MANAGER: 3 };

export const NFC_LEVEL_META: Record<NfcLevel, { label: string; desc: string; color: string; bg: string }> = {
  LINKER:  { label: 'Gán thẻ',   desc: 'Gán thẻ NFC cho pet của trạm.', color: '#3B82F6', bg: '#EFF6FF' },
  GRANTER: { label: 'Cấp quyền', desc: 'Gán thẻ và cấp / thu hồi quyền Gán thẻ cho người khác.', color: '#A855F7', bg: '#FAF5FF' },
  MANAGER: { label: 'Quản lý',   desc: 'Như Cấp quyền, và cấp / thu hồi quyền Cấp quyền cho người khác.', color: '#E89B5A', bg: '#FFF4EA' },
};

// ---------- Helpers thuần ----------
export const canLinkTag = (p: NfcMyPermission) => p.isRoot || p.level !== null;
export const grantableLevels = (p: NfcMyPermission): NfcLevel[] => {
  if (p.isRoot) return NFC_LEVELS;
  const mine = p.level;
  return mine ? NFC_LEVELS.filter((l) => RANK[l] < RANK[mine]) : [];
};
export const canManagePermissions = (p: NfcMyPermission) => grantableLevels(p).length > 0;
export const permissionTitle = (p: NfcMyPermission) =>
  p.isRoot ? 'Quản trị viên (Root)' : p.level ? NFC_LEVEL_META[p.level].label : 'Chỉ xem';

// ---------- Mock (in-memory) ----------
export const NFC_MOCK = process.env.NEXT_PUBLIC_NFC_MOCK !== 'false';

const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
let mockGrants: NfcGrant[] = [
  { userId: 'u1', email: 'ha.nguyen@tramcuuho.vn',   name: 'Nguyễn Thu Hà',  level: 'MANAGER', grantedAt: ago(40), grantedByName: 'PawLife Admin', canRevoke: true },
  { userId: 'u2', email: 'minhanh@tramcuuho.vn',     name: 'Trần Minh Anh',  level: 'GRANTER', grantedAt: ago(22), grantedByName: 'Nguyễn Thu Hà', canRevoke: true },
  { userId: 'u3', email: 'tuan.volunteer@gmail.com', name: 'Lê Quốc Tuấn',   level: 'LINKER',  grantedAt: ago(9),  grantedByName: 'Trần Minh Anh', canRevoke: true },
  { userId: 'u4', email: 'lan.pham@gmail.com',       name: 'Phạm Ngọc Lan',  level: 'LINKER',  grantedAt: ago(3),  grantedByName: 'Trần Minh Anh', canRevoke: true },
];
const wait = <T,>(v: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const mockErr = (m: string) => Object.assign(new Error(m), { response: { data: { message: m } } });

/** Chỉ dùng ở mock mode để xem thử UI theo từng vai trò */
export let mockMyPermission: NfcMyPermission = { isRoot: false, level: 'MANAGER' };
export const setMockMyPermission = (p: NfcMyPermission) => { mockMyPermission = p; };

export const apiErrorMessage = (e: any, fallback: string): string => {
  const m = e?.response?.data?.message ?? e?.message;
  return typeof m === 'string' && m ? m : fallback;
};

// ---------- API ----------
const unwrap = <T = any>(res: any): T => (res?.data !== undefined ? res.data : res);

export const getMyNfcPermission = async (): Promise<NfcMyPermission> => {
  if (NFC_MOCK) return wait({ ...mockMyPermission }, 150);
  const data = unwrap(await apiClient.get('/nfc/permissions/me'));
  return { isRoot: !!data?.isRoot, level: NFC_LEVELS.includes(data?.level) ? data.level : null };
};

export const listNfcGrants = async (): Promise<NfcGrant[]> => {
  if (NFC_MOCK) {
    const me = mockMyPermission;
    // root thấy tất cả; người khác chỉ thấy cấp thấp hơn mình (giả lập "người mình đã cấp")
    return wait(mockGrants.filter((g) => me.isRoot || (me.level && RANK[g.level] < RANK[me.level])).map((g) => ({
      ...g, grantedByName: me.isRoot ? g.grantedByName : null,
    })));
  }
  const data = unwrap(await apiClient.get('/nfc/permissions'));
  const rows: any[] = Array.isArray(data) ? data : data?.items ?? [];
  return rows.map((r) => ({
    userId: String(r.userId ?? r.id), email: String(r.email ?? ''), name: r.name ?? null, avatarUrl: r.avatarUrl ?? null,
    level: r.level as NfcLevel, grantedAt: r.grantedAt, grantedByName: r.grantedByName ?? null, canRevoke: !!r.canRevoke,
  }));
};

export const grantNfcPermission = async (email: string, level: NfcLevel) => {
  if (NFC_MOCK) {
    if (!grantableLevels(mockMyPermission).includes(level)) throw mockErr('Bạn không thể cấp quyền ở cấp độ này');
    const e = email.trim().toLowerCase();
    const old = mockGrants.find((g) => g.email === e);
    if (old) mockGrants = mockGrants.map((g) => (g.email === e ? { ...g, level } : g));
    else mockGrants = [{ userId: `u${Date.now()}`, email: e, name: e.split('@')[0], level, grantedAt: new Date().toISOString(), grantedByName: 'Bạn', canRevoke: true }, ...mockGrants];
    return wait({ success: true });
  }
  return unwrap(await apiClient.post('/nfc/permissions', { email, level }));
};

export const revokeNfcPermission = async (userId: string) => {
  if (NFC_MOCK) { mockGrants = mockGrants.filter((g) => g.userId !== userId); return wait({ success: true }); }
  return unwrap(await apiClient.delete(`/nfc/permissions/${encodeURIComponent(userId)}`));
};
