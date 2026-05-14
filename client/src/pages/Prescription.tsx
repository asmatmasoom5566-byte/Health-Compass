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
  FolderOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw
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
    visitType: "",
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
  const [previewRx, setPreviewRx] = useState<any>(null);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
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

  const clearPatientInfo = () => {
    if (!confirm('Clear all patient information?')) return;
    setPatientInfo({
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
  };

  const clearMedications = () => {
    if (!confirm('Clear all medications?')) return;
    setMedications([]);
  };

  const clearAdditionalInfo = () => {
    if (!confirm('Clear additional information?')) return;
    setAdditionalNotes("");
    setFollowUpDate("");
  };

  const frequencies = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "As needed",
    "At bedtime",
    "Before meals",
    "After meals",
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
      frequency: "",
      duration: "",
      durationUnit: "Days",
      instructions: "",
      quantity: "",
      route: ""
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

  const generatePrintHTML = (
    pPatientInfo = patientInfo,
    pMedications = medications,
    pDoctorProfile = doctorProfile,
    pAdditionalNotes = additionalNotes,
    pFollowUpDate = followUpDate
  ) => {
    // Calculate dynamic font sizes based on content amount
    const medCount = pMedications.length;
    const hasNotes = pAdditionalNotes ? 1 : 0;
    const contentScore = medCount + hasNotes;
    
    // Dynamic sizing: reduce font size as content increases
    let baseFontSize, patientFontSize, medNameSize, medDetailsSize, sectionSize;
    
    if (contentScore <= 3) {
      // Minimal content - larger text
      baseFontSize = '11pt';
      patientFontSize = '11pt';
      medNameSize = '12pt';
      medDetailsSize = '10pt';
      sectionSize = '11pt';
    } else if (contentScore <= 6) {
      // Moderate content - medium text
      baseFontSize = '10pt';
      patientFontSize = '10pt';
      medNameSize = '11pt';
      medDetailsSize = '9pt';
      sectionSize = '10pt';
    } else if (contentScore <= 10) {
      // More content - smaller text
      baseFontSize = '9pt';
      patientFontSize = '9pt';
      medNameSize = '10pt';
      medDetailsSize = '8pt';
      sectionSize = '9pt';
    } else {
      // Heavy content - smallest readable text
      baseFontSize = '8pt';
      patientFontSize = '8pt';
      medNameSize = '9pt';
      medDetailsSize = '7pt';
      sectionSize = '8pt';
    }
    
    let printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Prescription - ${pPatientInfo.name}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: ${baseFontSize};
      line-height: 1.25;
      color: #000;
    }
    .container {
      max-width: 100%;
      padding: 3px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }
    .doctor-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .doctor-specialty {
      font-size: 11pt;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 3px;
    }
    .doctor-info {
      font-size: 8pt;
      color: #4b5563;
    }
    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
      margin-bottom: 10px;
      font-size: ${patientFontSize};
      padding: 10px 12px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #0ea5e9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .patient-info div {
      display: flex;
      align-items: center;
    }
    .label {
      font-weight: 700;
      min-width: 95px;
      color: #0369a1;
    }
    .section {
      margin: 7px 0;
      padding: 6px 10px;
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .section-title {
      font-weight: bold;
      font-size: ${sectionSize};
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e40af;
    }
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    .vital-item {
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: ${medDetailsSize};
      border: 1px solid #e2e8f0;
    }
    .vital-label {
      font-size: 7pt;
      color: #64748b;
      font-weight: 600;
    }
    .medications {
      margin: 10px 0;
      padding: 12px;
      background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
      border: 2px solid #2563eb;
      border-radius: 8px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.08);
    }
    .medications .section-title {
      font-size: ${medNameSize};
      margin-bottom: 10px;
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      color: white;
      padding: 8px;
      margin: -12px -12px 10px -12px;
      border-radius: 6px 6px 0 0;
    }
    .med-item {
      margin-bottom: 8px;
      padding: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
    }
    .med-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .med-name {
      font-weight: bold;
      font-size: ${medNameSize};
      color: #1e40af;
      margin-bottom: 3px;
    }
    .med-details {
      margin-left: 18px;
      font-size: ${medDetailsSize};
      margin-top: 3px;
      line-height: 1.5;
      color: #334155;
    }
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 2px solid #000;
      display: flex;
      justify-content: flex-end;
      font-size: 9pt;
    }
    @media print {
      body {
        font-size: ${baseFontSize};
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

    // Add doctor header with 3D-style for print
    if (pDoctorProfile.name || pDoctorProfile.specialty || pDoctorProfile.contact || pDoctorProfile.clinicName) {
      printContent += `
    <div class="header" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #8b5cf6 100%); padding: 15px; border-radius: 10px; margin-bottom: 10px; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <!-- Background Pattern -->
      <div style="position: absolute; top: -15px; right: -15px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -20px; left: -20px; width: 90px; height: 90px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Doctor Icon -->
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.2);">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V4.3A.3.3 0 0 0 4.8 2.3z"/>
                  <path d="M2 9V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3"/>
                  <path d="M9 22h6c2.5 0 4-1.5 4-4v-3c0-2.5-1.5-4-4-4H9c-2.5 0-4 1.5-4 4v3c0 2.5 1.5 4 4 4z"/>
                  <path d="M12 11v3"/>
                  <path d="M12 17v.01"/>
                  <circle cx="12" cy="7" r="3"/>
                </svg>
              </div>
            </div>
            
            <div>`;
      
      if (pDoctorProfile.name) printContent += `<div style="font-size: 18pt; font-weight: bold; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); margin-bottom: 2px;">${pDoctorProfile.name}</div>`;
      if (pDoctorProfile.specialty) printContent += `<div style="font-size: 11pt; color: rgba(255,255,255,0.95); font-weight: 600;">${pDoctorProfile.specialty}</div>`;
      
      printContent += `</div>
          </div>
          
          <!-- Medical Cross Icon -->
          <div style="width: 42px; height: 42px; border-radius: 7px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.2); transform: rotate(12deg);">
            <div style="width: 32px; height: 32px; border-radius: 5px; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#dc2626">
                <path d="M9 2h6v6h6v6h-6v6H9v-6H3V8h6V2z"/>
              </svg>
            </div>
          </div>
        </div>`;
      
      if (pDoctorProfile.contact || pDoctorProfile.clinicName || pDoctorProfile.clinicAddress) {
        printContent += `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.3); display: flex; flex-wrap: wrap; gap: 10px; font-size: 8pt; color: rgba(255,255,255,0.95);">`;
        if (pDoctorProfile.contact) printContent += `<div>📞 ${pDoctorProfile.contact}</div>`;
        if (pDoctorProfile.clinicName) printContent += `<div style="font-weight: 600;">🏥 ${pDoctorProfile.clinicName}</div>`;
        if (pDoctorProfile.clinicAddress) printContent += `<div>📍 ${pDoctorProfile.clinicAddress}</div>`;
        printContent += `</div>`;
      }
      
      printContent += `
      </div>
    </div>`;
    }

    // Patient info - only show filled fields
    printContent += `<div class="patient-info">`;
    if (pPatientInfo.name) printContent += `<div><span class="label">Patient:</span> ${pPatientInfo.name}</div>`;
    if (pPatientInfo.registerNumber) printContent += `<div><span class="label">Register No:</span> ${pPatientInfo.registerNumber}</div>`;
    if (pPatientInfo.age || pPatientInfo.sex) {
      const ageSex = [pPatientInfo.age ? `${pPatientInfo.age} yrs` : '', pPatientInfo.sex || ''].filter(Boolean).join(' / ');
      printContent += `<div><span class="label">Age/Sex:</span> ${ageSex}</div>`;
    }
    if (pPatientInfo.phone) printContent += `<div><span class="label">Phone:</span> ${pPatientInfo.phone}</div>`;
    if (pPatientInfo.visitType) printContent += `<div><span class="label">Visit:</span> ${pPatientInfo.visitType}</div>`;
    if (pPatientInfo.weight) printContent += `<div><span class="label">Weight:</span> ${pPatientInfo.weight} kg</div>`;
    if (pPatientInfo.diagnosis) printContent += `<div style="grid-column: 1 / -1;"><span class="label">Diagnosis:</span> ${pPatientInfo.diagnosis}</div>`;
    printContent += `</div>`;

    // Chief complaint
    if (pPatientInfo.chiefComplaint) {
      printContent += `<div class="section"><div class="section-title">Chief Complaint</div><div>${pPatientInfo.chiefComplaint}`;
      if (pPatientInfo.complaintDuration) {
        printContent += ` <em>(Duration: ${pPatientInfo.complaintDuration} ${pPatientInfo.complaintDurationUnit})</em>`;
      }
      printContent += `</div></div>`;
    }

    // Allergies & Safety - only show if there's data
    if (pPatientInfo.allergies || pPatientInfo.safetyAlerts) {
      printContent += `<div class="section" style="border-left-color: #f59e0b; background: #fef3c7;">`;
      printContent += `<div class="section-title">⚠ Allergies & Safety</div>`;
      if (pPatientInfo.allergies) printContent += `<div><strong>Allergies:</strong> ${pPatientInfo.allergies}</div>`;
      if (pPatientInfo.safetyAlerts) printContent += `<div><strong>Safety Alerts:</strong> ${pPatientInfo.safetyAlerts}</div>`;
      printContent += `</div>`;
    }

    // Vitals - only if any filled
    if (pPatientInfo.bp || pPatientInfo.heartRate || pPatientInfo.temperature || pPatientInfo.respiratoryRate || pPatientInfo.spo2 || pPatientInfo.bloodGlucose) {
      printContent += `<div class="section"><div class="section-title">Vital Signs</div><div class="vitals-grid">`;
      if (pPatientInfo.bp) printContent += `<div class="vital-item"><div class="vital-label">BP</div><div>${pPatientInfo.bp} mmHg</div></div>`;
      if (pPatientInfo.heartRate) printContent += `<div class="vital-item"><div class="vital-label">Heart Rate</div><div>${pPatientInfo.heartRate} bpm</div></div>`;
      if (pPatientInfo.temperature) printContent += `<div class="vital-item"><div class="vital-label">Temp</div><div>${pPatientInfo.temperature}°F</div></div>`;
      if (pPatientInfo.respiratoryRate) printContent += `<div class="vital-item"><div class="vital-label">RR</div><div>${pPatientInfo.respiratoryRate} /min</div></div>`;
      if (pPatientInfo.spo2) printContent += `<div class="vital-item"><div class="vital-label">SpO2</div><div>${pPatientInfo.spo2}%</div></div>`;
      if (pPatientInfo.bloodGlucose) printContent += `<div class="vital-item"><div class="vital-label">Glucose</div><div>${pPatientInfo.bloodGlucose} mg/dL</div></div>`;
      printContent += `</div></div>`;
    }

    // Medications - centered on page
    if (pMedications.length > 0) {
      printContent += `<div class="medications"><div class="section-title">℞ PRESCRIPTION</div>`;
      pMedications.forEach((med, index) => {
        printContent += `<div class="med-item">`;
        printContent += `<div class="med-name">${index + 1}. ${med.name}</div>`;
        printContent += `<div class="med-details">`;
        
        // Only show dosage if it has content
        const dosageText = med.dosage ? `<strong>Dosage:</strong> ${med.dosage}` : '';
        const routeText = med.route ? `<strong>Route:</strong> ${med.route}` : '';
        
        if (dosageText || routeText) {
          const separator = dosageText && routeText ? ' | ' : '';
          printContent += `<div>${dosageText}${separator}${routeText}</div>`;
        }
        
        // Show frequency without label
        if (med.frequency) {
          printContent += `<div>${med.frequency}`;
          if (med.duration) printContent += ` | <strong>Duration:</strong> ${med.duration} ${med.durationUnit}`;
          printContent += `</div>`;
        }
        
        if (med.quantity) printContent += `<div><strong>Quantity:</strong> ${med.quantity}</div>`;
        if (med.instructions) printContent += `<div><strong>Instructions:</strong> ${med.instructions}</div>`;
        printContent += `</div></div>`;
      });
      printContent += `</div>`;
    }

    // Additional notes
    if (pAdditionalNotes) {
      printContent += `<div class="section"><div class="section-title">Additional Notes</div><div>${pAdditionalNotes}</div></div>`;
    }

    // Follow-up
    if (pFollowUpDate) {
      printContent += `<div style="margin-top: 6px;"><strong>Follow-up:</strong> ${new Date(pFollowUpDate).toLocaleDateString()}</div>`;
    }

    // Footer with doctor's signature only
    printContent += `
    <div class="footer">
      <div style="text-align: right;">
        <div style="margin-bottom: 35px;">Doctor's Signature: _______________________</div>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Patient Information
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPatientInfo(!showPatientInfo)}
                    >
                      {showPatientInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showPatientInfo ? 'Hide' : 'Add'}
                    </Button>
                    {showPatientInfo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearPatientInfo}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {showPatientInfo && (
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
              </CardContent>
              )}
            </Card>

            {/* Medications */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    Prescription Medications
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMedications(!showMedications)}
                    >
                      {showMedications ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showMedications ? 'Hide' : 'Add'}
                    </Button>
                    {showMedications && medications.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearMedications}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {showMedications && (
              <CardContent>
                <div className="mb-4">
                  <Button onClick={addMedication} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
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
                              <Label>Dosage</Label>
                              <Input
                                value={med.dosage}
                                onChange={(e) => updateMedication(med.id, "dosage", e.target.value)}
                                placeholder="e.g., 1 tablet, 5ml (optional)"
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
              )}
            </Card>

            {/* Additional Notes & Follow-up */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Additional Information
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                    >
                      {showAdditionalInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showAdditionalInfo ? 'Hide' : 'Add'}
                    </Button>
                    {showAdditionalInfo && (additionalNotes || followUpDate) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAdditionalInfo}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {showAdditionalInfo && (
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
              )}
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
                                onClick={() => setPreviewRx(rx)}
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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

        {/* Database Prescription Preview Modal - Uses exact same HTML as print */}
        {previewRx && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Prescription Preview</h2>
                <Button onClick={() => setPreviewRx(null)} variant="ghost" size="sm">
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {/* Use iframe to render the exact same HTML as print view with all styles */}
                <iframe
                  srcDoc={generatePrintHTML(
                    previewRx.patientInfo || {},
                    previewRx.medications || [],
                    previewRx.doctorProfile || {},
                    previewRx.additionalNotes || '',
                    previewRx.followUpDate || ''
                  )}
                  className="w-full border-2 border-gray-300 rounded"
                  style={{ 
                    minHeight: '800px',
                    height: '100%'
                  }}
                  title="Prescription Preview"
                />
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
                  {/* 3D Doctor Header Design */}
                  <div className="relative mb-6 rounded-xl overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600"></div>
                    
                    {/* 3D Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                      <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
                      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full"></div>
                    </div>
                    
                    {/* 3D Shadow Effect */}
                    <div className="absolute inset-0 shadow-2xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 p-6">
                      <div className="flex items-center justify-between">
                        {/* Left Side - 3D Doctor Icon */}
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {/* 3D Circular Badge */}
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
                              {/* Inner 3D Circle */}
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-inner flex items-center justify-center">
                                {/* Doctor SVG Icon */}
                                <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V4.3A.3.3 0 0 0 4.8 2.3z"/>
                                  <path d="M2 9V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3"/>
                                  <path d="M9 22h6c2.5 0 4-1.5 4-4v-3c0-2.5-1.5-4-4-4H9c-2.5 0-4 1.5-4 4v3c0 2.5 1.5 4 4 4z"/>
                                  <path d="M12 11v3"/>
                                  <path d="M12 17v.01"/>
                                  <circle cx="12" cy="7" r="3"/>
                                </svg>
                              </div>
                            </div>
                            {/* 3D Shadow beneath */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-blue-900/20 rounded-full blur-sm"></div>
                          </div>
                          
                          <div>
                            {/* Doctor Name with 3D Text Effect */}
                            {doctorProfile.name && (
                              <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-1" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
                                {doctorProfile.name}
                              </h1>
                            )}
                            {doctorProfile.specialty && (
                              <p className="text-lg text-white/95 font-semibold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.3)'}}>
                                {doctorProfile.specialty}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Right Side - 3D Medical Cross */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform">
                            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-white to-gray-100 shadow-inner flex items-center justify-center">
                              <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 2h6v6h6v6h-6v6H9v-6H3V8h6V2z"/>
                              </svg>
                            </div>
                          </div>
                          {/* 3D Shadow */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-blue-900/20 rounded-full blur-sm"></div>
                        </div>
                      </div>
                      
                      {/* Contact Info Bar */}
                      {(doctorProfile.contact || doctorProfile.clinicName || doctorProfile.clinicAddress) && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <div className="flex flex-wrap gap-4 text-sm text-white/95">
                            {doctorProfile.contact && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                </svg>
                                <span>{doctorProfile.contact}</span>
                              </div>
                            )}
                            {doctorProfile.clinicName && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span className="font-semibold">{doctorProfile.clinicName}</span>
                              </div>
                            )}
                            {doctorProfile.clinicAddress && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>{doctorProfile.clinicAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>
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
