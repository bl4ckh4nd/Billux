import { GaussianNB } from 'ml-naivebayes';
import { LearningPattern, PredictionResult } from '../types/upload';

export class SimpleLearningEngine {
  private naiveBayes: GaussianNB;
  private knnClassifier: any | null = null;
  private frequencyPatterns: Map<string, Map<string, number>>;
  private trainingData: LearningPattern[];
  private isInitialized: boolean = false;
  
  constructor() {
    this.naiveBayes = new GaussianNB();
    this.frequencyPatterns = new Map();
    this.trainingData = [];
    this.loadStoredData();
  }
  
  // Initialize with stored training data
  private loadStoredData(): void {
    try {
      const storedData = localStorage.getItem('invoice-learning-data');
      if (storedData) {
        const data = JSON.parse(storedData);
        this.trainingData = data.patterns || [];
        this.frequencyPatterns = new Map(data.frequencies || []);
        
        if (this.trainingData.length > 0) {
          this.retrainModels();
        }
      }
    } catch (error) {
      console.warn('Failed to load stored learning data:', error);
    }
  }
  
  // Save training data to local storage
  private saveData(): void {
    try {
      const data = {
        patterns: this.trainingData,
        frequencies: Array.from(this.frequencyPatterns.entries())
      };
      localStorage.setItem('invoice-learning-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save learning data:', error);
    }
  }
  
  // Learn from user corrections and manual entries
  async learnFromCorrection(
    originalText: string,
    correctedValue: string,
    fieldType: string,
    userId: string
  ): Promise<void> {
    const pattern: LearningPattern = {
      input: this.normalizeText(originalText),
      expectedOutput: correctedValue,
      confidence: 1.0,
      timestamp: new Date(),
      userId
    };
    
    this.trainingData.push(pattern);
    
    // Update frequency patterns
    this.updateFrequencyPatterns(pattern.input, correctedValue, fieldType);
    
    // Retrain models if we have enough data
    if (this.trainingData.length % 5 === 0) {
      await this.retrainModels();
    }
    
    // Save data
    this.saveData();
  }
  
  // Predict field value based on learned patterns
  async predictFieldValue(
    text: string,
    fieldType: string,
    userId?: string
  ): Promise<PredictionResult> {
    const normalizedText = this.normalizeText(text);
    
    // If we don't have enough training data, return empty prediction
    if (this.trainingData.length < 3) {
      return { prediction: '', confidence: 0, algorithm: 'ensemble' };
    }
    
    // Try different algorithms and combine results
    const predictions = await Promise.all([
      this.predictWithFrequency(normalizedText, fieldType),
      this.predictWithNaiveBayes(normalizedText, fieldType),
      this.predictWithKNN(normalizedText, fieldType)
    ]);
    
    // Ensemble prediction
    return this.combineEnsemblePredictions(predictions);
  }
  
  private async predictWithFrequency(
    text: string,
    fieldType: string
  ): Promise<PredictionResult> {
    const patterns = this.frequencyPatterns.get(fieldType);
    if (!patterns || patterns.size === 0) {
      return { prediction: '', confidence: 0, algorithm: 'frequency' };
    }
    
    let bestMatch = '';
    let bestScore = 0;
    
    for (const [pattern, frequency] of patterns) {
      const similarity = this.calculateSimilarity(text, pattern);
      const score = similarity * Math.log(frequency + 1);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }
    
    return {
      prediction: bestMatch,
      confidence: Math.min(bestScore, 0.9),
      algorithm: 'frequency'
    };
  }
  
  private async predictWithNaiveBayes(
    text: string,
    fieldType: string
  ): Promise<PredictionResult> {
    if (!this.isInitialized || this.trainingData.length < 5) {
      return { prediction: '', confidence: 0, algorithm: 'naive-bayes' };
    }
    
    try {
      const features = this.extractFeatures(text);
      const prediction = this.naiveBayes.predict(features);
      
      // For small datasets, confidence should be lower
      const confidence = Math.min(0.7, this.trainingData.length / 20);
      
      return {
        prediction: String(prediction),
        confidence: confidence,
        algorithm: 'naive-bayes'
      };
    } catch (error) {
      return { prediction: '', confidence: 0, algorithm: 'naive-bayes' };
    }
  }
  
  private async predictWithKNN(
    text: string,
    fieldType: string
  ): Promise<PredictionResult> {
    if (this.trainingData.length < 3) {
      return { prediction: '', confidence: 0, algorithm: 'knn' };
    }
    
    try {
      const query = this.extractFeatures(text);
      const k = Math.min(3, this.trainingData.length);
      
      const distances = this.trainingData.map(pattern => ({
        distance: this.calculateFeatureDistance(query, this.extractFeatures(pattern.input)),
        output: pattern.expectedOutput
      }));
      
      distances.sort((a, b) => a.distance - b.distance);
      const nearestNeighbors = distances.slice(0, k);
      
      // Weighted voting
      const votes = new Map<string, number>();
      let totalWeight = 0;
      
      nearestNeighbors.forEach(neighbor => {
        const weight = 1 / (neighbor.distance + 0.1);
        votes.set(neighbor.output, (votes.get(neighbor.output) || 0) + weight);
        totalWeight += weight;
      });
      
      let bestPrediction = '';
      let bestWeight = 0;
      
      for (const [prediction, weight] of votes) {
        if (weight > bestWeight) {
          bestWeight = weight;
          bestPrediction = prediction;
        }
      }
      
      return {
        prediction: bestPrediction,
        confidence: totalWeight > 0 ? bestWeight / totalWeight : 0,
        algorithm: 'knn'
      };
    } catch (error) {
      return { prediction: '', confidence: 0, algorithm: 'knn' };
    }
  }
  
  private combineEnsemblePredictions(predictions: PredictionResult[]): PredictionResult {
    // Weight predictions by confidence and algorithm reliability
    const weights = {
      'frequency': 0.4,
      'naive-bayes': 0.3,
      'knn': 0.3
    };
    
    const predictionVotes = new Map<string, number>();
    let totalWeight = 0;
    
    predictions.forEach(pred => {
      if (pred.prediction && pred.confidence > 0.1) {
        const weight = pred.confidence * weights[pred.algorithm];
        predictionVotes.set(pred.prediction, (predictionVotes.get(pred.prediction) || 0) + weight);
        totalWeight += weight;
      }
    });
    
    if (predictionVotes.size === 0) {
      return { prediction: '', confidence: 0, algorithm: 'ensemble' };
    }
    
    let bestPrediction = '';
    let bestWeight = 0;
    
    for (const [prediction, weight] of predictionVotes) {
      if (weight > bestWeight) {
        bestWeight = weight;
        bestPrediction = prediction;
      }
    }
    
    return {
      prediction: bestPrediction,
      confidence: totalWeight > 0 ? Math.min(bestWeight / totalWeight, 0.9) : 0,
      algorithm: 'ensemble'
    };
  }
  
  private updateFrequencyPatterns(input: string, output: string, fieldType: string): void {
    if (!this.frequencyPatterns.has(fieldType)) {
      this.frequencyPatterns.set(fieldType, new Map());
    }
    
    const patterns = this.frequencyPatterns.get(fieldType)!;
    patterns.set(output, (patterns.get(output) || 0) + 1);
  }
  
  private async retrainModels(): Promise<void> {
    try {
      // Retrain Naive Bayes
      const features = this.trainingData.map(pattern => this.extractFeatures(pattern.input));
      const labels = this.trainingData.map(pattern => pattern.expectedOutput);
      
      this.naiveBayes = new NaiveBayes();
      this.naiveBayes.train(features, labels);
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to retrain models:', error);
    }
  }
  
  private extractFeatures(text: string): number[] {
    const features: number[] = [];
    
    // Length features
    features.push(text.length);
    features.push(text.split(' ').length);
    
    // Character type features
    const textLength = text.length || 1; // Avoid division by zero
    features.push((text.match(/\d/g) || []).length / textLength);
    features.push((text.match(/[A-ZÄÖÜ]/g) || []).length / textLength);
    features.push((text.match(/[a-zäöüß]/g) || []).length / textLength);
    features.push((text.match(/[.,\-\/]/g) || []).length / textLength);
    
    // German-specific features
    features.push(text.includes('GmbH') ? 1 : 0);
    features.push(text.includes('AG') ? 1 : 0);
    features.push(/\d{5}/.test(text) ? 1 : 0); // Postal code
    features.push(/DE\d{9}/.test(text) ? 1 : 0); // Tax ID
    features.push(/\d+[,\.]\d{2}/.test(text) ? 1 : 0); // Currency amount
    
    return features;
  }
  
  private calculateFeatureDistance(features1: number[], features2: number[]): number {
    if (features1.length !== features2.length) return Infinity;
    
    let sum = 0;
    for (let i = 0; i < features1.length; i++) {
      sum += Math.pow(features1[i] - features2[i], 2);
    }
    return Math.sqrt(sum);
  }
  
  private calculateSimilarity(text1: string, text2: string): number {
    // Simple string similarity using Levenshtein distance
    const matrix = [];
    const len1 = text1.length;
    const len2 = text2.length;
    
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
        if (text2.charAt(i - 1) === text1.charAt(j - 1)) {
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
  
  private normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }
  
  // Get statistics about the learning system
  getStatistics(): {
    totalPatterns: number;
    fieldTypes: string[];
    averageConfidence: number;
    isInitialized: boolean;
  } {
    const fieldTypes = Array.from(this.frequencyPatterns.keys());
    const avgConfidence = this.trainingData.length > 0 
      ? this.trainingData.reduce((sum, p) => sum + p.confidence, 0) / this.trainingData.length 
      : 0;
    
    return {
      totalPatterns: this.trainingData.length,
      fieldTypes,
      averageConfidence: avgConfidence,
      isInitialized: this.isInitialized
    };
  }
  
  // Clear all training data
  clearTrainingData(): void {
    this.trainingData = [];
    this.frequencyPatterns.clear();
    this.naiveBayes = new NaiveBayes();
    this.knnClassifier = null;
    this.isInitialized = false;
    
    try {
      localStorage.removeItem('invoice-learning-data');
    } catch (error) {
      console.warn('Failed to clear stored learning data:', error);
    }
  }
}