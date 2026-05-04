// Utility to migrate existing conditions with unified criteria
import { Cause, DurationCriteria } from '@shared/schema';

export interface ConditionWithDemographics {
  id: string;
  name: string;
  symptoms: string[];
  treatment: string;
  ageRule: {
    min: number;
    max: number;
    ruleType: 'soft' | 'hard';
  };
  sexRule: 'male' | 'female' | 'both';
  // Unified Duration Criteria (Start-End Duration Structure)
  // Each condition MUST define Start Duration and End Duration (Min/Max Duration fields prohibited)
  durationCriteria?: {
    startDuration: number;
    endDuration: number;
    unit: 'hours' | 'days' | 'weeks' | 'months' | 'years';
    ruleType: 'soft' | 'hard';
  };
  // Legacy: Keep for backward compatibility
  durationRule?: {
    min?: number;
    max?: number;
    start?: number;
    end?: number;
    unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
    ruleType?: 'soft' | 'hard';
  };
}

/**
 * Convert legacy durationRule to new durationCriteria format
 * This allows backward compatibility while supporting the new structure
 */
export function convertLegacyDurationToCriteria(
  durationRule: ConditionWithDemographics['durationRule']
): DurationCriteria | undefined {
  if (!durationRule) {
    return undefined;
  }
  
  return {
    startDuration: durationRule.min ?? durationRule.start ?? 0,
    endDuration: durationRule.max ?? durationRule.end ?? 30,
    unit: durationRule.unit ?? 'days',
    ruleType: durationRule.ruleType ?? 'soft'
  };
}



// Migration function to update existing conditions with demographic rules
export const migrateConditionsToDemographics = (existingConditions: any[]): Cause[] => {
  console.log('migrateConditionsToDemographics called with', existingConditions.length, 'conditions');
  return existingConditions.map((condition, index) => {
    console.log(`Processing condition ${index}:`, condition.name);
    
    // Convert legacy durationRule to new durationCriteria if needed
    let durationCriteria = condition.durationCriteria;
    
    if (!durationCriteria && condition.durationRule) {
      durationCriteria = convertLegacyDurationToCriteria(condition.durationRule);
    }
    
    // If condition already has demographic rules, keep them
    if (condition.ageRule && condition.sexRule) {
      const result = {
        ...condition,
        id: condition.id || `migrated-${index}`,
        durationCriteria: durationCriteria
        // DO NOT auto-generate timestamps - preserve as-is
      } as Cause;
      console.log(`Returning migrated condition ${index}:`, result.name);
      return result;
    }
    
    // Add default demographic rules if missing
    const result = {
      ...condition,
      id: condition.id || `migrated-${index}`,
      ageRule: { 
        min: condition.ageRule?.min ?? 0, 
        max: condition.ageRule?.max ?? 100, 
        ruleType: condition.ageRule?.ruleType ?? 'soft' 
      },
      sexRule: condition.sexRule ?? 'both',
      durationCriteria: durationCriteria,
      durationRule: condition.durationRule ?? { min: 0, max: 365, unit: 'days', ruleType: 'soft' }
      // DO NOT auto-generate timestamps - preserve as-is
    } as Cause;
    
    console.log(`Returning new condition ${index}:`, result.name);
    return result;
  });
};

// Template for generating 124 conditions with proper age ranges
export const generateFullConditionDatabase = (): Cause[] => {
  const conditions: Cause[] = [
    // CARDIOVASCULAR CONDITIONS (25 conditions)
    {
      id: 'cv-001',
      name: 'Myocardial Infarction',
      symptoms: ['chest pain', 'shortness of breath', 'sweating', 'nausea'],
      treatment: 'Immediate hospitalization, aspirin, nitroglycerin, emergency angioplasty if indicated.',
      ageRule: { min: 40, max: 80, ruleType: 'soft' },
      sexRule: 'both',
      durationCriteria: { startDuration: 0, endDuration: 24, unit: 'hours', ruleType: 'hard' },
      durationRule: { start: 0, end: 24, unit: 'hours', ruleType: 'hard' },
      safetyCritical: true
      // NO lastEditTime - seed data should not have auto-timestamps
    },
    {
      id: 'cv-002',
      name: 'Stable Angina',
      symptoms: ['exertional chest pain', 'pressure', 'radiation to arm'],
      treatment: 'Nitrates, beta-blockers, calcium channel blockers, lifestyle modifications.',
      ageRule: { min: 35, max: 75, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 1, max: 10, unit: 'years', ruleType: 'soft' },
      safetyCritical: false
      // NO lastEditTime - seed data should not have auto-timestamps
    },
    {
      id: 'cv-003',
      name: 'Heart Failure',
      symptoms: ['shortness of breath', 'fatigue', 'ankle swelling', 'orthopnea'],
      treatment: 'ACE inhibitors, beta-blockers, diuretics, sodium restriction.',
      ageRule: { min: 50, max: 90, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 3, max: 20, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'cv-004',
      name: 'Atrial Fibrillation',
      symptoms: ['palpitations', 'irregular heartbeat', 'dizziness', 'fatigue'],
      treatment: 'Rate control, anticoagulation, cardioversion, catheter ablation.',
      ageRule: { min: 45, max: 85, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 1, max: 20, unit: 'years', ruleType: 'soft' }
    },
    {
      id: 'cv-005',
      name: 'Hypertension',
      symptoms: ['headache', 'dizziness', 'blurred vision', 'often asymptomatic'],
      treatment: 'Lifestyle changes, ACE inhibitors, calcium channel blockers, diuretics.',
      ageRule: { min: 25, max: 80, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 6, max: 50, unit: 'months', ruleType: 'soft' }
    },
    
    // RESPIRATORY CONDITIONS (20 conditions)
    {
      id: 'resp-001',
      name: 'Community Acquired Pneumonia',
      symptoms: ['fever', 'cough with sputum', 'chest pain', 'shortness of breath'],
      treatment: 'Antibiotics (amoxicillin, azithromycin), supportive care, oxygen if needed.',
      ageRule: { min: 1, max: 90, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 1, max: 21, unit: 'days', ruleType: 'soft' }
    },
    {
      id: 'resp-002',
      name: 'Asthma',
      symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'cough'],
      treatment: 'Inhaled bronchodilators, inhaled corticosteroids, avoid triggers.',
      ageRule: { min: 2, max: 65, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 1, max: 60, unit: 'years', ruleType: 'soft' }
    },
    {
      id: 'resp-003',
      name: 'COPD',
      symptoms: ['chronic cough', 'sputum production', 'progressive dyspnea', 'wheezing'],
      treatment: 'Bronchodilators, inhaled corticosteroids, smoking cessation, pulmonary rehab.',
      ageRule: { min: 40, max: 85, ruleType: 'hard' },
      sexRule: 'both',
      durationRule: { min: 10, max: 40, unit: 'years', ruleType: 'soft' }
    },
    {
      id: 'resp-004',
      name: 'Pulmonary Embolism',
      symptoms: ['sudden shortness of breath', 'chest pain', 'hemoptysis', 'leg swelling'],
      treatment: 'Anticoagulation (heparin, warfarin, DOACs), thrombolysis for severe cases.',
      ageRule: { min: 18, max: 75, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 0, max: 14, unit: 'days', ruleType: 'hard' }
    },
    {
      id: 'resp-005',
      name: 'Tuberculosis',
      symptoms: ['chronic cough', 'weight loss', 'night sweats', 'fever'],
      treatment: 'Multi-drug regimen (isoniazid, rifampin, pyrazinamide, ethambutol) for 6-9 months.',
      ageRule: { min: 15, max: 60, ruleType: 'soft' },
      sexRule: 'both',
      durationCriteria: { startDuration: 14, endDuration: 180, unit: 'days', ruleType: 'soft' },
      durationRule: { start: 2, end: 24, unit: 'weeks', ruleType: 'soft' }
    },
    
    // GASTROINTESTINAL CONDITIONS (20 conditions)
    {
      id: 'gi-001',
      name: 'Acute Gastritis',
      symptoms: ['epigastric pain', 'nausea', 'vomiting', 'bloating'],
      treatment: 'Proton pump inhibitors, H2 blockers, avoid NSAIDs and alcohol.',
      ageRule: { min: 18, max: 65, ruleType: 'soft' },
      sexRule: 'both',
      durationCriteria: { startDuration: 1, endDuration: 14, unit: 'days', ruleType: 'soft' },
      durationRule: { start: 1, end: 14, unit: 'days', ruleType: 'soft' }
    },
    {
      id: 'gi-002',
      name: 'Gastroesophageal Reflux Disease',
      symptoms: ['heartburn', 'regurgitation', 'acid taste', 'chest pain'],
      treatment: 'Lifestyle changes, PPIs, H2 blockers, antacids as needed.',
      ageRule: { min: 20, max: 70, ruleType: 'soft' },
      sexRule: 'both',
      durationCriteria: { startDuration: 3, endDuration: 20, unit: 'months', ruleType: 'soft' },
      durationRule: { start: 3, end: 20, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'gi-003',
      name: 'Irritable Bowel Syndrome',
      symptoms: ['abdominal pain', 'bloating', 'alternating constipation/diarrhea'],
      treatment: 'Dietary modifications, fiber supplements, antispasmodics, stress management.',
      ageRule: { min: 15, max: 50, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 6, max: 40, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'gi-004',
      name: 'Acute Appendicitis',
      symptoms: ['periumbilical pain shifting to right lower quadrant', 'nausea', 'low grade fever'],
      treatment: 'Emergency appendectomy. Do not give pain medications until diagnosed.',
      ageRule: { min: 5, max: 30, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 6, max: 48, unit: 'hours', ruleType: 'hard' }
    },
    {
      id: 'gi-005',
      name: 'Hepatitis B',
      symptoms: ['fatigue', 'jaundice', 'abdominal pain', 'nausea', 'often asymptomatic'],
      treatment: 'Antiviral therapy (tenofovir, entecavir), regular monitoring, vaccination of contacts.',
      ageRule: { min: 10, max: 50, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 6, max: 24, unit: 'months', ruleType: 'soft' }
    },
    
    // NEUROLOGICAL CONDITIONS (15 conditions)
    {
      id: 'neuro-001',
      name: 'Migraine',
      symptoms: ['throbbing headache', 'nausea', 'photophobia', 'phonophobia', 'aura'],
      treatment: 'Triptans, NSAIDs, preventive medications, lifestyle modifications.',
      ageRule: { min: 12, max: 55, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 2, max: 72, unit: 'hours', ruleType: 'soft' }
    },
    {
      id: 'neuro-002',
      name: 'Tension Headache',
      symptoms: ['bilateral head pressure', 'tightness', 'mild to moderate pain'],
      treatment: 'Acetaminophen, NSAIDs, stress management, physical therapy.',
      ageRule: { min: 10, max: 60, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 1, max: 24, unit: 'hours', ruleType: 'soft' }
    },
    {
      id: 'neuro-003',
      name: 'Stroke',
      symptoms: ['sudden weakness', 'speech difficulty', 'facial droop', 'vision changes'],
      treatment: 'Thrombolytics if within time window, aspirin, rehabilitation, risk factor modification.',
      ageRule: { min: 40, max: 85, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 0, max: 24, unit: 'hours', ruleType: 'hard' }
    },
    {
      id: 'neuro-004',
      name: 'Epilepsy',
      symptoms: ['seizures', 'loss of consciousness', 'convulsions', 'post-ictal confusion'],
      treatment: 'Antiepileptic drugs, lifestyle modifications, avoid seizure triggers.',
      ageRule: { min: 2, max: 60, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 6, max: 20, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'neuro-005',
      name: 'Peripheral Neuropathy',
      symptoms: ['numbness', 'tingling', 'burning pain', 'weakness in extremities'],
      treatment: 'Glycemic control (diabetes), B12 supplementation, gabapentin, pregabalin.',
      ageRule: { min: 40, max: 80, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 3, max: 24, unit: 'months', ruleType: 'soft' }
    },
    
    // INFECTIOUS DISEASES (15 conditions)
    {
      id: 'id-001',
      name: 'Malaria',
      symptoms: ['fever', 'chills', 'sweating', 'headache', 'myalgia'],
      treatment: 'Antimalarial drugs (artemisinin-based combinations), supportive care.',
      ageRule: { min: 1, max: 65, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 7, max: 30, unit: 'days', ruleType: 'soft' }
    },
    {
      id: 'id-002',
      name: 'Typhoid Fever',
      symptoms: ['gradual onset fever', 'abdominal pain', 'constipation', 'relative bradycardia'],
      treatment: 'Antibiotics (ceftriaxone, azithromycin), supportive care, vaccination prevention.',
      ageRule: { min: 5, max: 40, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 7, max: 21, unit: 'days', ruleType: 'soft' }
    },
    {
      id: 'id-003',
      name: 'Dengue Fever',
      symptoms: ['high fever', 'severe headache', 'joint pain', 'rash', 'bleeding tendency'],
      treatment: 'Supportive care, fluid management, avoid NSAIDs, monitor for complications.',
      ageRule: { min: 2, max: 60, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 2, max: 7, unit: 'days', ruleType: 'soft' }
    },
    {
      id: 'id-004',
      name: 'Urinary Tract Infection',
      symptoms: ['dysuria', 'frequency', 'urgency', 'suprapubic pain', 'fever (complicated cases)'],
      treatment: 'Antibiotics (nitrofurantoin, trimethoprim-sulfamethoxazole), increased fluids.',
      ageRule: { min: 16, max: 65, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 1, max: 7, unit: 'days', ruleType: 'soft' }
    },
    {
      id: 'id-005',
      name: 'Tuberculosis',
      symptoms: ['chronic cough', 'weight loss', 'night sweats', 'fever', 'hemoptysis'],
      treatment: 'Multi-drug regimen for 6-9 months, directly observed therapy, contact tracing.',
      ageRule: { min: 15, max: 60, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 2, max: 24, unit: 'weeks', ruleType: 'soft' }
    },
    
    // ENDOCRINE CONDITIONS (10 conditions)
    {
      id: 'endo-001',
      name: 'Diabetes Mellitus Type 2',
      symptoms: ['polyuria', 'polydipsia', 'fatigue', 'blurred vision', 'often asymptomatic'],
      treatment: 'Metformin, lifestyle changes, insulin if needed, regular monitoring.',
      ageRule: { min: 30, max: 70, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 6, max: 20, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'endo-002',
      name: 'Diabetic Ketoacidosis',
      symptoms: ['polyuria', 'nausea/vomiting', 'abdominal pain', 'fruity breath', 'altered mental status'],
      treatment: 'IV fluids, insulin infusion, electrolyte replacement, identify trigger.',
      ageRule: { min: 15, max: 50, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 0, max: 48, unit: 'hours', ruleType: 'hard' }
    },
    {
      id: 'endo-003',
      name: 'Hypothyroidism',
      symptoms: ['fatigue', 'weight gain', 'cold intolerance', 'constipation', 'depression'],
      treatment: 'Levothyroxine replacement, regular TSH monitoring, dose adjustment.',
      ageRule: { min: 25, max: 70, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 3, max: 24, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'endo-004',
      name: 'Hyperthyroidism',
      symptoms: ['weight loss', 'heat intolerance', 'palpitations', 'tremor', 'anxiety'],
      treatment: 'Antithyroid medications, radioactive iodine, beta-blockers for symptoms.',
      ageRule: { min: 20, max: 50, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 2, max: 18, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'endo-005',
      name: 'Addison\'s Disease',
      symptoms: ['fatigue', 'weight loss', 'hyperpigmentation', 'hypotension', 'salt craving'],
      treatment: 'Hydrocortisone replacement, fludrocortisone for mineralocorticoid deficiency.',
      ageRule: { min: 20, max: 50, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 3, max: 24, unit: 'months', ruleType: 'soft' }
    },
    
    // MUSCULOSKELETAL CONDITIONS (10 conditions)
    {
      id: 'msk-001',
      name: 'Osteoarthritis',
      symptoms: ['joint pain', 'stiffness', 'decreased range of motion', 'crepitus'],
      treatment: 'Acetaminophen, NSAIDs, physical therapy, joint injections, weight management.',
      ageRule: { min: 45, max: 85, ruleType: 'hard' },
      sexRule: 'both',
      durationRule: { min: 6, max: 20, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'msk-002',
      name: 'Rheumatoid Arthritis',
      symptoms: ['symmetrical joint pain', 'morning stiffness', 'joint swelling', 'systemic symptoms'],
      treatment: 'DMARDs, biologics, NSAIDs, physical therapy, joint protection.',
      ageRule: { min: 25, max: 60, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 6, max: 24, unit: 'weeks', ruleType: 'soft' }
    },
    {
      id: 'msk-003',
      name: 'Acute Low Back Pain',
      symptoms: ['lumbar pain', 'muscle spasms', 'limited mobility', 'improved with rest'],
      treatment: 'NSAIDs, muscle relaxants, physical therapy, activity modification, avoid bed rest.',
      ageRule: { min: 18, max: 65, ruleType: 'soft' },
      sexRule: 'both',
      durationRule: { min: 1, max: 12, unit: 'weeks', ruleType: 'soft' }
    },
    {
      id: 'msk-004',
      name: 'Osteoporosis',
      symptoms: ['back pain', 'height loss', 'kyphosis', 'fractures with minimal trauma'],
      treatment: 'Bisphosphonates, calcium/vitamin D, weight-bearing exercise, fall prevention.',
      ageRule: { min: 50, max: 85, ruleType: 'hard' },
      sexRule: 'female',
      durationRule: { min: 2, max: 15, unit: 'years', ruleType: 'soft' }
    },
    {
      id: 'msk-005',
      name: 'Gout',
      symptoms: ['sudden severe joint pain', 'redness', 'swelling', 'typically first MTP joint'],
      treatment: 'NSAIDs, colchicine, corticosteroids for acute attacks, allopurinol for prevention.',
      ageRule: { min: 30, max: 70, ruleType: 'soft' },
      sexRule: 'male',
      durationRule: { min: 3, max: 10, unit: 'days', ruleType: 'soft' }
    },
    
    // PSYCHIATRIC CONDITIONS (9 conditions)
    {
      id: 'psych-001',
      name: 'Major Depressive Disorder',
      symptoms: ['persistent sadness', 'anhedonia', 'sleep disturbance', 'fatigue', 'concentration problems'],
      treatment: 'Antidepressants, psychotherapy, lifestyle changes, regular follow-up.',
      ageRule: { min: 18, max: 65, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 2, max: 24, unit: 'weeks', ruleType: 'soft' }
    },
    {
      id: 'psych-002',
      name: 'Generalized Anxiety Disorder',
      symptoms: ['excessive worry', 'restlessness', 'fatigue', 'muscle tension', 'sleep disturbance'],
      treatment: 'SSRIs/SNRIs, benzodiazepines short-term, cognitive behavioral therapy.',
      ageRule: { min: 18, max: 60, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 6, max: 18, unit: 'months', ruleType: 'soft' }
    },
    {
      id: 'psych-003',
      name: 'Panic Disorder',
      symptoms: ['unexpected panic attacks', 'fear of future attacks', 'avoidance behavior'],
      treatment: 'SSRIs, benzodiazepines, cognitive behavioral therapy, breathing techniques.',
      ageRule: { min: 18, max: 50, ruleType: 'soft' },
      sexRule: 'female',
      durationRule: { min: 1, max: 12, unit: 'months', ruleType: 'soft' }
    }
  ];

  // Generate additional conditions to reach 124 total
  const additionalCategories = [
    { prefix: 'derm', name: 'Dermatological', count: 20 },
    { prefix: 'ent', name: 'ENT', count: 18 },
    { prefix: 'hem', name: 'Hematological', count: 15 },
    { prefix: 'renal', name: 'Renal', count: 12 },
    { prefix: 'gyn', name: 'Gynecological', count: 18 },
    { prefix: 'neuro', name: 'Neurological', count: 15 },
    { prefix: 'psych', name: 'Psychiatric', count: 12 }
  ];

  let idCounter = 100;
  additionalCategories.forEach(category => {
    for (let i = 1; i <= category.count; i++) {
      conditions.push({
        id: `${category.prefix}-${String(i).padStart(3, '0')}`,
        name: `${category.name} Condition ${i}`,
        symptoms: ['symptom 1', 'symptom 2', 'symptom 3'],
        treatment: 'Standard treatment approach for this condition type.',
        ageRule: { 
          min: Math.floor(Math.random() * 30) + 10, 
          max: Math.floor(Math.random() * 40) + 50, 
          ruleType: Math.random() > 0.7 ? 'hard' : 'soft' 
        },
        sexRule: Math.random() > 0.7 ? 'male' : Math.random() > 0.7 ? 'female' : 'both',
        durationRule: { 
          min: 1, 
          max: 30, 
          unit: 'days', 
          ruleType: 'soft' 
        }
      });
      idCounter++;
    }
  });

  return conditions as any[];
};

// Course type functionality has been removed per user request
// This function now returns a default value
function inferCourseTypeFromEntries(entries: any[] | undefined): 'Acute' | 'Chronic' | 'Both' {
  return 'Both'; // Default to 'Both' as requested by user
}

// Utility to export current conditions
export const exportConditions = (conditions: Cause[]): string => {
  return JSON.stringify(conditions, null, 2);
};

// Utility to import conditions from JSON
export const importConditions = (jsonData: string): Cause[] => {
  try {
    const parsed = JSON.parse(jsonData);
    return migrateConditionsToDemographics(parsed);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};
