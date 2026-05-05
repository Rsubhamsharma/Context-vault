import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-surface-border bg-white dark:bg-stone-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-row items-center gap-3">
          <span className="text-lg font-bold text-primary tracking-tight">Context Vault</span>
          <p className="text-xs text-text-secondary italic pt-0.5">
            © {currentYear} Context Vault™. All rights reserved.
          </p>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm text-text-secondary hover:text-accent transition-colors font-medium">Home</Link>
          <Link to="/dashboard" className="text-sm text-text-secondary hover:text-accent transition-colors font-medium">Dashboard</Link>
          <a href="#" className="text-sm text-text-secondary hover:text-accent transition-colors font-medium">Terms</a>
          <a href="#" className="text-sm text-text-secondary hover:text-accent transition-colors font-medium">Privacy</a>
        </nav>
      </div>
    </footer>
  );
};
