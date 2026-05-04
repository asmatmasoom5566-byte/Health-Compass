import { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Heart,
  Stethoscope,
  Lightbulb,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { MedicineEvaluation, Medicine } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MedicineComparisonProps {
  medicines: MedicineEvaluation[];
  patientDemographics: {
    age: number;
    sex: 'Male' | 'Female';
    duration: number;
    durationUnit: string;
  };
  symptoms: string[];
  onBack: () => void;
  onSelectMedicine: (medicine: Medicine) => void;
}

export function MedicineComparison({ 
  medicines, 
  patientDemographics, 
  symptoms,
  onBack,
  onSelectMedicine 
}: MedicineComparisonProps) {
  // Get top 3 medicines (or fewer if less than 3 available)
  const topMedicines = medicines
    .filter(m => m.suitabilityScore > 0) // Only medicines with symptom matches
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 3);

  const getSafetyStatus = (evaluation: MedicineEvaluation) => {
    if (evaluation.isContraindicated) return { status: 'contraindicated', text: 'Contraindicated', color: 'text-red-600', bg: 'bg-red-100' };
    if (!evaluation.isSuitable || (evaluation.warnings && evaluation.warnings.length > 0)) 
      return { status: 'caution', text: 'Caution', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'safe', text: 'Safe', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const renderSymptomBadge = (symptom: string, idx: number) => (
    <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 border border-green-300 py-2 px-3 text-sm">
      ✓ {symptom}
    </Badge>
  );

  if (topMedicines.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-teal-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <Button 
                onClick={onBack} 
                variant="outline" 
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Pharmacology
              </Button>
            </div>
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Medicines to Compare</h2>
              <p className="text-muted-foreground">
                No medicines with symptom matches found for comparison.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-teal-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                onClick={onBack} 
                variant="outline" 
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Pharmacology
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Medicine Comparison</h1>
                <p className="text-muted-foreground">
                  Patient-specific comparison of top {topMedicines.length} medicine{topMedicines.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Summary - Symptoms Only */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Heart className="w-5 h-5" />
                Patient Symptoms ({symptoms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => {
               const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                  return (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border border-green-300 py-2 px-3 text-sm">
                      ✓ {symptomText}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {topMedicines.map((evaluation, index) => {
            const { medicine, suitabilityScore, reasoning, warnings, isContraindicated, isSuitable } = evaluation;
            const safety = getSafetyStatus(evaluation);
            
            return (
              <Card 
                key={medicine.id} 
                className={`bg-white/90 backdrop-blur-lg shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 ${
                  isContraindicated ? 'border-red-300' : 
                  !isSuitable ? 'border-orange-300' : 'border-green-300'
                }`}
              >
                <CardHeader className={`${isContraindicated ? 'bg-red-50' : !isSuitable ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${safety.bg} flex items-center justify-center`}>
                        <span className={`font-bold text-lg ${safety.color}`}>#{index + 1}</span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{medicine.name}</CardTitle>
                        <Badge variant="secondary">{medicine.drugClass}</Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={isContraindicated ? "destructive" : !isSuitable ? "outline" : "secondary"}
                      className={isContraindicated ? '' : !isSuitable ? 'border-orange-500 text-orange-600' : 'bg-green-100 text-green-800'}
                    >
                      {safety.text.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Overall Suitability Rating */}
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="text-3xl font-bold text-green-600">{suitabilityScore}%</div>
                    <div className="text-sm text-muted-foreground">Symptom Match Score</div>
                    <div className="mt-2">
                      {suitabilityScore >= 80 ? (
                        <Badge className="bg-green-500 text-white">EXCELLENT SYMPTOM MATCH</Badge>
                      ) : suitabilityScore >= 60 ? (
                        <Badge className="bg-yellow-500 text-white">GOOD SYMPTOM MATCH</Badge>
                      ) : suitabilityScore >= 30 ? (
                        <Badge className="bg-orange-500 text-white">FAIR SYMPTOM MATCH</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">POOR SYMPTOM MATCH</Badge>
                      )}
                    </div>
                  </div>

                  {/* Why This Medicine Section - Symptom Focus */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      {isContraindicated ? <XCircle className="w-5 h-5 text-red-600" /> : 
                       !isSuitable ? <AlertTriangle className="w-5 h-5 text-orange-600" /> : 
                       <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isContraindicated ? "Why Contraindicated for Symptoms" : 
                       !isSuitable ? "Why Not Suitable for Symptoms" : 
                       "Why This Medicine Matches Your Symptoms"}
                    </h3>
                    <ul className="space-y-2">
                      {reasoning.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm bg-white p-2 rounded border border-gray-200">
                          <span className={`mt-1 ${isContraindicated ? 'text-red-600' : !isSuitable ? 'text-orange-600' : 'text-green-600'}`}>
                            •
                          </span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Medicine Advantage Section */}
                  {evaluation.medicine.medicineAdvantage && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-green-700 text-base">
                        <Lightbulb className="w-5 h-5" />
                        💡 Medicine Advantage
                      </h3>
                      <div className="text-sm text-green-800 whitespace-pre-line">
                        {evaluation.medicine.medicineAdvantage.split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={idx} className="ml-4 mt-1">{trimmed}</div>;
                          }
                          return <div key={idx}>{line}</div>;
                        })}
                      </div>
                      <p className="text-xs text-green-600 mt-2 italic">
                        Doctor-entered advantage based on clinical experience
                      </p>
                    </div>
                  )}
                  
                  {/* Medicine Disadvantage Section */}
                  {(evaluation.medicine as any).medicineDisadvantage && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border-2 border-red-200 mt-4">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-red-700 text-base">
                        <AlertCircle className="w-5 h-5" />
                        ⚠️ Medicine Disadvantage
                      </h3>
                      <div className="text-sm text-red-800 whitespace-pre-line">
                        {((evaluation.medicine as any).medicineDisadvantage as string).split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('➥')) {
                            return <div key={idx} className="ml-4 mt-1">{trimmed}</div>;
                          }
                          return <div key={idx}>{line}</div>;
                        })}
                      </div>
                      <p className="text-xs text-red-600 mt-2 italic">
                        Important drawbacks and negative aspects to consider
                      </p>
                    </div>
                  )}
                  
                  {/* Clinical Use Details Section */}
                  {evaluation.medicine.clinicalUseDetails && evaluation.medicine.clinicalUseDetails.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-700 text-base">
                        <BookOpen className="w-5 h-5" />
                        📚 Clinical Use Details
                      </h3>
                      <div className="space-y-3">
                        {evaluation.medicine.clinicalUseDetails.filter(d => d.details).map((detail, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-md border border-blue-100">
                            <div className="font-semibold text-blue-700 text-sm mb-1 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {detail.useName}
                            </div>
                            <p className="text-sm text-blue-800">{detail.details}</p>
                            <p className="text-xs text-blue-600 mt-1 italic">
                              Doctor-entered clinical explanation
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patient-Specific Symptom Matching */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-green-700 text-base">
                      <CheckCircle className="w-5 h-5" />
                      🎯 Symptom Coverage Analysis
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="font-semibold text-green-600 mb-2">All Patient Symptoms ({symptoms.length}):</div>
                        <div className="flex flex-wrap gap-1">
                          {symptoms.map((symptom, idx) => {
                        const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                            return (
                              <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 text-xs border border-green-300 py-1 px-2">
                                ✓ {symptomText}
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="bg-green-50 p-2 rounded text-xs text-green-700 font-medium mt-2">
                          This medicine addresses all {symptoms.length} patient symptoms with {suitabilityScore}% match
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contraindications - CLEARLY FLAGGED */}
                  {medicine.contraindications && medicine.contraindications.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-red-700">
                        <XCircle className="w-5 h-5" />
                        ⚠️ CONTRAINDICATIONS FOR THIS PATIENT
                      </h3>
                      <ul className="space-y-2">
                        {medicine.contraindications.map((contraindication, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-white p-2 rounded border border-red-200">
                            <span className="text-red-600 font-bold mt-1">⚠️</span>
                            <span className="text-red-800 font-medium">{contraindication}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 p-2 bg-red-100 rounded text-red-800 text-sm font-medium">
                        ⚠️ This medicine has contraindications for the current patient profile
                      </div>
                    </div>
                  )}

                  {/* Key Adverse Effects */}
                  {medicine.adverseEffects && medicine.adverseEffects.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-5 h-5" />
                        Relevant Adverse Effects
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {medicine.adverseEffects.slice(0, 4).map((effect, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            {effect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings - Only if relevant to symptoms */}
                  {warnings && warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Symptom-Related Warnings
                      </h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Select Button */}
                  <Button 
                    onClick={() => onSelectMedicine(medicine)}
                    className={`w-full ${
                      isContraindicated ? 'bg-red-600 hover:bg-red-700' : 
                      !isSuitable ? 'bg-orange-600 hover:bg-orange-700' : 
                      'bg-green-600 hover:bg-green-700'
                    } text-white`}
                    disabled={isContraindicated}
                  >
                    {isContraindicated ? 'Contraindicated' : 'Select This Medicine'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Comparison Table */}
        <Card className="bg-white/90 backdrop-blur-lg shadow-2xl mt-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-green-600" />
              Symptom Matching Comparison Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gradient-to-r from-green-50 to-emerald-50">
                    <th className="text-left p-4 font-semibold text-gray-800">Medicine</th>
                    <th className="text-center p-4 font-semibold text-gray-800">Symptom Match Score</th>
                    <th className="text-center p-4 font-semibold text-gray-800">Symptoms Covered</th>
                    <th className="text-center p-4 font-semibold text-gray-800">Safety for Symptoms</th>
                    <th className="text-center p-4 font-semibold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topMedicines.map((evaluation, index) => {
                    const safety = getSafetyStatus(evaluation);
                    
                    return (
                      <tr key={evaluation.medicine.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 flex items-center justify-center text-sm font-bold border-2 border-green-300">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-900">{evaluation.medicine.name}</div>
                              <Badge variant="secondary" className="text-xs mt-1">{evaluation.medicine.drugClass}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-bold text-xl ${
                              evaluation.suitabilityScore >= 80 ? 'text-green-600' :
                              evaluation.suitabilityScore >= 60 ? 'text-yellow-600' :
                              evaluation.suitabilityScore >= 30 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {evaluation.suitabilityScore}%
                            </span>
                            {evaluation.suitabilityScore >= 80 ? (
                              <Badge className="bg-green-500 text-white text-xs">Excellent</Badge>
                            ) : evaluation.suitabilityScore >= 60 ? (
                              <Badge className="bg-yellow-500 text-white text-xs">Good</Badge>
                            ) : evaluation.suitabilityScore >= 30 ? (
                              <Badge className="bg-orange-500 text-white text-xs">Fair</Badge>
                            ) : (
                              <Badge className="bg-red-500 text-white text-xs">Poor</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex flex-wrap gap-1 justify-center max-w-[250px]">
                              {symptoms.map((symptom, idx) => {
                           const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                                return (
                                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                    ✓ {symptomText.length > 12 ? symptomText.substring(0, 12) + '...' : symptomText}
                                  </Badge>
                                );
                              })}
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">Total: {symptoms.length} symptoms</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant={evaluation.isContraindicated ? "destructive" : !evaluation.isSuitable ? "outline" : "secondary"}
                            className={`${evaluation.isContraindicated ? '' : !evaluation.isSuitable ? 'border-orange-500 text-orange-600 bg-orange-50' : 'bg-green-100 text-green-800 border-green-300'} font-medium`}
                          >
                            {safety.text}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button 
                            size="sm"
                            onClick={() => onSelectMedicine(evaluation.medicine)}
                            disabled={evaluation.isContraindicated}
                            className={`${
                              evaluation.isContraindicated ? 'bg-red-600 hover:bg-red-700' : 
                              'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            } text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                          >
                            {evaluation.isContraindicated ? '⚠️ Contraindicated' : '✓ Select for Symptoms'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}