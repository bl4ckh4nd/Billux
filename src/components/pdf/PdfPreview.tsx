import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download } from 'lucide-react';
import { usePdfPreview, useDownloadPdf } from '../../hooks/usePdfGeneration';
import type { PdfGenerationOptions } from '../../types/pdf';

interface PdfPreviewProps {
  options: PdfGenerationOptions;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ options }) => {
  const [zoom, setZoom] = useState(1);
  const { data: preview, isLoading } = usePdfPreview(options);
  const downloadPdf = useDownloadPdf();

  if (isLoading) {
    return <div className="w-full h-96 flex items-center justify-center">Lade Vorschau...</div>;
  }

  if (!preview?.url) {
    return <div className="w-full h-96 flex items-center justify-center">Fehler beim Laden der Vorschau</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => downloadPdf.mutate(options)}
          className="btn-primary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          PDF herunterladen
        </button>
      </div>
      
      <div className="overflow-auto p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <iframe
            src={preview.url}
            className="w-[21cm] h-[29.7cm] bg-white shadow-lg"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
