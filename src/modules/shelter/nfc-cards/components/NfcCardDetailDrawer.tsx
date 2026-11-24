'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  X, PawPrint, ScanLine, Calendar, Cpu, Clock, Link2Off, Loader2, User, Power, History, ListChecks,
  ChevronLeft, ChevronRight, Copy, Printer,
} from 'lucide-react';
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

const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => (
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]
));

/** Mở cửa sổ in thẻ với cùng bố cục thẻ mẫu của app */
const printCard = (card: ShelterNfcCard) => {
  const w = window.open('', '_blank', 'width=460,height=700');
  if (!w) { toast.error('Trình duyệt đang chặn cửa sổ in'); return; }
  const off = card.state === 'DISABLED';
  const petImg = `${window.location.origin}/images/nfc/nfc-pet.png`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(card.code)}</title><style>
    @page { size: auto; margin: 14mm; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; margin: 0; padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 14px; color: #0D062D; }
    .card { width: 200px; height: 319px; border-radius: 24px; position: relative; overflow: hidden; background: linear-gradient(160deg, #F0A862 0%, #F3B873 50%, #F6C78C 100%); box-shadow: 0 12px 20px rgba(195,102,22,.35), inset 0 0 0 .6px #fff; }
    .off .card { background: linear-gradient(160deg, #A3A1AD 0%, #8E8C99 50%, #B9B7C4 100%); box-shadow: none; }
    .halo { position: absolute; left: 50%; top: 45%; width: 106px; height: 106px; margin: -53px 0 0 -53px; border-radius: 50%; background: rgba(255,236,205,.3); box-shadow: 0 0 36px 10px rgba(255,236,205,.45); }
    .pet { position: absolute; left: 50%; top: 45%; width: 106px; height: 106px; margin: -53px 0 0 -53px; object-fit: contain; }
    .brand { position: absolute; left: 0; right: 0; bottom: 44px; text-align: center; color: rgba(255,246,230,.96); letter-spacing: .27em; font-weight: 300; font-size: 16px; }
    .line { position: absolute; left: 50%; bottom: 36px; width: 20px; height: 1px; margin-left: -10px; background: rgba(255,246,230,.75); }
    .meta { text-align: center; }
    .name { font-size: 18px; font-weight: 600; }
    .code { margin-top: 4px; font-family: ui-monospace, Menlo, monospace; letter-spacing: .2em; font-size: 14px; }
    .state { margin-top: 6px; font-size: 12px; color: #6B6880; }
  </style></head><body class="${off ? 'off' : ''}">
    <div class="card"><div class="halo"></div><img class="pet" src="${petImg}" alt="" /><div class="brand">PawLife</div><div class="line"></div></div>
    <div class="meta"><div class="name">${escapeHtml(card.petName ?? 'Chưa gán pet')}</div><div class="code">${escapeHtml(card.code)}</div>
    <div class="state">${off ? 'Thẻ đã vô hiệu hoá' : 'Thẻ đang hoạt động'}</div></div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
};

export const NfcCardDetailDrawer = ({
  card, onClose, onChanged, canLink = false, canUnlink = false, onPrev, onNext, position,
}: {
  card: ShelterNfcCard | null;
  onClose: () => void;
  /** Gọi sau khi gỡ / đổi trạng thái thẻ để trang tải lại dữ liệu */
  onChanged: () => void | Promise<void>;
  canLink?: boolean;
  canUnlink?: boolean;
  /** Điều hướng sang thẻ trước / sau trong danh sách hiện tại */
  onPrev?: () => void;
  onNext?: () => void;
  /** Vị trí hiển thị, ví dụ "3 / 20" */
  position?: string;
}) => {
  const [confirming, setConfirming] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [scans, setScans] = useState<ShelterNfcScan[] | null>(null);
  const [events, setEvents] = useState<ShelterNfcEvent[] | null>(null);

  // Đổi thẻ khác thì reset trạng thái cục bộ
  useEffect(() => { setConfirming(false); setScans(null); setEvents(null); }, [card?.id]);

  // Lịch sử quét: tải lại khi có lượt quét mới
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

  // Esc đóng, ← → chuyển thẻ (bỏ qua khi đang gõ)
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === 'Escape' && !unlinking) onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [card, onClose, onPrev, onNext, unlinking]);

  if (!card || typeof document === 'undefined') return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(card.code);
      toast.success('Đã sao chép mã thẻ');
    } catch {
      toast.error('Không sao chép được mã thẻ');
    }
  };

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
          <div className="flex items-center gap-1">
            {onPrev && (
              <button type="button" onClick={onPrev} aria-label="Thẻ trước" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"><ChevronLeft size={18} /></button>
            )}
            {onNext && (
              <button type="button" onClick={onNext} aria-label="Thẻ sau" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"><ChevronRight size={18} /></button>
            )}
            {position && <span className="ml-1 text-[12px] text-gray-400">{position}</span>}
          </div>
          <div className="flex items-center gap-1">
            <h3 className="mr-2 text-[16px] font-semibold text-[#0D062D]">Chi tiết thẻ</h3>
            <button type="button" onClick={onClose} disabled={unlinking} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <NfcCardVisual code={card.code} state={card.state} petName={card.petName} petImage={card.petImage} />

          <div className="mt-4 flex items-center justify-between">
            <NfcStateBadge state={card.state} />
            <span className="text-[12px] text-gray-400">Quét gần nhất: {timeAgo(card.lastScannedAt)}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={copyCode}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-[#F5F5F7] text-[13px] font-semibold text-gray-700 hover:bg-gray-200">
              <Copy size={14} /> Sao chép mã
            </button>
            <button type="button" onClick={() => printCard(card)}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-[#F5F5F7] text-[13px] font-semibold text-gray-700 hover:bg-gray-200">
              <Printer size={14} /> In thẻ
            </button>
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
                    <span className="text-gray-400">{fmtDateTime(s.createdAt)}</span>
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
                      <p className="text-[12px] text-gray-500">{e.actorName ?? 'Không rõ người thực hiện'} · {fmtDateTime(e.createdAt)}</p>
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
