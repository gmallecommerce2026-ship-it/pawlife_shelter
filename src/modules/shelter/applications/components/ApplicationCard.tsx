'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation'; // <-- Import useRouter
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageCircle, 
  FileText, 
  MoreVertical,
  User,
  PawPrint,
  Folder,
  X
} from 'lucide-react';
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
  onOpenProfile: (app: AdoptionApplication) => void;
  onOpenDetail: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
}

export const ApplicationCardContent: React.FC<ApplicationCardContentProps> = ({ 
  application, 
  showRedDot, 
  onOpenProfile,
  onOpenDetail,
  onRemove
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // <-- Khởi tạo router

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
    e.stopPropagation(); // Ngăn click lan ra Card (tránh mở Profile)
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 8,
        left: rect.right - 220,
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // --- XỬ LÝ LOGIC CÁC OPTION CỦA MENU ---
  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation(); // Ngăn sự kiện lan ra Card
    setIsMenuOpen(false);
    
    switch (action) {
      case 'applicantProfile':
        onOpenProfile(application);
        break;
      case 'petProfile':
        // Điều hướng sang trang pet dựa vào ID của Pet
        const petId = application.pet?.id;
        if (petId) {
          router.push(`/shelter/pets/${petId}`);
        } else {
          console.error("Pet ID is missing");
        }
        break;
      case 'viewApplication':
        onOpenDetail(application);
        break;
      case 'allDocuments':
        console.log("Mở All Documents");
        break;
      case 'removeTicket':
        // Có thể thêm một cửa sổ confirm trước khi xoá nếu muốn
        if (window.confirm("Are you sure you want to remove this ticket?")) {
          onRemove(application);
        }
        break;
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="absolute top-[-4px] right-[-4px] z-[5]">
        <button 
          ref={buttonRef}
          className={`p-1.5 rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 ${
            isMenuOpen ? 'opacity-100 bg-gray-100 text-gray-800' : 'opacity-0 text-gray-400 group-hover:opacity-100'
          }`}
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={toggleMenu}
        >
          <MoreVertical size={18} strokeWidth={2} />
        </button>

        {mounted && isMenuOpen && createPortal(
          <div 
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              zIndex: 99999,
              animation: 'menuPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            className="w-[220px] bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E5E5E5] py-2.5 flex flex-col origin-top-right"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()} 
          >
            <style>{`
              @keyframes menuPopIn {
                0% { opacity: 0; transform: scale(0.92) translateY(-10px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
            
            <button onClick={(e) => handleMenuAction(e, 'applicantProfile')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors w-full text-left">
              <User size={18} className="text-gray-800" strokeWidth={1.5} />
              <span className="font-['Urbanist',_sans-serif] text-[15px] text-gray-900 font-medium">Applicant Profile</span>
            </button>
            <button onClick={(e) => handleMenuAction(e, 'petProfile')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors w-full text-left">
              <PawPrint size={18} className="text-gray-800" strokeWidth={1.5} />
              <span className="font-['Urbanist',_sans-serif] text-[15px] text-gray-900 font-medium">Pet Profile</span>
            </button>
            <button onClick={(e) => handleMenuAction(e, 'viewApplication')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors w-full text-left">
              <FileText size={18} className="text-gray-800" strokeWidth={1.5} />
              <span className="font-['Urbanist',_sans-serif] text-[15px] text-gray-900 font-medium">View Application</span>
            </button>
            <button onClick={(e) => handleMenuAction(e, 'allDocuments')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors w-full text-left">
              <Folder size={18} className="text-gray-800" strokeWidth={1.5} />
              <span className="font-['Urbanist',_sans-serif] text-[15px] text-gray-900 font-medium">All Documents</span>
            </button>
            
            <div className="h-[1px] w-[calc(100%-20px)] mx-auto bg-gray-100 my-1"></div>
            
            <button onClick={(e) => handleMenuAction(e, 'removeTicket')} className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-left group/remove">
              <X size={18} className="text-[#DC2626] group-hover/remove:text-red-700 transition-colors" strokeWidth={1.5} />
              <span className="font-['Urbanist',_sans-serif] text-[15px] text-[#DC2626] group-hover/remove:text-red-700 font-medium transition-colors">Remove Ticket</span>
            </button>
          </div>,
          document.body 
        )}
      </div>

      {/* Avatar & Tên */}
      <div className="flex items-center gap-3 w-full mb-4 pr-6">
        <img
          className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200 shrink-0"
          src={application.pet?.avatarUrl || "/images/placeholder-avatar.png"}
          alt={application.fullName}
        />
        <div className="flex flex-col justify-center gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="font-['Urbanist',_sans-serif] text-[15px] text-gray-900 font-semibold truncate leading-tight hover:text-[#E89B5A] hover:underline cursor-pointer transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfile(application); // Vẫn giữ mở Profile khi click vào tên
              }}
            >
              {application.fullName}
            </span>
          </div>
          <span className="font-['Urbanist',_sans-serif] text-[12.5px] text-gray-500 font-normal leading-tight truncate">
            Apply for <span className="font-bold text-gray-800">{application.pet?.name || "Luna"}</span>
          </span>
        </div>
      </div>

      {/* Thông tin liên hệ */}
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

      {/* Footer */}
      <div className="flex items-center justify-between w-full pt-3.5 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" strokeWidth={2} />
          <span className="font-['Urbanist',_sans-serif] text-[11px] text-gray-500 font-medium tracking-wide">
            {formatSubmittedAt(application.createdAt)}
          </span>
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
  onRemove: (app: AdoptionApplication) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  isMoving, 
  showRedDot,
  showMenu,
  onOpenProfile,
  onOpenDetail,
  onRemove
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
      onClick={() => onOpenProfile(application)} // <--- CLICK VÀO CARD MẶC ĐỊNH SẼ MỞ PROFILE
      className={`group bg-white rounded-[14px] w-full p-[14px] border border-[#F0F0F0] cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-md hover:border-[#E5E5E5] focus:outline-none relative ${
        isDragging ? 'opacity-40 shadow-xl z-50' : 'shadow-sm z-10'
      } ${isMoving ? 'pointer-events-none opacity-60' : ''}`}
    >
      <ApplicationCardContent 
        application={application} 
        showRedDot={showRedDot} 
        showMenu={showMenu}
        onOpenProfile={onOpenProfile}
        onOpenDetail={onOpenDetail}
        onRemove={onRemove}
      />
    </div>
  );
};