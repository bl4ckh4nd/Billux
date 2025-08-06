import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLanguage, LocalizationSettings } from '../types/i18n';

interface TableFilter {
  column: string;
  value: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

interface TableState {
  filters: TableFilter[];
  sort: SortConfig | null;
  pagination: PaginationConfig;
  searchQuery: string;
  selectedRows: string[];
}

interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  language: SupportedLanguage;
  localization: LocalizationSettings;
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF';
  itemsPerPage: 10 | 25 | 50 | 100;
  compactView: boolean;
}

interface UIState {
  // User preferences
  preferences: UIPreferences;
  
  // Table states for different views
  tableStates: Record<string, TableState>;
  
  // Active filters and search
  globalSearch: string;
  activeFilters: Record<string, any>;
  
  // Layout states
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Form states
  formErrors: Record<string, string[]>;
  formTouched: Record<string, boolean>;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<UIPreferences>) => void;
  resetPreferences: () => void;
  setLanguage: (language: SupportedLanguage) => void;
  updateLocalization: (localization: Partial<LocalizationSettings>) => void;
  
  // Actions - Table management
  setTableState: (tableId: string, state: Partial<TableState>) => void;
  resetTableState: (tableId: string) => void;
  addTableFilter: (tableId: string, filter: TableFilter) => void;
  removeTableFilter: (tableId: string, column: string) => void;
  clearTableFilters: (tableId: string) => void;
  setTableSort: (tableId: string, sort: SortConfig | null) => void;
  setTablePagination: (tableId: string, pagination: Partial<PaginationConfig>) => void;
  setTableSearch: (tableId: string, query: string) => void;
  setSelectedRows: (tableId: string, rows: string[]) => void;
  toggleRowSelection: (tableId: string, rowId: string) => void;
  clearRowSelection: (tableId: string) => void;
  
  // Actions - Global search and filters
  setGlobalSearch: (query: string) => void;
  setActiveFilter: (key: string, value: any) => void;
  removeActiveFilter: (key: string) => void;
  clearActiveFilters: () => void;
  
  // Actions - Layout
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // Actions - Form validation
  setFormErrors: (formId: string, errors: string[]) => void;
  clearFormErrors: (formId: string) => void;
  setFormTouched: (formId: string, touched: boolean) => void;
  clearFormTouched: (formId: string) => void;
  
  // Utility actions
  getTableState: (tableId: string) => TableState;
  hasTableFilters: (tableId: string) => boolean;
  getFilteredRowCount: (tableId: string) => number;
}

const defaultPreferences: UIPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  language: 'de',
  localization: {
    region: 'DE',
    timezone: 'Europe/Berlin',
    numberFormat: 'de',
    timeFormat: '24h',
    firstDayOfWeek: 1,
  },
  dateFormat: 'DD.MM.YYYY',
  currency: 'EUR',
  itemsPerPage: 25,
  compactView: false,
};

const defaultTableState: TableState = {
  filters: [],
  sort: null,
  pagination: { page: 1, pageSize: 25, total: 0 },
  searchQuery: '',
  selectedRows: [],
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      tableStates: {},
      globalSearch: '',
      activeFilters: {},
      sidebarOpen: true,
      mobileMenuOpen: false,
      formErrors: {},
      formTouched: {},
      
      // Preferences actions
      updatePreferences: (preferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        }));
      },
      
      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      },
      
      setLanguage: (language) => {
        set((state) => ({
          preferences: { 
            ...state.preferences, 
            language,
            // Update localization settings based on language
            localization: {
              ...state.preferences.localization,
              region: language === 'de' ? 'DE' : 'US',
              timezone: language === 'de' ? 'Europe/Berlin' : 'America/New_York',
              numberFormat: language === 'de' ? 'de' : 'en',
            },
            // Update date format based on language
            dateFormat: language === 'de' ? 'DD.MM.YYYY' : 'MM/DD/YYYY',
            // Update currency based on language
            currency: language === 'de' ? 'EUR' : 'USD',
          },
        }));
      },
      
      updateLocalization: (localization) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            localization: { ...state.preferences.localization, ...localization },
          },
        }));
      },
      
      // Table management actions
      setTableState: (tableId, state) => {
        set((currentState) => ({
          tableStates: {
            ...currentState.tableStates,
            [tableId]: {
              ...currentState.tableStates[tableId] || defaultTableState,
              ...state,
            },
          },
        }));
      },
      
      resetTableState: (tableId) => {
        set((state) => ({
          tableStates: {
            ...state.tableStates,
            [tableId]: defaultTableState,
          },
        }));
      },
      
      addTableFilter: (tableId, filter) => {
        const currentState = get();
        const tableState = currentState.tableStates[tableId] || defaultTableState;
        const existingFilterIndex = tableState.filters.findIndex(f => f.column === filter.column);
        
        let newFilters;
        if (existingFilterIndex >= 0) {
          newFilters = [...tableState.filters];
          newFilters[existingFilterIndex] = filter;
        } else {
          newFilters = [...tableState.filters, filter];
        }
        
        get().setTableState(tableId, { filters: newFilters });
      },
      
      removeTableFilter: (tableId, column) => {
        const currentState = get();
        const tableState = currentState.tableStates[tableId] || defaultTableState;
        const newFilters = tableState.filters.filter(f => f.column !== column);
        
        get().setTableState(tableId, { filters: newFilters });
      },
      
      clearTableFilters: (tableId) => {
        get().setTableState(tableId, { filters: [] });
      },
      
      setTableSort: (tableId, sort) => {
        get().setTableState(tableId, { sort });
      },
      
      setTablePagination: (tableId, pagination) => {
        const currentState = get();
        const tableState = currentState.tableStates[tableId] || defaultTableState;
        
        get().setTableState(tableId, {
          pagination: { ...tableState.pagination, ...pagination },
        });
      },
      
      setTableSearch: (tableId, query) => {
        get().setTableState(tableId, { searchQuery: query });
      },
      
      setSelectedRows: (tableId, rows) => {
        get().setTableState(tableId, { selectedRows: rows });
      },
      
      toggleRowSelection: (tableId, rowId) => {
        const currentState = get();
        const tableState = currentState.tableStates[tableId] || defaultTableState;
        const selectedRows = tableState.selectedRows.includes(rowId)
          ? tableState.selectedRows.filter(id => id !== rowId)
          : [...tableState.selectedRows, rowId];
        
        get().setTableState(tableId, { selectedRows });
      },
      
      clearRowSelection: (tableId) => {
        get().setTableState(tableId, { selectedRows: [] });
      },
      
      // Global search and filters
      setGlobalSearch: (query) => {
        set({ globalSearch: query });
      },
      
      setActiveFilter: (key, value) => {
        set((state) => ({
          activeFilters: { ...state.activeFilters, [key]: value },
        }));
      },
      
      removeActiveFilter: (key) => {
        set((state) => {
          const { [key]: removed, ...rest } = state.activeFilters;
          return { activeFilters: rest };
        });
      },
      
      clearActiveFilters: () => {
        set({ activeFilters: {} });
      },
      
      // Layout actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
      
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },
      
      setMobileMenuOpen: (open) => {
        set({ mobileMenuOpen: open });
      },
      
      toggleMobileMenu: () => {
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }));
      },
      
      // Form validation actions
      setFormErrors: (formId, errors) => {
        set((state) => ({
          formErrors: { ...state.formErrors, [formId]: errors },
        }));
      },
      
      clearFormErrors: (formId) => {
        set((state) => {
          const { [formId]: removed, ...rest } = state.formErrors;
          return { formErrors: rest };
        });
      },
      
      setFormTouched: (formId, touched) => {
        set((state) => ({
          formTouched: { ...state.formTouched, [formId]: touched },
        }));
      },
      
      clearFormTouched: (formId) => {
        set((state) => {
          const { [formId]: removed, ...rest } = state.formTouched;
          return { formTouched: rest };
        });
      },
      
      // Utility actions
      getTableState: (tableId) => {
        const state = get();
        return state.tableStates[tableId] || defaultTableState;
      },
      
      hasTableFilters: (tableId) => {
        const tableState = get().getTableState(tableId);
        return tableState.filters.length > 0 || tableState.searchQuery.length > 0;
      },
      
      getFilteredRowCount: (tableId) => {
        const tableState = get().getTableState(tableId);
        return tableState.pagination.total;
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        preferences: state.preferences,
        tableStates: state.tableStates,
        activeFilters: state.activeFilters,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);