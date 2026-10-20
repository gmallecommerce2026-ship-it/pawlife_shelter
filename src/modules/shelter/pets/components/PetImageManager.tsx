'use client';

import React from 'react';
import { Star, X } from 'lucide-react';

interface Props {
  images: string[];                    // images[0] = ảnh chính hiển thị trên app
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export const PetImageManager: React.FC<Props> = ({ images, onChange, disabled }) => {
  const setPrimary = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  const remove = (index: number) => {
    if (images.length <= 1) {
      alert('Pet cần có ít nhất 1 ảnh.');
      return;
    }
    onChange(images.filter((_, i) => i !== index));
  };

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {images.map((url, index) => {
        const isPrimary = index === 0;
        return (
          <div
            key={url}
            className={`group relative aspect-square rounded-xl overflow-hidden border-2 ${
              isPrimary ? 'border-[#E89B5A]' : 'border-gray-200'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />

            {isPrimary && (
              <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#E89B5A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Star size={10} fill="currentColor" /> Ảnh chính
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

            {!isPrimary && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setPrimary(index)}
                className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[11px] font-semibold py-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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