import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useSymptomTracker } from '@/hooks/use-symptom-tracker';
import { SymptomInput } from '@/components/SymptomInput';
import { SuggestionList } from '@/components/SuggestionList';
import { DataManager } from '@/components/DataManager';
import { CauseEditModal } from '@/components/CauseEditModal';
import { Cause, AnalysisSession } from '@shared/schema';
import { Stethoscope, Clock, Check, X, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
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
                AI BRANCHING ANALYSIS
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
            <Card className="rounded-2xl shadow-sm border-border overflow-visible">
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
                      <p className="text-sm font-semibold text-muted-foreground uppercase">Analysis Completed</p>
                      <div className="space-y-2">
                        {session.diagnosisScores?.map((score, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-border shadow-sm">
                            <span className="font-bold">{score.name}</span>
                            <span className="text-primary font-mono text-sm">{score.score}% Match</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setSession(null)}>New Analysis</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                    {selectedCondition.labTest && (
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Lab Test</p>
                        <p className="text-sm text-foreground leading-relaxed">{selectedCondition.labTest}</p>
                      </div>
                    )}
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
