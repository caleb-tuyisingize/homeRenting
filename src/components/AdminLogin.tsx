import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

interface AdminLoginProps {
  onNavigate: (page: string) => void;
}

export function AdminLogin({ onNavigate }: AdminLoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      
      // Verify admin role
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.');
        return;
      }

      toast.success('Admin login successful!');
      onNavigate('dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <Card className="w-full max-w-md relative z-10 border-purple-500/20 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl">
            System Administrator
          </CardTitle>
          <CardDescription className="text-purple-200">
            Secure admin access portal
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert className="mb-6 border-purple-500/30 bg-purple-950/30">
            <AlertCircle className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-purple-200 text-sm">
              This is a restricted area. Only authorized administrators may access this portal.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-email" className="text-purple-100">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@realestateconnect.rw"
                  className="pl-10 bg-slate-800/50 border-purple-500/30 text-white placeholder:text-purple-300/50"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-purple-100">Admin Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-slate-800/50 border-purple-500/30 text-white"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/30"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm text-purple-300 hover:text-purple-100 transition-colors"
            >
              ← Back to regular login
            </button>
          </div>

          <div className="mt-6 p-3 bg-slate-800/30 rounded-lg border border-purple-500/20">
            <p className="text-xs text-purple-300 text-center">
              🔒 All admin activities are logged and monitored for security purposes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
