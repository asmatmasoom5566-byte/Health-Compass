import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { 
  Stethoscope, 
  History, 
  Database, 
  Activity,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Plus,
  Search,
  Download,
  X,
  User,
  BookOpen,
  Pill,
  FileText,
  ClipboardList,
  LogIn,
  UserPlus,
  Shield,
  LogOut
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { PatientDemographicsPanel } from "../components/PatientDemographicsPanel";
import { SymptomInput } from "../components/SymptomInput";
import { SuggestionList } from "../components/SuggestionList";
import { DataManager } from "../components/DataManager";
import { DiagnosticReasoningPanel } from "../components/DiagnosticReasoningPanel";
import { ClinicalCalculators } from "../components/ClinicalCalculators";
import { ReferenceRanges } from "../components/ReferenceRanges";
import { DifferentialComparison } from "../components/DifferentialComparison";
import { ConfidenceIndicator } from "../components/ConfidenceIndicator";
import { ConditionDetails } from "../components/ConditionDetails";

import { useSymptomTracker } from "../hooks/use-symptom-tracker";

import { Cause } from "@shared/schema";
import { DiagnosticReasoningEngine, PatientContext } from "../utils/diagnostic-reasoning";

import { DiagnosticQuestionsPanel } from "../components/DiagnosticQuestionsPanel";

export default function Landing() {
  const { user, isAuthenticated, isApproved, logout, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const noop = () => {}; // No-operation function for read-only users
  const {
    causes,
    selectedSymptoms,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    addCause,
    updateCause,
    updateMultipleCauses,
    deleteCause,
    resetDatabase,
    importData,
    canUndo
  } = useSymptomTracker();

  const [patientDemographics, setPatientDemographics] = useState({
    age: '' as number | '',
    sex: '' as 'Male' | 'Female' | '',
    duration: '' as number | '',
    durationUnit: '' as 'hours' | 'days' | 'weeks' | 'months' | 'years' | ''
  });

  const [showConfidence, setShowConfidence] = useState<Record<string, boolean>>({});
  const [showDifferential, setShowDifferential] = useState(false);
  const [showDiagnosticReasoning, setShowDiagnosticReasoning] = useState(false);
  const [showFullScreenComparison, setShowFullScreenComparison] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<Cause | null>(null);
  
  const [negativeFindings, setNegativeFindings] = useState<string[]>([]);
  const [diagnosticAnalysis, setDiagnosticAnalysis] = useState<any>(null);
  const [scoredCauses, setScoredCauses] = useState<any[]>([]);

  // Load demographics from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('patientDemographics');
    if (stored) {
      try {
        setPatientDemographics(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse demographics', e);
      }
    }
  }, []);

  // Save demographics to localStorage
  useEffect(() => {
    localStorage.setItem('patientDemographics', JSON.stringify(patientDemographics));
  }, [patientDemographics]);

  // Save current scored conditions to localStorage
  useEffect(() => {
    localStorage.setItem('currentScoredConditions', JSON.stringify(scoredCauses));
  }, [scoredCauses]);

  const handleAddSymptom = (symptom: string) => {
    addSymptom(symptom);
  };

  const handleRemoveSymptom = (symptom: string) => {
    removeSymptom(symptom);
  };

  const handleClearSymptoms = () => {
    clearSymptoms();
  };

  const handleDemographicsChange = (demographics: typeof patientDemographics) => {
    setPatientDemographics(demographics);
  };

  const handleClearDemographics = () => {
    setPatientDemographics({
      age: '',
      sex: '',
      duration: '',
      durationUnit: ''
    });
  };

  const handleSelectCause = (cause: Cause) => {
    console.log('Selected cause:', cause);
    // Set the selected condition to show details
    setSelectedCondition(cause);
  };

  // Handle close event from ConditionDetails
  useEffect(() => {
    const handleCloseEvent = () => {
      setSelectedCondition(null);
    };

    window.addEventListener('closeConditionDetails', handleCloseEvent);
    
    return () => {
      window.removeEventListener('closeConditionDetails', handleCloseEvent);
    };
  }, []);

  const handleScoredCausesChange = (newScoredCauses: any[]) => {
    setScoredCauses(newScoredCauses);
    
    // Perform diagnostic analysis when scored causes change
    if (patientDemographics.age && patientDemographics.sex && patientDemographics.duration && patientDemographics.durationUnit) {
      const patientContext: PatientContext = {
        age: Number(patientDemographics.age),
        sex: patientDemographics.sex.toLowerCase() as 'male' | 'female',
        symptoms: selectedSymptoms,
        duration: Number(patientDemographics.duration),
        durationUnit: patientDemographics.durationUnit
      };
      
      const analysis = DiagnosticReasoningEngine.performComprehensiveAnalysis(
        patientContext,
        newScoredCauses,
        negativeFindings
      );
      
      setDiagnosticAnalysis(analysis);
    }
  };

  const isPatientComplete = patientDemographics.age !== '' && 
                          patientDemographics.sex !== '' && 
                          patientDemographics.duration !== '' && 
                          patientDemographics.durationUnit !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent text-3xl font-black drop-shadow-lg">DR. ASMAT ULLAH MASOOM</h1>
                <p className="text-sm text-muted-foreground">Experienced Psychiatrist & Gastroenterologist</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Authentication Buttons */}
              {!isAuthenticated ? (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Register
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {isApproved && hasRole('admin') && (
                    <Link href="/admin">
                      <Button variant="outline" className="gap-2" size="sm">
                        <Shield className="w-3 h-3" />
                        <span className="text-xs">Admin</span>
                      </Button>
                    </Link>
                  )}
                </>
              )}

              <Link href="/history">
                <Button variant="outline" className="gap-1" size="sm">
                  <History className="w-3 h-3" />
                  <span className="text-xs">History</span>
                </Button>
              </Link>

              <Link href="/pharmacology">
                <Button variant="outline" className="gap-1" size="sm">
                  <Pill className="w-3 h-3" />
                  <span className="text-xs">Pharmacology</span>
                </Button>
              </Link>
              <Link href="/regester">
                <Button variant="outline" className="gap-1" size="sm">
                  <FileText className="w-3 h-3" />
                  <span className="text-xs">Regester</span>
                </Button>
              </Link>

              <Link href="/all-visits">
                <Button variant="outline" className="gap-1" size="sm">
                  <ClipboardList className="w-3 h-3" />
                  <span className="text-xs">All Visits</span>
                </Button>
              </Link>

              <Link href="/symptom-database">
                <Button variant="outline" className="gap-1" size="sm">
                  <Database className="w-3 h-3" />
                  <span className="text-xs">Symptom DB</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="diagnosis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diagnosis" className="gap-2">
              <Activity className="w-4 h-4" />
              Diagnosis
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
            
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Panel - Patient Input - 40% Width */}
              <div className="lg:col-span-2 space-y-6">
                <PatientDemographicsPanel
                  demographics={patientDemographics}
                  onChange={handleDemographicsChange}
                  onClear={handleClearDemographics}
                  showValidation={true}
                />
                
                <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      <Activity className="w-5 h-5 text-primary" />
                      Symptom Input
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SymptomInput
                      selectedSymptoms={selectedSymptoms}
                      onAdd={handleAddSymptom}
                      onRemove={handleRemoveSymptom}
                      onClear={handleClearSymptoms}
                      knownSymptoms={Array.from(new Set(causes.flatMap(c => c.symptoms)))}
                    />
                  </CardContent>
                </Card>
                
                {/* Condition Details Section */}
                <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-black bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      Condition Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConditionDetails condition={selectedCondition} />
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Results - 60% Width */}
              <div className="lg:col-span-3 space-y-6">
                {isPatientComplete && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      Age: {patientDemographics.age} years
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      Sex: {patientDemographics.sex}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      Duration: {patientDemographics.duration} {patientDemographics.durationUnit}
                    </Badge>
                  </div>
                )}

                <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between font-black bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Suggested Conditions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowDifferential(!showDifferential);
                            setShowFullScreenComparison(!showDifferential);
                          }}
                          className="gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          {showDifferential ? 'Hide' : 'Show'} Comparison
                        </Button>

                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SuggestionList
                      causes={causes}
                      selectedSymptoms={selectedSymptoms}
                      patientDemographics={patientDemographics}
                      onEdit={isAdmin ? (cause) => updateCause(cause.id, cause) : noop}
                      onDelete={isAdmin ? deleteCause : noop}
                      onSelect={handleSelectCause}
                      onScoredCausesChange={handleScoredCausesChange}
                      onAddSymptom={handleAddSymptom}
                      canEdit={isAdmin}
                    />
                    
                    {isPatientComplete && (
                      <>
                        <DiagnosticQuestionsPanel
                          causes={causes}
                          scoredCauses={scoredCauses}
                          selectedSymptoms={selectedSymptoms}
                          onAddSymptom={handleAddSymptom}
                        />
                      </>
                    )}
                    

                  </CardContent>
                </Card>



                {/* Differential Comparison */}
                {showDifferential && scoredCauses.length > 1 && (
                  <DifferentialComparison
                    conditions={scoredCauses.map(cause => ({
                      ...cause,
                      keyFeatures: cause.symptoms || [],
                      discriminatorFeatures: cause.atypicalSymptoms || [],
                      ageRange: cause.ageRule ? { min: cause.ageRule.min || 0, max: cause.ageRule.max || 150 } : undefined,
                      sexApplicability: cause.sexRule
                    }))}
                    onClose={() => {
                      setShowDifferential(false);
                      setShowFullScreenComparison(false);
                    }}
                    className={showFullScreenComparison ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}
                  />
                )}

              </div>
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Condition Database Management
                  {!isAdmin && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Read-only)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataManager
                  causes={causes}
                  onImport={isAdmin ? importData : () => false}
                  onReset={isAdmin ? resetDatabase : () => {}}
                  onAddCause={isAdmin ? addCause : () => {}}
                  onDeleteCause={isAdmin ? deleteCause : () => {}}
                  onEditCause={isAdmin ? (cause) => updateCause(cause.id, cause) : () => {}}
                  onUpdateCauses={isAdmin ? (updatedCauses) => {
                    updateMultipleCauses(updatedCauses);
                  } : () => {}}
                  canUndo={canUndo}
                  onUndo={() => {}}
                />
              </CardContent>
            </Card>
          </TabsContent>

          

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClinicalCalculators />
              <ReferenceRanges />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}