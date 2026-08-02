'use client';

import React, { useState } from 'react';
import { Search, Filter, Calendar, ChevronDown, Bell } from 'lucide-react';
import { useApplicationFilter, useApplicationActions } from '@/stores/useApplicationStore';

export const ApplicationFilterBar: React.FC = () => {
  const { filter, setFilter } = useApplicationFilter();
  const { fetchApplications } = useApplicationActions();
  const [localSearch, setLocalSearch] = useState(filter.search);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ search: localSearch });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Chuông thông báo (Bell Icon) kèm chấm đỏ */}
      <button className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors mr-2">
        <Bell size={20} strokeWidth={1.8} />
        <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-[#F46767] border-[1.5px] border-white rounded-full"></span>
      </button>

      {/* Thanh tìm kiếm (Search Bar) */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 text-gray-400" size={15} strokeWidth={2} />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search"
          className="w-[260px] h-[38px] bg-white border border-[#E5E5E5] rounded-full pl-9 pr-4 text-[13px] text-gray-800 focus:outline-none focus:border-[#C4C4C4] placeholder-gray-400 transition-colors font-['Be Vietnam Pro',_sans-serif]"
        />
      </form>

      {/* Nút Filter */}
      <button className="flex items-center gap-2 h-[38px] px-4 bg-white border border-[#E5E5E5] rounded-full hover:bg-gray-50 transition-colors">
        <Filter size={14} className="text-gray-400" strokeWidth={2} />
        <span className="text-[13.5px] text-gray-500 font-medium font-['Be Vietnam Pro',_sans-serif]">Filter</span>
        <ChevronDown size={14} className="text-gray-400 ml-2" strokeWidth={2} />
      </button>

      {/* Nút Today */}
      <button className="flex items-center gap-2 h-[38px] px-4 bg-white border border-[#E5E5E5] rounded-full hover:bg-gray-50 transition-colors">
        <Calendar size={14} className="text-gray-400" strokeWidth={2} />
        <span className="text-[13.5px] text-gray-500 font-medium font-['Be Vietnam Pro',_sans-serif]">Today</span>
        <ChevronDown size={14} className="text-gray-400 ml-2" strokeWidth={2} />
      </button>
    </div>
  );
};