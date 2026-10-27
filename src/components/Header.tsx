import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  AlertTriangle,
  ShoppingBag,
  Users,
  QrCode,
  KeyRound,
  LogOut,
  ShieldCheck,
  User,
  ChevronDown,
} from 'lucide-react';
import { StaffAccount } from '../types/auth';
import { staffAuthService } from '../services/staffAuthService';

export type NavTab =
  | 'pos'
  | 'bom'
  | 'custom_builder'
  | 'recipes'
  | 'inventory'
  | 'alerts'
  | 'analytics'
  | 'members'
  | 'member_portal';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQrStand?: () => void;
  currentUser: StaffAccount | null;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenQrStand,
  currentUser,
  onOpenChangePassword,
  onLogout,
}) => {
  const { lowStockCount, cart, pendingMembersCount } = useShop();
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const canAccess = (tab: NavTab) => {
    return staffAuthService.canAccessTab(currentUser, tab);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: '總管理員', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'manager':
        return { label: '門市店長', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { label: '調飲收銀', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('pos')}
          className="text-base sm:text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 flex items-center gap-2 text-left cursor-pointer hover:text-amber-800 transition-colors"
        >
          <span className="w-8 h-8 rounded-lg bg-amber-800 text-amber-50 flex items-center justify-center font-black text-sm">
            BF
          </span>
          <span className="hidden sm:inline">BobaFlow 飲品庫存銷售系統</span>
          <span className="sm:hidden font-bold">BobaFlow</span>
        </button>

        {/* Zone 2: Navigation links (Filtered by User Permissions) */}
        <nav className="hidden xl:flex items-center gap-4 text-sm font-medium text-stone-600">
          {canAccess('pos') && (
            <button
              onClick={() => onSelectTab('pos')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'pos'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              前台點單收銀
            </button>
          )}

          {canAccess('members') && (
            <button
              onClick={() => onSelectTab('members')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              <span>會員管理與審核</span>
              {pendingMembersCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {pendingMembersCount}
                </span>
              )}
            </button>
          )}

          {canAccess('bom') && (
            <button
              onClick={() => onSelectTab('bom')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'bom'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              飲品 BOM 配方
            </button>
          )}

          {canAccess('custom_builder') && (
            <button
              onClick={() => onSelectTab('custom_builder')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'custom_builder'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              特調配方工坊
            </button>
          )}

          {canAccess('recipes') && (
            <button
              onClick={() => onSelectTab('recipes')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'recipes'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              經典調飲食譜
            </button>
          )}

          {canAccess('inventory') && (
            <button
              onClick={() => onSelectTab('inventory')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              後台存貨管理
            </button>
          )}

          {canAccess('alerts') && (
            <button
              onClick={() => onSelectTab('alerts')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              <span>自動補貨提醒</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          {canAccess('analytics') && (
            <button
              onClick={() => onSelectTab('analytics')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'text-amber-900 font-semibold border-b-2 border-amber-850 pb-0.5'
                  : 'hover:text-stone-900'
              }`}
            >
              銷售分析報表
            </button>
          )}
        </nav>

        {/* Zone 3: Quick Action buttons & Logged-in Staff Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenQrStand && (
            <button
              onClick={onOpenQrStand}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="出示門市加入會員 QR Code 立牌"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden md:inline">門市 QR 立牌</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('member_portal')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'member_portal'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <span className="hidden sm:inline">線上會員網頁</span>
            <span className="sm:hidden">會員網頁</span>
          </button>

          {lowStockCount > 0 && activeTab !== 'alerts' ? (
            <button
              onClick={() => onSelectTab('alerts')}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lowStockCount} 項原料預警</span>
              <span className="sm:hidden">{lowStockCount} 預警</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('pos')}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">收銀出杯 {totalCartCount > 0 ? `(${totalCartCount})` : ''}</span>
              <span className="sm:hidden">收銀 {totalCartCount > 0 ? `(${totalCartCount})` : ''}</span>
            </button>
          )}

          {/* User Profile, Password Modification & Logout Controls */}
          {currentUser && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition-all cursor-pointer"
                title="帳號資訊與系統功能"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-800 text-amber-50'
                      : currentUser.role === 'manager'
                      ? 'bg-emerald-800 text-emerald-50'
                      : 'bg-indigo-800 text-indigo-50'
                  }`}
                >
                  {currentUser.displayName.slice(0, 1)}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-stone-800 truncate max-w-[90px]">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {currentUser.account}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 z-40 py-2 divide-y divide-stone-100 animate-scaleUp">
                    {/* User Identity Info */}
                    <div className="px-4 py-2.5">
                      <div className="text-xs font-bold text-stone-900">
                        {currentUser.displayName}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        帳號: {currentUser.account}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${roleInfo.color}`}
                        >
                          {roleInfo.label}
                        </span>
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          已授權進入
                        </span>
                      </div>
                    </div>

                    {/* Actions: Self-service change password & Logout */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenChangePassword();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>自行修訂密碼 (雲端同步)</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>登出系統 (返回封頁)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile & Mid-screen nav bar */}
      <div className="xl:hidden border-t border-stone-200 bg-stone-50 overflow-x-auto py-2 px-4 flex items-center gap-2">
        {canAccess('pos') && (
          <button
            onClick={() => onSelectTab('pos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'pos' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            點單收銀
          </button>
        )}
        {canAccess('members') && (
          <button
            onClick={() => onSelectTab('members')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'members' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>會員管理</span>
            {pendingMembersCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-white px-1 rounded-full">
                {pendingMembersCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => onSelectTab('member_portal')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'member_portal' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
          }`}
        >
          <QrCode className="w-3 h-3" />
          <span>申請網頁</span>
        </button>
        {canAccess('bom') && (
          <button
            onClick={() => onSelectTab('bom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'bom' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            BOM 配方
          </button>
        )}
        {canAccess('custom_builder') && (
          <button
            onClick={() => onSelectTab('custom_builder')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'custom_builder' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            特調工坊
          </button>
        )}
        {canAccess('recipes') && (
          <button
            onClick={() => onSelectTab('recipes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'recipes' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            調飲食譜
          </button>
        )}
        {canAccess('inventory') && (
          <button
            onClick={() => onSelectTab('inventory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            存貨管理
          </button>
        )}
        {canAccess('alerts') && (
          <button
            onClick={() => onSelectTab('alerts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'alerts' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>補貨提醒</span>
            {lowStockCount > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-1 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>
        )}
        {canAccess('analytics') && (
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-amber-900 text-white' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            分析報表
          </button>
        )}

        {/* Mobile Quick Logout */}
        <button
          onClick={onLogout}
          className="ml-auto px-2.5 py-1 text-xs font-medium rounded-md text-rose-700 hover:bg-rose-100 whitespace-nowrap flex items-center gap-1 border border-rose-200"
          title="登出系統"
        >
          <LogOut className="w-3 h-3" />
          <span>登出</span>
        </button>
      </div>
    </header>
  );
};
