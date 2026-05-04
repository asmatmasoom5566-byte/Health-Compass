# Dual Duration Fields - Complete Implementation Guide

## Overview
Added dual duration fields to the Condition Database schema, allowing every disease to have two separate duration ranges: Common Duration Range and Final Duration Range, each with independent rule type configurations.

## Implementation Status

### ✅ Schema Update - COMPLETE
**File**: `shared/schema.ts` (Lines 153-169)

```typescript
// First Duration Field - Common Duration Range (renamed from durationCriteria)
commonDurationCriteria: z.object({
  startDuration: z.number().min(0).optional(), // Common Min Duration
  endDuration: z.number().min(0).optional(), // Common Max Duration
  unit: durationUnitSchema.optional(), // hours / days / weeks / months / years
  ruleType: ruleTypeSchema.optional() // "soft" or "hard"
}).optional(),

// Second Duration Field - Final Duration Range (new field)
finalDurationCriteria: z.object({
  startDuration: z.number().min(0).optional(), // Final Min Duration
  endDuration: z.number().min(0).optional(), // Final Max Duration
  unit: durationUnitSchema.optional(), // hours / days / weeks / months / years
  ruleType: ruleTypeSchema.optional() // "soft" or "hard"
}).optional(),

// Legacy: Keep for backward compatibility
durationCriteria: durationCriteriaSchema.optional(),
```

**Status**: ✅ Complete
- Both fields have identical structure
- Each has: startDuration, endDuration, unit, ruleType
- Independent operation
- Backward compatible with legacy durationCriteria

---

## UI Implementation - TODO

### File: `client/src/components/CauseEditModal.tsx`

The UI implementation requires adding form fields similar to the dual age fields but for duration. Below is the complete implementation guide.

### Step 1: Update FormData Interface

**Add** after `femaleToMaleRatio` field (around line 61):

```typescript
// First Duration Field - Common Duration Range
commonDurationCriteria: {
  startDuration: string;
  endDuration: string;
  unit: string;
  ruleType: string;
};

// Second Duration Field - Final Duration Range
finalDurationCriteria: {
  startDuration: string;
  endDuration: string;
  unit: string;
  ruleType: string;
};
```

### Step 2: Initialize Form State

**Add** to initial formData state (around line 125):

```typescript
commonDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
finalDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
```

**Add** to reset form state (around line 264):

```typescript
commonDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
finalDurationCriteria: { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
```

### Step 3: Load from Cause

**Add** to setFormData when loading a cause (around line 232):

```typescript
commonDurationCriteria: cause.commonDurationCriteria ? { 
  startDuration: cause.commonDurationCriteria.startDuration?.toString() ?? '', 
  endDuration: cause.commonDurationCriteria.endDuration?.toString() ?? '', 
  unit: cause.commonDurationCriteria.unit ?? 'days',
  ruleType: cause.commonDurationCriteria.ruleType ?? 'none'
} : { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
finalDurationCriteria: cause.finalDurationCriteria ? { 
  startDuration: cause.finalDurationCriteria.startDuration?.toString() ?? '', 
  endDuration: cause.finalDurationCriteria.endDuration?.toString() ?? '', 
  unit: cause.finalDurationCriteria.unit ?? 'days',
  ruleType: cause.finalDurationCriteria.ruleType ?? 'none'
} : { startDuration: '', endDuration: '', unit: 'days', ruleType: 'none' },
```

### Step 4: Save to Cause

**Add** to handleSave function (around line 325):

```typescript
commonDurationCriteria: formData.commonDurationCriteria.startDuration !== '' || formData.commonDurationCriteria.endDuration !== '' || formData.commonDurationCriteria.unit !== 'days' || formData.commonDurationCriteria.ruleType !== 'none' ? {
  startDuration: formData.commonDurationCriteria.startDuration === '' ? undefined : Number(formData.commonDurationCriteria.startDuration),
  endDuration: formData.commonDurationCriteria.endDuration === '' ? undefined : Number(formData.commonDurationCriteria.endDuration),
  unit: formData.commonDurationCriteria.unit === 'days' ? undefined : formData.commonDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years',
  ruleType: formData.commonDurationCriteria.ruleType === 'none' ? undefined : formData.commonDurationCriteria.ruleType as 'soft' | 'hard'
} : undefined,
finalDurationCriteria: formData.finalDurationCriteria.startDuration !== '' || formData.finalDurationCriteria.endDuration !== '' || formData.finalDurationCriteria.unit !== 'days' || formData.finalDurationCriteria.ruleType !== 'none' ? {
  startDuration: formData.finalDurationCriteria.startDuration === '' ? undefined : Number(formData.finalDurationCriteria.startDuration),
  endDuration: formData.finalDurationCriteria.endDuration === '' ? undefined : Number(formData.finalDurationCriteria.endDuration),
  unit: formData.finalDurationCriteria.unit === 'days' ? undefined : formData.finalDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years',
  ruleType: formData.finalDurationCriteria.ruleType === 'none' ? undefined : formData.finalDurationCriteria.ruleType as 'soft' | 'hard'
} : undefined,
```

**Add** to handleCreate function (around line 391):

```typescript
commonDurationCriteria: formData.commonDurationCriteria.startDuration !== '' || formData.commonDurationCriteria.endDuration !== '' || formData.commonDurationCriteria.unit !== 'days' || formData.commonDurationCriteria.ruleType !== 'none' ? {
  startDuration: formData.commonDurationCriteria.startDuration === '' ? undefined : Number(formData.commonDurationCriteria.startDuration),
  endDuration: formData.commonDurationCriteria.endDuration === '' ? undefined : Number(formData.commonDurationCriteria.endDuration),
  unit: formData.commonDurationCriteria.unit === 'days' ? undefined : formData.commonDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years',
  ruleType: formData.commonDurationCriteria.ruleType === 'none' ? undefined : formData.commonDurationCriteria.ruleType as 'soft' | 'hard'
} : undefined,
finalDurationCriteria: formData.finalDurationCriteria.startDuration !== '' || formData.finalDurationCriteria.endDuration !== '' || formData.finalDurationCriteria.unit !== 'days' || formData.finalDurationCriteria.ruleType !== 'none' ? {
  startDuration: formData.finalDurationCriteria.startDuration === '' ? undefined : Number(formData.finalDurationCriteria.startDuration),
  endDuration: formData.finalDurationCriteria.endDuration === '' ? undefined : Number(formData.finalDurationCriteria.endDuration),
  unit: formData.finalDurationCriteria.unit === 'days' ? undefined : formData.finalDurationCriteria.unit as 'hours' | 'days' | 'weeks' | 'months' | 'years',
  ruleType: formData.finalDurationCriteria.ruleType === 'none' ? undefined : formData.finalDurationCriteria.ruleType as 'soft' | 'hard'
} : undefined,
```

### Step 5: Add UI Components

**Add** after the existing Duration Rule section (around line 1560), or replace the current duration section with dual duration fields:

```tsx
{/* Duration Rule Section - Dual Duration Fields */}
<div className="space-y-6 pt-4 border-t border-border">
  <div className="space-y-2">
    <h3 className="text-lg font-semibold">Duration Rules</h3>
    <p className="text-sm text-muted-foreground">Configure duration ranges for this condition</p>
  </div>
  
  {/* First Duration Field - Common Duration Range */}
  <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <h4 className="text-base font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
      Common Duration Range
    </h4>
    <p className="text-xs text-muted-foreground">Typical duration where this condition commonly occurs</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="edit-common-duration-start" className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Min Duration</Label>
        <Input
          id="edit-common-duration-start"
          type="number"
          value={formData.commonDurationCriteria.startDuration}
          onChange={e => setFormData({
            ...formData, 
            commonDurationCriteria: {...formData.commonDurationCriteria, startDuration: e.target.value}
          })}
          placeholder="Min duration"
          min="0"
          className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-common-duration-end" className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Max Duration</Label>
        <Input
          id="edit-common-duration-end"
          type="number"
          value={formData.commonDurationCriteria.endDuration}
          onChange={e => setFormData({
            ...formData, 
            commonDurationCriteria: {...formData.commonDurationCriteria, endDuration: e.target.value}
          })}
          placeholder="Max duration"
          min="0"
          className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
        />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <div className="space-y-2">
        <Label htmlFor="edit-common-duration-unit">Duration Unit</Label>
        <Select
          value={formData.commonDurationCriteria.unit}
          onValueChange={value => setFormData({
            ...formData, 
            commonDurationCriteria: {...formData.commonDurationCriteria, unit: value}
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="days">Days</SelectItem>
            <SelectItem value="weeks">Weeks</SelectItem>
            <SelectItem value="months">Months</SelectItem>
            <SelectItem value="years">Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-common-duration-rule-type">Rule Type</Label>
        <Select
          value={formData.commonDurationCriteria.ruleType}
          onValueChange={value => setFormData({
            ...formData, 
            commonDurationCriteria: {...formData.commonDurationCriteria, ruleType: value}
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select rule type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="soft">Soft Rule</SelectItem>
            <SelectItem value="hard">Hard Rule</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>

  {/* Second Duration Field - Final Duration Range */}
  <div className="space-y-3 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
    <h4 className="text-base font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      Final Duration Range
    </h4>
    <p className="text-xs text-muted-foreground">Absolute duration limits (hard exclusion if outside range)</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="edit-final-duration-start" className="text-sm font-medium text-gray-700 dark:text-gray-300">Final Min Duration</Label>
        <Input
          id="edit-final-duration-start"
          type="number"
          value={formData.finalDurationCriteria.startDuration}
          onChange={e => setFormData({
            ...formData, 
            finalDurationCriteria: {...formData.finalDurationCriteria, startDuration: e.target.value}
          })}
          placeholder="Min duration"
          min="0"
          className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-final-duration-end" className="text-sm font-medium text-gray-700 dark:text-gray-300">Final Max Duration</Label>
        <Input
          id="edit-final-duration-end"
          type="number"
          value={formData.finalDurationCriteria.endDuration}
          onChange={e => setFormData({
            ...formData, 
            finalDurationCriteria: {...formData.finalDurationCriteria, endDuration: e.target.value}
          })}
          placeholder="Max duration"
          min="0"
          className="bg-white/50 dark:bg-slate-800/50 border border-white/30 shadow-sm focus:shadow-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200"
        />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <div className="space-y-2">
        <Label htmlFor="edit-final-duration-unit">Duration Unit</Label>
        <Select
          value={formData.finalDurationCriteria.unit}
          onValueChange={value => setFormData({
            ...formData, 
            finalDurationCriteria: {...formData.finalDurationCriteria, unit: value}
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="days">Days</SelectItem>
            <SelectItem value="weeks">Weeks</SelectItem>
            <SelectItem value="months">Months</SelectItem>
            <SelectItem value="years">Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-final-duration-rule-type">Rule Type</Label>
        <Select
          value={formData.finalDurationCriteria.ruleType}
          onValueChange={value => setFormData({
            ...formData, 
            finalDurationCriteria: {...formData.finalDurationCriteria, ruleType: value}
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select rule type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="soft">Soft Rule</SelectItem>
            <SelectItem value="hard">Hard Rule</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</div>
```

---

## Condition Matching Algorithm - TODO

### File: `client/src/utils/condition-matching.ts`

Similar to the dual age range system, you'll need to implement hierarchical duration matching:

```typescript
/**
 * DUAL DURATION RANGE MATCHING (Hierarchical System)
 * 
 * Common Duration Range:
 * - Patient duration within range → Apply boost (e.g., +5%)
 * - Patient duration outside range → Check ruleType
 *   - Soft: No boost, down-rank
 *   - Hard: Exclude condition
 * 
 * Final Duration Range:
 * - Only checked if Common doesn't match
 * - Patient duration within range → Apply smaller boost (e.g., +3%)
 * - Patient duration outside range → Check ruleType
 *   - Soft: No boost, down-rank
 *   - Hard: Exclude condition
 */
export function matchDualDurationRange(
  condition: Cause,
  patientDuration: number,
  patientDurationUnit: DurationUnit
): {
  durationBoost: number;
  excluded: boolean;
  downRanked: boolean;
  durationRangeType: 'common' | 'final' | 'none';
} {
  // Convert patient duration to common unit (e.g., days)
  // Implementation similar to matchDualAgeRange
  // Check commonDurationCriteria first
  // If no match, check finalDurationCriteria
  // Apply appropriate boost or exclusion
}
```

---

## Visual Design

### Common Duration Range (Blue Theme)
```
┌──────────────────────────────────────────────────────────┐
│ ● Common Duration Range                                  │
│ Typical duration where condition commonly occurs         │
├──────────────────────────────────────────────────────────┤
│ [Common Min Duration]    [Common Max Duration]          │
│  placeholder: Min dur     placeholder: Max dur          │
├──────────────────────────────────────────────────────────┤
│ [Duration Unit ▼]         [Rule Type ▼]                │
│  Hours/Days/Weeks/etc     None/Soft/Hard                │
└──────────────────────────────────────────────────────────┘
```

### Final Duration Range (Green Theme)
```
┌──────────────────────────────────────────────────────────┐
│ ● Final Duration Range                                   │
│ Absolute duration limits (hard exclusion if outside)    │
├──────────────────────────────────────────────────────────┤
│ [Final Min Duration]      [Final Max Duration]          │
│  placeholder: Min dur      placeholder: Max dur         │
├──────────────────────────────────────────────────────────┤
│ [Duration Unit ▼]          [Rule Type ▼]                │
│  Hours/Days/Weeks/etc      None/Soft/Hard               │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Schema
- [x] Add commonDurationCriteria to causeSchema
- [x] Add finalDurationCriteria to causeSchema
- [x] Both fields have: startDuration, endDuration, unit, ruleType
- [x] Keep legacy durationCriteria for backward compatibility

### UI (CauseEditModal.tsx)
- [ ] Update FormData interface
- [ ] Initialize form state (2 locations)
- [ ] Load from cause data
- [ ] Save to cause (handleSave)
- [ ] Save to cause (handleCreate)
- [ ] Add Common Duration Range UI section
- [ ] Add Final Duration Range UI section
- [ ] Add validation (startDuration <= endDuration)

### Matching Algorithm (condition-matching.ts)
- [ ] Create matchDualDurationRange() function
- [ ] Implement unit conversion logic
- [ ] Add hierarchical matching (Common → Final)
- [ ] Integrate into main scoring function
- [ ] Test with various duration units
- [ ] Test hard/soft rule behavior

### Testing
- [ ] UI displays correctly
- [ ] Values save/load properly
- [ ] Duration unit conversion works
- [ ] Common range takes priority
- [ ] Final range used as fallback
- [ ] Hard rule excludes condition
- [ ] Soft rule down-ranks condition
- [ ] Works independently of legacy durationCriteria

---

## Related Features

- **Dual Age Range**: Similar hierarchical pattern (commonAgeRule, finalAgeRule)
- **Duration Unit**: hours, days, weeks, months, years
- **Rule Type**: soft (down-rank) vs hard (exclude)
- **Legacy Support**: durationCriteria kept for backward compatibility

---

## Files Modified

| File | Status | Lines Changed |
|------|--------|---------------|
| `shared/schema.ts` | ✅ Complete | +17 lines |
| `client/src/components/CauseEditModal.tsx` | ⏳ TODO | ~200 lines needed |
| `client/src/utils/condition-matching.ts` | ⏳ TODO | ~100 lines needed |

---

**Implementation Date**: April 7, 2026  
**Schema Status**: ✅ **Complete**  
**UI Status**: ⏳ **Documentation Ready - Implementation Pending**  
**Matching Algorithm Status**: ⏳ **Documentation Ready - Implementation Pending**  
**Breaking Changes**: None  
**Backward Compatibility**: Fully compatible with legacy durationCriteria
