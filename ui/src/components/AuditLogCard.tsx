import { useState } from 'react';
import { FileText, Clock, Trash2, Edit, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from './ui';
import type { AuditLog } from '../types';

interface AuditLogCardProps {
  log: AuditLog;
}

export function AuditLogCard({ log }: AuditLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  function getActionIcon(action: string) {
    switch (action) {
      case 'create':
        return <Plus size={14} />;
      case 'update':
        return <Edit size={14} />;
      case 'delete':
        return <Trash2 size={14} />;
      default:
        return <FileText size={14} />;
    }
  }

  function getActionVariant(action: string): 'success' | 'warning' | 'error' | 'default' {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  }

  function getActionDescription(): string {
    const entityName = log.entity_type.replace('_', ' ');
    switch (log.action) {
      case 'create':
        return `New ${entityName} was created`;
      case 'update':
        return `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} was updated`;
      case 'delete':
        return `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} was deleted`;
      default:
        return `${log.action} on ${entityName}`;
    }
  }

  const hasChanges = log.changes && Object.keys(log.changes).length > 0;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            log.action === 'create' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            log.action === 'update' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
            log.action === 'delete' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            'bg-surface-muted text-text-secondary'
          }`}>
            {getActionIcon(log.action)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getActionVariant(log.action)}>
                {log.action}
              </Badge>
              <span className="text-sm font-medium text-text-primary capitalize">
                {log.entity_type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{getActionDescription()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <div className="text-right">
            <p className="text-sm text-text-primary">
              {new Date(log.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-text-secondary">
              {new Date(log.created_at).toLocaleTimeString()}
            </p>
          </div>
          {hasChanges && (
            <div className="text-text-secondary">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          )}
        </div>
      </button>
      
      {isExpanded && hasChanges && (
        <div className="border-t border-border p-4 bg-surface-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entity Info */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Entity Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50">
                  <span className="text-sm text-text-secondary">Entity ID</span>
                  <code className="text-xs bg-surface-muted px-2 py-1 rounded font-mono">
                    {log.entity_id}
                  </code>
                </div>
                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50">
                  <span className="text-sm text-text-secondary">User ID</span>
                  <code className="text-xs bg-surface-muted px-2 py-1 rounded font-mono">
                    {log.user_id || 'System'}
                  </code>
                </div>
              </div>
            </div>

            {/* Changes */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <Clock size={14} />
                Changes
              </h4>
              <pre className="p-3 bg-surface rounded-lg border border-border/50 text-xs text-text-secondary overflow-x-auto max-h-48">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
