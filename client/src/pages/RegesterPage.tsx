import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Link } from 'wouter';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Download, 
  Upload,
  Calendar,
  User,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface VisitRecord {
  visitNumber: number;
  date: Date;
  complaints: string[];
  treatment: string;
  responseStatus: 'Best response' | 'Moderate response' | 'No response' | 'Bad response' | 'Not evaluated yet';
  responseTimestamp: Date | null;
}

interface PatientNote {
  id: string;
  name: string;
  age: string;
  sex: string;
  patientNumber: string;
  symptoms: string[];
  prescription: string;
  doctorNotes: string;
  responseStatus: 'Best response' | 'Moderate response' | 'No response' | 'Bad response' | 'Not evaluated yet';
  responseTimestamp: Date | null;
  timestamp: Date;
  diagnosis: string;
  duration: string;
  visits: VisitRecord[]; // Multi-visit history
}

interface SymptomGroup {
  id: string;
  symptomSignature: string; // Normalized symptom string for comparison
  symptomList: string[];
  displayName: string;
  patientCount: number;
  lastUpdated: Date;
  patients: PatientNote[];
}

const RegesterPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<SymptomGroup[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientNote | null>(null);
  const [currentGroup, setCurrentGroup] = useState<SymptomGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [symptomSearch, setSymptomSearch] = useState('');
  const [responseFilter, setResponseFilter] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'groups' | 'patients'>('groups');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{open: boolean, id: string | null, type: 'patient' | 'group'}>({open: false, id: null, type: 'patient'});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('regester_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Convert date strings back to Date objects
        const groupsWithDates = parsedData.groups.map((group: any) => ({
          ...group,
          lastUpdated: new Date(group.lastUpdated),
          patients: group.patients.map((patient: any) => ({
            ...patient,
            timestamp: new Date(patient.timestamp),
            responseTimestamp: patient.responseTimestamp instanceof Date ? patient.responseTimestamp : patient.responseTimestamp ? new Date(patient.responseTimestamp) : null
          }))
        }));
        setGroups(groupsWithDates);
      } catch (e) {
        console.error('Failed to parse saved regester data:', e);
        setGroups([]);
      }
    } else {
      setGroups([]);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      groups: groups.map(group => ({
        ...group,
        lastUpdated: group.lastUpdated.toISOString(),
        patients: group.patients.map(patient => ({
          ...patient,
          timestamp: patient.timestamp.toISOString(),
          responseTimestamp: patient.responseTimestamp instanceof Date ? patient.responseTimestamp.toISOString() : patient.responseTimestamp
        }))
      }))
    };
    localStorage.setItem('regester_data', JSON.stringify(dataToSave));
  }, [groups]);

  // Symptom normalization function
  const normalizeSymptoms = (symptoms: string[]): string => {
    return symptoms
      .map(s => s.toLowerCase().trim())
      .filter(s => s.length > 0)
      .sort()
      .join('|');
  };

  // Update symptom groups based on current data
  const updateGroups = (patientNotes: PatientNote[]) => {
    const groupsMap = new Map<string, PatientNote[]>();

    // Group patients by normalized symptoms
    patientNotes.forEach(note => {
      const signature = normalizeSymptoms(note.symptoms);
      if (!groupsMap.has(signature)) {
        groupsMap.set(signature, []);
      }
      // Ensure all required fields are present
      const noteWithDefaults = {
        ...note,
        patientNumber: `P${Date.now().toString().slice(-6)}`,
        sex: '',
        duration: '',
        diagnosis: '',
        responseTimestamp: note.responseTimestamp instanceof Date ? note.responseTimestamp : note.responseTimestamp ? new Date(note.responseTimestamp) : null
      };
      groupsMap.get(signature)?.push(noteWithDefaults);
    });

    // Convert to SymptomGroup objects
    const newGroups: SymptomGroup[] = Array.from(groupsMap.entries()).map(([signature, patients]) => {
      const sortedPatients = [...patients].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      const symptomList = signature.split('|').filter(s => s);
      const displayName = symptomList.length > 0 
        ? symptomList.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ') 
        : 'No Symptoms';
      
      return {
        id: `group_${signature}`,
        symptomSignature: signature,
        symptomList: symptomList,
        displayName: displayName,
        patientCount: patients.length,
        lastUpdated: sortedPatients[0]?.timestamp || new Date(),
        patients: sortedPatients
      };
    });

    // Sort groups by last updated date
    const sortedGroups = newGroups.sort((a, b) => 
      b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );

    setGroups(sortedGroups);
  };

  // Add a new patient note
  const addPatientNote = (note: PatientNote) => {
    const allPatients = groups.flatMap(group => group.patients);
    // Ensure all required fields are present
    const noteWithDefaults = {
      ...note,
      patientNumber: `P${Date.now().toString().slice(-6)}`,
      sex: '',
      duration: '',
      diagnosis: '',
      responseTimestamp: note.responseTimestamp instanceof Date ? note.responseTimestamp : note.responseTimestamp ? new Date(note.responseTimestamp) : null
    };
    allPatients.push(noteWithDefaults);
    updateGroups(allPatients);
  };

  // Update an existing patient note
  const updatePatientNote = (updatedNote: PatientNote) => {
    const allPatients = groups.flatMap(group => group.patients);
    const index = allPatients.findIndex(note => note.id === updatedNote.id);
    if (index !== -1) {
      // Ensure required fields are present
      const updatedNoteWithDefaults = {
        ...updatedNote,
        patientNumber: `P${Date.now().toString().slice(-6)}`,
        sex: '',
        duration: '',
        diagnosis: '',
        responseTimestamp: updatedNote.responseTimestamp instanceof Date ? updatedNote.responseTimestamp : updatedNote.responseTimestamp ? new Date(updatedNote.responseTimestamp) : null
      };
      allPatients[index] = updatedNoteWithDefaults;
      updateGroups(allPatients);
    }
  };

  // Delete a patient note
  const deletePatientNote = (id: string) => {
    const allPatients = groups.flatMap(group => group.patients);
    const updatedPatients = allPatients.filter(note => note.id !== id);
    updateGroups(updatedPatients);
  };

  // Delete an entire group
  const deleteGroup = (groupId: string) => {
    const groupToDelete = groups.find(group => group.id === groupId);
    if (!groupToDelete) return;
    
    const allPatients = groups.flatMap(group => group.patients);
    const groupPatientIds = new Set(groupToDelete.patients.map(p => p.id));
    const updatedPatients = allPatients.filter(note => !groupPatientIds.has(note.id));
    updateGroups(updatedPatients);
  };

  // Handle saving a patient note
  const handleSavePatient = () => {
    if (!currentPatient) return;

    if (currentPatient.id.startsWith('new')) {
      // New patient note
      const newPatient = {
        ...currentPatient,
        id: Date.now().toString(),
        timestamp: new Date(),
        responseStatus: currentPatient.responseStatus || 'Not evaluated yet',
        responseTimestamp: currentPatient.responseTimestamp instanceof Date ? currentPatient.responseTimestamp : currentPatient.responseTimestamp ? new Date(currentPatient.responseTimestamp) : null
      };
      addPatientNote(newPatient);
    } else {
      // Update existing patient note
      updatePatientNote(currentPatient);
    }

    setIsEditing(false);
    setCurrentPatient(null);
    setCurrentGroup(null);
  };

  // Handle editing a patient note
  const handleEditPatient = (patient: PatientNote) => {
    // Ensure all required fields are present
    const patientWithDefaults = {
      ...patient,
      patientNumber: `P${Date.now().toString().slice(-6)}`,
      sex: '',
      duration: '',
      diagnosis: '',
      responseTimestamp: patient.responseTimestamp instanceof Date ? patient.responseTimestamp : patient.responseTimestamp ? new Date(patient.responseTimestamp) : null
    };
    setCurrentPatient(patientWithDefaults);
    setIsEditing(true);
    setCurrentGroup(null);
  };

  // Handle viewing a group
  const handleViewGroup = (group: SymptomGroup) => {
    setCurrentGroup(group);
    setCurrentPatient(null);
    setIsEditing(false);
  };

  // Handle back to groups view
  const handleBackToGroups = () => {
    setCurrentGroup(null);
    setCurrentPatient(null);
    setIsEditing(false);
  };

  // Handle delete confirmation
  const handleDeletePatient = (id: string) => {
    setDeleteConfirmation({open: true, id, type: 'patient'});
  };

  const handleDeleteGroup = (groupId: string) => {
    setDeleteConfirmation({open: true, id: groupId, type: 'group'});
  };

  const confirmDelete = () => {
    if (!deleteConfirmation.id) return;
    
    if (deleteConfirmation.type === 'patient') {
      deletePatientNote(deleteConfirmation.id);
    } else {
      deleteGroup(deleteConfirmation.id);
      if (currentGroup?.id === deleteConfirmation.id) {
        setCurrentGroup(null);
      }
    }
    
    setDeleteConfirmation({open: false, id: null, type: 'patient'});
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({open: false, id: null, type: 'patient'});
  };

  // Handle adding a new patient
  const handleAddNewPatient = () => {
    const newPatient: PatientNote = {
      id: `new_${Date.now()}`,
      name: '',
      age: '',
      sex: '',
      patientNumber: `P${Date.now().toString().slice(-6)}`,
      symptoms: [],
      prescription: '',
      doctorNotes: '',
      responseStatus: 'Not evaluated yet',
      responseTimestamp: null,
      timestamp: new Date(),
      diagnosis: '',
      duration: '',
      visits: []
    };
    setCurrentPatient(newPatient);
    setCurrentGroup(null);
    setIsEditing(true);
  };

  // Handle import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate imported data structure
        if (importedData && Array.isArray(importedData.groups)) {
          // Process imported groups and patients
          const importedPatients = [];
          
          for (const group of importedData.groups) {
            if (group.patients && Array.isArray(group.patients)) {
              for (const patient of group.patients) {
                importedPatients.push({
                  ...patient,
                  timestamp: patient.timestamp instanceof Date ? patient.timestamp : new Date(patient.timestamp),
                  responseTimestamp: patient.responseTimestamp instanceof Date ? patient.responseTimestamp : patient.responseTimestamp ? new Date(patient.responseTimestamp) : null,
                  // Ensure required fields are present
                  id: patient.id || `imported_${Date.now()}_${Math.random()}`,
                  name: patient.name || '',
                  age: patient.age || '',
                  symptoms: Array.isArray(patient.symptoms) ? patient.symptoms : [],
                  prescription: patient.prescription || '',
                  doctorNotes: patient.doctorNotes || '',
                  responseStatus: patient.responseStatus || 'Not evaluated yet'
                });
              }
            }
          }
          
          // Merge imported data with existing data
          const allPatients = [
            ...groups.flatMap(group => group.patients),
            ...importedPatients.map(patient => ({
              ...patient,
              patientNumber: patient.patientNumber || `P${Date.now().toString().slice(-6)}`,
              sex: patient.sex || '',
              duration: patient.duration || '',
              diagnosis: patient.diagnosis || '',
              responseTimestamp: patient.responseTimestamp instanceof Date ? patient.responseTimestamp : patient.responseTimestamp ? new Date(patient.responseTimestamp) : null
            }))
          ];
              
          updateGroups(allPatients);
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format. Please import a valid Regester backup.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing data. Please check the file format. Make sure you are importing a valid JSON file exported from the Regester page.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Handle export data
  const handleExport = () => {
    const dataToExport = {
      groups: groups.map(group => ({
        ...group,
        lastUpdated: group.lastUpdated.toISOString(),
        patients: group.patients.map(patient => ({
          id: patient.id,
          name: patient.name,
          age: patient.age,
          symptoms: patient.symptoms,
          prescription: patient.prescription,
          doctorNotes: patient.doctorNotes,
          responseStatus: patient.responseStatus,
          responseTimestamp: patient.responseTimestamp instanceof Date ? patient.responseTimestamp.toISOString() : patient.responseTimestamp,
          timestamp: patient.timestamp.toISOString()
        }))
      })),
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `regester-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => {
    if (!searchTerm && !responseFilter && !symptomSearch) return true;
    
    // Apply patient search filter
    let patientMatch = true;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      // Search in group name (symptoms)
      const nameMatch = group.displayName.toLowerCase().includes(lowerSearch);
      
      // Search in patient names
      patientMatch = nameMatch || group.patients.some(patient => 
        patient.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Apply response filter
    let responseMatch = true;
    if (responseFilter) {
      responseMatch = group.patients.some(patient => 
        patient.responseStatus === responseFilter
      );
    }
    
    // Apply symptom search filter
    let symptomMatch = true;
    if (symptomSearch) {
      const searchSymptoms = symptomSearch.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0)
        .sort();
      
      const groupSymptoms = group.symptomList.map(s => s.toLowerCase()).sort();
      
      // Check if arrays are equal (order doesn't matter)
      symptomMatch = searchSymptoms.length === groupSymptoms.length &&
                     searchSymptoms.every(symptom => groupSymptoms.includes(symptom));
    }
    
    return patientMatch && responseMatch && symptomMatch;
  });

  // Filter groups based on symptom search
  const filteredBySymptomGroups = symptomSearch ? 
    groups.filter(group => {
      const searchSymptoms = symptomSearch.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0)
        .sort();
      
      const groupSymptoms = group.symptomList.map(s => s.toLowerCase()).sort();
      
      // Check if arrays are equal (order doesn't matter)
      return searchSymptoms.length === groupSymptoms.length &&
             searchSymptoms.every(symptom => groupSymptoms.includes(symptom));
    }) : 
    filteredGroups;

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">REGESTER</h1>
          <p className="text-muted-foreground">Permanent clinical archive of all patient cases</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Symptom Groups List */}
        <div className="lg:w-1/3 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleAddNewPatient} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symptoms (comma separated)..."
                  value={symptomSearch}
                  onChange={(e) => setSymptomSearch(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>
            </div>
            
            <div>
              <select
                value={responseFilter}
                onChange={(e) => setResponseFilter(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All response statuses</option>
                <option value="Best response">Best response</option>
                <option value="Moderate response">Moderate response</option>
                <option value="No response">No response</option>
                <option value="Bad response">Bad response</option>
                <option value="Not evaluated yet">Not evaluated yet</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <div className="flex-1">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport} 
                  className="hidden" 
                  ref={fileInputRef}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
              </div>
            </div>
            
            {currentGroup && (
              <Button 
                variant="outline" 
                onClick={handleBackToGroups} 
                className="w-full"
              >
                ← Back to All Groups
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {currentGroup ? (
              // Show patients in current group
              <div className="space-y-2">
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <h3 className="font-semibold text-lg">{currentGroup.displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentGroup.patientCount} patient{currentGroup.patientCount !== 1 ? 's' : ''} • 
                    Last updated: {formatDate(currentGroup.lastUpdated)}
                  </p>
                </div>
                
                {currentGroup.patients.map(patient => (
                  <Card 
                    key={patient.id} 
                    className="cursor-pointer hover:bg-accent transition-colors border-l-4 border-primary"
                    onClick={() => handleEditPatient(patient)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground">{patient.name || 'Unnamed Patient'}</h3>
                          <p className="text-xs text-muted-foreground">{patient.patientNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(patient.timestamp)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPatient(patient);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePatient(patient.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Age: {patient.age}</div>
                        <div className="flex flex-wrap gap-1">
                          {patient.symptoms.slice(0, 4).map((symptom, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                          {patient.symptoms.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{patient.symptoms.length - 4} more
                            </Badge>
                          )}
                        </div>
                        {patient.prescription && (
                          <div className="mt-2 text-xs italic">
                            Rx: {patient.prescription.substring(0, 60)}{patient.prescription.length > 60 ? '...' : ''}
                          </div>
                        )}
                        <div className="mt-2">
                          <Badge 
                            variant={
                              patient.responseStatus === 'Best response' ? 'default' :
                              patient.responseStatus === 'Moderate response' ? 'secondary' :
                              patient.responseStatus === 'No response' ? 'outline' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {patient.responseStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Show symptom groups
              filteredBySymptomGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No patient groups found. Add a new patient to get started.
                </div>
              ) : (
                filteredBySymptomGroups.map(group => (
                  <Card 
                    key={group.id} 
                    className="cursor-pointer hover:bg-accent transition-colors border-l-4 border-blue-500"
                    onClick={() => handleViewGroup(group)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{group.displayName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {group.patientCount} patient{group.patientCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last updated: {formatDate(group.lastUpdated)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupExpansion(group.id);
                            }}
                          >
                            {expandedGroups.has(group.id) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-xs text-muted-foreground">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {group.symptomList.slice(0, 5).map((symptom, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                          {group.symptomList.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{group.symptomList.length - 5} more
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Click to view {group.patientCount} patient{group.patientCount !== 1 ? 's' : ''}
                        </div>
                        
                        {/* Response status summary */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="default" className="text-xs">
                            Best: {group.patients.filter(p => p.responseStatus === 'Best response').length}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Moderate: {group.patients.filter(p => p.responseStatus === 'Moderate response').length}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            No: {group.patients.filter(p => p.responseStatus === 'No response').length}
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            Bad: {group.patients.filter(p => p.responseStatus === 'Bad response').length}
                          </Badge>
                        </div>
                        
                        {/* Expanded view showing some patient details */}
                        {expandedGroups.has(group.id) && (
                          <div className="mt-3 space-y-2 border-t pt-2">
                            {group.patients.slice(0, 3).map(patient => (
                              <div key={patient.id} className="text-xs">
                                <div className="font-medium">{patient.name || 'Unnamed'}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Age: {patient.age}</span>
                                  <Badge 
                                    variant={
                                      patient.responseStatus === 'Best response' ? 'default' :
                                      patient.responseStatus === 'Moderate response' ? 'secondary' :
                                      patient.responseStatus === 'No response' ? 'outline' : 'destructive'
                                    }
                                    className="text-xs"
                                  >
                                    {patient.responseStatus}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {group.patients.length > 3 && (
                              <div className="text-muted-foreground">+{group.patients.length - 3} more patients</div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </div>
        </div>

        {/* Right Panel: Patient Note Details */}
        <div className="lg:w-2/3">
          {isEditing && currentPatient ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  {currentPatient.id.startsWith('new') ? 'Add New Patient Note' : 'Edit Patient Note'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Patient Name</label>
                    <Input
                      value={currentPatient.name}
                      onChange={(e) => setCurrentPatient({...currentPatient, name: e.target.value})}
                      placeholder="Enter patient name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Age</label>
                    <Input
                      value={currentPatient.age}
                      onChange={(e) => setCurrentPatient({...currentPatient, age: e.target.value})}
                      placeholder="Age"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Symptoms</label>
                  <Textarea
                    value={currentPatient.symptoms.join(', ')}
                    onChange={(e) => setCurrentPatient({
                      ...currentPatient, 
                      symptoms: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="Enter symptoms separated by commas"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Each symptom combination creates a separate group automatically
                  </p>
                </div>
                

                
                <div>
                  <label className="text-sm font-medium text-foreground">Prescription</label>
                  <Textarea
                    value={currentPatient.prescription}
                    onChange={(e) => setCurrentPatient({...currentPatient, prescription: e.target.value})}
                    placeholder="Enter prescription"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Treatment Response Status</label>
                  <select
                    value={currentPatient.responseStatus}
                    onChange={(e) => setCurrentPatient({
                      ...currentPatient, 
                      responseStatus: e.target.value as any,
                      responseTimestamp: new Date()
                    })}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Not evaluated yet">Not evaluated yet</option>
                    <option value="Best response">Best response</option>
                    <option value="Moderate response">Moderate response</option>
                    <option value="No response">No response</option>
                    <option value="Bad response">Bad response</option>
                  </select>
                  {currentPatient.responseTimestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {formatDate(currentPatient.responseTimestamp)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Doctor Notes</label>
                  <Textarea
                    value={currentPatient.doctorNotes}
                    onChange={(e) => setCurrentPatient({...currentPatient, doctorNotes: e.target.value})}
                    placeholder="Enter clinical observations, outcomes, or notes for future reference"
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setCurrentPatient(null);
                      setCurrentGroup(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSavePatient}>
                    <Save className="h-4 w-4 mr-1" />
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentPatient ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {currentPatient.name || 'Patient Record'}
                  <Badge variant="outline" className="ml-auto">{currentPatient.patientNumber}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Demographics</h3>
                    <p className="text-sm text-muted-foreground">Age: {currentPatient.age}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Timestamp</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(currentPatient.timestamp)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Symptoms</h3>
                  <div className="flex flex-wrap gap-1">
                    {currentPatient.symptoms.map((symptom, idx) => {
                    const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                      return (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {symptomText}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Diagnosis</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {currentPatient.diagnosis || 'No diagnosis specified'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Prescription</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {currentPatient.prescription || 'No prescription specified'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Treatment Response</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        currentPatient.responseStatus === 'Best response' ? 'default' :
                        currentPatient.responseStatus === 'Moderate response' ? 'secondary' :
                        currentPatient.responseStatus === 'No response' ? 'outline' : 'destructive'
                      }
                      className="text-sm"
                    >
                      {currentPatient.responseStatus}
                    </Badge>
                    {currentPatient.responseTimestamp && (
                      <span className="text-xs text-muted-foreground">
                        (Last updated: {formatDate(currentPatient.responseTimestamp)})
                      </span>
                    )}
                  </div>
                </div>
                
                {currentPatient.doctorNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Doctor Notes</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {currentPatient.doctorNotes}
                    </p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEditPatient(currentPatient)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeletePatient(currentPatient.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : currentGroup ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  {currentGroup.displayName}
                  <Badge variant="secondary" className="ml-auto">
                    {currentGroup.patientCount} Patient{currentGroup.patientCount !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Group Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Symptom Pattern:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentGroup.symptomList.map((symptom, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p><span className="text-muted-foreground">Patient Count:</span> {currentGroup.patientCount}</p>
                      <p><span className="text-muted-foreground">Last Updated:</span> {formatDate(currentGroup.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Patient Notes in this Group</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {currentGroup.patients.map(patient => (
                      <Card key={patient.id} className="hover:bg-accent transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{patient.name || 'Unnamed Patient'}</h4>
                              <p className="text-xs text-muted-foreground">{patient.patientNumber} • {formatDate(patient.timestamp)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="text-sm space-y-1">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Age:</span>
                              <span>{patient.age}</span>
                            </div>
                            {patient.prescription && (
                              <div className="mt-1">
                                <span className="text-muted-foreground">Rx:</span> 
                                <span className="ml-1">{patient.prescription.substring(0, 100)}{patient.prescription.length > 100 ? '...' : ''}</span>
                              </div>
                            )}
                            <div className="mt-1">
                              <Badge 
                                variant={
                                  patient.responseStatus === 'Best response' ? 'default' :
                                  patient.responseStatus === 'Moderate response' ? 'secondary' :
                                  patient.responseStatus === 'No response' ? 'outline' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {patient.responseStatus}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleBackToGroups}
                    variant="outline"
                    className="w-full"
                  >
                    ← Back to All Symptom Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground max-w-md">
                <Stethoscope className="h-16 w-16 mx-auto mb-4 text-muted" />
                <h3 className="text-lg font-medium mb-2">REGESTER</h3>
                <p className="mb-3">Your permanent clinical archive of all patient cases</p>
                <div className="text-left text-sm space-y-2 mt-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <strong>Permanent Storage:</strong> Nothing is auto-deleted. Data remains stored until you manually delete it.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                    <div>
                      <strong>Automatic Grouping:</strong> Cases are grouped by exact symptom sets for clinical reference.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                    <div>
                      <strong>Full Import/Export:</strong> Backup and restore your entire clinical archive.
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleAddNewPatient} 
                  className="mt-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Patient Note
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.open && (
        <Dialog open={deleteConfirmation.open} onOpenChange={handleCancelDelete}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                {deleteConfirmation.type === 'patient' 
                  ? 'Are you sure you want to delete this patient note? This action cannot be undone.'
                  : 'Are you sure you want to delete this entire group? This will remove ALL patient notes in this group and cannot be undone.'}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RegesterPage;