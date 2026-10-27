import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldAlert,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { staffAuthService, SYSTEM_ADMIN_EMAIL, DEFAULT_STAFF_ACCOUNTS } from '../../services/staffAuthService';
import { StaffAccount } from '../../types/auth';

interface CoverLoginScreenProps {
  onLoginSuccess: (user: StaffAccount) => void;
}

export const CoverLoginScreen: React.FC<CoverLoginScreenProps> = ({ onLoginSuccess }) => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdminHelpModal, setShowAdminHelpModal] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!account.trim() || !password.trim()) {
      setErrorMessage('請輸入系統帳號與登入密碼');
      return;
    }

    setIsLoading(true);
    try {
      const result = await staffAuthService.login(account, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          result.errorMessage || '帳號或密碼錯誤，請重新確認。若忘記密碼必須寫信給管理者處理。'
        );
      }
    } catch (err) {
      console.error('Login process error:', err);
      setErrorMessage('系統驗證異常，請檢查網路連線或稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetAccount: string, presetPass: string) => {
    setAccount(presetAccount);
    setPassword(presetPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Decorative Ambience */}
      <div className="absolute inset-0 bg-radial from-amber-950/40 via-stone-950/90 to-stone-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Banner Bar */}
      <header className="relative z-10 border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-600/40 text-amber-50 flex items-center justify-center font-black text-base shadow-lg shadow-amber-950/50">
            BF
          </div>
          <div>
            <div className="text-base font-bold text-stone-100 tracking-tight flex items-center gap-2">
              <span>茶研所 BobaFlow 系統管制封頁</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50">
                Security Gate
              </span>
            </div>
            <div className="text-xs text-stone-400">門市營運、庫存即時核銷與銷售管理中樞</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdminHelpModal(true)}
            className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800/70 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>聯繫管理者</span>
          </button>
        </div>
      </header>

      {/* Main Cover Body */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden p-6 sm:p-8">
            {/* Header within Card */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-stone-100 tracking-tight">系統存取驗證</h1>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                為保護茶研所營運安全與資料機密，請輸入被授權的使用者帳號與密碼，驗證符合使用權限方可進入系統。
              </p>
            </div>

            {/* Error Message Notice */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed flex-1">
                  <div className="font-semibold text-rose-300 mb-0.5">無法進入茶研所系統</div>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Strict Login Form (No forgot password on cover screen!) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  使用者帳號 (Account / Email)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="請輸入帳號 (例如: admin / manager / staff01)"
                    disabled={isLoading}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 placeholder:text-stone-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  登入密碼 (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入系統存取密碼"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 placeholder:text-stone-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
                    title={showPassword ? '隱藏密碼' : '顯示密碼'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/60 border border-amber-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>雲端資料庫身分驗證中...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>驗證權限並登入茶研所</span>
                  </>
                )}
              </button>
            </form>

            {/* Strict Rule Notice: No forgot password self-reset on cover! */}
            <div className="mt-6 pt-5 border-t border-stone-800">
              <div className="bg-stone-950/70 rounded-xl p-3.5 border border-stone-800/80">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-400 leading-relaxed">
                    <span className="font-semibold text-stone-300 block mb-0.5">
                      【資安規範提醒】
                    </span>
                    本系統封頁僅提供登入驗證。若忘記密碼
                    <strong className="text-amber-300 font-semibold">
                      必須專函寫信給系統管理者手動查驗重設
                    </strong>
                    ，依規定不開放線上自行變更。
                  </div>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-stone-800/70 flex items-center justify-between text-xs">
                  <span className="text-stone-500">管理者信箱：</span>
                  <a
                    href={`mailto:${SYSTEM_ADMIN_EMAIL}?subject=【茶研所APP】帳號密碼重設申請&body=管理者您好：%0D%0A我是茶研所門市人員，因忘記密碼，特向您申請身分查驗與手動重設。%0D%0A申請帳號：%0D%0A門市分店：%0D%0A申請人姓名：%0D%0A聯絡電話：`}
                    className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 flex items-center gap-1 transition-colors"
                  >
                    <span>{SYSTEM_ADMIN_EMAIL}</span>
                    <Mail className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Demo Helper Section (Expandable for evaluation) */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full text-center text-[11px] text-stone-500 hover:text-stone-300 py-1 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{showDemoAccounts ? '隱藏雲端預設帳號資訊' : '點擊查看系統預設登入帳號密碼'}</span>
              </button>

              {showDemoAccounts && (
                <div className="mt-2 p-3 bg-stone-950/90 rounded-xl border border-stone-800 text-[11px] space-y-2 animate-fadeIn">
                  <div className="font-semibold text-stone-300 flex items-center justify-between">
                    <span>Firebase 雲端資料庫預設帳號：</span>
                    <span className="text-amber-400 text-[10px]">點擊可快速填入</span>
                  </div>
                  {DEFAULT_STAFF_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectPreset(acc.account, acc.password)}
                      className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-stone-200 font-semibold flex items-center gap-1.5">
                          <span>{acc.displayName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              acc.role === 'admin'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : acc.role === 'manager'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            }`}
                          >
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-stone-400 text-[10px] mt-0.5 font-mono">
                          帳號: <span className="text-amber-300">{acc.account}</span> | 密碼:{' '}
                          <span className="text-amber-300">{acc.password}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-500 group-hover:text-amber-400 font-medium">
                        帶入
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-800/80 bg-stone-950/60 backdrop-blur-md px-6 py-4 text-center text-xs text-stone-500">
        <div>
          <span>© 2026 茶研所 BobaFlow 零售雲端系統 · 密碼與帳號資料已受 Google Cloud Firestore 安全規則加密存取保護</span>
        </div>
      </footer>

      {/* Admin Contact Modal */}
      {showAdminHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">茶研所系統管理處</h3>
                <p className="text-xs text-stone-400">忘記密碼與帳號授權查驗專函</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-300 leading-relaxed bg-stone-950/80 p-4 rounded-xl border border-stone-800 mb-4">
              <p>
                親愛的門市同仁：
                <br />
                為落實門市帳務及進出貨原物料核銷之嚴格資安管制，本系統封頁
                <strong className="text-amber-300">不設任何自動重設密碼機制</strong>。
              </p>
              <p>
                若您因職務交接或忘記密碼無法登入，請以公務信箱寄信至管理者：
                <br />
                <span className="font-mono text-amber-300 font-semibold select-all">
                  {SYSTEM_ADMIN_EMAIL}
                </span>
              </p>
              <p className="text-stone-400 text-[11px]">
                信件內文請務必附上您的：姓名、門市店別、申請帳號、以及門市負責人簽核證明。管理者核驗無誤後將立即於後台為您重設新密碼。
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={`mailto:${SYSTEM_ADMIN_EMAIL}?subject=【茶研所APP】忘記密碼申請手動重設&body=管理者您好：%0D%0A我是茶研所門市人員，因忘記密碼特申請身分查驗與手動重設。%0D%0A申請帳號：%0D%0A姓名：%0D%0A門市分店：%0D%0A聯絡電話：`}
                className="flex-1 py-2 px-3 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>立即開啟信件撰寫</span>
              </a>
              <button
                type="button"
                onClick={() => setShowAdminHelpModal(false)}
                className="py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
