import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, CheckCircle, Loader2, Eye, X, FileText, Edit3 } from 'lucide-react';
import { UploadedDocument, UploadConfig } from '../types/upload';

interface InvoiceUploadProps {
  onUpload: (files: File[]) => void;
  onRemoveFile?: (fileId: string) => void;
  onReviewDocument?: (document: UploadedDocument) => void;
  uploadedFiles?: UploadedDocument[];
  isProcessing?: boolean;
  config?: Partial<UploadConfig>;
}

const defaultConfig: UploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'],
  enableVirusScan: false, // Placeholder for future implementation
  enableAI: true,
  confidenceThreshold: 0.7
};

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ 
  onUpload, 
  onRemoveFile,
  onReviewDocument,
  uploadedFiles = [],
  isProcessing = false,
  config = {}
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  
  const finalConfig = { ...defaultConfig, ...config };
  
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!finalConfig.allowedTypes.includes(file.type)) {
      return `Dateityp ${file.type} wird nicht unterstützt. Erlaubte Typen: PDF, JPG, PNG, TIFF`;
    }
    
    // Check file size
    if (file.size > finalConfig.maxFileSize) {
      const maxSizeMB = Math.round(finalConfig.maxFileSize / 1024 / 1024);
      return `Datei zu groß. Maximum: ${maxSizeMB}MB`;
    }
    
    // Check file name
    if (file.name.length > 255) {
      return 'Dateiname zu lang (max. 255 Zeichen)';
    }
    
    return null;
  };
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const errors: string[] = [];
    
    // Handle rejected files
    rejectedFiles.forEach(rejected => {
      const { file, errors: fileErrors } = rejected;
      fileErrors.forEach((error: any) => {
        errors.push(`${file.name}: ${error.message}`);
      });
    });
    
    // Validate accepted files
    const validFiles: File[] = [];
    acceptedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });
    
    // Check total file count
    if (uploadedFiles.length + validFiles.length > finalConfig.maxFiles) {
      errors.push(`Maximale Anzahl von ${finalConfig.maxFiles} Dateien überschritten`);
      return;
    }
    
    setUploadErrors(errors);
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [onUpload, uploadedFiles.length, finalConfig]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxFiles: finalConfig.maxFiles,
    maxSize: finalConfig.maxFileSize,
    disabled: isProcessing,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  });
  
  const clearErrors = () => {
    setUploadErrors([]);
  };
  
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive || dragActive 
            ? 'border-green-400 bg-green-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <Upload className={`w-12 h-12 mb-4 transition-colors ${
            isDragActive ? 'text-green-500' : 'text-gray-400'
          }`} />
          
          {isDragActive ? (
            <div>
              <p className="text-lg font-medium text-green-600 mb-2">
                Dateien hier ablegen...
              </p>
              <p className="text-sm text-green-500">
                Lassen Sie die Dateien los, um sie hochzuladen
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Rechnungen hier ablegen oder klicken zum Auswählen
              </p>
              <p className="text-sm text-gray-500 mb-1">
                PDF, JPG, PNG, TIFF bis {Math.round(finalConfig.maxFileSize / 1024 / 1024)}MB
              </p>
              <p className="text-sm text-gray-500">
                Maximal {finalConfig.maxFiles} Dateien gleichzeitig
              </p>
            </div>
          )}
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-blue-700 font-medium">
                Dateien werden verarbeitet...
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-red-800 font-medium mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Upload-Fehler ({uploadErrors.length})
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {uploadErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={clearErrors}
              className="text-red-400 hover:text-red-600 ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Processing Status */}
      {isProcessing && uploadedFiles.some(file => file.status === 'processing') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-blue-700 font-medium">
              OCR-Verarbeitung läuft...
            </span>
          </div>
          <div className="mt-2">
            <div className="bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadedFiles
                    .filter(f => f.status === 'processing')
                    .reduce((sum, f) => sum + f.processingProgress, 0) / 
                    uploadedFiles.filter(f => f.status === 'processing').length || 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Verarbeitete Dateien ({uploadedFiles.length})
            </h3>
            <div className="text-sm text-gray-500">
              {uploadedFiles.filter(f => f.status === 'completed').length} abgeschlossen,{' '}
              {uploadedFiles.filter(f => f.status === 'processing').length} in Bearbeitung,{' '}
              {uploadedFiles.filter(f => f.status === 'failed').length} fehlgeschlagen
            </div>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <UploadedFileCard 
                key={file.id} 
                file={file} 
                onRemove={onRemoveFile}
                onReview={onReviewDocument}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Upload Instructions */}
      {uploadedFiles.length === 0 && !isProcessing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">
            Unterstützte Dateiformate
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <File className="w-4 h-4 text-red-500" />
              <span>PDF-Dokumente</span>
            </div>
            <div className="flex items-center space-x-2">
              <File className="w-4 h-4 text-blue-500" />
              <span>JPEG/JPG-Bilder</span>
            </div>
            <div className="flex items-center space-x-2">
              <File className="w-4 h-4 text-green-500" />
              <span>PNG-Bilder</span>
            </div>
            <div className="flex items-center space-x-2">
              <File className="w-4 h-4 text-purple-500" />
              <span>TIFF-Bilder</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>• Maximale Dateigröße: {Math.round(finalConfig.maxFileSize / 1024 / 1024)}MB pro Datei</p>
            <p>• Maximale Anzahl: {finalConfig.maxFiles} Dateien pro Upload</p>
            <p>• Optimale Qualität: 300 DPI oder höher für beste OCR-Ergebnisse</p>
          </div>
        </div>
      )}
    </div>
  );
};

// File Card Component
const UploadedFileCard: React.FC<{ 
  file: UploadedDocument; 
  onRemove?: (fileId: string) => void;
  onReview?: (document: UploadedDocument) => void;
}> = ({ file, onRemove, onReview }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return 'Wird hochgeladen...';
      case 'processing':
        return 'Wird verarbeitet...';
      case 'completed':
        return 'Abgeschlossen';
      case 'failed':
        return 'Fehler';
      default:
        return 'Unbekannt';
    }
  };
  
  const getStatusColor = () => {
    switch (file.status) {
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      case 'processing':
        return 'border-yellow-200 bg-yellow-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 transition-all ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{file.filename}</p>
            <p className="text-sm text-gray-500">
              {(file.fileSize / 1024 / 1024).toFixed(1)} MB • {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Progress bar for processing files */}
          {file.status === 'processing' && (
            <div className="w-24">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${file.processingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {file.processingProgress}%
              </p>
            </div>
          )}
          
          {/* Review button for completed documents */}
          {onReview && file.status === 'completed' && file.parsedData && (
            <button
              onClick={() => onReview(file)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              title="Daten überprüfen und bearbeiten"
            >
              <Edit3 className="w-3 h-3" />
              <span>Überprüfen</span>
            </button>
          )}
          
          {/* Details toggle */}
          {(file.ocrResult || file.validationErrors) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-gray-600"
              title="Details anzeigen"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          {/* Remove button */}
          {onRemove && (file.status === 'completed' || file.status === 'failed') && (
            <button
              onClick={() => onRemove(file.id)}
              className="text-gray-400 hover:text-red-600"
              title="Datei entfernen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {/* OCR Confidence */}
          {file.ocrResult && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">OCR Genauigkeit:</span>
                <span className={`text-sm font-medium ${
                  file.ocrResult.confidence > 0.8 ? 'text-green-600' :
                  file.ocrResult.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(file.ocrResult.confidence * 100)}%
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${
                    file.ocrResult.confidence > 0.8 ? 'bg-green-500' :
                    file.ocrResult.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${file.ocrResult.confidence * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Vendor Matching Results */}
          {file.vendorMatches && file.vendorMatches.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">
                Lieferantenabgleich: {file.vendorMatches.length} Treffer gefunden
              </p>
              <div className="space-y-1">
                {file.vendorMatches.slice(0, 2).map((match, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-center justify-between">
                    <span>{match.customer.company}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      match.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      match.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {Math.round(match.confidence * 100)}%
                    </span>
                  </div>
                ))}
                {file.vendorMatches.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{file.vendorMatches.length - 2} weitere...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Customer Suggestion */}
          {file.suggestedCustomer?.shouldCreate && (
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1">
                Neuer Kunde vorgeschlagen
              </p>
              <p className="text-xs text-gray-600">
                {file.suggestedCustomer.reason}
              </p>
            </div>
          )}

          {/* Validation Errors */}
          {file.validationErrors && file.validationErrors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">
                Validierungsfehler:
              </p>
              <div className="space-y-1">
                {file.validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 flex items-start">
                    <span className="text-red-400 mr-2 mt-0.5">•</span>
                    <div>
                      <span>{error.message}</span>
                      {error.suggestion && (
                        <span className="text-gray-600 ml-2">
                          (Vorschlag: {error.suggestion})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Processing Steps */}
          {file.processingSteps && file.processingSteps.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Verarbeitungsschritte:
              </p>
              <div className="space-y-1">
                {file.processingSteps.map((step, index) => (
                  <div key={index} className="text-sm flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'running' ? 'bg-yellow-500' :
                      step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-gray-600">{step.name}</span>
                    {step.duration && (
                      <span className="text-gray-400">({step.duration}ms)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceUpload;