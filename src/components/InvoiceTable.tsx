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
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useLanguageUpdate } from '../hooks/useLanguageUpdate';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  Eye,
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
  Filter,
  Calendar,
  Euro,
  Check,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Invoice, InvoiceType } from '../types/invoice';

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewDetails: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  activeTab: string;
}



export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onViewDetails,
  onEdit,
  onDelete,
  onDownloadPdf,
  activeTab,
}) => {
  const { t, i18n } = useTranslation(['invoice', 'common']);
  
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

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => {
      // Create fresh translation objects inside useMemo to ensure they update on language change
      const invoiceTypeLabels: Record<InvoiceType, string> = {
        'Standard': t('invoice:types.labels.Standard'),
        'Abschlag': t('invoice:types.labels.Abschlag'),
        'Schlussrechnung': t('invoice:types.labels.Schlussrechnung'),
        'Storno': t('invoice:types.labels.Storno'),
        'Gutschrift': t('invoice:types.labels.Gutschrift'),
      };
      
      const statusConfig = {
        'Bezahlt': { label: t('invoice:status.Bezahlt'), color: 'bg-green-100 text-green-700', icon: Check },
        'Offen': { label: t('invoice:status.Offen'), color: 'bg-blue-100 text-blue-700', icon: Clock },
        'Überfällig': { label: t('invoice:status.Überfällig'), color: 'bg-red-100 text-red-700', icon: AlertCircle },
        'Teilweise bezahlt': { label: t('invoice:status.Teilweise bezahlt'), color: 'bg-orange-100 text-orange-700', icon: Clock },
      };
      
      return [
      {
        accessorKey: 'number',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {t('invoice:table.headers.number')}
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
          <div className="font-medium text-gray-900">{row.getValue('number')}</div>
        ),
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {t('invoice:table.headers.customer')}
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
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div>
              <div className="font-medium text-gray-900">{invoice.customer}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: t('invoice:table.headers.type'),
        cell: ({ row }) => {
          const type = row.getValue('type') as InvoiceType;
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
              {invoiceTypeLabels[type]}
            </span>
          );
        },
      },
      {
        accessorKey: 'date',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Calendar className="h-4 w-4" />
              {t('invoice:table.headers.date')}
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
          <div className="text-gray-700">
            {format(new Date(row.getValue('date')), 'dd.MM.yyyy', { locale: de })}
          </div>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('invoice:table.headers.dueDate'),
        cell: ({ row }) => {
          const dueDate = new Date(row.getValue('dueDate'));
          const isOverdue = dueDate < new Date() && row.original.status !== 'Bezahlt';
          return (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
              {isOverdue && <AlertCircle className="h-4 w-4" />}
              {format(dueDate, 'dd.MM.yyyy', { locale: de })}
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Euro className="h-4 w-4" />
              {t('invoice:table.headers.amount')}
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
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount'));
          const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(amount);
          return <div className="font-medium text-gray-900">{formatted}</div>;
        },
      },
      {
        accessorKey: 'status',
        header: t('invoice:table.headers.status'),
        cell: ({ row }) => {
          const status = row.getValue('status') as keyof typeof statusConfig;
          const config = statusConfig[status];
          if (!config) {
            return <span className="text-gray-500">{status}</span>;
          }
          const Icon = config.icon;
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const invoice = row.original;
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
                          onViewDetails(invoice);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Eye className="h-4 w-4" />
                        {t('common:table.actions.viewDetails')}
                      </button>
                      <button
                        onClick={() => {
                          onEdit(invoice);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit className="h-4 w-4" />
                        {t('common:table.actions.edit')}
                      </button>
                      <button
                        onClick={() => {
                          onDownloadPdf(invoice);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Download className="h-4 w-4" />
                        {t('common:table.actions.downloadPdf')}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          onDelete(invoice);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('common:table.actions.delete')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
      ];
    },
    [t, i18n.language, onViewDetails, onEdit, onDelete, onDownloadPdf]
  );

  const filteredData = useMemo(() => {
    let filtered = invoices;

    if (activeTab !== 'all') {
      filtered = filtered.filter(invoice => {
        switch (activeTab) {
          case 'draft':
            return false; // No draft status in the German system
          case 'sent':
            return invoice.status === 'Offen';
          case 'paid':
            return invoice.status === 'Bezahlt';
          case 'overdue':
            return invoice.status === 'Überfällig' || 
              (invoice.status === 'Offen' && new Date(invoice.dueDate) < new Date());
          case 'cancelled':
            return false; // No cancelled status in the German system
          case 'partial':
            return invoice.status === 'Teilweise bezahlt';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [invoices, activeTab]);

  const table = useReactTable({
    data: filteredData,
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
            placeholder={t('common:table.search.invoices')}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {t('common:table.pagination.showing', { 
              from: table.getFilteredRowModel().rows.length, 
              to: invoices.length, 
              total: invoices.length, 
              entity: 'Rechnungen' 
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
                      <FileText className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">{t('common:table.pagination.noResults', { entity: 'Rechnungen' })}</p>
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
              {t('common:table.pagination.page')} {table.getState().pagination.pageIndex + 1} {t('common:table.pagination.of')} {table.getPageCount()}
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
            <label className="text-sm text-gray-700">{t('common:table.pagination.rowsPerPage')}</label>
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