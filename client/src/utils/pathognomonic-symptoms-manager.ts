// Pathognomonic Symptoms Manager
// This utility handles pathognomonic symptoms which are highly specific clinical features that,
// when present, almost confirm a diagnosis.

import { Cause } from '@shared/schema';

// Common pathognomonic symptoms for various conditions (based on clinical guidelines)
const DEFAULT_PATHOGNOMONIC_SYMPTOMS: Record<string, string[]> = {
  // Neurological conditions
  'meningitis': ['nuchal rigidity', 'kernig sign', 'brudzinski sign'],
  'migraine': ['aura', 'unilateral throbbing headache with photophobia'],
  'stroke': ['sudden unilateral weakness', 'facial droop'],
  'seizure': ['tonic-clonic movements', 'postictal confusion'],
  'bell palsy': ['sudden unilateral facial paralysis'],
  'trigeminal neuralgia': ['electric shock-like pain in face'],
  
  // Cardiovascular conditions
  'myocardial infarction': ['crushing chest pain radiating to left arm', 'diaphoresis'],
  'pulmonary embolism': ['sudden dyspnea with pleuritic chest pain'],
  'heart failure': ['orthopnea', 'paroxysmal nocturnal dyspnea'],
  'aortic dissection': ['tearing chest pain radiating to back'],
  
  // Respiratory conditions
  'pneumothorax': ['sudden sharp chest pain with dyspnea'],
  'pneumonia': ['rusty sputum'],
  'asthma': ['expiratory wheeze'],
  
  // Gastrointestinal conditions
  'appendicitis': ['migration of pain from periumbilical to right lower quadrant'],
  'pancreatitis': ['severe epigastric pain radiating to back'],
  'peptic ulcer': ['gnawing epigastric pain relieved by food'],
  'cholecystitis': ['positive murphy sign'],
  'hepatitis': ['jaundice'],
  
  // Infectious conditions
  'dengue': ['positive tourniquet test', 'severe retro-orbital pain'],
  'malaria': ['cyclical fever pattern'],
  'typhoid': ['step-ladder fever pattern', 'relative bradycardia'],
  'measles': ['koplik spots'],
  'mumps': ['parotid swelling'],
  'rubella': ['postauricular lymphadenopathy'],
  
  // Dermatological conditions
  'erythema nodosum': ['tender erythematous nodules on shins'],
  'erythema marginatum': ['serpiginous rash'],
  'lichen planus': ['pruritic purple polygonal papules'],
  
  // Rheumatological conditions
  'gout': ['podagra', 'monarticular arthritis'],
  'rheumatic fever': ['sydenham chorea', 'erythema marginatum'],
  'scleroderma': ['digital pitting', 'calcific deposits'],
  
  // Endocrine conditions
  'hyperthyroidism': ['exophthalmos', 'lid lag'],
  'hypothyroidism': ['delayed relaxation of reflexes'],
  'acromegaly': ['enlarged hands and feet'],
  'cretinism': ['coarse facial features', 'protruding tongue'],
  
  // Emergency conditions
  'anaphylaxis': ['urticaria with respiratory distress', 'angioedema'],
  'sepsis': ['purpuric rash'],
  'carbon monoxide poisoning': ['cherry red appearance'],
  'cyanide poisoning': ['bitter almond odor'],
  'organophosphate poisoning': ['garlic odor']
};

export class PathognomonicSymptomsManager {
  /**
   * Auto-assign pathognomonic symptoms to a condition based on condition name and symptoms
   */
  static autoAssignPathognomonicSymptoms(condition: Cause): Cause {
    // If already has pathognomonic symptoms, return as-is
    if (condition.pathognomonicSymptoms && condition.pathognomonicSymptoms.length > 0) {
      return condition;
    }
    
    // Try to match by condition name (case-insensitive)
    const conditionName = condition.name.toLowerCase();
    let pathognomonicSymptoms: string[] = [];
    
    // Check for exact matches first
    for (const [key, symptoms] of Object.entries(DEFAULT_PATHOGNOMONIC_SYMPTOMS)) {
      if (conditionName.includes(key.toLowerCase())) {
        // Filter to only include symptoms that are also in the condition's symptom list
        const validSymptoms = symptoms.filter(pathognomonicSymptom => 
          condition.symptoms.some(symptom => 
            symptom.toLowerCase().includes(pathognomonicSymptom.toLowerCase()) ||
            pathognomonicSymptom.toLowerCase().includes(symptom.toLowerCase())
          )
        );
        
        if (validSymptoms.length > 0) {
          pathognomonicSymptoms = [...validSymptoms];
          break;
        }
      }
    }
    
    // If no exact match based on symptoms, use fallback but only if we're confident
    if (pathognomonicSymptoms.length === 0) {
      // Don't auto-assign if we're not confident - leave empty for manual assignment
      pathognomonicSymptoms = [];
    }
    
    return {
      ...condition,
      pathognomonicSymptoms
    };
  }

  /**
   * Auto-assign pathognomonic symptoms to all conditions in an array
   */
  static autoAssignAllPathognomonicSymptoms(conditions: Cause[]): Cause[] {
    return conditions.map(condition => this.autoAssignPathognomonicSymptoms(condition));
  }

  /**
   * Get pathognomonic symptoms for a condition (without modifying the original)
   */
  static getPathognomonicSymptoms(condition: Cause): string[] {
    if (condition.pathognomonicSymptoms && condition.pathognomonicSymptoms.length > 0) {
      return condition.pathognomonicSymptoms;
    }
    
    // Return auto-assigned version without modifying original
    const assigned = this.autoAssignPathognomonicSymptoms(condition);
    return assigned.pathognomonicSymptoms || [];
  }

  /**
   * Check if a symptom is a pathognomonic symptom for a condition
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
   * Get all pathognomonic symptoms for reference
   */
  static getAllPathognomonicSymptoms(): Record<string, string[]> {
    return { ...DEFAULT_PATHOGNOMONIC_SYMPTOMS };
  }

  /**
   * Add custom pathognomonic symptoms for a condition
   */
  static addCustomPathognomonicSymptoms(condition: Cause, symptoms: string[]): Cause {
    return {
      ...condition,
      pathognomonicSymptoms: [...(condition.pathognomonicSymptoms || []), ...symptoms]
    };
  }

  /**
   * Remove pathognomonic symptoms for a condition
   */
  static removePathognomonicSymptoms(condition: Cause, symptomsToRemove: string[]): Cause {
    const currentPathognomonic = condition.pathognomonicSymptoms || [];
    const remainingPathognomonic = currentPathognomonic.filter(
      symptom => !symptomsToRemove.some(toRemove => 
        symptom.toLowerCase().includes(toRemove.toLowerCase()) ||
        toRemove.toLowerCase().includes(symptom.toLowerCase())
      )
    );
    
    return {
      ...condition,
      pathognomonicSymptoms: remainingPathognomonic.length > 0 ? remainingPathognomonic : undefined
    };
  }

  /**
   * Replace all pathognomonic symptoms for a condition
   */
  static setPathognomonicSymptoms(condition: Cause, symptoms: string[]): Cause {
    return {
      ...condition,
      pathognomonicSymptoms: symptoms.length > 0 ? symptoms : undefined
    };
  }

  /**
   * Validate that pathognomonic symptoms are reasonable
   * They should be highly specific and present in the condition's symptom list
   */
  static validatePathognomonicSymptoms(condition: Cause): boolean {
    const pathognomonic = condition.pathognomonicSymptoms || [];
    const allSymptoms = [...(condition.symptoms || [])];
    
    // All pathognomonic symptoms should be in the condition's symptom list
    return pathognomonic.every(pathognomonicSymptom => 
      allSymptoms.some(symptom => 
        symptom.toLowerCase().includes(pathognomonicSymptom.toLowerCase()) ||
        pathognomonicSymptom.toLowerCase().includes(symptom.toLowerCase())
      )
    );
  }
}

// Utility functions for backward compatibility
export const autoAssignPathognomonicSymptoms = PathognomonicSymptomsManager.autoAssignPathognomonicSymptoms;
export const autoAssignAllPathognomonicSymptoms = PathognomonicSymptomsManager.autoAssignAllPathognomonicSymptoms;