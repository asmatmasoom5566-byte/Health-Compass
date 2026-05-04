import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Brain,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  RecognitionResult, 
  RecognizedSymptom 
} from '../utils/symptom-meaning-recognition';

interface SymptomRecognitionPanelProps {
  recognitionResult: RecognitionResult;
  className?: string;
}

export function SymptomRecognitionPanel({
  recognitionResult,
  className
}: SymptomRecognitionPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    recognized: true,
    unresolved: true,
    clusters: true,
    safety: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className={cn("border border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Symptom Meaning Recognition
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Confidence:</span>
            <Badge variant="secondary" className={getConfidenceBadge(recognitionResult.confidenceScore)}>
              {Math.round(recognitionResult.confidenceScore * 100)}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Recognized:</span>
            <span className="font-medium">{recognitionResult.recognizedSymptoms.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Recognized Symptoms */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto"
            onClick={() => toggleSection('recognized')}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Recognized Symptoms</span>
              <Badge variant="secondary" className="ml-2">
                {recognitionResult.recognizedSymptoms.length}
              </Badge>
            </div>
            {expandedSections.recognized ? 
              <MinusCircle className="w-4 h-4" /> : 
              <PlusCircle className="w-4 h-4" />
            }
          </Button>
          
          {expandedSections.recognized && recognitionResult.recognizedSymptoms.length > 0 && (
            <div className="p-3 pt-0 space-y-2">
              {recognitionResult.recognizedSymptoms.map((symptom, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "p-3 rounded-lg border",
                    symptom.isPresent 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {symptom.isPresent ? (
                          <span className="text-green-800">{symptom.concept}</span>
                        ) : (
                          <span className="text-red-800 line-through">{symptom.concept}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Original: "{symptom.originalText}"
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Matched: {symptom.matchedVariant}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getConfidenceBadge(symptom.confidence))}
                      >
                        {Math.round(symptom.confidence * 100)}% confidence
                      </Badge>
                      {symptom.contextMatch && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Context match
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expandedSections.recognized && recognitionResult.recognizedSymptoms.length === 0 && (
            <div className="p-3 pt-0 text-sm text-muted-foreground">
              No symptoms were successfully recognized
            </div>
          )}
        </div>

        {/* Unresolved Items */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto"
            onClick={() => toggleSection('unresolved')}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium">Unresolved Items</span>
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                {recognitionResult.unresolvedItems.length}
              </Badge>
            </div>
            {expandedSections.unresolved ? 
              <MinusCircle className="w-4 h-4" /> : 
              <PlusCircle className="w-4 h-4" />
            }
          </Button>
          
          {expandedSections.unresolved && recognitionResult.unresolvedItems.length > 0 && (
            <div className="p-3 pt-0 space-y-2">
              {recognitionResult.unresolvedItems.map((item, index) => (
                <div key={index} className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-yellow-800">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expandedSections.unresolved && recognitionResult.unresolvedItems.length === 0 && (
            <div className="p-3 pt-0 text-sm text-muted-foreground">
              All items were successfully processed
            </div>
          )}
        </div>

        {/* Safety Flags */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto"
            onClick={() => toggleSection('safety')}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium">Safety Flags</span>
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                {recognitionResult.safetyFlags.length}
              </Badge>
            </div>
            {expandedSections.safety ? 
              <MinusCircle className="w-4 h-4" /> : 
              <PlusCircle className="w-4 h-4" />
            }
          </Button>
          
          {expandedSections.safety && recognitionResult.safetyFlags.length > 0 && (
            <div className="p-3 pt-0 space-y-2">
              {recognitionResult.safetyFlags.map((flag, index) => (
                <div key={index} className="p-3 rounded-lg border bg-red-50 border-red-200">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-red-800 text-sm">{flag}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expandedSections.safety && recognitionResult.safetyFlags.length === 0 && (
            <div className="p-3 pt-0 text-sm text-muted-foreground">
              No safety concerns identified
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Recognition Summary:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Recognized: {recognitionResult.recognizedSymptoms.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span>Unresolved: {recognitionResult.unresolvedItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Safety flags: {recognitionResult.safetyFlags.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Confidence: {Math.round(recognitionResult.confidenceScore * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

