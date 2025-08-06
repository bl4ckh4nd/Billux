import React, { useRef, useEffect } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UserMenu from './UserMenu';
import SearchResults from './SearchResults';
import LanguageSwitcher from './LanguageSwitcher';
import useSearch from '../hooks/useSearch';

interface HeaderProps {
  onSidebarToggle?: () => void;
  currentPage?: string;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, currentPage }) => {
  const { t } = useTranslation('common');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    query,
    results,
    isOpen,
    highlightedIndex,
    hasResults,
    setQuery,
    clearSearch,
    closeSearch,
    highlightNext,
    highlightPrevious,
    selectResult,
    getTypeIcon,
    getTypeLabel,
  } = useSearch();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          highlightNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          highlightPrevious();
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            selectResult();
          }
          break;
        case 'Escape':
          event.preventDefault();
          closeSearch();
          searchInputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, highlightNext, highlightPrevious, selectResult, closeSearch]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeSearch]);

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyboard);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyboard);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button and search */}
        <div className="flex items-center flex-1 space-x-4">
          {/* Mobile sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={t('sidebar.toggle')}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-lg" ref={searchContainerRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('search.placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t('search.clear')}
                >
                  <span className="text-lg">×</span>
                </button>
              )}
              
              {/* Keyboard shortcut hint */}
              {!query && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-500">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>

            {/* Search Results */}
            {isOpen && query.length >= 2 && (
              <SearchResults
                results={results}
                query={query}
                highlightedIndex={highlightedIndex}
                onSelectResult={selectResult}
                onClose={closeSearch}
                getTypeIcon={getTypeIcon}
                getTypeLabel={getTypeLabel}
              />
            )}
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-3">
          {/* Page title (visible on larger screens) */}
          {currentPage && (
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
            </div>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher className="hidden sm:flex" />

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            
            {/* Notification badge */}
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile page title */}
      {currentPage && (
        <div className="lg:hidden mt-3">
          <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
        </div>
      )}
    </header>
  );
};

export default Header;