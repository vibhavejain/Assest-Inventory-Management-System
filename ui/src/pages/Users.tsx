import { useEffect, useState } from 'react';
import { Plus, Users as UsersIcon, Filter } from 'lucide-react';
import {
  Button,
  Modal,
  Input,
  Select,
  Card,
} from '../components/ui';
import { UserCard } from '../components/UserCard';
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

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');

  async function fetchUsers() {
    setLoading(true);
    const params: Record<string, string | number> = { limit: 50 };
    if (filterStatus) params.status = filterStatus;
    if (filterCompany) params.company_id = filterCompany;
    const res = await getUsers(params);
    if (res.success && res.data) {
      setUsers(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filterStatus, filterCompany]);

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

    try {
      const res = await createUser(formData);
      if (res.success && res.data) {
        // If a company was selected, add user to that company with the selected role
        if (selectedCompanyId) {
          try {
            const accessRes = await addUserToCompany(selectedCompanyId, {
              user_id: res.data.id,
              role: selectedRole,
            });
            if (!accessRes.success) {
              console.warn('User created but company assignment failed:', accessRes.error?.message);
            }
          } catch (accessError) {
            console.warn('User created but company assignment threw error:', accessError);
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
    } catch (error) {
      console.error('Create user error:', error);
      setFormError('Failed to create user');
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

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Filter size={18} aria-hidden="true" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            id="filter-status"
            aria-label="Filter by status"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          />
          <Select
            id="filter-company"
            aria-label="Filter by company"
            options={[
              { value: '', label: 'All Companies' },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UsersIcon size={48} className="text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No users yet</h3>
          <p className="text-text-secondary mt-1 mb-4">Create your first user to get started</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Add User
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onDelete={(u) => {
                setUserToDelete(u);
                setDeleteConfirmOpen(true);
              }}
            />
          ))}
        </div>
      )}

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
