'use client';

import React, { useEffect, useRef } from 'react';
import { FiSearch, FiChevronDown, FiX } from 'react-icons/fi';
import { Download, RefreshCw } from 'lucide-react';
import { ShelterNfcStats } from '@/types/nfcCard';

export type StateFilter = 'ALL' | 'ACTIVE' | 'DISABLED';
export type SortKey = 'recent' | 'scans' | 'name';

/** Một kiểu duy nhất cho mọi control: cùng chiều cao, viền, bo tròn và trạng thái hover/focus */
const CONTROL =
  'h-11 rounded-full border border-gray-300 bg-white text-[14px] font-medium text-gray-700 shadow-sm ' +
  'transition-all hover:border-[#E89B5A] hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E89B5A]/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const NfcToolbar = ({
  search, onSearch, state, onState, sort, onSort,
  onExport, exporting, onRefresh, loading, stats, live,
}: {
  search: string;
  onSearch: (v: string) => void;
  state: StateFilter;
  onState: (v: StateFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  onExport: () => void;
  exporting: boolean;
  onRefresh: () => void;
  loading: boolean;
  stats: ShelterNfcStats | null;
  /** Socket đang kết nối: danh sách sẽ tự cập nhật khi app gán / gỡ thẻ */
  live: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Phím "/" để focus tìm kiếm (bỏ qua khi đang gõ ở ô khác)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const tabs: { key: StateFilter; label: string; count?: number; dot?: string }[] = [
    { key: 'ALL', label: 'Tất cả', count: stats?.total },
    { key: 'ACTIVE', label: 'Đang hoạt động', count: stats?.active, dot: '#00AC47' },
    { key: 'DISABLED', label: 'Đã vô hiệu', count: stats?.disabled, dot: '#F46767' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Tìm kiếm chiếm phần còn lại, không bao giờ bị co */}
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm theo tên pet…"
            className={`${CONTROL} w-full pl-11 pr-16 placeholder:text-gray-400 focus:border-[#E89B5A]`}
          />
          {search ? (
            <button type="button" aria-label="Xoá tìm kiếm" onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <FiX size={14} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 text-[11px] text-gray-400">/</kbd>
          )}
        </div>

        <div className="relative shrink-0">
          <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className={`${CONTROL} appearance-none pl-4 pr-10 cursor-pointer`}>
            <option value="recent">Mới gán nhất</option>
            <option value="scans">Quét nhiều nhất</option>
            <option value="name">Tên pet A–Z</option>
          </select>
          <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        </div>

        <button type="button" onClick={onExport} disabled={exporting} title="Xuất CSV theo bộ lọc hiện tại"
          className={`${CONTROL} flex shrink-0 items-center gap-2 px-4`}>
          <Download size={16} /> Xuất CSV
        </button>

        <button type="button" onClick={onRefresh} disabled={loading} aria-label="Tải lại" title="Tải lại"
          className={`${CONTROL} flex w-11 shrink-0 items-center justify-center p-0`}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Lọc trạng thái dạng tab có số đếm */}
        <div role="tablist" className="inline-flex rounded-full bg-[#F5F5F7] p-1">
          {tabs.map((t) => {
            const on = state === t.key;
            return (
              <button key={t.key} role="tab" aria-selected={on} type="button" onClick={() => onState(t.key)}
                className={`flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-all ${on ? 'bg-white text-[#0D062D] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {t.dot && <span className="h-2 w-2 rounded-full" style={{ background: t.dot }} />}
                {t.label}
                {t.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${on ? 'bg-[#FFF4EA] text-[#E89B5A]' : 'bg-white text-gray-500'}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <span className="flex items-center gap-2 text-[12px] text-gray-500">
          <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-emerald-500' : 'bg-gray-300'}`} />
          {live ? 'Cập nhật trực tiếp' : 'Không kết nối realtime'}
        </span>
      </div>
    </div>
  );
};

export default NfcToolbar;
