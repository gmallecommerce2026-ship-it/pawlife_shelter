'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiDownload, FiExternalLink, FiFileText, FiPlusCircle, FiRefreshCw, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axiosClient from '@/lib/api/axiosClient';
import { usePetActions } from '@/stores/usePetStore';

const BASE = '/shelter-dashboard/pet-sheet';

interface SheetStatus {
  linked: boolean;
  ready: boolean;
  url?: string;
  status?: 'ACTIVE' | 'ERROR' | 'PAUSED';
  lastError?: string | null;
  lastSyncedAt?: string | null;
  version?: number;
}

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export const PetSheetSyncMenu: React.FC = () => {
  const { fetchPets } = usePetActions();
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<SheetStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastVersion = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosClient.get<SheetStatus>(`${BASE}/status`);
      setSt(data);
      if (data.linked && typeof data.version === 'number') {
        // Sheet vừa đổi dữ liệu pet → tải lại danh sách
        if (lastVersion.current !== null && data.version !== lastVersion.current) fetchPets();
        lastVersion.current = data.version;
      }
    } catch { /* im lặng */ }
  }, [fetchPets]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try {
      await fn();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(', ') : m ?? e?.message ?? 'Có lỗi xảy ra');
    } finally {
      setBusy(null);
    }
  };

  const applyLinked = async (data: SheetStatus, msg: string) => {
    setSt(data);
    lastVersion.current = data.version ?? null;
    await fetchPets();
    toast.success(msg);
  };

  const downloadTemplate = () =>
    run('template', async () => {
      const { data } = await axiosClient.get(`${BASE}/template`, { responseType: 'blob' });
      saveBlob(data, 'pawlife-pet-template.xlsx');
    });

  const exportXlsx = () =>
    run('export', async () => {
      const { data } = await axiosClient.get(`${BASE}/export`, { responseType: 'blob' });
      saveBlob(data, 'pawlife-pets.xlsx');
    });

  const upload = (file: File) =>
    run('upload', async () => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axiosClient.post<SheetStatus>(`${BASE}/upload`, fd);
      await applyLinked(data, 'Đã tải lên và đồng bộ Excel.');
    });

  const init = () =>
    run('init', async () => {
      const { data } = await axiosClient.post<SheetStatus>(`${BASE}/init`);
      await applyLinked(data, 'Đã tạo Google Sheet từ dữ liệu hiện có.');
    });

  const syncNow = () =>
    run('sync', async () => {
      const { data } = await axiosClient.post<SheetStatus>(`${BASE}/sync`);
      await applyLinked(data, 'Đã đồng bộ.');
    });

  const itemCls =
    'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#FFF4EA] rounded-lg disabled:opacity-50 text-left';

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-[#FFF4EA] hover:bg-[#FFEBD6] text-[#FFBA7F] text-sm font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
      >
        <FiFileText size={14} /> Đồng bộ Excel
        {st?.status === 'ERROR' && <span className="w-2 h-2 rounded-full bg-[#F46767]" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 z-30">
          <p className={`px-3 py-1.5 text-xs ${st?.status === 'ERROR' ? 'text-red-500' : 'text-gray-400'}`}>
            {!st
              ? 'Đang tải...'
              : !st.ready
                ? 'Server chưa cấu hình Google.'
                : !st.linked
                  ? 'Chưa liên kết file nào.'
                  : st.status === 'ERROR'
                    ? `Lỗi: ${st.lastError}`
                    : `Đồng bộ lần cuối: ${st.lastSyncedAt ? new Date(st.lastSyncedAt).toLocaleTimeString('vi-VN') : '—'}`}
          </p>

          {st?.linked && st.url && (
            <a href={st.url} target="_blank" rel="noreferrer" className={itemCls}>
              <FiExternalLink size={14} /> Mở Google Sheet
            </a>
          )}
          <button className={itemCls} disabled={!!busy} onClick={() => fileRef.current?.click()}>
            <FiUpload size={14} /> {busy === 'upload' ? 'Đang tải lên...' : 'Tải lên file Excel'}
          </button>
          {!st?.linked && (
            <button className={itemCls} disabled={!!busy} onClick={init}>
              <FiPlusCircle size={14} /> {busy === 'init' ? 'Đang tạo...' : 'Tạo Sheet từ dữ liệu hiện có'}
            </button>
          )}
          <button className={itemCls} disabled={!!busy} onClick={downloadTemplate}>
            <FiDownload size={14} /> Tải file mẫu
          </button>
          {st?.linked && (
            <>
              <button className={itemCls} disabled={!!busy} onClick={exportXlsx}>
                <FiDownload size={14} /> Xuất Excel (.xlsx)
              </button>
              <button className={itemCls} disabled={!!busy} onClick={syncNow}>
                <FiRefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''} /> Đồng bộ ngay
              </button>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) upload(f);
        }}
      />
    </div>
  );
};

export default PetSheetSyncMenu;