import React from 'react';
import { Building2, FileText, Users, Package, Euro, Bell, Briefcase, Settings, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onNavigate: (path: string) => void;
  currentKey?: string | null;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  key: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentKey }) => {
  const { t } = useTranslation('navigation');

  const menuItems: MenuItem[] = [
    { icon: Building2, label: t('sidebar.dashboard'), path: '/', key: 'dashboard' },
    { icon: FileText, label: t('sidebar.invoices'), path: '/invoices', key: 'invoice' },
    { icon: Upload, label: t('sidebar.uploadOcr'), path: '/invoices/upload', key: 'invoice-upload' },
    { icon: Users, label: t('sidebar.customers'), path: '/customers', key: 'customers' },
    { icon: Package, label: t('sidebar.articles'), path: '/articles', key: 'articles' },
    { icon: Euro, label: t('sidebar.finances'), path: '/finances', key: 'finances' },
    { icon: Bell, label: t('sidebar.reminders'), path: '/reminders', key: 'reminders' },
    { icon: Briefcase, label: t('sidebar.projects'), path: '/projects', key: 'projects' },
    { icon: Settings, label: t('sidebar.settings'), path: '/settings', key: 'settings' },
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-6 absolute inset-y-0 left-0 md:relative transform -translate-x-full md:translate-x-0 transition duration-200 ease-in-out">
      <div className="icon-wrapper mb-4">
        <Building2 size={20} className="text-white" />
      </div>

      {menuItems.map((item) => (
        <button
          key={item.label}
          onClick={() => onNavigate(item.path)}
          className={`p-3 rounded-xl transition-all duration-200 ${
            currentKey === item.key
              ? 'bg-green-100 text-green-600'
              : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'
          }`}
          title={item.label}
        >
          <item.icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
