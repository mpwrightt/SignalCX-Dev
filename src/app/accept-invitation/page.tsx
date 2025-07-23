'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { signInWithGoogle } from '@/lib/auth-service';
import { useAuth } from '@/hooks/use-auth';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [invitationStatus, setInvitationStatus] = React.useState<'pending' | 'accepting' | 'success' | 'error'>('pending');

  const token = searchParams.get('token');

  React.useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. The invitation token is missing.');
      setInvitationStatus('error');
    }
  }, [token]);

  React.useEffect(() => {
    // If user is already logged in and we have a token, automatically accept the invitation
    if (user && token && invitationStatus === 'pending') {
      acceptInvitation();
    }
  }, [user, token, invitationStatus]);

  const acceptInvitation = async () => {
    if (!token) return;

    setIsLoading(true);
    setInvitationStatus('accepting');
    setError(null);

    try {
      // If not logged in, sign in first
      if (!user) {
        const { user: signedInUser, error: signInError } = await signInWithGoogle();
        if (signInError || !signedInUser) {
          throw new Error(signInError || 'Failed to sign in');
        }
      }

      // The invitation acceptance is handled automatically in auth-service.ts
      // when a user signs in with a pending invitation
      setInvitationStatus('success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setInvitationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    await acceptInvitation();
  };

  if (invitationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Welcome to the Team!</CardTitle>
              <CardDescription>
                Your invitation has been accepted successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You now have access to SignalCX. Redirecting you to the dashboard...
              </p>
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (invitationStatus === 'error' || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Invitation Error</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {error || 'There was an error processing your invitation.'}
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                >
                  Go to SignalCX
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            You're Invited!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with Google to accept your team invitation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Join Your Team</CardTitle>
            <CardDescription>
              You've been invited to join a team on SignalCX. Click below to sign in and accept your invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignIn}
              disabled={isLoading || invitationStatus === 'accepting'}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {invitationStatus === 'accepting' ? 'Accepting Invitation...' : 'Signing In...'}
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
                  Sign in with Google
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}