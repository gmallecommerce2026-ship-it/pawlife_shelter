'use client';

import React, { useState } from 'react';
import { Star, X, Plus } from 'lucide-react';

interface Props {
  images: string[];
  onChange: (next: string[]) => void;
  onAdd?: () => void;
  disabled?: boolean;
}

// Di chuyển phần tử từ vị trí `from` sang `to` (chèn, không swap, không nhân bản)
const move = <T,>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export const PetImageManager: React.FC<Props> = ({ images, onChange, onAdd, disabled }) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const resetDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-[#8E8E93]">
        Kéo thả để sắp xếp. Ảnh đầu tiên là ảnh chính hiển thị trên app.
      </p>

      <div className="grid grid-cols-4 gap-2">
        {images.map((url, i) => {
          const isMain = i === 0;
          const isDragging = dragIndex === i;
          const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;

          return (
            <div
              key={url} // key theo url (duy nhất), KHÔNG dùng index
              draggable={!disabled}
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(i)); // Firefox cần dòng này
              }}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overIndex !== i) setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) onChange(move(images, dragIndex, i));
                resetDrag();
              }}
              onDragEnd={resetDrag}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-100 transition-all
                ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}
                ${isMain ? 'border-[#E89B5A]' : 'border-transparent'}
                ${isOver ? 'ring-2 ring-[#E89B5A] ring-offset-2 scale-[1.03]' : ''}
                ${isDragging ? 'opacity-40' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" draggable={false} className="w-full h-full object-cover select-none" />

              {isMain && (
                <span className="absolute left-1 top-1 rounded-full bg-[#E89B5A] px-2 py-0.5 text-[9px] font-bold text-white shadow">
                  Ảnh chính
                </span>
              )}

              {!disabled && (
                <div className="absolute inset-0 flex items-start justify-end gap-1 p-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                  {!isMain && (
                    <button
                      type="button"
                      title="Đặt làm ảnh chính"
                      onClick={() => onChange(move(images, i, 0))}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[#E89B5A] shadow hover:bg-white"
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Xoá ảnh"
                    onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-red-500 shadow hover:bg-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {onAdd && !disabled && (
          <button
            type="button"
            onClick={onAdd}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#E89B5A] hover:text-[#E89B5A] transition-colors"
            title="Thêm ảnh"
          >
            <Plus size={20} />
          </button>
        )}
      </div>
    </div>
  );
};