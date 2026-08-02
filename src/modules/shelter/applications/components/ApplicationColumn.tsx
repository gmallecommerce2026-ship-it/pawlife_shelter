'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { AdoptionApplication, ApplicationStatus } from '@/types/application';
import { ApplicationCard } from './ApplicationCard';

// 1. Thêm onNameClick vào Interface
interface ApplicationColumnProps {
  status: ApplicationStatus;
  label: string;
  applications: AdoptionApplication[];
  movingIds: string[];
  isDropTarget: boolean;
  onCardClick: (app: AdoptionApplication) => void;
  onNameClick?: (app: AdoptionApplication) => void; // <--- THÊM DÒNG NÀY
}

const COLUMN_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  SUBMITTED: { bg: 'bg-[#FAFAFA]', border: 'border-[#F0F0F0]', text: 'text-[#595959]' },
  PENDING: { bg: 'bg-[#F4F7FF]', border: 'border-[#E0E8FF]', text: 'text-[#3B6BE3]' },
  NEED_MORE_INFO: { bg: 'bg-[#FFFDF5]', border: 'border-[#FDF0CC]', text: 'text-[#B87503]' },
  INTERVIEW_SCHEDULED: { bg: 'bg-[#FCF7FF]', border: 'border-[#F3E0FF]', text: 'text-[#8A38D4]' },
  ADOPTION_COMPLETED: { bg: 'bg-[#F2FCF5]', border: 'border-[#D1F2D9]', text: 'text-[#1B8A44]' },
  APPROVED: { bg: 'bg-[#F2FCF5]', border: 'border-[#D1F2D9]', text: 'text-[#1B8A44]' },
  CLOSED: { bg: 'bg-[#F5F5F5]', border: 'border-[#EAEAEA]', text: 'text-[#8C8C8C]' },
};

export const ApplicationColumn: React.FC<ApplicationColumnProps> = ({
  status,
  label,
  applications,
  movingIds,
  isDropTarget,
  onCardClick,
  onNameClick, // <--- NHẬN PROP TỪ CHA
}) => {
  const { setNodeRef } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status] || COLUMN_STYLES.SUBMITTED;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[270px] shrink-0 h-full rounded-[16px] border ${style.bg} ${
        isDropTarget ? 'border-[#E89B5A] border-dashed' : style.border
      } transition-colors duration-200 p-3`}
    >
      {/* Header Cột */}
      <div className="flex justify-between items-center w-full h-[28px] mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`font-['Urbanist',_sans-serif] text-[15px] whitespace-nowrap leading-none font-semibold ${style.text}`}>
            {label}
          </div>
          {status !== 'SUBMITTED' && (
            <div className="bg-white rounded-full h-[22px] min-w-[22px] px-2 flex justify-center items-center shadow-sm">
              <span className="font-['Urbanist',_sans-serif] text-[11px] text-[#8C8C8C] font-bold">
                {applications.length}
              </span>
            </div>
          )}
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Danh sách thẻ Card */}
      <div className="flex flex-col gap-3 w-full overflow-y-auto custom-scrollbar pb-2 items-center">
        {applications.map((app, index) => (
          <ApplicationCard
            key={app.id}
            application={app}
            isMoving={movingIds.includes(app.id)}
            onClick={() => onCardClick(app)}
            onNameClick={onNameClick} // <--- TRUYỀN XUỐNG CHO CARD
            showRedDot={status === 'SUBMITTED' && index === 0}
            showMenu={status === 'NEED_MORE_INFO' && index === 0}
          />
        ))}
      </div>
    </div>
  );
};