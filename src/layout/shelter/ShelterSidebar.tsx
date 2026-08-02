'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FiHome,
  FiHeart,
  FiClipboard,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiMessageCircle,
  FiBox,
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
  { id: 'dashboard', label: 'Trang chủ', icon: <FiHome size={22} />, path: '/shelter/dashboard' },
  {
    id: 'pets',
    label: 'Quản lý Pet',
    icon: <FiHeart size={22} />,
    children: [
      { id: 'all_pets', label: 'Danh sách Pet', path: '/shelter/pets' },
      { id: 'add_pet', label: 'Thêm Pet mới', path: '/shelter/pets/create' },
    ],
  },
  {
    id: 'applications',
    label: 'Hồ sơ nhận nuôi',
    icon: <FiClipboard size={22} />,
    path: '/shelter/applications',
  },
  {
    id: 'post-adoption',
    label: 'Đã nhận nuôi',
    icon: <FiBox size={22} />,
    path: '/shelter/post-adoption',
  },
  { id: 'profile', label: 'Cài đặt', icon: <FiUser size={22} />, path: '/shelter/profile' },
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
    <div className="w-full select-none mb-1 px-4">
      <Link
        href={item.path || '#'}
        onClick={handleClick}
        className={classNames(
          'flex items-center justify-between py-3 rounded-xl text-[16px] transition-all duration-200 cursor-pointer',
          {
            'bg-gray-50 text-[#0D062D] font-semibold': isActive && level === 0,
            'text-[#787486] font-medium hover:bg-gray-50 hover:text-[#0D062D]': !isActive && level === 0,
            'text-[#E89B5A] font-semibold': isSelfActive && level > 0,
            'text-[#787486] hover:text-[#E89B5A]': !isSelfActive && level > 0,
          }
        )}
      >
        <div className="flex items-center w-full">
          {level === 0 && (
            <div className="w-[56px] flex items-center justify-center shrink-0">
              <span className={isActive ? 'text-[#0D062D]' : 'text-[#787486] group-hover:text-[#0D062D] transition-colors'}>
                {item.icon}
              </span>
            </div>
          )}
          
          <span
            className={classNames(
              'truncate transition-all duration-300 overflow-hidden',
              level > 0 ? 'pl-4 group-hover:pl-[60px]' : '',
              'max-w-0 group-hover:max-w-[200px] opacity-0 group-hover:opacity-100'
            )}
          >
            {item.label}
          </span>
        </div>
        
        {hasChildren && (
          <FiChevronDown
            size={18}
            className={classNames(
              'text-[#787486] transition-all duration-300 shrink-0 overflow-hidden',
              'max-w-0 group-hover:max-w-5 opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-4',
              isOpen(item.id) ? 'rotate-180' : ''
            )}
          />
        )}
      </Link>

      <div
        className={classNames(
          'overflow-hidden transition-all duration-300',
          isOpen(item.id) 
            ? 'max-h-0 group-hover:max-h-[500px] opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-1' 
            : 'max-h-0 opacity-0'
        )}
      >
        {item.children?.map((child) => (
          <SidebarItem key={child.id} item={child} level={level + 1} isOpen={isOpen} toggleOpen={toggleOpen} />
        ))}
      </div>
    </div>
  );
};

const ShelterSidebar = () => {
  const { data: session } = useSession();
  const user = session?.user as any; // Cast để nhận dạng role từ Session
  
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ pets: true });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const toggleOpen = (id: string) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  // Helper map role thành label thân thiện
  const getRoleLabel = (role?: string) => {
    if (role === 'SHELTER_ADMIN') return 'Quản lý trạm';
    if (role === 'ADMIN') return 'Quản trị viên';
    return 'Nhân viên';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside 
      onMouseLeave={() => setIsProfileOpen(false)}
      className="group sticky top-0 left-0 w-[88px] hover:w-[272px] shrink-0 h-screen bg-white z-50 flex flex-col font-sans transition-[width] duration-300 ease-in-out whitespace-nowrap overflow-hidden"
    >
      
      {/* 1. User Profile Area */}
      <div className="relative pt-8 px-[22px] group-hover:px-6 pb-6 flex flex-col transition-all duration-300" ref={profileRef}>
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <Image
            src={user?.image || "/images/logo/pawlife-logo.png"}
            alt="Profile Avatar"
            width={44}
            height={44}
            priority
            className="rounded-full object-cover border border-gray-100 hover:border-[#E89B5A] transition-colors shrink-0 bg-white"
          />
          <div className="flex flex-col justify-center min-w-0 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[150px] transition-all duration-300 overflow-hidden">
            <h3 className="text-[16px] text-[#0D062D] font-semibold leading-tight truncate">
              {user?.name || 'PawLife Shelter'}
            </h3>
            <p className="text-[14px] text-[#787486] font-normal leading-tight mt-0.5 truncate">
              {'Shelter Manager'}
            </p>
          </div>
          <FiChevronDown 
            size={20} 
            className={classNames(
              "transition-all duration-300 shrink-0 overflow-hidden max-w-0 group-hover:max-w-5 opacity-0 group-hover:opacity-100",
              isProfileOpen ? "rotate-180 text-[#E89B5A]" : "text-gray-400 hover:text-[#E89B5A]"
            )} 
          />
        </div>

        {/* Dropdown Menu */}
        <div className={classNames(
          "absolute top-[84px] left-6 right-6 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top",
          isProfileOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
          "hidden group-hover:block" 
        )}>
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tài khoản</p>
            <p className="text-[13px] font-medium text-[#0D062D] truncate">
              {/* Render email thực tế từ DB */}
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <FiLogOut size={18} />
            <span>{isPending ? 'Đang xử lý...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </div>

      <div className="w-[44px] group-hover:w-[85%] mx-auto h-px bg-[#F1F1F1] mb-5 transition-all duration-300" />

      {/* 2. Menu Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {SHELTER_MENU.map((item) => (
          <SidebarItem key={item.id} item={item} isOpen={(id) => !!openItems[id]} toggleOpen={toggleOpen} />
        ))}
      </div>

      <div className="w-[44px] group-hover:w-[85%] mx-auto h-px bg-[#F1F1F1] my-4 transition-all duration-300" />

      {/* 3. Thoughts Time Card */}
      <div className="px-4 mb-5 mt-2">
        <div className="relative w-full bg-gray-50 rounded-[20px] flex flex-col items-center border border-gray-100 transition-all duration-300 h-[56px] group-hover:h-[210px]">
          
          <div className="absolute left-1/2 -translate-x-1/2 top-[3px] group-hover:-top-6 w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-all duration-300 z-10">
            <div className="w-9 h-9 bg-yellow-50 rounded-full flex items-center justify-center">
              <FiMessageCircle size={18} className="text-yellow-500" />
            </div>
          </div>

          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[240px] px-4 opacity-0 group-hover:opacity-100 flex flex-col items-center pointer-events-none group-hover:pointer-events-auto transition-all duration-300 z-0">
            <h4 className="text-[14px] font-semibold text-black mb-2 tracking-wide">Thoughts Time</h4>
            <p className="text-[12px] text-[#787486] text-center leading-relaxed mb-4 whitespace-normal">
              We don’t have any notice for you, till then you can share your thoughts with your peers.
            </p>
            <button className="w-full py-2.5 bg-white rounded-xl text-[14px] font-semibold text-black shadow-sm hover:bg-gray-100 transition-colors">
              Write a message
            </button>
          </div>
        </div>
      </div>
      
    </aside>
  );
};

export default React.memo(ShelterSidebar);