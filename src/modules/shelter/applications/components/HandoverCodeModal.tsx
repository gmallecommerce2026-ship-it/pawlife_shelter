// src/modules/shelter/applications/components/HandoverCodeModal.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle2, KeyRound, Loader2, X } from 'lucide-react';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { AdoptionApplication } from '@/types/application';
import { confirmHandoverCode } from '@/services/handoverService';
import { apiErrorMessage } from '@/services/nfcPermissionService';

/**
 * Nhân viên nhập mã 6 ký tự adopter đọc từ app (sau khi chạm thẻ NFC) để hoàn tất bàn giao.
 * Sau khi xong, pet mới đổi chủ và xuất hiện trong My Pets của adopter.
 */
export const HandoverCodeModal = ({
  application,
  onClose,
  onDone,
}: {
  application: AdoptionApplication;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const petName = application.pet?.name || 'bé';
  const valid = code.replace(/[^A-Za-z0-9]/g, '').length === 6;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      await confirmHandoverCode(code);
      setDone(true);
      toast.success(`Đã bàn giao ${petName} cho người nhận nuôi`);
      onDone();
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Mã không đúng hoặc đã hết hạn. Nhờ người nhận nuôi chạm thẻ lấy mã mới.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal onClose={onClose} maxWidth="sm:max-w-[400px]" zIndex="z-[115]">
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4EA] text-[#E89B5A]">
              <KeyRound size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold text-[#0D062D]">Xác nhận bàn giao</h3>
              <p className="truncate text-[13px] text-gray-500">
                Bé {petName} · {application.fullName || 'người nhận nuôi'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={48} className="mb-3 text-[#00963D]" />
            <p className="text-[15px] font-medium text-gray-800">Đã bàn giao thành công</p>
            <p className="mt-1 text-[13px] text-gray-500">{petName} đã nằm trong My Pets của người nhận nuôi.</p>
            <button type="button" onClick={onClose}
              className="mt-6 h-11 w-full rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white hover:bg-[#D98744]">
              Đóng
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[13px] text-gray-600">
              Nhập mã 6 ký tự người nhận nuôi đọc từ app. Mã có hiệu lực 10 phút sau khi họ chạm thẻ.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="VD: K7M2QP"
              autoFocus
              inputMode="text"
              autoCapitalize="characters"
              className="h-14 w-full rounded-2xl border border-gray-200 text-center text-[24px] font-semibold tracking-[0.3em] text-gray-900 outline-none focus:border-[#E89B5A]"
            />
            {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-[13px] text-red-600">{error}</p>}
            <button type="button" onClick={submit} disabled={!valid || busy}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white transition-colors hover:bg-[#D98744] disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />}
              Xác nhận bàn giao
            </button>
          </>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default HandoverCodeModal;
