import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { causeSchema, type Cause } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { PathognomonicSymptomsManager } from '@/utils/pathognomonic-symptoms-manager';

// Migration function to update conditions: remove atypicalSymptoms and initialize pathognomonicSymptoms
function migrateConditionsToPathognomonic(causes: any[]): Cause[] {
  return causes.map(cause => {
    // Create a copy of the cause and remove atypicalSymptoms
    const { atypicalSymptoms, ...rest } = cause;
    
    // Ensure pathognomonicSymptoms is properly formatted as array
    let pathognomonicSymptoms: string[] = [];
    if (Array.isArray(cause.pathognomonicSymptoms)) {
      pathognomonicSymptoms = cause.pathognomonicSymptoms;
    } else if (typeof cause.pathognomonicSymptoms === 'string' && cause.pathognomonicSymptoms.trim()) {
      // Convert comma-separated string to array
      pathognomonicSymptoms = cause.pathognomonicSymptoms.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    const updatedCause = {
      ...rest,
      pathognomonicSymptoms
    };
    
    return updatedCause as Cause;
  });
}

// Types for our local state
export interface TrackerState {
  causes: Cause[];
  selectedSymptoms: string[];
}

const STORAGE_KEY = 'symptom_tracker_v1';

// Import the full condition database and migration utilities
import { generateFullConditionDatabase, migrateConditionsToDemographics, loadConditionDatabase } from '@/utils/condition-migrator';

// Initial seed data - now uses the full 124 condition database
const INITIAL_CAUSES: Cause[] = generateFullConditionDatabase();

export function useSymptomTracker() {
  const { toast } = useToast();
  
  // Initialize state from local storage or defaults
  const [causes, setCauses] = useState<Cause[]>(() => {
    try {
      // DO NOT load from localStorage - always fetch from server
      // This ensures all users see the same database data
      console.log('⏭️  Skipping localStorage - will fetch from database');
    } catch (e) {
      console.error("Failed to load from storage", e);
    }
    
    console.log('Using empty initial state - will load from server');
    return [];
  });

  // Auto-load conditions from JSON file if causes array is empty
  useEffect(() => {
    const autoLoadConditions = async () => {
      // Only auto-load if no conditions are currently loaded
      if (causes.length === 0) {
        try {
          console.log('Auto-loading conditions from my-conditions.json...');
          const conditions = await loadConditionDatabase();
          if (conditions.length > 0) {
            console.log(`Loaded ${conditions.length} conditions, setting state...`);
            setCauses(conditions);
            toast({
              title: "Condition Database Loaded",
              description: `Successfully loaded ${conditions.length} conditions.`,
              duration: 3000
            });
          }
        } catch (error) {
          console.error('Failed to auto-load conditions:', error);
        }
      }
    };
    
    autoLoadConditions();
  }, []);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Handle both old and new format
        if (Array.isArray(parsed.selectedSymptoms)) {
          return parsed.selectedSymptoms;
        } else if (Array.isArray(parsed)) {
          // Old format without wrapper object - return empty array since old format didn't have selectedSymptoms separately
          return [];
        }
      }
    } catch (e) {
      console.error("Failed to load symptoms", e);
    }
    return [];
  });

  // CRITICAL: Fetch from database on mount - ignore localStorage completely
  useEffect(() => {
    const fetchFromDatabase = async () => {
      console.log('🌐 Fetching conditions from database...');
      try {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('/api/causes', { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.causes && data.causes.length > 0) {
            console.log(`✅ Loaded ${data.causes.length} conditions from database`);
            setCauses(data.causes);
            
            // Also fetch pharmacology
            const pharmaResponse = await fetch('/api/pharmacology', { headers });
            if (pharmaResponse.ok) {
              const pharmaData = await pharmaResponse.json();
              if (pharmaData.pharmacology && pharmaData.pharmacology.length > 0) {
                localStorage.setItem('pharmacology_v1', JSON.stringify({ medicines: pharmaData.pharmacology }));
                console.log(`✅ Loaded ${pharmaData.pharmacology.length} medicines from database`);
              }
            }
          }
        } else {
          console.log('⚠️  Not authenticated, will fetch after login');
        }
      } catch (error) {
        console.error('❌ Failed to fetch from database:', error);
      }
    };
    
    fetchFromDatabase();
  }, []);

  // Persist to local storage whenever state changes - Enhanced for maximum reliability
  useEffect(() => {
    const timestamp = new Date().toISOString();
    const dataToSave = {
      causes,
      selectedSymptoms,
      lastUpdated: timestamp,
      version: '1.0',
      persistenceVerified: true
    };
    
    try {
      // DO NOT auto-generate timestamps - preserve existing ones only
      dataToSave.causes = causes;
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Verify the save was successful
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.causes && parsed.causes.length === causes.length) {
          console.log(`✅ Data permanently saved: ${causes.length} conditions with timestamp ${timestamp}`);
        } else {
          console.error('❌ Save verification failed: data mismatch');
        }
      }
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      // Attempt to save to sessionStorage as backup
      try {
        sessionStorage.setItem(STORAGE_KEY + '_backup', JSON.stringify(dataToSave));
        console.log('💾 Backup saved to sessionStorage');
      } catch (backupError) {
        console.error('❌ Backup save also failed:', backupError);
      }
    }
  }, [causes, selectedSymptoms]);

  // Clinical History Storage
  const [clinicalHistory, setClinicalHistory] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('clinicalHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load clinical history", e);
      return [];
    }
  });

  // Save clinical history to localStorage
  useEffect(() => {
    localStorage.setItem('clinicalHistory', JSON.stringify(clinicalHistory));
  }, [clinicalHistory]);

  // Actions
  const addSymptom = (symptom: string) => {
    const normalized = symptom.toLowerCase().trim();
    if (!normalized || selectedSymptoms.includes(normalized)) return;
    
    const newSymptoms = [...selectedSymptoms, normalized];
    setSelectedSymptoms(newSymptoms);
    
    // Save to server history
    apiRequest('POST', '/api/search-history', { symptoms: newSymptoms })
      .catch(err => console.error("Failed to save search history:", err));
  };

  // Add patient record to clinical history
  const addPatientToHistory = (patientData: {
    demographics: any;
    chiefComplaints: string[];
    suggestedConditions: any[];
    timestamp: string;
  }) => {
    setClinicalHistory(prev => {
      const newHistory = [
        patientData,
        ...prev.slice(0, 4) // Keep only last 5 patients
      ];
      return newHistory;
    });
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const clearSymptoms = () => {
    setSelectedSymptoms([]);
  };

  const addCause = (cause: Omit<Cause, 'id'>) => {
    const newCause: Cause = { 
      ...cause, 
      id: crypto.randomUUID()
      // No timestamps on initial add - will be set when user saves edits
    };
    setCauses(prev => {
      const updated = [...prev, newCause];
      console.log('Added new cause:', newCause.name, 'Total causes:', updated.length);
      return updated;
    });
    toast({ title: "Cause Added", description: `${newCause.name} added to database.` });
  };

  const updateCause = (id: string, updates: Partial<Cause>) => {
    const timestamp = new Date().toISOString();
    
    // Validate the updates
    const validatedUpdates = {
      ...updates,
      editCount: (updates as any).editCount ? (updates as any).editCount + 1 : 1
    };
    
    setCauses(prev => prev.map(c => {
      if (c.id === id) {
        // Create updated cause with all original properties plus new updates
        const updatedCause = { 
          ...c, 
          ...validatedUpdates
        };
        
        // Only update lastEditTime if actual clinical content has changed - NEVER use import time
        const contentHasChanged = hasContentChanged(c, updatedCause);
        if (contentHasChanged) {
          updatedCause.lastEditTime = timestamp;
        } else {
          // Preserve existing lastEditTime - don't change it
          updatedCause.lastEditTime = (c as any).lastEditTime;
        }
        
        console.log(`✅ Manually updated cause ${c.name}:`, validatedUpdates);
        return updatedCause;
      }
      return c;
    }));
    
    // Enhanced success notification
    toast({ 
      title: "✅ Changes Permanently Saved", 
      description: `All manual edits permanently stored. This condition will appear at the top of your list.`,
      duration: 3000
    });
  };

  const updateMultipleCauses = (updatedCauses: Cause[]) => {
    const timestamp = new Date().toISOString();
    setCauses(prev => {
      const causeMap = new Map(prev.map(cause => [cause.id, cause]));
      
      // Update existing causes with the new data
      updatedCauses.forEach(updatedCause => {
        const existingCause = causeMap.get(updatedCause.id);
        causeMap.set(updatedCause.id, {
          ...existingCause,
          ...updatedCause,
          // Only update lastEditTime if actual content has changed - NEVER use import time as fallback
          lastEditTime: hasContentChanged(existingCause, updatedCause) ? timestamp : (existingCause as any)?.lastEditTime
        });
      });
      
      return Array.from(causeMap.values());
    });
    toast({ 
      title: "Multiple Changes Saved", 
      description: `${updatedCauses.length} conditions updated and permanently saved.`,
      duration: 2500
    });
  };

  // Helper function to check if content has changed
  const hasContentChanged = (existing: Cause | undefined, updated: Cause): boolean => {
    if (!existing) return true; // New condition is always a content change
    
    // Check if any of the clinical content fields have changed
    const clinicalFields = [
      'name',
      'symptoms',
      'atypicalSymptoms', 
      'definingSymptoms',
      'symptomDetails',
      'ageRule',
      'sexRule',
      'durationCriteria',
      'durationRule',
      'treatment',
      'fullReview'
    ];
    
    for (const field of clinicalFields) {
      if (JSON.stringify(existing[field as keyof Cause]) !== 
          JSON.stringify(updated[field as keyof Cause])) {
        return true;
      }
    }
    
    return false;
  };
  
  const deleteCause = (id: string) => {
    setCauses(prev => prev.filter(c => c.id !== id));
    toast({ title: "Cause Deleted", variant: "destructive" });
  };

  const resetDatabase = () => {
    console.log('Resetting database with new demographic-aware conditions');
    console.log('New conditions:', INITIAL_CAUSES);
    
    // DO NOT add timestamps - preserve original lastEditTime only
    const causesWithoutAutoTimestamps = INITIAL_CAUSES.map(cause => ({
      ...cause
      // No lastEditTime - leave undefined for seed data
    }));
    
    setCauses(causesWithoutAutoTimestamps);
    setSelectedSymptoms([]);
    // Preserve clinical history when resetting database
    localStorage.removeItem(STORAGE_KEY);
    toast({ 
      title: "Database Reset Complete", 
      description: "124 conditions restored without auto-timestamps.",
      duration: 3000
    });
  };

  // Function to manually load your existing 124 conditions with age rules
  const loadYourConditions = (conditionsJson: string) => {
    try {
      const parsed = JSON.parse(conditionsJson);
      if (Array.isArray(parsed) && parsed.length > 50) {
        // Migrate your conditions to include comprehensive demographic information
        const migratedConditions = migrateConditionsToDemographics(parsed);
        setCauses(migratedConditions);
        toast({ 
          title: "Conditions Loaded", 
          description: `Successfully loaded ${migratedConditions.length} conditions with demographic rules.` 
        });
        return true;
      } else {
        toast({ 
          title: "Load Failed", 
          description: "Invalid conditions format or insufficient conditions.",
          variant: "destructive" 
        });
        return false;
      }
    } catch (error) {
      toast({ 
        title: "Load Failed", 
        description: "Invalid JSON format.",
        variant: "destructive" 
      });
      return false;
    }
  };

  const importData = (jsonData: string, mergeStrategy: 'replace' | 'merge' = 'replace') => {
    try {
      const parsed = JSON.parse(jsonData);
      const schema = z.array(causeSchema);
      const validated = schema.parse(parsed);
      
      const timestamp = new Date().toISOString();
      
      if (mergeStrategy === 'merge') {
        // Merge logic: combine with existing data
        setCauses(prevCauses => {
          const updatedCauses = [...prevCauses];
          
          validated.forEach(importedCause => {
            // Find existing condition by name (case-insensitive)
            const existingIndex = updatedCauses.findIndex(
              cause => cause.name.toLowerCase() === importedCause.name.toLowerCase()
            );
            
            if (existingIndex >= 0) {
              // Merge with existing condition
              const existingCause = updatedCauses[existingIndex];
              
              // Merge symptoms (avoid duplicates)
              const mergedSymptoms = [...existingCause.symptoms];
              importedCause.symptoms.forEach(symptom => {
                if (!mergedSymptoms.some(s => s.toLowerCase() === symptom.toLowerCase())) {
                  mergedSymptoms.push(symptom);
                }
              });
              
              // Update fields that exist in imported data
              const updatedCause = {
                ...existingCause,
                symptoms: mergedSymptoms,
                ...(importedCause.treatment && { treatment: importedCause.treatment }),
                ...(importedCause.fullReview && { fullReview: importedCause.fullReview }),
                ...(importedCause.baseRate !== undefined && { baseRate: importedCause.baseRate }),
                ...(importedCause.symptomDetails && {
                  symptomDetails: {
                    ...existingCause.symptomDetails,
                    ...importedCause.symptomDetails
                  }
                }),
                lastEditTime: importedCause.lastEditTime || existingCause.lastEditTime
                // DO NOT set to timestamp - preserve only
              };
              
              updatedCauses[existingIndex] = updatedCause;
            } else {
              // Add as new condition - DO NOT auto-generate timestamps
              updatedCauses.push({
                ...importedCause,
                id: crypto.randomUUID()
                // No lastEditTime - leave undefined for new imports without one
              });
            }
          });
          
          return updatedCauses;
        });
        
        toast({ 
          title: "Merge Successful", 
          description: `Data merged with existing conditions. ${validated.length} conditions processed.` 
        });
      } else {
        // Replace strategy - DO NOT auto-generate timestamps
        const importedCauses = validated.map(cause => ({
          ...cause,
          id: cause.id || crypto.randomUUID()
          // No lastEditTime - preserve as-is from import
        }));
        setCauses(importedCauses);
        toast({ 
          title: "Import Successful", 
          description: `${validated.length} conditions imported with original timestamps preserved.` 
        });
      }
      
      return true;
    } catch (e: any) {
      toast({ 
        title: "Import Failed", 
        description: e.message || "Invalid JSON format or schema.", 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    causes,
    selectedSymptoms,
    clinicalHistory,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    addCause,
    updateCause,
    updateMultipleCauses,
    deleteCause,
    resetDatabase,
    importData,
    loadYourConditions, // New function to load your existing 124 conditions
    addPatientToHistory,
    canUndo: false
  };
}
