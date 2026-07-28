'use client';

import React, { useState } from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
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
    <div className="flex items-center gap-3 mb-5">
      <form onSubmit={handleSubmit} className="relative flex-1 max-w-sm">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Tìm theo tên người nộp đơn hoặc tên pet..."
          className="w-full bg-white border border-gray-200 rounded-xl h-11 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-[#E89B5A]"
        />
      </form>
      <button
        onClick={() => fetchApplications()}
        className="flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#E89B5A] hover:text-[#E89B5A] transition-colors shrink-0"
      >
        <FiRefreshCw size={15} /> Làm mới
      </button>
    </div>
  );
};
