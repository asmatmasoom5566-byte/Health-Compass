import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Label } from './ui/label';

interface SymptomDetailProps {
  symptom: string;
  isAtypical?: boolean;
  isReadOnly?: boolean; // For viewing in suggested conditions
  symptomDetails?: string; // Stored symptom details for read-only view
}

export function SymptomDetail({ symptom, isAtypical = false, isReadOnly = false, symptomDetails = '' }: SymptomDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Symptom Header */}
      <div 
        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
          <span className={`text-sm font-medium ${isAtypical ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'}`}>
            {symptom}
          </span>
          {isAtypical && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              ATYPICAL
            </span>
          )}
          {isReadOnly && symptomDetails && symptomDetails.trim() && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              DETAILS
            </span>
          )}
        </div>
      </div>

      {/* Symptom Detail Panel */}
      <AnimatePresence>
        {isExpanded && symptomDetails && symptomDetails.trim() && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-muted/30 border-t border-border">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-border">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {symptomDetails}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

