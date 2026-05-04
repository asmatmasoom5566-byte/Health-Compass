import { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Plus, 
  Database, 
  Edit2, 
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Info,
  BookOpen,
  Lightbulb,
  BarChart3,
  FileOutput,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Medicine } from '@shared/schema';
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
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePharmacology } from '@/hooks/use-pharmacology';
import { MedicineEditModal } from '@/components/MedicineEditModal';
import { DrugClassComparison } from '@/components/DrugClassComparison';

interface PharmacologyDataManagerProps {
  onMedicineSelect?: (medicine: Medicine) => void;
}

export function PharmacologyDataManager({ onMedicineSelect }: PharmacologyDataManagerProps) {
  const { toast } = useToast();
  const { 
    medicines, 
    searchMedicines, 
    importMedicines, 
    exportMedicines, 
    deleteMedicine,
    debugLocalStorage,
    refreshMedicines
  } = usePharmacology();
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrugClass, setSelectedDrugClass] = useState<string>("");
  const [showDrugClassComparison, setShowDrugClassComparison] = useState(false);
  const [comparisonDrugClass, setComparisonDrugClass] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"json" | "text">("json");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importValidationResult, setImportValidationResult] = useState<{
    valid: boolean;
    medicineCount?: number;
    errors?: string[];
    warnings?: string[];
  } | null>(null);

  const handleExport = () => {
    try {
      if (exportFormat === "text") {
        // Export all medicines as a single formatted text file
        const content = medicines.map((medicine, index) => {
          const dateStr = medicine.updatedAt || medicine.createdAt || 'Date not available';
          const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          const primarySymptomsStr = medicine.symptomMatchRules.primarySymptoms.join(', ');
          
          return `═══════════════════════════════════════════════════════════
MEDICINE #${index + 1}: ${medicine.name}
═══════════════════════════════════════════════════════════

Drug Class: ${medicine.drugClass}
Last Updated: ${formattedDate}

───────────────────────────────────────────────────────────
MECHANISM OF ACTION:
───────────────────────────────────────────────────────────

${medicine.mechanismOfAction}

───────────────────────────────────────────────────────────
CLINICAL USES:
───────────────────────────────────────────────────────────

${medicine.clinicalUses.join('\n')}

───────────────────────────────────────────────────────────
PRIMARY SYMPTOMS:
───────────────────────────────────────────────────────────

${primarySymptomsStr}

───────────────────────────────────────────────────────────
ADVERSE EFFECTS:
───────────────────────────────────────────────────────────

${medicine.adverseEffects.join('\n')}

───────────────────────────────────────────────────────────
CONTRAINDICATIONS:
───────────────────────────────────────────────────────────

${medicine.contraindications.join('\n')}

═══════════════════════════════════════════════════════════
`;
        }).join('\n\n');

        const header = `PHARMACOLOGY DATABASE EXPORT
Generated: ${new Date().toLocaleString()}
Total Medicines: ${medicines.length}

`;

        const blob = new Blob([header + content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pharmacology-database-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `${medicines.length} medicines exported as text file.`
        });
      } else {
        // Export as JSON - use the existing exportMedicines function
        exportMedicines();
        setShowExportDialog(false);
        return;
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
      const success = importMedicines(importText, importStrategy);
      if (success) {
        setIsImportOpen(false);
        setImportText("");
        setImportValidationResult(null);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  // Handle JSON file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JSON file.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingFile(true);
    setImportValidationResult(null);

    try {
      const text = await file.text();
      
      // Parse and validate JSON
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (parseError) {
        setImportValidationResult({
          valid: false,
          errors: [`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`]
        });
        toast({
          title: "JSON Parse Error",
          description: "The file contains invalid JSON syntax.",
          variant: "destructive"
        });
        setIsProcessingFile(false);
        return;
      }

      // Validate structure
      const medicinesArray = Array.isArray(parsedData.medicines) ? parsedData.medicines : 
                             Array.isArray(parsedData) ? parsedData : null;

      if (!medicinesArray) {
        setImportValidationResult({
          valid: false,
          errors: ['Invalid data structure. Expected an array of medicines or an object with a "medicines" array.']
        });
        toast({
          title: "Invalid Structure",
          description: "JSON must contain an array of medicines.",
          variant: "destructive"
        });
        setIsProcessingFile(false);
        return;
      }

      // Validate each medicine
      const errors: string[] = [];
      const warnings: string[] = [];
      let validCount = 0;

      medicinesArray.forEach((med: any, index: number) => {
        const medErrors: string[] = [];
        const medWarnings: string[] = [];

        // Required fields validation
        if (!med.name || typeof med.name !== 'string') {
          medErrors.push(`Medicine #${index + 1}: Missing or invalid 'name' field`);
        }
        if (!med.drugClass || typeof med.drugClass !== 'string') {
          medErrors.push(`Medicine #${index + 1}: Missing or invalid 'drugClass' field`);
        }
        if (!med.mechanismOfAction || typeof med.mechanismOfAction !== 'string') {
          medErrors.push(`Medicine #${index + 1}: Missing or invalid 'mechanismOfAction' field`);
        }

        // Optional fields validation with warnings
        if (!med.clinicalUses || !Array.isArray(med.clinicalUses)) {
          medWarnings.push(`Medicine #${index + 1} (${med.name || 'Unknown'}): Missing 'clinicalUses' array`);
        }
        if (!med.adverseEffects || !Array.isArray(med.adverseEffects)) {
          medWarnings.push(`Medicine #${index + 1} (${med.name || 'Unknown'}): Missing 'adverseEffects' array`);
        }
        if (!med.contraindications || !Array.isArray(med.contraindications)) {
          medWarnings.push(`Medicine #${index + 1} (${med.name || 'Unknown'}): Missing 'contraindications' array`);
        }
        if (!med.symptomMatchRules) {
          medWarnings.push(`Medicine #${index + 1} (${med.name || 'Unknown'}): Missing 'symptomMatchRules' object`);
        } else {
          if (!med.symptomMatchRules.primarySymptoms || !Array.isArray(med.symptomMatchRules.primarySymptoms)) {
            medWarnings.push(`Medicine #${index + 1} (${med.name || 'Unknown'}): Missing 'primarySymptoms' in symptomMatchRules`);
          }
        }

        if (medErrors.length > 0) {
          errors.push(...medErrors);
        } else {
          validCount++;
        }
        warnings.push(...medWarnings);
      });

      // Set validation result
      setImportValidationResult({
        valid: errors.length === 0,
        medicineCount: validCount,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      });

      // Show feedback
      if (errors.length === 0) {
        toast({
          title: "File Validated Successfully",
          description: `Found ${validCount} valid medicine${validCount !== 1 ? 's' : ''}. ${warnings.length > 0 ? `${warnings.length} warning(s).` : ''}`,
        });
        // Auto-populate the import text area
        setImportText(JSON.stringify({ medicines: medicinesArray }, null, 2));
      } else {
        toast({
          title: "Validation Errors Found",
          description: `${errors.length} error${errors.length !== 1 ? 's' : ''} found. Please fix the issues.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('File upload error:', error);
      setImportValidationResult({
        valid: false,
        errors: [error instanceof Error ? error.message : 'Failed to read file']
      });
      toast({
        title: "File Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process the file",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDelete = (medicine: Medicine) => {
    if (confirm(`Delete ${medicine.name}? This cannot be undone.`)) {
      deleteMedicine(medicine.id);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsEditModalOpen(true);
  };

  const handleDrugClassComparison = (drugClass: string) => {
    setComparisonDrugClass(drugClass);
    setShowDrugClassComparison(true);
  };

  // Filter medicines based on search and drug class
  const filteredMedicines = searchMedicines(searchQuery);
  const drugClassFiltered = selectedDrugClass 
    ? filteredMedicines.filter(med => med.drugClass === selectedDrugClass)
    : filteredMedicines;

  // Get unique drug classes for filter
  const drugClasses = Array.from(new Set(medicines.map(med => med.drugClass))).sort();

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Debug Tools */}
        <div className="flex gap-1">
          <Button variant="outline" onClick={debugLocalStorage} className="gap-2 text-[10px] py-0.5 px-1.5 h-auto">
            <Database className="w-3 h-3" /> Debug Storage
          </Button>
          <Button variant="outline" onClick={refreshMedicines} className="gap-2 text-[10px] py-0.5 px-1.5 h-auto">
            <RefreshCw className="w-3 h-3" /> Refresh Data
          </Button>
        </div>
        
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 text-[10px] py-0.5 px-1.5 h-auto">
              <Upload className="w-3 h-3" /> Import Medicines
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Pharmacology Database</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import Strategy</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="merge"
                      checked={importStrategy === 'merge'}
                      onChange={(e) => setImportStrategy(e.target.value as 'merge' | 'replace')}
                    />
                    Merge (Add to existing)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="replace"
                      checked={importStrategy === 'replace'}
                      onChange={(e) => setImportStrategy(e.target.value as 'merge' | 'replace')}
                    />
                    Replace (Clear all existing)
                  </label>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Upload JSON File</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-slate-800">
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    disabled={isProcessingFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileUpload"
                    className={`cursor-pointer flex flex-col items-center gap-2 ${
                      isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessingFile ? (
                      <>
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Processing file...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500">JSON files only (max 10MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
                
                {/* Validation Results */}
                {importValidationResult && (
                  <div className={`rounded-lg p-4 border-2 ${
                    importValidationResult.valid 
                      ? 'bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-600'
                      : 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-600'
                  }`}>
                    <div className="flex items-start gap-3">
                      {importValidationResult.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2">
                        <p className={`font-semibold ${
                          importValidationResult.valid 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-red-800 dark:text-red-200'
                        }`}>
                          {importValidationResult.valid 
                            ? `✓ Validated: ${importValidationResult.medicineCount} medicine${importValidationResult.medicineCount !== 1 ? 's' : ''}`
                            : `✗ Validation Failed: ${importValidationResult.errors?.length || 0} error${(importValidationResult.errors?.length || 0) !== 1 ? 's' : ''}`
                          }
                        </p>
                        
                        {importValidationResult.errors && importValidationResult.errors.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">Errors:</p>
                            <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                              {importValidationResult.errors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {importValidationResult.warnings && importValidationResult.warnings.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Warnings:</p>
                            <ul className="text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                              {importValidationResult.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="importData">Or paste JSON data:</Label>
                <Textarea
                  id="importData"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your pharmacology JSON here..."
                  className="h-40 font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImportSubmit} 
                disabled={!importText.trim() || !!(importValidationResult && !importValidationResult.valid)}
              >
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setShowExportDialog(true)} className="gap-2 text-[10px] py-0.5 px-1.5 h-auto">
          <Download className="w-3 h-3" /> Export Database
        </Button>

        <Button 
          onClick={() => {
            setEditingMedicine(null);
            setIsEditModalOpen(true);
          }}
          className="gap-2 text-[10px] py-0.5 px-1.5 h-auto"
        >
          <Plus className="w-3 h-3" /> Add New Medicine
        </Button>

        <Dialog open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 text-[10px] py-0.5 px-1.5 h-auto">
              <Database className="w-3 h-3" /> View Database ({medicines.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-base">Pharmacology Database</DialogTitle>
            </DialogHeader>
            
            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 p-4 bg-muted rounded-lg">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search medicines, symptoms, drug classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select
                    value={selectedDrugClass}
                    onChange={(e) => setSelectedDrugClass(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm"
                  >
                    <option value="">All Drug Classes</option>
                    {drugClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Add New Medicine Button */}
            <div className="p-3 border-b">
              <Button 
                onClick={() => {
                  setEditingMedicine(null);
                  setIsEditModalOpen(true);
                }}
                className="w-full gap-2 text-xs py-1 px-2 h-auto"
              >
                <Plus className="w-3 h-3" />
                Add New Medicine
              </Button>
            </div>

            {/* Compare Button for Selected Drug Class */}
            {selectedDrugClass && (
              <div className="p-3 bg-purple-50 border-b border-purple-200">
                <Button
                  onClick={() => handleDrugClassComparison(selectedDrugClass)}
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm py-2 h-auto"
                >
                  <BarChart3 className="w-4 h-4" />
                  Compare All Medicines in {selectedDrugClass} ({drugClassFiltered.length})
                </Button>
              </div>
            )}

            {/* Medicine List */}
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                {drugClassFiltered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery || selectedDrugClass 
                      ? "No medicines match your search criteria" 
                      : "No medicines in database"}
                  </div>
                ) : (
                  drugClassFiltered.map((medicine) => (
                    <div 
                      key={medicine.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-base">{medicine.name}</h4>
                            <Badge variant="secondary" className="text-xs">{medicine.drugClass}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {medicine.mechanismOfAction}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {medicine.clinicalUses.slice(0, 3).map((use, index) => (
                              <Badge key={index} variant="outline" className="text-[10px]">
                                {use}
                              </Badge>
                            ))}
                            {medicine.clinicalUses.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{medicine.clinicalUses.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mb-2">
                            Primary symptoms: {medicine.symptomMatchRules.primarySymptoms.join(', ')}
                          </div>
                          
                          {/* Medicine Advantage Badge */}
                          {medicine.medicineAdvantage && (
                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 mr-2">
                              <Lightbulb className="w-3 h-3 mr-1" />
                              Has Advantage
                            </Badge>
                          )}
                          
                          {/* Clinical Use Details Badge */}
                          {medicine.clinicalUseDetails && medicine.clinicalUseDetails.length > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {medicine.clinicalUseDetails.length} Use Detail{medicine.clinicalUseDetails.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          
                          {/* Augmenting Other Medicines Badge */}
                          {(medicine as any).simplifiedStructuredAugmentingMedicines && (medicine as any).simplifiedStructuredAugmentingMedicines.length > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                              <Plus className="w-3 h-3 mr-1" />
                              Augmenting Medicines
                            </Badge>
                          )}
                          
                          {/* Comparison Column/Badge */}
                          <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-800 border-gray-300">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Comparison
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(medicine)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(medicine)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          {onMedicineSelect && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onMedicineSelect(medicine)}
                              className="text-xs py-1 px-2 h-auto"
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button onClick={() => setIsDatabaseOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medicine Edit Modal */}
      <MedicineEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        medicine={editingMedicine}
        onSave={() => {
          setIsEditModalOpen(false);
          setEditingMedicine(null);
        }}
      />

      {/* Drug Class Comparison View */}
      {showDrugClassComparison && (
        <DrugClassComparison
          drugClass={comparisonDrugClass}
          medicines={drugClassFiltered}
          onBack={() => setShowDrugClassComparison(false)}
          onSelectMedicine={onMedicineSelect}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Export Medicines</span>
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
                      ? "Exports all medicines in JSON format. Ideal for backup, import to other systems, or programmatic access."
                      : "Exports all medicines in a beautifully formatted text file. Easy to read, print, and share with colleagues."
                    }
                  </p>
                </div>

                <Button 
                  onClick={handleExport}
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export {medicines.length} Medicines
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {medicines.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Total Medicines</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {new Set(medicines.map(m => m.drugClass)).size}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Drug Classes</div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {medicines.reduce((sum, med) => sum + med.symptomMatchRules.primarySymptoms.length, 0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Primary Symptoms Covered</div>
        </div>
      </div>
    </div>
  );
}