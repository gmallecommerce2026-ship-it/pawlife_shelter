'use client';

import React from 'react';
import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';
import { FiPhone, FiUser } from 'react-icons/fi';
import { GiPawPrint } from 'react-icons/gi';
import { AdoptionApplication } from '@/types/application';

const formatSubmittedAt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
};

// Phần nội dung thuần hiển thị, không gắn hook kéo-thả — dùng lại được trong DragOverlay
// (DragOverlay chỉ cần bản sao hình ảnh, không cần đăng ký lại draggable id).
export const ApplicationCardContent: React.FC<{ application: AdoptionApplication }> = ({ application }) => (
  <>
    <div className="flex items-center gap-2.5 mb-2.5">
      <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 #ffefe1 flex items-center justify-center">
        {application.pet?.avatarUrl ? (
          <Image src={application.pet.avatarUrl} alt={application.pet.name} fill className="object-cover" />
        ) : (
          <GiPawPrint className="text-[#E89B5A]" size={16} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#123832] truncate">{application.pet?.name ?? 'Pet'}</p>
        <p className="text-[11px] text-gray-400 truncate">{formatSubmittedAt(application.submittedAt)}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
      <FiUser size={13} className="text-gray-400 shrink-0" />
      <span className="truncate font-medium">{application.fullName}</span>
    </div>
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <FiPhone size={13} className="text-gray-400 shrink-0" />
      <span className="truncate">{application.phone || 'Chưa cung cấp'}</span>
    </div>

    {application.adoptFor === 'Someone else' && (
      <span className="inline-block mt-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
        Nhận nuôi hộ người khác
      </span>
    )}
  </>
);

interface ApplicationCardProps {
  application: AdoptionApplication;
  isMoving: boolean;
  onClick: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, isMoving, onClick }) => {
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
      tabIndex={-1} // 👈 ghi đè tabIndex mà dnd-kit gán, tránh trình duyệt focus() -> kích hoạt forced-colors/high-contrast (viền vàng, đảo màu)
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-xl p-3.5 cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-md hover:shadow-gray-200/60 focus:outline-none focus-visible:outline-none ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isMoving ? 'pointer-events-none opacity-60' : ''}`}
    >
      <ApplicationCardContent application={application} />
    </div>
  );
};
