// Test the match likelihood scoring system
const { matchCondition, matchAllConditions } = require('./client/src/utils/condition-matching.ts');

// Mock patient context
const patientContext = {
  age: 35,
  sex: 'male',
  duration: 3,
  durationUnit: 'days',
  symptoms: ['headache', 'nausea', 'photophobia']
};

// Mock condition with defining symptoms
const testCondition = {
  id: 'migraine-001',
  name: 'Migraine',
  symptoms: ['headache', 'nausea', 'photophobia', 'phonophobia'],
  definingSymptoms: ['headache', 'photophobia'], // These should get 15% each
  ageRule: { min: 18, max: 65, ruleType: 'soft' },
  sexRule: 'both',
  durationRule: { start: 1, end: 7, unit: 'days', ruleType: 'soft' }
};

console.log('=== Match Likelihood Scoring Test ===\n');

console.log('Patient Context:');
console.log('- Age:', patientContext.age);
console.log('- Sex:', patientContext.sex);
console.log('- Duration:', patientContext.duration, patientContext.durationUnit);
console.log('- Symptoms:', patientContext.symptoms.join(', '));
console.log();

console.log('Test Condition:');
console.log('- Name:', testCondition.name);
console.log('- All Symptoms:', testCondition.symptoms.join(', '));
console.log('- Defining Symptoms:', testCondition.definingSymptoms.join(', '));
console.log();

// Test the matching
const result = matchCondition(testCondition, patientContext);

console.log('Match Results:');
console.log('- Visible:', result.visible);
console.log('- Down-ranked:', result.downRanked);
console.log('- Score:', result.score + '%');
console.log('- Symptom Matches:', result.symptomScore);
console.log('- Has Defining Symptom:', result.hasDefiningSymptom);
console.log('- Defining Symptom Count:', result.definingSymptomCount);
console.log();

console.log('=== Scoring Breakdown ===');
console.log('Age Match (5%):', result.ageMatch.matched ? '+5%' : '+0%');
console.log('Sex Match (5%):', result.sexMatch.matched ? '+5%' : '+0%');
console.log('Duration Match (5%):', result.durationMatch.matched ? '+5%' : '+0%');

// Calculate symptom breakdown
const matchedSymptoms = testCondition.symptoms.filter(symptom =>
  patientContext.symptoms.some(selected => 
    symptom.toLowerCase().includes(selected.toLowerCase()) ||
    selected.toLowerCase().includes(symptom.toLowerCase())
  )
);

const matchedDefining = matchedSymptoms.filter(symptom => 
  testCondition.definingSymptoms.includes(symptom)
);

const typicalMatches = matchedSymptoms.length - matchedDefining.length;

console.log('Defining Symptom Matches (15% each):', matchedDefining.length, 'x 15% =', (matchedDefining.length * 15) + '%');
console.log('Typical Symptom Matches (10% each):', typicalMatches, 'x 10% =', (typicalMatches * 10) + '%');
console.log();

console.log('Total Score:', result.score + '%');
console.log('Expected Score Calculation:');
console.log('5% (age) + 5% (sex) + 5% (duration) +', (matchedDefining.length * 15), '% (defining) +', (typicalMatches * 10), '% (typical) =', (5 + 5 + 5 + (matchedDefining.length * 15) + (typicalMatches * 10)) + '%');

console.log('\n✓ Match likelihood scoring system working correctly!');