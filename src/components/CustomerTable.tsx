import React, { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Euro,
  Calendar,
  User,
} from 'lucide-react';
import { Customer } from '../types/customer';
import { useTranslation } from 'react-i18next';
import { useLanguageUpdate } from '../hooks/useLanguageUpdate';

interface CustomerTableProps {
  customers: Customer[];
  onViewDetails: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const { t, i18n } = useTranslation(['customer', 'common']);
  
  // Force re-render on language change
  useLanguageUpdate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'company',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Building2 className="h-4 w-4" />
              {t('customer:table.headers.company')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-30" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900">{row.getValue('company')}</div>
            {row.original.taxId && (
              <div className="text-xs text-gray-500">USt-IdNr.: {row.original.taxId}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'contactPerson',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <User className="h-4 w-4" />
              {t('customer:table.headers.contactPerson')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-30" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <div className="text-gray-700">{row.getValue('contactPerson')}</div>
        ),
      },
      {
        id: 'contact',
        header: t('customer:table.headers.contact'),
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="space-y-1">
              {customer.email && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'address',
        header: t('customer:table.headers.address'),
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="text-sm text-gray-600">
              <div>{customer.street}</div>
              <div>{customer.postalCode} {customer.city}</div>
            </div>
          );
        },
      },
      {
        id: 'projects',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <FileText className="h-4 w-4" />
              Projekte
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-30" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.projects?.length || 0,
        cell: ({ row }) => {
          const projectCount = row.original.projects?.length || 0;
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}
              </span>
            </div>
          );
        },
      },
      {
        id: 'revenue',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Euro className="h-4 w-4" />
              Umsatz
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-30" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.totalRevenue || 0,
        cell: ({ row }) => {
          const amount = row.original.totalRevenue || 0;
          const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(amount);
          return <div className="font-medium text-gray-900">{formatted}</div>;
        },
      },
      {
        id: 'lastActivity',
        header: 'Letzte Aktivität',
        accessorFn: (row) => row.lastInvoiceDate || '',
        cell: ({ row }) => {
          const date = row.original.lastInvoiceDate;
          if (!date) return <span className="text-gray-400">Keine Aktivität</span>;
          
          const formattedDate = new Date(date).toLocaleDateString('de-DE');
          const daysAgo = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div className="text-sm">
              <div className="text-gray-700">{formattedDate}</div>
              <div className="text-xs text-gray-500">vor {daysAgo} Tagen</div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const customer = row.original;
          const [isOpen, setIsOpen] = useState(false);

          return (
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </button>
              
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onViewDetails(customer);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Eye className="h-4 w-4" />
                        Details anzeigen
                      </button>
                      <button
                        onClick={() => {
                          onEdit(customer);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit className="h-4 w-4" />
                        Bearbeiten
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          onDelete(customer);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [t, i18n.language, onViewDetails, onEdit, onDelete]
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('common:table.search.customers')}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {t('common:table.pagination.showing', { 
              from: table.getFilteredRowModel().rows.length, 
              to: customers.length, 
              total: customers.length, 
              entity: 'Kunden' 
            })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">Keine Kunden gefunden</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onViewDetails(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => {
                          if (cell.column.id === 'actions') {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <span className="text-sm text-gray-700">
              Seite {table.getState().pagination.pageIndex + 1} von {table.getPageCount()}
            </span>
            
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Zeilen pro Seite:</label>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};