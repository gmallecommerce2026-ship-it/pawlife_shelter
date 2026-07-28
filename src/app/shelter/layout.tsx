import React from 'react';
import ShelterSidebar from '@/layout/shelter/ShelterSidebar';

export default function ShelterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <ShelterSidebar />
      <main className="ml-[260px] p-8 flex justify-center">
        {children}
      </main>
    </div>
  );
}
