// Test script to verify the new condition matching logic
const { matchAllConditions, PatientMatchingContext } = require('./dist/public/assets/index-Bk8s2xiV.js');

// Define a test patient context
const patientContext = {
  age: 45,
  sex: 'male',
  duration: 3,
  durationUnit: 'days',
  symptoms: ['chest pain', 'shortness of breath', 'fatigue']
};

// Define test conditions
const testConditions = [
  {
    id: '1',
    name: 'Myocardial Infarction',
    symptoms: ['chest pain', 'shortness of breath', 'nausea'],
    sexRule: 'male',
    ageRule: { min: 30, max: 70, ruleType: 'hard' },
    durationCriteria: { startDuration: 1, endDuration: 7, unit: 'days', ruleType: 'hard' },
    safetyCritical: true
  },
  {
    id: '2',
    name: 'Anxiety Disorder',
    symptoms: ['shortness of breath', 'fatigue', 'palpitations'],
    sexRule: 'both',
    ageRule: { min: 18, max: 65, ruleType: 'soft' },
    durationCriteria: { startDuration: 1, endDuration: 30, unit: 'days', ruleType: 'soft' },
    safetyCritical: false
  },
  {
    id: '3',
    name: 'Pneumonia',
    symptoms: ['chest pain', 'shortness of breath', 'fever', 'cough'],
    sexRule: 'both',
    ageRule: { min: 10, max: 80, ruleType: 'hard' },
    durationCriteria: { startDuration: 1, endDuration: 14, unit: 'days', ruleType: 'hard' },
    safetyCritical: true
  }
];

console.log('Testing new condition matching logic...\n');

try {
  // Run the matching algorithm
  const { regular, safety } = matchAllConditions(testConditions, patientContext);

  console.log('Safety Critical Conditions:');
  console.log('==========================');
  safety.forEach((result, index) => {
    console.log(`${index + 1}. ${result.condition.name}`);
    console.log(`   Score: ${result.score}%`);
    console.log(`   Matched Symptoms: ${result.symptomScore}`);
    console.log(`   Age Match: ${result.ageMatch.matched ? 'YES' : 'NO'}`);
    console.log(`   Sex Match: ${result.sexMatch.matched ? 'YES' : 'NO'}`);
    console.log(`   Duration Match: ${result.durationMatch.matched ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log('Regular Conditions:');
  console.log('==================');
  regular.forEach((result, index) => {
    console.log(`${index + 1}. ${result.condition.name}`);
    console.log(`   Score: ${result.score}%`);
    console.log(`   Matched Symptoms: ${result.symptomScore}`);
    console.log(`   Age Match: ${result.ageMatch.matched ? 'YES' : 'NO'}`);
    console.log(`   Sex Match: ${result.sexMatch.matched ? 'YES' : 'NO'}`);
    console.log(`   Duration Match: ${result.durationMatch.matched ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log('✓ Test completed successfully!');
  console.log('\nExpected behavior:');
  console.log('- Each matched age adds 15% to score');
  console.log('- Each matched sex adds 15% to score'); 
  console.log('- Each matched duration adds 15% to score');
  console.log('- Each matched symptom adds 15% to score');
  console.log('- Safety critical conditions appear separately');
  console.log('- Conditions with higher scores appear first');
  console.log('- Scores are capped at 100%');
} catch (error) {
  console.error('✗ Test failed with error:', error.message);
}