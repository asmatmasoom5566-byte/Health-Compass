# Female-to-Male Ratio - Complete Implementation ✅

## Overview
Successfully implemented the "Female-to-Male Ratio" field for all conditions in the Condition Database. This field provides gender-based percentage boosts to match likelihood when patient demographics are selected.

## Implementation Summary

### ✅ Schema Update
**File**: `shared/schema.ts` (Lines 146-150)

```typescript
// Female-to-Male Ratio for gender-based scoring adjustments
femaleToMaleRatio: z.object({
  female: z.number().min(1).max(10).optional(), // Female boost percentage (1-10%)
  male: z.number().min(1).max(10).optional() // Male boost percentage (1-10%)
}).optional(),
```

**Status**: ✅ Complete
- Validates female: 1-10 range
- Validates male: 1-10 range
- Optional field for backward compatibility

---

### ✅ UI Implementation
**File**: `client/src/components/CauseEditModal.tsx`

#### 1. FormData Interface (Lines 57-62)
```typescript
// Female-to-Male Ratio for gender-based scoring
femaleToMaleRatio: {
  female: string;
  male: string;
};
```

#### 2. Form State Initialization (Line 126)
```typescript
femaleToMaleRatio: { female: '', male: '' },
```

#### 3. Form Reset State (Line 264)
```typescript
femaleToMaleRatio: { female: '', male: '' },
```

#### 4. Load from Cause (Lines 230-234)
```typescript
femaleToMaleRatio: cause.femaleToMaleRatio ? { 
  female: cause.femaleToMaleRatio.female?.toString() ?? '', 
  male: cause.femaleToMaleRatio.male?.toString() ?? ''
} : { female: '', male: '' },
```

#### 5. Save to Cause - handleSave (Lines 324-328)
```typescript
femaleToMaleRatio: formData.femaleToMaleRatio.female !== '' || formData.femaleToMaleRatio.male !== '' ? {
  female: formData.femaleToMaleRatio.female === '' ? undefined : Number(formData.femaleToMaleRatio.female),
  male: formData.femaleToMaleRatio.male === '' ? undefined : Number(formData.femaleToMaleRatio.male)
} : undefined,
```

#### 6. Save to Cause - handleCreate (Lines 381-385)
```typescript
femaleToMaleRatio: formData.femaleToMaleRatio.female !== '' || formData.femaleToMaleRatio.male !== '' ? {
  female: formData.femaleToMaleRatio.female === '' ? undefined : Number(formData.femaleToMaleRatio.female),
  male: formData.femaleToMaleRatio.male === '' ? undefined : Number(formData.femaleToMaleRatio.male)
} : undefined,
```

#### 7. UI Components (Lines 1403-1477)
**Location**: Between Sex Rule and Duration Rule sections

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
      <Label htmlFor="edit-female-ratio">Female Boost (%)</Label>
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
      />
      <p className="text-xs text-muted-foreground">
        Boost for female patients
      </p>
    </div>

    {/* Male Field */}
    <div className="space-y-2">
      <Label htmlFor="edit-male-ratio">Male Boost (%)</Label>
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
      />
      <p className="text-xs text-muted-foreground">
        Boost for male patients
      </p>
    </div>
  </div>
</div>
```

**Status**: ✅ Complete

---

### ✅ Condition Matching Algorithm
**File**: `client/src/utils/condition-matching.ts` (Lines 576-593)

```typescript
// Apply Female-to-Male Ratio gender-based boost
// Independent of sexRule, adds percentage boost based on patient sex
if (condition.femaleToMaleRatio) {
  const { female, male } = condition.femaleToMaleRatio;
  let genderRatioBoost = 0;
  
  if (patientContext.sex === 'female' && female !== undefined) {
    genderRatioBoost = female; // Add female boost percentage (1-10%)
  } else if (patientContext.sex === 'male' && male !== undefined) {
    genderRatioBoost = male; // Add male boost percentage (1-10%)
  }
  
  if (genderRatioBoost > 0) {
    finalScore = Math.min(100, finalScore + genderRatioBoost);
  }
}
```

**Status**: ✅ Complete

---

## Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ ● Female-to-Male Ratio                                      │
│ Gender-based percentage boost to match likelihood (1-10%)  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Female Boost (%)]          [Male Boost (%)]               │
│  placeholder: 1-10%          placeholder: 1-10%            │
│  min: 1, max: 10             min: 1, max: 10               │
│  step: 1                     step: 1                       │
│  Boost for female            Boost for male                │
│  patients                    patients                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Color Theme**: Purple (matches gender-related fields)
**Layout**: 2-column responsive grid
**Validation**: Real-time input validation (1-10 range)

---

## Scoring System Integration

### Complete Scoring Breakdown

```
Total Score Calculation:
├─ Base Symptom Matching
│  ├─ Pathognomonic: 15% per symptom
│  ├─ Defining: 12% per symptom
│  ├─ Cardinal: 9% per symptom
│  ├─ Moderate: 6% per symptom
│  └─ Typical: 3% per symptom
│
├─ Demographic Matching
│  ├─ Age Match: +5%
│  ├─ Sex Match: +5%
│  └─ Duration Match: +5%
│
├─ Prevalence Adjustment
│  ├─ High: +5%
│  ├─ Moderate: +3%
│  └─ Low: +0%
│
└─ Female-to-Male Ratio (NEW)
   ├─ Female Patient: +female% (1-10%)
   └─ Male Patient: +male% (1-10%)

Maximum Score: 100% (capped)
```

### Example Scoring

**Condition: Systemic Lupus Erythematosus**
```json
{
  "name": "Systemic Lupus Erythematosus",
  "femaleToMaleRatio": {
    "female": 9,
    "male": 2
  }
}
```

**Female Patient, Age 35:**
- Pathognomonic symptoms (1): 15%
- Defining symptoms (2): 24%
- Typical symptoms (3): 9%
- Age match: 5%
- Sex match: 5%
- Duration match: 5%
- Prevalence (high): 5%
- **Gender ratio boost (female): 9%**
- **Total: 77%**

**Male Patient, Age 35:**
- Pathognomonic symptoms (1): 15%
- Defining symptoms (2): 24%
- Typical symptoms (3): 9%
- Age match: 5%
- Sex match: 5%
- Duration match: 5%
- Prevalence (high): 5%
- **Gender ratio boost (male): 2%**
- **Total: 70%**

---

## Key Features

### 1. **Independent Operation**
- Works independently of `sexRule`
- `sexRule`: Binary filter (male/female/both) - hard exclusion
- `femaleToMaleRatio`: Percentage boost (1-10%) - additive scoring
- Both can coexist and work together

### 2. **Additive Boost**
- Added to existing scoring system
- Applied after prevalence adjustment
- Capped at 100% total score
- No penalty if not defined

### 3. **Validation**
- **Frontend**: Real-time input validation (1-10 range)
- **Schema**: Zod validation (min: 1, max: 10)
- **Backend**: Type-safe with optional fields

### 4. **Backward Compatibility**
- Optional field (not required)
- Existing conditions work without it
- Empty values saved as `undefined`
- No breaking changes

### 5. **User Experience**
- Clear labeling (Female Boost / Male Boost)
- Helper text explains purpose
- Purple theme distinguishes from other fields
- Responsive layout (desktop/mobile)

---

## Data Flow

### Save Flow
```
User Input (string)
  ↓
Validation (1-10 range)
  ↓
Form State (string)
  ↓
handleSave/handleCreate
  ↓
Convert to Number
  ↓
Save as undefined if empty
  ↓
LocalStorage/Database
```

### Load Flow
```
LocalStorage/Database
  ↓
cause.femaleToMaleRatio
  ↓
Convert to String
  ↓
Form State (string)
  ↓
UI Display
```

### Scoring Flow
```
Patient Demographics (sex: 'male' | 'female')
  ↓
matchCondition()
  ↓
Check condition.femaleToMaleRatio
  ↓
Select appropriate boost (female/male)
  ↓
Add to finalScore
  ↓
Cap at 100%
  ↓
Return score
```

---

## Testing Checklist

### ✅ UI Testing
- [x] Female-to-Male Ratio section displays in edit form
- [x] Female Boost input accepts values 1-10
- [x] Male Boost input accepts values 1-10
- [x] Input validation rejects values outside 1-10
- [x] Empty values are allowed
- [x] Purple theme displays correctly
- [x] Helper text is visible
- [x] Responsive layout works

### ✅ Data Persistence
- [x] Values load from existing conditions
- [x] Values save correctly on edit
- [x] Values save correctly on create
- [x] Empty values save as undefined
- [x] Form reset clears values
- [x] Data type conversion works (string ↔ number)

### ✅ Matching Algorithm
- [x] Female patients get female boost
- [x] Male patients get male boost
- [x] Boost is additive to existing score
- [x] Score caps at 100%
- [x] Works independently of sexRule
- [x] Undefined values don't cause errors
- [x] Both fields can be set independently

### ✅ Edge Cases
- [x] Only female defined (male undefined)
- [x] Only male defined (female undefined)
- [x] Both undefined (no boost)
- [x] Both defined with same value
- [x] Both defined with different values
- [x] Maximum values (10, 10)
- [x] Minimum values (1, 1)

---

## Use Cases

### 1. Female-Predominant Conditions
**Example**: Systemic Lupus Erythematosus (9:1 female-to-male ratio)
```json
{
  "name": "Systemic Lupus Erythematosus",
  "femaleToMaleRatio": {
    "female": 9,
    "male": 2
  }
}
```

### 2. Male-Predominant Conditions
**Example**: Gout (3:1 male-to-female ratio)
```json
{
  "name": "Gout",
  "femaleToMaleRatio": {
    "female": 2,
    "male": 7
  }
}
```

### 3. Equal Prevalence
**Example**: Hypertension (equal distribution)
```json
{
  "name": "Hypertension",
  "femaleToMaleRatio": {
    "female": 5,
    "male": 5
  }
}
```

### 4. No Gender Preference
**Example**: Common Cold (no ratio defined)
```json
{
  "name": "Common Cold"
  // femaleToMaleRatio not defined
}
```

---

## Comparison with sexRule

| Feature | sexRule | femaleToMaleRatio |
|---------|---------|-------------------|
| **Purpose** | Binary filter | Percentage boost |
| **Values** | male/female/both | female: 1-10, male: 1-10 |
| **Effect** | Hard exclusion | Additive scoring |
| **Operation** | Visibility control | Score enhancement |
| **Required** | No (optional) | No (optional) |
| **Independent** | Yes | Yes |

### How They Work Together

**Example**: Rheumatoid Arthritis
```json
{
  "name": "Rheumatoid Arthritis",
  "sexRule": "both",
  "femaleToMaleRatio": {
    "female": 8,
    "male": 3
  }
}
```

**Behavior**:
- `sexRule: "both"` → Condition visible to both sexes
- `femaleToMaleRatio` → Female patients get +8%, Male patients get +3%
- Both work independently and complement each other

---

## Related Features

- **Age Rules**: `commonAgeRule`, `finalAgeRule` (similar optional fields)
- **Prevalence**: Another scoring adjustment field
- **Sex Rule**: Binary gender filter (different purpose)
- **Duration Rules**: Time-based matching

---

## Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `shared/schema.ts` | +5 | Schema definition |
| `client/src/components/CauseEditModal.tsx` | +90 | UI and form logic |
| `client/src/utils/condition-matching.ts` | +17 | Scoring algorithm |
| **Total** | **+112 lines** | **Complete implementation** |

---

## Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| Schema | ✅ Complete | Zod validation defined |
| FormData Interface | ✅ Complete | TypeScript types added |
| Form State | ✅ Complete | Initialized in 2 locations |
| Load from Cause | ✅ Complete | Data populates correctly |
| Save Logic | ✅ Complete | handleSave + handleCreate |
| UI Components | ✅ Complete | Purple-themed section |
| Input Validation | ✅ Complete | 1-10 range enforced |
| Matching Algorithm | ✅ Complete | Additive boost implemented |
| Documentation | ✅ Complete | Comprehensive guide |

**Overall Status**: ✅ **Production Ready**

---

## Next Steps (Optional)

1. **Display in Condition Cards**: Show female/male ratio in condition list views
2. **Bulk Edit Tool**: Update multiple conditions at once
3. **Migration Script**: Suggest ratios for existing conditions based on medical literature
4. **Analytics**: Track usage patterns of gender ratio boosts
5. **Export/Import**: Include in condition database exports

---

## Benefits

1. **Clinical Accuracy**: Reflects real disease prevalence differences
2. **Granular Control**: More nuanced than binary sexRule
3. **Independent Operation**: Works alongside existing features
4. **Additive Scoring**: Enhances diagnostic accuracy
5. **Flexible Configuration**: Each condition has unique ratios
6. **User-Friendly**: Clear UI with validation
7. **Backward Compatible**: No breaking changes

---

**Implementation Date**: April 7, 2026  
**Status**: ✅ **Complete and Production Ready**  
**Breaking Changes**: None  
**Backward Compatibility**: Fully compatible  
**Lines of Code**: 112 lines added across 3 files
