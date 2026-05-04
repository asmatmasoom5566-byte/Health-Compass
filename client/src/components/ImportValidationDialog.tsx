import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Info, X, Trash2, Edit2, Wand2, Download } from 'lucide-react';
import { Cause } from '@shared/schema';

interface ValidationIssue {
  index: number;
  conditionName: string;
  field: string;
  issueType: 'missing' | 'invalid' | 'type-error' | 'range-error';
  message: string;
  originalValue?: any;
  suggestedValue?: any;
  canAutoFix: boolean;
}

interface ImportValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rawData: any[];
  onConfirmImport: (processedData: Cause[], strategy: 'merge' | 'replace') => void;
}

export function ImportValidationDialog({ 
  isOpen, 
  onClose, 
  rawData,
  onConfirmImport 
}: ImportValidationDialogProps) {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [editingIssue, setEditingIssue] = useState<ValidationIssue | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  useEffect(() => {
    if (isOpen && rawData) {
      validateData(rawData);
    }
  }, [isOpen, rawData]);

  const validateData = (data: any[]) => {
    const foundIssues: ValidationIssue[] = [];
    const processed: any[] = [];
    let valid = 0;
    let invalid = 0;

    data.forEach((condition, index) => {
      let hasIssues = false;

      // Check if condition is an object
      if (typeof condition !== 'object' || condition === null || Array.isArray(condition)) {
        foundIssues.push({
          index,
          conditionName: `Entry #${index + 1}`,
          field: 'structure',
          issueType: 'invalid',
          message: 'Each condition must be an object, not ' + (Array.isArray(condition) ? 'array' : typeof condition),
          originalValue: condition,
          suggestedValue: null,
          canAutoFix: false
        });
        hasIssues = true;
        invalid++;
        processed.push(condition);
        return;
      }

      // Check for missing name
      if (!condition.name || typeof condition.name !== 'string' || condition.name.trim() === '') {
        foundIssues.push({
          index,
          conditionName: `Condition #${index + 1}`,
          field: 'name',
          issueType: 'missing',
          message: 'Condition name is required',
          originalValue: condition.name,
          suggestedValue: 'Unnamed Condition',
          canAutoFix: true
        });
        hasIssues = true;
      }

      // Check for missing or invalid symptoms
      if (!condition.symptoms) {
        foundIssues.push({
          index,
          conditionName: condition.name || `Condition #${index + 1}`,
          field: 'symptoms',
          issueType: 'missing',
          message: 'Symptoms array is required',
          originalValue: condition.symptoms,
          suggestedValue: [],
          canAutoFix: false
        });
        hasIssues = true;
      } else if (!Array.isArray(condition.symptoms)) {
        foundIssues.push({
          index,
          conditionName: condition.name || `Condition #${index + 1}`,
          field: 'symptoms',
          issueType: 'type-error',
          message: 'Symptoms must be an array',
          originalValue: condition.symptoms,
          suggestedValue: typeof condition.symptoms === 'string' ? [condition.symptoms] : [],
          canAutoFix: true
        });
        hasIssues = true;
      } else if (condition.symptoms.length === 0) {
        foundIssues.push({
          index,
          conditionName: condition.name || `Condition #${index + 1}`,
          field: 'symptoms',
          issueType: 'missing',
          message: 'At least one symptom is required',
          originalValue: condition.symptoms,
          suggestedValue: null,
          canAutoFix: false
        });
        hasIssues = true;
      } else {
        // Check each symptom
        condition.symptoms.forEach((symptom: any, symIdx: number) => {
          if (typeof symptom !== 'string') {
            foundIssues.push({
              index,
              conditionName: condition.name || `Condition #${index + 1}`,
              field: `symptoms[${symIdx}]`,
              issueType: 'type-error',
              message: `Symptom at index ${symIdx} must be a string, not ${typeof symptom}`,
              originalValue: symptom,
              suggestedValue: String(symptom),
              canAutoFix: true
            });
            hasIssues = true;
          }
        });
      }

      // Check age rule validity
      if (condition.ageRule) {
        if (condition.ageRule.min !== undefined && typeof condition.ageRule.min !== 'number') {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: 'ageRule.min',
            issueType: 'type-error',
            message: 'Age minimum must be a number',
            originalValue: condition.ageRule.min,
            suggestedValue: Number(condition.ageRule.min) || 0,
            canAutoFix: true
          });
          hasIssues = true;
        }
        if (condition.ageRule.max !== undefined && typeof condition.ageRule.max !== 'number') {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: 'ageRule.max',
            issueType: 'type-error',
            message: 'Age maximum must be a number',
            originalValue: condition.ageRule.max,
            suggestedValue: Number(condition.ageRule.max) || 120,
            canAutoFix: true
          });
          hasIssues = true;
        }
        if (condition.ageRule.min > condition.ageRule.max) {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: 'ageRule',
            issueType: 'range-error',
            message: 'Age minimum cannot be greater than maximum',
            originalValue: { min: condition.ageRule.min, max: condition.ageRule.max },
            suggestedValue: { min: condition.ageRule.max, max: condition.ageRule.min },
            canAutoFix: true
          });
          hasIssues = true;
        }
      }

      // Check sex rule validity
      if (condition.sexRule && !['male', 'female', 'both'].includes(condition.sexRule)) {
        foundIssues.push({
          index,
          conditionName: condition.name || `Condition #${index + 1}`,
          field: 'sexRule',
          issueType: 'invalid',
          message: 'Sex rule must be "male", "female", or "both"',
          originalValue: condition.sexRule,
          suggestedValue: 'both',
          canAutoFix: true
        });
        hasIssues = true;
      }

      // Check base rate validity
      if (condition.baseRate !== undefined) {
        if (typeof condition.baseRate !== 'number') {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: 'baseRate',
            issueType: 'type-error',
            message: 'Base rate must be a number',
            originalValue: condition.baseRate,
            suggestedValue: Number(condition.baseRate) || 0,
            canAutoFix: true
          });
          hasIssues = true;
        } else if (condition.baseRate < 0 || condition.baseRate > 100) {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: 'baseRate',
            issueType: 'range-error',
            message: 'Base rate must be between 0 and 100',
            originalValue: condition.baseRate,
            suggestedValue: Math.max(0, Math.min(100, condition.baseRate)),
            canAutoFix: true
          });
          hasIssues = true;
        }
      }

      // Validate string fields
      const stringFields = ['treatment', 'fullReview'];
      stringFields.forEach(fieldName => {
        if (condition[fieldName] !== undefined && typeof condition[fieldName] !== 'string') {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: fieldName,
            issueType: 'type-error',
            message: `${fieldName} must be a string, not ${typeof condition[fieldName]}`,
            originalValue: condition[fieldName],
            suggestedValue: String(condition[fieldName]),
            canAutoFix: true
          });
          hasIssues = true;
        }
      });

      // Validate atypicalSymptoms if present
      if (condition.atypicalSymptoms !== undefined) {
        if (!Array.isArray(condition.atypicalSymptoms)) {
          foundIssues.push({
            index,
            conditionName: condition.name || `Condition #${index + 1}`,
            field: 'atypicalSymptoms',
            issueType: 'type-error',
            message: 'Atypical symptoms must be an array',
            originalValue: condition.atypicalSymptoms,
            suggestedValue: [],
            canAutoFix: true
          });
          hasIssues = true;
        } else {
          condition.atypicalSymptoms.forEach((symptom: any, symIdx: number) => {
            if (typeof symptom !== 'string') {
              foundIssues.push({
                index,
                conditionName: condition.name || `Condition #${index + 1}`,
                field: `atypicalSymptoms[${symIdx}]`,
                issueType: 'type-error',
                message: `Atypical symptom at index ${symIdx} must be a string`,
                originalValue: symptom,
                suggestedValue: String(symptom),
                canAutoFix: true
              });
              hasIssues = true;
            }
          });
        }
      }

      if (hasIssues) {
        invalid++;
      } else {
        valid++;
      }

      processed.push(condition);
    });

    setIssues(foundIssues);
    setProcessedData(processed);
    setValidCount(valid);
    setInvalidCount(invalid);
  };

  const handleAutoFixIssue = (issue: ValidationIssue) => {
    if (!issue.canAutoFix || issue.suggestedValue === null) return;

    const newProcessedData = [...processedData];
    const condition = newProcessedData[issue.index];

    // Apply the fix based on field path
    const fieldParts = issue.field.split('.');
    if (fieldParts.length === 1) {
      condition[fieldParts[0]] = issue.suggestedValue;
    } else if (fieldParts.length === 2) {
      if (!condition[fieldParts[0]]) condition[fieldParts[0]] = {};
      condition[fieldParts[0]][fieldParts[1]] = issue.suggestedValue;
    }

    setProcessedData(newProcessedData);
    
    // Remove this issue
    setIssues(issues.filter(i => i !== issue));
    setInvalidCount(prev => Math.max(0, prev - 1));
    setValidCount(prev => prev + 1);
  };

  const handleAutoFixAll = () => {
    const autoFixableIssues = issues.filter(i => i.canAutoFix);
    autoFixableIssues.forEach(issue => handleAutoFixIssue(issue));
  };

  const handleDeleteCondition = (issue: ValidationIssue) => {
    const newProcessedData = processedData.filter((_, idx) => idx !== issue.index);
    const newIssues = issues.filter(i => i.index !== issue.index);
    
    setProcessedData(newProcessedData);
    setIssues(newIssues);
    setInvalidCount(prev => Math.max(0, prev - 1));
  };

  const handleEditIssue = (issue: ValidationIssue) => {
    setEditingIssue(issue);
    setEditValue(issue.suggestedValue || issue.originalValue || '');
  };

  const handleSaveEdit = () => {
    if (!editingIssue) return;

    const newProcessedData = [...processedData];
    const condition = newProcessedData[editingIssue.index];

    // Apply the manual correction
    const fieldParts = editingIssue.field.split('.');
    if (fieldParts.length === 1) {
      condition[fieldParts[0]] = editValue;
    } else if (fieldParts.length === 2) {
      if (!condition[fieldParts[0]]) condition[fieldParts[0]] = {};
      condition[fieldParts[0]][fieldParts[1]] = editValue;
    }

    setProcessedData(newProcessedData);
    
    // Remove this issue
    setIssues(issues.filter(i => i !== editingIssue));
    setInvalidCount(prev => Math.max(0, prev - 1));
    setValidCount(prev => prev + 1);
    
    setEditingIssue(null);
    setEditValue('');
  };

  const handleConfirm = () => {
    // Filter out conditions with critical issues
    const validConditions = processedData.filter((_, idx) => {
      const criticalIssues = issues.filter(i => 
        i.index === idx && 
        (i.issueType === 'missing' && (i.field === 'name' || i.field === 'symptoms'))
      );
      return criticalIssues.length === 0;
    }).map(c => ({
      ...c,
      id: c.id || crypto.randomUUID()
    }));

    onConfirmImport(validConditions as Cause[], importStrategy);
    onClose();
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'missing': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'invalid': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'type-error': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'range-error': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'missing': return 'text-red-600 dark:text-red-400';
      case 'invalid': return 'text-orange-600 dark:text-orange-400';
      case 'type-error': return 'text-yellow-600 dark:text-yellow-400';
      case 'range-error': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Validation - Review Issues</DialogTitle>
            <DialogDescription>
              Review and fix issues before importing. You can auto-fix, manually correct, or delete problematic conditions.
            </DialogDescription>
          </DialogHeader>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-green-800 dark:text-green-200 font-semibold">Valid Conditions</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-300">{validCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm text-red-800 dark:text-red-200 font-semibold">Issues Found</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-300">{issues.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">Total Conditions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{processedData.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-fix and Strategy Selection */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handleAutoFixAll}
              disabled={issues.filter(i => i.canAutoFix).length === 0}
              className="gap-2"
              variant="default"
            >
              <Wand2 className="w-4 h-4" />
              Auto-Fix All ({issues.filter(i => i.canAutoFix).length})
            </Button>

            <div className="flex gap-2">
              <Button
                variant={importStrategy === 'merge' ? 'default' : 'outline'}
                onClick={() => setImportStrategy('merge')}
                size="sm"
              >
                Merge
              </Button>
              <Button
                variant={importStrategy === 'replace' ? 'default' : 'outline'}
                onClick={() => setImportStrategy('replace')}
                size="sm"
              >
                Replace
              </Button>
            </div>
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full border rounded-lg">
              <div className="p-4 space-y-3">
                {issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">All Clear!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">No issues found. Ready to import.</p>
                  </div>
                ) : (
                  issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 bg-white dark:bg-slate-900 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getIssueIcon(issue.issueType)}
                            <h4 className="font-semibold">{issue.conditionName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {issue.field}
                            </Badge>
                          </div>
                          
                          <p className={`text-sm ${getIssueColor(issue.issueType)}`}>
                            {issue.message}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Original Value:</p>
                              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {JSON.stringify(issue.originalValue)}
                              </code>
                            </div>
                            {issue.suggestedValue !== null && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Suggested Fix:</p>
                                <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-300">
                                  {JSON.stringify(issue.suggestedValue)}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {issue.canAutoFix && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAutoFixIssue(issue)}
                              className="gap-2"
                            >
                              <Wand2 className="w-3 h-3" />
                              Auto-Fix
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditIssue(issue)}
                            className="gap-2"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCondition(issue)}
                            className="gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={validCount === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Import {validCount} Valid Conditions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingIssue} onOpenChange={() => setEditingIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Field Value</DialogTitle>
            <DialogDescription>
              Manually correct the value for {editingIssue?.field} in {editingIssue?.conditionName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field: {editingIssue?.field}</Label>
              {editingIssue?.field === 'sexRule' ? (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              ) : editingIssue?.field.includes('symptoms') ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.split(',').map(s => s.trim()))}
                  placeholder="Enter symptoms separated by commas"
                />
              ) : (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter corrected value"
                  type={editingIssue?.issueType === 'type-error' && editingIssue?.field.includes('age') ? 'number' : 'text'}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIssue(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Correction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
