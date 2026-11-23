'use client';

import React from 'react';
import Image from 'next/image';
import { PawPrint, ChevronRight, Dog, Cat } from 'lucide-react';
import { ShelterNfcCard, fmtDay, timeAgo } from '@/types/nfcCard';
import NfcStateBadge from './NfcStateBadge';

const COLS =
  'grid grid-cols-[minmax(220px,2fr)_minmax(130px,1fr)_minmax(140px,1fr)_minmax(110px,0.8fr)_minmax(130px,1fr)_minmax(150px,1fr)_32px] items-center gap-4';

const PetAvatar = ({ card, size }: { card: ShelterNfcCard; size: number }) => (
  <div style={{ width: size, height: size }} className="relative shrink-0 overflow-hidden rounded-full border border-gray-50 bg-gray-100">
    {card.petImage ? (
      <Image src={card.petImage} alt={card.petName ?? ''} fill sizes={`${size}px`} className="object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-gray-300">
        {card.petSpecies === 'CAT' ? <Cat size={size * 0.45} /> : card.petSpecies === 'DOG' ? <Dog size={size * 0.45} /> : <PawPrint size={size * 0.45} />}
      </div>
    )}
  </div>
);

export const NfcCardTable = ({ cards, onSelect }: { cards: ShelterNfcCard[]; onSelect: (c: ShelterNfcCard) => void }) => (
  <>
    {/* DESKTOP */}
    <div className="hidden w-full overflow-hidden rounded-[16px] border border-gray-200 bg-white md:block">
      <div className={`${COLS} border-b border-gray-200 bg-[#F9FAFB] px-6 py-4`}>
        {['Pet', 'Mã thẻ', 'Trạng thái', 'Lượt quét', 'Quét gần nhất', 'Ngày cấp'].map((h) => (
          <span key={h} className="text-[14px] font-medium text-gray-500">{h}</span>
        ))}
        <span />
      </div>
      {cards.map((c) => (
        <button
          type="button"
          key={c.id}
          onClick={() => onSelect(c)}
          className={`group ${COLS} w-full cursor-pointer border-b border-gray-100/80 px-6 py-4 text-left transition-colors last:border-0 hover:bg-[#FFF9F3]`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <PetAvatar card={c} size={48} />
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold text-gray-900">{c.petName ?? 'Chưa gán pet'}</p>
              <p className="truncate text-[13px] text-gray-500">{c.petBreed ?? c.chipType}</p>
            </div>
          </div>
          <span className="font-mono text-[14px] tracking-wider text-gray-700">{c.code}</span>
          <div><NfcStateBadge state={c.state} /></div>
          <span className="text-[15px] font-medium text-gray-700">{c.scanCount}</span>
          <span className="truncate text-[14px] text-gray-500">{timeAgo(c.lastScannedAt)}</span>
          <span className="truncate text-[14px] text-gray-500">{fmtDay(c.issuedAt)}</span>
          <ChevronRight size={18} className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#E89B5A]" />
        </button>
      ))}
    </div>

    {/* MOBILE */}
    <div className="flex flex-col gap-3 md:hidden">
      {cards.map((c) => (
        <button
          type="button"
          key={c.id}
          onClick={() => onSelect(c)}
          className="rounded-[20px] border border-gray-100 bg-white p-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all active:scale-[0.985] active:bg-gray-50"
        >
          <div className="flex items-center gap-3.5">
            <PetAvatar card={c} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-gray-900">{c.petName ?? 'Chưa gán pet'}</p>
              <p className="mt-0.5 font-mono text-[12px] tracking-wider text-gray-500">{c.code}</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-gray-300" />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <NfcStateBadge state={c.state} />
            <span className="text-[12px] text-gray-500">{c.scanCount} lượt quét · {timeAgo(c.lastScannedAt)}</span>
          </div>
        </button>
      ))}
    </div>
  </>
);

export default NfcCardTable;
