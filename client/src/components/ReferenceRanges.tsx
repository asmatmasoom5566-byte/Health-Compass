import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Heart, 
  Droplets,
  TestTube,
  Search,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceRangesProps {
  className?: string;
}

interface LabTest {
  name: string;
  normalRange: string;
  units: string;
  criticalLow?: string;
  criticalHigh?: string;
  notes?: string;
  category: 'blood' | 'urine' | 'chemistry' | 'cardiac';
}

const LAB_TESTS: LabTest[] = [
  // Blood Tests
  { name: 'Hemoglobin', normalRange: '13.5-17.5 / 12.0-15.5', units: 'g/dL', criticalLow: '< 7.0', criticalHigh: '> 20.0', category: 'blood' },
  { name: 'Hematocrit', normalRange: '40-52 / 36-48', units: '%', criticalLow: '< 20', criticalHigh: '> 60', category: 'blood' },
  { name: 'WBC Count', normalRange: '4,500-11,000', units: '/μL', criticalLow: '< 1,000', criticalHigh: '> 50,000', category: 'blood' },
  { name: 'Platelets', normalRange: '150,000-450,000', units: '/μL', criticalLow: '< 20,000', criticalHigh: '> 1,000,000', category: 'blood' },
  { name: 'RBC Count', normalRange: '4.5-5.9 / 4.1-5.1', units: 'million/μL', category: 'blood' },
  
  // Chemistry
  { name: 'Glucose', normalRange: '70-99', units: 'mg/dL', criticalLow: '< 40', criticalHigh: '> 600', category: 'chemistry' },
  { name: 'Sodium', normalRange: '135-145', units: 'mEq/L', criticalLow: '< 120', criticalHigh: '> 160', category: 'chemistry' },
  { name: 'Potassium', normalRange: '3.5-5.0', units: 'mEq/L', criticalLow: '< 2.5', criticalHigh: '> 7.0', category: 'chemistry' },
  { name: 'Chloride', normalRange: '96-106', units: 'mEq/L', category: 'chemistry' },
  { name: 'BUN', normalRange: '7-20', units: 'mg/dL', criticalLow: '< 5', criticalHigh: '> 100', category: 'chemistry' },
  { name: 'Creatinine', normalRange: '0.7-1.3 / 0.6-1.1', units: 'mg/dL', criticalLow: '< 0.3', criticalHigh: '> 10.0', category: 'chemistry' },
  { name: 'eGFR', normalRange: '> 60', units: 'mL/min/1.73m²', criticalLow: '< 15', category: 'chemistry' },
  { name: 'Calcium', normalRange: '8.5-10.2', units: 'mg/dL', criticalLow: '< 7.0', criticalHigh: '> 13.0', category: 'chemistry' },
  { name: 'Magnesium', normalRange: '1.7-2.2', units: 'mg/dL', criticalLow: '< 1.0', criticalHigh: '> 5.0', category: 'chemistry' },
  { name: 'Phosphorus', normalRange: '2.5-4.5', units: 'mg/dL', criticalLow: '< 1.0', criticalHigh: '> 10.0', category: 'chemistry' },
  
  // Liver Function
  { name: 'AST (SGOT)', normalRange: '10-40', units: 'U/L', criticalHigh: '> 1000', category: 'chemistry' },
  { name: 'ALT (SGPT)', normalRange: '7-56', units: 'U/L', criticalHigh: '> 1000', category: 'chemistry' },
  { name: 'Alkaline Phosphatase', normalRange: '44-147', units: 'U/L', criticalHigh: '> 1000', category: 'chemistry' },
  { name: 'Bilirubin, Total', normalRange: '0.1-1.2', units: 'mg/dL', criticalHigh: '> 20.0', category: 'chemistry' },
  { name: 'Albumin', normalRange: '3.5-5.0', units: 'g/dL', criticalLow: '< 2.0', category: 'chemistry' },
  { name: 'Total Protein', normalRange: '6.0-8.3', units: 'g/dL', category: 'chemistry' },
  
  // Cardiac Markers
  { name: 'Troponin I', normalRange: '< 0.04', units: 'ng/mL', criticalHigh: '> 50.0', category: 'cardiac' },
  { name: 'CK-MB', normalRange: '< 5', units: 'ng/mL', criticalHigh: '> 100', category: 'cardiac' },
  { name: 'BNP', normalRange: '< 100', units: 'pg/mL', criticalHigh: '> 2000', category: 'cardiac' },
  { name: 'ProBNP', normalRange: '< 300', units: 'pg/mL', category: 'cardiac' },
  
  // Lipid Panel
  { name: 'Total Cholesterol', normalRange: '< 200', units: 'mg/dL', criticalHigh: '> 1000', category: 'chemistry' },
  { name: 'LDL Cholesterol', normalRange: '< 100', units: 'mg/dL', criticalHigh: '> 500', category: 'chemistry' },
  { name: 'HDL Cholesterol', normalRange: '> 40 / > 50', units: 'mg/dL', criticalLow: '< 20', category: 'chemistry' },
  { name: 'Triglycerides', normalRange: '< 150', units: 'mg/dL', criticalHigh: '> 1000', category: 'chemistry' },
  
  // Urine Tests
  { name: 'Specific Gravity', normalRange: '1.003-1.030', units: '', category: 'urine' },
  { name: 'pH', normalRange: '4.6-8.0', units: '', category: 'urine' },
  { name: 'Protein', normalRange: 'Negative to Trace', units: '', category: 'urine' },
  { name: 'Glucose', normalRange: 'Negative', units: '', category: 'urine' },
  { name: 'Ketones', normalRange: 'Negative', units: '', category: 'urine' },
  { name: 'Blood', normalRange: 'Negative', units: '', category: 'urine' },
];

export function ReferenceRanges({ className }: ReferenceRangesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [valueInput, setValueInput] = useState('');
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  
  const filteredTests = LAB_TESTS.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  const interpretValue = (test: LabTest, value: string) => {
    if (!value) return null;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    // Parse normal range (handle male/female ranges)
    const rangeParts = test.normalRange.split('/');
    const maleRange = rangeParts[0].trim();
    const femaleRange = rangeParts[1] ? rangeParts[1].trim() : maleRange;
    
    // Simple range parsing (assumes format like "13.5-17.5" or "< 200")
    let low = 0, high = Infinity;
    
    if (maleRange.includes('-')) {
      const [lowStr, highStr] = maleRange.split('-');
      low = parseFloat(lowStr);
      high = parseFloat(highStr);
    } else if (maleRange.includes('<')) {
      high = parseFloat(maleRange.replace('<', '').trim());
    } else if (maleRange.includes('>')) {
      low = parseFloat(maleRange.replace('>', '').trim());
    }
    
    if (numValue < low) {
      if (test.criticalLow && numValue <= parseFloat(test.criticalLow.replace('<', ''))) {
        return { status: 'critical-low', label: 'CRITICALLY LOW' };
      }
      return { status: 'low', label: 'LOW' };
    }
    
    if (numValue > high) {
      if (test.criticalHigh && numValue >= parseFloat(test.criticalHigh.replace('>', ''))) {
        return { status: 'critical-high', label: 'CRITICALLY HIGH' };
      }
      return { status: 'high', label: 'HIGH' };
    }
    
    return { status: 'normal', label: 'NORMAL' };
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical-low':
      case 'critical-high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
      case 'high':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <Card className={cn("border border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <TestTube className="w-5 h-5 text-primary" />
          Laboratory Reference Ranges
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Normal values and critical thresholds for common lab tests
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="blood">Blood Tests</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="cardiac">Cardiac Markers</SelectItem>
              <SelectItem value="urine">Urine Tests</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Value Interpreter */}
        <Card className="bg-muted/20 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Value Interpreter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select onValueChange={(value) => {
                const test = LAB_TESTS.find(t => t.name === value);
                setSelectedTest(test || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent>
                  {LAB_TESTS.map(test => (
                    <SelectItem key={test.name} value={test.name}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="space-y-2">
                <Label htmlFor="test-value">Enter value</Label>
                <Input
                  id="test-value"
                  type="number"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder={selectedTest ? `e.g., ${selectedTest.normalRange.split(' ')[0]}` : "Enter value"}
                  disabled={!selectedTest}
                />
              </div>
            </div>
            
            {selectedTest && valueInput && (
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedTest.name}:</span>
                  <Badge className={cn(
                    "font-bold",
                    getStatusColor(interpretValue(selectedTest, valueInput)?.status || '')
                  )}>
                    {interpretValue(selectedTest, valueInput)?.label || 'INVALID'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Normal range: {selectedTest.normalRange} {selectedTest.units}
                </div>
                {(selectedTest.criticalLow || selectedTest.criticalHigh) && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {selectedTest.criticalLow && `⚠️ Critically low: ${selectedTest.criticalLow}`}
                    {selectedTest.criticalLow && selectedTest.criticalHigh && ' | '}
                    {selectedTest.criticalHigh && `⚠️ Critically high: ${selectedTest.criticalHigh}`}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Reference Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Test</TableHead>
                <TableHead className="w-1/4">Normal Range</TableHead>
                <TableHead className="w-1/6">Units</TableHead>
                <TableHead className="w-1/6">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => (
                <TableRow key={test.name} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{test.normalRange}</div>
                    {(test.criticalLow || test.criticalHigh) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.criticalLow && `⚠️ ${test.criticalLow}`}
                        {test.criticalLow && test.criticalHigh && ' | '}
                        {test.criticalHigh && `⚠️ ${test.criticalHigh}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {test.units}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {test.category.charAt(0).toUpperCase() + test.category.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tests found matching your criteria
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Note: Reference ranges may vary by laboratory. Always consult your institution's specific values.
        </div>
      </CardContent>
    </Card>
  );
}