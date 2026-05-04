// Duration Matching Engine for Health Compass
// Handles conversion, matching, and filtering based on condition duration rules

import { Cause, DurationEntry, DurationUnit, RuleType } from '@shared/schema';

// Patient context for duration matching
export interface PatientDurationContext {
  duration: number;
  durationUnit: DurationUnit;
  age: number;
  sex: 'male' | 'female';
  symptoms: string[];
}

// Result of duration matching
export interface DurationMatchResult {
  isMatch: boolean;
  isExcluded: boolean; // True if hard rule mismatch
  matchedEntry: DurationEntry | null;
  allEntries: DurationEntry[];
  patientDurationInDays: number;
  matchDetails: {
    durationType: string | null;
    isInRange: boolean;
    ruleType: RuleType | null;
    alert?: string;
  };
}

// Conversion factors to days (base unit)
const CONVERSION_TO_DAYS: Record<DurationUnit, number> = {
  hours: 1 / 24,
  days: 1,
  weeks: 7,
  months: 30.44, // Average month
  years: 365.25, // Average year
};

/**
 * Convert any duration to days (base unit for comparison)
 */
export function convertToDays(value: number, unit: DurationUnit): number {
  return value * CONVERSION_TO_DAYS[unit];
}

/**
 * Convert duration from one unit to another
 */
export function convertDuration(
  value: number,
  fromUnit: DurationUnit,
  toUnit: DurationUnit
): number {
  const days = convertToDays(value, fromUnit);
  return days / CONVERSION_TO_DAYS[toUnit];
}

/**
 * Get all duration entries for a condition (handles both new and legacy format)
 */
export function getDurationEntries(condition: Cause): DurationEntry[] {
  // First check for legacy durationEntries array
  if (condition.durationEntries && condition.durationEntries.length > 0) {
    return condition.durationEntries;
  }
  
  // Use the durationCriteria as a single duration entry
  if (condition.durationCriteria) {
    return [{
      durationType: 'General', // Default type
      startDuration: condition.durationCriteria.startDuration,
      endDuration: condition.durationCriteria.endDuration,
      unit: condition.durationCriteria.unit,
      ruleType: condition.durationCriteria.ruleType,
    }];
  }
  
  // Fall back to legacy format
  if (condition.durationRule) {
    const { start, end, unit, ruleType } = condition.durationRule;
    if (start !== undefined && end !== undefined && unit) {
      return [{
        durationType: 'Acute', // Default for legacy
        startDuration: start,
        endDuration: end,
        unit: unit,
        ruleType: ruleType || 'soft',
      }];
    }
  }
  
  return [];
}

/**
 * Check if patient duration matches a specific duration entry
 */
function matchesDurationEntry(
  patientDurationDays: number,
  entry: DurationEntry
): boolean {
  // Handle both new and legacy formats
  let entryStartDays: number, entryEndDays: number;
  
  if ('startDuration' in entry) {
    // New format
    entryStartDays = convertToDays(entry.startDuration, entry.unit);
    entryEndDays = convertToDays(entry.endDuration, entry.unit);
  } else {
    // Legacy format
    entryStartDays = convertToDays(entry.minDuration, entry.unit);
    entryEndDays = convertToDays(entry.maxDuration, entry.unit);
  }

  return patientDurationDays >= entryStartDays && patientDurationDays <= entryEndDays;
}

/**
 * Match patient duration against condition duration entries
 * Following the specified logic:
 * 1. Check Hard rules first - exclude if outside range
 * 2. Check Soft rules - include but rank lower
 */
export function matchDuration(
  condition: Cause,
  patientContext: PatientDurationContext
): DurationMatchResult {
  const entries = getDurationEntries(condition);
  const patientDurationDays = convertToDays(
    patientContext.duration,
    patientContext.durationUnit
  );
  
  // No duration rules defined - condition is eligible
  if (entries.length === 0) {
    return {
      isMatch: true,
      isExcluded: false,
      matchedEntry: null,
      allEntries: [],
      patientDurationInDays: patientDurationDays,
      matchDetails: {
        durationType: null,
        isInRange: true,
        ruleType: null,
      },
    };
  }
  
  // Separate hard and soft rules
  const hardEntries = entries.filter(e => e.ruleType === 'hard');
  const softEntries = entries.filter(e => e.ruleType === 'soft');
  
  // Check hard rules first - if patient matches any hard rule, they're in
  // If patient doesn't match ANY hard rule, they're excluded
  if (hardEntries.length > 0) {
    const matchingHardEntry = hardEntries.find(entry =>
      matchesDurationEntry(patientDurationDays, entry)
    );
    
    if (matchingHardEntry) {
      return {
        isMatch: true,
        isExcluded: false,
        matchedEntry: matchingHardEntry,
        allEntries: entries,
        patientDurationInDays: patientDurationDays,
        matchDetails: {
          durationType: matchingHardEntry.durationType,
          isInRange: true,
          ruleType: 'hard',
        },
      };
    } else {
      // Patient outside all hard ranges - exclude condition
      return {
        isMatch: false,
        isExcluded: true,
        matchedEntry: null,
        allEntries: entries,
        patientDurationInDays: patientDurationDays,
        matchDetails: {
          durationType: null,
          isInRange: false,
          ruleType: 'hard',
          alert: 'Duration outside hard limits',
        },
      };
    }
  }
  
  // No hard rules, check soft rules
  const matchingSoftEntry = softEntries.find(entry =>
    matchesDurationEntry(patientDurationDays, entry)
  );
  
  if (matchingSoftEntry) {
    return {
      isMatch: true,
      isExcluded: false,
      matchedEntry: matchingSoftEntry,
      allEntries: entries,
      patientDurationInDays: patientDurationDays,
      matchDetails: {
        durationType: matchingSoftEntry.durationType,
        isInRange: true,
        ruleType: 'soft',
      },
    };
  }
  
  // No match found in soft rules either
  // For soft rules, we still include but with lower priority
  const closestEntry = softEntries.length > 0 ? softEntries[0] : null;
  
  return {
    isMatch: true,
    isExcluded: false,
    matchedEntry: closestEntry,
    allEntries: entries,
    patientDurationInDays: patientDurationDays,
    matchDetails: {
      durationType: closestEntry?.durationType || null,
      isInRange: false,
      ruleType: 'soft',
      alert: closestEntry ? 'Duration outside typical range' : undefined,
    },
  };
}

/**
 * Filter and score conditions based on duration matching
 * Returns conditions with duration match information
 */
export interface ScoredConditionWithDuration {
  condition: Cause;
  durationMatch: DurationMatchResult;
  durationScore: number; // 0-100 score based on match quality
}

export function filterAndScoreConditionsByDuration(
  conditions: Cause[],
  patientContext: PatientDurationContext
): ScoredConditionWithDuration[] {
  const results: ScoredConditionWithDuration[] = [];
  
  for (const condition of conditions) {
    const durationMatch = matchDuration(condition, patientContext);
    
    // Skip excluded conditions (hard rule mismatch)
    if (durationMatch.isExcluded) {
      continue;
    }
    
    // Calculate duration score
    let durationScore = 100;
    
    if (durationMatch.matchedEntry) {
      // Full match with specific entry
      if (durationMatch.matchDetails.ruleType === 'hard') {
        durationScore = 100; // Hard match = highest score
      } else {
        durationScore = 80; // Soft match = good score
      }
    } else if (durationMatch.matchDetails.isInRange) {
      // In range but no specific entry matched
      durationScore = 60;
    } else {
      // Outside range but not excluded (soft rules)
      durationScore = 40;
    }
    
    results.push({
      condition,
      durationMatch,
      durationScore,
    });
  }
  
  // Sort by duration score (highest first)
  return results.sort((a, b) => b.durationScore - a.durationScore);
}

/**
 * Format duration for display
 */
export function formatDuration(
  value: number,
  unit: DurationUnit,
  format: 'short' | 'long' = 'long'
): string {
  if (format === 'short') {
    const unitShort = unit === 'hours' ? 'hr' :
                      unit === 'days' ? 'd' :
                      unit === 'weeks' ? 'wk' :
                      unit === 'months' ? 'mo' : 'yr';
    return `${value}${unitShort}`;
  }
  
  const unitLabel = value === 1 ? unit.slice(0, -1) : unit; // Remove 's' for singular
  return `${value} ${unitLabel}`;
}

/**
 * Format duration range for display
 */
export function formatDurationRange(
  min: number,
  max: number,
  unit: DurationUnit
): string {
  if (min === max) {
    return formatDuration(min, unit);
  }
  return `${formatDuration(min, unit)} - ${formatDuration(max, unit)}`;
}

/**
 * Get duration type display label with color
 */
export function getDurationTypeDisplay(durationType: string): {
  label: string;
  color: string;
  description: string;
} {
  const displays: Record<string, { label: string; color: string; description: string }> = {
    Acute: {
      label: 'Acute',
      color: '#ef4444', // Red
      description: 'Sudden onset, short duration',
    },
    Chronic: {
      label: 'Chronic',
      color: '#f97316', // Orange
      description: 'Long-standing, persistent',
    },
    Relapse: {
      label: 'Relapse',
      color: '#eab308', // Yellow
      description: 'Return of symptoms after improvement',
    },
    Prolonged: {
      label: 'Prolonged',
      color: '#8b5cf6', // Purple
      description: 'Extended beyond typical course',
    },
  };
  
  return displays[durationType];
}

/**
 * Generate alert message for unusual duration
 */
export function generateDurationAlert(
  conditionName: string,
  durationMatch: DurationMatchResult
): string | null {
  if (!durationMatch.matchedEntry) {
    return null;
  }
  
  const { durationType } = durationMatch.matchedEntry;
  const { isInRange, ruleType } = durationMatch.matchDetails;
  
  if (!isInRange && ruleType === 'soft') {
    return `${conditionName}: ${durationType} / prolonged form`;
  }
  
  if (durationType === 'Chronic' || durationType === 'Prolonged') {
    return `${conditionName}: ${durationType} presentation`;
  }
  
  return null;
}

/**
 * Compare patient duration to condition typical range
 * Returns percentage deviation from typical range
 */
export function calculateDurationDeviation(
  patientDurationDays: number,
  entry: DurationEntry
): number {
  // Handle both new and legacy formats
  let startDays: number, endDays: number;
  
  if ('startDuration' in entry) {
    // New format
    startDays = convertToDays(entry.startDuration, entry.unit);
    endDays = convertToDays(entry.endDuration, entry.unit);
  } else {
    // Legacy format
    startDays = convertToDays(entry.minDuration, entry.unit);
    endDays = convertToDays(entry.maxDuration, entry.unit);
  }
  
  const midPoint = (startDays + endDays) / 2;

  if (patientDurationDays >= startDays && patientDurationDays <= endDays) {
    return 0; // Within range
  }
  
  if (patientDurationDays < startDays) {
    return ((startDays - patientDurationDays) / startDays) * 100;
  }
  
  return ((patientDurationDays - endDays) / endDays) * 100;
}

// Export types for use in other modules
export type { DurationEntry, DurationUnit, RuleType };
