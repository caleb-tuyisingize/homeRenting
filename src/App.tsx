import React, { useState } from 'react';
import { LanguageProvider } from './utils/LanguageContext';
import { ThemeProvider } from './utils/ThemeContext';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { PropertiesPage } from './components/PropertiesPage';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ContactPage } from './components/ContactPage';
import { AboutPage } from './components/AboutPage';
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

  // Update page title based on current page
  React.useEffect(() => {
    const getPageTitle = () => {
      const baseTitle = 'RealEstateConnect';
      
      switch (currentPage) {
        case 'home':
          return `${baseTitle} - Find Your Perfect Home`;
        case 'properties':
          return `${baseTitle} - Browse Properties`;
        case 'dashboard':
          if (user?.role === 'admin') {
            return `${baseTitle} - Admin Dashboard`;
          }
          return `${baseTitle} - My Dashboard`;
        case 'login':
          return `${baseTitle} - Sign In`;
        case 'signup':
          return `${baseTitle} - Create Account`;
        case 'admin-login':
          return `${baseTitle} - Admin Sign In`;
        case 'contact':
          return `${baseTitle} - Contact Us`;
        case 'about':
          return `${baseTitle} - About Us`;
        default:
          return baseTitle;
      }
    };

    document.title = getPageTitle();
  }, [currentPage, user?.role]);

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
  
  const handleNavigationWithPage = (page: string) => {
    handleNavigation(page);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {showNavbar && <Navbar onNavigate={handleNavigation} currentPage={currentPage} />}
      
      <main className="flex-1">
        {currentPage === 'home' && <HomePage searchQuery={searchQuery} onNavigate={handleNavigation} />}
        {currentPage === 'properties' && <PropertiesPage />}
        {currentPage === 'contact' && <ContactPage />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'dashboard' && (
          user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />
        )}
        {currentPage === 'login' && <Login onNavigate={handleNavigation} />}
        {currentPage === 'signup' && <Signup onNavigate={handleNavigation} />}
        {currentPage === 'admin-login' && <AdminLogin onNavigate={handleNavigation} />}
      </main>

      {showFooter && <Footer onNavigate={handleNavigationWithPage} />}
      
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
