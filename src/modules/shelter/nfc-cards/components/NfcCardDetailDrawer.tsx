'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { X, PawPrint, ScanLine, Calendar, Cpu, Clock, Link2Off, Loader2, User } from 'lucide-react';
import { ShelterNfcCard, fmtDateTime, timeAgo } from '@/types/nfcCard';
import { unlinkShelterNfcCard } from '@/services/nfcShelterService';
import { apiErrorMessage } from '@/services/nfcPermissionService';
import NfcCardVisual from './NfcCardVisual';
import NfcStateBadge from './NfcStateBadge';

const Row = ({ Icon, label, value }: { Icon: React.ElementType; label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F7] text-gray-500"><Icon size={16} /></div>
    <span className="text-[14px] text-gray-500">{label}</span>
    <span className="ml-auto text-right text-[14px] font-medium text-[#0D062D]">{value}</span>
  </div>
);

export const NfcCardDetailDrawer = ({
  card, onClose, onUnlinked, canUnlink = false,
}: {
  card: ShelterNfcCard | null;
  onClose: () => void;
  /** Gọi sau khi gỡ thẻ thành công để trang tải lại danh sách */
  onUnlinked: () => void | Promise<void>;
  canUnlink?: boolean;
}) => {
  const [confirming, setConfirming] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Đổi thẻ khác thì huỷ bước xác nhận cũ
  useEffect(() => { setConfirming(false); }, [card?.id]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !unlinking && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [card, onClose, unlinking]);

  if (!card || typeof document === 'undefined') return null;

  const doUnlink = async () => {
    setUnlinking(true);
    try {
      await unlinkShelterNfcCard(card.id);
      toast.success('Đã gỡ thẻ khỏi pet');
      await onUnlinked();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không gỡ được thẻ'));
    } finally {
      setUnlinking(false);
      setConfirming(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-in fade-in bg-[#0D062D]/40 backdrop-blur-[2px] duration-200" onClick={() => !unlinking && onClose()} />
      <aside className="relative flex max-h-[92dvh] w-full animate-in slide-in-from-bottom flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl duration-300 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[28px] sm:slide-in-from-right">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h3 className="text-[18px] font-semibold text-[#0D062D]">Chi tiết thẻ NFC</h3>
          <button type="button" onClick={onClose} disabled={unlinking} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <NfcCardVisual code={card.code} state={card.state} petName={card.petName} petImage={card.petImage} />

          <div className="mt-4 flex items-center justify-between">
            <NfcStateBadge state={card.state} />
            <span className="text-[12px] text-gray-400">Quét gần nhất: {timeAgo(card.lastScannedAt)}</span>
          </div>

          {card.petId && !card.isShelterPet && (
            <p className="mt-3 rounded-2xl bg-[#F7F7FA] px-4 py-3 text-[13px] leading-relaxed text-gray-600">
              Thẻ gắn với pet của khách hàng. Hồ sơ pet thuộc về khách, shelter chỉ xem được thông tin thẻ.
            </p>
          )}

          <div className="mt-3 divide-y divide-gray-100">
            <Row Icon={PawPrint} label="Pet" value={card.petName ? `${card.petName}${card.petBreed ? ` · ${card.petBreed}` : ''}` : 'Chưa gán'} />
            <Row Icon={ScanLine} label="Lượt quét" value={card.scanCount} />
            <Row Icon={Clock} label="Lần quét cuối" value={fmtDateTime(card.lastScannedAt)} />
            <Row Icon={Calendar} label="Ngày gán" value={fmtDateTime(card.linkedAt)} />
            <Row Icon={User} label="Người gán" value={card.linkedByName ?? '—'} />
            <Row Icon={Cpu} label="Loại chip" value={card.chipType} />
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          {confirming ? (
            <div className="space-y-3">
              <p className="text-[13px] leading-relaxed text-gray-600">
                Gỡ thẻ khỏi <b>{card.petName}</b>? Thẻ sẽ không còn liên kết với pet này. Lượt quét đã ghi nhận vẫn được giữ.
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={unlinking} onClick={() => setConfirming(false)}
                  className="h-11 flex-1 rounded-full bg-[#F5F5F7] text-[14px] font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50">Huỷ</button>
                <button type="button" disabled={unlinking} onClick={doUnlink}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[14px] font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                  {unlinking && <Loader2 size={16} className="animate-spin" />} Gỡ thẻ
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {card.petId && card.isShelterPet && (
                <Link href={`/shelter/pets/${card.petId}`}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white transition-colors hover:bg-[#D98744]">
                  <PawPrint size={16} /> Xem hồ sơ pet
                </Link>
              )}
              {card.petId && canUnlink && (
                <button type="button" onClick={() => setConfirming(true)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#F5F5F7] text-[14px] font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600">
                  <Link2Off size={16} /> Gỡ thẻ
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
};

export default NfcCardDetailDrawer;
