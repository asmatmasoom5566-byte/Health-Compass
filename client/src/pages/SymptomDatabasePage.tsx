import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Search, 
  Database,
  Info,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Cause, Medicine } from '@shared/schema';
import { useAuth } from '../contexts/AuthContext';

interface SymptomEntry {
  id: string;
  name: string;
  meaning?: string; // Symptom meaning/description
  usedInConditions: number;
  usedInPharmacology: number;
}

const SYMPTOM_MEANINGS_STORAGE_KEY = 'symptom_meanings_v1';

const SymptomDatabasePage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin']); // Only admin can edit
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSymptom, setEditingSymptom] = useState<SymptomEntry | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedMeaning, setEditedMeaning] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);

  // Load symptom meanings from centralized storage
  const loadSymptomMeanings = (): Map<string, string> => {
    try {
      const data = localStorage.getItem(SYMPTOM_MEANINGS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return new Map(Object.entries(parsed) as [string, string][]);
      }
    } catch (error) {
      console.error('Failed to load symptom meanings:', error);
    }
    return new Map();
  };

  // Save symptom meanings to centralized storage
  const saveSymptomMeanings = (meanings: Map<string, string>) => {
    try {
      const obj = Object.fromEntries(meanings);
      localStorage.setItem(SYMPTOM_MEANINGS_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save symptom meanings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save symptom meanings',
        variant: 'destructive'
      });
    }
  };

  // Load symptoms from conditions and pharmacology
  useEffect(() => {
    loadSymptoms();
    
    // Listen for storage changes from other tabs/windows or same-window updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'symptom_tracker_v1' || e.key === 'pharmacology_v1') {
        console.log('Storage changed, reloading symptoms...');
        loadSymptoms();
      }
    };
    
    // Also listen for custom events triggered by same-window updates
    const handleCustomUpdate = () => {
      console.log('Custom update event received, reloading symptoms...');
      loadSymptoms();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('symptomDatabaseUpdate', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('symptomDatabaseUpdate', handleCustomUpdate);
    };
  }, []);

  const loadSymptoms = () => {
    try {
      // Load conditions
      const conditionsData = localStorage.getItem('symptom_tracker_v1');
      const conditions: Cause[] = conditionsData ? JSON.parse(conditionsData).causes : [];

      // Load pharmacology (for propagation tracking, not for display)
      const pharmaData = localStorage.getItem('pharmacology_v1');
      const pharmacology: Medicine[] = pharmaData ? JSON.parse(pharmaData).medicines : [];

      // Load symptom meanings from centralized storage
      const symptomMeanings = loadSymptomMeanings();

      // Extract ONLY Supportive Features, Key Features, and Important Features from conditions
      // IMPORTANT: Exclusion Features and Risk Factors are EXPLICITLY EXCLUDED from the symptom database
      // 
      // INCLUDED CATEGORIES:
      // - Supportive Features (condition.symptoms) - typical symptoms
      // - Key Features (condition.pathognomonicSymptoms) - pathognomonic symptoms
      // - Important Features (condition.cardinalSymptoms) - cardinal symptoms
      //
      // EXCLUDED CATEGORIES:
      // - Exclusion Features (condition.exclusionFeatures)
      // - Risk Factors (condition.riskFactors)
      const symptomMap = new Map<string, { originalName: string, conditions: Set<string>, pharmacology: Set<string> }>();

      // Process conditions - extract ONLY Supportive, Key, and Important Features
      conditions.forEach(condition => {
        // 1. Supportive Features (typical symptoms) - INCLUDED
        if (condition.symptoms) {
          condition.symptoms.forEach(symptomObj => {
            if (typeof symptomObj === 'string') {
              const symptomName = symptomObj.trim();
              const symptomKey = symptomName.toLowerCase();
              if (!symptomMap.has(symptomKey)) {
                symptomMap.set(symptomKey, { originalName: symptomName, conditions: new Set(), pharmacology: new Set() });
              }
              symptomMap.get(symptomKey)!.conditions.add(condition.name);
            } else if (typeof symptomObj === 'object' && symptomObj.typicalSymptom) {
              const symptomName = symptomObj.typicalSymptom.trim();
              const symptomKey = symptomName.toLowerCase();
              if (!symptomMap.has(symptomKey)) {
                symptomMap.set(symptomKey, { originalName: symptomName, conditions: new Set(), pharmacology: new Set() });
              }
              symptomMap.get(symptomKey)!.conditions.add(condition.name);
            }
          });
        }

        // 2. Key Features (pathognomonic symptoms) - INCLUDED
        if (condition.pathognomonicSymptoms) {
          condition.pathognomonicSymptoms.forEach(symptom => {
            const symptomName = symptom.trim();
            const symptomKey = symptomName.toLowerCase();
            if (!symptomMap.has(symptomKey)) {
              symptomMap.set(symptomKey, { originalName: symptomName, conditions: new Set(), pharmacology: new Set() });
            }
            symptomMap.get(symptomKey)!.conditions.add(condition.name);
          });
        }

        // 3. Important Features (cardinal symptoms) - INCLUDED
        if (condition.cardinalSymptoms) {
          condition.cardinalSymptoms.forEach(symptom => {
            const symptomName = symptom.trim();
            const symptomKey = symptomName.toLowerCase();
            if (!symptomMap.has(symptomKey)) {
              symptomMap.set(symptomKey, { originalName: symptomName, conditions: new Set(), pharmacology: new Set() });
            }
            symptomMap.get(symptomKey)!.conditions.add(condition.name);
          });
        }

        // NOTE: Exclusion Features (condition.exclusionFeatures) are EXPLICITLY EXCLUDED
        // NOTE: Risk Factors (condition.riskFactors) are EXPLICITLY EXCLUDED
      });

      // Track pharmacology usage for information purposes only (don't add pharmacology-only symptoms)
      pharmacology.forEach(med => {
        if (med.symptomMatchRules) {
          const allSymptoms = [
            ...(med.symptomMatchRules.primarySymptoms || []),
            ...(med.symptomMatchRules.secondarySymptoms || []),
            ...(med.symptomMatchRules.inappropriateSymptoms || [])
          ];

          allSymptoms.forEach(symptom => {
            const symptomKey = symptom.toLowerCase().trim();
            // Only track if symptom already exists from conditions
            if (symptomMap.has(symptomKey)) {
              symptomMap.get(symptomKey)!.pharmacology.add(med.name);
            }
          });
        }
      });

      // Convert to array - use originalName to preserve casing
      // NOTE: The symptomMap contains ONLY:
      // - Supportive Features (from condition.symptoms)
      // - Key Features (from condition.pathognomonicSymptoms)
      // - Important Features (from condition.cardinalSymptoms)
      //
      // EXCLUDED: exclusionFeatures and riskFactors are NEVER added to the map
      const symptomArray: SymptomEntry[] = Array.from(symptomMap.entries()).map(([key, data]) => ({
        id: `symptom_${key.replace(/\s+/g, '_')}`,
        name: data.originalName,
        meaning: symptomMeanings.get(key) || '', // Load meaning from centralized storage
        usedInConditions: data.conditions.size,
        usedInPharmacology: data.pharmacology.size
      }));

      // Sort alphabetically
      symptomArray.sort((a, b) => a.name.localeCompare(b.name));

      setSymptoms(symptomArray);
      setLastLoaded(new Date());
    } catch (error) {
      console.error('Failed to load symptoms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load symptom database',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (symptom: SymptomEntry) => {
    setEditingSymptom(symptom);
    setEditedName(symptom.name);
    setEditedMeaning(symptom.meaning || '');
  };

  const handleSave = async () => {
    if (!editingSymptom || !editedName.trim()) return;

    setIsSaving(true);

    try {
      const oldName = editingSymptom.name.toLowerCase().trim();
      const oldNameOriginal = editingSymptom.name; // Preserve original casing
      const newName = editedName.trim(); // Keep user's casing
      const newNameLower = newName.toLowerCase(); // For comparison

      // Load all data
      const conditionsData = localStorage.getItem('symptom_tracker_v1');
      const conditions: Cause[] = conditionsData ? JSON.parse(conditionsData).causes : [];

      const pharmaData = localStorage.getItem('pharmacology_v1');
      const pharmacology = pharmaData ? JSON.parse(pharmaData).medicines : [];

      let conditionsUpdated = false;
      let pharmaUpdated = false;

      // Update conditions
      if (oldName !== newNameLower) {
        conditions.forEach(condition => {
          let conditionChanged = false;

          // Update typical symptoms
          if (condition.symptoms) {
            condition.symptoms = condition.symptoms.map(symptomObj => {
              if (typeof symptomObj === 'string' && symptomObj.toLowerCase().trim() === oldName) {
                conditionChanged = true;
                return newName;
              } else if (typeof symptomObj === 'object' && symptomObj.typicalSymptom.toLowerCase().trim() === oldName) {
                conditionChanged = true;
                return { ...symptomObj, typicalSymptom: newName };
              }
              return symptomObj;
            });
          }

          // Update pathognomonic symptoms (Key Features)
          if (condition.pathognomonicSymptoms) {
            condition.pathognomonicSymptoms = condition.pathognomonicSymptoms.map((s: string) => {
              if (s.toLowerCase().trim() === oldName) {
                conditionChanged = true;
                return newName;
              }
              return s;
            });
          }

          // Update cardinal symptoms (Important Features)
          if (condition.cardinalSymptoms) {
            condition.cardinalSymptoms = condition.cardinalSymptoms.map((s: string) => {
              if (s.toLowerCase().trim() === oldName) {
                conditionChanged = true;
                return newName;
              }
              return s;
            });
          }

          // Update symptom details (rename key)
          if (condition.symptomDetails && condition.symptomDetails[oldName]) {
            condition.symptomDetails[newName] = condition.symptomDetails[oldName];
            delete condition.symptomDetails[oldName];
            conditionChanged = true;
          }

          if (conditionChanged) {
            conditionsUpdated = true;
          }
        });
      }

      // Update pharmacology
      if (oldName !== newNameLower) {
        pharmacology.forEach((med: any) => {
          let medChanged = false;

          if (med.symptomMatchRules) {
            // Update primary symptoms
            if (med.symptomMatchRules.primarySymptoms) {
              med.symptomMatchRules.primarySymptoms = med.symptomMatchRules.primarySymptoms.map((s: string) => {
                if (s.toLowerCase().trim() === oldName) {
                  medChanged = true;
                  return newName;
                }
                return s;
              });
            }

            // Update secondary symptoms
            if (med.symptomMatchRules.secondarySymptoms) {
              med.symptomMatchRules.secondarySymptoms = med.symptomMatchRules.secondarySymptoms.map((s: string) => {
                if (s.toLowerCase().trim() === oldName) {
                  medChanged = true;
                  return newName;
                }
                return s;
              });
            }

            // Update inappropriate symptoms
            if (med.symptomMatchRules.inappropriateSymptoms) {
              med.symptomMatchRules.inappropriateSymptoms = med.symptomMatchRules.inappropriateSymptoms.map((s: string) => {
                if (s.toLowerCase().trim() === oldName) {
                  medChanged = true;
                  return newName;
                }
                return s;
              });
            }
          }

          if (medChanged) {
            pharmaUpdated = true;
          }
        });
      }

      // Save updated data
      if (conditionsUpdated) {
        const updatedConditionsData = JSON.parse(conditionsData || '{}');
        updatedConditionsData.causes = conditions;
        localStorage.setItem('symptom_tracker_v1', JSON.stringify(updatedConditionsData));
      }

      if (pharmaUpdated) {
        localStorage.setItem('pharmacology_v1', JSON.stringify({
          medicines: pharmacology,
          lastUpdated: new Date().toISOString()
        }));
      }

      // Save symptom meaning to centralized storage (always save, even if empty)
      const symptomMeanings = loadSymptomMeanings();
      if (editedMeaning.trim()) {
        symptomMeanings.set(newNameLower, editedMeaning.trim());
      } else {
        symptomMeanings.delete(newNameLower); // Remove if empty
      }
      saveSymptomMeanings(symptomMeanings);

      // Reload symptoms to reflect changes
      loadSymptoms();
      
      // Trigger custom event to notify other components
      window.dispatchEvent(new Event('symptomDatabaseUpdate'));

      setEditingSymptom(null);
      setIsSaving(false);

      toast({
        title: 'Success',
        description: `Symptom "${editedName}" updated successfully.${conditionsUpdated ? ` Updated in ${conditions.filter((c: Cause) => 
          c.symptoms?.some((s: any) => typeof s === 'string' ? s.toLowerCase().trim() === newNameLower : s.typicalSymptom?.toLowerCase().trim() === newNameLower) ||
          c.pathognomonicSymptoms?.some((s: string) => s.toLowerCase().trim() === newNameLower) ||
          c.cardinalSymptoms?.some((s: string) => s.toLowerCase().trim() === newNameLower)
        ).length} conditions` : ''}${pharmaUpdated ? ` Also updated in ${pharmacology.filter((m: any) => 
          m.symptomMatchRules?.primarySymptoms?.some((s: string) => s.toLowerCase().trim() === newNameLower) ||
          m.symptomMatchRules?.secondarySymptoms?.some((s: string) => s.toLowerCase().trim() === newNameLower) ||
          m.symptomMatchRules?.inappropriateSymptoms?.some((s: string) => s.toLowerCase().trim() === newNameLower)
        ).length} medicines` : ''}`,
      });

    } catch (error) {
      console.error('Failed to update symptom:', error);
      setIsSaving(false);
      toast({
        title: 'Error',
        description: 'Failed to update symptom',
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSymptoms();
    toast({
      title: 'Database Refreshed',
      description: 'Symptom database has been updated with the latest condition data',
    });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredSymptoms = symptoms.filter(symptom =>
    symptom.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export symptoms to plain text file
  const handleExportToTxt = () => {
    setIsExporting(true);
    
    try {
      // Determine which symptoms to export (filtered or all)
      const symptomsToExport = searchTerm ? filteredSymptoms : symptoms;
      
      if (symptomsToExport.length === 0) {
        toast({
          title: 'No Data',
          description: 'No symptoms available to export',
          variant: 'destructive'
        });
        setIsExporting(false);
        return;
      }

      // Generate plain text content - symptom names only, one per line
      // Preserve original casing from the database
      //
      // EXPORT INCLUDES ONLY:
      // - Supportive Features (condition.symptoms)
      // - Key Features (condition.pathognomonicSymptoms)
      // - Important Features (condition.cardinalSymptoms)
      //
      // EXPLICITLY EXCLUDED:
      // - Exclusion Features (condition.exclusionFeatures)
      // - Risk Factors (condition.riskFactors)
      let content = '';
      
      symptomsToExport.forEach((symptom, index) => {
        content += symptom.name;
        if (index < symptomsToExport.length - 1) {
          content += '\n';
        }
      });

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = searchTerm 
        ? `symptoms_filtered_${timestamp}.txt`
        : `symptom_database_${timestamp}.txt`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${symptomsToExport.length} symptoms to ${filename}`,
      });
    } catch (error) {
      console.error('Failed to export symptoms:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting symptoms',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Diagnosis
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Symptom Database Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {symptoms.length} Symptoms
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
              title="Refresh database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToTxt}
              disabled={isExporting || symptoms.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <CheckCircle className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export to TXT
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage symptom names and definitions across all conditions and pharmacology
          {lastLoaded && (
            <span className="ml-2 text-xs">
              (Last updated: {lastLoaded.toLocaleTimeString()})
            </span>
          )}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Symptoms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              placeholder="Search by symptom name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            {searchTerm && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredSymptoms.length} of {symptoms.length} symptoms. 
                Click "Export to TXT" to download the filtered results.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredSymptoms.map(symptom => (
          <Card key={symptom.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{symptom.name}</h3>
                    {symptom.meaning && (
                      <div className="group relative">
                        <Info className="w-4 h-4 text-blue-500 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-lg z-10">
                          <p className="text-xs text-gray-700 dark:text-gray-300">{symptom.meaning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {symptom.meaning && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {symptom.meaning}
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Used in {symptom.usedInConditions} condition{symptom.usedInConditions !== 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground">
                      Used in {symptom.usedInPharmacology} medicine{symptom.usedInPharmacology !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(symptom)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSymptoms.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No symptoms found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try a different search term' : 'No symptoms in database'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSymptom} onOpenChange={() => setEditingSymptom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Symptom</DialogTitle>
            <DialogDescription>
              Update the symptom name. Changes will be propagated to all conditions and pharmacology entries.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Symptom Name</label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter symptom name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meaning / Description</label>
              <Textarea
                value={editedMeaning}
                onChange={(e) => setEditedMeaning(e.target.value)}
                placeholder="Enter symptom meaning or description (optional)"
                className="h-24 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This meaning will be stored centrally and displayed wherever this symptom appears
              </p>
            </div>

            {editingSymptom && (editingSymptom.usedInConditions > 0 || editingSymptom.usedInPharmacology > 0) && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        This symptom will be updated in:
                      </p>
                      {editingSymptom.usedInConditions > 0 && (
                        <p className="text-blue-700 dark:text-blue-300">
                          • {editingSymptom.usedInConditions} condition{editingSymptom.usedInConditions !== 1 ? 's' : ''}
                        </p>
                      )}
                      {editingSymptom.usedInPharmacology > 0 && (
                        <p className="text-blue-700 dark:text-blue-300">
                          • {editingSymptom.usedInPharmacology} medicine{editingSymptom.usedInPharmacology !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSymptom(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !editedName.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <CheckCircle className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SymptomDatabasePage;
