// src/components/PetStatusBadge.tsx
'use client';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { PetStatus } from '@/types/pet';
import { PET_STATUS_CONFIG, PET_STATUS_ORDER, getPetStatusMeta } from '@/constants/petStatus';

interface PetStatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

// Badge tĩnh — dùng cho PetTable, PetCard, danh sách...
export const PetStatusBadge: React.FC<PetStatusBadgeProps> = ({ status, size = 'md', className }) => {
  const meta = getPetStatusMeta(status);
  const sizeClass = size === 'sm' ? 'text-[11px] px-2.5 py-1' : 'text-sm px-3.5 py-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizeClass} ${className ?? ''}`}
      style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      {meta.label}
    </span>
  );
};

interface PetStatusDropdownProps {
  status?: string | null;
  onChange: (status: PetStatus) => void;
  disabled?: boolean;
  loadingLabel?: string; // hiển thị khi đang lưu (vd "Đang lưu...")
}

// Badge + dropdown chọn trạng thái — dùng cho PetForm & Pet Detail page
export const PetStatusDropdown: React.FC<PetStatusDropdownProps> = ({
  status,
  onChange,
  disabled,
  loadingLabel,
}) => {
  const [open, setOpen] = React.useState(false);
  const meta = getPetStatusMeta(status);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold border shadow-sm transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.color }}
      >
        {loadingLabel ?? meta.label}
        {!disabled && (
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-0.5">
            {PET_STATUS_ORDER.map((key) => {
              const cfg = PET_STATUS_CONFIG[key];
              const isSelected = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSelected ? 'font-bold text-gray-900 bg-gray-50/80' : 'font-normal text-gray-700 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}