import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  centerText?: string;
  showDownload?: boolean;
  showCopy?: boolean;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  title,
  subtitle,
  centerText = 'BF',
  showDownload = true,
  showCopy = true,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size * 2, // high DPI
      margin: 2,
      color: {
        dark: '#1c1917', // stone-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `bobaflow_qr_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* QR Wrapper with branded center badge */}
      <div
        className="relative p-3 bg-white rounded-2xl shadow-md border border-stone-200/80 inline-block overflow-hidden"
        style={{ width: size + 24, height: size + 24 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="QR Code"
            className="w-full h-full object-contain rounded-xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-50 rounded-xl">
            <QrIcon className="w-10 h-10 text-stone-300 animate-pulse" />
          </div>
        )}

        {/* Center Logo Pin */}
        {centerText && dataUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-black text-[10px] shadow-md border-2 border-white tracking-wider">
              {centerText}
            </div>
          </div>
        )}
      </div>

      {/* Title & Subtitle */}
      {title && <div className="mt-3 font-bold text-sm text-stone-900">{title}</div>}
      {subtitle && <div className="mt-0.5 text-xs text-stone-500 max-w-xs">{subtitle}</div>}

      {/* Action Buttons */}
      {(showCopy || showDownload) && (
        <div className="flex items-center gap-2 mt-3">
          {showCopy && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="複製連結網址"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">已複製網址</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製網址</span>
                </>
              )}
            </button>
          )}

          {showDownload && (
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="下載 QR Code 圖檔"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下載圖片</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
