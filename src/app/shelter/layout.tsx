import React from 'react';
import ShelterSidebar from '@/layout/shelter/ShelterSidebar';
import AuthProvider from '@/components/auth/AuthProvider';

/**
 * Mobile (< md):
 *  - Sidebar tự ẩn, thay bằng tab bar cố định ở đáy → main chừa `pb-tabbar`
 *  - Không bo góc / viền / padding 32px nữa → p-4, nền phẳng như app
 *  - `relative` KHÔNG kèm z-index: nếu để `z-20` thì tạo stacking context, mọi modal
 *    bên trong (z-[100]) bị kẹt dưới tab bar (z-40). Chỉ bật `md:z-20` từ desktop.
 * Desktop (≥ md): giữ nguyên thiết kế cũ.
 */
export default function ShelterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative flex min-h-screen bg-white">
        <ShelterSidebar />

        <main className="min-w-0 flex-1 pt-[env(safe-area-inset-top)] pb-tabbar transition-all duration-300 ease-in-out md:pt-[22px]">
          <div className="relative h-full min-h-app-page w-full overflow-hidden bg-white p-4 md:z-20 md:rounded-tl-[30px] md:border md:border-[#D9D9D9] md:p-[32px] md:shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}