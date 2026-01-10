import { useEffect, useState } from 'react';
import { Cause } from '@shared/schema';
import { Button } from '@/components/ui/button';
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
import { Plus, Minus, Palette } from "lucide-react";

const THEMES = ["teal", "blue", "green", "red", "purple", "orange"];

interface CauseEditModalProps {
  cause: Cause | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Cause>) => void;
}

export function CauseEditModal({ cause, isOpen, onClose, onSave }: CauseEditModalProps) {
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState("teal");
  const [formData, setFormData] = useState<{name: string, symptoms: string, atypicalSymptoms: string, note: string, treatment: string, details: string, labTest: string}>({
    name: "",
    symptoms: "",
    atypicalSymptoms: "",
    note: "",
    treatment: "",
    details: "",
    labTest: ""
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
      setFormData({
        name: cause.name,
        symptoms: cause.symptoms.join(", "),
        atypicalSymptoms: cause.atypicalSymptoms?.join(", ") || "",
        note: cause.note || "",
        treatment: cause.treatment || "",
        details: cause.details || "",
        labTest: cause.labTest || ""
      });
    } else {
      setFormData({
        name: "",
        symptoms: "",
        atypicalSymptoms: "",
        note: "",
        treatment: "",
        details: "",
        labTest: ""
      });
    }
  }, [cause, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cause) return;

    const symptomsList = formData.symptoms.split(',').map(s => s.trim()).filter(Boolean);
    const atypicalList = formData.atypicalSymptoms.split(',').map(s => s.trim()).filter(Boolean);
    
    onSave(cause.id, {
      name: formData.name,
      symptoms: symptomsList,
      atypicalSymptoms: atypicalList,
      note: formData.note,
      treatment: formData.treatment,
      details: formData.details,
      labTest: formData.labTest
    });
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const symptomsList = formData.symptoms.split(',').map(s => s.trim()).filter(Boolean);
    const atypicalList = formData.atypicalSymptoms.split(',').map(s => s.trim()).filter(Boolean);
    
    onSave("", {
      name: formData.name,
      symptoms: symptomsList,
      atypicalSymptoms: atypicalList,
      note: formData.note,
      treatment: formData.treatment,
      details: formData.details,
      labTest: formData.labTest
    });
    onClose();
  };

  const formAction = cause ? handleSubmit : handleCreate;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>{cause ? "Edit Condition" : "Add Condition"}</DialogTitle>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border scale-90">
            <div className="flex items-center gap-1 border-r pr-2">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 rounded-full" 
                onClick={() => setFontSize(s => Math.max(12, s - 1))}
                type="button"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-bold w-4 text-center">{fontSize}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 rounded-full" 
                onClick={() => setFontSize(s => Math.min(20, s + 1))}
                type="button"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-primary" 
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
              <Label htmlFor="edit-name">Condition Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-symptoms">Symptoms (comma separated)</Label>
              <Textarea 
                id="edit-symptoms" 
                value={formData.symptoms}
                onChange={e => setFormData({...formData, symptoms: e.target.value})}
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-atypical">Atypical Symptoms (comma separated)</Label>
              <Textarea 
                id="edit-atypical" 
                value={formData.atypicalSymptoms}
                onChange={e => setFormData({...formData, atypicalSymptoms: e.target.value})}
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-details">Condition Details</Label>
              <Textarea 
                id="edit-details" 
                value={formData.details}
                onChange={e => setFormData({...formData, details: e.target.value})}
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Specific Note</Label>
              <Textarea 
                id="edit-note" 
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                className="h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lab-test">Lab Tests</Label>
              <Textarea 
                id="edit-lab-test" 
                value={formData.labTest}
                onChange={e => setFormData({...formData, labTest: e.target.value})}
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-treatment">Treatment</Label>
              <Textarea 
                id="edit-treatment" 
                value={formData.treatment}
                onChange={e => setFormData({...formData, treatment: e.target.value})}
                className="h-20"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
