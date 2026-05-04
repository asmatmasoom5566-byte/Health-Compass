import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  User,
  FileText,
  Download,
  Upload,
  Stethoscope
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VisitRecord {
  visitNumber: number;
  date: string;
  complaints: string;
  treatment: string;
  responseStatus: 'Best response' | 'Moderate response' | 'No response' | 'Bad response' | 'Not evaluated yet';
  suggestedConditions?: string[]; // Suggested conditions for this visit
  note?: string; // Note for this visit
}

interface PatientVisit {
  id: string;
  patientName: string;
  registerNumber: string;
  age: string;
  sex: string;
  visits: VisitRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const AllVisitsPage: React.FC = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientVisit[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientVisit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<PatientVisit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('regester_all_visits');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const patientsWithDates = parsedData.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          visits: p.visits.map((v: any) => ({
            ...v,
            date: v.date ? new Date(v.date) : new Date()
          }))
        }));
        setPatients(patientsWithDates);
      } catch (e) {
        console.error('Failed to parse visits data:', e);
        setPatients([]);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const dataToSave = patients.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      visits: p.visits.map(v => ({
        ...v,
        date: new Date(v.date).toISOString()
      }))
    }));
    localStorage.setItem('regester_all_visits', JSON.stringify(dataToSave));
  }, [patients]);

  // Add new patient
  const handleAddPatient = () => {
    const newPatient: PatientVisit = {
      id: `patient_${Date.now()}`,
      patientName: '',
      registerNumber: '',
      age: '',
      sex: '',
      visits: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentPatient(newPatient);
    setIsEditing(true);
    setSelectedPatient(null);
  };

  // Save patient
  const handleSavePatient = () => {
    if (!currentPatient) return;

    const index = patients.findIndex(p => p.id === currentPatient.id);
    if (index !== -1) {
      // Update existing
      const updatedPatients = [...patients];
      updatedPatients[index] = {
        ...currentPatient,
        updatedAt: new Date()
      };
      setPatients(updatedPatients);
    } else {
      // Add new
      setPatients([...patients, currentPatient]);
    }

    setIsEditing(false);
    setCurrentPatient(null);
    toast({
      title: 'Success',
      description: 'Patient record saved successfully'
    });
  };

  // Delete patient
  const handleDeletePatient = (id: string) => {
    if (confirm('Are you sure you want to delete this patient record? This cannot be undone.')) {
      setPatients(patients.filter(p => p.id !== id));
      if (selectedPatient?.id === id) {
        setSelectedPatient(null);
      }
      toast({
        title: 'Deleted',
        description: 'Patient record deleted successfully'
      });
    }
  };

  // Add visit
  const handleAddVisit = () => {
    if (!currentPatient) return;
    const newVisit: VisitRecord = {
      visitNumber: currentPatient.visits.length + 1,
      date: new Date().toISOString().split('T')[0],
      complaints: '',
      treatment: '',
      responseStatus: 'Not evaluated yet',
      suggestedConditions: [],
      note: ''
    };
    setCurrentPatient({
      ...currentPatient,
      visits: [...currentPatient.visits, newVisit],
      updatedAt: new Date()
    });
  };

  // Update visit
  const handleUpdateVisit = (visitIndex: number, updates: Partial<VisitRecord>) => {
    if (!currentPatient) return;
    const updatedVisits = [...currentPatient.visits];
    updatedVisits[visitIndex] = { ...updatedVisits[visitIndex], ...updates };
    setCurrentPatient({
      ...currentPatient,
      visits: updatedVisits,
      updatedAt: new Date()
    });
  };

  // Delete visit
  const handleDeleteVisit = (visitIndex: number) => {
    if (!currentPatient) return;
    const updatedVisits = currentPatient.visits.filter((_, i) => i !== visitIndex);
    // Renumber visits
    updatedVisits.forEach((v, i) => v.visitNumber = i + 1);
    setCurrentPatient({
      ...currentPatient,
      visits: updatedVisits,
      updatedAt: new Date()
    });
  };

  // Copy patient history
  const handleCopyHistory = (patient: PatientVisit) => {
    const historyText = formatPatientHistory(patient);
    navigator.clipboard.writeText(historyText).then(() => {
      setCopiedId(patient.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: 'Copied!',
        description: 'Patient history copied to clipboard'
      });
    });
  };

  // Format patient history for copying - includes visit dates and suggested conditions
  const formatPatientHistory = (patient: PatientVisit): string => {
    let text = `Age: ${patient.age}\n`;
    text += `Sex: ${patient.sex}\n`;

    patient.visits.forEach((visit, index) => {
      const visitLabels = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
      const visitLabel = index < visitLabels.length ? `${visitLabels[index]} Visit` : `Visit ${visit.visitNumber}`;
      
      // Format date as YYYY-MM-DD
      const visitDate = new Date(visit.date).toISOString().split('T')[0];
      
      text += `\n${visitLabel.toUpperCase()} - ${visitDate}\n`;
      
      // Handle complaints: show "still previous complaints" if empty and not first visit
      if (!visit.complaints || visit.complaints.trim() === '') {
        if (index === 0) {
          text += `Complaints: None recorded\n`;
        } else {
          text += `Complaints: still previous complaints\n`;
        }
      } else {
        text += `Complaints: ${visit.complaints}\n`;
      }
      
      // Add suggested conditions if they exist (right after complaints)
      if (visit.suggestedConditions && visit.suggestedConditions.length > 0) {
        const heading = index === 0 ? 'Initially Suggested Conditions' : 'Now Suggested Conditions';
        text += `${heading}: ${visit.suggestedConditions.join(', ')}\n`;
      }
      
      text += `Treatment: ${visit.treatment || 'None recorded'}\n`;
      text += `Response: ${visit.responseStatus}\n`;
      
      // Add note if it exists (right after response)
      if (visit.note && visit.note.trim() !== '') {
        text += `Note: ${visit.note}\n`;
      }
    });

    return text;
  };

  // Export all data
  const handleExportAll = () => {
    const dataStr = JSON.stringify(patients, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-visits-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Exported',
      description: 'All patient data exported successfully'
    });
  };

  // Import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          const merged = [...patients, ...importedData];
          setPatients(merged);
          toast({
            title: 'Imported',
            description: `Successfully imported ${importedData.length} patient records`
          });
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error importing data');
      }
    };
    reader.readAsText(file);
  };

  // Filter patients
  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get response trend color
  const getResponseColor = (status: string) => {
    switch (status) {
      case 'Best response': return 'text-green-600 bg-green-50 border-green-200';
      case 'Moderate response': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Mild response': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'No response': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Bad response': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isEditing && currentPatient) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setCurrentPatient(null);
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Visits
          </Button>
          <h1 className="text-3xl font-bold">
            {currentPatient.id.startsWith('patient_') ? 'Add New Patient' : 'Edit Patient'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Patient Name</label>
                <Input
                  value={currentPatient.patientName}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Register Number</label>
                <Input
                  value={currentPatient.registerNumber}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, registerNumber: e.target.value })}
                  placeholder="Enter register number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Age</label>
                <Input
                  value={currentPatient.age}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, age: e.target.value })}
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sex</label>
                <select
                  value={currentPatient.sex}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, sex: e.target.value })}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Visit History ({currentPatient.visits.length})
                </h3>
                <Button onClick={handleAddVisit} size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Add Visit
                </Button>
              </div>

              {currentPatient.visits.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No visits recorded yet. Click "Add Visit" to add the first visit.
                </p>
              ) : (
                <div className="space-y-4">
                  {currentPatient.visits.map((visit, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">
                            Visit {visit.visitNumber}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVisit(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Date</label>
                            <Input
                              type="date"
                              value={visit.date ? new Date(visit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleUpdateVisit(index, { date: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Treatment Response</label>
                            <select
                              value={visit.responseStatus}
                              onChange={(e) => handleUpdateVisit(index, { responseStatus: e.target.value as any })}
                              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="Not evaluated yet">Not evaluated yet</option>
                              <option value="Best response">Best response</option>
                              <option value="Moderate response">Moderate response</option>
                              <option value="Mild response">Mild response</option>
                              <option value="No response">No response</option>
                              <option value="Bad response">Bad response</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Complaints</label>
                          <Textarea
                            value={visit.complaints}
                            onChange={(e) => handleUpdateVisit(index, { complaints: e.target.value })}
                            placeholder="Enter patient complaints for this visit"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            {index === 0 ? 'Initially Suggested Conditions' : 'Now Suggested Conditions'}
                          </label>
                          <Textarea
                            value={visit.suggestedConditions?.join(', ') || ''}
                            onChange={(e) => {
                              const conditions = e.target.value
                                .split(',')
                                .map(s => s.trim())
                                .filter(s => s.length > 0);
                              handleUpdateVisit(index, { suggestedConditions: conditions });
                            }}
                            placeholder="Enter suggested conditions separated by commas"
                            rows={2}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Separate multiple conditions with commas
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Treatment</label>
                          <Textarea
                            value={visit.treatment}
                            onChange={(e) => handleUpdateVisit(index, { treatment: e.target.value })}
                            placeholder="Enter treatment given"
                            rows={3}
                          />
                        </div>

                        <div className={`p-3 rounded-lg border ${getResponseColor(visit.responseStatus)}`}>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">Response Status: {visit.responseStatus}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Note</label>
                          <Textarea
                            value={visit.note || ''}
                            onChange={(e) => handleUpdateVisit(index, { note: e.target.value })}
                            placeholder="Enter note for this visit (optional)"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentPatient(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePatient}>
                Save Patient Record
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedPatient) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedPatient(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Visits
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{selectedPatient.patientName}</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopyHistory(selectedPatient)}
              >
                {copiedId === selectedPatient.id ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copiedId === selectedPatient.id ? 'Copied!' : 'Copy History'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPatient(selectedPatient);
                  setIsEditing(true);
                }}
              >
                Edit Patient
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeletePatient(selectedPatient.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Register Number</p>
                  <p className="text-lg font-semibold">{selectedPatient.registerNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-lg font-semibold">{selectedPatient.visits.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Response</p>
                  <p className="text-lg font-semibold">
                    {selectedPatient.visits.length > 0 
                      ? selectedPatient.visits[selectedPatient.visits.length - 1].responseStatus 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Complete Visit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient.visits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No visits recorded yet
              </p>
            ) : (
              <div className="space-y-4">
                {selectedPatient.visits.map((visit, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Visit {visit.visitNumber}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {visit.date ? new Date(visit.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}
                          </p>
                        </div>
                        <Badge className={getResponseColor(visit.responseStatus)}>
                          {visit.responseStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Complaints</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {visit.complaints || 'None recorded'}
                        </p>
                      </div>
                      {visit.suggestedConditions && visit.suggestedConditions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            {index === 0 ? 'Initially Suggested Conditions' : 'Now Suggested Conditions'}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {visit.suggestedConditions.map((condition, condIndex) => (
                              <Badge key={condIndex} variant="secondary" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Treatment</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {visit.treatment || 'None recorded'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Response Status</h4>
                        <Badge className={getResponseColor(visit.responseStatus)}>
                          {visit.responseStatus}
                        </Badge>
                      </div>
                      {visit.note && visit.note.trim() !== '' && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Note</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            {visit.note}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-x-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Diagnosis
                </Button>
              </Link>
            </div>
            <div className="mt-2">
              <h1 className="text-3xl font-bold">ALL VISITS</h1>
              <p className="text-muted-foreground">Complete patient visit history archive</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={handleExportAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            <Button onClick={handleAddPatient}>
              <Copy className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by patient name or register number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No patients found</h3>
            <p>Add your first patient to start tracking visit history</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-2">
          {filteredPatients
            .sort((a, b) => {
              // Sort by date (most recent first)
              const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
              const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
              return dateB.getTime() - dateA.getTime();
            })
            .map(patient => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:bg-accent transition-colors p-2 h-[70px] flex items-center"
                onClick={() => setSelectedPatient(patient)}
              >
                <CardHeader className="p-0 w-full">
                  <CardTitle className="text-lg font-bold leading-tight truncate">{patient.patientName || 'Unnamed Patient'}</CardTitle>
                  <p className="text-base text-muted-foreground font-medium truncate mt-0.5">Reg: {patient.registerNumber}</p>
                </CardHeader>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default AllVisitsPage;
