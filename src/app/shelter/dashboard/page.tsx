'use client';

import React from 'react';
import Link from 'next/link';
import {
  PawPrint,
  ClipboardList,
  Store,
  Box,
  ArrowRight,
  Activity,
  TrendingUp,
  PieChart as PieChartIcon, // Đổi tên icon để không trùng với Recharts
  HeartHandshake,
  QrCode
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// --- MOCK DATA ---
const adoptionData = [
  { month: 'T1', dogs: 12, cats: 8 },
  { month: 'T2', dogs: 15, cats: 12 },
  { month: 'T3', dogs: 10, cats: 18 },
  { month: 'T4', dogs: 22, cats: 15 },
  { month: 'T5', dogs: 18, cats: 25 },
  { month: 'T6', dogs: 30, cats: 22 },
];

const petTypeData = [
  { name: 'Chó', value: 45, color: '#3DB2FF' },
  { name: 'Mèo', value: 38, color: '#FF6B93' },
  { name: 'Khác', value: 5, color: '#E89B5A' },
];

export default function ShelterDashboardPage() {
  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  return (
    // THÊM mx-auto VÀO ĐÂY ĐỂ CĂN GIỮA TOÀN BỘ TRANG
    <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-8 pb-10 font-sans">

      {/* 1. Header Section */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-bold text-[#E89B5A] tracking-widest uppercase">
          {today}
        </p>
        <h1 className="font-['Be_Vietnam_Pro',_sans-serif] text-[32px] sm:text-[40px] text-[#0D062D] font-bold leading-tight tracking-tight">
          Chào mừng trở lại 👋
        </h1>
        <p className="text-[15px] text-gray-500">
          Đây là trung tâm điều khiển, nơi bạn quản lý hồ sơ trạm, thú cưng và các đơn nhận nuôi.
        </p>
      </div>

      {/* 2. Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Thú cưng có sẵn" value="12" icon={<PawPrint size={20} />} color="text-[#3B82F6]" bg="bg-[#EFF6FF]" />
        <StatCard title="Đơn chờ duyệt" value="5" icon={<ClipboardList size={20} />} color="text-[#E89B5A]" bg="bg-[#FFF4EA]" />
        <StatCard title="Đã nhận nuôi" value="48" icon={<Activity size={20} />} color="text-[#22C55E]" bg="bg-[#F0FDF4]" />

        {/* SỬA DÒNG DƯỚI CÙNG NÀY */}
        <StatCard
          title="QR đã cấp"
          value="124"
          icon={<QrCode size={20} />}
          color="text-[#A855F7]"
          bg="bg-[#FAF5FF]"
        />
      </div>

      {/* 3. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Biểu đồ Area (Chiếm 2/3 không gian) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#E89B5A]" />
                Thống kê nhận nuôi
              </h2>
              <p className="text-[13px] text-gray-400 mt-1">Xu hướng 6 tháng gần nhất</p>
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* Tinh chỉnh lại margin để cân đối bên phải */}
              <AreaChart data={adoptionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3DB2FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3DB2FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E89B5A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E89B5A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                  cursor={{ stroke: '#E89B5A', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" name="Chó" dataKey="dogs" stroke="#3DB2FF" strokeWidth={3} fillOpacity={1} fill="url(#colorDogs)" />
                <Area type="monotone" name="Mèo" dataKey="cats" stroke="#E89B5A" strokeWidth={3} fillOpacity={1} fill="url(#colorCats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Doughnut (CÂN ĐỐI LẠI TRỌNG TÂM) */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col">
          <div className="mb-2">
            <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon size={20} className="text-[#FF6B93]" />
              Phân loại Pet
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">Cấu trúc thú cưng tại trạm</p>
          </div>

          <div className="flex-1 w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={petTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65} // Tạo lỗ hổng ở giữa (Doughnut)
                  outerRadius={85}
                  paddingAngle={5} // Khoảng cách giữa các mảnh
                  dataKey="value"
                  stroke="none"
                >
                  {petTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', color: '#4B5563', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Lối tắt quản lý */}
      <div className="mt-2">
        <h2 className="text-[18px] font-bold text-[#0D062D] mb-4">Lối tắt quản lý</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ActionCard href="/shelter/pets" icon={<PawPrint size={24} />} title="Quản lý Pets" desc="Thêm, sửa, xóa và cập nhật trạng thái thú cưng." />
          <ActionCard href="/shelter/applications" icon={<ClipboardList size={24} />} title="Đơn nhận nuôi" desc="Duyệt hồ sơ Kanban, lên lịch phỏng vấn và bàn giao." />
          <ActionCard href="/shelter/post-adoption" icon={<Box size={24} />} title="Theo dõi sau nhận nuôi" desc="Kiểm tra trạng thái sức khỏe thú cưng sau khi về nhà mới." />
          <ActionCard href="/shelter/profile" icon={<Store size={24} />} title="Hồ sơ trạm" desc="Cập nhật thông tin liên hệ, giờ mở cửa và hình ảnh." />
        </div>
      </div>

    </div>
  );
}

// --- Sub-components ---
function StatCard({ title, value, icon, color, bg }: { title: string, value: string, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 flex flex-col gap-3 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[26px] font-bold text-gray-900 leading-none mb-1.5">{value}</p>
        <p className="text-[13px] text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, desc }: { href: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between bg-white border border-gray-200/80 rounded-[20px] p-6 hover:border-[#E89B5A] hover:shadow-[0_8px_30px_rgb(232,155,90,0.12)] transition-all duration-300"
    >
      <div className="flex items-center gap-5">
        <div className="w-[56px] h-[56px] rounded-2xl bg-[#FFF4EA] text-[#E89B5A] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#E89B5A] group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
          {icon}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-[16px] text-gray-900 group-hover:text-[#E89B5A] transition-colors">
            {title}
          </h3>
          <p className="text-[13px] text-gray-500 leading-snug max-w-[260px]">
            {desc}
          </p>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FFF4EA] transition-colors shrink-0">
        <ArrowRight size={18} className="text-gray-400 group-hover:text-[#E89B5A] group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </Link>
  );
}