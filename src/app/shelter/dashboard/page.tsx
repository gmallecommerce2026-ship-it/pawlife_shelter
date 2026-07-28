import React from 'react';
import Link from 'next/link';
import { FiHeart, FiUser, FiArrowRight, FiArchive } from 'react-icons/fi';

export default function ShelterDashboardPage() {
  return (
    <div className="w-full max-w-[900px]">
      <h1 className="font-sans text-2xl text-[#123832] font-bold mb-1">Chào mừng trở lại 👋</h1>
      <p className="text-sm text-gray-500 mb-8">Đây là nơi bạn quản lý hồ sơ trạm và danh sách pet đang chờ nhận nuôi.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/shelter/pets"
          className="group flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#E89B5A] hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl #ffefe1 text-[#E89B5A] flex items-center justify-center">
              <FiHeart size={22} />
            </div>
            <div>
              <h3 className="font-bold text-[#123832]">Quản lý Pets</h3>
              <p className="text-sm text-gray-500">Thêm, sửa, cập nhật trạng thái pet</p>
            </div>
          </div>
          <FiArrowRight className="text-gray-300 group-hover:text-[#E89B5A] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/shelter/profile"
          className="group flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#E89B5A] hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl #ffefe1 text-[#E89B5A] flex items-center justify-center">
              <FiUser size={22} />
            </div>
            <div>
              <h3 className="font-bold text-[#123832]">Hồ sơ trạm</h3>
              <p className="text-sm text-gray-500">Cập nhật thông tin công khai của trạm</p>
            </div>
          </div>
          <FiArrowRight className="text-gray-300 group-hover:text-[#E89B5A] group-hover:translate-x-1 transition-all" />
        </Link>
        <Link
          href="/shelter/profile"
          className="group flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#E89B5A] hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl #ffefe1 text-[#E89B5A] flex items-center justify-center">
              <FiArchive size={22} />
            </div>
            <div>
              <h3 className="font-bold text-[#123832]">Đơn nhận nuôi</h3>
              <p className="text-sm text-gray-500">Duyệt hồ sơ nhận nuôi</p>
            </div>
          </div>
          <FiArrowRight className="text-gray-300 group-hover:text-[#E89B5A] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
