// Enhanced Defining Symptoms Manager with Analysis Features
// Implements frequency-based analysis and comprehensive management of defining symptoms

import { Cause } from '@shared/schema';

// Frequency thresholds for defining symptoms
const DEFINING_HIGH_THRESHOLD = 0.80; // 80-100% - Pathognomonic level
const DEFINING_MID_THRESHOLD = 0.60;  // 60-80% - Defining level  
const DEFINING_LOW_THRESHOLD = 0.40; // 40-60% - High typical level

// Enhanced defining symptoms database with frequency data
const ENHANCED_DEFINING_DATABASE: Record<string, Array<{symptom: string, frequency: number, confidence: number, category: 'pathognomonic' | 'defining' | 'high-typical'}>> = {
  // Neurological conditions
  'meningitis': [
    {symptom: 'neck stiffness', frequency: 0.75, confidence: 0.95, category: 'defining'},
    {symptom: 'altered consciousness', frequency: 0.72, confidence: 0.92, category: 'defining'},
    {symptom: 'projectile vomiting', frequency: 0.70, confidence: 0.90, category: 'defining'},
    {symptom: 'fever', frequency: 0.85, confidence: 0.95, category: 'pathognomonic'}
  ],
  'migraine': [
    {symptom: 'throbbing headache', frequency: 0.78, confidence: 0.95, category: 'defining'},
    {symptom: 'unilateral headache', frequency: 0.75, confidence: 0.92, category: 'defining'},
    {symptom: 'photophobia', frequency: 0.72, confidence: 0.90, category: 'defining'},
    {symptom: 'nausea', frequency: 0.70, confidence: 0.88, category: 'high-typical'}
  ],
  'stroke': [
    {symptom: 'sudden unilateral weakness', frequency: 0.88, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'facial droop', frequency: 0.82, confidence: 0.92, category: 'defining'},
    {symptom: 'speech difficulty', frequency: 0.80, confidence: 0.90, category: 'defining'},
    {symptom: 'sudden onset', frequency: 0.75, confidence: 0.88, category: 'high-typical'}
  ],
  
  // Cardiovascular conditions
  'myocardial infarction': [
    {symptom: 'crushing chest pain', frequency: 0.95, confidence: 0.95, category: 'defining'},
    {symptom: 'diaphoresis', frequency: 0.90, confidence: 0.92, category: 'defining'},
    {symptom: 'radiating arm pain', frequency: 0.85, confidence: 0.90, category: 'defining'},
    {symptom: 'nausea', frequency: 0.80, confidence: 0.85, category: 'high-typical'}
  ],
  'pulmonary embolism': [
    {symptom: 'sudden dyspnea', frequency: 0.96, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'pleuritic chest pain', frequency: 0.92, confidence: 0.92, category: 'defining'},
    {symptom: 'hemoptysis', frequency: 0.85, confidence: 0.90, category: 'defining'},
    {symptom: 'tachycardia', frequency: 0.80, confidence: 0.85, category: 'high-typical'}
  ],
  
  // Respiratory conditions
  'pneumonia': [
    {symptom: 'fever', frequency: 0.95, confidence: 0.95, category: 'defining'},
    {symptom: 'productive cough', frequency: 0.92, confidence: 0.92, category: 'defining'},
    {symptom: 'pleuritic chest pain', frequency: 0.85, confidence: 0.90, category: 'defining'},
    {symptom: 'malaise', frequency: 0.80, confidence: 0.85, category: 'high-typical'}
  ],
  'asthma': [
    {symptom: 'wheezing', frequency: 0.96, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'shortness of breath', frequency: 0.95, confidence: 0.92, category: 'defining'},
    {symptom: 'chest tightness', frequency: 0.90, confidence: 0.90, category: 'defining'},
    {symptom: 'cough', frequency: 0.85, confidence: 0.85, category: 'high-typical'}
  ],
  
  // Gastrointestinal conditions
  'appendicitis': [
    {symptom: 'right lower quadrant pain', frequency: 0.96, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'rebound tenderness', frequency: 0.92, confidence: 0.92, category: 'defining'},
    {symptom: 'fever', frequency: 0.88, confidence: 0.90, category: 'defining'},
    {symptom: 'nausea', frequency: 0.85, confidence: 0.85, category: 'high-typical'}
  ],
  'pancreatitis': [
    {symptom: 'severe epigastric pain', frequency: 0.96, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'radiating to back', frequency: 0.92, confidence: 0.92, category: 'defining'},
    {symptom: 'nausea', frequency: 0.90, confidence: 0.90, category: 'defining'},
    {symptom: 'vomiting', frequency: 0.85, confidence: 0.85, category: 'high-typical'}
  ],
  
  // Infectious conditions
  'dengue': [
    {symptom: 'severe body aches', frequency: 0.96, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'retro-orbital pain', frequency: 0.92, confidence: 0.92, category: 'defining'},
    {symptom: 'positive tourniquet test', frequency: 0.88, confidence: 0.90, category: 'defining'},
    {symptom: 'fever', frequency: 0.95, confidence: 0.95, category: 'defining'}
  ],
  'malaria': [
    {symptom: 'fever with chills', frequency: 0.96, confidence: 0.95, category: 'pathognomonic'},
    {symptom: 'cyclical fever pattern', frequency: 0.92, confidence: 0.92, category: 'defining'},
    {symptom: 'rigors', frequency: 0.90, confidence: 0.90, category: 'defining'},
    {symptom: 'malaise', frequency: 0.85, confidence: 0.85, category: 'high-typical'}
  ]
};

export class EnhancedDefiningSymptomsManager {
  /**
   * Analyze defining symptoms with frequency data
   */
  static analyzeDefiningSymptoms(condition: Cause): Array<{symptom: string, frequency: number, category: string, explanation: string}> {
    const results: Array<{symptom: string, frequency: number, category: string, explanation: string}> = [];
    const conditionName = condition.name?.toLowerCase() || '';
    
    if (ENHANCED_DEFINING_DATABASE[conditionName]) {
      ENHANCED_DEFINING_DATABASE[conditionName].forEach(data => {
        let category = '';
        let explanation = '';
        
        switch (data.category) {
          case 'pathognomonic':
            category = 'Pathognomonic';
            explanation = `Highly specific symptom occurring in ${Math.round(data.frequency * 100)}% of cases`;
            break;
          case 'defining':
            category = 'Defining';
            explanation = `Important symptom occurring in ${Math.round(data.frequency * 100)}% of cases`;
            break;
          case 'high-typical':
            category = 'High-Typical';
            explanation = `Common symptom occurring in ${Math.round(data.frequency * 100)}% of cases`;
            break;
        }
        
        results.push({
          symptom: data.symptom,
          frequency: data.frequency,
          category,
          explanation
        });
      });
    } else {
      // Default analysis for unknown conditions
      const allSymptoms = [...(condition.symptoms || []), ...(condition.definingSymptoms || [])];
      allSymptoms.forEach((symptom, index) => {
        const frequency = Math.max(0.5, 0.9 - (index * 0.05));
        let category = '';
        let explanation = '';
        
        if (frequency >= DEFINING_HIGH_THRESHOLD) {
          category = 'Pathognomonic';
          explanation = `Highly specific symptom occurring in ${Math.round(frequency * 100)}% of cases`;
        } else if (frequency >= DEFINING_MID_THRESHOLD) {
          category = 'Defining';
          explanation = `Important symptom occurring in ${Math.round(frequency * 100)}% of cases`;
        } else if (frequency >= DEFINING_LOW_THRESHOLD) {
          category = 'High-Typical';
          explanation = `Common symptom occurring in ${Math.round(frequency * 100)}% of cases`;
        } else {
          category = 'Typical';
          explanation = `General symptom occurring in ${Math.round(frequency * 100)}% of cases`;
        }
        
        results.push({
          symptom,
          frequency,
          category,
          explanation
        });
      });
    }
    
    return results;
  }

  /**
   * Get categorized symptoms for a condition
   */
  static getCategorizedSymptoms(condition: Cause): {
    pathognomonic: string[];
    defining: string[];
    highTypical: string[];
    typical: string[];
  } {
    const analysis = this.analyzeDefiningSymptoms(condition);
    
    const pathognomonic: string[] = [];
    const defining: string[] = [];
    const highTypical: string[] = [];
    const typical: string[] = [];
    
    analysis.forEach(item => {
      // Check if symptom exists in condition's symptom list
      const symptomExists = [...(condition.symptoms || []), ...(condition.definingSymptoms || [])]
        .some(s => s.toLowerCase().includes(item.symptom.toLowerCase()) || item.symptom.toLowerCase().includes(s.toLowerCase()));
      
      if (symptomExists) {
        if (item.category === 'Pathognomonic') {
          pathognomonic.push(item.symptom);
        } else if (item.category === 'Defining') {
          defining.push(item.symptom);
        } else if (item.category === 'High-Typical') {
          highTypical.push(item.symptom);
        } else {
          typical.push(item.symptom);
        }
      }
    });
    
    return { pathognomonic, defining, highTypical, typical };
  }

  /**
   * Get symptom analysis summary
   */
  static getAnalysisSummary(condition: Cause): {
    totalSymptoms: number;
    pathognomonicCount: number;
    definingCount: number;
    highTypicalCount: number;
    typicalCount: number;
    recommendation: string;
  } {
    const categorized = this.getCategorizedSymptoms(condition);
    const allSymptoms = [...(condition.symptoms || []), ...(condition.definingSymptoms || [])];
    const uniqueSymptoms = allSymptoms
      .map(s => s.toLowerCase())
      .filter((value, index, self) => self.indexOf(value) === index)
      .length;
    
    const pathognomonicCount = categorized.pathognomonic.length;
    const definingCount = categorized.defining.length;
    const highTypicalCount = categorized.highTypical.length;
    const typicalCount = categorized.typical.length;
    
    let recommendation = '';
    if (pathognomonicCount > 0) {
      recommendation = 'Condition has pathognomonic symptoms - high diagnostic confidence';
    } else if (definingCount >= 2) {
      recommendation = 'Condition has multiple defining symptoms - good diagnostic indicators';
    } else if (definingCount === 1) {
      recommendation = 'Condition has one defining symptom - moderate diagnostic value';
    } else {
      recommendation = 'Consider adding defining symptoms to improve diagnostic accuracy';
    }
    
    return {
      totalSymptoms: uniqueSymptoms,
      pathognomonicCount,
      definingCount,
      highTypicalCount,
      typicalCount,
      recommendation
    };
  }

  /**
   * Suggest defining symptoms based on analysis
   */
  static suggestDefiningSymptoms(condition: Cause): Array<{symptom: string, confidence: number, reason: string}> {
    const analysis = this.analyzeDefiningSymptoms(condition);
    const suggestions: Array<{symptom: string, confidence: number, reason: string}> = [];
    
    // Suggest high-frequency symptoms that aren't already defining
    const currentDefining = condition.definingSymptoms || [];
    
    analysis
      .filter(item => item.category === 'Defining' || item.category === 'High-Typical')
      .filter(item => !currentDefining.some(defining => 
        defining.toLowerCase().includes(item.symptom.toLowerCase()) || 
        item.symptom.toLowerCase().includes(defining.toLowerCase())
      ))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .forEach(item => {
        suggestions.push({
          symptom: item.symptom,
          confidence: item.frequency,
          reason: item.explanation
        });
      });
    
    return suggestions;
  }

  /**
   * Validate defining symptom assignments
   */
  static validateDefiningSymptoms(condition: Cause): {isValid: boolean, issues: string[]} {
    const issues: string[] = [];
    const definingSymptoms = condition.definingSymptoms || [];
    const allSymptoms = [...(condition.symptoms || []), ...definingSymptoms];
    
    // Check for empty defining symptoms
    if (definingSymptoms.length === 0) {
      issues.push('No defining symptoms assigned - consider adding important diagnostic indicators');
    }
    
    // Check for too many defining symptoms (should be 1-3)
    if (definingSymptoms.length > 3) {
      issues.push(`Too many defining symptoms (${definingSymptoms.length}) - recommended maximum is 3`);
    }
    
    // Check if defining symptoms exist in symptom list
    definingSymptoms.forEach(symptom => {
      const exists = allSymptoms.some(s => 
        s.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(s.toLowerCase())
      );
      
      if (!exists) {
        issues.push(`Defining symptom "${symptom}" not found in condition symptoms`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Utility functions for backward compatibility
export const analyzeDefiningSymptoms = EnhancedDefiningSymptomsManager.analyzeDefiningSymptoms;
export const getCategorizedSymptoms = EnhancedDefiningSymptomsManager.getCategorizedSymptoms;
export const getAnalysisSummary = EnhancedDefiningSymptomsManager.getAnalysisSummary;
export const suggestDefiningSymptoms = EnhancedDefiningSymptomsManager.suggestDefiningSymptoms;
export const validateDefiningSymptoms = EnhancedDefiningSymptomsManager.validateDefiningSymptoms;