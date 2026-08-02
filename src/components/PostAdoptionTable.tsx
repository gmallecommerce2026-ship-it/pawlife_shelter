'use client';

import React from 'react';
import Image from 'next/image';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { PostAdoptionRecord, getDaysSince, fmtDate } from '@/types/postAdoption';

interface PostAdoptionTableProps {
  records: PostAdoptionRecord[];
  onView?: (record: PostAdoptionRecord) => void;
}

const COLUMNS_CLASS =
  'grid grid-cols-[minmax(180px,1.4fr)_minmax(160px,1.2fr)_minmax(140px,1fr)_120px_110px_120px] items-center gap-3';

export const PostAdoptionTable: React.FC<PostAdoptionTableProps> = ({ records, onView }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`${COLUMNS_CLASS} px-6 py-3.5 bg-gray-50/80 border-b border-gray-200`}>
        <span className="text-[13px] font-semibold text-gray-500">Pet Name</span>
        <span className="text-[13px] font-semibold text-gray-500">Breed</span>
        <span className="text-[13px] font-semibold text-gray-500">Adopter Name</span>
        <span className="text-[13px] font-semibold text-gray-500">Adoption Date</span>
        <span className="text-[13px] font-semibold text-gray-500">Days Since</span>
        <span className="text-[13px] font-semibold text-gray-500">Next Follow-up</span>
      </div>

      {/* Rows */}
      {records.map((record) => {
        const isFemale = record.petGender === 'FEMALE';
        const imageUrl = record.petImage || null;

        return (
          <div
            key={record.id}
            onClick={() => onView?.(record)}
            className={`group ${COLUMNS_CLASS} px-6 py-3.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50/70 transition-colors`}
          >
            {/* Pet Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {imageUrl ? (
                  <Image src={imageUrl} alt={record.petName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <PawPrint size={18} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-black text-[15px] truncate">{record.petName}</span>
                {isFemale ? (
                  <Venus size={14} className="text-pink-400 shrink-0" />
                ) : (
                  <Mars size={14} className="text-blue-400 shrink-0" />
                )}
              </div>
            </div>

            <span className="text-[14px] text-gray-500 truncate">{record.breed}</span>
            <span className="text-[14px] text-gray-500 truncate">{record.adopterName}</span>
            <span className="text-[14px] text-gray-500 truncate">{fmtDate(record.adoptionDate)}</span>
            <span className="text-[14px] text-gray-500 truncate">{getDaysSince(record.adoptionDate)} days</span>
            <span className="text-[14px] text-gray-500 truncate">{fmtDate(record.nextFollowUpDate)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PostAdoptionTable;