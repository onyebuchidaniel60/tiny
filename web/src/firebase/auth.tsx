import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { demoEmail, demoPassword, getFirebaseAuth, isFirebaseConfigured } from './config';

type AuthMode = 'firebase' | 'demo';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  mode: AuthMode;
  firebaseConfigured: boolean;
  demoEmail: string;
  demoPassword: string;
  signIn: (email: string, password: string) => Promise<void>;
  enterDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_FLAG = 'tiny-web-demo-mode';

function initialAuthMode(): AuthMode {
  if (!isFirebaseConfigured) return 'demo';
  return localStorage.getItem(DEMO_FLAG) === '1' ? 'demo' : 'firebase';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>(initialAuthMode);
  const [loading, setLoading] = useState(() => isFirebaseConfigured && initialAuthMode() === 'firebase');

  useEffect(() => {
    if (mode !== 'firebase') {
      setLoading(false);
      return;
    }
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return onAuthStateChanged(firebaseAuth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, [mode]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    mode,
    firebaseConfigured: isFirebaseConfigured,
    demoEmail,
    demoPassword,
    async signIn(email, password) {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) throw new Error('Firebase is not configured for this build.');
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    },
    enterDemo() {
      localStorage.setItem(DEMO_FLAG, '1');
      setUser(null);
      setMode('demo');
      setLoading(false);
    },
    async signOut() {
      const firebaseAuth = getFirebaseAuth();
      if (firebaseAuth) await firebaseSignOut(firebaseAuth);
      setUser(null);
      localStorage.removeItem(DEMO_FLAG);
      setMode(isFirebaseConfigured ? 'firebase' : 'demo');
    },
  }), [user, loading, mode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
