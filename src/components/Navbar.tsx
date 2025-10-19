import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';
import { Home, Building2, LayoutDashboard, LogIn, LogOut, Moon, Sun, Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('logoutSuccess') || 'Logged out successfully');
      onNavigate('home');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <Building2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-900 dark:text-white">RealEstateConnect</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-2 transition-colors ${
                currentPage === 'home'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Home className="w-4 h-4" />
              {t('home')}
            </button>

            <button
              onClick={() => onNavigate('properties')}
              data-page-link="properties"
              className={`flex items-center gap-2 transition-colors ${
                currentPage === 'properties'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Building2 className="w-4 h-4" />
              {t('properties')}
            </button>

            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 transition-colors ${
                  currentPage === 'dashboard'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Auth Buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-slate-900 dark:text-white">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => onNavigate('dashboard')}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onNavigate('login')}>
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('login')}
                </Button>
                <Button onClick={() => onNavigate('signup')} className="bg-emerald-600 hover:bg-emerald-700">
                  {t('signup')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentPage === 'home'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">{t('home')}</span>
          </button>

          <button
            onClick={() => onNavigate('properties')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentPage === 'properties'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs">{t('properties')}</span>
          </button>

          {user && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  currentPage === 'dashboard'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-xs">{t('dashboard')}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 transition-colors text-slate-600 dark:text-slate-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-xs">{t('logout')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
