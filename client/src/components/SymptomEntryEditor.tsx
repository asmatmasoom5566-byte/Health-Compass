import React from 'react';
import { Symptom } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface SymptomEntryEditorProps {
  symptom: Symptom;
  onChange: (symptom: Symptom) => void;
  onRemove: () => void;
  index: number;
}

export function SymptomEntryEditor({
  symptom,
  onChange,
  onRemove,
  index
}: SymptomEntryEditorProps) {
  const handleTypicalSymptomChange = (value: string) => {
    onChange({
      typicalSymptom: value
    });
  };

  return (
    <div className="space-y-2 p-3 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-lg border shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`typical-symptom-${index}`} className="text-xs font-medium text-primary">
            Typical Symptom
          </Label>
          <Input
            id={`typical-symptom-${index}`}
            value={symptom.typicalSymptom}
            onChange={(e) => handleTypicalSymptomChange(e.target.value)}
            placeholder="Enter typical symptom name"
            className="h-9 bg-white dark:bg-slate-800 border-border focus:border-primary focus:ring-primary transition-all duration-200"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Remove symptom"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
