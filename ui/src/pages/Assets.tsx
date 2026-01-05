import { useEffect, useState } from 'react';
import { Plus, Package, Filter } from 'lucide-react';
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
} from '../components/ui';
import { AssetCard } from '../components/AssetCard';
import { getAssets, getCompanies, createAsset, deleteAsset } from '../api';
import type { Asset, Company, CreateAssetRequest, AssetType, AssetStatus } from '../types';

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAssetRequest>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');

  async function fetchAssets() {
    setLoading(true);
    const params: any = { limit: 50 };
    if (filterType) params.type = filterType;
    if (filterStatus) params.status = filterStatus;
    if (filterCompany) params.company_id = filterCompany;

    const res = await getAssets(params);
    if (res.success && res.data) {
      setAssets(res.data);
    }
    setLoading(false);
  }

  async function fetchCompanies() {
    const res = await getCompanies({ limit: 100 });
    if (res.success && res.data) {
      setCompanies(res.data);
    }
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [filterType, filterStatus, filterCompany]);

  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.company_id || !formData.type || !formData.name?.trim()) {
      setFormError('Company, type, and name are required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await createAsset(formData as CreateAssetRequest);
    if (res.success && res.data) {
      setIsModalOpen(false);
      setFormData({});
      fetchAssets();
    } else {
      setFormError(res.error?.message || 'Failed to create asset');
    }
    setSubmitting(false);
  }

  const typeOptions = [
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'license', label: 'License' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'disposed', label: 'Disposed' },
  ];

  async function handleDeleteAsset() {
    if (!assetToDelete) return;
    setDeleting(true);
    const res = await deleteAsset(assetToDelete.id);
    if (res.success) {
      setDeleteConfirmOpen(false);
      setAssetToDelete(null);
      fetchAssets();
    } else {
      alert(res.error?.message || 'Failed to delete asset');
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Assets</h1>
          <p className="text-text-secondary mt-1">
            Manage hardware, software, and licenses
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            options={[{ value: '', label: 'All Types' }, ...typeOptions]}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-40"
          />
          <Select
            options={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          />
          <Select
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

      {/* Assets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package size={48} className="text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No assets found</h3>
          <p className="text-text-secondary mt-1 mb-4">
            {filterType || filterStatus || filterCompany
              ? 'Try adjusting your filters'
              : 'Create your first asset to get started'}
          </p>
          {!filterType && !filterStatus && !filterCompany && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add Asset
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={(a) => {
                setAssetToDelete(a);
                setDeleteConfirmOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Create Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({});
          setFormError('');
        }}
        title="Create Asset"
        size="md"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <Select
            label="Company"
            placeholder="Select a company"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            value={formData.company_id || ''}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
          />
          <Input
            label="Asset Name"
            placeholder="Enter asset name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formError}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              placeholder="Select type"
              options={typeOptions}
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
            />
          </div>
          <Input
            label="Identifier (Optional)"
            placeholder="Serial number, license key, etc."
            value={formData.identifier || ''}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
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
              Create Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setAssetToDelete(null);
        }}
        title="Delete Asset"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{assetToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setAssetToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAsset}
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
