import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Pill, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  Copy, 
  Clock, 
  Calendar,
  User,
  FileText,
  Save,
  Eye,
  Stethoscope,
  Phone,
  MapPin,
  Building2,
  Edit3,
  Activity,
  Thermometer,
  Heart,
  Droplets,
  Wind,
  AlertTriangle,
  Database,
  Search,
  Upload,
  FolderOpen
} from "lucide-react";

interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  durationUnit: string;
  instructions: string;
  quantity: string;
  route: string;
}

interface PatientInfo {
  name: string;
  age: string;
  sex: string;
  weight: string;
  phone: string;
  registerNumber: string;
  chiefComplaint: string;
  complaintDuration: string;
  complaintDurationUnit: string;
  visitType: string;
  allergies: string;
  safetyAlerts: string;
  diagnosis: string;
  bp: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  spo2: string;
  bloodGlucose: string;
}

interface DoctorProfile {
  name: string;
  specialty: string;
  contact: string;
  clinicName: string;
  clinicAddress: string;
}

const Prescription = () => {
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    name: "",
    specialty: "",
    contact: "",
    clinicName: "",
    clinicAddress: ""
  });

  const [showDoctorProfile, setShowDoctorProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Load doctor profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('doctorProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setDoctorProfile(profile);
      } catch (e) {
        console.error('Error loading doctor profile:', e);
      }
    }
  }, []);

  const saveDoctorProfile = (profile: DoctorProfile) => {
    localStorage.setItem('doctorProfile', JSON.stringify(profile));
    setDoctorProfile(profile);
    setIsEditingProfile(false);
  };
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: "",
    sex: "",
    weight: "",
    phone: "",
    registerNumber: "",
    chiefComplaint: "",
    complaintDuration: "",
    complaintDurationUnit: "Days",
    visitType: "New",
    allergies: "",
    safetyAlerts: "",
    diagnosis: "",
    bp: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    spo2: "",
    bloodGlucose: ""
  });

  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [savedPrescriptions, setSavedPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved prescriptions when database is opened
  useEffect(() => {
    if (showDatabase) {
      const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
      setSavedPrescriptions(prescriptions.reverse()); // Show newest first
    }
  }, [showDatabase]);

  const searchPrescriptions = (query: string) => {
    setSearchQuery(query);
    const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    if (!query.trim()) {
      setSavedPrescriptions(prescriptions.reverse());
      return;
    }
    
    const filtered = prescriptions.filter((rx: any) => {
      const name = rx.patientInfo?.name?.toLowerCase() || '';
      const regNum = rx.patientInfo?.registerNumber?.toLowerCase() || '';
      const searchLower = query.toLowerCase();
      return name.includes(searchLower) || regNum.includes(searchLower);
    });
    
    setSavedPrescriptions(filtered.reverse());
  };

  const exportPrescriptions = () => {
    const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    const dataStr = JSON.stringify(prescriptions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prescriptions-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPrescriptions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (!Array.isArray(imported)) {
          alert('Invalid file format. Please import a valid prescriptions JSON file.');
          return;
        }
        
        const existing = JSON.parse(localStorage.getItem('prescriptions') || '[]');
        const merged = [...existing, ...imported];
        localStorage.setItem('prescriptions', JSON.stringify(merged));
        
        alert(`Successfully imported ${imported.length} prescription(s)!`);
        if (showDatabase) {
          setSavedPrescriptions(merged.reverse());
        }
      } catch (error) {
        alert('Error importing file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadPrescription = (rx: any) => {
    setPatientInfo(rx.patientInfo);
    setMedications(rx.medications);
    setAdditionalNotes(rx.additionalNotes || '');
    setFollowUpDate(rx.followUpDate || '');
    if (rx.doctorProfile) {
      setDoctorProfile(rx.doctorProfile);
    }
    setShowDatabase(false);
    alert('Prescription loaded successfully!');
  };

  const deletePrescription = (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    
    const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    const filtered = prescriptions.filter((rx: any) => rx.id !== id);
    localStorage.setItem('prescriptions', JSON.stringify(filtered));
    setSavedPrescriptions(filtered.reverse());
  };

  const frequencies = [
    "Once daily (OD)",
    "Twice daily (BID)",
    "Three times daily (TID)",
    "Four times daily (QID)",
    "Every 6 hours (Q6H)",
    "Every 8 hours (Q8H)",
    "Every 12 hours (Q12H)",
    "As needed (PRN)",
    "At bedtime (HS)",
    "Before meals (AC)",
    "After meals (PC)",
    "Once weekly",
    "Twice weekly"
  ];

  const routes = [
    "Oral",
    "Sublingual",
    "Topical",
    "Intramuscular (IM)",
    "Intravenous (IV)",
    "Subcutaneous (SC)",
    "Rectal",
    "Inhalation",
    "Ophthalmic",
    "Otic",
    "Nasal"
  ];

  const durationUnits = [
    "Days",
    "Weeks",
    "Months",
    "Until finished"
  ];

  const commonMedications = [
    "Paracetamol 500mg",
    "Ibuprofen 400mg",
    "Amoxicillin 500mg",
    "Metformin 500mg",
    "Amlodipine 5mg",
    "Omeprazole 20mg",
    "Diclofenac 50mg",
    "Cetirizine 10mg",
    "Salbutamol Inhaler",
    "Prednisolone 5mg"
  ];

  const addMedication = () => {
    const newMed: PrescriptionMedication = {
      id: Date.now().toString(),
      name: "",
      dosage: "",
      frequency: "Once daily (OD)",
      duration: "",
      durationUnit: "Days",
      instructions: "",
      quantity: "",
      route: "Oral"
    };
    setMedications([...medications, newMed]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const updateMedication = (id: string, field: keyof PrescriptionMedication, value: string) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const selectCommonMedication = (id: string, medName: string) => {
    updateMedication(id, "name", medName);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the prescription');
      return;
    }

    const printContent = generatePrintHTML();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generatePrintHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Prescription - ${patientInfo.name}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }
    .container {
      max-width: 100%;
      padding: 10px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .doctor-name {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .doctor-specialty {
      font-size: 12pt;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .doctor-info {
      font-size: 9pt;
      color: #4b5563;
    }
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }
    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 15px;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    .patient-info div {
      display: flex;
    }
    .label {
      font-weight: 600;
      min-width: 100px;
    }
    .section {
      margin: 8px 0;
      padding: 6px;
      background: #f9fafb;
      border-left: 3px solid #2563eb;
    }
    .section-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 4px;
    }
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    .vital-item {
      background: white;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 9pt;
    }
    .vital-label {
      font-size: 8pt;
      color: #6b7280;
    }
    .medications {
      margin: 10px 0;
    }
    .med-item {
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .med-item:last-child {
      border-bottom: none;
    }
    .med-name {
      font-weight: bold;
      font-size: 11pt;
    }
    .med-details {
      margin-left: 15px;
      font-size: 9pt;
      margin-top: 2px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #000;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
    }
    @media print {
      body {
        font-size: 10pt;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
`;

    // Add doctor header
    if (doctorProfile.name || doctorProfile.specialty || doctorProfile.contact || doctorProfile.clinicName) {
      printContent += `
    <div class="header">`;
      if (doctorProfile.name) printContent += `<div class="doctor-name">${doctorProfile.name}</div>`;
      if (doctorProfile.specialty) printContent += `<div class="doctor-specialty">${doctorProfile.specialty}</div>`;
      if (doctorProfile.contact || doctorProfile.clinicName || doctorProfile.clinicAddress) {
        printContent += `<div class="doctor-info">`;
        if (doctorProfile.contact) printContent += `<div>Contact: ${doctorProfile.contact}</div>`;
        if (doctorProfile.clinicName) printContent += `<div><strong>${doctorProfile.clinicName}</strong></div>`;
        if (doctorProfile.clinicAddress) printContent += `<div>${doctorProfile.clinicAddress}</div>`;
        printContent += `</div>`;
      }
      printContent += `</div>`;
    }

    // Title
    printContent += `<div class="title">MEDICAL PRESCRIPTION</div>`;

    // Patient info - only show filled fields
    printContent += `<div class="patient-info">`;
    if (patientInfo.name) printContent += `<div><span class="label">Patient:</span> ${patientInfo.name}</div>`;
    if (patientInfo.registerNumber) printContent += `<div><span class="label">Register No:</span> ${patientInfo.registerNumber}</div>`;
    if (patientInfo.age) printContent += `<div><span class="label">Age/Sex:</span> ${patientInfo.age} / ${patientInfo.sex}</div>`;
    if (patientInfo.phone) printContent += `<div><span class="label">Phone:</span> ${patientInfo.phone}</div>`;
    if (patientInfo.visitType) printContent += `<div><span class="label">Visit:</span> ${patientInfo.visitType}</div>`;
    if (patientInfo.weight) printContent += `<div><span class="label">Weight:</span> ${patientInfo.weight} kg</div>`;
    if (patientInfo.diagnosis) printContent += `<div style="grid-column: 1 / -1;"><span class="label">Diagnosis:</span> ${patientInfo.diagnosis}</div>`;
    printContent += `</div>`;

    // Chief complaint
    if (patientInfo.chiefComplaint) {
      printContent += `<div class="section"><div class="section-title">Chief Complaint</div><div>${patientInfo.chiefComplaint}`;
      if (patientInfo.complaintDuration) {
        printContent += ` <em>(Duration: ${patientInfo.complaintDuration} ${patientInfo.complaintDurationUnit})</em>`;
      }
      printContent += `</div></div>`;
    }

    // Allergies & Safety - always show
    printContent += `<div class="section" style="border-left-color: #f59e0b; background: #fef3c7;">`;
    printContent += `<div class="section-title">⚠ Allergies & Safety</div>`;
    printContent += `<div><strong>Allergies:</strong> ${patientInfo.allergies || 'None known'}</div>`;
    if (patientInfo.safetyAlerts) printContent += `<div><strong>Safety Alerts:</strong> ${patientInfo.safetyAlerts}</div>`;
    printContent += `</div>`;

    // Vitals - only if any filled
    if (patientInfo.bp || patientInfo.heartRate || patientInfo.temperature || patientInfo.respiratoryRate || patientInfo.spo2 || patientInfo.bloodGlucose) {
      printContent += `<div class="section"><div class="section-title">Vital Signs</div><div class="vitals-grid">`;
      if (patientInfo.bp) printContent += `<div class="vital-item"><div class="vital-label">BP</div><div>${patientInfo.bp} mmHg</div></div>`;
      if (patientInfo.heartRate) printContent += `<div class="vital-item"><div class="vital-label">Heart Rate</div><div>${patientInfo.heartRate} bpm</div></div>`;
      if (patientInfo.temperature) printContent += `<div class="vital-item"><div class="vital-label">Temp</div><div>${patientInfo.temperature}°F</div></div>`;
      if (patientInfo.respiratoryRate) printContent += `<div class="vital-item"><div class="vital-label">RR</div><div>${patientInfo.respiratoryRate} /min</div></div>`;
      if (patientInfo.spo2) printContent += `<div class="vital-item"><div class="vital-label">SpO2</div><div>${patientInfo.spo2}%</div></div>`;
      if (patientInfo.bloodGlucose) printContent += `<div class="vital-item"><div class="vital-label">Glucose</div><div>${patientInfo.bloodGlucose} mg/dL</div></div>`;
      printContent += `</div></div>`;
    }

    // Medications
    if (medications.length > 0) {
      printContent += `<div class="medications"><div class="section-title" style="font-size: 12pt; margin-bottom: 8px;">PRESCRIPTION</div>`;
      medications.forEach((med, index) => {
        printContent += `<div class="med-item">`;
        printContent += `<div class="med-name">${index + 1}. ${med.name}</div>`;
        printContent += `<div class="med-details">`;
        printContent += `<div><strong>Dosage:</strong> ${med.dosage} | <strong>Route:</strong> ${med.route}</div>`;
        printContent += `<div><strong>Frequency:</strong> ${med.frequency}`;
        if (med.duration) printContent += ` | <strong>Duration:</strong> ${med.duration} ${med.durationUnit}`;
        printContent += `</div>`;
        if (med.quantity) printContent += `<div><strong>Quantity:</strong> ${med.quantity}</div>`;
        if (med.instructions) printContent += `<div><strong>Instructions:</strong> ${med.instructions}</div>`;
        printContent += `</div></div>`;
      });
      printContent += `</div>`;
    }

    // Additional notes
    if (additionalNotes) {
      printContent += `<div class="section"><div class="section-title">Additional Notes</div><div>${additionalNotes}</div></div>`;
    }

    // Follow-up
    if (followUpDate) {
      printContent += `<div style="margin-top: 8px;"><strong>Follow-up:</strong> ${new Date(followUpDate).toLocaleDateString()}</div>`;
    }

    // Footer with signature
    printContent += `
    <div class="footer">
      <div>
        <div style="margin-bottom: 30px;">Signature: _______________________</div>
        <div>Doctor's Signature</div>
      </div>
      <div style="text-align: right;">
        <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return printContent;
  };

  const handleCopyToClipboard = () => {
    const prescriptionText = generatePrescriptionText();
    navigator.clipboard.writeText(prescriptionText);
  };

  const generatePrescriptionText = () => {
    let text = `PRESCRIPTION\n`;
    text += `=${'='.repeat(50)}\n\n`;
    
    // Add doctor/clinic info
    if (doctorProfile.name) {
      text += `Doctor: ${doctorProfile.name}\n`;
    }
    if (doctorProfile.specialty) {
      text += `Specialty: ${doctorProfile.specialty}\n`;
    }
    if (doctorProfile.contact) {
      text += `Contact: ${doctorProfile.contact}\n`;
    }
    if (doctorProfile.clinicName) {
      text += `Clinic: ${doctorProfile.clinicName}\n`;
    }
    if (doctorProfile.clinicAddress) {
      text += `Address: ${doctorProfile.clinicAddress}\n`;
    }
    
    text += `\n${'-'.repeat(50)}\n\n`;
    
    // Patient identification
    text += `PATIENT INFORMATION:\n`;
    text += `Patient Name: ${patientInfo.name}\n`;
    text += `Register No: ${patientInfo.registerNumber || 'N/A'}\n`;
    text += `Age: ${patientInfo.age} | Sex: ${patientInfo.sex}\n`;
    text += `Phone: ${patientInfo.phone || 'N/A'}\n`;
    text += `Visit Type: ${patientInfo.visitType}\n`;
    text += `Weight: ${patientInfo.weight ? patientInfo.weight + ' kg' : 'N/A'}\n\n`;
    
    // Chief complaint
    if (patientInfo.chiefComplaint) {
      text += `CHIEF COMPLAINT:\n`;
      text += `${patientInfo.chiefComplaint}\n`;
      if (patientInfo.complaintDuration) {
        text += `Duration: ${patientInfo.complaintDuration} ${patientInfo.complaintDurationUnit}\n`;
      }
      text += `\n`;
    }
    
    // Allergies & Safety
    text += `ALLERGIES & SAFETY:\n`;
    text += `Drug Allergies: ${patientInfo.allergies || 'None known'}\n`;
    text += `Safety Alerts: ${patientInfo.safetyAlerts || 'None'}\n\n`;
    
    // Vital Signs
    text += `VITAL SIGNS:\n`;
    if (patientInfo.bp) text += `BP: ${patientInfo.bp} mmHg\n`;
    if (patientInfo.heartRate) text += `Heart Rate: ${patientInfo.heartRate} bpm\n`;
    if (patientInfo.temperature) text += `Temperature: ${patientInfo.temperature}°F\n`;
    if (patientInfo.respiratoryRate) text += `Respiratory Rate: ${patientInfo.respiratoryRate} /min\n`;
    if (patientInfo.spo2) text += `SpO2: ${patientInfo.spo2}%\n`;
    if (patientInfo.bloodGlucose) text += `Blood Glucose: ${patientInfo.bloodGlucose} mg/dL\n`;
    text += `\n`;
    
    if (patientInfo.diagnosis) {
      text += `DIAGNOSIS: ${patientInfo.diagnosis}\n\n`;
    }
    
    text += `PRESCRIPTION:\n`;
    text += `-${'-'.repeat(50)}\n\n`;

    medications.forEach((med, index) => {
      text += `${index + 1}. ${med.name}\n`;
      text += `   Dosage: ${med.dosage}\n`;
      text += `   Route: ${med.route}\n`;
      text += `   Frequency: ${med.frequency}\n`;
      text += `   Duration: ${med.duration} ${med.durationUnit}\n`;
      if (med.quantity) text += `   Quantity: ${med.quantity}\n`;
      if (med.instructions) text += `   Instructions: ${med.instructions}\n`;
      text += `\n`;
    });

    if (additionalNotes) {
      text += `ADDITIONAL NOTES:\n`;
      text += `${additionalNotes}\n\n`;
    }

    if (followUpDate) {
      text += `FOLLOW-UP: ${followUpDate}\n\n`;
    }

    text += `=${'='.repeat(50)}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `Signature: ___________________\n`;

    return text;
  };

  const handleSavePrescription = () => {
    // Validate required fields
    if (!patientInfo.name.trim()) {
      alert('Patient Name is required!');
      return;
    }
    if (!patientInfo.age.trim()) {
      alert('Patient Age is required!');
      return;
    }
    if (medications.length === 0) {
      alert('Please add at least one medication!');
      return;
    }
    
    // Validate required medication fields
    for (const med of medications) {
      if (!med.name.trim()) {
        alert('Medication Name is required for all medications!');
        return;
      }
      if (!med.dosage.trim()) {
        alert('Dosage is required for all medications!');
        return;
      }
      if (!med.frequency) {
        alert('Frequency is required for all medications!');
        return;
      }
    }

    const prescriptionData = {
      id: Date.now().toString(),
      patientInfo,
      medications,
      additionalNotes,
      followUpDate,
      doctorProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    savedPrescriptions.push(prescriptionData);
    localStorage.setItem('prescriptions', JSON.stringify(savedPrescriptions));
    
    alert('Prescription saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Digital Prescription System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and print medical prescriptions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Doctor Profile, Patient Info & Medications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor/Clinic Profile Section */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    Doctor/Clinic Profile
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDoctorProfile(!showDoctorProfile)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showDoctorProfile ? 'Hide' : 'Show'}
                    </Button>
                    {doctorProfile.name && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showDoctorProfile && (
                  <div className="space-y-4">
                    {/* Display Mode */}
                    {!isEditingProfile && doctorProfile.name ? (
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Doctor Name</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {doctorProfile.name || 'Not set'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Specialty</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {doctorProfile.specialty || 'Not set'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {doctorProfile.contact || 'Not set'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Clinic/Hospital</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {doctorProfile.clinicName || 'Not set'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Clinic Address</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-1" />
                              {doctorProfile.clinicAddress || 'Not set'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Edit Mode */
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Doctor Name *
                            </Label>
                            <Input
                              value={doctorProfile.name}
                              onChange={(e) => setDoctorProfile({...doctorProfile, name: e.target.value})}
                              placeholder="Dr. Full Name"
                            />
                          </div>
                          <div>
                            <Label className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />
                              Specialty
                            </Label>
                            <Input
                              value={doctorProfile.specialty}
                              onChange={(e) => setDoctorProfile({...doctorProfile, specialty: e.target.value})}
                              placeholder="e.g., General Medicine, Cardiology"
                            />
                          </div>
                          <div>
                            <Label className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Contact Number
                            </Label>
                            <Input
                              value={doctorProfile.contact}
                              onChange={(e) => setDoctorProfile({...doctorProfile, contact: e.target.value})}
                              placeholder="e.g., +1234567890"
                            />
                          </div>
                          <div>
                            <Label className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Clinic/Hospital Name
                            </Label>
                            <Input
                              value={doctorProfile.clinicName}
                              onChange={(e) => setDoctorProfile({...doctorProfile, clinicName: e.target.value})}
                              placeholder="e.g., City Medical Center"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Clinic Address
                            </Label>
                            <Textarea
                              value={doctorProfile.clinicAddress}
                              onChange={(e) => setDoctorProfile({...doctorProfile, clinicAddress: e.target.value})}
                              placeholder="Full clinic/hospital address"
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => saveDoctorProfile(doctorProfile)}
                            size="sm"
                            className="flex-1"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Profile
                          </Button>
                          <Button 
                            onClick={() => {
                              setIsEditingProfile(false);
                              if (!doctorProfile.name) setShowDoctorProfile(false);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* First-time setup message */}
                    {!isEditingProfile && !doctorProfile.name && (
                      <div className="text-center py-4">
                        <Stethoscope className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          Set up your doctor profile to include on all prescriptions
                        </p>
                        <Button 
                          onClick={() => setIsEditingProfile(true)}
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Create Profile
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Information */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="identification" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="identification">ID</TabsTrigger>
                    <TabsTrigger value="complaint">Complaint</TabsTrigger>
                    <TabsTrigger value="allergy">Allergy</TabsTrigger>
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  </TabsList>
                  
                  {/* Patient Identification Tab */}
                  <TabsContent value="identification" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label>Patient Name <span className="text-red-500">*</span></Label>
                        <Input
                          value={patientInfo.name}
                          onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                          placeholder="Full name (required)"
                          className="border-2 border-blue-200"
                        />
                      </div>
                      <div>
                        <Label>Register Number</Label>
                        <Input
                          value={patientInfo.registerNumber}
                          onChange={(e) => setPatientInfo({...patientInfo, registerNumber: e.target.value})}
                          placeholder="e.g., PT-2024-001 (optional)"
                        />
                      </div>
                      <div>
                        <Label>Age <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={patientInfo.age}
                          onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                          placeholder="Years (required)"
                          className="border-2 border-blue-200"
                        />
                      </div>
                      <div>
                        <Label>Sex *</Label>
                        <Select
                          value={patientInfo.sex}
                          onValueChange={(value) => setPatientInfo({...patientInfo, sex: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          type="tel"
                          value={patientInfo.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d+\-() ]/g, '');
                            setPatientInfo({...patientInfo, phone: value});
                          }}
                          placeholder="+1234567890"
                        />
                      </div>
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          value={patientInfo.weight}
                          onChange={(e) => setPatientInfo({...patientInfo, weight: e.target.value})}
                          placeholder="kg"
                        />
                      </div>
                      <div>
                        <Label>Visit Type *</Label>
                        <Select
                          value={patientInfo.visitType}
                          onValueChange={(value) => setPatientInfo({...patientInfo, visitType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New Visit</SelectItem>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Chief Complaint Tab */}
                  <TabsContent value="complaint" className="space-y-4">
                    <div>
                      <Label>Chief Complaint *</Label>
                      <Textarea
                        value={patientInfo.chiefComplaint}
                        onChange={(e) => setPatientInfo({...patientInfo, chiefComplaint: e.target.value})}
                        placeholder="Primary reason for visit (e.g., Fever, headache, chest pain)"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Duration of Complaint</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={patientInfo.complaintDuration}
                          onChange={(e) => setPatientInfo({...patientInfo, complaintDuration: e.target.value})}
                          placeholder="Number"
                        />
                        <Select
                          value={patientInfo.complaintDurationUnit}
                          onValueChange={(value) => setPatientInfo({...patientInfo, complaintDurationUnit: value})}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Days">Days</SelectItem>
                            <SelectItem value="Weeks">Weeks</SelectItem>
                            <SelectItem value="Months">Months</SelectItem>
                            <SelectItem value="Years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Allergy & Safety Tab */}
                  <TabsContent value="allergy" className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <Label className="text-yellow-800 dark:text-yellow-200 font-semibold">Allergy & Safety Alerts</Label>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Known Drug Allergies</Label>
                          <Textarea
                            value={patientInfo.allergies}
                            onChange={(e) => setPatientInfo({...patientInfo, allergies: e.target.value})}
                            placeholder="e.g., Penicillin, Sulfa drugs, NSAIDs (or 'None known')"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Safety Alerts/Warnings</Label>
                          <Textarea
                            value={patientInfo.safetyAlerts}
                            onChange={(e) => setPatientInfo({...patientInfo, safetyAlerts: e.target.value})}
                            placeholder="e.g., Pregnancy, renal impairment, liver disease, bleeding disorders"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Vital Signs Tab */}
                  <TabsContent value="vitals" className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <Label className="text-blue-800 dark:text-blue-200 font-semibold">Vital Signs</Label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="flex items-center gap-1 text-sm">
                            <Activity className="w-3 h-3" />
                            BP (mmHg)
                          </Label>
                          <Input
                            value={patientInfo.bp}
                            onChange={(e) => setPatientInfo({...patientInfo, bp: e.target.value})}
                            placeholder="120/80"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-sm">
                            <Heart className="w-3 h-3" />
                            HR (bpm)
                          </Label>
                          <Input
                            type="number"
                            value={patientInfo.heartRate}
                            onChange={(e) => setPatientInfo({...patientInfo, heartRate: e.target.value})}
                            placeholder="72"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-sm">
                            <Thermometer className="w-3 h-3" />
                            Temp (°F)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={patientInfo.temperature}
                            onChange={(e) => setPatientInfo({...patientInfo, temperature: e.target.value})}
                            placeholder="98.6"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-sm">
                            <Wind className="w-3 h-3" />
                            RR (/min)
                          </Label>
                          <Input
                            type="number"
                            value={patientInfo.respiratoryRate}
                            onChange={(e) => setPatientInfo({...patientInfo, respiratoryRate: e.target.value})}
                            placeholder="16"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-sm">
                            <Droplets className="w-3 h-3" />
                            SpO2 (%)
                          </Label>
                          <Input
                            type="number"
                            value={patientInfo.spo2}
                            onChange={(e) => setPatientInfo({...patientInfo, spo2: e.target.value})}
                            placeholder="98"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-sm">
                            <Droplets className="w-3 h-3" />
                            Blood Glucose (mg/dL)
                          </Label>
                          <Input
                            type="number"
                            value={patientInfo.bloodGlucose}
                            onChange={(e) => setPatientInfo({...patientInfo, bloodGlucose: e.target.value})}
                            placeholder="100"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* Diagnosis Section - Always visible */}
                <div className="mt-6 pt-6 border-t">
                  <Label className="text-lg font-semibold mb-2 block">Diagnosis / Clinical Notes</Label>
                  <Textarea
                    value={patientInfo.diagnosis}
                    onChange={(e) => setPatientInfo({...patientInfo, diagnosis: e.target.value})}
                    placeholder="Primary diagnosis and relevant clinical information"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    Prescription Medications
                  </CardTitle>
                  <Button onClick={addMedication} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {medications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No medications added yet</p>
                    <Button onClick={addMedication} variant="outline" className="mt-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Medication
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medications.map((med, index) => (
                      <Card key={med.id} className="border-2 border-blue-100 dark:border-blue-900">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary">Medication #{index + 1}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(med.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Medication Name <span className="text-red-500">*</span></Label>
                              <Input
                                value={med.name}
                                onChange={(e) => updateMedication(med.id, "name", e.target.value)}
                                placeholder="e.g., Paracetamol 500mg (required)"
                                className="border-2 border-blue-200"
                              />
                              {/* Quick select common medications */}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {commonMedications.slice(0, 5).map(commonMed => (
                                  <Badge
                                    key={commonMed}
                                    variant="outline"
                                    className="cursor-pointer text-xs hover:bg-blue-50"
                                    onClick={() => selectCommonMedication(med.id, commonMed)}
                                  >
                                    {commonMed}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Dosage <span className="text-red-500">*</span></Label>
                              <Input
                                value={med.dosage}
                                onChange={(e) => updateMedication(med.id, "dosage", e.target.value)}
                                placeholder="e.g., 1 tablet, 5ml (required)"
                                className="border-2 border-blue-200"
                              />
                            </div>
                            <div>
                              <Label>Route *</Label>
                              <Select
                                value={med.route}
                                onValueChange={(value) => updateMedication(med.id, "route", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {routes.map(route => (
                                    <SelectItem key={route} value={route}>{route}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Frequency <span className="text-red-500">*</span></Label>
                              <Select
                                value={med.frequency}
                                onValueChange={(value) => updateMedication(med.id, "frequency", value)}
                              >
                                <SelectTrigger className="border-2 border-blue-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {frequencies.map(freq => (
                                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Duration</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  value={med.duration}
                                  onChange={(e) => updateMedication(med.id, "duration", e.target.value)}
                                  placeholder="Number"
                                />
                                <Select
                                  value={med.durationUnit}
                                  onValueChange={(value) => updateMedication(med.id, "durationUnit", value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {durationUnits.map(unit => (
                                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                value={med.quantity}
                                onChange={(e) => updateMedication(med.id, "quantity", e.target.value)}
                                placeholder="e.g., 30 tablets"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label>Special Instructions</Label>
                              <Textarea
                                value={med.instructions}
                                onChange={(e) => updateMedication(med.id, "instructions", e.target.value)}
                                placeholder="e.g., Take after meals, Avoid alcohol"
                                rows={2}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes & Follow-up */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Additional Notes / Advice</Label>
                    <Textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Dietary advice, lifestyle modifications, warning signs to watch for..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Follow-up Date
                    </Label>
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Actions & Preview */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowPreview(!showPreview)} 
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
                <Button 
                  onClick={() => setShowDatabase(!showDatabase)} 
                  className="w-full"
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Prescription Database
                </Button>
                <Button onClick={handleSavePrescription} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Prescription
                </Button>
                <Button onClick={handleCopyToClipboard} className="w-full" variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button onClick={handlePrint} className="w-full" variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Prescription
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <CardTitle>Prescription Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Medications:</span>
                    <Badge>{medications.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Patient:</span>
                    <span className="text-sm font-medium">
                      {patientInfo.name || 'Not entered'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Prescription Database Modal */}
        {showDatabase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Database className="w-6 h-6" />
                    Prescription Database
                  </h2>
                  <Button onClick={() => setShowDatabase(false)} variant="ghost" size="sm">
                    Close
                  </Button>
                </div>
                
                {/* Search and Actions */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => searchPrescriptions(e.target.value)}
                      placeholder="Search by patient name or register number..."
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={exportPrescriptions} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export All
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={importPrescriptions}
                    className="hidden"
                  />
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {savedPrescriptions.length} prescription(s)
                </div>
              </div>
              
              <div className="p-4">
                {savedPrescriptions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No saved prescriptions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedPrescriptions.map((rx) => (
                      <Card key={rx.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg">{rx.patientInfo?.name || 'Unknown'}</h3>
                                <Badge variant="secondary">{rx.patientInfo?.visitType || 'N/A'}</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-semibold">Age:</span> {rx.patientInfo?.age || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-semibold">Register:</span> {rx.patientInfo?.registerNumber || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-semibold">Date:</span> {new Date(rx.createdAt).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-semibold">Medications:</span> {rx.medications?.length || 0}
                                </div>
                              </div>
                              {rx.patientInfo?.chiefComplaint && (
                                <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Complaint:</span> {rx.patientInfo.chiefComplaint}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadPrescription(rx)}
                              >
                                <FolderOpen className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deletePrescription(rx.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Prescription Preview</h2>
                <Button onClick={() => setShowPreview(false)} variant="ghost" size="sm">
                  Close
                </Button>
              </div>
              <div ref={prescriptionRef} className="p-6">
                <div className="bg-white p-8 border-2 border-gray-300">
                  {/* Doctor/Clinic Header */}
                  <div className="text-center mb-6 border-b-2 border-blue-600 pb-4">
                    {doctorProfile.name && (
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {doctorProfile.name}
                      </h1>
                    )}
                    {doctorProfile.specialty && (
                      <p className="text-lg text-blue-600 font-semibold mb-2">
                        {doctorProfile.specialty}
                      </p>
                    )}
                    <div className="space-y-1 text-sm text-gray-600">
                      {doctorProfile.contact && (
                        <p>Contact: {doctorProfile.contact}</p>
                      )}
                      {doctorProfile.clinicName && (
                        <p className="font-semibold text-gray-900">{doctorProfile.clinicName}</p>
                      )}
                      {doctorProfile.clinicAddress && (
                        <p>{doctorProfile.clinicAddress}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">MEDICAL PRESCRIPTION</h2>
                    <div className="border-b-2 border-gray-900 mt-2"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="font-semibold">Patient Name:</p>
                      <p>{patientInfo.name || '_______________'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Date:</p>
                      <p>{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Register No:</p>
                      <p>{patientInfo.registerNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Visit Type:</p>
                      <p>{patientInfo.visitType}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Age:</p>
                      <p>{patientInfo.age || '___'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Sex:</p>
                      <p>{patientInfo.sex || '_______'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Phone:</p>
                      <p>{patientInfo.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Weight:</p>
                      <p>{patientInfo.weight ? `${patientInfo.weight} kg` : 'N/A'}</p>
                    </div>
                  </div>

                  {patientInfo.chiefComplaint && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-lg mb-2">Chief Complaint:</p>
                      <p>{patientInfo.chiefComplaint}</p>
                      {patientInfo.complaintDuration && (
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {patientInfo.complaintDuration} {patientInfo.complaintDurationUnit}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="font-semibold mb-2">Allergies & Safety:</p>
                    <p><span className="text-sm">Drug Allergies:</span> {patientInfo.allergies || 'None known'}</p>
                    <p><span className="text-sm">Safety Alerts:</span> {patientInfo.safetyAlerts || 'None'}</p>
                  </div>

                  {(patientInfo.bp || patientInfo.heartRate || patientInfo.temperature || patientInfo.respiratoryRate || patientInfo.spo2 || patientInfo.bloodGlucose) && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="font-semibold text-lg mb-3">Vital Signs:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {patientInfo.bp && (
                          <div className="bg-white p-2 rounded">
                            <p className="text-xs text-gray-600">BP</p>
                            <p className="font-semibold">{patientInfo.bp} mmHg</p>
                          </div>
                        )}
                        {patientInfo.heartRate && (
                          <div className="bg-white p-2 rounded">
                            <p className="text-xs text-gray-600">Heart Rate</p>
                            <p className="font-semibold">{patientInfo.heartRate} bpm</p>
                          </div>
                        )}
                        {patientInfo.temperature && (
                          <div className="bg-white p-2 rounded">
                            <p className="text-xs text-gray-600">Temperature</p>
                            <p className="font-semibold">{patientInfo.temperature}°F</p>
                          </div>
                        )}
                        {patientInfo.respiratoryRate && (
                          <div className="bg-white p-2 rounded">
                            <p className="text-xs text-gray-600">Resp. Rate</p>
                            <p className="font-semibold">{patientInfo.respiratoryRate} /min</p>
                          </div>
                        )}
                        {patientInfo.spo2 && (
                          <div className="bg-white p-2 rounded">
                            <p className="text-xs text-gray-600">SpO2</p>
                            <p className="font-semibold">{patientInfo.spo2}%</p>
                          </div>
                        )}
                        {patientInfo.bloodGlucose && (
                          <div className="bg-white p-2 rounded">
                            <p className="text-xs text-gray-600">Blood Glucose</p>
                            <p className="font-semibold">{patientInfo.bloodGlucose} mg/dL</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {patientInfo.diagnosis && (
                    <div className="mb-6">
                      <p className="font-semibold">Diagnosis:</p>
                      <p>{patientInfo.diagnosis}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-3 border-b pb-2">PRESCRIPTION:</h3>
                    {medications.map((med, index) => (
                      <div key={med.id} className="mb-4 pb-4 border-b last:border-b-0">
                        <p className="font-bold">{index + 1}. {med.name}</p>
                        <div className="ml-4 space-y-1 text-sm">
                          <p><span className="font-semibold">Dosage:</span> {med.dosage}</p>
                          <p><span className="font-semibold">Route:</span> {med.route}</p>
                          <p><span className="font-semibold">Frequency:</span> {med.frequency}</p>
                          <p><span className="font-semibold">Duration:</span> {med.duration} {med.durationUnit}</p>
                          {med.quantity && <p><span className="font-semibold">Quantity:</span> {med.quantity}</p>}
                          {med.instructions && <p><span className="font-semibold">Instructions:</span> {med.instructions}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {additionalNotes && (
                    <div className="mb-6">
                      <p className="font-semibold">Additional Notes:</p>
                      <p className="whitespace-pre-wrap">{additionalNotes}</p>
                    </div>
                  )}

                  {followUpDate && (
                    <div className="mb-6">
                      <p className="font-semibold">Follow-up Date:</p>
                      <p>{new Date(followUpDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="mt-12 pt-8 border-t">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Signature:</p>
                        <div className="mt-8 border-b border-gray-400 w-48"></div>
                        <p className="text-sm mt-1">Doctor's Signature</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Date:</p>
                        <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t p-4 flex gap-3">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleCopyToClipboard} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescription;
