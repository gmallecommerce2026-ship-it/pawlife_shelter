// src/modules/shelter/applications/components/HandoverMethodModal.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, Send } from 'lucide-react';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { AdoptionApplication } from '@/types/application';

export type HandoverMethodSelection = { qr: boolean; nfc: boolean };

/** Bàn giao chỉ dùng thẻ NFC. Luôn gửi cố định, không cho chọn QR nữa. */
const NFC_ONLY: HandoverMethodSelection = { qr: false, nfc: true };

/**
 * Popup xác nhận yêu cầu nhận hồ sơ (thẻ NFC).
 *  - mode "complete": kéo đơn vào cột Hoàn thành -> đổi trạng thái + gửi yêu cầu nhận hồ sơ.
 *  - mode "resend":   đơn đã ở Hoàn thành -> chỉ gửi lại yêu cầu nhận hồ sơ, không đổi trạng thái.
 * Gửi xong -> app của người nhận nuôi hiện popup ngay (realtime) với nút gán thẻ NFC.
 */
export const HandoverMethodModal = ({
  application,
  onClose,
  onSubmit,
  mode = 'complete',
}: {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (methods: HandoverMethodSelection) => Promise<boolean>;
  mode?: 'complete' | 'resend';
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isResend = mode === 'resend';
  const petName = application.pet?.name || 'bé';
  const applicantName = application.fullName || 'người nhận nuôi';

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const ok = await onSubmit(NFC_ONLY);
      if (!ok) setError(isResend ? 'Không thể gửi lại yêu cầu. Vui lòng thử lại.' : 'Không thể hoàn tất nhận nuôi. Vui lòng thử lại.');
    } catch (err: any) {
      setError(err?.response?.data?.message || (isResend ? 'Không thể gửi lại yêu cầu. Vui lòng thử lại.' : 'Không thể hoàn tất nhận nuôi. Vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal onClose={onClose} maxWidth="sm:max-w-[420px]">
      <div className="p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4EA] text-[#E89B5A]">
            {isResend ? <Send size={20} /> : <CheckCircle2 size={22} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-[#0D062D]">
              {isResend ? 'Gửi lại yêu cầu nhận hồ sơ' : 'Hoàn tất nhận nuôi'}
            </h3>
            <p className="truncate text-[13px] text-gray-500">
              Bé {petName} · {applicantName}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-[#E89B5A] bg-[#FFF4EA] p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E89B5A] text-white">
            <CreditCard size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[#0D062D]">Thẻ NFC</p>
            <p className="text-[12px] leading-snug text-gray-500">
              Người nhận nuôi chạm thẻ NFC, đọc mã 6 ký tự để trạm nhập trên web.
            </p>
          </div>
        </div>

        {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}

        <p className="mt-4 text-[12px] text-gray-500">
          {isResend
            ? 'Người nhận nuôi sẽ nhận lại popup trên app để gán thẻ NFC cho bé. Mã NFC cũ (nếu có) sẽ hết hiệu lực.'
            : 'Sau khi gửi, người nhận nuôi sẽ nhận popup trên app để chạm thẻ NFC gán cho bé.'}
        </p>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 flex-1 rounded-full bg-gray-100 text-[14px] font-semibold text-gray-700 disabled:opacity-60"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="h-11 flex-[1.4] rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={18} className="mx-auto animate-spin" />
            ) : isResend ? (
              'Gửi yêu cầu'
            ) : (
              'Hoàn tất & gửi'
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default HandoverMethodModal;
