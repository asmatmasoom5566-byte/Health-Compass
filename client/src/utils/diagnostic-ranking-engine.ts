import { Cause, SymptomWithSynonyms } from "@shared/schema";

export interface DiagnosticQuestion {
  id: string;
  conditionId: string;
  conditionName: string;
  symptom: string;
  questionText: string;
  type: 'confirmation' | 'differentiation' | 'exclusion' | 'red-flag';
  diagnosticValueScore: number;
  predictedImpact: number; // How much % this symptom would increase the condition score
  specificity: 'high' | 'medium' | 'low';
  differentiationPower: number; // 0-1 scale
  prevalenceWeight: number; // 0-1 scale
  severityWeight: number; // 0-1 scale for red-flag symptoms
  priority: 'high' | 'moderate' | 'low';
}

export interface ConditionScore {
  id: string;
  name: string;
  currentScore: number;
  matchedSymptoms: string[];
}

interface DiagnosticRankingEngineProps {
  causes: Cause[];
  currentConditions: ConditionScore[];
  selectedSymptoms: string[];
}

export class DiagnosticRankingEngine {
  private causes: Cause[];
  private currentConditions: ConditionScore[];
  private selectedSymptoms: string[];

  constructor({ causes, currentConditions, selectedSymptoms }: DiagnosticRankingEngineProps) {
    this.causes = causes;
    this.currentConditions = currentConditions;
    this.selectedSymptoms = selectedSymptoms;
  }

  /**
   * Generate and rank diagnostic questions for top conditions
   */
  generateRankedQuestions(): DiagnosticQuestion[] {
    const questions: DiagnosticQuestion[] = [];
    const top5Conditions = this.currentConditions
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 5);

    top5Conditions.forEach(condition => {
      const cause = this.causes.find(c => c.id === condition.id);
      if (cause) {
        // Generate questions for unmatched symptoms
        const unmatchedSymptoms = cause.symptoms?.filter(symptom => {
          // Extract symptom string from union type
          const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
          return !this.selectedSymptoms.includes(symptomString) && symptomString.trim();
        }) || [];

        unmatchedSymptoms.forEach(symptom => {
          const question = this.createDiagnosticQuestion(condition, cause, symptom);
          questions.push(question);
        });
      }
    });

    // Sort by diagnostic value score (highest first)
    return questions.sort((a, b) => b.diagnosticValueScore - a.diagnosticValueScore);
  }

  /**
   * Create a diagnostic question with calculated scores
   */
  private createDiagnosticQuestion(
    condition: ConditionScore,
    cause: Cause,
    symptom: string | SymptomWithSynonyms
  ): DiagnosticQuestion {
    // Extract symptom string from union type for use in question
    const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
    const symptomId = `${condition.id}-${symptomString}`;
    
    // Calculate individual components using the string representation
    const specificity = this.calculateSymptomSpecificity(symptomString, condition.id);
    const differentiationPower = this.calculateDifferentiationPower(symptomString, condition.id);
    const prevalenceWeight = this.calculatePrevalenceWeight(symptomString);
    const severityWeight = cause.safetyCritical ? 1 : 0;
    const predictedImpact = this.predictMatchImpact(symptomString, condition);

    // Calculate weighted diagnostic value score
    const diagnosticValueScore = this.calculateDiagnosticValueScore({
      specificity,
      differentiationPower,
      prevalenceWeight,
      severityWeight,
      predictedImpact
    });

    // Determine priority level
    const priority = this.determinePriority(diagnosticValueScore);

    // Determine question type
    const type = this.determineQuestionType(
      symptomString, 
      condition.id, 
      cause.safetyCritical,
      differentiationPower
    );

    return {
      id: symptomId,
      conditionId: condition.id,
      conditionName: condition.name,
      symptom: symptomString,
      questionText: `Do you have ${symptomString}?`,
      type,
      diagnosticValueScore,
      predictedImpact,
      specificity,
      differentiationPower,
      prevalenceWeight,
      severityWeight,
      priority
    };
  }

  /**
   * Calculate how specific a symptom is to a particular condition
   */
  private calculateSymptomSpecificity(symptom: string | SymptomWithSynonyms, conditionId: string): 'high' | 'medium' | 'low' {
    // Extract symptom string from union type
    const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
    
    // Count how many conditions have this symptom
    const conditionsWithSymptom = this.causes.filter(cause => 
      cause.symptoms?.some(s => {
        const sStr = typeof s === 'string' ? s : s.typicalSymptom;
        return sStr === symptomString;
      })
    ).length;

    const totalConditions = conditionsWithSymptom;

    if (totalConditions === 1) return 'high';     // Unique to this condition
    if (totalConditions <= 3) return 'medium';    // Fairly specific
    return 'low';                                 // Very common
  }

  /**
   * Calculate how well this symptom differentiates between conditions
   */
  private calculateDifferentiationPower(symptom: string | SymptomWithSynonyms, targetConditionId: string): number {
    // Extract symptom string from union type
    const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
    
    const conditionsWithSymptom = this.currentConditions.filter(condition => {
      const cause = this.causes.find(c => c.id === condition.id);
      return cause && cause.symptoms?.some(s => {
        const sStr = typeof s === 'string' ? s : s.typicalSymptom;
        return sStr === symptomString;
      });
    });

    if (conditionsWithSymptom.length === 0) return 0;
    if (conditionsWithSymptom.length === 1 && conditionsWithSymptom[0].id === targetConditionId) {
      return 1; // Perfect differentiation
    }

    // Calculate how much this symptom helps differentiate from competing conditions
    const targetCondition = conditionsWithSymptom.find(c => c.id === targetConditionId);
    if (!targetCondition) return 0;

    // Higher score if this symptom is more specific to the target condition
    // compared to other highly-ranked conditions
    const competingConditions = conditionsWithSymptom
      .filter(c => c.id !== targetConditionId)
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 3); // Compare with top 3 competitors

    if (competingConditions.length === 0) return 0.8; // No strong competitors

    // Calculate differentiation score based on score differences
    const scoreDifferences = competingConditions.map(comp => 
      (targetCondition.currentScore - comp.currentScore) / 100
    );
    
    const avgDifference = scoreDifferences.reduce((a, b) => a + b, 0) / scoreDifferences.length;
    return Math.min(1, Math.max(0, 0.5 + avgDifference * 0.5));
  }

  /**
   * Calculate prevalence-based weighting
   */
  private calculatePrevalenceWeight(symptom: string | SymptomWithSynonyms): number {
    // Extract symptom string from union type
    const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
    
    // This would ideally come from epidemiological data
    // For now, we'll use a simple heuristic based on symptom commonality
    const commonSymptoms = [
      'fever', 'headache', 'pain', 'nausea', 'fatigue', 'cough', 'dizziness'
    ];
    
    const isCommon = commonSymptoms.some(common => 
      symptomString.toLowerCase().includes(common.toLowerCase())
    );
    
    return isCommon ? 0.3 : 0.7; // Less weight for very common symptoms
  }

  /**
   * Predict how much adding this symptom would impact the condition score
   */
  private predictMatchImpact(symptom: string | SymptomWithSynonyms, condition: ConditionScore): number {
    // Extract symptom string from union type (not used in calculation but kept for API consistency)
    const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
    
    // This is a simplified prediction - in a real system, this would be more sophisticated
    const baseScore = condition.currentScore;
    const hasManySymptoms = condition.matchedSymptoms.length > 3;
    
    // If condition already has many symptoms, new ones have less impact
    // If condition has few symptoms, new ones have more impact
    const impactMultiplier = hasManySymptoms ? 0.3 : 0.8;
    
    // High specificity symptoms have higher impact
    const specificity = this.calculateSymptomSpecificity(symptom, condition.id);
    const specificityMultiplier = specificity === 'high' ? 1.2 : 
                                specificity === 'medium' ? 1.0 : 0.7;
    
    return Math.min(25, baseScore * impactMultiplier * specificityMultiplier);
  }

  /**
   * Calculate final diagnostic value score using weighted components
   */
  private calculateDiagnosticValueScore(components: {
    specificity: 'high' | 'medium' | 'low';
    differentiationPower: number;
    prevalenceWeight: number;
    severityWeight: number;
    predictedImpact: number;
  }): number {
    const { specificity, differentiationPower, prevalenceWeight, severityWeight, predictedImpact } = components;

    // Convert specificity to numeric value
    const specificityValue = specificity === 'high' ? 1.0 : 
                           specificity === 'medium' ? 0.7 : 0.4;

    // Weighted scoring (total can exceed 100 for very high-value questions)
    const score = (
      (specificityValue * 30) +           // 30% weight - symptom specificity
      (differentiationPower * 25) +       // 25% weight - differentiation power
      (predictedImpact * 0.2) +           // 20% weight - predicted impact
      (prevalenceWeight * 15) +           // 15% weight - prevalence
      (severityWeight * 10)               // 10% weight - severity/red-flag
    );

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Determine priority level based on diagnostic value score
   */
  private determinePriority(score: number): 'high' | 'moderate' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }

  /**
   * Determine question type based on characteristics
   */
  private determineQuestionType(
    symptom: string | SymptomWithSynonyms,
    conditionId: string,
    isSafetyCritical: boolean,
    differentiationPower: number
  ): 'confirmation' | 'differentiation' | 'exclusion' | 'red-flag' {
    // Extract symptom string from union type
    const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
    
    if (isSafetyCritical) return 'red-flag';
    if (differentiationPower > 0.7) return 'differentiation';
    const specificity = this.calculateSymptomSpecificity(symptomString, conditionId);
    if (specificity === 'high') return 'confirmation';
    return 'exclusion';
  }

  /**
   * Simulate the impact of adding a symptom
   */
  simulateSymptomAddition(symptom: string | SymptomWithSynonyms, conditionId: string): {
    newScore: number;
    scoreChange: number;
    positionChange: number;
  } {
    const condition = this.currentConditions.find(c => c.id === conditionId);
    if (!condition) {
      return { newScore: 0, scoreChange: 0, positionChange: 0 };
    }

    const question = this.generateRankedQuestions().find(q => 
      q.conditionId === conditionId && q.symptom === symptom
    );

    if (!question) {
      return { newScore: condition.currentScore, scoreChange: 0, positionChange: 0 };
    }

    // Calculate new score based on the question's predicted impact
    const newScore = Math.min(100, condition.currentScore + question.predictedImpact);
    const scoreChange = newScore - condition.currentScore;

    // Calculate position change (simplified)
    const currentPosition = this.currentConditions
      .sort((a, b) => b.currentScore - a.currentScore)
      .findIndex(c => c.id === conditionId);

    const conditionsWithNewScore = [...this.currentConditions];
    const targetCondition = conditionsWithNewScore.find(c => c.id === conditionId);
    if (targetCondition) {
      targetCondition.currentScore = newScore;
    }

    const newPosition = conditionsWithNewScore
      .sort((a, b) => b.currentScore - a.currentScore)
      .findIndex(c => c.id === conditionId);

    const positionChange = currentPosition - newPosition;

    return { newScore, scoreChange, positionChange };
  }
}