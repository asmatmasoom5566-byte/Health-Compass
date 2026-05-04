import { 
  ArrowLeft, 
  CheckCircle, 
  ThumbsUp,
  ThumbsDown,
  GitCompare,
  Stethoscope
} from 'lucide-react';
import { Medicine } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShortMedicineComparisonProps {
  medicines: Medicine[];
  onBack: () => void;
  onChangeSelection: () => void;
}

export function ShortMedicineComparison({ medicines, onBack, onChangeSelection }: ShortMedicineComparisonProps) {
  const numMedicines = medicines.length;
  
  // Dynamic grid columns based on number of medicines
  const getGridClass = () => {
    if (numMedicines === 1) return 'grid-cols-1';
    if (numMedicines === 2) return 'grid-cols-2';
    if (numMedicines === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const gridClass = getGridClass();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-teal-900 p-2">
      <div className="max-w-[1920px] mx-auto h-screen flex flex-col">
        {/* Compact Header - Minimal */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg mb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button onClick={onBack} variant="outline" size="sm" className="gap-1.5 h-8 px-3 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <Button onClick={onChangeSelection} variant="outline" size="sm" className="gap-1.5 h-8 px-3 text-xs">
                <GitCompare className="w-3.5 h-3.5" />
                Change Selection
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs px-3 py-1 h-auto">
              Short Compare: {numMedicines} Medicine{numMedicines > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Main Comparison Grid - Full height */}
        <ScrollArea className="flex-1 pr-4 pb-2">
          <div className={`grid ${gridClass} gap-4 h-full`}>
            {medicines.map((medicine, medIndex) => {
              const colors = ['blue', 'purple', 'teal', 'green'];
              const color = colors[medIndex % colors.length];
              
              return (
                <Card key={medIndex} className="bg-white/95 shadow-xl border-2 border-gray-200 overflow-hidden flex flex-col h-full">
                  {/* Medicine Header - Compact */}
                  <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 text-white p-2 flex-shrink-0`}>
                    <h2 className="text-lg font-bold mb-0.5 leading-tight">{medicine.name}</h2>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-[10px] py-0 px-1.5 h-auto">
                      {medicine.drugClass}
                    </Badge>
                  </div>

                  {/* Medicine Content - Only 4 key fields */}
                  <CardContent className="p-2 space-y-2 flex-1 overflow-auto">
                    
                    {/* Clinical Uses */}
                    {medicine.clinicalUses && medicine.clinicalUses.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 pb-1 border-b-2 border-green-200">
                          <Stethoscope className={`w-3 h-3 text-${color}-600`} />
                          <h3 className={`font-bold text-[10px] text-${color}-700`}>Clinical Uses</h3>
                        </div>
                        <ul className="space-y-0.5">
                          {medicine.clinicalUses.map((use, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                              <CheckCircle className="w-2.5 h-2.5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-[11px]">{use}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Advantage */}
                    {medicine.medicineAdvantage && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 pb-1 border-b-2 border-emerald-200">
                          <ThumbsUp className={`w-3 h-3 text-${color}-600`} />
                          <h3 className={`font-bold text-[10px] text-${color}-700`}>Advantage</h3>
                        </div>
                        <div className="whitespace-pre-line text-xs text-gray-700 leading-relaxed bg-emerald-50 p-1 rounded text-[10px]">
                          {medicine.medicineAdvantage}
                        </div>
                      </div>
                    )}

                    {/* Disadvantage */}
                    {medicine.medicineDisadvantage && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 pb-1 border-b-2 border-red-200">
                          <ThumbsDown className={`w-3 h-3 text-${color}-600`} />
                          <h3 className={`font-bold text-[10px] text-${color}-700`}>Disadvantage</h3>
                        </div>
                        <div className="whitespace-pre-line text-xs text-gray-700 leading-relaxed bg-red-50 p-1 rounded text-[10px]">
                          {medicine.medicineDisadvantage}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
