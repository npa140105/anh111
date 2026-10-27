import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  CloudUpload,
} from 'lucide-react';
import { staffAuthService } from '../../services/staffAuthService';
import { StaffAccount } from '../../types/auth';

interface ChangePasswordModalProps {
  currentUser: StaffAccount;
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged?: (updatedUser: StaffAccount) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('請填寫所有欄位');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('新密碼長度需至少 6 位字元');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('新密碼與確認密碼不相符');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffAuthService.changeCurrentPassword(
        currentUser.id,
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (res.success) {
        setIsSuccess(true);
        const updated = staffAuthService.getCurrentSession();
        if (updated && onPasswordChanged) {
          onPasswordChanged(updated);
        }
      } else {
        setErrorMessage(res.errorMessage || '修改失敗，請確認原密碼是否正確');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setErrorMessage('連線資料庫異常，請檢查網路後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-100">
                自行修訂登入密碼
              </h3>
              <p className="text-[11px] text-stone-400">
                帳號：<span className="font-mono text-amber-300">{currentUser.account}</span> (
                {currentUser.displayName})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">密碼修訂成功！</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  新密碼已同步儲存至 Google Cloud Firestore 雲端資料庫。
                  <br />
                  下次登入茶研所系統請使用此最新密碼。
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-amber-900 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  確認並返回系統
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>【雲端資安同步】</strong>
                  您在此修訂的密碼將即時寫入 Firebase
                  雲端資料庫，請妥善保管密碼。若遺忘仍需請管理者重新授權。
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  目前密碼 (Current Password)
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="請輸入目前使用的密碼"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2 pr-10 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  設定新密碼 (New Password)
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 6 個英數或符號"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2 pr-10 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  再次確認新密碼 (Confirm New Password)
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入相同的新密碼"
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>儲存至雲端中...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>確認修訂並儲存至雲端</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
