'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Nfc, ShieldCheck, ChevronLeft, ChevronRight, Download, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ShelterNfcCard, ShelterNfcStats } from '@/types/nfcCard';
import {
  ShelterNfcQuery, exportShelterNfcCsv, getShelterNfcStats, listShelterNfcCards, setShelterNfcCardState,
} from '@/services/nfcShelterService';
import { apiErrorMessage } from '@/services/nfcPermissionService';
import { useSocket } from '@/contexts/SocketContext';
import NfcCardStats from './components/NfcCardStats';
import NfcScanChart from './components/NfcScanChart';
import NfcToolbar, { StateFilter, SortKey } from './components/NfcToolbar';
import NfcCardTable from './components/NfcCardTable';
import NfcCardDetailDrawer from './components/NfcCardDetailDrawer';
import NfcBulkBar from './components/NfcBulkBar';
import NfcPermissionsPanel from './components/NfcPermissionsPanel';
import MockRoleSwitcher from './components/MockRoleSwitcher';
import { NfcRoleBadge } from './components/NfcRoleBadge';
import { useNfcPermission } from '@/hooks/useNfcPermission';

const PAGE_SIZE = 20;

const downloadCsv = (csv: string, name: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [tab, setTab] = useState<'cards' | 'access'>('cards');
  const [exporting, setExporting] = useState(false);
  const { perm, loading: permLoading, refresh: refreshPerm, canLink, canManage } = useNfcPermission();
  const socket = useSocket();
  // Bị thu hồi quyền quản lý khi đang ở tab Phân quyền -> quay về danh sách thẻ
  const activeTab = tab === 'access' && !canManage && !permLoading ? 'cards' : tab;

  // Tìm kiếm có debounce; đổi bộ lọc thì về trang 1 và bỏ chọn
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, state, sort]);
  useEffect(() => { setSelectedIds(new Set()); }, [page, debouncedSearch, state, sort]);

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

  // Realtime: app gán / gỡ thẻ -> server báo -> tải lại
  useEffect(() => {
    if (!socket) return;
    const onChanged = () => { load(); };
    socket.on('nfc_tags_changed', onChanged);
    return () => { socket.off('nfc_tags_changed', onChanged); };
  }, [socket, load]);

  // Giữ drawer đồng bộ với dữ liệu mới (ví dụ vừa vô hiệu hoá)
  useEffect(() => {
    if (!selected || !cards) return;
    const fresh = cards.find((c) => c.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = cards ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const index = selected ? list.findIndex((c) => c.id === selected.id) : -1;
  const goPrev = useCallback(() => { if (index > 0) setSelected(list[index - 1]); }, [index, list]);
  const goNext = useCallback(() => { if (index >= 0 && index < list.length - 1) setSelected(list[index + 1]); }, [index, list]);

  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? new Set(list.map((c) => c.id)) : new Set());

  const exportAll = async () => {
    setExporting(true);
    try {
      downloadCsv(await exportShelterNfcCsv({ state: apiState, q: debouncedSearch, sort }), `the-nfc-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không xuất được CSV'));
    } finally {
      setExporting(false);
    }
  };

  const exportSelected = async () => {
    try {
      downloadCsv(await exportShelterNfcCsv({ ids: [...selectedIds] }), `the-nfc-da-chon-${selectedIds.size}.csv`);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Không xuất được CSV'));
    }
  };

  const bulkSetState = async (next: 'ACTIVE' | 'DISABLED') => {
    const ids = [...selectedIds];
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => setShelterNfcCardState(id, next)));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      if (failed === 0) toast.success(`Đã ${next === 'DISABLED' ? 'vô hiệu hoá' : 'kích hoạt'} ${ok} thẻ`);
      else toast.error(`${ok} thẻ thành công, ${failed} thẻ lỗi`);
      setSelectedIds(new Set());
      await load();
    } finally {
      setBulkBusy(false);
    }
  };

  const showCards = activeTab === 'cards';

  return (
    <div className="w-full pb-24">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3 sm:mb-6">
        <h2 className="truncate font-['Be_Vietnam_Pro',_sans-serif] text-[28px] font-semibold leading-tight tracking-tight text-[#0D062D] sm:text-[40px]">
          Thẻ NFC
        </h2>
        <span className="hidden items-center gap-1.5 rounded-full bg-[#FFF4EA] px-3 py-1 text-[13px] font-semibold text-[#E89B5A] sm:inline-flex">
          <Nfc size={14} /> {(stats?.total ?? 0).toLocaleString('vi-VN')} thẻ đã gán
        </span>
        {!permLoading && <span className="hidden sm:inline-flex"><NfcRoleBadge isRoot={perm.isRoot} level={perm.level} /></span>}
        <div className="flex-1" />
        <button type="button" aria-label="Thông báo" className="relative shrink-0 p-2 text-gray-400 lg:hidden">
          <Bell size={22} strokeWidth={1.8} />
        </button>
      </div>

      {showCards && (
        <div className="mb-5 grid gap-3 lg:grid-cols-3 lg:gap-4">
          <div className="lg:col-span-2">
            <NfcCardStats stats={stats} />
          </div>
          <div className="lg:col-span-2 lg:row-start-2">
            <NfcScanChart data={stats?.scansByDay} total={stats?.scans7d ?? 0} />
          </div>
          <div className="flex flex-col justify-between rounded-[18px] border border-gray-100 bg-gradient-to-br from-[#FFF9F3] to-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] lg:col-start-3 lg:row-span-2 lg:row-start-1">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EA] text-[#E89B5A]"><Sparkles size={16} /></div>
                <p className="text-[14px] font-semibold text-[#0D062D]">Thao tác nhanh</p>
              </div>
              <p className="text-[12px] leading-relaxed text-gray-500">
                Chọn nhiều thẻ để vô hiệu hoá hàng loạt. Dùng phím <kbd className="rounded border px-1">/</kbd> để tìm kiếm và <kbd className="rounded border px-1">←</kbd> <kbd className="rounded border px-1">→</kbd> để chuyển thẻ.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={exportAll} disabled={exporting}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0D062D] text-[12px] font-semibold text-white hover:bg-[#1f1550] disabled:opacity-50">
                <Download size={14} /> Xuất CSV
              </button>
              <button type="button" onClick={load}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:border-[#E89B5A]">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCards && (
        <div className="mb-5">
          <NfcToolbar
            search={search} onSearch={setSearch}
            state={state} onState={setState}
            sort={sort} onSort={setSort}
            onExport={exportAll} exporting={exporting}
            onRefresh={load} loading={cards === null}
            stats={stats} live={!!socket?.connected}
          />
        </div>
      )}

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
          <p className="mb-3 text-[13px] text-gray-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} trong {total.toLocaleString('vi-VN')} thẻ
          </p>
          <NfcCardTable
            cards={list} onSelect={setSelected}
            selected={selectedIds} onToggle={toggleOne} onToggleAll={toggleAll}
          />
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

      <NfcBulkBar
        count={selectedIds.size}
        busy={bulkBusy}
        canLink={canLink}
        onDisable={() => bulkSetState('DISABLED')}
        onEnable={() => bulkSetState('ACTIVE')}
        onExport={exportSelected}
        onClear={() => setSelectedIds(new Set())}
      />

      <NfcCardDetailDrawer
        card={selected}
        canLink={canLink}
        canUnlink={canLink}
        onClose={() => setSelected(null)}
        onChanged={load}
        onPrev={index > 0 ? goPrev : undefined}
        onNext={index >= 0 && index < list.length - 1 ? goNext : undefined}
        position={index >= 0 ? `${index + 1} / ${list.length}` : undefined}
      />
      </>)}
    </div>
  );
};

export default NfcCardsPage;
