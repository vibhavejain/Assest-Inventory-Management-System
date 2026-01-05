import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Package, Clock, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Badge, getStatusVariant, getRoleVariant, ExpandableCard, ActivityItem, Select, Button } from './ui';
import { getCompanyUsers, getAssets, getAuditLogs, getUsers, updateAsset } from '../api';
import type { Company, CompanyAccess, Asset, AuditLog, User } from '../types';

interface CompanyCardProps {
  company: Company;
  onDelete: (company: Company) => void;
}

export function CompanyCard({ company, onDelete }: CompanyCardProps) {
  const navigate = useNavigate();
  const [companyUsers, setCompanyUsers] = useState<CompanyAccess[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  async function loadDetails() {
    setLoading(true);
    
    const [usersRes, assetsRes, logsRes, allUsersRes] = await Promise.all([
      getCompanyUsers(company.id, { limit: 10 }),
      getAssets({ company_id: company.id, limit: 10 }),
      getAuditLogs({ company_id: company.id, limit: 10 }),
      getUsers({ limit: 100 }),
    ]);

    if (usersRes.success && usersRes.data) {
      setCompanyUsers(usersRes.data);
    }
    if (assetsRes.success && assetsRes.data) {
      setAssets(assetsRes.data);
    }
    if (logsRes.success && logsRes.data) {
      setAuditLogs(logsRes.data);
    }
    if (allUsersRes.success && allUsersRes.data) {
      setAllUsers(allUsersRes.data);
    }

    setLoading(false);
  }

  function getUserName(userId: string): string {
    const user = allUsers.find(u => u.id === userId);
    return user?.name || userId.slice(0, 8) + '...';
  }

  async function handleAssignAssetToUser() {
    if (!selectedUserId) return;
    // Find an unassigned asset to assign
    const unassignedAsset = assets.find(a => !a.assigned_to);
    if (!unassignedAsset) return;
    
    setAssigning(true);
    const res = await updateAsset(unassignedAsset.id, { assigned_to: selectedUserId });
    if (res.success && res.data) {
      setAssets(assets.map(a => a.id === unassignedAsset.id ? res.data! : a));
      setSelectedUserId('');
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
        <div className="w-10 h-10 bg-surface-muted rounded-lg flex items-center justify-center">
          <Building2 size={20} className="text-text-secondary" />
        </div>
        <div>
          <p className="font-medium text-text-primary">{company.name}</p>
          <p className="text-sm text-text-secondary">
            Created {new Date(company.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/companies/${company.id}`);
          }}
          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          title="View details"
        >
          <ExternalLink size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(company);
          }}
          className="p-2 text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete company"
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
          {/* Users */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Users size={16} />
              Users ({companyUsers.length})
            </h4>
            {companyUsers.length === 0 ? (
              <p className="text-sm text-text-secondary italic">No users assigned</p>
            ) : (
              <div className="space-y-2">
                {companyUsers.slice(0, 3).map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50"
                  >
                    <span className="text-sm text-text-primary truncate">
                      {getUserName(access.user_id)}
                    </span>
                    <Badge variant={getRoleVariant(access.role)}>
                      {access.role}
                    </Badge>
                  </div>
                ))}
                {companyUsers.length > 3 && (
                  <p className="text-xs text-text-secondary">+{companyUsers.length - 3} more</p>
                )}
              </div>
            )}
          </div>

          {/* Assets */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Package size={16} />
              Assets ({assets.length})
            </h4>
            {assets.length === 0 ? (
              <p className="text-sm text-text-secondary italic mb-3">No assets</p>
            ) : (
              <div className="space-y-2 mb-3">
                {assets.slice(0, 3).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border/50"
                  >
                    <div className="truncate">
                      <span className="text-sm text-text-primary">{asset.name}</span>
                      {asset.assigned_to && (
                        <span className="text-xs text-text-secondary ml-2">
                          → {getUserName(asset.assigned_to)}
                        </span>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(asset.status)}>
                      {asset.type}
                    </Badge>
                  </div>
                ))}
                {assets.length > 3 && (
                  <p className="text-xs text-text-secondary">+{assets.length - 3} more</p>
                )}
              </div>
            )}
            {assets.some(a => !a.assigned_to) && allUsers.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-xs text-text-secondary">Assign unassigned asset to:</p>
                <Select
                  placeholder="Select user"
                  options={allUsers.map((u) => ({ value: u.id, label: u.name }))}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
                {selectedUserId && (
                  <Button
                    size="sm"
                    onClick={handleAssignAssetToUser}
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
              <div className="max-h-48 overflow-y-auto">
                {auditLogs.slice(0, 5).map((log) => (
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
