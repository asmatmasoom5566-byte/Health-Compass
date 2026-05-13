import { useState, useRef } from "react";
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
  Eye
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
  allergies: string;
  diagnosis: string;
}

const Prescription = () => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: "",
    sex: "",
    weight: "",
    allergies: "",
    diagnosis: ""
  });

  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const prescriptionRef = useRef<HTMLDivElement>(null);

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
    window.print();
  };

  const handleCopyToClipboard = () => {
    const prescriptionText = generatePrescriptionText();
    navigator.clipboard.writeText(prescriptionText);
  };

  const generatePrescriptionText = () => {
    let text = `PRESCRIPTION\n`;
    text += `=${'='.repeat(50)}\n\n`;
    text += `Patient Name: ${patientInfo.name}\n`;
    text += `Age: ${patientInfo.age} | Sex: ${patientInfo.sex}\n`;
    text += `Weight: ${patientInfo.weight} kg\n`;
    text += `Allergies: ${patientInfo.allergies || 'None known'}\n`;
    text += `Diagnosis: ${patientInfo.diagnosis}\n\n`;
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
    const prescriptionData = {
      patientInfo,
      medications,
      additionalNotes,
      followUpDate,
      createdAt: new Date().toISOString()
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
          {/* Left Panel - Patient Info & Medications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Patient Name *</Label>
                    <Input
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label>Age *</Label>
                    <Input
                      type="number"
                      value={patientInfo.age}
                      onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                      placeholder="Years"
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
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={patientInfo.weight}
                      onChange={(e) => setPatientInfo({...patientInfo, weight: e.target.value})}
                      placeholder="kg"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Allergies</Label>
                    <Input
                      value={patientInfo.allergies}
                      onChange={(e) => setPatientInfo({...patientInfo, allergies: e.target.value})}
                      placeholder="Drug allergies (e.g., Penicillin)"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Diagnosis / Clinical Notes</Label>
                    <Textarea
                      value={patientInfo.diagnosis}
                      onChange={(e) => setPatientInfo({...patientInfo, diagnosis: e.target.value})}
                      placeholder="Primary diagnosis and relevant clinical information"
                      rows={2}
                    />
                  </div>
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
                              <Label>Medication Name *</Label>
                              <Input
                                value={med.name}
                                onChange={(e) => updateMedication(med.id, "name", e.target.value)}
                                placeholder="e.g., Paracetamol 500mg"
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
                              <Label>Dosage *</Label>
                              <Input
                                value={med.dosage}
                                onChange={(e) => updateMedication(med.id, "dosage", e.target.value)}
                                placeholder="e.g., 1 tablet, 5ml"
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
                              <Label>Frequency *</Label>
                              <Select
                                value={med.frequency}
                                onValueChange={(value) => updateMedication(med.id, "frequency", value)}
                              >
                                <SelectTrigger>
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
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">MEDICAL PRESCRIPTION</h1>
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
                      <p className="font-semibold">Age:</p>
                      <p>{patientInfo.age || '___'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Sex:</p>
                      <p>{patientInfo.sex || '_______'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Weight:</p>
                      <p>{patientInfo.weight ? `${patientInfo.weight} kg` : '_______'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Allergies:</p>
                      <p>{patientInfo.allergies || 'None known'}</p>
                    </div>
                  </div>

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
