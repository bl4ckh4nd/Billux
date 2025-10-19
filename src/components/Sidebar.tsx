import React from 'react';
import { Building2, FileText, Users, Package, Euro, Bell, Briefcase, Settings, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { NavKey } from '../routes/navKeys';

interface SidebarProps {
  onNavigate: (view: NavKey) => void;
  currentView: NavKey;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView }) => {
  const { t } = useTranslation('navigation');
  
  const menuItems = [
    { icon: Building2, label: t('sidebar.dashboard'), view: 'dashboard' as NavKey },
    { icon: FileText, label: t('sidebar.invoices'), view: 'invoice' as NavKey },
    { icon: Upload, label: t('sidebar.uploadOcr'), view: 'invoice-upload' as NavKey },
    { icon: Users, label: t('sidebar.customers'), view: 'customers' as NavKey },
    { icon: Package, label: t('sidebar.articles'), view: 'articles' as NavKey },
    { icon: Euro, label: t('sidebar.finances'), view: 'finances' as NavKey },
    { icon: Bell, label: t('sidebar.reminders'), view: 'reminders' as NavKey },
    { icon: Briefcase, label: t('sidebar.projects'), view: 'projects' as NavKey },
    { icon: Settings, label: t('sidebar.settings'), view: 'settings' as NavKey },
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-6 absolute inset-y-0 left-0 md:relative transform -translate-x-full md:translate-x-0 transition duration-200 ease-in-out">
      <div className="icon-wrapper mb-4">
        <Building2 size={20} className="text-white" />
      </div>
      
      {menuItems.map((item) => (
        <button
          key={item.label}
          onClick={() => onNavigate(item.view)}
          className={`p-3 rounded-xl transition-all duration-200 ${
            currentView === item.view
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