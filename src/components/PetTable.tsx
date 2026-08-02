'use client';

import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { Pet, PET_SPECIES_LABEL, PET_STATUS_LABEL } from '@/types/pet';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { PET_STATUS_STYLE } from '@/utils/petStatus';

interface PetTableProps {
  pets: Pet[];
  onView?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

// age lưu theo tháng (types/pet.ts) -> hiển thị "X năm (Y tháng)" giống cách
// ảnh mẫu hiển thị "3 years".
const formatAge = (months: number): string => {
  if (!months || months <= 0) return 'Chưa rõ tuổi';
  if (months < 12) return `${months} tháng`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0 ? `${years} năm ${rest} tháng` : `${years} năm`;
};

// Rút gọn ID hiển thị (6 ký tự cuối, in hoa) thay vì in nguyên ObjectId dài.
const formatPetId = (id: string): string => id.slice(-6).toUpperCase();

const COLUMNS_CLASS =
  'grid grid-cols-[minmax(200px,1.6fr)_100px_minmax(140px,1.2fr)_110px_110px_130px_72px] items-center gap-3';

export const PetTable: React.FC<PetTableProps> = ({ pets, onView, onEdit, onDelete }) => {
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`${COLUMNS_CLASS} px-6 py-3.5 bg-gray-50/80 border-b border-gray-200`}>
        <span className="text-[13px] font-semibold text-gray-500">Pet Name</span>
        <span className="text-[13px] font-semibold text-gray-500">Type</span>
        <span className="text-[13px] font-semibold text-gray-500">Breed</span>
        <span className="text-[13px] font-semibold text-gray-500">Age</span>
        <span className="text-[13px] font-semibold text-gray-500">ID</span>
        <span className="text-[13px] font-semibold text-gray-500">Status</span>
        <span />
      </div>

      {/* Rows */}
      {pets.map((pet) => {
        const genderLower = String(pet.gender || '').toLowerCase();
        const isFemale = genderLower === 'female';
        const style = PET_STATUS_STYLE[pet.status];
        const statusLabel = PET_STATUS_LABEL[pet.status] ?? pet.status;
        const imageUrl = pet.images?.[0] || null;

        return (
          <div
            key={pet.id}
            onClick={() => onView?.(pet)}
            className={`group ${COLUMNS_CLASS} px-6 py-3.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50/70 transition-colors`}
          >
            {/* Pet Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {imageUrl ? (
                  <Image src={imageUrl} alt={pet.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <PawPrint size={18} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-black text-[15px] truncate">{pet.name}</span>
                {isFemale ? (
                  <Venus size={14} className="text-pink-400 shrink-0" />
                ) : (
                  <Mars size={14} className="text-blue-400 shrink-0" />
                )}
              </div>
            </div>

            <span className="text-[14px] text-gray-500 truncate">{PET_SPECIES_LABEL[pet.species]}</span>
            <span className="text-[14px] text-gray-500 truncate">{formatBreed(pet.breed as MaybeBilingual) || 'Chưa rõ giống'}</span>
            <span className="text-[14px] text-gray-500 truncate">{formatAge(pet.age)}</span>
            <span className="text-[14px] text-gray-400 truncate font-mono">{formatPetId(pet.id)}</span>

            <span
              className={`inline-flex items-center justify-center w-fit px-3 py-1 rounded-full text-[12px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
            >
              {statusLabel}
            </span>

            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={stop(() => onEdit?.(pet))}
                title="Sửa pet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#E89B5A] hover:bg-[#E89B5A]/10"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                type="button"
                onClick={stop(() => onDelete?.(pet))}
                title="Xoá pet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PetTable;