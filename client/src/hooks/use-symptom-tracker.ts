import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { causeSchema, type Cause } from '@shared/schema';

// Types for our local state
export interface TrackerState {
  causes: Cause[];
  selectedSymptoms: string[];
}

const STORAGE_KEY = 'symptom_tracker_v1';

// Initial seed data if storage is empty
const INITIAL_CAUSES: Cause[] = [
  { id: '1', name: 'Common Cold', baseRate: 60, symptoms: ['cough', 'sore throat', 'runny nose', 'sneezing', 'fatigue'] },
  { id: '2', name: 'Influenza (Flu)', baseRate: 30, symptoms: ['fever', 'chills', 'muscle aches', 'cough', 'congestion', 'headache', 'fatigue'] },
  { id: '3', name: 'Migraine', baseRate: 15, symptoms: ['headache', 'nausea', 'sensitivity to light', 'sensitivity to sound', 'visual aura'] },
  { id: '4', name: 'Allergies', baseRate: 40, symptoms: ['sneezing', 'itchy eyes', 'runny nose', 'red eyes', 'cough'] },
  { id: '5', name: 'Gastroenteritis', baseRate: 20, symptoms: ['nausea', 'vomiting', 'diarrhea', 'stomach cramps', 'fever'] },
];

export function useSymptomTracker() {
  const { toast } = useToast();
  
  // Initialize state from local storage or defaults
  const [causes, setCauses] = useState<Cause[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Simple migration/validation check
        if (Array.isArray(parsed.causes)) {
          return parsed.causes;
        }
      }
    } catch (e) {
      console.error("Failed to load from storage", e);
    }
    return INITIAL_CAUSES;
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.selectedSymptoms)) {
          return parsed.selectedSymptoms;
        }
      }
    } catch (e) {
      console.error("Failed to load symptoms", e);
    }
    return [];
  });

  // Undo Stack
  const [history, setHistory] = useState<TrackerState[]>([]);

  // Persist to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ causes, selectedSymptoms }));
  }, [causes, selectedSymptoms]);

  const pushHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, { causes, selectedSymptoms }];
      return newHistory.slice(-10); // Keep last 10
    });
  }, [causes, selectedSymptoms]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCauses(previous.causes);
    setSelectedSymptoms(previous.selectedSymptoms);
    toast({ title: "Action Undone", description: "Restored previous state." });
  }, [history, toast]);

  // Actions
  const addSymptom = (symptom: string) => {
    const normalized = symptom.toLowerCase().trim();
    if (!normalized || selectedSymptoms.includes(normalized)) return;
    
    pushHistory();
    setSelectedSymptoms(prev => [...prev, normalized]);
  };

  const removeSymptom = (symptom: string) => {
    pushHistory();
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const clearSymptoms = () => {
    pushHistory();
    setSelectedSymptoms([]);
  };

  const addCause = (cause: Omit<Cause, 'id'>) => {
    pushHistory();
    const newCause: Cause = { ...cause, id: crypto.randomUUID() };
    setCauses(prev => [...prev, newCause]);
    toast({ title: "Cause Added", description: `${newCause.name} added to database.` });
  };

  const updateCause = (id: string, updates: Partial<Cause>) => {
    pushHistory();
    setCauses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast({ title: "Cause Updated", description: "Changes saved successfully." });
  };

  const deleteCause = (id: string) => {
    pushHistory();
    setCauses(prev => prev.filter(c => c.id !== id));
    toast({ title: "Cause Deleted", variant: "destructive" });
  };

  const resetDatabase = () => {
    pushHistory();
    setCauses(INITIAL_CAUSES);
    setSelectedSymptoms([]);
    toast({ title: "Reset Complete", description: "Database restored to defaults." });
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const schema = z.array(causeSchema);
      const validated = schema.parse(parsed);
      
      pushHistory();
      setCauses(validated);
      toast({ title: "Import Successful", description: `${validated.length} causes loaded.` });
      return true;
    } catch (e) {
      toast({ 
        title: "Import Failed", 
        description: "Invalid JSON format or schema.", 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    causes,
    selectedSymptoms,
    history,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    addCause,
    updateCause,
    deleteCause,
    resetDatabase,
    importData,
    undo,
    canUndo: history.length > 0
  };
}
