'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, PawPrint, ScanLine, Calendar, User, Cpu, Clock, Link2Off } from 'lucide-react';
import { ShelterNfcCard, fmtDateTime, timeAgo } from '@/types/nfcCard';
import NfcCardVisual from './NfcCardVisual';
import NfcStateBadge from './NfcStateBadge';
import Link from 'next/link';

const Row = ({ Icon, label, value }: { Icon: React.ElementType; label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F7] text-gray-500"><Icon size={16} /></div>
    <span className="text-[14px] text-gray-500">{label}</span>
    <span className="ml-auto text-right text-[14px] font-medium text-[#0D062D]">{value}</span>
  </div>
);

export const NfcCardDetailDrawer = ({ card, onClose, canUnlink = false }: { card: ShelterNfcCard | null; onClose: () => void; canUnlink?: boolean }) => {
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [card, onClose]);

  if (!card || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-in fade-in bg-[#0D062D]/40 backdrop-blur-[2px] duration-200" onClick={onClose} />
      <aside className="relative flex max-h-[92dvh] w-full animate-in slide-in-from-bottom flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl duration-300 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[28px] sm:slide-in-from-right">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h3 className="text-[18px] font-semibold text-[#0D062D]">Chi tiết thẻ NFC</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <NfcCardVisual code={card.code} state={card.state} petName={card.petName} />

          <div className="mt-4 flex items-center justify-between">
            <NfcStateBadge state={card.state} />
            <span className="text-[12px] text-gray-400">Quét gần nhất: {timeAgo(card.lastScannedAt)}</span>
          </div>

          <div className="mt-3 divide-y divide-gray-100">
            <Row Icon={PawPrint} label="Pet" value={card.petName ? `${card.petName}${card.petBreed ? ` · ${card.petBreed}` : ''}` : 'Chưa gán'} />
            <Row Icon={ScanLine} label="Lượt quét" value={card.scanCount} />
            <Row Icon={Clock} label="Lần quét cuối" value={fmtDateTime(card.lastScannedAt)} />
            <Row Icon={Calendar} label="Ngày cấp" value={fmtDateTime(card.issuedAt)} />
            <Row Icon={User} label="Người cấp" value={card.issuedBy} />
            <Row Icon={Cpu} label="Loại chip" value={card.chipType} />
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          {card.petId && (
            <Link
              href={`/shelter/pets/${card.petId}`}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white transition-colors hover:bg-[#D98744]"
            >
              <PawPrint size={16} /> Xem hồ sơ pet
            </Link>
          )}
          {card.petId && canUnlink && (
          <button
            type="button"
            disabled
            title="Sắp có — cần API"
            className="flex h-11 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#F5F5F7] text-[14px] font-semibold text-gray-400"
          >
            <Link2Off size={16} /> Gỡ thẻ
          </button>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
};

export default NfcCardDetailDrawer;
