// src/layout/shelter/ShelterSidebar.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Đã thêm import Image
import { usePathname } from 'next/navigation';
import {
  FiHome, FiHeart, FiClipboard, FiUser, FiLogOut, FiChevronDown,
} from 'react-icons/fi';
import classNames from 'classnames';
import { logout } from '@/actions/logout';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const SHELTER_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <FiHome size={20} />, path: '/shelter/dashboard' },
  {
    id: 'pets',
    label: 'Quản lý Pets',
    icon: <FiHeart size={20} />,
    children: [
      { id: 'all_pets', label: 'Danh sách Pet', path: '/shelter/pets' },
      { id: 'add_pet', label: 'Thêm Pet mới', path: '/shelter/pets/create' },
    ],
  },
  {
    id: 'applications',
    label: 'Đơn nhận nuôi',
    icon: <FiClipboard size={20} />,
    path: '/shelter/applications',
  },
  { id: 'profile', label: 'Hồ sơ trạm', icon: <FiUser size={20} />, path: '/shelter/profile' },
];

const SidebarItem = ({ item, level = 0, isOpen, toggleOpen }: {
  item: MenuItem, level?: number, isOpen: (id: string) => boolean, toggleOpen: (id: string) => void
}) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  const checkActive = (menuItemPath?: string) => menuItemPath ? pathname.startsWith(menuItemPath) : false;
  const isSelfActive = checkActive(item.path);
  const isChildActive = item.children?.some(child => checkActive(child.path));
  const isActive = isSelfActive || isChildActive;

  useEffect(() => {
    if (isChildActive && !isOpen(item.id)) toggleOpen(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isChildActive, item.id]);

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      toggleOpen(item.id);
    }
  };

  return (
    <div className="w-full select-none">
      <Link
        href={item.path || '#'}
        onClick={handleClick}
        className={classNames(
          'flex items-center justify-between py-3 px-6 text-sm transition-all duration-200 cursor-pointer group hover:bg-stone-50',
          {
            // --- PAWLIFE THEME: PRIMARY ORANGE (#E89B5A) ---
            'text-[#E89B5A] bg-[#E89B5A]/10 font-bold border-r-[3px] border-[#E89B5A]': isActive && level === 0,
            'text-gray-600': !isActive && level === 0,
            'pl-12 py-2.5': level === 1,
            'text-[#E89B5A] font-medium': isSelfActive && level > 0,
            'text-gray-500 hover:text-[#E89B5A]': !isSelfActive && level > 0,
          }
        )}
      >
        <div className="flex items-center gap-3">
          {level === 0 && (
            <span className={isActive ? 'text-[#E89B5A]' : 'text-gray-400 group-hover:text-[#E89B5A]'}>
              {item.icon}
            </span>
          )}
          <span className="truncate">{item.label}</span>
        </div>
        {hasChildren && (
          <FiChevronDown
            size={16}
            className={classNames('text-gray-400 transition-transform duration-200', isOpen(item.id) ? 'rotate-180' : '')}
          />
        )}
      </Link>

      <div className={classNames('overflow-hidden transition-all duration-300 bg-gray-50/50', isOpen(item.id) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
        {item.children?.map(child => (
          <SidebarItem key={child.id} item={child} level={level + 1} isOpen={isOpen} toggleOpen={toggleOpen} />
        ))}
      </div>
    </div>
  );
};

const ShelterSidebar = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ pets: true });
  const [, startTransition] = useTransition();
  const toggleOpen = (id: string) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <aside className="fixed top-0 left-0 w-[260px] h-screen bg-white border-r border-gray-100 shadow-xl shadow-gray-200/50 z-50 flex flex-col font-sans">
      {/* Header Logo Đã Thay Bằng Image */}
      <div className="h-[80px] flex items-center justify-between px-6 border-b border-gray-100">
        <Link href="/shelter/dashboard" className="block transition-transform hover:scale-105 shrink-0 pt-1">
          <Image
            src="/images/logo/pawlife-logo.png"
            alt="PawLife Logo"
            width={40} // Có thể điều chỉnh width tùy theo tỷ lệ logo thật của bạn
            height={40} // Có thể điều chỉnh height
            priority
            className="object-contain"
          />
        </Link>
          PawLife
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-1">
        {SHELTER_MENU.map(item => (
          <SidebarItem key={item.id} item={item} isOpen={(id) => !!openItems[id]} toggleOpen={toggleOpen} />
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <FiLogOut size={18} /> <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default React.memo(ShelterSidebar);