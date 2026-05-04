// Test file to verify intelligent import functionality
import { importProcessor } from '@/utils/import-processor';

// Test cases for different import scenarios
const testCases = [
  // Test 1: Field name variations
  {
    name: "Field Name Variations Test",
    data: {
      medicine: "Paracetamol",
      drug_class: "Analgesic",
      mechanism: "Blocks pain signals",
      uses: "Fever, headache, pain",
      side_effects: "Nausea, stomach upset"
    }
  },
  
  // Test 2: Clinical uses as text
  {
    name: "Clinical Uses Text Format Test",
    data: {
      name: "Amoxicillin",
      drugClass: "Antibiotic",
      mechanismOfAction: "Inhibits bacterial cell wall synthesis",
      clinicalUses: "Treats bacterial infections including UTI (dysuria, urgency, frequency) and respiratory infections (cough, fever)"
    }
  },
  
  // Test 3: Missing fields
  {
    name: "Missing Fields Test",
    data: {
      name: "Ibuprofen"
      // Missing drugClass, mechanismOfAction, etc.
    }
  },
  
  // Test 4: Safety rules in different formats
  {
    name: "Safety Rules Format Test",
    data: {
      name: "Warfarin",
      drugClass: "Anticoagulant",
      mechanismOfAction: "Vitamin K antagonist",
      avoid_in_pregnancy: "true",
      caution_in_breastfeeding: "yes",
      neonatal_warning: "avoid"
    }
  },
  
  // Test 5: Natural language clinical description
  {
    name: "Natural Language Test",
    data: {
      name: "Albuterol",
      drugClass: "Bronchodilator",
      mechanismOfAction: "Beta-2 adrenergic receptor agonist",
      clinicalUses: "Used for asthma treatment - helps with wheezing, shortness of breath, and cough"
    }
  }
];

console.log("=== INTELLIGENT IMPORT PROCESSOR TESTS ===\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log("Input:", testCase.data);
  
  const result = importProcessor.processMedicine(testCase.data);
  const summary = importProcessor.getCorrectionSummary();
  
  if (result) {
    console.log("✓ Successfully processed");
    console.log("Output:", {
      name: result.name,
      drugClass: result.drugClass,
      clinicalUses: result.clinicalUses,
      primarySymptoms: result.symptomMatchRules?.primarySymptoms
    });
  } else {
    console.log("✗ Failed to process");
  }
  
  console.log("Correction Summary:", summary);
  console.log("---\n");
});