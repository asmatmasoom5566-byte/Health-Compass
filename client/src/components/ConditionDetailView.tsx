import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Stethoscope, 
  Syringe, 
  Info, 
  Calendar, 
  User, 
  Activity,
  X
} from 'lucide-react';
import { Cause } from '@shared/schema';
import { cn } from '@/lib/utils';

interface ConditionDetailViewProps {
  condition: Cause | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ConditionDetailView({ condition, isOpen, onClose }: ConditionDetailViewProps) {
  if (!condition) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <Stethoscope className="w-6 h-6 text-primary" />
                {condition.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed information about {condition.name}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {condition.symptoms.map((symptom, index) => {
                        const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                        return (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {symptomText}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Demographics */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {condition.ageRule && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Age Range</h4>
                      <p className="text-sm">
                        {condition.ageRule.min !== undefined && condition.ageRule.max !== undefined
                          ? `${condition.ageRule.min} - ${condition.ageRule.max} years`
                          : condition.ageRule.min !== undefined
                            ? `≥ ${condition.ageRule.min} years`
                            : condition.ageRule.max !== undefined
                              ? `≤ ${condition.ageRule.max} years`
                              : 'Any age'}
                      </p>
                      {condition.ageRule.ruleType && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {condition.ageRule.ruleType} rule
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {condition.sexRule && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Sex</h4>
                      <p className="text-sm capitalize">{condition.sexRule}</p>
                    </div>
                  )}
                  
                  {condition.durationCriteria && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Duration</h4>
                      <p className="text-sm">
                        {condition.durationCriteria.startDuration} - {condition.durationCriteria.endDuration}{' '}
                        {condition.durationCriteria.unit}
                      </p>
                      {condition.durationCriteria.ruleType && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {condition.durationCriteria.ruleType} rule
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Last Edit Time */}
            {condition.lastEditTime && (
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Last Edit Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    This condition was last edited on: 
                    <span className="font-medium">
                      {new Date(condition.lastEditTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Treatment */}
            {condition.treatment && (
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-primary" />
                    Treatment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {condition.treatment.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            
            {/* Additional Details */}
            {condition.symptomDetails && Object.keys(condition.symptomDetails).length > 0 && (
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Symptom Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(condition.symptomDetails).map(([symptom, details]) => (
                      <div key={symptom} className="border-l-2 border-primary pl-3">
                        <h4 className="font-medium text-sm">{symptom}</h4>
                        <p className="text-sm text-muted-foreground">{details}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}