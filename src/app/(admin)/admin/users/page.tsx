// src/app/(admin)/admin/users/page.tsx
import { db } from "@/lib/db";
import { User, MoreHorizontal, Shield, ShieldAlert, Minus, Crown, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { Prisma, Role } from "@prisma/client";
import UserToolbar from "./components/UserToolbar";
import Link from "next/link";
import UserActions from "./components/UserActions";
// ... (Giữ nguyên phần cấu hình VIP_TIERS và getVipStatus) ...
const VIP_TIERS = [
  { 
    id: "DIAMOND", 
    minPoints: 1000, 
    label: "KIM CƯƠNG", 
    color: "bg-purple-100 text-purple-700 border-purple-200", 
    barColor: "from-purple-500 to-pink-500",
    icon: <Crown size={14} /> 
  },
  { 
    id: "GOLD", 
    minPoints: 500, 
    label: "VÀNG", 
    color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    barColor: "from-yellow-400 to-orange-500",
    icon: "🥇" 
  },
  { 
    id: "SILVER", 
    minPoints: 200, 
    label: "BẠC", 
    color: "bg-gray-100 text-gray-700 border-gray-200", 
    barColor: "from-gray-300 to-gray-500",
    icon: "🥈" 
  },
  { 
    id: "MEMBER", 
    minPoints: 0, 
    label: "THÀNH VIÊN", 
    color: "bg-blue-50 text-blue-600 border-blue-200", 
    barColor: "from-blue-400 to-cyan-400",
    icon: "☕" 
  },
];

const getVipStatus = (points: number) => {
  const currentTier = VIP_TIERS.find((t) => points >= t.minPoints) || VIP_TIERS[VIP_TIERS.length - 1];
  const nextTier = [...VIP_TIERS].reverse().find((t) => t.minPoints > points);

  let progress = 100;
  let nextPointsNeeded = 0;

  if (nextTier) {
    const range = nextTier.minPoints - currentTier.minPoints;
    const gained = points - currentTier.minPoints;
    progress = Math.min(Math.round((gained / range) * 100), 100);
    nextPointsNeeded = nextTier.minPoints - points;
  }

  return { currentTier, nextTier, progress, nextPointsNeeded };
};

interface UsersPageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function UsersPage(props: UsersPageProps) {
  const searchParams = await props.searchParams;
  
  const query = searchParams?.q || "";
  const roleFilter = searchParams?.role || "ALL";
  const sortOption = searchParams?.sort || "newest";
  const currentPage = Number(searchParams?.page) || 1;
  const PAGE_SIZE = 10;

  // --- 1. Xây dựng Query Prisma ---
  const where: Prisma.UserWhereInput = {};

  if (query) {
    where.OR = [
      { fullName: { contains: query } }, 
      { userName: { contains: query } },
      { phoneNumber: { contains: query } },
    ];
  }

  if (roleFilter !== "ALL") {
    where.role = roleFilter as Role;
  }

  let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
  if (sortOption === "oldest") {
    orderBy = { createdAt: "asc" };
  }
  // Nếu sort theo điểm VIP trực tiếp từ DB
  if (sortOption === "vip_desc") {
    orderBy = { points: "desc" };
  } else if (sortOption === "vip_asc") {
    orderBy = { points: "asc" };
  }

  // --- 2. Fetch dữ liệu ---
  // QUAN TRỌNG: Không cần include orders để tính lại nữa, vì action đã update vào field 'points'
  const rawUsers = await db.user.findMany({
    where,
    orderBy,
    // Prisma mặc định lấy scalar fields như 'points'
  });

  // --- 3. Map dữ liệu ---
  let users = rawUsers.map((user) => {
    // SỬA: Lấy trực tiếp điểm từ Database (được tính ở action admin-orders.ts)
    // Mặc định là 0 nếu null
    const calculatedPoints = user.points ?? 0; 

    return {
      id: user.id,
      name: user.fullName || user.userName,
      userName: user.userName,
      role: user.role,
      loyaltyPoints: calculatedPoints, // Dùng giá trị thật
      createdAt: user.createdAt,
      phone: user.phoneNumber
    };
  });

  // (Optional) Sort in-memory nếu DB sort không đủ phức tạp hoặc cần custom logic
  // Nhưng với logic mới, ta đã sort trực tiếp ở query Prisma bên trên cho tối ưu.
  
  // --- 4. Phân trang ---
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = users.slice(startIndex, startIndex + PAGE_SIZE);

  // --- RENDER UI ---
  // (Phần render giữ nguyên như cũ)
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi danh sách thành viên và hạng khách hàng thân thiết.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm">
          Tổng thành viên: <span className="font-bold text-indigo-600 text-lg">{totalItems}</span>
        </div>
      </div>

      <UserToolbar />

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Thông tin tài khoản</th>
                <th className="p-4 font-semibold">Vai trò</th>
                <th className="p-4 font-semibold">Hạng thành viên (VIP)</th>
                <th className="p-4 font-semibold">Ngày tham gia</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedUsers.map((user) => {
                const { currentTier, nextTier, progress, nextPointsNeeded } = getVipStatus(user.loyaltyPoints);
                const isCustomer = user.role === "CUSTOMER";

                return (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white
                          ${isCustomer 
                            ? `bg-gradient-to-br ${currentTier.barColor}` 
                            : 'bg-gray-400'
                          }`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                            {user.name}
                          </p>
                          <div className="flex flex-col text-xs text-gray-500">
                             <span>{user.userName}</span>
                             {user.phone && <span className="mt-0.5 text-gray-400">{user.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-md text-xs font-bold border border-red-100 shadow-sm">
                          <ShieldAlert size={14} /> QUẢN TRỊ
                        </span>
                      ) : user.role === "STAFF" ? (
                        <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100 shadow-sm">
                          <Shield size={14} /> NHÂN VIÊN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-md text-xs font-bold border border-green-100 shadow-sm">
                          <User size={14} /> KHÁCH HÀNG
                        </span>
                      )}
                    </td>

                    <td className="p-4 min-w-[240px]">
                      {isCustomer ? (
                        <div className="flex flex-col gap-2 p-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all">
                          <div className="flex justify-between items-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border shadow-sm ${currentTier.color}`}>
                              {currentTier.icon} {currentTier.label}
                            </span>
                            <span className="font-bold text-gray-800 text-sm">
                              {new Intl.NumberFormat('vi-VN').format(user.loyaltyPoints)} điểm
                            </span>
                          </div>
                          
                          <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${currentTier.barColor} transition-all duration-1000 ease-out`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400">
                                {nextTier ? `${progress}% đến hạng sau` : 'Đã đạt đỉnh'}
                            </span>
                            <span className="text-gray-500 font-medium">
                              {nextTier 
                                ? `+${new Intl.NumberFormat('vi-VN').format(nextPointsNeeded)} điểm → ${nextTier.label}`
                                : "Max Level"
                              }
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 opacity-50 pl-2">
                          <Minus size={16} />
                          <span className="text-xs italic">Không áp dụng</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-gray-600 text-sm whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                          year: 'numeric',
                          month: '2-digit', 
                          day: '2-digit'
                      })}
                    </td>

                    <td className="p-4 text-right">
                      <td className="p-4 text-right">
                        <UserActions user={user} />
                      </td>
                    </td>
                  </tr>
                );
              })}
              
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                         <SearchX className="text-gray-400" size={24} />
                      </div>
                      <p>Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              Hiển thị <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + PAGE_SIZE, totalItems)}</strong> trong tổng <strong>{totalItems}</strong>
            </div>
            <div className="flex gap-1">
              <Link
                href={`?${new URLSearchParams({ ...searchParams, page: String(Math.max(currentPage - 1, 1)) })}`}
                className={`p-1 rounded-md border ${currentPage === 1 ? 'pointer-events-none opacity-50 bg-gray-100' : 'bg-white hover:bg-gray-100'}`}
              >
                <ChevronLeft size={18} />
              </Link>
              <div className="px-3 py-1 bg-white border rounded-md text-sm font-medium text-gray-700">
                Trang {currentPage} / {totalPages}
              </div>
              <Link
                href={`?${new URLSearchParams({ ...searchParams, page: String(Math.min(currentPage + 1, totalPages)) })}`}
                className={`p-1 rounded-md border ${currentPage === totalPages ? 'pointer-events-none opacity-50 bg-gray-100' : 'bg-white hover:bg-gray-100'}`}
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}