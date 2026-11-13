import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import type { CustomerAccountData } from '../types/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  accountData: CustomerAccountData | null;
  loading: boolean;
  authError: string;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<CustomerAccountData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const fetchAccountWithToken = useCallback(async (idToken: string) => {
    try {
      const res = await fetch('/api/account', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as CustomerAccountData;
        setAccountData(data);
      }
    } catch (err) {
      console.error('Failed to load account data:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          await fetchAccountWithToken(idToken);
        } catch (err) {
          console.error('Token fetch failed:', err);
        }
      } else {
        setToken(null);
        setAccountData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAccountWithToken]);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      let activeToken = token;
      if (auth.currentUser) {
        activeToken = await auth.currentUser.getIdToken();
        setToken(activeToken);
      }
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      return fetch(input, { ...init, headers });
    },
    [token]
  );

  const refreshAccount = useCallback(async () => {
    if (!auth.currentUser) return;
    const idToken = await auth.currentUser.getIdToken();
    setToken(idToken);
    await fetchAccountWithToken(idToken);
  }, [fetchAccountWithToken]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError('');
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await fetchAccountWithToken(idToken);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to complete sign-in.';
      setAuthError(msg);
    }
  }, [fetchAccountWithToken]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setToken(null);
    setAccountData(null);
  }, []);

  const isAdmin = accountData?.profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        accountData,
        loading,
        authError,
        isAdmin,
        signInWithGoogle,
        signOutUser,
        refreshAccount,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
