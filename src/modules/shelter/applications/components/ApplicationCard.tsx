'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Phone, Mail, Calendar, MessageCircle, FileText, MoreVertical } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

const formatSubmittedAt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '13/02/2026'; 
  }
};

interface ApplicationCardContentProps {
  application: AdoptionApplication;
  showRedDot?: boolean;
  showMenu?: boolean;
  onNameClick?: (app: AdoptionApplication) => void;
}

export const ApplicationCardContent: React.FC<ApplicationCardContentProps> = ({ 
  application, 
  showRedDot, 
  showMenu,
  onNameClick
}) => (
  <div className="flex flex-col w-full relative">
    {showMenu && (
      <button className="absolute top-0 right-0 text-gray-400 hover:text-gray-600">
        <MoreVertical size={16} strokeWidth={2} />
      </button>
    )}

    {/* Avatar & Tên */}
    <div className="flex items-center gap-3 w-full mb-4">
      <img
        className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200"
        src={application.pet?.avatarUrl || "/images/placeholder-avatar.png"}
        alt={application.fullName}
      />
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          {/* Tên có thể Click */}
          <span 
            className="font-['Urbanist',_sans-serif] text-[15px] text-gray-900 font-semibold truncate leading-tight hover:text-[#E89B5A] hover:underline cursor-pointer transition-colors"
            onPointerDown={(e) => e.stopPropagation()} // Ngăn Dnd-kit kích hoạt kéo thả khi click vào tên
            onClick={(e) => {
              e.stopPropagation(); // Ngăn mở Modal Application Detail
              onNameClick?.(application);
            }}
          >
            {application.fullName}
          </span>
          
          {/* Chấm đỏ nhấp nháy nhẹ */}
          {showRedDot && (
            <span className="relative flex h-[6px] w-[6px] shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-red-500"></span>
            </span>
          )}
        </div>
        <span className="font-['Urbanist',_sans-serif] text-[12.5px] text-gray-500 font-normal leading-tight truncate">
          Apply for <span className="font-bold text-gray-800">{application.pet?.name || "Luna"}</span>
        </span>
      </div>
    </div>

    {/* Thông tin liên hệ (Phone & Email) */}
    <div className="flex flex-col gap-2.5 mb-4">
      <div className="flex items-center gap-2.5 w-full">
        <Phone size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
        <span className="font-['Urbanist',_sans-serif] text-[12px] text-gray-500 font-medium truncate">
          {application.phone || "0912345678"}
        </span>
      </div>
      <div className="flex items-center gap-2.5 w-full">
        <Mail size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
        <span className="font-['Urbanist',_sans-serif] text-[12px] text-gray-500 font-medium truncate">
          {application.zalo || "mariagarcia@email.com"}
        </span>
      </div>
    </div>

    {/* Chips Trạng thái */}
    <div className="flex flex-wrap items-center gap-2 w-full mb-5">
      <div className="bg-[#F0F6FF] rounded-full flex justify-center items-center py-1 px-2.5 shrink-0">
        <span className="font-['Urbanist',_sans-serif] text-[10px] text-[#3B6BE3] tracking-wide font-bold">
          Follow-up
        </span>
      </div>
      
      {(!application.petExperience || application.petExperience.toLowerCase().includes('chưa')) && (
        <div className="bg-[#F5F5F5] rounded-full flex justify-center items-center py-1 px-2.5 shrink-0">
          <span className="font-['Urbanist',_sans-serif] text-[10px] text-[#8C8C8C] tracking-wide font-bold">
            First-time
          </span>
        </div>
      )}
    </div>

    {/* Footer: Lịch & Icon tương tác */}
    <div className="flex items-center justify-between w-full pt-3.5 border-t border-gray-100">
      <div className="flex items-center gap-1.5">
        <Calendar size={13} className="text-gray-400" strokeWidth={2} />
        <span className="font-['Urbanist',_sans-serif] text-[11px] text-gray-500 font-medium tracking-wide">
          {formatSubmittedAt(application.createdAt)}
        </span>
      </div>
      
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-1.5">
          <MessageCircle size={13} className="text-gray-400" strokeWidth={2} />
          <span className="font-['Urbanist',_sans-serif] text-[11px] text-gray-500 font-bold">12</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText size={13} className="text-gray-400" strokeWidth={2} />
          <span className="font-['Urbanist',_sans-serif] text-[11px] text-gray-500 font-bold">0</span>
        </div>
      </div>
    </div>
  </div>
);

interface ApplicationCardProps {
  application: AdoptionApplication;
  isMoving: boolean;
  showRedDot?: boolean;
  showMenu?: boolean;
  onClick: () => void;
  onNameClick?: (app: AdoptionApplication) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  isMoving, 
  showRedDot,
  showMenu,
  onClick,
  onNameClick
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, forcedColorAdjust: 'none' as const }
    : { forcedColorAdjust: 'none' as const };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={-1}
      onClick={onClick}
      className={`bg-white rounded-[14px] w-full p-[14px] border border-[#F0F0F0] cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-md hover:border-[#E5E5E5] focus:outline-none ${
        isDragging ? 'opacity-40 shadow-xl' : 'shadow-sm'
      } ${isMoving ? 'pointer-events-none opacity-60' : ''}`}
    >
      <ApplicationCardContent 
        application={application} 
        showRedDot={showRedDot} 
        showMenu={showMenu}
        onNameClick={onNameClick}
      />
    </div>
  );
};