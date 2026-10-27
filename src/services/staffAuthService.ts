import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StaffAccount, StaffRole, LoginResult, ChangePasswordResult } from '../types/auth';

const SESSION_STORAGE_KEY = 'bobaflow_current_staff_session';
const LOCAL_STAFF_CACHE_KEY = 'bobaflow_staff_accounts_cache';

// System Administrator contact specified in user requirements
export const SYSTEM_ADMIN_EMAIL = 'b11206151@gapps.knu.edu.tw';

export const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-admin-01',
    account: 'admin',
    displayName: '系統總管理員 (Admin)',
    role: 'admin',
    email: SYSTEM_ADMIN_EMAIL,
    password: 'admin888',
    status: 'active',
    allowedTabs: [
      'pos',
      'members',
      'bom',
      'custom_builder',
      'recipes',
      'inventory',
      'alerts',
      'analytics',
      'member_portal',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    avatarColor: 'bg-amber-800 text-amber-50',
  },
  {
    id: 'staff-mgr-01',
    account: 'manager',
    displayName: '旗艦門市店長',
    role: 'manager',
    email: 'manager@bobaflow.club',
    password: 'tea2026',
    status: 'active',
    allowedTabs: [
      'pos',
      'members',
      'bom',
      'recipes',
      'inventory',
      'alerts',
      'analytics',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    avatarColor: 'bg-emerald-800 text-emerald-50',
  },
  {
    id: 'staff-barista-01',
    account: 'staff01',
    displayName: '門市調飲收銀員',
    role: 'staff',
    email: 'staff01@bobaflow.club',
    password: 'boba123',
    status: 'active',
    allowedTabs: ['pos', 'custom_builder', 'recipes'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    avatarColor: 'bg-indigo-800 text-indigo-50',
  },
];

class StaffAuthService {
  private hasInitializedCloudSync = false;

  constructor() {
    this.initCloudSeed();
  }

  /**
   * Ensure default administrator and staff accounts exist on Cloud Firestore
   */
  public async initCloudSeed(): Promise<void> {
    if (this.hasInitializedCloudSync) return;
    try {
      const colRef = collection(db, 'staff_accounts');
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        console.log('Seeding initial staff accounts to Firebase Firestore...');
        for (const account of DEFAULT_STAFF_ACCOUNTS) {
          const docRef = doc(db, 'staff_accounts', account.id);
          await setDoc(docRef, account);
        }
        localStorage.setItem(LOCAL_STAFF_CACHE_KEY, JSON.stringify(DEFAULT_STAFF_ACCOUNTS));
      } else {
        const cloudAccounts: StaffAccount[] = [];
        snapshot.forEach((d) => {
          cloudAccounts.push(d.data() as StaffAccount);
        });
        localStorage.setItem(LOCAL_STAFF_CACHE_KEY, JSON.stringify(cloudAccounts));
      }
      this.hasInitializedCloudSync = true;
    } catch (err) {
      console.warn('Cloud sync initialization warning (using local fallback cache):', err);
      // Fallback cache if offline or first load
      const cached = localStorage.getItem(LOCAL_STAFF_CACHE_KEY);
      if (!cached) {
        localStorage.setItem(LOCAL_STAFF_CACHE_KEY, JSON.stringify(DEFAULT_STAFF_ACCOUNTS));
      }
    }
  }

  /**
   * Fetch all staff accounts from Cloud Firestore with local cache sync
   */
  public async fetchAllStaffAccounts(): Promise<StaffAccount[]> {
    try {
      const colRef = collection(db, 'staff_accounts');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const accounts: StaffAccount[] = [];
        snapshot.forEach((d) => {
          accounts.push(d.data() as StaffAccount);
        });
        localStorage.setItem(LOCAL_STAFF_CACHE_KEY, JSON.stringify(accounts));
        return accounts;
      }
    } catch (err) {
      console.warn('Error reading staff accounts from Firestore, using cache:', err);
    }

    const cached = localStorage.getItem(LOCAL_STAFF_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore JSON parse error
      }
    }
    return DEFAULT_STAFF_ACCOUNTS;
  }

  /**
   * Authenticate staff user credentials against Cloud Firestore
   */
  public async login(accountInput: string, passwordInput: string): Promise<LoginResult> {
    const trimmedAccount = accountInput.trim().toLowerCase();
    const trimmedPass = passwordInput.trim();

    if (!trimmedAccount || !trimmedPass) {
      return {
        success: false,
        errorMessage: '請輸入使用者帳號與登入密碼',
      };
    }

    // Ensure seed initialized
    await this.initCloudSeed();
    const accounts = await this.fetchAllStaffAccounts();

    // Find account by username, ID, or email
    const matched = accounts.find(
      (a) =>
        a.account.toLowerCase() === trimmedAccount ||
        a.email.toLowerCase() === trimmedAccount ||
        (trimmedAccount === 'admin' && a.role === 'admin')
    );

    if (!matched) {
      return {
        success: false,
        errorMessage: '查無此帳號！請確認帳號是否正確。若忘記密碼或無權限，依資安規定請寫信聯繫系統管理者：' + SYSTEM_ADMIN_EMAIL,
      };
    }

    // Check account status
    if (matched.status !== 'active') {
      return {
        success: false,
        errorMessage: `此帳號狀態目前為【停用 / 未授權】，無法進入茶研所系統。請聯繫系統管理者 (${SYSTEM_ADMIN_EMAIL}) 開通權限。`,
      };
    }

    // Verify password
    if (matched.password !== trimmedPass) {
      return {
        success: false,
        errorMessage: '登入密碼錯誤！請重新確認。若忘記密碼必須寫信給管理者，系統不支援線上自行更改。',
      };
    }

    // Update last login timestamp in Firestore
    const nowIso = new Date().toISOString();
    matched.lastLoginAt = nowIso;
    try {
      const docRef = doc(db, 'staff_accounts', matched.id);
      await updateDoc(docRef, { lastLoginAt: nowIso });
    } catch (err) {
      console.warn('Failed to update lastLoginAt to Firestore:', err);
    }

    // Update cache and session
    this.saveCurrentSession(matched);
    return {
      success: true,
      user: matched,
    };
  }

  /**
   * Modify password for the currently logged-in user (Cloud Firestore synced)
   */
  public async changeCurrentPassword(
    userId: string,
    currentPasswordInput: string,
    newPasswordInput: string,
    confirmPasswordInput: string
  ): Promise<ChangePasswordResult> {
    const trimmedCurrent = currentPasswordInput.trim();
    const trimmedNew = newPasswordInput.trim();
    const trimmedConfirm = confirmPasswordInput.trim();

    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      return {
        success: false,
        errorMessage: '請完整填寫原密碼、新密碼與確認新密碼',
      };
    }

    if (trimmedNew.length < 6) {
      return {
        success: false,
        errorMessage: '新密碼長度至少需 6 個字元，請加強密碼複雜度以維護資安',
      };
    }

    if (trimmedNew !== trimmedConfirm) {
      return {
        success: false,
        errorMessage: '新密碼與確認密碼不一致，請再次確認輸入',
      };
    }

    const accounts = await this.fetchAllStaffAccounts();
    const target = accounts.find((a) => a.id === userId);

    if (!target) {
      return {
        success: false,
        errorMessage: '找不到當前登入之帳號資料，請重新登入後再試',
      };
    }

    if (target.password !== trimmedCurrent) {
      return {
        success: false,
        errorMessage: '原密碼比對錯誤，請確認輸入的原登入密碼',
      };
    }

    const nowIso = new Date().toISOString();
    target.password = trimmedNew;
    target.updatedAt = nowIso;

    // Update Cloud Firestore
    try {
      const docRef = doc(db, 'staff_accounts', target.id);
      await setDoc(docRef, { password: trimmedNew, updatedAt: nowIso }, { merge: true });
      console.log('Password successfully synced to Firebase Firestore for:', target.account);
    } catch (err) {
      console.error('Error writing new password to Firestore:', err);
      return {
        success: false,
        errorMessage: '雲端資料庫更新失敗，請檢查網路連線或稍後再試',
      };
    }

    // Update local cache & active session
    const updatedList = accounts.map((a) => (a.id === target.id ? target : a));
    localStorage.setItem(LOCAL_STAFF_CACHE_KEY, JSON.stringify(updatedList));
    this.saveCurrentSession(target);

    return {
      success: true,
    };
  }

  /**
   * Save current staff session in localStorage
   */
  public saveCurrentSession(user: StaffAccount): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn('Unable to save staff session:', err);
    }
  }

  /**
   * Retrieve current staff session
   */
  public getCurrentSession(): StaffAccount | null {
    try {
      const item = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!item) return null;
      return JSON.parse(item) as StaffAccount;
    } catch {
      return null;
    }
  }

  /**
   * Sign out current staff and clear session
   */
  public logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /**
   * Check if a staff user is authorized to view a specific navigation tab
   */
  public canAccessTab(user: StaffAccount | null, tab: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.allowedTabs.includes(tab);
  }
}

export const staffAuthService = new StaffAuthService();
