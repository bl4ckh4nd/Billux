import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { customerSchema, type CreateCustomerDTO, type Customer } from '../types/customer';
import { useCreateCustomer } from '../hooks/useCustomers';

interface CustomerFormProps {
  customer?: Customer | null;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateCustomerDTO>({
    resolver: zodResolver(customerSchema)
  });

  const createCustomerMutation = useCreateCustomer();

  const onSubmit = async (data: CreateCustomerDTO) => {
    try {
      await createCustomerMutation.mutateAsync(data);
      onClose();
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-[#1D1616] mb-6">Neuen Kunden anlegen</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmenname
            </label>
            <input
              {...register('company')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.company && (
              <p className="text-[#D84040] text-sm mt-1">{errors.company.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ansprechpartner
            </label>
            <input
              {...register('contactPerson')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.contactPerson && (
              <p className="text-[#D84040] text-sm mt-1">{errors.contactPerson.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steuernummer
            </label>
            <input
              {...register('taxId')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.taxId && (
              <p className="text-[#D84040] text-sm mt-1">{errors.taxId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straße
              </label>
              <input
                {...register('street')}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.street && (
                <p className="text-[#D84040] text-sm mt-1">{errors.street.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PLZ
                </label>
                <input
                  {...register('postalCode')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.postalCode && (
                  <p className="text-[#D84040] text-sm mt-1">{errors.postalCode.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stadt
                </label>
                <input
                  {...register('city')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.city && (
                  <p className="text-[#D84040] text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.email && (
              <p className="text-[#D84040] text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              {...register('phone')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.phone && (
              <p className="text-[#D84040] text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createCustomerMutation.isPending}
              className="bg-[#D84040] hover:bg-[#8E1616] text-white px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {createCustomerMutation.isPending ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
