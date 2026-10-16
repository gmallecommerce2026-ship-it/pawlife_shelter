'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiExternalLink, FiPlus, FiRotateCcw, FiSearch, FiStar, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axiosClient from '@/lib/api/axiosClient';

type Species = 'DOG' | 'CAT';
type ColType = 'text' | 'suggest' | 'select' | 'readonly';
interface Col { key: string; header: string; width: number; type: ColType; options?: string[] }
interface Row { id: string; avatarUrl: string | null; apps: string; f: Record<string, string> }
interface Item { id: string; patch: Record<string, string> }
interface Cell { r: number; c: number }
interface LinkStatus { linked: boolean; url?: string; lastSyncedAt?: string | null; status?: string }

const BASE = '/shelter-dashboard/pet-sheet';
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const errMsg = (e: any) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m ?? e?.message ?? 'Có lỗi xảy ra';
};
const val = (r: Row, c: Col) => (c.key === 'apps' ? r.apps : r.f[c.key] ?? '');
const isPriority = (r: Row) => norm(r.f.extra ?? '').includes('uu tien');
const togglePriority = (extra: string) =>
  norm(extra).includes('uu tien')
    ? extra.replace(/ưu tiên/gi, '').replace(/^[\s·,;:-]+|[\s·,;:-]+$/g, '').trim()
    : `Ưu tiên${extra ? ` · ${extra}` : ''}`;
const isUnvacc = (r: Row) => { const n = norm(r.f.vacc ?? ''); return !n || n.includes('chua'); };

const STATUS_STYLE: Record<string, string> = {
  'Sẵn sàng nhận nuôi': 'bg-[#E5F7ED] text-[#16A34A]',
  'Chờ nhận nuôi': 'bg-[#FFF3E0] text-[#E89B5A]',
  'Foster': 'bg-purple-50 text-purple-600',
  'Từ chối': 'bg-red-50 text-red-500',
  'Vấn đề sức khỏe': 'bg-amber-50 text-amber-600',
  'Đã được nhận nuôi': 'bg-gray-100 text-gray-500',
};
const vaccStyle = (v: string) => {
  const n = norm(v);
  if (n.includes('chua tiem du')) return 'bg-amber-50 text-amber-600';
  if (n.includes('chua tiem')) return 'bg-red-50 text-red-500';
  if (n.includes('da tiem du')) return 'bg-[#E5F7ED] text-[#16A34A]';
  return 'bg-blue-50 text-blue-600';
};
const chip = 'px-2 py-0.5 rounded-full text-xs font-medium';

export const PetSheetEditor: React.FC = () => {
  const [species, setSpecies] = useState<Species>('DOG');
  const [cols, setCols] = useState<Col[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState({ DOG: 0, CAT: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fArea, setFArea] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [chips, setChips] = useState({ unspayed: false, unvacc: false, apps: false, priority: false });
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Cell | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(0);
  const [link, setLink] = useState<LinkStatus | null>(null);

  const rowsRef = useRef<Row[]>([]);
  rowsRef.current = rows;
  const spRef = useRef<Species>('DOG');
  const gridRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef(false);
  const pend = useRef(0);
  const rowPend = useRef(new Map<string, number>());
  const chain = useRef<Promise<void>>(Promise.resolve());
  const undoRef = useRef<Item[][]>([]);
  const focusNewRef = useRef<string | null>(null);

  // ───────────── Tải dữ liệu ─────────────
  const load = useCallback(async (sp: Species, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axiosClient.get(`${BASE}/grid`, { params: { species: sp } });
      if (sp !== spRef.current) return;
      if (silent && (pend.current > 0 || editingRef.current)) return;
      setCols(data.columns);
      setRows(data.rows);
      setCounts(data.counts);
    } catch (e) {
      if (!silent) toast.error(errMsg(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { spRef.current = species; load(species); }, [species, load]);

  useEffect(() => {
    const t = setInterval(() => load(spRef.current, true), 15000);
    const onFocus = () => load(spRef.current, true);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [load]);

  useEffect(() => {
    const get = () => axiosClient.get<LinkStatus>(`${BASE}/status`).then((r) => setLink(r.data)).catch(() => { });
    get();
    const t = setInterval(get, 30000);
    return () => clearInterval(t);
  }, []);

  // ───────────── Lưu (tối ưu: cập nhật ngay, gửi tuần tự) ─────────────
  const save = useCallback((items: Item[], undoable = true) => {
    const cur = new Map(rowsRef.current.map((r) => [r.id, r]));
    const valid = items.filter((it) => cur.has(it.id) && Object.keys(it.patch).length);
    if (!valid.length) return;
    const before: Item[] = valid.map((it) => {
      const row = cur.get(it.id)!;
      return { id: it.id, patch: Object.fromEntries(Object.keys(it.patch).map((k) => [k, row.f[k] ?? ''])) };
    });
    const patchMap = new Map(valid.map((it) => [it.id, it.patch]));
    setRows((rs) => rs.map((r) => (patchMap.has(r.id) ? { ...r, f: { ...r.f, ...patchMap.get(r.id) } } : r)));
    if (undoable) { undoRef.current.push(before); if (undoRef.current.length > 50) undoRef.current.shift(); }
    valid.forEach((it) => rowPend.current.set(it.id, (rowPend.current.get(it.id) ?? 0) + 1));
    pend.current++;
    setSaving(pend.current);

    chain.current = chain.current.then(async () => {
      let fresh: Row[] | null = null;
      try {
        const { data } = await axiosClient.post<{ rows: Row[] }>(`${BASE}/grid/batch`, { items: valid });
        fresh = data.rows;
      } catch (e) {
        toast.error(errMsg(e));
      }
      const freshMap = new Map((fresh ?? []).map((r) => [r.id, r]));
      const beforeMap = new Map(before.map((b) => [b.id, b.patch]));
      valid.forEach((it) => rowPend.current.set(it.id, (rowPend.current.get(it.id) ?? 1) - 1));
      setRows((rs) => rs.map((r) => {
        if ((rowPend.current.get(r.id) ?? 0) > 0) return r;
        const fr = freshMap.get(r.id);
        if (fr) return fr;
        if (!fresh && beforeMap.has(r.id)) return { ...r, f: { ...r.f, ...beforeMap.get(r.id) } };
        return r;
      }));
      pend.current--;
      setSaving(pend.current);
    });
  }, []);

  const undo = () => { const last = undoRef.current.pop(); if (last) save(last, false); };

  // ───────────── Lọc, sắp xếp, thống kê ─────────────
  const view = useMemo(() => {
    const nq = norm(q.trim());
    let list = rows.filter((r) => {
      if (nq && !norm(Object.values(r.f).join(' ')).includes(nq)) return false;
      if (fArea && r.f.area !== fArea) return false;
      if (fStatus && r.f.status !== fStatus) return false;
      if (chips.unspayed && r.f.spay !== 'Chưa triệt sản') return false;
      if (chips.unvacc && !isUnvacc(r)) return false;
      if (chips.apps && !r.apps) return false;
      if (chips.priority && !isPriority(r)) return false;
      return true;
    });
    if (sort) list = [...list].sort((a, b) => (a.f[sort.key] ?? '').localeCompare(b.f[sort.key] ?? '', 'vi', { numeric: true }) * sort.dir);
    return list;
  }, [rows, q, fArea, fStatus, chips, sort]);

  const stats = useMemo(() => ({
    total: rows.length,
    unspayed: rows.filter((r) => r.f.spay === 'Chưa triệt sản').length,
    unvacc: rows.filter(isUnvacc).length,
    ready: rows.filter((r) => r.f.status === 'Sẵn sàng nhận nuôi').length,
    foster: rows.filter((r) => r.f.status === 'Foster').length,
    adopted: rows.filter((r) => r.f.status === 'Đã được nhận nuôi').length,
    apps: rows.filter((r) => r.apps).length,
  }), [rows]);

  const areaOptions = useMemo(() => [...new Set(rows.map((r) => r.f.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [rows]);
  const statusOptions = cols.find((c) => c.key === 'status')?.options ?? [];
  const nameIdx = cols.findIndex((c) => c.key === 'name');

  // ───────────── Sửa ô ─────────────
  const startEdit = (initial?: string, at: Cell | null = active) => {
    if (!at) return;
    const row = view[at.r];
    const col = cols[at.c];
    if (!row || !col || col.type === 'readonly') return;
    setDraft(initial ?? val(row, col));
    editingRef.current = true;
    setEditing(true);
  };

  const move = (dr: number, dc: number) => {
    if (!view.length || !cols.length) return;
    setActive((a) => {
      const cur = a ?? { r: 0, c: 0 };
      return { r: Math.min(Math.max(cur.r + dr, 0), view.length - 1), c: Math.min(Math.max(cur.c + dc, 0), cols.length - 1) };
    });
  };

  const commit = (value: string, dir: 'down' | 'right' | 'left' | null, refocus = false) => {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);
    if (active) {
      const row = view[active.r];
      const col = cols[active.c];
      const v = value.trim();
      if (row && col && v !== val(row, col)) save([{ id: row.id, patch: { [col.key]: v } }]);
    }
    if (dir === 'down') move(1, 0);
    if (dir === 'right') move(0, 1);
    if (dir === 'left') move(0, -1);
    if (refocus) setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 0);
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (editing || e.target !== e.currentTarget) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    const col = active ? cols[active.c] : undefined;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(1, 0); return;
      case 'ArrowUp': e.preventDefault(); move(-1, 0); return;
      case 'ArrowLeft': e.preventDefault(); move(0, -1); return;
      case 'ArrowRight': e.preventDefault(); move(0, 1); return;
      case 'Tab': e.preventDefault(); move(0, e.shiftKey ? -1 : 1); return;
      case 'Enter': case 'F2': e.preventDefault(); startEdit(); return;
      case 'Delete': case 'Backspace':
        if (active && col && col.type !== 'readonly' && view[active.r]) {
          e.preventDefault();
          save([{ id: view[active.r].id, patch: { [col.key]: '' } }]);
        }
        return;
    }
    if (!mod && !e.altKey && e.key.length === 1 && col && col.type !== 'readonly' && col.type !== 'select') {
      e.preventDefault();
      startEdit(e.key);
    }
  };

  const onCopy = (e: React.ClipboardEvent) => {
    if (editing || !active || !view[active.r] || !cols[active.c]) return;
    e.clipboardData.setData('text/plain', val(view[active.r], cols[active.c]));
    e.preventDefault();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (editing || !active) return;
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    const items: Item[] = [];
    lines.forEach((line, i) => {
      const row = view[active.r + i];
      if (!row) return;
      const patch: Record<string, string> = {};
      line.split('\t').forEach((raw, j) => {
        const col = cols[active.c + j];
        if (!col || col.type === 'readonly') return;
        let v = raw.trim();
        if (col.type === 'select') {
          const hit = col.options?.find((o) => norm(o) === norm(v));
          if (!hit && v) return;
          v = hit ?? '';
        }
        patch[col.key] = v;
      });
      if (Object.keys(patch).length) items.push({ id: row.id, patch });
    });
    save(items);
    if (items.length) toast.success(`Đã dán vào ${items.length} dòng`);
  };

  useEffect(() => {
    if (!active) return;
    document.getElementById(`pc-${active.r}-${active.c}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  // Dòng mới: nhảy tới ô Tên và bắt đầu sửa
  useEffect(() => {
    if (!focusNewRef.current) return;
    const idx = view.findIndex((r) => r.id === focusNewRef.current);
    if (idx < 0 || nameIdx < 0) return;
    focusNewRef.current = null;
    const at = { r: idx, c: nameIdx };
    setActive(at);
    startEdit(undefined, at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ───────────── Hành động ─────────────
  const switchSpecies = (sp: Species) => {
    if (sp === species) return;
    setSpecies(sp); setSel(new Set()); setActive(null); setEditing(false); editingRef.current = false;
    setFArea(''); setFStatus(''); setQ(''); setSort(null);
    setChips({ unspayed: false, unvacc: false, apps: false, priority: false });
    undoRef.current = [];
  };

  const addRow = async () => {
    try {
      const { data } = await axiosClient.post<Row>(`${BASE}/grid`, { species });
      setQ(''); setFArea(''); setFStatus(''); setSort(null);
      setChips({ unspayed: false, unvacc: false, apps: false, priority: false });
      focusNewRef.current = data.id;
      setRows((r) => [...r, data]);
      setCounts((c) => ({ ...c, [species]: c[species] + 1 }));
    } catch (e) { toast.error(errMsg(e)); }
  };

  const del = async (row: Row) => {
    if (!window.confirm(`Xoá "${row.f.name || row.f.id}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await axiosClient.delete(`${BASE}/grid/${row.id}`);
      setRows((r) => r.filter((x) => x.id !== row.id));
      setCounts((c) => ({ ...c, [species]: c[species] - 1 }));
      setSel((s) => { const n = new Set(s); n.delete(row.id); return n; });
    } catch (e) { toast.error(errMsg(e)); }
  };

  const bulkSet = (patch: Record<string, string>) => { save([...sel].map((id) => ({ id, patch }))); };
  const allSelected = view.length > 0 && view.every((r) => sel.has(r.id));
  const hasFilter = !!(q || fArea || fStatus || Object.values(chips).some(Boolean));
  const totalWidth = 150 + cols.reduce((s, c) => s + c.width * 7 + 16, 0) + 72;

  const display = (col: Col, row: Row) => {
    const v = val(row, col);
    if (col.key === 'status' && v) return <span className={`${chip} ${STATUS_STYLE[v] ?? 'bg-gray-100 text-gray-500'}`}>{v}</span>;
    if (col.key === 'vacc' && v) return <span className={`${chip} ${vaccStyle(v)}`}>{v}</span>;
    if (col.key === 'spay') return <span className={v === 'Đã triệt sản' ? 'text-[#16A34A]' : 'text-gray-400'}>{v}</span>;
    if (col.key === 'apps') return v ? <span className={`${chip} bg-[#FFF3E0] text-[#E89B5A]`}>{v}</span> : null;
    return <span title={v}>{v}</span>;
  };

  const chipBtn = (k: keyof typeof chips, label: string) => (
    <button key={k} type="button" onClick={() => setChips((c) => ({ ...c, [k]: !c[k] }))}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${chips[k] ? 'bg-[#E89B5A] text-white border-[#E89B5A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#E89B5A]'}`}>
      {label}
    </button>
  );
  const selCls = 'bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-[#E89B5A]';

  return (
    <div className="w-full">
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link href="/shelter/pets" className="p-2 text-gray-400 hover:text-gray-700"><FiArrowLeft size={18} /></Link>
        <h2 className="text-[32px] text-[#0D062D] font-semibold tracking-tight">Bảng hồ sơ pet</h2>
        <div className="flex bg-[#FFF4EA] rounded-full p-1">
          {(['DOG', 'CAT'] as Species[]).map((sp) => (
            <button key={sp} type="button" onClick={() => switchSpecies(sp)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${species === sp ? 'bg-[#E89B5A] text-white' : 'text-[#FFBA7F]'}`}>
              {sp === 'DOG' ? 'Chó' : 'Mèo'} ({counts[sp]})
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className={`text-xs ${saving ? 'text-[#E89B5A]' : 'text-gray-400'}`}>{saving ? 'Đang lưu...' : 'Đã lưu tự động'}</span>
        <button type="button" onClick={undo} title="Hoàn tác (Ctrl+Z)" className="p-2 text-gray-400 hover:text-gray-700"><FiRotateCcw size={16} /></button>
        {link?.linked && link.url ? (
          <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-[#E89B5A] hover:underline">
            <FiExternalLink size={13} /> Google Sheet{link.lastSyncedAt ? ` • ${new Date(link.lastSyncedAt).toLocaleTimeString('vi-VN')}` : ''}
          </a>
        ) : link ? (
          <span className="text-xs text-gray-400">Chưa liên kết Google Sheet</span>
        ) : null}
      </div>

      {/* Thống kê */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {[
          ['Tổng', stats.total, 'bg-gray-100 text-gray-600'],
          ['Sẵn sàng nhận nuôi', stats.ready, 'bg-[#E5F7ED] text-[#16A34A]'],
          ['Foster', stats.foster, 'bg-purple-50 text-purple-600'],
          ['Đã nhận nuôi', stats.adopted, 'bg-gray-100 text-gray-500'],
          ['Chưa triệt sản', stats.unspayed, 'bg-amber-50 text-amber-600'],
          ['Chưa tiêm đủ', stats.unvacc, 'bg-red-50 text-red-500'],
          ['Có đơn xử lý', stats.apps, 'bg-[#FFF3E0] text-[#E89B5A]'],
        ].map(([l, n, c]) => (
          <span key={String(l)} className={`px-3 py-1 rounded-full font-medium ${c}`}>{l}: {n}</span>
        ))}
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative min-w-[240px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo ID, tên, giống, khu, ghi chú..."
            className="w-full border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:border-[#E89B5A] focus:outline-none" />
        </div>
        <select value={fArea} onChange={(e) => setFArea(e.target.value)} className={selCls}>
          <option value="">Tất cả khu</option>
          {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selCls}>
          <option value="">Mọi tình trạng</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {chipBtn('unspayed', 'Chưa triệt sản')}
        {chipBtn('unvacc', 'Chưa tiêm đủ')}
        {chipBtn('priority', '⭐ Ưu tiên')}
        {chipBtn('apps', 'Có đơn nhận nuôi')}
        {hasFilter && (
          <button type="button" onClick={() => { setQ(''); setFArea(''); setFStatus(''); setChips({ unspayed: false, unvacc: false, apps: false, priority: false }); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"><FiX size={12} /> Xoá lọc</button>
        )}
        <div className="flex-1" />
        <button type="button" onClick={addRow}
          className="flex items-center gap-1.5 bg-[#FFF4EA] hover:bg-[#FFEBD6] text-[#FFBA7F] text-sm font-semibold px-4 py-2 rounded-full">
          <FiPlus size={14} /> Thêm dòng
        </button>
      </div>

      {/* Thao tác hàng loạt */}
      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-[#FFF9F2] border border-[#F8D2B0] rounded-2xl px-4 py-2">
          <span className="text-sm font-medium text-[#E89B5A]">Đã chọn {sel.size} dòng</span>
          {([['status', 'Đặt tình trạng…'], ['area', 'Đặt khu…'], ['spay', 'Đặt triệt sản…'], ['vacc', 'Đặt tiêm phòng…']] as const).map(([k, label]) => {
            const col = cols.find((c) => c.key === k);
            if (!col?.options) return null;
            return (
              <select key={k} value="" onChange={(e) => e.target.value && bulkSet({ [k]: e.target.value })} className={selCls}>
                <option value="">{label}</option>
                {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            );
          })}
          <button type="button" onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-800 ml-auto">Bỏ chọn</button>
        </div>
      )}

      {/* Bảng */}
      {loading ? (
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div ref={gridRef} tabIndex={0} onKeyDown={onGridKeyDown} onCopy={onCopy} onPaste={onPaste}
          className="outline-none overflow-auto max-h-[calc(100vh-330px)] border border-gray-200 rounded-2xl bg-white">
          <table className="border-separate border-spacing-0 text-sm" style={{ tableLayout: 'fixed', width: totalWidth }}>
            <colgroup>
              <col style={{ width: 150 }} />
              {cols.map((c) => <col key={c.key} style={{ width: c.width * 7 + 16 }} />)}
              <col style={{ width: 72 }} />
            </colgroup>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-[#F9FAFB] border-b border-r border-gray-200 h-10 px-2 text-left">
                  <input type="checkbox" checked={allSelected} onChange={() => setSel(allSelected ? new Set() : new Set(view.map((r) => r.id)))} />
                </th>
                {cols.map((c) => (
                  <th key={c.key} onClick={() => c.type !== 'readonly' && setSort((s) => (s?.key !== c.key ? { key: c.key, dir: 1 } : s.dir === 1 ? { key: c.key, dir: -1 } : null))}
                    className="sticky top-0 z-10 bg-[#F9FAFB] border-b border-r border-gray-200 h-10 px-2 text-left text-[13px] font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">{c.header}
                      {sort?.key === c.key && (sort.dir === 1 ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />)}
                    </span>
                  </th>
                ))}
                <th className="sticky top-0 z-10 bg-[#F9FAFB] border-b border-gray-200 h-10" />
              </tr>
            </thead>
            <tbody>
              {view.map((row, r) => {
                const bg = sel.has(row.id) ? 'bg-[#FFF9F2]' : 'bg-white';
                const star = isPriority(row);
                return (
                  <tr key={row.id} className={`group ${bg}`}>
                    <td className={`sticky left-0 z-[5] ${bg} border-b border-r border-gray-100 h-10 px-2`}>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={sel.has(row.id)}
                          onChange={() => setSel((s) => { const n = new Set(s); n.has(row.id) ? n.delete(row.id) : n.add(row.id); return n; })} />
                        <span className="text-xs text-gray-400 w-6 text-right">{r + 1}</span>
                        {row.avatarUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={row.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          : <span className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />}
                        <button type="button" title="Đánh dấu ưu tiên"
                          onClick={() => save([{ id: row.id, patch: { extra: togglePriority(row.f.extra ?? '') } }])}
                          className={star ? 'text-[#F5B301]' : 'text-gray-200 hover:text-gray-400'}>
                          <FiStar size={14} fill={star ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </td>
                    {cols.map((col, c) => {
                      const isActive = active?.r === r && active?.c === c;
                      const isEditing = isActive && editing;
                      return (
                        <td key={col.key} id={`pc-${r}-${c}`}
                          onClick={() => { if (!isActive) { if (editing) commit(draft, null); setActive({ r, c }); } gridRef.current?.focus({ preventScroll: true }); }}
                          onDoubleClick={() => { setActive({ r, c }); startEdit(undefined, { r, c }); }}
                          className={`border-b border-r border-gray-100 h-10 px-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-700 ${col.type === 'readonly' ? 'bg-gray-50/50' : ''} ${isActive ? 'outline outline-2 outline-[#E89B5A] -outline-offset-2' : ''}`}>
                          {isEditing ? (
                            col.type === 'select' ? (
                              <select autoFocus value={draft}
                                ref={(el) => { if (el && !el.dataset.o) { el.dataset.o = '1'; try { (el as any).showPicker?.(); } catch { /* bỏ qua */ } } }}
                                onChange={(e) => commit(e.target.value, null, true)}
                                onBlur={() => commit(draft, null)}
                                onKeyDown={(e) => { if (e.key === 'Escape') { editingRef.current = false; setEditing(false); setTimeout(() => gridRef.current?.focus(), 0); } }}
                                className="w-full h-8 bg-white border border-[#E89B5A] rounded px-1 text-sm focus:outline-none">
                                <option value="">—</option>
                                {[...(col.options ?? []), ...(draft && !col.options?.includes(draft) ? [draft] : [])].map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input autoFocus value={draft} list={col.type === 'suggest' ? `dl-${col.key}` : undefined}
                                onChange={(e) => setDraft(e.target.value)}
                                onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                                onBlur={() => commit(draft, null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); commit(draft, 'down', true); }
                                  else if (e.key === 'Tab') { e.preventDefault(); commit(draft, e.shiftKey ? 'left' : 'right', true); }
                                  else if (e.key === 'Escape') { editingRef.current = false; setEditing(false); setTimeout(() => gridRef.current?.focus(), 0); }
                                }}
                                className="w-full h-8 bg-white border border-[#E89B5A] rounded px-2 text-sm focus:outline-none" />
                            )
                          ) : display(col, row)}
                        </td>
                      );
                    })}
                    <td className="border-b border-gray-100 h-10 px-2">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/shelter/pets/${row.id}`} title="Xem chi tiết" className="p-1.5 text-gray-400 hover:text-[#E89B5A]"><FiExternalLink size={14} /></Link>
                        <button type="button" title="Xoá" onClick={() => del(row)} className="p-1.5 text-gray-400 hover:text-red-500"><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!view.length && (
                <tr><td colSpan={cols.length + 2} className="h-32 text-center text-gray-400">
                  {hasFilter ? 'Không có dòng nào khớp bộ lọc.' : 'Chưa có pet nào. Bấm "Thêm dòng" để bắt đầu.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {cols.filter((c) => c.type === 'suggest').map((c) => (
        <datalist key={c.key} id={`dl-${c.key}`}>{c.options?.map((o) => <option key={o} value={o} />)}</datalist>
      ))}

      <p className="mt-3 text-xs text-gray-400">
        Bấm 1 ô để chọn • Enter / F2 / gõ để sửa • Tab, mũi tên để di chuyển • Ctrl+C / Ctrl+V dán nhiều ô từ Excel • Ctrl+Z hoàn tác • Thay đổi tự lưu và đồng bộ sang Google Sheet.
      </p>
    </div>
  );
};

export default PetSheetEditor;