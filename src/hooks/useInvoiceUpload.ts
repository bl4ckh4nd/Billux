import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { UploadedDocument, ProcessingStatus, UploadConfig, ValidationError } from '../types/upload';
import { businessRuleEngine } from '../services/businessRuleEngine';
import { VendorMatchingService } from '../services/vendorMatchingService';

interface UseInvoiceUploadReturn {
  // State
  uploadedFiles: UploadedDocument[];
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  error: string | null;
  
  // Actions
  uploadFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<UploadedDocument>) => Promise<void>;
  createInvoiceFromDocument: (documentId: string) => Promise<void>;
  retryProcessing: (documentId: string) => Promise<void>;
  clearError: () => void;
  
  // Enhanced validation and matching
  validateDocument: (documentId: string) => Promise<ValidationError[]>;
  findVendorMatches: (documentId: string) => Promise<any[]>;
  
  // Data queries
  refreshDocuments: () => void;
  getProcessingStatus: (documentId: string) => Promise<ProcessingStatus | null>;
}

interface UseInvoiceUploadConfig {
  autoRefresh?: boolean;
  refreshInterval?: number;
  config?: Partial<UploadConfig>;
}

export const useInvoiceUpload = (options: UseInvoiceUploadConfig = {}): UseInvoiceUploadReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 2000, // 2 seconds
    config = {}
  } = options;

  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Query for uploaded documents
  const {
    data: uploadedFiles = [],
    refetch: refreshDocuments,
    error: queryError
  } = useQuery({
    queryKey: ['uploaded-documents'],
    queryFn: api.upload.getDocuments,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 1000, // Consider data stale after 1 second for real-time updates
  });

  // Check if any files are currently processing
  const isProcessing = uploadedFiles.some(file => 
    file.status === 'processing' || file.status === 'uploading'
  );

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const totalFiles = files.length;
      const uploadPromises = files.map(async (file, index) => {
        try {
          const result = await api.upload.uploadFile(file);
          setUploadProgress(((index + 1) / totalFiles) * 100);
          return result;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      });
      
      return await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      setError(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Remove file mutation
  const removeFileMutation = useMutation({
    mutationFn: api.upload.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
    },
    onError: (error: Error) => {
      setError(`Failed to remove file: ${error.message}`);
    }
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: ({ documentId, updates }: { documentId: string; updates: Partial<UploadedDocument> }) =>
      api.upload.updateDocument(documentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
    },
    onError: (error: Error) => {
      setError(`Failed to update document: ${error.message}`);
    }
  });

  // Create invoice from document mutation
  const createInvoiceMutation = useMutation({
    mutationFn: api.upload.createInvoiceFromDocument,
    onSuccess: () => {
      // Invalidate both upload and invoice queries
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      setError(`Failed to create invoice: ${error.message}`);
    }
  });

  // Retry processing mutation
  const retryProcessingMutation = useMutation({
    mutationFn: api.upload.processDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
    },
    onError: (error: Error) => {
      setError(`Failed to retry processing: ${error.message}`);
    }
  });

  // Action handlers
  const uploadFiles = useCallback(async (files: File[]) => {
    setError(null);
    
    // Validate files before upload
    for (const file of files) {
      if (file.size > (config.maxFileSize || 50 * 1024 * 1024)) {
        setError(`File ${file.name} is too large (max ${Math.round((config.maxFileSize || 50 * 1024 * 1024) / 1024 / 1024)}MB)`);
        return;
      }
      
      const allowedTypes = config.allowedTypes || ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has unsupported format (${file.type})`);
        return;
      }
    }
    
    try {
      await uploadFilesMutation.mutateAsync(files);
    } catch (error) {
      // Error is already handled in mutation
    }
  }, [uploadFilesMutation, config]);

  const removeFile = useCallback(async (fileId: string) => {
    setError(null);
    try {
      await removeFileMutation.mutateAsync(fileId);
    } catch (error) {
      // Error is already handled in mutation
    }
  }, [removeFileMutation]);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<UploadedDocument>) => {
    setError(null);
    try {
      await updateDocumentMutation.mutateAsync({ documentId, updates });
    } catch (error) {
      // Error is already handled in mutation
    }
  }, [updateDocumentMutation]);

  const createInvoiceFromDocument = useCallback(async (documentId: string) => {
    setError(null);
    try {
      await createInvoiceMutation.mutateAsync(documentId);
    } catch (error) {
      // Error is already handled in mutation
    }
  }, [createInvoiceMutation]);

  const retryProcessing = useCallback(async (documentId: string) => {
    setError(null);
    try {
      await retryProcessingMutation.mutateAsync(documentId);
    } catch (error) {
      // Error is already handled in mutation
    }
  }, [retryProcessingMutation]);

  const getProcessingStatus = useCallback(async (documentId: string): Promise<ProcessingStatus | null> => {
    try {
      return await api.upload.getProcessingStatus(documentId);
    } catch (error) {
      console.error('Failed to get processing status:', error);
      return null;
    }
  }, []);

  const validateDocument = useCallback(async (documentId: string): Promise<ValidationError[]> => {
    try {
      const document = uploadedFiles.find(doc => doc.id === documentId);
      if (!document || !document.parsedData) {
        return [{ field: 'general', message: 'Document not found or not processed', severity: 'error' }];
      }

      // Get existing customers and invoices for validation context
      const customers = await api.customers.getAll();
      const invoices = await api.invoices.getAll();

      const validationContext = {
        existingCustomers: customers,
        existingInvoices: invoices,
        currentDate: new Date()
      };

      return businessRuleEngine.validateInvoice(document.parsedData, validationContext);
    } catch (error) {
      console.error('Failed to validate document:', error);
      return [{ field: 'general', message: 'Validation failed', severity: 'error' }];
    }
  }, [uploadedFiles]);

  const findVendorMatches = useCallback(async (documentId: string) => {
    try {
      const document = uploadedFiles.find(doc => doc.id === documentId);
      if (!document || !document.parsedData) {
        return [];
      }

      const customers = await api.customers.getAll();
      const vendorMatcher = new VendorMatchingService(customers);
      
      return vendorMatcher.findAllMatches(document.parsedData.vendor);
    } catch (error) {
      console.error('Failed to find vendor matches:', error);
      return [];
    }
  }, [uploadedFiles]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Combine errors from queries and mutations
  const combinedError = error || 
    (queryError ? `Failed to load documents: ${queryError.message}` : null) ||
    (uploadFilesMutation.error ? `Upload error: ${uploadFilesMutation.error.message}` : null) ||
    (removeFileMutation.error ? `Remove error: ${removeFileMutation.error.message}` : null) ||
    (updateDocumentMutation.error ? `Update error: ${updateDocumentMutation.error.message}` : null) ||
    (createInvoiceMutation.error ? `Invoice creation error: ${createInvoiceMutation.error.message}` : null) ||
    (retryProcessingMutation.error ? `Retry error: ${retryProcessingMutation.error.message}` : null);

  return {
    // State
    uploadedFiles,
    isUploading: uploadFilesMutation.isPending || isUploading,
    isProcessing,
    uploadProgress,
    error: combinedError,
    
    // Actions
    uploadFiles,
    removeFile,
    updateDocument,
    createInvoiceFromDocument,
    retryProcessing,
    clearError,
    
    // Enhanced validation and matching
    validateDocument,
    findVendorMatches,
    
    // Data queries
    refreshDocuments,
    getProcessingStatus
  };
};

// Hook for managing OCR learning data
export const useOcrLearning = () => {
  const [learningStats, setLearningStats] = useState({
    totalPatterns: 0,
    fieldTypes: [] as string[],
    averageConfidence: 0,
    isInitialized: false
  });

  const recordCorrection = useCallback(async (
    originalText: string,
    correctedValue: string,
    fieldType: string,
    userId: string = 'default'
  ) => {
    try {
      // This would connect to the SimpleLearningEngine
      const { SimpleLearningEngine } = await import('../services/learningEngine');
      const engine = new SimpleLearningEngine();
      
      await engine.learnFromCorrection(originalText, correctedValue, fieldType, userId);
      
      // Update stats
      const stats = engine.getStatistics();
      setLearningStats(stats);
    } catch (error) {
      console.error('Failed to record correction:', error);
    }
  }, []);

  const predictFieldValue = useCallback(async (
    text: string,
    fieldType: string,
    userId: string = 'default'
  ) => {
    try {
      const { SimpleLearningEngine } = await import('../services/learningEngine');
      const engine = new SimpleLearningEngine();
      
      return await engine.predictFieldValue(text, fieldType, userId);
    } catch (error) {
      console.error('Failed to predict field value:', error);
      return { prediction: '', confidence: 0, algorithm: 'ensemble' as const };
    }
  }, []);

  const clearLearningData = useCallback(async () => {
    try {
      const { SimpleLearningEngine } = await import('../services/learningEngine');
      const engine = new SimpleLearningEngine();
      
      engine.clearTrainingData();
      setLearningStats({
        totalPatterns: 0,
        fieldTypes: [],
        averageConfidence: 0,
        isInitialized: false
      });
    } catch (error) {
      console.error('Failed to clear learning data:', error);
    }
  }, []);

  return {
    learningStats,
    recordCorrection,
    predictFieldValue,
    clearLearningData
  };
};

export default useInvoiceUpload;