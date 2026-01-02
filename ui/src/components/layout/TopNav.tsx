import { Link } from 'react-router-dom';
import { Menu, X, Building2, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopNavProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function TopNav({ onMenuToggle, isSidebarOpen }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16">
      <div className="glass h-full px-4 flex items-center justify-between shadow-sm">
        {/* Left side - Menu toggle and Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-surface-muted transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-semibold text-text-primary hidden sm:block">
              Asset Inventory
            </span>
          </Link>
        </div>

        {/* Right side - User menu and theme toggle */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-secondary"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 bg-surface-muted rounded-full flex items-center justify-center">
              <User size={16} className="text-text-secondary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-primary">Admin User</p>
              <p className="text-xs text-text-secondary">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
