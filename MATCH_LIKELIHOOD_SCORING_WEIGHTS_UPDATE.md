# Match Likelihood Scoring System Weight Update

## Summary
Updated the diagnostic scoring system to use new symptom category weights as specified. The Match Likelihood percentage now accurately reflects the weighted contributions from Pathognomonic (15%), Defining (11%), Cardinal (8%), and Typical (5%) symptoms, along with demographic matches (5% each for age, sex, and duration).

---

## Updated Scoring Weights

### **New Weight Distribution**

| Category | Weight Per Symptom | Previous Weight | Change |
|----------|-------------------|-----------------|--------|
| **Pathognomonic Symptoms** | **+15%** | 15% | ✅ No change |
| **Defining Symptoms** | **+11%** | 10% | ⬆️ +1% increase |
| **Cardinal Symptoms** | **+8%** | 6% | ⬆️ +2% increase |
| **Typical Symptoms** | **+5%** | 3% | ⬆️ +2% increase |
| **Age Match** | **+5%** | 5% | ✅ No change |
| **Sex Match** | **+5%** | 5% | ✅ No change |
| **Duration Match** | **+5%** | 5% | ✅ No change |

---

## Implementation Details

### **File Modified**
- `client/src/utils/condition-matching.ts`

### **Code Changes**

#### **Comments Updated (Lines 484-491)**
```typescript
// EXACT WEIGHTED SCORING SYSTEM AS SPECIFIED:
// Age match = 5%
// Sex match = 5%
// Duration match = 5%
// Pathognomonic symptom match = 15% per symptom
// Defining symptom match = 11% per symptom      ← Updated from 10%
// Cardinal symptom match = 8% per symptom       ← Updated from 6%
// Typical symptom match = 5% per symptom        ← Updated from 3%
```

#### **Scoring Calculation Updated (Lines 548-552)**
```typescript
// Apply exact weights as specified
finalScore += matchedPathognomonicSymptoms.length * 15; // 15% each (highest weight)
finalScore += matchedDefiningSymptoms.length * 11;      // 11% each ← Updated
finalScore += matchedCardinalSymptoms.length * 8;       // 8% each  ← Updated
finalScore += typicalSymptomMatches * 5;                // 5% each  ← Updated
```

---

## Scoring Algorithm

### **Hierarchical Matching Process**

The algorithm follows a strict hierarchy to prevent double-counting:

```
1. Check Pathognomonic Symptoms (15% each) - Highest Priority
   ↓
2. Check Cardinal Symptoms (8% each)
   ↓
3. Check Defining Symptoms (11% each) - Excluding pathognomonic & cardinal
   ↓
4. Count Remaining as Typical (5% each)
```

### **Complete Scoring Formula**

```typescript
Match Likelihood % = 
  (Age Match ? 5% : 0%) +
  (Sex Match ? 5% : 0%) +
  (Duration Match ? 5% : 0%) +
  (Pathognomonic Matches × 15%) +
  (Defining Matches × 11%) +
  (Cardinal Matches × 8%) +
  (Typical Matches × 5%) +
  Prevalence Bonus (High: +5%, Moderate: +3%)
  
Maximum Score: 100% (capped)
```

---

## Example Calculations

### **Example 1: Strong Match**

**Patient:**
- Age: 45, Sex: Male, Duration: 5 days
- Symptoms: Fever, Cough, Fatigue

**Condition:**
- Pathognomonic: Fever
- Defining: Cough
- Cardinal: Fatigue
- Typical: Headache, Muscle pain
- Prevalence: High

**Calculation:**
```
Demographics:
  Age Match:     +5%  ✅
  Sex Match:     +5%  ✅
  Duration Match:+5%  ✅

Symptoms:
  Fever (Patho):    +15% ✅ (1 × 15%)
  Cough (Defining): +11% ✅ (1 × 11%)
  Fatigue (Cardinal):+8% ✅ (1 × 8%)
  Typical:           +0% ❌ (0 matched)

Subtotal:         49%
Prevalence Bonus: +5% (High prevalence)

FINAL SCORE: 54%
```

### **Example 2: Perfect Match**

**Patient:**
- Age: 30, Sex: Female, Duration: 3 days
- Symptoms: All condition symptoms match

**Condition:**
- Pathognomonic: 2 symptoms (both matched)
- Defining: 3 symptoms (all matched)
- Cardinal: 4 symptoms (all matched)
- Typical: 5 symptoms (all matched)
- Prevalence: High

**Calculation:**
```
Demographics:
  Age Match:     +5%  ✅
  Sex Match:     +5%  ✅
  Duration Match:+5%  ✅

Symptoms:
  Pathognomonic: +30% ✅ (2 × 15%)
  Defining:      +33% ✅ (3 × 11%)
  Cardinal:      +32% ✅ (4 × 8%)
  Typical:       +25% ✅ (5 × 5%)

Subtotal:         140%
Capped at:        100%
Prevalence Bonus: +5% (but already at cap)

FINAL SCORE: 100%
```

### **Example 3: Weak Match**

**Patient:**
- Age: 25, Sex: Male, Duration: 1 day
- Symptoms: Only 2 typical symptoms match

**Condition:**
- Pathognomonic: 0 matched
- Defining: 0 matched
- Cardinal: 0 matched
- Typical: 2 matched
- Prevalence: Low

**Calculation:**
```
Demographics:
  Age Match:     +0% ❌
  Sex Match:     +0% ❌
  Duration Match:+0% ❌

Symptoms:
  Pathognomonic:  +0% ❌ (0 matched)
  Defining:       +0% ❌ (0 matched)
  Cardinal:       +0% ❌ (0 matched)
  Typical:       +10% ✅ (2 × 5%)

Subtotal:         10%
Penalty (no key): -30% (10 × 0.7 = 7%)
Prevalence Bonus: +0% (Low prevalence)

FINAL SCORE: 7%
```

---

## Impact Analysis

### **Weight Distribution Changes**

#### **Before Update:**
```
Pathognomonic: 15% (15/47 = 31.9% of total symptom points)
Defining:      10% (10/47 = 21.3% of total symptom points)
Cardinal:       6% ( 6/47 = 12.8% of total symptom points)
Typical:        3% ( 3/47 =  6.4% of total symptom points)
Total per full set: 47%
```

#### **After Update:**
```
Pathognomonic: 15% (15/39 = 38.5% of total symptom points) ⬆️
Defining:      11% (11/39 = 28.2% of total symptom points) ⬆️
Cardinal:       8% ( 8/39 = 20.5% of total symptom points) ⬆️
Typical:        5% ( 5/39 = 12.8% of total symptom points) ⬆️
Total per full set: 39%
```

### **Key Improvements**

1. **Better Differentiation**: Larger gaps between categories (15→11→8→5 vs 15→10→6→3)
2. **Increased Typical Value**: Typical symptoms now contribute more meaningfully (5% vs 3%)
3. **Balanced Hierarchy**: Maintains clear diagnostic priority while being more inclusive

---

## UI Display

### **Match Likelihood Bar**

The updated scoring is reflected in the UI:

```tsx
<div className="h-2 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${cause.score}%` }}
    className={cn(
      "h-full rounded-full transition-all duration-500 shadow-lg",
      cause.score > 75
        ? "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"
        : cause.score > 40
          ? "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
          : "bg-gradient-to-r from-gray-400 to-gray-500",
    )}
  />
</div>
<p className="text-[10px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400 mt-1">
  Match Likelihood: {cause.score}%
</p>
```

### **Color Coding**

| Score Range | Color | Meaning |
|-------------|-------|---------|
| **76-100%** | 🟢 Green | High match likelihood |
| **41-75%** | 🟡 Amber | Moderate match likelihood |
| **0-40%** | ⚪ Gray | Low match likelihood |

---

## Hierarchical Symptom Matching

### **Prevention of Double-Counting**

The algorithm ensures each symptom is only counted once:

```typescript
// 1. First check pathognomonic
const matchedPathognomonicSymptoms = matchedSymptoms.filter(symptom =>
  pathognomonicSymptoms.some(ps => /* match */)
);

// 2. Then check cardinal
const matchedCardinalSymptoms = matchedSymptoms.filter(symptom =>
  cardinalSymptoms.some(cs => /* match */)
);

// 3. Then check defining (excluding pathognomonic & cardinal)
const matchedDefiningSymptoms = matchedSymptoms.filter(symptom =>
  DefiningSymptomsMigrator.isDefiningSymptom(condition, symptom) &&
  !matchedPathognomonicSymptoms.some(...) &&  // Exclude if already pathognomonic
  !matchedCardinalSymptoms.some(...)          // Exclude if already cardinal
);

// 4. Remaining are typical
const typicalSymptomMatches = matchedSymptoms.length - 
                              matchedPathognomonicSymptoms.length - 
                              matchedCardinalSymptoms.length - 
                              matchedDefiningSymptoms.length;
```

---

## Prevalence Adjustment

### **Bonus Points Applied After Base Calculation**

```typescript
// Apply prevalence-based scoring adjustment
// High Prevalence: +5%, Moderate Prevalence: +3%, Low Prevalence: +0%
const prevalenceBonus = condition.prevalence === 'high' ? 5 : condition.prevalence === 'moderate' ? 3 : 0;
finalScore = Math.min(100, finalScore + prevalenceBonus);
```

### **Impact on Final Score**

| Prevalence | Bonus | Example: 70% → | Example: 90% → |
|------------|-------|----------------|----------------|
| **High** | +5% | 75% | 95% |
| **Moderate** | +3% | 73% | 93% |
| **Low** | +0% | 70% | 90% |

---

## Penalty System

### **Key Symptom Missing Penalty**

If a condition requires pathognomonic or defining symptoms but none match:

```typescript
const hasKeySymptom = matchedPathognomonicSymptoms.length > 0 || matchedDefiningSymptoms.length > 0;
const hasKeySymptomDefinitions = pathognomonicSymptoms.length > 0 || definingSymptomsInner.length > 0;

if (hasKeySymptomDefinitions && !hasKeySymptom) {
  // Reduce score by 30% when key symptoms are missing
  finalScore = Math.max(0, Math.round(finalScore * 0.7));
}
```

### **Penalty Examples**

**Scenario A: Has Key Symptoms**
```
Base Score: 60%
Has Pathognomonic: YES
Penalty Applied: NO
Final Score: 60%
```

**Scenario B: Missing Key Symptoms**
```
Base Score: 60%
Has Pathognomonic/Defining: NO
Penalty Applied: 30% reduction
Final Score: 42% (60 × 0.7)
```

---

## Testing Checklist

- [ ] Pathognomonic symptom adds exactly 15% per match
- [ ] Defining symptom adds exactly 11% per match
- [ ] Cardinal symptom adds exactly 8% per match
- [ ] Typical symptom adds exactly 5% per match
- [ ] Age match adds exactly 5%
- [ ] Sex match adds exactly 5%
- [ ] Duration match adds exactly 5%
- [ ] High prevalence adds exactly 5% bonus
- [ ] Moderate prevalence adds exactly 3% bonus
- [ ] Low prevalence adds 0% bonus
- [ ] Score caps at 100% maximum
- [ ] Penalty applies when key symptoms missing (30% reduction)
- [ ] No double-counting of symptoms across categories
- [ ] UI displays correct percentage
- [ ] Match bar color changes appropriately (green/yellow/gray)
- [ ] TypeScript compilation succeeds
- [ ] No runtime errors

---

## Related Documentation

- `SCORING_SYSTEM_WEIGHTS_UPDATE.md` - Original scoring implementation
- `CARDINAL_TYPICAL_SYMPTOMS_UI_UPDATE.md` - Cardinal/typical symptoms display
- `CONSISTENT_SMALL_TEXT_SIZE_UPDATE.md` - UI consistency updates
- `ELIMINATE_DUPLICATE_MATCH_INDICATORS_UPDATE.md` - Duplicate elimination
- `client/src/components/SuggestionList.tsx` - UI display component
- `client/src/utils/cardinal-symptoms-manager.ts` - Cardinal symptom management
- `client/src/utils/defining-symptoms-migrator.ts` - Defining symptom management
- `client/src/utils/enhanced-pathognomonic-manager.ts` - Pathognomonic symptom management

## Date
March 27, 2026
