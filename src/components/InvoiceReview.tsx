import React, { useState, useEffect } from 'react';
import { 
  Check, AlertTriangle, Edit, Eye, X, Save, ArrowLeft, RefreshCw,
  Building, MapPin, Calendar, DollarSign, FileText, User, Phone, Mail,
  Zap, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, Wand2, Info, HelpCircle
} from 'lucide-react';
import { ParsedInvoiceData, ValidationError, UploadedDocument, CorrectionSuggestion } from '../types/upload';
import { useOcrLearning } from '../hooks/useInvoiceUpload';

interface InvoiceReviewProps {
  document: UploadedDocument;
  onSave: (data: ParsedInvoiceData) => void;
  onReject: () => void;
  onBack: () => void;
  onCreateInvoice?: (data: ParsedInvoiceData) => void;
}

interface FieldValidation {
  field: string;
  isValid: boolean;
  confidence: number;
  suggestion?: string;
  error?: string;
}

const InvoiceReview: React.FC<InvoiceReviewProps> = ({
  document,
  onSave,
  onReject,
  onBack,
  onCreateInvoice
}) => {
  const [editedData, setEditedData] = useState<ParsedInvoiceData>(
    document.parsedData || {} as ParsedInvoiceData
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fieldValidations, setFieldValidations] = useState<FieldValidation[]>([]);
  const [showDocument, setShowDocument] = useState(true);
  const [activeTab, setActiveTab] = useState<'basic' | 'vendor' | 'customer' | 'items' | 'totals'>('basic');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { recordCorrection, predictFieldValue } = useOcrLearning();
  
  useEffect(() => {
    if (document.parsedData) {
      setEditedData(document.parsedData);
      validateAllFields(document.parsedData);
    }
  }, [document]);
  
  const validateAllFields = (data: ParsedInvoiceData) => {
    const errors: ValidationError[] = [];
    const validations: FieldValidation[] = [];
    
    // Basic validation rules
    if (!data.invoiceNumber) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Rechnungsnummer ist erforderlich',
        severity: 'error'
      });
    }
    
    // Invoice number format validation
    if (data.invoiceNumber && !/^[A-Z]{0,3}[-]?\d{4,}/.test(data.invoiceNumber)) {
      validations.push({
        field: 'invoiceNumber',
        isValid: false,
        confidence: 0.6,
        suggestion: 'Format: RE-2024-001 oder ähnlich',
        error: 'Ungewöhnliches Rechnungsnummernformat'
      });
    } else if (data.invoiceNumber) {
      validations.push({
        field: 'invoiceNumber',
        isValid: true,
        confidence: 0.9
      });
    }
    
    // Date validation
    if (!data.date) {
      errors.push({
        field: 'date',
        message: 'Rechnungsdatum ist erforderlich',
        severity: 'error'
      });
    } else {
      const dateValid = isValidDate(data.date);
      validations.push({
        field: 'date',
        isValid: dateValid,
        confidence: dateValid ? 0.95 : 0.3,
        error: dateValid ? undefined : 'Ungültiges Datumsformat'
      });
    }
    
    // Due date validation
    if (data.dueDate) {
      const dueDateValid = isValidDate(data.dueDate);
      const isAfterInvoiceDate = new Date(data.dueDate) > new Date(data.date);
      validations.push({
        field: 'dueDate',
        isValid: dueDateValid && isAfterInvoiceDate,
        confidence: dueDateValid && isAfterInvoiceDate ? 0.9 : 0.4,
        error: !dueDateValid ? 'Ungültiges Datum' : !isAfterInvoiceDate ? 'Fälligkeitsdatum vor Rechnungsdatum' : undefined
      });
    }
    
    // Vendor validation
    if (!data.vendor.name) {
      errors.push({
        field: 'vendor.name',
        message: 'Lieferantenname ist erforderlich',
        severity: 'error'
      });
    } else {
      validations.push({
        field: 'vendor.name',
        isValid: data.vendor.name.length > 2,
        confidence: data.vendor.name.length > 10 ? 0.9 : 0.7
      });
    }
    
    // Tax ID validation
    if (data.vendor.taxId) {
      const taxIdValid = /^DE\d{9}$/.test(data.vendor.taxId);
      validations.push({
        field: 'vendor.taxId',
        isValid: taxIdValid,
        confidence: taxIdValid ? 0.95 : 0.3,
        suggestion: taxIdValid ? undefined : 'Deutsche USt-IdNr: DE123456789',
        error: taxIdValid ? undefined : 'Ungültige deutsche Umsatzsteuer-ID'
      });
    }
    
    // Amount validation
    if (data.totals.total <= 0) {
      errors.push({
        field: 'total',
        message: 'Gesamtbetrag muss größer als 0 sein',
        severity: 'error'
      });
    } else {
      // Check if tax calculation is correct
      const expectedTax = Math.round((data.totals.subtotal * 0.19) * 100) / 100;
      const taxDifference = Math.abs(data.totals.taxAmount - expectedTax);
      const taxValid = taxDifference < 0.01;
      
      validations.push({
        field: 'totals.total',
        isValid: taxValid,
        confidence: taxValid ? 0.95 : 0.6,
        suggestion: taxValid ? undefined : `Erwartete MwSt: ${expectedTax.toFixed(2)}€`,
        error: taxValid ? undefined : 'MwSt-Berechnung prüfen'
      });
    }
    
    // Item validation
    if (data.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Mindestens eine Position erforderlich',
        severity: 'warning'
      });
    }
    
    setValidationErrors(errors);
    setFieldValidations(validations);
  };
  
  const isValidDate = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  };
  
  const getFieldValidation = (fieldName: string): FieldValidation | undefined => {
    return fieldValidations.find(v => v.field === fieldName);
  };
  
  const getFieldError = (fieldName: string): ValidationError | undefined => {
    return validationErrors.find(error => error.field === fieldName);
  };
  
  const handleFieldChange = async (field: string, value: string, originalValue?: string) => {
    const newData = { ...editedData };
    
    // Handle nested field updates
    if (field.includes('.')) {
      const parts = field.split('.');
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      newData[field as keyof ParsedInvoiceData] = value as any;
    }
    
    setEditedData(newData);
    validateAllFields(newData);
    
    // Record learning data if this was a correction
    if (originalValue && originalValue !== value) {
      await recordCorrection(originalValue, value, field);
    }
  };

  const handleApplyFix = async (error: ValidationError, suggestion: CorrectionSuggestion) => {
    if (suggestion.suggestedValue) {
      await handleFieldChange(error.field, suggestion.suggestedValue);
      
      // Remove the error if auto-fix was successful
      if (suggestion.type === 'format' || suggestion.type === 'calculate') {
        setValidationErrors(prev => prev.filter(e => e !== error));
      }
    }
  };

  const handleDismissError = (errorIndex: number) => {
    setValidationErrors(prev => prev.filter((_, index) => index !== errorIndex));
  };
  
  const handleSave = async () => {
    setIsProcessing(true);
    try {
      // Final validation
      validateAllFields(editedData);
      const hasErrors = validationErrors.some(error => error.severity === 'error');
      
      if (hasErrors) {
        alert('Bitte beheben Sie alle Fehler vor dem Speichern.');
        return;
      }
      
      await onSave(editedData);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCreateInvoice = async () => {
    if (onCreateInvoice) {
      setIsProcessing(true);
      try {
        await onCreateInvoice(editedData);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getValidationIcon = (validation?: FieldValidation) => {
    if (!validation) return null;
    if (validation.isValid && validation.confidence >= 0.8) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (validation.isValid && validation.confidence >= 0.6) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };
  
  const overallConfidence = fieldValidations.length > 0 
    ? fieldValidations.reduce((sum, v) => sum + v.confidence, 0) / fieldValidations.length 
    : 0;
  
  const canSave = validationErrors.filter(error => error.severity === 'error').length === 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Rechnung überprüfen
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {document.filename} • {(document.fileSize / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Gesamtgenauigkeit</div>
              <div className={`text-lg font-semibold px-3 py-1 rounded-full text-sm ${getConfidenceColor(overallConfidence)}`}>
                {Math.round(overallConfidence * 100)}%
              </div>
            </div>
            <button
              onClick={() => setShowDocument(!showDocument)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{showDocument ? 'Dokument ausblenden' : 'Dokument anzeigen'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Document Viewer */}
        {showDocument && (
          <div className="w-1/2 border-r border-gray-200 bg-white">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Original Dokument</h2>
              </div>
              <div className="flex-1 p-4">
                <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <p>Dokumentvorschau</p>
                    <p className="text-sm">{document.filename}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Data Review Panel */}
        <div className={`${showDocument ? 'w-1/2' : 'w-full'} bg-gray-50`}>
          <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
              <div className="flex space-x-8">
                {[
                  { id: 'basic', label: 'Grunddaten', icon: FileText },
                  { id: 'vendor', label: 'Lieferant', icon: Building },
                  { id: 'customer', label: 'Kunde', icon: User },
                  { id: 'items', label: 'Positionen', icon: DollarSign },
                  { id: 'totals', label: 'Summen', icon: TrendingUp }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Enhanced Validation Summary */}
              {validationErrors.length > 0 && (
                <EnhancedValidationSummary 
                  errors={validationErrors} 
                  onApplyFix={(error, suggestion) => handleApplyFix(error, suggestion)}
                  onDismissError={(errorIndex) => handleDismissError(errorIndex)}
                />
              )}
              
              {/* Tab Content */}
              {activeTab === 'basic' && (
                <BasicInfoTab 
                  data={editedData} 
                  onChange={handleFieldChange} 
                  getValidation={getFieldValidation}
                  getError={getFieldError}
                  getValidationIcon={getValidationIcon}
                />
              )}
              
              {activeTab === 'vendor' && (
                <VendorTab 
                  data={editedData} 
                  onChange={handleFieldChange} 
                  getValidation={getFieldValidation}
                  getError={getFieldError}
                  getValidationIcon={getValidationIcon}
                  vendorMatches={document.vendorMatches}
                  suggestedCustomer={document.suggestedCustomer}
                />
              )}
              
              {activeTab === 'customer' && (
                <CustomerTab 
                  data={editedData} 
                  onChange={handleFieldChange} 
                  getValidation={getFieldValidation}
                  getError={getFieldError}
                  getValidationIcon={getValidationIcon}
                />
              )}
              
              {activeTab === 'items' && (
                <ItemsTab 
                  data={editedData} 
                  onChange={handleFieldChange} 
                  getValidation={getFieldValidation}
                  getError={getFieldError}
                  getValidationIcon={getValidationIcon}
                />
              )}
              
              {activeTab === 'totals' && (
                <TotalsTab 
                  data={editedData} 
                  onChange={handleFieldChange} 
                  getValidation={getFieldValidation}
                  getError={getFieldError}
                  getValidationIcon={getValidationIcon}
                />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={onReject}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Ablehnen
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={!canSave || isProcessing}
                    className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      canSave && !isProcessing
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-400 cursor-not-allowed text-white'
                    }`}
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Speichern</span>
                  </button>
                  
                  {onCreateInvoice && (
                    <button
                      onClick={handleCreateInvoice}
                      disabled={!canSave || isProcessing}
                      className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        canSave && !isProcessing
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-400 cursor-not-allowed text-white'
                      }`}
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Rechnung erstellen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Components
interface TabProps {
  data: ParsedInvoiceData;
  onChange: (field: string, value: string, originalValue?: string) => void;
  getValidation: (field: string) => FieldValidation | undefined;
  getError: (field: string) => ValidationError | undefined;
  getValidationIcon: (validation?: FieldValidation) => React.ReactNode;
}

interface VendorTabProps extends TabProps {
  vendorMatches?: Array<{
    customer: {
      id: string;
      company: string;
      address: string;
      taxId?: string;
    };
    confidence: number;
    matchType: 'exact' | 'fuzzy' | 'partial';
    matchedFields: string[];
  }>;
  suggestedCustomer?: {
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
  };
}

const BasicInfoTab: React.FC<TabProps> = ({ data, onChange, getValidation, getError, getValidationIcon }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-medium text-gray-900 mb-4">Grundinformationen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableField
          label="Rechnungsnummer"
          value={data.invoiceNumber}
          onChange={(value, original) => onChange('invoiceNumber', value, original)}
          validation={getValidation('invoiceNumber')}
          error={getError('invoiceNumber')}
          icon={getValidationIcon(getValidation('invoiceNumber'))}
          required
        />
        <EditableField
          label="Rechnungsdatum"
          value={data.date}
          type="date"
          onChange={(value, original) => onChange('date', value, original)}
          validation={getValidation('date')}
          error={getError('date')}
          icon={getValidationIcon(getValidation('date'))}
          required
        />
        <EditableField
          label="Fälligkeitsdatum"
          value={data.dueDate}
          type="date"
          onChange={(value, original) => onChange('dueDate', value, original)}
          validation={getValidation('dueDate')}
          error={getError('dueDate')}
          icon={getValidationIcon(getValidation('dueDate'))}
        />
      </div>
    </div>
  </div>
);

const VendorTab: React.FC<VendorTabProps> = ({ data, onChange, getValidation, getError, getValidationIcon, vendorMatches, suggestedCustomer }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
        <Building className="w-5 h-5 mr-2" />
        Lieferant
      </h3>
      <div className="space-y-4">
        <EditableField
          label="Firmenname"
          value={data.vendor.name}
          onChange={(value, original) => onChange('vendor.name', value, original)}
          validation={getValidation('vendor.name')}
          error={getError('vendor.name')}
          icon={getValidationIcon(getValidation('vendor.name'))}
          required
        />
        <EditableField
          label="Adresse"
          value={data.vendor.address}
          onChange={(value, original) => onChange('vendor.address', value, original)}
          validation={getValidation('vendor.address')}
          error={getError('vendor.address')}
          icon={getValidationIcon(getValidation('vendor.address'))}
          multiline
        />
        <EditableField
          label="Umsatzsteuer-ID"
          value={data.vendor.taxId}
          onChange={(value, original) => onChange('vendor.taxId', value, original)}
          validation={getValidation('vendor.taxId')}
          error={getError('vendor.taxId')}
          icon={getValidationIcon(getValidation('vendor.taxId'))}
          placeholder="DE123456789"
        />
      </div>
    </div>

    {/* Vendor Matching Results */}
    {vendorMatches && vendorMatches.length > 0 && (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Gefundene Kunden ({vendorMatches.length})
        </h3>
        <div className="space-y-3">
          {vendorMatches.slice(0, 3).map((match, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              match.confidence > 0.8 ? 'border-green-200 bg-green-50' :
              match.confidence > 0.6 ? 'border-yellow-200 bg-yellow-50' :
              'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">{match.customer.company}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      match.matchType === 'exact' ? 'bg-green-100 text-green-800' :
                      match.matchType === 'fuzzy' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {match.matchType === 'exact' ? 'Exakt' : 
                       match.matchType === 'fuzzy' ? 'Unscharf' : 'Teilweise'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{match.customer.address}</p>
                  {match.customer.taxId && (
                    <p className="text-sm text-gray-600 mb-2">USt-IdNr: {match.customer.taxId}</p>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-500">Übereinstimmung:</span>
                      <span className={`text-sm font-medium ${
                        match.confidence > 0.8 ? 'text-green-600' :
                        match.confidence > 0.6 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {Math.round(match.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-500">Felder:</span>
                      <span className="text-sm text-gray-700">
                        {match.matchedFields.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                  Auswählen
                </button>
              </div>
            </div>
          ))}
          
          {vendorMatches.length > 3 && (
            <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
              {vendorMatches.length - 3} weitere Treffer anzeigen
            </button>
          )}
        </div>
      </div>
    )}

    {/* New Customer Suggestion */}
    {suggestedCustomer?.shouldCreate && (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
          Neuen Kunden erstellen
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800">{suggestedCustomer.reason}</p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firmenname
              </label>
              <input
                type="text"
                value={suggestedCustomer.suggestedData.company}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                USt-IdNr
              </label>
              <input
                type="text"
                value={suggestedCustomer.suggestedData.taxId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={suggestedCustomer.suggestedData.address}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              readOnly
            />
          </div>
          <button className="w-full py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
            Neuen Kunden erstellen
          </button>
        </div>
      </div>
    )}
  </div>
);

const CustomerTab: React.FC<TabProps> = ({ data, onChange, getValidation, getError, getValidationIcon }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
        <User className="w-5 h-5 mr-2" />
        Kunde
      </h3>
      <div className="space-y-4">
        <EditableField
          label="Name/Firma"
          value={data.customer.name}
          onChange={(value, original) => onChange('customer.name', value, original)}
          validation={getValidation('customer.name')}
          error={getError('customer.name')}
          icon={getValidationIcon(getValidation('customer.name'))}
        />
        <EditableField
          label="Adresse"
          value={data.customer.address}
          onChange={(value, original) => onChange('customer.address', value, original)}
          validation={getValidation('customer.address')}
          error={getError('customer.address')}
          icon={getValidationIcon(getValidation('customer.address'))}
          multiline
        />
      </div>
    </div>
  </div>
);

const ItemsTab: React.FC<TabProps> = ({ data, onChange }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        Positionen ({data.items.length})
      </h3>
      {data.items.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2 p-2 bg-gray-50 rounded text-sm font-medium text-gray-600">
            <div>Beschreibung</div>
            <div className="text-center">Menge</div>
            <div className="text-right">Einzelpreis</div>
            <div className="text-center">MwSt.</div>
            <div className="text-right">Gesamt</div>
            <div></div>
          </div>
          {data.items.map((item, index) => (
            <div key={index} className="grid grid-cols-6 gap-2 p-2 bg-gray-50 rounded text-sm">
              <div className="truncate">{item.description}</div>
              <div className="text-center">{item.quantity}</div>
              <div className="text-right">€{item.unitPrice.toFixed(2)}</div>
              <div className="text-center">{item.taxRate}%</div>
              <div className="text-right font-medium">€{item.total.toFixed(2)}</div>
              <div className="flex justify-center">
                <button className="text-gray-400 hover:text-blue-600">
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2" />
          <p>Keine Positionen erkannt</p>
        </div>
      )}
    </div>
  </div>
);

const TotalsTab: React.FC<TabProps> = ({ data, onChange, getValidation, getError, getValidationIcon }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2" />
        Beträge
      </h3>
      <div className="space-y-4">
        <EditableField
          label="Nettobetrag"
          value={data.totals.subtotal.toFixed(2)}
          type="number"
          onChange={(value, original) => onChange('totals.subtotal', value, original)}
          validation={getValidation('totals.subtotal')}
          error={getError('totals.subtotal')}
          icon={getValidationIcon(getValidation('totals.subtotal'))}
          step="0.01"
          suffix="€"
        />
        <EditableField
          label="Mehrwertsteuer"
          value={data.totals.taxAmount.toFixed(2)}
          type="number"
          onChange={(value, original) => onChange('totals.taxAmount', value, original)}
          validation={getValidation('totals.taxAmount')}
          error={getError('totals.taxAmount')}
          icon={getValidationIcon(getValidation('totals.taxAmount'))}
          step="0.01"
          suffix="€"
        />
        <EditableField
          label="Gesamtbetrag"
          value={data.totals.total.toFixed(2)}
          type="number"
          onChange={(value, original) => onChange('totals.total', value, original)}
          validation={getValidation('totals.total')}
          error={getError('totals.total')}
          icon={getValidationIcon(getValidation('totals.total'))}
          step="0.01"
          suffix="€"
          required
        />
      </div>
    </div>
  </div>
);

// Editable Field Component
interface EditableFieldProps {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string, originalValue?: string) => void;
  validation?: FieldValidation;
  error?: ValidationError;
  icon?: React.ReactNode;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  step?: string;
  suffix?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, 
  value, 
  type = 'text', 
  onChange, 
  validation,
  error,
  icon,
  required,
  multiline,
  placeholder,
  step,
  suffix
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  
  useEffect(() => {
    setTempValue(value);
  }, [value]);
  
  const handleSave = () => {
    onChange(tempValue, value);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };
  
  const hasError = error?.severity === 'error';
  const hasWarning = error?.severity === 'warning' || (validation && !validation.isValid);
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
        <span>{label} {required && <span className="text-red-500">*</span>}</span>
        {icon}
      </label>
      
      {isEditing ? (
        <div className="flex space-x-2">
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-md text-sm ${
                hasError ? 'border-red-300 focus:border-red-500' : 
                hasWarning ? 'border-yellow-300 focus:border-yellow-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
              autoFocus
              rows={3}
              placeholder={placeholder}
            />
          ) : (
            <div className="flex-1 relative">
              <input
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  hasError ? 'border-red-300 focus:border-red-500' : 
                  hasWarning ? 'border-yellow-300 focus:border-yellow-500' :
                  'border-gray-300 focus:border-blue-500'
                } ${suffix ? 'pr-8' : ''}`}
                autoFocus
                placeholder={placeholder}
                step={step}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              {suffix && (
                <span className="absolute right-3 top-2 text-sm text-gray-500">
                  {suffix}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={`px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 text-sm transition-colors ${
            hasError ? 'border-red-300 bg-red-50' : 
            hasWarning ? 'border-yellow-300 bg-yellow-50' :
            'border-gray-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`${value ? 'text-gray-900' : 'text-gray-400'} ${suffix ? 'mr-6' : ''}`}>
              {value || placeholder || 'Klicken zum Bearbeiten'}
              {suffix && value && <span className="ml-1 text-gray-500">{suffix}</span>}
            </span>
            <Edit className="w-3 h-3 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      )}
      
      {/* Validation info */}
      {validation && (
        <div className="flex items-center justify-between text-xs">
          <span className={`${
            validation.isValid ? 'text-green-600' : 'text-yellow-600'
          }`}>
            Genauigkeit: {Math.round(validation.confidence * 100)}%
          </span>
          {validation.suggestion && (
            <span className="text-gray-500">{validation.suggestion}</span>
          )}
        </div>
      )}
      
      {/* Error message */}
      {(error || validation?.error) && (
        <p className={`text-xs ${
          error?.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {error?.message || validation?.error}
        </p>
      )}
    </div>
  );
};

// Enhanced Validation Summary Component
interface EnhancedValidationSummaryProps {
  errors: ValidationError[];
  onApplyFix: (error: ValidationError, suggestion: CorrectionSuggestion) => void;
  onDismissError: (errorIndex: number) => void;
}

const EnhancedValidationSummary: React.FC<EnhancedValidationSummaryProps> = ({
  errors,
  onApplyFix,
  onDismissError
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  const toggleErrorExpansion = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const infoCount = errors.filter(e => e.severity === 'info').length;

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Validierung & Korrekturvorschläge
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            {errorCount > 0 && (
              <span className="flex items-center text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                {errorCount} Fehler
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center text-yellow-600">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                {warningCount} Warnungen
              </span>
            )}
            {infoCount > 0 && (
              <span className="flex items-center text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                {infoCount} Hinweise
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {errors.map((error, index) => {
          const isExpanded = expandedErrors.has(index);
          const color = getSeverityColor(error.severity);
          const hasEnhancedData = error.enhancedData;
          const autoFixAvailable = hasEnhancedData?.autoFixAvailable;

          return (
            <div key={index} className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`text-${color}-500 mt-0.5`}>
                  {getSeverityIcon(error.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium text-${color}-800`}>
                        {error.message}
                      </p>
                      {error.suggestion && (
                        <p className="text-sm text-gray-600 mt-1">
                          {error.suggestion}
                        </p>
                      )}
                      {hasEnhancedData?.context && (
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Kontext:</strong> {hasEnhancedData.context}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {autoFixAvailable && hasEnhancedData.correctionSuggestions?.[0] && (
                        <button
                          onClick={() => onApplyFix(error, hasEnhancedData.correctionSuggestions[0])}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors flex items-center space-x-1"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Auto-Fix</span>
                        </button>
                      )}
                      
                      {hasEnhancedData && (
                        <button
                          onClick={() => toggleErrorExpansion(index)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onDismissError(index)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && hasEnhancedData && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                      {/* Possible Causes */}
                      {hasEnhancedData.possibleCauses && hasEnhancedData.possibleCauses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <HelpCircle className="w-4 h-4 mr-1" />
                            Mögliche Ursachen:
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {hasEnhancedData.possibleCauses.map((cause, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-gray-400 mr-2 mt-1">•</span>
                                <span>{cause}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Correction Suggestions */}
                      {hasEnhancedData.correctionSuggestions && hasEnhancedData.correctionSuggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-1" />
                            Korrekturvorschläge:
                          </h4>
                          <div className="space-y-2">
                            {hasEnhancedData.correctionSuggestions.map((suggestion, i) => (
                              <div key={i} className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-md">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800">{suggestion.description}</p>
                                  {suggestion.suggestedValue && (
                                    <p className="text-xs text-green-600 mt-1">
                                      <strong>Vorschlag:</strong> {suggestion.suggestedValue}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2">
                                    <span className="text-xs text-gray-500">
                                      Vertrauen: {Math.round(suggestion.confidence * 100)}%
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      suggestion.type === 'format' ? 'bg-blue-100 text-blue-800' :
                                      suggestion.type === 'calculate' ? 'bg-green-100 text-green-800' :
                                      suggestion.type === 'manual' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {suggestion.type}
                                    </span>
                                  </div>
                                </div>
                                
                                {!suggestion.requiresUserInput && suggestion.suggestedValue && (
                                  <button
                                    onClick={() => onApplyFix(error, suggestion)}
                                    className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 transition-colors"
                                  >
                                    Anwenden
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Fields */}
                      {hasEnhancedData.relatedFields && hasEnhancedData.relatedFields.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Verwandte Felder:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {hasEnhancedData.relatedFields.map((field, i) => (
                              <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvoiceReview;