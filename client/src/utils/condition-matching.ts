// Condition Matching Logic Structure
// Implements Sex, Age, and Duration matching with Hard/Soft rules

import { Cause, DurationUnit, RuleType, Symptom } from '@shared/schema';
import { EnhancedPathognomonicSymptomsManager } from './enhanced-pathognomonic-manager';
import { CardinalSymptomsManager } from './cardinal-symptoms-manager';

/**
 * Check if user input matches a symptom (no synonym support - direct match only)
 */
function symptomMatches(
  userInput: string,
  conditionSymptom: string | Symptom
): boolean {
  const normalizedInput = userInput.toLowerCase().trim();
  
  if (typeof conditionSymptom === 'string') {
    const normalizedCondition = conditionSymptom.toLowerCase().trim();
    // Support both full match (exact equality) and partial match (contains)
    return normalizedCondition === normalizedInput || 
           normalizedCondition.includes(normalizedInput) || 
           normalizedInput.includes(normalizedCondition);
  } else {
    // Check typicalSymptom with partial matching support
    const normalizedTypical = conditionSymptom.typicalSymptom.toLowerCase().trim();
    return normalizedTypical === normalizedInput || 
           normalizedTypical.includes(normalizedInput) || 
           normalizedInput.includes(normalizedTypical);
  }
}

/**
 * Get matched symptoms list for display
 */
export function getMatchedSymptomsList(
  conditionSymptoms: Array<string | Symptom>,
  selectedSymptoms: string[]
): string[] {
  const matchedSymptoms: string[] = [];
  
  selectedSymptoms.forEach(userSymptom => {
    const matchingSymptom = conditionSymptoms.find(conditionSymptom => 
      symptomMatches(userSymptom, conditionSymptom)
    );
    
    if (matchingSymptom) {
      const primarySymptom = typeof matchingSymptom === 'string' 
        ? matchingSymptom 
        : matchingSymptom.typicalSymptom;
      
      if (!matchedSymptoms.includes(primarySymptom)) {
        matchedSymptoms.push(primarySymptom);
      }
    }
  });
  
  return matchedSymptoms;
}

/**
 * Count matched symptoms
 */
export function countMatchedSymptoms(
  conditionSymptoms: Array<string | Symptom>,
  selectedSymptoms: string[]
): number {
  if (!conditionSymptoms || conditionSymptoms.length === 0) return 0;
  if (!selectedSymptoms || selectedSymptoms.length === 0) return 0;
  
  let matchCount = 0;
  
  selectedSymptoms.forEach(userSymptom => {
    const isMatch = conditionSymptoms.some(conditionSymptom => 
      symptomMatches(userSymptom, conditionSymptom)
    );
    
    if (isMatch) {
      matchCount++;
    }
  });
  
  return matchCount;
}

// Patient context for matching
export interface PatientMatchingContext {
  age: number;
  sex: 'male' | 'female';
  duration: number;
  durationUnit: DurationUnit;
  symptoms: string[];
}

// Match result for a single rule
export interface RuleMatchResult {
  matched: boolean;
  isHardRule: boolean;
  excluded: boolean; // true if hard rule failed
  downRanked: boolean; // true if soft rule failed
  tag: string; // Display tag
  showTag: boolean; // Whether to show the tag in UI
}

// Overall condition match result
export interface ConditionMatchResult {
  condition: Cause;
  visible: boolean; // Whether condition should be shown
  downRanked: boolean; // Whether condition is down-ranked
  score: number; // Adjusted score (0-100)
  sexMatch: RuleMatchResult;
  ageMatch: RuleMatchResult;
  durationMatch: RuleMatchResult;
  symptomScore: number; // Base symptom match score
  excludedFeaturesCount?: number; // Number of matching exclusion features
  excludedFeaturesList?: string[]; // List of matching exclusion features
  exclusionPenalty?: number; // Total penalty applied from exclusion features
  matchedRiskFactorsCount?: number; // Number of matching risk factors
  matchedRiskFactorsList?: string[]; // List of matching risk factors
  riskFactorsBoost?: number; // Total boost applied from risk factors
}

// Duration conversion factors to days (base unit)
const DURATION_CONVERSION: Record<DurationUnit, number> = {
  hours: 1 / 24,
  days: 1,
  weeks: 7,
  months: 30,
  years: 365
};

/**
 * Convert any duration to days (standard unit)
 */
export function convertToDays(value: number, unit: DurationUnit): number {
  return value * DURATION_CONVERSION[unit];
}

/**
 * SEX RULE MATCHING
 * Sex Rule is always Hard - no soft sex matching allowed
 * 
 * If Condition Sex = Both → Always matches
 * If Condition Sex = Male → Matches only if Patient Sex = Male
 * If Condition Sex = Female → Matches only if Patient Sex = Female
 */
export function matchSexRule(
  conditionSex: 'male' | 'female' | 'both' | undefined,
  patientSex: 'male' | 'female'
): RuleMatchResult {
  // Default to 'both' if not specified
  const sexRule = conditionSex || 'both';
  
  // Sex rule is always hard
  if (sexRule === 'both') {
    return {
      matched: true,
      isHardRule: true,
      excluded: false,
      downRanked: false,
      tag: 'SEX MATCH',
      showTag: true
    };
  }
  
  if (sexRule === patientSex) {
    return {
      matched: true,
      isHardRule: true,
      excluded: false,
      downRanked: false,
      tag: 'SEX MATCH',
      showTag: true
    };
  }
  
  // Sex mismatch - hard rule failed, condition excluded
  return {
    matched: false,
    isHardRule: true,
    excluded: true,
    downRanked: false,
    tag: 'SEX MISMATCH',
    showTag: false // Don't show tag when hard rule fails
  };
}

/**
 * DUAL AGE RANGE MATCHING (Hierarchical System)
 * 
 * Common Age Range (+6% boost):
 * - No rule type - always soft
 * - Patient age within range → +6% match likelihood
 * - Patient age outside range → no boost (0%)
 * 
 * Final Age Range (+3% boost or -8% penalty):
 * - Has rule type (soft/hard)
 * - Patient age within range → +3% match likelihood
 * - Patient age outside range + soft rule → -8% penalty (down-ranked)
 * - Patient age outside range + hard rule → EXCLUDE condition
 * 
 * Priority Logic:
 * 1. Check Common Age Range first → if match, apply +6% and stop
 * 2. If Common doesn't match, check Final Age Range:
 *    - If match → apply +3%
 *    - If no match + soft → apply -8% penalty
 *    - If no match + hard → exclude condition
 */
export function matchDualAgeRange(
  condition: Cause,
  patientAge: number
): {
  ageBoost: number;
  excluded: boolean;
  downRanked: boolean;
  ageRangeType: 'common' | 'final' | 'none';
} {
  const { commonAgeRule, finalAgeRule } = condition;
  
  // Step 1: Check Common Age Range (priority - no rule type, always soft, +6%)
  if (commonAgeRule && (commonAgeRule.min !== undefined || commonAgeRule.max !== undefined)) {
    const commonMin = commonAgeRule.min ?? 0;
    const commonMax = commonAgeRule.max ?? 150;
    const inCommonRange = patientAge >= commonMin && patientAge <= commonMax;
    
    if (inCommonRange) {
      // Patient age within common range → +6% boost
      return {
        ageBoost: 6,
        excluded: false,
        downRanked: false,
        ageRangeType: 'common'
      };
    }
    // Not in common range → continue to check final range
  }
  
  // Step 2: Check Final Age Range (+3% or hard exclusion)
  if (finalAgeRule && (finalAgeRule.min !== undefined || finalAgeRule.max !== undefined)) {
    const finalMin = finalAgeRule.min ?? 0;
    const finalMax = finalAgeRule.max ?? 150;
    const inFinalRange = patientAge >= finalMin && patientAge <= finalMax;
    const isHardRule = finalAgeRule.ruleType === 'hard';
    
    if (inFinalRange) {
      // Patient age within final range → +3% boost
      return {
        ageBoost: 3,
        excluded: false,
        downRanked: false,
        ageRangeType: 'final'
      };
    } else {
      // Patient age outside final range
      if (isHardRule) {
        // Hard rule → exclude condition
        return {
          ageBoost: 0,
          excluded: true,
          downRanked: false,
          ageRangeType: 'final'
        };
      } else {
        // Soft rule → -8% penalty (decreased match likelihood)
        return {
          ageBoost: -8,
          excluded: false,
          downRanked: true,
          ageRangeType: 'final'
        };
      }
    }
  }
  
  // No age rules defined → neutral
  return {
    ageBoost: 0,
    excluded: false,
    downRanked: false,
    ageRangeType: 'none'
  };
}

/**
 * AGE RULE MATCHING (Legacy - for backward compatibility)
 * 
 * HARD AGE RULE:
 * - Patient Age between Min–Max → ✅ AGE MATCH
 * - Patient Age < Min or > Max → ❌ CONDITION EXCLUDED
 * 
 * SOFT AGE RULE:
 * - Patient Age between Min–Max → ✅ AGE MATCH
 * - Patient Age < Min or > Max → ❌ AGE NOT MATCHED, condition still shown but down-ranked
 */
export function matchAgeRule(
  ageRule: { min?: number; max?: number; ruleType?: RuleType } | undefined,
  patientAge: number
): RuleMatchResult {
  // No age rule defined - neutral
  if (!ageRule || (ageRule.min === undefined && ageRule.max === undefined)) {
    return {
      matched: true,
      isHardRule: false,
      excluded: false,
      downRanked: false,
      tag: '',
      showTag: false
    };
  }
  
  const minAge = ageRule.min ?? 0;
  const maxAge = ageRule.max ?? 150;
  const isHardRule = ageRule.ruleType === 'hard';
  const isInRange = patientAge >= minAge && patientAge <= maxAge;
  
  if (isInRange) {
    return {
      matched: true,
      isHardRule,
      excluded: false,
      downRanked: false,
      tag: 'AGE MATCH',
      showTag: true
    };
  }
  
  // Age out of range
  if (isHardRule) {
    return {
      matched: false,
      isHardRule: true,
      excluded: true,
      downRanked: false,
      tag: 'AGE MISMATCH',
      showTag: false // Don't show tag when hard rule fails
    };
  } else {
    // Soft rule - down-rank but still show
    return {
      matched: false,
      isHardRule: false,
      excluded: false,
      downRanked: true,
      tag: '', // Don't show tag for soft rule failure
      showTag: false
    };
  }
}

/**
 * DUAL DURATION RANGE MATCHING (Hierarchical System)
 * 
 * Common Duration Range (+6% boost):
 * - No rule type - always soft
 * - Patient duration within range → +6% match likelihood
 * - Patient duration outside range → no boost (0%)
 * 
 * Final Duration Range (+3% boost or -8% penalty):
 * - Has rule type (soft/hard)
 * - Patient duration within range → +3% match likelihood
 * - Patient duration outside range + soft rule → -8% penalty (down-ranked)
 * - Patient duration outside range + hard rule → EXCLUDE condition
 * 
 * Priority Logic:
 * 1. Check Common Duration Range first → if match, apply +6% and stop
 * 2. If Common doesn't match, check Final Duration Range:
 *    - If match → apply +3%
 *    - If no match + soft → apply -8% penalty
 *    - If no match + hard → exclude condition
 */
export function matchDualDurationRange(
  condition: Cause,
  patientDuration: number,
  patientDurationUnit: DurationUnit
): {
  durationBoost: number;
  excluded: boolean;
  downRanked: boolean;
  durationRangeType: 'common' | 'final' | 'none';
} {
  const { commonDurationCriteria, finalDurationCriteria } = condition;
  
  // Convert patient duration to days for comparison
  const patientDays = convertToDays(patientDuration, patientDurationUnit);
  
  // Step 1: Check Common Duration Range (priority - no rule type, always soft, +6%)
  if (commonDurationCriteria && (commonDurationCriteria.startDuration !== undefined || commonDurationCriteria.endDuration !== undefined)) {
    const commonStartDays = convertToDays(
      commonDurationCriteria.startDuration ?? 0, 
      commonDurationCriteria.unit ?? 'days'
    );
    const commonEndDays = convertToDays(
      commonDurationCriteria.endDuration ?? 999999, 
      commonDurationCriteria.unit ?? 'days'
    );
    const inCommonRange = patientDays >= commonStartDays && patientDays <= commonEndDays;
    
    if (inCommonRange) {
      // Patient duration within common range → +6% boost
      return {
        durationBoost: 6,
        excluded: false,
        downRanked: false,
        durationRangeType: 'common'
      };
    }
    // Not in common range → continue to check final range
  }
  
  // Step 2: Check Final Duration Range (+3% or hard exclusion)
  if (finalDurationCriteria && (finalDurationCriteria.startDuration !== undefined || finalDurationCriteria.endDuration !== undefined)) {
    const finalStartDays = convertToDays(
      finalDurationCriteria.startDuration ?? 0, 
      finalDurationCriteria.unit ?? 'days'
    );
    const finalEndDays = convertToDays(
      finalDurationCriteria.endDuration ?? 999999, 
      finalDurationCriteria.unit ?? 'days'
    );
    const inFinalRange = patientDays >= finalStartDays && patientDays <= finalEndDays;
    const isHardRule = finalDurationCriteria.ruleType === 'hard';
    
    if (inFinalRange) {
      // Patient duration within final range → +3% boost
      return {
        durationBoost: 3,
        excluded: false,
        downRanked: false,
        durationRangeType: 'final'
      };
    } else {
      // Patient duration outside final range
      if (isHardRule) {
        // Hard rule → exclude condition
        return {
          durationBoost: 0,
          excluded: true,
          downRanked: false,
          durationRangeType: 'final'
        };
      } else {
        // Soft rule → -8% penalty (decreased match likelihood)
        return {
          durationBoost: -8,
          excluded: false,
          downRanked: true,
          durationRangeType: 'final'
        };
      }
    }
  }
  
  // No duration rules defined → neutral
  return {
    durationBoost: 0,
    excluded: false,
    downRanked: false,
    durationRangeType: 'none'
  };
}

/**
 * DURATION RULE MATCHING (Start-End Duration System) - LEGACY
 * 
 * Auto-converts all durations to days for comparison
 * 
 * HARD DURATION RULE:
 * - Patient Duration between Start–End → ✅ DURATION MATCH
 * - Patient Duration < Start or > End → ❌ CONDITION EXCLUDED
 * 
 * SOFT DURATION RULE:
 * - Patient Duration between Start–End → ✅ DURATION MATCH
 * - Patient Duration < Start or > End → ❌ DURATION NOT MATCHED, condition still shown but down-ranked
 */
export function matchDurationRule(
  durationCriteria: { 
    startDuration: number; 
    endDuration: number; 
    unit: DurationUnit; 
    ruleType: RuleType 
  } | undefined,
  patientDuration: number,
  patientDurationUnit: DurationUnit,
  legacyDurationRule?: {
    start?: number;
    end?: number;
    min?: number;
    max?: number;
    unit?: DurationUnit;
    ruleType?: RuleType;
  }
): RuleMatchResult {
  // Check new format first
  if (durationCriteria) {
    // Convert both durations to days for comparison
    const conditionStartDays = convertToDays(durationCriteria.startDuration, durationCriteria.unit);
    const conditionEndDays = convertToDays(durationCriteria.endDuration, durationCriteria.unit);
    const patientDays = convertToDays(patientDuration, patientDurationUnit);
    
    const isHardRule = durationCriteria.ruleType === 'hard';
    const isInRange = patientDays >= conditionStartDays && patientDays <= conditionEndDays;
    
    if (isInRange) {
      return {
        matched: true,
        isHardRule,
        excluded: false,
        downRanked: false,
        tag: 'DURATION MATCH',
        showTag: true
      };
    }
    
    // Duration out of range
    if (isHardRule) {
      return {
        matched: false,
        isHardRule: true,
        excluded: true,
        downRanked: false,
        tag: 'DURATION MISMATCH',
        showTag: false // Don't show tag when hard rule fails
      };
    } else {
      // Soft rule - down-rank but still show
      return {
        matched: false,
        isHardRule: false,
        excluded: false,
        downRanked: true,
        tag: '', // Don't show tag for soft rule failure
        showTag: false
      };
    }
  }
  
  // Check legacy format
  if (legacyDurationRule) {
    // Use start/end if available, otherwise use min/max
    let startDuration = legacyDurationRule.start;
    let endDuration = legacyDurationRule.end;
    
    if (startDuration === undefined && endDuration === undefined) {
      startDuration = legacyDurationRule.min;
      endDuration = legacyDurationRule.max;
    }
    
    // If no duration range is defined, consider it a match
    if (startDuration === undefined || endDuration === undefined) {
      return {
        matched: true,
        isHardRule: false,
        excluded: false,
        downRanked: false,
        tag: '',
        showTag: false
      };
    }
    
    // Convert to days for comparison
    const unit = legacyDurationRule.unit || 'days'; // Default to days
    const conditionStartDays = convertToDays(startDuration, unit);
    const conditionEndDays = convertToDays(endDuration, unit);
    const patientDays = convertToDays(patientDuration, patientDurationUnit);
    
    const isHardRule = legacyDurationRule.ruleType === 'hard';
    const isInRange = patientDays >= conditionStartDays && patientDays <= conditionEndDays;
    
    if (isInRange) {
      return {
        matched: true,
        isHardRule,
        excluded: false,
        downRanked: false,
        tag: 'DURATION MATCH',
        showTag: true
      };
    }
    
    // Duration out of range
    if (isHardRule) {
      return {
        matched: false,
        isHardRule: true,
        excluded: true,
        downRanked: false,
        tag: 'DURATION MISMATCH',
        showTag: false // Don't show tag when hard rule fails
      };
    } else {
      // Soft rule - down-rank but still show
      return {
        matched: false,
        isHardRule: false,
        excluded: false,
        downRanked: true,
        tag: '', // Don't show tag for soft rule failure
        showTag: false
      };
    }
  }
  
  // No duration criteria defined - neutral
  return {
    matched: true,
    isHardRule: false,
    excluded: false,
    downRanked: false,
    tag: '',
    showTag: false
  };
}

/**
 * MAIN MATCHING FUNCTION
 * 
 * Implements the complete matching logic:
 * 1. Check symptoms match
 * 2. Check sex rule (always hard)
 * 3. Check age rule (hard or soft)
 * 4. Check duration rule (hard or soft)
 * 
 * Condition is SHOWN when:
 * - Symptoms match AND no Hard rule is violated
 * 
 * Condition is HIDDEN when:
 * - Any Hard rule (Age or Duration) fails
 * - Sex rule fails (always hard)
 * 
 * Condition is DOWN-RANKED when:
 * - Soft rule fails (Age or Duration)
 */
export function matchCondition(
  condition: Cause,
  patientContext: PatientMatchingContext
): ConditionMatchResult {
  // Count matched symptoms
  const symptomMatchesCount = countMatchedSymptoms(condition.symptoms, patientContext.symptoms);
  
  // If no symptoms match, condition is not visible
  if (symptomMatchesCount === 0) {
    return {
      condition,
      visible: false,
      downRanked: false,
      score: 0,
      sexMatch: {
        matched: false,
        isHardRule: true,
        excluded: false,
        downRanked: false,
        tag: '',
        showTag: false
      },
      ageMatch: {
        matched: false,
        isHardRule: false,
        excluded: false,
        downRanked: false,
        tag: '',
        showTag: false
      },
      durationMatch: {
        matched: false,
        isHardRule: false,
        excluded: false,
        downRanked: false,
        tag: '',
        showTag: false
      },
      symptomScore: 0
    };
  }
  
  // Apply matching rules
  const sexMatch = matchSexRule(condition.sexRule, patientContext.sex);
  
  // Use new dual age range matching system
  const dualAgeResult = matchDualAgeRange(condition, patientContext.age);
  
  // Create compatibility wrapper for ageMatch (for UI tags)
  const ageMatch: RuleMatchResult = {
    matched: dualAgeResult.ageBoost > 0,
    isHardRule: false,
    excluded: dualAgeResult.excluded,
    downRanked: dualAgeResult.downRanked,
    tag: dualAgeResult.ageRangeType === 'common' ? 'AGE MATCH (Common)' : dualAgeResult.ageRangeType === 'final' ? 'AGE MATCH (Final)' : '',
    showTag: dualAgeResult.ageBoost > 0
  };
  
  // Use new dual duration range matching system
  const dualDurationResult = matchDualDurationRange(
    condition,
    patientContext.duration,
    patientContext.durationUnit
  );
  
  // Create compatibility wrapper for durationMatch (for UI tags)
  const durationMatch: RuleMatchResult = {
    matched: dualDurationResult.durationBoost > 0,
    isHardRule: false,
    excluded: dualDurationResult.excluded,
    downRanked: dualDurationResult.downRanked,
    tag: dualDurationResult.durationRangeType === 'common' ? 'DURATION MATCH (Common)' : dualDurationResult.durationRangeType === 'final' ? 'DURATION MATCH (Final)' : '',
    showTag: dualDurationResult.durationBoost > 0
  };
  
  // Determine visibility based on hard rules
  const anyHardRuleFailed = sexMatch.excluded || ageMatch.excluded || durationMatch.excluded;
  const visible = !anyHardRuleFailed;
  
  // Determine if down-ranked based on soft rules
  const anySoftRuleFailed = ageMatch.downRanked || durationMatch.downRanked;
  
  // Calculate weighted match likelihood score (0-100%)
  let finalScore = 0;
  
  // Calculate symptom matches
  // Use synonym-aware matching to get matched symptoms for display
  const matchedSymptoms = getMatchedSymptomsList(condition.symptoms, patientContext.symptoms);
  
  // Exclusion features tracking (declared here to be accessible in return statement)
  let excludedFeaturesCount = 0;
  let excludedFeaturesList: string[] = [];
  let exclusionPenalty = 0;
  
  // Risk factors tracking (declared here to be accessible in return statement)
  let matchedRiskFactorsCount = 0;
  let matchedRiskFactorsList: string[] = [];
  let riskFactorsBoost = 0;
    
  if (visible) {
    // NEW WEIGHTED SCORING SYSTEM WITH PENALTIES FOR UNMATCHED SYMPTOMS:
    // Key Features (Pathognomonic): +10% if matched, -5% if not matched
    // Important Features (Cardinal): +7% if matched, -2% if not matched
    // Supportive Features (Typical): +4% if matched (no penalty for unmatched)
    // 
    // Demographics:
    // Age match = +3% to +6% (dual range system)
    // Sex match = +5%
    // Duration match = +3% to +6% (dual range system)
    // Prevalence bonus = +0% to +5%
    // Gender ratio boost = +1% to +5%
    //
    // Penalties:
    // Exclusion features = -15% per matching feature
      
    // Age match contribution (Dual Age Range System)
    // Common Age Range: +6% if within range
    // Final Age Range: +3% if within range, -8% if outside range (soft rule)
    // Priority: Common takes precedence over Final
    // Apply boost or penalty (can be positive or negative)
    finalScore += dualAgeResult.ageBoost;
    
    // Ensure score doesn't go below 0 after age penalty
    finalScore = Math.max(0, finalScore);
      
    // Sex match contribution (5%)
    if (sexMatch.matched) {
      finalScore += 5;
    }
      
    // Duration match contribution (Dual Duration Range System)
    // Common Duration Range: +6% if within range
    // Final Duration Range: +3% if within range, -8% if outside range (soft rule)
    // Priority: Common takes precedence over Final
    // Apply boost or penalty (can be positive or negative)
    finalScore += dualDurationResult.durationBoost;
    
    // Ensure score doesn't go below 0 after duration penalty
    finalScore = Math.max(0, finalScore);
      
    // Check for Key Features (pathognomonic) matches
    // Filter out symptoms that exactly match exclusion features (mutual exclusion)
    const pathognomonicSymptoms = EnhancedPathognomonicSymptomsManager.getPathognomonicSymptoms(condition);
    const matchedPathognomonicSymptoms: { symptom: string; isFullMatch: boolean }[] = [];
    
    matchedSymptoms.forEach(symptom => {
      // First check: Not an exclusion feature (exact match only)
      const isExclusion = (condition.exclusionFeatures || []).some(ef => {
        const exclusionLower = ef.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        return exclusionLower === symptomLower;
      });
      
      // If it's an exclusion feature, filter it out from Key Features
      if (isExclusion) {
        return;
      }
      
      // Check for match with Key Features and determine if full or partial
      for (const ps of pathognomonicSymptoms) {
        const psLower = ps.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        
        // Full match: exact equality
        if (psLower === symptomLower) {
          matchedPathognomonicSymptoms.push({ symptom, isFullMatch: true });
          return;
        }
        // Partial match: one contains the other
        if (psLower.includes(symptomLower) || symptomLower.includes(psLower)) {
          matchedPathognomonicSymptoms.push({ symptom, isFullMatch: false });
          return;
        }
      }
    });
    
    // Check for Important Features (cardinal) matches
    // Filter out symptoms that exactly match exclusion features (mutual exclusion)
    const cardinalSymptoms = CardinalSymptomsManager.getCardinalSymptoms(condition);
    const matchedCardinalSymptoms: { symptom: string; isFullMatch: boolean }[] = [];
    
    matchedSymptoms.forEach(symptom => {
      // First check: Not an exclusion feature (exact match only)
      const isExclusion = (condition.exclusionFeatures || []).some(ef => {
        const exclusionLower = ef.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        return exclusionLower === symptomLower;
      });
      
      // If it's an exclusion feature, filter it out from Important Features
      if (isExclusion) {
        return;
      }
      
      // Check for match with Important Features and determine if full or partial
      for (const cs of cardinalSymptoms) {
        const csLower = cs.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        
        // Full match: exact equality
        if (csLower === symptomLower) {
          matchedCardinalSymptoms.push({ symptom, isFullMatch: true });
          return;
        }
        // Partial match: one contains the other
        if (csLower.includes(symptomLower) || symptomLower.includes(csLower)) {
          matchedCardinalSymptoms.push({ symptom, isFullMatch: false });
          return;
        }
      }
    });
    
    // Calculate Supportive Features (typical) matches
    // Filter out pathognomonic, cardinal, AND exclusion features from typical symptoms
    const typicalSymptoms = condition.symptoms.map(s => typeof s === 'string' ? s : s.typicalSymptom);
    const matchedTypicalSymptoms: { symptom: string; isFullMatch: boolean }[] = [];
    
    matchedSymptoms.forEach(symptom => {
      // Not a pathognomonic symptom
      const isPathognomonic = pathognomonicSymptoms.some(ps => {
        const psLower = ps.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        return psLower === symptomLower || psLower.includes(symptomLower) || symptomLower.includes(psLower);
      });
      // Not a cardinal symptom
      const isCardinal = cardinalSymptoms.some(cs => {
        const csLower = cs.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        return csLower === symptomLower || csLower.includes(symptomLower) || symptomLower.includes(csLower);
      });
      // Not an exclusion feature (mutual exclusion)
      // Using EXACT matching for consistency with exclusion feature penalty logic
      const isExclusion = (condition.exclusionFeatures || []).some(ef => {
        const exclusionLower = ef.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        return exclusionLower === symptomLower;
      });
      // Not a risk factor (mutual exclusion)
      // Using EXACT matching for consistency with risk factor boost logic
      const isRiskFactor = (condition.riskFactors || []).some(rf => {
        const riskFactorLower = rf.toLowerCase().trim();
        const symptomLower = symptom.toLowerCase().trim();
        return riskFactorLower === symptomLower;
      });
      
      if (!isPathognomonic && !isCardinal && !isExclusion && !isRiskFactor) {
        // Check if it's a full or partial match with typical symptoms
        for (const ts of typicalSymptoms) {
          const tsLower = ts.toLowerCase().trim();
          const symptomLower = symptom.toLowerCase().trim();
          
          if (tsLower === symptomLower) {
            matchedTypicalSymptoms.push({ symptom, isFullMatch: true });
            break;
          }
          if (tsLower.includes(symptomLower) || symptomLower.includes(tsLower)) {
            matchedTypicalSymptoms.push({ symptom, isFullMatch: false });
            break;
          }
        }
      }
    });
    
    // Apply Key Features scoring: +10% for full match, +5% (half) for partial match, -5% per unmatched
    const fullMatchPathognomonic = matchedPathognomonicSymptoms.filter(m => m.isFullMatch).length;
    const partialMatchPathognomonic = matchedPathognomonicSymptoms.filter(m => !m.isFullMatch).length;
    const unmatchedPathognomonic = pathognomonicSymptoms.length - matchedPathognomonicSymptoms.length;
    finalScore += fullMatchPathognomonic * 10;                      // +10% per full match Key Feature
    finalScore += partialMatchPathognomonic * 5;                    // +5% (half) per partial match Key Feature
    finalScore += unmatchedPathognomonic * -5;                      // -5% per unmatched Key Feature
    
    // Apply Important Features scoring: +7% for full match, +3.5% (half) for partial match, -2% per unmatched
    const fullMatchCardinal = matchedCardinalSymptoms.filter(m => m.isFullMatch).length;
    const partialMatchCardinal = matchedCardinalSymptoms.filter(m => !m.isFullMatch).length;
    const unmatchedCardinal = cardinalSymptoms.length - matchedCardinalSymptoms.length;
    finalScore += fullMatchCardinal * 7;                            // +7% per full match Important Feature
    finalScore += partialMatchCardinal * 3.5;                       // +3.5% (half) per partial match Important Feature
    finalScore += unmatchedCardinal * -2;                           // -2% per unmatched Important Feature
    
    // Apply Supportive Features scoring: +4% for full match, +2% (half) for partial match (no penalty for unmatched)
    const fullMatchTypical = matchedTypicalSymptoms.filter(m => m.isFullMatch).length;
    const partialMatchTypical = matchedTypicalSymptoms.filter(m => !m.isFullMatch).length;
    const unmatchedTypical = typicalSymptoms.length - matchedTypicalSymptoms.length;
    finalScore += fullMatchTypical * 4;                             // +4% per full match Supportive Feature
    finalScore += partialMatchTypical * 2;                          // +2% (half) per partial match Supportive Feature
    // No penalty for unmatched Supportive Features
    
    // Ensure score doesn't go below 0 after symptom penalties
    finalScore = Math.max(0, finalScore);
    
    // NOTE: Score is NOT capped at 100% - allows accumulation beyond 100%
    // when there are sufficient positive matches across all feature categories
    finalScore = Math.round(finalScore);
    
    // Apply prevalence-based scoring adjustment
    // High Prevalence: +5%, Moderate Prevalence: +3%, Low Prevalence: +0%
    const prevalenceBonus = condition.prevalence === 'high' ? 5 : condition.prevalence === 'moderate' ? 3 : 0;
    finalScore = finalScore + prevalenceBonus;
    
    // Apply Female-to-Male Ratio gender-based boost
    // Independent of sexRule, adds percentage boost based on patient sex
    // Proportional scaling: input 2-10 maps to 1%-5% boost
    // Formula: boost = ((inputValue - 2) / 8) * 4 + 1
    // Examples: 2→1%, 6→3%, 10→5%
    if (condition.femaleToMaleRatio) {
      const { female, male } = condition.femaleToMaleRatio;
      let genderRatioBoost = 0;
      
      // Determine which ratio value to use based on patient sex
      let ratioValue: number | undefined;
      if (patientContext.sex === 'female') {
        ratioValue = female;
      } else if (patientContext.sex === 'male') {
        ratioValue = male;
      }
      
      // Apply proportional scaling if ratio value is defined
      if (ratioValue !== undefined && ratioValue >= 2 && ratioValue <= 10) {
        // Linear interpolation: map [2, 10] → [1, 5]
        // Formula: boost = ((value - 2) / (10 - 2)) * (5 - 1) + 1
        // Simplified: boost = ((value - 2) / 8) * 4 + 1
        genderRatioBoost = ((ratioValue - 2) / 8) * 4 + 1;
        
        if (genderRatioBoost > 0) {
          finalScore = finalScore + genderRatioBoost;
        }
      }
    }
    
    // Apply Exclusion Features penalty (-15% per matching exclusion feature)
    // This is applied AFTER all positive scoring to reduce match likelihood
    // NOTE: Exclusion features use EXACT sentence matching (case-insensitive)
    // Partial matches do NOT trigger the penalty
    if (condition.exclusionFeatures && condition.exclusionFeatures.length > 0) {
      // Check which exclusion features match patient symptoms (EXACT MATCH ONLY)
      const matchedExclusionFeatures = condition.exclusionFeatures.filter(exclusionFeature => {
        const exclusionLower = exclusionFeature.toLowerCase().trim();
        return patientContext.symptoms.some(patientSymptom => {
          const patientLower = patientSymptom.toLowerCase().trim();
          // EXACT MATCH: Only trigger penalty when entire sentence matches
          // No partial matching - requires full text equality
          return exclusionLower === patientLower;
        });
      });
      
      excludedFeaturesCount = matchedExclusionFeatures.length;
      excludedFeaturesList = matchedExclusionFeatures;
      
      // Apply -15% penalty for each matching exclusion feature
      if (excludedFeaturesCount > 0) {
        exclusionPenalty = excludedFeaturesCount * 15;
        finalScore = Math.max(0, finalScore - exclusionPenalty);
      }
    }
    
    // Apply Risk Factors boost (+6% per matching risk factor)
    // Risk factors use EXACT sentence matching (case-insensitive)
    // Partial matches do NOT trigger the boost
    if (condition.riskFactors && condition.riskFactors.length > 0) {
      // Check which risk factors match patient symptoms (EXACT MATCH ONLY)
      const matchedRiskFactors = condition.riskFactors.filter(riskFactor => {
        const riskFactorLower = riskFactor.toLowerCase().trim();
        return patientContext.symptoms.some(patientSymptom => {
          const patientLower = patientSymptom.toLowerCase().trim();
          // EXACT MATCH: Only apply boost when entire sentence matches
          // No partial matching - requires full text equality
          return riskFactorLower === patientLower;
        });
      });
      
      matchedRiskFactorsCount = matchedRiskFactors.length;
      matchedRiskFactorsList = matchedRiskFactors;
      
      // Apply +6% boost for each matching risk factor
      if (matchedRiskFactorsCount > 0) {
        riskFactorsBoost = matchedRiskFactorsCount * 6;
        finalScore = finalScore + riskFactorsBoost;
      }
    }
  }
  // If not visible (hard rule failure), score remains 0
  
  return {
    condition,
    visible,
    downRanked: anySoftRuleFailed,
    score: Math.round(finalScore),
    sexMatch,
    ageMatch,
    durationMatch,
    symptomScore: symptomMatchesCount,
    excludedFeaturesCount: visible ? excludedFeaturesCount : 0,
    excludedFeaturesList: visible ? excludedFeaturesList : [],
    exclusionPenalty: visible ? exclusionPenalty : 0,
    matchedRiskFactorsCount: visible ? matchedRiskFactorsCount : 0,
    matchedRiskFactorsList: visible ? matchedRiskFactorsList : [],
    riskFactorsBoost: visible ? riskFactorsBoost : 0
  };
}

/**
 * Match all conditions against patient context
 * Separates safety critical conditions as per safety override rule
 */
export function matchAllConditions(
  conditions: Cause[],
  patientContext: PatientMatchingContext
): { regular: ConditionMatchResult[], safety: ConditionMatchResult[] } {
  const allResults = conditions
    .map(condition => matchCondition(condition, patientContext))
    .filter(result => result.visible); // Only return visible conditions
  
  // Separate safety critical conditions from regular ones
  const safetyResults = allResults
    .filter(result => result.condition.safetyCritical === true)
    .sort((a, b) => b.score - a.score); // Sort by score descending
  
  // Regular conditions that are not safety critical
  const regularResults = allResults
    .filter(result => result.condition.safetyCritical !== true)
    .sort((a, b) => b.score - a.score); // Sort by score descending
  
  return { regular: regularResults, safety: safetyResults };
}

/**
 * Get match tags for display
 * Only returns tags that should be shown (successful matches)
 */
export function getMatchTags(result: ConditionMatchResult): string[] {
  const tags: string[] = [];
  
  if (result.sexMatch.showTag) tags.push(result.sexMatch.tag);
  if (result.ageMatch.showTag) tags.push(result.ageMatch.tag);
  if (result.durationMatch.showTag) tags.push(result.durationMatch.tag);
  
  return tags;
}

/**
 * Format duration for display
 */
export function formatDuration(
  value: number,
  unit: DurationUnit
): string {
  return `${value} ${unit}`;
}

/**
 * Format duration range for display
 */
export function formatDurationRange(
  start: number,
  end: number,
  unit: DurationUnit
): string {
  return `${start} - ${end} ${unit}`;
}
