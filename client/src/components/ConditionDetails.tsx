import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Cause } from '../../../shared/schema';

interface ConditionDetailsProps {
  condition: Cause | null;
}

export function ConditionDetails({ condition }: ConditionDetailsProps) {
  const [expandedSymptoms, setExpandedSymptoms] = useState<Record<string, boolean>>({});

  if (!condition) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Select a condition to view details
      </div>
    );
  }

  const toggleSymptomDetail = (symptom: string) => {
    setExpandedSymptoms(prev => ({
      ...prev,
      [symptom]: !prev[symptom]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="space-y-4">
        {/* Header with Close Button */}
        <div className="flex justify-between items-start border-b pb-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{condition.name}</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('closeConditionDetails'))}
            className="ml-2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 2. Typical Symptoms */}
        <div>
          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Supportive Features</h3>
          <div className="flex flex-wrap gap-2">
            {condition.symptoms && condition.symptoms.length > 0 ? (
             condition.symptoms.map((symptom, index) => {
               const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                return (
                  <Badge key={index} variant="secondary" className="text-sm bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800">
                    {symptomText}
                  </Badge>
                );
              })
            ) : (
              <p className="text-muted-foreground italic">No typical symptoms listed</p>
            )}
          </div>
        </div>

        {/* 3. Atypical Symptoms - Only show if there are atypical symptoms */}
        {condition.atypicalSymptoms && condition.atypicalSymptoms.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Atypical Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {condition.atypicalSymptoms.map((symptom, index) => (
                <Badge key={index} variant="outline" className="text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}


        {/* 5. Symptoms with Details Section (EXPANDABLE) */}
        <div>
          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">Symptoms with Details</h3>
          <div className="space-y-2">
            {condition.symptoms && condition.symptoms.length > 0 ? (
             condition.symptoms.map((symptom, index) => {
               const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
               const details = condition.symptomDetails?.[symptomText] || '';
                return (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 cursor-pointer hover:from-pink-100 hover:to-purple-100 transition-colors"
                      onClick={() => toggleSymptomDetail(symptomText)}
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-purple-800">{symptomText}</h4>
                        {details && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs cursor-pointer bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSymptomDetail(symptomText);
                            }}
                          >
                            Detail
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSymptomDetail(symptomText);
                        }}
                      >
                        {expandedSymptoms[symptomText] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {expandedSymptoms[symptomText] && details && (
                      <div className="p-3 border-t bg-gradient-to-br from-purple-50 to-pink-50">
                        <p className="text-sm text-purple-700">{details}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground italic">
                No symptoms listed
              </p>
            )}
          </div>
        </div>

        {/* 6. Treatment Section - Only show if there is treatment info */}
        {condition.treatment && (
          <div>
            <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Treatment</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
              {condition.treatment.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}