import { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  Edit3,
  CheckCircle,
  Pill,
  FileText,
  Trash2,
  BarChart3,
  TrendingUp,
  Shield,
  DollarSign
} from 'lucide-react';
import { Medicine } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePharmacology } from '@/hooks/use-pharmacology';
import { useSymptomTracker } from '@/hooks/use-symptom-tracker';
import { SymptomSelectorDialog } from './SymptomSelectorDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface MedicineEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine?: Medicine | null;
  onSave?: () => void;
}

export function MedicineEditModal({ open, onOpenChange, medicine, onSave }: MedicineEditModalProps) {
 const { toast } = useToast();
 const { addMedicine, updateMedicine } = usePharmacology();
 const { causes } = useSymptomTracker();
  
 // State for symptom selector dialogs
 const [isClinicalUseSymptomSelectorOpen, setIsClinicalUseSymptomSelectorOpen] = useState(false);
 const [isPrimarySymptomSelectorOpen, setIsPrimarySymptomSelectorOpen] = useState(false);
 const [isSecondarySymptomSelectorOpen, setIsSecondarySymptomSelectorOpen] = useState(false);
 const [isInappropriateSymptomSelectorOpen, setIsInappropriateSymptomSelectorOpen] = useState(false);
 const [selectedClinicalUseIndex, setSelectedClinicalUseIndex] = useState<number | null>(null);
 const [conditionNameInput, setConditionNameInput] = useState('');

 const [formData, setFormData] = useState({
    name: '',
    drugClass: '',
    mechanismOfAction: '',
    clinicalUses: [''],
    adverseEffects: [''],
    contraindications: [''],
    sexRules: {
      avoidInPregnancy: false,
      cautionInBreastfeeding: false,
      sexSpecificRisks: ['']
    },
    symptomMatchRules: {
      primarySymptoms: [''],
      secondarySymptoms: [''],
      inappropriateSymptoms: ['']
    },
    clinicalUseDetails: [] as Array<{ useName: string; details?: string }>,
    medicineAdvantage: '',
    medicineDisadvantage: '',
    comparison: '',
    augmentingMedicines: '', // Legacy field for backward compatibility
    simplifiedStructuredAugmentingMedicines: [] as string[],
    teachingNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingUseIndex, setEditingUseIndex] = useState<number | null>(null);
  const [currentDetailText, setCurrentDetailText] = useState('');

  // Helper function to get or create clinical use detail
  const getClinicalUseDetail = (useName: string) => {
    return formData.clinicalUseDetails.find(d => d.useName === useName);
  };

  const updateClinicalUseDetail = (useName: string, details: string | undefined) => {
    const existing = formData.clinicalUseDetails.findIndex(d => d.useName === useName);
    let newDetails;
    
    if (existing >= 0) {
      newDetails = [...formData.clinicalUseDetails];
      newDetails[existing] = { useName, details };
    } else {
      newDetails = [...formData.clinicalUseDetails, { useName, details }];
    }
    
    setFormData(prev => ({ ...prev, clinicalUseDetails: newDetails }));
  };

  // Reset form when medicine changes or modal opens
  useEffect(() => {
    if (open) {
      if (medicine) {
        // Editing existing medicine
        setFormData({
          name: medicine.name || '',
          drugClass: medicine.drugClass || '',
          mechanismOfAction: medicine.mechanismOfAction || '',
          clinicalUses: medicine.clinicalUses || [''],
          adverseEffects: medicine.adverseEffects || [''],
          contraindications: medicine.contraindications || [''],
          sexRules: {
            avoidInPregnancy: medicine.sexRules?.avoidInPregnancy || false,
            cautionInBreastfeeding: medicine.sexRules?.cautionInBreastfeeding || false,
            sexSpecificRisks: medicine.sexRules?.sexSpecificRisks || ['']
          },
          symptomMatchRules: {
            primarySymptoms: medicine.symptomMatchRules?.primarySymptoms || [''],
            secondarySymptoms: medicine.symptomMatchRules?.secondarySymptoms || [''],
            inappropriateSymptoms: medicine.symptomMatchRules?.inappropriateSymptoms || ['']
          },
          clinicalUseDetails: medicine.clinicalUseDetails || [],
          medicineAdvantage: medicine.medicineAdvantage || '',
          medicineDisadvantage: (medicine as any).medicineDisadvantage || '',
          comparison: (medicine as any).comparisonData || (medicine as any).comparison || '', // Check both fields
          augmentingMedicines: (medicine as any).augmentingMedicines || '',
          simplifiedStructuredAugmentingMedicines: (medicine as any).simplifiedStructuredAugmentingMedicines || [],
          teachingNotes: medicine.teachingNotes || ''
        });
      } else {
        // Creating new medicine
        setFormData({
          name: '',
          drugClass: '',
          mechanismOfAction: '',
          clinicalUses: [''],
          adverseEffects: [''],
          contraindications: [''],
          sexRules: {
            avoidInPregnancy: false,
            cautionInBreastfeeding: false,
            sexSpecificRisks: ['']
          },
          symptomMatchRules: {
            primarySymptoms: [''],
            secondarySymptoms: [''],
            inappropriateSymptoms: ['']
          },
          clinicalUseDetails: [],
          medicineAdvantage: '',
          medicineDisadvantage: '',
          comparison: '',
          augmentingMedicines: '',
          simplifiedStructuredAugmentingMedicines: [],
          teachingNotes: ''
        });
      }
      setErrors({});
    }
  }, [open, medicine]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    }
    
    if (!formData.drugClass.trim()) {
      newErrors.drugClass = 'Drug class is required';
    }
    
    if (!formData.mechanismOfAction.trim()) {
      newErrors.mechanismOfAction = 'Mechanism of action is required';
    }
    
    if (!formData.medicineDisadvantage.trim()) {
      newErrors.medicineDisadvantage = 'Medicine disadvantage is required';
    }
    
    // Validate simplified structured augmenting medicines (at least one part required)
    if (formData.simplifiedStructuredAugmentingMedicines.length === 0) {
      newErrors.simplifiedStructuredAugmentingMedicines = 'At least one augmenting medicine part is required';
    } else {
      // Check each part has content
      formData.simplifiedStructuredAugmentingMedicines.forEach((part, index) => {
        if (!part.trim()) {
          newErrors[`simplifiedStructuredAugmentingMedicines_${index}`] = 'Part content is required';
        }
      });
    }
    
    if (formData.clinicalUses.filter(use => use.trim()).length === 0) {
      newErrors.clinicalUses = 'At least one clinical use is required';
    }
    
    if (formData.symptomMatchRules.primarySymptoms.filter(sym => sym.trim()).length === 0) {
      newErrors.primarySymptoms = 'At least one primary symptom is required';
    }
    
    return newErrors;
  };

  const handleSubmit = () => {
    console.log("=== MEDICINE EDIT MODAL DEBUG ===");
    console.log("Medicine being edited:", medicine);
    console.log("Form data:", formData);
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      console.log("Validation errors:", newErrors);
      return;
    }
    
    try {
      const medicineData = {
        name: formData.name,
        drugClass: formData.drugClass,
        mechanismOfAction: formData.mechanismOfAction,
        clinicalUses: formData.clinicalUses.filter(use => use.trim()),
        adverseEffects: formData.adverseEffects.filter(effect => effect.trim()),
        contraindications: formData.contraindications.filter(contra => contra.trim()),
        sexRules: {
          avoidInPregnancy: formData.sexRules.avoidInPregnancy,
          cautionInBreastfeeding: formData.sexRules.cautionInBreastfeeding,
          sexSpecificRisks: formData.sexRules.sexSpecificRisks.filter(risk => risk.trim())
        },
        symptomMatchRules: {
          primarySymptoms: formData.symptomMatchRules.primarySymptoms.filter(sym => sym.trim()),
          secondarySymptoms: formData.symptomMatchRules.secondarySymptoms.filter(sym => sym.trim()),
          inappropriateSymptoms: formData.symptomMatchRules.inappropriateSymptoms.filter(sym => sym.trim())
        },
        clinicalUseDetails: formData.clinicalUseDetails,
        medicineAdvantage: formData.medicineAdvantage,
        medicineDisadvantage: formData.medicineDisadvantage,
        comparisonData: formData.comparison, // Save to comparisonData field in schema
        augmentingMedicines: formData.augmentingMedicines, // Legacy field
        simplifiedStructuredAugmentingMedicines: formData.simplifiedStructuredAugmentingMedicines,
        teachingNotes: formData.teachingNotes
      };
      
      console.log("Prepared medicine data:", medicineData);
      
      if (medicine) {
        // Update existing medicine
        console.log("Calling updateMedicine with ID:", medicine.id);
        updateMedicine(medicine.id, medicineData);
      } else {
        // Add new medicine
        console.log("Calling addMedicine");
        addMedicine(medicineData);
      }
      
      console.log("Closing modal and calling onSave");
      onOpenChange(false);
      if (onSave) onSave();
      
      toast({
        title: "Success",
        description: medicine ? "Medicine updated successfully" : "Medicine added successfully"
      });
    } catch (error) {
      console.error("Error saving medicine:", error);
      toast({
        title: "Error",
        description: "Failed to save medicine",
        variant: "destructive"
      });
    }
  };

  const addListItem = (field: string, index: number) => {
    const fieldPath = field.split('.');
    const newData = { ...formData };
    
    let target: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      target = target[fieldPath[i]];
    }
    
    const array = [...target[fieldPath[fieldPath.length - 1]]];
    array.splice(index + 1, 0, '');
    
    let current: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = array;
    
    setFormData(newData);
  };

  const removeListItem = (field: string, index: number) => {
    const fieldPath = field.split('.');
    const newData = { ...formData };
    
    let target: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      target = target[fieldPath[i]];
    }
    
    const array = [...target[fieldPath[fieldPath.length - 1]]];
    array.splice(index, 1);
    
    let current: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = array;
    
    setFormData(newData);
  };

  const updateListItem = (field: string, index: number, value: string) => {
    const fieldPath = field.split('.');
    const newData = { ...formData };
    
    let target: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      target = target[fieldPath[i]];
    }
    
   const array = [...target[fieldPath[fieldPath.length - 1]]];
    array[index] = value;
    
    let current: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = array;
    
    setFormData(newData);
  };

  // Handler for adding symptoms to Clinical Uses
 const handleAddSymptomsToClinicalUse = (selectedSymptoms: string[]) => {
    if (selectedClinicalUseIndex === null) return;
    
    // Parse the current clinical use to extract condition and existing symptoms
   const currentUse = formData.clinicalUses[selectedClinicalUseIndex];
   const match = currentUse.match(/^(.*?)\s*\((.*)\)$/);
   const condition = match ? match[1].trim() : conditionNameInput || 'Condition';
    
    // If no condition name provided and couldn't parse, prompt user
    if (!match && !conditionNameInput) {
     const userInput = prompt('Please enter a condition name for this clinical use:');
      if (userInput) {
        setConditionNameInput(userInput);
        // Create new clinical use with selected symptoms
       const symptomsStr = selectedSymptoms.join(', ');
       const newUse = `${userInput} (${symptomsStr})`;
        updateListItem('clinicalUses', selectedClinicalUseIndex, newUse);
      }
    } else {
      // Extract existing symptoms or start fresh
     const existingSymptoms = match ? match[2].split(',').map(s => s.trim()) : [];
      
      // Combine existing and new symptoms (avoid duplicates)
     const symptomSet = new Set<string>();
      existingSymptoms.forEach(s => symptomSet.add(s));
      selectedSymptoms.forEach(s => symptomSet.add(s));
     const allSymptoms = Array.from(symptomSet);
     const symptomsStr = allSymptoms.join(', ');
     const newUse = `${condition} (${symptomsStr})`;
      
      updateListItem('clinicalUses', selectedClinicalUseIndex, newUse);
    }
    
    // Reset state
    setSelectedClinicalUseIndex(null);
    setConditionNameInput('');
  };

  // Handler for adding symptoms to Primary/Secondary/Inappropriate lists
 const handleAddSymptomsToList = (field: string, selectedSymptoms: string[]) => {
   const fieldPath = field.split('.');
   const newData = { ...formData };
    
    let target: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      target = target[fieldPath[i]];
    }
    
   const array = [...target[fieldPath[fieldPath.length - 1]]];
    // Filter out empty strings and add new symptoms
   const filteredArray = array.filter((s: string) => s.trim() !== '');
   const updatedArray = [...filteredArray, ...selectedSymptoms];
    
    let current: any = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = updatedArray;
    
    setFormData(newData);
  };

 return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="space-y-6 p-4 min-h-full">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="w-5 h-5" /> Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="drugClass">Drug Class *</Label>
                  <Input
                    id="drugClass"
                    value={formData.drugClass}
                    onChange={(e) => setFormData(prev => ({ ...prev, drugClass: e.target.value }))}
                    className={errors.drugClass ? 'border-red-500' : ''}
                  />
                  {errors.drugClass && <p className="text-sm text-red-500">{errors.drugClass}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mechanismOfAction">Mechanism of Action *</Label>
                <Textarea
                  id="mechanismOfAction"
                  value={formData.mechanismOfAction}
                  onChange={(e) => setFormData(prev => ({ ...prev, mechanismOfAction: e.target.value }))}
                  className={errors.mechanismOfAction ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.mechanismOfAction && <p className="text-sm text-red-500">{errors.mechanismOfAction}</p>}
              </div>
            </div>

            {/* Medicine Advantage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Medicine Advantage
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="medicineAdvantage">Advantage (Optional)</Label>
                <Textarea
                  id="medicineAdvantage"
                  value={formData.medicineAdvantage}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicineAdvantage: e.target.value }))}
                  placeholder="Example format:&#10;🔹 Long half-life:&#10;   ➥Fluoxetine has a long half-life.&#10;   ➥This makes it more forgiving if doses are missed."
                  rows={4}
                  className="whitespace-pre-line"
                />
                <p className="text-sm text-muted-foreground">
                  Your formatting, symbols, and spacing will be preserved exactly as entered.
                </p>
              </div>
            </div>

            {/* Medicine Disadvantage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Medicine Disadvantage *
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="medicineDisadvantage">Disadvantage (Required)</Label>
                <Textarea
                  id="medicineDisadvantage"
                  value={formData.medicineDisadvantage}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicineDisadvantage: e.target.value }))}
                  placeholder="Example format:&#10;🔸 Drug interactions:&#10;   ➥Strong CYP2D6 inhibitor, which may increase levels of many medications."
                  rows={4}
                  className={`whitespace-pre-line ${errors.medicineDisadvantage ? 'border-red-500' : ''}`}
                />
                {errors.medicineDisadvantage && <p className="text-sm text-red-500">{errors.medicineDisadvantage}</p>}
                <p className="text-sm text-muted-foreground">
                  Your formatting, symbols, and spacing will be preserved exactly as entered.
                </p>
              </div>
            </div>

            {/* Augmenting Medicines - Simplified Structured */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Augmenting Other Medicines *
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    const newPart = `🔹 For partial response in depression\n   ✩ Fluoxetine + Bupropion\n  Details:\n   ➥Bupropion increases dopamine and norepinephrine\n   ➥Helps improve energy and reduce sexual side effects`;
                    setFormData(prev => ({
                      ...prev,
                      simplifiedStructuredAugmentingMedicines: [...prev.simplifiedStructuredAugmentingMedicines, newPart]
                    }));
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </Button>
              </div>
              
              {errors.simplifiedStructuredAugmentingMedicines && (
                <p className="text-sm text-red-500">{errors.simplifiedStructuredAugmentingMedicines}</p>
              )}
              
              <p className="text-sm text-muted-foreground">
                Your formatting, symbols, and spacing will be preserved exactly as entered.
              </p>
              <p className="text-sm text-muted-foreground bg-purple-50 p-3 rounded border border-purple-200">
                <strong>Example format:</strong><br/>
                🔹 For partial response in depression<br/>
                   ✩ Fluoxetine + Bupropion<br/>
                  Details:<br/>
                   ➥Bupropion increases dopamine and norepinephrine<br/>
                   ➥Helps improve energy and reduce sexual side effects
              </p>

              {/* Simplified Structured Parts */}
              <div className="space-y-4">
                {formData.simplifiedStructuredAugmentingMedicines.map((part: string, index: number) => (
                  <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50/50 relative">
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="text-xs text-purple-600 font-medium self-center mr-2">Entry {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = formData.simplifiedStructuredAugmentingMedicines.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, simplifiedStructuredAugmentingMedicines: updated }));
                        }}
                        className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`part_${index}`}>
                        Augmenting Medicine Entry {index + 1} *
                      </Label>
                      <Textarea
                        id={`part_${index}`}
                        value={part}
                        onChange={(e) => {
                          const updated = [...formData.simplifiedStructuredAugmentingMedicines];
                          updated[index] = e.target.value;
                          setFormData(prev => ({ ...prev, simplifiedStructuredAugmentingMedicines: updated }));
                        }}
                        placeholder={`🔹 For [therapeutic context]\n   ✩ [Medicine A] + [Medicine B]\n  Details:\n   ➥[Detail 1]\n   ➥[Detail 2]`}
                        rows={5}
                        className={`whitespace-pre-line ${errors[`simplifiedStructuredAugmentingMedicines_${index}`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`simplifiedStructuredAugmentingMedicines_${index}`] && (
                        <p className="text-xs text-red-500">{errors[`simplifiedStructuredAugmentingMedicines_${index}`]}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {formData.simplifiedStructuredAugmentingMedicines.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/30">
                    <Pill className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No parts added yet. Click "Add Part" to begin documenting augmenting combinations.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                Comparison
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="comparison">Comparison (Optional)</Label>
                <Textarea
                  id="comparison"
                  value={formData.comparison || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, comparison: e.target.value }))}
                  placeholder="Example format:&#10;🔹 Compared to SSRIs:&#10;   ➥More effective for atypical depression&#10;   ➥Better tolerated in elderly patients"
                  rows={4}
                  className="whitespace-pre-line"
                />
                <p className="text-sm text-muted-foreground">
                  Your formatting, symbols, and spacing will be preserved exactly as entered.
                </p>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Clinical Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Clinical Uses *</Label>
                  <p className="text-sm text-muted-foreground">
                    Enter clinical uses with associated symptoms. Format: "Condition (Symptom1, Symptom2, Symptom3)"
                  </p>
                  {formData.clinicalUses.map((use, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={use}
                        onChange={(e) => updateListItem('clinicalUses', index, e.target.value)}
                        placeholder="e.g., UTI (Dysuria, Urgency, Frequency)"
                        className={errors.clinicalUses && index === 0 ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClinicalUseIndex(index);
                          setIsClinicalUseSymptomSelectorOpen(true);
                        }}
                        className="h-10 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Symptom
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addListItem('clinicalUses', index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {formData.clinicalUses.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeListItem('clinicalUses', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {errors.clinicalUses && <p className="text-sm text-red-500">{errors.clinicalUses}</p>}
                </div>
                
                {/* Clinical Use Details Editor */}
                <div className="space-y-3 mt-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">Clinical Use Details</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add detailed explanations for each clinical use. Explain: Mechanism relevance, Symptom relief pattern, Safety advantage, OPD suitability.
                  </p>
                  
                  {formData.clinicalUses.filter(u => u.trim()).map((use, index) => {
                    const detail = getClinicalUseDetail(use);
                    const hasDetails = !!detail?.details;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={hasDetails ? "default" : "outline"} className="text-xs">
                              {hasDetails ? <CheckCircle className="w-3 h-3 mr-1" /> : <Info className="w-3 h-3 mr-1" />}
                              {use.length > 50 ? use.substring(0, 50) + '...' : use}
                            </Badge>
                            {hasDetails && (
                              <span className="text-xs text-green-600 font-medium">Has details</span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUseIndex(index);
                              setCurrentDetailText(detail?.details || '');
                            }}
                            className="h-8 text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {hasDetails ? 'Edit' : 'Add'} Details
                          </Button>
                        </div>
                        
                        {editingUseIndex === index && (
                          <div className="space-y-2 p-3 bg-white border rounded-md">
                            <Label htmlFor={`detail-${index}`}>Clinical Use Details for "{use}"</Label>
                            <Textarea
                              id={`detail-${index}`}
                              value={currentDetailText}
                              onChange={(e) => setCurrentDetailText(e.target.value)}
                              placeholder="Explain: Why this medicine for this condition? How does it work? Safety benefits? OPD practicality?"
                              rows={4}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  updateClinicalUseDetail(use, currentDetailText);
                                  setEditingUseIndex(null);
                                  setCurrentDetailText('');
                                }}
                              >
                                Save Details
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUseIndex(null);
                                  setCurrentDetailText('');
                                }}
                              >
                                Cancel
                              </Button>
                              {hasDetails && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    updateClinicalUseDetail(use, '');
                                    setEditingUseIndex(null);
                                    setCurrentDetailText('');
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Example: "Reduces inflammation and pain without gastric irritation, suitable for children and OPD use."
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-2">
                  <Label>Adverse Effects</Label>
                  {formData.adverseEffects.map((effect, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={effect}
                        onChange={(e) => updateListItem('adverseEffects', index, e.target.value)}
                        placeholder="Enter adverse effect"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addListItem('adverseEffects', index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {formData.adverseEffects.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeListItem('adverseEffects', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label>Contraindications</Label>
                  {formData.contraindications.map((contra, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={contra}
                        onChange={(e) => updateListItem('contraindications', index, e.target.value)}
                        placeholder="Enter contraindication"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addListItem('contraindications', index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {formData.contraindications.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeListItem('contraindications', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Safety Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Safety Rules</h3>
              
              <div className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Sex Rules</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.sexRules.avoidInPregnancy}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          sexRules: { ...prev.sexRules, avoidInPregnancy: checked }
                        }))}
                      />
                      <Label>Avoid in Pregnancy</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.sexRules.cautionInBreastfeeding}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          sexRules: { ...prev.sexRules, cautionInBreastfeeding: checked }
                        }))}
                      />
                      <Label>Caution in Breastfeeding</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Sex-Specific Risks</Label>
                      {formData.sexRules.sexSpecificRisks.map((risk, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={risk}
                            onChange={(e) => updateListItem('sexRules.sexSpecificRisks', index, e.target.value)}
                            placeholder="Enter sex-specific risk"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => addListItem('sexRules.sexSpecificRisks', index)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          {formData.sexRules.sexSpecificRisks.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeListItem('sexRules.sexSpecificRisks', index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Symptom Matching Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Symptom Matching Rules
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Symptoms (Required) *</Label>
                  <p className="text-sm text-muted-foreground">
                    Symptoms that indicate this medicine is indicated. These will be matched against patient symptoms.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                    size="sm"
                      onClick={() => setIsPrimarySymptomSelectorOpen(true)}
                      className="h-8 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Symptom from Database
                    </Button>
                  </div>
                  {formData.symptomMatchRules.primarySymptoms.map((symptom, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={symptom}
                        onChange={(e) => updateListItem('symptomMatchRules.primarySymptoms', index, e.target.value)}
                        placeholder="Enter primary symptom"
                        className={errors.primarySymptoms && index === 0 ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                      size="icon"
                        onClick={() => addListItem('symptomMatchRules.primarySymptoms', index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {formData.symptomMatchRules.primarySymptoms.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                        size="icon"
                          onClick={() => removeListItem('symptomMatchRules.primarySymptoms', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {errors.primarySymptoms && <p className="text-sm text-red-500">{errors.primarySymptoms}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Secondary Symptoms (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Symptoms that this medicine may help with but are not primary indications.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                   size="sm"
                      onClick={() => setIsSecondarySymptomSelectorOpen(true)}
                      className="h-8 text-xs bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Symptom from Database
                    </Button>
                  </div>
                  {formData.symptomMatchRules.secondarySymptoms.map((symptom, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={symptom}
                        onChange={(e) => updateListItem('symptomMatchRules.secondarySymptoms', index, e.target.value)}
                        placeholder="Enter secondary symptom"
                      />
                      <Button
                        type="button"
                        variant="outline"
                     size="icon"
                        onClick={() => addListItem('symptomMatchRules.secondarySymptoms', index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {formData.symptomMatchRules.secondarySymptoms.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                       size="icon"
                          onClick={() => removeListItem('symptomMatchRules.secondarySymptoms', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label>Inappropriate Symptoms (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Symptoms for which this medicine would be inappropriate or contraindicated.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                  size="sm"
                      onClick={() => setIsInappropriateSymptomSelectorOpen(true)}
                      className="h-8 text-xs bg-red-50 hover:bg-red-100 border-red-200"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Symptom from Database
                    </Button>
                  </div>
                  {formData.symptomMatchRules.inappropriateSymptoms.map((symptom, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={symptom}
                        onChange={(e) => updateListItem('symptomMatchRules.inappropriateSymptoms', index, e.target.value)}
                        placeholder="Enter inappropriate symptom"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addListItem('symptomMatchRules.inappropriateSymptoms', index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {formData.symptomMatchRules.inappropriateSymptoms.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeListItem('symptomMatchRules.inappropriateSymptoms', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              
              <div className="space-y-2">
                <Label>Teaching Notes (Optional)</Label>
                <Textarea
                  value={formData.teachingNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, teachingNotes: e.target.value }))}
                  placeholder="Enter teaching notes..."
                  rows={4}
                />
              </div>
            </div>

            {/* Symptom Selector Dialogs */}
            <SymptomSelectorDialog
              isOpen={isClinicalUseSymptomSelectorOpen}
              onOpenChange={setIsClinicalUseSymptomSelectorOpen}
              causes={causes}
              onSymptomSelect={handleAddSymptomsToClinicalUse}
              title="Add Symptoms to Clinical Use"
              description="First select a condition, then select symptoms to add to this clinical use"
              allowMultipleConditions={false}
            />
            
            <SymptomSelectorDialog
              isOpen={isPrimarySymptomSelectorOpen}
              onOpenChange={setIsPrimarySymptomSelectorOpen}
              causes={causes}
              onSymptomSelect={(selected) => handleAddSymptomsToList('symptomMatchRules.primarySymptoms', selected)}
              title="Add Primary Symptoms from Database"
              description="Select symptoms to add to the Primary Symptoms list"
              showAllSymptomsOnly={true}
            />
            
            <SymptomSelectorDialog
              isOpen={isSecondarySymptomSelectorOpen}
              onOpenChange={setIsSecondarySymptomSelectorOpen}
              causes={causes}
              onSymptomSelect={(selected) => handleAddSymptomsToList('symptomMatchRules.secondarySymptoms', selected)}
              title="Add Secondary Symptoms from Database"
              description="Select symptoms to add to the Secondary Symptoms list"
              showAllSymptomsOnly={true}
            />
            
            <SymptomSelectorDialog
              isOpen={isInappropriateSymptomSelectorOpen}
              onOpenChange={setIsInappropriateSymptomSelectorOpen}
              causes={causes}
              onSymptomSelect={(selected) => handleAddSymptomsToList('symptomMatchRules.inappropriateSymptoms', selected)}
              title="Add Inappropriate Symptoms from Database"
              description="Select symptoms to add to the Inappropriate Symptoms list"
              showAllSymptomsOnly={true}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {medicine ? 'Update Medicine' : 'Add Medicine'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}