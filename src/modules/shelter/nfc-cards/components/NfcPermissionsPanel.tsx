'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Trash2, UserPlus, Mail, Check, Info, Users } from 'lucide-react';
import ResponsiveModal from '@/components/ResponsiveModal';
import {
  NFC_LEVELS, NFC_LEVEL_META, NfcGrant, NfcLevel, NfcMyPermission, apiErrorMessage, canLinkTag, grantNfcPermission,
  grantableLevels, listNfcGrants, revokeNfcPermission, permissionTitle,
} from '@/services/nfcPermissionService';
import { fmtDay } from '@/types/nfcCard';
import { NfcLevelPill } from './NfcRoleBadge';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initials = (g: NfcGrant) => (g.name || g.email).trim().slice(0, 1).toUpperCase();

export const NfcPermissionsPanel = ({ perm, onPermChanged }: { perm: NfcMyPermission; onPermChanged: () => void }) => {
  const levels = grantableLevels(perm);
  const [grants, setGrants] = useState<NfcGrant[] | null>(null);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<NfcLevel | null>(levels[0] ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [toRevoke, setToRevoke] = useState<NfcGrant | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    try { setGrants(await listNfcGrants()); }
    catch (e) { setGrants([]); toast.error(apiErrorMessage(e, 'Không tải được danh sách quyền')); }
  }, []);
  useEffect(() => { load(); }, [load, perm.isRoot, perm.level]);
  // đổi vai trò (mock) -> chọn lại level hợp lệ
  useEffect(() => { if (!level || !levels.includes(level)) setLevel(levels[0] ?? null); /* eslint-disable-next-line */ }, [perm.isRoot, perm.level]);

  const canSubmit = EMAIL_RE.test(email.trim()) && !!level && !submitting;

  const submit = async () => {
    if (!canSubmit || !level) return;
    setSubmitting(true);
    try {
      await grantNfcPermission(email.trim(), level);
      toast.success(`Đã cấp quyền "${NFC_LEVEL_META[level].label}" cho ${email.trim()}`);
      setEmail('');
      await load();
    } catch (e) { toast.error(apiErrorMessage(e, 'Không cấp được quyền')); }
    finally { setSubmitting(false); }
  };

  const confirmRevoke = async () => {
    if (!toRevoke) return;
    setRevoking(true);
    try {
      await revokeNfcPermission(toRevoke.userId);
      toast.success('Đã thu hồi quyền');
      setToRevoke(null);
      await load();
    } catch (e) { toast.error(apiErrorMessage(e, 'Không thu hồi được quyền')); }
    finally { setRevoking(false); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* Cột trái: cấp quyền + giải thích */}
      <div className="flex flex-col gap-4">
        <section className="rounded-[20px] border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EA] text-[#E89B5A]"><UserPlus size={18} /></div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#0D062D]">Cấp quyền mới</h3>
              <p className="text-[12px] text-gray-500">Người nhận cần có tài khoản PawLife</p>
            </div>
          </div>

          <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Email người nhận</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ten@email.com"
              className="h-11 w-full rounded-full border border-gray-200 bg-[#F5F5F7] pl-10 pr-4 text-[16px] transition-all placeholder:text-gray-400 focus:border-[#E89B5A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E89B5A]/20 sm:text-sm"
            />
          </div>

          <label className="mb-1.5 mt-4 block text-[13px] font-medium text-gray-600">Cấp độ</label>
          <div className="flex flex-col gap-2">
            {NFC_LEVELS.map((l) => {
              const allowed = levels.includes(l);
              const on = level === l;
              const m = NFC_LEVEL_META[l];
              return (
                <button
                  key={l} type="button" disabled={!allowed} onClick={() => setLevel(l)}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                    !allowed ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-45'
                    : on ? 'border-[#E89B5A] bg-[#FFF9F3] ring-2 ring-[#E89B5A]/15' : 'border-gray-200 hover:border-[#E89B5A]/60'
                  }`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-[#E89B5A] bg-[#E89B5A] text-white' : 'border-gray-300'}`}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold" style={{ color: m.color }}>{m.label}</span>
                    <span className="block text-[12px] leading-snug text-gray-500">{m.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button" onClick={submit} disabled={!canSubmit}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white transition-colors hover:bg-[#D98744] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Cấp quyền
          </button>
        </section>

        <section className="rounded-[20px] bg-[#F7F7FA] p-4 text-[13px] leading-relaxed text-gray-600">
          <p className="mb-2 flex items-center gap-1.5 font-semibold text-[#0D062D]"><Info size={14} /> Quy tắc phân quyền</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Chỉ cấp được cấp độ <b>thấp hơn</b> cấp của bạn (Root cấp được tất cả).</li>
            <li>Chỉ thu hồi được người <b>do bạn cấp</b>.</li>
            <li>Thu hồi một người sẽ thu hồi luôn những người họ đã cấp.</li>
          </ul>
        </section>

      </div>

      {/* Cột phải: danh sách */}
      <section className="min-w-0 rounded-[20px] border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F1F4] text-gray-600"><Users size={18} /></div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#0D062D]">{perm.isRoot ? 'Tất cả người được cấp quyền' : 'Người bạn đã cấp quyền'}</h3>
              <p className="text-[12px] text-gray-500">Vai trò của bạn: {permissionTitle(perm)}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[13px] font-semibold text-gray-600">{grants?.length ?? '…'}</span>
        </div>

        {grants === null ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}</div>
        ) : grants.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4EA] text-[#E89B5A]"><Users size={26} /></div>
            <p className="font-medium text-gray-700">Chưa cấp quyền cho ai</p>
            <p className="mt-1 text-sm text-gray-500">Nhập email ở khung bên cạnh để bắt đầu.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {grants.map((g) => (
              <li key={g.userId} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF4EA] text-[16px] font-semibold text-[#E89B5A]">
                  {g.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={g.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(g)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-gray-900">{g.name || g.email}</p>
                  <p className="truncate text-[13px] text-gray-500">{g.email}</p>
                  <p className="mt-0.5 truncate text-[12px] text-gray-400">
                    Cấp ngày {fmtDay(g.grantedAt)}{g.grantedByName ? ` · bởi ${g.grantedByName}` : ''}
                  </p>
                </div>
                <NfcLevelPill level={g.level} />
                {g.canRevoke && (
                  <button type="button" onClick={() => setToRevoke(g)} aria-label="Thu hồi quyền" title="Thu hồi quyền"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {toRevoke && (
        <ResponsiveModal onClose={() => !revoking && setToRevoke(null)} maxWidth="max-w-[420px]">
          <div className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500"><Trash2 size={22} /></div>
            <h3 className="text-[18px] font-semibold text-[#0D062D]">Thu hồi quyền?</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
              <b>{toRevoke.name || toRevoke.email}</b> sẽ không còn quyền “{NFC_LEVEL_META[toRevoke.level].label}”.
              {toRevoke.level !== 'LINKER' && ' Những người họ đã cấp cũng sẽ bị thu hồi theo.'}
            </p>
            <div className="mt-6 flex gap-2">
              <button type="button" disabled={revoking} onClick={() => setToRevoke(null)} className="h-11 flex-1 rounded-full bg-[#F5F5F7] text-[14px] font-semibold text-gray-700 hover:bg-gray-200">Huỷ</button>
              <button type="button" disabled={revoking} onClick={confirmRevoke} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[14px] font-semibold text-white hover:bg-red-600">
                {revoking && <Loader2 size={16} className="animate-spin" />} Thu hồi
              </button>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </div>
  );
};

export default NfcPermissionsPanel;
