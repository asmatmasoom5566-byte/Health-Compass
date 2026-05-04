# Export Fix for Synonym Matching Functions

## Issue
```
[plugin:runtime-error-plugin] The requested module '/src/utils/condition-matching.ts' 
does not provide an export named 'matchesDefiningSymptomViaSynonym'
```

## Root Cause
The functions `matchesDefiningSymptomViaSynonym` and `matchesPathognomonicSymptomViaSynonym` were defined in condition-matching.ts but were not exported, making them unavailable to other modules.

## Solution
Added `export` keyword to both function declarations.

### Files Modified
- `client/src/utils/condition-matching.ts` (Lines 114, 156)

### Changes Made

**Before**:
```typescript
function matchesDefiningSymptomViaSynonym(
  userInput: string,
  condition: Cause
): boolean { ... }

function matchesPathognomonicSymptomViaSynonym(
  userInput: string,
  condition: Cause
): boolean { ... }
```

**After**:
```typescript
export function matchesDefiningSymptomViaSynonym(
  userInput: string,
  condition: Cause
): boolean { ... }

export function matchesPathognomonicSymptomViaSynonym(
  userInput: string,
  condition: Cause
): boolean { ... }
```

## Impact
These functions are now properly exported and can be imported by other modules:

```typescript
import {
  matchesDefiningSymptomViaSynonym,
  matchesPathognomonicSymptomViaSynonym
} from '@/utils/condition-matching';
```

This enables synonym-aware matching in:
- SuggestionList component
- Any other components that need to check defining/pathognomonic symptoms via synonyms

## Status
✅ Fixed - Both functions now exported correctly
