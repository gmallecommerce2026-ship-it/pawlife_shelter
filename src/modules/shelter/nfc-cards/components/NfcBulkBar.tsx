'use client';

import React from 'react';
import { Ban, Download, Loader2, Power, X } from 'lucide-react';

/** Thanh thao tác hàng loạt, hiện khi có thẻ được chọn */
export const NfcBulkBar = ({
  count, busy, canLink, onDisable, onEnable, onExport, onClear,
}: {
  count: number;
  busy: boolean;
  canLink: boolean;
  onDisable: () => void;
  onEnable: () => void;
  onExport: () => void;
  onClear: () => void;
}) => {
  if (count === 0) return null;
  const btn = 'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-50';
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#0D062D] p-2 pl-5 text-white shadow-[0_18px_50px_-12px_rgba(13,6,45,0.6)] animate-in slide-in-from-bottom duration-300">
      <span className="pr-2 text-[13px] font-semibold">Đã chọn {count}</span>
      {canLink && (
        <>
          <button type="button" disabled={busy} onClick={onDisable} className={`${btn} bg-white/10 text-[#FFB4B4] hover:bg-white/20`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Vô hiệu hoá
          </button>
          <button type="button" disabled={busy} onClick={onEnable} className={`${btn} bg-white/10 text-[#A7F3C4] hover:bg-white/20`}>
            <Power size={14} /> Kích hoạt
          </button>
        </>
      )}
      <button type="button" disabled={busy} onClick={onExport} className={`${btn} bg-white/10 hover:bg-white/20`}>
        <Download size={14} /> Xuất CSV
      </button>
      <button type="button" onClick={onClear} aria-label="Bỏ chọn" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};

export default NfcBulkBar;
