import { 
  ArrowLeft, 
  Pill,
  CheckCircle,
  Award,
  Activity,
  ChartPie,
  GitCompare,
  TrendingUp
} from 'lucide-react';
import { Medicine } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DrugClassComparisonProps {
  drugClass: string;
  medicines: Medicine[];
  onBack: () => void;
}

export function DrugClassComparison({ 
  drugClass, 
  medicines, 
  onBack
}: DrugClassComparisonProps) {
  // Sort medicines by name for consistent display
  const sortedMedicines = [...medicines].sort((a, b) => a.name.localeCompare(b.name));

  // Analyze primary symptoms - extract from symptomMatchRules
  const analyzePrimarySymptoms = () => {
   const symptomCounts = new Map<string, string[]>();
    
    sortedMedicines.forEach(medicine => {
      if (medicine.symptomMatchRules?.primarySymptoms) {
        medicine.symptomMatchRules.primarySymptoms.forEach(symptom => {
         const normalizedSymptom = symptom.toLowerCase().trim();
          if (!symptomCounts.has(normalizedSymptom)) {
            symptomCounts.set(normalizedSymptom, []);
          }
          symptomCounts.get(normalizedSymptom)!.push(medicine.name);
        });
      }
    });

   const commonSymptoms: Array<{ symptom: string; medicines: string[]; count: number }> = [];
   const uniqueSymptoms: Array<{ symptom: string; medicine: string }> = [];

    symptomCounts.forEach((medicines, symptom) => {
      if (medicines.length >= 2) {
       commonSymptoms.push({ symptom, medicines, count: medicines.length });
      } else {
        uniqueSymptoms.push({ symptom, medicine: medicines[0] });
      }
    });

   commonSymptoms.sort((a, b) => b.count - a.count);

    return { commonSymptoms, uniqueSymptoms };
  };

  // Analyze secondary symptoms - extract from symptomMatchRules
  const analyzeSecondarySymptoms = () => {
   const symptomCounts = new Map<string, string[]>();
    
    sortedMedicines.forEach(medicine => {
      if (medicine.symptomMatchRules?.secondarySymptoms) {
        medicine.symptomMatchRules.secondarySymptoms.forEach(symptom => {
         const normalizedSymptom = symptom.toLowerCase().trim();
          if (!symptomCounts.has(normalizedSymptom)) {
            symptomCounts.set(normalizedSymptom, []);
          }
          symptomCounts.get(normalizedSymptom)!.push(medicine.name);
        });
      }
    });

   const commonSymptoms: Array<{ symptom: string; medicines: string[]; count: number }> = [];
   const uniqueSymptoms: Array<{ symptom: string; medicine: string }> = [];

    symptomCounts.forEach((medicines, symptom) => {
      if (medicines.length >= 2) {
       commonSymptoms.push({ symptom, medicines, count: medicines.length });
      } else {
        uniqueSymptoms.push({ symptom, medicine: medicines[0] });
      }
    });

   commonSymptoms.sort((a, b) => b.count - a.count);

    return { commonSymptoms, uniqueSymptoms };
  };

  // Analyze medicine advantages - extract common and unique advantages
  const analyzeAdvantages = () => {
   const advantageThemes = new Map<string, string[]>();
   const uniqueAdvantages: Array<{ medicine: string; advantage: string }> = [];

    sortedMedicines.forEach(medicine => {
      if (medicine.medicineAdvantage) {
       const lines = medicine.medicineAdvantage.split('\n');
        let hasCommonTheme = false;
        
        lines.forEach(line => {
         const trimmed = line.trim();
          if (trimmed.startsWith('➥') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
           const content = trimmed.replace(/^[➥•-]\s*/, '').toLowerCase();
           const keywords = ['rapid', 'fast', 'quick', 'effective', 'safe', 'well-tolerated', 
                              'long-lasting', 'sustained', 'potent', 'strong', 'powerful',
                              'minimal', 'fewer', 'reduced', 'low risk',
                              'versatile', 'multiple', 'broad spectrum',
                              'specific', 'targeted', 'selective'];
            
            keywords.forEach(keyword => {
              if (content.includes(keyword)) {
                hasCommonTheme = true;
                if (!advantageThemes.has(keyword)) {
                  advantageThemes.set(keyword, []);
                }
                if (!advantageThemes.get(keyword)!.includes(medicine.name)) {
                  advantageThemes.get(keyword)!.push(medicine.name);
                }
              }
            });
          }
        });
        
        if (!hasCommonTheme) {
          uniqueAdvantages.push({
            medicine: medicine.name,
            advantage: medicine.medicineAdvantage.split('\n').filter(l => l.trim()).map(l => l.trim()).join(' ')
          });
        }
      }
    });

   const commonThemes: Array<{ theme: string; medicines: string[]; count: number }> = [];
    advantageThemes.forEach((medicines, theme) => {
      if (medicines.length >= 2) {
       commonThemes.push({ theme, medicines, count: medicines.length });
      }
    });
   commonThemes.sort((a, b) => b.count - a.count);

    return { commonThemes, uniqueAdvantages };
  };

  // Get analysis data
  const primarySymptomAnalysis = analyzePrimarySymptoms();
  const secondarySymptomAnalysis = analyzeSecondarySymptoms();
  const advantageAnalysis = analyzeAdvantages();

 return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900 p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Database
            </Button>
            <div className="flex items-center gap-3">
              <Pill className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Drug Class Comparison</h1>
                <p className="text-muted-foreground mt-1">
                  Comparative Analysis of {sortedMedicines.length} Medicines in {drugClass}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Analysis Section - Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Symptoms Analysis */}
          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Activity className="w-6 h-6" />
                🎯 Primary Symptoms Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Common Primary Symptoms */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  ✅ Common Primary Symptoms (Shared by Multiple Medicines)
                </h3>
                {primarySymptomAnalysis.commonSymptoms.length > 0 ? (
                  <ScrollArea className="h-64 w-full">
                    <div className="space-y-2 pr-4">
                      {primarySymptomAnalysis.commonSymptoms.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-900 capitalize">{item.symptom}</div>
                              <div className="text-xs text-blue-700 mt-1">
                                Found in {item.count} of {sortedMedicines.length} medicines
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs shrink-0 ${
                                item.count === sortedMedicines.length 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}
                            >
                              {Math.round((item.count/ sortedMedicines.length) * 100)}% coverage
                            </Badge>
                          </div>
                          {item.count < sortedMedicines.length && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Medicines: {item.medicines.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No common primary symptoms found</div>
                )}
              </div>

              {/* Unique Primary Symptoms */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-700 text-sm">
                  <Award className="w-4 h-4" />
                  🎯 Unique Primary Symptoms (Specific to One Medicine)
                </h3>
                {primarySymptomAnalysis.uniqueSymptoms.length > 0 ? (
                  <ScrollArea className="h-48 w-full">
                    <div className="space-y-2 pr-4">
                      {primarySymptomAnalysis.uniqueSymptoms.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="text-sm">
                            <span className="font-medium text-orange-900 capitalize">{item.symptom}</span>
                            <span className="text-orange-700 ml-2">→</span>
                            <span className="font-semibold text-orange-800 ml-1">{item.medicine}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground italic">All primary symptoms are shared</div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{primarySymptomAnalysis.commonSymptoms.length}</div>
                  <div className="text-xs text-muted-foreground">Common Symptoms</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{primarySymptomAnalysis.uniqueSymptoms.length}</div>
                  <div className="text-xs text-muted-foreground">Unique Symptoms</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{sortedMedicines.length}</div>
                  <div className="text-xs text-muted-foreground">Medicines</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Symptoms Analysis */}
          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <ChartPie className="w-6 h-6" />
                🔍 Secondary Symptoms Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Common Secondary Symptoms */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  ✅ Common Secondary Symptoms (Shared by Multiple Medicines)
                </h3>
                {secondarySymptomAnalysis.commonSymptoms.length > 0 ? (
                  <ScrollArea className="h-64 w-full">
                    <div className="space-y-2 pr-4">
                      {secondarySymptomAnalysis.commonSymptoms.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-purple-900 capitalize">{item.symptom}</div>
                              <div className="text-xs text-purple-700 mt-1">
                                Found in {item.count} of {sortedMedicines.length} medicines
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs shrink-0 ${
                                item.count === sortedMedicines.length 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-purple-100 text-purple-800 border-purple-300'
                              }`}
                            >
                              {Math.round((item.count / sortedMedicines.length) * 100)}% coverage
                            </Badge>
                          </div>
                          {item.count < sortedMedicines.length && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Medicines: {item.medicines.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No common secondary symptoms found</div>
                )}
              </div>

              {/* Unique Secondary Symptoms */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-700 text-sm">
                  <Award className="w-4 h-4" />
                  🎯 Unique Secondary Symptoms (Specific to One Medicine)
                </h3>
                {secondarySymptomAnalysis.uniqueSymptoms.length > 0 ? (
                  <ScrollArea className="h-48 w-full">
                    <div className="space-y-2 pr-4">
                      {secondarySymptomAnalysis.uniqueSymptoms.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="text-sm">
                            <span className="font-medium text-orange-900 capitalize">{item.symptom}</span>
                            <span className="text-orange-700 ml-2">→</span>
                            <span className="font-semibold text-orange-800 ml-1">{item.medicine}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground italic">All secondary symptoms are shared</div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{secondarySymptomAnalysis.commonSymptoms.length}</div>
                  <div className="text-xs text-muted-foreground">Common Symptoms</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{secondarySymptomAnalysis.uniqueSymptoms.length}</div>
                  <div className="text-xs text-muted-foreground">Unique Symptoms</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{sortedMedicines.length}</div>
                  <div className="text-xs text-muted-foreground">Medicines</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medicine Advantages Analysis */}
          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <GitCompare className="w-6 h-6" />
                💡 Medicine Advantages Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Common Advantage Themes */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  🔍 Common Advantage Themes (Shared Characteristics)
                </h3>
                {advantageAnalysis.commonThemes.length > 0 ? (
                  <ScrollArea className="h-64 w-full">
                    <div className="space-y-2 pr-4">
                      {advantageAnalysis.commonThemes.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-green-900 capitalize">{item.theme}</div>
                              <div className="text-xs text-green-700 mt-1">
                                Shared by {item.count} medicines
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0 bg-green-100 text-green-800 border-green-300">
                              {item.count} medicines
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Medicines with this theme: {item.medicines.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No common advantage themes identified</div>
                )}
              </div>

              {/* Unique Advantages */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-700 text-sm">
                  <Award className="w-4 h-4" />
                  🎯 Unique Advantages (Exclusive to Specific Medicines)
                </h3>
                {advantageAnalysis.uniqueAdvantages && advantageAnalysis.uniqueAdvantages.length > 0 ? (
                  <ScrollArea className="h-64 w-full">
                    <div className="space-y-2 pr-4">
                      {advantageAnalysis.uniqueAdvantages.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="text-sm">
                            <div className="font-semibold text-orange-900 mb-1">{item.medicine}</div>
                            <div className="text-xs text-orange-800 whitespace-pre-line">{item.advantage}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground italic">All advantages share common themes</div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{advantageAnalysis.commonThemes.length}</div>
                  <div className="text-xs text-muted-foreground">Common Themes</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {sortedMedicines.filter(m => m.medicineAdvantage).length}
                  </div>
                  <div className="text-xs text-muted-foreground">With Advantages</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {sortedMedicines.filter(m => !m.medicineAdvantage).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Without Advantages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
