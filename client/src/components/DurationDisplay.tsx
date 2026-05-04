// DurationDisplay Component - Shows condition duration information for clinicians
import React from 'react';
import { Cause, DurationEntry } from '@shared/schema';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Timer,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  formatDurationRange, 
  getDurationTypeDisplay,
  convertToDays,
  getDurationEntries
} from '@/utils/duration-matching';

interface DurationDisplayProps {
  condition: Cause;
  patientDuration?: number;
  patientDurationUnit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  showAllEntries?: boolean;
  compact?: boolean;
}

export function DurationDisplay({ 
  condition, 
  patientDuration, 
  patientDurationUnit,
  showAllEntries = false,
  compact = false
}: DurationDisplayProps) {
  const entries = getDurationEntries(condition);
  
  // Debug logging
  console.log('DurationDisplay - condition:', condition.name);
  console.log('DurationDisplay - condition object:', condition);
  

  
  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground italic">
          No duration information available
        </div>
      </div>
    );
  }
  
  // Calculate patient duration in days for comparison
  const patientDays = patientDuration && patientDurationUnit 
    ? convertToDays(patientDuration, patientDurationUnit)
    : null;
  
  // Find the best matching entry
  const findMatchingEntry = (): { entry: DurationEntry; isInRange: boolean } | null => {
    if (patientDays === null) return null;
    
    for (const entry of entries) {
      const startDays = convertToDays(
        'startDuration' in entry ? entry.startDuration : (entry as any).minDuration, 
        entry.unit
      );
      const endDays = convertToDays(
        'endDuration' in entry ? entry.endDuration : (entry as any).maxDuration, 
        entry.unit
      );
      
      if (patientDays >= startDays && patientDays <= endDays) {
        return { entry, isInRange: true };
      }
    }
    
    // Return first entry as default if no match
    return entries.length > 0 ? { entry: entries[0], isInRange: false } : null;
  };
  
  const matchResult = findMatchingEntry();
  const primaryEntry = matchResult?.entry || entries[0];
  
  if (compact) {
    // Compact view - just show the primary duration type and range
    const display = getDurationTypeDisplay(primaryEntry.durationType);
    
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          style={{ borderColor: display.color, color: display.color }}
          className="text-xs"
        >
          {primaryEntry.durationType}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDurationRange(
            'startDuration' in primaryEntry ? primaryEntry.startDuration : (primaryEntry as any).minDuration,
            'endDuration' in primaryEntry ? primaryEntry.endDuration : (primaryEntry as any).maxDuration,
            primaryEntry.unit
          )}
        </span>
        {patientDays !== null && (
          <>
            {matchResult?.isInRange ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            )}
          </>
        )}
      </div>
    );
  }
  
  // Full view with all entries
  const displayEntries = showAllEntries ? entries : [primaryEntry];
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="w-4 h-4 text-primary" />
        <span>Duration Information</span>
        {patientDays !== null && matchResult && (
          <Badge 
            variant={matchResult.isInRange ? "default" : "secondary"}
            className="text-xs"
          >
            {matchResult.isInRange ? 'Matches' : 'Outside Range'}
          </Badge>
        )}
      </div>
      
      {/* Duration Entries */}
      <div className="space-y-2">
        {displayEntries.map((entry, index) => {
          const display = getDurationTypeDisplay(entry.durationType);
          const isPrimary = entry === primaryEntry;
          const isMatched = matchResult?.entry === entry && matchResult.isInRange;
          
          return (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                isPrimary ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* Duration Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      style={{ 
                        backgroundColor: `${display.color}20`, 
                        color: display.color,
                        borderColor: display.color 
                      }}
                      variant="outline"
                      className="text-xs font-medium"
                    >
                      {entry.durationType}
                    </Badge>
                    <Badge 
                      variant={entry.ruleType === 'hard' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {entry.ruleType === 'hard' ? 'Hard Rule' : 'Soft Rule'}
                    </Badge>
                    {isMatched && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  
                  {/* Duration Range */}
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDurationRange(
                        'startDuration' in entry ? entry.startDuration : (entry as any).minDuration,
                        'endDuration' in entry ? entry.endDuration : (entry as any).maxDuration,
                        entry.unit
                      )}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {display.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Patient Duration Comparison */}
      {patientDays !== null && patientDuration && patientDurationUnit && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Patient Duration</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{patientDuration} {patientDurationUnit}</span>
            {matchResult && (
              <span className="text-muted-foreground ml-2">
                ({matchResult.isInRange 
                  ? `Within ${matchResult.entry.durationType.toLowerCase()} range` 
                  : `Outside typical ${matchResult.entry.durationType.toLowerCase()} range`
                })
              </span>
            )}
          </div>
          
          {/* Alert for unusual duration */}
          {matchResult && !matchResult.isInRange && matchResult.entry.ruleType === 'hard' && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertTriangle className="w-3 h-3" />
              <span>Duration outside hard limits - condition may be excluded</span>
            </div>
          )}
          
          {matchResult && !matchResult.isInRange && matchResult.entry.ruleType === 'soft' && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              <span>Unusual duration - consider alternative diagnoses</span>
            </div>
          )}
        </div>
      )}
      
      {/* Show all entries toggle */}
      {!showAllEntries && entries.length > 1 && (
        <div className="text-xs text-muted-foreground">
          +{entries.length - 1} more duration type{entries.length > 2 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// Compact badge component for use in lists
interface DurationBadgeProps {
  durationType: string;
  ruleType?: 'soft' | 'hard';
  className?: string;
}

export function DurationBadge({ durationType, ruleType = 'soft', className = '' }: DurationBadgeProps) {
  const display = getDurationTypeDisplay(durationType as any);
  
  return (
    <Badge 
      variant="outline"
      style={{ 
        borderColor: display.color, 
        color: display.color,
        backgroundColor: `${display.color}10`
      }}
      className={`font-medium ${className}`}
    >
      {durationType}
      {ruleType === 'hard' && ' *'}
    </Badge>
  );
}

// Alert component for unusual durations
interface DurationAlertProps {
  conditionName: string;
  durationType?: string;
  isProlonged?: boolean;
}

export function DurationAlert({ conditionName, durationType, isProlonged }: DurationAlertProps) {
  if (!isProlonged && !durationType) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-amber-800">
        <strong>{conditionName}:</strong>{' '}
        {isProlonged 
          ? 'Chronic / prolonged form detected'
          : `${durationType} presentation`
        }
      </span>
    </div>
  );
}

export default DurationDisplay;
