// src/modules/shelter/applications/components/HandoverActionModal.tsx
'use client';

import React from 'react';
import { KeyRound, Send, X } from 'lucide-react';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { AdoptionApplication } from '@/types/application';

/**
 * Bấm vào thẻ ở cột Hoàn thành: trạm chọn việc cần làm với bàn giao này.
 *  - Nhập mã NFC: adopter đã chạm thẻ và đọc mã 6 ký tự.
 *  - Gửi lại yêu cầu nhận hồ sơ: đẩy lại popup gán QR / NFC lên app của adopter.
 */
export const HandoverActionModal = ({
  application,
  onClose,
  onEnterCode,
  onResend,
}: {
  application: AdoptionApplication;
  onClose: () => void;
  onEnterCode: () => void;
  onResend: () => void;
}) => {
  const petName = application.pet?.name || 'bé';

  return (
    <ResponsiveModal onClose={onClose} maxWidth="sm:max-w-[420px]">
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-[#0D062D]">Bàn giao {petName}</h3>
            <p className="truncate text-[13px] text-gray-500">{application.fullName || 'người nhận nuôi'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <ActionOption
            icon={<KeyRound size={20} />}
            title="Nhập mã NFC"
            desc="Người nhận nuôi đã chạm thẻ và đọc mã 6 ký tự cho trạm."
            onClick={onEnterCode}
          />
          <ActionOption
            icon={<Send size={20} />}
            title="Gửi lại yêu cầu nhận hồ sơ"
            desc="Gửi lại popup gán thẻ QR / NFC lên app của người nhận nuôi."
            onClick={onResend}
          />
        </div>
      </div>
    </ResponsiveModal>
  );
};

const ActionOption = ({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left transition-colors hover:border-[#E89B5A] hover:bg-[#FFF4EA]"
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-semibold text-[#0D062D]">{title}</p>
      <p className="text-[12px] leading-snug text-gray-500">{desc}</p>
    </div>
  </button>
);

export default HandoverActionModal;
