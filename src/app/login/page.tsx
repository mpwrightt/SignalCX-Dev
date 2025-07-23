
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, TicketIcon } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().min(1, { message: 'Username or email is required.' }),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { loginDemo, loginWithGoogle } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginMode, setLoginMode] = React.useState<'demo' | 'enterprise'>('demo');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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

  const onLiveSubmit = (data: LoginFormValues) => {
    handleLogin(data.email, data.password);
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
              <Label htmlFor="login-mode" className={loginMode === 'enterprise' ? 'text-foreground' : 'text-muted-foreground'}>Enterprise</Label>
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
                      <Button className="w-full" onClick={() => handleLogin('manager@example.com')} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login as Manager
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => handleLogin('agent@example.com')} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login as Agent
                      </Button>
                  </div>
              </CardFooter>
            </>
        ) : (
            <>
                <CardContent>
                   <CardTitle className="text-center mb-1">Welcome Back</CardTitle>
                   <CardDescription className="text-center mb-4">
                     Enter your credentials to access your dashboard.
                   </CardDescription>
                  <form onSubmit={form.handleSubmit(onLiveSubmit)} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Username or Email</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="Admin"
                        {...form.register('email')}
                        disabled={isLoading}
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...form.register('password')}
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="relative w-full">
                        <Separator />
                        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">OR</span>
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                        Sign in with SSO
                    </Button>
                </CardFooter>
            </>
        )}
      </Card>
    </main>
  );
}
