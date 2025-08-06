import { Mistral } from '@mistralai/mistralai';
import { OcrConfig, OcrResult } from '../types/upload';

export class OcrService {
  private client: Mistral;
  private config: OcrConfig;
  
  constructor(config: OcrConfig) {
    this.config = config;
    this.client = new Mistral({ apiKey: config.apiKey });
  }
  
  async processDocument(file: File): Promise<OcrResult> {
    const startTime = Date.now();
    
    try {
      // Convert file to base64 for API
      const base64Data = await this.fileToBase64(file);
      
      // Call MistralOCR API
      const response = await this.client.chat.complete({
        model: this.config.model || 'pixtral-12b-2409',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this German invoice document. Return only the raw text content, preserving the structure and layout as much as possible.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64Data}`
              }
            }
          ]
        }],
        max_tokens: 4000,
        temperature: 0.1
      });
      
      const text = response.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;
      
      return {
        text,
        confidence: this.calculateConfidence(text),
        processingTime,
        pageCount: 1, // Assuming single page for now
        metadata: {
          fileSize: file.size,
          format: file.type,
          language: 'de'
        }
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/... prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on content quality
    if (!text || text.length < 50) return 0.2;
    
    const hasNumbers = /\d/.test(text);
    const hasGermanWords = /(?:rechnung|betrag|datum|mwst|ust|total|gesamt|steuer)/i.test(text);
    const hasStructure = /\n/.test(text);
    const hasAmounts = /\d+[,\.]\d{2}/.test(text);
    const hasDate = /\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}/.test(text);
    
    let confidence = 0.3; // Base confidence
    if (hasNumbers) confidence += 0.15;
    if (hasGermanWords) confidence += 0.25;
    if (hasStructure) confidence += 0.1;
    if (hasAmounts) confidence += 0.15;
    if (hasDate) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
  
  // Method to validate OCR results
  validateResult(result: OcrResult): boolean {
    return result.text.length > 10 && result.confidence > 0.3;
  }
  
  // Method to retry OCR with different parameters
  async retryProcessing(file: File, retryConfig?: Partial<OcrConfig>): Promise<OcrResult> {
    const newConfig = { ...this.config, ...retryConfig };
    const tempService = new OcrService(newConfig);
    return tempService.processDocument(file);
  }
}