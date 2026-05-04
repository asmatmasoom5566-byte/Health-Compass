// Advanced JSON Import Processor with Auto-Correction and Field Mapping
import { Cause, DurationCriteria } from '@shared/schema';
import { z } from 'zod';
import { convertLegacyDurationToCriteria } from './condition-migrator';

// Flexible duration entry for import (Start-End Duration Structure)
// Each condition MUST define Start Duration and End Duration (Min/Max Duration fields prohibited)
interface FlexibleDurationEntry {
  durationType?: string; // Acute / Chronic / Relapse / Prolonged
  startDuration?: number; // Earliest possible time (MANDATORY)
  endDuration?: number; // Latest possible time (MANDATORY)
  unit?: string;
  ruleType?: string;
  // Alternative field names
  type?: string;
  start?: number;
  end?: number;
  // Legacy field names (for backward compatibility)
  minDuration?: number;
  maxDuration?: number;
  min?: number;
  max?: number;
}

// Type definitions for flexible input structures
interface FlexibleCondition {
  // Flexible field names that will be auto-mapped
  name?: string;
  title?: string;
  conditionName?: string;
  diagnosis?: string;
  
  // Symptoms - various possible field names
  symptoms?: string[] | string;
  symptomList?: string[] | string;
  presentingSymptoms?: string[] | string;
  complaints?: string[] | string;
  chiefComplaints?: string[] | string;
  
  // Treatment information
  treatment?: string;
  management?: string;
  therapy?: string;
  interventions?: string;
  
  description?: string;
  clinicalInfo?: string;
  details?: string;
  
  // Age rules - various formats
  ageRule?: {
    min?: number;
    max?: number;
    ruleType?: 'soft' | 'hard';
  };
  ageRange?: {
    min?: number;
    max?: number;
    type?: 'soft' | 'hard';
  };
  age_min?: number;
  age_max?: number;
  minAge?: number;
  maxAge?: number;
  ageType?: 'soft' | 'hard';
  age_range?: string; // "30-40" format
  
  // Sex rules - various formats
  sexRule?: 'male' | 'female' | 'both';
  genderRule?: 'male' | 'female' | 'both';
  sex?: 'male' | 'female' | 'both';
  gender?: 'male' | 'female' | 'both';
  sexType?: 'male' | 'female' | 'both';
  gender_applicability?: 'male' | 'female' | 'both';
  
  // Course Type removed per user request
  
  // Duration rules - Start-End Duration Structure
  // Each condition MUST define Start Duration and End Duration (Min/Max Duration fields prohibited)
  durationRule?: {
    start?: number; // Earliest possible time (MANDATORY)
    end?: number; // Latest possible time (MANDATORY)
    unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
    ruleType?: 'soft' | 'hard';
  };
  durationRange?: {
    start?: number; // Earliest possible time (replaces min)
    end?: number; // Latest possible time (replaces max)
    unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
    type?: 'soft' | 'hard';
  };
  duration?: number | string; // Can be "3 days" or 5
  duration_min?: number;
  duration_max?: number;
  durationUnit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  timeFrame?: string;
  
  // New: Multiple duration entries
  durationEntries?: FlexibleDurationEntry[];
  
  // Any extra fields that should be ignored
  [key: string]: any;
}

// Field mapping configuration
const FIELD_MAPPINGS = {
  // Name mappings
  name: ['name', 'title', 'conditionName', 'diagnosis', 'label'],
  
  // Symptom mappings
  symptoms: ['symptoms', 'symptomList', 'presentingSymptoms', 'complaints', 'chiefComplaints', 'signs'],
  
  // Treatment mappings
  treatment: ['treatment', 'management', 'therapy', 'interventions', 'care'],
  
  // Comprehensive info mappings
  description: ['description', 'clinicalInfo', 'details', 'fullReview'],
  
  // Age rule mappings
  ageRule: ['ageRule', 'ageRange', 'age_range'],
  ageRule_min: ['min', 'age_min', 'minAge', 'minimum'],
  ageRule_max: ['max', 'age_max', 'maxAge', 'maximum'],
  ageRule_ruleType: ['ruleType', 'type', 'ageType'],
  
  // Sex rule mappings
  sexRule: ['sexRule', 'genderRule', 'sex', 'gender', 'sexType', 'gender_applicability'],
  

  
  // Duration rule mappings (Start-End Duration Structure)
  durationRule: ['durationRule', 'durationRange', 'timeFrame'],
  durationRule_start: ['start', 'duration_start', 'minimum', 'min', 'startDuration', 'minDuration'],
  durationRule_end: ['end', 'duration_end', 'maximum', 'max', 'endDuration', 'maxDuration'],
  durationRule_unit: ['unit', 'durationUnit'],
  durationRule_ruleType: ['ruleType', 'type'],
};

// Auto-correction processor class
export class ImportProcessor {
  private logs: string[] = [];
  
  // Main processing function
  processImport(jsonData: any): { conditions: Cause[]; logs: string[]; success: boolean } {
    this.logs = [];
    this.log('Starting import processing...');
    
    try {
      // STEP 1: Structure scan and validation
      const conditionsArray = this.scanStructure(jsonData);
      
      if (!conditionsArray || !Array.isArray(conditionsArray)) {
        throw new Error('No valid conditions array found in JSON');
      }
      
      this.log(`Found ${conditionsArray.length} conditions to process`);
      
      // STEP 2: Process each condition with auto-correction
      const processedConditions: Cause[] = [];
      
      for (let i = 0; i < conditionsArray.length; i++) {
        try {
          const processed = this.processCondition(conditionsArray[i], i);
          if (processed) {
            processedConditions.push(processed);
            this.log(`✓ Condition ${i + 1}: ${processed.name} - Successfully processed`);
          }
        } catch (error) {
          this.log(`✗ Condition ${i + 1}: Failed - ${(error as Error).message}`);
        }
      }
      
      // STEP 3: Final validation
      const validatedConditions = this.validateFinal(processedConditions);
      
      this.log(`Import completed: ${validatedConditions.length} conditions successfully imported`);
      
      return {
        conditions: validatedConditions,
        logs: this.logs,
        success: validatedConditions.length > 0
      };
      
    } catch (error) {
      this.log(`Import failed: ${(error as Error).message}`);
      return {
        conditions: [],
        logs: this.logs,
        success: false
      };
    }
  }
  
  // STEP 1: Structure scan
  private scanStructure(jsonData: any): any[] {
    this.log('Scanning JSON structure...');
    
    // Handle various JSON structures
    if (Array.isArray(jsonData)) {
      this.log('✓ Direct array format detected');
      return jsonData;
    }
    
    // Look for conditions in nested objects
    const possiblePaths = [
      'conditions',
      'causes',
      'diagnoses',
      'diseases',
      'medicalConditions',
      'data.conditions',
      'content.conditions'
    ];
    
    for (const path of possiblePaths) {
      const value = this.getNestedValue(jsonData, path);
      if (Array.isArray(value)) {
        this.log(`✓ Found conditions at path: ${path}`);
        return value;
      }
    }
    
    // Try to find any array that looks like conditions
    const arrays = this.findAllArrays(jsonData);
    for (const [path, array] of arrays) {
      if (this.looksLikeConditions(array)) {
        this.log(`✓ Found condition-like array at path: ${path}`);
        return array;
      }
    }
    
    throw new Error('Could not find conditions array in JSON structure');
  }
  
  // STEP 2: Process individual condition with auto-correction
  private processCondition(flexibleCondition: any, index: number): Cause | null {
    this.log(`Processing condition ${index + 1}...`);
    
    // Auto-map field names
    const mappedCondition = this.autoMapFields(flexibleCondition);
    
    // Extract and normalize values
    const name = this.extractName(mappedCondition);
    const symptoms = this.extractSymptoms(mappedCondition);
    const treatment = this.extractTreatment(mappedCondition);
    const ageRule = this.extractAgeRule(mappedCondition);
    const sexRule = this.extractSexRule(mappedCondition);

    const durationRule = this.extractDurationRule(mappedCondition);
    const durationCriteria = this.extractDurationCriteria(mappedCondition, durationRule)!;
    
    // Validate required fields
    if (!name) {
      throw new Error('Missing condition name');
    }
    
    if (!symptoms || symptoms.length === 0) {
      throw new Error('Missing symptoms');
    }
    
    // Course Type is now guaranteed to have a value ('Acute', 'Chronic', or 'Both')
    // Validation happens during extraction with appropriate warnings logged
    
    // Create standardized condition
    const condition: Cause = {
      id: crypto.randomUUID(),
      name,
      symptoms,
      treatment: treatment || '',
      ageRule,
      sexRule,
      durationRule,
      durationCriteria: durationCriteria!
    };
    
    return condition;
  }
  
  // Field extraction with auto-correction
  private extractName(condition: any): string {
    // Try multiple field names
    const nameFields = ['name', 'title', 'conditionName', 'diagnosis'];
    for (const field of nameFields) {
      if (condition[field] && typeof condition[field] === 'string' && condition[field].trim()) {
        return condition[field].trim();
      }
    }
    return '';
  }
  
  private extractSymptoms(condition: any): string[] {
    const symptomFields = ['symptoms', 'symptomList', 'presentingSymptoms', 'complaints', 'chiefComplaints'];
    
    for (const field of symptomFields) {
      if (condition[field]) {
        if (Array.isArray(condition[field])) {
          return condition[field].filter((s: any) => s && typeof s === 'string').map((s: string) => s.trim());
        } else if (typeof condition[field] === 'string') {
          // Split comma-separated symptoms
          return condition[field].split(',').map((s: string) => s.trim()).filter((s: string) => s);
        }
      }
    }
    return [];
  }
  
  private extractTreatment(condition: any): string {
    const treatmentFields = ['treatment', 'management', 'therapy', 'interventions'];
    for (const field of treatmentFields) {
      if (condition[field] && typeof condition[field] === 'string') {
        return condition[field].trim();
      }
    }
    return '';
  }
  
  private extractAgeRule(condition: any): { min: number; max: number; ruleType: 'soft' | 'hard' } {
    // Handle various age rule formats
    let min = 0;
    let max = 120;
    let ruleType: 'soft' | 'hard' = 'soft';
    
    // Direct ageRule object
    if (condition.ageRule && typeof condition.ageRule === 'object') {
      min = condition.ageRule.min ?? min;
      max = condition.ageRule.max ?? max;
      ruleType = condition.ageRule.ruleType ?? ruleType;
    }
    
    // Age range object
    if (condition.ageRange && typeof condition.ageRange === 'object') {
      min = condition.ageRange.min ?? min;
      max = condition.ageRange.max ?? max;
      ruleType = condition.ageRange.type ?? ruleType;
    }
    
    // Separate min/max fields
    if (typeof condition.age_min === 'number') min = condition.age_min;
    if (typeof condition.age_max === 'number') max = condition.age_max;
    if (typeof condition.minAge === 'number') min = condition.minAge;
    if (typeof condition.maxAge === 'number') max = condition.maxAge;
    
    // Age type
    if (condition.ageType) {
      ruleType = condition.ageType === 'hard' ? 'hard' : 'soft';
    }
    
    // String range format "30-40"
    if (typeof condition.age_range === 'string') {
      const match = condition.age_range.match(/(\d+)[^\d]+(\d+)/);
      if (match) {
        min = parseInt(match[1]);
        max = parseInt(match[2]);
      }
    }
    
    // Ensure valid range
    if (min > max) [min, max] = [max, min];
    if (min < 0) min = 0;
    if (max > 150) max = 150;
    
    return { min, max, ruleType };
  }
  
  private extractSexRule(condition: any): 'male' | 'female' | 'both' {
    const sexFields = ['sexRule', 'genderRule', 'sex', 'gender', 'sexType', 'gender_applicability'];
    
    for (const field of sexFields) {
      if (condition[field]) {
        const value = condition[field].toLowerCase();
        if (value === 'male') return 'male';
        if (value === 'female') return 'female';
        if (value === 'both' || value === 'all') return 'both';
      }
    }
    
    // Default to both if not specified
    return 'both';
  }
  

  
  private extractDurationRule(condition: any): { start?: number; end?: number; min?: number; max?: number; unit: 'hours' | 'days' | 'weeks' | 'months' | 'years'; ruleType: 'soft' | 'hard' } | undefined {
    let min = 0;
    let max = 365;
    let unit: 'hours' | 'days' | 'weeks' | 'months' | 'years' = 'days';
    let ruleType: 'soft' | 'hard' = 'soft';
    
    let hasDurationData = false;
    
    // Direct durationRule object
    if (condition.durationRule && typeof condition.durationRule === 'object') {
      min = condition.durationRule.min ?? min;
      max = condition.durationRule.max ?? max;
      unit = condition.durationRule.unit ?? unit;
      ruleType = condition.durationRule.ruleType ?? ruleType;
      hasDurationData = true;
    }
    
    // Duration range object
    if (condition.durationRange && typeof condition.durationRange === 'object') {
      min = condition.durationRange.min ?? min;
      max = condition.durationRange.max ?? max;
      unit = condition.durationRange.unit ?? unit;
      ruleType = condition.durationRange.type ?? ruleType;
      hasDurationData = true;
    }
    
    // Separate min/max fields
    if (typeof condition.duration_min === 'number') {
      min = condition.duration_min;
      hasDurationData = true;
    }
    if (typeof condition.duration_max === 'number') {
      max = condition.duration_max;
      hasDurationData = true;
    }
    
    // Duration unit
    if (condition.durationUnit) {
      const unitValue = condition.durationUnit.toLowerCase();
      if (['hours', 'days', 'weeks', 'months', 'years'].includes(unitValue)) {
        unit = unitValue as any;
        hasDurationData = true;
      }
    }
    
    // Single duration value - auto-expand with tolerance
    if (condition.duration !== undefined && !hasDurationData) {
      let durationValue = 0;
      
      if (typeof condition.duration === 'number') {
        durationValue = condition.duration;
      } else if (typeof condition.duration === 'string') {
        // Parse "3 days" format
        const match = condition.duration.match(/(\d+)/);
        if (match) {
          durationValue = parseInt(match[1]);
        }
      }
      
      if (durationValue > 0) {
        // Auto-expand with 20% tolerance
        const tolerance = Math.max(1, Math.floor(durationValue * 0.2));
        min = Math.max(0, durationValue - tolerance);
        max = durationValue + tolerance;
        hasDurationData = true;
      }
    }
    
    // Time frame string parsing
    if (condition.timeFrame && typeof condition.timeFrame === 'string' && !hasDurationData) {
      const match = condition.timeFrame.match(/(\d+)[^\d]+(\d+)?[^\d]+(hour|day|week|month|year)s?/i);
      if (match) {
        min = parseInt(match[1]);
        max = match[2] ? parseInt(match[2]) : min;
        const unitMatch = match[3].toLowerCase();
        if (['hour', 'day', 'week', 'month', 'year'].includes(unitMatch)) {
          unit = (unitMatch + (unitMatch.endsWith('s') ? '' : 's')) as any;
        }
        hasDurationData = true;
      }
    }
    
    if (!hasDurationData) {
      return undefined; // No duration data provided
    }
    
    // Ensure valid range
    if (min > max) [min, max] = [max, min];
    if (min < 0) min = 0;
    
    return { min, max, unit, ruleType };
  }
  
  // Extract duration entries (new format with multiple entries per condition)
  private extractDurationCriteria(
    condition: any, 
    durationRule: { start?: number; end?: number; min?: number; max?: number; unit: any; ruleType: 'soft' | 'hard' } | undefined
  ): DurationCriteria | undefined {
    // Check if new format durationEntries exists - use first entry as durationCriteria
    if (condition.durationEntries && Array.isArray(condition.durationEntries) && condition.durationEntries.length > 0) {
      // Use the first entry as the durationCriteria
      const firstEntry = condition.durationEntries[0];
      
      // Map flexible field names (Start-End Duration Structure)
      // Each condition MUST define Start Duration and End Duration (Min/Max Duration fields prohibited)
      // Legacy fields (minDuration, maxDuration, min, max) are only for backward compatibility
      const startDuration = firstEntry.startDuration ?? firstEntry.start ?? firstEntry.minDuration ?? firstEntry.min ?? 0;
      const endDuration = firstEntry.endDuration ?? firstEntry.end ?? firstEntry.maxDuration ?? firstEntry.max ?? 30;
      const unit = this.normalizeDurationUnit(firstEntry.unit || 'days');
      const ruleType = this.normalizeRuleType(firstEntry.ruleType || firstEntry.type || 'soft');
      
      if (unit && ruleType) {
        this.log(`  Converted first duration entry to durationCriteria`);
        return {
          startDuration,
          endDuration,
          unit,
          ruleType
        };
      }
    }
    
    // Fall back to legacy durationRule conversion (Start-End Duration Structure)
    if (durationRule) {
      // Convert legacy rule to new format
      this.log(`  Converted legacy durationRule to durationCriteria`);
      return {
        startDuration: durationRule.start ?? durationRule.min ?? 0,
        endDuration: durationRule.end ?? durationRule.max ?? 30,
        unit: durationRule.unit,
        ruleType: durationRule.ruleType
      };
    }
    
    return undefined;
  }
  
  // Normalize duration unit
  private normalizeDurationUnit(unit: string): 'hours' | 'days' | 'weeks' | 'months' | 'years' | null {
    const normalized = unit.toLowerCase().trim();
    if (['hours', 'hour', 'hr', 'hrs'].includes(normalized)) return 'hours';
    if (['days', 'day', 'd'].includes(normalized)) return 'days';
    if (['weeks', 'week', 'wk', 'wks'].includes(normalized)) return 'weeks';
    if (['months', 'month', 'mo', 'mos'].includes(normalized)) return 'months';
    if (['years', 'year', 'yr', 'yrs'].includes(normalized)) return 'years';
    return 'days'; // Default
  }
  
  // Normalize rule type
  private normalizeRuleType(ruleType: string): 'soft' | 'hard' | null {
    const normalized = ruleType.toLowerCase().trim();
    if (normalized === 'soft' || normalized === 'flexible') return 'soft';
    if (normalized === 'hard' || normalized === 'strict') return 'hard';
    return 'soft'; // Default
  }
  
  // Auto-mapping function
  private autoMapFields(input: any): any {
    const output: any = {};
    
    // Map each field using the mapping configuration
    for (const [targetField, sourceFields] of Object.entries(FIELD_MAPPINGS)) {
      for (const sourceField of sourceFields) {
        if (input[sourceField] !== undefined) {
          output[targetField] = input[sourceField];
          if (sourceField !== targetField) {
            this.log(`  → Mapped field: ${sourceField} → ${targetField}`);
          }
          break;
        }
      }
    }
    
    return output;
  }
  
  // Helper functions
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  private findAllArrays(obj: any, prefix = ''): [string, any[]][] {
    const arrays: [string, any[]][] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        arrays.push([path, value]);
      } else if (typeof value === 'object' && value !== null) {
        arrays.push(...this.findAllArrays(value, path));
      }
    }
    
    return arrays;
  }
  
  private looksLikeConditions(array: any[]): boolean {
    if (array.length === 0) return false;
    
    // Check if array elements have condition-like properties
    const sample = array[0];
    if (typeof sample !== 'object' || sample === null) return false;
    
    // Look for common condition fields
    const conditionIndicators = ['name', 'title', 'symptoms', 'symptomList', 'complaints'];
    const hasConditionFields = conditionIndicators.some(field => field in sample);
    
    return hasConditionFields;
  }
  
  private validateFinal(conditions: Cause[]): Cause[] {
    this.log('Performing final validation...');
    
    return conditions.filter(condition => {
      // Validate name
      if (!condition.name || condition.name.trim().length === 0) {
        this.log(`✗ Invalid condition: missing name`);
        return false;
      }
      
      // Validate symptoms
      if (!condition.symptoms || condition.symptoms.length === 0) {
        this.log(`✗ Invalid condition "${condition.name}": missing symptoms`);
        return false;
      }
      
      // Validate age range
      if (condition.ageRule) {
        if (condition.ageRule.min !== undefined && condition.ageRule.max !== undefined && 
            condition.ageRule.min > condition.ageRule.max) {
          this.log(`⚠ Auto-corrected age range for "${condition.name}": min > max`);
          [condition.ageRule.min, condition.ageRule.max] = [condition.ageRule.max, condition.ageRule.min];
        }
        if (condition.ageRule.min !== undefined && condition.ageRule.min < 0) condition.ageRule.min = 0;
        if (condition.ageRule.max !== undefined && condition.ageRule.max > 150) condition.ageRule.max = 150;
      }
      
      // Validate duration range if present (Start-End Duration Structure)
      // Min/Max Duration fields are prohibited - only use start/end
      if (condition.durationRule) {
        const start = condition.durationRule.start;
        const end = condition.durationRule.end;
        
        if (start !== undefined && end !== undefined && start > end) {
          this.log(`⚠ Auto-corrected duration range for "${condition.name}": start > end`);
          condition.durationRule.start = end;
          condition.durationRule.end = start;
        }
        
        if (start !== undefined && start < 0) {
          condition.durationRule.start = 0;
        }
        
        if (end !== undefined && end < 0) {
          condition.durationRule.end = 0;
        }
      }
      
      return true;
    });
  }
  
  private log(message: string) {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  }
  
  // Public method to get processing logs
  getLogs(): string[] {
    return this.logs;
  }
}

// Export utility function
export const processImport = (jsonData: any) => {
  const processor = new ImportProcessor();
  return processor.processImport(jsonData);
};