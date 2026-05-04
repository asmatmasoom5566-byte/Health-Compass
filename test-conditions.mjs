// Test the condition generator
import { generateFullConditionDatabase } from './client/src/utils/condition-migrator.ts';

const conditions = generateFullConditionDatabase();
console.log('Total conditions generated:', conditions.length);
console.log('Sample conditions:');
conditions.slice(0, 10).forEach((condition, index) => {
  console.log(`${index + 1}. ${condition.name} - Age: ${condition.ageRule.min}-${condition.ageRule.max} (${condition.ageRule.ruleType}) - Sex: ${condition.sexRule}`);
});