import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Plus,
  X,
  GitCompare
} from 'lucide-react';
import { Medicine } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pill, 
  Info,
  Heart,
  Stethoscope,
  Lightbulb,
  BookOpen,
  AlertCircle,
  Activity,
  Shield,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface MedicineComparisonSelectorProps {
  allMedicines: Medicine[];
  preservedNames?: string[];
  onBack: () => void;
  onCompare: (medicines: Medicine[]) => void;
  onShortCompare?: (medicines: Medicine[]) => void; // Optional handler for short compare
}

export function MedicineComparisonSelector({ allMedicines, preservedNames, onBack, onCompare, onShortCompare }: MedicineComparisonSelectorProps) {
  // Use preserved names if available, otherwise start with empty fields
  const [medicineNames, setMedicineNames] = useState<string[]>(
    preservedNames && preservedNames.some(name => name) 
      ? [...preservedNames, '', '', ''].slice(0, 3) // Ensure exactly 3 slots
      : ['', '', '']
  );
  const [selectedMedicines, setSelectedMedicines] = useState<(Medicine | null)[]>([null, null, null]);
  const [activeSearch, setActiveSearch] = useState<number | null>(null);

  // Debug: Log total medicines available
  useEffect(() => {
    console.log('=== Medicine Comparison Selector ===');
    console.log('Total medicines in database:', allMedicines.length);
    console.log('Sample medicines:', allMedicines.slice(0, 3).map(m => m.name));
    
    // Verify this includes ALL medicines, not just patient-specific ones
    console.log('✓ Using COMPLETE pharmacology database (not filtered by patient data)');
  }, [allMedicines]);

  // Preserve state when navigating back - don't reset on mount
  // State will only be cleared manually by user or when explicitly changed

  // Handle medicine name input change
  const handleNameChange = (index: number, value: string) => {
    const newNames = [...medicineNames];
    newNames[index] = value;
    setMedicineNames(newNames);

    // Clear selected medicine when typing changes
    if (selectedMedicines[index]) {
      const newSelected = [...selectedMedicines];
      newSelected[index] = null;
      setSelectedMedicines(newSelected);
    }
  };

  // Select a medicine from suggestions
  const selectMedicine = (index: number, medicine: Medicine) => {
    const newSelected = [...selectedMedicines];
    newSelected[index] = medicine;
    setSelectedMedicines(newSelected);

    const newNames = [...medicineNames];
    newNames[index] = medicine.name;
    setMedicineNames(newNames);

    setActiveSearch(null);
  };

  // Clear a medicine selection
  const clearMedicine = (index: number) => {
    const newNames = [...medicineNames];
    newNames[index] = '';
    setMedicineNames(newNames);

    const newSelected = [...selectedMedicines];
    newSelected[index] = null;
    setSelectedMedicines(newSelected);
  };

  // Check if we can compare (at least 2 medicines selected)
  const validMedicines = selectedMedicines.filter((m): m is Medicine => m !== null);
  const canCompare = validMedicines.length >= 2;

  // Get filtered suggestions for dropdown
  const getSuggestions = (index: number) => {
    const query = medicineNames[index].toLowerCase();
    if (query.length === 0) return [];
    
    return allMedicines
      .filter(m => m.name.toLowerCase().includes(query))
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-teal-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={onBack} 
              variant="outline" 
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pharmacology
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Compare Medicines
            </h1>
            <p className="text-muted-foreground mb-2">
              Select 2-3 medicines to compare side-by-side
            </p>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
              Database: {allMedicines.length} total medicines available
            </Badge>
          </div>
        </div>

        {/* Medicine Selection Cards */}
        <div className="space-y-4 mb-6">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-lg shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 2 ? "default" : "secondary"} className="px-3 py-2">
                    {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd (Optional)'}
                  </Badge>
                  
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder={index < 2 ? "Enter medicine name..." : "Optional: Enter third medicine name"}
                      value={medicineNames[index]}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      onFocus={() => setActiveSearch(index)}
                      onBlur={() => setTimeout(() => setActiveSearch(null), 200)}
                      className={`pr-10 ${index < 2 && !medicineNames[index] ? 'border-red-300 focus:border-red-500' : ''}`}
                      required={index < 2}
                    />
                    
                    {selectedMedicines[index] && (
                      <button
                        onClick={() => clearMedicine(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Suggestions Dropdown */}
                    {activeSearch === index && medicineNames[index].trim().length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {getSuggestions(index).length > 0 ? (
                          getSuggestions(index).map((medicine) => (
                            <div
                              key={medicine.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                              onClick={() => selectMedicine(index, medicine)}
                            >
                              <Pill className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="font-medium">{medicine.name}</div>
                                <div className="text-xs text-muted-foreground">{medicine.drugClass}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-muted-foreground">No matches found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedMedicines[index] && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compare Buttons - Full and Short */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            disabled={!canCompare}
            className={`gap-2 ${!canCompare ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onCompare(validMedicines)}
          >
            <Search className="w-4 h-4" />
            Full Compare {validMedicines.length} Medicines
          </Button>
          <Button
            disabled={!canCompare}
            variant="secondary"
            className={`gap-2 ${!canCompare ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onShortCompare && onShortCompare(validMedicines)}
          >
            <GitCompare className="w-4 h-4" />
            Short Compare {validMedicines.length} Medicines
          </Button>
        </div>

        {/* Cancel Button */}
        <Button
          onClick={() => onBack()}
          variant="outline"
          className="w-full mb-6"
        >
          Cancel
        </Button>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50/80 backdrop-blur-lg border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">How to Compare</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Select from ALL medicines in the database ({allMedicines.length} total)</li>
                  <li>• Patient demographics and symptoms are NOT required for comparison</li>
                  <li>• Enter the names of at least 2 medicines you want to compare</li>
                  <li>• The first two fields are required, the third is optional</li>
                  <li>• Start typing to see autocomplete suggestions from the complete database</li>
                  <li>• Click "Compare {validMedicines.length} Medicines" to see side-by-side comparison</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
