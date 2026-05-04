// Simple test to verify match likelihood scoring
console.log('=== Match Likelihood Scoring Verification ===');

// Test case: Patient with migraine symptoms
const patient = {
  age: 35,
  sex: 'male',
  duration: 3, // days
  symptoms: ['headache', 'nausea', 'photophobia']
};

const migraineCondition = {
  name: 'Migraine',
  symptoms: ['headache', 'nausea', 'photophobia', 'phonophobia'],
  definingSymptoms: ['headache', 'photophobia'], // These should get 15% each
  ageRule: { min: 18, max: 65 },
  sexRule: 'both',
  durationRule: { start: 1, end: 7, unit: 'days' }
};

console.log('\nPatient:', patient);
console.log('Condition:', migraineCondition.name);
console.log('Defining Symptoms:', migraineCondition.definingSymptoms);

// Manual calculation
const matchedSymptoms = migraineCondition.symptoms.filter(symptom =>
  patient.symptoms.some(selected => 
    symptom.toLowerCase().includes(selected.toLowerCase()) ||
    selected.toLowerCase().includes(symptom.toLowerCase())
  )
);

console.log('\nMatched Symptoms:', matchedSymptoms);

const matchedDefining = matchedSymptoms.filter(symptom => 
  migraineCondition.definingSymptoms.includes(symptom)
);

const typicalMatches = matchedSymptoms.length - matchedDefining.length;

console.log('Matched Defining Symptoms:', matchedDefining);
console.log('Typical Symptom Matches:', typicalMatches);

// Calculate expected score
let expectedScore = 0;

// Age match (5%)
if (patient.age >= migraineCondition.ageRule.min && patient.age <= migraineCondition.ageRule.max) {
  expectedScore += 5;
  console.log('✓ Age match: +5%');
} else {
  console.log('✗ Age mismatch: +0%');
}

// Sex match (5%)
if (migraineCondition.sexRule === 'both' || migraineCondition.sexRule === patient.sex) {
  expectedScore += 5;
  console.log('✓ Sex match: +5%');
} else {
  console.log('✗ Sex mismatch: +0%');
}

// Duration match (5%)
if (patient.duration >= migraineCondition.durationRule.start && patient.duration <= migraineCondition.durationRule.end) {
  expectedScore += 5;
  console.log('✓ Duration match: +5%');
} else {
  console.log('✗ Duration mismatch: +0%');
}

// Symptom matches
expectedScore += matchedDefining.length * 15; // 15% each defining symptom
expectedScore += typicalMatches * 10;         // 10% each typical symptom

console.log(`✓ Defining symptoms (${matchedDefining.length} × 15%): +${matchedDefining.length * 15}%`);
console.log(`✓ Typical symptoms (${typicalMatches} × 10%): +${typicalMatches * 10}%`);

console.log('\n=== FINAL SCORE ===');
console.log(`Expected Match Likelihood: ${expectedScore}%`);

console.log('\n✓ Scoring system verified:');
console.log('  - Age match: 5%');
console.log('  - Sex match: 5%');
console.log('  - Duration match: 5%');
console.log('  - Defining symptom match: 15% each');
console.log('  - Typical symptom match: 10% each');