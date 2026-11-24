'use client';

import React from 'react';
import { ScanLine } from 'lucide-react';

/** Biểu đồ cột lượt quét 7 ngày, vẽ bằng CSS (không cần thư viện) */
export const NfcScanChart = ({ data, total }: { data: { date: string; count: number }[] | undefined; total: number }) => {
  const days = data ?? [];
  const max = Math.max(1, ...days.map((d) => d.count));
  const todayKey = days[days.length - 1]?.date;

  return (
    <div className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF5FF] text-[#A855F7]"><ScanLine size={16} /></div>
          <div>
            <p className="text-[14px] font-semibold text-[#0D062D]">Lượt quét 7 ngày</p>
            <p className="text-[12px] text-gray-500">Tổng {total.toLocaleString('vi-VN')} lượt</p>
          </div>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <div className="flex h-28 items-end gap-2.5">
          {days.map((d) => {
            const pct = Math.max(d.count > 0 ? 8 : 3, Math.round((d.count / max) * 100));
            const isToday = d.date === todayKey;
            const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' });
            return (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">{d.count}</span>
                <div className="flex h-20 w-full items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-[#E89B5A] to-[#F7B27A]' : 'bg-gradient-to-t from-[#E9E5F5] to-[#F3F0FA] group-hover:from-[#D8CFF0]'}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className={`text-[11px] capitalize ${isToday ? 'font-semibold text-[#E89B5A]' : 'text-gray-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NfcScanChart;
