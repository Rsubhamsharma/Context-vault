import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Vault, LogOut, HelpCircle } from 'lucide-react';
import { auth } from '../../lib/auth';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingModal } from '../onboarding/OnboardingModal';

export const Navbar = () => {
  const navigate = useNavigate();
  const user = auth.getUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const handleOnboardingComplete = () => {
    // This is for manual reopen; we don't want to trigger persistence 
    // if the user just wanted to review the guide.
    // But to keep it consistent with DashboardPage, we'll just close it.
    setIsOnboardingOpen(false);
  };

  const navLinks = [
    { name: 'Problem', href: '/', section: 'problem' },
    { name: 'How it Works', href: '/', section: 'how-it-works' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <>
      <nav className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        <Link to="/" className="flex items-center gap-2 font-bold text-text-primary text-xl">
          <Vault className="w-6 h-6 text-accent" />
          <span>Context Vault</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href} 
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => {
                if (link.section) {
                  const el = document.getElementById(link.section);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-4 border-l border-surface-border pl-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOnboardingOpen(true)} 
              className="gap-2 text-text-secondary hover:text-text-primary"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </Button>
            <ThemeToggle />
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-text-primary" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-16 left-0 w-full bg-surface border-b border-surface-border flex flex-col p-4 gap-4 md:hidden z-40 shadow-lg"
            >
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="text-base font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-surface-border dark:border-stone-800" />
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-medium text-text-secondary">Theme</span>
                <ThemeToggle />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOnboardingOpen(true)} 
                className="w-full justify-start gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Help & Guide
              </Button>
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Login</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)} 
        onComplete={handleOnboardingComplete} 
      />
    </>
  );
};


