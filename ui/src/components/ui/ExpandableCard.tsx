import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExpandableCardProps {
  header: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableCard({
  header,
  children,
  defaultExpanded = false,
  className = '',
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-muted/50 transition-colors text-left"
      >
        <div className="flex-1">{header}</div>
        <div className="ml-4 text-text-secondary">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-border p-4 bg-surface-muted/30">
          {children}
        </div>
      )}
    </div>
  );
}

interface ActivityItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export function ActivityItem({ icon, title, description, timestamp, details }: ActivityItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-text-primary text-sm">{title}</p>
            <p className="text-xs text-text-secondary">{description}</p>
          </div>
          <span className="text-xs text-text-secondary whitespace-nowrap">
            {new Date(timestamp).toLocaleDateString()}
          </span>
        </div>
        {details && Object.keys(details).length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-primary hover:underline mt-1"
          >
            {showDetails ? 'Hide details' : 'View details'}
          </button>
        )}
        {showDetails && details && (
          <pre className="mt-2 p-2 bg-surface rounded text-xs text-text-secondary overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
