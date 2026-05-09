import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Cause, DurationUnit, Medicine } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Activity, Info, BarChart3, ChevronDown, ChevronUp, Clock, Eye, AlertTriangle, CheckCircle, XCircle, Calendar, Star, User, Pill, X, ShieldOff, ThumbsUp, ThumbsDown, Zap, Ban, Target, GitCompare, Stethoscope, BookOpen, AlertCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceIndicator } from '@/components/ConfidenceIndicator';
import { DifferentialComparison } from '@/components/DifferentialComparison';
import { DiagnosticReasoningPanel } from '@/components/DiagnosticReasoningPanel';
import { ConditionDetailView } from '@/components/ConditionDetailView';
import { CauseEditModal } from '@/components/CauseEditModal';
import { DiagnosticReasoningEngine, PatientContext } from '@/utils/diagnostic-reasoning';
import { CardinalSymptomsManager } from '@/utils/cardinal-symptoms-manager';
import { 
  matchDuration, 
  PatientDurationContext, 
  formatDurationRange,
  convertToDays,
  generateDurationAlert
} from '@/utils/duration-matching';
import {
  matchCondition,
  matchAllConditions,
  PatientMatchingContext,
  getMatchTags,
  ConditionMatchResult,
  getMatchedSymptomsList,
  countMatchedSymptoms
} from '@/utils/condition-matching';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useRemovedConditions } from '@/hooks/use-removed-conditions';
import { usePharmacology } from '@/hooks/use-pharmacology';

interface ScoredCause extends Cause {
  score: number;
  matchCount: number;
  ageMatch?: string;
  sexMatch?: string;
  durationMatch?: string;
  durationAlert?: string; // Alert message for unusual duration
  supportingFeatures?: string[];
  missingFeatures?: string[];
  keyFeatures?: string[];
  discriminatorFeatures?: string[];
  matchTags?: string[]; // Tags for successful matches (AGE MATCH, SEX MATCH, DURATION MATCH)
  isDownRanked?: boolean; // Whether condition is down-ranked due to soft rule failure
  isHardRuleExcluded?: boolean; // Whether condition is excluded due to hard rule violation
  hasDefiningSymptom?: boolean; // Whether the condition has matched defining symptoms
  hasPathognomonicSymptom?: boolean; // Whether the condition has matched pathognomonic symptoms
  definingSymptomCount?: number; // Number of matched defining symptoms
  matchedPathognomonicSymptoms?: string[]; // Array of matched pathognomonic symptoms
  matchedCardinalSymptoms?: string[]; // Array of matched cardinal symptoms
  matchedModerateSymptoms?: string[]; // Array of matched moderate symptoms - NEW
  excludedFeaturesCount?: number; // Number of matching exclusion features
  excludedFeaturesList?: string[]; // List of matching exclusion features
  exclusionPenalty?: number; // Total penalty applied from exclusion features
  matchedRiskFactorsCount?: number; // Number of matching risk factors
  matchedRiskFactorsList?: string[]; // List of matching risk factors
  riskFactorsBoost?: number; // Total boost applied from risk factors
}

interface PatientDemographics {
  age: number | '';
  sex: 'Male' | 'Female' | '' | 'male' | 'female';
  duration: number | '';
  durationUnit: 'hours' | 'days' | 'weeks' | 'months' | 'years' | '';
}

interface SuggestionListProps {
  causes: Cause[];
  selectedSymptoms: string[];
  patientDemographics?: PatientDemographics;
  onEdit: (cause: Cause) => void;
  onDelete: (id: string) => void;
  onSelect: (cause: Cause) => void;
  onScoredCausesChange?: (scoredCauses: ScoredCause[]) => void;
  onAddSymptom: (symptom: string) => void;
  canEdit?: boolean; // Controls visibility of edit/remove features
}

export function SuggestionList({ 
  causes, 
  selectedSymptoms, 
  patientDemographics,
  onEdit, 
  onDelete,
  onSelect,
  onScoredCausesChange,
  onAddSymptom,
  canEdit = true // Default to true for backward compatibility
}: SuggestionListProps) {
  const [viewingCause, setViewingCause] = useState<ScoredCause | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfidence, setShowConfidence] = useState<Record<string, boolean>>({});
  const [showDifferential, setShowDifferential] = useState(false);
  const [showDiagnosticReasoning, setShowDiagnosticReasoning] = useState(false);
  const [negativeFindings, setNegativeFindings] = useState<string[]>([]);
  const [diagnosticAnalysis, setDiagnosticAnalysis] = useState<any>(null);
  const [visibleConditionsCount, setVisibleConditionsCount] = useState(10);
  const [selectedCondition, setSelectedCondition] = useState<Cause | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState<{ testName: string; testDetails?: string } | null>(null);
  const [showTreatmentView, setShowTreatmentView] = useState(false);
  const [treatmentPage, setTreatmentPage] = useState(1); // For pagination if needed
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCause, setEditingCause] = useState<Cause | null>(null);
  
  // Medicine selector state
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showFullPageMedicine, setShowFullPageMedicine] = useState(false);
  
  // Symptom meaning popup state
  const [symptomMeaningPopup, setSymptomMeaningPopup] = useState<{
    symptom: string;
    meaning: string;
    position: { x: number; y: number };
  } | null>(null);
  
  // Access pharmacology database
  const { medicines } = usePharmacology();
  
  // Load symptom meanings from centralized storage
  const getSymptomMeaning = (symptomName: string): string | null => {
    try {
      const data = localStorage.getItem('symptom_meanings_v1');
      if (data) {
        const meanings = JSON.parse(data);
        const key = symptomName.toLowerCase().trim();
        const meaning = meanings[key] || null;
        // Debug log to verify loading
        if (meaning) {
          console.log(`[Symptom Meaning] Loaded for "${symptomName}":`, meaning.substring(0, 50) + '...');
        }
        return meaning;
      }
    } catch (error) {
      console.error('Failed to load symptom meaning:', error);
    }
    return null;
  };
  
  // Medicine search/filter logic
  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(medicineSearchQuery.toLowerCase()) ||
    med.drugClass.toLowerCase().includes(medicineSearchQuery.toLowerCase())
  ).slice(0, 10);
  
  // Section toggle function
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Use the persistent removed conditions hook
  const { 
    removedConditionIds, 
    removeCondition, 
    restoreAll, 
    filterRemoved,
    count: removedCount 
  } = useRemovedConditions();

  useEffect(() => {
    const handleStorageChange = () => {
      // Refresh data when storage changes
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.medicine-selector-dropdown')) {
        setShowMedicineDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Function to remove a condition from the visible list
  const handleRemoveCondition = (conditionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    removeCondition(conditionId);
  };
  
  // Function to restore all removed conditions (wrapper for the hook's restoreAll)
  const handleRestoreAll = () => {
    restoreAll();
  };
  
  // Function to open edit modal
  const handleEditCondition = (cause: ScoredCause, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setEditingCause(cause);
    setIsEditModalOpen(true);
  };
  
  // Function to handle saving edited condition
  const handleSaveEditedCause = (id: string, updates: Partial<Cause>) => {
    // Call the parent's onEdit function with the updated cause
    // Merge the updates with the existing cause data
    if (editingCause) {
      const fullUpdatedCause = { ...editingCause, ...updates } as Cause;
      onEdit(fullUpdatedCause);
    }
    setIsEditModalOpen(false);
    setEditingCause(null);
  };
    
  const [scoredCauses, setScoredCauses] = useState<ScoredCause[]>([]);
    
  useEffect(() => {
    // Use new condition matching logic when demographics are available
    let newScoredCauses: ScoredCause[] = [];
    
    if (patientDemographics && patientDemographics.age && patientDemographics.sex && patientDemographics.duration && patientDemographics.durationUnit) {
      // Create patient matching context
      const patientContext: PatientMatchingContext = {
        age: Number(patientDemographics.age),
        sex: patientDemographics.sex.toLowerCase() as 'male' | 'female',
        duration: Number(patientDemographics.duration),
        durationUnit: patientDemographics.durationUnit as DurationUnit,
        symptoms: selectedSymptoms
      };
      
      console.log('Using new condition matching logic:', patientContext);
      
      // Use new condition matching logic that separates safety critical conditions
      const { regular, safety } = matchAllConditions(causes, patientContext);
      
      // Combine safety critical conditions (first) with regular conditions
      // Safety critical conditions appear in a separate section as per safety override rule
      const allMatchResults = [...safety, ...regular];
      
      // Filter to show conditions that either:
      // 1. Are visible (passed hard rules)
      // 2. Have symptom matches but were excluded due to hard rule violations (to show why they're excluded)
      const filteredMatchResults = allMatchResults.filter(result => {
        // Calculate if there are symptom matches using synonym-aware matching
        const matchedSymptoms = getMatchedSymptomsList(result.condition.symptoms, selectedSymptoms);
        
        // Show if visible OR has symptom matches (even if excluded by hard rules)
        return result.visible || matchedSymptoms.length > 0;
      });
      
      newScoredCauses = filteredMatchResults.map(result => {
        // Use synonym-aware matching to get matched symptoms for display (preserves doctor's wording)
        const matchedSymptoms = getMatchedSymptomsList(result.condition.symptoms, selectedSymptoms);
        
        // Calculate supporting and missing features
        const supportingFeatures = matchedSymptoms;
        const missingFeatures: string[] = result.condition.symptoms
          .filter(symptom => !getMatchedSymptomsList([typeof symptom === 'string' ? symptom : symptom.typicalSymptom], selectedSymptoms).length)
          .map(symptom => typeof symptom === 'string' ? symptom : symptom.typicalSymptom);
        
        // Determine key and discriminator features
        const keyFeatures = result.condition.symptoms.slice(0, 5).map(s => typeof s === 'string' ? s : s.typicalSymptom);
        const discriminatorFeatures: string[] = [];
                
        // Get match tags for display
        const matchTags = getMatchTags(result);
        
        // Create a special indicator for conditions that were excluded due to hard rule violations
        const isHardRuleExcluded = !result.visible && matchedSymptoms.length > 0;
        
        // Check for pathognomonic symptoms (direct match only, no synonyms)
        const matchedPathognomonicSymptoms = selectedSymptoms.filter(userSymptom =>
          (result.condition.pathognomonicSymptoms || []).some(ps => 
            ps.toLowerCase().trim() === userSymptom.toLowerCase().trim()
          )
        );
        
        // Check for cardinal symptoms (direct match only, no synonyms)
        const matchedCardinalSymptoms = selectedSymptoms.filter(userSymptom =>
          (result.condition.cardinalSymptoms || []).some(cs => 
            cs.toLowerCase().trim() === userSymptom.toLowerCase().trim()
          )
        );
        
        // Check for moderate symptoms (direct match only, no synonyms) - NEW
        const matchedModerateSymptoms = selectedSymptoms.filter(userSymptom =>
          (result.condition.moderateSymptoms || []).some(ms => 
            ms.toLowerCase().trim() === userSymptom.toLowerCase().trim()
          )
        );
        
        // Check for defining symptoms (direct match only, no synonyms)
        const matchedDefiningSymptoms = selectedSymptoms.filter(userSymptom => {
          // Skip if already counted as pathognomonic or cardinal
          if ((result.condition.pathognomonicSymptoms || []).some(ps => 
            ps.toLowerCase().trim() === userSymptom.toLowerCase().trim()
          ) || (result.condition.cardinalSymptoms || []).some(cs => 
            cs.toLowerCase().trim() === userSymptom.toLowerCase().trim()
          )) {
            return false;
          }
          
          return (result.condition.definingSymptoms || []).some(ds => 
            ds.toLowerCase().trim() === userSymptom.toLowerCase().trim()
          );
        });
        
        return {
          ...result.condition,
          score: isHardRuleExcluded ? 0 : result.score, // Set score to 0 if excluded by hard rule
          matchCount: matchedSymptoms.length,
          ageMatch: result.ageMatch.tag || undefined,
          sexMatch: result.sexMatch.tag || undefined,
          durationMatch: result.durationMatch.tag || undefined,
          matchTags,
          isDownRanked: result.downRanked,
          isHardRuleExcluded, // Special indicator for hard rule exclusions
          hasDefiningSymptom: matchedDefiningSymptoms.length > 0 || matchedPathognomonicSymptoms.length > 0,
          hasPathognomonicSymptom: matchedPathognomonicSymptoms.length > 0,
          definingSymptomCount: matchedDefiningSymptoms.length + matchedPathognomonicSymptoms.length,
          matchedPathognomonicSymptoms,
          matchedCardinalSymptoms,
          matchedModerateSymptoms, // NEW: Add moderate symptoms
          supportingFeatures,
          missingFeatures,
          keyFeatures,
          discriminatorFeatures
        };
      });
    } else {
      // Fallback to basic symptom matching when no demographics
      newScoredCauses = causes
        .map(cause => {
          // Use synonym-aware matching for display (preserves doctor's wording)
          const matchedSymptoms = getMatchedSymptomsList(cause.symptoms, selectedSymptoms);
          
          const symptomScore = cause.symptoms.length > 0 
            ? Math.round((matchedSymptoms.length / cause.symptoms.length) * 100)
            : 0;
          
          // Check for pathognomonic symptoms in fallback (direct match only, no synonyms)
          const matchedPathognomonicSymptoms = selectedSymptoms.filter(userSymptom =>
            (cause.pathognomonicSymptoms || []).some(ps => 
              ps.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            )
          );
          
          // Check for cardinal symptoms in fallback (direct match only, no synonyms)
          const matchedCardinalSymptoms = selectedSymptoms.filter(userSymptom =>
            (cause.cardinalSymptoms || []).some(cs => 
              cs.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            )
          );
          
          // Check for moderate symptoms in fallback (direct match only, no synonyms) - NEW
          const matchedModerateSymptoms = selectedSymptoms.filter(userSymptom =>
            (cause.moderateSymptoms || []).some(ms => 
              ms.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            )
          );
          
          // Check for defining symptoms in fallback (direct match only, no synonyms)
          const matchedDefiningSymptoms = selectedSymptoms.filter(userSymptom => {
            // Skip if already counted as pathognomonic, cardinal, or moderate
            if ((cause.pathognomonicSymptoms || []).some(ps => 
              ps.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            ) || (cause.cardinalSymptoms || []).some(cs => 
              cs.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            ) || (cause.moderateSymptoms || []).some(ms => 
              ms.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            )) {
              return false;
            }
            
            return (cause.definingSymptoms || []).some(ds => 
              ds.toLowerCase().trim() === userSymptom.toLowerCase().trim()
            );
          });
          
          return {
            ...cause,
            score: symptomScore,
            matchCount: matchedSymptoms.length,
            ageMatch: undefined,
            sexMatch: undefined,
            durationMatch: undefined,
            matchTags: [],
            isDownRanked: false,
            isHardRuleExcluded: false,
            hasDefiningSymptom: matchedDefiningSymptoms.length > 0 || matchedPathognomonicSymptoms.length > 0,
            hasPathognomonicSymptom: matchedPathognomonicSymptoms.length > 0,
            definingSymptomCount: matchedDefiningSymptoms.length + matchedPathognomonicSymptoms.length,
            matchedPathognomonicSymptoms,
            matchedCardinalSymptoms,
            matchedModerateSymptoms, // NEW: Add moderate symptoms
            supportingFeatures: matchedSymptoms,
            missingFeatures: cause.symptoms
              .filter(symptom => !getMatchedSymptomsList([typeof symptom === 'string' ? symptom : symptom.typicalSymptom], selectedSymptoms).length)
              .map(symptom => typeof symptom === 'string' ? symptom : symptom.typicalSymptom),
            keyFeatures: cause.symptoms.slice(0, 5).map(s => typeof s === 'string' ? s : s.typicalSymptom),
            discriminatorFeatures: []
          };
        })
        .filter(cause => cause.score > 0 || searchTerm)
        .filter(cause => 
          !searchTerm || 
          cause.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cause.symptoms.some(s => 
            typeof s === 'string' 
              ? s.toLowerCase().includes(searchTerm.toLowerCase())
              : s.typicalSymptom.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
    }
    
    // Sort based on context:
    // - When searching or matching symptoms/demographics: sort by match score
    // - When showing full database (no search/filter): maintain natural order
    newScoredCauses.sort((a, b) => {
      // If there's a search term or patient demographics, use matching algorithm
      if (searchTerm || patientDemographics) {
        // Primary sort: by score (highest first)
        if (b.score !== a.score) return b.score - a.score;
        
        // Secondary sort: by number of match tags (more matches first)
        const aTagCount = a.matchTags?.length || 0;
        const bTagCount = b.matchTags?.length || 0;
        if (bTagCount !== aTagCount) return bTagCount - aTagCount;
        
        // Tertiary sort: by symptom match count
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        
        // Final sort: alphabetically
        return a.name.localeCompare(b.name);
      }
      
      // No special sorting for full database - maintain natural order
      return 0;
    });
    
    setScoredCauses(newScoredCauses);
      
    if (onScoredCausesChange) {
      onScoredCausesChange(newScoredCauses);
    }
    
    // Diagnostic reasoning analysis will be handled separately
  }, [causes, selectedSymptoms, patientDemographics, searchTerm, onScoredCausesChange, negativeFindings]);

  if (selectedSymptoms.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-gray-600">
          <div className="bg-gray-200 dark:bg-slate-700 p-4 rounded-full mb-4">
            <Activity className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Waiting for input
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
            Enter symptoms on the left to see potential cause suggestions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scoredCauses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-gray-600">
          <div className="bg-gray-200 dark:bg-slate-700 p-4 rounded-full mb-4">
            <Activity className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No matches found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
            Try different symptoms or search terms to find relevant conditions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Diagnostic Reasoning Panel */}
          {diagnosticAnalysis && (
            <div className="mb-4">
              <DiagnosticReasoningPanel 
                patient={{
                  age: patientDemographics?.age ? Number(patientDemographics.age) : 0,
                  sex: patientDemographics?.sex?.toLowerCase() as 'male' | 'female' || 'male',
                  symptoms: selectedSymptoms,
                  duration: patientDemographics?.duration ? Number(patientDemographics.duration) : 0,
                  durationUnit: patientDemographics?.durationUnit || 'days'
                }}
                alerts={diagnosticAnalysis.closureAlerts || []}
                syndromeClusters={diagnosticAnalysis.syndromeClusters || []}
                probabilityAdjustments={diagnosticAnalysis.probabilityAdjustments || []}
              />
            </div>
          )}
          
          {/* Condition List */}
          <div className="space-y-3">
            {/* Treatment Button - Top of Page (Icon Size) */}
            {scoredCauses.some(cause => cause.treatment && cause.treatment.trim()) && (
              <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm py-2 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <Button
                  onClick={() => setShowTreatmentView(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                  title="View Treatment Guide"
                >
                  <Pill className="w-5 h-5" />
                </Button>
                
                {/* Restore All Button - Only show when conditions have been removed AND user has edit permission */}
                {removedCount > 0 && canEdit && (
                  <Button
                    onClick={handleRestoreAll}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 rounded-lg transition-all duration-200"
                    title="Restore all removed conditions"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-semibold">Restore All ({removedCount})</span>
                  </Button>
                )}
              </div>
            )}
            
            {/* Count Indicator */}
            <div className="text-sm text-muted-foreground text-center py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20">
              Showing {Math.min(visibleConditionsCount, filterRemoved(scoredCauses).length)} of {scoredCauses.length} conditions
              {removedCount > 0 && (
                <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                  ({removedCount} hidden)
                </span>
              )}
            </div>
            
            {filterRemoved(scoredCauses)
              .slice(0, visibleConditionsCount)
              .map((cause, index) => (
              <motion.div
                key={cause.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                onClick={() => onSelect(cause)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent flex items-center gap-2 hover:underline decoration-2 condition-name cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(cause); // This will trigger the detailed view in the parent
                      }}
                    >
                      {cause.name}
                      {cause.matchCount > 0 && cause.matchCount === cause.symptoms.length && (
                        <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-bold tracking-wider uppercase shadow-lg">
                          Perfect Match
                        </span>
                      )}
                    </h3>
                    {/* Edit Button - Only visible for users with edit permission */}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        onClick={(e) => handleEditCondition(cause, e)}
                        title="Edit Condition"
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                    )}
                    {cause.matchCount > 0 && (
                      <>
                        <div className="h-2 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden mt-2 backdrop-blur-sm border border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cause.score}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full transition-all duration-500 shadow-lg",
                              cause.score > 75
                                ? "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"
                                : cause.score > 40
                                  ? "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500",
                            )}
                          />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400 mt-1">
                          Match Likelihood: {cause.score}%
                          {cause.exclusionPenalty && cause.exclusionPenalty > 0 && (
                            <span className="ml-2 text-red-600 dark:text-red-400 font-bold">
                              (-{cause.exclusionPenalty}% exclusion penalty)
                            </span>
                          )}
                        </p>
                        {/* Match Status Indicators - Single Unified Display */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {/* Demographic Match Tags (Age, Sex, Duration) - Only from matchTags */}
                          {cause.matchTags?.map((tag, index) => {
                            // Determine icon and color based on tag type
                            const getTagStyle = (tagText: string) => {
                              if (tagText.includes('AGE')) {
                                return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', icon: Calendar };
                              } else if (tagText.includes('SEX')) {
                                return { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', icon: User };
                              } else if (tagText.includes('DURATION')) {
                                return { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', icon: Clock };
                              }
                              return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', icon: CheckCircle };
                            };
                            
                            const style = getTagStyle(tag);
                            const IconComponent = style.icon;
                            
                            return (
                              <span 
                                key={index}
                                className={`text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${style.bg} ${style.border} ${style.text} border`}
                              >
                                <IconComponent className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            );
                          })}
                          
                          {/* Fallback for old matching logic - ONLY if matchTags doesn't exist */}
                          {!cause.matchTags && (
                            <>
                              {(cause.ageMatch === 'AGE MATCH' || cause.ageMatch === 'Match') && (
                                <span className="text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 bg-blue-100 border border-blue-300 text-blue-800">
                                  <Calendar className="w-2.5 h-2.5" />
                                  AGE MATCH
                                </span>
                              )}
                              {(cause.sexMatch === 'SEX MATCH' || cause.sexMatch === 'Match') && (
                                <span className="text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 bg-pink-100 border border-pink-300 text-pink-800">
                                  <User className="w-2.5 h-2.5" />
                                  SEX MATCH
                                </span>
                              )}
                              {(cause.durationMatch === 'DURATION MATCH' || cause.durationMatch === 'Match') && (
                                <span className="text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 bg-cyan-100 border border-cyan-300 text-cyan-800">
                                  <Clock className="w-2.5 h-2.5" />
                                  DURATION MATCH
                                </span>
                              )}
                            </>
                          )}
                          
                          {/* Show down-ranked indicator */}
                          {cause.isDownRanked && (
                            <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-yellow-100 border border-yellow-300 text-yellow-800">
                              DOWN-RANKED
                            </span>
                          )}
                          
                          {/* Show hard rule exclusion indicator */}
                          {cause.isHardRuleExcluded && (
                            <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-red-100 border border-red-300 text-red-800">
                              HARD RULE EXCLUDED
                            </span>
                          )}
                          
                          {/* Prevalence Tag */}
                          {cause.prevalence && (
                            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${
                              cause.prevalence === 'high' 
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : cause.prevalence === 'moderate'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              {cause.prevalence === 'high' ? 'HIGH PREVALENCE' : cause.prevalence === 'moderate' ? 'MODERATE PREVALENCE' : 'LOW PREVALENCE'}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Lab Tests Section */}
                  {cause.labTests && cause.labTests.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Required Lab Tests ({cause.labTests.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cause.labTests.map((labTest, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (labTest.testDetails) {
                                setSelectedLabTest(labTest);
                              }
                            }}
                            disabled={!labTest.testDetails}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
                              labTest.testDetails
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer shadow-sm hover:shadow-md'
                                : 'bg-gray-100 text-gray-600 cursor-default'
                            }`}
                            title={labTest.testDetails || 'No details available'}
                          >
                            {labTest.testName}
                            {labTest.testDetails && (
                              <span className="ml-1 text-[10px]">🔍</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Remove Button - Only visible for users with edit permission */}
                    {canEdit && (
                      <button
                        onClick={(e) => handleRemoveCondition(cause.id, e)}
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 transition-all duration-200 transform hover:scale-110"
                        title="Remove from suggestions (won't delete from database)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Confidence Indicator */}
                {showConfidence[cause.id] && (
                  <div className="mb-4">
                    <ConfidenceIndicator
                      conditionName={cause.name}
                      overallScore={cause.score}
                      symptomMatches={cause.matchCount}
                      totalSymptoms={cause.symptoms.length}
                      demographicMatches={{
                        age: cause.ageMatch === 'AGE MATCH' || cause.ageMatch === 'Match',
                        sex: cause.sexMatch === 'SEX MATCH' || cause.sexMatch === 'Match',
                        duration: cause.durationMatch === 'DURATION MATCH' || cause.durationMatch === 'Match'
                      }}
                      supportingFeatures={cause.supportingFeatures || []}
                      missingFeatures={cause.missingFeatures || []}
                      onMissingFeatureClick={(feature) => {
                        // Add the clicked feature as a symptom
                        onAddSymptom(feature);
                      }}
                      onSectionClick={(section) => {
                        console.log(`Clicked on ${section} section for ${cause.name}`);
                        // Set the selected condition when clicking on a section
                        onSelect(cause);
                      }}
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Key Features Section */}
                  {(cause.pathognomonicSymptoms && cause.pathognomonicSymptoms.length > 0) && (
                    <div className="mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Star className="w-3 h-3 fill-current" />
                        Key Features
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          // Deduplicate Key Features
                          const seenSymptoms = new Set<string>();
                          const uniqueSymptoms = (cause.pathognomonicSymptoms || []).filter(symptom => {
                            const normalizedKey = symptom.toLowerCase().trim();
                            if (seenSymptoms.has(normalizedKey)) {
                              return false;
                            }
                            seenSymptoms.add(normalizedKey);
                            return true;
                          });
                          
                          return uniqueSymptoms.map((symptom, idx) => {
                            const symptomString = String(symptom);
                            
                            const isMatched = selectedSymptoms.some((ss) =>
                              symptomString.toLowerCase().includes(ss.toLowerCase()),
                            );
                            
                            return (
                              <span
                                key={`pathognomonic-${idx}-${symptomString}`}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 font-semibold cursor-pointer hover:opacity-80 transition-opacity",
                                  isMatched
                                    ? "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300"
                                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddSymptom(symptomString);
                                }}
                                title={`Click to add "${symptomString}" to symptoms`}
                              >
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {symptomString}
                                {isMatched ? (
                                  <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                                ) : (
                                  <XCircle className="w-2.5 h-2.5 text-red-600" />
                                )}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* Cardinal and Typical Symptoms Section - Combined Display */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <Activity className="w-3 h-3" />
                      Important & Supportive Features
                    </h4>
                    
                    {/* Cardinal Symptoms - Visually Distinguished */}
                    {CardinalSymptomsManager.getCardinalSymptoms(cause).length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            // Deduplicate Cardinal Symptoms
                            const cardinalSymptoms = CardinalSymptomsManager.getCardinalSymptoms(cause);
                            const seenSymptoms = new Set<string>();
                            const uniqueSymptoms = cardinalSymptoms.filter(symptom => {
                              const normalizedKey = symptom.toLowerCase().trim();
                              if (seenSymptoms.has(normalizedKey)) {
                                return false;
                              }
                              seenSymptoms.add(normalizedKey);
                              return true;
                            });
                            
                            return uniqueSymptoms.map((symptom, idx) => {
                              const symptomString = String(symptom);
                              
                              const isMatched = selectedSymptoms.some((ss) =>
                                symptomString.toLowerCase().includes(ss.toLowerCase()),
                              );
                              
                              return (
                                <span
                                  key={`cardinal-${idx}-${symptomString}`}
                                  className={cn(
                                    "text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 font-semibold cursor-pointer hover:opacity-80 transition-opacity",
                                    isMatched
                                      ? "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300"
                                      : "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddSymptom(symptomString);
                                  }}
                                  title={`Click to add "${symptomString}" to symptoms`}
                                >
                                  <Activity className="w-2.5 h-2.5" />
                                  {symptomString}
                                  {isMatched ? (
                                    <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-2.5 h-2.5 text-orange-600" />
                                  )}
                                </span>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Typical Symptoms - Excluding Pathognomonic, Cardinal, and Exclusion Features */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          // Deduplicate symptoms by their string representation
                          const seenSymptoms = new Set<string>();
                          const uniqueSymptoms = cause.symptoms.filter(symptom => {
                            const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
                            const normalizedKey = symptomString.toLowerCase().trim();
                            
                            // Skip if we've already seen this symptom
                            if (seenSymptoms.has(normalizedKey)) {
                              return false;
                            }
                            seenSymptoms.add(normalizedKey);
                            return true;
                          });
                          
                          return uniqueSymptoms.map((symptom) => {
                            // Skip pathognomonic symptoms as they're shown separately
                            const symptomString = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
                            if ((cause.pathognomonicSymptoms || []).some(ps => 
                              ps.toLowerCase().trim() === symptomString.toLowerCase().trim()
                            )) {
                              return null;
                            }
                            
                            // Skip cardinal symptoms as they're shown separately above
                            if (CardinalSymptomsManager.isCardinalSymptom(cause, symptomString)) {
                              return null;
                            }
                            
                            // Skip exclusion features - they should not appear as supportive features
                            // This ensures mutual exclusion between exclusion and supportive features
                            // Using EXACT matching for consistency with exclusion feature penalty logic
                            if ((cause.exclusionFeatures || []).some(ef => 
                              ef.toLowerCase().trim() === symptomString.toLowerCase().trim()
                            )) {
                              return null;
                            }
                            
                            // Skip risk factors - they should not appear as supportive features
                            // This ensures mutual exclusion between risk factors and supportive features
                            // Using EXACT matching for consistency with risk factor boost logic
                            if ((cause.riskFactors || []).some(rf => 
                              rf.toLowerCase().trim() === symptomString.toLowerCase().trim()
                            )) {
                              return null;
                            }
                            
                            // Extract symptom string from union type for display and matching
                            const symptomStringForDisplay = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
                            
                            // Extract meaning from centralized storage (priority) or symptom object (fallback)
                            const symptomMeaning = getSymptomMeaning(symptomStringForDisplay) || 
                              (typeof symptom === 'object' && symptom.meaning ? symptom.meaning : null);
                            
                            // Debug: Log if meaning is found
                            if (symptomMeaning) {
                              console.log(`[SuggestionList] ✓ "${symptomStringForDisplay}" has meaning:`, symptomMeaning.substring(0, 60) + '...');
                            }
                            
                            const isMatched = selectedSymptoms.some((ss) =>
                              symptomStringForDisplay.toLowerCase().includes(ss.toLowerCase()),
                            );
                            const hasDetails = cause.symptomDetails?.[symptomStringForDisplay] && cause.symptomDetails[symptomStringForDisplay].trim();
                            const hasMeaning = !!symptomMeaning;
                            
                            return (
                              <span
                                key={`typical-${symptomStringForDisplay}`}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 font-semibold cursor-pointer hover:opacity-80 transition-opacity",
                                  isMatched
                                    ? "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300"
                                    : "bg-gray-100 border-gray-200 text-gray-700 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400",
                                  hasDetails && "ring-1 ring-blue-300 dark:ring-blue-700"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddSymptom(symptomStringForDisplay);
                                }}
                                title={`Click to add "${symptomStringForDisplay}" to symptoms`}
                              >
                                {symptomStringForDisplay}
                                {hasMeaning && (
                                  <span
                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer relative"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Get click position for popup
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setSymptomMeaningPopup({
                                        symptom: symptomStringForDisplay,
                                        meaning: symptomMeaning!,
                                        position: {
                                          x: rect.left + (rect.width / 2),
                                          y: rect.top
                                        }
                                      });
                                    }}
                                  >
                                    <Info className="w-2.5 h-2.5" />
                                  </span>
                                )}
                                {hasDetails && (
                                  <span className="text-[8px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold">
                                    DETAILS
                                  </span>
                                )}
                              </span>
                            );
                          });
                        })()}
                      </div>
                      {cause.symptoms.filter(s => {
                        const sStr = typeof s === 'string' ? s : s.typicalSymptom;
                        return !(cause.pathognomonicSymptoms || []).some(ps => 
                          ps.toLowerCase().trim() === sStr.toLowerCase().trim()
                        ) && 
                        !CardinalSymptomsManager.isCardinalSymptom(cause, sStr);
                      }).length === 0 && (
                        <span className="text-[10px] px-2 py-1 rounded-full border bg-gray-100 border-gray-200 text-gray-500 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400">
                          No additional typical symptoms
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Exclusion Features Section */}
                  {(cause.exclusionFeatures && cause.exclusionFeatures.length > 0) && (
                    <div className="mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <ShieldOff className="w-3 h-3" />
                        Exclusion Features
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {cause.exclusionFeatures.map((symptom, idx) => {
                          const symptomString = String(symptom);
                          
                          // EXACT MATCH: Only show as present when entire sentence matches
                          // No partial matching - requires full text equality (case-insensitive)
                          const isPresent = selectedSymptoms.some((ss) =>
                            symptomString.toLowerCase().trim() === ss.toLowerCase().trim(),
                          );
                          
                          return (
                            <span
                              key={`exclusion-${idx}-${symptomString}`}
                              className={cn(
                                "text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 font-semibold cursor-pointer hover:opacity-80 transition-opacity",
                                isPresent
                                  ? "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300"
                                  : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddSymptom(symptomString);
                              }}
                              title={`Click to add "${symptomString}" to symptoms`}
                            >
                              <ShieldOff className="w-2.5 h-2.5" />
                              {symptomString}
                              {isPresent ? (
                                <XCircle className="w-2.5 h-2.5 text-red-600" />
                              ) : (
                                <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Risk Factors Section */}
                  {(cause.riskFactors && cause.riskFactors.length > 0) && (
                    <div className="mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        Risk Factors {cause.riskFactorsBoost && cause.riskFactorsBoost > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                            +{cause.riskFactorsBoost}%
                          </span>
                        )}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {cause.riskFactors.map((symptom, idx) => {
                          const symptomString = String(symptom);
                          
                          // EXACT MATCH: Only show as present when entire sentence matches
                          // No partial matching - requires full text equality (case-insensitive)
                          const isPresent = selectedSymptoms.some((ss) =>
                            symptomString.toLowerCase().trim() === ss.toLowerCase().trim(),
                          );
                          
                          return (
                            <span
                              key={`riskfactor-${idx}-${symptomString}`}
                              className={cn(
                                "text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 font-semibold cursor-pointer hover:opacity-80 transition-opacity",
                                isPresent
                                  ? "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300"
                                  : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddSymptom(symptomString);
                              }}
                              title={`Click to add "${symptomString}" to symptoms`}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {symptomString}
                              {isPresent ? (
                                <CheckCircle className="w-2.5 h-2.5 text-orange-600" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5 text-green-600" />
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                </div>
              </motion.div>
            ))}
            
            {/* More Button */}
            {filterRemoved(scoredCauses).length > visibleConditionsCount && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleConditionsCount(prev => prev + 10)}
                  className="bg-gradient-to-r from-yellow-500 to-red-500 text-white hover:from-yellow-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-semibold btn-bright-primary"
                >
                  More
                </Button>
              </div>
            )}
            
            {/* No More Conditions Message */}
            {filterRemoved(scoredCauses).length > 0 && 
             filterRemoved(scoredCauses).length <= visibleConditionsCount && (
              <div className="text-center py-4 text-muted-foreground">
                No more conditions to show
              </div>
            )}
            
            {/* All Conditions Removed Message - Only visible to users with edit permission */}
            {scoredCauses.length > 0 && filterRemoved(scoredCauses).length === 0 && canEdit && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full mb-4">
                  <X className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  All conditions hidden
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                  You've removed all conditions from the view. Click "Restore All" to see them again.
                </p>
                <Button
                  onClick={handleRestoreAll}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                >
                  Restore All Conditions
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Condition Detail View */}
      <ConditionDetailView
        condition={selectedCondition}
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
      />

      {/* Lab Test Details Dialog */}
      {selectedLabTest && (
        <Dialog open={!!selectedLabTest} onOpenChange={() => setSelectedLabTest(null)}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-b from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-900 border-white/30 shadow-2xl backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                <Activity className="w-6 h-6 text-blue-600" />
                {selectedLabTest.testName}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Test Details
                </h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {selectedLabTest.testDetails}
                </p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  This lab test is required for diagnosing this condition. Review the test results in the clinical context of the patient's presentation.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedLabTest(null)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Full-Page Treatment View for Top 10 Conditions */}
      {showTreatmentView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <Pill className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Treatment Guide - Top 10 Conditions</h2>
              </div>
              <Button
                onClick={() => setShowTreatmentView(false)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all duration-200"
              >
                Close
              </Button>
            </div>
            
            {/* Medicine Selector Section - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 medicine-selector-dropdown">
              <div className="flex items-center gap-3 mb-3">
                <Pill className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Browse Medicine Details from Pharmacology Database
                </h3>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medicine name or drug class..."
                  value={medicineSearchQuery}
                  onChange={(e) => {
                    setMedicineSearchQuery(e.target.value);
                    setShowMedicineDropdown(true);
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
                
                {/* Dropdown Results */}
                {showMedicineDropdown && medicineSearchQuery && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border 
                                  border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredMedicines.length > 0 ? (
                      filteredMedicines.map((med) => (
                        <button
                          key={med.id}
                          onClick={() => {
                            setSelectedMedicine(med);
                            setMedicineSearchQuery(med.name);
                            setShowMedicineDropdown(false);
                            setShowFullPageMedicine(true);
                            // Reset all sections to collapsed
                            setExpandedSections({});
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 
                                     border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{med.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{med.drugClass}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 dark:text-gray-400">No medicines found</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Clear Selection Button */}
              {selectedMedicine && (
                <button
                  onClick={() => {
                    setSelectedMedicine(null);
                    setMedicineSearchQuery('');
                    setExpandedSections({});
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Clear Selection
                </button>
              )}
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Treatment Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filterRemoved(scoredCauses)
                  .slice(0, 10)
                  .map((cause, index) => (
                  <motion.div
                    key={cause.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {/* Condition Name */}
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 min-h-[2.5rem]">
                      {cause.name}
                    </h3>
                    
                    {/* Treatment Information */}
                    {cause.treatment && cause.treatment.trim() ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 font-semibold text-xs">
                          <Pill className="w-3 h-3" />
                          <span>Treatment</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-md p-2 border border-green-200 dark:border-green-800">
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-tight">
                            {cause.treatment}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs italic">
                        <Info className="w-3 h-3" />
                        <span>No treatment info</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Empty State */}
              {scoredCauses.slice(0, 10).length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-gray-200 dark:bg-slate-700 p-6 rounded-full mb-4">
                    <Pill className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Conditions Available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Add symptoms or adjust your search to see suggested conditions with their treatments.
                  </p>
                </div>
              )}
              </div>
              
              {/* Medicine Details Panel */}
              {selectedMedicine && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                {/* Selected Medicine Header - Fixed */}
                <div className="sticky top-0 z-10 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <h3 className="text-xl font-bold">{selectedMedicine.name}</h3>
                  <p className="text-sm opacity-90">{selectedMedicine.drugClass}</p>
                </div>
                
                {/* Scrollable Collapsible Sections */}
                <div className="max-h-[calc(90vh-300px)] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                  
                  {/* 1. Medicine Advantage */}
                  {selectedMedicine.medicineAdvantage && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('advantage')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                          Medicine Advantage
                        </span>
                        {expandedSections['advantage'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['advantage'] && (
                        <div className="px-4 pb-4 bg-green-50 dark:bg-green-900/20">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {selectedMedicine.medicineAdvantage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 2. Medicine Disadvantage */}
                  {selectedMedicine.medicineDisadvantage && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('disadvantage')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                          Medicine Disadvantage
                        </span>
                        {expandedSections['disadvantage'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['disadvantage'] && (
                        <div className="px-4 pb-4 bg-red-50 dark:bg-red-900/20">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {selectedMedicine.medicineDisadvantage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 3. Augmenting Other Medicines */}
                  {(selectedMedicine.simplifiedStructuredAugmentingMedicines || selectedMedicine.augmentingMedicines) && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('augmenting')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <GitCompare className="w-4 h-4 text-purple-600" />
                          Augmenting Other Medicines
                        </span>
                        {expandedSections['augmenting'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['augmenting'] && (
                        <div className="px-4 pb-4 bg-purple-50 dark:bg-purple-900/20">
                          {selectedMedicine.simplifiedStructuredAugmentingMedicines ? (
                            <div className="space-y-2">
                              {selectedMedicine.simplifiedStructuredAugmentingMedicines.map((part, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <div className="whitespace-pre-line space-y-1">
                                    {part.split('\n').map((line, lineIdx) => {
                                      const trimmed = line.trim();
                                      if (trimmed.startsWith('➥')) {
                                        return <div key={lineIdx} style={{ fontSize: '13px' }} className="ml-4 text-gray-700 dark:text-gray-300">{line}</div>;
                                      }
                                      return <div key={lineIdx} style={{ fontSize: '14px' }} className="text-gray-700 dark:text-gray-300">{line}</div>;
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="whitespace-pre-line space-y-1">
                                {(selectedMedicine.augmentingMedicines as string).split('\n').map((line, index) => {
                                  const trimmed = line.trim();
                                  if (trimmed.startsWith('➥')) {
                                    return <div key={index} style={{ fontSize: '13px' }} className="ml-4 text-gray-700 dark:text-gray-300">{line}</div>;
                                  }
                                  return <div key={index} style={{ fontSize: '14px' }} className="text-gray-700 dark:text-gray-300">{line}</div>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 4. Comparison - Shows only comparison data from database (checks both field names) */}
                  {(selectedMedicine.comparisonData || (selectedMedicine as any).comparison) && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('comparison')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <GitCompare className="w-4 h-4 text-blue-600" />
                          Comparison
                        </span>
                        {expandedSections['comparison'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['comparison'] && (
                        <div className="px-4 pb-4 bg-blue-50 dark:bg-blue-900/20">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                              <GitCompare className="w-4 h-4 text-blue-600" />
                              Comparative Analysis for {selectedMedicine.name}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {selectedMedicine.comparisonData || (selectedMedicine as any).comparison}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 5. Clinical Uses */}
                  {selectedMedicine.clinicalUses && selectedMedicine.clinicalUses.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('clinicalUses')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-green-600" />
                          Clinical Uses
                        </span>
                        {expandedSections['clinicalUses'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['clinicalUses'] && (
                        <div className="px-4 pb-4 bg-green-50 dark:bg-green-900/20">
                          <ul className="space-y-2">
                            {selectedMedicine.clinicalUses.map((use, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{use}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 6. Clinical Use Details */}
                  {selectedMedicine.clinicalUseDetails && selectedMedicine.clinicalUseDetails.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('clinicalUseDetails')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          Clinical Use Details
                        </span>
                        {expandedSections['clinicalUseDetails'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['clinicalUseDetails'] && (
                        <div className="px-4 pb-4 bg-indigo-50 dark:bg-indigo-900/20">
                          <div className="space-y-3">
                            {selectedMedicine.clinicalUseDetails.map((detail, i) => (
                              <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                                  {detail.useName}
                                </h4>
                                {detail.details && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{detail.details}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 7. Adverse Effects */}
                  {selectedMedicine.adverseEffects && selectedMedicine.adverseEffects.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('adverseEffects')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          Adverse Effects
                        </span>
                        {expandedSections['adverseEffects'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['adverseEffects'] && (
                        <div className="px-4 pb-4 bg-orange-50 dark:bg-orange-900/20">
                          <ul className="space-y-2">
                            {selectedMedicine.adverseEffects.map((effect, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{effect}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 8. Contraindications */}
                  {selectedMedicine.contraindications && selectedMedicine.contraindications.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('contraindications')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-600" />
                          Contraindications
                        </span>
                        {expandedSections['contraindications'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['contraindications'] && (
                        <div className="px-4 pb-4 bg-red-50 dark:bg-red-900/20">
                          <ul className="space-y-2">
                            {selectedMedicine.contraindications.map((contra, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{contra}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 9. Primary Symptoms Matching */}
                  {selectedMedicine.symptomMatchRules?.primarySymptoms && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('primarySymptoms')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          Primary Symptoms Matching
                        </span>
                        {expandedSections['primarySymptoms'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['primarySymptoms'] && (
                        <div className="px-4 pb-4 bg-blue-50 dark:bg-blue-900/20">
                          <ul className="space-y-2">
                            {selectedMedicine.symptomMatchRules.primarySymptoms.map((symptom, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 10. Secondary Symptoms Matching */}
                  {selectedMedicine.symptomMatchRules?.secondarySymptoms && selectedMedicine.symptomMatchRules.secondarySymptoms.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('secondarySymptoms')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal-600" />
                          Secondary Symptoms Matching
                        </span>
                        {expandedSections['secondarySymptoms'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['secondarySymptoms'] && (
                        <div className="px-4 pb-4 bg-teal-50 dark:bg-teal-900/20">
                          <ul className="space-y-2">
                            {selectedMedicine.symptomMatchRules.secondarySymptoms.map((symptom, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Activity className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 11. Inappropriate Symptoms Matching */}
                  {selectedMedicine.symptomMatchRules?.inappropriateSymptoms && selectedMedicine.symptomMatchRules.inappropriateSymptoms.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('inappropriateSymptoms')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Inappropriate Symptoms Matching
                        </span>
                        {expandedSections['inappropriateSymptoms'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['inappropriateSymptoms'] && (
                        <div className="px-4 pb-4 bg-red-50 dark:bg-red-900/20">
                          <ul className="space-y-2">
                            {selectedMedicine.symptomMatchRules.inappropriateSymptoms.map((symptom, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 12. Additional Information (Mechanism + Teaching Notes) */}
                  {(selectedMedicine.mechanismOfAction || selectedMedicine.teachingNotes) && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('additionalInfo')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-600" />
                          Additional Information
                        </span>
                        {expandedSections['additionalInfo'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedSections['additionalInfo'] && (
                        <div className="px-4 pb-4 bg-indigo-50 dark:bg-indigo-900/20 space-y-3">
                          {selectedMedicine.mechanismOfAction && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-600" />
                                Mechanism of Action
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMedicine.mechanismOfAction}</p>
                            </div>
                          )}
                          {selectedMedicine.teachingNotes && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                Teaching Notes
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedMedicine.teachingNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>
            )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Showing top {Math.min(10, filterRemoved(scoredCauses).length)} of {scoredCauses.length} conditions
                  {removedCount > 0 && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      ({removedCount} hidden)
                    </span>
                  )}
                </span>
                <Button
                  onClick={() => setShowTreatmentView(false)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2"
                >
                  Close Treatment Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Full-Page Medicine Details View */}
      {showFullPageMedicine && selectedMedicine && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full h-full rounded-none shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <Pill className="w-6 h-6" />
                <div>
                  <h2 className="text-2xl font-bold">{selectedMedicine.name}</h2>
                  <p className="text-sm opacity-90">{selectedMedicine.drugClass}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowFullPageMedicine(false);
                    setSelectedMedicine(null);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  Close
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Medicine Details View */}
              <div className="max-w-6xl mx-auto p-6 space-y-4">
                  {/* 1. Medicine Advantage */}
                  {selectedMedicine.medicineAdvantage && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('advantage')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <ThumbsUp className="w-5 h-5 text-green-600" />
                          Medicine Advantage
                        </span>
                        {expandedSections['advantage'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['advantage'] && (
                        <div className="px-6 pb-6 bg-green-50 dark:bg-green-900/20 rounded-b-xl">
                          <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                            {selectedMedicine.medicineAdvantage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 2. Medicine Disadvantage */}
                  {selectedMedicine.medicineDisadvantage && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('disadvantage')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <ThumbsDown className="w-5 h-5 text-red-600" />
                          Medicine Disadvantage
                        </span>
                        {expandedSections['disadvantage'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['disadvantage'] && (
                        <div className="px-6 pb-6 bg-red-50 dark:bg-red-900/20 rounded-b-xl">
                          <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                            {selectedMedicine.medicineDisadvantage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 3. Augmenting Other Medicines */}
                  {(selectedMedicine.simplifiedStructuredAugmentingMedicines || selectedMedicine.augmentingMedicines) && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('augmenting')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <GitCompare className="w-5 h-5 text-purple-600" />
                          Augmenting Other Medicines
                        </span>
                        {expandedSections['augmenting'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['augmenting'] && (
                        <div className="px-6 pb-6 bg-purple-50 dark:bg-purple-900/20 rounded-b-xl">
                          {selectedMedicine.simplifiedStructuredAugmentingMedicines ? (
                            <div className="space-y-3">
                              {selectedMedicine.simplifiedStructuredAugmentingMedicines.map((part, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <div className="whitespace-pre-line space-y-1">
                                    {part.split('\n').map((line, lineIdx) => {
                                      const trimmed = line.trim();
                                      if (trimmed.startsWith('➥')) {
                                        return <div key={lineIdx} style={{ fontSize: '14px' }} className="ml-4 text-gray-700 dark:text-gray-300">{line}</div>;
                                      }
                                      return <div key={lineIdx} style={{ fontSize: '15px' }} className="text-gray-700 dark:text-gray-300">{line}</div>;
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="whitespace-pre-line space-y-1">
                                {(selectedMedicine.augmentingMedicines as string).split('\n').map((line, index) => {
                                  const trimmed = line.trim();
                                  if (trimmed.startsWith('➥')) {
                                    return <div key={index} style={{ fontSize: '14px' }} className="ml-4 text-gray-700 dark:text-gray-300">{line}</div>;
                                  }
                                  return <div key={index} style={{ fontSize: '15px' }} className="text-gray-700 dark:text-gray-300">{line}</div>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 4. Comparison Section - Only shows comparison data from database (checks both fields) */}
                  {(selectedMedicine.comparisonData || (selectedMedicine as any).comparison) && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('comparison')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <GitCompare className="w-5 h-5 text-blue-600" />
                          Comparison
                        </span>
                        {expandedSections['comparison'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['comparison'] && (
                        <div className="px-6 pb-6 bg-blue-50 dark:bg-blue-900/20 rounded-b-xl">
                          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                              <GitCompare className="w-5 h-5 text-blue-600" />
                              Comparative Analysis for {selectedMedicine.name}
                            </h4>
                            <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {selectedMedicine.comparisonData || (selectedMedicine as any).comparison}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 5. Clinical Uses */}
                  {selectedMedicine.clinicalUses && selectedMedicine.clinicalUses.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('clinicalUses')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <Stethoscope className="w-5 h-5 text-green-600" />
                          Clinical Uses
                        </span>
                        {expandedSections['clinicalUses'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['clinicalUses'] && (
                        <div className="px-6 pb-6 bg-green-50 dark:bg-green-900/20 rounded-b-xl">
                          <ul className="space-y-3">
                            {selectedMedicine.clinicalUses.map((use, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-base text-gray-700 dark:text-gray-300">{use}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 6. Clinical Use Details */}
                  {selectedMedicine.clinicalUseDetails && selectedMedicine.clinicalUseDetails.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('clinicalUseDetails')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          Clinical Use Details
                        </span>
                        {expandedSections['clinicalUseDetails'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['clinicalUseDetails'] && (
                        <div className="px-6 pb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-b-xl space-y-4">
                          {selectedMedicine.clinicalUseDetails.map((detail, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">
                                {detail.useName}
                              </h4>
                              {detail.details && (
                                <p className="text-base text-gray-700 dark:text-gray-300">{detail.details}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 7. Adverse Effects */}
                  {selectedMedicine.adverseEffects && selectedMedicine.adverseEffects.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('adverseEffects')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          Adverse Effects
                        </span>
                        {expandedSections['adverseEffects'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['adverseEffects'] && (
                        <div className="px-6 pb-6 bg-orange-50 dark:bg-orange-900/20 rounded-b-xl">
                          <ul className="space-y-3">
                            {selectedMedicine.adverseEffects.map((effect, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-base text-gray-700 dark:text-gray-300">{effect}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 8. Contraindications */}
                  {selectedMedicine.contraindications && selectedMedicine.contraindications.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('contraindications')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <Ban className="w-5 h-5 text-red-600" />
                          Contraindications
                        </span>
                        {expandedSections['contraindications'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['contraindications'] && (
                        <div className="px-6 pb-6 bg-red-50 dark:bg-red-900/20 rounded-b-xl">
                          <ul className="space-y-3">
                            {selectedMedicine.contraindications.map((contra, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-base text-gray-700 dark:text-gray-300">{contra}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 9-11. Symptoms Matching Sections */}
                  {selectedMedicine.symptomMatchRules && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Primary Symptoms */}
                        {selectedMedicine.symptomMatchRules.primarySymptoms && (
                          <>
                            <button
                              onClick={() => toggleSection('primarySymptoms')}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <Target className="w-5 h-5 text-blue-600" />
                                Primary Symptoms Matching
                              </span>
                              {expandedSections['primarySymptoms'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                            </button>
                            {expandedSections['primarySymptoms'] && (
                              <div className="px-6 pb-6 bg-blue-50 dark:bg-blue-900/20">
                                <ul className="space-y-3">
                                  {selectedMedicine.symptomMatchRules.primarySymptoms.map((symptom, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-base text-gray-700 dark:text-gray-300">{symptom}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Secondary Symptoms */}
                        {selectedMedicine.symptomMatchRules.secondarySymptoms && selectedMedicine.symptomMatchRules.secondarySymptoms.length > 0 && (
                          <>
                            <button
                              onClick={() => toggleSection('secondarySymptoms')}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <Activity className="w-5 h-5 text-teal-600" />
                                Secondary Symptoms Matching
                              </span>
                              {expandedSections['secondarySymptoms'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                            </button>
                            {expandedSections['secondarySymptoms'] && (
                              <div className="px-6 pb-6 bg-teal-50 dark:bg-teal-900/20">
                                <ul className="space-y-3">
                                  {selectedMedicine.symptomMatchRules.secondarySymptoms.map((symptom, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                      <Activity className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-base text-gray-700 dark:text-gray-300">{symptom}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Inappropriate Symptoms */}
                        {selectedMedicine.symptomMatchRules.inappropriateSymptoms && selectedMedicine.symptomMatchRules.inappropriateSymptoms.length > 0 && (
                          <>
                            <button
                              onClick={() => toggleSection('inappropriateSymptoms')}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-b-xl"
                            >
                              <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-600" />
                                Inappropriate Symptoms Matching
                              </span>
                              {expandedSections['inappropriateSymptoms'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                            </button>
                            {expandedSections['inappropriateSymptoms'] && (
                              <div className="px-6 pb-6 bg-red-50 dark:bg-red-900/20 rounded-b-xl">
                                <ul className="space-y-3">
                                  {selectedMedicine.symptomMatchRules.inappropriateSymptoms.map((symptom, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-base text-gray-700 dark:text-gray-300">{symptom}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 12. Additional Information */}
                  {(selectedMedicine.mechanismOfAction || selectedMedicine.teachingNotes) && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => toggleSection('additionalInfo')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                      >
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <Info className="w-5 h-5 text-indigo-600" />
                          Additional Information
                        </span>
                        {expandedSections['additionalInfo'] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                      {expandedSections['additionalInfo'] && (
                        <div className="px-6 pb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-b-xl space-y-4">
                          {selectedMedicine.mechanismOfAction && (
                            <div>
                              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-600" />
                                Mechanism of Action
                              </h4>
                              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{selectedMedicine.mechanismOfAction}</p>
                            </div>
                          )}
                          {selectedMedicine.teachingNotes && (
                            <div>
                              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                Teaching Notes
                              </h4>
                              <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{selectedMedicine.teachingNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cause Edit Modal */}
      <CauseEditModal
        isOpen={isEditModalOpen}
        cause={editingCause}
        causes={causes}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCause(null);
        }}
        onSave={handleSaveEditedCause}
      />
      
      {/* Symptom Meaning Popup - Shows on click of info icon */}
      {symptomMeaningPopup && (
        <>
          {/* Backdrop to close popup when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setSymptomMeaningPopup(null)}
            aria-hidden="true"
          />
          {/* Popup card - positioned above the clicked icon */}
          <div
            className="fixed z-50 bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-2xl p-4 max-w-sm animate-in fade-in zoom-in duration-200"
            style={{
              left: `${symptomMeaningPopup.position.x}px`,
              top: `${symptomMeaningPopup.position.y - 10}px`,
              transform: 'translate(-50%, -100%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSymptomMeaningPopup(null);
              }}
              title="Close"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            {/* Symptom name header */}
            <div className="flex items-center gap-2 mb-2 pr-6">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h4 className="font-bold text-sm text-blue-700 dark:text-blue-300">
                {symptomMeaningPopup.symptom}
              </h4>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-slate-700 mb-2" />
            
            {/* Meaning text */}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {symptomMeaningPopup.meaning}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
export default memo(SuggestionList);
