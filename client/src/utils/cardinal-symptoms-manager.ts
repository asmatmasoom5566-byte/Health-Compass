import { Cause } from '@shared/schema';

/**
 * Important Features Manager (formerly Cardinal Symptoms)
 * Manages important features for conditions in the database
 * 
 * Important features are characteristic features that strongly suggest a diagnosis
 * but are not as specific as key features. They contribute 15% each to match likelihood.
 */
export class CardinalSymptomsManager {
  /**
   * Get cardinal symptoms for a condition
   */
  static getCardinalSymptoms(condition: Cause): string[] {
    if (!condition.cardinalSymptoms) {
      return [];
    }
    
    return Array.isArray(condition.cardinalSymptoms) 
      ? condition.cardinalSymptoms 
      : [];
  }

  /**
   * Check if a symptom is a cardinal symptom for a condition
   */
  static isCardinalSymptom(condition: Cause, symptom: string): boolean {
    const cardinalSymptoms = this.getCardinalSymptoms(condition);
    const lowerSymptom = symptom.toLowerCase();
    
    return cardinalSymptoms.some(cardinal => 
      cardinal.toLowerCase().includes(lowerSymptom) || 
      lowerSymptom.includes(cardinal.toLowerCase())
    );
  }

  /**
   * Add cardinal symptoms to a condition
   */
  static addCardinalSymptoms(condition: Cause, symptoms: string[]): Cause {
    const currentCardinal = condition.cardinalSymptoms || [];
    const newSymptoms = symptoms.filter(symptom => 
      !currentCardinal.some(existing => 
        existing.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(existing.toLowerCase())
      )
    );
    
    return {
      ...condition,
      cardinalSymptoms: [...currentCardinal, ...newSymptoms]
    };
  }

  /**
   * Remove cardinal symptoms from a condition
   */
  static removeCardinalSymptoms(condition: Cause, symptomsToRemove: string[]): Cause {
    const currentCardinal = condition.cardinalSymptoms || [];
    const remainingSymptoms = currentCardinal.filter(
      symptom => !symptomsToRemove.some(toRemove => 
        symptom.toLowerCase().includes(toRemove.toLowerCase()) ||
        toRemove.toLowerCase().includes(symptom.toLowerCase())
      )
    );
    
    return {
      ...condition,
      cardinalSymptoms: remainingSymptoms.length > 0 ? remainingSymptoms : undefined
    };
  }

  /**
   * Set cardinal symptoms for a condition (replace all)
   */
  static setCardinalSymptoms(condition: Cause, symptoms: string[]): Cause {
    return {
      ...condition,
      cardinalSymptoms: symptoms.length > 0 ? symptoms : undefined
    };
  }

  /**
   * Validate cardinal symptoms
   */
  static validateCardinalSymptoms(condition: Cause): boolean {
    const cardinal = condition.cardinalSymptoms || [];
    const allSymptoms = [
      ...(condition.symptoms || []),
      ...(condition.definingSymptoms || []),
      ...(condition.pathognomonicSymptoms || [])
    ];
    
    // All cardinal symptoms should exist in the condition's symptom lists
    return cardinal.every(cardinalSymptom => 
      allSymptoms.some(symptom => {
        const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
        return symptomString.toLowerCase().includes(cardinalSymptom.toLowerCase()) ||
               cardinalSymptom.toLowerCase().includes(symptomString.toLowerCase());
      })
    );
  }

  /**
   * Auto-assign cardinal symptoms based on condition characteristics
   * This is a fallback - ideally cardinal symptoms are manually curated
   */
  static autoAssignCardinalSymptoms(condition: Cause): Cause {
    if (condition.cardinalSymptoms && condition.cardinalSymptoms.length > 0) {
      return condition; // Already has cardinal symptoms
    }

    // Default cardinal symptoms mapping for common conditions
    const DEFAULT_CARDINAL_SYMPTOMS: Record<string, string[]> = {
      'strep throat': ['Sudden onset sore throat', 'Painful swallowing', 'Fever > 38.3°C'],
      'migraine': ['Unilateral throbbing pain', 'Photophobia and phonophobia', 'Nausea/vomiting'],
      'pneumonia': ['Productive cough', 'Pleuritic chest pain', 'Crackles on auscultation'],
      'appendicitis': ['Periumbilical pain migrating to RLQ', 'Anorexia', 'Rebound tenderness'],
      'myocardial infarction': ['Crushing substernal chest pain', 'Radiation to left arm/jaw', 'Diaphoresis'],
      'diabetes mellitus': ['Polyuria', 'Polydipsia', 'Unexplained weight loss'],
      'asthma': ['Episodic wheezing', 'Dyspnea', 'Cough variant'],
      'copd': ['Chronic productive cough', 'Progressive dyspnea', 'Smoking history'],
      'peptic ulcer': ['Burning epigastric pain', 'Pain related to meals', 'Nocturnal pain'],
      'gastroenteritis': ['Watery diarrhea', 'Nausea/vomiting', 'Abdominal cramping']
    };

    const conditionName = condition.name.toLowerCase();
    let cardinalSymptoms: string[] = [];
    
    // Check for exact matches first
    for (const [key, symptoms] of Object.entries(DEFAULT_CARDINAL_SYMPTOMS)) {
      if (conditionName.includes(key.toLowerCase())) {
        cardinalSymptoms = [...symptoms];
        break;
      }
    }
    
    return {
      ...condition,
      cardinalSymptoms
    };
  }

  /**
   * Analyze cardinal symptoms and provide feedback
   */
  static analyzeCardinalSymptoms(condition: Cause): Array<{
    symptom: string;
    category: 'Cardinal' | 'Overlapping';
    explanation: string;
  }> {
    const cardinalSymptoms = this.getCardinalSymptoms(condition);
    const results: Array<{
      symptom: string;
      category: 'Cardinal' | 'Overlapping';
      explanation: string;
    }> = [];

    cardinalSymptoms.forEach(symptom => {
      // Check if symptom overlaps with pathognomonic or defining
      const isPathognomonic = condition.pathognomonicSymptoms?.some(p => 
        p.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(p.toLowerCase())
      );
      
      const isDefining = condition.definingSymptoms?.some(d => 
        d.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(d.toLowerCase())
      );

      if (isPathognomonic || isDefining) {
        results.push({
          symptom,
          category: 'Overlapping',
          explanation: 'This symptom also appears in pathognomonic or defining symptoms'
        });
      } else {
        results.push({
          symptom,
          category: 'Cardinal',
          explanation: 'Characteristic feature contributing 15% to match likelihood'
        });
      }
    });

    return results;
  }

  /**
   * Get categorized symptoms showing cardinal in context
   */
  static getCategorizedSymptoms(condition: Cause): {
    pathognomonic: string[];
    cardinal: string[];
    defining: string[];
    typical: string[];
  } {
    const pathognomonic = condition.pathognomonicSymptoms || [];
    const cardinal = condition.cardinalSymptoms || [];
    const defining = condition.definingSymptoms || [];
    const typical = (condition.symptoms || []).map(s => 
      typeof s === 'string' ? s : s.typicalSymptom
    );

    return {
      pathognomonic,
      cardinal,
      defining,
      typical
    };
  }
}

export default CardinalSymptomsManager;
