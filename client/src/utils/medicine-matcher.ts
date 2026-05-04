import { Medicine, MedicineEvaluation, patientDemographicsSchema } from '@shared/schema';
import { z } from 'zod';

export type PatientDemographics = z.infer<typeof patientDemographicsSchema>;

interface SymptomMatchResult {
  primaryMatches: string[];
  secondaryMatches: string[];
  inappropriateMatches: string[];
  matchScore: number;
}

export function evaluateMedicineSuitability(
  medicine: Medicine,
  patientDemographics: PatientDemographics,
  symptoms: string[]
): MedicineEvaluation {
  const reasoning: string[] = [];
  const warnings: string[] = [];
  const safetyFlags: string[] = [];
  
  // Convert symptoms to lowercase for matching
  const lowerSymptoms = symptoms.map(s => s.toLowerCase());
  
  // 1. Symptom matching evaluation - THIS IS THE MASTER RULE
  const symptomResult = evaluateSymptomMatch(medicine, lowerSymptoms, reasoning, warnings);
  
  // Master rule: If no symptom match, exclude the medicine completely
  if (symptomResult.matchScore === 0) {
    return {
      medicine,
      suitabilityScore: 0,
      isSuitable: false,
      isContraindicated: false,
      reasoning: [...reasoning, "❌ Medicine excluded: No symptom matches"],
      warnings: warnings.length > 0 ? warnings : undefined,
      safetyFlags: safetyFlags.length > 0 ? safetyFlags : undefined
    };
  }
  
  // If symptoms match, continue with other evaluations
  // 2. Age-based evaluation
  const ageResult = evaluateAgeSuitability(medicine, patientDemographics.age, reasoning, safetyFlags);
  
  // 3. Sex-based evaluation
  const sexResult = evaluateSexSuitability(medicine, patientDemographics.sex, reasoning, warnings, safetyFlags);
  
  // 4. Duration-based evaluation
  const durationResult = evaluateDurationSuitability(medicine, patientDemographics, reasoning);
  
  // 5. Contraindication checking
  const contraindicationResult = checkContraindications(medicine, patientDemographics, symptoms, reasoning, safetyFlags);
  
  // Calculate overall suitability score (0-100)
  const suitabilityScore = calculateSuitabilityScore(
    ageResult,
    sexResult,
    durationResult,
    symptomResult,
    contraindicationResult
  );
  
  // Determine if medicine is suitable and not contraindicated
  const isContraindicated = safetyFlags.length > 0 || contraindicationResult.isContraindicated;
  const isSuitable = suitabilityScore >= 30 && !isContraindicated;
  
  return {
    medicine,
    suitabilityScore,
    isSuitable,
    isContraindicated,
    reasoning,
    warnings: warnings.length > 0 ? warnings : undefined,
    safetyFlags: safetyFlags.length > 0 ? safetyFlags : undefined
  };
}

function evaluateAgeSuitability(
  medicine: Medicine,
  age: number,
  reasoning: string[],
  safetyFlags: string[]
): { isAgeAppropriate: boolean; score: number } {
  const { ageRules } = medicine;
  
  if (!ageRules) {
    reasoning.push("✓ No specific age restrictions");
    return { isAgeAppropriate: true, score: 10 };
  }
  
  // Check neonate restrictions
  if (ageRules.avoidInNeonates && age < 1) {
    safetyFlags.push("❌ Contraindicated in neonates");
    reasoning.push("❌ Avoid in neonates (<1 year)");
    return { isAgeAppropriate: false, score: 0 };
  }
  
  // Check elderly restrictions
  if (ageRules.avoidInElderly && age > 65) {
    safetyFlags.push("❌ Contraindicated in elderly");
    reasoning.push("❌ Avoid in elderly (>65 years)");
    return { isAgeAppropriate: false, score: 0 };
  }
  
  // Check age range
  if (ageRules.min !== undefined && age < ageRules.min) {
    if (ageRules.ruleType === 'hard') {
      safetyFlags.push(`❌ Below minimum age (${ageRules.min} years)`);
      reasoning.push(`❌ Patient too young (age ${age}, minimum ${ageRules.min})`);
      return { isAgeAppropriate: false, score: 0 };
    } else {
      reasoning.push(`⚠️ Below recommended age (age ${age}, minimum ${ageRules.min})`);
      return { isAgeAppropriate: true, score: 5 };
    }
  }
  
  if (ageRules.max !== undefined && age > ageRules.max) {
    if (ageRules.ruleType === 'hard') {
      safetyFlags.push(`❌ Above maximum age (${ageRules.max} years)`);
      reasoning.push(`❌ Patient too old (age ${age}, maximum ${ageRules.max})`);
      return { isAgeAppropriate: false, score: 0 };
    } else {
      reasoning.push(`⚠️ Above recommended age (age ${age}, maximum ${ageRules.max})`);
      return { isAgeAppropriate: true, score: 5 };
    }
  }
  
  reasoning.push(`✓ Age appropriate (${age} years)`);
  return { isAgeAppropriate: true, score: 10 };
}

function evaluateSexSuitability(
  medicine: Medicine,
  sex: 'Male' | 'Female',
  reasoning: string[],
  warnings: string[],
  safetyFlags: string[]
): { isSexAppropriate: boolean; score: number } {
  const { sexRules } = medicine;
  
  if (!sexRules) {
    reasoning.push("✓ No specific sex restrictions");
    return { isSexAppropriate: true, score: 10 };
  }
  
  // Check pregnancy restrictions
  if (sex === 'Female' && sexRules.avoidInPregnancy) {
    safetyFlags.push("❌ Contraindicated in pregnancy");
    reasoning.push("❌ Avoid in pregnancy");
    return { isSexAppropriate: false, score: 0 };
  }
  
  // Check breastfeeding cautions
  if (sex === 'Female' && sexRules.cautionInBreastfeeding) {
    warnings.push("⚠️ Use caution in breastfeeding");
    reasoning.push("⚠️ Caution in breastfeeding");
  }
  
  // Check sex-specific risks
  if (sexRules.sexSpecificRisks && sexRules.sexSpecificRisks.length > 0) {
    const risks = sexRules.sexSpecificRisks.join(', ');
    warnings.push(`⚠️ Sex-specific risks: ${risks}`);
    reasoning.push(`⚠️ Sex-specific adverse effects: ${risks}`);
  }
  
  if (safetyFlags.length === 0) {
    reasoning.push(`✓ No sex-specific contraindications for ${sex}`);
  }
  
  return { isSexAppropriate: safetyFlags.length === 0, score: safetyFlags.length === 0 ? 10 : 0 };
}

function evaluateDurationSuitability(
  medicine: Medicine,
  patientDemographics: PatientDemographics,
  reasoning: string[]
): { isDurationAppropriate: boolean; score: number } {
  const { durationRules } = medicine;
  const { duration, durationUnit } = patientDemographics;
  
  // Convert duration to days for comparison
  const durationInDays = convertToDays(duration, durationUnit);
  
  // Duration classification (approximate)
  const isAcute = durationInDays <= 30;
  const isChronic = durationInDays > 90;
  
  if (durationRules === 'acute' && !isAcute) {
    reasoning.push(`⚠️ Primarily for acute conditions (${duration} ${durationUnit})`);
    return { isDurationAppropriate: false, score: 3 };
  }
  
  if (durationRules === 'chronic' && !isChronic) {
    reasoning.push(`⚠️ Primarily for chronic conditions (${duration} ${durationUnit})`);
    return { isDurationAppropriate: false, score: 3 };
  }
  
  reasoning.push(`✓ Appropriate for ${isAcute ? 'acute' : isChronic ? 'chronic' : 'intermediate'} duration (${duration} ${durationUnit})`);
  return { isDurationAppropriate: true, score: 10 };
}

function evaluateSymptomMatch(
  medicine: Medicine,
  symptoms: string[],
  reasoning: string[],
  warnings: string[]
): { matchScore: number; primaryMatches: string[]; secondaryMatches: string[] } {
  const { symptomMatchRules } = medicine;
  const primaryMatches: string[] = [];
  const secondaryMatches: string[] = [];
  const inappropriateMatches: string[] = [];
  
  // Check primary symptoms
  for (const symptom of symptomMatchRules.primarySymptoms) {
    const lowerSymptom = symptom.toLowerCase();
    if (symptoms.some(s => s.toLowerCase().includes(lowerSymptom) || lowerSymptom.includes(s.toLowerCase()))) {
      primaryMatches.push(symptom);
    }
  }
  
  // Check secondary symptoms
  for (const symptom of symptomMatchRules.secondarySymptoms || []) {
    const lowerSymptom = symptom.toLowerCase();
    if (symptoms.some(s => s.toLowerCase().includes(lowerSymptom) || lowerSymptom.includes(s.toLowerCase()))) {
      secondaryMatches.push(symptom);
    }
  }
  
  // Check inappropriate symptoms
  for (const symptom of symptomMatchRules.inappropriateSymptoms || []) {
    const lowerSymptom = symptom.toLowerCase();
    if (symptoms.some(s => s.toLowerCase().includes(lowerSymptom) || lowerSymptom.includes(s.toLowerCase()))) {
      inappropriateMatches.push(symptom);
    }
  }
  
  // Calculate match score
  let matchScore = 0;
  
  if (primaryMatches.length > 0) {
    matchScore += primaryMatches.length * 15;
    reasoning.push(`✓ Matches primary symptoms: ${primaryMatches.join(', ')}`);
  } else {
    reasoning.push("⚠️ No primary symptom matches");
  }
  
  if (secondaryMatches.length > 0) {
    matchScore += secondaryMatches.length * 8;
    reasoning.push(`✓ Also helps with: ${secondaryMatches.join(', ')}`);
  }
  
  if (inappropriateMatches.length > 0) {
    matchScore -= inappropriateMatches.length * 10;
    warnings.push(`⚠️ May be inappropriate for: ${inappropriateMatches.join(', ')}`);
  }
  
  // Additionally check if clinical uses match symptoms
  // This provides additional context for the matching
  const clinicalUseMatches: string[] = [];
  for (const use of medicine.clinicalUses) {
    // Parse clinical use to extract condition and symptoms
    const match = use.match(/^(.*?)\s*\((.*)\)$/);
    if (match) {
      // Extract the symptoms part from the clinical use
      const symptomsStr = match[2].trim();
      const clinicalSymptoms = symptomsStr.split(',').map(s => s.trim());
      
      // Check if any of the clinical symptoms match the patient symptoms
      for (const clinicalSymptom of clinicalSymptoms) {
        if (symptoms.some(s => s.toLowerCase().includes(clinicalSymptom.toLowerCase()) || clinicalSymptom.toLowerCase().includes(s.toLowerCase()))) {
          clinicalUseMatches.push(`${match[1].trim()} (${clinicalSymptom})`);
        }
      }
    }
  }
  
  if (clinicalUseMatches.length > 0) {
    matchScore += clinicalUseMatches.length * 5;
    reasoning.push(`✓ Clinical use symptom matches: ${clinicalUseMatches.join(', ')}`);
  }
  
  if (primaryMatches.length === 0 && secondaryMatches.length === 0 && clinicalUseMatches.length === 0) {
    reasoning.push("❌ No symptom matches found");
    matchScore = 0;
  }
  
  return { matchScore, primaryMatches, secondaryMatches };
}

function checkContraindications(
  medicine: Medicine,
  patientDemographics: PatientDemographics,
  symptoms: string[],
  reasoning: string[],
  safetyFlags: string[]
): { isContraindicated: boolean } {
  const { contraindications } = medicine;
  
  if (!contraindications || contraindications.length === 0) {
    reasoning.push("✓ No formal contraindications listed");
    return { isContraindicated: false };
  }
  
  const lowerSymptoms = symptoms.map(s => s.toLowerCase());
  const lowerContraindications = contraindications.map(c => c.toLowerCase());
  
  // Check if any contraindications match current symptoms or conditions
  const matchedContraindications = lowerContraindications.filter(contra => 
    lowerSymptoms.some(symptom => 
      symptom.includes(contra) || contra.includes(symptom)
    )
  );
  
  if (matchedContraindications.length > 0) {
    const matchedList = matchedContraindications.map(c => 
      contraindications[lowerContraindications.indexOf(c)]
    ).join(', ');
    
    safetyFlags.push(`❌ Contraindicated: ${matchedList}`);
    reasoning.push(`❌ Contraindicated due to: ${matchedList}`);
    return { isContraindicated: true };
  }
  
  reasoning.push("✓ No contraindications with current presentation");
  return { isContraindicated: false };
}

function calculateSuitabilityScore(
  ageResult: { isAgeAppropriate: boolean; score: number },
  sexResult: { isSexAppropriate: boolean; score: number },
  durationResult: { isDurationAppropriate: boolean; score: number },
  symptomResult: { matchScore: number; primaryMatches: string[]; secondaryMatches: string[] },
  contraindicationResult: { isContraindicated: boolean }
): number {
  if (contraindicationResult.isContraindicated) {
    return 0;
  }
  
  // Base score from components (max 100)
  let score = 0;
  score += ageResult.score;           // Max 10
  score += sexResult.score;           // Max 10
  score += durationResult.score;      // Max 10
  score += Math.min(symptomResult.matchScore, 70); // Max 70
  
  return Math.max(0, Math.min(100, score));
}

function convertToDays(duration: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'hours': return duration / 24;
    case 'days': return duration;
    case 'weeks': return duration * 7;
    case 'months': return duration * 30;
    case 'years': return duration * 365;
    default: return duration;
  }
}

// Utility function to get all medicines evaluated for a patient
export function evaluateAllMedicines(
  medicines: Medicine[],
  patientDemographics: PatientDemographics,
  symptoms: string[]
): MedicineEvaluation[] {
  return medicines
    .map(medicine => evaluateMedicineSuitability(medicine, patientDemographics, symptoms))
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore); // Sort by suitability score regardless of suitability
}