'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { AdoptionApplication, ApplicationStatus } from '@/types/application';
import { ApplicationCard } from './ApplicationCard';
import { useAutoHeight } from '@/stores/useAutoHeight';

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

const COLUMN_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  SUBMITTED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F9FAFB] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#EAEAEA]', text: 'text-[#858585]' },
  PENDING: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#E8F1FF] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#E0E8FF]', text: 'text-[#5A90DA]' },
  NEED_MORE_INFO: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#FEFCE9] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#FDF0CC]', text: 'text-[#FFBA00]' },
  INTERVIEW_SCHEDULED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#FAF5FF] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#F3E0FF]', text: 'text-[#5A1B8D]' },
  ADOPTION_COMPLETED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F0FDF4] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#D1F2D9]', text: 'text-[#236745]' },
  APPROVED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F0FDF4] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#D1F2D9]', text: 'text-[#236745]' },
  CLOSED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F0FDF4] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#EAEAEA]', text: 'text-[#236745]' },
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

  // Đo chiều cao thật của khu vực chứa item, để container ngoài animate height mượt
  // mỗi khi số lượng item trong cột thay đổi (thêm/bớt/kéo qua cột khác).
  const { contentRef, height } = useAutoHeight<HTMLDivElement>([
    applications.length,
    applications.map((a) => a.id).join(','),
  ]);

  return (
    <div
      ref={setNodeRef}
      // Bỏ h-full/min-h-[500px] cố định: giờ chiều cao cột = header + khu vực item
      // (auto-height bên dưới), để mỗi cột tự co giãn theo đúng số item của nó.
      className={`flex flex-col flex-[1_0_260px] rounded-[18px] border transition-all duration-300 px-1.5 py-2.5 ${
        isDropTarget
          ? 'bg-[#F7F7F7] bg-gradient-to-b from-[#D0E3FF] from-[45px] to-[#F7F7F7] to-[120px] border-[#A3BFF8] border-dashed'
          : `${style.bg} ${style.border}`
      }`}
    >
      <div className="flex justify-between items-center w-full h-[32px] mb-2.5 px-2">
        <div className={`font-sans text-[16px] whitespace-nowrap leading-none font-semibold ${style.text}`}>
          {label}
        </div>
        <button className="text-[#888888] hover:text-[#111111] transition-colors">
          <Plus size={18} strokeWidth={1.8} />
        </button>
      </div>

      {/* SortableContext: cho phép các ApplicationCard bên trong tự "né" nhau khi
          kéo 1 item khác vào/qua vị trí của chúng (animate transform mượt). */}
      <SortableContext
        items={applications.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* Wrapper animate height: height được đo bằng useAutoHeight, transition
            trên chính thuộc tính height để cột "phình/co" mượt theo nội dung. */}
        <div
          style={{ height }}
          className="w-full transition-[height] duration-300 ease-in-out overflow-hidden"
        >
          <div ref={contentRef} className="flex flex-col gap-2 w-full pb-2 items-center">
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
              <div className="w-full flex items-center justify-center p-1.5">
                <div className="w-full h-[150px] rounded-[14px] border-2 border-dashed border-[#D4D4D4] flex items-center justify-center transition-colors">
                  <span className="text-[12px] font-medium text-[#A3A3A3] select-none">
                    Chưa có đơn nào
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </SortableContext>
    </div>
  );
};