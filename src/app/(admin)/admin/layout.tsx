// src/app/(admin)/admin/layout.tsx
import AdminSidebar from "@/layout/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f9fafb]"> 
      {/* Sidebar cố định */}
      <AdminSidebar />

      {/* Main Content Area - Padding left = width sidebar */}
      <main className="flex-1 ml-[260px] p-8 transition-all duration-300 ease-in-out">
        <div className="max-w-[1600px] mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}