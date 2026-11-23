'use client';

import React from 'react';
import { Nfc, PawPrint } from 'lucide-react';
import { NfcCardState } from '@/types/nfcCard';

/** Hình thẻ NFC (kiểu thẻ vòng cổ) dùng ở drawer chi tiết */
export const NfcCardVisual = ({ code, state, petName }: { code: string; state: NfcCardState; petName?: string | null }) => {
  const off = state === 'DISABLED';
  const empty = state === 'UNASSIGNED';
  return (
    <div
      className={`relative w-full aspect-[1.7/1] rounded-[22px] overflow-hidden p-5 text-white shadow-[0_18px_40px_-12px_rgba(232,155,90,0.55)] transition-all ${
        off ? 'bg-gradient-to-br from-[#8d8b97] to-[#5d5b69] shadow-none grayscale-[.4]'
        : empty ? 'bg-gradient-to-br from-[#B9B7C6] to-[#8A879C] shadow-none'
        : 'bg-gradient-to-br from-[#F7B27A] via-[#E89B5A] to-[#D97A2B]'
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -left-8 -bottom-16 h-44 w-44 rounded-full bg-white/10" />
      <PawPrint className="pointer-events-none absolute right-5 bottom-4 text-white/15" size={96} strokeWidth={1.4} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-[0.18em] uppercase opacity-90">PawLife</span>
          <Nfc size={26} strokeWidth={1.8} className="opacity-90" />
        </div>
        <div>
          <p className="text-[12px] opacity-80">{petName ? 'Thẻ của bé' : 'Thẻ chưa gán'}</p>
          <p className="text-[22px] font-semibold leading-tight">{petName ?? '—'}</p>
          <p className="mt-1 font-mono text-[13px] tracking-[0.2em] opacity-90">{code}</p>
        </div>
      </div>
    </div>
  );
};

export default NfcCardVisual;
