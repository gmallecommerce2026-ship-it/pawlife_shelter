'use client';

import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { Pet } from '@/types/pet';
import { PetStatusBadge } from '@/components/PetStatusBadge';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';

interface PetTableProps {
  pets: Pet[];
  onView?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

const getAgeLabel = (dob?: string | null): string => {
  if (!dob) return 'Chưa rõ tuổi';
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return 'Chưa rõ tuổi';

  const diffMs = Date.now() - dobDate.getTime();
  const ageDate = new Date(diffMs);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();

  if (years > 0) return `${years} tuổi`;
  if (months > 0) return `${months} tháng tuổi`;
  return 'Sơ sinh';
};

// ✅ FIX: species trả về dạng bilingual object { vi, en } (giống breed), không
// phải string key đơn giản như PET_SPECIES_LABEL kỳ vọng -> parse phòng thủ cả
// 2 trường hợp, ưu tiên hiển thị tiếng Việt.
const SPECIES_VI_LABEL: Record<string, string> = {
  DOG: 'Chó',
  CAT: 'Mèo',
};

const formatSpecies = (species: unknown): string => {
  if (!species) return 'Chưa rõ';
  if (typeof species === 'object') {
    const obj = species as { vi?: string; en?: string };
    return obj.vi || (obj.en ? SPECIES_VI_LABEL[obj.en.toUpperCase()] : undefined) || obj.en || 'Chưa rõ';
  }
  const key = String(species).toUpperCase();
  return SPECIES_VI_LABEL[key] || String(species);
};

// ✅ FIX: đồng bộ đúng logic lấy PawLife ID với trang Pet Detail
// (ưu tiên tags[0].id -> code -> fallback id)
const formatShelterId = (pet: Pet): string => {
  const shelterInternalId = (pet as any).shelterInternalId;
  return shelterInternalId ? String(shelterInternalId).toUpperCase() : 'N/A';
};

// Tinh chỉnh lại tỷ lệ Grid để giống với khoảng cách trong ảnh
const COLUMNS_CLASS =
  'grid grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)_72px] items-center gap-4';

const getImageUrl = (img: unknown): string | null => {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object' && 'url' in img) return (img as any).url || null;
  return null;
};

export const PetTable: React.FC<PetTableProps> = ({ pets, onView, onEdit, onDelete }) => {
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-[#E5F7ED] text-[#16A34A] border-[#A7E8C3]';
      case 'ADOPTED':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'PENDING':
        return 'bg-[#FFF3E0] text-[#E89B5A] border-[#F8D2B0]';
      case 'LOST':
        return 'bg-red-50 text-red-500 border-red-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className={`${COLUMNS_CLASS} px-6 py-4 bg-[#F9FAFB] border-b border-gray-200`}>
        <span className="text-[14px] font-medium text-gray-500">Tên Pet</span>
        <span className="text-[14px] font-medium text-gray-500">Loại</span>
        <span className="text-[14px] font-medium text-gray-500">Giống</span>
        <span className="text-[14px] font-medium text-gray-500">Tuổi</span>
        <span className="text-[14px] font-medium text-gray-500">Shelter ID</span>
        <span className="text-[14px] font-medium text-gray-500">Trạng thái</span>
        <span />
      </div>

      {/* Rows */}
      {pets.map((pet) => {
        const genderLower = String(pet.gender || '').toLowerCase();
        const isFemale = genderLower === 'female';
        const imageUrl = getImageUrl(pet.images?.[0]) || (pet as any).avatarUrl || null;

        return (
          <div
            key={pet.id}
            onClick={() => onView?.(pet)}
            className={`group ${COLUMNS_CLASS} px-6 py-4 border-b border-gray-100/80 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors`}
          >
            {/* Pet Name & Avatar */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                {imageUrl ? (
                  <Image src={imageUrl} alt={pet.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <PawPrint size={20} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-gray-900 text-[16px] truncate">{pet.name}</span>
                {isFemale ? (
                  <Venus size={16} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
                ) : (
                  <Mars size={16} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />
                )}
              </div>
            </div>

            {/* ✅ FIX: dùng formatSpecies thay vì PET_SPECIES_LABEL[pet.species] */}
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {formatSpecies(pet.species)}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {formatBreed(pet.breed as MaybeBilingual) || 'Chưa rõ giống'}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {getAgeLabel((pet as any).dob)}
            </span>
            {/* ✅ FIX: dùng formatPetId đã đồng bộ với Pet Detail */}
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {formatShelterId(pet)}
            </span>

            {/* Status Badge */}
            <div>
              <PetStatusBadge status={pet.status} size="sm" />
            </div>

            {/* Actions (Sửa/Xoá) */}
            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={stop(() => onEdit?.(pet))}
                title="Sửa pet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#E89B5A] hover:bg-[#E89B5A]/10 transition-colors"
              >
                <FiEdit2 size={16} />
              </button>
              <button
                type="button"
                onClick={stop(() => onDelete?.(pet))}
                title="Xoá pet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PetTable;