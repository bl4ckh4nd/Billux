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
  Briefcase,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Building2,
  TrendingUp,
  BarChart,
} from 'lucide-react';
import { Project, ProjectStatus } from '../types/project';

interface ProjectTableProps {
  projects: Project[];
  onViewDetails: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const statusConfig = {
  planning: { label: 'In Planung', color: 'bg-gray-100 text-gray-700', icon: Clock },
  active: { label: 'Aktiv', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Abgebrochen', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  'on-hold': { label: 'Pausiert', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Briefcase className="h-4 w-4" />
              Projektname
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
          const project = row.original;
          return (
            <div>
              <div className="font-medium text-gray-900">{project.name}</div>
              {project.description && (
                <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Building2 className="h-4 w-4" />
              Kunde
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
          <div className="text-gray-700">{row.getValue('customerName')}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
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
        id: 'duration',
        header: 'Zeitraum',
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="text-sm">
              <div className="flex items-center gap-1 text-gray-700">
                <Calendar className="h-3 w-3" />
                {format(new Date(project.startDate), 'dd.MM.yyyy', { locale: de })}
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <span className="ml-4">bis</span>
                {format(new Date(project.endDate), 'dd.MM.yyyy', { locale: de })}
              </div>
            </div>
          );
        },
      },
      {
        id: 'progress',
        header: 'Fortschritt',
        accessorFn: (row) => {
          const total = row.totalValue || 0;
          const invoiced = row.invoicedValue || 0;
          return total > 0 ? (invoiced / total) * 100 : 0;
        },
        cell: ({ row }) => {
          const project = row.original;
          const total = project.totalValue || 0;
          const invoiced = project.invoicedValue || 0;
          const progress = total > 0 ? (invoiced / total) * 100 : 0;
          
          return (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                <span className="text-xs text-gray-500">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoiced)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalValue',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Euro className="h-4 w-4" />
              Gesamtwert
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
          const amount = parseFloat(row.getValue('totalValue'));
          const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(amount);
          return <div className="font-medium text-gray-900">{formatted}</div>;
        },
      },
      {
        id: 'invoices',
        header: 'Rechnungen',
        accessorFn: (row) => row.invoices?.length || 0,
        cell: ({ row }) => {
          const invoiceCount = row.original.invoices?.length || 0;
          const paidCount = row.original.invoices?.filter(inv => inv.status === 'Bezahlt').length || 0;
          
          return (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm font-medium text-gray-700">{invoiceCount}</span>
                {paidCount > 0 && (
                  <span className="text-xs text-green-600 ml-1">({paidCount} bezahlt)</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const project = row.original;
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
                          onViewDetails(project);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Eye className="h-4 w-4" />
                        Details anzeigen
                      </button>
                      <button
                        onClick={() => {
                          onEdit(project);
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
                          onDelete(project);
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
    [onViewDetails, onEdit, onDelete]
  );

  const table = useReactTable({
    data: projects,
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
            placeholder="Projekte durchsuchen..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {table.getFilteredRowModel().rows.length} von {projects.length} Projekte
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
                      <Briefcase className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">Keine Projekte gefunden</p>
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