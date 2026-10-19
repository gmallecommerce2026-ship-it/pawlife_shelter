'use client';

import React, { useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AdoptionApplication, RelatedApplication, KANBAN_COLUMNS } from '@/types/application';
import { Users, AlertTriangle, ChevronDown, Hash, Mars, Venus } from 'lucide-react';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { formatPetAge } from '@/utils/petAge';
import { getPetCode } from './PetIdBadge';
const PALETTE = ['#5982E6', '#E8590C', '#2F9E44', '#9C36B5', '#D6336C', '#0C8599', '#F08C00', '#6741D9'];
const INACTIVE = ['CLOSED', 'ADOPTION_COMPLETED'];

export const getApplicantId = (a: AdoptionApplication) => a.user?.id;

export const getApplicantColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

// Đơn đã đóng / đã nhận nuôi xong thì không cần cảnh báo
export const getRelated = (a: AdoptionApplication): RelatedApplication[] =>
  INACTIVE.includes(a.status) ? [] : a.relatedApplications ?? [];

// ---- Highlight các thẻ cùng người khi hover (không cần thư viện state) ----
let hoveredId: string | null = null;
const listeners = new Set<() => void>();
export const setHoveredApplicant = (id: string | null) => {
  if (hoveredId === id) return;
  hoveredId = id;
  listeners.forEach((l) => l());
};
export const useIsApplicantHighlighted = (id?: string) =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => !!id && hoveredId === id,
    () => false,
  );

// ---- Danh sách các đơn còn lại (dùng chung cho popover + banner) ----
const fmt = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
const statusLabel = (s: string) => KANBAN_COLUMNS.find((c) => c.status === s)?.label ?? s;

const RelatedRows: React.FC<{ related: RelatedApplication[] }> = ({ related }) => (
  <>
    {related.map((r) => (
      <div key={r.id} className="py-1.5 border-t border-gray-100 first:border-t-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-gray-900 truncate">{r.petName}</span>
          <span className="text-[11px] text-gray-500 shrink-0">{statusLabel(r.status)}</span>
        </div>
        {r.interview && (
          <p className="text-[11px] text-[#5A1B8D] mt-0.5">
            {r.interview.status === 'COMPLETED' ? 'Đã phỏng vấn' : 'Hẹn phỏng vấn'} {fmt(r.interview.at)}
            {r.interview.staff.length > 0 && ` · ${r.interview.staff.join(', ')}`}
          </p>
        )}
      </div>
    ))}
  </>
);

// ---- Badge trên thẻ Kanban ----
export const RelatedApplicationsBadge: React.FC<{ application: AdoptionApplication }> = ({ application }) => {
  const related = getRelated(application);
  const id = getApplicantId(application);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  if (related.length === 0 || !id) return null;
  const color = getApplicantColor(id);

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 292)) });
  };

  return (
    <div
      ref={ref}
      className="mb-2.5 w-fit max-w-full"
      onMouseEnter={open}
      onMouseLeave={() => setPos(null)}
      onPointerDown={() => setPos(null)}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-semibold"
        style={{ color, backgroundColor: `${color}15`, borderColor: `${color}40` }}
      >
        <Users size={12} strokeWidth={2} className="shrink-0" />
        <span className="truncate">Còn {related.length} đơn khác của người này</span>
      </div>
      {pos &&
        createPortal(
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
            className="w-[280px] bg-white rounded-[14px] shadow-xl border border-gray-100 p-3 pointer-events-none"
          >
            <p className="text-[11px] font-bold text-gray-500 mb-1">Cùng một người đăng ký</p>
            <RelatedRows related={related} />
          </div>,
          document.body,
        )}
    </div>
  );
};
// ---- Icon cảnh báo nhỏ đặt cạnh tên người đăng ký ----
export const RelatedApplicationsWarnIcon: React.FC<{
  application: AdoptionApplication;
  size?: number;
  className?: string;
}> = ({ application, size = 15, className = '' }) => {
  const related = getRelated(application);
  if (related.length === 0) return null;
  return (
    <span
      title={`Người này đang có ${related.length} đơn khác tại trạm`}
      className={`inline-flex shrink-0 text-[#B45309] ${className}`}
    >
      <AlertTriangle size={size} strokeWidth={2} />
    </span>
  );
};

// ---- Banner cảnh báo: nhúng vào các modal (đặt lịch phỏng vấn, duyệt đơn...) ----
export const RelatedApplicationsNotice: React.FC<{ application: AdoptionApplication; className?: string }> = ({
  application,
  className = 'mb-3',
}) => {
  const [open, setOpen] = useState(false);
  const related = getRelated(application);
  if (related.length === 0) return null;
  const hasInterview = related.some((r) => r.interview && r.interview.status !== 'COMPLETED');

  return (
    <div className={`rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#B45309]">
          <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
          Người này đang có {related.length} đơn khác tại trạm
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className={`shrink-0 text-[#B45309] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-1.5">
          <RelatedRows related={related} />
          <p className="text-[11px] text-[#92400E] mt-1.5">
            {hasInterview
              ? 'Đã có lịch phỏng vấn cho đơn khác — hãy phân công cùng nhân sự đó, tránh 2 người cùng phỏng vấn một ứng viên.'
              : 'Nên phân công một nhân sự phỏng vấn chung cho tất cả các đơn của người này.'}
          </p>
        </div>
      )}
    </div>
  );
};

// ---- ID thú cưng: giao diện giống dòng email ----
export const PetIdRow: React.FC<{ pet?: any; className?: string }> = ({
  pet,
  className = 'text-[13px] mb-1.5',
}) => {
  const code = getPetCode(pet);
  if (!code) return null;
  return (
    <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
      <Hash size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
      <span className="truncate">ID: {code}</span>
    </div>
  );
};

// ---- Nút mũi tên mở/thu gọn (thay PetIdBadge) ----
export const OtherPetsToggle: React.FC<{
  application: AdoptionApplication;
  open: boolean;
  onToggle: () => void;
  className?: string;
}> = ({ application, open, onToggle, className = '' }) => {
  const n = getRelated(application).length;
  if (n === 0) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      title={`${n} bé khác người này đang xin nhận nuôi`}
      className={`ml-auto shrink-0 flex items-center gap-1 rounded-full px-2 py-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer ${className}`}
    >
      <span className="text-[11px] font-semibold">+{n}</span>
      <ChevronDown
        size={16}
        strokeWidth={2.2}
        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );
};

// ---- Thẻ pet info của bé khác ----
const RelatedPetCard: React.FC<{ r: RelatedApplication }> = ({ r }) => {
  const pet = r.pet;
  const name = pet?.name ?? r.petName;
  const img = pet?.images?.[0]?.url;
  const code = getPetCode(pet);
  const sub = [
    pet?.dob ? formatPetAge(pet.dob) : '',
    pet?.breed ? formatBreed(pet.breed as MaybeBilingual) : '',
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="border border-gray-200/80 rounded-[14px] p-2.5 flex items-center gap-3 bg-white">
      {img ? (
        <img src={img} alt={name} className="w-11 h-11 rounded-[10px] object-cover shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-[10px] bg-gray-100 shrink-0" />
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[13.5px] text-gray-900 truncate">{name}</span>
          {pet?.gender &&
            (pet.gender === 'FEMALE' ? (
              <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
            ) : (
              <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />
            ))}
        </div>
        {/* {sub && <span className="text-[11.5px] text-gray-400 truncate">{sub}</span>} */}
        {code && <span className="text-[11px] text-gray-400 truncate">ID: {code}</span>}
      </div>
      <span className="text-[11px] text-gray-500 shrink-0">{statusLabel(r.status)}</span>
    </div>
  );
};

export const OtherPetsDropdown: React.FC<{
  application: AdoptionApplication;
  open: boolean;
  className?: string;
}> = ({ application, open, className = 'mt-2' }) => {
  const related = getRelated(application);
  if (!open || related.length === 0) return null;
  return (
    <div className={`flex flex-col gap-2 animate-in fade-in duration-150 ${className}`}>
      {related.map((r) => (
        <RelatedPetCard key={r.id} r={r} />
      ))}
    </div>
  );
};