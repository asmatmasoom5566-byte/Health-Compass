# Dual Duration Range Hierarchical System - Complete Implementation ✅

## Overview
Successfully implemented a hierarchical dual duration range system for condition matching with distinct scoring logic for Common Duration Range and Final Duration Range, including penalty system for mismatches.

## Implementation Summary

### ✅ Schema Update
**File**: `shared/schema.ts`

```typescript
// First Duration Field - Common Duration Range (always soft, +6% boost)
commonDurationCriteria: z.object({
  startDuration: z.number().min(0).optional(), // Common Start Duration
  endDuration: z.number().min(0).optional(), // Common End Duration
  unit: durationUnitSchema.optional(), // hours / days / weeks / months / years
  ruleType: ruleTypeSchema.optional() // "soft" or "hard"
}).optional(),

// Second Duration Field - Final Duration Range (with rule type, +3% or -6%)
finalDurationCriteria: z.object({
  startDuration: z.number().min(0).optional(), // Final Start Duration
  endDuration: z.number().min(0).optional(), // Final End Duration
  unit: durationUnitSchema.optional(), // hours / days / weeks / months / years
  ruleType: ruleTypeSchema.optional() // "soft" or "hard"
}).optional(),
```

**Note**: Common Duration Range keeps ruleType field for UI consistency, but always behaves as soft.

---

### ✅ Condition Matching Algorithm
**File**: `client/src/utils/condition-matching.ts`

#### Function: `matchDualDurationRange()` (Lines 357-446)

```typescript
export function matchDualDurationRange(
  condition: Cause,
  patientDuration: number,
  patientDurationUnit: DurationUnit
): {
  durationBoost: number;
  excluded: boolean;
  downRanked: boolean;
  durationRangeType: 'common' | 'final' | 'none';
}
```

**Hierarchical Logic**:

```
Step 1: Check Common Duration Range
├─ Patient duration within range?
│  ├─ YES → Return +6% boost, stop
│  └─ NO → Continue to Step 2
│
Step 2: Check Final Duration Range
├─ Patient duration within range?
│  ├─ YES → Return +3% boost, stop
│  └─ NO → Check rule type
│     ├─ Hard rule → Return excluded=true
│     └─ Soft rule → Return -6% penalty
│
Step 3: No duration rules defined
└─ Return neutral (no boost, no penalty)
```

#### Integration into Main Scoring (Lines 732-740)

```typescript
// Duration match contribution (Dual Duration Range System)
// Common Duration Range: +6% if within range
// Final Duration Range: +3% if within range, -6% if outside range (soft rule)
// Priority: Common takes precedence over Final
// Apply boost or penalty (can be positive or negative)
finalScore += dualDurationResult.durationBoost;

// Ensure score doesn't go below 0 after duration penalty
finalScore = Math.max(0, finalScore);
```

---

## Scoring System - Complete Breakdown

### Updated Scoring Formula

```
Total Score = Symptom Scores + Age Boost + Duration Boost + Sex(5%) + Prevalence(3-5%) + GenderRatio(1-10%)
```

### Duration Scoring (HIERARCHICAL SYSTEM WITH PENALTY)

| Scenario | Boost/Penalty | Notes |
|----------|---------------|-------|
| **Common Duration Range Match** | **+6%** | Highest priority, always soft |
| **Final Duration Range Match** | **+3%** | Only if Common doesn't match |
| **Final Duration Mismatch (Soft)** | **-6%** | Penalty applied, condition down-ranked but shown |
| **Final Duration Mismatch (Hard)** | **EXCLUDED** | Hidden from suggestions |
| **No Duration Rules** | **+0%** | Neutral |

### Priority Logic Examples

#### Example 1: Common Duration Range Match
```
Condition: Acute Bronchitis
- Common Duration: 3-14 days
- Final Duration: 1-30 days (soft)

Patient Duration: 7 days
✓ Within Common Duration (3-14 days)
→ +6% boost
→ Final Duration NOT checked (Common takes priority)
```

#### Example 2: Final Duration Range Match (Common doesn't match)
```
Condition: Chronic Cough
- Common Duration: 14-30 days
- Final Duration: 7-60 days (soft)

Patient Duration: 45 days
✗ Outside Common Duration (14-30 days)
✓ Within Final Duration (7-60 days)
→ +3% boost
```

#### Example 3: Final Duration Hard Exclusion
```
Condition: Viral Upper Respiratory Infection
- Common Duration: 3-7 days
- Final Duration: 1-14 days (hard)

Patient Duration: 30 days
✗ Outside Common Duration (3-7 days)
✗ Outside Final Duration (1-14 days)
✗ Hard rule
→ CONDITION EXCLUDED (hidden from suggestions)
```

#### Example 4: Final Duration Soft Mismatch with Penalty
```
Condition: Common Cold
- Common Duration: 3-7 days
- Final Duration: 1-14 days (soft)

Patient Duration: 21 days
✗ Outside Common Duration (3-7 days)
✗ Outside Final Duration (1-14 days)
✓ Soft rule
→ -6% penalty applied (decreased match likelihood)
→ Condition still shown but significantly down-ranked
```

---

## Complete Scoring Example

### Condition: Acute Gastroenteritis
```json
{
  "name": "Acute Gastroenteritis",
  "commonDurationCriteria": { "startDuration": 1, "endDuration": 7, "unit": "days" },
  "finalDurationCriteria": { "startDuration": 1, "endDuration": 14, "unit": "days", "ruleType": "soft" }
}
```

### Patient with 5-day duration:
- Pathognomonic symptoms (1): 15%
- Cardinal symptoms (2): 18%
- Supportive features (3): 9%
- **Duration match (Common 1-7 days): +6%** ← Hierarchical priority
- Sex match: 5%
- Age match (common): 6%
- Prevalence (high): 5%
- **Total: 64%**

### Patient with 10-day duration:
- Pathognomonic symptoms (1): 15%
- Cardinal symptoms (2): 18%
- Supportive features (3): 9%
- **Duration match (Final 1-14 days): +3%** ← Common didn't match, Final does
- Sex match: 5%
- Age match (common): 6%
- Prevalence (high): 5%
- **Total: 61%**

### Patient with 21-day duration:
- Pathognomonic symptoms (1): 15%
- Cardinal symptoms (2): 18%
- Supportive features (3): 9%
- **Duration match: -6%** ← Outside both ranges, soft rule PENALTY
- Sex match: 5%
- Age match (common): 6%
- Prevalence (high): 5%
- **Total: 52%** (reduced from 58% due to duration penalty)
- Condition still visible (soft rule)

### Patient with 21-day duration (with hard rule):
If Final Duration Range was set to "hard":
- **Duration match: EXCLUDED** ← Outside both ranges, hard rule
- **Condition HIDDEN from suggestions**

---

## Key Features

### 1. **Hierarchical Priority**
- Common Duration Range checked FIRST
- If Common matches → +6%, stop
- If Common doesn't match → check Final
- Only ONE duration boost/penalty applied per condition

### 2. **Different Boost/Penalty Values**
- Common: +6% (higher, typical occurrence)
- Final: +3% (lower, absolute limits)
- Final Mismatch (soft): -6% (penalty for atypical duration)

### 3. **Rule Type Behavior**
- **Common**: Always soft (ruleType field kept for UI consistency)
  - In range: +6%
  - Out of range: +0% (no penalty, just no boost)
  
- **Final**: Configurable (soft/hard)
  - In range: +3%
  - Out of range + soft: -6% (penalty applied, down-ranked)
  - Out of range + hard: EXCLUDED

### 4. **Duration Unit Conversion**
- All durations converted to days for comparison
- Supports: hours, days, weeks, months, years
- Conversion factors:
  - hours: 1/24 day
  - days: 1 day
  - weeks: 7 days
  - months: 30 days
  - years: 365 days

### 5. **Backward Compatibility**
- Legacy `durationCriteria` still supported
- New system takes precedence
- Conditions without dual duration rules work normally

---

## Data Flow

### Matching Flow
```
Patient Duration Input
  ↓
Convert to days (patientDays)
  ↓
matchDualDurationRange(condition, patientDuration, patientDurationUnit)
  ↓
Step 1: Check Common Duration Range
  ├─ Convert condition common duration to days
  ├─ In range? → YES → Return +6%
  └─ In range? → NO → Continue
  ↓
Step 2: Check Final Duration Range
  ├─ Convert condition final duration to days
  ├─ In range? → YES → Return +3%
  └─ In range? → NO → Check ruleType
     ├─ Hard → Return excluded=true
     └─ Soft → Return -6% penalty
  ↓
Step 3: No rules → Return neutral
  ↓
Apply boost/penalty to finalScore
  ↓
Ensure score >= 0 (Math.max(0, finalScore))
```

---

## Comparison: Old vs New System

### Old System (Legacy durationCriteria)
```
Single Duration Range:
- Start/End with ruleType (soft/hard)
- Match: +5%
- Mismatch + soft: +0% (down-ranked)
- Mismatch + hard: EXCLUDED
```

### New System (Dual Duration Range)
```
Common Duration Range:
- Start/End with unit (ruleType ignored, always soft)
- Match: +6% (higher priority)
- Mismatch: +0% (always soft)

Final Duration Range:
- Start/End with unit and ruleType (soft/hard)
- Match: +3% (lower priority)
- Mismatch + soft: -6% (penalty applied, down-ranked)
- Mismatch + hard: EXCLUDED

Priority: Common → Final (hierarchical)
```

---

## Testing Checklist

### ✅ Matching Algorithm
- [x] Common duration match gives +6%
- [x] Final duration match gives +3% (when Common doesn't match)
- [x] Common takes priority over Final
- [x] Only ONE duration boost/penalty applied (not both)
- [x] Final hard mismatch excludes condition
- [x] Final soft mismatch applies -6% penalty but shows condition
- [x] No duration rules = neutral (+0%)
- [x] Score never goes below 0 after penalty

### ✅ Edge Cases
- [x] Only Common defined (no Final)
- [x] Only Final defined (no Common)
- [x] Both defined, both match → Common wins
- [x] Both defined, neither match → check Final ruleType
- [x] Duration exactly at start/end boundaries
- [x] Duration outside both ranges with hard rule
- [x] Duration outside both ranges with soft rule
- [x] Different units (hours vs days vs weeks)
- [x] Unit conversion accuracy

---

## Use Cases

### 1. Typical Acute Condition
```json
{
  "name": "Acute Bronchitis",
  "commonDurationCriteria": { "startDuration": 3, "endDuration": 14, "unit": "days" },
  "finalDurationCriteria": { "startDuration": 1, "endDuration": 30, "unit": "days", "ruleType": "soft" }
}
```
- **Patient 7 days**: Common match → +6%
- **Patient 20 days**: Final match → +3%
- **Patient 45 days**: Outside both, soft → -6% penalty (shown with reduced score)

### 2. Self-Limiting Condition (Hard Limits)
```json
{
  "name": "Viral URI",
  "commonDurationCriteria": { "startDuration": 3, "endDuration": 7, "unit": "days" },
  "finalDurationCriteria": { "startDuration": 1, "endDuration": 14, "unit": "days", "ruleType": "hard" }
}
```
- **Patient 5 days**: Common match → +6%
- **Patient 10 days**: Final match → +3%
- **Patient 21 days**: Outside both, hard → EXCLUDED

### 3. Duration-Unspecific Condition
```json
{
  "name": "Hypertension"
  // No duration rules defined
}
```
- **Any duration**: +0% (neutral)

---

## Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `client/src/utils/condition-matching.ts` | ~15 | Updated matching logic and scoring |
| **Total** | **~15 lines** | **Penalty implementation** |

---

## Benefits

1. **Clinical Accuracy**: Reflects real disease duration patterns
2. **Granular Control**: Two-tier duration matching system
3. **Hierarchical Logic**: Common takes priority, Final as fallback
4. **Flexible Enforcement**: Final range can be soft or hard
5. **Better Scoring**: +6% for typical, +3% for absolute, -6% penalty for mismatch
6. **Automatic Unit Conversion**: Handles hours/days/weeks/months/years
7. **Backward Compatible**: Works with legacy data

---

## Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| Matching Function | ✅ Complete | Hierarchical logic with penalty |
| Scoring Integration | ✅ Complete | Uses dualDurationResult.durationBoost |
| Score Safeguard | ✅ Complete | Math.max(0, finalScore) prevents negative scores |
| Documentation | ✅ Complete | Comprehensive guide |

**Overall Status**: ✅ **Production Ready**

---

**Implementation Date**: April 10, 2026  
**Status**: ✅ **Complete and Production Ready**  
**Breaking Changes**: None (backward compatible)  
**Lines of Code**: ~15 lines modified for penalty implementation
