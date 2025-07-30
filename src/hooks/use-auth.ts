'use client';

import * as React from 'react';
import type { AuthenticatedUser } from '@/lib/types';
import { 
  getUserById, 
  signInWithGoogle,
  
  loginDemo,
  onAuthStateChange
} from '@/lib/auth-service-enhanced';
import { useRouter } from 'next/navigation';
import { logAuditEvent, logSecurityEvent } from '@/lib/audit-service';

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
        
        // Set up Supabase auth state listener for enterprise mode
        const unsubscribe = onAuthStateChange(async (supabaseUser) => {
          if (supabaseUser) {
            try {
              setUser(supabaseUser);
              setSessionMode('enterprise');
              
              // Enhanced login audit with security metadata
              await logAuditEvent(
                supabaseUser, 
                'USER_LOGIN', 
                {
                  sessionId: supabaseUser.id,
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                  success: true,
                  dataSensitivity: 'confidential'
                },
                { 
                  mode: 'enterprise',
                  authProvider: 'supabase',
                  emailVerified: supabaseUser.emailVerified,
                  lastLoginAt: supabaseUser.lastLoginAt,
                  accountCreated: supabaseUser.createdAt
                },
                  {
                    source: 'web',
                    dataSensitivity: 'confidential'
                  }
                );

                // Check for suspicious login patterns
                if (supabaseUser.lastLoginAt) {
                  const lastLogin = new Date(supabaseUser.lastLoginAt);
                  const timeSinceLastLogin = Date.now() - lastLogin.getTime();
                  const oneWeek = 7 * 24 * 60 * 60 * 1000;
                  
                  if (timeSinceLastLogin > oneWeek) {
                    await logSecurityEvent(
                      supabaseUser,
                      'SUSPICIOUS_ACTIVITY_DETECTED',
                      {
                        threatLevel: 'low',
                        violationType: 'unusual_login_pattern',
                        additionalContext: {
                          timeSinceLastLogin: Math.floor(timeSinceLastLogin / (24 * 60 * 60 * 1000)),
                          unit: 'days'
                        }
                      }
                    );
                  }
                }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              
              // Log authentication system failure
              await logSecurityEvent(
                null,
                'VULNERABILITY_DETECTED',
                {
                  threatLevel: 'high',
                  violationType: 'auth_system_failure',
                  additionalContext: { error: error instanceof Error ? error.message : String(error) }
                }
              );
              
              setUser(null);
              setSessionMode(null);
            }
          } else {
            // Session expired or user logged out
            if (sessionMode !== 'demo' && user) {
              await logAuditEvent(
                user,
                'SESSION_EXPIRED',
                {
                  sessionId: user.id,
                  dataSensitivity: 'internal'
                },
                { mode: sessionMode },
                { source: 'system' }
              );
            }
            
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
        // Enhanced failed login audit
        await logSecurityEvent(
          null,
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          {
            threatLevel: 'medium',
            violationType: 'failed_google_login',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            additionalContext: { error: result.error }
          }
        );
        
        await logAuditEvent(
          null, 
          'USER_LOGIN_FAILED',
          {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            success: false,
            errorMessage: result.error,
            dataSensitivity: 'internal'
          },
          { 
            method: 'google', 
            error: result.error,
            timestamp: new Date().toISOString()
          },
          {
            source: 'web',
            severity: 'warning'
          }
        );
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Log potential security threats for repeated failures
      await logSecurityEvent(
        null,
        'SUSPICIOUS_ACTIVITY_DETECTED',
        {
          threatLevel: 'medium',
          violationType: 'login_system_error',
          additionalContext: { error: errorMessage }
        }
      );
      
      await logAuditEvent(
        null, 
        'USER_LOGIN_FAILED',
        {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          success: false,
          errorMessage,
          dataSensitivity: 'internal'
        },
        { 
          method: 'google', 
          error: errorMessage,
          systemError: true 
        },
        {
          source: 'web',
          severity: 'error'
        }
      );
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
        await logAuditEvent(
          loggedInUser, 
          'USER_LOGIN',
          {
            sessionId: loggedInUser.id,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            success: true,
            dataSensitivity: 'internal'
          },
          { 
            mode: 'demo',
            authProvider: 'demo',
            email: email
          },
          {
            source: 'web',
            dataSensitivity: 'internal'
          }
        );
        return true;
      } else {
        await logAuditEvent(
          null, 
          'USER_LOGIN_FAILED',
          {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            success: false,
            errorMessage: reason,
            dataSensitivity: 'internal'
          },
          { 
            attemptedEmail: email, 
            reason,
            mode: 'demo'
          },
          {
            source: 'web',
            severity: 'warning'
          }
        );
        return false;
      }
    } catch (error) {
      await logAuditEvent(
        null, 
        'USER_LOGIN_FAILED',
        {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          success: false,
          errorMessage: (error as Error).message,
          dataSensitivity: 'internal'
        },
        { 
          attemptedEmail: email, 
          error: (error as Error).message,
          mode: 'demo'
        },
        {
          source: 'web',
          severity: 'error'
        }
      );
      console.error('Demo login failed', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await logAuditEvent(
        user, 
        'USER_LOGOUT',
        {
          sessionId: user.id,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          success: true,
          dataSensitivity: 'internal'
        },
        { 
          mode: sessionMode,
          duration: user.lastLoginAt ? Date.now() - new Date(user.lastLoginAt).getTime() : undefined
        },
        {
          source: 'web',
          dataSensitivity: 'internal'
        }
      );
    }
    
    try {
      
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
