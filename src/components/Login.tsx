import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { Building2, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      onNavigate('home');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-slate-900 dark:text-white">
            {t('login')}
          </CardTitle>
          <CardDescription>
            Welcome back to RealEstateConnect
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('dontHaveAccount')}{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {t('signup')}
              </button>
            </p>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onNavigate('admin-login')}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <span>🔒</span>
                Administrator Access
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
