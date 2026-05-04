// Simple verification script to check condition count
const fs = require('fs');

try {
  const content = fs.readFileSync('./client/src/utils/condition-migrator.ts', 'utf8');
  
  // Count the number of condition objects by looking for id properties
  const idMatches = content.match(/id: '.*?'/g);
  console.log('Found condition IDs:', idMatches ? idMatches.length : 0);
  
  // Count the main condition array
  const arrayStart = content.indexOf('const conditions: Cause[] = [');
  const arrayEnd = content.indexOf('];', arrayStart);
  
  if (arrayStart !== -1 && arrayEnd !== -1) {
    const arrayContent = content.substring(arrayStart, arrayEnd + 2);
    console.log('Condition array defined successfully');
    
    // Count opening braces to estimate object count
    const braceMatches = arrayContent.match(/{/g);
    console.log('Opening braces (approximate object count):', braceMatches ? braceMatches.length : 0);
  }
  
} catch (error) {
  console.error('Error reading file:', error.message);
}