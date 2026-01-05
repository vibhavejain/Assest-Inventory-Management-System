import { useState } from 'react';
import { Package, Building2, Clock, Trash2, FileText, Tag, User, UserX } from 'lucide-react';
import { Badge, getStatusVariant, ExpandableCard, ActivityItem, Select, Button } from './ui';
import { getAuditLogs, getCompanies, updateAsset, getUsers } from '../api';
import type { Asset, AuditLog, Company, User as UserType } from '../types';

interface AssetCardProps {
  asset: Asset;
  onDelete: (asset: Asset) => void;
  onUpdate?: (asset: Asset) => void;
}

export function AssetCard({ asset, onDelete, onUpdate }: AssetCardProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [assignedUser, setAssignedUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  async function loadDetails() {
    if (loaded) return;
    setLoading(true);
    
    const [logsRes, companiesRes, usersRes] = await Promise.all([
      getAuditLogs({ company_id: asset.company_id, limit: 10 }),
      getCompanies({ limit: 100 }),
      getUsers({ limit: 100 }),
    ]);

    if (logsRes.success && logsRes.data) {
      const assetLogs = logsRes.data.filter(
        (log) => log.entity_type === 'asset' && log.entity_id === asset.id
      );
      setAuditLogs(assetLogs);
    }
    if (companiesRes.success && companiesRes.data) {
      const found = companiesRes.data.find((c) => c.id === asset.company_id);
      setCompany(found || null);
    }
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
      if (asset.assigned_to) {
        const assigned = usersRes.data.find((u) => u.id === asset.assigned_to);
        setAssignedUser(assigned || null);
      }
    }

    setLoading(false);
    setLoaded(true);
  }

  async function handleAssignUser() {
    if (!selectedUserId) return;
    setAssigning(true);
    const res = await updateAsset(asset.id, { assigned_to: selectedUserId });
    if (res.success && res.data) {
      const assigned = users.find((u) => u.id === selectedUserId);
      setAssignedUser(assigned || null);
      setSelectedUserId('');
      if (onUpdate) onUpdate(res.data);
    }
    setAssigning(false);
  }

  async function handleUnassignUser() {
    setAssigning(true);
    const res = await updateAsset(asset.id, { assigned_to: null });
    if (res.success && res.data) {
      setAssignedUser(null);
      if (onUpdate) onUpdate(res.data);
    }
    setAssigning(false);
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'create':
        return <FileText size={14} />;
      case 'update':
        return <Clock size={14} />;
      case 'delete':
        return <Trash2 size={14} />;
      default:
        return <FileText size={14} />;
    }
  }

  function getActionDescription(log: AuditLog): string {
    switch (log.action) {
      case 'create':
        return 'Asset was created';
      case 'update':
        return 'Asset was updated';
      case 'delete':
        return 'Asset was deleted';
      default:
        return `${log.action} on asset`;
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'hardware':
        return '💻';
      case 'software':
        return '📀';
      case 'license':
        return '📜';
      default:
        return '📦';
    }
  }

  const header = (
    <div className="flex items-center justify-between w-full" onClick={() => { loadDetails(); }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-muted rounded-lg flex items-center justify-center text-xl">
          {getTypeIcon(asset.type)}
        </div>
        <div>
          <p className="font-medium text-text-primary">{asset.name}</p>
          <p className="text-sm text-text-secondary">
            {asset.identifier || 'No identifier'} • {asset.type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
        <span className="text-sm text-text-secondary">
          {new Date(asset.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset);
          }}
          className="p-2 text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete asset"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <ExpandableCard header={header}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Details */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Package size={16} />
              Details
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50">
                <span className="text-sm text-text-secondary">Type</span>
                <Badge variant="default">{asset.type}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50">
                <span className="text-sm text-text-secondary">Status</span>
                <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
              </div>
              {asset.identifier && (
                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50">
                  <span className="text-sm text-text-secondary">Identifier</span>
                  <span className="text-sm text-text-primary font-mono">{asset.identifier}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment & Company Info */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <User size={16} />
              Assigned To
            </h4>
            {assignedUser ? (
              <div className="p-3 bg-surface rounded-lg border border-border/50 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {assignedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{assignedUser.name}</p>
                      <p className="text-xs text-text-secondary">{assignedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnassignUser}
                    disabled={assigning}
                    className="p-1.5 text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Unassign user"
                  >
                    <UserX size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <Select
                  placeholder="Select user to assign"
                  options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
                {selectedUserId && (
                  <Button
                    size="sm"
                    onClick={handleAssignUser}
                    loading={assigning}
                    className="w-full"
                  >
                    Assign User
                  </Button>
                )}
              </div>
            )}

            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Company
            </h4>
            <div className="p-3 bg-surface rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-text-secondary" />
                <span className="text-sm text-text-primary">
                  {company?.name || 'Loading...'}
                </span>
              </div>
            </div>

            {/* Metadata */}
            {asset.metadata && Object.keys(asset.metadata).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Tag size={16} />
                  Metadata
                </h4>
                <pre className="p-2 bg-surface rounded-lg border border-border/50 text-xs text-text-secondary overflow-x-auto">
                  {JSON.stringify(asset.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Clock size={16} />
              Recent Activity
            </h4>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-text-secondary italic">No activity recorded</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {auditLogs.map((log) => (
                  <ActivityItem
                    key={log.id}
                    icon={getActionIcon(log.action)}
                    title={`${log.action.charAt(0).toUpperCase() + log.action.slice(1)}`}
                    description={getActionDescription(log)}
                    timestamp={log.created_at}
                    details={log.changes}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ExpandableCard>
  );
}
