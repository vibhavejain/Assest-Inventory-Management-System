import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Trash2 } from 'lucide-react';
import {
  Button,
  Table,
  Badge,
  getStatusVariant,
  Modal,
  Input,
  Select,
} from '../components/ui';
import { getCompanies, createCompany, deleteCompany } from '../api';
import type { Company, CreateCompanyRequest } from '../types';

export function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [_total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyRequest>({ name: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchCompanies() {
    setLoading(true);
    const res = await getCompanies({ limit: 50 });
    if (res.success && res.data) {
      setCompanies(res.data);
      setTotal(res.meta?.total || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Company name is required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await createCompany(formData);
    if (res.success && res.data) {
      setIsModalOpen(false);
      setFormData({ name: '' });
      fetchCompanies();
    } else {
      setFormError(res.error?.message || 'Failed to create company');
    }
    setSubmitting(false);
  }

  async function handleDeleteCompany() {
    if (!companyToDelete) return;
    setDeleting(true);
    const res = await deleteCompany(companyToDelete.id);
    if (res.success) {
      setDeleteConfirmOpen(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } else {
      alert(res.error?.message || 'Failed to delete company');
    }
    setDeleting(false);
  }

  const columns = [
    {
      key: 'name',
      header: 'Company Name',
      render: (company: Company) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-muted rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-text-secondary" />
          </div>
          <span className="font-medium">{company.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (company: Company) => (
        <Badge variant={getStatusVariant(company.status)}>
          {company.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (company: Company) => (
        <span className="text-text-secondary">
          {new Date(company.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (company: Company) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCompanyToDelete(company);
            setDeleteConfirmOpen(true);
          }}
          className="p-2 text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete company"
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
          <h1 className="text-2xl font-semibold text-text-primary">Companies</h1>
          <p className="text-text-secondary mt-1">
            Manage your organization tenants
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Company
        </Button>
      </div>

      {/* Companies Table */}
      <Table
        columns={columns}
        data={companies}
        keyExtractor={(company) => company.id}
        loading={loading}
        onRowClick={(company) => navigate(`/companies/${company.id}`)}
        emptyState={{
          icon: <Building2 size={48} />,
          title: 'No companies yet',
          description: 'Create your first company to get started',
          action: (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add Company
            </Button>
          ),
        }}
      />

      {/* Create Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ name: '' });
          setFormError('');
        }}
        title="Create Company"
        size="sm"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Enter company name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formError}
            autoFocus
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={formData.status || 'active'}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Company
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCompanyToDelete(null);
        }}
        title="Delete Company"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{companyToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCompanyToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteCompany}
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
