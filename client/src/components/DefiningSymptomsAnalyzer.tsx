// Defining Symptoms Analyzer Component
// Provides analysis features and management for defining symptoms

import { useState } from 'react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Info, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Cause } from '@shared/schema';
import { EnhancedDefiningSymptomsManager } from '@/utils/enhanced-defining-manager';

interface DefiningSymptomsAnalyzerProps {
  condition: Cause;
  onUpdate: (updatedCondition: Cause) => void;
}

export default function DefiningSymptomsAnalyzer({ condition, onUpdate }: DefiningSymptomsAnalyzerProps) {
  const [newSymptom, setNewSymptom] = useState('');
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  // Get current defining symptoms
  const currentDefining = condition.definingSymptoms || [];
  
  // Get all available symptoms (typical + defining)
  const allSymptoms = [
    ...condition.symptoms,
    ...currentDefining
  ].filter((symptom, index, self) => 
    self.findIndex(s => s.toLowerCase() === symptom.toLowerCase()) === index
  );

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !currentDefining.some(s => 
      s.toLowerCase().includes(newSymptom.toLowerCase()) || 
      newSymptom.toLowerCase().includes(s.toLowerCase())
    )) {
      const updatedDefining = [...currentDefining, newSymptom.trim()];
      onUpdate({
        ...condition,
        definingSymptoms: updatedDefining
      });
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (symptomToRemove: string) => {
    const updatedDefining = currentDefining.filter(symptom => 
      !symptom.toLowerCase().includes(symptomToRemove.toLowerCase()) &&
      !symptomToRemove.toLowerCase().includes(symptom.toLowerCase())
    );
    
    onUpdate({
      ...condition,
      definingSymptoms: updatedDefining.length > 0 ? updatedDefining : undefined
    });
  };

  const getSymptomBadgeVariant = (category: string) => {
    switch (category) {
      case 'Pathognomonic':
        return 'destructive';
      case 'Defining':
        return 'default';
      case 'High-Typical':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSymptomColor = (category: string) => {
    switch (category) {
      case 'Pathognomonic':
        return 'text-red-600';
      case 'Defining':
        return 'text-yellow-600';
      case 'High-Typical':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-lg">Defining Symptoms</h3>
          <Badge variant="secondary" className="text-xs">
            {currentDefining.length} assigned
          </Badge>
        </div>
      </div>

      {/* Current Defining Symptoms */}
      {currentDefining.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Assigned Defining Symptoms
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentDefining.map((symptom, index) => (
              <Badge 
                key={index} 
                variant="default" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1 px-3 py-1"
              >
                <Star className="w-3 h-3" />
                {symptom}
                <button 
                  type="button"
                  onClick={() => handleRemoveSymptom(symptom)}
                  className="ml-1 hover:bg-yellow-700 rounded-full p-0.5"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add New Defining Symptom */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <Label htmlFor="new-defining" className="text-sm font-medium mb-2 block">
          Add Defining Symptom
        </Label>
        <div className="flex gap-2">
          <Input
            id="new-defining"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            placeholder="Enter important diagnostic symptom..."
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
          Add symptoms that are important diagnostic indicators (60-80% frequency) - contribute 10% each to match likelihood
        </p>
      </div>



      {/* All Symptoms with Classification */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">All Symptoms Classification</h4>
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAllSymptoms(!showAllSymptoms)}
          >
            {showAllSymptoms ? 'Show Less' : 'Show All'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allSymptoms
            .slice(0, showAllSymptoms ? allSymptoms.length : 6)
            .map((symptom, index) => {
              const isDefining = currentDefining.some(d => 
                d.toLowerCase().includes(symptom.toLowerCase()) || 
                symptom.toLowerCase().includes(d.toLowerCase())
              );
              
              return (
                <div 
                  key={index} 
                  className="p-3 rounded-lg border flex items-start justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{symptom}</span>
                      {isDefining && (
                        <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {!isDefining && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedDefining = [...currentDefining, symptom];
                        onUpdate({
                          ...condition,
                          definingSymptoms: updatedDefining
                        });
                      }}
                      className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50"
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
            Defining symptoms contribute 15% each to match likelihood
          </span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Add important diagnostic indicators manually based on clinical expertise
        </p>
      </div>
    </div>
  );
}