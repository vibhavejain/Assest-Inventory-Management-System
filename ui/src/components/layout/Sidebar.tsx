import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/assets', icon: Package, label: 'Assets' },
  { to: '/audit-logs', icon: FileText, label: 'Audit Logs' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 z-30
          w-64 bg-surface border-r border-border
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-sm font-medium transition-colors
              ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
              }
            `}
          >
            <Settings size={20} />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  );
}
