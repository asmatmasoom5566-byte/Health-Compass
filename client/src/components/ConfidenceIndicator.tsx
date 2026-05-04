import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Circle, Minus, Plus, Info } from 'lucide-react';

interface ConfidenceIndicatorProps {
  conditionName: string;
  overallScore: number;
  symptomMatches: number;
  totalSymptoms: number;
  demographicMatches: {
    age?: boolean;
    sex?: boolean;
    duration?: boolean;
  };
  missingFeatures?: string[];
  supportingFeatures?: string[];
  onMissingFeatureClick?: (feature: string) => void;
  onSectionClick?: (section: 'overall' | 'symptoms' | 'supporting' | 'missing') => void;
}

export function ConfidenceIndicator({
  conditionName,
  overallScore,
  symptomMatches,
  totalSymptoms,
  demographicMatches,
  missingFeatures = [],
  supportingFeatures = [],
  onMissingFeatureClick,
  onSectionClick
}: ConfidenceIndicatorProps) {
  const confidenceLevel = overallScore >= 75 ? 'High' : 
                        overallScore >= 50 ? 'Medium' : 
                        overallScore >= 25 ? 'Low' : 'Very Low';

  const confidenceColor = overallScore >= 75 ? 'bg-green-500' : 
                         overallScore >= 50 ? 'bg-yellow-500' : 
                         overallScore >= 25 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <Card className="border border-white/30 bg-gradient-to-br from-white/80 to-gray-100/80 dark:from-slate-800/80 dark:to-slate-900/80 shadow-lg hover:shadow-xl transition-shadow duration-300 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Clinical Confidence: {conditionName}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full shadow-sm",
              overallScore >= 75 ? 'border-green-500 text-green-500 bg-green-50/80 dark:bg-green-900/20' :
              overallScore >= 50 ? 'border-yellow-500 text-yellow-500 bg-yellow-50/80 dark:bg-yellow-900/20' :
              overallScore >= 25 ? 'border-orange-500 text-orange-500 bg-orange-50/80 dark:bg-orange-900/20' :
              'border-red-500 text-red-500 bg-red-50/80 dark:bg-red-900/20'
            )}
          >
            {confidenceLevel} ({overallScore}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {/* Overall Confidence Progress */}
        <div 
          className="space-y-2 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
          onClick={() => onSectionClick && onSectionClick('overall')}
        >
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Overall Confidence</span>
            <span>{overallScore}%</span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Symptom Matches */}
        <div 
          className="space-y-2 cursor-pointer hover:bg-green-50/50 dark:hover:bg-green-900/20 p-2 rounded-lg transition-colors"
          onClick={() => onSectionClick && onSectionClick('symptoms')}
        >
          <h4 className="text-sm font-semibold text-foreground">Symptom Analysis</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{symptomMatches} of {totalSymptoms} symptoms matched</span>
                <span>{Math.round((symptomMatches / totalSymptoms) * 100)}%</span>
              </div>
              <Progress 
                value={totalSymptoms > 0 ? (symptomMatches / totalSymptoms) * 100 : 0} 
                className="h-1.5 mt-1" 
              />
            </div>
          </div>
        </div>

        {/* Demographic Matches */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Demographic Analysis</h4>
          <div className="grid grid-cols-3 gap-2">
            {demographicMatches.age !== undefined && (
              <div className="text-xs">
                <span className="text-muted-foreground">Age: </span>
                <span className={demographicMatches.age ? 'text-green-600 font-medium' : 'text-red-600'}>
                  {demographicMatches.age ? 'Match' : 'No Match'}
                </span>
              </div>
            )}
            {demographicMatches.sex !== undefined && (
              <div className="text-xs">
                <span className="text-muted-foreground">Sex: </span>
                <span className={demographicMatches.sex ? 'text-green-600 font-medium' : 'text-red-600'}>
                  {demographicMatches.sex ? 'Match' : 'No Match'}
                </span>
              </div>
            )}
            {demographicMatches.duration !== undefined && (
              <div className="text-xs">
                <span className="text-muted-foreground">Duration: </span>
                <span className={demographicMatches.duration ? 'text-green-600 font-medium' : 'text-red-600'}>
                  {demographicMatches.duration ? 'Match' : 'No Match'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Supporting Features */}
        {supportingFeatures.length > 0 && (
          <div 
            className="space-y-2 cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-900/20 p-2 rounded-lg transition-colors"
            onClick={() => onSectionClick && onSectionClick('supporting')}
          >
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
              <Plus className="w-3 h-3 text-green-600" />
              Supporting Features
            </h4>
            <div className="flex flex-wrap gap-1">
              {supportingFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Features */}
        {missingFeatures.length > 0 && (
          <div 
            className="space-y-2 cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
            onClick={() => onSectionClick && onSectionClick('missing')}
          >
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
              <Minus className="w-3 h-3 text-red-600" />
              Missing Features
            </h4>
            <div className="flex flex-wrap gap-1">
              {missingFeatures.map((feature, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs text-red-600 border-red-600/50 cursor-pointer hover:bg-red-50 hover:border-red-700/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMissingFeatureClick && onMissingFeatureClick(feature);
                  }}
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}