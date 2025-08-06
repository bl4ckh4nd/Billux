import React from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { SearchResult } from '../hooks/useSearch';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  highlightedIndex: number;
  onSelectResult: (index: number) => void;
  onClose: () => void;
  getTypeIcon: (type: SearchResult['type']) => string;
  getTypeLabel: (type: SearchResult['type']) => string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  highlightedIndex,
  onSelectResult,
  onClose,
  getTypeIcon,
  getTypeLabel,
}) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="text-center text-gray-500">
          <Search className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Keine Ergebnisse für "{query}"</p>
          <p className="text-xs text-gray-400 mt-1">
            Versuchen Sie andere Suchbegriffe
          </p>
        </div>
      </div>
    );
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result, index) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push({ ...result, originalIndex: index });
    return acc;
  }, {} as Record<string, (SearchResult & { originalIndex: number })[]>);

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {results.length} Ergebnis{results.length !== 1 ? 'se' : ''} für "{query}"
          </p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Suche schließen"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="py-2">
        {Object.entries(groupedResults).map(([type, typeResults]) => (
          <div key={type} className="mb-2 last:mb-0">
            {/* Type Header */}
            <div className="px-4 py-1">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {getTypeIcon(type as SearchResult['type'])} {getTypeLabel(type as SearchResult['type'])}
              </h3>
            </div>

            {/* Type Results */}
            {typeResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectResult(result.originalIndex)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                  highlightedIndex === result.originalIndex
                    ? 'bg-green-50 border-green-600'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {highlightText(result.title, query)}
                      </h4>
                      {result.relevance > 80 && (
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          Exakt
                        </span>
                      )}
                    </div>
                    
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {highlightText(result.subtitle, query)}
                      </p>
                    )}
                    
                    {result.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {highlightText(result.description, query)}
                      </p>
                    )}
                  </div>
                  
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Verwenden Sie ↑↓ zum Navigieren, Enter zum Auswählen</span>
          <span>ESC zum Schließen</span>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;