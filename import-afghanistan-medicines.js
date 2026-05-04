// Script to import Afghanistan medicines dataset into the pharmacology system
const fs = require('fs');
const path = require('path');

// Load the medicine data
const medicineData = JSON.parse(fs.readFileSync(path.join(__dirname, 'afghanistan-medicines-100.json'), 'utf8'));

console.log('Loaded medicine data:');
console.log(`- Total medicines: ${medicineData.medicines.length}`);
console.log(`- Exported at: ${medicineData.exportedAt}`);
console.log(`- Version: ${medicineData.version}`);

// Display sample medicines
console.log('\nSample medicines:');
medicineData.medicines.slice(0, 5).forEach((med, index) => {
  console.log(`${index + 1}. ${med.name} (${med.drugClass})`);
  console.log(`   Uses: ${med.clinicalUses.slice(0, 3).join(', ')}`);
  console.log(`   Primary symptoms: ${med.symptomMatchRules.primarySymptoms.slice(0, 3).join(', ')}`);
  console.log('');
});

// Generate import instructions
console.log('=== IMPORT INSTRUCTIONS ===');
console.log('1. Open the Pharmacology Dashboard in your browser');
console.log('2. Click on "Medicine Database" section');
console.log('3. Click "Import Medicines" button');
console.log('4. Select the afghanistan-medicines-100.json file');
console.log('5. Choose "Replace" strategy to start fresh with Afghan medicines');
console.log('6. Click "Import" to load all 25 medicines');

console.log('\n=== DATABASE FEATURES ===');
console.log('✓ Add new medicines with complete clinical specifications');
console.log('✓ Edit existing medicines');
console.log('✓ Delete medicines from database');
console.log('✓ Search medicines by name, class, or symptoms');
console.log('✓ View all medicines in database');
console.log('✓ Export current database');
console.log('✓ Import medicines from JSON files');

console.log('\n=== CLINICAL MATCHING FEATURES ===');
console.log('✓ Age-based safety rules (min/max age, neonatal/elderly warnings)');
console.log('✓ Sex-based rules (pregnancy/breastfeeding contraindications)');
console.log('✓ Duration suitability (acute/chronic/both)');
console.log('✓ Symptom matching (primary/secondary/inappropriate symptoms)');
console.log('✓ Teaching mode with detailed explanations');
console.log('✓ Real-time patient data synchronization from Diagnosis page');

console.log('\n=== SAFETY FEATURES ===');
console.log('✓ Contraindication checking');
console.log('✓ Adverse effect warnings');
console.log('✓ Suitability scoring (0-100%)');
console.log('✓ Detailed reasoning for recommendations');
console.log('✓ Safety flags for high-risk combinations');

console.log('\nMedicine database ready for import!');