import { createContext, useContext, useState, type ReactNode } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';

const DEV_AUTH_KEY = 'study-guild-dev-auth';
const IS_DEV_MODE = !import.meta.env.VITE_AZURE_CLIENT_ID;

interface AuthContextValue {
  isAuthenticated: boolean;
  devLogin: () => void;
  devLogout: () => void;
  logout: () => Promise<void>;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function MsalAuthProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  const value: AuthContextValue = {
    isAuthenticated,
    isDevMode: false,
    devLogin: () => {},
    devLogout: () => {},
    logout: () => instance.logoutPopup(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function DevAuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(DEV_AUTH_KEY));

  const value: AuthContextValue = {
    isAuthenticated: authed,
    isDevMode: true,
    devLogin: () => {
      sessionStorage.setItem(DEV_AUTH_KEY, '1');
      setAuthed(true);
    },
    devLogout: () => {
      sessionStorage.removeItem(DEV_AUTH_KEY);
      setAuthed(false);
    },
    logout: async () => {
      sessionStorage.removeItem(DEV_AUTH_KEY);
      setAuthed(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (IS_DEV_MODE) return <DevAuthProvider>{children}</DevAuthProvider>;
  return <MsalAuthProvider>{children}</MsalAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
