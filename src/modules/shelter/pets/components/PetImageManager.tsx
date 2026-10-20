'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Star, X } from 'lucide-react';

interface Props {
  images: string[];                    // images[0] = ảnh chính hiển thị trên app
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

const move = (arr: string[], from: number, to: number) => {
  if (from === to || to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
};

export const PetImageManager: React.FC<Props> = ({ images, onChange, disabled }) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const remove = (index: number) => {
    if (images.length <= 1) {
      alert('Pet cần có ít nhất 1 ảnh.');
      return;
    }
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = (to: number) => {
    if (dragIndex !== null) onChange(move(images, dragIndex, to));
    setDragIndex(null);
    setOverIndex(null);
  };

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {images.map((url, index) => {
        const isPrimary = index === 0;
        const isOver = overIndex === index && dragIndex !== index;
        return (
          <div
            key={url}
            draggable={!disabled}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIndex !== index) setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
              isPrimary ? 'border-[#E89B5A]' : 'border-gray-200'
            } ${isOver ? 'ring-2 ring-[#E89B5A] scale-[0.97]' : ''} ${
              dragIndex === index ? 'opacity-40' : ''
            } ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Ảnh ${index + 1}`}
              draggable={false}
              className="w-full h-full object-cover select-none"
            />

            {/* Số thứ tự */}
            <span className="absolute bottom-1.5 left-1.5 min-w-[20px] h-5 px-1 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
              {index + 1}
            </span>

            {isPrimary ? (
              <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#E89B5A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Star size={10} fill="currentColor" /> Ảnh chính
              </span>
            ) : (
              <span className="absolute top-1.5 left-1.5 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} />
              </span>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(index)}
              title="Xóa ảnh"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X size={14} />
            </button>

            {/* Thanh điều khiển dưới */}
            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => onChange(move(images, index, index - 1))}
                title="Dời sang trái"
                className="w-6 h-6 rounded-full bg-black/60 hover:bg-[#E89B5A] text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-black/60"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={disabled || index === images.length - 1}
                onClick={() => onChange(move(images, index, index + 1))}
                title="Dời sang phải"
                className="w-6 h-6 rounded-full bg-black/60 hover:bg-[#E89B5A] text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-black/60"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {!isPrimary && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(move(images, index, 0))}
                className="absolute inset-x-0 top-8 mx-auto w-fit bg-black/60 hover:bg-[#E89B5A] text-white text-[10px] font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                Đặt làm ảnh chính
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};