import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  PlusCircle, 
  Trash2, 
  Star, 
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Cause } from '@shared/schema';
import { DefiningSymptomsManager } from '../utils/defining-symptoms-manager';
import { DefiningSymptomSource } from '../utils/defining-symptoms-manager';

interface DefiningSymptomsEditorProps {
  condition: Cause;
  onUpdate: (updatedCondition: Cause) => void;
}

const DefiningSymptomsEditor: React.FC<DefiningSymptomsEditorProps> = ({ 
  condition, 
  onUpdate 
}) => {
  const [newSymptom, setNewSymptom] = useState('');
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);
  
  // Get all symptom sources to distinguish between auto and manual
  const symptomSources = DefiningSymptomsManager.getDefiningSymptomSources(condition);
  
  const allSymptoms = [
    ...(condition.symptoms || []),
    ...(condition.atypicalSymptoms || []),
    ...(condition.definingSymptoms || [])
  ].filter((item, index, arr) => arr.indexOf(item) === index);

  const handleAddManualSymptom = () => {
    if (!newSymptom.trim()) return;
    
    const updatedCondition = DefiningSymptomsManager.addManualDefiningSymptom(
      condition, 
      newSymptom.trim()
    );
    
    onUpdate(updatedCondition);
    setNewSymptom('');
  };

  const handleRemoveSymptom = (symptomToRemove: string) => {
    const updatedCondition = DefiningSymptomsManager.removeDefiningSymptom(
      condition, 
      symptomToRemove
    );
    
    onUpdate(updatedCondition);
  };

  const handleToggleSymptom = (symptom: string, checked: boolean) => {
    let updatedCondition: Cause;
    
    if (checked) {
      updatedCondition = DefiningSymptomsManager.addManualDefiningSymptom(
        condition,
        symptom
      );
    } else {
      updatedCondition = DefiningSymptomsManager.removeDefiningSymptom(
        condition,
        symptom
      );
    }
    
    onUpdate(updatedCondition);
  };

  const autoAssignedSymptoms = symptomSources.filter(s => s.source === 'auto');
  const manualAssignedSymptoms = symptomSources.filter(s => s.source === 'manual');

  // Sample explanations for symptoms (this would typically come from a knowledge base)
  const getSymptomExplanation = (symptom: string): { medical: string; general: string } => {
    const explanations: Record<string, { medical: string; general: string }> = {
      'neck stiffness': {
        medical: 'Nuchal rigidity is a classic sign of meningeal irritation seen in meningitis',
        general: 'Stiffness and inability to touch chin to chest due to inflammation around brain/spinal cord'
      },
      'altered consciousness': {
        medical: 'Altered mental status indicates central nervous system involvement',
        general: 'Confusion, drowsiness, or reduced awareness of surroundings'
      },
      'projectile vomiting': {
        medical: 'Forceful vomiting without preceding nausea, often due to increased intracranial pressure',
        general: 'Vomiting that shoots out forcefully, not related to stomach issues'
      },
      'photophobia': {
        medical: 'Sensitivity to light due to meningeal inflammation',
        general: 'Discomfort or pain when looking at bright lights'
      },
      'throbbing headache': {
        medical: 'Pulsating head pain characteristic of migraine',
        general: 'Head pain that pulses or beats in rhythm with heartbeat'
      },
      'unilateral headache': {
        medical: 'Headache affecting one side of the head, characteristic of migraine',
        general: 'Head pain on only the left or right side of the head'
      },
      'chest pain': {
        medical: 'Central chest discomfort that may radiate, indicating cardiac ischemia',
        general: 'Pain or pressure in the center of the chest'
      },
      'radiating arm pain': {
        medical: 'Pain that travels from chest to left arm, a classic sign of myocardial infarction',
        general: 'Chest pain that spreads down the left arm'
      },
      'fever': {
        medical: 'Elevated body temperature indicating inflammatory response',
        general: 'Higher than normal body temperature'
      },
      'cough': {
        medical: 'Reflex action to clear airways, can be dry or productive',
        general: 'Forceful expulsion of air from lungs'
      }
    };

    const key = Object.keys(explanations).find(k => 
      symptom.toLowerCase().includes(k) || k.includes(symptom.toLowerCase())
    );

    if (key) {
      return explanations[key];
    }

    return {
      medical: 'Clinical significance depends on context and associated symptoms',
      general: 'Symptom commonly associated with this condition'
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Defining Symptoms</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              Auto
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Pencil className="h-3 w-3 text-blue-500" />
              Manual
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Define critical symptoms that strongly indicate this condition
        </p>
      </CardHeader>
      <CardContent>
        {/* Manual Addition Section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <Label htmlFor="add-defining-symptom" className="text-sm font-medium mb-2 block">
            Add Custom Defining Symptom
          </Label>
          <div className="flex gap-2">
            <Input
              id="add-defining-symptom"
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              placeholder="Enter a defining symptom..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddManualSymptom()}
            />
            <Button 
              onClick={handleAddManualSymptom}
              disabled={!newSymptom.trim()}
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Manually added symptoms will be prioritized in diagnostic ranking
          </p>
        </div>

        {/* Auto-Assigned Symptoms */}
        {autoAssignedSymptoms.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500" />
              <h3 className="font-medium">Auto-Assigned ({autoAssignedSymptoms.length})</h3>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">
                Review these suggestions
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {autoAssignedSymptoms.map((item, index) => {
                const explanation = getSymptomExplanation(item.symptom);
                const isExpanded = expandedSymptom === item.symptom;
                
                return (
                  <div 
                    key={`auto-${index}`} 
                    className="border border-yellow-200 rounded-md overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 bg-yellow-50">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{item.symptom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSymptom(isExpanded ? null : item.symptom)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSymptom(item.symptom)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-3 bg-yellow-50 border-t border-yellow-200 text-sm">
                        <p className="font-medium text-yellow-800 mb-1">Medical Explanation:</p>
                        <p className="text-yellow-700 mb-2">{explanation.medical}</p>
                        <p className="font-medium text-yellow-800 mb-1">General Language:</p>
                        <p className="text-yellow-700">{explanation.general}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manually Assigned Symptoms */}
        {manualAssignedSymptoms.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Pencil className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium">Manually Added ({manualAssignedSymptoms.length})</h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">
                Confirmed by doctor
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {manualAssignedSymptoms.map((item, index) => {
                const explanation = getSymptomExplanation(item.symptom);
                const isExpanded = expandedSymptom === item.symptom;
                
                return (
                  <div 
                    key={`manual-${index}`} 
                    className="border border-blue-200 rounded-md overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 bg-blue-50">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{item.symptom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSymptom(isExpanded ? null : item.symptom)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSymptom(item.symptom)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-3 bg-blue-50 border-t border-blue-200 text-sm">
                        <p className="font-medium text-blue-800 mb-1">Medical Explanation:</p>
                        <p className="text-blue-700 mb-2">{explanation.medical}</p>
                        <p className="font-medium text-blue-800 mb-1">General Language:</p>
                        <p className="text-blue-700">{explanation.general}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Symptoms to Select */}
        <div className="mt-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <span>Available Symptoms</span>
            <Badge variant="secondary">{allSymptoms.length}</Badge>
          </h3>
          
          <ScrollArea className="h-60 w-full rounded-md border p-2">
            <div className="space-y-2">
              {allSymptoms.map((symptom, index) => {
                const isDefining = (condition.definingSymptoms || []).some(ds => 
                  ds.toLowerCase().includes(symptom.toLowerCase()) || 
                  symptom.toLowerCase().includes(ds.toLowerCase())
                );
                
                const source = symptomSources.find(s => 
                  s.symptom.toLowerCase().includes(symptom.toLowerCase()) || 
                  symptom.toLowerCase().includes(s.symptom.toLowerCase())
                );
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-md ${
                      isDefining 
                        ? source?.source === 'auto' 
                          ? 'bg-yellow-50 border border-yellow-200' 
                          : 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isDefining}
                        onCheckedChange={(checked) => handleToggleSymptom(symptom, !!checked)}
                      />
                      <div>
                        <span className={isDefining ? "font-medium" : ""}>{symptom}</span>
                        {isDefining && source && (
                          <span className="ml-2 text-xs">
                            {source.source === 'auto' ? '(Auto)' : '(Manual)'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isDefining && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedSymptom(expandedSymptom === symptom ? null : symptom)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default DefiningSymptomsEditor;