import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  AlertTriangle,
  Phone,
  CheckCircle2,
  PackagePlus,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { playSelectSound } from '../../utils/audio';

export const RestockAlertsSection: React.FC = () => {
  const { restockRecommendations, bulkRestockAllAlerts, lowStockCount, restockIngredient } =
    useShop();

  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [successRestockMsg, setSuccessRestockMsg] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const totalEstimatedCost = restockRecommendations.reduce((sum, r) => sum + r.estimatedCost, 0);

  const handleBulkRestock = () => {
    bulkRestockAllAlerts();
    playSelectSound();
    setSuccessRestockMsg(true);
    setTimeout(() => setSuccessRestockMsg(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <span>智慧補貨提醒與供應商採購中心</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            即時監控前台銷售消耗水位 · 自動比對安全存量臨界值並產生供應商補貨採購建議
          </p>
        </div>

        {restockRecommendations.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-medium text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>列印採購建議清單</span>
            </button>
            <button
              onClick={handleBulkRestock}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <PackagePlus className="w-4 h-4" />
              <span>一鍵採購進貨入庫 (補足安全水位)</span>
            </button>
          </div>
        )}
      </div>

      {successRestockMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong className="font-bold">全數缺貨原物料已完成進貨驗收！</strong>
            <p className="text-emerald-700 mt-0.5">
              庫存已自動回補至安全目標水位，異動紀錄已同步存檔。
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500">待補貨原物料品項</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
                lowStockCount > 0 ? 'text-rose-600' : 'text-stone-900'
              }`}
            >
              {lowStockCount}
            </span>
            <span className="text-xs text-stone-400">項低於安全量</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500">預估採購補貨總金額</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tabular-nums">
              NT${totalEstimatedCost}
            </span>
            <span className="text-xs text-stone-400">補至 2.5 倍安全量</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500">庫存健全指數</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tabular-nums">
              {lowStockCount === 0 ? '100%' : `${Math.max(40, 100 - lowStockCount * 12)}%`}
            </span>
            <span className="text-xs text-stone-400">即時庫存健康度</span>
          </div>
        </div>
      </div>

      {/* Restock Recommendations List */}
      {restockRecommendations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-stone-900">門市庫存儲備狀況良好</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            目前所有原茶、乳製品、糖蜜、配料與杯具包材皆高於安全庫存水位。前台銷售時若有品項低於閾值，系統將自動於此處發出警報並通知供應商資訊。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <span>需儘速採購之原物料清單 ({restockRecommendations.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restockRecommendations.map((rec) => {
              return (
                <div
                  key={rec.ingredientId}
                  className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">{rec.categoryName}</span>
                        {rec.urgency === 'critical' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            急迫：庫存不足50%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            警戒：低於安全水位
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-1">{rec.name}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-stone-400">預估採購費用</span>
                      <p className="font-bold text-base text-amber-900 tabular-nums">
                        NT${rec.estimatedCost}
                      </p>
                    </div>
                  </div>

                  {/* Stock Levels Comparison Bar */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-500">現有存量 / 安全水位</span>
                      <span className="font-mono font-bold tabular-nums">
                        <span className="text-rose-600">{rec.currentStock}</span>
                        <span className="text-stone-400"> / {rec.safetyThreshold} {rec.unit}</span>
                      </span>
                    </div>

                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          rec.urgency === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((rec.currentStock / rec.safetyThreshold) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-stone-500 pt-0.5">
                      <span>建議採購量：+{rec.suggestedOrderAmount} {rec.unit}</span>
                      <span>預估尚可支撐：約 {rec.daysRemainingEst} 天</span>
                    </div>
                  </div>

                  {/* Supplier Info & Quick Call Phone Number */}
                  <div className="bg-stone-50/70 rounded-xl p-3 border border-stone-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>供應商：{rec.supplier}</span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        前置配送天數：{rec.leadTimeDays} 天
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                      <div className="flex items-center gap-1.5 text-stone-800">
                        <Phone className="w-3.5 h-3.5 text-amber-800" />
                        <span className="font-mono font-bold">{rec.supplierPhone}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(rec.supplierPhone)}
                          className="px-2 py-1 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedPhone === rec.supplierPhone ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>已複製</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>複製電話</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`tel:${rec.supplierPhone}`}
                          className="px-2.5 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>一鍵撥號</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Single item Restock button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        restockIngredient(
                          rec.ingredientId,
                          rec.suggestedOrderAmount,
                          `驗收入庫：採購單補貨 (+${rec.suggestedOrderAmount}${rec.unit})`
                        );
                        playSelectSound();
                      }}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>驗收此項進貨 (+{rec.suggestedOrderAmount}{rec.unit})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
