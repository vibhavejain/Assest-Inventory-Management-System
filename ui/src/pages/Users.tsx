import { useEffect, useState } from 'react';
import { Plus, Users as UsersIcon, Trash2 } from 'lucide-react';
import {
  Button,
  Table,
  Badge,
  getStatusVariant,
  Modal,
  Input,
  Select,
} from '../components/ui';
import { getUsers, createUser, getCompanies, addUserToCompany, deleteUser } from '../api';
import type { User, CreateUserRequest, Company, AccessRole } from '../types';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({ email: '', name: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // For company/role assignment
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AccessRole>('MEMBER');
  
  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const res = await getUsers({ limit: 50 });
    if (res.success && res.data) {
      setUsers(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    const res = await getCompanies({ limit: 100 });
    if (res.success && res.data) {
      setCompanies(res.data);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) {
      setFormError('Email and name are required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await createUser(formData);
    if (res.success && res.data) {
      // If a company was selected, add user to that company with the selected role
      if (selectedCompanyId) {
        const accessRes = await addUserToCompany(selectedCompanyId, {
          user_id: res.data.id,
          role: selectedRole,
        });
        if (!accessRes.success) {
          // User created but company assignment failed - still close modal and refresh
          console.warn('User created but company assignment failed:', accessRes.error?.message);
        }
      }
      setIsModalOpen(false);
      setFormData({ email: '', name: '' });
      setSelectedCompanyId('');
      setSelectedRole('MEMBER');
      fetchUsers();
    } else {
      setFormError(res.error?.message || 'Failed to create user');
    }
    setSubmitting(false);
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    setDeleting(true);
    const res = await deleteUser(userToDelete.id);
    if (res.success) {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } else {
      alert(res.error?.message || 'Failed to delete user');
    }
    setDeleting(false);
  }

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-secondary">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <Badge variant={getStatusVariant(user.status)}>
          {user.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (user: User) => (
        <span className="text-text-secondary">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (user: User) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setUserToDelete(user);
            setDeleteConfirmOpen(true);
          }}
          className="p-2 text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete user"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
          <p className="text-text-secondary mt-1">
            Manage system users
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Table
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        loading={loading}
        emptyState={{
          icon: <UsersIcon size={48} />,
          title: 'No users yet',
          description: 'Create your first user to get started',
          action: (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add User
            </Button>
          ),
        }}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ email: '', name: '' });
          setSelectedCompanyId('');
          setSelectedRole('MEMBER');
          setFormError('');
        }}
        title="Create User"
        size="sm"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formError}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={formData.status || 'active'}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
            }
          />
          <Select
            label="Assign to Company (Optional)"
            placeholder="Select a company"
            options={[
              { value: '', label: 'No company' },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          />
          {selectedCompanyId && (
            <Select
              label="Role"
              options={[
                { value: 'ADMIN', label: 'Admin' },
                { value: 'MEMBER', label: 'Member' },
                { value: 'READ_ONLY', label: 'Read Only' },
              ]}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AccessRole)}
            />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{userToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteUser}
              loading={deleting}
              className="!bg-error hover:!bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
