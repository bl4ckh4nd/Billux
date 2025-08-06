import { ParsedInvoiceData } from '../types/upload';

export class InvoiceParser {
  // Enhanced German invoice patterns with multiple vendor formats
  private patterns = {
    // Enhanced invoice number patterns for multiple German formats
    invoiceNumber: [
      /(?:rechnung(?:s?nummer)?|invoice|re)[:\s-]*([a-z0-9\-\/\._]+)/i,
      /(?:rechnungs?nr\.?|inv\.?\s*nr\.?|rg\.?\s*nr\.?)[:\s]*([a-z0-9\-\/\._]+)/i,
      /(?:belegnr\.?|beleg)[:\s]*([a-z0-9\-\/\._]+)/i,
      /(?:faktura|bill)[:\s-]*([a-z0-9\-\/\._]+)/i,
      /([A-Z]{1,4}[-\/]?\d{4,}[-\/]?\d*)/g, // Pattern like "RE-2024-001" or "INV/24/123"
    ],
    
    // Enhanced date patterns for multiple German formats
    date: [
      /(?:rechnung(?:s?datum)?|datum|date|belegdatum)[:\s]*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
      /(?:erstellt\s+am|vom|ausgestellt\s+am)[:\s]*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
      /(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})(?:\s*rechnung|\s*invoice)/i,
    ],
    
    // Enhanced due date patterns
    dueDate: [
      /(?:fällig(?:keitsdatum)?|zahlbar|due|zahlung\s+bis)[:\s]*(?:bis|until|am)?[:\s]*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
      /(?:zahlungsziel|payment\s+(?:due|target))[:\s]*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
      /(?:bitte\s+zahlen\s+bis|zu\s+zahlen\s+bis)[:\s]*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
    ],
    
    // Enhanced amount patterns for German invoices
    amount: [
      /(?:(?:rechnungs?)?betrag|total|gesamt(?:summe)?|summe|endbetrag)[:\s]*(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})/i,
      /(?:zu\s+zahlen|zahlbetrag)[:\s]*(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})/i,
      /(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})\s*€?\s*(?:gesamt|total|summe)/i,
    ],
    amountEuro: /(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})\s*€/g,
    
    // Enhanced German Tax ID patterns
    taxId: [
      /(?:ust(?:euer)?[-\s]?(?:id|nr)|tax[-\s]?(?:id|nr)|steuer[-\s]?nr)[:\s]*([a-z]{2}\d{9})/i,
      /(?:umsatzsteuer[-\s]?(?:identifikationsnummer|id))[:\s]*([a-z]{2}\d{9})/i,
      /(de\d{9})/i,
      /(?:vat[-\s]?(?:id|nr))[:\s]*([a-z]{2}\d{9})/i,
    ],
    
    // VAT rate patterns
    vatRate: /(\d{1,2}(?:[,\.]\d{1,2})?)\s*%/g,
    
    // Enhanced German company name patterns with more legal forms
    companyName: [
      /^([A-ZÄÖÜ][a-zäöüß\s&.,-]+(?:GmbH|AG|KG|OHG|UG|e\.K\.|mbH|gGmbH|eG|SE|KGaA))/m,
      /([A-ZÄÖÜ][a-zäöüß\s&.,-]+(?:GmbH|AG|KG|OHG|UG|e\.K\.|mbH|gGmbH|eG|SE|KGaA))/g,
      /([A-ZÄÖÜ][A-ZÄÖÜ\s&.,-]{2,})/g, // Fallback for all caps company names
    ],
    
    // German postal code pattern
    postalCode: /(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/g,
    
    // Address patterns
    address: /(\d{5}\s+[A-ZÄÖÜ][a-zäöüß\s-]+)/g,
    street: /([A-ZÄÖÜ][a-zäöüß\s.-]+\s+\d+[a-z]?)/g,
    
    // Euro amounts
    euros: /(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})\s*€?/g,
    
    // Line item patterns
    quantity: /(\d+(?:[,\.]\d+)?)\s*(?:stk|stück|pcs|pieces|x)/i,
    unitPrice: /(?:einzelpreis|unit\s*price|stückpreis)[:\s]*(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})/i,
    
    // Tax patterns
    mwst: /(?:mwst|mehrwertsteuer|vat)[:\s]*(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})/i,
    netAmount: /(?:netto|net|subtotal)[:\s]*(\d{1,3}(?:[,\.]\d{3})*[,\.]\d{2})/i
  };
  
  async parseInvoice(ocrText: string): Promise<ParsedInvoiceData> {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const result: ParsedInvoiceData = {
      invoiceNumber: this.extractInvoiceNumber(ocrText),
      date: this.extractDate(ocrText),
      dueDate: this.extractDueDate(ocrText),
      vendor: this.extractVendorInfo(ocrText),
      customer: this.extractCustomerInfo(ocrText),
      items: this.extractLineItems(ocrText),
      totals: this.extractTotals(ocrText),
      confidence: 0
    };
    
    result.confidence = this.calculateOverallConfidence(result);
    
    return result;
  }
  
  private extractInvoiceNumber(text: string): string {
    // Try each pattern in the array
    for (const pattern of this.patterns.invoiceNumber) {
      const match = text.match(pattern);
      if (match) {
        const candidate = match[1] || match[0];
        if (candidate && candidate.length >= 3) { // Minimum length check
          return candidate.trim();
        }
      }
    }
    return '';
  }
  
  private extractDate(text: string): string {
    // Try each date pattern
    for (const pattern of this.patterns.date) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.normalizeGermanDate(match[1]);
      }
    }
    return '';
  }
  
  private extractDueDate(text: string): string {
    // Try each due date pattern
    for (const pattern of this.patterns.dueDate) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.normalizeGermanDate(match[1]);
      }
    }
    return '';
  }
  
  private extractVendorInfo(text: string): { name: string; address: string; taxId: string } {
    // Extract company name using enhanced patterns
    let companyName = '';
    for (const pattern of this.patterns.companyName) {
      const match = text.match(pattern);
      if (match) {
        companyName = match[1] || match[0];
        if (companyName && companyName.length > 3) {
          break; // Use the first valid match
        }
      }
    }
    
    // Extract tax ID using enhanced patterns  
    let taxId = '';
    for (const pattern of this.patterns.taxId) {
      const match = text.match(pattern);
      if (match) {
        taxId = match[1] || match[0];
        if (taxId && /^[A-Z]{2}\d{9}$/.test(taxId.toUpperCase())) {
          taxId = taxId.toUpperCase();
          break;
        }
      }
    }
    
    // Extract address using postal code pattern
    const addressMatches = text.match(this.patterns.address);
    let address = '';
    if (addressMatches && addressMatches.length > 0) {
      address = addressMatches[0];
    }
    
    return {
      name: companyName.trim(),
      address: address.trim(),
      taxId: taxId
    };
  }
  
  private extractCustomerInfo(text: string): { name: string; address: string } {
    // Extract customer information (usually after "Rechnung an:" or similar)
    const customerSection = text.match(/(?:rechnung\s+an|bill\s+to|kunde)[:\s]*(.*?)(?:\n\n|\r\n\r\n|rechnung)/is);
    
    if (customerSection) {
      const lines = customerSection[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
      return {
        name: lines[0] || '',
        address: lines.slice(1).join(', ')
      };
    }
    
    return { name: '', address: '' };
  }
  
  private extractLineItems(text: string): Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }> {
    const items: any[] = [];
    const lines = text.split('\n');
    
    // Look for table-like structures
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip headers and empty lines
      if (!line || /(?:pos|artikel|beschreibung|menge|preis|total|gesamt)/i.test(line)) {
        continue;
      }
      
      // Try to parse line item (description, quantity, price, total)
      const amounts = line.match(this.patterns.euros);
      const numbers = line.match(/\d+(?:[,\.]\d+)?/g);
      
      if (amounts && amounts.length >= 2) {
        // Remove numbers and currency symbols to get description
        const description = line
          .replace(/\d+(?:[,\.]\d+)?/g, '')
          .replace(/€/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (description.length > 3) { // Only add if description is meaningful
          items.push({
            description,
            quantity: numbers ? parseFloat(numbers[0].replace(',', '.')) : 1,
            unitPrice: this.parseGermanNumber(amounts[0]),
            taxRate: 19, // Default German VAT
            total: this.parseGermanNumber(amounts[amounts.length - 1])
          });
        }
      }
    }
    
    return items;
  }
  
  private extractTotals(text: string): { subtotal: number; taxAmount: number; total: number } {
    // Extract total amount using enhanced patterns
    let total = 0;
    for (const pattern of this.patterns.amount) {
      const match = text.match(pattern);
      if (match && match[1]) {
        total = this.parseGermanNumber(match[1]);
        if (total > 0) break;
      }
    }
    
    // Extract VAT amount
    const vatMatch = text.match(this.patterns.mwst);
    const taxAmount = vatMatch ? this.parseGermanNumber(vatMatch[1]) : 0;
    
    // Extract net amount
    const netMatch = text.match(this.patterns.netAmount);
    let subtotal = netMatch ? this.parseGermanNumber(netMatch[1]) : 0;
    
    // Smart calculation if missing values
    if (total > 0 && subtotal <= 0 && taxAmount <= 0) {
      // Assume 19% VAT and calculate backwards
      subtotal = total / 1.19;
      const calculatedTax = total - subtotal;
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(calculatedTax * 100) / 100,
        total: total
      };
    } else if (total > 0 && subtotal > 0 && taxAmount <= 0) {
      // Calculate tax from total and subtotal
      const calculatedTax = total - subtotal;
      return {
        subtotal: subtotal,
        taxAmount: Math.round(calculatedTax * 100) / 100,
        total: total
      };
    } else if (subtotal > 0 && taxAmount > 0 && total <= 0) {
      // Calculate total from subtotal and tax
      const calculatedTotal = subtotal + taxAmount;
      return {
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: Math.round(calculatedTotal * 100) / 100
      };
    }
    
    return {
      subtotal: Math.max(0, subtotal),
      taxAmount: Math.max(0, taxAmount),
      total: Math.max(0, total)
    };
  }
  
  private parseGermanNumber(numberStr: string): number {
    // Handle German number format (1.234,56) and convert to float
    const cleaned = numberStr.replace(/[^\d,.-]/g, '');
    
    // Check if it's German format (period as thousands separator, comma as decimal)
    if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    
    // Otherwise treat as standard format
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  
  private normalizeGermanDate(dateStr: string): string {
    // Convert various German date formats to ISO format (YYYY-MM-DD)
    const parts = dateStr.split(/[\.\-\/]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      
      // Handle 2-digit years
      if (year.length === 2) {
        const currentYear = new Date().getFullYear();
        const century = Math.floor(currentYear / 100) * 100;
        const yearNum = parseInt(year);
        year = String(yearNum + century);
        
        // If the year is more than 50 years in the future, assume previous century
        if (parseInt(year) > currentYear + 50) {
          year = String(parseInt(year) - 100);
        }
      }
      
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }
  
  private calculateOverallConfidence(data: ParsedInvoiceData): number {
    let score = 0;
    let maxScore = 0;
    
    // Check each field and assign confidence scores
    if (data.invoiceNumber) { score += 20; }
    maxScore += 20;
    
    if (data.date) { score += 15; }
    maxScore += 15;
    
    if (data.vendor.name) { score += 15; }
    maxScore += 15;
    
    if (data.totals.total > 0) { score += 25; }
    maxScore += 25;
    
    if (data.items.length > 0) { score += 15; }
    maxScore += 15;
    
    if (data.vendor.taxId) { score += 10; }
    maxScore += 10;
    
    return Math.min(score / maxScore, 0.95);
  }
  
  // Utility method to validate extracted data
  validateParsedData(data: ParsedInvoiceData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.invoiceNumber) {
      errors.push('Rechnungsnummer fehlt');
    }
    
    if (!data.date) {
      errors.push('Rechnungsdatum fehlt');
    }
    
    if (data.totals.total <= 0) {
      errors.push('Gesamtbetrag ungültig');
    }
    
    if (!data.vendor.name) {
      errors.push('Lieferantenname fehlt');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}