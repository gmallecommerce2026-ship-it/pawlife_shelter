'use client';

import React, { useRef, useState, useSyncExternalStore } from 'react';
import { Users, AlertTriangle, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AdoptionApplication, RelatedApplication, KANBAN_COLUMNS } from '@/types/application';

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
  const [open, setOpen] = useState(true);
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