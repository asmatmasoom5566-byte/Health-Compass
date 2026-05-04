// Migration script to update conditions from atypical symptoms to pathognomonic symptoms
// This script will:
// 1. Remove the atypicalSymptoms field from all conditions
// 2. Add pathognomonicSymptoms field where appropriate
// 3. Potentially move some atypical symptoms to pathognomonic if they're clinically significant

import { Cause } from './shared/schema.ts';

export function migrateConditionToPathognomonic(condition: Cause): Cause {
  // Remove atypicalSymptoms and add any pathognomonic symptoms if they existed
  const updatedCondition = { ...condition };
  
  // If the condition had atypical symptoms, we can consider if any should be pathognomonic
  // For now, we'll just remove the atypicalSymptoms field entirely
  if ('atypicalSymptoms' in updatedCondition) {
    delete (updatedCondition as any).atypicalSymptoms;
  }
  
  // Initialize pathognomonicSymptoms if not already present
  if (!updatedCondition.pathognomonicSymptoms) {
    updatedCondition.pathognomonicSymptoms = [];
  }
  
  // Auto-assign pathognomonic symptoms based on condition name if not already set
  if (updatedCondition.pathognomonicSymptoms.length === 0) {
    // For now, just leave it empty - the PathognomonicSymptomsManager will auto-assign when needed
  }
  
  return updatedCondition;
}

export function migrateAllConditionsToPathognomonic(conditions: Cause[]): Cause[] {
  return conditions.map(condition => migrateConditionToPathognomonic(condition));
}

// Example usage:
/*
// In your application code, you could use this like:
const migratedConditions = migrateAllConditionsToPathognomonic(existingConditions);

// Or for a single condition:
const migratedCondition = migrateConditionToPathognomonic(singleCondition);
*/