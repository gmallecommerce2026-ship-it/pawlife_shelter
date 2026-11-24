'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Nfc, Link2Off, Loader2 } from 'lucide-react';
import { ShelterNfcCard, fmtDateTime, timeAgo } from '@/types/nfcCard';
import { listShelterNfcCards, unlinkShelterNfcCard } from '@/services/nfcShelterService';
import { apiErrorMessage } from '@/services/nfcPermissionService';
import { useNfcPermission } from '@/hooks/useNfcPermission';
import NfcStateBadge from '@/modules/shelter/nfc-cards/components/NfcStateBadge';

/**
 * Thẻ NFC gắn với pet, hiển thị trên trang chi tiết pet.
 * Gỡ thẻ dùng cùng endpoint với tab Thẻ NFC; cần quyền Gán thẻ (giống app).
 */
export const PetNfcTagCard = ({ petId }: { petId: string }) => {
  const { canLink } = useNfcPermission();
  const [card, setCard] = useState<ShelterNfcCard | null | undefined>(undefined); // undefined = đang tải
  const [confirming, setConfirming] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listShelterNfcCards();
      setCard(list.find((c) => c.petId === petId) ?? null);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không tải được thông tin thẻ NFC'));
      setCard(null);
    }
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  const doUnlink = async () => {
    if (!card) return;
    setUnlinking(true);
    try {
      await unlinkShelterNfcCard(card.id);
      toast.success('Đã gỡ thẻ khỏi pet');
      setConfirming(false);
      setCard(null);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không gỡ được thẻ'));
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EA] text-[#E89B5A]"><Nfc size={18} /></div>
        <h3 className="text-[15px] font-semibold text-[#0D062D]">Thẻ NFC</h3>
      </div>

      {card === undefined ? (
        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
      ) : card === null ? (
        <p className="text-[13px] leading-relaxed text-gray-500">
          Pet chưa gắn thẻ NFC. Gán thẻ bằng app PawLife.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[14px] tracking-wider text-gray-700">{card.code}</span>
            <NfcStateBadge state={card.state} />
          </div>
          <p className="text-[12px] text-gray-500">
            Gán lúc {fmtDateTime(card.linkedAt)} · {card.scanCount} lượt quét · quét gần nhất {timeAgo(card.lastScannedAt)}
          </p>

          {canLink && (confirming ? (
            <div className="space-y-2.5 rounded-xl bg-[#F7F7FA] p-3.5">
              <p className="text-[13px] leading-relaxed text-gray-600">
                Gỡ thẻ khỏi <b>{card.petName}</b>? Thẻ sẽ về kho và có thể gán lại cho pet khác.
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={unlinking} onClick={() => setConfirming(false)}
                  className="h-10 flex-1 rounded-full bg-white text-[13px] font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 disabled:opacity-50">Huỷ</button>
                <button type="button" disabled={unlinking} onClick={doUnlink}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[13px] font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                  {unlinking && <Loader2 size={15} className="animate-spin" />} Gỡ thẻ
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#F5F5F7] text-[13px] font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600">
              <Link2Off size={15} /> Gỡ thẻ khỏi pet
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PetNfcTagCard;
