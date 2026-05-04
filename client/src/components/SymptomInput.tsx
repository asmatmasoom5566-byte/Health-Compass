import React, { useState, useRef, useEffect, memo } from 'react';
import { X, Plus, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Cause } from '@shared/schema';

interface SymptomInputProps {
  selectedSymptoms: string[];
  onAdd: (symptom: string) => void;
  onRemove: (symptom: string) => void;
  onClear: () => void;
  knownSymptoms: Array<string | { typicalSymptom: string }> ; // For autocomplete suggestions
}

export function SymptomInput({ selectedSymptoms, onAdd, onRemove, onClear, knownSymptoms }: SymptomInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.length > 1) {
      // Create a Set for O(1) lookup performance and deduplication
      const selectedSymptomsSet = new Set(selectedSymptoms.map(s => s.toLowerCase().trim()));
      
      const matches = knownSymptoms
        .filter(s => {
          // Extract symptom string from union type
          const symptomString = typeof s === 'string' ? s : s.typicalSymptom;
          const normalizedSymptom = symptomString.toLowerCase().trim();
          
          // Filter out:
          // 1. Symptoms that don't match the input
          // 2. Symptoms that are already selected (deduplication)
          return normalizedSymptom.includes(inputValue.toLowerCase()) && 
                 !selectedSymptomsSet.has(normalizedSymptom);
        })
        .map(s => typeof s === 'string' ? s : s.typicalSymptom);
      
      // Remove any duplicate suggestions from the result
      const uniqueMatches = Array.from(new Set(matches));
      
      setSuggestions(uniqueMatches.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [inputValue, knownSymptoms, selectedSymptoms]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCurrentInput();
    } else if (e.key === 'Backspace' && inputValue === '' && selectedSymptoms.length > 0) {
      onRemove(selectedSymptoms[selectedSymptoms.length - 1]);
    }
  };

  const addCurrentInput = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue("");
      setSuggestions([]);
    }
  };

  const addSuggestion = (s: string) => {
    onAdd(s);
    setInputValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Observed Symptoms
        </label>
        {selectedSymptoms.length > 0 && (
          <button 
            onClick={onClear}
            className="text-xs text-destructive hover:text-destructive/80 font-medium transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 px-2.5 py-1 rounded-full"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="min-h-[120px] p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-white/30 shadow-lg hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all duration-300 cursor-text backdrop-blur-sm" onClick={() => inputRef.current?.focus()}>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectedSymptoms.map(symptom => (
              <motion.span
                key={symptom}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                layout
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-100/80 to-orange-100/80 dark:from-pink-900/50 dark:to-orange-900/50 text-primary border border-white/50 text-sm font-medium group shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 symptom-name"
              >
                {symptom}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(symptom); }}
                  className="ml-2 p-0.5 rounded-full hover:bg-red-500 text-primary/60 hover:text-white transition-all duration-200 transform hover:scale-110 bg-white/30"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          
          <div className="relative flex-grow min-w-[150px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedSymptoms.length === 0 ? "Type symptoms (e.g. fever, cough)..." : "Add another..."}
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 py-1 focus:ring-0"
            />
            
            {/* Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-2xl border border-white/30 z-50 overflow-hidden backdrop-blur-sm">
                {suggestions.map(s => (
                  <button
                    key={s}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200 flex items-center gap-2 border-b border-white/20 last:border-b-0"
                    onClick={(e) => { e.stopPropagation(); addSuggestion(s); }}
                  >
                    <Plus className="w-3 h-3 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-2 py-1 rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-white/30 shadow-sm font-mono text-[10px] font-bold">Enter</kbd> or <kbd className="px-2 py-1 rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-white/30 shadow-sm font-mono text-[10px] font-bold">Comma</kbd> to add tags
      </p>
    </div>
  );
}

export default memo(SymptomInput);
