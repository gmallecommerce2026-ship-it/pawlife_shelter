'use client';

import React from 'react';
import { Nfc, CheckCircle2, CircleSlash, Clock3 } from 'lucide-react';
import { ShelterNfcStats } from '@/types/nfcCard';

/** Số liệu lấy từ server (GET /nfc/shelter/stats) */
export const NfcCardStats = ({ stats }: { stats: ShelterNfcStats | null }) => {
  const v = (n?: number) => (stats ? (n ?? 0).toLocaleString('vi-VN') : '…');
  const items = [
    { label: 'Thẻ đã gán', value: v(stats?.total), Icon: Nfc, color: 'text-[#E89B5A]', bg: 'bg-[#FFF4EA]', hint: 'Tổng số thẻ của trạm' },
    { label: 'Đang hoạt động', value: v(stats?.active), Icon: CheckCircle2, color: 'text-[#00AC47]', bg: 'bg-[#E8F9EE]', hint: 'Sẵn sàng cho người quét' },
    { label: 'Đã vô hiệu', value: v(stats?.disabled), Icon: CircleSlash, color: 'text-[#C23030]', bg: 'bg-[#FFE9E9]', hint: 'Đang khoá tạm thời' },
    { label: 'Ít được quét', value: v(stats?.stale), Icon: Clock3, color: 'text-[#B7791F]', bg: 'bg-[#FFF8E6]', hint: 'Hoạt động nhưng 90 ngày chưa quét' },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 lg:grid-cols-4 lg:gap-4">
      {items.map(({ label, value, Icon, color, bg, hint }) => (
        <div key={label} title={hint}
          className="group flex items-center gap-3 rounded-[18px] border border-gray-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] sm:p-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg} ${color} transition-transform group-hover:scale-105`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-semibold leading-none text-[#0D062D] sm:text-[26px]">{value}</p>
            <p className="mt-1 truncate text-[12px] text-gray-500 sm:text-[13px]">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NfcCardStats;
