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
  const [formData, setFormData] = useState<{name: string, baseRate: number, symptoms: string}>({
    name: "",
    baseRate: 0,
    symptoms: ""
  });

  useEffect(() => {
    if (cause) {
      setFormData({
        name: cause.name,
        baseRate: cause.baseRate,
        symptoms: cause.symptoms.join(", ")
      });
    }
  }, [cause]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cause) return;

    const symptomsList = formData.symptoms.split(',').map(s => s.trim()).filter(Boolean);
    
    onSave(cause.id, {
      name: formData.name,
      baseRate: formData.baseRate,
      symptoms: symptomsList
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
            <Label htmlFor="edit-baseRate">Base Probability Rate (0-100)</Label>
            <Input 
              id="edit-baseRate" 
              type="number" 
              min="0" 
              max="100"
              value={formData.baseRate}
              onChange={e => setFormData({...formData, baseRate: parseInt(e.target.value) || 0})}
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
