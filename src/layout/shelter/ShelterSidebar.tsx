'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiHeart,
  FiClipboard,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiMessageCircle,
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
  { id: 'dashboard', label: 'Home', icon: <FiHome size={22} />, path: '/shelter/dashboard' },
  {
    id: 'pets',
    label: 'Pet Management',
    icon: <FiHeart size={22} />,
    children: [
      { id: 'all_pets', label: 'Danh sách Pet', path: '/shelter/pets' },
      { id: 'add_pet', label: 'Thêm Pet mới', path: '/shelter/pets/create' },
    ],
  },
  {
    id: 'applications',
    label: 'Post Adoption',
    icon: <FiClipboard size={22} />,
    path: '/shelter/applications',
  },
  { id: 'profile', label: 'Settings', icon: <FiUser size={22} />, path: '/shelter/profile' },
];

const SidebarItem = ({
  item,
  level = 0,
  isOpen,
  toggleOpen,
}: {
  item: MenuItem;
  level?: number;
  isOpen: (id: string) => boolean;
  toggleOpen: (id: string) => void;
}) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  const checkActive = (menuItemPath?: string) =>
    menuItemPath ? pathname.startsWith(menuItemPath) : false;
  const isSelfActive = checkActive(item.path);
  const isChildActive = item.children?.some((child) => checkActive(child.path));
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
    <div className="w-full select-none mb-1">
      <Link
        href={item.path || '#'}
        onClick={handleClick}
        className={classNames(
          'flex items-center justify-between py-3 px-4 rounded-xl text-[16px] transition-all duration-200 cursor-pointer group',
          {
            'bg-gray-50 text-[#0D062D] font-semibold': isActive && level === 0,
            'text-[#787486] font-medium hover:bg-gray-50 hover:text-[#0D062D]': !isActive && level === 0,
            'pl-12 py-2.5': level === 1,
            'text-[#E89B5A] font-semibold': isSelfActive && level > 0,
            'text-[#787486] hover:text-[#E89B5A]': !isSelfActive && level > 0,
          }
        )}
      >
        <div className="flex items-center gap-4">
          {level === 0 && (
            <span
              className={isActive ? 'text-[#0D062D]' : 'text-[#787486] group-hover:text-[#0D062D]'}
            >
              {item.icon}
            </span>
          )}
          <span className="truncate">{item.label}</span>
        </div>
        {hasChildren && (
          <FiChevronDown
            size={18}
            className={classNames(
              'text-[#787486] transition-transform duration-200',
              isOpen(item.id) ? 'rotate-180' : ''
            )}
          />
        )}
      </Link>

      <div
        className={classNames(
          'overflow-hidden transition-all duration-300',
          isOpen(item.id) ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
        )}
      >
        {item.children?.map((child) => (
          <SidebarItem
            key={child.id}
            item={child}
            level={level + 1}
            isOpen={isOpen}
            toggleOpen={toggleOpen}
          />
        ))}
      </div>
    </div>
  );
};

const ShelterSidebar = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ pets: true });
  const [, startTransition] = useTransition();
  
  const toggleOpen = (id: string) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  
  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <aside className="fixed top-0 left-0 w-[272px] h-screen bg-white border-r border-[#D9D9D9] shadow-sm z-50 flex flex-col font-sans">
      
      {/* 1. User Profile Area */}
      <div className="pt-8 px-6 pb-6 flex flex-col">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo/pawlife-logo.png" // Fallback: đổi thành "/assets/ImageAsset1.png" nếu muốn avatar thật
            alt="Profile Avatar"
            width={44}
            height={44}
            priority
            className="rounded-full object-cover border border-gray-100"
          />
          <div className="flex flex-col flex-1 justify-center">
            <h3 className="text-[16px] text-[#0D062D] font-semibold leading-tight whitespace-nowrap">
              Anima Agrawal
            </h3>
            <p className="text-[14px] text-[#787486] font-normal leading-tight mt-0.5">
              Shelter Manager
            </p>
          </div>
          <FiChevronDown size={20} className="text-gray-400 cursor-pointer" />
        </div>
      </div>

      <div className="w-[85%] mx-auto h-px bg-[#F1F1F1] mb-5" />

      {/* 2. Menu Navigation */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {SHELTER_MENU.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isOpen={(id) => !!openItems[id]}
            toggleOpen={toggleOpen}
          />
        ))}
      </div>

      <div className="w-[85%] mx-auto h-px bg-[#F1F1F1] my-4" />

      {/* 3. Thoughts Time Card */}
      <div className="px-5 mb-5">
        <div className="relative w-full bg-gray-50 rounded-[20px] pt-10 pb-5 px-4 flex flex-col items-center border border-gray-100">
          {/* Bulb/Lamp Icon Box */}
          <div className="absolute -top-6 w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
            <div className="w-9 h-9 bg-yellow-50 rounded-full flex items-center justify-center">
              <FiMessageCircle size={18} className="text-yellow-500" />
            </div>
          </div>

          <h4 className="text-[14px] font-semibold text-black mb-2 tracking-wide">
            Thoughts Time
          </h4>
          <p className="text-[12px] text-[#787486] text-center leading-relaxed mb-4">
            We don’t have any notice for you, till then you can share your thoughts with your peers.
          </p>
          <button className="w-full py-2.5 bg-white rounded-xl text-[14px] font-semibold text-black shadow-sm hover:bg-gray-100 transition-colors active:scale-95">
            Write a message
          </button>
        </div>
      </div>

      {/* 4. Logout Action */}
      <div className="p-4 bg-gray-50/50">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[15px] font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <FiLogOut size={20} /> <span>Đăng xuất</span>
        </button>
      </div>
      
    </aside>
  );
};

export default React.memo(ShelterSidebar);