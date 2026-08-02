'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { AdoptionApplication, ApplicationStatus } from '@/types/application';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationColumnProps {
  status: ApplicationStatus;
  label: string;
  applications: AdoptionApplication[];
  movingIds: string[];
  isDropTarget: boolean;
  onOpenDetail: (app: AdoptionApplication) => void;
  onOpenProfile: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
  onOpenDocuments: (app: AdoptionApplication) => void;
}

// CẬP NHẬT: Dùng pixel (px) thay vì phần trăm (%) để giữ dải màu Header luôn cố định, không bị bóp méo khi cột ngắn đi.
const COLUMN_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  SUBMITTED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#EEEEEE] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#EAEAEA]', text: 'text-[#666666]' },
  PENDING: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#E2EAF8] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#E0E8FF]', text: 'text-[#3B6BE3]' },
  NEED_MORE_INFO: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#FDF0CC] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#FDF0CC]', text: 'text-[#B87503]' },
  INTERVIEW_SCHEDULED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F3E0FF] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#F3E0FF]', text: 'text-[#8A38D4]' },
  ADOPTION_COMPLETED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#D1F2D9] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#D1F2D9]', text: 'text-[#1B8A44]' },
  APPROVED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#D1F2D9] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#D1F2D9]', text: 'text-[#1B8A44]' },
  CLOSED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#EAEAEA] from-[5px] to-[#F7F7F7] to-[70px]', border: 'border-[#EAEAEA]', text: 'text-[#8C8C8C]' },
};

export const ApplicationColumn: React.FC<ApplicationColumnProps> = ({
  status,
  label,
  applications,
  movingIds,
  isDropTarget,
  onOpenDetail,
  onOpenProfile,
  onRemove,
  onOpenDocuments,
}) => {
  const { setNodeRef } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status] || COLUMN_STYLES.SUBMITTED;

  return (
    <div
      ref={setNodeRef}
      // Thêm min-h-[500px] để đảm bảo cột luôn dài mượt mà ngay cả khi trống trơn
      className={`flex flex-col w-[280px] shrink-0 h-full min-h-[280px] rounded-[18px] border transition-all duration-300 px-1.5 py-2.5 ${
        isDropTarget 
          ? 'bg-[#F7F7F7] bg-gradient-to-b from-[#D0E3FF] from-[45px] to-[#F7F7F7] to-[120px] border-[#A3BFF8] border-dashed'
          : `${style.bg} ${style.border}`
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center w-full h-[32px] mb-2.5 px-2">
        <div className={`font-sans text-[16px] whitespace-nowrap leading-none font-semibold ${style.text}`}>
          {label}
        </div>
        <button className="text-[#888888] hover:text-[#111111] transition-colors">
          <Plus size={18} strokeWidth={1.8} />
        </button>
      </div>

      {/* Body: Thêm flex-1 để nó giãn hết chiều cao của cột nếu không có item */}
      <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto custom-scrollbar pb-2 items-center">
        {applications.length > 0 ? (
          applications.map((app, index) => (
            <ApplicationCard
              key={app.id}
              application={app}
              isMoving={movingIds.includes(app.id)}
              onOpenProfile={onOpenProfile}
              onOpenDetail={onOpenDetail}
              onRemove={onRemove}
              showRedDot={status === 'SUBMITTED' && index === 0}
              showMenu={true} 
              onOpenDocuments={onOpenDocuments}
            />
          ))
        ) : (
          // TRẠNG THÁI EMPTY (Chưa có đơn nào)
          <div className="w-full h-full min-h-[200px] flex items-center justify-center p-1.5">
            <div className="w-full h-[150px] rounded-[14px] border-2 border-dashed border-[#D4D4D4] flex items-center justify-center transition-colors">
              <span className="text-[12px] font-medium text-[#A3A3A3] select-none">
                Chưa có đơn nào
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};