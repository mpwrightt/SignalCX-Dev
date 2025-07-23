'use client';

import * as React from 'react';
import type { AuthenticatedUser } from '@/lib/types';
import { 
  getUserById, 
  signInWithGoogle,
  signOut as firebaseSignOut,
  loginDemo,
  onAuthStateChange
} from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import { logAuditEvent } from '@/lib/audit-service';

type AuthContextType = {
  user: AuthenticatedUser | null;
  sessionMode: 'demo' | 'enterprise' | null;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginDemo: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'signalcx-auth-session';
const MODE_SESSION_KEY = 'signalcx-mode-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);
  const [sessionMode, setSessionMode] = React.useState<'demo' | 'enterprise' | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const checkExistingSession = async () => {
      setIsLoading(true);
      try {
        // Check for existing demo session
        const demoUserId = window.sessionStorage.getItem(AUTH_SESSION_KEY);
        const mode = window.sessionStorage.getItem(MODE_SESSION_KEY) as 'demo' | 'enterprise' | null;
        
        if (demoUserId && mode === 'demo') {
          const fetchedUser = await getUserById(demoUserId);
          if (fetchedUser) {
            setUser(fetchedUser);
            setSessionMode('demo');
            setIsLoading(false);
            return;
          }
        }
        
        // Set up Firebase auth state listener for enterprise mode
        const unsubscribe = onAuthStateChange(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userProfile = await getUserById(firebaseUser.uid);
              if (userProfile) {
                setUser(userProfile);
                setSessionMode('enterprise');
                await logAuditEvent(userProfile, 'USER_LOGIN', { mode: 'enterprise' });
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              setUser(null);
              setSessionMode(null);
            }
          } else {
            // Only clear if not in demo mode
            if (sessionMode !== 'demo') {
              setUser(null);
              setSessionMode(null);
            }
          }
          setIsLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Session check failed', error);
        setUser(null);
        setSessionMode(null);
        setIsLoading(false);
      }
    };
    
    let unsubscribeAuth: (() => void) | undefined;
    
    checkExistingSession().then(unsubscribe => {
      unsubscribeAuth = unsubscribe;
    });
    
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  const handleLoginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.user) {
        // User state will be updated via the auth state listener
        return { success: true };
      } else {
        await logAuditEvent(null, 'USER_LOGIN_FAILED', { 
          method: 'google', 
          error: result.error 
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      await logAuditEvent(null, 'USER_LOGIN_FAILED', { 
        method: 'google', 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginDemo = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, reason } = await loginDemo(email);
      if (loggedInUser) {
        setUser(loggedInUser);
        setSessionMode('demo');
        window.sessionStorage.setItem(AUTH_SESSION_KEY, loggedInUser.id);
        window.sessionStorage.setItem(MODE_SESSION_KEY, 'demo');
        await logAuditEvent(loggedInUser, 'USER_LOGIN', { mode: 'demo' });
        return true;
      } else {
        await logAuditEvent(null, 'USER_LOGIN_FAILED', { 
          attemptedEmail: email, 
          reason,
          mode: 'demo'
        });
        return false;
      }
    } catch (error) {
      await logAuditEvent(null, 'USER_LOGIN_FAILED', { 
        attemptedEmail: email, 
        error: (error as Error).message,
        mode: 'demo'
      });
      console.error('Demo login failed', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await logAuditEvent(user, 'USER_LOGOUT', { mode: sessionMode });
    }
    
    try {
      // Sign out from Firebase if in enterprise mode
      if (sessionMode === 'enterprise') {
        await firebaseSignOut();
      }
      
      // Clear session storage for demo mode
      if (sessionMode === 'demo') {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
        window.sessionStorage.removeItem(MODE_SESSION_KEY);
      }
      
      setUser(null);
      setSessionMode(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Firebase signout fails
      setUser(null);
      setSessionMode(null);
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      window.sessionStorage.removeItem(MODE_SESSION_KEY);
      router.push('/login');
    }
  };

  const isAuthenticated = !!user && (user.isActive || sessionMode === 'demo');

  const value = { 
    user, 
    sessionMode, 
    loginWithGoogle: handleLoginWithGoogle,
    loginDemo: handleLoginDemo,
    logout: handleLogout, 
    isLoading,
    isAuthenticated
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
