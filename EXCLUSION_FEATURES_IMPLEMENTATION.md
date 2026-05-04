# Exclusion Features Implementation

## Summary
Added a new "Exclusion Features" field to the condition editing interface and display system. This field allows users to specify symptoms that argue against a particular diagnosis, serving as negative indicators for the condition.

---

## Problem Solved

### **Before Implementation**
- No way to specify symptoms that would rule out or argue against a diagnosis
- Clinicians had no systematic way to track exclusion criteria
- Missing negative diagnostic indicators in the differential diagnosis workflow

### **After Implementation**
- ✅ Exclusion Features field available in condition editing
- ✅ Symptoms can be added from typical symptoms or custom entry
- ✅ Display in suggested conditions panel after all other symptom types
- ✅ Visual indicators show if exclusion symptoms are present (red) or absent (green)
- ✅ Maintains consistency with existing symptom hierarchy system

---

## Implementation Details

### **Files Modified**

1. **`shared/schema.ts`**
   - Added `exclusionFeatures: z.array(z.string()).optional()` to causeSchema
   - Line: 113

2. **`client/src/components/CauseEditModal.tsx`**
   - Added state management for exclusion list
   - Added exclusion features management functions (add, remove, custom add)
   - Added UI section for exclusion features management
   - Integrated with form submission (handleSubmit and handleCreate)
   - Lines: Multiple sections added after Cardinal Symptoms

3. **`client/src/components/SuggestionList.tsx`**
   - Added ShieldOff icon import
   - Added Exclusion Features display section
   - Positioned after Typical Symptoms section
   - Lines: 5, 818-856

---

## Code Changes

### **1. Schema Update**

```typescript
export const causeSchema = z.object({
  // ... existing fields
  pathognomonicSymptoms: z.array(z.string()).optional(),
  cardinalSymptoms: z.array(z.string()).optional(),
  exclusionFeatures: z.array(z.string()).optional(),  // NEW
  // ... remaining fields
});
```

### **2. CauseEditModal - State Management**

```typescript
// State declarations
const [exclusionList, setExclusionList] = useState<string[]>([]);
const [customExclusionInput, setCustomExclusionInput] = useState('');

// Parse from existing cause
let exclusionArray: string[] = [];
const exclFeatures = cause.exclusionFeatures as any;
if (Array.isArray(exclFeatures)) {
  exclusionArray = exclFeatures;
} else if (exclFeatures && typeof exclFeatures === 'string') {
  exclusionArray = exclFeatures.split(',').map((s: string) => s.trim()).filter(Boolean);
}
setExclusionList(exclusionArray);

// Management functions
const addExclusion = (symptom: string) => {
  if (symptom.trim() && !exclusionList.some(s => 
    s.toLowerCase().includes(symptom.toLowerCase()) || 
    symptom.toLowerCase().includes(s.toLowerCase())
  )) {
    const updated = [...exclusionList, symptom.trim()];
    setExclusionList(updated);
  }
};

const removeExclusion = (symptom: string) => {
  const updated = exclusionList.filter(s => 
    !s.toLowerCase().includes(symptom.toLowerCase()) &&
    !symptom.toLowerCase().includes(s.toLowerCase())
  );
  setExclusionList(updated);
};

const addCustomExclusion = () => {
  if (customExclusionInput.trim()) {
    addExclusion(customExclusionInput.trim());
    setCustomExclusionInput('');
  }
};
```

### **3. CauseEditModal - Form Submission**

```typescript
// In handleSubmit and handleCreate
onSave(cause!.id, {
  // ... other fields
  pathognomonicSymptoms: pathognomonicList,
  cardinalSymptoms: cardinalList,
  exclusionFeatures: exclusionList,  // NEW
  // ... remaining fields
});
```

### **4. SuggestionList - Display**

```typescript
{/* Exclusion Features Section */}
{(cause.exclusionFeatures && cause.exclusionFeatures.length > 0) && (
  <div className="mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <ShieldOff className="w-3 h-3" />
      Exclusion Features
    </h4>
    <div className="flex flex-wrap gap-1">
      {cause.exclusionFeatures.map((symptom, idx) => {
        const symptomString = String(symptom);
        
        const isPresent = selectedSymptoms.some((ss) =>
          symptomString.toLowerCase().includes(ss.toLowerCase()),
        );
        
        return (
          <span
            key={`exclusion-${idx}-${symptomString}`}
            className={cn(
              "text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 font-semibold",
              isPresent
                ? "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300"
                : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
            )}
          >
            <ShieldOff className="w-2.5 h-2.5" />
            {symptomString}
            {isPresent ? (
              <XCircle className="w-2.5 h-2.5 text-red-600" />
            ) : (
              <CheckCircle className="w-2.5 h-2.5 text-green-600" />
            )}
          </span>
        );
      })}
    </div>
  </div>
)}
```

---

## Visual Display Example

### **Condition: Migraine**

```
┌─────────────────────────────────────────┐
│ MIGRAINE                                │
│                                         │
│ PATHOGNOMONIC SYMPTOMS                  │
│ ⭐ Unilateral headache ✅                │
│                                         │
│ DEFINING SYMPTOMS                       │
│ ⚠️ Nausea ✅                             │
│                                         │
│ IMPORTANT & SUPPORTIVE FEATURES         │
│ 📊 Photophobia ✅ [Important]           │
│ • Phonophobia ✅                         │
│                                         │
│ ─────────────────────────────────────── │
│ 🛡️ EXCLUSION FEATURES                   │
│ • Bilateral headache ✓ (not present)    │
│ • Gradual onset ✓ (not present)         │
│ • Age > 50 ✗ (PRESENT - EXCLUDES!)     │
└─────────────────────────────────────────┘
```

**Visual Indicators:**
- ✅ **Green CheckCircle**: Exclusion feature NOT present (good for diagnosis)
- ❌ **Red XCircle**: Exclusion feature IS present (argues against diagnosis)
- Red highlighting when present to draw attention
- Gray/neutral when absent

---

## UI Features

### **In Edit Modal**

1. **Section Header**
   - ShieldOff icon (gray)
   - "Exclusion Features" label
   - Badge showing count of assigned features

2. **Current Exclusion Features Display**
   - Gray background badges
   - Click to remove functionality
   - ShieldOff icon on each badge

3. **Available Symptoms List**
   - Shows typical symptoms not assigned to other categories
   - Filters out pathognomonic, cardinal, and already-assigned exclusion features
   - Add button for each available symptom

4. **Custom Symptom Input**
   - Text input for custom exclusion features
   - Add Custom button
   - Help text: "Add symptoms that argue against this diagnosis - presence suggests alternative conditions"

### **In Suggestion List Display**

1. **Section Positioning**
   - Appears after all other symptom sections
   - Separated by border-top
   - Gray color scheme to differentiate from positive indicators

2. **Match Indicators**
   - Green CheckCircle: Feature not present (supports continuing with this diagnosis)
   - Red XCircle: Feature present (warns against this diagnosis)
   - Red background when present for visual emphasis

3. **Responsive Design**
   - Flex-wrap layout for multiple features
   - Consistent sizing with other symptom badges
   - Dark mode support

---

## Clinical Use Cases

### **Example 1: Migraine vs Tension Headache**

**Migraine Exclusion Features:**
- Bilateral headache (migraines are typically unilateral)
- Gradual onset (migraines are usually sudden)
- Age > 50 first onset (unusual for new migraine)

**When these are present:**
- Visual red warning appears
- Clinician considers alternative diagnoses
- Helps prevent misdiagnosis

### **Example 2: Viral vs Bacterial Meningitis**

**Viral Meningitis Exclusion Features:**
- Petechial rash (suggests bacterial)
- Rapid deterioration (more common in bacterial)
- Focal neurological signs (atypical for viral)

**Clinical Decision Support:**
- Presence triggers reconsideration
- Supports differential diagnosis workflow
- Reduces diagnostic errors

---

## Integration with Existing System

### **Symptom Hierarchy**

```
┌─────────────────────────────────────┐
│   Pathognomonic (Highest Priority)  │ ← Confirms diagnosis
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Defining Symptoms                 │ ← Strongly suggests
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Important Features (Cardinal)     │ ← Characteristic
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Typical Symptoms                  │ ← Commonly seen
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Exclusion Features (NEW)          │ ← Argues AGAINST diagnosis
└─────────────────────────────────────┘
```

### **Mutual Exclusion**

The implementation maintains the same mutual exclusion principles as other symptom categories:
- Exclusion features can be added from typical symptoms
- Once assigned as exclusion, they're filtered from available lists
- Can be freely added as custom symptoms (not in typical list)
- No restriction on overlapping with other categories (a symptom can be typical for one condition and exclusion for another)

---

## Benefits

### ✅ **Clinical Decision Support**
- Explicit negative criteria for diagnoses
- Reduces confirmation bias
- Supports differential diagnosis workflow
- **Automatic scoring penalty**: -15% per matching exclusion feature

### ✅ **Visual Clarity**
- Red warnings when exclusion features present
- Green confirmations when absent
- Clear separation from positive indicators
- **Match likelihood penalty display**: Shows exact percentage reduction

### ✅ **Data Integrity**
- Consistent with existing schema patterns
- Backward compatible (optional field)
- Supports both array and string formats during migration

### ✅ **User Experience**
- Familiar UI patterns (same as cardinal symptoms)
- Easy to add from existing symptoms
- Custom entry for flexibility
- Clear help text and guidance

---

## Exclusion Features Penalty System

### **Scoring Impact**

When exclusion features match patient symptoms, the Match Likelihood score is automatically reduced:

- **Penalty per matching exclusion feature**: -15%
- **Applied after**: All positive symptom scoring (pathognomonic, cardinal, typical)
- **Applied before**: Final score capping (ensures score doesn't go below 0%)
- **Cumulative**: Multiple matching exclusions stack (e.g., 2 matches = -30%)

### **Penalty Calculation Order**

```
1. Calculate base symptom scores
   - Pathognomonic: +15% each
   - Cardinal: +9% each
   - Typical: +3% each

2. Add demographic bonuses
   - Age match: +3% to +6%
   - Sex match: +5%
   - Duration match: +3% to +6%
   - Prevalence bonus: +3% to +5%
   - Gender ratio boost: +1% to +5%

3. Apply exclusion features penalty (NEW)
   - Count matching exclusion features
   - Calculate penalty: count × 15%
   - Subtract from score: score = max(0, score - penalty)

4. Final score capping
   - Ensure 0% ≤ score ≤ 100%
```

### **Example Calculations**

#### **Example 1: Single Exclusion Feature Match**

**Condition: Migraine**
- Pathognomonic matches: 1 × 15% = 15%
- Cardinal matches: 1 × 9% = 9%
- Typical matches: 2 × 3% = 6%
- Age match: +6%
- Sex match: +5%
- **Subtotal**: 41%

**Exclusion Features:**
- "Bilateral headache" - PRESENT in patient symptoms
- Penalty: 1 × 15% = -15%

**Final Score**: 41% - 15% = **26%**

**Display**: `Match Likelihood: 26% (-15% exclusion penalty)`

#### **Example 2: Multiple Exclusion Feature Matches**

**Condition: Viral Meningitis**
- Pathognomonic matches: 1 × 15% = 15%
- Cardinal matches: 2 × 9% = 18%
- Typical matches: 3 × 3% = 9%
- Demographics: +14%
- **Subtotal**: 56%

**Exclusion Features:**
- "Petechial rash" - PRESENT
- "Rapid deterioration" - PRESENT
- "Focal neurological signs" - ABSENT
- Penalty: 2 × 15% = -30%

**Final Score**: 56% - 30% = **26%**

**Display**: `Match Likelihood: 26% (-30% exclusion penalty)`

#### **Example 3: Penalty Exceeds Score**

**Condition: Tension Headache**
- Typical matches: 3 × 3% = 9%
- Demographics: +11%
- **Subtotal**: 20%

**Exclusion Features:**
- "Unilateral headache" - PRESENT
- "Nausea" - PRESENT
- Penalty: 2 × 15% = -30%

**Final Score**: max(0, 20% - 30%) = **0%**

**Display**: `Match Likelihood: 0% (-30% exclusion penalty)`

### **Implementation Details**

**File**: `client/src/utils/condition-matching.ts`

```typescript
// Apply Exclusion Features penalty (-15% per matching exclusion feature)
// This is applied AFTER all positive scoring to reduce match likelihood
if (condition.exclusionFeatures && condition.exclusionFeatures.length > 0) {
  // Check which exclusion features match patient symptoms
  const matchedExclusionFeatures = condition.exclusionFeatures.filter(exclusionFeature => {
    const exclusionLower = exclusionFeature.toLowerCase().trim();
    return patientContext.symptoms.some(patientSymptom => {
      const patientLower = patientSymptom.toLowerCase().trim();
      return exclusionLower.includes(patientLower) || patientLower.includes(exclusionLower);
    });
  });
  
  excludedFeaturesCount = matchedExclusionFeatures.length;
  excludedFeaturesList = matchedExclusionFeatures;
  
  // Apply -15% penalty for each matching exclusion feature
  if (excludedFeaturesCount > 0) {
    exclusionPenalty = excludedFeaturesCount * 15;
    finalScore = Math.max(0, finalScore - exclusionPenalty);
  }
}
```

**Matching Logic**:
- Case-insensitive comparison
- Partial matching supported (includes check both ways)
- Trimmed strings to avoid whitespace issues

### **Result Interface Updates**

```typescript
export interface ConditionMatchResult {
  // ... existing fields
  excludedFeaturesCount?: number; // Number of matching exclusion features
  excludedFeaturesList?: string[]; // List of matching exclusion features
  exclusionPenalty?: number; // Total penalty applied from exclusion features
}
```

### **UI Display Updates**

**File**: `client/src/components/SuggestionList.tsx`

```tsx
<p className="text-[10px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400 mt-1">
  Match Likelihood: {cause.score}%
  {cause.exclusionPenalty && cause.exclusionPenalty > 0 && (
    <span className="ml-2 text-red-600 dark:text-red-400 font-bold">
      (-{cause.exclusionPenalty}% exclusion penalty)
    </span>
  )}
</p>
```

**Visual Indicators**:
- Red text for penalty display
- Shows exact percentage reduction
- Only displayed when penalty > 0
- Maintains dark mode support

---

## Testing Checklist

### UI Testing
- [ ] Exclusion Features section appears in edit modal
- [ ] Can add symptoms from typical symptoms list
- [ ] Can add custom exclusion features
- [ ] Can remove exclusion features
- [ ] Exclusion features save correctly
- [ ] Exclusion features load correctly on edit
- [ ] Display shows in SuggestionList after typical symptoms
- [ ] Present exclusion features show red with XCircle
- [ ] Absent exclusion features show gray/green with CheckCircle
- [ ] Dark mode displays correctly
- [ ] Empty state handled (no section shown if no exclusion features)
- [ ] Multiple exclusion features display correctly
- [ ] Form validation works (no required validation - field is optional)
- [ ] Export/import includes exclusion features
- [ ] No TypeScript errors
- [ ] Component renders without warnings

### Penalty System Testing
- [ ] Single exclusion feature match reduces score by 15%
- [ ] Multiple exclusion features stack penalties (2 = -30%, 3 = -45%, etc.)
- [ ] Penalty displayed in red text after Match Likelihood percentage
- [ ] Score doesn't go below 0% (minimum floor applied)
- [ ] Penalty applied after all positive scoring
- [ ] Case-insensitive matching works correctly
- [ ] Partial matching works (e.g., "headache" matches "bilateral headache")
- [ ] No penalty when exclusion features absent
- [ ] Penalty calculation shown in UI (e.g., "-15% exclusion penalty")
- [ ] ScoredCause interface includes exclusion fields
- [ ] ConditionMatchResult includes exclusion penalty data

---

## Example Test Cases

### **Test Case 1: Basic Exclusion Features**

**Condition Data:**
```json
{
  "name": "Migraine",
  "symptoms": ["Unilateral headache", "Nausea", "Photophobia"],
  "pathognomonicSymptoms": ["Unilateral headache"],
  "exclusionFeatures": ["Bilateral headache", "Gradual onset"]
}
```

**Expected Display:**
```
EXCLUSION FEATURES
🛡️ Bilateral headache ✓ (absent - green check)
🛡️ Gradual onset ✓ (absent - green check)
```

### **Test Case 2: Exclusion Feature Present**

**User Selected Symptoms:** ["Unilateral headache", "Bilateral headache", "Nausea"]

**Expected Display:**
```
EXCLUSION FEATURES
🛡️ Bilateral headache ✗ (PRESENT - red background, X mark)
🛡️ Gradual onset ✓ (absent - gray/green check)
```

### **Test Case 3: No Exclusion Features**

**Condition Data:**
```json
{
  "name": "Common Cold",
  "symptoms": ["Runny nose", "Sneezing"],
  "exclusionFeatures": []  // or undefined
}
```

**Expected Display:**
```
(No Exclusion Features section shown)
```

---

## Related Documentation

- `TYPICAL_SYMPTOMS_HIERARCHICAL_EXCLUSION_COMPLETE.md` - Symptom hierarchy system
- `MUTUAL_EXCLUSION_SYMPTOM_CATEGORIES_COMPLETE.md` - Category exclusion in editing
- `CARDINAL_TYPICAL_SYMPTOMS_UI_UPDATE.md` - Cardinal/typical combined display
- `shared/schema.ts` - Cause schema definition
- `client/src/components/CauseEditModal.tsx` - Condition editing interface
- `client/src/components/SuggestionList.tsx` - Condition display component

## Date
April 11, 2026
