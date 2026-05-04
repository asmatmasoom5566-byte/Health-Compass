import { useState, useEffect } from 'react';
import { Cause } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X } from 'lucide-react';

interface SymptomSelectorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  causes: Cause[];
  onSymptomSelect: (symptoms: string[]) => void;
  title?: string;
  description?: string;
  allowMultipleConditions?: boolean;
  showAllSymptomsOnly?: boolean; // New prop to skip condition selection and show all symptoms
}

export function SymptomSelectorDialog({
  isOpen,
  onOpenChange,
  causes,
  onSymptomSelect,
  title = "Select Symptoms",
  description,
  allowMultipleConditions = false,
  showAllSymptomsOnly = false
}: SymptomSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [conditionSearchTerm, setConditionSearchTerm] = useState('');

  // Get all unique symptoms from all causes
  const getAllSymptoms = () => {
   const symptomSet = new Set<string>();
    causes.forEach(cause => {
      cause.symptoms.forEach(symptom => {
        if (typeof symptom === 'string') {
         symptomSet.add(symptom);
        } else {
         symptomSet.add(symptom.typicalSymptom);
        }
      });
    });
   return Array.from(symptomSet).sort();
  };

  // Get symptoms for a specific condition
  const getConditionSymptoms = (conditionName: string) => {
   const cause = causes.find(c => c.name.toLowerCase() === conditionName.toLowerCase());
    if (!cause) return [];
    
   return cause.symptoms.map(s => 
      typeof s === 'string' ? s : s.typicalSymptom
    ).sort();
  };

  // Filter symptoms based on search term (only match symptoms that START WITH the search term)
  const filteredSymptoms = searchTerm 
    ? getAllSymptoms().filter(s => 
       s.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
    : getAllSymptoms();

  // Filter conditions based on search term
  const filteredConditions = conditionSearchTerm
    ? causes.filter(c => 
        c.name.toLowerCase().includes(conditionSearchTerm.toLowerCase())
      )
    : causes;

  // Get symptoms to display (either all or from selected condition)
  const symptomsToDisplay = selectedCondition 
    ? getConditionSymptoms(selectedCondition)
    : filteredSymptoms;

  const handleAddSymptom = (symptom: string) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const handleConfirm = () => {
    onSymptomSelect(selectedSymptoms);
    // Reset state
    setSelectedSymptoms([]);
    setSelectedCondition('');
    setSearchTerm('');
    setConditionSearchTerm('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedSymptoms([]);
    setSelectedCondition('');
    setSearchTerm('');
    setConditionSearchTerm('');
    onOpenChange(false);
  };

 return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Condition Selection (if needed) */}
          {allowMultipleConditions && !showAllSymptomsOnly && (
            <div className="space-y-2">
              <Label>Step 1: Select Condition</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search conditions..."
                  value={conditionSearchTerm}
                  onChange={(e) => setConditionSearchTerm(e.target.value)}
                  className="flex-1"
                />
                {selectedCondition && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCondition('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {!selectedCondition && (
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {filteredConditions.slice(0, 10).map((cause) => (
                      <Button
                        key={cause.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => setSelectedCondition(cause.name)}
                      >
                        <div>
                          <div className="font-medium">{cause.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {cause.symptoms.length} symptoms
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {selectedCondition && (
                <Badge variant="secondary" className="mt-2">
                 Selected: {selectedCondition}
                </Badge>
              )}
            </div>
          )}

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Symptoms ({selectedSymptoms.length})</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[60px]">
                {selectedSymptoms.map((symptom) => (
                  <Badge
                    key={symptom}
                    variant="default"
                    className="gap-1"
                  >
                    {symptom}
                    <button
                      onClick={() => handleRemoveSymptom(symptom)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Symptom Search and Selection */}
          <div className="space-y-2">
            <Label>
              {selectedCondition && !showAllSymptomsOnly
                ? `Step 2: Select Symptoms from ${selectedCondition}`
                : showAllSymptomsOnly
                  ? "Search symptoms (starting with specific letter)"
                  : allowMultipleConditions
                    ? "Or select from all symptoms"
                    : "Search and select symptoms"}
            </Label>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-64 border rounded-md p-2">
              <div className="space-y-1">
                {symptomsToDisplay.map((symptom) => {
                 const isSelected = selectedSymptoms.includes(symptom);
                 return (
                    <div
                      key={symptom}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => isSelected ? handleRemoveSymptom(symptom) : handleAddSymptom(symptom)}
                    >
                      <span className="text-sm">{symptom}</span>
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          isSelected ? handleRemoveSymptom(symptom) : handleAddSymptom(symptom);
                        }}
                      >
                        {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedSymptoms.length === 0}
            >
              Add {selectedSymptoms.length === 1 ? 'Symptom' : `${selectedSymptoms.length} Symptoms`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
