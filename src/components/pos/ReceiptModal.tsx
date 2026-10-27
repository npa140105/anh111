import React from 'react';
import { Order } from '../../types';
import { CheckCircle2, Printer, X } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const paymentLabels: Record<string, string> = {
    cash: '現金支付',
    line_pay: 'LINE Pay 行動支付',
    credit_card: '信用卡感應',
    apple_pay: 'Apple Pay 感應',
  };

  const diningLabels: Record<string, string> = {
    takeaway: '外帶自取',
    dine_in: '店內享用',
    delivery: '外送平台',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-base tracking-tight">結帳完成 · 銷售已即時核銷</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content - Styled like authentic bubble tea receipt */}
        <div className="p-6 font-mono text-xs text-stone-800 bg-stone-50/70 border-b border-dashed border-stone-300">
          <div className="text-center pb-4 border-b border-dashed border-stone-300">
            <h2 className="font-bold text-base text-stone-900 font-sans tracking-wide">
              BobaFlow 手搖飲概念店
            </h2>
            <p className="text-[11px] text-stone-500 mt-0.5">台北信義旗艦門市 · 門市代碼 #088</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-stone-600">
              <span>單號：<strong className="text-stone-900 text-sm font-sans">{order.orderNumber}</strong></span>
              <span>{order.timestamp}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600 mt-1">
              <span>型態：{diningLabels[order.diningType] || order.diningType}</span>
              <span>經辦：{order.clerk}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="py-3 space-y-2.5 border-b border-dashed border-stone-300">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-baseline font-medium text-stone-900">
                  <span className="font-sans text-sm">
                    {item.drinkName} ({item.size})
                  </span>
                  <span className="tabular-nums">NT${item.subtotal}</span>
                </div>
                <div className="text-[11px] text-stone-500 flex flex-wrap gap-x-2">
                  <span>{item.ice}</span>
                  <span>/</span>
                  <span>{item.sugar}</span>
                  {item.toppings.length > 0 && (
                    <>
                      <span>/</span>
                      <span>+{item.toppings.map((t) => t.name).join('+')}</span>
                    </>
                  )}
                  {item.ecoCup && (
                    <>
                      <span>/</span>
                      <span className="text-emerald-600">環保杯 -$5</span>
                    </>
                  )}
                  <span className="ml-auto text-stone-700">x{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 space-y-1.5 border-b border-dashed border-stone-300">
            <div className="flex justify-between text-stone-600">
              <span>總杯數</span>
              <span className="tabular-nums font-semibold">{order.totalCups} 杯</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>小計金額</span>
              <span className="tabular-nums">NT${order.subtotal}</span>
            </div>
            {order.ecoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>自備環保杯優惠</span>
                <span className="tabular-nums">-NT${order.ecoDiscount}</span>
              </div>
            )}
            {order.otherDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>促銷折扣</span>
                <span className="tabular-nums">-NT${order.otherDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-900 font-bold text-sm pt-1">
              <span>應付總額</span>
              <span className="tabular-nums text-base text-amber-800">NT${order.totalAmount}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="pt-3 space-y-1 text-stone-600">
            <div className="flex justify-between">
              <span>支付方式</span>
              <span>{paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>實收金額</span>
              <span className="tabular-nums">NT${order.amountPaid}</span>
            </div>
            {order.paymentMethod === 'cash' && (
              <div className="flex justify-between font-medium text-stone-800">
                <span>找零金額</span>
                <span className="tabular-nums">NT${order.change}</span>
              </div>
            )}
          </div>

          {/* Member info & Points breakdown */}
          {order.memberPhone && (
            <div className="pt-3 pb-1 border-t border-dashed border-stone-300 space-y-1 text-stone-700 bg-amber-50/50 p-2.5 rounded-lg my-2">
              <div className="flex justify-between font-bold text-amber-950">
                <span>會員顧客</span>
                <span>{order.memberName || '會員客戶'}</span>
              </div>
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>認證手機</span>
                <span className="font-mono">
                  {order.memberPhone.length >= 8
                    ? order.memberPhone.slice(0, 4) + '***' + order.memberPhone.slice(-3)
                    : order.memberPhone}
                </span>
              </div>
              {order.pointsEarned !== undefined && order.pointsEarned > 0 && (
                <div className="flex justify-between text-amber-800 font-semibold pt-0.5">
                  <span>本次消費累計</span>
                  <span className="font-mono">+{order.pointsEarned} 點 (每滿10元贈1點)</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center pt-3 text-[10px] text-stone-400">
            *** 後台原物料庫存已即時核銷扣減 ***<br />
            感謝您的惠顧 · 祝您品飲愉快
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            列印明細
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            完成並返回點單
          </button>
        </div>
      </div>
    </div>
  );
};
