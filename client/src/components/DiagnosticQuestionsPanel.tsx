import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Brain,
  Star,
  Activity
} from "lucide-react";
import { Cause } from "@shared/schema";
import { DiagnosticRankingEngine, DiagnosticQuestion } from "../utils/diagnostic-ranking-engine";
import { useRemovedConditions } from '@/hooks/use-removed-conditions';

interface DiagnosticQuestionsPanelProps {
  causes: Cause[];
  scoredCauses: Array<{
    id: string;
    name: string;
    score: number;
    matchedSymptoms: string[];
  }>;
  selectedSymptoms: string[];
  onAddSymptom: (symptom: string) => void;
  onQuestionAnswered?: (question: DiagnosticQuestion, answer: 'yes' | 'no') => void;
}

export function DiagnosticQuestionsPanel({ 
  causes, 
  scoredCauses,
  selectedSymptoms,
  onAddSymptom,
  onQuestionAnswered
}: DiagnosticQuestionsPanelProps) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [expandedConditions, setExpandedConditions] = useState<Record<string, boolean>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, 'yes' | 'no'>>({});
  
  // Use the removed conditions hook to filter out removed conditions
  const { filterRemoved } = useRemovedConditions();

  // Filter out removed conditions from scoredCauses
  const filteredScoredCauses = useMemo(() => {
    return filterRemoved(scoredCauses);
  }, [scoredCauses, filterRemoved]);
  
  // Get top 5 conditions by score
  const top5ScoredCauses = useMemo(() => {
    return [...filteredScoredCauses]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [filteredScoredCauses]);

  // Convert scoredCauses to the format expected by the engine (only top 5)
  const conditionScores = useMemo(() => {
    return top5ScoredCauses.map(condition => ({
      id: condition.id,
      name: condition.name,
      currentScore: condition.score,
      matchedSymptoms: condition.matchedSymptoms || []
    }));
  }, [top5ScoredCauses]);

  // Generate and rank questions using the diagnostic engine (only for top 5 conditions)
  const rankedQuestions = useMemo(() => {
    const engine = new DiagnosticRankingEngine({
      causes,
      currentConditions: conditionScores,
      selectedSymptoms
    });
    return engine.generateRankedQuestions();
  }, [causes, conditionScores, selectedSymptoms]);

  // Group questions by condition
  const questionsByCondition = useMemo(() => {
    const grouped: Record<string, DiagnosticQuestion[]> = {};
    rankedQuestions.forEach(question => {
      if (!grouped[question.conditionName]) {
        grouped[question.conditionName] = [];
      }
      grouped[question.conditionName].push(question);
    });
    return grouped;
  }, [rankedQuestions]);

  // Determine symptom type (pathognomonic, defining, cardinal, moderate, or typical)
  const getSymptomType = (question: DiagnosticQuestion): 'pathognomonic' | 'defining' | 'cardinal' | 'moderate' | 'typical' => {
    const cause = causes.find(c => c.id === question.conditionId);
    if (!cause) return 'typical';
    
    // Check if symptom is in pathognomonic symptoms
    if (cause.pathognomonicSymptoms?.includes(question.symptom)) {
      return 'pathognomonic';
    }
    
    // Check if symptom is in cardinal symptoms
    if (cause.cardinalSymptoms?.includes(question.symptom)) {
      return 'cardinal';
    }
    
    // Otherwise it's a typical symptom
    return 'typical';
  };

  // Group ALL questions by symptom type FIRST (across ALL conditions) - HIERARCHICAL ORDER
  // With duplicate prevention: each question appears only in its highest priority category
  const questionsBySymptomType = useMemo(() => {
    const grouped = {
      pathognomonic: [] as DiagnosticQuestion[],
      cardinal: [] as DiagnosticQuestion[],
      typical: [] as DiagnosticQuestion[]
    };
    
    // Track which symptoms have already been assigned (to prevent duplicates)
    const assignedSymptoms = new Set<string>();
    
    // Process in hierarchical order: Pathognomonic → Cardinal → Typical
    // This ensures each symptom appears only in its highest priority category
    
    // 1. First, collect and sort Pathognomonic questions
    const pathognomonicQuestions = rankedQuestions.filter(question => {
      const symptomType = getSymptomType(question);
      return symptomType === 'pathognomonic';
    });
    pathognomonicQuestions.sort((a, b) => b.diagnosticValueScore - a.diagnosticValueScore);
    
    pathognomonicQuestions.forEach(question => {
      const symptomKey = question.symptom.toLowerCase().trim();
      if (!assignedSymptoms.has(symptomKey)) {
        grouped.pathognomonic.push(question);
        assignedSymptoms.add(symptomKey);
      }
    });
    
    // 3. Then, collect and sort Cardinal questions (excluding already assigned)
    const cardinalQuestions = rankedQuestions.filter(question => {
      const symptomType = getSymptomType(question);
      return symptomType === 'cardinal';
    });
    cardinalQuestions.sort((a, b) => b.diagnosticValueScore - a.diagnosticValueScore);
    
    cardinalQuestions.forEach(question => {
      const symptomKey = question.symptom.toLowerCase().trim();
      if (!assignedSymptoms.has(symptomKey)) {
        grouped.cardinal.push(question);
        assignedSymptoms.add(symptomKey);
      }
    });
    
    // 4. Finally, collect and sort Typical questions (excluding already assigned)
    const typicalQuestions = rankedQuestions.filter(question => {
      const symptomType = getSymptomType(question);
      return symptomType === 'typical';
    });
    typicalQuestions.sort((a, b) => b.diagnosticValueScore - a.diagnosticValueScore);
    
    typicalQuestions.forEach(question => {
      const symptomKey = question.symptom.toLowerCase().trim();
      if (!assignedSymptoms.has(symptomKey)) {
        grouped.typical.push(question);
        assignedSymptoms.add(symptomKey);
      }
    });
    
    return grouped;
  }, [rankedQuestions, causes]);

  // Get top 5 conditions with questions
  const top5Conditions = useMemo(() => {
    return Object.keys(questionsByCondition)
      .slice(0, 5)
      .map(name => ({
        name,
        questions: questionsByCondition[name]
      }));
  }, [questionsByCondition]);

  const toggleConditionExpand = (conditionName: string) => {
    setExpandedConditions(prev => ({
      ...prev,
      [conditionName]: !prev[conditionName]
    }));
  };

  const handleQuestionAnswer = (question: DiagnosticQuestion, answer: 'yes' | 'no') => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [question.id]: answer
    }));

    // Notify parent of answer
    onQuestionAnswered?.(question, answer);

    // If answered "yes", add the symptom
    if (answer === 'yes') {
      onAddSymptom(question.symptom);
    }

    // Optional: Handle "no" answers for exclusion logic
    // This would require updating the scoring system to reduce condition scores
  };

  const toggleAllConditions = () => {
    const allExpanded = Object.values(expandedConditions).every(v => v);
    const newExpandedState: Record<string, boolean> = {};
    
    top5Conditions.forEach(condition => {
      newExpandedState[condition.name] = !allExpanded;
    });
    
    setExpandedConditions(newExpandedState);
  };

  const getQuestionIcon = (type: DiagnosticQuestion['type']) => {
    switch (type) {
      case 'red-flag':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'confirmation':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'differentiation':
        return <Brain className="w-4 h-4 text-blue-500" />;
      case 'exclusion':
        return <HelpCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getSymptomTypeBadge = (symptomType: 'pathognomonic' | 'defining' | 'cardinal' | 'moderate' | 'typical') => {
    switch (symptomType) {
      case 'pathognomonic':
        return (
          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
            <Star className="w-3 h-3 mr-1" />
            Pathognomonic
          </Badge>
        );
      case 'defining':
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Defining
          </Badge>
        );
      case 'cardinal':
        return (
          <Badge variant="default" className="bg-orange-600 hover:bg-orange-700">
            <Activity className="w-3 h-3 mr-1" />
            Cardinal
          </Badge>
        );
      case 'moderate':
        return (
          <Badge variant="default" className="bg-cyan-600 hover:bg-cyan-700">
            <Activity className="w-3 h-3 mr-1" />
            Moderate
          </Badge>
        );
      case 'typical':
        return (
          <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600">
            <HelpCircle className="w-3 h-3 mr-1" />
            Typical
          </Badge>
        );
    }
  };

  if (top5Conditions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="btn-3d-primary w-full gap-2 justify-start"
        onClick={() => setShowQuestions(!showQuestions)}
      >
        <Brain className="w-4 h-4" />
        {showQuestions ? 'Hide' : 'Show'} Diagnostic Questions
        <Badge variant="secondary" className="ml-auto">
          {rankedQuestions.length} questions
        </Badge>
      </Button>

      {showQuestions && (
        <Card className="diagnostic-panel-3d">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Diagnostic Questions</span>
                <Badge variant="outline" className="text-xs">
                  Ranked by Diagnostic Value
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllConditions}
                >
                  {Object.values(expandedConditions).some(v => v) ? 'Collapse All' : 'Expand All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuestions(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pathognomonic Symptoms - ALL conditions combined */}
              {questionsBySymptomType.pathognomonic.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-600" />
                      <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400">
                        Key Features
                      </h3>
                      <Badge variant="default" className="bg-purple-600">
                        {questionsBySymptomType.pathognomonic.length} questions
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 space-y-2">
                    {questionsBySymptomType.pathognomonic.map((question) => {
                      const isAnswered = answeredQuestions[question.id];
                      
                      return (
                        <div 
                          key={question.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isAnswered
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                              : 'bg-white dark:bg-slate-700 border-purple-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getQuestionIcon(question.type)}
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <p className={`font-medium ${isAnswered ? 'text-green-700 dark:text-green-300' : ''}`}>
                                    {question.questionText}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    For: {question.conditionName}
                                  </p>
                                </div>
                              </div>
                              
                              {!isAnswered ? (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-50 hover:bg-green-100 border-green-300"
                                    onClick={() => handleQuestionAnswer(question, 'yes')}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-50 hover:bg-red-100 border-red-300"
                                    onClick={() => handleQuestionAnswer(question, 'no')}
                                  >
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Answered: {isAnswered.toUpperCase()}
                                  </Badge>
                                  {isAnswered === 'yes' && (
                                    <Badge variant="default" className="ml-2 text-xs bg-green-500">
                                      Symptom Added
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Question metadata for educational purposes */}
                              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                                <span>DVS: {question.diagnosticValueScore.toFixed(1)}</span>
                                <span>Impact: +{question.predictedImpact.toFixed(1)}%</span>
                                <span>Spec: {question.specificity}</span>
                                <span>Diff: {(question.differentiationPower * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Cardinal Symptoms - ALL conditions combined */}
              {questionsBySymptomType.cardinal.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-orange-600" />
                      <h3 className="text-base font-semibold text-orange-700 dark:text-orange-400">
                        Important Features
                      </h3>
                      <Badge variant="default" className="bg-orange-600">
                        {questionsBySymptomType.cardinal.length} questions
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 space-y-2">
                    {questionsBySymptomType.cardinal.map((question) => {
                      const isAnswered = answeredQuestions[question.id];
                      
                      return (
                        <div 
                          key={question.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isAnswered
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                              : 'bg-white dark:bg-slate-700 border-orange-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getQuestionIcon(question.type)}
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <p className={`font-medium ${isAnswered ? 'text-green-700 dark:text-green-300' : ''}`}>
                                    {question.questionText}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    For: {question.conditionName}
                                  </p>
                                </div>
                              </div>
                              
                              {!isAnswered ? (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-50 hover:bg-green-100 border-green-300"
                                    onClick={() => handleQuestionAnswer(question, 'yes')}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-50 hover:bg-red-100 border-red-300"
                                    onClick={() => handleQuestionAnswer(question, 'no')}
                                  >
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Answered: {isAnswered.toUpperCase()}
                                  </Badge>
                                  {isAnswered === 'yes' && (
                                    <Badge variant="default" className="ml-2 text-xs bg-green-500">
                                      Symptom Added
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Question metadata for educational purposes */}
                              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                                <span>DVS: {question.diagnosticValueScore.toFixed(1)}</span>
                                <span>Impact: +{question.predictedImpact.toFixed(1)}%</span>
                                <span>Spec: {question.specificity}</span>
                                <span>Diff: {(question.differentiationPower * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Typical Symptoms - ALL conditions combined */}
              {questionsBySymptomType.typical.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-gray-600" />
                      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-400">
                        Supportive Features
                      </h3>
                      <Badge variant="default" className="bg-gray-500">
                        {questionsBySymptomType.typical.length} questions
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 space-y-2">
                    {questionsBySymptomType.typical.map((question) => {
                      const isAnswered = answeredQuestions[question.id];
                      
                      return (
                        <div 
                          key={question.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isAnswered
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                              : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getQuestionIcon(question.type)}
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <p className={`font-medium ${isAnswered ? 'text-green-700 dark:text-green-300' : ''}`}>
                                    {question.questionText}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    For: {question.conditionName}
                                  </p>
                                </div>
                              </div>
                              
                              {!isAnswered ? (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-50 hover:bg-green-100 border-green-300"
                                    onClick={() => handleQuestionAnswer(question, 'yes')}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-50 hover:bg-red-100 border-red-300"
                                    onClick={() => handleQuestionAnswer(question, 'no')}
                                  >
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Answered: {isAnswered.toUpperCase()}
                                  </Badge>
                                  {isAnswered === 'yes' && (
                                    <Badge variant="default" className="ml-2 text-xs bg-green-500">
                                      Symptom Added
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Question metadata for educational purposes */}
                              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                                <span>DVS: {question.diagnosticValueScore.toFixed(1)}</span>
                                <span>Impact: +{question.predictedImpact.toFixed(1)}%</span>
                                <span>Spec: {question.specificity}</span>
                                <span>Diff: {(question.differentiationPower * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {rankedQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No diagnostic questions available for current conditions.</p>
                  <p className="text-sm">Add more symptoms to generate relevant questions.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}