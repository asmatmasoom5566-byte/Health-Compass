import { useState } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Trash, 
  Plus, 
  Database, 
  Edit2, 
  Trash2, 
  AlertCircle
} from 'lucide-react';
import { Cause } from '@shared/schema';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DataManagerProps {
  causes: Cause[];
  onImport: (json: string) => boolean;
  onReset: () => void;
  onAddCause: (cause: Omit<Cause, 'id'>) => void;
  onDeleteCause: (id: string) => void;
  onEditCause: (cause: Cause) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function DataManager({ causes, onImport, onReset, onAddCause, onDeleteCause, onEditCause, canUndo, onUndo }: DataManagerProps) {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
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
      <Dialog open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Database className="w-4 h-4" />
            Manage Database ({causes.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Condition Database</span>
              <Button size="sm" onClick={() => {
                setIsDatabaseOpen(false);
                setIsAddOpen(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" /> Add New
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4 pr-4">
            <div className="space-y-3">
              {causes.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Database is empty.</p>
                </div>
              ) : (
                causes.map(cause => (
                  <div key={cause.id} className="p-4 rounded-lg border border-border bg-card flex items-start justify-between group hover:border-primary/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{cause.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">{cause.baseRate}% Base Rate</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cause.symptoms.map(s => (
                          <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-transparent group-hover:border-border transition-colors">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEditCause(cause)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                        if(confirm(`Delete ${cause.name}?`)) onDeleteCause(cause.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="pt-4 border-t flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Import
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              if(confirm("Reset all conditions to defaults?")) onReset();
            }} className="text-muted-foreground hover:text-destructive">
              Reset to Defaults
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
              <Button variant="outline" onClick={() => {
                setIsAddOpen(false);
                setIsDatabaseOpen(true);
              }}>Cancel</Button>
              <Button type="submit">Save Condition</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-6 w-px bg-border mx-2" />

      <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} title="Undo">
        <RotateCcw className="w-4 h-4" />
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
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
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
              <Button onClick={handleImportSubmit}>Import Data</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
