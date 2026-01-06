import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cause } from '@shared/schema';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SuggestionListProps {
  causes: Cause[];
  selectedSymptoms: string[];
  onEdit: (cause: Cause) => void;
  onDelete: (id: string) => void;
}

interface ScoredCause extends Cause {
  score: number;
  matchCount: number;
  matchedSymptoms: string[];
}

export function SuggestionList({ causes, selectedSymptoms, onEdit, onDelete }: SuggestionListProps) {
  
  const scoredCauses = useMemo(() => {
    return causes.map(cause => {
      const matched = cause.symptoms.filter(s => 
        selectedSymptoms.includes(s.toLowerCase())
      );
      
      // Simple scoring algorithm
      // Base Rate + (Matches / Total Symptoms * 100) * Weight
      // This is arbitrary for visual demo purposes
      
      let rawScore = 0;
      if (cause.symptoms.length > 0) {
        rawScore = (matched.length / cause.symptoms.length) * 100;
      }
      
      // Boost by base rate slightly, but prioritize symptom matches
      const weightedScore = (rawScore * 0.7) + (cause.baseRate * 0.3);
      
      // If we have symptoms selected but 0 matches, score should be very low unless base rate is high
      const finalScore = selectedSymptoms.length > 0 && matched.length === 0 
        ? cause.baseRate * 0.1 
        : weightedScore;

      return {
        ...cause,
        score: Math.round(finalScore),
        matchCount: matched.length,
        matchedSymptoms: matched
      } as ScoredCause;
    })
    .sort((a, b) => b.score - a.score)
    .filter(c => c.score > 0); // Only show relevant results
  }, [causes, selectedSymptoms]);

  if (selectedSymptoms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
        <div className="bg-muted p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Waiting for input</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">
          Enter symptoms on the left to see potential cause suggestions based on your database.
        </p>
      </div>
    );
  }

  if (scoredCauses.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-xl">
        <p className="text-muted-foreground">No matching causes found in database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scoredCauses.map((cause, index) => (
        <motion.div
          key={cause.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative bg-white dark:bg-slate-800 p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                {cause.name}
                {cause.matchCount === cause.symptoms.length && (
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold tracking-wider uppercase">
                    Perfect Match
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Base Rate: {cause.baseRate}% • Matches: {cause.matchCount}/{cause.symptoms.length}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => onEdit(cause)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Cause</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => onDelete(cause.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Cause</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className={cn(
                "transition-colors",
                cause.score > 75 ? "text-green-600 dark:text-green-400" :
                cause.score > 40 ? "text-amber-600 dark:text-amber-400" :
                "text-muted-foreground"
              )}>
                Likelihood
              </span>
              <span>{cause.score}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${cause.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-colors duration-500",
                  cause.score > 75 ? "bg-gradient-to-r from-green-500 to-green-400" :
                  cause.score > 40 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                  "bg-gradient-to-r from-slate-400 to-slate-300"
                )}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {cause.symptoms.map(symptom => {
              const isMatched = selectedSymptoms.includes(symptom.toLowerCase());
              return (
                <span 
                  key={symptom}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors",
                    isMatched 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-muted/50 border-transparent text-muted-foreground"
                  )}
                >
                  {symptom}
                </span>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
