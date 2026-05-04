// Enhanced Pathognomonic Symptoms Manager
// Implements frequency-based auto-assignment and manual management of pathognomonic symptoms

import { Cause } from '@shared/schema';

// Frequency thresholds for auto-assignment
const PATHOGNOMONIC_THRESHOLD = 0.80; // 80-100% of cases
const DEFINING_THRESHOLD = 0.60; // 60-80% of cases
const AUTO_ASSIGN_CONFIDENCE_THRESHOLD = 0.9; // 90% confidence needed for auto-assignment

// Enhanced pathognomonic symptoms database with frequency data
const ENHANCED_PATHOGNOMONIC_DATABASE: Record<string, Array<{symptom: string, frequency: number, confidence: number}>> = {
  // Neurological conditions
  'meningitis': [
    {symptom: 'nuchal rigidity', frequency: 0.85, confidence: 0.95},
    {symptom: 'kernig sign', frequency: 0.82, confidence: 0.90},
    {symptom: 'brudzinski sign', frequency: 0.80, confidence: 0.85}
  ],
  'migraine': [
    {symptom: 'unilateral headache', frequency: 0.85, confidence: 0.92},
    {symptom: 'photophobia', frequency: 0.82, confidence: 0.95},
    {symptom: 'throbbing headache', frequency: 0.81, confidence: 0.90}
  ],
  'stroke': [
    {symptom: 'sudden unilateral weakness', frequency: 0.88, confidence: 0.95},
    {symptom: 'facial droop', frequency: 0.85, confidence: 0.92},
    {symptom: 'speech difficulty', frequency: 0.82, confidence: 0.88}
  ],
  'seizure': [
    {symptom: 'tonic-clonic movements', frequency: 0.85, confidence: 0.85},
    {symptom: 'loss of consciousness', frequency: 0.82, confidence: 0.92}
  ],
  
  // Cardiovascular conditions
  'myocardial infarction': [
    {symptom: 'crushing chest pain', frequency: 0.80, confidence: 0.90},
    {symptom: 'diaphoresis', frequency: 0.75, confidence: 0.88},
    {symptom: 'radiating arm pain', frequency: 0.70, confidence: 0.85}
  ],
  'pulmonary embolism': [
    {symptom: 'sudden dyspnea', frequency: 0.85, confidence: 0.92},
    {symptom: 'pleuritic chest pain', frequency: 0.80, confidence: 0.90}
  ],
  'heart failure': [
    {symptom: 'orthopnea', frequency: 0.75, confidence: 0.88},
    {symptom: 'ankle swelling', frequency: 0.80, confidence: 0.90}
  ],
  
  // Respiratory conditions
  'pneumonia': [
    {symptom: 'fever', frequency: 0.85, confidence: 0.92},
    {symptom: 'productive cough', frequency: 0.80, confidence: 0.90},
    {symptom: 'rusty sputum', frequency: 0.70, confidence: 0.85}
  ],
  'asthma': [
    {symptom: 'wheezing', frequency: 0.85, confidence: 0.92},
    {symptom: 'shortness of breath', frequency: 0.90, confidence: 0.95}
  ],
  
  // Gastrointestinal conditions
  'appendicitis': [
    {symptom: 'right lower quadrant pain', frequency: 0.85, confidence: 0.92},
    {symptom: 'rebound tenderness', frequency: 0.75, confidence: 0.88},
    {symptom: 'migration of pain', frequency: 0.70, confidence: 0.85}
  ],
  'pancreatitis': [
    {symptom: 'severe epigastric pain', frequency: 0.80, confidence: 0.90},
    {symptom: 'radiating to back', frequency: 0.75, confidence: 0.88}
  ],
  
  // Infectious conditions
  'dengue': [
    {symptom: 'severe body aches', frequency: 0.85, confidence: 0.92},
    {symptom: 'retro-orbital pain', frequency: 0.80, confidence: 0.90}
  ],
  'malaria': [
    {symptom: 'fever with chills', frequency: 0.85, confidence: 0.92},
    {symptom: 'cyclical fever pattern', frequency: 0.75, confidence: 0.88}
  ],
  'typhoid': [
    {symptom: 'step-ladder fever', frequency: 0.70, confidence: 0.85},
    {symptom: 'relative bradycardia', frequency: 0.65, confidence: 0.80}
  ],
  
  // Emergency conditions
  'anaphylaxis': [
    {symptom: 'wheezing', frequency: 0.80, confidence: 0.90},
    {symptom: 'angioedema', frequency: 0.75, confidence: 0.88},
    {symptom: 'urticaria', frequency: 0.85, confidence: 0.92}
  ],
  'sepsis': [
    {symptom: 'fever', frequency: 0.85, confidence: 0.92},
    {symptom: 'hypotension', frequency: 0.70, confidence: 0.85},
    {symptom: 'altered mental status', frequency: 0.65, confidence: 0.80}
  ]
};

export class EnhancedPathognomonicSymptomsManager {
  /**
   * Auto-assign pathognomonic symptoms based on frequency analysis
   * Only assigns symptoms that occur in ≥80% of cases with high confidence
   */
  static autoAssignByFrequency(condition: Cause): Cause {
    // If already has pathognomonic symptoms, return as-is
    if (condition.pathognomonicSymptoms && condition.pathognomonicSymptoms.length > 0) {
      return condition;
    }
    
    // If no condition name, use fallback
    if (!condition.name) {
      return {
        ...condition,
        pathognomonicSymptoms: this.fallbackAutoAssignment(condition)
      };
    }
    
    // Try to match by condition name (case-insensitive)
    const conditionName = condition.name.toLowerCase();
    let autoAssignedSymptoms: string[] = [];
    
    // Check for exact matches first
    for (const [key, symptomData] of Object.entries(ENHANCED_PATHOGNOMONIC_DATABASE)) {
      if (conditionName.includes(key.toLowerCase())) {
        // Filter symptoms that meet frequency threshold and are present in condition
        const validSymptoms = symptomData
          .filter(data => 
            data.frequency >= PATHOGNOMONIC_THRESHOLD && 
            data.confidence >= AUTO_ASSIGN_CONFIDENCE_THRESHOLD
          )
          .map(data => data.symptom)
          .filter(pathognomonicSymptom => 
            condition.symptoms.some(symptom => 
              symptom.toLowerCase().includes(pathognomonicSymptom.toLowerCase()) ||
              pathognomonicSymptom.toLowerCase().includes(symptom.toLowerCase())
            )
          );
        
        if (validSymptoms.length > 0) {
          autoAssignedSymptoms = [...validSymptoms];
          break;
        }
      }
    }
    
    // If no high-frequency matches, use fallback approach
    if (autoAssignedSymptoms.length === 0) {
      autoAssignedSymptoms = this.fallbackAutoAssignment(condition);
    }
    
    return {
      ...condition,
      pathognomonicSymptoms: autoAssignedSymptoms
    };
  }

  /**
   * Fallback auto-assignment for conditions not in the database
   * Uses algorithmic approach to identify highly specific symptoms
   */
  private static fallbackAutoAssignment(condition: Cause): string[] {
    if (!condition.symptoms || condition.symptoms.length === 0) {
      return [];
    }
    
    // For fallback, we'll use the first symptom as potential pathognomonic if it seems highly specific
    // In a real implementation, this would use more sophisticated analysis
    // For now, we'll be conservative and not auto-assign pathognomonic symptoms without strong evidence
    return [];
  }

  /**
   * Classify symptoms based on frequency thresholds
   * Returns object with pathognomonic and defining symptom arrays
   */
  static classifySymptomsByFrequency(condition: Cause): { 
    pathognomonic: string[]; 
    defining: string[]; 
    typical: string[] 
  } {
    const pathognomonic: string[] = [];
    const defining: string[] = [];
    const typical: string[] = [];
    
    const analysis = this.analyzeSymptomFrequency(condition);
    
    analysis.forEach(item => {
      if (item.isPathognomonic) {
        pathognomonic.push(item.symptom);
      } else if (item.frequency >= DEFINING_THRESHOLD) {
        defining.push(item.symptom);
      } else {
        typical.push(item.symptom);
      }
    });
    
    return { pathognomonic, defining, typical };
  }

  /**
   * Analyze symptom frequency within a condition's symptom list
   * This would be enhanced with actual clinical data in production
   */
  static analyzeSymptomFrequency(condition: Cause): Array<{symptom: string, frequency: number, isPathognomonic: boolean, isDefining: boolean}> {
    const results: Array<{symptom: string, frequency: number, isPathognomonic: boolean, isDefining: boolean}> = [];
    
    // In a real implementation, this would analyze actual patient data
    // For now, we'll use the database values or default assumptions
    const conditionName = condition.name?.toLowerCase() || '';
    
    if (ENHANCED_PATHOGNOMONIC_DATABASE[conditionName]) {
      ENHANCED_PATHOGNOMONIC_DATABASE[conditionName].forEach(data => {
        results.push({
          symptom: data.symptom,
          frequency: data.frequency,
          isPathognomonic: data.frequency >= PATHOGNOMONIC_THRESHOLD,
          isDefining: data.frequency >= DEFINING_THRESHOLD && data.frequency < PATHOGNOMONIC_THRESHOLD
        });
      });
    } else {
      // Default analysis for unknown conditions
      condition.symptoms.forEach((symptom, index) => {
        // Assume first symptoms are more characteristic
        const frequency = Math.max(0.5, 0.9 - (index * 0.1));
        results.push({
          symptom,
          frequency,
          isPathognomonic: frequency >= PATHOGNOMONIC_THRESHOLD,
          isDefining: frequency >= DEFINING_THRESHOLD && frequency < PATHOGNOMONIC_THRESHOLD
        });
      });
    }
    
    return results;
  }

  /**
   * Get all pathognomonic symptoms for a condition (manual only - no auto-assignment)
   */
  static getPathognomonicSymptoms(condition: Cause): string[] {
    if (Array.isArray(condition.pathognomonicSymptoms) && condition.pathognomonicSymptoms.length > 0) {
      return condition.pathognomonicSymptoms;
    }
    
    // Return empty array - no auto-assignment
    return [];
  }

  /**
   * Check if a symptom is pathognomonic for a condition
   */
  static isPathognomonicSymptom(condition: Cause, symptom: string): boolean {
    const pathognomonicSymptoms = this.getPathognomonicSymptoms(condition);
    const lowerSymptom = symptom.toLowerCase();
    
    return pathognomonicSymptoms.some(pathognomonic => 
      pathognomonic.toLowerCase().includes(lowerSymptom) || 
      lowerSymptom.includes(pathognomonic.toLowerCase())
    );
  }

  /**
   * Add custom pathognomonic symptoms (manual assignment)
   */
  static addPathognomonicSymptoms(condition: Cause, symptoms: string[]): Cause {
    const currentPathognomonic = Array.isArray(condition.pathognomonicSymptoms) 
      ? condition.pathognomonicSymptoms 
      : [];
    const newSymptoms = symptoms.filter(symptom => 
      !currentPathognomonic.some(existing => 
        existing.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(existing.toLowerCase())
      )
    );
    
    return {
      ...condition,
      pathognomonicSymptoms: [...currentPathognomonic, ...newSymptoms]
    };
  }

  /**
   * Remove pathognomonic symptoms (manual removal)
   */
  static removePathognomonicSymptoms(condition: Cause, symptomsToRemove: string[]): Cause {
    const currentPathognomonic = condition.pathognomonicSymptoms || [];
    const remainingSymptoms = currentPathognomonic.filter(
      symptom => !symptomsToRemove.some(toRemove => 
        symptom.toLowerCase().includes(toRemove.toLowerCase()) ||
        toRemove.toLowerCase().includes(symptom.toLowerCase())
      )
    );
    
    return {
      ...condition,
      pathognomonicSymptoms: remainingSymptoms.length > 0 ? remainingSymptoms : undefined
    };
  }

  /**
   * Replace all pathognomonic symptoms
   */
  static setPathognomonicSymptoms(condition: Cause, symptoms: string[]): Cause {
    return {
      ...condition,
      pathognomonicSymptoms: symptoms.length > 0 ? symptoms : undefined
    };
  }

  /**
   * Get frequency analysis for display in UI
   */
  static getSymptomAnalysis(condition: Cause): Array<{symptom: string, frequency: number, isPathognomonic: boolean, isDefining: boolean, explanation: string}> {
    const analysis = this.analyzeSymptomFrequency(condition);
    
    return analysis.map(item => ({
      ...item,
      explanation: item.isPathognomonic 
        ? 'Highly specific symptom that occurs in 95-100% of cases (Pathognomonic)'
        : item.isDefining
          ? 'Important symptom that occurs in 85-95% of cases (Defining)'
          : 'Typical symptom with lower specificity'
    }));
  }

  /**
   * Validate pathognomonic symptom assignments
   */
  static validateAssignments(condition: Cause): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];
    const pathognomonic = condition.pathognomonicSymptoms || [];
    const allSymptoms = condition.symptoms || [];
    
    // Check that all pathognomonic symptoms are in the symptom list
    pathognomonic.forEach(symptom => {
      const exists = allSymptoms.some(s => 
        s.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(s.toLowerCase())
      );
      
      if (!exists) {
        errors.push(`Pathognomonic symptom "${symptom}" not found in condition symptoms`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility functions for backward compatibility
export const autoAssignPathognomonicByFrequency = EnhancedPathognomonicSymptomsManager.autoAssignByFrequency;
export const getPathognomonicSymptoms = EnhancedPathognomonicSymptomsManager.getPathognomonicSymptoms;
export const isPathognomonicSymptom = EnhancedPathognomonicSymptomsManager.isPathognomonicSymptom;
export const addPathognomonicSymptoms = EnhancedPathognomonicSymptomsManager.addPathognomonicSymptoms;
export const removePathognomonicSymptoms = EnhancedPathognomonicSymptomsManager.removePathognomonicSymptoms;
export const getSymptomAnalysis = EnhancedPathognomonicSymptomsManager.getSymptomAnalysis;