'use client';

import React from 'react';
import { Nfc, CheckCircle2, ScanLine, CircleSlash } from 'lucide-react';
import { ShelterNfcCard } from '@/types/nfcCard';

export const NfcCardStats = ({ cards }: { cards: ShelterNfcCard[] }) => {
  const total = cards.length;
  const active = cards.filter((c) => c.state === 'ACTIVE').length;
  const disabled = cards.filter((c) => c.state === 'DISABLED').length;
  const scans = cards.reduce((s, c) => s + c.scanCount, 0);

  const items = [
    { label: 'Thẻ đã gán', value: total, Icon: Nfc, color: 'text-[#E89B5A]', bg: 'bg-[#FFF4EA]' },
    { label: 'Đang hoạt động', value: active, Icon: CheckCircle2, color: 'text-[#00AC47]', bg: 'bg-[#E8F9EE]' },
    { label: 'Đã vô hiệu', value: disabled, Icon: CircleSlash, color: 'text-[#C23030]', bg: 'bg-[#FFE9E9]' },
    { label: 'Lượt quét', value: scans, Icon: ScanLine, color: 'text-[#A855F7]', bg: 'bg-[#FAF5FF]' },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 lg:grid-cols-4 lg:gap-4">
      {items.map(({ label, value, Icon, color, bg }) => (
        <div key={label} className="flex items-center gap-3 rounded-[18px] border border-gray-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg} ${color}`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-semibold leading-none text-[#0D062D] sm:text-[26px]">{value.toLocaleString('vi-VN')}</p>
            <p className="mt-1 truncate text-[12px] text-gray-500 sm:text-[13px]">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NfcCardStats;
