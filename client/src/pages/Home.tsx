import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useSymptomTracker } from '@/hooks/use-symptom-tracker';
import { SymptomInput } from '@/components/SymptomInput';
import { SuggestionList } from '@/components/SuggestionList';
import { DataManager } from '@/components/DataManager';
import { CauseEditModal } from '@/components/CauseEditModal';
import { Cause } from '@shared/schema';
import { Stethoscope, Clock, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [selectedCondition, setSelectedCondition] = useState<Cause | null>(null);

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

            {selectedCondition ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground font-display">{selectedCondition.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCondition(null)}>Close</Button>
                </div>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Symptoms</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCondition.symptoms.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedCondition.atypicalSymptoms && selectedCondition.atypicalSymptoms.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Atypical Symptoms</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedCondition.atypicalSymptoms.map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Condition Details</p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedCondition.details || "No details available."}</p>
                    </div>
                    {selectedCondition.note && (
                      <div>
                        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Note</p>
                        <p className="text-sm text-red-700 dark:text-red-300 italic border-l-2 border-red-200 pl-2">{selectedCondition.note}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Lab Test</p>
                      <p className="text-sm text-foreground leading-relaxed">{selectedCondition.labTest || "No lab tests specified."}</p>
                    </div>
                    {selectedCondition.treatment && (
                      <div>
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">Treatment</p>
                        <p className="text-sm text-foreground leading-relaxed">{selectedCondition.treatment}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-primary mb-2">Condition Details</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select a condition from the results on the right to view full details, including symptoms and recommended treatments.
                </p>
              </div>
            )}
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
              onSelect={setSelectedCondition}
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
