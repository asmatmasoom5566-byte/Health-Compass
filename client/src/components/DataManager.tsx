import { useState } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Trash, 
  Plus, 
  Settings2, 
  Save 
} from 'lucide-react';
import { Cause, causeSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface DataManagerProps {
  causes: Cause[];
  onImport: (json: string) => boolean;
  onReset: () => void;
  onAddCause: (cause: Omit<Cause, 'id'>) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function DataManager({ causes, onImport, onReset, onAddCause, canUndo, onUndo }: DataManagerProps) {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const [newCause, setNewCause] = useState<{name: string, baseRate: number, symptoms: string}>({
    name: "",
    baseRate: 10,
    symptoms: ""
  });

  const handleExport = () => {
    const dataStr = JSON.stringify(causes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `symptom-tracker-export-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({ title: "Export Started", description: "Your database is downloading." });
  };

  const handleImportSubmit = () => {
    if (onImport(importText)) {
      setIsImportOpen(false);
      setImportText("");
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const symptomsList = newCause.symptoms.split(',').map(s => s.trim()).filter(Boolean);
      
      if (!newCause.name) throw new Error("Name is required");
      if (symptomsList.length === 0) throw new Error("At least one symptom is required");

      onAddCause({
        name: newCause.name,
        baseRate: newCause.baseRate,
        symptoms: symptomsList
      });

      setIsAddOpen(false);
      setNewCause({ name: "", baseRate: 10, symptoms: "" });
    } catch (err: any) {
      toast({ title: "Validation Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Add New Cause
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Condition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Condition Name</Label>
              <Input 
                id="name" 
                value={newCause.name}
                onChange={e => setNewCause({...newCause, name: e.target.value})}
                placeholder="e.g. Strep Throat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseRate">Base Probability Rate (0-100)</Label>
              <Input 
                id="baseRate" 
                type="number" 
                min="0" 
                max="100"
                value={newCause.baseRate}
                onChange={e => setNewCause({...newCause, baseRate: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms (comma separated)</Label>
              <Textarea 
                id="symptoms" 
                value={newCause.symptoms}
                onChange={e => setNewCause({...newCause, symptoms: e.target.value})}
                placeholder="fever, sore throat, swollen lymph nodes..."
                className="h-24"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Condition</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-6 w-px bg-border mx-2" />

      <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} title="Undo">
        <RotateCcw className="w-4 h-4" />
      </Button>

      <Button variant="outline" size="icon" onClick={handleExport} title="Export JSON">
        <Download className="w-4 h-4" />
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Import JSON">
            <Upload className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Paste your JSON data here. This will overwrite current causes.
            </p>
            <Textarea 
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="font-mono text-xs h-48"
              placeholder='[{"name": "Example", "baseRate": 50, "symptoms": ["a", "b"]}]'
            />
            <DialogFooter>
              <Button onClick={handleImportSubmit}>Import Data</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => {
          if(confirm("Are you sure you want to reset the database to defaults?")) onReset();
        }}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Reset to Defaults"
      >
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  );
}
