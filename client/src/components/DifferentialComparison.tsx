import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { X, Star, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DifferentialCondition {
  id: string;
  name: string;
  score: number;
  symptoms: Array<string | { typicalSymptom: string }>;
  keyFeatures: Array<string | { typicalSymptom: string }>;
  discriminatorFeatures: Array<string | { typicalSymptom: string }>;
  pathognomonicSymptoms?: string[];
  definingSymptoms?: string[];
  ageRange?: { min: number; max: number };
  sexApplicability?: 'male' | 'female' | 'both';
}

interface DifferentialComparisonProps {
  conditions: DifferentialCondition[];
  onClose?: () => void; // New prop to close the full screen view
  className?: string; // Allow custom styling for full screen view
}

export function DifferentialComparison({ conditions, onClose, className }: DifferentialComparisonProps) {
  // Get the top 3 conditions for comparison
  const topConditions = [...conditions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Helper function to extract symptom string from various formats
  const getSymptomString = (s: string | { typicalSymptom: string }): string => {
    return typeof s === 'string' ? s : s.typicalSymptom || '';
  };

  // Combine all symptoms to create comparison matrix
  const allSymptoms = Array.from(
    new Set(topConditions.flatMap(condition => 
      condition.symptoms.map(getSymptomString)
    ))
  ).sort();

  const allKeyFeatures = Array.from(
    new Set(topConditions.flatMap(condition => 
      condition.keyFeatures.map(getSymptomString)
    ))
  ).sort();

  // Get hierarchical symptom categories for each condition
  const getHierarchicalSymptoms = (condition: DifferentialCondition) => {
    const pathognomonic = condition.pathognomonicSymptoms || [];
    const defining = condition.definingSymptoms || [];
    const typicalSymptoms = condition.symptoms.map(getSymptomString);
    
    // Other typical symptoms are those not in pathognomonic or defining lists
    const otherTypical = typicalSymptoms.filter(symptom => 
      !pathognomonic.some(ps => ps.toLowerCase() === symptom.toLowerCase()) &&
      !defining.some(ds => ds.toLowerCase() === symptom.toLowerCase())
    );
    
    return { pathognomonic, defining, otherTypical };
  };

  const isFullScreen = !!onClose; // If onClose is provided, we're in full screen mode

  return (
    <div className={className}>
      <Card className={cn("border border-border bg-card", isFullScreen ? "h-full" : "")}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Differential Diagnosis Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Side-by-side comparison of top conditions with key differentiators
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className={cn("overflow-x-auto", isFullScreen ? "h-[calc(100vh-200px)] overflow-y-auto" : "")}>
          {/* Comparison Table */}
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Feature</TableHead>
                {topConditions.map((condition, index) => (
                  <TableHead 
                    key={condition.id} 
                    className={cn(
                      "text-center",
                      index === 0 ? "text-green-600" : 
                      index === 1 ? "text-yellow-600" : 
                      "text-blue-600"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="font-bold">{condition.name}</div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "mx-auto",
                          index === 0 ? "border-green-500 text-green-500" : 
                          index === 1 ? "border-yellow-500 text-yellow-500" : 
                          "border-blue-500 text-blue-500"
                        )}
                      >
                        {condition.score}%
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Pathognomonic Symptoms Section */}
              {topConditions.some(c => (c.pathognomonicSymptoms || []).length > 0) && (
                <TableRow className="border-t-2 border-t-red-200">
                  <TableCell className="font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Pathognomonic Symptoms
                    </div>
                  </TableCell>
                  {topConditions.map((condition, index) => {
                    const { pathognomonic } = getHierarchicalSymptoms(condition);
                    return (
                      <TableCell key={`${condition.id}-pathognomonic`} className="text-center bg-red-50/50 dark:bg-red-900/10">
                        <div className="space-y-1">
                          {pathognomonic.length > 0 ? (
                            pathognomonic.map((symptom, idx) => (
                              <Badge 
                                key={idx} 
                                variant="default" 
                                className="bg-red-500 hover:bg-red-600 text-white text-xs flex items-center gap-1"
                              >
                                <Star className="w-3 h-3 fill-current" />
                                {symptom}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-500 border-red-500/30">
                              None
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}

              {/* Defining Symptoms Section */}
              {topConditions.some(c => (c.definingSymptoms || []).length > 0) && (
                <TableRow className="border-t-2 border-t-yellow-200">
                  <TableCell className="font-bold bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Defining Symptoms
                    </div>
                  </TableCell>
                  {topConditions.map((condition, index) => {
                    const { defining } = getHierarchicalSymptoms(condition);
                    return (
                      <TableCell key={`${condition.id}-defining`} className="text-center bg-yellow-50/50 dark:bg-yellow-900/10">
                        <div className="space-y-1">
                          {defining.length > 0 ? (
                            defining.map((symptom, idx) => (
                              <Badge 
                                key={idx} 
                                variant="default" 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs flex items-center gap-1"
                              >
                                <Star className="w-3 h-3" />
                                {symptom}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                              None
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}

              {/* Other Typical Symptoms Section */}
              {allSymptoms.length > 0 && (
                <TableRow className="border-t-2 border-t-gray-200">
                  <TableCell className="font-bold bg-muted">
                    <div className="flex items-center gap-2">
                      <span>Other Typical Symptoms</span>
                    </div>
                  </TableCell>
                  {topConditions.map((condition, index) => {
                    const { otherTypical } = getHierarchicalSymptoms(condition);
                    return (
                      <TableCell key={`${condition.id}-typical`} className="text-center bg-muted">
                        <div className="space-y-1">
                          {otherTypical.length > 0 ? (
                            otherTypical.slice(0, 5).map((symptom, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs mr-1">
                                {symptom}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500 border-gray-500/30">
                              None
                            </Badge>
                          )}
                          {otherTypical.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{otherTypical.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}

              {/* Key Discriminator Features */}
              {allKeyFeatures.length > 0 && (
                <TableRow className="border-t-2 border-t-blue-200">
                  <TableCell className="font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    <div className="flex items-center gap-2">
                      <span>Key Discriminator Features</span>
                    </div>
                  </TableCell>
                  {topConditions.map((condition, index) => {
                    const conditionKeyFeatures = condition.keyFeatures.map(getSymptomString);
                    return (
                      <TableCell key={`${condition.id}-key-feature`} className="text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <div className="space-y-1">
                          {conditionKeyFeatures.slice(0, 3).map((feature, featIndex) => (
                            <Badge key={featIndex} variant="outline" className="text-xs mr-1 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
                              {feature}
                            </Badge>
                          ))}
                          {conditionKeyFeatures.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{conditionKeyFeatures.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

