// Test script to demonstrate the Diagnostic Ranking Engine
const { DiagnosticRankingEngine } = require('./client/src/utils/diagnostic-ranking-engine.ts');

// Mock data for testing
const mockCauses = [
  {
    id: 'migraine',
    name: 'Migraine',
    symptoms: ['headache', 'nausea', 'photophobia', 'phonophobia'],
    atypicalSymptoms: ['aura'],
    safetyCritical: false
  },
  {
    id: 'tension-headache',
    name: 'Tension Headache',
    symptoms: ['headache', 'neck pain', 'pressure'],
    atypicalSymptoms: [],
    safetyCritical: false
  },
  {
    id: 'meningitis',
    name: 'Meningitis',
    symptoms: ['headache', 'fever', 'neck stiffness', 'confusion'],
    atypicalSymptoms: ['rash'],
    safetyCritical: true
  }
];

const mockConditions = [
  { id: 'migraine', name: 'Migraine', currentScore: 75, matchedSymptoms: ['headache'] },
  { id: 'tension-headache', name: 'Tension Headache', currentScore: 60, matchedSymptoms: ['headache'] },
  { id: 'meningitis', name: 'Meningitis', currentScore: 45, matchedSymptoms: ['headache', 'fever'] }
];

const mockSelectedSymptoms = ['headache', 'fever'];

// Test the ranking engine
const engine = new DiagnosticRankingEngine({
  causes: mockCauses,
  currentConditions: mockConditions,
  selectedSymptoms: mockSelectedSymptoms
});

const questions = engine.generateRankedQuestions();

console.log('=== DIAGNOSTIC QUESTION RANKING RESULTS ===\n');

console.log('Top 5 Ranked Questions:');
questions.slice(0, 5).forEach((q, index) => {
  console.log(`${index + 1}. ${q.questionText}`);
  console.log(`   Condition: ${q.conditionName}`);
  console.log(`   Type: ${q.type}`);
  console.log(`   Priority: ${q.priority}`);
  console.log(`   Diagnostic Value Score: ${q.diagnosticValueScore}`);
  console.log(`   Predicted Impact: +${q.predictedImpact}%`);
  console.log(`   Specificity: ${q.specificity}`);
  console.log(`   Differentiation Power: ${(q.differentiationPower * 100).toFixed(1)}%`);
  console.log('---');
});

console.log('\n=== SIMULATION EXAMPLE ===');
const testQuestion = questions[0];
console.log(`Testing impact of: "${testQuestion.symptom}" for ${testQuestion.conditionName}`);

const simulation = engine.simulateSymptomAddition(testQuestion.symptom, testQuestion.conditionId);
console.log(`Score change: +${simulation.scoreChange.toFixed(1)}%`);
console.log(`New score: ${simulation.newScore.toFixed(1)}%`);
console.log(`Position change: ${simulation.positionChange > 0 ? '+' : ''}${simulation.positionChange}`);