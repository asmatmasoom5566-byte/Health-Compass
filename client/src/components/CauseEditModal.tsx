import { useEffect, useState } from 'react';
import { Cause } from '@shared/schema';
import { Button } from '@/components/ui/button';
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

interface CauseEditModalProps {
  cause: Cause | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Cause>) => void;
}

export function CauseEditModal({ cause, isOpen, onClose, onSave }: CauseEditModalProps) {
  const [formData, setFormData] = useState<{name: string, symptoms: string, note: string, treatment: string}>({
    name: "",
    symptoms: "",
    note: "",
    treatment: ""
  });

  useEffect(() => {
    if (cause) {
      setFormData({
        name: cause.name,
        symptoms: cause.symptoms.join(", "),
        note: cause.note || "",
        treatment: cause.treatment || ""
      });
    }
  }, [cause]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cause) return;

    const symptomsList = formData.symptoms.split(',').map(s => s.trim()).filter(Boolean);
    
    onSave(cause.id, {
      name: formData.name,
      symptoms: symptomsList,
      note: formData.note,
      treatment: formData.treatment
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Condition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
              className="h-32"
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
      </DialogContent>
    </Dialog>
  );
}
