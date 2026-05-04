# Pharmacology Intelligence System - Afghanistan Medicine Database

## Overview
This system provides a comprehensive pharmacology intelligence platform with clinical matching capabilities, specifically designed for healthcare professionals in Afghanistan. The system includes a complete medicine database with 25 commonly used medicines, each with detailed clinical specifications and safety rules.

## Key Features

### 🏥 Medicine Database Management
- **Add New Medicines**: Complete form with all clinical specifications
- **Edit Existing Medicines**: Modify any field including safety rules
- **Delete Medicines**: Remove medicines from database
- **View All Medicines**: Browse complete medicine catalog
- **Search & Filter**: Find medicines by name, class, or symptoms
- **Import/Export**: JSON-based data management

### 🧠 Clinical Matching Engine
- **Age-based Rules**: Min/max age limits, neonatal/elderly warnings
- **Sex-based Rules**: Pregnancy/breastfeeding contraindications
- **Duration Suitability**: Acute/chronic/both treatment duration
- **Symptom Matching**: Primary/secondary/inappropriate symptoms
- **Safety Evaluation**: Contraindication checking and adverse effect warnings
- **Suitability Scoring**: 0-100% match scores with detailed reasoning

### 📚 Teaching Mode
- **Detailed Explanations**: Why each medicine is recommended
- **Mechanism of Action**: Clinical pharmacology education
- **Safety Rationale**: Reasoning behind contraindications
- **Clinical Context**: Real-world application guidance

### 🔗 Integration Features
- **Real-time Data Sync**: Automatic patient data synchronization from Diagnosis page
- **Display-only Interface**: No duplicate input fields on Pharmacology page
- **Single Source of Truth**: Patient demographics managed on Diagnosis page only

## Afghanistan Medicine Database (25 Medicines)

### Analgesics & Antipyretics
1. **Paracetamol** - Analgesic/Antipyretic
2. **Ibuprofen** - NSAID
3. **Aspirin** - NSAID/Antiplatelet

### Antibiotics
4. **Amoxicillin** - Penicillin Antibiotic
5. **Azithromycin** - Macrolide Antibiotic
6. **Ciprofloxacin** - Fluoroquinolone Antibiotic

### Cardiovascular
7. **Metformin** - Biguanide Antidiabetic
8. **Atorvastatin** - Statin (HMG-CoA Reductase Inhibitor)
9. **Amlodipine** - Calcium Channel Blocker
10. **Lisinopril** - ACE Inhibitor
11. **Losartan** - Angiotensin II Receptor Blocker
12. **Carvedilol** - Beta Blocker
13. **Spironolactone** - Potassium-Sparing Diuretic
14. **Furosemide** - Loop Diuretic
15. **Nitroglycerin** - Nitrate

### Respiratory
16. **Salbutamol** - Short-acting Beta-2 Agonist
17. **Albuterol** - Short-acting Beta-2 Agonist

### Endocrine
18. **Levothyroxine** - Thyroid Hormone Replacement
19. **Insulin Glargine** - Long-acting Insulin Analog

### Gastrointestinal
20. **Omeprazole** - Proton Pump Inhibitor

### Anticoagulants
21. **Warfarin** - Vitamin K Antagonist

### CNS
22. **Diazepam** - Benzodiazepine
23. **Prednisolone** - Corticosteroid

## Database Structure

Each medicine includes:
- **Basic Information**: Name, drug class, mechanism of action
- **Clinical Uses**: Primary therapeutic applications
- **Adverse Effects**: Common and serious side effects
- **Contraindications**: Absolute and relative contraindications
- **Age Rules**: 
  - Minimum/maximum age limits
  - Neonatal avoidance rules
  - Elderly caution guidelines
  - Rule type (soft warning/hard contraindication)
- **Sex Rules**:
  - Pregnancy contraindications
  - Breastfeeding cautions
  - Sex-specific risks
- **Duration Rules**: Acute/chronic/both suitability
- **Symptom Matching Rules**:
  - Primary symptoms (required for matching)
  - Secondary symptoms (supporting match)
  - Inappropriate symptoms (contraindicated)
- **Teaching Notes**: Educational explanations

## How to Use

### 1. Import Afghanistan Medicine Database
1. Navigate to the Pharmacology Dashboard
2. Go to the "Medicine Database" section
3. Click "Import Medicines" button
4. Select `afghanistan-medicines-100.json` file
5. Choose "Replace" strategy to load Afghan medicines
6. Click "Import" to populate the database

### 2. Add New Medicine
1. Click "Add Medicine" in the database section
2. Fill in all required fields:
   - Medicine name and drug class
   - Mechanism of action
   - Clinical uses (at least one required)
   - Safety rules (age, sex, duration)
   - Symptom matching rules (primary symptoms required)
3. Click "Add Medicine" to save

### 3. Edit Medicine
1. Find medicine in database list
2. Click "Edit" button
3. Modify any fields as needed
4. Click "Update Medicine" to save changes

### 4. Get Medicine Recommendations
1. Complete patient information on Diagnosis page:
   - Age, sex, duration of symptoms
   - Select relevant symptoms
2. Navigate to Pharmacology Dashboard
3. View personalized medicine recommendations
4. Toggle "Teaching Mode" for detailed explanations

## Safety Features

### Clinical Matching Logic
- **Age Appropriateness**: Checks min/max age limits and special population warnings
- **Sex Safety**: Evaluates pregnancy/breastfeeding contraindications
- **Duration Suitability**: Matches treatment duration to condition type
- **Symptom Relevance**: Matches primary symptoms and considers secondary symptoms
- **Contraindication Screening**: Identifies absolute and relative contraindications
- **Adverse Effect Risk**: Warns about common and serious side effects

### Suitability Scoring
- **80-100%**: Excellent match with minimal safety concerns
- **60-79%**: Good match with some considerations
- **0-59%**: Poor match or significant safety concerns

### Warning System
- **Safety Flags**: Red alerts for high-risk combinations
- **Warnings**: Yellow alerts for cautionary considerations
- **Detailed Reasoning**: Step-by-step explanation of recommendations

## Technical Implementation

### Storage
- **Local Storage**: Persistent medicine database using localStorage
- **JSON Format**: Import/export functionality with validation
- **Real-time Sync**: Automatic data synchronization between pages

### Architecture
- **React Hooks**: Custom `usePharmacology` hook for state management
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Component-based**: Modular UI with reusable components
- **Real-time Updates**: Storage event listeners for cross-tab synchronization

### Clinical Logic
- **Rule-based Matching**: Configurable safety rules for each medicine
- **Multi-factor Evaluation**: Age, sex, duration, and symptom matching
- **Scoring Algorithm**: Weighted suitability calculation
- **Teaching Mode**: Contextual educational content

## File Structure

```
client/src/
├── hooks/
│   └── use-pharmacology.ts          # Medicine database management
├── components/
│   ├── MedicineEditModal.tsx        # Add/edit medicine interface
│   └── PharmacologyDataManager.tsx  # Database management UI
├── pages/
│   └── PharmacologyDashboard.tsx    # Main pharmacology interface
├── utils/
│   └── medicine-matcher.ts          # Clinical matching engine
└── shared/
    └── schema.ts                    # Data schemas and types

afghanistan-medicines-100.json       # Afghanistan medicine dataset
```

## Import/Export Format

```json
{
  "medicines": [
    {
      "id": "unique_identifier",
      "name": "Medicine Name",
      "drugClass": "Drug Class",
      "mechanismOfAction": "Detailed mechanism",
      "clinicalUses": ["Use 1", "Use 2"],
      "adverseEffects": ["Effect 1", "Effect 2"],
      "contraindications": ["Contra 1", "Contra 2"],
      "ageRules": {
        "min": 18,
        "max": 150,
        "avoidInNeonates": true,
        "avoidInElderly": false,
        "ruleType": "soft"
      },
      "sexRules": {
        "avoidInPregnancy": true,
        "cautionInBreastfeeding": true,
        "sexSpecificRisks": ["Risk 1"]
      },
      "durationRules": "both",
      "symptomMatchRules": {
        "primarySymptoms": ["symptom1", "symptom2"],
        "secondarySymptoms": ["symptom3"],
        "inappropriateSymptoms": ["symptom4"]
      },
      "teachingNotes": "Educational explanation"
    }
  ],
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "version": "1.0"
}
```

## Best Practices

### For Healthcare Providers
- Always verify recommendations against clinical guidelines
- Use Teaching Mode for patient education
- Consider local availability and cost factors
- Document rationale for medicine selection
- Monitor for adverse effects and adjust accordingly

### For Database Management
- Regular backup of medicine database
- Validate new medicines before clinical use
- Keep teaching notes updated with current evidence
- Review safety rules periodically
- Maintain consistency in symptom terminology

## Future Enhancements

- Drug interaction checking
- Dosing calculator integration
- Local formulary integration
- Treatment guideline references
- Multilingual support (Dari/Pashto)
- Mobile-responsive design
- Offline functionality
- Clinical decision support integration

## Support

For questions or issues with the Pharmacology Intelligence System, please contact the development team or refer to the clinical documentation.