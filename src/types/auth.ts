export type StaffRole = 'admin' | 'manager' | 'staff';

export interface StaffAccount {
  id: string;
  account: string; // Username / login account (e.g., admin, manager, staff01, or admin@bobaflow.club)
  displayName: string; // Display name e.g. 系統總管理員, 門市店長, 前台調飲員
  role: StaffRole;
  email: string; // Official contact email
  password: string; // Cloud-stored password
  status: 'active' | 'disabled';
  allowedTabs: string[]; // List of permitted navigation tabs
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  avatarColor?: string;
}

export interface LoginResult {
  success: boolean;
  user?: StaffAccount;
  errorMessage?: string;
}

export interface ChangePasswordResult {
  success: boolean;
  errorMessage?: string;
}
