import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useSymptomTracker } from '@/hooks/use-symptom-tracker';
import { SymptomInput } from '@/components/SymptomInput';
import { SuggestionList } from '@/components/SuggestionList';
import { DataManager } from '@/components/DataManager';
import { CauseEditModal } from '@/components/CauseEditModal';
import { Cause } from '@shared/schema';
import { Stethoscope, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const {
    causes,
    selectedSymptoms,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    addCause,
    updateCause,
    deleteCause,
    resetDatabase,
    importData,
    canUndo
  } = useSymptomTracker();

  const [editingCause, setEditingCause] = useState<Cause | null>(null);

  // Derive all unique symptoms for autocomplete
  const knownSymptoms = useMemo(() => {
    const all = new Set<string>();
    causes.forEach(c => c.symptoms.forEach(s => all.add(s.toLowerCase())));
    return Array.from(all).sort();
  }, [causes]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header / Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground font-display leading-none">
                DR. ASMAT MASOOM
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                symptom analysis engine
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/history">
              <Button variant="outline" size="sm" className="gap-2">
                <Clock className="w-4 h-4" />
                History
              </Button>
            </Link>
            <DataManager 
              causes={causes}
              onImport={importData}
              onReset={resetDatabase}
              onAddCause={addCause}
              onDeleteCause={deleteCause}
              onEditCause={setEditingCause}
              canUndo={canUndo}
              onUndo={() => {}}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border">
              <SymptomInput 
                selectedSymptoms={selectedSymptoms}
                onAdd={addSymptom}
                onRemove={removeSymptom}
                onClear={clearSymptoms}
                knownSymptoms={knownSymptoms}
              />
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-primary mb-2">Condition Details</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Select a condition from the results on the right to view full details, including symptoms and recommended treatments.
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">Analysis Results</h2>
              <span className="text-sm text-muted-foreground">
                {causes.length} conditions in database
              </span>
            </div>
            
            <SuggestionList 
              causes={causes}
              selectedSymptoms={selectedSymptoms}
              onEdit={setEditingCause}
              onDelete={deleteCause}
            />
          </div>

        </div>
      </main>

      <CauseEditModal 
        cause={editingCause}
        isOpen={!!editingCause}
        onClose={() => setEditingCause(null)}
        onSave={updateCause}
      />
    </div>
  );
}
