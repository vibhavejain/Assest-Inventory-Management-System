import { useState } from 'react';
import { Building2, Clock, Trash2, FileText, Package } from 'lucide-react';
import { Badge, getStatusVariant, getRoleVariant, ExpandableCard, ActivityItem, Select, Button } from './ui';
import { getUserCompanies, getUserAuditLogs, getCompanies, getAssets, updateAsset } from '../api';
import type { User, CompanyAccess, AuditLog, Company, Asset } from '../types';

interface UserCardProps {
  user: User;
  onDelete: (user: User) => void;
}

export function UserCard({ user, onDelete }: UserCardProps) {
  const [companyAccess, setCompanyAccess] = useState<CompanyAccess[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  async function loadDetails() {
    if (loaded) return;
    setLoading(true);
    
    const [accessRes, logsRes, companiesRes, assetsRes] = await Promise.all([
      getUserCompanies(user.id),
      getUserAuditLogs(user.id, { limit: 10 }),
      getCompanies({ limit: 100 }),
      getAssets({ limit: 100 }),
    ]);

    if (accessRes.success && accessRes.data) {
      setCompanyAccess(accessRes.data);
    }
    if (logsRes.success && logsRes.data) {
      setAuditLogs(logsRes.data);
    }
    if (companiesRes.success && companiesRes.data) {
      setCompanies(companiesRes.data);
    }
    if (assetsRes.success && assetsRes.data) {
      setAssignedAssets(assetsRes.data.filter((a) => a.assigned_to === user.id));
      setAvailableAssets(assetsRes.data.filter((a) => !a.assigned_to));
    }

    setLoading(false);
    setLoaded(true);
  }

  async function handleAssignAsset() {
    if (!selectedAssetId) return;
    setAssigning(true);
    const res = await updateAsset(selectedAssetId, { assigned_to: user.id });
    if (res.success && res.data) {
      setAssignedAssets([...assignedAssets, res.data]);
      setAvailableAssets(availableAssets.filter((a) => a.id !== selectedAssetId));
      setSelectedAssetId('');
    }
    setAssigning(false);
  }

  async function handleUnassignAsset(assetId: string) {
    setAssigning(true);
    const res = await updateAsset(assetId, { assigned_to: null });
    if (res.success && res.data) {
      const asset = assignedAssets.find((a) => a.id === assetId);
      if (asset) {
        setAssignedAssets(assignedAssets.filter((a) => a.id !== assetId));
        setAvailableAssets([...availableAssets, { ...asset, assigned_to: null }]);
      }
    }
    setAssigning(false);
  }

  function getCompanyName(companyId: string): string {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown Company';
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
        return `${log.entity_type} was created`;
      case 'update':
        return `${log.entity_type} was updated`;
      case 'delete':
        return `${log.entity_type} was deleted`;
      default:
        return `${log.action} on ${log.entity_type}`;
    }
  }

  const header = (
    <div className="flex items-center justify-between w-full" onClick={() => { loadDetails(); }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-medium text-primary">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-text-primary">{user.name}</p>
          <p className="text-sm text-text-secondary">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
        <span className="text-sm text-text-secondary">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(user);
          }}
          className="p-2 text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete user"
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
          {/* Company Assignments */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Company Assignments
            </h4>
            {companyAccess.length === 0 ? (
              <p className="text-sm text-text-secondary italic">No company assignments</p>
            ) : (
              <div className="space-y-2">
                {companyAccess.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-text-secondary" />
                      <span className="text-sm text-text-primary">
                        {getCompanyName(access.company_id)}
                      </span>
                    </div>
                    <Badge variant={getRoleVariant(access.role)}>
                      {access.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Assets */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Package size={16} />
              Assigned Assets ({assignedAssets.length})
            </h4>
            {assignedAssets.length === 0 ? (
              <p className="text-sm text-text-secondary italic mb-3">No assets assigned</p>
            ) : (
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                {assignedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50"
                  >
                    <span className="text-sm text-text-primary truncate">{asset.name}</span>
                    <button
                      onClick={() => handleUnassignAsset(asset.id)}
                      disabled={assigning}
                      className="text-xs text-text-secondary hover:text-error"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {availableAssets.length > 0 && (
              <div className="space-y-2">
                <Select
                  placeholder="Select asset to assign"
                  options={availableAssets.map((a) => ({ value: a.id, label: a.name }))}
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                />
                {selectedAssetId && (
                  <Button
                    size="sm"
                    onClick={handleAssignAsset}
                    loading={assigning}
                    className="w-full"
                  >
                    Assign Asset
                  </Button>
                )}
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
              <div className="max-h-64 overflow-y-auto">
                {auditLogs.map((log) => (
                  <ActivityItem
                    key={log.id}
                    icon={getActionIcon(log.action)}
                    title={`${log.action.charAt(0).toUpperCase() + log.action.slice(1)} ${log.entity_type}`}
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
