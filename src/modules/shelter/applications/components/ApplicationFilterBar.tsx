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
    // < sm: 2 hàng (ô tìm kiếm full-width phía trên, các nút icon phía dưới)
    // >= sm: 1 hàng như thiết kế gốc, đủ chỗ nên hiện đầy đủ label
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">

      {/* Ô tìm kiếm: chiếm trọn hàng trên mobile, cố định 260px trên desktop */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center order-1 sm:order-2 w-full sm:w-[260px]"
      >
        <Search className="absolute left-3.5 text-gray-400 pointer-events-none" size={15} strokeWidth={2} />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Tìm kiếm"
          className="w-full h-[38px] bg-white border border-[#858585] rounded-full pl-9 pr-4 text-[13px] text-gray-800 focus:outline-none focus:border-[#C4C4C4] placeholder-gray-400 transition-colors font-['Be Vietnam Pro',_sans-serif]"
        />
      </form>

      {/* Nhóm nút icon: 1 khối trên mobile (hàng dưới), "tan" thành các item riêng trên desktop để đúng thứ tự gốc */}
      <div className="flex items-center gap-2 order-2 sm:order-none sm:contents">
        <button className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors shrink-0 sm:order-1">
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-[#F46767] border-[1.5px] border-white rounded-full"></span>
        </button>

        {/* Nút Filter: chỉ icon trên mobile, icon + label trên desktop */}
        <button className="flex items-center gap-1.5 sm:gap-2 h-[38px] px-3 sm:px-4 bg-white border border-[#858585] rounded-full hover:bg-gray-50 transition-colors shrink-0 sm:order-3">
          <Filter size={14} className="text-gray-400" strokeWidth={2} />
          <span className="hidden sm:inline text-[13.5px] text-gray-500 font-medium font-['Be Vietnam Pro',_sans-serif]">Bộ lọc</span>
          <ChevronDown size={14} className="text-gray-400 sm:ml-2" strokeWidth={2} />
        </button>

        {/* Nút Today: chỉ icon trên mobile, icon + label trên desktop */}
        <button className="flex items-center gap-1.5 sm:gap-2 h-[38px] px-3 sm:px-4 bg-white border border-[#858585] rounded-full hover:bg-gray-50 transition-colors shrink-0 sm:order-4">
          <Calendar size={14} className="text-gray-400" strokeWidth={2} />
          <span className="hidden sm:inline text-[13.5px] text-gray-500 font-medium font-['Be Vietnam Pro',_sans-serif]">Hôm nay</span>
          <ChevronDown size={14} className="text-gray-400 sm:ml-2" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};