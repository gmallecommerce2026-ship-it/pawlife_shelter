'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Nfc, ShieldCheck, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { NFC_STATE_META, NfcCardState, ShelterNfcCard, ShelterNfcStats } from '@/types/nfcCard';
import {
  ShelterNfcQuery, exportShelterNfcCsv, getShelterNfcStats, listShelterNfcCards,
} from '@/services/nfcShelterService';
import { apiErrorMessage } from '@/services/nfcPermissionService';
import { useSocket } from '@/contexts/SocketContext';
import NfcCardStats from './components/NfcCardStats';
import NfcCardTable from './components/NfcCardTable';
import NfcCardDetailDrawer from './components/NfcCardDetailDrawer';
import NfcPermissionsPanel from './components/NfcPermissionsPanel';
import MockRoleSwitcher from './components/MockRoleSwitcher';
import { NfcRoleBadge } from './components/NfcRoleBadge';
import { useNfcPermission } from '@/hooks/useNfcPermission';

type StateFilter = NfcCardState | 'ALL';
type SortKey = 'recent' | 'scans' | 'name';
const PAGE_SIZE = 20;

export const NfcCardsPage = () => {
  const [cards, setCards] = useState<ShelterNfcCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ShelterNfcStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [state, setState] = useState<StateFilter>('ALL');
  const [sort, setSort] = useState<SortKey>('recent');
  const [selected, setSelected] = useState<ShelterNfcCard | null>(null);
  const [tab, setTab] = useState<'cards' | 'access'>('cards');
  const [exporting, setExporting] = useState(false);
  const { perm, loading: permLoading, refresh: refreshPerm, canLink, canManage } = useNfcPermission();
  const socket = useSocket();
  // Bị thu hồi quyền quản lý khi đang ở tab Phân quyền -> quay về danh sách thẻ
  const activeTab = tab === 'access' && !canManage && !permLoading ? 'cards' : tab;

  // Tìm kiếm có debounce, đổi bộ lọc thì quay về trang 1
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, state, sort]);

  // API chỉ nhận lọc ACTIVE / DISABLED; UNASSIGNED không thuộc danh sách của shelter
  const apiState: ShelterNfcQuery['state'] = state === 'ACTIVE' || state === 'DISABLED' ? state : 'ALL';
  const query: ShelterNfcQuery = { page, pageSize: PAGE_SIZE, state: apiState, q: debouncedSearch, sort };

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([listShelterNfcCards(query), getShelterNfcStats()]);
      setCards(p.items);
      setTotal(p.total);
      setStats(s);
      setLoadError(null);
    } catch (e) {
      setLoadError(apiErrorMessage(e, 'Không tải được danh sách thẻ NFC'));
      setCards((cur) => cur ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, state, debouncedSearch, sort]);

  useEffect(() => { load(); }, [load]);

  // Giữ drawer đồng bộ với dữ liệu mới (ví dụ vừa vô hiệu hoá)
  useEffect(() => {
    if (!selected || !cards) return;
    const fresh = cards.find((c) => c.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: app gán / gỡ thẻ -> server báo -> tải lại
  useEffect(() => {
    if (!socket) return;
    const onChanged = () => { load(); };
    socket.on('nfc_tags_changed', onChanged);
    return () => { socket.off('nfc_tags_changed', onChanged); };
  }, [socket, load]);

  const list = cards ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const csv = await exportShelterNfcCsv({ state: apiState, q: debouncedSearch, sort });
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-nfc-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không xuất được CSV'));
    } finally {
      setExporting(false);
    }
  };

  const selectCls =
    'appearance-none bg-[#F5F5F7] lg:bg-white border border-transparent lg:border-[#858585] rounded-full h-11 pl-4 pr-9 text-[16px] lg:text-sm text-gray-700 font-medium focus:border-[#E89B5A] focus:outline-none cursor-pointer';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate font-['Be_Vietnam_Pro',_sans-serif] text-[28px] font-semibold leading-tight tracking-tight text-[#0D062D] sm:text-[40px]">
            Thẻ NFC
          </h2>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#FFF4EA] px-3 py-1 text-[13px] font-semibold text-[#E89B5A] sm:inline-flex">
            <Nfc size={14} /> {stats?.total ?? 0} thẻ đã gán
          </span>
          {!permLoading && <span className="hidden sm:inline-flex"><NfcRoleBadge isRoot={perm.isRoot} level={perm.level} /></span>}
          <div className="flex-1 lg:hidden" />
          <button type="button" aria-label="Thông báo" className="relative shrink-0 p-2 text-gray-400 lg:hidden">
            <Bell size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="hidden flex-1 lg:block" />

        {activeTab === 'cards' && (<>
        <div className="relative w-full lg:max-w-[360px] lg:flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên pet..."
            className="h-11 w-full rounded-full border border-transparent bg-[#F5F5F7] pl-10 pr-4 text-[16px] text-gray-800 transition-all placeholder:text-gray-400 focus:border-[#E89B5A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E89B5A]/20 lg:border-[#858585] lg:bg-white lg:text-sm"
          />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="relative shrink-0">
            <select value={state} onChange={(e) => setState(e.target.value as StateFilter)} className={selectCls}>
              <option value="ALL">Toàn bộ trạng thái</option>
              {(Object.keys(NFC_STATE_META) as NfcCardState[]).filter((k) => k !== 'UNASSIGNED').map((k) => (
                <option key={k} value={k}>{NFC_STATE_META[k].label}</option>
              ))}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
          <div className="relative shrink-0">
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
              <option value="recent">Mới gán nhất</option>
              <option value="scans">Quét nhiều nhất</option>
              <option value="name">Tên pet A–Z</option>
            </select>
            <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
          <button
            type="button" onClick={exportCsv} disabled={exporting} aria-label="Xuất CSV" title="Xuất CSV theo bộ lọc"
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#F5F5F7] px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 lg:bg-white lg:ring-1 lg:ring-[#858585]"
          >
            <Download size={16} /> <span className="hidden xl:inline">Xuất CSV</span>
          </button>
          <button
            type="button" onClick={load} aria-label="Tải lại"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-gray-600 hover:bg-gray-200 lg:bg-white lg:ring-1 lg:ring-[#858585]"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        </>)}
      </div>

      <MockRoleSwitcher perm={perm} onChanged={refreshPerm} />

      {/* Tabs — "Phân quyền" chỉ hiện với người được cấp/thu hồi quyền (giống app) */}
      {canManage && (
        <div className="mb-5 inline-flex rounded-full bg-[#F5F5F7] p-1">
          {([['cards', 'Thẻ đã gán', Nfc], ['access', 'Phân quyền', ShieldCheck]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-all ${activeTab === k ? 'bg-white text-[#0D062D] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'access' ? (
        <NfcPermissionsPanel perm={perm} onPermChanged={refreshPerm} />
      ) : (<>
      <NfcCardStats stats={stats} />

      {loadError && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-600">
          <span>{loadError}</span>
          <button type="button" onClick={load} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      {cards === null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4EA] text-[#E89B5A]"><Nfc size={26} /></div>
          <p className="font-medium text-gray-700">{debouncedSearch || state !== 'ALL' ? 'Không tìm thấy thẻ nào' : 'Chưa có thẻ NFC nào được gán'}</p>
          <p className="mt-1 text-sm text-gray-500">
            {debouncedSearch || state !== 'ALL' ? 'Thử đổi từ khoá hoặc bộ lọc trạng thái.' : 'Thẻ được gán cho pet của trạm từ app PawLife.'}
          </p>
        </div>
      ) : (
        <>
          <NfcCardTable cards={list} onSelect={setSelected} />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-[14px] text-gray-600">
              <span>{total.toLocaleString('vi-VN')} thẻ</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] disabled:opacity-40"><ChevronLeft size={16} /></button>
                <span>Trang {page}/{totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] disabled:opacity-40"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      <NfcCardDetailDrawer
        card={selected}
        canLink={canLink}
        canUnlink={canLink}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
      </>)}
    </div>
  );
};

export default NfcCardsPage;
