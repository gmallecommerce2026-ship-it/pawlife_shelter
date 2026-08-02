'use client';

import React from 'react';
import Link from 'next/link';
import { FiPlus, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';
import { PawPrint, Bell } from 'lucide-react'; // <-- Thêm Bell vào đây
import { PetFilter, PetSpecies, PetStatus, PET_STATUS_LABEL, PET_SPECIES_LABEL } from '@/types/pet';

interface PetPageHeaderProps {
    filter: PetFilter;
    onFilterChange: (patch: Partial<PetFilter>) => void;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    title?: string;
    showNewPetButton?: boolean;
}

export const PetPageHeader: React.FC<PetPageHeaderProps> = ({
    filter,
    onFilterChange,
    searchInput,
    onSearchInputChange,
    title = 'Quản lý Pet',
    showNewPetButton = true,
}) => {
    return (
        <div className="flex items-center gap-3 mb-6 flex-nowrap overflow-x-auto mt-2">
            {/* Title */}
            <h2 className="font-sans text-[40px] leading-none text-[#0D062D] font-semibold shrink-0 whitespace-nowrap">
                {title}
            </h2>

            {/* + New Pet pill */}
            {showNewPetButton && (
                <Link
                    href="/shelter/pets/create"
                    className="flex items-center gap-1.5 bg-[#FFF4EA] hover:bg-[#FFEBD6] text-[#FFBA7F] text-sm font-semibold px-4 py-2 rounded-full transition-colors shrink-0 whitespace-nowrap"
                >
                    <FiPlus size={14} /> Thêm thú cưng
                </Link>
            )}

            {/* Spacer đẩy bell/search/filter về bên phải */}
            <div className="flex-1" />

            {/* --- ĐÃ ĐỒNG BỘ STYLE NÚT CHUÔNG TỪ APPLICATION KANBAN HEADER --- */}
            <button
                type="button"
                aria-label="Thông báo"
                className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            >
                <Bell size={20} strokeWidth={1.8} />
                <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-[#F46767] border-[1.5px] border-white rounded-full"></span>
            </button>
            {/* ---------------------------------------------------------------- */}

            {/* Search */}
            <div className="relative shrink-0 w-[280px] lg:w-[302px]">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                    value={searchInput}
                    onChange={(e) => onSearchInputChange(e.target.value)}
                    placeholder="Search by name, breed, or ID..."
                    className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-4 py-2.5 text-[13px] text-gray-500 placeholder:text-gray-400 focus:border-[#E89B5A] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-colors"
                />
            </div>

            {/* All Statuses */}
            <div className="relative shrink-0">
                <select
                    value={filter.status}
                    onChange={(e) => onFilterChange({ status: e.target.value as PetStatus | 'ALL' })}
                    className="appearance-none bg-white border border-gray-300 rounded-full pl-9 pr-9 py-2.5 text-sm text-gray-600 font-medium focus:border-[#E89B5A] focus:outline-none cursor-pointer whitespace-nowrap"
                >
                    <option value="ALL">All Statuses</option>
                    {(Object.keys(PET_STATUS_LABEL) as PetStatus[]).map((s) => (
                        <option key={s} value={s}>{PET_STATUS_LABEL[s]}</option>
                    ))}
                </select>
                <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* All Species */}
            <div className="relative shrink-0">
                <select
                    value={filter.species}
                    onChange={(e) => onFilterChange({ species: e.target.value as PetSpecies | 'ALL' })}
                    className="appearance-none bg-white border border-gray-300 rounded-full pl-9 pr-9 py-2.5 text-sm text-gray-600 font-medium focus:border-[#E89B5A] focus:outline-none cursor-pointer whitespace-nowrap"
                >
                    <option value="ALL">All Species</option>
                    {(Object.keys(PET_SPECIES_LABEL) as PetSpecies[]).map((s) => (
                        <option key={s} value={s}>{PET_SPECIES_LABEL[s]}</option>
                    ))}
                </select>
                <PawPrint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
        </div>
    );
};

export default PetPageHeader;