'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AdoptionApplication, ApplicationStatus } from '@/types/application';
import { ApplicationCard } from './ApplicationCard';

const COLUMN_ACCENT: Record<ApplicationStatus, string> = {
  SUBMITTED: 'border-t-gray-300',
  REVIEWING: 'border-t-amber-400',
  APPROVED: 'border-t-[#E89B5A]',
  ADOPTION_COMPLETED: 'border-t-emerald-500',
  REJECTED: 'border-t-red-400',
  CLOSED: 'border-t-gray-300',
};

interface ApplicationColumnProps {
  status: ApplicationStatus;
  label: string;
  applications: AdoptionApplication[];
  movingIds: string[];
  onCardClick: (app: AdoptionApplication) => void;
}

export const ApplicationColumn: React.FC<ApplicationColumnProps> = ({
  status,
  label,
  applications,
  movingIds,
  onCardClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-[280px] shrink-0 h-full">
      <div className={`flex items-center justify-between px-1 pb-3 border-t-[3px] pt-3 ${COLUMN_ACCENT[status]}`}>
        <h3 className="font-bold text-sm text-[#123832] uppercase tracking-wide">{label}</h3>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
          {applications.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{ forcedColorAdjust: 'none' }} // 👈 vùng thả cũng loại khỏi forced-colors
        className={`relative flex-1 flex flex-col gap-2.5 rounded-xl p-2 min-h-[160px] overflow-y-auto custom-scrollbar transition-colors duration-150 border-2 ${
          isOver ? '#ffefe1/60 border-[#E89B5A]' : 'bg-gray-50/60 border-transparent'
        }`}
      >
        {/* Banner hướng dẫn khi đang kéo thẻ tới đúng cột này */}
        {isOver && (
          <div className="sticky top-0 z-10 -mt-2 -mx-2 mb-1 px-2">
            <div className="text-[11px] font-semibold text-white bg-[#E89B5A] rounded-md py-1.5 text-center shadow-sm animate-in fade-in duration-150">
              Thả để chuyển sang &quot;{label}&quot;
            </div>
          </div>
        )}

        {applications.length === 0 && !isOver && (
          <p className="text-xs text-gray-400 text-center mt-6">Không có đơn nào</p>
        )}
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            isMoving={movingIds.includes(app.id)}
            onClick={() => onCardClick(app)}
          />
        ))}
      </div>
    </div>
  );
};