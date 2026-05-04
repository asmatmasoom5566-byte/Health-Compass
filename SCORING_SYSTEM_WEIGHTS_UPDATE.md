# Scoring System Update - Exact Weights Implementation

## Summary
The diagnostic scoring system has been updated to use the exact specified weights for calculating match likelihood percentages.

## Updated Weight Distribution

### Demographic Matching (15% total)
- **Age Match**: +5% contribution to match likelihood
- **Sex Match**: +5% contribution to match likelihood  
- **Duration Match**: +5% contribution to match likelihood

### Symptom Matching (Up to 85%+ total)
- **Pathognomonic Symptom**: +15% per symptom (highest weight)
- **Defining Symptom**: +10% per symptom
- **Cardinal Symptom**: +6% per symptom
- **Typical Symptom**: +3% per symptom

## Implementation Details

### File Modified
- `client/src/utils/condition-matching.ts`

### Key Changes

1. **Added Cardinal Symptoms Support**
   - Imported `CardinalSymptomsManager` utility
   - Added cardinal symptom matching logic
   - Integrated cardinal symptoms into scoring calculation

2. **Updated Symptom Weight Distribution**
   - Reduced typical symptom weight from 5% to 3%
   - Added cardinal symptom weight at 6%
   - Maintained pathognomonic (15%) and defining (10%) weights

3. **Enhanced Matching Logic**
   - Pathognomonic symptoms are checked first (highest priority)
   - Cardinal symptoms are checked second
   - Defining symptoms are checked third (excluding overlaps with pathognomonic and cardinal)
   - Typical symptoms include all remaining matched symptoms

4. **Prevention of Double Counting**
   - Symptoms are categorized hierarchically
   - Each symptom is only counted once in the highest applicable category
   - Matching order: Pathognomonic → Cardinal → Defining → Typical

### Scoring Calculation Example

For a patient with:
- Age match: ✅ +5%
- Sex match: ✅ +5%
- Duration match: ✅ +5%
- 2 Pathognomonic symptoms: 2 × 15% = +30%
- 3 Defining symptoms: 3 × 10% = +30%
- 2 Cardinal symptoms: 2 × 6% = +12%
- 5 Typical symptoms: 5 × 3% = +15%

**Total Score**: 5 + 5 + 5 + 30 + 30 + 12 + 15 = **102%** → Capped at **100%**

### Additional Features

- **Key Symptom Penalty**: If a condition has defined pathognomonic or defining symptoms but none are matched, the score is reduced by 30%
- **Prevalence Bonus**: 
  - High prevalence conditions: +5%
  - Moderate prevalence conditions: +3%
  - Low prevalence conditions: +0%
- **Score Cap**: Final score is capped at 100%

## Testing Recommendations

Test the scoring system with various patient scenarios to verify:
1. Demographic matches contribute exactly 5% each
2. Pathognomonic symptoms contribute 15% each
3. Defining symptoms contribute 10% each
4. Cardinal symptoms contribute 6% each
5. Typical symptoms contribute 3% each
6. No double counting occurs for overlapping symptoms
7. Key symptom penalty applies correctly
8. Prevalence bonus applies correctly
9. Final score caps at 100%

## Files Changed
- `client/src/utils/condition-matching.ts` - Updated scoring calculation logic

## Date
March 27, 2026
