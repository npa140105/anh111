import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
  reload,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Member, Order } from '../types';

// 1. Initialize Firebase App and Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Skill Error Handling Standards
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection on Startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database initializing.');
    }
    return false;
  }
}

// Run connection check immediately
testConnection();

// 4. Cloud Database Service for Members
export const cloudMemberService = {
  async saveMember(member: Member): Promise<void> {
    try {
      const docRef = doc(db, 'members', member.id);
      await setDoc(docRef, member, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `members/${member.id}`);
    }
  },

  async getAllMembers(): Promise<Member[]> {
    try {
      const colRef = collection(db, 'members');
      const snapshot = await getDocs(colRef);
      const list: Member[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Member);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'members');
    }
  },

  async getMemberByPhone(cleanPhone: string): Promise<Member | null> {
    try {
      const colRef = collection(db, 'members');
      const q = query(colRef, where('phone', '==', cleanPhone));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as Member;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'members');
    }
  },

  async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const docRef = doc(db, 'members', memberId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Member;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `members/${memberId}`);
    }
  },

  async updateMember(memberId: string, updates: Partial<Member>): Promise<void> {
    try {
      const docRef = doc(db, 'members', memberId);
      await setDoc(docRef, updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${memberId}`);
    }
  },
};

// 5. Cloud Database Service for Orders (Purchase History & Points)
export const cloudOrderService = {
  async saveOrder(order: Order): Promise<void> {
    try {
      const docRef = doc(db, 'orders', order.id);
      await setDoc(docRef, order);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${order.id}`);
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const colRef = collection(db, 'orders');
      const snapshot = await getDocs(colRef);
      const list: Order[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Order);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  },

  async getMemberOrders(memberPhone: string): Promise<Order[]> {
    try {
      const colRef = collection(db, 'orders');
      const q = query(colRef, where('memberPhone', '==', memberPhone));
      const snapshot = await getDocs(q);
      const list: Order[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Order);
      });
      // Sort in-memory to prevent complex composite index requirements
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  },
};

// 6. Firebase Auth & Email Verification Helpers
export const cloudAuthService = {
  async signUp(email: string, pass: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Send email verification link via Firebase Auth
    if (cred.user) {
      await sendEmailVerification(cred.user);
    }
    return cred.user;
  },

  async resendVerificationEmail(): Promise<boolean> {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }
    return false;
  },

  async checkVerificationStatus(): Promise<boolean> {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      return auth.currentUser.emailVerified;
    }
    return false;
  },

  async signIn(email: string, pass: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  },

  async signOutUser(): Promise<void> {
    await signOut(auth);
  },
};
