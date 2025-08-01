'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signInWithGoogle } from '@/lib/auth-service-enhanced';

interface GoogleSignInProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleSignIn({ 
  onSuccess, 
  onError, 
  disabled = false,
  className = ""
}: GoogleSignInProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (result.user) {
        onSuccess?.(result.user);
      } else {
        onError?.(result.error || 'Sign in failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      className={`w-full ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
}

// Enterprise Google Sign-In with additional security
export function EnterpriseGoogleSignIn({ 
  onSuccess, 
  onError, 
  disabled = false,
  className = "",
  allowedDomains = []
}: GoogleSignInProps & { allowedDomains?: string[] }) {
  const handleSuccess = (user: any) => {
    // Check if user's email domain is allowed (if domains are specified)
    if (allowedDomains.length > 0) {
      const emailDomain = user.email.split('@')[1];
      if (!allowedDomains.includes(emailDomain)) {
        onError?.(`Access restricted. Your domain ${emailDomain} is not authorized for this organization.`);
        return;
      }
    }
    
    // Check if user account is active
    if (!user.isActive) {
      onError?.('Your account is pending approval. Please contact your administrator.');
      return;
    }
    
    onSuccess?.(user);
  };

  return (
    <GoogleSignIn
      onSuccess={handleSuccess}
      onError={onError}
      disabled={disabled}
      className={className}
    />
  );
}