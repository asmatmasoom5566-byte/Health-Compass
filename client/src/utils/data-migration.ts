import { Cause } from '@shared/schema';

/**
 * Migrates existing condition data to the new Age/Sex/Duration schema format
 * This utility handles backward compatibility for existing databases
 */

interface LegacyCause {
  id: string;
  name: string;
  symptoms: string[];
  baseRate?: number;
  fullReview?: string;
  treatment?: string;
  atypicalSymptoms?: string[];
  // Legacy fields that need migration
  ageRule?: {
    range?: string; // Format: "30-40", "0-5", "6-12"
    peakAge?: string; // Format: "30-40", "0-5", "6-12"
    ruleType?: 'soft' | 'hard';
  };
  sexRule?: 'male' | 'female' | 'both' | 'both_sexes';
  durationRule?: 'hyperacute' | 'acute' | 'subacute' | 'chronic';
  durationRuleType?: 'soft' | 'hard';
  durationRange?: string; // Format: "1-3", "2-6"
  symptomDetails?: Record<string, string>;
  definingSymptoms?: string[];
  safetyCritical?: boolean;
  painRegions?: string[];
  painPattern?: string;
  lastUpdated?: string;
  lastEditTime?: string;
}

/**
 * Migrates a single condition from legacy format to new format
 */
export function migrateCondition(legacyCause: LegacyCause): Cause {
  // Parse age range if it exists
  let ageRule = undefined;
  if (legacyCause.ageRule?.range) {
    const [min, max] = legacyCause.ageRule.range.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(min) && !isNaN(max)) {
      ageRule = {
        min,
        max,
        ruleType: legacyCause.ageRule.ruleType
      };
    }
  }

  // Handle sex rule migration
  let sexRule = legacyCause.sexRule;
  if (sexRule === 'both_sexes') {
    sexRule = 'both';
  }

  // Parse duration range if it exists
  let durationRule = undefined;
  if (legacyCause.durationRange) {
    const [min, max] = legacyCause.durationRange.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(min) && !isNaN(max)) {
      durationRule = {
        min,
        max,
        unit: 'days' as const, // Default unit
        ruleType: legacyCause.durationRuleType
      };
    }
  }

  // Return migrated condition
  return {
    id: legacyCause.id,
    name: legacyCause.name,
    symptoms: legacyCause.symptoms,
    definingSymptoms: legacyCause.definingSymptoms || [], // Ensure every condition has definingSymptoms
    baseRate: legacyCause.baseRate,
    fullReview: legacyCause.fullReview,
    treatment: legacyCause.treatment,
    atypicalSymptoms: legacyCause.atypicalSymptoms,
    ageRule,
    sexRule: sexRule as 'male' | 'female' | 'both' | undefined,
    durationRule,
    symptomDetails: legacyCause.symptomDetails,
    safetyCritical: legacyCause.safetyCritical || false,
    painRegions: legacyCause.painRegions || [],
    painPattern: legacyCause.painPattern || '',
    lastUpdated: legacyCause.lastUpdated || new Date().toISOString(),
    lastEditTime: legacyCause.lastEditTime || legacyCause.lastUpdated || new Date().toISOString()
  };
}

/**
 * Migrates an array of conditions from legacy format to new format
 */
export function migrateConditions(legacyCauses: LegacyCause[]): Cause[] {
  return legacyCauses.map(migrateCondition);
}

/**
 * Checks if a condition is in legacy format and needs migration
 */
export function needsMigration(cause: any): boolean {
  // Check for legacy fields
  return (
    (cause.ageRule && (cause.ageRule.range || cause.ageRule.peakAge)) ||
    cause.sexRule === 'both_sexes' ||
    (cause.durationRule && typeof cause.durationRule === 'string') ||
    cause.durationRange !== undefined
  );
}

/**
 * Migrates data in localStorage if needed
 */
export function migrateLocalStorageData(): boolean {
  try {
    const storedData = localStorage.getItem('symptom-tracker-data');
    if (!storedData) return false;

    const data = JSON.parse(storedData);
    if (!data.causes || !Array.isArray(data.causes)) return false;

    // Check if any conditions need migration
    const needsMigrationFlag = data.causes.some(needsMigration);
    if (!needsMigrationFlag) return false;

    // Perform migration
    const migratedCauses = migrateConditions(data.causes);
    data.causes = migratedCauses;

    // Save migrated data
    localStorage.setItem('symptom-tracker-data', JSON.stringify(data));
    
    console.log('Successfully migrated condition data to new format');
    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    return false;
  }
}

/**
 * Example usage:
 * 
 * // Check and migrate on app startup
 * useEffect(() => {
 *   const wasMigrated = migrateLocalStorageData();
 *   if (wasMigrated) {
 *     // Refresh data or show notification
 *   }
 * }, []);
 * 
 * // Manual migration of specific condition
 * const migratedCondition = migrateCondition(oldCondition);
 */
