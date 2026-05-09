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

// Template for generating conditions from user's custom database
// Conditions will be loaded dynamically from public folder
let cachedConditions: Cause[] | null = null;

// Synchronous version for initial state - returns cached or empty
export const generateFullConditionDatabase = (): Cause[] => {
  // Return cached conditions if available
  if (cachedConditions) {
    return cachedConditions;
  }
  return [];
};

// Async function to load conditions (called from useEffect)
export const loadConditionDatabase = async (): Promise<Cause[]> => {
  // Return cached conditions if already loaded
  if (cachedConditions) {
    return cachedConditions;
  }
  
  try {
    // Load conditions from public folder
    const response = await fetch('/my-conditions.json');
    if (response.ok) {
      const data = await response.json();
      cachedConditions = data as unknown as Cause[];
      console.log(`Loaded ${cachedConditions.length} conditions from my-conditions.json`);
      return cachedConditions;
    }
  } catch (error) {
    console.error('Failed to load conditions from my-conditions.json:', error);
  }
  
  // Return empty array if load fails
  return [];
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
