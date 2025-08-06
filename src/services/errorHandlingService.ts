import { ParsedInvoiceData, ValidationError } from '../types/upload';

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

export interface ErrorPattern {
  pattern: RegExp | ((value: string) => boolean);
  errorType: string;
  suggestion: CorrectionSuggestion;
  context: string;
}

export class ErrorHandlingService {
  private germanDatePatterns: ErrorPattern[] = [
    {
      pattern: /^\d{1,2}\.\d{1,2}\.\d{2}$/,
      errorType: 'date_format_short_year',
      suggestion: {
        type: 'format',
        description: 'Jahr auf 4 Stellen erweitern',
        confidence: 0.9,
        inputType: 'date'
      },
      context: 'Datum im Format TT.MM.JJ erkannt - sollte TT.MM.JJJJ sein'
    },
    {
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      errorType: 'date_format_iso',
      suggestion: {
        type: 'format',
        description: 'In deutsches Format umwandeln (TT.MM.JJJJ)',
        confidence: 0.95,
        inputType: 'date'
      },
      context: 'ISO-Datum erkannt - deutsches Format erwartet'
    },
    {
      pattern: /^\d{2}\/\d{2}\/\d{4}$/,
      errorType: 'date_format_us',
      suggestion: {
        type: 'format',
        description: 'Von US-Format (MM/TT/JJJJ) zu deutschem Format umwandeln',
        confidence: 0.85,
        inputType: 'date'
      },
      context: 'US-Datumsformat erkannt'
    }
  ];

  private germanNumberPatterns: ErrorPattern[] = [
    {
      pattern: /^\d+\.\d{3},\d{2}$/,
      errorType: 'number_format_german_correct',
      suggestion: {
        type: 'format',
        description: 'Deutsches Zahlenformat korrekt',
        confidence: 1.0
      },
      context: 'Korrektes deutsches Zahlenformat'
    },
    {
      pattern: /^\d{1,3}(,\d{3})*\.\d{2}$/,
      errorType: 'number_format_us',
      suggestion: {
        type: 'format',
        description: 'Von US-Format zu deutschem Format umwandeln (Komma und Punkt tauschen)',
        confidence: 0.9,
        inputType: 'number'
      },
      context: 'US-Zahlenformat erkannt'
    },
    {
      pattern: /^\d+$/,
      errorType: 'number_missing_decimals',
      suggestion: {
        type: 'format',
        description: 'Dezimalstellen hinzufügen (.00)',
        confidence: 0.7,
        inputType: 'number'
      },
      context: 'Ganze Zahl ohne Dezimalstellen'
    }
  ];

  private germanTaxIdPatterns: ErrorPattern[] = [
    {
      pattern: /^DE\d{9}$/,
      errorType: 'tax_id_correct',
      suggestion: {
        type: 'format',
        description: 'Deutsche USt-IdNr korrekt',
        confidence: 1.0
      },
      context: 'Korrekte deutsche USt-IdNr'
    },
    {
      pattern: /^\d{9}$/,
      errorType: 'tax_id_missing_country',
      suggestion: {
        type: 'format',
        description: 'Länderkürzel "DE" voranstellen',
        suggestedValue: 'DE',
        confidence: 0.95,
        inputType: 'text'
      },
      context: 'USt-IdNr ohne Länderkürzel'
    },
    {
      pattern: /^DE\d{8}$/,
      errorType: 'tax_id_too_short',
      suggestion: {
        type: 'manual',
        description: 'Eine Ziffer fehlt - bitte manuell prüfen',
        confidence: 0.6,
        requiresUserInput: true,
        inputType: 'text'
      },
      context: 'Deutsche USt-IdNr zu kurz'
    },
    {
      pattern: /^DE\d{10}$/,
      errorType: 'tax_id_too_long',
      suggestion: {
        type: 'manual',
        description: 'Eine Ziffer zu viel - bitte manuell prüfen',
        confidence: 0.6,
        requiresUserInput: true,
        inputType: 'text'
      },
      context: 'Deutsche USt-IdNr zu lang'
    }
  ];

  private germanInvoiceNumberPatterns: ErrorPattern[] = [
    {
      pattern: /^[A-Z]{1,4}[-\/]?\d{4,}[-\/]?\d*$/,
      errorType: 'invoice_number_correct',
      suggestion: {
        type: 'format',
        description: 'Deutsches Rechnungsnummer-Format korrekt',
        confidence: 1.0
      },
      context: 'Korrektes deutsches Format'
    },
    {
      pattern: /^\d+$/,
      errorType: 'invoice_number_only_digits',
      suggestion: {
        type: 'format',
        description: 'Präfix hinzufügen (z.B. "RE-" oder "INV-")',
        confidence: 0.7,
        inputType: 'text'
      },
      context: 'Nur Ziffern ohne Präfix'
    }
  ];

  public analyzeField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];

    switch (field) {
      case 'date':
      case 'dueDate':
        errors.push(...this.analyzeDateField(field, value, context));
        break;
      case 'vendor.taxId':
        errors.push(...this.analyzeTaxIdField(field, value, context));
        break;
      case 'invoiceNumber':
        errors.push(...this.analyzeInvoiceNumberField(field, value, context));
        break;
      case 'totals.total':
      case 'totals.subtotal':
      case 'totals.taxAmount':
        errors.push(...this.analyzeAmountField(field, value, context));
        break;
      case 'vendor.name':
        errors.push(...this.analyzeVendorNameField(field, value, context));
        break;
      default:
        // Generic field analysis
        errors.push(...this.analyzeGenericField(field, value, context));
    }

    return errors;
  }

  private analyzeDateField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];

    if (!value || value.trim().length === 0) {
      errors.push({
        field,
        message: 'Datum fehlt',
        severity: 'error',
        context: 'Pflichtfeld nicht erkannt',
        possibleCauses: [
          'OCR konnte das Datum nicht erkennen',
          'Datum an ungewöhnlicher Position',
          'Schlechte Bildqualität'
        ],
        correctionSuggestions: [
          {
            type: 'manual',
            description: 'Datum manuell eingeben (TT.MM.JJJJ)',
            confidence: 1.0,
            requiresUserInput: true,
            inputType: 'date'
          },
          {
            type: 'lookup',
            description: 'Nach Datum im OCR-Text suchen',
            confidence: 0.6
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
      return errors;
    }

    // Check against date patterns
    for (const pattern of this.germanDatePatterns) {
      if (this.matchesPattern(pattern.pattern, value)) {
        if (pattern.errorType !== 'date_format_german_correct') {
          errors.push({
            field,
            message: `Ungewöhnliches Datumsformat: ${value}`,
            severity: 'warning',
            context: pattern.context,
            possibleCauses: [
              'Automatische Formatkonvertierung erforderlich',
              'Unterschiedliche Länderformate'
            ],
            correctionSuggestions: [
              {
                ...pattern.suggestion,
                suggestedValue: this.convertToGermanDate(value)
              }
            ],
            autoFixAvailable: true,
            learnFromUser: true
          });
        }
        break;
      }
    }

    // Date logic validation
    if (field === 'dueDate' && context.date) {
      const invoiceDate = new Date(context.date);
      const dueDate = new Date(value);
      
      if (dueDate <= invoiceDate) {
        errors.push({
          field,
          message: 'Fälligkeitsdatum liegt vor Rechnungsdatum',
          severity: 'error',
          context: 'Logikfehler in Datumswerten',
          possibleCauses: [
            'OCR-Fehler bei Datumserkennung',
            'Vertauschte Datumswerte',
            'Falsche Datumsinterpretation'
          ],
          correctionSuggestions: [
            {
              type: 'calculate',
              description: 'Standard-Zahlungsfrist (30 Tage) anwenden',
              suggestedValue: this.addDaysToDate(context.date, 30),
              confidence: 0.8,
              inputType: 'date'
            },
            {
              type: 'manual',
              description: 'Fälligkeitsdatum manuell korrigieren',
              confidence: 1.0,
              requiresUserInput: true,
              inputType: 'date'
            }
          ],
          autoFixAvailable: true,
          learnFromUser: true,
          relatedFields: ['date']
        });
      }
    }

    return errors;
  }

  private analyzeTaxIdField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];

    if (!value || value.trim().length === 0) {
      errors.push({
        field,
        message: 'USt-IdNr fehlt',
        severity: 'error',
        context: 'Pflichtfeld für deutsche Rechnungen',
        possibleCauses: [
          'OCR konnte USt-IdNr nicht erkennen',
          'USt-IdNr an ungewöhnlicher Position',
          'Andere Bezeichnung verwendet (VAT-ID, etc.)'
        ],
        correctionSuggestions: [
          {
            type: 'lookup',
            description: 'Im OCR-Text nach "DE" + 9 Ziffern suchen',
            confidence: 0.7
          },
          {
            type: 'manual',
            description: 'USt-IdNr manuell eingeben (DE123456789)',
            confidence: 1.0,
            requiresUserInput: true,
            inputType: 'text'
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
      return errors;
    }

    // Check against tax ID patterns
    for (const pattern of this.germanTaxIdPatterns) {
      if (this.matchesPattern(pattern.pattern, value)) {
        if (pattern.errorType !== 'tax_id_correct') {
          errors.push({
            field,
            message: `Ungültige USt-IdNr: ${value}`,
            severity: 'error',
            context: pattern.context,
            possibleCauses: [
              'OCR-Fehler bei Zeichenerkennung',
              'Unvollständige Texterkennung',
              'Formatierungsproblem'
            ],
            correctionSuggestions: [
              {
                ...pattern.suggestion,
                suggestedValue: pattern.suggestion.suggestedValue 
                  ? pattern.suggestion.suggestedValue + value
                  : undefined
              }
            ],
            autoFixAvailable: !pattern.suggestion.requiresUserInput,
            learnFromUser: true
          });
        }
        break;
      }
    }

    return errors;
  }

  private analyzeInvoiceNumberField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];

    if (!value || value.trim().length === 0) {
      errors.push({
        field,
        message: 'Rechnungsnummer fehlt',
        severity: 'error',
        context: 'Pflichtfeld für eindeutige Identifikation',
        possibleCauses: [
          'OCR konnte Rechnungsnummer nicht erkennen',
          'Ungewöhnliche Position oder Format',
          'Überlappung mit anderen Elementen'
        ],
        correctionSuggestions: [
          {
            type: 'lookup',
            description: 'Im OCR-Text nach Nummer-Mustern suchen',
            confidence: 0.6
          },
          {
            type: 'manual',
            description: 'Rechnungsnummer manuell eingeben',
            confidence: 1.0,
            requiresUserInput: true,
            inputType: 'text'
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
      return errors;
    }

    // Check against invoice number patterns
    for (const pattern of this.germanInvoiceNumberPatterns) {
      if (this.matchesPattern(pattern.pattern, value)) {
        if (pattern.errorType === 'invoice_number_only_digits') {
          errors.push({
            field,
            message: `Rechnungsnummer ohne Präfix: ${value}`,
            severity: 'warning',
            context: pattern.context,
            possibleCauses: [
              'Präfix wurde nicht erkannt',
              'Minimales Nummerierungsschema'
            ],
            correctionSuggestions: [
              {
                type: 'format',
                description: 'Präfix "RE-" hinzufügen',
                suggestedValue: `RE-${value}`,
                confidence: 0.8,
                inputType: 'text'
              },
              {
                type: 'manual',
                description: 'Anderen Präfix wählen',
                confidence: 0.7,
                requiresUserInput: true,
                inputType: 'select',
                options: ['INV-', 'RG-', 'BILL-', 'F-']
              }
            ],
            autoFixAvailable: true,
            learnFromUser: true
          });
        }
        break;
      }
    }

    return errors;
  }

  private analyzeAmountField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];
    const numericValue = this.parseGermanNumber(value);

    if (numericValue <= 0) {
      errors.push({
        field,
        message: 'Ungültiger Betrag',
        severity: 'error',
        context: 'Betrag muss größer als 0 sein',
        possibleCauses: [
          'OCR-Fehler bei Zahlernerkennung',
          'Falsche Dezimaltrennzeichen',
          'Währungssymbole stören Erkennung'
        ],
        correctionSuggestions: [
          {
            type: 'manual',
            description: 'Betrag manuell eingeben',
            confidence: 1.0,
            requiresUserInput: true,
            inputType: 'number'
          },
          {
            type: 'lookup',
            description: 'Im OCR-Text nach Eurobeträgen suchen',
            confidence: 0.7
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
    }

    // VAT calculation validation
    if (field === 'totals.total' && context.totals.subtotal > 0 && context.totals.taxAmount > 0) {
      const expectedTotal = context.totals.subtotal + context.totals.taxAmount;
      const difference = Math.abs(numericValue - expectedTotal);
      
      if (difference > 0.02) {
        errors.push({
          field,
          message: 'Gesamtbetrag stimmt nicht mit Zwischensumme + MwSt überein',
          severity: 'error',
          context: 'Arithmetikfehler in Betragsberechnung',
          possibleCauses: [
            'OCR-Fehler bei einem der Beträge',
            'Rundungsfehler',
            'Zusätzliche Gebühren nicht erkannt'
          ],
          correctionSuggestions: [
            {
              type: 'calculate',
              description: 'Gesamtbetrag neu berechnen',
              suggestedValue: expectedTotal.toFixed(2),
              confidence: 0.9,
              inputType: 'number'
            },
            {
              type: 'manual',
              description: 'Alle Beträge manuell prüfen',
              confidence: 1.0,
              requiresUserInput: true
            }
          ],
          autoFixAvailable: true,
          learnFromUser: true,
          relatedFields: ['totals.subtotal', 'totals.taxAmount']
        });
      }
    }

    return errors;
  }

  private analyzeVendorNameField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];

    if (!value || value.trim().length < 2) {
      errors.push({
        field,
        message: 'Firmenname fehlt oder zu kurz',
        severity: 'error',
        context: 'Lieferantenname ist Pflichtfeld',
        possibleCauses: [
          'OCR konnte Firmennamen nicht erkennen',
          'Name in Header-Bereich übersehen',
          'Grafische Elemente stören Erkennung'
        ],
        correctionSuggestions: [
          {
            type: 'lookup',
            description: 'Im OCR-Text nach Firmennamen suchen',
            confidence: 0.6
          },
          {
            type: 'manual',
            description: 'Firmennamen manuell eingeben',
            confidence: 1.0,
            requiresUserInput: true,
            inputType: 'text'
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
    }

    // Check for common OCR errors in company names
    if (value && this.containsOcrErrors(value)) {
      errors.push({
        field,
        message: 'Mögliche OCR-Fehler im Firmennamen',
        severity: 'warning',
        context: 'Verdächtige Zeichen oder Muster erkannt',
        possibleCauses: [
          'Verwechslung ähnlicher Zeichen (0/O, 1/I/l)',
          'Unvollständige Zeichenerkennung',
          'Formatierungsprobleme'
        ],
        correctionSuggestions: [
          {
            type: 'manual',
            description: 'Firmennamen manuell überprüfen',
            confidence: 0.8,
            requiresUserInput: true,
            inputType: 'text'
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
    }

    return errors;
  }

  private analyzeGenericField(
    field: string, 
    value: string, 
    context: ParsedInvoiceData
  ): EnhancedValidationError[] {
    const errors: EnhancedValidationError[] = [];

    // Check for common OCR issues
    if (value && this.containsOcrErrors(value)) {
      errors.push({
        field,
        message: 'Mögliche OCR-Fehler erkannt',
        severity: 'info',
        context: 'Verdächtige Zeichen gefunden',
        possibleCauses: [
          'Zeichenverwechslung',
          'Unvollständige Erkennung'
        ],
        correctionSuggestions: [
          {
            type: 'manual',
            description: 'Feld manuell überprüfen',
            confidence: 0.6,
            requiresUserInput: true,
            inputType: 'text'
          }
        ],
        autoFixAvailable: false,
        learnFromUser: true
      });
    }

    return errors;
  }

  // Utility methods
  private matchesPattern(pattern: RegExp | ((value: string) => boolean), value: string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(value);
    }
    return pattern(value);
  }

  private convertToGermanDate(dateStr: string): string {
    // Convert various date formats to German format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // ISO format: YYYY-MM-DD -> DD.MM.YYYY
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      // US format: MM/DD/YYYY -> DD.MM.YYYY
      const [month, day, year] = dateStr.split('/');
      return `${day}.${month}.${year}`;
    }
    
    if (/^\d{1,2}\.\d{1,2}\.\d{2}$/.test(dateStr)) {
      // Short year: DD.MM.YY -> DD.MM.20YY
      const parts = dateStr.split('.');
      const year = '20' + parts[2];
      return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${year}`;
    }
    
    return dateStr;
  }

  private addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('de-DE');
  }

  private parseGermanNumber(numberStr: string): number {
    if (!numberStr) return 0;
    
    // Remove currency symbols and extra spaces
    const cleaned = numberStr.replace(/[€\s]/g, '');
    
    // Handle German number format (1.234,56)
    if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    
    // Handle US format (1,234.56)
    if (cleaned.includes('.') && cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
      return parseFloat(cleaned.replace(/,/g, ''));
    }
    
    return parseFloat(cleaned.replace(/,/g, '.'));
  }

  private containsOcrErrors(text: string): boolean {
    // Common OCR error patterns
    const ocrErrorPatterns = [
      /[0O]{2,}/, // Multiple zeros/Os together
      /[1Il]{3,}/, // Multiple 1/I/l together
      /[^a-zA-ZäöüÄÖÜß0-9\s\-\.,&()]/g, // Unusual characters
      /\s{3,}/, // Multiple spaces
      /[A-Z]{5,}(?![a-z])/, // Long uppercase sequences
    ];

    return ocrErrorPatterns.some(pattern => pattern.test(text));
  }

  // Auto-correction methods
  public autoCorrectField(
    field: string,
    value: string,
    suggestion: CorrectionSuggestion,
    context: ParsedInvoiceData
  ): string {
    switch (suggestion.type) {
      case 'format':
        return this.applyFormatCorrection(field, value, suggestion);
      case 'calculate':
        return this.applyCalculationCorrection(field, value, suggestion, context);
      default:
        return suggestion.suggestedValue || value;
    }
  }

  private applyFormatCorrection(field: string, value: string, suggestion: CorrectionSuggestion): string {
    if (field.includes('date')) {
      return this.convertToGermanDate(value);
    }
    
    if (field.includes('taxId') && suggestion.suggestedValue) {
      return suggestion.suggestedValue + value;
    }
    
    return suggestion.suggestedValue || value;
  }

  private applyCalculationCorrection(
    field: string, 
    value: string, 
    suggestion: CorrectionSuggestion, 
    context: ParsedInvoiceData
  ): string {
    if (field === 'totals.total') {
      return (context.totals.subtotal + context.totals.taxAmount).toFixed(2);
    }
    
    if (field === 'dueDate' && context.date) {
      return this.addDaysToDate(context.date, 30);
    }
    
    return suggestion.suggestedValue || value;
  }
}

export const errorHandlingService = new ErrorHandlingService();