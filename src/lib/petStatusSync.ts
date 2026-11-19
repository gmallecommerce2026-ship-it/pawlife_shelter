// src/lib/petStatusSync.ts
// Đồng bộ trạng thái pet theo hồ sơ nhận nuôi: xem trước -> xác nhận -> áp dụng.
import axiosClient from '@/lib/api/axiosClient';
import { toast } from 'react-hot-toast';

const URL = '/shelter-dashboard/pet-sheet/sync-status';

export interface PetSyncReport {
  dry: boolean;
  scanned: number;
  changed: number;
  skipped: number;
  changes: { petId: string; name: string; kind: string; from: string; to: string; reason: string }[];
  conflicts: { petId: string; name: string; code: string; message: string }[];
}

const LABEL: Record<string, string> = {
  AVAILABLE: 'Chờ nhận nuôi', PENDING: 'Đang xét duyệt', FOSTERING: 'Foster',
  REJECTED: 'Không đủ điều kiện', HEALTH_ISSUE: 'Vấn đề sức khoẻ', ADOPTED: 'Đã nhận nuôi',
};
const lb = (s: string) => LABEL[s] ?? s;

/** Hiện các ca xung đột (hệ thống không tự đổi) dưới dạng toast cảnh báo. */
export const toastConflicts = (r?: Pick<PetSyncReport, 'conflicts'> | null) =>
  r?.conflicts?.slice(0, 5).forEach((c) => toast(c.message, { icon: '⚠️', duration: 9000 }));

/**
 * Trả về true nếu đã áp dụng thay đổi (để nơi gọi tải lại dữ liệu).
 * Không có gì cần đổi -> báo "đã khớp" và trả false.
 */
export async function runPetStatusSync(): Promise<boolean> {
  const pre = (await axiosClient.post<PetSyncReport>(URL)).data; // mặc định dry=1
  if (!pre.changed) {
    toast.success(`Đã khớp: ${pre.scanned} pet có hồ sơ nhận nuôi, không cần đồng bộ.`);
    toastConflicts(pre);
    return false;
  }
  const lines = pre.changes.slice(0, 8).map((c) => `• ${c.name}: ${lb(c.from)} → ${lb(c.to)}`).join('\n');
  const more = pre.changes.length > 8 ? `\n… và ${pre.changes.length - 8} pet khác` : '';
  const warn = pre.conflicts.length ? `\n\n(${pre.conflicts.length} trường hợp cần xử lý tay, không tự đổi)` : '';
  if (!window.confirm(`Sẽ cập nhật ${pre.changed} pet theo hồ sơ nhận nuôi:\n${lines}${more}${warn}\n\nĐồng bộ?`)) return false;

  const r = (await axiosClient.post<PetSyncReport>(`${URL}?dry=0`)).data;
  toast.success(`Đã đồng bộ ${r.changed} pet.`);
  if (r.skipped) toast(`${r.skipped} pet vừa được sửa bởi người khác nên bỏ qua, hãy đồng bộ lại.`, { icon: 'ℹ️' });
  toastConflicts(r);
  return true;
}
