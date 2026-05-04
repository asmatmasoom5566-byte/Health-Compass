import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ClipboardCheck } from 'lucide-react';
import { Cause } from '@shared/schema';
import { useRemovedConditions } from '@/hooks/use-removed-conditions';

interface PatientDemographics {
  age: number | '';
  sex: 'Male' | 'Female' | '';
  duration: number | '';
  durationUnit: 'hours' | 'days' | 'weeks' | 'months' | 'years' | '';
}

interface ScoredCause {
  id: string;
  name: string;
  score: number;
  matchCount: number;
  ageMatch?: string;
  sexMatch?: string;
  durationMatch?: string;
}

interface HistorySummaryProps {
  demographics?: PatientDemographics;
  chiefComplaints: string[];
  suggestedConditions: ScoredCause[];
}

export function HistorySummary({ demographics, chiefComplaints, suggestedConditions }: HistorySummaryProps) {
  const [copied, setCopied] = useState(false);
  const { filterRemoved } = useRemovedConditions();

  // Filter out removed conditions
  const visibleConditions = filterRemoved(suggestedConditions);

  // Format the history text
  const formatHistoryText = (): string => {
    let text = '';
    
    // Add demographics
    if (demographics && demographics.age !== '') {
      text += `Age: ${demographics.age} years\n`;
    }
    if (demographics && demographics.sex) {
      text += `Sex: ${demographics.sex}\n`;
    }
    if (demographics && demographics.duration !== '' && demographics.durationUnit) {
      text += `Duration: ${demographics.duration} ${demographics.durationUnit}\n`;
    }
    
    // Add chief complaints
    if (chiefComplaints.length > 0) {
      text += '\nChief Complaints:\n';
      chiefComplaints.forEach(complaint => {
        text += `- ${complaint}\n`;
      });
    }
    
    // Add suggested conditions (filtered)
    if (visibleConditions && visibleConditions.length > 0) {
      text += '\nSuggested Conditions:\n';
      // Sort by score descending and take top 5
      const sortedConditions = [...visibleConditions]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5);
      sortedConditions.forEach(condition => {
        // Only show condition name
        text += `- ${condition.name}\n`;
      });
    }
    
    return text.trim();
  };

  const handleCopy = () => {
    const historyText = formatHistoryText();
    navigator.clipboard.writeText(historyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const historyText = formatHistoryText();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-foreground font-display">Clinical History</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <ClipboardCheck className="w-4 h-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy History
            </>
          )}
        </Button>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 max-h-60 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
          {historyText || 'Complete patient demographics and enter symptoms to generate clinical history.'}
        </pre>
      </div>
    </div>
  );
}