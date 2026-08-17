// components/ApplicationCard.tsx (hoặc file chứa ApplicationCardContent)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  MoreVertical,
  User,
  Folder,
  X,
  File
} from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

const formatSubmittedAt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '13/02/2026';
  }
};

interface ApplicationCardContentProps {
  application: AdoptionApplication;
  showRedDot?: boolean;
  showMenu?: boolean;
  onOpenProfile: (app: AdoptionApplication) => void;
  onOpenDetail: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
  onOpenDocuments: (app: AdoptionApplication) => void;
}

export const ApplicationCardContent: React.FC<ApplicationCardContentProps> = ({
  application,
  showRedDot,
  onOpenProfile,
  onOpenDetail,
  onRemove,
  onOpenDocuments
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Bóc tách danh sách tags động từ application (hỗ trợ cả dạng nested t.tag lẫn dạng phẳng)
  const displayTags = application.tags ? application.tags.map((t: any) => t.tag || t) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => { if (isMenuOpen) setIsMenuOpen(false); };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isMenuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 8,
        left: rect.right - 220,
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    switch (action) {
      case 'applicantProfile':
        onOpenProfile(application);
        break;
      case 'petProfile':
        const petId = application.pet?.id;
        if (petId) router.push(`/shelter/pets/${petId}`);
        break;
      case 'allDocuments': onOpenDocuments(application); break;
      case 'viewApplication': onOpenDetail(application); break;
      case 'removeTicket':
        if (window.confirm("Are you sure you want to remove this ticket?")) {
          onRemove(application);
        }
        break;
    }
  };

  return (
    <div className="flex flex-col w-full relative group/content">
      <div className="absolute top-[-4px] right-[-4px] z- opacity-0 group-hover/content:opacity-100 transition-opacity">
        <button
          ref={buttonRef}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-all"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMenu}
        >
          <MoreVertical size={16} strokeWidth={2} />
        </button>
        {mounted && isMenuOpen && createPortal(
          <div ref={menuRef} style={{ position: 'fixed', top: `${menuCoords.top}px`, left: `${menuCoords.left}px`, zIndex: 99999 }} className="w-[220px] bg-white rounded-[16px] shadow-xl border border-gray-100 py-2.5 flex flex-col origin-top-right">
            <button onClick={(e) => handleMenuAction(e, 'applicantProfile')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 w-full text-left"><User size={18} className="text-gray-800" /> <span className="text-[15px] font-medium text-gray-900">Applicant Profile</span></button>
            <button onClick={(e) => handleMenuAction(e, 'viewApplication')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 w-full text-left"><FileText size={18} className="text-gray-800" /> <span className="text-[15px] font-medium text-gray-900">View Application</span></button>
            <button onClick={(e) => handleMenuAction(e, 'allDocuments')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 w-full text-left"><Folder size={18} className="text-gray-800" /> <span className="text-[15px] font-medium text-gray-900">All Documents</span></button>
            <div className="h-[1px] w-full bg-gray-100 my-1"></div>
            <button onClick={(e) => handleMenuAction(e, 'removeTicket')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-red-50 w-full text-left"><X size={18} className="text-red-600" /> <span className="text-[15px] font-medium text-red-600">Remove Ticket</span></button>
          </div>,
          document.body
        )}
      </div>

      {/* 1. Avatar & Name */}
      <div className="flex items-center gap-3.5 w-full mb-[18px]">
        <img
          className="w-[44px] h-[44px] rounded-full object-cover bg-gray-100 border border-gray-200 shrink-0"
          src={application.pet?.avatarUrl || application.pet?.images?.[0]?.url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"}
          alt={application.fullName || application.user?.name || "Maria Garcia"}
        />
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-sans text-[16px] text-[#111111] font-semibold truncate hover:text-[#E89B5A] cursor-pointer transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onOpenProfile(application); }}
            >
              {application.fullName || application.user?.name || "Maria Garcia"}
            </span>
            {showRedDot && (
              <span className="w-[7px] h-[7px] bg-[#FF6B6B] rounded-full shrink-0"></span>
            )}
          </div>
          <span className="font-sans text-[13.5px] text-[#888888] mt-0.5 truncate">
            Apply for <span className="font-semibold text-[#111111]">{application.pet?.name || "Luna"}</span>
          </span>
        </div>
      </div>

      {/* 2. Contact Info */}
      <div className="flex flex-col gap-2.5 mb-[18px]">
        <div className="flex items-center gap-3 w-full">
          <Phone size={14} className="text-[#888888] shrink-0" strokeWidth={2} />
          <span className="font-sans text-[13px] text-[#555555] font-semibold tracking-wide truncate">
            {application.phone || "0912345678"}
          </span>
        </div>
        <div className="flex items-center gap-3 w-full">
          <Mail size={14} className="text-[#888888] shrink-0" strokeWidth={2} />
          <span className="font-sans text-[13px] text-[#888888] font-normal truncate">
            {application.user?.email || application.zalo || "mariagarcia@email.com"}
          </span>
        </div>
      </div>

      {/* 3. Chips (Hiển thị Tag Động) */}
      <div className="flex flex-wrap items-center gap-2 mb-[18px] min-h-[26px]">
        {displayTags.length === 0 ? (
          <span className="text-[12px] text-gray-400 italic">No tags</span>
        ) : (
          displayTags.map((tag: any, idx: number) => {
            // Danh sách màu luân phiên nếu tag không có mã màu riêng
            const colorPalette = [
              'bg-[#EEF3FF] text-[#5982E6]',
              'bg-[#FFF4E6] text-[#FF922B]',
              'bg-[#EBFBEE] text-[#40C057]',
              'bg-[#F3F0FF] text-[#7950F2]',
            ];
            const colorClass = colorPalette[idx % colorPalette.length];

            return (
              <div
                key={tag.id || idx}
                className={`px-3 py-[4px] rounded-full ${colorClass}`}
              >
                <span className="font-sans text-[11.5px] font-semibold tracking-tight">
                  {tag.name}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Divider */}
      <div className="w-full h-px bg-[#EEEEEE] mb-3.5" />

      {/* 5. Footer */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-[#888888]" strokeWidth={1.8} />
          <span className="font-sans text-[12px] text-[#888888] font-medium tracking-wide">
            {formatSubmittedAt(application.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Notes count">
            <MessageCircle size={13} className="text-[#888888]" strokeWidth={1.8} />
            <span className="font-sans text-[12px] text-[#888888] font-semibold">
              {application.notes?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Tags count">
            <File size={13} className="text-[#888888]" strokeWidth={1.8} />
            <span className="font-sans text-[12px] text-[#888888] font-semibold">
              {displayTags.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ApplicationCardProps {
  application: AdoptionApplication;
  isMoving: boolean;
  showRedDot?: boolean;
  showMenu?: boolean;
  onOpenProfile: (app: AdoptionApplication) => void;
  onOpenDetail: (app: AdoptionApplication) => void;
  onCardClick: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
  onOpenDocuments: (app: AdoptionApplication) => void;
  onOpenQuickView: (app: AdoptionApplication) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isMoving,
  showRedDot,
  showMenu,
  onOpenProfile,
  onOpenDetail,
  onCardClick,
  onRemove,
  onOpenDocuments,
  onOpenQuickView
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    forcedColorAdjust: 'none' as const,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={-1}
      onClick={() => onCardClick(application)}
      className={`group bg-white rounded-[16px] w-full p-[17px] border border-[#EAEAEA] cursor-grab active:cursor-grabbing select-none focus:outline-none relative ${
        isDragging ? 'opacity-40 shadow-xl z-50' : 'z-10 hover:border-[#D1D1D1]'
      } ${isMoving ? 'pointer-events-none opacity-60' : ''}`}
    >
      <ApplicationCardContent
        application={application}
        showRedDot={showRedDot}
        showMenu={showMenu}
        onOpenProfile={onOpenProfile}
        onOpenDetail={onOpenDetail}
        onRemove={onRemove}
        onOpenDocuments={onOpenDocuments}
      />
    </div>
  );
};