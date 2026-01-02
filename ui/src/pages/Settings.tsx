import { Card, CardHeader } from '../components/ui';
import { User, Bell, Shield } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader
            title="Profile"
            description="Manage your account information"
          />
          <div className="flex items-center gap-4 p-4 bg-surface-muted rounded-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Admin User</p>
              <p className="text-sm text-text-secondary">admin@company.com</p>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader
            title="Notifications"
            description="Configure notification preferences"
          />
          <div className="flex items-center gap-4 p-4 bg-surface-muted rounded-lg">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bell size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Email Notifications</p>
              <p className="text-sm text-text-secondary">Coming soon</p>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader
            title="Security"
            description="Authentication and access control"
          />
          <div className="flex items-center gap-4 p-4 bg-surface-muted rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Authentication</p>
              <p className="text-sm text-text-secondary">
                Auth integration planned for future release
              </p>
            </div>
          </div>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader
            title="System Information"
            description="API and version details"
          />
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-text-secondary">API Version</dt>
              <dd className="font-mono text-sm">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">UI Version</dt>
              <dd className="font-mono text-sm">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Environment</dt>
              <dd className="font-mono text-sm">Production</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
