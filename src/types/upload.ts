export interface UploadedDocument {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  processingProgress: number;
  ocrResult?: OcrResult;
  parsedData?: ParsedInvoiceData;
  validationErrors?: ValidationError[];
  processingSteps?: ProcessingStep[];
  vendorMatches?: VendorMatchResult[];
  suggestedCustomer?: CustomerSuggestion;
}

export interface VendorMatchResult {
  customer: {
    id: string;
    company: string;
    address: string;
    taxId?: string;
  };
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'partial';
  matchedFields: string[];
}

export interface CustomerSuggestion {
  shouldCreate: boolean;
  reason: string;
  suggestedData: {
    company: string;
    contactPerson: string;
    taxId?: string;
    address: string;
    street: string;
    postalCode: string;
    city: string;
    email: string;
    phone: string;
  };
}

export interface OcrResult {
  text: string;
  confidence: number;
  processingTime: number;
  pageCount: number;
  metadata: {
    fileSize: number;
    format: string;
    language: string;
  };
}

export interface ParsedInvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  vendor: {
    name: string;
    address: string;
    taxId: string;
  };
  customer: {
    name: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    taxAmount: number;
    total: number;
  };
  confidence: number;
}

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  enhancedData?: {
    context?: string;
    possibleCauses?: string[];
    correctionSuggestions?: CorrectionSuggestion[];
    autoFixAvailable?: boolean;
    learnFromUser?: boolean;
    relatedFields?: string[];
  };
}

export interface EnhancedValidationError extends ValidationError {
  context?: string;
  possibleCauses?: string[];
  correctionSuggestions?: CorrectionSuggestion[];
  autoFixAvailable?: boolean;
  learnFromUser?: boolean;
  relatedFields?: string[];
}

export interface CorrectionSuggestion {
  type: 'replace' | 'format' | 'calculate' | 'lookup' | 'manual';
  description: string;
  suggestedValue?: string;
  confidence: number;
  action?: () => void;
  requiresUserInput?: boolean;
  inputType?: 'text' | 'date' | 'number' | 'select';
  options?: string[];
}

export interface ProcessingStatus {
  documentId: string;
  stage: 'upload' | 'ocr' | 'parsing' | 'validation' | 'complete';
  progress: number;
  message: string;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export interface UploadConfig {
  maxFileSize: number;
  maxFiles: number;
  allowedTypes: string[];
  enableVirusScan: boolean;
  enableAI: boolean;
  confidenceThreshold: number;
}

export interface OcrConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

export interface LearningPattern {
  input: string;
  expectedOutput: string;
  confidence: number;
  timestamp: Date;
  userId: string;
}

export interface PredictionResult {
  prediction: string;
  confidence: number;
  algorithm: 'naive-bayes' | 'knn' | 'frequency' | 'ensemble';
}