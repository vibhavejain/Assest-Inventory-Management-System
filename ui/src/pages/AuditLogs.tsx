import { useEffect, useState } from 'react';
import { FileText, Filter, AlertCircle } from 'lucide-react';
import {
  Card,
  Select,
  EmptyState,
} from '../components/ui';
import { AuditLogCard } from '../components/AuditLogCard';
import { getAuditLogs, getCompanies } from '../api';
import type { AuditLog, Company } from '../types';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  async function fetchCompanies() {
    const res = await getCompanies({ limit: 100 });
    if (res.success && res.data) {
      setCompanies(res.data);
      if (res.data.length > 0 && !selectedCompany) {
        setSelectedCompany(res.data[0].id);
      }
    }
  }

  async function fetchLogs() {
    if (!selectedCompany) return;

    setLoading(true);
    const params: any = { company_id: selectedCompany, limit: 100 };
    if (filterEntity) params.entity_type = filterEntity;
    if (filterAction) params.action = filterAction;

    const res = await getAuditLogs(params);
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedCompany, filterEntity, filterAction]);

  const entityOptions = [
    { value: '', label: 'All Entities' },
    { value: 'company', label: 'Company' },
    { value: 'user', label: 'User' },
    { value: 'company_access', label: 'Company Access' },
    { value: 'asset', label: 'Asset' },
  ];

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
  ];

  if (companies.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Audit Logs</h1>
          <p className="text-text-secondary mt-1">
            View activity history and changes
          </p>
        </div>
        <Card>
          <EmptyState
            icon={<AlertCircle size={48} />}
            title="No companies found"
            description="Create a company first to view its audit logs"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Audit Logs</h1>
        <p className="text-text-secondary mt-1">
          View activity history and changes
        </p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-48"
          />
          <Select
            options={entityOptions}
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-40"
          />
          <Select
            options={actionOptions}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-36"
          />
        </div>
      </Card>

      {/* Audit Logs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={48} />}
            title="No audit logs found"
            description="Activity will appear here as changes are made"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
