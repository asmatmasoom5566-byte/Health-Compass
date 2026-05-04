import { useEffect, useState } from 'react';
import { Cause, Symptom } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Palette, Star, XCircle, Activity, Trash2, ShieldOff, AlertTriangle } from "lucide-react";
import PathognomonicSymptomsEditor from './PathognomonicSymptomsEditor';
import { SymptomSelectorDialog } from './SymptomSelectorDialog';

const THEMES = ["teal", "blue", "green", "red", "purple", "orange"];

interface FormData {
  name: string;
  symptoms: Array<string | Symptom>; // Support both legacy strings and new object format
  pathognomonicSymptoms: string;
  cardinalSymptoms: string;
  treatment: string;
  labTests: Array<{ testName: string; testDetails: string }>;

  // First Age Field - Common Age Range (no rule type - always soft)
  commonAgeRule: {
    min: string;
    max: string;
  };
  
  // Second Age Field - Final Age Range
  finalAgeRule: {
    min: string;
    max: string;
    ruleType: string;
  };
  
  // Legacy: Keep for backward compatibility
  ageRule: {
    min: string;
    max: string;
    ruleType: string;
  };
  
  sexRule: 'male' | 'female' | 'both';
  
  // Female-to-Male Ratio for gender-based scoring
  femaleToMaleRatio: {
    female: string;
    male: string;
  };
  
  // First Duration Field - Common Duration Range
  commonDurationCriteria: {
    startDuration: string;
    endDuration: string;
    unit: string;
    ruleType: string;
  };
  
  // Second Duration Field - Final Duration Range
  finalDurationCriteria: {
    startDuration: string;
    endDuration: string;
    unit: string;
    ruleType: string;
  };
  
  // Legacy duration rule
  durationRule: {
    start: string;
    end: string;
    unit: string;
    ruleType: string;
  };
  symptomDetails: Record<string, string>;
  prevalence: 'high' | 'moderate' | 'low';
}

interface CauseEditModalProps {
  cause: Cause | null;
  causes: Cause[]; // Add causes prop for symptom selection
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Cause>) => void;
}

export function CauseEditModal({ cause, causes, isOpen, onClose, onSave }: CauseEditModalProps) {
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState("teal");
  
  // State for managing symptom lists
 const [pathognomonicList, setPathognomonicList] = useState<string[]>([]);
 const [cardinalList, setCardinalList] = useState<string[]>([]);
 const [exclusionList, setExclusionList] = useState<string[]>([]);
 const [riskFactorsList, setRiskFactorsList] = useState<string[]>([]);
 const [customPathognomonicInput, setCustomPathognomonicInput] = useState('');
 const [customCardinalInput, setCustomCardinalInput] = useState('');
 const [customExclusionInput, setCustomExclusionInput] = useState('');
 const [customRiskFactorsInput, setCustomRiskFactorsInput] = useState('');
  
  // State for symptom selector dialog
 const [isSymptomSelectorOpen, setIsSymptomSelectorOpen] = useState(false);
  
  // Handler for symptom selection
 const handleAddSymptomsFromDatabase = (selectedSymptoms: string[]) => {
    // Convert selected symptoms to the Symptom object format
  const newSymptomObjects = selectedSymptoms.map(symptom => ({ typicalSymptom: symptom }));
    
    // Add to existing symptoms
    setFormData(prev => ({
      ...prev,
    symptoms: [...prev.symptoms, ...newSymptomObjects]
    }));
  };
  
 const [formData, setFormData] = useState<FormData>({
    name: "",
    symptoms: [],
    pathognomonicSymptoms: "",
    cardinalSymptoms: "",
    treatment: "",
    labTests: [],
    commonAgeRule: { min: '', max: '' },
    finalAgeRule: { min: '', max: '', ruleType: 'none' },
    ageRule: { min: '', max: '', ruleType: 'none' },
    sexRule: 'both',
    femaleToMaleRatio: { female: '', male: '' },
    commonDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
    finalDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
    durationRule: { start: '', end: '', unit: 'days', ruleType: 'none' },
    symptomDetails: {},
    prevalence: 'moderate'
  });

  useEffect(() => {
    const savedFontSize = localStorage.getItem('app-font-size');
    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) setTheme(savedTheme);
  }, [isOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
    localStorage.setItem('app-font-size', fontSize.toString());
    window.dispatchEvent(new Event('app-style-update'));
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach(t => root.classList.remove(`theme-${t}`));
    if (theme !== "teal") {
      root.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('app-theme', theme);
    window.dispatchEvent(new Event('app-style-update'));
  }, [theme]);

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  useEffect(() => {
    if (cause) {
      // Parse pathognomonic symptoms to array
      let pathognomonicArray: string[] = [];
      const pathoSymptoms = cause.pathognomonicSymptoms as any;
      if (Array.isArray(pathoSymptoms)) {
        pathognomonicArray = pathoSymptoms;
      } else if (pathoSymptoms && typeof pathoSymptoms === 'string') {
        pathognomonicArray = pathoSymptoms.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      
      // Parse cardinal symptoms to array
      let cardinalArray: string[] = [];
      const cardSymptoms = cause.cardinalSymptoms as any;
      if (Array.isArray(cardSymptoms)) {
        cardinalArray = cardSymptoms;
      } else if (cardSymptoms && typeof cardSymptoms === 'string') {
        cardinalArray = cardSymptoms.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      
      // Parse exclusion features to array
      let exclusionArray: string[] = [];
      const exclFeatures = cause.exclusionFeatures as any;
      if (Array.isArray(exclFeatures)) {
        exclusionArray = exclFeatures;
      } else if (exclFeatures && typeof exclFeatures === 'string') {
        exclusionArray = exclFeatures.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      
      // Parse risk factors to array
      let riskFactorsArray: string[] = [];
      const riskFactors = cause.riskFactors as any;
      if (Array.isArray(riskFactors)) {
        riskFactorsArray = riskFactors;
      } else if (riskFactors && typeof riskFactors === 'string') {
        riskFactorsArray = riskFactors.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      
      setPathognomonicList(pathognomonicArray);
      setCardinalList(cardinalArray);
      setExclusionList(exclusionArray);
      setRiskFactorsList(riskFactorsArray);
      
      setFormData({
        name: cause.name,
        symptoms: cause.symptoms || [], // Keep as array (can be string[] or SymptomWithSynonyms[])
        pathognomonicSymptoms: pathognomonicArray.join(", "),
        cardinalSymptoms: cardinalArray.join(", "),
        treatment: cause.treatment || "",
        labTests: cause.labTests || [],
        commonAgeRule: cause.commonAgeRule ? { 
          min: cause.commonAgeRule.min?.toString() ?? '', 
          max: cause.commonAgeRule.max?.toString() ?? ''
        } : { min: '', max: '' },
        finalAgeRule: cause.finalAgeRule ? { 
          min: cause.finalAgeRule.min?.toString() ?? '', 
          max: cause.finalAgeRule.max?.toString() ?? '', 
          ruleType: cause.finalAgeRule.ruleType ?? 'none'
        } : { min: '', max: '', ruleType: 'none' },
        ageRule: cause.ageRule ? { 
          min: cause.ageRule.min?.toString() ?? '', 
          max: cause.ageRule.max?.toString() ?? '', 
          ruleType: cause.ageRule.ruleType ?? 'none'
        } : { min: '', max: '', ruleType: 'none' },
        sexRule: cause.sexRule ?? 'both',
        femaleToMaleRatio: cause.femaleToMaleRatio ? { 
          female: cause.femaleToMaleRatio.female?.toString() ?? '', 
          male: cause.femaleToMaleRatio.male?.toString() ?? ''
        } : { female: '', male: '' },
        commonDurationCriteria: cause.commonDurationCriteria ? { 
          startDuration: cause.commonDurationCriteria.startDuration?.toString() ?? '', 
          endDuration: cause.commonDurationCriteria.endDuration?.toString() ?? '', 
          unit: cause.commonDurationCriteria.unit ?? 'days',
          ruleType: cause.commonDurationCriteria.ruleType ?? 'none'
        } : { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
        finalDurationCriteria: cause.finalDurationCriteria ? { 
          startDuration: cause.finalDurationCriteria.startDuration?.toString() ?? '', 
          endDuration: cause.finalDurationCriteria.endDuration?.toString() ?? '', 
          unit: cause.finalDurationCriteria.unit ?? 'days',
          ruleType: cause.finalDurationCriteria.ruleType ?? 'none'
        } : { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
        durationRule: cause.durationRule ? {
          start: cause.durationRule.start?.toString() ?? '',
          end: cause.durationRule.end?.toString() ?? '',
          unit: cause.durationRule.unit ?? 'days',
          ruleType: cause.durationRule.ruleType ?? 'none'
        } : { start: '', end: '', unit: 'days', ruleType: 'none' },
        symptomDetails: cause.symptomDetails || {},
        prevalence: cause.prevalence || 'moderate'
      });
    } else {
      setPathognomonicList([]);
      setCardinalList([]);
      setExclusionList([]);
      setCustomPathognomonicInput('');
      setCustomCardinalInput('');
      setCustomExclusionInput('');
      
      setFormData({
        name: "",
        symptoms: [],
        pathognomonicSymptoms: "",
        cardinalSymptoms: "",
        treatment: "",
        labTests: [],
        commonAgeRule: { min: '', max: '' },
        finalAgeRule: { min: '', max: '', ruleType: 'none' },
        ageRule: { min: '', max: '', ruleType: 'none' },
        sexRule: 'both',
        femaleToMaleRatio: { female: '', male: '' },
        commonDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
        finalDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
        durationRule: { start: '', end: '', unit: 'days', ruleType: 'none' },
        symptomDetails: {},
        prevalence: 'moderate'
      });
    }
  }, [cause, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cause) return;

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Condition name is required');
      return;
    }

    // Validate Pathognomonic Symptoms - must have at least one
    if (pathognomonicList.length === 0) {
      alert('At least one Pathognomonic Symptom is required. These are highly specific symptoms that virtually confirm the diagnosis.');
      return;
    }

    // Filter out empty typical symptoms
    const symptomsList = formData.symptoms.filter(symptom => {
      if (typeof symptom === 'string') {
        return symptom.trim() !== '';
      } else {
        return symptom.typicalSymptom.trim() !== '';
      }
    });
    
    onSave(cause!.id, {
      name: formData.name,
      symptoms: symptomsList,
      pathognomonicSymptoms: pathognomonicList,
      cardinalSymptoms: cardinalList,
      exclusionFeatures: exclusionList,
      riskFactors: riskFactorsList,
      treatment: formData.treatment,
      labTests: formData.labTests,
      commonAgeRule: formData.commonAgeRule.min !== '' || formData.commonAgeRule.max !== '' ? {
        min: formData.commonAgeRule.min === '' ? undefined : Number(formData.commonAgeRule.min),
        max: formData.commonAgeRule.max === '' ? undefined : Number(formData.commonAgeRule.max)
      } : undefined,
      finalAgeRule: formData.finalAgeRule.min !== '' || formData.finalAgeRule.max !== '' || formData.finalAgeRule.ruleType !== 'none' ? {
        min: formData.finalAgeRule.min === '' ? undefined : Number(formData.finalAgeRule.min),
        max: formData.finalAgeRule.max === '' ? undefined : Number(formData.finalAgeRule.max),
        ruleType: formData.finalAgeRule.ruleType === 'none' ? undefined : formData.finalAgeRule.ruleType as 'soft' | 'hard'
      } : undefined,
      ageRule: formData.ageRule.min !== '' || formData.ageRule.max !== '' || formData.ageRule.ruleType !== 'none' ? {
        min: formData.ageRule.min === '' ? undefined : Number(formData.ageRule.min),
        max: formData.ageRule.max === '' ? undefined : Number(formData.ageRule.max),
        ruleType: formData.ageRule.ruleType === 'none' ? undefined : formData.ageRule.ruleType as 'soft' | 'hard'
      } : undefined,
      sexRule: formData.sexRule === 'both' ? undefined : formData.sexRule as 'male' | 'female' | 'both',
      femaleToMaleRatio: formData.femaleToMaleRatio.female !== '' || formData.femaleToMaleRatio.male !== '' ? {
        female: formData.femaleToMaleRatio.female === '' ? undefined : Number(formData.femaleToMaleRatio.female),
        male: formData.femaleToMaleRatio.male === '' ? undefined : Number(formData.femaleToMaleRatio.male)
      } : undefined,
      commonDurationCriteria: formData.commonDurationCriteria.startDuration !== '' || formData.commonDurationCriteria.endDuration !== '' || formData.commonDurationCriteria.unit !== 'days' ? {
        startDuration: formData.commonDurationCriteria.startDuration === '' ? undefined : Number(formData.commonDurationCriteria.startDuration),
        endDuration: formData.commonDurationCriteria.endDuration === '' ? undefined : Number(formData.commonDurationCriteria.endDuration),
        unit: formData.commonDurationCriteria.unit === 'days' ? undefined : formData.commonDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years'
      } : undefined,
      finalDurationCriteria: formData.finalDurationCriteria.startDuration !== '' || formData.finalDurationCriteria.endDuration !== '' || formData.finalDurationCriteria.unit !== 'days' || formData.finalDurationCriteria.ruleType !== 'none' ? {
        startDuration: formData.finalDurationCriteria.startDuration === '' ? undefined : Number(formData.finalDurationCriteria.startDuration),
        endDuration: formData.finalDurationCriteria.endDuration === '' ? undefined : Number(formData.finalDurationCriteria.endDuration),
        unit: formData.finalDurationCriteria.unit === 'days' ? undefined : formData.finalDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years',
        ruleType: formData.finalDurationCriteria.ruleType === 'none' ? undefined : formData.finalDurationCriteria.ruleType as 'soft' | 'hard'
      } : undefined,
      symptomDetails: formData.symptomDetails,
      prevalence: formData.prevalence,
      lastEditTime: new Date().toISOString() // Set timestamp on manual edit
    });
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Condition name is required');
      return;
    }
    
    // Validate Pathognomonic Symptoms - must have at least one
    if (pathognomonicList.length === 0) {
      alert('At least one Pathognomonic Symptom is required. These are highly specific symptoms that virtually confirm the diagnosis.');
      return;
    }
    
    // Filter out empty typical symptoms
    const symptomsList = formData.symptoms.filter(symptom => {
      if (typeof symptom === 'string') {
        return symptom.trim() !== '';
      } else {
        return symptom.typicalSymptom.trim() !== '';
      }
    });
    
    onSave("", {
      name: formData.name,
      symptoms: symptomsList,
      pathognomonicSymptoms: pathognomonicList,
      cardinalSymptoms: cardinalList,
      exclusionFeatures: exclusionList,
      riskFactors: riskFactorsList,
      treatment: formData.treatment,
      labTests: formData.labTests,
      commonAgeRule: formData.commonAgeRule.min !== '' || formData.commonAgeRule.max !== '' ? {
        min: formData.commonAgeRule.min === '' ? undefined : Number(formData.commonAgeRule.min),
        max: formData.commonAgeRule.max === '' ? undefined : Number(formData.commonAgeRule.max)
      } : undefined,
      finalAgeRule: formData.finalAgeRule.min !== '' || formData.finalAgeRule.max !== '' || formData.finalAgeRule.ruleType !== 'none' ? {
        min: formData.finalAgeRule.min === '' ? undefined : Number(formData.finalAgeRule.min),
        max: formData.finalAgeRule.max === '' ? undefined : Number(formData.finalAgeRule.max),
        ruleType: formData.finalAgeRule.ruleType === 'none' ? undefined : formData.finalAgeRule.ruleType as 'soft' | 'hard'
      } : undefined,
      ageRule: formData.ageRule.min !== '' || formData.ageRule.max !== '' || formData.ageRule.ruleType !== 'none' ? {
        min: formData.ageRule.min === '' ? undefined : Number(formData.ageRule.min),
        max: formData.ageRule.max === '' ? undefined : Number(formData.ageRule.max),
        ruleType: formData.ageRule.ruleType === 'none' ? undefined : formData.ageRule.ruleType as 'soft' | 'hard'
      } : undefined,
      sexRule: formData.sexRule === 'both' ? undefined : formData.sexRule as 'male' | 'female' | 'both',
      femaleToMaleRatio: formData.femaleToMaleRatio.female !== '' || formData.femaleToMaleRatio.male !== '' ? {
        female: formData.femaleToMaleRatio.female === '' ? undefined : Number(formData.femaleToMaleRatio.female),
        male: formData.femaleToMaleRatio.male === '' ? undefined : Number(formData.femaleToMaleRatio.male)
      } : undefined,
      commonDurationCriteria: formData.commonDurationCriteria.startDuration !== '' || formData.commonDurationCriteria.endDuration !== '' || formData.commonDurationCriteria.unit !== 'days' ? {
        startDuration: formData.commonDurationCriteria.startDuration === '' ? undefined : Number(formData.commonDurationCriteria.startDuration),
        endDuration: formData.commonDurationCriteria.endDuration === '' ? undefined : Number(formData.commonDurationCriteria.endDuration),
        unit: formData.commonDurationCriteria.unit === 'days' ? undefined : formData.commonDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years'
      } : undefined,
      finalDurationCriteria: formData.finalDurationCriteria.startDuration !== '' || formData.finalDurationCriteria.endDuration !== '' || formData.finalDurationCriteria.unit !== 'days' || formData.finalDurationCriteria.ruleType !== 'none' ? {
        startDuration: formData.finalDurationCriteria.startDuration === '' ? undefined : Number(formData.finalDurationCriteria.startDuration),
        endDuration: formData.finalDurationCriteria.endDuration === '' ? undefined : Number(formData.finalDurationCriteria.endDuration),
        unit: formData.finalDurationCriteria.unit === 'days' ? undefined : formData.finalDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years',
        ruleType: formData.finalDurationCriteria.ruleType === 'none' ? undefined : formData.finalDurationCriteria.ruleType as 'soft' | 'hard'
      } : undefined,
      symptomDetails: formData.symptomDetails,
      lastEditTime: new Date().toISOString() // Set timestamp on manual edit (create new)
    });
    onClose();
  };

  // Helper function to extract primary typical symptoms
  const getPrimaryTypicalSymptoms = () => {
    return formData.symptoms
      .map(symptom => typeof symptom === 'string' ? symptom : symptom.typicalSymptom)
      .filter(s => s.trim() !== '');
  };

  // Helper function to check if a symptom is already used in another category
  // Implements mutual exclusion with bidirectional partial matching
  const isSymptomUsedInOtherCategory = (
    symptom: string,
    excludePathognomonic: boolean = false,
    excludeCardinal: boolean = false,
    excludeExclusion: boolean = false,
    excludeRiskFactors: boolean = false
  ): boolean => {
    const symptomLower = symptom.toLowerCase().trim();
    
    // Check against pathognomonic symptoms
    if (!excludePathognomonic && pathognomonicList.some(p => {
      const pLower = p.toLowerCase().trim();
      return pLower.includes(symptomLower) || symptomLower.includes(pLower);
    })) {
      return true;
    }
    
    // Check against cardinal symptoms
    if (!excludeCardinal && cardinalList.some(c => {
      const cLower = c.toLowerCase().trim();
      return cLower.includes(symptomLower) || symptomLower.includes(cLower);
    })) {
      return true;
    }
    
    // Check against exclusion features
    if (!excludeExclusion && exclusionList.some(e => {
      const eLower = e.toLowerCase().trim();
      return eLower.includes(symptomLower) || symptomLower.includes(eLower);
    })) {
      return true;
    }
    
    // Check against risk factors
    if (!excludeRiskFactors && riskFactorsList.some(r => {
      const rLower = r.toLowerCase().trim();
      return rLower.includes(symptomLower) || symptomLower.includes(rLower);
    })) {
      return true;
    }
    
    return false;
  };

  // Pathognomonic Symptoms management functions
  const addPathognomonic = (symptom: string) => {
    // Check if symptom is already in any category (mutual exclusion)
    if (cardinalList.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      alert('This symptom is already assigned as a Cardinal Symptom and cannot be added to Pathognomonic Symptoms.');
      return;
    }
    
    if (symptom.trim() && !pathognomonicList.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      const updated = [...pathognomonicList, symptom.trim()];
      setPathognomonicList(updated);
    }
  };

  const removePathognomonic = (symptom: string) => {
    const updated = pathognomonicList.filter(s => 
      !s.toLowerCase().includes(symptom.toLowerCase()) &&
      !symptom.toLowerCase().includes(s.toLowerCase())
    );
    setPathognomonicList(updated);
  };

  const addCustomPathognomonic = () => {
    if (customPathognomonicInput.trim()) {
      addPathognomonic(customPathognomonicInput.trim());
      setCustomPathognomonicInput('');
    }
  };

  // Cardinal Symptoms management functions
  const addCardinal = (symptom: string) => {
    // Check if symptom is already in any category (mutual exclusion)
    if (pathognomonicList.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      alert('This symptom is already assigned as a Pathognomonic Symptom and cannot be added to Cardinal Symptoms.');
      return;
    }
    
    if (symptom.trim() && !cardinalList.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      const updated = [...cardinalList, symptom.trim()];
      setCardinalList(updated);
    }
  };

  const removeCardinal = (symptom: string) => {
    const updated = cardinalList.filter(s => 
      !s.toLowerCase().includes(symptom.toLowerCase()) &&
      !symptom.toLowerCase().includes(s.toLowerCase())
    );
    setCardinalList(updated);
  };

  const addCustomCardinal = () => {
    if (customCardinalInput.trim()) {
      addCardinal(customCardinalInput.trim());
      setCustomCardinalInput('');
    }
  };

  // Exclusion Features management functions
  const addExclusion = (symptom: string) => {
    if (symptom.trim() && !exclusionList.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      const updated = [...exclusionList, symptom.trim()];
      setExclusionList(updated);
    }
  };

  const removeExclusion = (symptom: string) => {
    const updated = exclusionList.filter(s => 
      !s.toLowerCase().includes(symptom.toLowerCase()) &&
      !symptom.toLowerCase().includes(s.toLowerCase())
    );
    setExclusionList(updated);
  };

  const addCustomExclusion = () => {
    if (customExclusionInput.trim()) {
      addExclusion(customExclusionInput.trim());
      setCustomExclusionInput('');
    }
  };

  // Risk Factors management functions
  const addRiskFactor = (symptom: string) => {
    if (symptom.trim() && !riskFactorsList.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      const updated = [...riskFactorsList, symptom.trim()];
      setRiskFactorsList(updated);
    }
  };

  const removeRiskFactor = (symptom: string) => {
    const updated = riskFactorsList.filter(s => 
      !s.toLowerCase().includes(symptom.toLowerCase()) &&
      !symptom.toLowerCase().includes(s.toLowerCase())
    );
    setRiskFactorsList(updated);
  };

  const addCustomRiskFactor = () => {
    if (customRiskFactorsInput.trim()) {
      addRiskFactor(customRiskFactorsInput.trim());
      setCustomRiskFactorsInput('');
    }
  };

  const formAction = cause ? handleSubmit : handleCreate;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-white/30 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-8 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-t-xl">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{cause ? "Edit Condition" : "Add Condition"}</DialogTitle>
          <div className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-2 rounded-full border border-white/30 shadow-sm">
            <div className="flex items-center gap-1 border-r pr-2 border-white/30">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 rounded-full bg-white/50 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105" 
                onClick={() => setFontSize(s => Math.max(12, s - 1))}
                type="button"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-bold w-4 text-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full py-0.5">{fontSize}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 rounded-full bg-white/50 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105" 
                onClick={() => setFontSize(s => Math.min(20, s + 1))}
                type="button"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-primary bg-white/50 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105" 
              onClick={cycleTheme}
              type="button"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <form onSubmit={formAction} className="space-y-4 pt-4 px-1 pb-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Condition Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            {/* Disease Prevalence Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-prevalence" className="text-sm font-medium text-gray-700 dark:text-gray-300">Disease Prevalence</Label>
              <Select
                value={formData.prevalence}
                onValueChange={(value: 'high' | 'moderate' | 'low') => setFormData({...formData, prevalence: value})}
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
            
            {/* Supportive Features - Single Column Text Display */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-typical-symptoms" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supportive Features
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSymptomSelectorOpen(true)}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Symptom from Database
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                      symptoms: [...prev.symptoms, { typicalSymptom: '' }]
                      }));
                    }}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Custom Symptom
                  </Button>
                </div>
              </div>
              
              {formData.symptoms.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No supportive features added yet. Click "Add Supportive Feature" to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    id="edit-typical-symptoms-text"
                    value={formData.symptoms
                      .map(s => typeof s === 'string' ? s : s.typicalSymptom)
                      .filter(Boolean)
                      .join('\n')
                    }
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').map(line => line.trim()).filter(line => line !== '');
                      const newSymptoms = lines.map(line => ({ typicalSymptom: line }));
                      setFormData({ ...formData, symptoms: newSymptoms });
                    }}
                    placeholder="Enter each supportive feature on a new line..."
                    className="min-h-[200px] font-mono text-sm"
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter each supportive feature on a new line. Empty lines will be ignored.
                  </p>
                </div>
              )}
            </div>

            {/* Pathognomonic Symptoms - Structured Management */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-red-500" />
                <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Key Features</Label>
                <Badge variant="secondary" className="text-xs">{pathognomonicList.length} assigned</Badge>
              </div>

              {/* Current Pathognomonic Symptoms */}
              {pathognomonicList.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex flex-wrap gap-2">
                    {pathognomonicList.map((symptom, index) => {
                      // Handle both string and object formats
                      const symptomText = typeof symptom === 'string' ? symptom : symptom.typicalSymptom;
                      return (
                        <Badge 
                          key={index} 
                          variant="default" 
                          className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 px-3 py-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3" />
                          {symptomText}
                          <button 
                            type="button"
                            onClick={() => removePathognomonic(symptomText)}
                            className="ml-1 hover:bg-red-700 rounded-full p-0.5 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Primary Supportive Features */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Primary Supportive Features</Label>
                {getPrimaryTypicalSymptoms().length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No supportive features defined. Add supportive features first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                    {getPrimaryTypicalSymptoms()
                      .filter(symptom => 
                        // Filter out symptoms already used in other categories (mutual exclusion)
                        !isSymptomUsedInOtherCategory(symptom, false, true, true, true)
                      )
                      .map((symptom, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm font-medium">{symptom}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addPathognomonic(symptom)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    {getPrimaryTypicalSymptoms().filter(s => 
                      // Filter out symptoms already used in other categories (mutual exclusion)
                      !isSymptomUsedInOtherCategory(s, false, true, true, true)
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
                        All primary supportive features have been assigned to other categories
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Symptom Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Custom Symptom</Label>
                <div className="flex gap-2">
                  <Input
                    value={customPathognomonicInput}
                    onChange={(e) => setCustomPathognomonicInput(e.target.value)}
                    placeholder="Enter a custom symptom not in the typical list..."
                    className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCustomPathognomonic();
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={addCustomPathognomonic}
                    disabled={!customPathognomonicInput.trim()}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add symptoms that are highly specific and occur in 80-100% of cases - contribute 20% each to match likelihood
                </p>
              </div>
            </div>

            {/* Cardinal Symptoms - Structured Management */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-500" />
                <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Important Features</Label>
                <Badge variant="secondary" className="text-xs">{cardinalList.length} assigned</Badge>
              </div>

              {/* Current Cardinal Symptoms */}
              {cardinalList.length > 0 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex flex-wrap gap-2">
                    {cardinalList.map((symptom, index) => (
                      <Badge 
                        key={index} 
                        variant="default" 
                        className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 px-3 py-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3" />
                        {symptom}
                        <button 
                          type="button"
                          onClick={() => removeCardinal(symptom)}
                          className="ml-1 hover:bg-orange-700 rounded-full p-0.5 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Primary Supportive Features */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Primary Supportive Features</Label>
                {getPrimaryTypicalSymptoms().length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No supportive features defined. Add supportive features first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                    {getPrimaryTypicalSymptoms()
                      .filter(symptom => 
                        // Filter out symptoms already used in other categories (mutual exclusion)
                        !isSymptomUsedInOtherCategory(symptom, true, false, true, true)
                      )
                      .map((symptom, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm font-medium">{symptom}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addCardinal(symptom)}
                            className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    {getPrimaryTypicalSymptoms().filter(s => 
                      // Filter out symptoms already used in other categories (mutual exclusion)
                      !isSymptomUsedInOtherCategory(s, true, false, true, true)
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
                        All primary supportive features have been assigned to other categories or as important
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Symptom Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Custom Symptom</Label>
                <div className="flex gap-2">
                  <Input
                    value={customCardinalInput}
                    onChange={(e) => setCustomCardinalInput(e.target.value)}
                    placeholder="Enter a custom symptom not in the typical list..."
                    className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCustomCardinal();
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={addCustomCardinal}
                    disabled={!customCardinalInput.trim()}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add characteristic features that strongly suggest diagnosis - contribute 15% each to match likelihood
                </p>
              </div>
            </div>

            {/* Exclusion Features - Dedicated Column with Own Input Pool */}
            <div className="space-y-3 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldOff className="w-5 h-5 text-gray-600" />
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Exclusion Features</Label>
                  <Badge variant="secondary" className="text-xs">{exclusionList.length} assigned</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter symptoms that argue against this diagnosis. Presence of these symptoms suggests alternative conditions.
              </p>
              
              {exclusionList.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No exclusion features added yet. Enter each exclusion feature on a new line below.
                </p>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <ShieldOff className="w-3 h-3" />
                    Current Exclusion Features ({exclusionList.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exclusionList.map((symptom, index) => (
                      <Badge 
                        key={index} 
                        variant="default" 
                        className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-1 px-3 py-1 cursor-pointer"
                      >
                        <ShieldOff className="w-3 h-3" />
                        {symptom}
                        <button 
                          type="button"
                          onClick={() => removeExclusion(symptom)}
                          className="ml-1 hover:bg-gray-800 rounded-full p-0.5 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Exclusion Features Input Area - Own Dedicated Pool */}
              <div className="space-y-2">
                <Label htmlFor="edit-exclusion-features-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exclusion Features Input
                </Label>
                <Textarea
                  id="edit-exclusion-features-text"
                  value={exclusionList.join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').map(line => line.trim()).filter(line => line !== '');
                    setExclusionList(lines);
                  }}
                  placeholder="Enter each exclusion feature on a new line...\nExample:\nBilateral headache\nGradual onset\nAge > 50 first onset"
                  className="min-h-[150px] font-mono text-sm bg-gray-50/50 dark:bg-gray-900/30 border-gray-300 dark:border-gray-600"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter each exclusion feature on a new line. Empty lines will be ignored. These symptoms argue AGAINST this diagnosis.
                </p>
              </div>
            </div>

            {/* Risk Factors - Dedicated Column with Own Input Pool */}
            <div className="space-y-3 pt-4 border-t-2 border-orange-300 dark:border-orange-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Risk Factors</Label>
                  <Badge variant="secondary" className="text-xs">{riskFactorsList.length} assigned</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter factors that increase the likelihood of this condition. Used for clinical context and scoring adjustments.
              </p>
              
              {riskFactorsList.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No risk factors added yet. Enter each risk factor on a new line below.
                </p>
              ) : (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Current Risk Factors ({riskFactorsList.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {riskFactorsList.map((symptom, index) => (
                      <Badge 
                        key={index} 
                        variant="default" 
                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 px-3 py-1 cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {symptom}
                        <button 
                          type="button"
                          onClick={() => removeRiskFactor(symptom)}
                          className="ml-1 hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Risk Factors Input Area - Own Dedicated Pool */}
              <div className="space-y-2">
                <Label htmlFor="edit-risk-factors-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Risk Factors Input
                </Label>
                <Textarea
                  id="edit-risk-factors-text"
                  value={riskFactorsList.join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').map(line => line.trim()).filter(line => line !== '');
                    setRiskFactorsList(lines);
                  }}
                  placeholder="Enter each risk factor on a new line...\nExample:\nFamily history of condition\nSmoking\nObesity\nSedentary lifestyle"
                  className="min-h-[150px] font-mono text-sm bg-orange-50/30 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter each risk factor on a new line. Empty lines will be ignored. These factors increase the likelihood of this condition.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-treatment" className="text-sm font-medium text-gray-700 dark:text-gray-300">Treatment</Label>
              <Textarea 
                id="edit-treatment" 
                value={formData.treatment}
                onChange={e => setFormData({...formData, treatment: e.target.value})}
                className="h-20 bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Age Rule Section - Dual Age Fields */}
            <div className="space-y-6 pt-4 border-t border-border">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Condition-Specific Rules</h3>
                <p className="text-sm text-muted-foreground">Configure demographic rules for this condition</p>
              </div>
              
              {/* First Age Field - Common Age Range */}
              <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-base font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Common Age Range
                </h4>
                <p className="text-xs text-muted-foreground">Typical age range where this condition commonly occurs (+6% match if within range)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-common-age-min" className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Min Age</Label>
                    <Input
                      id="edit-common-age-min"
                      type="number"
                      value={formData.commonAgeRule.min}
                      onChange={e => setFormData({
                        ...formData, 
                        commonAgeRule: {...formData.commonAgeRule, min: e.target.value}
                      })}
                      placeholder="Min age"
                      min="0"
                      max="150"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-common-age-max" className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Max Age</Label>
                    <Input
                      id="edit-common-age-max"
                      type="number"
                      value={formData.commonAgeRule.max}
                      onChange={e => setFormData({
                        ...formData, 
                        commonAgeRule: {...formData.commonAgeRule, max: e.target.value}
                      })}
                      placeholder="Max age"
                      min="0"
                      max="150"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Second Age Field - Final Age Range */}
              <div className="space-y-3 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-base font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Final Age Range
                </h4>
                <p className="text-xs text-muted-foreground">Absolute age limits for this condition (hard exclusion if outside range)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-age-min" className="text-sm font-medium text-gray-700 dark:text-gray-300">Final Min Age</Label>
                    <Input
                      id="edit-final-age-min"
                      type="number"
                      value={formData.finalAgeRule.min}
                      onChange={e => setFormData({
                        ...formData, 
                        finalAgeRule: {...formData.finalAgeRule, min: e.target.value}
                      })}
                      placeholder="Min age"
                      min="0"
                      max="150"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-age-max" className="text-sm font-medium text-gray-700 dark:text-gray-300">Final Max Age</Label>
                    <Input
                      id="edit-final-age-max"
                      type="number"
                      value={formData.finalAgeRule.max}
                      onChange={e => setFormData({
                        ...formData, 
                        finalAgeRule: {...formData.finalAgeRule, max: e.target.value}
                      })}
                      placeholder="Max age"
                      min="0"
                      max="150"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-age-rule-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Rule Type</Label>
                    <Select
                      value={formData.finalAgeRule.ruleType}
                      onValueChange={value => setFormData({
                        ...formData, 
                        finalAgeRule: {...formData.finalAgeRule, ruleType: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="soft">Soft Rule</SelectItem>
                        <SelectItem value="hard">Hard Rule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sex Rule Section */}
            <div className="space-y-2">
              <Label htmlFor="edit-sex-rule">Sex Rule</Label>
              <Select
                value={formData.sexRule}
                onValueChange={value => setFormData({...formData, sexRule: value as 'male' | 'female' | 'both'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both sexes</SelectItem>
                  <SelectItem value="male">Male only</SelectItem>
                  <SelectItem value="female">Female only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Female-to-Male Ratio Section */}
            <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Female-to-Male Ratio
                </h4>
                <p className="text-xs text-muted-foreground">
                  Gender-based boost: 2→1%, 6→3%, 10→5% (proportional scaling)
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Female Field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-female-ratio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Female Ratio (2-10)
                  </Label>
                  <Input
                    id="edit-female-ratio"
                    type="number"
                    value={formData.femaleToMaleRatio.female}
                    onChange={e => {
                      const value = e.target.value;
                      // Validate range 2-10
                      if (value === '' || (Number(value) >= 2 && Number(value) <= 10)) {
                        setFormData({
                          ...formData, 
                          femaleToMaleRatio: {...formData.femaleToMaleRatio, female: value}
                        });
                      }
                    }}
                    placeholder="2-10"
                    min="2"
                    max="10"
                    step="1"
                    className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Boost for female patients (2→1%, 10→5%)
                  </p>
                </div>

                {/* Male Field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-male-ratio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Male Ratio (2-10)
                  </Label>
                  <Input
                    id="edit-male-ratio"
                    type="number"
                    value={formData.femaleToMaleRatio.male}
                    onChange={e => {
                      const value = e.target.value;
                      // Validate range 2-10
                      if (value === '' || (Number(value) >= 2 && Number(value) <= 10)) {
                        setFormData({
                          ...formData, 
                          femaleToMaleRatio: {...formData.femaleToMaleRatio, male: value}
                        });
                      }
                    }}
                    placeholder="2-10"
                    min="2"
                    max="10"
                    step="1"
                    className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Boost for male patients (2→1%, 10→5%)
                  </p>
                </div>
              </div>
            </div>

            {/* Duration Rule Section - Dual Duration Fields */}
            <div className="space-y-6 pt-4 border-t border-border">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Duration Rules</h3>
                <p className="text-sm text-muted-foreground">Configure duration ranges for this condition</p>
              </div>
              
              {/* First Duration Field - Common Duration Range */}
              <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-base font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Common Duration Range
                </h4>
                <p className="text-xs text-muted-foreground">Typical duration where this condition commonly occurs</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-common-duration-start" className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Min Duration</Label>
                    <Input
                      id="edit-common-duration-start"
                      type="number"
                      value={formData.commonDurationCriteria.startDuration}
                      onChange={e => setFormData({
                        ...formData, 
                        commonDurationCriteria: {...formData.commonDurationCriteria, startDuration: e.target.value}
                      })}
                      placeholder="Min duration"
                      min="0"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-common-duration-end" className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Max Duration</Label>
                    <Input
                      id="edit-common-duration-end"
                      type="number"
                      value={formData.commonDurationCriteria.endDuration}
                      onChange={e => setFormData({
                        ...formData, 
                        commonDurationCriteria: {...formData.commonDurationCriteria, endDuration: e.target.value}
                      })}
                      placeholder="Max duration"
                      min="0"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-common-duration-unit">Duration Unit</Label>
                    <Select
                      value={formData.commonDurationCriteria.unit}
                      onValueChange={value => setFormData({
                        ...formData, 
                        commonDurationCriteria: {...formData.commonDurationCriteria, unit: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Second Duration Field - Final Duration Range */}
              <div className="space-y-3 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-base font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Final Duration Range
                </h4>
                <p className="text-xs text-muted-foreground">Absolute duration limits (rule-based exclusion if outside range)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-duration-start" className="text-sm font-medium text-gray-700 dark:text-gray-300">Final Min Duration</Label>
                    <Input
                      id="edit-final-duration-start"
                      type="number"
                      value={formData.finalDurationCriteria.startDuration}
                      onChange={e => setFormData({
                        ...formData, 
                        finalDurationCriteria: {...formData.finalDurationCriteria, startDuration: e.target.value}
                      })}
                      placeholder="Min duration"
                      min="0"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-duration-end" className="text-sm font-medium text-gray-700 dark:text-gray-300">Final Max Duration</Label>
                    <Input
                      id="edit-final-duration-end"
                      type="number"
                      value={formData.finalDurationCriteria.endDuration}
                      onChange={e => setFormData({
                        ...formData, 
                        finalDurationCriteria: {...formData.finalDurationCriteria, endDuration: e.target.value}
                      })}
                      placeholder="Max duration"
                      min="0"
                      className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-duration-unit">Duration Unit</Label>
                    <Select
                      value={formData.finalDurationCriteria.unit}
                      onValueChange={value => setFormData({
                        ...formData, 
                        finalDurationCriteria: {...formData.finalDurationCriteria, unit: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-final-duration-rule-type">Rule Type</Label>
                    <Select
                      value={formData.finalDurationCriteria.ruleType}
                      onValueChange={value => setFormData({
                        ...formData, 
                        finalDurationCriteria: {...formData.finalDurationCriteria, ruleType: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="soft">Soft Rule</SelectItem>
                        <SelectItem value="hard">Hard Rule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Symptom Details Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Symptom Details</Label>
                <p className="text-sm text-muted-foreground">Add detailed information for each typical symptom</p>
              </div>
              
              <div className="space-y-3">
                {formData.symptoms.map((symptom, index) => {
                  // Get the symptom name for display
                  let cleanSymptom: string;
                  if (typeof symptom === 'string') {
                    cleanSymptom = symptom.trim();
                  } else {
                    cleanSymptom = symptom.typicalSymptom?.trim() || '';
                  }
                  
                  if (!cleanSymptom) return null;
                  
                  return (
                    <div key={index} className="space-y-2 p-4 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-white/30 shadow-sm">
                      <Label htmlFor={`symptom-detail-${index}`} className="font-medium text-sm text-gray-700 dark:text-gray-300">
                        {cleanSymptom}
                      </Label>
                      <Textarea
                        id={`symptom-detail-${index}`}
                        value={formData.symptomDetails[cleanSymptom] || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            symptomDetails: {
                              ...formData.symptomDetails,
                              [cleanSymptom]: e.target.value
                            }
                          });
                        }}
                        className="h-24 bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                        placeholder={`Add detailed information about ${cleanSymptom}...`}
                      />
                    </div>
                  );
                })}
              </div>
              
              {formData.symptoms.filter(s => typeof s === 'string' ? s.trim() : s.typicalSymptom.trim()).length === 0 && (
                <p className="text-sm text-muted-foreground italic">Add symptoms above to enable symptom details editing</p>
              )}
            </div>

            {/* Lab Tests Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Lab Tests
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      labTests: [...prev.labTests, { testName: '', testDetails: '' }]
                    }));
                  }}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Lab Test
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Add laboratory tests required for diagnosing this condition. Click on a test name in the suggestions list to view its details.
              </p>
              
              {formData.labTests.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No lab tests added yet. Click "Add Lab Test" to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.labTests.map((labTest, index) => (
                    <div key={index} className="space-y-2 p-4 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-white/30 shadow-sm">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-blue-600">
                          Lab Test #{index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = formData.labTests.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, labTests: updated }));
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`lab-test-name-${index}`} className="text-xs font-medium">
                          Test Name *
                        </Label>
                        <Input
                          id={`lab-test-name-${index}`}
                          value={labTest.testName}
                          onChange={(e) => {
                            const updated = [...formData.labTests];
                            updated[index].testName = e.target.value;
                            setFormData({ ...formData, labTests: updated });
                          }}
                          placeholder="e.g., Complete Blood Count (CBC)"
                          className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`lab-test-details-${index}`} className="text-xs font-medium">
                          Test Details
                        </Label>
                        <Textarea
                          id={`lab-test-details-${index}`}
                          value={labTest.testDetails}
                          onChange={(e) => {
                            const updated = [...formData.labTests];
                            updated[index].testDetails = e.target.value;
                            setFormData({ ...formData, labTests: updated });
                          }}
                          className="h-20 bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                          placeholder="Describe what this test measures, normal ranges, clinical significance..."
                        />
                        <p className="text-xs text-muted-foreground">
                          This information will be displayed when users click on the test name.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="bg-gradient-to-r from-gray-50/30 to-gray-100/30 dark:from-slate-800/30 dark:to-slate-900/30 p-4 rounded-b-xl">
              <Button type="button" variant="outline" onClick={onClose} className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 dark:from-gray-800/30 dark:to-gray-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
        
        {/* Symptom Selector Dialog */}
        <SymptomSelectorDialog
          isOpen={isSymptomSelectorOpen}
          onOpenChange={setIsSymptomSelectorOpen}
          causes={causes}
          onSymptomSelect={handleAddSymptomsFromDatabase}
          title="Add Symptoms from Database"
          description="Select symptoms to add to the Supportive Features list"
          showAllSymptomsOnly={true}
        />
      </DialogContent>
    </Dialog>
  );
}
