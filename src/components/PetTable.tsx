'use client';

import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { Pet, PET_SPECIES_LABEL, PET_STATUS_LABEL } from '@/types/pet';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';

interface PetTableProps {
  pets: Pet[];
  onView?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

const formatAge = (months: number): string => {
  if (!months || months <= 0) return 'Chưa rõ tuổi';
  if (months < 12) return `${months} tháng`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0 ? `${years} năm ${rest} tháng` : `${years} năm`;
};

const formatPetId = (id: string): string => id.slice(-6).toUpperCase();

// Tinh chỉnh lại tỷ lệ Grid để giống với khoảng cách trong ảnh
const COLUMNS_CLASS =
  'grid grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)_72px] items-center gap-4';

export const PetTable: React.FC<PetTableProps> = ({ pets, onView, onEdit, onDelete }) => {
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  // Trích xuất style tĩnh để badge "Available" giống 100% ảnh mẫu
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
        <span className="text-[14px] font-medium text-gray-500">Pet Name</span>
        <span className="text-[14px] font-medium text-gray-500">Type</span>
        <span className="text-[14px] font-medium text-gray-500">Breed</span>
        <span className="text-[14px] font-medium text-gray-500">Age</span>
        <span className="text-[14px] font-medium text-gray-500">ID</span>
        <span className="text-[14px] font-medium text-gray-500">Status</span>
        <span />
      </div>

      {/* Rows */}
      {pets.map((pet) => {
        const genderLower = String(pet.gender || '').toLowerCase();
        const isFemale = genderLower === 'female';
        const statusLabel = PET_STATUS_LABEL[pet.status] ?? pet.status;
        const imageUrl = pet.images?.[0] || null;

        return (
          <div
            key={pet.id}
            onClick={() => onView?.(pet)}
            className={`group ${COLUMNS_CLASS} px-6 py-4 border-b border-gray-100/80 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors`}
          >
            {/* Pet Name & Avatar */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Đổi thành rounded-full để tạo hình tròn hoàn hảo giống ảnh */}
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
                {/* Font chữ to và đậm hơn để giống text "Max" trong ảnh */}
                <span className="font-bold text-gray-900 text-[16px] truncate">{pet.name}</span>
                {isFemale ? (
                  <Venus size={16} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
                ) : (
                  <Mars size={16} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />
                )}
              </div>
            </div>

            {/* Thông tin - Màu xám trung tính, font to rõ ràng */}
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {PET_SPECIES_LABEL[pet.species]}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {formatBreed(pet.breed as MaybeBilingual) || 'Chưa rõ giống'}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {formatAge(pet.age)}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {formatPetId(pet.id)}
            </span>

            {/* Status Badge - Fixed width, bo tròn pill, màu sắc chuẩn */}
            <div>
              <span
                className={`inline-flex items-center justify-center w-[96px] h-[28px] rounded-full text-[12px] font-semibold border ${getStatusStyle(pet.status)}`}
              >
                {statusLabel}
              </span>
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