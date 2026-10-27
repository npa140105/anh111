import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  TrendingUp,
  Download,
  Calendar,
  RotateCcw,
  Coffee,
  DollarSign,
  PieChart,
  BarChart3,
  Award,
} from 'lucide-react';
import { playTapSound } from '../../utils/audio';

export const AnalyticsSection: React.FC = () => {
  const { orders, cancelOrder, drinks, setActiveOrderModal } = useShop();
  const [filterDate, setFilterDate] = useState('today');

  // Filter valid completed orders
  const validOrders = orders.filter((o) => o.status === 'completed');

  // Metrics
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCups = validOrders.reduce((sum, o) => sum + o.totalCups, 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const totalEcoCups = validOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.ecoCup).reduce((sub, i) => sub + i.quantity, 0),
    0
  );

  // Top Drinks Calculation
  const drinkSalesMap: Record<string, { name: string; cups: number; revenue: number }> = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!drinkSalesMap[item.drinkName]) {
        drinkSalesMap[item.drinkName] = { name: item.drinkName, cups: 0, revenue: 0 };
      }
      drinkSalesMap[item.drinkName].cups += item.quantity;
      drinkSalesMap[item.drinkName].revenue += item.subtotal;
    });
  });

  const topDrinks = Object.values(drinkSalesMap)
    .sort((a, b) => b.cups - a.cups)
    .slice(0, 5);

  const maxDrinkCups = topDrinks.length > 0 ? topDrinks[0].cups : 1;

  // Ice & Sugar preferences
  const iceMap: Record<string, number> = {};
  const sugarMap: Record<string, number> = {};

  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      iceMap[item.ice] = (iceMap[item.ice] || 0) + item.quantity;
      const sugarShort = item.sugar.replace(/\(.*\)/, '');
      sugarMap[sugarShort] = (sugarMap[sugarShort] || 0) + item.quantity;
    });
  });

  // Export CSV of orders
  const exportCSV = () => {
    playTapSound();
    const headers = ['訂單編號', '下單時間', '用餐型態', '杯數', '小計', '總金額', '付款方式', '狀態'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.timestamp,
      o.diningType === 'takeaway' ? '外帶' : o.diningType === 'dine_in' ? '內用' : '外送',
      o.totalCups,
      o.subtotal,
      o.totalAmount,
      o.paymentMethod,
      o.status === 'completed' ? '已完成' : '已作廢退款',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bobaflow_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-700" />
            <span>門市即時銷售數據與分析報表</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            即時計算銷售總額、總杯數、熱銷品項排行榜與客製糖冰偏好分析
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>匯出銷售 CSV 報表</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">今日累計營業額</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tabular-nums">
              NT${totalRevenue}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">即時核銷 {validOrders.length} 筆訂單</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">總銷售出杯數</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tabular-nums">
              {totalCups}
            </span>
            <span className="text-xs text-stone-400">杯飲品</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">門市出杯統計</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">平均客單價 (AOV)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tabular-nums">
              NT${averageOrderValue}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">平均每筆訂單金額</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">自備環保杯佔比</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
              {totalCups > 0 ? `${Math.round((totalEcoCups / totalCups) * 100)}%` : '0%'}
            </span>
            <span className="text-xs text-stone-400">({totalEcoCups} 杯)</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            節省紙杯耗材，共折抵 NT${totalEcoCups * 5}
          </span>
        </div>
      </div>

      {/* Two-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top 5 Best Sellers (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-800" />
              <h3 className="font-bold text-base text-stone-900">熱銷飲品排行榜 (Top 5 Best Sellers)</h3>
            </div>
            <span className="text-xs text-stone-400">依銷量杯數排序</span>
          </div>

          <div className="space-y-4 pt-1">
            {topDrinks.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">尚無銷售數據</div>
            ) : (
              topDrinks.map((drink, idx) => {
                const ratio = Math.round((drink.cups / maxDrinkCups) * 100);
                return (
                  <div key={drink.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-2 font-semibold text-stone-800">
                        <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{drink.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-500 tabular-nums">{drink.cups} 杯</span>
                        <span className="font-bold text-amber-900 tabular-nums">NT${drink.revenue}</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-900 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Customization Preferences (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-800" />
              <h3 className="font-bold text-base text-stone-900">顧客甜度與冰量偏好分析</h3>
            </div>
          </div>

          {/* Ice preference bars */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-stone-700 block">冰度分佈統計</span>
            <div className="space-y-1.5">
              {Object.entries(iceMap).map(([ice, count]) => {
                const percentage = totalCups > 0 ? Math.round((count / totalCups) * 100) : 0;
                return (
                  <div key={ice} className="flex items-center justify-between gap-3">
                    <span className="w-16 text-stone-600">{ice}</span>
                    <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-stone-500 tabular-nums w-12 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sugar preference bars */}
          <div className="space-y-2 text-xs pt-3 border-t border-stone-100">
            <span className="font-semibold text-stone-700 block">甜度分佈統計</span>
            <div className="space-y-1.5">
              {Object.entries(sugarMap).map(([sugar, count]) => {
                const percentage = totalCups > 0 ? Math.round((count / totalCups) * 100) : 0;
                return (
                  <div key={sugar} className="flex items-center justify-between gap-3">
                    <span className="w-16 text-stone-600">{sugar}</span>
                    <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-stone-500 tabular-nums w-12 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Orders History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-2">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-stone-900">門市所有銷售訂單紀錄 ({orders.length})</h3>
            <p className="text-xs text-stone-500 mt-0.5">可檢視銷售明細、補印收據，或執行作廢退款（自動還原已扣減之原物料庫存）</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4 font-semibold">單號</th>
                <th className="py-3 px-4 font-semibold">時間</th>
                <th className="py-3 px-4 font-semibold">型態</th>
                <th className="py-3 px-4 font-semibold">飲品內容明細</th>
                <th className="py-3 px-4 font-semibold text-right">杯數</th>
                <th className="py-3 px-4 font-semibold text-right">結帳金額</th>
                <th className="py-3 px-4 font-semibold">支付方式</th>
                <th className="py-3 px-4 font-semibold">狀態</th>
                <th className="py-3 px-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-stone-900">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">{order.timestamp}</td>
                  <td className="py-3 px-4 text-stone-600">
                    {order.diningType === 'takeaway' ? '外帶' : order.diningType === 'dine_in' ? '內用' : '外送'}
                  </td>
                  <td className="py-3 px-4 text-stone-800 max-w-xs truncate">
                    {order.items.map((i) => `${i.drinkName} x${i.quantity}`).join('、')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                    {order.totalCups}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-900 tabular-nums">
                    NT${order.totalAmount}
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {order.paymentMethod === 'cash' && '現金'}
                    {order.paymentMethod === 'line_pay' && 'LINE Pay'}
                    {order.paymentMethod === 'credit_card' && '信用卡'}
                    {order.paymentMethod === 'apple_pay' && 'Apple Pay'}
                  </td>
                  <td className="py-3 px-4">
                    {order.status === 'completed' ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        已完成
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                        已作廢退款
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveOrderModal(order)}
                        className="text-stone-500 hover:text-stone-900 font-medium underline text-[11px] cursor-pointer"
                      >
                        檢視收據
                      </button>
                      {order.status === 'completed' && (
                        <button
                          onClick={() => {
                            if (confirm(`確定要作廢訂單 ${order.orderNumber} 並自動歸還原物料庫存嗎？`)) {
                              cancelOrder(order.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 text-[11px] cursor-pointer"
                        >
                          作廢退單
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
