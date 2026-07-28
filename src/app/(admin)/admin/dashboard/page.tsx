// src/app/(admin)/admin/dashboard/page.tsx
import React from "react";
import { 
  CreditCard, ShoppingCart, Users, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Filter, MoreHorizontal 
} from "lucide-react";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, subDays, format, isSameDay, eachDayOfInterval, parseISO, isValid } from "date-fns";
import DashboardFilter from "./components/DashboardFilter";
import ChartFilter from "./components/ChartFilter";

const formatCurrency = (value: number | string) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
};

async function getDashboardStats(
    statsRange: { from: Date, to: Date }, 
    chartRange: { from: Date, to: Date }
) {
  // Đảm bảo chartRange hợp lệ
  let safeChartFrom = chartRange.from;
  let safeChartTo = chartRange.to;
  if (safeChartFrom > safeChartTo) {
      safeChartFrom = chartRange.to;
      safeChartTo = chartRange.from;
  }

  const [
    totalRevenueResult,
    ordersCount,
    newUsers,
    topProductsRaw,
    recentOrders,
    revenueChartDataRaw
  ] = await Promise.all([
    // 1. Doanh thu (Stats)
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: { 
        orderStatus: "COMPLETED",
        updatedAt: { gte: statsRange.from, lte: statsRange.to }
      }
    }),
    // 2. Đơn mới (Stats)
    db.order.count({
      where: { createdAt: { gte: statsRange.from, lte: statsRange.to } }
    }),
    // 3. Khách mới (Stats)
    db.user.count({
      where: { createdAt: { gte: statsRange.from, lte: statsRange.to } }
    }),
    // 4. Top sản phẩm (Stats)
    db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        order: {
            createdAt: { gte: statsRange.from, lte: statsRange.to },
            orderStatus: "COMPLETED"
        }
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 4,
    }),
    // 5. Đơn gần đây (Stats)
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: statsRange.from, lte: statsRange.to } },
      include: {
        user: { select: { fullName: true, userName: true } },
        orderItems: { include: { product: { select: { name: true } } } } 
      }
    }),
    // 6. Chart Data (Chart Range)
    db.order.findMany({
      where: {
        createdAt: { gte: safeChartFrom, lte: safeChartTo },
        orderStatus: "COMPLETED"
      },
      select: { createdAt: true, totalAmount: true }
    })
  ]);

  // Xử lý Top Products
  const topProductIds = topProductsRaw.map(p => p.productId);
  const productsDetails = await db.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, basePrice: true }
  });

  const topProducts = topProductsRaw.map(item => {
    const product = productsDetails.find(p => p.id === item.productId);
    return {
      name: product?.name || "Sản phẩm ẩn",
      sales: item._sum.quantity || 0,
      price: Number(product?.basePrice || 0),
    };
  });

  // Xử lý Chart Data
  const allDays = eachDayOfInterval({ start: safeChartFrom, end: safeChartTo });
  const chartData = allDays.map((date) => {
    const dayLabel = format(date, "dd/MM");
    const dailyTotal = revenueChartDataRaw
      .filter(order => isSameDay(order.createdAt, date))
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    return { label: dayLabel, value: dailyTotal };
  });

  return {
    revenue: Number(totalRevenueResult._sum.totalAmount || 0),
    newOrders: ordersCount,
    newCustomers: newUsers,
    bestSeller: topProducts[0]?.name || "Chưa có",
    topProducts,
    recentOrders,
    chartData
  };
}

// Update Type cho Next.js 15
interface DashboardPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    label?: string;
    chartFrom?: string;
    chartTo?: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  // 1. AWAIT searchParams (Fix lỗi Next.js 15)
  const searchParams = await props.searchParams;
  
  const today = new Date();
  
  // --- Xử lý Filter STATS ---
  let statsFrom = searchParams.from ? parseISO(searchParams.from) : startOfDay(today);
  let statsTo = searchParams.to ? parseISO(searchParams.to) : endOfDay(today);
  const label = searchParams.label || "Hôm nay";

  if (!isValid(statsFrom) || !isValid(statsTo)) {
    statsFrom = startOfDay(today);
    statsTo = endOfDay(today);
  }

  // --- Xử lý Filter CHART ---
  let chartFrom = searchParams.chartFrom ? parseISO(searchParams.chartFrom) : subDays(today, 6);
  // Quan trọng: chartTo luôn phải là CUỐI NGÀY của ngày được chọn
  let chartToRaw = searchParams.chartTo ? parseISO(searchParams.chartTo) : today;
  let chartTo = endOfDay(chartToRaw);

  if (!isValid(chartFrom) || !isValid(chartTo)) {
     chartFrom = subDays(today, 6);
     chartTo = endOfDay(today);
  }

  // Fetch Data
  const stats = await getDashboardStats(
      { from: statsFrom, to: statsTo }, 
      { from: chartFrom, to: chartTo }
  );

  const maxChartValue = Math.max(...stats.chartData.map(d => d.value), 1);

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1d150b]">Xin chào, Admin! 👋</h2>
          <p className="text-gray-500 text-sm mt-1">
             Báo cáo kinh doanh: <span className="font-semibold text-[#c49b63]">{label}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilter />
          <button className="p-2 bg-[#1d150b] text-white rounded-lg hover:bg-[#1d150b]/90 shadow-lg shadow-[#1d150b]/20">
            <Filter size={18} />
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng doanh thu" value={formatCurrency(stats.revenue)} icon={<CreditCard size={24} className="text-white"/>} trend={label} isPositive={true} color="bg-[#c49b63]" />
        <StatCard title="Đơn hàng" value={stats.newOrders} icon={<ShoppingCart size={24} className="text-white"/>} trend={label} isPositive={true} color="bg-[#1d150b]" />
        <StatCard title="Khách hàng mới" value={stats.newCustomers} icon={<Users size={24} className="text-white"/>} trend={label} isPositive={true} color="bg-blue-500" />
        <StatCard title="Món bán chạy nhất" value={stats.bestSeller} icon={<TrendingUp size={24} className="text-white"/>} subText="Top 1 doanh số" color="bg-orange-500" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Biểu đồ doanh thu</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {format(chartFrom, "dd/MM/yyyy")} - {format(chartTo, "dd/MM/yyyy")}
                    </p>
                </div>
                <ChartFilter />
            </div>
            
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                <div className="h-[320px] flex items-end justify-between gap-2 px-2 pb-4 border-b border-gray-100"
                    style={{ minWidth: `${Math.max(stats.chartData.length * 40, 100)}px` }}
                >
                    {stats.chartData.map((data, i) => {
                        const heightPercent = (data.value / maxChartValue) * 100;
                        const displayHeight = data.value > 0 ? Math.max(heightPercent, 5) : 0; 
                        return (
                          <div key={i} className="group relative flex-1 flex flex-col justify-end items-center gap-2 h-full min-w-[30px]">
                              <div className="w-full bg-[#f5dece] rounded-t-sm group-hover:bg-[#c49b63] transition-all duration-300 relative"
                                  style={{ height: `${displayHeight}%` }}>
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1d150b] text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap pointer-events-none">
                                      {formatCurrency(data.value)}
                                  </div>
                              </div>
                              <span className="text-[10px] text-gray-400 text-center w-full truncate">{data.label}</span>
                          </div>
                        )
                    })}
                    {stats.chartData.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            Không có dữ liệu
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Top Products */}
        <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-lg text-gray-800 mb-5">Top món bán chạy</h3>
            <div className="space-y-5">
                {stats.topProducts.map((product, index) => (
                    <TopProductItem key={index} name={product.name} sales={`${product.sales} lượt`} price={formatCurrency(product.price)} rank={index + 1} />
                ))}
                {stats.topProducts.length === 0 && <p className="text-gray-500 text-sm text-center">Chưa có dữ liệu ({label}).</p>}
            </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-800">Đơn hàng gần đây ({label})</h3>
            <MoreHorizontal size={20} className="text-gray-400" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <th className="px-6 py-4">Mã đơn</th>
                        <th className="px-6 py-4">Khách hàng</th>
                        <th className="px-6 py-4">Món</th>
                        <th className="px-6 py-4">Tổng tiền</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Thời gian</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {stats.recentOrders.map((order) => (
                        <OrderItem 
                            key={order.id}
                            id={`#ORD-${order.id}`} 
                            customer={order.user?.fullName || order.user?.userName || "Khách lẻ"} 
                            items={order.orderItems.map(i => `${i.quantity}x ${i.product.name}`).join(", ") || "Trống"} 
                            total={formatCurrency(Number(order.totalAmount))} 
                            status={order.orderStatus.toLowerCase()} 
                            time={format(new Date(order.createdAt), "HH:mm dd/MM")} 
                        />
                    ))}
                    {stats.recentOrders.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có đơn hàng trong {label.toLowerCase()}.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// Components phụ giữ nguyên (StatCard, TopProductItem, OrderItem)...
function StatCard({ title, value, icon, trend, isPositive, color, subText }: any) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
          <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl shadow-md ${color} text-white`}>{icon}</div>
              {trend && (
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                  </div>
              )}
          </div>
          <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-gray-800 truncate">{value}</h3>
              {subText && <p className="text-xs text-orange-500 font-medium mt-1">{subText}</p>}
          </div>
      </div>
    );
}
// ... (TopProductItem và OrderItem như cũ)
function TopProductItem({ name, sales, price, rank }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${rank === 1 ? 'bg-[#c49b63] text-white' : 'bg-gray-100 text-gray-600'}`}>{rank}</div>
                <div>
                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-1 max-w-[120px]" title={name}>{name}</h4>
                    <p className="text-xs text-gray-400">{sales}</p>
                </div>
            </div>
            <span className="text-sm font-medium text-gray-600">{price}</span>
        </div>
    )
}

function OrderItem({ id, customer, items, total, status, time }: any) {
    const s: any = { completed: "bg-green-100 text-green-700", pending: "bg-orange-100 text-orange-700", processing: "bg-blue-100 text-blue-700", cancelled: "bg-red-100 text-red-700" };
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 font-medium text-[#c49b63]">{id}</td>
            <td className="px-6 py-4 font-medium text-gray-800">{customer}</td>
            <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]" title={items}>{items}</td>
            <td className="px-6 py-4 font-semibold text-gray-800">{total}</td>
            <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${s[status] || "bg-gray-100"}`}>{status}</span></td>
            <td className="px-6 py-4 text-gray-400 text-xs">{time}</td>
        </tr>
    )
}