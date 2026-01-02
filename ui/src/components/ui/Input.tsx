import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2
            bg-surface border rounded-lg
            text-text-primary placeholder:text-text-secondary/50
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:bg-surface-muted disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error/50 focus:border-error' : 'border-border'}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-secondary">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
