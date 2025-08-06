// Add ZuGFERD option to types
export interface PdfGenerationOptions {
  template: 'invoice';
  documentId: string;
  language: string;
  includeZugferd?: boolean;
}

export interface PdfPreviewData {
  url: string;
  expiresAt: number;
}
