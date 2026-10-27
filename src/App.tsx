import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header, NavTab } from './components/Header';
import { PosSection } from './components/pos/PosSection';
import { BomSection } from './components/bom/BomSection';
import { CustomRecipeBuilder } from './components/custom_builder/CustomRecipeBuilder';
import { RecipeGuideSection } from './components/recipes/RecipeGuideSection';
import { InventorySection } from './components/inventory/InventorySection';
import { RestockAlertsSection } from './components/restock/RestockAlertsSection';
import { AnalyticsSection } from './components/analytics/AnalyticsSection';
import { MemberManagementSection } from './components/members/MemberManagementSection';
import { MemberPortalStandalone } from './components/members/MemberPortalStandalone';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { CounterQrModal } from './components/common/CounterQrModal';
import { CoverLoginScreen } from './components/auth/CoverLoginScreen';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { staffAuthService } from './services/staffAuthService';
import { StaffAccount } from './types/auth';

const AppContent: React.FC = () => {
  // Staff Authentication State
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffAccount | null>(() =>
    staffAuthService.getCurrentSession()
  );
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [showCounterQr, setShowCounterQr] = useState(false);
  const { activeOrderModal, setActiveOrderModal } = useShop();

  // If user is not authenticated, strictly show CoverLoginScreen (封頁)
  if (!currentStaffUser) {
    return (
      <CoverLoginScreen
        onLoginSuccess={(user) => {
          setCurrentStaffUser(user);
          // Set to pos or first allowed tab
          if (staffAuthService.canAccessTab(user, 'pos')) {
            setActiveTab('pos');
          } else if (user.allowedTabs.length > 0) {
            setActiveTab(user.allowedTabs[0] as NavTab);
          }
        }}
      />
    );
  }

  // Handle Logout
  const handleLogout = () => {
    staffAuthService.logout();
    setCurrentStaffUser(null);
    setActiveTab('pos');
  };

  // If in Standalone Member Portal mode (for preview or testing)
  if (activeTab === 'member_portal') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
        <MemberPortalStandalone
          onBackToPos={() => setActiveTab('pos')}
          onBackToAdmin={() => setActiveTab('members')}
        />
        {/* Global Receipt Modal */}
        <ReceiptModal order={activeOrderModal} onClose={() => setActiveOrderModal(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQrStand={() => setShowCounterQr(true)}
        currentUser={currentStaffUser}
        onOpenChangePassword={() => setShowChangePassword(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeTab === 'pos' && staffAuthService.canAccessTab(currentStaffUser, 'pos') && (
          <PosSection
            onNavigateToCustomBuilder={() => setActiveTab('custom_builder')}
            onNavigateToBOM={() => setActiveTab('bom')}
          />
        )}
        {activeTab === 'members' && staffAuthService.canAccessTab(currentStaffUser, 'members') && (
          <MemberManagementSection
            onOpenStandalonePortal={() => setActiveTab('member_portal')}
          />
        )}
        {activeTab === 'bom' && staffAuthService.canAccessTab(currentStaffUser, 'bom') && (
          <BomSection onNavigateToPOS={(drinkId) => setActiveTab('pos')} />
        )}
        {activeTab === 'custom_builder' &&
          staffAuthService.canAccessTab(currentStaffUser, 'custom_builder') && (
            <CustomRecipeBuilder />
          )}
        {activeTab === 'recipes' && staffAuthService.canAccessTab(currentStaffUser, 'recipes') && (
          <RecipeGuideSection onNavigateToPOS={() => setActiveTab('pos')} />
        )}
        {activeTab === 'inventory' &&
          staffAuthService.canAccessTab(currentStaffUser, 'inventory') && <InventorySection />}
        {activeTab === 'alerts' && staffAuthService.canAccessTab(currentStaffUser, 'alerts') && (
          <RestockAlertsSection />
        )}
        {activeTab === 'analytics' &&
          staffAuthService.canAccessTab(currentStaffUser, 'analytics') && <AnalyticsSection />}
      </main>

      {/* Change Password Modal (Authenticated User Only) */}
      {showChangePassword && (
        <ChangePasswordModal
          currentUser={currentStaffUser}
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onPasswordChanged={(updatedUser) => {
            setCurrentStaffUser(updatedUser);
          }}
        />
      )}

      {/* Global Receipt Modal */}
      <ReceiptModal order={activeOrderModal} onClose={() => setActiveOrderModal(null)} />

      {/* Global Counter QR Code Stand Modal */}
      <CounterQrModal
        isOpen={showCounterQr}
        onClose={() => setShowCounterQr(false)}
        onOpenPortal={() => {
          setShowCounterQr(false);
          setActiveTab('member_portal');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">茶研所 BobaFlow 零售安全系統</span>
            <span>·</span>
            <span>當前身分：{currentStaffUser.displayName} ({currentStaffUser.role})</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-stone-600 hover:text-amber-800 underline underline-offset-2 cursor-pointer"
            >
              自行修訂密碼
            </button>
            <span>·</span>
            <button
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer"
            >
              登出APP
            </button>
            <span>·</span>
            <span>© 2026 BobaFlow Retail Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
