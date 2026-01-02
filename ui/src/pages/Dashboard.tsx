import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Package, FileText, ArrowRight } from 'lucide-react';
import { Card, CardHeader, Loading, Badge, getStatusVariant } from '../components/ui';
import { getCompanies, getUsers, getAssets } from '../api';
import type { Company, Asset } from '../types';

interface DashboardStats {
  companies: number;
  users: number;
  assets: number;
  loading: boolean;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    companies: 0,
    users: 0,
    assets: 0,
    loading: true,
  });
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [companiesRes, usersRes, assetsRes] = await Promise.all([
        getCompanies({ limit: 5 }),
        getUsers({ limit: 5 }),
        getAssets({ limit: 5 }),
      ]);

      setStats({
        companies: companiesRes.meta?.total || 0,
        users: usersRes.meta?.total || 0,
        assets: assetsRes.meta?.total || 0,
        loading: false,
      });

      if (companiesRes.success && companiesRes.data) {
        setRecentCompanies(companiesRes.data);
      }
      if (assetsRes.success && assetsRes.data) {
        setRecentAssets(assetsRes.data);
      }
    }

    fetchData();
  }, []);

  const kpiCards = [
    {
      title: 'Companies',
      value: stats.companies,
      icon: Building2,
      color: 'text-blue-600 bg-blue-100',
      link: '/companies',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: Users,
      color: 'text-green-600 bg-green-100',
      link: '/users',
    },
    {
      title: 'Assets',
      value: stats.assets,
      icon: Package,
      color: 'text-purple-600 bg-purple-100',
      link: '/assets',
    },
    {
      title: 'Audit Logs',
      value: '—',
      icon: FileText,
      color: 'text-amber-600 bg-amber-100',
      link: '/audit-logs',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Overview of your asset inventory system
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Link key={kpi.title} to={kpi.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{kpi.title}</p>
                  {stats.loading ? (
                    <div className="h-8 w-16 bg-surface-muted rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-text-primary mt-1">
                      {kpi.value}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <kpi.icon size={24} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <Card>
          <CardHeader
            title="Recent Companies"
            action={
              <Link
                to="/companies"
                className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          {stats.loading ? (
            <Loading text="Loading companies..." />
          ) : recentCompanies.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">
              No companies yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <Link
                  key={company.id}
                  to={`/companies/${company.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-muted rounded-lg flex items-center justify-center">
                      <Building2 size={20} className="text-text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{company.name}</p>
                      <p className="text-xs text-text-secondary">
                        Created {new Date(company.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(company.status)}>
                    {company.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Assets */}
        <Card>
          <CardHeader
            title="Recent Assets"
            action={
              <Link
                to="/assets"
                className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          {stats.loading ? (
            <Loading text="Loading assets..." />
          ) : recentAssets.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">
              No assets yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-muted rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{asset.name}</p>
                      <p className="text-xs text-text-secondary capitalize">
                        {asset.type} • {asset.identifier || 'No identifier'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(asset.status)}>
                    {asset.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
