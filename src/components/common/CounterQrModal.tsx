import React from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { Smartphone, Printer, ExternalLink, X, Sparkles, Gift, Store } from 'lucide-react';

interface CounterQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPortal: () => void;
}

export const CounterQrModal: React.FC<CounterQrModalProps> = ({
  isOpen,
  onClose,
  onOpenPortal,
}) => {
  if (!isOpen) return null;

  // Real URL for standalone portal
  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?view=member-portal`
    : 'https://bobaflow.club/members';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm tracking-wider">
              BF
            </span>
            <div>
              <div className="font-bold text-base leading-tight">門市櫃檯 QR Code 會員立牌</div>
              <div className="text-xs text-amber-300">顧客手機掃描 · 線上即開即用 · 結帳報電話集點</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Printable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-center">
          {/* Visual Table Stand Card */}
          <div className="p-6 rounded-3xl bg-linear-to-b from-stone-50 via-white to-amber-50/50 border-2 border-dashed border-amber-300/80 shadow-xs relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600/10 text-amber-800 text-xs font-bold mb-3 border border-amber-300/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>BobaFlow Tea Club 尊榮會員招募</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              手機掃碼加入會員
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              免下載 App · 掃描後立即線上填單 · 開通即享迎賓 20 點
            </p>

            {/* QR Code */}
            <div className="my-5 flex justify-center">
              <QRCodeDisplay
                value={portalUrl}
                size={180}
                title="掃我線上申請會員"
                subtitle="支援 iPhone / Android 相機直掃"
                centerText="BF"
                showDownload={true}
                showCopy={true}
              />
            </div>

            {/* Perks */}
            <div className="grid grid-cols-2 gap-2 text-left bg-white p-3.5 rounded-2xl border border-stone-200/80 text-xs">
              <div className="flex items-start gap-2">
                <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900 block">迎賓禮贈 20 點</span>
                  <span className="text-[11px] text-stone-500">開通直接入帳抵現金</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Store className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900 block">結帳報電話即可</span>
                  <span className="text-[11px] text-stone-500">每滿 $10 元集 1 點</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Tips */}
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 text-xs text-left space-y-1.5 border border-amber-200">
            <div className="font-bold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-700" />
              <span>門市收銀人員操作提示：</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px]">
              <li>擺放此立牌於櫃檯，客人排隊點單時可用手機相機對準 QR Code 進行申辦。</li>
              <li>申辦完成後，顧客於結帳時告知手機號碼，收銀機將自動帶入會員點數與購買記錄！</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>列印實體立牌</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-medium cursor-pointer transition-colors"
            >
              關閉
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenPortal();
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>直接開啟獨立會員頁面</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
