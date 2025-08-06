import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, CreateInvoiceDTO } from '../types/invoice';
import type { Customer, CreateCustomerDTO } from '../types/customer';
import type { Project, CreateProjectDTO } from '../types/project';
import type { Article, CreateArticleDTO } from '../types/article';

interface DraftInvoice extends Partial<CreateInvoiceDTO> {
  id?: string;
  tempId: string;
  lastModified: string;
}

interface DraftCustomer extends Partial<CreateCustomerDTO> {
  id?: string;
  tempId: string;
  lastModified: string;
}

interface DraftProject extends Partial<CreateProjectDTO> {
  id?: string;
  tempId: string;
  lastModified: string;
}

interface DraftArticle extends Partial<CreateArticleDTO> {
  id?: string;
  tempId: string;
  lastModified: string;
}

interface DraftState {
  // Draft invoices
  draftInvoices: DraftInvoice[];
  
  // Draft customers
  draftCustomers: DraftCustomer[];
  
  // Draft projects
  draftProjects: DraftProject[];
  
  // Draft articles
  draftArticles: DraftArticle[];
  
  // Current editing states
  currentInvoiceDraft: DraftInvoice | null;
  currentCustomerDraft: DraftCustomer | null;
  currentProjectDraft: DraftProject | null;
  currentArticleDraft: DraftArticle | null;
  
  // Actions - Invoice drafts
  createInvoiceDraft: (invoice?: Partial<CreateInvoiceDTO>) => string;
  updateInvoiceDraft: (tempId: string, invoice: Partial<CreateInvoiceDTO>) => void;
  deleteInvoiceDraft: (tempId: string) => void;
  setCurrentInvoiceDraft: (tempId: string | null) => void;
  clearInvoiceDrafts: () => void;
  
  // Actions - Customer drafts
  createCustomerDraft: (customer?: Partial<CreateCustomerDTO>) => string;
  updateCustomerDraft: (tempId: string, customer: Partial<CreateCustomerDTO>) => void;
  deleteCustomerDraft: (tempId: string) => void;
  setCurrentCustomerDraft: (tempId: string | null) => void;
  clearCustomerDrafts: () => void;
  
  // Actions - Project drafts
  createProjectDraft: (project?: Partial<CreateProjectDTO>) => string;
  updateProjectDraft: (tempId: string, project: Partial<CreateProjectDTO>) => void;
  deleteProjectDraft: (tempId: string) => void;
  setCurrentProjectDraft: (tempId: string | null) => void;
  clearProjectDrafts: () => void;
  
  // Actions - Article drafts
  createArticleDraft: (article?: Partial<CreateArticleDTO>) => string;
  updateArticleDraft: (tempId: string, article: Partial<CreateArticleDTO>) => void;
  deleteArticleDraft: (tempId: string) => void;
  setCurrentArticleDraft: (tempId: string | null) => void;
  clearArticleDrafts: () => void;
  
  // Utility actions
  clearAllDrafts: () => void;
  getDraftById: (type: 'invoice' | 'customer' | 'project' | 'article', tempId: string) => any;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      draftInvoices: [],
      draftCustomers: [],
      draftProjects: [],
      draftArticles: [],
      currentInvoiceDraft: null,
      currentCustomerDraft: null,
      currentProjectDraft: null,
      currentArticleDraft: null,
      
      // Invoice draft actions
      createInvoiceDraft: (invoice = {}) => {
        const tempId = Math.random().toString(36).slice(2);
        const newDraft: DraftInvoice = {
          ...invoice,
          tempId,
          lastModified: new Date().toISOString(),
        };
        
        set((state) => ({
          draftInvoices: [...state.draftInvoices, newDraft],
          currentInvoiceDraft: newDraft,
        }));
        
        return tempId;
      },
      
      updateInvoiceDraft: (tempId, invoice) => {
        set((state) => {
          const updatedDrafts = state.draftInvoices.map(draft =>
            draft.tempId === tempId
              ? { ...draft, ...invoice, lastModified: new Date().toISOString() }
              : draft
          );
          
          return {
            draftInvoices: updatedDrafts,
            currentInvoiceDraft: state.currentInvoiceDraft?.tempId === tempId
              ? updatedDrafts.find(d => d.tempId === tempId) || null
              : state.currentInvoiceDraft,
          };
        });
      },
      
      deleteInvoiceDraft: (tempId) => {
        set((state) => ({
          draftInvoices: state.draftInvoices.filter(draft => draft.tempId !== tempId),
          currentInvoiceDraft: state.currentInvoiceDraft?.tempId === tempId
            ? null
            : state.currentInvoiceDraft,
        }));
      },
      
      setCurrentInvoiceDraft: (tempId) => {
        set((state) => ({
          currentInvoiceDraft: tempId
            ? state.draftInvoices.find(draft => draft.tempId === tempId) || null
            : null,
        }));
      },
      
      clearInvoiceDrafts: () => {
        set({ draftInvoices: [], currentInvoiceDraft: null });
      },
      
      // Customer draft actions
      createCustomerDraft: (customer = {}) => {
        const tempId = Math.random().toString(36).slice(2);
        const newDraft: DraftCustomer = {
          ...customer,
          tempId,
          lastModified: new Date().toISOString(),
        };
        
        set((state) => ({
          draftCustomers: [...state.draftCustomers, newDraft],
          currentCustomerDraft: newDraft,
        }));
        
        return tempId;
      },
      
      updateCustomerDraft: (tempId, customer) => {
        set((state) => {
          const updatedDrafts = state.draftCustomers.map(draft =>
            draft.tempId === tempId
              ? { ...draft, ...customer, lastModified: new Date().toISOString() }
              : draft
          );
          
          return {
            draftCustomers: updatedDrafts,
            currentCustomerDraft: state.currentCustomerDraft?.tempId === tempId
              ? updatedDrafts.find(d => d.tempId === tempId) || null
              : state.currentCustomerDraft,
          };
        });
      },
      
      deleteCustomerDraft: (tempId) => {
        set((state) => ({
          draftCustomers: state.draftCustomers.filter(draft => draft.tempId !== tempId),
          currentCustomerDraft: state.currentCustomerDraft?.tempId === tempId
            ? null
            : state.currentCustomerDraft,
        }));
      },
      
      setCurrentCustomerDraft: (tempId) => {
        set((state) => ({
          currentCustomerDraft: tempId
            ? state.draftCustomers.find(draft => draft.tempId === tempId) || null
            : null,
        }));
      },
      
      clearCustomerDrafts: () => {
        set({ draftCustomers: [], currentCustomerDraft: null });
      },
      
      // Project draft actions
      createProjectDraft: (project = {}) => {
        const tempId = Math.random().toString(36).slice(2);
        const newDraft: DraftProject = {
          ...project,
          tempId,
          lastModified: new Date().toISOString(),
        };
        
        set((state) => ({
          draftProjects: [...state.draftProjects, newDraft],
          currentProjectDraft: newDraft,
        }));
        
        return tempId;
      },
      
      updateProjectDraft: (tempId, project) => {
        set((state) => {
          const updatedDrafts = state.draftProjects.map(draft =>
            draft.tempId === tempId
              ? { ...draft, ...project, lastModified: new Date().toISOString() }
              : draft
          );
          
          return {
            draftProjects: updatedDrafts,
            currentProjectDraft: state.currentProjectDraft?.tempId === tempId
              ? updatedDrafts.find(d => d.tempId === tempId) || null
              : state.currentProjectDraft,
          };
        });
      },
      
      deleteProjectDraft: (tempId) => {
        set((state) => ({
          draftProjects: state.draftProjects.filter(draft => draft.tempId !== tempId),
          currentProjectDraft: state.currentProjectDraft?.tempId === tempId
            ? null
            : state.currentProjectDraft,
        }));
      },
      
      setCurrentProjectDraft: (tempId) => {
        set((state) => ({
          currentProjectDraft: tempId
            ? state.draftProjects.find(draft => draft.tempId === tempId) || null
            : null,
        }));
      },
      
      clearProjectDrafts: () => {
        set({ draftProjects: [], currentProjectDraft: null });
      },
      
      // Article draft actions
      createArticleDraft: (article = {}) => {
        const tempId = Math.random().toString(36).slice(2);
        const newDraft: DraftArticle = {
          ...article,
          tempId,
          lastModified: new Date().toISOString(),
        };
        
        set((state) => ({
          draftArticles: [...state.draftArticles, newDraft],
          currentArticleDraft: newDraft,
        }));
        
        return tempId;
      },
      
      updateArticleDraft: (tempId, article) => {
        set((state) => {
          const updatedDrafts = state.draftArticles.map(draft =>
            draft.tempId === tempId
              ? { ...draft, ...article, lastModified: new Date().toISOString() }
              : draft
          );
          
          return {
            draftArticles: updatedDrafts,
            currentArticleDraft: state.currentArticleDraft?.tempId === tempId
              ? updatedDrafts.find(d => d.tempId === tempId) || null
              : state.currentArticleDraft,
          };
        });
      },
      
      deleteArticleDraft: (tempId) => {
        set((state) => ({
          draftArticles: state.draftArticles.filter(draft => draft.tempId !== tempId),
          currentArticleDraft: state.currentArticleDraft?.tempId === tempId
            ? null
            : state.currentArticleDraft,
        }));
      },
      
      setCurrentArticleDraft: (tempId) => {
        set((state) => ({
          currentArticleDraft: tempId
            ? state.draftArticles.find(draft => draft.tempId === tempId) || null
            : null,
        }));
      },
      
      clearArticleDrafts: () => {
        set({ draftArticles: [], currentArticleDraft: null });
      },
      
      // Utility actions
      clearAllDrafts: () => {
        set({
          draftInvoices: [],
          draftCustomers: [],
          draftProjects: [],
          draftArticles: [],
          currentInvoiceDraft: null,
          currentCustomerDraft: null,
          currentProjectDraft: null,
          currentArticleDraft: null,
        });
      },
      
      getDraftById: (type, tempId) => {
        const state = get();
        switch (type) {
          case 'invoice':
            return state.draftInvoices.find(draft => draft.tempId === tempId);
          case 'customer':
            return state.draftCustomers.find(draft => draft.tempId === tempId);
          case 'project':
            return state.draftProjects.find(draft => draft.tempId === tempId);
          case 'article':
            return state.draftArticles.find(draft => draft.tempId === tempId);
          default:
            return null;
        }
      },
    }),
    {
      name: 'draft-store',
      partialize: (state) => ({
        draftInvoices: state.draftInvoices,
        draftCustomers: state.draftCustomers,
        draftProjects: state.draftProjects,
        draftArticles: state.draftArticles,
      }),
    }
  )
);