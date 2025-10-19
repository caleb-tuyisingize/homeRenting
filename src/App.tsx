import React, { useState } from 'react';
import { LanguageProvider } from './utils/LanguageContext';
import { ThemeProvider } from './utils/ThemeContext';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { PropertiesPage } from './components/PropertiesPage';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { AdminLogin } from './components/AdminLogin';
import { Footer } from './components/Footer';
import { DebugWidget } from './components/DebugWidget';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading } = useAuth();

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setSearchQuery('');
  };

  // Redirect admin users to admin dashboard
  React.useEffect(() => {
    if (user?.role === 'admin' && currentPage === 'dashboard') {
      // Admin should see admin dashboard
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const showFooter = currentPage !== 'login' && currentPage !== 'signup' && currentPage !== 'admin-login';
  const showNavbar = currentPage !== 'admin-login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {showNavbar && <Navbar onNavigate={handleNavigation} currentPage={currentPage} />}
      
      <main className="flex-1">
        {currentPage === 'home' && <HomePage searchQuery={searchQuery} onNavigate={handleNavigation} />}
        {currentPage === 'properties' && <PropertiesPage />}
        {currentPage === 'dashboard' && (
          user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />
        )}
        {currentPage === 'login' && <Login onNavigate={handleNavigation} />}
        {currentPage === 'signup' && <Signup onNavigate={handleNavigation} />}
        {currentPage === 'admin-login' && <AdminLogin onNavigate={handleNavigation} />}
      </main>

      {showFooter && <Footer />}
      
      <Toaster />
      <DebugWidget />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
