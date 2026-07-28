'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiGrid, FiList } from 'react-icons/fi';
import { PetFilter, PetViewMode, PetSpecies, PetStatus, PET_STATUS_LABEL, PET_SPECIES_LABEL } from '@/types/pet';

interface PetFilterBarProps {
  filter: PetFilter;
  onFilterChange: (patch: Partial<PetFilter>) => void;
  viewMode: PetViewMode;
  onViewModeChange: (mode: PetViewMode) => void;
}

export const PetFilterBar: React.FC<PetFilterBarProps> = ({ filter, onFilterChange, viewMode, onViewModeChange }) => {
  // Debounce ô search để tránh gọi API liên tục khi gõ
  const [searchInput, setSearchInput] = useState(filter.search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filter.search) onFilterChange({ search: searchInput });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên pet, giống loài..."
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:border-[#E89B5A] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-colors"
        />
      </div>

      <select
        value={filter.species}
        onChange={(e) => onFilterChange({ species: e.target.value as PetSpecies | 'ALL' })}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#E89B5A] focus:outline-none"
      >
        <option value="ALL">Tất cả loài</option>
        {(Object.keys(PET_SPECIES_LABEL) as PetSpecies[]).map((s) => (
          <option key={s} value={s}>{PET_SPECIES_LABEL[s]}</option>
        ))}
      </select>

      <select
        value={filter.status}
        onChange={(e) => onFilterChange({ status: e.target.value as PetStatus | 'ALL' })}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#E89B5A] focus:outline-none"
      >
        <option value="ALL">Tất cả trạng thái</option>
        {(Object.keys(PET_STATUS_LABEL) as PetStatus[]).map((s) => (
          <option key={s} value={s}>{PET_STATUS_LABEL[s]}</option>
        ))}
      </select>

      <div className="flex items-center bg-gray-100 rounded-lg p-1 shrink-0">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-[#E89B5A] shadow-sm' : 'text-gray-500'}`}
          aria-label="Xem dạng lưới"
        >
          <FiGrid size={16} />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-[#E89B5A] shadow-sm' : 'text-gray-500'}`}
          aria-label="Xem dạng danh sách"
        >
          <FiList size={16} />
        </button>
      </div>
    </div>
  );
};
