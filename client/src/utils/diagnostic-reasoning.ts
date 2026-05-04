// Advanced Diagnostic Reasoning Engine
import { Cause } from '../../shared/schema';

// Types for diagnostic reasoning
interface PatientContext {
  age: number;
  sex: 'male' | 'female';
  symptoms: string[];
  duration: number;
  durationUnit: string;
}

interface DiagnosticAlert {
  type: 'closure_guard' | 'cluster_recognition' | 'negative_finding';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  conditionName?: string;
  relatedSymptoms?: string[];
}

interface SyndromeCluster {
  name: string;
  keySymptoms: string[];
  associatedConditions: string[];
  diagnosticClues: string[];
}

interface NegativeFindingRule {
  finding: string;
  reducesProbabilityOf: string[];
  confidence: 'high' | 'medium' | 'low';
}

// Closure Guard Rules
const CLOSURE_GUARD_RULES = [
  {
    condition: 'Urinary Tract Infection',
    triggerSymptoms: ['dysuria', 'frequency', 'urgency'],
    patientCriteria: (patient: PatientContext) => 
      patient.sex === 'female' && patient.age >= 15 && patient.age <= 50,
    alert: {
      title: 'Pregnancy Test Consideration',
      message: 'Female of reproductive age with UTI symptoms. Consider pregnancy test before prescribing certain antibiotics.',
      priority: 'high' as const
    }
  },
  {
    condition: 'Migraine',
    triggerSymptoms: ['headache', 'nausea', 'photophobia'],
    patientCriteria: (patient: PatientContext) => 
      patient.sex === 'female' && patient.age >= 15 && patient.age <= 45,
    alert: {
      title: 'Contraception Review',
      message: 'Female patient of reproductive age with migraines. Review contraceptive needs and consider hormonal triggers.',
      priority: 'medium' as const
    }
  },
  {
    condition: 'Acute Appendicitis',
    triggerSymptoms: ['abdominal pain', 'nausea', 'fever'],
    patientCriteria: (patient: PatientContext) => 
      patient.age >= 10 && patient.age <= 30,
    alert: {
      title: 'Surgical Consultation',
      message: 'High suspicion for appendicitis in young patient. Consider urgent surgical evaluation to prevent perforation.',
      priority: 'high' as const
    }
  }
];

// Syndrome Clusters
const SYNDROME_CLUSTERS: SyndromeCluster[] = [
  {
    name: 'Hepatobiliary Syndrome',
    keySymptoms: ['fever', 'jaundice', 'right upper quadrant pain'],
    associatedConditions: ['Hepatitis', 'Cholangitis', 'Gallstones', 'Liver abscess'],
    diagnosticClues: ['Elevated liver enzymes', 'RUQ tenderness', 'Murphy\'s sign']
  },
  {
    name: 'Meningeal Syndrome',
    keySymptoms: ['fever', 'headache', 'neck stiffness', 'altered mental status'],
    associatedConditions: ['Bacterial Meningitis', 'Viral Meningitis', 'Subarachnoid Hemorrhage'],
    diagnosticClues: ['Positive Kernig\'s sign', 'Positive Brudzinski\'s sign', 'CSF analysis needed']
  },
  {
    name: 'Respiratory Distress Syndrome',
    keySymptoms: ['shortness of breath', 'wheezing', 'chest tightness'],
    associatedConditions: ['Asthma', 'COPD Exacerbation', 'Pulmonary Embolism', 'Pneumonia'],
    diagnosticClues: ['Oxygen saturation', 'Peak flow measurement', 'Chest X-ray']
  },
  {
    name: 'Cardiac Syndrome',
    keySymptoms: ['chest pain', 'shortness of breath', 'sweating'],
    associatedConditions: ['Myocardial Infarction', 'Angina', 'Pericarditis', 'Aortic Dissection'],
    diagnosticClues: ['ECG changes', 'Cardiac enzymes', 'Vital signs monitoring']
  }
];

// Negative Finding Rules
const NEGATIVE_FINDING_RULES: NegativeFindingRule[] = [
  {
    finding: 'no neck stiffness',
    reducesProbabilityOf: ['Meningitis', 'Subarachnoid Hemorrhage'],
    confidence: 'high'
  },
  {
    finding: 'no rash',
    reducesProbabilityOf: ['Meningococcemia', 'Rocky Mountain Spotted Fever', 'Measles'],
    confidence: 'medium'
  },
  {
    finding: 'no cough',
    reducesProbabilityOf: ['Pneumonia', 'Bronchitis', 'COVID-19'],
    confidence: 'medium'
  },
  {
    finding: 'no abdominal tenderness',
    reducesProbabilityOf: ['Appendicitis', 'Diverticulitis', 'Pancreatitis'],
    confidence: 'high'
  },
  {
    finding: 'no neurological deficits',
    reducesProbabilityOf: ['Stroke', 'Brain Tumor', 'Seizure Disorder'],
    confidence: 'high'
  }
];

export class DiagnosticReasoningEngine {
  // Diagnostic Closure Guard
  static getClosureGuardAlerts(patient: PatientContext, suggestedConditions: Cause[]): DiagnosticAlert[] {
    const alerts: DiagnosticAlert[] = [];
    
    for (const rule of CLOSURE_GUARD_RULES) {
      // Check if any suggested condition matches the rule
      const matchingCondition = suggestedConditions.find(condition => 
        condition.name.includes(rule.condition)
      );
      
      if (matchingCondition) {
        // Check if patient meets criteria
        if (rule.patientCriteria(patient)) {
          // Check if patient has relevant symptoms
          const hasTriggerSymptoms = rule.triggerSymptoms.some(trigger => 
            patient.symptoms.some(symptom => 
              symptom.toLowerCase().includes(trigger.toLowerCase()) ||
              trigger.toLowerCase().includes(symptom.toLowerCase())
            )
          );
          
          if (hasTriggerSymptoms) {
            alerts.push({
              type: 'closure_guard',
              title: rule.alert.title,
              message: rule.alert.message,
              priority: rule.alert.priority,
              conditionName: matchingCondition.name,
              relatedSymptoms: rule.triggerSymptoms
            });
          }
        }
      }
    }
    
    return alerts;
  }
  
  // Symptom Cluster Recognition
  static identifySyndromeClusters(patient: PatientContext): SyndromeCluster[] {
    const identifiedClusters: SyndromeCluster[] = [];
    
    for (const cluster of SYNDROME_CLUSTERS) {
      // Count how many key symptoms the patient has
      const matchedSymptoms = cluster.keySymptoms.filter(keySymptom =>
        patient.symptoms.some(patientSymptom =>
          patientSymptom.toLowerCase().includes(keySymptom.toLowerCase()) ||
          keySymptom.toLowerCase().includes(patientSymptom.toLowerCase())
        )
      );
      
      // If patient has at least 2 out of 3 key symptoms, consider it a potential cluster
      if (matchedSymptoms.length >= 2) {
        identifiedClusters.push({
          ...cluster,
          keySymptoms: matchedSymptoms
        });
      }
    }
    
    return identifiedClusters;
  }
  
  // Negative Finding Importance
  static adjustProbabilitiesBasedOnNegativeFindings(
    conditions: Cause[], 
    negativeFindings: string[]
  ): Array<{condition: Cause, adjustment: number, reason: string}> {
    const adjustments: Array<{condition: Cause, adjustment: number, reason: string}> = [];
    
    for (const condition of conditions) {
      let totalAdjustment = 0;
      const reasons: string[] = [];
      
      for (const negativeFinding of negativeFindings) {
        const matchingRule = NEGATIVE_FINDING_RULES.find(rule =>
          rule.finding.toLowerCase().includes(negativeFinding.toLowerCase()) ||
          negativeFinding.toLowerCase().includes(rule.finding.toLowerCase())
        );
        
        if (matchingRule) {
          // Check if this condition is affected by this negative finding
          if (matchingRule.reducesProbabilityOf.some(affectedCondition =>
            condition.name.toLowerCase().includes(affectedCondition.toLowerCase()) ||
            affectedCondition.toLowerCase().includes(condition.name.toLowerCase())
          )) {
            // Apply probability reduction based on confidence level
            const reduction = matchingRule.confidence === 'high' ? 0.7 : 
                            matchingRule.confidence === 'medium' ? 0.5 : 0.3;
            
            totalAdjustment += reduction;
            reasons.push(`Negative finding "${negativeFinding}" reduces probability of ${condition.name}`);
          }
        }
      }
      
      if (totalAdjustment > 0) {
        adjustments.push({
          condition,
          adjustment: Math.min(totalAdjustment, 0.9), // Cap at 90% reduction
          reason: reasons.join('; ')
        });
      }
    }
    
    return adjustments;
  }
  
  // Comprehensive diagnostic analysis
  static performComprehensiveAnalysis(
    patient: PatientContext, 
    suggestedConditions: Cause[],
    negativeFindings: string[] = []
  ): {
    closureAlerts: DiagnosticAlert[];
    syndromeClusters: SyndromeCluster[];
    probabilityAdjustments: Array<{condition: Cause, adjustment: number, reason: string}>;
  } {
    const closureAlerts = this.getClosureGuardAlerts(patient, suggestedConditions);
    const syndromeClusters = this.identifySyndromeClusters(patient);
    const probabilityAdjustments = this.adjustProbabilitiesBasedOnNegativeFindings(
      suggestedConditions, 
      negativeFindings
    );
    
    return {
      closureAlerts,
      syndromeClusters,
      probabilityAdjustments
    };
  }
  
  // Utility method to get all possible negative findings for UI
  static getPossibleNegativeFindings(): string[] {
    return NEGATIVE_FINDING_RULES.map(rule => rule.finding);
  }
  
  // Utility method to get syndrome cluster names for quick reference
  static getSyndromeClusterNames(): string[] {
    return SYNDROME_CLUSTERS.map(cluster => cluster.name);
  }
}

// Export types for use in components
export type { 
  DiagnosticAlert, 
  SyndromeCluster, 
  NegativeFindingRule, 
  PatientContext 
};
