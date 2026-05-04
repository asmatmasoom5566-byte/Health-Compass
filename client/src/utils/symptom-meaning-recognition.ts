// Symptom Meaning Recognition Engine - 12-Layer Architecture
import { Cause } from '../../shared/schema';

// Core Types
interface SymptomConcept {
  medicalTerm: string;
  commonPatientWords: string[];
  localExpressions: string[];
  phraseVariants: string[];
  category?: string;
  severityIndicators?: string[];
}

interface RecognizedSymptom {
  concept: string;
  originalText: string;
  confidence: number;
  isPresent: boolean;
  contextMatch: boolean;
  matchedVariant: string;
}

interface RecognitionContext {
  age: number;
  sex: 'male' | 'female';
  duration: number;
  durationUnit: string;
  associatedSymptoms: string[];
}

interface RecognitionResult {
  recognizedSymptoms: RecognizedSymptom[];
  unresolvedItems: string[];
  confidenceScore: number;
  safetyFlags: string[];
}

// Symptom Concept Library
const SYMPTOM_CONCEPTS: SymptomConcept[] = [
  // Pain-related symptoms
  {
    medicalTerm: "headache",
    commonPatientWords: ["headache", "head ache", "head pain", "migraine", "throbbing head"],
    localExpressions: ["head hurting", "brain pain", "skull ache", "head pressure"],
    phraseVariants: ["severe headache", "mild headache", "constant headache", "intermittent headache"],
    category: "neurological",
    severityIndicators: ["severe", "throbbing", "pounding", "intense"]
  },
  {
    medicalTerm: "chest pain",
    commonPatientWords: ["chest pain", "chest ache", "heart pain", "chest discomfort"],
    localExpressions: ["heart hurting", "chest tightness", "pressure in chest", "chest burning"],
    phraseVariants: ["sharp chest pain", "dull chest pain", "crushing chest pain", "stabbing chest pain"],
    category: "cardiovascular",
    severityIndicators: ["crushing", "stabbing", "severe", "radiating"]
  },
  {
    medicalTerm: "abdominal pain",
    commonPatientWords: ["stomach pain", "belly ache", "tummy pain", "abdominal discomfort"],
    localExpressions: ["belly hurting", "stomach cramps", "gut pain", "tummy ache"],
    phraseVariants: ["upper abdominal pain", "lower abdominal pain", "cramping pain", "sharp stomach pain"],
    category: "gastrointestinal",
    severityIndicators: ["cramping", "sharp", "severe", "constant"]
  },
  
  // Respiratory symptoms
  {
    medicalTerm: "shortness of breath",
    commonPatientWords: ["difficulty breathing", "can't catch breath", "breathless", "out of breath"],
    localExpressions: ["breathing hard", "can't breathe properly", "air hunger", "gasping for air"],
    phraseVariants: ["sudden shortness of breath", "progressive breathlessness", "exertional dyspnea"],
    category: "respiratory",
    severityIndicators: ["sudden", "progressive", "severe", "at rest"]
  },
  {
    medicalTerm: "cough",
    commonPatientWords: ["coughing", "persistent cough", "dry cough", "wet cough"],
    localExpressions: ["hacking", "chesty cough", "productive cough", "barking cough"],
    phraseVariants: ["chronic cough", "new onset cough", "worsening cough", "cough with sputum"],
    category: "respiratory",
    severityIndicators: ["persistent", "chronic", "worsening", "productive"]
  },
  
  // General symptoms
  {
    medicalTerm: "fever",
    commonPatientWords: ["fever", "high temperature", "running temperature", "feeling hot"],
    localExpressions: ["temperature", "pyrexia", "chills and fever", "feeling feverish"],
    phraseVariants: ["low grade fever", "high fever", "intermittent fever", "continuous fever"],
    category: "general",
    severityIndicators: ["high", "persistent", "intermittent", "spiking"]
  },
  {
    medicalTerm: "fatigue",
    commonPatientWords: ["tiredness", "exhaustion", "feeling weak", "lack of energy"],
    localExpressions: ["worn out", "drained", "no energy", "feeling sluggish"],
    phraseVariants: ["chronic fatigue", "severe fatigue", "progressive tiredness"],
    category: "general",
    severityIndicators: ["severe", "chronic", "progressive", "debilitating"]
  },
  {
    medicalTerm: "nausea",
    commonPatientWords: ["nausea", "feeling sick", "queasy stomach", "stomach upset"],
    localExpressions: ["want to vomit", "stomach turning", "feeling queasy", "sick to stomach"],
    phraseVariants: ["persistent nausea", "intermittent nausea", "severe nausea"],
    category: "gastrointestinal",
    severityIndicators: ["severe", "persistent", "constant", "worsening"]
  },
  
  // Neurological symptoms
  {
    medicalTerm: "dizziness",
    commonPatientWords: ["dizziness", "lightheadedness", "feeling dizzy", "spinning sensation"],
    localExpressions: ["head spinning", "unsteady", "off balance", "vertigo"],
    phraseVariants: ["sudden dizziness", "positional dizziness", "persistent dizziness"],
    category: "neurological",
    severityIndicators: ["sudden", "severe", "persistent", "positional"]
  },
  {
    medicalTerm: "weakness",
    commonPatientWords: ["weakness", "muscle weakness", "feeling weak", "lack of strength"],
    localExpressions: ["no strength", "can't move properly", "muscles giving out", "limp feeling"],
    phraseVariants: ["generalized weakness", "localized weakness", "progressive weakness"],
    category: "neurological",
    severityIndicators: ["progressive", "severe", "generalized", "localized"]
  }
];

// Negative symptom indicators
const NEGATIVE_INDICATORS = [
  "no", "not", "without", "absent", "lack of", "don't have", "doesn't have",
  "never", "none", "nothing", "nil", "negative for", "denies", "ruled out"
];

export class SymptomMeaningRecognitionEngine {
  // Layer 1: Input Normalization
  static normalizeInput(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Layer 2: Symptom Concept Library (already defined above)
  
  // Layer 3: Synonym & Alias Mapping
  static mapToConcept(text: string): SymptomConcept | null {
    const normalizedText = this.normalizeInput(text);
    
    for (const concept of SYMPTOM_CONCEPTS) {
      // Check medical term
      if (normalizedText.includes(concept.medicalTerm.toLowerCase())) {
        return concept;
      }
      
      // Check common patient words
      for (const patientWord of concept.commonPatientWords) {
        if (normalizedText.includes(patientWord.toLowerCase())) {
          return concept;
        }
      }
      
      // Check local expressions
      for (const localExpr of concept.localExpressions) {
        if (normalizedText.includes(localExpr.toLowerCase())) {
          return concept;
        }
      }
      
      // Check phrase variants
      for (const variant of concept.phraseVariants) {
        if (normalizedText.includes(variant.toLowerCase())) {
          return concept;
        }
      }
    }
    
    return null;
  }

  // Layer 4: Phrase-Level Interpretation
  static interpretPhrase(text: string, context: RecognitionContext): RecognizedSymptom | null {
    const concept = this.mapToConcept(text);
    if (!concept) return null;
    
    const normalizedText = this.normalizeInput(text);
    let confidence = 0.5; // Base confidence
    let isPresent = true;
    let matchedVariant = '';
    
    // Check for negative indicators
    const hasNegative = NEGATIVE_INDICATORS.some(indicator => 
      normalizedText.includes(indicator.toLowerCase())
    );
    
    if (hasNegative) {
      isPresent = false;
      confidence = 0.8; // High confidence for negative findings
    }
    
    // Check context relevance
    const contextMatch = this.checkContextRelevance(concept, context);
    if (contextMatch) confidence += 0.2;
    
    // Determine which variant matched
    for (const variant of [...concept.commonPatientWords, ...concept.localExpressions, ...concept.phraseVariants]) {
      if (normalizedText.includes(variant.toLowerCase())) {
        matchedVariant = variant;
        break;
      }
    }
    
    return {
      concept: concept.medicalTerm,
      originalText: text,
      confidence,
      isPresent,
      contextMatch,
      matchedVariant: matchedVariant || concept.medicalTerm
    };
  }

  // Layer 5: Partial / Approximate Matching
  static partialMatch(text: string): SymptomConcept | null {
    const normalizedText = this.normalizeInput(text);
    
    // Levenshtein distance for fuzzy matching
    for (const concept of SYMPTOM_CONCEPTS) {
      const allVariants = [
        concept.medicalTerm,
        ...concept.commonPatientWords,
        ...concept.localExpressions
      ];
      
      for (const variant of allVariants) {
        if (this.levenshteinDistance(normalizedText, variant.toLowerCase()) <= 2) {
          return concept;
        }
      }
    }
    
    return null;
  }

  // Layer 6: Symptom Cluster Recognition
  static recognizeClusters(symptoms: RecognizedSymptom[]): string[] {
    const clusters: string[] = [];
    
    // Hepatobiliary cluster
    const hepatoSymptoms = ['fever', 'jaundice', 'abdominal pain'];
    if (this.hasCluster(symptoms, hepatoSymptoms)) {
      clusters.push('Hepatobiliary syndrome');
    }
    
    // Respiratory cluster
    const respSymptoms = ['shortness of breath', 'cough', 'chest pain'];
    if (this.hasCluster(symptoms, respSymptoms)) {
      clusters.push('Respiratory syndrome');
    }
    
    // Neurological cluster
    const neuroSymptoms = ['headache', 'dizziness', 'weakness'];
    if (this.hasCluster(symptoms, neuroSymptoms)) {
      clusters.push('Neurological syndrome');
    }
    
    return clusters;
  }

  // Layer 7: Context-Aware Interpretation
  static checkContextRelevance(concept: SymptomConcept, context: RecognitionContext): boolean {
    // Age-based relevance
    if (concept.medicalTerm === "fever" && context.age < 2) {
      return true; // Fever is highly relevant in young children
    }
    
    if (concept.medicalTerm === "chest pain" && context.age > 40) {
      return true; // Chest pain more concerning in older adults
    }
    
    // Sex-based relevance
    if (concept.medicalTerm === "abdominal pain" && context.sex === 'female') {
      // Consider gynecological causes
      return true;
    }
    
    // Duration-based relevance
    if (context.duration > 7 && context.durationUnit === 'days') {
      // Chronic conditions more likely
      return ['fatigue', 'chronic pain'].includes(concept.medicalTerm);
    }
    
    return false;
  }

  // Layer 8: Negative Symptom Detection
  static detectNegativeSymptoms(texts: string[]): string[] {
    const negatives: string[] = [];
    
    for (const text of texts) {
      const normalized = this.normalizeInput(text);
      if (NEGATIVE_INDICATORS.some(indicator => 
        normalized.includes(indicator.toLowerCase())
      )) {
        // Extract the symptom being denied
        const concept = this.mapToConcept(text);
        if (concept) {
          negatives.push(concept.medicalTerm);
        }
      }
    }
    
    return negatives;
  }

  // Layer 9: Regional & Cultural Expression Layer
  static getRegionalExpressions(): Record<string, string[]> {
    return {
      // Common regional variations that map to standard terms
      'headache': ['head hurting', 'brain pain', 'skull ache'],
      'fever': ['temperature', 'pyrexia', 'feeling hot'],
      'cough': ['hacking', 'chesty cough'],
      'fatigue': ['tiredness', 'worn out', 'no energy'],
      'nausea': ['stomach upset', 'queasy stomach']
    };
  }

  // Layer 10: Symptom Meaning Expansion
  static expandBroadComplaints(text: string): string[] {
    const expansions: string[] = [];
    const normalized = this.normalizeInput(text);
    
    // Expand common broad complaints
    if (normalized.includes('not feeling well') || normalized.includes('general unwellness')) {
      expansions.push('fatigue', 'fever', 'malaise');
    }
    
    if (normalized.includes('stomach problem') || normalized.includes('tummy trouble')) {
      expansions.push('abdominal pain', 'nausea', 'vomiting');
    }
    
    if (normalized.includes('breathing problem') || normalized.includes('breath problem')) {
      expansions.push('shortness of breath', 'cough', 'chest tightness');
    }
    
    return expansions;
  }

  // Layer 11: Ambiguity & Safety Gate
  static detectAmbiguity(text: string): boolean {
    const ambiguousTerms = [
      'sick', 'ill', 'unwell', 'bad', 'wrong', 'off', 'weird'
    ];
    
    const normalized = this.normalizeInput(text);
    return ambiguousTerms.some(term => normalized.includes(term));
  }

  // Layer 12: Final Symptom Output
  static processSymptoms(
    inputSymptoms: string[], 
    context: RecognitionContext
  ): RecognitionResult {
    const recognizedSymptoms: RecognizedSymptom[] = [];
    const unresolvedItems: string[] = [];
    const safetyFlags: string[] = [];
    
    for (const symptomText of inputSymptoms) {
      // Check for ambiguity first
      if (this.detectAmbiguity(symptomText)) {
        safetyFlags.push(`Ambiguous term: "${symptomText}"`);
        unresolvedItems.push(symptomText);
        continue;
      }
      
      // Try direct matching first
      let recognized = this.interpretPhrase(symptomText, context);
      
      // If no direct match, try partial matching
      if (!recognized) {
        const concept = this.partialMatch(symptomText);
        if (concept) {
          recognized = {
            concept: concept.medicalTerm,
            originalText: symptomText,
            confidence: 0.3, // Lower confidence for partial matches
            isPresent: true,
            contextMatch: false,
            matchedVariant: concept.medicalTerm
          };
        }
      }
      
      if (recognized) {
        recognizedSymptoms.push(recognized);
      } else {
        // Check for expansions
        const expansions = this.expandBroadComplaints(symptomText);
        if (expansions.length > 0) {
          for (const expansion of expansions) {
            recognizedSymptoms.push({
              concept: expansion,
              originalText: symptomText,
              confidence: 0.4,
              isPresent: true,
              contextMatch: false,
              matchedVariant: `expanded from "${symptomText}"`
            });
          }
        } else {
          unresolvedItems.push(symptomText);
        }
      }
    }
    
    // Calculate overall confidence
    const confidenceScore = recognizedSymptoms.length > 0
      ? recognizedSymptoms.reduce((sum, s) => sum + s.confidence, 0) / recognizedSymptoms.length
      : 0;
    
    return {
      recognizedSymptoms,
      unresolvedItems,
      confidenceScore,
      safetyFlags
    };
  }

  // Helper methods
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  private static hasCluster(symptoms: RecognizedSymptom[], clusterSymptoms: string[]): boolean {
    const presentSymptoms = symptoms
      .filter(s => s.isPresent)
      .map(s => s.concept.toLowerCase());
    
    return clusterSymptoms.some(clusterSymptom => 
      presentSymptoms.includes(clusterSymptom.toLowerCase())
    );
  }
  
  // Utility method to get all symptom concepts
  static getAllSymptomConcepts(): SymptomConcept[] {
    return SYMPTOM_CONCEPTS;
  }
  
  // Utility method to get negative indicators
  static getNegativeIndicators(): string[] {
    return NEGATIVE_INDICATORS;
  }
}

// Export types for use in components
export type { 
  SymptomConcept, 
  RecognizedSymptom, 
  RecognitionContext, 
  RecognitionResult 
};
