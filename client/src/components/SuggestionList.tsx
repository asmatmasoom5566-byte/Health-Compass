import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cause } from "@shared/schema";
import {
  Edit2,
  Trash2,
  AlertCircle,
  Info,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface SuggestionListProps {
  causes: Cause[];
  selectedSymptoms: string[];
  onEdit: (cause: Cause) => void;
  onDelete: (id: string) => void;
  onSelect: (cause: Cause) => void;
}

interface ScoredCause extends Cause {
  score: number;
  matchCount: number;
  matchedSymptoms: string[];
}

export function SuggestionList({
  causes,
  selectedSymptoms,
  onEdit,
  onDelete,
  onSelect,
}: SuggestionListProps) {
  useEffect(() => {
    const handleStorageChange = () => {
      const savedFontSize = localStorage.getItem('app-font-size');
      if (savedFontSize) {
        document.documentElement.style.setProperty('--app-font-size', `${savedFontSize}px`);
      }
      
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        const root = document.documentElement;
        ["teal", "blue", "green", "red", "purple", "orange"].forEach(t => root.classList.remove(`theme-${t}`));
        if (savedTheme !== "teal") {
          root.classList.add(`theme-${savedTheme}`);
        }
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app-style-update', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app-style-update', handleStorageChange);
    };
  }, []);

  const [viewingCause, setViewingCause] = useState<ScoredCause | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const scoredCauses = useMemo(() => {
    let filtered = causes;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = causes.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.symptoms.some(s => s.toLowerCase().includes(term)) ||
        (c.details && c.details.toLowerCase().includes(term))
      );
    }

    return filtered
      .map((cause) => {
        const matched = cause.symptoms.filter((s) =>
          selectedSymptoms.some((ss) => s.toLowerCase().includes(ss.toLowerCase())),
        );

        let rawScore = 0;
        if (cause.symptoms.length > 0) {
          rawScore = (matched.length / cause.symptoms.length) * 100;
        }

        const weightedScore = rawScore;

        const finalScore =
          selectedSymptoms.length > 0 && matched.length === 0
            ? 0
            : weightedScore;

        return {
          ...cause,
          score: Math.round(finalScore),
          matchCount: matched.length,
          matchedSymptoms: matched,
        } as ScoredCause;
      })
      .sort((a, b) => {
        // If there's a search term, prioritize name matches
        if (searchTerm.trim()) {
          const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
          const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
        }

        // Primary sort: Match count (descending)
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount;
        }
        // Secondary sort: Score/Percentage (descending)
        return b.score - a.score;
      })
      .filter((c) => searchTerm.trim() ? true : c.matchCount > 0);
  }, [causes, selectedSymptoms, searchTerm]);

  if (selectedSymptoms.length === 0 && !searchTerm.trim()) {
    return (
      <div className="space-y-4">
        <div className="px-1">
          <Input 
            placeholder="Search conditions database..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-900 border-border"
          />
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <div className="bg-muted p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Waiting for input
          </h3>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Enter symptoms on the left or search above to see potential cause suggestions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <Input 
          placeholder="Search conditions database..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white dark:bg-slate-900 border-border"
        />
      </div>
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {searchTerm.trim() ? "Search Results" : "Matches Found"}
        </h2>
      </div>

      {scoredCauses.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 rounded-xl">
          <p className="text-muted-foreground">
            No matching causes found in database.
          </p>
        </div>
      ) : (
        scoredCauses.map((cause, index) => (
          <motion.div
            key={cause.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white dark:bg-slate-800 p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3
                  className="text-xl font-black text-primary flex items-center gap-2 cursor-pointer hover:underline decoration-2"
                  onClick={() => onSelect(cause)}
                >
                  {cause.name}
                  {cause.matchCount > 0 && cause.matchCount === cause.symptoms.length && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold tracking-wider uppercase">
                      Perfect Match
                    </span>
                  )}
                </h3>
                {cause.matchCount > 0 && (
                  <>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cause.score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full transition-colors duration-500",
                          cause.score > 75
                            ? "bg-gradient-to-r from-green-500 to-green-400"
                            : cause.score > 40
                              ? "bg-gradient-to-r from-amber-500 to-amber-400"
                              : "bg-gradient-to-r from-slate-400 to-slate-300",
                        )}
                      />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground mt-1">
                      Database Match Likelihood: {cause.score}%
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-1 ml-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingCause(cause)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1 border-b border-green-100 dark:border-green-900/30 pb-0.5">
                  Symptoms
                </p>
                <div className="flex flex-wrap gap-1">
                  {cause.symptoms.map((symptom) => {
                    const isMatched = selectedSymptoms.some((ss) =>
                      symptom.toLowerCase().includes(ss.toLowerCase()),
                    );
                    return (
                      <span
                        key={symptom}
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                          isMatched
                            ? "bg-green-100 border-green-200 text-green-700 font-bold dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                            : "bg-muted/30 border-transparent text-muted-foreground/60",
                        )}
                      >
                        {symptom}
                      </span>
                    );
                  })}
                </div>
              </div>

              {cause.atypicalSymptoms && cause.atypicalSymptoms.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1 border-b border-purple-100 dark:border-purple-900/30 pb-0.5">
                    Atypical Symptoms
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cause.atypicalSymptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="text-[9px] px-1.5 py-0.5 rounded border bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cause.note && (
                <div>
                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1 border-b border-red-100 dark:border-red-900/30 pb-0.5">
                    Specific Note
                  </p>
                  <p className="text-[10px] text-foreground leading-relaxed font-medium">
                    {cause.note}
                  </p>
                </div>
              )}

              {cause.labTest && (
                <div>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 border-b border-blue-100 dark:border-blue-900/30 pb-0.5">
                    Lab Test
                  </p>
                  <p className="text-[10px] text-foreground leading-relaxed">
                    {cause.labTest}
                  </p>
                </div>
              )}

              {cause.treatment && (
                <div>
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1 border-b border-teal-100 dark:border-teal-900/30 pb-0.5">
                    Treatment
                  </p>
                  <p className="text-[10px] text-foreground leading-relaxed">
                    {cause.treatment}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
