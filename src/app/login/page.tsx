
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TicketIcon } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

export default function LoginPage() {
  const router = useRouter();
  const { loginDemo, loginWithGoogle } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginMode, setLoginMode] = React.useState<'demo' | 'enterprise'>('demo');

  const handleLogin = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    
    if (loginMode === 'demo') {
      const success = await loginDemo(email);
      if (success) {
        router.push('/');
      } else {
        setError('Demo login failed. Please try again.');
        setIsLoading(false);
      }
    } else {
      // For enterprise mode, we'll use Google Sign-In
      const result = await loginWithGoogle();
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
        setIsLoading(false);
      }
    }
  };


  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <TicketIcon className="w-10 h-10 text-primary" />
                <h1 className="text-3xl font-headline font-semibold">SignalCX</h1>
            </div>
           <div className="flex items-center justify-center space-x-2 pt-2">
              <Label htmlFor="login-mode" className={loginMode === 'demo' ? 'text-foreground' : 'text-muted-foreground'}>Demo</Label>
              <Switch
                id="login-mode"
                checked={loginMode === 'enterprise'}
                onCheckedChange={(checked) => setLoginMode(checked ? 'enterprise' : 'demo')}
                disabled={isLoading}
              />
              <Label htmlFor="login-mode" className={loginMode === 'enterprise' ? 'text-foreground' : 'text-muted-foreground'}>Live</Label>
            </div>
        </CardHeader>
        {loginMode === 'demo' ? (
            <>
              <CardContent className="text-center">
                <CardTitle>Demo Access</CardTitle>
                <CardDescription className="mt-2">
                    Log in with a single click to explore the application's features as a manager or an agent.
                </CardDescription>
                {error && (
                  <Alert variant="destructive" className="mt-4 text-left">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button className="w-full" onClick={() => handleLogin('manager@demo.com')} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login as Manager
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => handleLogin('agent@demo.com')} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login as Agent
                      </Button>
                  </div>
              </CardFooter>
            </>
        ) : (
            <>
                <CardContent className="text-center">
                   <CardTitle>Live Environment</CardTitle>
                   <CardDescription className="mt-2">
                     Sign in with your Google account to access the live application.
                   </CardDescription>
                   {error && (
                     <Alert variant="destructive" className="mt-4 text-left">
                       <AlertDescription>{error}</AlertDescription>
                     </Alert>
                   )}
                </CardContent>
                <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleLogin('', '')}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign in with Google
                    </Button>
                </CardFooter>
            </>
        )}
      </Card>
    </main>
  );
}
