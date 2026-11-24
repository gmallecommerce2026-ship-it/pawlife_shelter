'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { X, PawPrint, ScanLine, Calendar, Cpu, Clock, Link2Off, Loader2, User, Power, History, MapPin, ListChecks } from 'lucide-react';
import { NFC_EVENT_META, SCAN_OUTCOME_LABEL, ShelterNfcCard, ShelterNfcEvent, ShelterNfcScan, fmtDateTime, timeAgo } from '@/types/nfcCard';
import { getShelterNfcEvents, getShelterNfcScans, setShelterNfcCardState, unlinkShelterNfcCard } from '@/services/nfcShelterService';
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
  card, onClose, onChanged, canLink = false, canUnlink = false,
}: {
  card: ShelterNfcCard | null;
  onClose: () => void;
  /** Gọi sau khi gỡ / đổi trạng thái thẻ để trang tải lại dữ liệu */
  onChanged: () => void | Promise<void>;
  canLink?: boolean;
  canUnlink?: boolean;
}) => {
  const [confirming, setConfirming] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [scans, setScans] = useState<ShelterNfcScan[] | null>(null);
  const [events, setEvents] = useState<ShelterNfcEvent[] | null>(null);

  // Đổi thẻ khác thì reset trạng thái cục bộ
  useEffect(() => { setConfirming(false); setScans(null); setEvents(null); }, [card?.id]);

  // Lịch sử quét: tải khi mở thẻ
  useEffect(() => {
    if (!card) return;
    let alive = true;
    getShelterNfcScans(card.id)
      .then((list) => { if (alive) setScans(list); })
      .catch(() => { if (alive) setScans([]); });
    return () => { alive = false; };
  }, [card?.id, card?.scanCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lịch sử thao tác: tải lại khi gán / gỡ / đổi trạng thái
  useEffect(() => {
    if (!card) return;
    let alive = true;
    getShelterNfcEvents(card.id)
      .then((list) => { if (alive) setEvents(list); })
      .catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, [card?.id, card?.state, card?.linkedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
      await onChanged();
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không gỡ được thẻ'));
    } finally {
      setUnlinking(false);
      setConfirming(false);
    }
  };

  const doToggle = async () => {
    const next = card.state === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    setToggling(true);
    try {
      await setShelterNfcCardState(card.id, next);
      toast.success(next === 'DISABLED' ? 'Đã vô hiệu hoá thẻ' : 'Đã kích hoạt lại thẻ');
      await onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không đổi được trạng thái thẻ'));
    } finally {
      setToggling(false);
    }
  };

  const disabled = card.state === 'DISABLED';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-in fade-in bg-[#0D062D]/40 backdrop-blur-[2px] duration-200" onClick={() => !unlinking && onClose()} />
      <aside className="relative flex max-h-[92dvh] w-full animate-in slide-in-from-bottom flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl duration-300 sm:max-h-none sm:w-[420px] sm:slide-in-from-right sm:rounded-none sm:[border-top-left-radius:28px] sm:[border-bottom-left-radius:28px]">
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

          <div className="mt-5">
            <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#0D062D]"><History size={15} /> Lịch sử quét gần đây</p>
            {scans === null ? (
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ) : scans.length === 0 ? (
              <p className="rounded-xl bg-[#F7F7FA] px-4 py-3 text-[13px] text-gray-500">Thẻ chưa được quét lần nào.</p>
            ) : (
              <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
                {scans.map((s, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                    <span className="text-gray-700">{SCAN_OUTCOME_LABEL[s.outcome]}</span>
                    <span className="flex items-center gap-3">
                      {s.latitude != null && s.longitude != null && (
                        <a href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] font-medium text-[#E89B5A] hover:underline">
                          <MapPin size={12} /> Bản đồ
                        </a>
                      )}
                      <span className="text-gray-400">{fmtDateTime(s.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#0D062D]"><ListChecks size={15} /> Lịch sử thao tác</p>
            {events === null ? (
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ) : events.length === 0 ? (
              <p className="rounded-xl bg-[#F7F7FA] px-4 py-3 text-[13px] text-gray-500">Chưa có thao tác nào được ghi lại.</p>
            ) : (
              <ol className="relative space-y-3 border-l border-gray-200 pl-5">
                {events.map((e, i) => {
                  const m = NFC_EVENT_META[e.type];
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white" style={{ background: m.dot }} />
                      <p className="text-[13px] font-semibold" style={{ color: m.color }}>{m.label}</p>
                      <p className="text-[12px] text-gray-500">
                        {e.actorName ?? 'Không rõ người thực hiện'} · {fmtDateTime(e.createdAt)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          {confirming ? (
            <div className="space-y-3">
              <p className="text-[13px] leading-relaxed text-gray-600">
                Gỡ thẻ khỏi <b>{card.petName}</b>? Thẻ sẽ về kho và có thể gán lại cho pet khác. Lịch sử quét vẫn được giữ.
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
            <div className="flex flex-col gap-2">
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
              {card.petId && canLink && card.state !== 'UNASSIGNED' && (
                <button type="button" disabled={toggling} onClick={doToggle}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold disabled:opacity-60 ${disabled ? 'bg-[#E8F9EE] text-[#00963D] hover:bg-[#d4f3e0]' : 'bg-[#FFE9E9] text-[#C23030] hover:bg-[#ffd9d9]'}`}>
                  {toggling ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  {disabled ? 'Kích hoạt lại thẻ' : 'Vô hiệu hoá thẻ (báo mất / bị sao chép)'}
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
