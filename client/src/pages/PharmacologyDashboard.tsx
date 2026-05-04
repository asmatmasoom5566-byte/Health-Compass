import { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Filter,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  Lightbulb,
  ArrowLeft,
  AlertCircle,
  Plus,
  Maximize2,
  BarChart3
} from 'lucide-react';
import { Medicine, MedicineEvaluation } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { usePharmacology } from '@/hooks/use-pharmacology';
import { evaluateAllMedicines, PatientDemographics } from '@/utils/medicine-matcher';
import { PharmacologyDataManager } from '@/components/PharmacologyDataManager';
import { MedicineComparison } from '@/components/MedicineComparison';
import { DrugClassComparison } from '@/components/DrugClassComparison';
import { MedicineComparisonSelector } from '@/components/MedicineComparisonSelector';
import { DetailedMedicineComparison } from '@/components/DetailedMedicineComparison';
import { ShortMedicineComparison } from '@/components/ShortMedicineComparison';
import { Link } from "wouter";

export default function PharmacologyDashboard() {
  const { toast } = useToast();
  const { medicines } = usePharmacology();
  
  const [patientDemographics, setPatientDemographics] = useState({
    age: '' as number | '',
    sex: '' as 'Male' | 'Female' | '',
    duration: '' as number | '',
    durationUnit: '' as 'hours' | 'days' | 'weeks' | 'months' | 'years' | ''
  });
  
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [evaluatedMedicines, setEvaluatedMedicines] = useState<MedicineEvaluation[]>([]);
  const [isTeachingMode, setIsTeachingMode] = useState(() => {
    // Load teaching mode state from localStorage
    const saved = localStorage.getItem('pharmacology_teaching_mode');
    return saved === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrugClass, setSelectedDrugClass] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showFullPageSuggestions, setShowFullPageSuggestions] = useState(false);
  const [showDrugClassComparison, setShowDrugClassComparison] = useState(false);
  const [comparisonDrugClass, setComparisonDrugClass] = useState<string>("");
  const [showComparisonSelector, setShowComparisonSelector] = useState(false);
  const [medicinesToCompare, setMedicinesToCompare] = useState<Medicine[]>([]);
  const [preservedMedicineNames, setPreservedMedicineNames] = useState<string[]>(['', '', '']);
  const [isShortCompareMode, setIsShortCompareMode] = useState(false); // Track if showing short compare

  // Get qualified medicines for comparison
  const qualifiedMedicines = evaluatedMedicines.filter(m => m.suitabilityScore > 0);

  // Load demographics from localStorage on mount and set up real-time sync
  useEffect(() => {
    const loadPatientData = () => {
      // Load demographics
      const storedDemographics = localStorage.getItem('patientDemographics');
      if (storedDemographics) {
        try {
          const parsed = JSON.parse(storedDemographics);
          setPatientDemographics(parsed);
        } catch (e) {
          console.error('Failed to parse demographics', e);
        }
      }
      
      // Load symptoms from the symptom tracker storage
      const storedTrackerData = localStorage.getItem('symptom_tracker_v1');
      if (storedTrackerData) {
        try {
          const parsed = JSON.parse(storedTrackerData);
          if (parsed && Array.isArray(parsed.selectedSymptoms)) {
            setSymptoms(parsed.selectedSymptoms);
          }
        } catch (e) {
          console.error('Failed to parse tracker data', e);
        }
      } else {
        // Fallback: try loading from the old key if new key doesn't exist
        const storedSymptoms = localStorage.getItem('selectedSymptoms');
        if (storedSymptoms) {
          try {
            const parsed = JSON.parse(storedSymptoms);
            if (Array.isArray(parsed)) {
              setSymptoms(parsed);
            }
          } catch (e) {
            console.error('Failed to parse symptoms', e);
          }
        }
      }
    };

    // Load initial data
    loadPatientData();

    // Set up storage event listener for real-time sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patientDemographics' || e.key === 'symptom_tracker_v1' || e.key === 'selectedSymptoms') {
        loadPatientData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-tab updates)
    const interval = setInterval(loadPatientData, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Check if patient data is complete
  const isPatientComplete = 
    patientDemographics.age !== '' && 
    patientDemographics.sex !== '' && 
    patientDemographics.duration !== '' && 
    patientDemographics.durationUnit !== '' &&
    symptoms.length > 0;

  // Evaluate medicines when patient data or symptoms change
  useEffect(() => {
    if (isPatientComplete && medicines.length > 0) {
      try {
        const patientContext: PatientDemographics = {
          age: Number(patientDemographics.age),
          sex: patientDemographics.sex as 'Male' | 'Female',
          duration: Number(patientDemographics.duration),
          durationUnit: patientDemographics.durationUnit as any
        };
        
        const results = evaluateAllMedicines(medicines, patientContext, symptoms);
        setEvaluatedMedicines(results);
      } catch (error) {
        console.error('Error evaluating medicines:', error);
        toast({
          title: "Evaluation Error",
          description: "Failed to evaluate medicines for current patient.",
          variant: "destructive"
        });
      }
    } else {
      setEvaluatedMedicines([]);
    }
  }, [medicines, patientDemographics, symptoms, toast]);

  // Filter medicines based on search and drug class
  const filteredMedicines = evaluatedMedicines.filter(evaluation => {
    const medicine = evaluation.medicine;
    const matchesSearch = !searchQuery || 
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.drugClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.reasoning.some(reason => reason.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDrugClass = !selectedDrugClass || medicine.drugClass === selectedDrugClass;
    
    return matchesSearch && matchesDrugClass;
  }).filter(evaluation => {
    // Only show medicines when patient data is complete
    if (!isPatientComplete) return true;
    
    // Apply exclusion rules when patient data is complete:
    // - Only show medicines that have symptom matches
    // - Allow users to see contraindicated medicines but not those without symptom matches
    return evaluation.suitabilityScore > 0; // Only medicines with symptom matches will have score > 0
  });

  // Get unique drug classes for filter
  const drugClasses = Array.from(new Set(evaluatedMedicines.map(evaluation => evaluation.medicine.drugClass))).sort();

  // Get medicines filtered by drug class for comparison (Medicine[] not MedicineEvaluation[])
  const drugClassFiltered = filteredMedicines.map(evaluation => evaluation.medicine);

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-teal-900">
      {showComparisonSelector ? (
        <MedicineComparisonSelector
          allMedicines={medicines}
          preservedNames={preservedMedicineNames}
          onBack={() => setShowComparisonSelector(false)}
          onCompare={(selectedMeds) => {
            console.log('=== Selected Medicines for Full Comparison ===');
            console.log('Count:', selectedMeds.length);
            console.log('Medicines:', selectedMeds.map(m => ({ name: m.name, id: m.id })));
            console.log('✓ Source: Complete pharmacology database (not patient-filtered)');
            // Preserve the medicine names before navigating to comparison view
            setPreservedMedicineNames(selectedMeds.map(m => m.name));
            setMedicinesToCompare(selectedMeds);
            setIsShortCompareMode(false); // Full compare mode
          }}
          onShortCompare={(selectedMeds) => {
            console.log('=== Selected Medicines for Short Comparison ===');
            console.log('Count:', selectedMeds.length);
            console.log('Medicines:', selectedMeds.map(m => ({ name: m.name, id: m.id })));
            // Preserve the medicine names before navigating to comparison view
            setPreservedMedicineNames(selectedMeds.map(m => m.name));
            setMedicinesToCompare(selectedMeds);
            setIsShortCompareMode(true); // Short compare mode
          }}
        />
      ) : medicinesToCompare.length > 0 ? (
        isShortCompareMode ? (
          <ShortMedicineComparison
            medicines={medicinesToCompare}
            onBack={() => {
              setMedicinesToCompare([]);
              setShowComparisonSelector(true); // Return to medicine selection interface
            }}
            onChangeSelection={() => {
              setMedicinesToCompare([]);
              setShowComparisonSelector(true); // Return to medicine selection interface
              // Don't clear preserved names when changing selection
            }}
          />
        ) : (
          <DetailedMedicineComparison
            medicines={medicinesToCompare}
            onBack={() => {
              setMedicinesToCompare([]);
              setShowComparisonSelector(true); // Return to medicine selection interface
            }}
            onChangeSelection={() => {
              setMedicinesToCompare([]);
              setShowComparisonSelector(true); // Return to medicine selection interface
              // Don't clear preserved names when changing selection
            }}
          />
        )
      ) : showComparison ? (
        <MedicineComparison
          medicines={qualifiedMedicines}
          patientDemographics={{
            age: Number(patientDemographics.age),
            sex: patientDemographics.sex as 'Male' | 'Female',
            duration: Number(patientDemographics.duration),
            durationUnit: patientDemographics.durationUnit
          }}
          symptoms={symptoms}
          onBack={() => setShowComparison(false)}
          onSelectMedicine={(medicine) => {
            setSelectedMedicine(medicine);
            setShowComparison(false);
            toast({
              title: "Medicine Selected",
              description: `${medicine.name} has been selected for this patient.`
            });
          }}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white/20 to-teal-50/30 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-xl border-b border-white/30 shadow-2xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" className="gap-2 mr-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-x-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Diagnosis
                </Button>
              </Link>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pill className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacology Intelligence</h1>
                <p className="text-sm text-muted-foreground">
                  Clinical medicine matching with safety evaluation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={isTeachingMode ? "default" : "outline"}
                onClick={() => {
                  const newState = !isTeachingMode;
                  setIsTeachingMode(newState);
                  localStorage.setItem('pharmacology_teaching_mode', String(newState));
                }}
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Lightbulb className="w-4 h-4" />
                {isTeachingMode ? 'Teaching Mode ON' : 'Teaching Mode'})
              </Button>

              <Button
                onClick={() => setShowComparisonSelector(true)}
                variant="default"
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <BarChart3 className="w-4 h-4" />
                Compare Medicines
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel - Patient Summary Display */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient Demographics Summary */}
            <Card className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-lg border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {isPatientComplete ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-muted-foreground font-medium text-xs">Age:</span>
                      <span className="font-semibold text-sm">{patientDemographics.age} years</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-muted-foreground font-medium text-xs">Sex:</span>
                      <span className="font-semibold text-sm">{patientDemographics.sex}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-muted-foreground font-medium text-xs">Duration:</span>
                      <span className="font-semibold text-sm">{patientDemographics.duration} {patientDemographics.durationUnit}</span>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-muted-foreground font-medium mb-1 text-xs">Symptoms:</div>
                      <div className="flex flex-wrap gap-1">
                        {symptoms.map((symptom, index) => {
                      const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                          return (
                            <Badge key={index} variant="secondary" className="text-[10px] py-0.5 px-1.5">
                              {symptomText}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Total: {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">No Patient Data</p>
                    <p className="text-xs">
                      Please enter patient info on Diagnosis page
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Database Management */}
            <Card className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-lg border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <BookOpen className="w-3 h-3 text-primary" />
                  <span className="text-xs">Medicine Database</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <PharmacologyDataManager />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Medicine Suggestions */}
          <div className="lg:col-span-9 space-y-6">
            {/* Search and Filter */}
            <Card className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-lg border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-primary" />
                    Best Medicine Suggestions
                    {isPatientComplete && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredMedicines.length} recommendations
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullPageSuggestions(true)}
                    className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Full Page
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isPatientComplete ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Enter patient information to get medicine recommendations</p>
                    <p className="text-sm">Complete demographics and symptoms on the Diagnosis page to see personalized suggestions</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex-1 min-w-64">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search recommendations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-48">
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <select
                            value={selectedDrugClass}
                            onChange={(e) => setSelectedDrugClass(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <option value="">All Drug Classes</option>
                            {drugClasses.map((cls: string) => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Comparison Buttons */}
                      <div className="flex gap-2">
                        {/* Patient-Specific Comparison */}
                        {filteredMedicines.filter(m => m.suitabilityScore > 0).length > 0 && (
                          <Button
                            onClick={() => setShowComparison(true)}
                            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <Pill className="w-4 h-4" />
                            Compare Top {Math.min(3, filteredMedicines.filter(m => m.suitabilityScore > 0).length)} (Patient-Specific)
                          </Button>
                        )}
                        
                        {/* Drug Class Comparison */}
                        {selectedDrugClass && (
                          <Button
                            onClick={() => {
                              setComparisonDrugClass(selectedDrugClass);
                              setShowDrugClassComparison(true);
                            }}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Compare {selectedDrugClass} ({drugClassFiltered.length})
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Patient Summary and Match Statistics - HIDDEN */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{symptoms.length}</div>
                        <div className="text-sm text-muted-foreground">Symptoms</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{evaluatedMedicines.length}</div>
                        <div className="text-sm text-muted-foreground">Total Medicines</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {evaluatedMedicines.filter(m => m.isSuitable && !m.isContraindicated).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Suitable</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {evaluatedMedicines.filter(m => m.isContraindicated).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Contraindicated</div>
                      </div>
                    </div> */}

                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {filteredMedicines.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No suitable medicines found</p>
                            <p className="text-sm">Try adjusting patient demographics or symptoms on the Diagnosis page</p>
                          </div>
                        ) : (
                          filteredMedicines.map((evaluation, index) => (
                            <MedicineRecommendationCard
                              key={evaluation.medicine.id}
                              evaluation={evaluation}
                              index={index}
                              isTeachingMode={isTeachingMode}
                              symptoms={symptoms}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
      )}
    </div>

    {/* Full Page Medicine Suggestions View */}
    {showFullPageSuggestions && (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50/30 via-white/20 to-teal-50/30 backdrop-blur-sm overflow-auto">
        <div className="min-h-screen">
          {/* Full Page Header */}
          <div className="bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-xl border-b border-white/30 shadow-2xl sticky top-0 z-10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFullPageSuggestions(false)}
                    className="gap-2 mr-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Pill className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Best Medicine Suggestions</h1>
                    <p className="text-sm text-muted-foreground">
                      Full page view - {filteredMedicines.length} recommendations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Page Content */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search and Filter Controls */}
            <Card className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-lg border border-white/50 shadow-2xl mb-6">
              <CardContent className="py-6">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search recommendations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-48">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <select
                        value={selectedDrugClass}
                        onChange={(e) => setSelectedDrugClass(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">All Drug Classes</option>
                        {drugClasses.map((cls: string) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Comparison Buttons */}
                  <div className="flex gap-2">
                    {/* Patient-Specific Comparison */}
                    {filteredMedicines.filter(m => m.suitabilityScore > 0).length > 0 && (
                      <Button
                        onClick={() => {
                          setShowComparison(true);
                          setShowFullPageSuggestions(false);
                        }}
                        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Pill className="w-4 h-4" />
                        Compare Top {Math.min(3, filteredMedicines.filter(m => m.suitabilityScore > 0).length)} (Patient-Specific)
                      </Button>
                    )}
                    
                    {/* Drug Class Comparison */}
                    {selectedDrugClass && (
                      <Button
                        onClick={() => {
                          setComparisonDrugClass(selectedDrugClass);
                          setShowDrugClassComparison(true);
                          setShowFullPageSuggestions(false);
                        }}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Compare {selectedDrugClass} ({drugClassFiltered.length})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Statistics - HIDDEN */}
                {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{symptoms.length}</div>
                    <div className="text-sm text-muted-foreground">Symptoms</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{evaluatedMedicines.length}</div>
                    <div className="text-sm text-muted-foreground">Total Medicines</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {evaluatedMedicines.filter(m => m.isSuitable && !m.isContraindicated).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Suitable</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {evaluatedMedicines.filter(m => m.isContraindicated).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Contraindicated</div>
                  </div>
                </div> */}
              </CardContent>
            </Card>

            {/* Medicine Suggestions List */}
            <div className="space-y-4">
              {filteredMedicines.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No suitable medicines found</p>
                  <p className="text-sm">Try adjusting patient demographics or symptoms on the Diagnosis page</p>
                </div>
              ) : (
                filteredMedicines.map((evaluation, index) => (
                  <MedicineRecommendationCard
                    key={evaluation.medicine.id}
                    evaluation={evaluation}
                    index={index}
                    isTeachingMode={isTeachingMode}
                    symptoms={symptoms}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Drug Class Comparison View */}
    {showDrugClassComparison && (
      <DrugClassComparison
        drugClass={comparisonDrugClass}
        medicines={drugClassFiltered}
        onBack={() => setShowDrugClassComparison(false)}
      />
    )}

    </TooltipProvider>
  );
}

interface MedicineRecommendationCardProps {
  evaluation: MedicineEvaluation;
  index: number;
  isTeachingMode: boolean;
  symptoms: string[];
}

function MedicineRecommendationCard({ evaluation, index, isTeachingMode, symptoms }: MedicineRecommendationCardProps) {
  const { medicine, suitabilityScore, reasoning, warnings, safetyFlags, isSuitable, isContraindicated } = evaluation;
  
  // Debug logging for advantage and details
  if (medicine.medicineAdvantage) {
    console.log(`Medicine ${medicine.name} has advantage:`, medicine.medicineAdvantage);
  }
  if (medicine.clinicalUseDetails && medicine.clinicalUseDetails.length > 0) {
    console.log(`Medicine ${medicine.name} has ${medicine.clinicalUseDetails.length} clinical use details`);
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 30) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Determine safety status
  let safetyStatus = 'safe';
  let safetyText = 'Safe';
  if (isContraindicated) {
    safetyStatus = 'contraindicated';
    safetyText = 'Contraindicated';
  } else if (!isSuitable || (warnings && warnings.length > 0)) {
    safetyStatus = 'caution';
    safetyText = 'Caution';
  }



  return (
    <div className={`p-4 border rounded-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${isContraindicated ? 'border-red-300 bg-gradient-to-br from-red-50/80 to-red-100/80 shadow-red-200/50' : (!isSuitable ? 'border-orange-300 bg-gradient-to-br from-orange-50/80 to-orange-100/80 shadow-orange-200/50' : 'border-green-300 bg-gradient-to-br from-green-50/80 to-green-100/80 shadow-green-200/50')} `}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-full ${getScoreBg(suitabilityScore)} flex items-center justify-center`}>
              <span className={`font-bold ${getScoreColor(suitabilityScore)}`}>{index + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{medicine.name}</h3>
            {/* Only show drug class in teaching mode */}
            {isTeachingMode && (
              <Badge variant="secondary">{medicine.drugClass}</Badge>
            )}
            {/* Safety status badge */}
            <Badge 
              variant={
                safetyStatus === 'contraindicated' ? "destructive" : 
                (safetyStatus === 'caution' ? "outline" : "secondary")
              }
              className={`text-xs ${
                safetyStatus === 'contraindicated' ? '' : 
                (safetyStatus === 'caution' ? 'border-orange-500 text-orange-600' : 
                'bg-green-100 text-green-800')
              }`}
            >
              {safetyText.toUpperCase()}
            </Badge>
          </div>
          {/* Only show mechanism in teaching mode */}
          {isTeachingMode && (
            <p className="text-sm text-muted-foreground mb-2">
              {medicine.mechanismOfAction}
            </p>
          )}
        </div>
        {/* Only show suitability score in teaching mode */}
        {isTeachingMode && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(suitabilityScore)}`}>
              {suitabilityScore}%
            </div>
            <div className="text-xs text-muted-foreground">Suitability</div>
          </div>
        )}
      </div>

      {/* Clinical Mode - Two Column Layout */}
      {!isTeachingMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Clinical Uses and Reasoning */}
          <div className="space-y-3">
            {/* Why This Medicine Fits */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                {isContraindicated ? <XCircle className="w-4 h-4 text-red-600" /> : 
                 !isSuitable ? <AlertTriangle className="w-4 h-4 text-orange-600" /> : 
                 <CheckCircle className="w-4 h-4 text-green-600" />}
                {isContraindicated ? "Why Contraindicated:" : 
                 !isSuitable ? "Why Not Suitable:" : 
                 "Why This Medicine Fits:"}
              </h4>
              
              {/* Clinical Uses with Detail Icons */}
              <div className="space-y-2">
                {medicine.clinicalUses.map((use, useIdx) => {
                  // Check if this clinical use has details
                  const hasDetails = medicine.clinicalUseDetails?.some(d => d.useName === use && d.details);
                  
                  return (
                    <div key={useIdx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <div className="flex-1">
                        <span className="text-sm">{use}</span>
                        {hasDetails && (
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex ml-2 cursor-pointer p-0.5 rounded hover:bg-blue-50 transition-colors align-middle">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-md p-4 bg-white shadow-lg border border-blue-200">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-blue-700">Clinical Use Details</span>
                                </div>
                                {(() => {
                                  const detail = medicine.clinicalUseDetails?.find(d => d.useName === use);
                                  return detail?.details ? (
                                    <>
                                      <p className="text-sm text-gray-800">{detail.details}</p>
                                      <p className="text-xs text-gray-500 mt-2 italic">
                                        Doctor-entered clinical explanation
                                      </p>
                                    </>
                                  ) : null;
                                })()}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Augmenting Other Medicines - Always Displayed */}
            {(medicine as any).simplifiedStructuredAugmentingMedicines && (medicine as any).simplifiedStructuredAugmentingMedicines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-700 text-sm">Augmenting Other Medicines</span>
                </div>
                
                <div className="space-y-2">
                  {((medicine as any).simplifiedStructuredAugmentingMedicines as string[]).map((part: string, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                      <div className="whitespace-pre-line space-y-1">
                        {part.split('\n').map((line, lineIdx) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={lineIdx} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                          }
                          return <div key={lineIdx} style={{ fontSize: '14px' }}>{line}</div>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Legacy Augmenting Medicines (for backward compatibility) - Always Displayed */}
            {!((medicine as any).simplifiedStructuredAugmentingMedicines && (medicine as any).simplifiedStructuredAugmentingMedicines.length > 0) && (medicine as any).augmentingMedicines && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-700 text-sm">Augmenting Other Medicines</span>
                </div>
                
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <div className="whitespace-pre-line space-y-1">
                        {((medicine as any).augmentingMedicines as string).split('\n').map((line, index) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                          }
                          return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                        })}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                        <span>Click to read full augmentation info</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-md p-4 bg-white shadow-lg border border-purple-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Plus className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-700">Augmenting Other Medicines</span>
                      </div>
                      <div className="whitespace-pre-line space-y-1">
                        {((medicine as any).augmentingMedicines as string).split('\n').map((line, index) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                          }
                          return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Synergistic combinations and potentiation effects
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Safety Status */}
            <div className={`p-2 rounded text-sm ${
              safetyStatus === 'contraindicated' ? 'bg-red-100 text-red-800' : 
              safetyStatus === 'caution' ? 'bg-orange-100 text-orange-800' : 
              'bg-green-100 text-green-800'
            }`}>
              <span className="font-medium">Safety Status:</span> {safetyText}
              {safetyFlags && safetyFlags.length > 0 && (
                <span className="ml-2">({safetyFlags.join(', ')})</span>
              )}
            </div>
          </div>
          
          {/* Right Column - Medicine Advantage (only if exists) */}
          {medicine.medicineAdvantage && (
            <div className="md:border-l md:pl-4 border-gray-200">
              <div className="space-y-3">
                {/* Medicine Advantage */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700 text-sm">Medicine Advantage</span>
                  </div>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div className="cursor-pointer">
                        <div className="whitespace-pre-line space-y-1">
                          {medicine.medicineAdvantage.split('\n').map((line, index) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('➥')) {
                              return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                            }
                            return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                          <span>Click to read full advantage</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-md p-4 bg-white shadow-lg border border-green-200">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">Medicine Advantage</span>
                        </div>
                        <div className="whitespace-pre-line space-y-1">
                          {medicine.medicineAdvantage.split('\n').map((line, index) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('➥')) {
                              return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                            }
                            return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Doctor-entered advantages based on clinical experience
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Medicine Disadvantage */}
                {(medicine as any).medicineDisadvantage && (
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-700 text-sm">Medicine Disadvantage</span>
                    </div>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <div className="whitespace-pre-line space-y-1">
                            {((medicine as any).medicineDisadvantage as string).split('\n').map((line, index) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('➥')) {
                                return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                              }
                              return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                            })}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <span>Click to read full disadvantage</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md p-4 bg-white shadow-lg border border-red-200">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-700">Medicine Disadvantage</span>
                          </div>
                          <div className="whitespace-pre-line space-y-1">
                            {((medicine as any).medicineDisadvantage as string).split('\n').map((line, index) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('➥')) {
                                return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                              }
                              return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Important drawbacks and negative aspects to consider
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Comparison Section */}
                {(medicine as any).comparison && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-700 text-sm">Comparison</span>
                    </div>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <div className="whitespace-pre-line space-y-1">
                            {((medicine as any).comparison as string).split('\n').map((line, index) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('➥')) {
                                return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                              }
                              return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                            })}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                            <span>Click to read full comparison</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md p-4 bg-white shadow-lg border border-gray-200">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-700">Comparison</span>
                          </div>
                          <div className="whitespace-pre-line space-y-1">
                            {((medicine as any).comparison as string).split('\n').map((line, index) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('➥')) {
                                return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                              }
                              return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Comparative analysis with other medicines
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teaching Mode - Expanded Information */}
      {isTeachingMode && (
        <>
          {/* Mechanism of Action */}
          <div className="mb-3 pt-3 border-t border-muted">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-600">
              <Lightbulb className="w-4 h-4" />
              Mechanism of Action:
            </h4>
            <p className="text-sm text-muted-foreground">{medicine.mechanismOfAction}</p>
          </div>
      
          {/* Clinical Uses */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Clinical Uses:</h4>
            <div className="space-y-2">
              {medicine.clinicalUses.map((use, idx) => {
                // Parse clinical use to extract condition and symptoms
                const match = use.match(/^(.*?)\s*\((.*)\)$/);
                if (match) {
                  const condition = match[1].trim();
                  const symptomsStr = match[2].trim();
                  const symptoms = symptomsStr.split(',').map(s => s.trim());
                            
                  return (
                    <div key={idx} className="border-l-2 border-blue-200 pl-2">
                      <div className="font-medium text-blue-700">{condition}</div>
                      <div className="text-xs text-muted-foreground ml-2">
                        Symptoms: {symptoms.join(', ')}
                      </div>
                    </div>
                  );
                } else {
                  // Fallback for older format without symptoms
                  return (
                    <Badge key={idx} variant="outline" className="text-xs mr-1">
                      {use}
                    </Badge>
                  );
                }
              })}
            </div>
          </div>
          
          {/* Augmenting Other Medicines - Teaching Mode - Always Displayed */}
          {(medicine as any).simplifiedStructuredAugmentingMedicines && (medicine as any).simplifiedStructuredAugmentingMedicines.length > 0 && (
            <div className="mb-3 pt-3 border-t border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-700">Augmenting Other Medicines</span>
              </div>
              
              <div className="space-y-2">
                {((medicine as any).simplifiedStructuredAugmentingMedicines as string[]).map((part: string, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                    <div className="whitespace-pre-line space-y-1">
                      {part.split('\n').map((line, lineIdx) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('➥')) {
                          return <div key={lineIdx} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                        }
                        return <div key={lineIdx} style={{ fontSize: '14px' }}>{line}</div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Legacy Augmenting Medicines - Teaching Mode - Always Displayed */}
          {!((medicine as any).simplifiedStructuredAugmentingMedicines && (medicine as any).simplifiedStructuredAugmentingMedicines.length > 0) && (medicine as any).augmentingMedicines && (
            <div className="mb-3 pt-3 border-t border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-700">Augmenting Other Medicines</span>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="cursor-pointer bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 transition-colors">
                      <Plus className="w-3 h-3 mr-1" />
                      Augmenting Other Medicines
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Plus className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-700">Synergistic Combinations & Potentiation Effects</span>
                      </div>
                      <div className="whitespace-pre-line space-y-1">
                        {((medicine as any).augmentingMedicines as string).split('\n').map((line, index) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                          }
                          return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        How this medicine enhances effects of other medicines
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {/* Medicine Advantage Tag */}
          {medicine.medicineAdvantage && (
            <div className="mb-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="cursor-pointer bg-green-100 text-green-800 border-green-300 hover:bg-green-200 transition-colors">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Medicine Advantage
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700">Why This Medicine is Preferred</span>
                      </div>
                      <div className="whitespace-pre-line space-y-1">
                        {medicine.medicineAdvantage.split('\n').map((line, index) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                          }
                          return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Doctor-entered advantage based on clinical experience
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {/* Medicine Disadvantage Tag */}
          {(medicine as any).medicineDisadvantage && (
            <div className="mb-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="cursor-pointer bg-red-100 text-red-800 border-red-300 hover:bg-red-200 transition-colors">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Medicine Disadvantage
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-red-700">Important Drawbacks & Negative Aspects</span>
                      </div>
                      <div className="whitespace-pre-line space-y-1">
                        {((medicine as any).medicineDisadvantage as string).split('\n').map((line, index) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                          }
                          return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Important drawbacks and negative aspects to consider
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {/* Clinical Use Details Tags */}
          {medicine.clinicalUseDetails && medicine.clinicalUseDetails.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {medicine.clinicalUseDetails.map((detail, idx) => (
                detail.details && (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-pointer bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 transition-colors">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Use Detail
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-700">Clinical Use: {detail.useName.length > 40 ? detail.useName.substring(0, 40) + '...' : detail.useName}</span>
                          </div>
                          <p className="text-sm">{detail.details}</p>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Doctor-entered clinical explanation
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              ))}
            </div>
          )}
      
          {/* Adverse Effects */}
          {medicine.adverseEffects && medicine.adverseEffects.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Adverse Effects:
              </h4>
              <div className="flex flex-wrap gap-1">
                {medicine.adverseEffects.map((effect, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-red-50 text-red-700">
                    {effect}
                  </Badge>
                ))}
              </div>
            </div>
          )}
      
          {/* Contraindications */}
          {medicine.contraindications && medicine.contraindications.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 text-red-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Contraindications:
              </h4>
              <ul className="text-sm space-y-1">
                {medicine.contraindications.map((contraindication, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-red-700">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{contraindication}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      
          {/* Safety Rules */}
          {'safetyRules' in medicine && medicine.safetyRules && Array.isArray(medicine.safetyRules) && medicine.safetyRules.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 text-yellow-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Safety Rules:
              </h4>
              <ul className="text-sm space-y-1">
                {medicine.safetyRules.map((rule: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-yellow-700">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      
          {/* Primary Symptoms */}
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-2 text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Primary Symptoms (Required):
            </h4>
            <div className="flex flex-wrap gap-1">
              {symptoms.map((symptom, idx) => {
               const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                return (
                  <Badge key={idx} variant="default" className="text-xs">
                    {symptomText}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* Secondary Symptoms */}
          {'secondarySymptoms' in medicine && medicine.secondarySymptoms && Array.isArray(medicine.secondarySymptoms) && medicine.secondarySymptoms.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 text-blue-600">
                Secondary Symptoms (Optional):
              </h4>
              <div className="flex flex-wrap gap-1">
                {medicine.secondarySymptoms.map((symptom: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Inappropriate Symptoms */}
          {'inappropriateSymptoms' in medicine && medicine.inappropriateSymptoms && Array.isArray(medicine.inappropriateSymptoms) && medicine.inappropriateSymptoms.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 text-orange-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Inappropriate Symptoms (Optional):
              </h4>
              <div className="flex flex-wrap gap-1">
                {medicine.inappropriateSymptoms.map((symptom: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs border-orange-300 text-orange-700">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}
      
          {/* Why This Medicine Fits */}
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              {isContraindicated ? <XCircle className="w-4 h-4 text-red-600" /> : 
               !isSuitable ? <AlertTriangle className="w-4 h-4 text-orange-600" /> : 
               <CheckCircle className="w-4 h-4 text-green-600" />}
              {isContraindicated ? "Why This Medicine is Contraindicated:" : 
               !isSuitable ? "Why This Medicine May Not Be Suitable:" : 
               "Why This Medicine Fits:"}
            </h4>
            <ul className="text-sm space-y-1">
              {reasoning.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`${isContraindicated ? 'text-red-600' : !isSuitable ? 'text-orange-600' : 'text-green-600'} mt-1`}>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
      
          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                Warnings:
              </h4>
              <ul className="text-sm space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-yellow-700">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      
          {/* Safety Flags */}
          {safetyFlags && safetyFlags.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                Safety Concerns:
              </h4>
              <ul className="text-sm space-y-1">
                {safetyFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-red-700">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      
          {/* Teaching Notes */}
          {medicine.teachingNotes && (
            <div className="mb-3 pt-3 border-t border-muted">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-purple-600">
                <Lightbulb className="w-4 h-4" />
                Teaching Notes (Optional):
              </h4>
              <p className="text-sm text-muted-foreground">{medicine.teachingNotes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}