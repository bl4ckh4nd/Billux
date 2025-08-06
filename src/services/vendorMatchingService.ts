import Fuse from 'fuse.js';
import { Customer } from '../types/customer';
import { ParsedInvoiceData } from '../types/upload';

export interface VendorMatchResult {
  customer: Customer;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'partial';
  matchedFields: string[];
}

export interface MatchingConfig {
  nameThreshold: number;
  addressThreshold: number;
  taxIdThreshold: number;
  enableFuzzyMatching: boolean;
  enablePartialMatching: boolean;
}

export class VendorMatchingService {
  private fuse: Fuse<Customer>;
  private config: MatchingConfig;

  constructor(customers: Customer[], config?: Partial<MatchingConfig>) {
    this.config = {
      nameThreshold: 0.8,
      addressThreshold: 0.7,
      taxIdThreshold: 1.0, // Tax ID should be exact
      enableFuzzyMatching: true,
      enablePartialMatching: true,
      ...config
    };

    // Configure Fuse.js for fuzzy search
    this.fuse = new Fuse(customers, {
      keys: [
        { name: 'company', weight: 0.4 },
        { name: 'contactPerson', weight: 0.2 },
        { name: 'address', weight: 0.2 },
        { name: 'street', weight: 0.1 },
        { name: 'city', weight: 0.1 }
      ],
      threshold: 0.3, // Lower threshold = more strict matching
      includeScore: true,
      ignoreLocation: true,
      ignoreFieldNorm: false
    });
  }

  // Update customer list for matching
  public updateCustomers(customers: Customer[]): void {
    this.fuse = new Fuse(customers, this.fuse.options);
  }

  // Find best matching customer for vendor data
  public findBestMatch(vendorData: ParsedInvoiceData['vendor']): VendorMatchResult | null {
    if (!vendorData.name && !vendorData.taxId && !vendorData.address) {
      return null;
    }

    const matches: VendorMatchResult[] = [];

    // 1. Try exact Tax ID match first (highest priority)
    if (vendorData.taxId) {
      const exactTaxMatch = this.findExactTaxIdMatch(vendorData.taxId);
      if (exactTaxMatch) {
        matches.push({
          customer: exactTaxMatch,
          confidence: 1.0,
          matchType: 'exact',
          matchedFields: ['taxId']
        });
      }
    }

    // 2. Try exact company name match
    if (vendorData.name) {
      const exactNameMatch = this.findExactNameMatch(vendorData.name);
      if (exactNameMatch) {
        matches.push({
          customer: exactNameMatch,
          confidence: 0.95,
          matchType: 'exact',
          matchedFields: ['company']
        });
      }
    }

    // 3. Try fuzzy matching if enabled
    if (this.config.enableFuzzyMatching && vendorData.name) {
      const fuzzyMatches = this.findFuzzyMatches(vendorData);
      matches.push(...fuzzyMatches);
    }

    // 4. Try partial matching if enabled
    if (this.config.enablePartialMatching) {
      const partialMatches = this.findPartialMatches(vendorData);
      matches.push(...partialMatches);
    }

    // Return the best match (highest confidence)
    if (matches.length === 0) return null;

    // Sort by confidence and return the best match
    matches.sort((a, b) => b.confidence - a.confidence);
    
    // Additional validation: ensure minimum confidence threshold
    const bestMatch = matches[0];
    if (bestMatch.confidence < 0.6) {
      return null; // Too low confidence
    }

    return bestMatch;
  }

  // Find all potential matches with confidence scores
  public findAllMatches(vendorData: ParsedInvoiceData['vendor']): VendorMatchResult[] {
    const allMatches: VendorMatchResult[] = [];

    // Exact matches
    if (vendorData.taxId) {
      const exactTaxMatch = this.findExactTaxIdMatch(vendorData.taxId);
      if (exactTaxMatch) {
        allMatches.push({
          customer: exactTaxMatch,
          confidence: 1.0,
          matchType: 'exact',
          matchedFields: ['taxId']
        });
      }
    }

    if (vendorData.name) {
      const exactNameMatch = this.findExactNameMatch(vendorData.name);
      if (exactNameMatch) {
        allMatches.push({
          customer: exactNameMatch,
          confidence: 0.95,
          matchType: 'exact',
          matchedFields: ['company']
        });
      }
    }

    // Fuzzy matches
    if (this.config.enableFuzzyMatching) {
      const fuzzyMatches = this.findFuzzyMatches(vendorData);
      allMatches.push(...fuzzyMatches);
    }

    // Partial matches
    if (this.config.enablePartialMatching) {
      const partialMatches = this.findPartialMatches(vendorData);
      allMatches.push(...partialMatches);
    }

    // Remove duplicates and sort by confidence
    const uniqueMatches = this.removeDuplicateMatches(allMatches);
    return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
  }

  private findExactTaxIdMatch(taxId: string): Customer | null {
    const customers = this.fuse.getIndex().docs as Customer[];
    return customers.find(customer => 
      customer.taxId && customer.taxId.toUpperCase() === taxId.toUpperCase()
    ) || null;
  }

  private findExactNameMatch(name: string): Customer | null {
    const customers = this.fuse.getIndex().docs as Customer[];
    const normalizedName = this.normalizeName(name);
    
    return customers.find(customer => 
      this.normalizeName(customer.company) === normalizedName
    ) || null;
  }

  private findFuzzyMatches(vendorData: ParsedInvoiceData['vendor']): VendorMatchResult[] {
    const searchText = [vendorData.name, vendorData.address].filter(Boolean).join(' ');
    const fuseResults = this.fuse.search(searchText);
    
    return fuseResults
      .filter(result => result.score !== undefined && result.score <= 0.4) // Fuse score is inverted (lower = better)
      .map(result => {
        const confidence = 1 - result.score!; // Convert to confidence (higher = better)
        const matchedFields = this.getMatchedFields(vendorData, result.item);
        
        return {
          customer: result.item,
          confidence: Math.round(confidence * 100) / 100,
          matchType: 'fuzzy' as const,
          matchedFields
        };
      })
      .filter(match => match.confidence >= this.config.nameThreshold);
  }

  private findPartialMatches(vendorData: ParsedInvoiceData['vendor']): VendorMatchResult[] {
    const customers = this.fuse.getIndex().docs as Customer[];
    const matches: VendorMatchResult[] = [];

    for (const customer of customers) {
      const matchScore = this.calculatePartialMatchScore(vendorData, customer);
      if (matchScore.confidence >= 0.6) {
        matches.push({
          customer,
          confidence: matchScore.confidence,
          matchType: 'partial',
          matchedFields: matchScore.matchedFields
        });
      }
    }

    return matches;
  }

  private calculatePartialMatchScore(
    vendorData: ParsedInvoiceData['vendor'], 
    customer: Customer
  ): { confidence: number; matchedFields: string[] } {
    const scores: { field: string; score: number; weight: number }[] = [];
    const matchedFields: string[] = [];

    // Company name similarity
    if (vendorData.name && customer.company) {
      const nameScore = this.calculateStringSimilarity(
        this.normalizeName(vendorData.name),
        this.normalizeName(customer.company)
      );
      scores.push({ field: 'company', score: nameScore, weight: 0.5 });
      if (nameScore > this.config.nameThreshold) {
        matchedFields.push('company');
      }
    }

    // Address similarity
    if (vendorData.address && customer.address) {
      const addressScore = this.calculateStringSimilarity(
        this.normalizeAddress(vendorData.address),
        this.normalizeAddress(customer.address)
      );
      scores.push({ field: 'address', score: addressScore, weight: 0.3 });
      if (addressScore > this.config.addressThreshold) {
        matchedFields.push('address');
      }
    }

    // City matching (extracted from address)
    if (vendorData.address && customer.city) {
      const vendorCity = this.extractCity(vendorData.address);
      if (vendorCity) {
        const cityScore = this.calculateStringSimilarity(
          vendorCity.toLowerCase(),
          customer.city.toLowerCase()
        );
        scores.push({ field: 'city', score: cityScore, weight: 0.2 });
        if (cityScore > 0.8) {
          matchedFields.push('city');
        }
      }
    }

    // Calculate weighted average
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return { confidence: 0, matchedFields: [] };

    const weightedScore = scores.reduce(
      (sum, s) => sum + (s.score * s.weight), 0
    ) / totalWeight;

    return {
      confidence: Math.round(weightedScore * 100) / 100,
      matchedFields
    };
  }

  private getMatchedFields(vendorData: ParsedInvoiceData['vendor'], customer: Customer): string[] {
    const matched: string[] = [];

    if (vendorData.name && customer.company) {
      const similarity = this.calculateStringSimilarity(
        this.normalizeName(vendorData.name),
        this.normalizeName(customer.company)
      );
      if (similarity > this.config.nameThreshold) {
        matched.push('company');
      }
    }

    if (vendorData.address && customer.address) {
      const similarity = this.calculateStringSimilarity(
        this.normalizeAddress(vendorData.address),
        this.normalizeAddress(customer.address)
      );
      if (similarity > this.config.addressThreshold) {
        matched.push('address');
      }
    }

    if (vendorData.taxId && customer.taxId) {
      if (vendorData.taxId.toUpperCase() === customer.taxId.toUpperCase()) {
        matched.push('taxId');
      }
    }

    return matched;
  }

  private removeDuplicateMatches(matches: VendorMatchResult[]): VendorMatchResult[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      if (seen.has(match.customer.id)) {
        return false;
      }
      seen.add(match.customer.id);
      return true;
    });
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.,\-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(gmbh|ag|kg|ohg|ug|e\.k\.|mbh|ltd|inc|corp|llc)\b/g, '')
      .trim();
  }

  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[.,\-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(straße|str|strasse|weg|platz|allee|damm|ring)\b/g, 'str')
      .trim();
  }

  private extractCity(address: string): string | null {
    // Extract German city from address (usually after postal code)
    const cityMatch = address.match(/\d{5}\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/);
    return cityMatch ? cityMatch[1].trim() : null;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Levenshtein distance based similarity
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - matrix[len2][len1] / maxLen;
  }

  // Get matching statistics
  public getMatchingStatistics(vendorData: ParsedInvoiceData['vendor']): {
    totalCustomers: number;
    exactMatches: number;
    fuzzyMatches: number;
    partialMatches: number;
    bestMatchConfidence: number;
  } {
    const customers = this.fuse.getIndex().docs as Customer[];
    const allMatches = this.findAllMatches(vendorData);
    
    return {
      totalCustomers: customers.length,
      exactMatches: allMatches.filter(m => m.matchType === 'exact').length,
      fuzzyMatches: allMatches.filter(m => m.matchType === 'fuzzy').length,
      partialMatches: allMatches.filter(m => m.matchType === 'partial').length,
      bestMatchConfidence: allMatches.length > 0 ? allMatches[0].confidence : 0
    };
  }

  // Suggest new customer creation if no good matches found
  public shouldCreateNewCustomer(vendorData: ParsedInvoiceData['vendor']): {
    shouldCreate: boolean;
    reason: string;
    suggestedData: Partial<Customer>;
  } {
    const bestMatch = this.findBestMatch(vendorData);
    
    if (!bestMatch || bestMatch.confidence < 0.7) {
      // Extract city and postal code for new customer
      const cityMatch = vendorData.address.match(/(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/);
      
      return {
        shouldCreate: true,
        reason: bestMatch 
          ? `Beste Übereinstimmung nur ${Math.round(bestMatch.confidence * 100)}% (Schwellenwert: 70%)`
          : 'Keine passenden Kunden gefunden',
        suggestedData: {
          company: vendorData.name,
          contactPerson: '',
          taxId: vendorData.taxId,
          address: vendorData.address,
          street: vendorData.address.split(',')[0] || '',
          postalCode: cityMatch ? cityMatch[1] : '',
          city: cityMatch ? cityMatch[2].trim() : '',
          email: '',
          phone: '',
          projects: [],
          totalRevenue: 0
        }
      };
    }

    return {
      shouldCreate: false,
      reason: `Gute Übereinstimmung gefunden: ${bestMatch.customer.company} (${Math.round(bestMatch.confidence * 100)}%)`,
      suggestedData: {}
    };
  }
}