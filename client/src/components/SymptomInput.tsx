import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SymptomInputProps {
  selectedSymptoms: string[];
  onAdd: (symptom: string) => void;
  onRemove: (symptom: string) => void;
  onClear: () => void;
  knownSymptoms: string[]; // For autocomplete suggestions
}

export function SymptomInput({ selectedSymptoms, onAdd, onRemove, onClear, knownSymptoms }: SymptomInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.length > 1) {
      const matches = knownSymptoms
        .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !selectedSymptoms.includes(s))
        .slice(0, 5);
      setSuggestions(matches);
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
            className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="min-h-[120px] p-4 rounded-xl bg-white border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all cursor-text" onClick={() => inputRef.current?.focus()}>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectedSymptoms.map(symptom => (
              <motion.span
                key={symptom}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                layout
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium group"
              >
                {symptom}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(symptom); }}
                  className="ml-2 p-0.5 rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary transition-colors"
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
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 py-1"
            />
            
            {/* Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-popover rounded-lg shadow-lg border border-border z-50 overflow-hidden">
                {suggestions.map(s => (
                  <button
                    key={s}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
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
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Comma</kbd> to add tags
      </p>
    </div>
  );
}
