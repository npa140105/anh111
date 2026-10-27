import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Member, Order } from '../../types';
import {
  Sparkles,
  Smartphone,
  Mail,
  User,
  Calendar,
  Coffee,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  ShieldCheck,
  Gift,
  QrCode,
  Store,
  ChevronRight,
  RefreshCw,
  Lock,
  Database,
  CloudCheck,
  Receipt,
  Award,
  AlertCircle,
  ExternalLink,
  Send,
  LogOut,
  BadgeCheck,
} from 'lucide-react';
import { playSuccessSound, playTapSound, playCashRegisterSound, playAlertChime } from '../../utils/audio';
import { cloudAuthService, cloudOrderService, auth } from '../../lib/firebase';
import firebaseConfig from '../../../firebase-applet-config.json';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { CounterQrModal } from '../common/CounterQrModal';

interface MemberPortalStandaloneProps {
  onBackToPos?: () => void;
  onBackToAdmin?: () => void;
}

export const MemberPortalStandalone: React.FC<MemberPortalStandaloneProps> = ({
  onBackToPos,
  onBackToAdmin,
}) => {
  const {
    registerMember,
    findMemberByPhone,
    approveMember,
    members,
    orders,
    getMemberOrders,
    cloudStatus,
    refreshCloudData,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'register' | 'card' | 'history' | 'cloud'>('register');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    birthday: '',
    preferredSugar: '微糖(3分)',
    preferredIce: '少冰',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredMember, setRegisteredMember] = useState<Member | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Active Member (Logged In or Queried)
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  // Purchase History State
  const [memberOrders, setMemberOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Mobile frame simulator toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // QR Code Modals
  const [showMemberQrModal, setShowMemberQrModal] = useState(false);
  const [showCounterStandModal, setShowCounterStandModal] = useState(false);

  // Sync member orders whenever activeMember changes or orders update
  useEffect(() => {
    if (activeMember) {
      const localList = getMemberOrders(activeMember.phone);
      setMemberOrders(localList);

      // Also query directly from cloud Firestore to guarantee fresh data
      setLoadingOrders(true);
      cloudOrderService
        .getMemberOrders(activeMember.phone)
        .then((cloudList) => {
          if (cloudList && cloudList.length > 0) {
            setMemberOrders(cloudList);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch cloud member orders:', err);
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    } else {
      setMemberOrders([]);
    }
  }, [activeMember, orders]);

  // Handle Member Registration with Firebase Auth Email Verification
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setVerificationFeedback(null);

    if (!formData.name.trim()) {
      setFormError('請輸入您的姓名');
      return;
    }
    const cleanPhone = formData.phone.replace(/[-\s]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError('請輸入完整的手機號碼 (例如: 0912-345-678)');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('請輸入格式正確的電子郵件信箱');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('密碼長度至少需 6 個字元以上');
      return;
    }

    setSubmitting(true);
    let firebaseUid: string | undefined;

    try {
      // 1. Create Firebase Auth user and trigger sendEmailVerification
      try {
        const user = await cloudAuthService.signUp(formData.email.trim(), formData.password);
        firebaseUid = user.uid;
        setEmailVerificationSent(true);
      } catch (authErr: any) {
        console.warn('Firebase Auth signup note:', authErr);
        // If email already in use, we still permit account link or state notice
        if (authErr?.code === 'auth/email-already-in-use') {
          // Continue to register or notify
        }
      }

      // 2. Register member in local and Google Cloud Firestore database
      const res = await registerMember({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        emailVerified: false,
        authUid: firebaseUid,
        birthday: formData.birthday,
        preferredSugar: formData.preferredSugar,
        preferredIce: formData.preferredIce,
        notes: '透過線上獨立網頁申請，已發送 Firebase 信箱驗證',
        verificationMethod: 'email_verified',
      });

      if (res.success && res.member) {
        setRegisteredMember(res.member);
        setActiveMember(res.member);
        playSuccessSound();
      } else {
        setFormError(res.error || '申請失敗，請檢查輸入內容');
      }
    } catch (err: any) {
      setFormError(err?.message || '會員申請失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  // Re-check email verification status via Firebase Auth
  const handleCheckEmailVerification = async () => {
    if (!registeredMember) return;
    setCheckingEmailStatus(true);
    setVerificationFeedback(null);

    try {
      const isVerified = await cloudAuthService.checkVerificationStatus();
      if (isVerified) {
        // Approve member in context and Google Cloud Firestore
        await approveMember(registeredMember.id, 'Firebase 電子信箱驗證成功');
        const updated = {
          ...registeredMember,
          emailVerified: true,
          verificationStatus: 'approved' as const,
          points: registeredMember.points === 0 ? 20 : registeredMember.points,
        };
        setRegisteredMember(updated);
        setActiveMember(updated);
        setVerificationFeedback('🎉 恭喜！電子郵件已通過驗證，會員帳號已成功啟用，並獲得迎賓 20 點！');
        playCashRegisterSound();
      } else {
        setVerificationFeedback('尚未檢測到信箱點擊驗證。請確認已至電子信箱點擊 Firebase 發送的驗證連結後再次點擊檢查！');
        playAlertChime();
      }
    } catch (err: any) {
      setVerificationFeedback('檢查時發生問題：' + (err?.message || '請確認網路連線'));
    } finally {
      setCheckingEmailStatus(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    try {
      const sent = await cloudAuthService.resendVerificationEmail();
      if (sent) {
        setVerificationFeedback('驗證信已再次發送至您的信箱，請查看收件匣或垃圾郵件匣！');
        playTapSound();
      } else {
        setVerificationFeedback('無法發送驗證信，請確認帳號登入狀態。');
      }
    } catch (err: any) {
      setVerificationFeedback('重新發送失敗：' + (err?.message || '系統忙碌中'));
    }
  };

  // Fast-pass approval override for tester / staff
  const handleFastPassApprove = async () => {
    if (!registeredMember) return;
    await approveMember(registeredMember.id, '門市人員免信快速通關審核');
    const updated = {
      ...registeredMember,
      emailVerified: true,
      verificationStatus: 'approved' as const,
      points: registeredMember.points === 0 ? 20 : registeredMember.points,
    };
    setRegisteredMember(updated);
    setActiveMember(updated);
    setVerificationFeedback('✨ 門市快速通關審核完成！已啟用會員權益並贈送迎賓 20 點！');
    playCashRegisterSound();
  };

  // Login or Lookup by Phone
  const handlePhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginFeedback(null);
    const clean = loginPhone.replace(/[-\s]/g, '').trim();
    if (!clean) {
      setLoginFeedback('請輸入欲查詢或登入的手機號碼');
      return;
    }
    const found = findMemberByPhone(clean);
    if (found) {
      setActiveMember(found);
      setRegisteredMember(found);
      setLoginFeedback(null);
      playSuccessSound();
    } else {
      setLoginFeedback(`查無手機「${loginPhone}」的會員資料，請先填寫上方申請表單！`);
      playAlertChime();
    }
  };

  const handleLogout = () => {
    setActiveMember(null);
    setRegisteredMember(null);
    cloudAuthService.signOutUser();
    playTapSound();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20">
      {/* Top Header */}
      <header className="bg-stone-900 text-stone-100 shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
              BF
            </span>
            <div>
              <div className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>BobaFlow 會員獨立網頁系統</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" />
                  Google Cloud / Firebase
                </span>
              </div>
              <div className="text-[10px] text-amber-300 hidden sm:block">
                線上帳號申請 · 電子郵件信箱驗證 · 會員集點 · 購買記錄即時雲端儲存
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCounterStandModal(true)}
              className="text-xs px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 cursor-pointer flex items-center gap-1.5 transition-colors"
              title="出示門市櫃檯 QR Code 立牌"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">門市 QR 立牌</span>
            </button>
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className="text-xs px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer hidden md:flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isMobileFrame ? '切換寬螢幕視角' : '模擬手機直向預覽'}</span>
            </button>
            {onBackToPos && (
              <button
                onClick={onBackToPos}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>返回前台收銀</span>
              </button>
            )}
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium cursor-pointer transition-colors"
              >
                <span>後台管理</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`mx-auto transition-all duration-300 pt-6 px-4 ${
          isMobileFrame ? 'max-w-md' : 'max-w-4xl'
        }`}
      >
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-linear-to-br from-stone-900 via-amber-950 to-stone-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden mb-6 border border-amber-900/40">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BobaFlow Tea Club 尊榮會員計畫</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px]">
                <ShieldCheck className="w-3 h-3 text-blue-300" />
                Firebase Auth 電子信箱驗證
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-50">
              線上申辦會員 · 累積點數 · 即時查詢購買記錄
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
              填寫下方申請表即可獲得專屬會員卡。結帳時出示手機號碼，每消費 NT$10 元累積 1 點。所有會員資料與購買消費記錄即時儲存於 Google Cloud Firestore 雲端資料庫！
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-amber-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>開通贈 20 點迎賓禮</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>滿 10 點可折抵 $10 元</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>消費明細雲端隨時查</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-stone-200/80 rounded-2xl mb-6 shadow-inner overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('register');
              playTapSound();
            }}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>申請會員帳號</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('card');
              playTapSound();
            }}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'card'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>我的集點卡 {activeMember ? `(${activeMember.points}點)` : ''}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              playTapSound();
            }}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>購買消費記錄 {memberOrders.length > 0 ? `(${memberOrders.length})` : ''}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('cloud');
              playTapSound();
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-stone-800 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">雲端狀態</span>
          </button>
        </div>

        {/* TAB 1: 會員申請與電子郵件驗證 */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            {/* If user just registered, show Email Verification Card */}
            {registeredMember && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-amber-500/40 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Mail className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-stone-900">
                        {registeredMember.verificationStatus === 'approved'
                          ? '🎉 會員帳號已完成驗證並開通！'
                          : '驗證信已寄出！請至電子信箱點擊連結'}
                      </h2>
                      <p className="text-xs text-stone-500">
                        申請帳號：<span className="font-semibold text-stone-800">{registeredMember.email}</span> · 會員姓名：{registeredMember.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      registeredMember.verificationStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {registeredMember.verificationStatus === 'approved' ? '✓ 已審核開通' : '⏳ 待驗證信確認'}
                  </span>
                </div>

                {verificationFeedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm ${
                      verificationFeedback.includes('恭喜') || verificationFeedback.includes('通關')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {verificationFeedback}
                  </div>
                )}

                {registeredMember.verificationStatus !== 'approved' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2">
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Firebase 雲端電子郵件驗證步驟：</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 pl-1 text-stone-700">
                        <li>登入您的電子信箱收件匣（如未看到請檢查垃圾信件匣）。</li>
                        <li>點擊郵件中的 Firebase 驗證連結（Verify your email address）。</li>
                        <li>返回本網頁點擊下方的「我已完成驗證，檢查狀態」按鈕即可開通！</li>
                      </ol>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleCheckEmailVerification}
                        disabled={checkingEmailStatus}
                        className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${checkingEmailStatus ? 'animate-spin' : ''}`} />
                        <span>{checkingEmailStatus ? '驗證檢查中...' : '我已完成驗證，檢查狀態'}</span>
                      </button>

                      <button
                        onClick={handleResendVerification}
                        className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>重新發送驗證信</span>
                      </button>

                      <button
                        onClick={handleFastPassApprove}
                        className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200 transition-colors"
                        title="給現場門市人員或測試人員快速開通"
                      >
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        <span>現場免等驗證信開通</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('card')}
                      className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>查看我的 VIP 會員卡與集點專區</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>查看消費歷史</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Registration Form Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-stone-200">
              <div className="mb-6">
                <h2 className="text-xl font-black text-stone-900">
                  {registeredMember ? '申辦新會員帳號' : '填寫會員申請資料'}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  請提供正確的手機號碼與電子信箱，結帳時可報手機號碼累積點數。
                </p>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>真實姓名 *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例如: 林小珍"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>手機號碼 (結帳集點必填) *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912-345-678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>電子郵件信箱 (收取驗證信) *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>設定會員密碼 (至少6碼) *</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="請輸入會員登入密碼"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>生日 (選填，贈生日禮)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">偏好甜度</label>
                    <select
                      value={formData.preferredSugar}
                      onChange={(e) => setFormData({ ...formData, preferredSugar: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs font-medium"
                    >
                      <option>正常糖(10分)</option>
                      <option>少糖(7分)</option>
                      <option>半糖(5分)</option>
                      <option>微糖(3分)</option>
                      <option>一分糖(1分)</option>
                      <option>無糖(0分)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">偏好冰塊</label>
                    <select
                      value={formData.preferredIce}
                      onChange={(e) => setFormData({ ...formData, preferredIce: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs font-medium"
                    >
                      <option>正常冰</option>
                      <option>少冰</option>
                      <option>微冰</option>
                      <option>去冰</option>
                      <option>常溫</option>
                      <option>溫熱</option>
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>註冊並發送驗證信中...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>送出申請並寄送電子郵件驗證信</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <div className="text-center text-[11px] text-stone-400 mt-2 flex items-center justify-center gap-1">
                    <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>資料直接同步保存於 Google Cloud Firestore 雲端資料庫</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: 我的集點卡與會員資訊 */}
        {activeTab === 'card' && (
          <div className="space-y-6">
            {/* Phone Lookup / Login Bar if not active */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200">
              <form onSubmit={handlePhoneLookup} className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex-1 w-full relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="輸入手機號碼登入或切換會員 (例如: 0912-345-678)"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>查詢會員卡</span>
                </button>
                {activeMember && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="登出目前會員"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">登出</span>
                  </button>
                )}
              </form>
              {loginFeedback && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  {loginFeedback}
                </div>
              )}
            </div>

            {/* Member Card Component */}
            {activeMember ? (
              <div className="space-y-6">
                {/* Golden VIP Card */}
                <div className="relative rounded-3xl bg-linear-to-tr from-stone-950 via-amber-900 to-amber-700 text-white p-6 sm:p-8 shadow-2xl overflow-hidden border border-amber-400/30">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-amber-600/20 blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 flex items-center justify-center font-black text-lg">
                          BF
                        </span>
                        <div>
                          <div className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                            BobaFlow VIP Card
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-amber-50">
                            {activeMember.name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-amber-300/80 block">
                          Member ID
                        </span>
                        <span className="font-mono font-bold text-sm sm:text-base text-amber-100">
                          {activeMember.memberCode}
                        </span>
                      </div>
                    </div>

                    {/* Points & Stats Showcase */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-center">
                      <div>
                        <div className="text-[10px] text-amber-200/80 font-medium">現有集點</div>
                        <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">
                          {activeMember.points}
                          <span className="text-xs ml-0.5 font-normal text-amber-200">點</span>
                        </div>
                      </div>
                      <div className="border-x border-white/10">
                        <div className="text-[10px] text-amber-200/80 font-medium">累積消費</div>
                        <div className="text-lg sm:text-2xl font-black text-white mt-0.5">
                          ${activeMember.totalSpent}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-200/80 font-medium">購買次數</div>
                        <div className="text-lg sm:text-2xl font-black text-white mt-0.5">
                          {activeMember.orderCount}
                          <span className="text-xs ml-0.5 font-normal text-stone-300">次</span>
                        </div>
                      </div>
                    </div>

                    {/* Member Details & QR Stand */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/15">
                      <div className="text-xs space-y-1 text-amber-100/90 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                          <span>結帳專用手機：<strong className="text-white">{activeMember.phone}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>信箱：{activeMember.email}</span>
                          {activeMember.emailVerified && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/40">
                              ✓ 已驗證
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Barcode / QR Code Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMemberQrModal(true);
                          playTapSound();
                        }}
                        className="flex items-center gap-2 bg-white hover:bg-amber-50 text-stone-900 px-3 py-2 rounded-xl shadow-md border border-amber-200/60 cursor-pointer transition-all hover:scale-105"
                        title="點擊放大會員專屬 QR Code 供收銀機掃描"
                      >
                        <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-mono leading-tight text-left">
                          <div className="font-bold flex items-center gap-1">
                            <span>臨櫃出示 QR Code</span>
                            <span className="text-[9px] text-amber-800 bg-amber-100 px-1 rounded font-sans">點擊放大</span>
                          </div>
                          <div className="text-stone-500 font-bold">{activeMember.memberCode}</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loyalty Rules & Milestones */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
                  <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span>集點獎勵與兌換規則</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                      <div className="text-xs font-bold text-amber-900">消費累積點數</div>
                      <div className="text-sm font-extrabold text-amber-700">每 $10 元累積 1 點</div>
                      <div className="text-[11px] text-stone-500">前台 POS 結帳時報手機號碼，系統立即即時計算並累計！</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <div className="text-xs font-bold text-emerald-900">點數現金折抵</div>
                      <div className="text-sm font-extrabold text-emerald-700">滿 10 點折抵 $10 元</div>
                      <div className="text-[11px] text-stone-500">可於下次於門市購買飲品時直接折抵現金消費。</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1">
                      <div className="text-xs font-bold text-purple-900">特調尊享禮</div>
                      <div className="text-sm font-extrabold text-purple-700">滿 50 點贈特調兌換券</div>
                      <div className="text-[11px] text-stone-500">可免費兌換任一杯私房自訂配方特調飲品 (L杯任選配料)。</div>
                    </div>
                  </div>

                  {/* Progress to 50 points perk */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs font-semibold mb-1.5 text-stone-600">
                      <span>兌換私房特調禮券進度</span>
                      <span>{activeMember.points} / 50 點</span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                      <div
                        className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (activeMember.points / 50) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-800">尚未登入或選擇會員</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    請於上方輸入您申辦時登記的手機號碼進行查詢，或點選「申請會員帳號」立即免費申辦！
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('register')}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  前往線上申辦會員
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 購買記錄與消費明細 */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  <span>會員購買記錄與消費明細</span>
                </h2>
                <p className="text-xs text-stone-500">
                  {activeMember
                    ? `會員：${activeMember.name} (${activeMember.phone}) · 累計消費 ${memberOrders.length} 筆訂單`
                    : '請先查詢或登入會員以查看個人消費歷史明細'}
                </p>
              </div>

              {activeMember && (
                <button
                  onClick={() => refreshCloudData()}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-stone-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>即時重新整理</span>
                </button>
              )}
            </div>

            {/* Orders List */}
            {activeMember ? (
              memberOrders.length > 0 ? (
                <div className="space-y-4">
                  {memberOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 hover:border-amber-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-stone-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                            {order.status === 'completed' ? '已完成交易' : '已取消'}
                          </span>
                          <span className="text-xs text-stone-500">{order.timestamp}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-stone-500 mr-2">總金額</span>
                          <span className="text-lg font-black text-amber-700">NT${order.totalAmount}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-100"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                                <span>{item.drinkName}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded font-medium">
                                  {item.size}杯
                                </span>
                                {item.ecoCup && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded font-medium">
                                    自備杯 -5
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500">
                                冰量: {item.ice} · 甜度: {item.sugar}
                                {item.toppings.length > 0 &&
                                  ` · 加料: ${item.toppings.map((t) => t.name).join('+')}`}
                              </div>
                            </div>

                            <div className="text-right font-medium">
                              <div className="text-stone-700 font-bold">x {item.quantity}</div>
                              <div className="text-stone-500">NT${item.subtotal}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer with Points Earned */}
                      <div className="flex items-center justify-between pt-2 text-xs border-t border-stone-100 text-stone-500">
                        <div className="flex items-center gap-3">
                          <span>付款方式: {order.paymentMethod}</span>
                          <span>收銀員: {order.clerk}</span>
                        </div>

                        {order.pointsEarned !== undefined && order.pointsEarned > 0 && (
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>本筆獲得 +{order.pointsEarned} 點</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-200 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                    <Receipt className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">尚無購買記錄</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    您在門市結帳時報手機號碼「{activeMember.phone}」，每筆購買明細與集點紀錄便會即時儲存於此！
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-200 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-stone-800">請先查詢會員帳號</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  請至「我的集點卡」輸入手機號碼登入，即可查看完整的消費歷史明細。
                </p>
                <button
                  onClick={() => setActiveTab('card')}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  前往輸入手機號碼
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Google 雲端與 Firebase 資料庫狀態 */}
        {activeTab === 'cloud' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Google Cloud Firestore & Firebase 雲端資料庫狀態
                    </h2>
                    <p className="text-xs text-stone-500">
                      會員申請資料、電子郵件驗證狀態、點數累積與 POS 購買記錄皆即時持久化儲存。
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>已連線 (Online)</span>
                </span>
              </div>

              {/* Database metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-stone-500 font-medium">Google Cloud 專案代碼 (Project ID)</div>
                  <div className="font-mono font-bold text-stone-900 text-sm">
                    {firebaseConfig.projectId}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-stone-500 font-medium">Firestore Database ID</div>
                  <div className="font-mono font-bold text-stone-900 text-sm">
                    {firebaseConfig.firestoreDatabaseId}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-stone-500 font-medium">會員集合 (Collection: members)</div>
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <span>已儲存 {members.length} 筆會員資料</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">即時同步中</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-stone-500 font-medium">訂單與購買記錄集合 (Collection: orders)</div>
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <span>已儲存 {orders.length} 筆交易記錄</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">即時同步中</span>
                  </div>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-stone-500">
                  狀態：<strong className="text-stone-700">{cloudStatus === 'connected' ? '雲端資料庫已就緒' : '同步中'}</strong>
                </div>
                <button
                  onClick={() => {
                    refreshCloudData();
                    playTapSound();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>立即同步最新雲端資料</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Member Personal Enlarged QR Code Modal */}
      {showMemberQrModal && activeMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 text-center p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  BF
                </span>
                <span className="font-bold text-stone-900 text-sm">
                  {activeMember.name} 的會員 QR Code
                </span>
              </div>
              <button
                onClick={() => setShowMemberQrModal(false)}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-2 flex justify-center">
              <QRCodeDisplay
                value={activeMember.phone}
                size={200}
                title={`會員代碼：${activeMember.memberCode}`}
                subtitle={`結帳報電話：${activeMember.phone}`}
                centerText="BF"
                showDownload={true}
                showCopy={true}
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-800" />
                <span>結帳出示說明：</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                於門市結帳時出示此條碼，店員使用掃描槍讀取或輸入手機號碼，即可即時累積點數與查詢優惠！
              </p>
            </div>

            <button
              onClick={() => setShowMemberQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Counter Stand QR Code Modal */}
      <CounterQrModal
        isOpen={showCounterStandModal}
        onClose={() => setShowCounterStandModal(false)}
        onOpenPortal={() => setShowCounterStandModal(false)}
      />
    </div>
  );
};
