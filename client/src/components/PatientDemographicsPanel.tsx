import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PatientDemographics {
  age: number | '';
  sex: 'Male' | 'Female' | '';
  duration: number | '';
  durationUnit: 'hours' | 'days' | 'weeks' | 'months' | 'years' | '';
}

interface PatientDemographicsPanelProps {
  demographics: PatientDemographics;
  onChange: (demographics: PatientDemographics) => void;
  onClear: () => void;
  showValidation?: boolean;
}

export function PatientDemographicsPanel({ demographics, onChange, onClear, showValidation = false }: PatientDemographicsPanelProps) {
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    onChange({ ...demographics, age: value });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    onChange({ ...demographics, duration: value });
  };

  // Validation checks
  const isAgeValid = demographics.age === '' || (typeof demographics.age === 'number' && demographics.age >= 0 && demographics.age <= 150);
  const isSexValid = demographics.sex !== '';
  const isDurationValid = demographics.duration === '' || (typeof demographics.duration === 'number' && demographics.duration >= 0);
  const isDurationUnitValid = demographics.durationUnit !== '';
  
  const isComplete = demographics.age !== '' && demographics.sex !== '' && demographics.duration !== '' && demographics.durationUnit !== '';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-display font-black">Patient Demographics</h3>
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age Field */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <div className="flex items-center gap-2">
            <Input
              id="age"
              type="number"
              value={demographics.age}
              onChange={handleAgeChange}
              placeholder="Enter age"
              min="0"
              max="150"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">years</span>
          </div>
        </div>

        {/* Sex Field */}
        <div className="space-y-2">
          <Label htmlFor="sex">Sex</Label>
          <Select 
            value={demographics.sex} 
            onValueChange={(value: 'Male' | 'Female') => onChange({ ...demographics, sex: value })}
          >
            <SelectTrigger id="sex">
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration Fields */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration of Complaint</Label>
          <div className="flex items-center gap-2">
            <Input
              id="duration"
              type="number"
              value={demographics.duration}
              onChange={handleDurationChange}
              placeholder="Duration"
              min="0"
              className="flex-1"
            />
            <Select 
              value={demographics.durationUnit} 
              onValueChange={(value: 'hours' | 'days' | 'weeks' | 'months' | 'years') => 
                onChange({ ...demographics, durationUnit: value })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hrs</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Wks</SelectItem>
                <SelectItem value="months">Mths</SelectItem>
                <SelectItem value="years">Yrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}