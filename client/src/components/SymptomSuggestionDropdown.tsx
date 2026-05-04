import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface SymptomSuggestionDropdownProps {
  inputValue: string;
  onSelectSymptom: (symptom: string) => void;
  anchorElement?: HTMLElement | null;
}

export function SymptomSuggestionDropdown({ 
  inputValue, 
  onSelectSymptom,
  anchorElement 
}: SymptomSuggestionDropdownProps) {
  const [suggestions, setSuggestions] = useState<Array<{ symptom: string; conditions?: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        searchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const searchSuggestions = async () => {
    try {
      setIsLoading(true);
      // Fetch from causes API
      const response = await fetch('/api/causes');
      const data = await response.json();
      
      // Extract and search symptoms
      const allSymptoms = new Map<string, string[]>();
      
      data.causes.forEach((condition: any) => {
        if (condition.symptoms && Array.isArray(condition.symptoms)) {
          condition.symptoms.forEach((symptom: any) => {
            const symptomText = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
            const normalized = symptomText.toLowerCase().trim();
            
            if (!allSymptoms.has(normalized)) {
              allSymptoms.set(normalized, []);
            }
            allSymptoms.get(normalized)!.push(condition.name);
          });
        }
      });
      
      // Filter by search query
      const query = inputValue.toLowerCase().trim();
      const matches = Array.from(allSymptoms.entries())
        .filter(([symptom]) => symptom.includes(query))
        .slice(0, 8)
        .map(([symptom, conditions]) => ({
          symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1),
          conditions
        }));
      
      setSuggestions(matches);
    } catch (error) {
      console.error('Failed to search suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (symptom: string) => {
    onSelectSymptom(symptom);
    setSuggestions([]);
  };

  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div ref={dropdownRef} className="absolute z-50 w-full mt-1">
      <Card className="max-h-64 overflow-y-auto shadow-lg border-primary/20 bg-white dark:bg-slate-800">
        {isLoading ? (
          <div className="p-3 text-sm text-muted-foreground">Searching...</div>
        ) : (
          <div className="py-1">
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2"
                onClick={() => handleSelect(item.symptom)}
              >
                <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.symptom}</div>
                  {item.conditions && item.conditions.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.conditions.slice(0, 2).join(', ')}
                      {item.conditions.length > 2 && ` +${item.conditions.length - 2} more`}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}