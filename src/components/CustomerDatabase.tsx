import React, { useState } from 'react';
import { Plus, Building2, TrendingUp, Euro, Users } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerTable } from './CustomerTable';
import CustomerForm from './CustomerForm';
import type { Customer } from '../types/customer';

interface CustomerDatabaseProps {
  onCustomerClick?: (customerId: string) => void;
}

const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({ onCustomerClick }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { data: customers = [], isLoading } = useCustomers();

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.lastInvoiceDate && 
      new Date(c.lastInvoiceDate) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    ).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
    totalProjects: customers.reduce((sum, c) => sum + (c.projects?.length || 0), 0),
  };

  const handleViewDetails = (customer: Customer) => {
    if (onCustomerClick) {
      onCustomerClick(customer.id);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Möchten Sie den Kunden ${customer.company} wirklich löschen?`)) {
      // TODO: Implement delete functionality
      console.log('Delete customer:', customer);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtkunden</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">Alle registrierten Kunden</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Kunden</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">Letzte 6 Monate</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Alle Kunden</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projekte</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.totalProjects}</p>
              <p className="text-xs text-gray-500 mt-1">Aktive Projekte</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kundendatenbank</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verwalten Sie Ihre Kunden und deren Projekte
              </p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neuer Kunde
            </button>
          </div>
        </div>

        <div className="p-6">
          <CustomerTable
            customers={customers}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showForm && (
        <CustomerForm 
          customer={selectedCustomer} 
          onClose={handleCloseForm} 
        />
      )}
    </div>
  );
};

export default CustomerDatabase;