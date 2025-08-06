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
  Package,
  Euro,
  BarChart3,
  Tag,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Article } from '../types/article';

interface ArticleTableProps {
  articles: Article[];
  onViewDetails: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
}

export const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
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

  const columns = useMemo<ColumnDef<Article>[]>(
    () => [
      {
        accessorKey: 'articleNumber',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Artikelnr.
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
          <div className="font-medium text-gray-900">{row.getValue('articleNumber')}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Package className="h-4 w-4" />
              Bezeichnung
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
          const article = row.original;
          return (
            <div>
              <div className="font-medium text-gray-900">{article.name}</div>
              {article.description && (
                <div className="text-sm text-gray-500 truncate max-w-xs">{article.description}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Tag className="h-4 w-4" />
              Kategorie
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
          const category = row.getValue('category') as string;
          const categoryColors: Record<string, string> = {
            'Dienstleistung': 'bg-blue-100 text-blue-800',
            'Produkt': 'bg-green-100 text-green-800',
            'Material': 'bg-orange-100 text-orange-800',
            'Software': 'bg-purple-100 text-purple-800',
            'Hardware': 'bg-red-100 text-red-800',
          };
          const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-800';
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
              {category}
            </span>
          );
        },
      },
      {
        accessorKey: 'unit',
        header: 'Einheit',
        cell: ({ row }) => (
          <div className="text-gray-700">{row.getValue('unit')}</div>
        ),
      },
      {
        accessorKey: 'price',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <Euro className="h-4 w-4" />
              Preis
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
          const price = parseFloat(row.getValue('price'));
          const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(price);
          return <div className="font-medium text-gray-900">{formatted}</div>;
        },
      },
      {
        accessorKey: 'taxRate',
        header: 'MwSt.',
        cell: ({ row }) => (
          <div className="text-gray-700">{row.getValue('taxRate')}%</div>
        ),
      },
      {
        id: 'stock',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <BarChart3 className="h-4 w-4" />
              Lagerbestand
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
        accessorFn: (row) => row.stock || 0,
        cell: ({ row }) => {
          const stock = row.original.stock || 0;
          const minStock = row.original.minStock || 0;
          const isLow = stock <= minStock && minStock > 0;
          
          return (
            <div className={`flex items-center gap-1 ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
              {isLow && <AlertCircle className="h-4 w-4" />}
              <span className="font-medium">{stock}</span>
              {minStock > 0 && (
                <span className="text-xs text-gray-500">/ {minStock}</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'usage',
        header: 'Verwendung',
        accessorFn: (row) => row.usageCount || 0,
        cell: ({ row }) => {
          const usage = row.original.usageCount || 0;
          const trend = row.original.usageTrend || 'stable';
          
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{usage}x</span>
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const article = row.original;
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
                          onViewDetails(article);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Eye className="h-4 w-4" />
                        Details anzeigen
                      </button>
                      <button
                        onClick={() => {
                          onEdit(article);
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
                          onDelete(article);
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
    data: articles,
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
            placeholder="Artikel durchsuchen..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {table.getFilteredRowModel().rows.length} von {articles.length} Artikel
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
                      <Package className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">Keine Artikel gefunden</p>
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