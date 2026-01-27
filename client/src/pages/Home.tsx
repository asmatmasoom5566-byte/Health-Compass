import { useState, useMemo } from 'react';
import { useSymptomTracker } from '@/hooks/use-symptom-tracker';
import { SymptomInput } from '@/components/SymptomInput';
import { SuggestionList } from '@/components/SuggestionList';
import { DataManager } from '@/components/DataManager';
import { CauseEditModal } from '@/components/CauseEditModal';
import { Cause, AnalysisSession } from '@shared/schema';
import { Stethoscope, Clock, Check, X, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Home() {
  const { toast } = useToast();
  const {
    causes,
    selectedSymptoms,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    addCause,
    updateCause,
    deleteCause,
    importData,
    resetDatabase,
    canUndo
  } = useSymptomTracker();

  const [editingCause, setEditingCause] = useState<Cause | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Cause | null>(null);
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [loading, setLoading] = useState(false);

  const startAnalysis = async (symptom: string) => {
    setLoading(true);
    try {
      const res = await apiRequest('POST', '/api/analysis/start', { symptom });
      const data = await res.json();
      setSession(data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to start analysis", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: boolean) => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await apiRequest('POST', `/api/analysis/${session.id}/answer`, { answer });
      const data = await res.json();
      setSession(data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit answer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const knownSymptoms = useMemo(() => {
    const all = new Set<string>();
    causes.forEach(c => c.symptoms.forEach(s => all.add(s.toLowerCase())));
    return Array.from(all).sort();
  }, [causes]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
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
                AI BRANCHING ANALYSIS
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
          
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl shadow-sm border-border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Symptom Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SymptomInput 
                  selectedSymptoms={selectedSymptoms}
                  onAdd={(s) => {
                    addSymptom(s);
                    if (!session) startAnalysis(s);
                  }}
                  onRemove={removeSymptom}
                  onClear={() => {
                    clearSymptoms();
                    setSession(null);
                  }}
                  knownSymptoms={knownSymptoms}
                />
              </CardContent>
            </Card>

            {session && (
              <Card className="rounded-2xl shadow-md border-primary/20 bg-primary/5 animate-in fade-in zoom-in-95 duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                    <ArrowRight className="w-4 h-4" />
                    AI Follow-up
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {session.status === 'active' ? (
                    <div className="space-y-4">
                      <p className="text-lg font-medium text-foreground leading-tight">
                        {session.currentQuestion}
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 h-12"
                          onClick={() => submitAnswer(true)}
                          disabled={loading}
                        >
                          <Check className="w-5 h-5" /> YES
                        </Button>
                        <Button 
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2 h-12"
                          onClick={() => submitAnswer(false)}
                          disabled={loading}
                        >
                          <X className="w-5 h-5" /> NO
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-muted-foreground uppercase">Top Analysis Results</p>
                      {session.diagnosisScores?.map((score, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-border shadow-sm">
                          <span className="font-bold">{score.name}</span>
                          <span className="text-primary font-mono text-sm">{score.score}% Match</span>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={() => setSession(null)}>New Analysis</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">Potential Conditions</h2>
              <span className="text-sm text-muted-foreground">
                Matched via Symptoms
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
