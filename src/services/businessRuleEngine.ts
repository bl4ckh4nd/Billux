import { ParsedInvoiceData, ValidationError } from '../types/upload';
import { Customer } from '../types/customer';
import { Invoice } from '../types/invoice';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'legal' | 'financial' | 'format' | 'business';
  severity: 'error' | 'warning' | 'info';
  validate: (data: ParsedInvoiceData, context?: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  existingCustomers?: Customer[];
  existingInvoices?: Invoice[];
  companySettings?: any;
  currentDate?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
  field?: string;
  metadata?: Record<string, any>;
}

export class BusinessRuleEngine {
  private rules: BusinessRule[] = [];

  constructor() {
    this.initializeGermanBusinessRules();
  }

  private initializeGermanBusinessRules(): void {
    // Legal compliance rules
    this.rules.push({
      id: 'german-invoice-number-format',
      name: 'Deutsche Rechnungsnummer Format',
      description: 'Rechnungsnummer muss eindeutig und fortlaufend sein',
      category: 'legal',
      severity: 'warning',
      validate: (data) => {
        if (!data.invoiceNumber) {
          return { isValid: false, message: 'Rechnungsnummer fehlt', field: 'invoiceNumber' };
        }
        
        // Check if format is reasonable for German invoices
        const formatCheck = /^[A-Z]{0,4}[-\/]?\d{4,}/.test(data.invoiceNumber);
        if (!formatCheck) {
          return {
            isValid: false,
            message: 'Ungewöhnliches Rechnungsnummernformat',
            suggestion: 'Deutsche Rechnungsnummern sollten fortlaufend und eindeutig sein (z.B. RE-2024-001)',
            field: 'invoiceNumber'
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'german-tax-id-validation',
      name: 'Deutsche USt-IdNr Validierung',
      description: 'Umsatzsteuer-Identifikationsnummer muss deutschem Format entsprechen',
      category: 'legal',
      severity: 'error',
      validate: (data) => {
        if (!data.vendor.taxId) {
          return {
            isValid: false,
            message: 'USt-IdNr fehlt',
            suggestion: 'Deutsche USt-IdNr beginnt mit DE und hat 9 Ziffern',
            field: 'vendor.taxId'
          };
        }
        
        const germanTaxIdPattern = /^DE\d{9}$/;
        if (!germanTaxIdPattern.test(data.vendor.taxId)) {
          return {
            isValid: false,
            message: 'Ungültige deutsche USt-IdNr',
            suggestion: 'Format: DE123456789',
            field: 'vendor.taxId'
          };
        }
        
        // Additional checksum validation could go here
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'german-vat-calculation',
      name: 'Deutsche MwSt-Berechnung',
      description: 'Mehrwertsteuer muss korrekt berechnet sein (19% Standard)',
      category: 'financial',
      severity: 'error',
      validate: (data) => {
        if (data.totals.subtotal <= 0 || data.totals.total <= 0) {
          return { isValid: false, message: 'Beträge ungültig', field: 'totals' };
        }
        
        // Check 19% VAT calculation
        const expectedTax19 = Math.round((data.totals.subtotal * 0.19) * 100) / 100;
        const expectedTax7 = Math.round((data.totals.subtotal * 0.07) * 100) / 100;
        
        const taxDifference19 = Math.abs(data.totals.taxAmount - expectedTax19);
        const taxDifference7 = Math.abs(data.totals.taxAmount - expectedTax7);
        
        if (taxDifference19 <= 0.02) {
          return { isValid: true, metadata: { vatRate: 19 } };
        } else if (taxDifference7 <= 0.02) {
          return { isValid: true, metadata: { vatRate: 7 } };
        }
        
        // Check if total calculation is correct
        const expectedTotal = data.totals.subtotal + data.totals.taxAmount;
        const totalDifference = Math.abs(data.totals.total - expectedTotal);
        
        if (totalDifference > 0.02) {
          return {
            isValid: false,
            message: 'MwSt-Berechnung fehlerhaft',
            suggestion: `Erwartet bei 19%: ${expectedTax19.toFixed(2)}€, bei 7%: ${expectedTax7.toFixed(2)}€`,
            field: 'totals.taxAmount'
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'invoice-date-validation',
      name: 'Rechnungsdatum Validierung',
      description: 'Rechnungsdatum muss plausibel sein',
      category: 'format',
      severity: 'warning',
      validate: (data, context) => {
        if (!data.date) {
          return { isValid: false, message: 'Rechnungsdatum fehlt', field: 'date' };
        }
        
        const invoiceDate = new Date(data.date);
        const currentDate = context?.currentDate || new Date();
        
        // Check if date is not in the future
        if (invoiceDate > currentDate) {
          return {
            isValid: false,
            message: 'Rechnungsdatum liegt in der Zukunft',
            field: 'date'
          };
        }
        
        // Check if date is not too old (more than 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);
        
        if (invoiceDate < twoYearsAgo) {
          return {
            isValid: false,
            message: 'Rechnungsdatum sehr alt (älter als 2 Jahre)',
            severity: 'warning',
            field: 'date'
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'due-date-validation',
      name: 'Fälligkeitsdatum Validierung',
      description: 'Fälligkeitsdatum muss nach Rechnungsdatum liegen',
      category: 'business',
      severity: 'warning',
      validate: (data) => {
        if (!data.dueDate || !data.date) {
          return { isValid: true }; // Optional field
        }
        
        const invoiceDate = new Date(data.date);
        const dueDate = new Date(data.dueDate);
        
        if (dueDate <= invoiceDate) {
          return {
            isValid: false,
            message: 'Fälligkeitsdatum muss nach Rechnungsdatum liegen',
            field: 'dueDate'
          };
        }
        
        // Check for reasonable payment terms (max 90 days)
        const daysDifference = Math.ceil((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 90) {
          return {
            isValid: false,
            message: 'Ungewöhnlich lange Zahlungsfrist (über 90 Tage)',
            suggestion: 'Übliche Zahlungsfristen: 14, 30 oder 60 Tage',
            field: 'dueDate'
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'minimum-amount-validation',
      name: 'Mindestbetrag Validierung',
      description: 'Rechnungsbetrag muss mindestens 0,01€ betragen',
      category: 'financial',
      severity: 'error',
      validate: (data) => {
        if (data.totals.total < 0.01) {
          return {
            isValid: false,
            message: 'Rechnungsbetrag zu niedrig',
            field: 'totals.total'
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'vendor-completeness',
      name: 'Lieferanten-Vollständigkeit',
      description: 'Lieferanteninformationen müssen vollständig sein',
      category: 'business',
      severity: 'warning',
      validate: (data) => {
        const missing = [];
        
        if (!data.vendor.name || data.vendor.name.length < 2) {
          missing.push('Firmenname');
        }
        
        if (!data.vendor.address || data.vendor.address.length < 10) {
          missing.push('vollständige Adresse');
        }
        
        if (!data.vendor.taxId) {
          missing.push('USt-IdNr');
        }
        
        if (missing.length > 0) {
          return {
            isValid: false,
            message: `Fehlende Lieferanteninformationen: ${missing.join(', ')}`,
            field: 'vendor'
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'duplicate-invoice-check',
      name: 'Duplikat-Prüfung',
      description: 'Rechnung sollte nicht bereits existieren',
      category: 'business',
      severity: 'warning',
      validate: (data, context) => {
        if (!context?.existingInvoices || !data.invoiceNumber) {
          return { isValid: true };
        }
        
        const duplicate = context.existingInvoices.find(
          invoice => invoice.number === data.invoiceNumber
        );
        
        if (duplicate) {
          return {
            isValid: false,
            message: 'Rechnungsnummer bereits vorhanden',
            suggestion: 'Prüfen Sie, ob diese Rechnung bereits erfasst wurde',
            field: 'invoiceNumber',
            metadata: { duplicateId: duplicate.id }
          };
        }
        
        return { isValid: true };
      }
    });

    this.rules.push({
      id: 'amount-plausibility',
      name: 'Betrag Plausibilität',
      description: 'Rechnungsbeträge sollten plausibel sein',
      category: 'business',
      severity: 'info',
      validate: (data) => {
        const total = data.totals.total;
        
        // Flag very high amounts
        if (total > 100000) {
          return {
            isValid: false,
            message: 'Sehr hoher Rechnungsbetrag',
            suggestion: 'Bitte Betrag überprüfen',
            field: 'totals.total'
          };
        }
        
        // Check for round numbers that might indicate estimates
        if (total > 1000 && total % 100 === 0) {
          return {
            isValid: true,
            message: 'Runder Betrag - möglicherweise Schätzung',
            field: 'totals.total'
          };
        }
        
        return { isValid: true };
      }
    });
  }

  // Validate invoice data against all rules
  public validateInvoice(
    data: ParsedInvoiceData, 
    context?: ValidationContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const rule of this.rules) {
      try {
        const result = rule.validate(data, context);
        
        if (!result.isValid) {
          errors.push({
            field: result.field || 'general',
            message: result.message || `${rule.name} validation failed`,
            severity: rule.severity,
            suggestion: result.suggestion
          });
        }
      } catch (error) {
        console.warn(`Rule ${rule.id} failed:`, error);
      }
    }
    
    return errors;
  }

  // Validate specific field
  public validateField(
    fieldName: string,
    data: ParsedInvoiceData,
    context?: ValidationContext
  ): ValidationError[] {
    const fieldRules = this.rules.filter(rule => {
      // Simple field matching - could be enhanced
      return rule.id.toLowerCase().includes(fieldName.toLowerCase()) ||
             rule.name.toLowerCase().includes(fieldName.toLowerCase());
    });
    
    const errors: ValidationError[] = [];
    
    for (const rule of fieldRules) {
      try {
        const result = rule.validate(data, context);
        
        if (!result.isValid) {
          errors.push({
            field: result.field || fieldName,
            message: result.message || `${rule.name} validation failed`,
            severity: rule.severity,
            suggestion: result.suggestion
          });
        }
      } catch (error) {
        console.warn(`Field rule ${rule.id} failed:`, error);
      }
    }
    
    return errors;
  }

  // Get all rules for a category
  public getRulesByCategory(category: BusinessRule['category']): BusinessRule[] {
    return this.rules.filter(rule => rule.category === category);
  }

  // Add custom rule
  public addRule(rule: BusinessRule): void {
    this.rules.push(rule);
  }

  // Remove rule
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // Get rule statistics
  public getValidationStatistics(
    data: ParsedInvoiceData,
    context?: ValidationContext
  ): {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    warningCount: number;
    errorCount: number;
    infoCount: number;
  } {
    const errors = this.validateInvoice(data, context);
    
    return {
      totalRules: this.rules.length,
      passedRules: this.rules.length - errors.length,
      failedRules: errors.length,
      warningCount: errors.filter(e => e.severity === 'warning').length,
      errorCount: errors.filter(e => e.severity === 'error').length,
      infoCount: errors.filter(e => e.severity === 'info').length
    };
  }
}

// Export default instance
export const businessRuleEngine = new BusinessRuleEngine();