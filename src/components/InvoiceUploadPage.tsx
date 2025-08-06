import React, { useState } from 'react';
import { ArrowLeft, Upload as UploadIcon, Brain, FileCheck } from 'lucide-react';
import InvoiceUpload from './InvoiceUpload';
import InvoiceReview from './InvoiceReview';
import ProcessingStatus, { ProcessingStatusList } from './ProcessingStatus';
import { useInvoiceUpload } from '../hooks/useInvoiceUpload';
import { ProcessingStatus as ProcessingStatusType, UploadedDocument } from '../types/upload';

interface InvoiceUploadPageProps {
  onBack: () => void;
}

const InvoiceUploadPage: React.FC<InvoiceUploadPageProps> = ({ onBack }) => {
  const [reviewingDocument, setReviewingDocument] = useState<UploadedDocument | null>(null);
  
  const {
    uploadedFiles,
    isUploading,
    isProcessing,
    uploadProgress,
    error,
    uploadFiles,
    removeFile,
    updateDocument,
    createInvoiceFromDocument,
    clearError
  } = useInvoiceUpload({
    autoRefresh: true,
    refreshInterval: 2000
  });

  const handleUpload = async (files: File[]) => {
    clearError();
    await uploadFiles(files);
  };

  const handleRemoveFile = async (fileId: string) => {
    await removeFile(fileId);
  };

  const handleReviewDocument = (document: UploadedDocument) => {
    if (document.status === 'completed' && document.parsedData) {
      setReviewingDocument(document);
    }
  };

  const handleSaveReview = async (data: any) => {
    if (reviewingDocument) {
      await updateDocument(reviewingDocument.id, { parsedData: data });
      setReviewingDocument(null);
    }
  };

  const handleCreateInvoice = async (data: any) => {
    if (reviewingDocument) {
      await updateDocument(reviewingDocument.id, { parsedData: data });
      await createInvoiceFromDocument(reviewingDocument.id);
      setReviewingDocument(null);
    }
  };

  const handleRejectDocument = () => {
    setReviewingDocument(null);
  };

  // If reviewing a document, show the review interface
  if (reviewingDocument) {
    return (
      <InvoiceReview
        document={reviewingDocument}
        onSave={handleSaveReview}
        onReject={handleRejectDocument}
        onBack={() => setReviewingDocument(null)}
        onCreateInvoice={handleCreateInvoice}
      />
    );
  }

  const completedFiles = uploadedFiles.filter(file => file.status === 'completed');
  const processingFiles = uploadedFiles.filter(file => file.status === 'processing' || file.status === 'uploading');
  
  // Create mock processing statuses for demonstration
  const activeProcessing: ProcessingStatusType[] = processingFiles.map(file => ({
    documentId: file.id,
    stage: file.status === 'uploading' ? 'upload' : 'ocr',
    progress: file.processingProgress,
    message: file.status === 'uploading' ? 'Datei wird hochgeladen...' : 'OCR-Verarbeitung läuft...',
    timeElapsed: Date.now() - new Date(file.uploadedAt).getTime(),
    estimatedTimeRemaining: (100 - file.processingProgress) * 100
  }));

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
                Rechnungen hochladen & OCR
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Laden Sie Rechnungen hoch und lassen Sie sie automatisch verarbeiten
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Heute verarbeitet</div>
              <div className="text-lg font-semibold text-green-600">
                {completedFiles.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Upload Area */}
          <div className="xl:col-span-2 space-y-8">
            {/* Features Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Intelligente Rechnungsverarbeitung
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UploadIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Einfacher Upload</h3>
                    <p className="text-sm text-gray-600">
                      Drag & Drop oder Klick zum Hochladen von PDF, JPG, PNG, TIFF
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Brain className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">KI-Extraktion</h3>
                    <p className="text-sm text-gray-600">
                      Automatische Erkennung von Rechnungsdaten mit 95%+ Genauigkeit
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Validierung</h3>
                    <p className="text-sm text-gray-600">
                      Automatische Prüfung und Korrekturvorschläge
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 font-medium">Fehler bei der Verarbeitung</span>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Upload Component */}
            <InvoiceUpload
              onUpload={handleUpload}
              onRemoveFile={handleRemoveFile}
              onReviewDocument={handleReviewDocument}
              uploadedFiles={uploadedFiles}
              isProcessing={isUploading || isProcessing}
            />
          </div>

          {/* Sidebar - Processing Status */}
          <div className="space-y-6">
            {/* Real-time Processing */}
            {activeProcessing.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Live-Verarbeitung
                </h3>
                <ProcessingStatusList statuses={activeProcessing} />
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiken
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gesamt hochgeladen</span>
                  <span className="font-medium">{uploadedFiles.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Erfolgreich verarbeitet</span>
                  <span className="font-medium text-green-600">
                    {completedFiles.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Bearbeitung</span>
                  <span className="font-medium text-blue-600">
                    {uploadedFiles.filter(f => f.status === 'processing').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fehlgeschlagen</span>
                  <span className="font-medium text-red-600">
                    {uploadedFiles.filter(f => f.status === 'failed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-md font-semibold text-blue-900 mb-3">
                Tipps für beste Ergebnisse
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Verwenden Sie hochauflösende Scans (300 DPI oder höher)
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Stellen Sie sicher, dass der Text scharf und lesbar ist
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  PDF-Dateien funktionieren oft am besten
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Vermeiden Sie stark komprimierte Bilder
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceUploadPage;