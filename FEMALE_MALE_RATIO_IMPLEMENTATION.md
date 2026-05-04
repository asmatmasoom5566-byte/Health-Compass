# Female-to-Male Ratio Field - Complete Implementation Guide

## Overview
Added a "Female-to-Male Ratio" field to every condition that allows gender-based percentage boosts to match likelihood when patient demographics are selected.

## Schema Update

### File: `shared/schema.ts`

**Added** after `sexRule` field (line ~144):

```typescript
// Female-to-Male Ratio for gender-based scoring adjustments
femaleToMaleRatio: z.object({
  female: z.number().min(1).max(10).optional(), // Female boost percentage (1-10%)
  male: z.number().min(1).max(10).optional() // Male boost percentage (1-10%)
}).optional(),
```

**Status**: ✅ Complete

## UI Implementation

### File: `client/src/components/CauseEditModal.tsx`

#### 1. Update FormData Interface

**Add** after `sexRule` field:

```typescript
// Female-to-Male Ratio for gender-based scoring
femaleToMaleRatio: {
  female: string;
  male: string;
};
```

**Status**: ✅ Complete

#### 2. Initialize Form State

**Add** to initial formData state:

```typescript
femaleToMaleRatio: { female: '', male: '' },
```

**Locations**:
- Initial useState (line ~125)
- Reset form in handleCancel (line ~262)

**Status**: ✅ Complete

#### 3. Load from Cause

**Add** to setFormData when loading a cause (line ~220):

```typescript
femaleToMaleRatio: cause.femaleToMaleRatio ? { 
  female: cause.femaleToMaleRatio.female?.toString() ?? '', 
  male: cause.femaleToMaleRatio.male?.toString() ?? ''
} : { female: '', male: '' },
```

**Status**: ⏳ TODO - Add this code

#### 4. Save to Cause

**Add** to handleSave function (line ~300):

```typescript
femaleToMaleRatio: formData.femaleToMaleRatio.female !== '' || formData.femaleToMaleRatio.male !== '' ? {
  female: formData.femaleToMaleRatio.female === '' ? undefined : Number(formData.femaleToMaleRatio.female),
  male: formData.femaleToMaleRatio.male === '' ? undefined : Number(formData.femaleToMaleRatio.male)
} : undefined,
```

**Status**: ⏳ TODO - Add this code

#### 5. Add UI Components

**Add** after the Sex Rule section (around line 1390):

```tsx
{/* Female-to-Male Ratio Section */}
<div className="space-y-3 p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
  <div className="space-y-1">
    <h4 className="text-base font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
      Female-to-Male Ratio
    </h4>
    <p className="text-xs text-muted-foreground">
      Gender-based percentage boost to match likelihood (1-10% each)
    </p>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {/* Female Field */}
    <div className="space-y-2">
      <Label htmlFor="edit-female-ratio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Female Boost (%)
      </Label>
      <Input
        id="edit-female-ratio"
        type="number"
        value={formData.femaleToMaleRatio.female}
        onChange={e => {
          const value = e.target.value;
          // Validate range 1-10
          if (value === '' || (Number(value) >= 1 && Number(value) <= 10)) {
            setFormData({
              ...formData, 
              femaleToMaleRatio: {...formData.femaleToMaleRatio, female: value}
            });
          }
        }}
        placeholder="1-10%"
        min="1"
        max="10"
        step="1"
        className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200"
      />
      <p className="text-xs text-muted-foreground">
        Boost for female patients
      </p>
    </div>

    {/* Male Field */}
    <div className="space-y-2">
      <Label htmlFor="edit-male-ratio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Male Boost (%)
      </Label>
      <Input
        id="edit-male-ratio"
        type="number"
        value={formData.femaleToMaleRatio.male}
        onChange={e => {
          const value = e.target.value;
          // Validate range 1-10
          if (value === '' || (Number(value) >= 1 && Number(value) <= 10)) {
            setFormData({
              ...formData, 
              femaleToMaleRatio: {...formData.femaleToMaleRatio, male: value}
            });
          }
        }}
        placeholder="1-10%"
        min="1"
        max="10"
        step="1"
        className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200"
      />
      <p className="text-xs text-muted-foreground">
        Boost for male patients
      </p>
    </div>
  </div>
</div>
```

**Status**: ⏳ TODO - Add this code

## Condition Matching Algorithm Update

### File: `client/src/utils/condition-matching.ts`

#### Find the matchSexRule function or similar scoring function

**Add** new function for gender ratio scoring:

```typescript
/**
 * Calculate gender-based percentage boost from female-to-male ratio
 */
function matchGenderRatio(
  condition: Cause, 
  patientSex: 'Male' | 'Female'
): number {
  if (!condition.femaleToMaleRatio) {
    return 0; // No boost if ratio not defined
  }

  const { female, male } = condition.femaleToMaleRatio;

  // Apply boost based on patient sex
  if (patientSex === 'Female' && female !== undefined) {
    return female; // Return female boost percentage
  }

  if (patientSex === 'Male' && male !== undefined) {
    return male; // Return male boost percentage
  }

  return 0; // No boost
}
```

#### Update the main scoring function

**Find** where the total score is calculated and **add** the gender ratio boost:

```typescript
// Existing scoring components
const baseScore = calculateBaseScore(condition, symptoms);
const ageBoost = matchAgeRule(condition.ageRule, patientContext.age);
const sexBoost = matchSexRule(condition.sexRule, patientContext.sex);
const durationBoost = matchDurationRule(condition.durationCriteria, patientContext.duration);

// NEW: Gender ratio boost
const genderRatioBoost = matchGenderRatio(condition, patientContext.sex);

// Calculate total score with gender ratio boost
const totalScore = Math.min(100, 
  baseScore + 
  ageBoost + 
  sexBoost + 
  durationBoost + 
  genderRatioBoost // Additive boost
);
```

**Status**: ⏳ TODO - Implement this logic

## Complete Implementation Steps

### Step 1: Schema ✅
- [x] Add `femaleToMaleRatio` to causeSchema
- [x] Validate female: 1-10
- [x] Validate male: 1-10

### Step 2: UI Components ⏳
- [x] Update FormData interface
- [x] Initialize form state (2 locations)
- [ ] Load from cause data
- [ ] Save to cause data
- [ ] Add UI input components
- [ ] Add validation (1-10 range)

### Step 3: Matching Algorithm ⏳
- [ ] Create `matchGenderRatio()` function
- [ ] Integrate into scoring calculation
- [ ] Test with male patients
- [ ] Test with female patients
- [ ] Verify additive behavior

### Step 4: Testing ⏳
- [ ] UI displays correctly
- [ ] Values save/load properly
- [ ] Validation works (1-10 range)
- [ ] Female patient gets female boost
- [ ] Male patient gets male boost
- [ ] Boost is additive to existing scores
- [ ] Works independently of sexRule

## Example Usage

### Condition Data
```json
{
  "id": "condition-001",
  "name": "Systemic Lupus Erythematosus",
  "femaleToMaleRatio": {
    "female": 9,
    "male": 2
  }
}
```

### Scoring Example

**Female Patient, Age 35:**
- Base symptom match: 60%
- Age match: +5%
- Sex match (both): +5%
- Duration match: +5%
- **Gender ratio boost (female): +9%**
- **Total: 84%**

**Male Patient, Age 35:**
- Base symptom match: 60%
- Age match: +5%
- Sex match (both): +5%
- Duration match: +5%
- **Gender ratio boost (male): +2%**
- **Total: 77%**

## Visual Design

```
┌──────────────────────────────────────────────────────┐
│ ● Female-to-Male Ratio                               │
│ Gender-based percentage boost (1-10% each)           │
├──────────────────────────────────────────────────────┤
│ [Female Boost (%)]    [Male Boost (%)]              │
│  placeholder: 1-10%   placeholder: 1-10%            │
│  min: 1, max: 10      min: 1, max: 10               │
│  Boost for female     Boost for male                │
│  patients             patients                      │
└──────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Patient Demographics
When patient sex is selected:
```typescript
// In condition matching
if (patientDemographics.sex === 'Female') {
  score += condition.femaleToMaleRatio?.female ?? 0;
} else if (patientDemographics.sex === 'Male') {
  score += condition.femaleToMaleRatio?.male ?? 0;
}
```

### 2. Independent of sexRule
- `sexRule`: Binary filter (male/female/both)
- `femaleToMaleRatio`: Percentage boost (additive scoring)
- Both can work together independently

### 3. Additive Scoring
```
Total Score = Base + Age(5%) + Sex(5%) + Duration(5%) + GenderRatio(1-10%) + Prevalence(3-5%)
```

## Validation Rules

### Frontend Validation
```typescript
// Input validation
if (value === '' || (Number(value) >= 1 && Number(value) <= 10)) {
  // Accept value
} else {
  // Reject value (out of range)
}
```

### Schema Validation
```typescript
female: z.number().min(1).max(10).optional()
male: z.number().min(1).max(10).optional()
```

## Benefits

1. **Granular Gender Scoring**: More nuanced than binary sexRule
2. **Independent Operation**: Works alongside existing sexRule
3. **Additive Boosts**: Enhances existing scoring system
4. **Flexible Configuration**: Each condition can have different ratios
5. **Clinical Accuracy**: Reflects real disease prevalence differences

## Related Features

- **Age Rules**: commonAgeRule, finalAgeRule (similar pattern)
- **Prevalence**: Another scoring adjustment field
- **Sex Rule**: Binary gender filter (different purpose)

---

**Implementation Date**: April 7, 2026  
**Status**: 🔄 In Progress (Schema complete, UI and matching pending)  
**Breaking Changes**: None  
**Backward Compatibility**: Fully compatible (optional field)
