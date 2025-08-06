import type { SupportedLanguage } from '../types/i18n';

// PDF Translation dictionaries
const pdfTranslations = {
  de: {
    // Invoice types
    'Standard': 'Rechnung',
    'Abschlag': 'Abschlagsrechnung',
    'Schlussrechnung': 'Schlussrechnung',
    'Storno': 'Stornorechnung',
    'Gutschrift': 'Gutschrift',
    
    // PDF content
    'invoiceNumber': 'Rechnungsnummer:',
    'date': 'Datum:',
    'dueDate': 'Fälligkeitsdatum:',
    'customer': 'Kunde:',
    'items': 'Rechnungspositionen',
    'position': 'Pos.',
    'description': 'Beschreibung',
    'quantity': 'Menge',
    'unit': 'Einheit',
    'unitPrice': 'Einzelpreis',
    'totalPrice': 'Gesamtpreis',
    'netAmount': 'Nettobetrag:',
    'taxAmount': 'MwSt. {{rate}}%:',
    'grossAmount': 'Gesamtbetrag:',
    'retentionFee': 'Sicherheitseinbehalt ({{rate}}%):',
    'paymentTerms': 'Zahlungsbedingungen:',
    'bankDetails': 'Bankverbindung:',
    'footer': 'Vielen Dank für Ihr Vertrauen!',
    'previousInvoices': 'Bisherige Abschlagsrechnungen:',
    'vatIdLabel': 'USt-IdNr.:',
    'taxIdLabel': 'Steuernr.:',
    'companyAddress': 'Firmenanschrift',
    'defaultItem': 'Standardposition',
    'totalNet': 'Nettobetrag',
    'totalTax': 'MwSt. gesamt',
    'totalGross': 'Gesamtbetrag',
    'payoutAmount': 'Auszahlungsbetrag:',
    
    // Payment terms
    'paymentTermsText': 'Zahlbar innerhalb von {{days}} Tagen ohne Abzug.',
    'paymentBankDetails': 'Bankverbindung für Überweisungen:',
    
    // ZuGFERD
    'zugferdNote': 'Diese Rechnung enthält strukturierte Daten (ZuGFERD/Factur-X) für die elektronische Verarbeitung.',
  },
  en: {
    // Invoice types
    'Standard': 'Invoice',
    'Abschlag': 'Down Payment Invoice',
    'Schlussrechnung': 'Final Invoice',
    'Storno': 'Cancellation Invoice',
    'Gutschrift': 'Credit Note',
    
    // PDF content
    'invoiceNumber': 'Invoice Number:',
    'date': 'Date:',
    'dueDate': 'Due Date:',
    'customer': 'Customer:',
    'items': 'Invoice Items',
    'position': 'Pos.',
    'description': 'Description',
    'quantity': 'Quantity',
    'unit': 'Unit',
    'unitPrice': 'Unit Price',
    'totalPrice': 'Total Price',
    'netAmount': 'Net Amount:',
    'taxAmount': 'VAT {{rate}}%:',
    'grossAmount': 'Total Amount:',
    'retentionFee': 'Retention Fee ({{rate}}%):',
    'paymentTerms': 'Payment Terms:',
    'bankDetails': 'Bank Details:',
    'footer': 'Thank you for your business!',
    'previousInvoices': 'Previous Down Payment Invoices:',
    'vatIdLabel': 'VAT ID:',
    'taxIdLabel': 'Tax ID:',
    'companyAddress': 'Company Address',
    'defaultItem': 'Standard Item',
    'totalNet': 'Net Amount',
    'totalTax': 'Total VAT',
    'totalGross': 'Total Amount',
    'payoutAmount': 'Payout Amount:',
    
    // Payment terms
    'paymentTermsText': 'Payment due within {{days}} days.',
    'paymentBankDetails': 'Bank details for wire transfers:',
    
    // ZuGFERD
    'zugferdNote': 'This invoice contains structured data (ZuGFERD/Factur-X) for electronic processing.',
  },
};

// Helper function to get translated text for PDF generation
export const getPdfTranslation = (key: string, language: SupportedLanguage = 'de', params?: Record<string, any>): string => {
  const translations = pdfTranslations[language];
  let translation = translations[key] || key;
  
  // Simple parameter replacement
  if (params) {
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
  }
  
  return translation;
};

// Helper function to get invoice type translation
export const getInvoiceTypeTranslation = (type: string, language: SupportedLanguage = 'de'): string => {
  return getPdfTranslation(type, language);
};

// Helper function to format currency based on language
export const formatPdfCurrency = (amount: number, language: SupportedLanguage = 'de'): string => {
  if (language === 'de') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
};

// Helper function to format date based on language
export const formatPdfDate = (date: string, language: SupportedLanguage = 'de'): string => {
  if (language === 'de') {
    return new Date(date).toLocaleDateString('de-DE');
  } else {
    return new Date(date).toLocaleDateString('en-US');
  }
};

export default pdfTranslations;