import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  AlertTriangle, 
  Lightbulb, 
  MinusCircle, 
  PlusCircle,
  Shield,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  DiagnosticAlert, 
  SyndromeCluster, 
  PatientContext 
} from '../utils/diagnostic-reasoning';

interface DiagnosticReasoningPanelProps {
  patient: PatientContext;
  alerts: DiagnosticAlert[];
  syndromeClusters: SyndromeCluster[];
  probabilityAdjustments: Array<{condition: any, adjustment: number, reason: string}>;
  className?: string;
}

export function DiagnosticReasoningPanel({
  patient,
  alerts,
  syndromeClusters,
  probabilityAdjustments,
  className
}: DiagnosticReasoningPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    closure: true,
    clusters: true,
    adjustments: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={cn("border border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Diagnostic Reasoning Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Advanced clinical decision support based on patient presentation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Diagnostic Closure Guard */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto"
            onClick={() => toggleSection('closure')}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Diagnostic Closure Guard</span>
              <Badge variant="secondary" className="ml-2">
                {alerts.length} alerts
              </Badge>
            </div>
            {expandedSections.closure ? 
              <MinusCircle className="w-4 h-4" /> : 
              <PlusCircle className="w-4 h-4" />
            }
          </Button>
          
          {expandedSections.closure && alerts.length > 0 && (
            <div className="p-3 pt-0 space-y-2">
              {alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    getPriorityColor(alert.priority)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{alert.title}</div>
                      <div className="text-sm opacity-90">{alert.message}</div>
                      {alert.conditionName && (
                        <div className="mt-2 text-xs opacity-75">
                          Related to: <span className="font-medium">{alert.conditionName}</span>
                        </div>
                      )}
                      {alert.relatedSymptoms && alert.relatedSymptoms.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {alert.relatedSymptoms.map((symptom, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("ml-2 text-xs", getPriorityColor(alert.priority))}
                    >
                      {alert.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expandedSections.closure && alerts.length === 0 && (
            <div className="p-3 pt-0 text-sm text-muted-foreground">
              No closure guard alerts for current presentation
            </div>
          )}
        </div>

        {/* Symptom Cluster Recognition */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto"
            onClick={() => toggleSection('clusters')}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Symptom Cluster Recognition</span>
              <Badge variant="secondary" className="ml-2">
                {syndromeClusters.length} clusters
              </Badge>
            </div>
            {expandedSections.clusters ? 
              <MinusCircle className="w-4 h-4" /> : 
              <PlusCircle className="w-4 h-4" />
            }
          </Button>
          
          {expandedSections.clusters && syndromeClusters.length > 0 && (
            <div className="p-3 pt-0 space-y-3">
              {syndromeClusters.map((cluster, index) => (
                <div key={index} className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                  <div className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {cluster.name}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-medium text-purple-700 mb-1">Key Presenting Symptoms:</div>
                      <div className="flex flex-wrap gap-1">
                        {cluster.keySymptoms.map((symptom, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-purple-700 mb-1">Consider These Conditions:</div>
                      <div className="flex flex-wrap gap-1">
                        {cluster.associatedConditions.slice(0, 3).map((condition, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-purple-300 text-purple-700">
                            {condition}
                          </Badge>
                        ))}
                        {cluster.associatedConditions.length > 3 && (
                          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                            +{cluster.associatedConditions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {cluster.diagnosticClues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <div className="font-medium text-purple-700 text-sm mb-1">Diagnostic Clues:</div>
                      <div className="text-xs text-purple-600">
                        {cluster.diagnosticClues.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {expandedSections.clusters && syndromeClusters.length === 0 && (
            <div className="p-3 pt-0 text-sm text-muted-foreground">
              No significant symptom clusters identified
            </div>
          )}
        </div>

        {/* Negative Finding Importance */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto"
            onClick={() => toggleSection('adjustments')}
          >
            <div className="flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Probability Adjustments</span>
              <Badge variant="secondary" className="ml-2">
                {probabilityAdjustments.length} adjustments
              </Badge>
            </div>
            {expandedSections.adjustments ? 
              <MinusCircle className="w-4 h-4" /> : 
              <PlusCircle className="w-4 h-4" />
            }
          </Button>
          
          {expandedSections.adjustments && probabilityAdjustments.length > 0 && (
            <div className="p-3 pt-0 space-y-2">
              {probabilityAdjustments.map((adjustment, index) => (
                <div key={index} className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-blue-800 mb-1">
                        {adjustment.condition.name}
                      </div>
                      <div className="text-sm text-blue-700 mb-2">
                        Probability reduced by {Math.round(adjustment.adjustment * 100)}%
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        {adjustment.reason}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      -{Math.round(adjustment.adjustment * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expandedSections.adjustments && probabilityAdjustments.length === 0 && (
            <div className="p-3 pt-0 text-sm text-muted-foreground">
              No probability adjustments based on negative findings
            </div>
          )}
        </div>

        {/* Patient Summary */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Patient Summary:</div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{patient.age} years</Badge>
            <Badge variant="secondary">{patient.sex}</Badge>
            <Badge variant="secondary">{patient.symptoms.length} symptoms</Badge>
            <Badge variant="secondary">{patient.duration} {patient.durationUnit}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

