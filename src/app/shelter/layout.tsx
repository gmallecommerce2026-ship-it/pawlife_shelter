import React from 'react';
import ShelterSidebar from '@/layout/shelter/ShelterSidebar';
import AuthProvider from '@/components/auth/AuthProvider'; 

export default function ShelterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Vùng Flexbox chính */}
      <div className="relative flex min-h-screen bg-white">
        
        {/* Sidebar bây giờ chiếm diện tích thật trong luồng Flexbox */}
        <ShelterSidebar />

        {/* Main sử dụng flex-1 để TỰ ĐỘNG co giãn theo kích thước của Sidebar */}
        {/* Không cần dùng margin-left nữa, bố cục sẽ tự bung rộng ra khi sidebar thu hẹp */}
        <main className="flex-1 p-[22px] min-w-0 transition-all duration-300 ease-in-out">
          <div className="w-full h-full p-[32px] min-h-[calc(100vh-44px)] bg-white border border-[#D9D9D9] rounded-[30px] overflow-hidden relative z-20 shadow-sm">
            {children}
          </div>
        </main>
        
      </div>
    </AuthProvider>
  );
}