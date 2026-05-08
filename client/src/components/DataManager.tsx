import { useState } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Trash, 
  Plus, 
  Database, 
  Edit2, 
  Trash2, 
  AlertCircle,
  FileText,
  Star,
  FileOutput,
  X
} from 'lucide-react';
import { Cause } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { processImport } from '@/utils/import-processor';
import { ImportValidationDialog } from '@/components/ImportValidationDialog';
import { CauseEditModal } from '@/components/CauseEditModal';
import DefiningSymptomsEditor from '@/components/DefiningSymptomsEditor';
import { DefiningSymptomsManager } from '@/utils/defining-symptoms-manager';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DataManagerProps {
  causes: Cause[];
  onImport: (json: string, strategy?: 'merge' | 'replace') => boolean;
  onReset: () => void;
  onLoadYourConditions?: (json: string) => boolean; // New prop for loading your conditions
  onAddCause: (cause: Omit<Cause, 'id'>) => void;
  onDeleteCause: (id: string) => void;
  onEditCause: (cause: Cause) => void;
  onUpdateCauses: (causes: Cause[]) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function DataManager({ causes, onImport, onReset, onLoadYourConditions, onAddCause, onDeleteCause, onEditCause, onUpdateCauses, canUndo, onUndo }: DataManagerProps) {
  const { toast } = useToast();
  const { canEdit } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [editingCause, setEditingCause] = useState<Cause | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isFileUpload, setIsFileUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [rawImportData, setRawImportData] = useState<any[]>([]);

  const [newCause, setNewCause] = useState<{name: string, symptoms: string, treatment: string, prevalence: 'high' | 'moderate' | 'low'}>({
    name: "",
    symptoms: "",
    treatment: "",
    prevalence: "moderate"
  });
  
  const [exportFormat, setExportFormat] = useState<"json" | "text">("json");
  const [showExportDialog, setShowExportDialog] = useState(false);

  // No auto-updates - preserve conditions exactly as they are

  const handleExport = () => {
    try {
      if (exportFormat === "text") {
        // Export all conditions as a single formatted text file
        const content = causes.map((cause, index) => {
          const dateStr = cause.lastEditTime 
            ? new Date(cause.lastEditTime).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Date not available';
          
          const symptomsStr = Array.isArray(cause.symptoms) 
            ? cause.symptoms.map((s: any) => typeof s === 'string' ? s : s.typicalSymptom).join(', ')
            : cause.symptoms || 'None';
          
          return `═══════════════════════════════════════════════════════════
CONDITION #${index + 1}: ${cause.name}
═══════════════════════════════════════════════════════════

Last Edited: ${dateStr}
Safety Critical: ${cause.safetyCritical ? 'Yes' : 'No'}
Base Rate: ${cause.baseRate}%

───────────────────────────────────────────────────────────
SYMPTOMS:
───────────────────────────────────────────────────────────

${symptomsStr}

───────────────────────────────────────────────────────────
TREATMENT:
───────────────────────────────────────────────────────────

${cause.treatment || 'Not specified'}

═══════════════════════════════════════════════════════════
`;
        }).join('\n\n');

        const header = `CONDITION DATABASE EXPORT
Generated: ${new Date().toLocaleString()}
Total Conditions: ${causes.length}

`;

        const blob = new Blob([header + content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `condition-database-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `${causes.length} conditions exported as text file.`
        });
      } else {
        // Export as JSON
        const dataStr = JSON.stringify(causes, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `symptom-tracker-export-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast({ title: "Export Successful", description: `${causes.length} conditions exported as JSON file.` });
      }
      
      setShowExportDialog(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(importText);
      
      // Check if it's an array
      if (!Array.isArray(parsed)) {
        toast({ 
          title: "Import Failed", 
          description: "JSON must be an array of conditions.",
          variant: "destructive" 
        });
        return;
      }

      // Show validation dialog with raw data
      setRawImportData(parsed);
      setShowValidationDialog(true);
      
    } catch (error) {
      toast({ 
        title: "Import Failed", 
        description: "Invalid JSON format.",
        variant: "destructive" 
      });
    }
  };

  const handleConfirmImport = (processedData: Cause[], strategy: 'merge' | 'replace') => {
    // CRITICAL: Preserve lastEditTime exactly as stored - NEVER auto-generate or modify
    const processedWithMetadata = processedData.map(cause => {
      const causeWithPreservedTime = {
        ...cause,
        // Preserve lastEditTime EXACTLY - if missing, leave undefined (DO NOT create new one)
        lastEditTime: cause.lastEditTime
      };
      
      // Ensure defining symptoms field exists (empty array is fine)
      if (!causeWithPreservedTime.definingSymptoms) {
        causeWithPreservedTime.definingSymptoms = [];
      }
      
      return causeWithPreservedTime;
    });
    
    const processedJson = JSON.stringify(processedWithMetadata);
    if (onImport(processedJson, strategy)) {
      setIsImportOpen(false);
      setImportText("");
      setImportStrategy('merge');
      setShowValidationDialog(false);
      
      toast({ 
        title: "Import Successful", 
        description: `Successfully imported ${processedWithMetadata.length} conditions with original edit timestamps preserved.`
      });
    }
  };

  const handleImportStrategyChange = (strategy: 'merge' | 'replace') => {
    setImportStrategy(strategy);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const symptomsList = newCause.symptoms.split(',').map(s => s.trim()).filter(Boolean);
      
      if (!newCause.name) throw new Error("Name is required");
      if (symptomsList.length === 0) throw new Error("At least one symptom is required");

      onAddCause({
        name: newCause.name,
        symptoms: symptomsList,
        definingSymptoms: [],
        pathognomonicSymptoms: [],
        treatment: newCause.treatment,
        lastEditTime: new Date().toISOString(), // Set timestamp on manual creation
        safetyCritical: false,
        baseRate: 50,
        prevalence: newCause.prevalence,
        labTests: [],
        ageRule: { min: 0, max: 150, ruleType: 'soft' },
        sexRule: 'both',
        durationRule: { start: 1, end: 30, unit: 'days', ruleType: 'soft' }
      });

      setIsAddOpen(false);
      setNewCause({ name: "", symptoms: "", treatment: "", prevalence: "moderate" });
    } catch (err: any) {
      toast({ title: "Validation Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <Database className="w-4 h-4" />
            Manage Database ({causes.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-white/30 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-t-xl">
            <DialogTitle className="flex items-center justify-between text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <div className="flex items-center gap-3">
                <span>Condition Database</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <span className="mr-1">✓</span> All Edits Permanent
                </span>
              </div>
              {canEdit() && (
                <Button size="sm" onClick={() => {
                  setIsDatabaseOpen(false);
                  setIsAddOpen(true);
                }} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  <Plus className="w-4 h-4" /> Add New
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden mt-4">
            <ScrollArea className="h-full border rounded-md">
              <div className="p-4 space-y-3">
                {/* Search Input */}
                <div className="mb-3">
                  <Input
                    placeholder="Search conditions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                {causes.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                    <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Database is empty.</p>
                  </div>
                ) : (
                  (() => {
                    const filteredAndSorted = causes
                      .filter(cause => 
                        searchQuery === '' || 
                        cause.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cause.symptoms.some(symptom => {
                          // Handle both legacy string format and new object format
                          const symptomText = typeof symptom === 'string' 
                            ? symptom 
                            : symptom.typicalSymptom;
                          return symptomText.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                      )
                      // Sort by lastEditTime (newest first), conditions without lastEditTime always at end
                      .sort((a, b) => {
                        // CRITICAL: Conditions WITH lastEditTime sorted by most recent first
                        // Conditions WITHOUT lastEditTime always go to end of list
                        const hasA = !!a.lastEditTime;
                        const hasB = !!b.lastEditTime;
                        
                        // If both have lastEditTime, sort by date (newest first)
                        if (hasA && hasB) {
                          const dateA = new Date(a.lastEditTime!).getTime();
                          const dateB = new Date(b.lastEditTime!).getTime();
                          return dateB - dateA;
                        }
                        
                        // If only one has lastEditTime, that one comes first
                        if (hasA && !hasB) return -1;
                        if (!hasA && hasB) return 1;
                        
                        // If neither has lastEditTime, maintain original order (stable sort)
                        return 0;
                      });
                    
                    return filteredAndSorted;
                  })()
                    .map(cause => (
                      <div key={cause.id} className="p-4 rounded-xl border border-white/30 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-slate-800/80 dark:to-slate-900/80 shadow-sm hover:shadow-md transition-all duration-200 group hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10 transform hover:-translate-y-0.5">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-9">
                            <h4 className="font-bold text-lg truncate bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{cause.name}</h4>
                          </div>
                          <div className="col-span-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit() && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary bg-white/50 hover:bg-blue-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105" onClick={() => {
                                  setEditingCause(cause);
                                  setIsEditModalOpen(true);
                                }}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive bg-white/50 hover:bg-red-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105" onClick={() => {
                                  if(confirm(`Delete ${cause.name}?`)) onDeleteCause(cause.id);
                                }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="pt-4 border-t border-white/20 bg-gradient-to-r from-gray-50/30 to-gray-100/30 dark:from-slate-800/30 dark:to-slate-900/30 flex justify-between items-center mt-4 p-4 rounded-b-xl">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-2 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
                <Upload className="w-4 h-4" /> Import
              </Button>
              {onLoadYourConditions && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    const conditionsJson = prompt("Paste your 124 conditions JSON here:");
                    if (conditionsJson) {
                      onLoadYourConditions(conditionsJson);
                    }
                  }} 
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Database className="w-4 h-4" /> Load Your Conditions
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              if(confirm("Reset all conditions to defaults?")) onReset();
            }} className="text-muted-foreground hover:text-destructive bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
              Reset to Defaults
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-white/30 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-t-xl">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Add New Condition
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Condition Name</Label>
              <Input 
                id="name" 
                value={newCause.name}
                onChange={e => setNewCause({...newCause, name: e.target.value})}
                placeholder="e.g. Strep Throat"
              />
            </div>
            
            {/* Disease Prevalence Field */}
            <div className="space-y-2">
              <Label htmlFor="prevalence">Disease Prevalence</Label>
              <Select
                value={newCause.prevalence}
                onValueChange={(value: 'high' | 'moderate' | 'low') => setNewCause({...newCause, prevalence: value})}
              >
                <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200">
                  <SelectValue placeholder="Select prevalence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Prevalence (+5% match likelihood)</SelectItem>
                  <SelectItem value="moderate">Moderate Prevalence (+3% match likelihood)</SelectItem>
                  <SelectItem value="low">Low Prevalence (no adjustment)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher prevalence conditions receive a scoring boost in differential diagnosis ranking
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms (comma separated)</Label>
              <Textarea 
                id="symptoms" 
                value={newCause.symptoms}
                onChange={e => setNewCause({...newCause, symptoms: e.target.value})}
                placeholder="fever, sore throat, swollen lymph nodes..."
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Textarea 
                id="treatment" 
                value={newCause.treatment}
                onChange={e => setNewCause({...newCause, treatment: e.target.value})}
                placeholder="Recommended treatment, medications, or lifestyle changes..."
                className="h-20"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddOpen(false);
                setIsDatabaseOpen(true);
              }}>Cancel</Button>
              <Button type="submit">Save Condition</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-6 w-px bg-border mx-2 hidden" />

      <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} title="Undo" className="hidden">
        <RotateCcw className="w-4 h-4" />
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-white/30 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="bg-gradient-to-r from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30 p-4 rounded-t-xl">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              <Upload className="w-5 h-5" />
              Import Conditions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={importStrategy === 'merge' ? 'default' : 'outline'}
                onClick={() => setImportStrategy('merge')}
                className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
              >
                Merge with Existing
              </Button>
              <Button 
                variant={importStrategy === 'replace' ? 'default' : 'outline'}
                onClick={() => setImportStrategy('replace')}
                className="flex-1 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
              >
                Replace All
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/10">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Import Method</span>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  variant={!isFileUpload ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsFileUpload(false)}
                  className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  Paste JSON
                </Button>
                <Button 
                  variant={isFileUpload ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsFileUpload(true)}
                  className="flex-1 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  Upload File
                </Button>
              </div>
              
              {isFileUpload ? (
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload JSON file:</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          setImportText(content);
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    The system will auto-correct field names and structures
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="import-text">Paste JSON data:</Label>
                  <Textarea
                    id="import-text"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='[{"name": "Condition Name", "symptoms": ["symptom1", "symptom2"], ...}]'
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The system will auto-map fields like ageRange → AgeRule, gender → Sex, etc.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="bg-gradient-to-r from-gray-50/30 to-gray-100/30 dark:from-slate-800/30 dark:to-slate-900/30 p-4 rounded-b-xl">
            <Button variant="outline" onClick={() => setIsImportOpen(false)} className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 dark:from-gray-800/30 dark:to-gray-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
              Cancel
            </Button>
            <Button 
              onClick={handleImportSubmit} 
              disabled={!importText.trim()}
              className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              Import Conditions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportValidationDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        rawData={rawImportData}
        onConfirmImport={handleConfirmImport}
      />
      
      <CauseEditModal
        cause={editingCause}
        causes={causes}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCause(null);
        }}
        onSave={(id, updates) => {
          onEditCause({ ...editingCause!, ...updates });
          setIsEditModalOpen(false);
          setEditingCause(null);
          toast({ title: "Condition Updated", description: "Changes saved successfully." });
        }}
      />

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Export Conditions</span>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowExportDialog(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Export Format
                  </Label>
                  <div className="space-y-2">
                    <Button
                      variant={exportFormat === "json" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setExportFormat("json")}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      JSON File Format
                    </Button>
                    <Button
                      variant={exportFormat === "text" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setExportFormat("text")}
                    >
                      <FileOutput className="w-4 h-4 mr-2" />
                      Plain Text (.txt) - Readable Format
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {exportFormat === "json" 
                      ? "Exports all conditions in JSON format. Ideal for backup, import to other systems, or programmatic access."
                      : "Exports all conditions in a beautifully formatted text file. Easy to read, print, and share with colleagues."
                    }
                  </p>
                </div>

                <Button 
                  onClick={handleExport}
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export {causes.length} Conditions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
