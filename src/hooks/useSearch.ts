import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInvoices } from './useInvoices';
import { useCustomers } from './useCustomers';
import { useProjects } from './useProjects';
import { useArticles } from './useArticles';

export interface SearchResult {
  id: string;
  type: 'invoice' | 'customer' | 'project' | 'article';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  relevance: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  highlightedIndex: number;
}

const useSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    isOpen: false,
    highlightedIndex: -1,
  });

  // Get data from existing hooks
  const { data: invoices = [] } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const { data: projects = [] } = useProjects();
  const { data: articles = [] } = useArticles();

  // Helper function to calculate relevance score
  const calculateRelevance = (text: string, query: string): number => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    if (lowerText === lowerQuery) return 100;
    if (lowerText.startsWith(lowerQuery)) return 80;
    if (lowerText.includes(lowerQuery)) return 60;
    
    // Check for word matches
    const textWords = lowerText.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    let wordMatches = 0;
    
    queryWords.forEach(queryWord => {
      if (textWords.some(textWord => textWord.includes(queryWord))) {
        wordMatches++;
      }
    });
    
    return (wordMatches / queryWords.length) * 40;
  };

  // Search function
  const performSearch = useMemo(() => {
    if (!searchState.query || searchState.query.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];
    const query = searchState.query.toLowerCase();

    // Search invoices
    invoices.forEach(invoice => {
      let relevance = 0;
      const searchableText = `${invoice.number} ${invoice.customer}`.toLowerCase();
      
      relevance = Math.max(
        calculateRelevance(invoice.number, query),
        calculateRelevance(invoice.customer, query),
        calculateRelevance(searchableText, query)
      );

      if (relevance > 0) {
        results.push({
          id: invoice.id,
          type: 'invoice',
          title: `Rechnung ${invoice.number}`,
          subtitle: invoice.customer,
          description: `${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)} - ${invoice.status}`,
          url: `/invoices/${invoice.id}`,
          relevance,
        });
      }
    });

    // Search customers
    customers.forEach(customer => {
      let relevance = 0;
      const searchableText = `${customer.name} ${customer.email || ''} ${customer.address || ''}`.toLowerCase();
      
      relevance = Math.max(
        calculateRelevance(customer.name, query),
        calculateRelevance(customer.email || '', query),
        calculateRelevance(searchableText, query)
      );

      if (relevance > 0) {
        results.push({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.email,
          description: customer.address,
          url: `/customers/${customer.id}`,
          relevance,
        });
      }
    });

    // Search projects
    projects.forEach(project => {
      let relevance = 0;
      const searchableText = `${project.title} ${project.description || ''} ${project.customerName || ''}`.toLowerCase();
      
      relevance = Math.max(
        calculateRelevance(project.title, query),
        calculateRelevance(project.description || '', query),
        calculateRelevance(project.customerName || '', query),
        calculateRelevance(searchableText, query)
      );

      if (relevance > 0) {
        results.push({
          id: project.id,
          type: 'project',
          title: project.title,
          subtitle: project.customerName,
          description: project.description,
          url: `/projects/${project.id}`,
          relevance,
        });
      }
    });

    // Search articles
    articles.forEach(article => {
      let relevance = 0;
      const searchableText = `${article.name} ${article.description} ${article.category}`.toLowerCase();
      
      relevance = Math.max(
        calculateRelevance(article.name, query),
        calculateRelevance(article.description, query),
        calculateRelevance(article.category, query),
        calculateRelevance(searchableText, query)
      );

      if (relevance > 0) {
        results.push({
          id: article.id,
          type: 'article',
          title: article.name,
          subtitle: article.category,
          description: `${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.basePrice)} / ${article.unit}`,
          url: `/articles/${article.id}`,
          relevance,
        });
      }
    });

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8);
  }, [searchState.query, invoices, customers, projects, articles]);

  // Update search results when query changes
  useEffect(() => {
    const results = performSearch;
    setSearchState(prev => ({
      ...prev,
      results,
      highlightedIndex: -1,
    }));
  }, [performSearch]);

  // Search functions
  const setQuery = (query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
      isOpen: query.length >= 2,
    }));
  };

  const clearSearch = () => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      isOpen: false,
      highlightedIndex: -1,
    }));
  };

  const openSearch = () => {
    setSearchState(prev => ({
      ...prev,
      isOpen: true,
    }));
  };

  const closeSearch = () => {
    setSearchState(prev => ({
      ...prev,
      isOpen: false,
      highlightedIndex: -1,
    }));
  };

  const highlightNext = () => {
    setSearchState(prev => ({
      ...prev,
      highlightedIndex: Math.min(prev.highlightedIndex + 1, prev.results.length - 1),
    }));
  };

  const highlightPrevious = () => {
    setSearchState(prev => ({
      ...prev,
      highlightedIndex: Math.max(prev.highlightedIndex - 1, -1),
    }));
  };

  const selectResult = (index?: number) => {
    const resultIndex = index !== undefined ? index : searchState.highlightedIndex;
    const result = searchState.results[resultIndex];
    
    if (result) {
      // Navigate to the result URL
      window.location.href = result.url;
      clearSearch();
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice': return '📄';
      case 'customer': return '👤';
      case 'project': return '📁';
      case 'article': return '📦';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice': return 'Rechnung';
      case 'customer': return 'Kunde';
      case 'project': return 'Projekt';
      case 'article': return 'Artikel';
      default: return '';
    }
  };

  return {
    ...searchState,
    setQuery,
    clearSearch,
    openSearch,
    closeSearch,
    highlightNext,
    highlightPrevious,
    selectResult,
    getTypeIcon,
    getTypeLabel,
    hasResults: searchState.results.length > 0,
  };
};

export default useSearch;