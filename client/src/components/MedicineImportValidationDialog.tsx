import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Info, X, Trash2, Edit2, Wand2, Download } from 'lucide-react';
import { Medicine } from '@shared/schema';
import { importProcessor, ImportCorrectionSummary } from '@/utils/import-processor';

interface MedicineValidationIssue {
  index: number;
  medicineName: string;
  field: string;
  issueType: 'missing' | 'invalid' | 'type-error' | 'range-error' | 'format-error';
  message: string;
  originalValue?: any;
  suggestedValue?: any;
  canAutoFix: boolean;
  autoFixed?: boolean;
}

interface MedicineImportValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rawData: any[];
  onConfirmImport: (processedData: Medicine[], strategy: 'merge' | 'replace') => void;
}

export function MedicineImportValidationDialog({ 
  isOpen, 
  onClose, 
  rawData,
  onConfirmImport 
}: MedicineImportValidationDialogProps) {
  const [issues, setIssues] = useState<MedicineValidationIssue[]>([]);
  const [editingIssue, setEditingIssue] = useState<MedicineValidationIssue | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [processedData, setProcessedData] = useState<Medicine[]>([]);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [autoFixedCount, setAutoFixedCount] = useState(0);

  useEffect(() => {
    if (isOpen && rawData) {
      validateData(rawData);
    }
  }, [isOpen, rawData]);

  const validateData = (data: any[]) => {
    const foundIssues: MedicineValidationIssue[] = [];
    const processed: Medicine[] = [];
    let valid = 0;
    let invalid = 0;
    let autoFixed = 0;

    data.forEach((medicine, index) => {
      let hasIssues = false;
      let hasAutoFixed = false;

      // Check if medicine is an object
      if (typeof medicine !== 'object' || medicine === null || Array.isArray(medicine)) {
        foundIssues.push({
          index,
          medicineName: `Entry #${index + 1}`,
          field: 'structure',
          issueType: 'invalid',
          message: 'Each medicine must be an object, not ' + (Array.isArray(medicine) ? 'array' : typeof medicine),
          originalValue: medicine,
          suggestedValue: null,
          canAutoFix: false
        });
        hasIssues = true;
        invalid++;
        processed.push(medicine as Medicine);
        return;
      }

      // Process with intelligent import processor
      const processedMedicine = importProcessor.processMedicine(medicine);
      const correctionSummary = importProcessor.getCorrectionSummary();

      // Check for critical errors
      if (correctionSummary.errors.length > 0) {
        correctionSummary.errors.forEach(error => {
          foundIssues.push({
            index,
            medicineName: medicine.name || `Medicine #${index + 1}`,
            field: 'critical',
            issueType: 'invalid',
            message: error,
            originalValue: medicine,
            suggestedValue: null,
            canAutoFix: false
          });
        });
        hasIssues = true;
        invalid++;
        processed.push(medicine as Medicine);
        return;
      }

      // Add warnings as issues that can be auto-fixed
      correctionSummary.warnings.forEach(warning => {
        foundIssues.push({
          index,
          medicineName: processedMedicine?.name || medicine.name || `Medicine #${index + 1}`,
          field: 'warning',
          issueType: 'missing',
          message: warning,
          originalValue: null,
          suggestedValue: 'Auto-defaulted',
          canAutoFix: true,
          autoFixed: true
        });
        hasAutoFixed = true;
      });

      // Add field corrections as auto-fixed issues
      correctionSummary.correctedFields.forEach(correction => {
        foundIssues.push({
          index,
          medicineName: processedMedicine?.name || `Medicine #${index + 1}`,
          field: 'field-mapping',
          issueType: 'format-error',
          message: `Field corrected: ${correction}`,
          originalValue: null,
          suggestedValue: 'Auto-corrected',
          canAutoFix: true,
          autoFixed: true
        });
        hasAutoFixed = true;
      });

      // Add defaults as auto-fixed issues
      correctionSummary.defaultedFields.forEach(defaultField => {
        foundIssues.push({
          index,
          medicineName: processedMedicine?.name || `Medicine #${index + 1}`,
          field: 'default-value',
          issueType: 'missing',
          message: `Default set: ${defaultField}`,
          originalValue: null,
          suggestedValue: 'Auto-defaulted',
          canAutoFix: true,
          autoFixed: true
        });
        hasAutoFixed = true;
      });

      // Add ignored fields as warnings
      if (correctionSummary.ignoredFields.length > 0) {
        foundIssues.push({
          index,
          medicineName: processedMedicine?.name || `Medicine #${index + 1}`,
          field: 'ignored-fields',
          issueType: 'format-error',
          message: `Ignored fields: ${correctionSummary.ignoredFields.join(', ')}`,
          originalValue: correctionSummary.ignoredFields,
          suggestedValue: null,
          canAutoFix: false
        });
      }

      // Add extracted symptoms info
      if (correctionSummary.extractedSymptoms.length > 0) {
        foundIssues.push({
          index,
          medicineName: processedMedicine?.name || `Medicine #${index + 1}`,
          field: 'symptom-extraction',
          issueType: 'format-error',
          message: `Extracted symptoms: ${correctionSummary.extractedSymptoms.join(', ')}`,
          originalValue: null,
          suggestedValue: 'Auto-extracted',
          canAutoFix: true,
          autoFixed: true
        });
        hasAutoFixed = true;
      }

      if (processedMedicine) {
        processed.push(processedMedicine);
        if (hasAutoFixed) {
          autoFixed++;
        } else {
          valid++;
        }
      } else {
        invalid++;
      }

      if (hasIssues) {
        invalid++;
      } else if (hasAutoFixed) {
        autoFixed++;
      } else {
        valid++;
      }
    });

    setIssues(foundIssues);
    setProcessedData(processed);
    setValidCount(valid);
    setInvalidCount(invalid);
    setAutoFixedCount(autoFixed);
  };

  const handleEditIssue = (issue: MedicineValidationIssue) => {
    setEditingIssue(issue);
    setEditValue(issue.originalValue);
  };

  const handleSaveEdit = () => {
    if (editingIssue) {
      // Update the processed data with the edited value
      const updatedData = [...processedData];
      if (updatedData[editingIssue.index]) {
        // This would need more complex logic to actually update the field
        // For now, we'll just close the edit dialog
      }
      setEditingIssue(null);
      setEditValue('');
    }
  };

  const handleConfirmImportInternal = () => {
    // Filter out invalid medicines
    const validMedicines = processedData.filter((_, index) => {
      return !issues.some(issue => 
        issue.index === index && 
        issue.issueType === 'invalid' && 
        !issue.canAutoFix
      );
    });
    
    onConfirmImport(validMedicines, importStrategy);
  };

  const getIssueIcon = (issueType: MedicineValidationIssue['issueType'], canAutoFix: boolean, autoFixed?: boolean) => {
    if (autoFixed) return <Wand2 className="w-4 h-4 text-blue-500" />;
    if (canAutoFix) return <Info className="w-4 h-4 text-yellow-500" />;
    switch (issueType) {
      case 'missing': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'invalid': return <X className="w-4 h-4 text-red-500" />;
      case 'type-error': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'range-error': return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      case 'format-error': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueBadgeVariant = (issueType: MedicineValidationIssue['issueType'], canAutoFix: boolean, autoFixed?: boolean) => {
    if (autoFixed) return 'default';
    if (canAutoFix) return 'secondary';
    switch (issueType) {
      case 'missing': return 'destructive';
      case 'invalid': return 'destructive';
      case 'type-error': return 'outline';
      case 'range-error': return 'outline';
      case 'format-error': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Medicine Import Validation
          </DialogTitle>
          <DialogDescription>
            Review and validate medicines before importing. {invalidCount > 0 ? `${invalidCount} issues need attention.` : 'All medicines validated successfully.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{validCount}</div>
                  <div className="text-sm text-muted-foreground">Valid</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{autoFixedCount}</div>
                  <div className="text-sm text-muted-foreground">Auto-Fixed</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{issues.filter(i => i.canAutoFix && !i.autoFixed).length}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Issues List */}
              {issues.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Validation Issues
                  </h3>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {issues.map((issue, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          issue.autoFixed 
                            ? 'bg-blue-50 border-blue-200' 
                            : issue.canAutoFix 
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getIssueIcon(issue.issueType, issue.canAutoFix, issue.autoFixed)}
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {issue.medicineName} - {issue.field}
                              </div>
                              <div className="text-sm mt-1">{issue.message}</div>
                              {issue.originalValue !== undefined && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Original: {JSON.stringify(issue.originalValue)}
                                </div>
                              )}
                              {issue.suggestedValue !== undefined && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Suggested: {JSON.stringify(issue.suggestedValue)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={getIssueBadgeVariant(issue.issueType, issue.canAutoFix, issue.autoFixed)}>
                              {issue.autoFixed ? 'Auto-Fixed' : issue.canAutoFix ? 'Warning' : 'Error'}
                            </Badge>
                            
                            {issue.canAutoFix && !issue.autoFixed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditIssue(issue)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Strategy */}
              <div className="space-y-3">
                <Label>Import Strategy</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={importStrategy === 'merge' ? 'default' : 'outline'}
                    onClick={() => setImportStrategy('merge')}
                    className="flex-1"
                  >
                    Merge with Existing
                  </Button>
                  <Button 
                    variant={importStrategy === 'replace' ? 'default' : 'outline'}
                    onClick={() => setImportStrategy('replace')}
                    className="flex-1"
                  >
                    Replace All
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {importStrategy === 'merge' 
                    ? 'Add new medicines and update existing ones with matching names'
                    : 'Remove all existing medicines and import only the new ones'}
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmImportInternal}
            disabled={invalidCount > 0}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Import {processedData.length - invalidCount} Medicines
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Edit Issue Dialog */}
      {editingIssue && (
        <Dialog open={!!editingIssue} onOpenChange={() => setEditingIssue(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Issue</DialogTitle>
              <DialogDescription>
                Edit the value for {editingIssue.medicineName} - {editingIssue.field}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Current Value</Label>
                <Input 
                  value={JSON.stringify(editingIssue.originalValue)} 
                  readOnly 
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label>New Value</Label>
                <Input 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter new value"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingIssue(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}