// src/modules/shelter/applications/components/HandoverMethodModal.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, QrCode } from 'lucide-react';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { AdoptionApplication } from '@/types/application';

export type HandoverMethodSelection = { qr: boolean; nfc: boolean };

/**
 * Popup khi kéo đơn vào cột Hoàn thành: trạm chọn cách gán thẻ người nhận nuôi được dùng
 * (QR tag và/hoặc thẻ NFC). Gửi xong -> app của người nhận nuôi hiện popup ngay (realtime)
 * với đúng các nút đã chọn.
 */
export const HandoverMethodModal = ({
  application,
  onClose,
  onSubmit,
}: {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (methods: HandoverMethodSelection) => Promise<boolean>;
}) => {
  const [qr, setQr] = useState(true);
  const [nfc, setNfc] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const petName = application.pet?.name || 'bé';
  const applicantName = application.fullName || 'người nhận nuôi';
  const valid = qr || nfc;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const ok = await onSubmit({ qr, nfc });
      if (!ok) setError('Không thể hoàn tất nhận nuôi. Vui lòng thử lại.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể hoàn tất nhận nuôi. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal onClose={onClose} maxWidth="sm:max-w-[420px]">
      <div className="p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4EA] text-[#E89B5A]">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-[#0D062D]">Hoàn tất nhận nuôi</h3>
            <p className="truncate text-[13px] text-gray-500">
              Bé {petName} · {applicantName}
            </p>
          </div>
        </div>

        <p className="text-[13px] font-medium text-gray-700">Người nhận nuôi gán thẻ bằng cách nào?</p>
        <div className="mt-2 flex flex-col gap-2.5">
          <MethodOption
            checked={qr}
            onChange={setQr}
            icon={<QrCode size={20} />}
            title="Thẻ QR tag"
            desc="Người nhận nuôi quét QR trên thẻ, bé về My Pets ngay."
          />
          <MethodOption
            checked={nfc}
            onChange={setNfc}
            icon={<CreditCard size={20} />}
            title="Thẻ NFC"
            desc="Người nhận nuôi chạm thẻ, đọc mã 6 ký tự để trạm nhập trên web."
          />
        </div>

        {!valid && <p className="mt-3 text-[13px] text-red-500">Chọn ít nhất một cách gán thẻ.</p>}
        {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}

        <p className="mt-4 text-[12px] text-gray-500">
          Sau khi gửi, người nhận nuôi sẽ nhận popup trên app để gán thẻ cho bé.
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
            disabled={!valid || busy}
            className="h-11 flex-[1.4] rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Hoàn tất & gửi'}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

const MethodOption = ({
  checked,
  onChange,
  icon,
  title,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${checked ? 'border-[#E89B5A] bg-[#FFF4EA]' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? 'bg-[#E89B5A] text-white' : 'bg-gray-100 text-gray-500'
        }`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-semibold text-[#0D062D]">{title}</p>
      <p className="text-[12px] leading-snug text-gray-500">{desc}</p>
    </div>
    <div
      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-[#E89B5A] bg-[#E89B5A] text-white' : 'border-gray-300'
        }`}
    >
      {checked && <CheckCircle2 size={14} />}
    </div>
  </button>
);
