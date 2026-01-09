import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Package, FileText, Plus, Pencil } from 'lucide-react';
import {
  Card,
  CardHeader,
  Badge,
  getStatusVariant,
  getRoleVariant,
  Loading,
  LoadingPage,
  Table,
  EmptyState,
  Button,
  Modal,
  Input,
  Select,
} from '../components/ui';
import {
  getCompany,
  getCompanyUsers,
  getAssets,
  getAuditLogs,
  getUsers,
  addUserToCompany,
  createAsset,
  updateCompany,
} from '../api';
import type { Company, CompanyAccess, Asset, AuditLog, User, CreateAssetRequest, AssetType, AssetStatus } from '../types';

type TabType = 'overview' | 'users' | 'assets' | 'audit';

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Tab data
  const [users, setUsers] = useState<CompanyAccess[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Add User modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER' | 'READ_ONLY'>('MEMBER');
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Add Asset modal state
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [assetFormData, setAssetFormData] = useState<Partial<CreateAssetRequest>>({});
  const [addAssetSubmitting, setAddAssetSubmitting] = useState(false);
  const [addAssetError, setAddAssetError] = useState('');

  // Edit Company modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{ name: string; status: string }>({ name: '', status: 'active' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    async function fetchCompany() {
      if (!id) return;
      setLoading(true);
      const res = await getCompany(id);
      if (res.success && res.data) {
        setCompany(res.data);
      }
      setLoading(false);
    }
    fetchCompany();
  }, [id]);

  useEffect(() => {
    async function fetchTabData() {
      if (!id) return;
      setTabLoading(true);

      switch (activeTab) {
        case 'users': {
          const res = await getCompanyUsers(id);
          if (res.success && res.data) {
            setUsers(res.data);
          }
          break;
        }
        case 'assets': {
          const res = await getAssets({ company_id: id });
          if (res.success && res.data) {
            setAssets(res.data);
          }
          break;
        }
        case 'audit': {
          const res = await getAuditLogs({ company_id: id });
          if (res.success && res.data) {
            setAuditLogs(res.data);
          }
          break;
        }
      }

      setTabLoading(false);
    }

    if (activeTab !== 'overview') {
      fetchTabData();
    }
  }, [id, activeTab]);

  // Fetch available users when Add User modal opens
  async function openAddUserModal() {
    setIsAddUserModalOpen(true);
    const res = await getUsers({ limit: 100 });
    if (res.success && res.data) {
      setAvailableUsers(res.data);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || !id) {
      setAddUserError('Please select a user');
      return;
    }
    setAddUserSubmitting(true);
    setAddUserError('');
    
    const res = await addUserToCompany(id, { user_id: selectedUserId, role: selectedRole });
    if (res.success) {
      setIsAddUserModalOpen(false);
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      // Refresh users list
      const usersRes = await getCompanyUsers(id);
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
    } else {
      setAddUserError(res.error?.message || 'Failed to add user');
    }
    setAddUserSubmitting(false);
  }

  function openEditModal() {
    if (company) {
      setEditFormData({ name: company.name, status: company.status });
      setIsEditModalOpen(true);
    }
  }

  async function handleEditCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!editFormData.name.trim() || !id) {
      setEditError('Company name is required');
      return;
    }
    setEditSubmitting(true);
    setEditError('');

    const res = await updateCompany(id, {
      name: editFormData.name,
      status: editFormData.status as 'active' | 'inactive',
    });

    if (res.success && res.data) {
      setCompany(res.data);
      setIsEditModalOpen(false);
    } else {
      setEditError(res.error?.message || 'Failed to update company');
    }
    setEditSubmitting(false);
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetFormData.name?.trim() || !assetFormData.type || !id) {
      setAddAssetError('Name and type are required');
      return;
    }
    setAddAssetSubmitting(true);
    setAddAssetError('');

    const res = await createAsset({
      company_id: id,
      name: assetFormData.name,
      type: assetFormData.type as AssetType,
      status: (assetFormData.status as AssetStatus) || 'active',
      identifier: assetFormData.identifier,
    });

    if (res.success) {
      setIsAddAssetModalOpen(false);
      setAssetFormData({});
      // Refresh assets list
      const assetsRes = await getAssets({ company_id: id });
      if (assetsRes.success && assetsRes.data) {
        setAssets(assetsRes.data);
      }
    } else {
      setAddAssetError(res.error?.message || 'Failed to create asset');
    }
    setAddAssetSubmitting(false);
  }

  if (loading) {
    return <LoadingPage />;
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-text-primary">Company not found</h2>
        <Link to="/companies" className="text-primary hover:underline mt-2 inline-block">
          Back to companies
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'users', label: 'Users & Access', icon: Users },
    { id: 'assets', label: 'Assets', icon: Package },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft size={16} />
          Back to companies
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{company.name}</h1>
              <p className="text-text-secondary text-sm">
                Created {new Date(company.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={openEditModal} data-testid="edit-company-btn">
              <Pencil size={16} />
              Edit
            </Button>
            <Badge variant={getStatusVariant(company.status)} className="text-sm px-3 py-1">
              {company.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 pb-3 px-1 text-sm font-medium
                border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Company Details" />
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-text-secondary">Name</dt>
                  <dd className="text-text-primary font-medium">{company.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-text-secondary">Status</dt>
                  <dd>
                    <Badge variant={getStatusVariant(company.status)}>
                      {company.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-secondary">ID</dt>
                  <dd className="text-text-primary font-mono text-sm">{company.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-text-secondary">Created</dt>
                  <dd className="text-text-primary">
                    {new Date(company.created_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {tabLoading ? (
              <Loading text="Loading users..." />
            ) : users.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Users size={48} />}
                  title="No users assigned"
                  description="Add users to this company to grant them access"
                  action={
                    <Button onClick={openAddUserModal}>
                      <Plus size={18} />
                      Add User
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Table
                columns={[
                  { key: 'user_id', header: 'User ID', render: (u: CompanyAccess) => (
                    <span className="font-mono text-sm">{u.user_id.slice(0, 8)}...</span>
                  )},
                  { key: 'role', header: 'Role', render: (u: CompanyAccess) => (
                    <Badge variant={getRoleVariant(u.role)}>{u.role}</Badge>
                  )},
                  { key: 'created_at', header: 'Added', render: (u: CompanyAccess) => (
                    <span className="text-text-secondary">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  )},
                ]}
                data={users}
                keyExtractor={(u) => u.id}
              />
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-4">
            {tabLoading ? (
              <Loading text="Loading assets..." />
            ) : assets.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Package size={48} />}
                  title="No assets"
                  description="This company has no assets yet"
                  action={
                    <Button onClick={() => setIsAddAssetModalOpen(true)}>
                      <Plus size={18} />
                      Add Asset
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Table
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'type', header: 'Type', render: (a: Asset) => (
                    <Badge>{a.type}</Badge>
                  )},
                  { key: 'status', header: 'Status', render: (a: Asset) => (
                    <Badge variant={getStatusVariant(a.status)}>{a.status}</Badge>
                  )},
                  { key: 'identifier', header: 'Identifier', render: (a: Asset) => (
                    <span className="text-text-secondary">{a.identifier || '—'}</span>
                  )},
                ]}
                data={assets}
                keyExtractor={(a) => a.id}
              />
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          tabLoading ? (
            <Loading text="Loading audit logs..." />
          ) : auditLogs.length === 0 ? (
            <Card>
              <EmptyState
                icon={<FileText size={48} />}
                title="No audit logs"
                description="No activity has been recorded for this company"
              />
            </Card>
          ) : (
            <Table
              columns={[
                { key: 'action', header: 'Action', render: (log: AuditLog) => (
                  <Badge variant={log.action === 'create' ? 'success' : log.action === 'delete' ? 'error' : 'warning'}>
                    {log.action}
                  </Badge>
                )},
                { key: 'entity_type', header: 'Entity', render: (log: AuditLog) => (
                  <span className="capitalize">{log.entity_type}</span>
                )},
                { key: 'entity_id', header: 'Entity ID', render: (log: AuditLog) => (
                  <span className="font-mono text-sm">{log.entity_id.slice(0, 8)}...</span>
                )},
                { key: 'created_at', header: 'Time', render: (log: AuditLog) => (
                  <span className="text-text-secondary">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                )},
              ]}
              data={auditLogs}
              keyExtractor={(log) => log.id}
            />
          )
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setSelectedUserId('');
          setSelectedRole('MEMBER');
          setAddUserError('');
        }}
        title="Add User to Company"
        size="sm"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <Select
            label="Select User"
            placeholder="Choose a user"
            options={availableUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            error={addUserError}
          />
          <Select
            label="Role"
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MEMBER', label: 'Member' },
              { value: 'READ_ONLY', label: 'Read Only' },
            ]}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'MEMBER' | 'READ_ONLY')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addUserSubmitting}>
              Add User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Asset Modal */}
      <Modal
        isOpen={isAddAssetModalOpen}
        onClose={() => {
          setIsAddAssetModalOpen(false);
          setAssetFormData({});
          setAddAssetError('');
        }}
        title="Add Asset"
        size="md"
      >
        <form onSubmit={handleAddAsset} className="space-y-4">
          <Input
            label="Asset Name"
            placeholder="Enter asset name"
            value={assetFormData.name || ''}
            onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
            error={addAssetError}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={[
                { value: 'hardware', label: 'Hardware' },
                { value: 'software', label: 'Software' },
                { value: 'license', label: 'License' },
                { value: 'other', label: 'Other' },
              ]}
              value={assetFormData.type || ''}
              onChange={(e) => setAssetFormData({ ...assetFormData, type: e.target.value as AssetType })}
            />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'disposed', label: 'Disposed' },
              ]}
              value={assetFormData.status || 'active'}
              onChange={(e) => setAssetFormData({ ...assetFormData, status: e.target.value as AssetStatus })}
            />
          </div>
          <Input
            label="Identifier (Optional)"
            placeholder="Serial number, license key, etc."
            value={assetFormData.identifier || ''}
            onChange={(e) => setAssetFormData({ ...assetFormData, identifier: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddAssetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addAssetSubmitting}>
              Add Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditError('');
        }}
        title="Edit Company"
        size="sm"
      >
        <form onSubmit={handleEditCompany} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Enter company name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            error={editError}
            autoFocus
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={editFormData.status}
            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={editSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
