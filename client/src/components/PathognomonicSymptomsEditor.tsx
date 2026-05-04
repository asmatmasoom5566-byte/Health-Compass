// Pathognomonic Symptoms Editor Component
// Provides visual indicators and editing capabilities for pathognomonic symptoms

import { useState } from 'react';
import { 
  Star, 
  Plus, 
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Cause } from '@shared/schema';
import { EnhancedPathognomonicSymptomsManager } from '@/utils/enhanced-pathognomonic-manager';

interface PathognomonicSymptomsEditorProps {
  condition: Cause;
  onUpdate: (updatedCondition: Cause) => void;
}

export default function PathognomonicSymptomsEditor({ condition, onUpdate }: PathognomonicSymptomsEditorProps) {
  const [newSymptom, setNewSymptom] = useState('');
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  // Get current pathognomonic symptoms
  const pathognomonicResult = EnhancedPathognomonicSymptomsManager.getPathognomonicSymptoms(condition);
  const currentPathognomonic = Array.isArray(pathognomonicResult) 
    ? pathognomonicResult 
    : typeof pathognomonicResult === 'string' && pathognomonicResult.trim()
      ? pathognomonicResult.split(',').map(s => s.trim()).filter(Boolean)
      : [];
  
  // Get all available symptoms (typical + defining + pathognomonic)
  const allSymptoms = [
    ...condition.symptoms,
    ...(condition.definingSymptoms || []),
    ...currentPathognomonic
  ].filter((symptom, index, self) => 
    self.findIndex(s => s.toLowerCase() === symptom.toLowerCase()) === index
  );

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !currentPathognomonic.some(s => 
      s.toLowerCase().includes(newSymptom.toLowerCase()) || 
      newSymptom.toLowerCase().includes(s.toLowerCase())
    )) {
      const updated = EnhancedPathognomonicSymptomsManager.addPathognomonicSymptoms(condition, [newSymptom.trim()]);
      onUpdate(updated);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (symptomToRemove: string) => {
    const updated = EnhancedPathognomonicSymptomsManager.removePathognomonicSymptoms(condition, [symptomToRemove]);
    onUpdate(updated);
  };

  const getSymptomBadgeVariant = (symptom: string) => {
    if (currentPathognomonic.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      return 'pathognomonic';
    }
    if (condition.definingSymptoms?.some(s => 
      s.toLowerCase().includes(symptom.toLowerCase()) || 
      symptom.toLowerCase().includes(s.toLowerCase())
    )) {
      return 'defining';
    }
    return 'typical';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-lg">Key Features</h3>
          <Badge variant="secondary" className="text-xs">
            {currentPathognomonic.length} assigned
          </Badge>
        </div>
      </div>

      {/* Current Pathognomonic Symptoms */}
      {currentPathognomonic.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Assigned Pathognomonic Symptoms
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentPathognomonic.map((symptom, index) => (
              <Badge 
                key={index} 
                variant="default" 
                className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 px-3 py-1"
              >
                <Star className="w-3 h-3" />
                {symptom}
                <button 
                  type="button"
                  onClick={() => handleRemoveSymptom(symptom)}
                  className="ml-1 hover:bg-red-700 rounded-full p-0.5"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add New Pathognomonic Symptom */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <Label htmlFor="new-pathognomonic" className="text-sm font-medium mb-2 block">
          Add Pathognomonic Symptom
        </Label>
        <div className="flex gap-2">
          <Input
            id="new-pathognomonic"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            placeholder="Enter highly specific symptom..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddSymptom();
              }
            }}
          />
          <Button 
            type="button"
            onClick={handleAddSymptom}
            disabled={!newSymptom.trim()}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Add symptoms that are highly specific and occur in 80-100% of cases
        </p>
      </div>

      {/* All Symptoms with Classification */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">All Symptoms</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={() => setShowAllSymptoms(!showAllSymptoms)}
          >
            {showAllSymptoms ? 'Show Less' : 'Show All'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allSymptoms
            .slice(0, showAllSymptoms ? allSymptoms.length : 6)
            .map((symptom, index) => {
              const variant = getSymptomBadgeVariant(symptom);
              
              return (
                <div 
                  key={index} 
                  className="p-3 rounded-lg border flex items-start justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{symptom}</span>
                      {variant === 'pathognomonic' && (
                        <Badge variant="default" className="bg-red-500 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Pathognomonic
                        </Badge>
                      )}
                      {variant === 'defining' && (
                        <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Defining
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {variant !== 'pathognomonic' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = EnhancedPathognomonicSymptomsManager.addPathognomonicSymptoms(condition, [symptom]);
                        onUpdate(updated);
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Validation Status */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-blue-800 dark:text-blue-200">
            Pathognomonic symptoms contribute 20% each to match likelihood
          </span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Absence of all pathognomonic symptoms will result in a "pathognomonic symptom missing" tag and lower ranking.
        </p>
      </div>
    </div>
  );
}