import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-muted text-text-secondary',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Helper function to get badge variant from status
export function getStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
    case 'suspended':
    case 'disposed':
      return 'error';
    case 'maintenance':
      return 'warning';
    default:
      return 'default';
  }
}

// Helper function to get badge variant from role
export function getRoleVariant(role: string): BadgeProps['variant'] {
  switch (role) {
    case 'OWNER':
      return 'error';
    case 'ADMIN':
      return 'warning';
    case 'MEMBER':
      return 'info';
    case 'READ_ONLY':
      return 'default';
    default:
      return 'default';
  }
}
