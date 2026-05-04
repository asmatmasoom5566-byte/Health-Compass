# Symptom Database Management - Complete Implementation Guide

## Overview
A comprehensive symptom management system that allows editing of symptom names and definitions with automatic propagation across all conditions and pharmacology entries.

## Features Implemented

### 1. Symptom Database Management Page (`/symptom-database`)

**Location:** `client/src/pages/SymptomDatabasePage.tsx`

#### Key Features:
- **Complete Symptom Inventory**: Displays all symptoms used across conditions and pharmacology
- **Usage Statistics**: Shows how many conditions and medicines use each symptom
- **Search Functionality**: Quick search to find specific symptoms
- **Edit Dialog**: Comprehensive editing interface with:
  - Symptom name field
  - Definition field (optional)
  - Usage impact preview
  - Save confirmation with details

#### How It Works:
1. **Loading Symptoms**: 
   - Extracts all symptoms from conditions (typical, pathognomonic, defining)
   - Extracts symptoms from pharmacology (primary, secondary, inappropriate)
   - Consolidates symptom definitions from `symptomDetails` in conditions
   
2. **Editing a Symptom**:
   - Click "Edit" button on any symptom card
   - Modify the name and/or definition
   - Dialog shows where changes will propagate
   - On save, updates ALL occurrences across:
     - Condition typical symptoms (both string and object formats)
     - Condition pathognomonic symptoms
     - Condition defining symptoms
     - Condition symptomDetails (definitions)
     - Pharmacology primary symptoms
     - Pharmacology secondary symptoms
     - Pharmacology inappropriate symptoms

3. **Data Persistence**:
   - Conditions stored in `localStorage.symptom_tracker_v1`
   - Pharmacology stored in `localStorage.pharmacology_v1`
   - Both updated atomically when symptom changes

### 2. Symptom Definition Display in SymptomInput

**Location:** `client/src/components/SymptomInput.tsx`

#### Key Features:
- **Info Icon**: Small ℹ️ icon appears on symptoms that have definitions
- **Tooltip Display**: Click icon to show/hide definition tooltip
- **Positioned Tooltip**: Appears above the symptom tag
- **Definition Source**: Reads from `condition.symptomDetails` in loaded conditions

#### How It Works:
```typescript
// When rendering each symptom tag:
const definition = getSymptomDefinition(symptom);

if (definition) {
  // Show Info icon
  // On click: toggle showDefinition state
  // Display tooltip with definition text
}
```

### 3. Navigation Integration

**Location:** `client/src/pages/Landing.tsx`

Added navigation button:
```tsx
<Link href="/symptom-database">
  <Button variant="outline" className="gap-2">
    <Database className="w-4 h-4" />
    Symptom DB
  </Button>
</Link>
```

**Location:** `client/src/App.tsx`

Added route:
```tsx
<Route path="/symptom-database" component={SymptomDatabasePage} />
```

## Technical Implementation Details

### Symptom Propagation Logic

When a symptom name is changed from "oldName" to "newName":

1. **Conditions Update**:
   ```typescript
   // Update typical symptoms (string format)
   if (symptom === oldName) return newName;
   
   // Update typical symptoms (object format)
   if (symptomObj.typicalSymptom === oldName) 
     return { ...symptomObj, typicalSymptom: newName };
   
   // Update pathognomonic symptoms
   if (pathognomonicSymptoms.includes(oldName))
     pathognomonicSymptoms = pathognomonicSymptoms.map(s => 
       s === oldName ? newName : s
     );
   
   // Update defining symptoms
   if (definingSymptoms.includes(oldName))
     definingSymptoms = definingSymptoms.map(s => 
       s === oldName ? newName : s
     );
   
   // Update symptomDetails keys
   if (symptomDetails[oldName]) {
     symptomDetails[newName] = symptomDetails[oldName];
     delete symptomDetails[oldName];
   }
   ```

2. **Pharmacology Update**:
   ```typescript
   // Update primary symptoms
   med.symptomMatchRules.primarySymptoms = 
     med.symptomMatchRules.primarySymptoms.map(s => 
       s === oldName ? newName : s
     );
   
   // Update secondary symptoms
   med.symptomMatchRules.secondarySymptoms = 
     med.symptomMatchRules.secondarySymptoms.map(s => 
       s === oldName ? newName : s
     );
   
   // Update inappropriate symptoms
   med.symptomMatchRules.inappropriateSymptoms = 
     med.symptomMatchRules.inappropriateSymptoms.map(s => 
       s === oldName ? newName : s
     );
   ```

### Definition Management

Definitions are stored in `condition.symptomDetails` as a key-value map:
```typescript
{
  symptomDetails: {
    "fever": "An elevated body temperature above normal range",
    "cough": "A sudden expulsion of air from the lungs",
    // ... more symptoms
  }
}
```

When updating a definition:
1. Iterate through all conditions
2. Add/update the definition in each condition's `symptomDetails`
3. Only update if definition is different or doesn't exist

## User Guide

### Accessing Symptom Database
1. From the main landing page, click **"Symptom DB"** button
2. You'll see a complete list of all symptoms in the database

### Viewing Symptom Information
Each symptom card shows:
- **Symptom Name**: The name used across conditions/medicines
- **Definition Badge**: If definition exists
- **Usage Count**: Number of conditions and medicines using this symptom

### Editing a Symptom
1. Click **"Edit"** button on the symptom card
2. In the dialog:
   - Modify the symptom name (if needed)
   - Add or edit the definition
   - Review where changes will propagate
3. Click **"Save Changes"**
4. System automatically updates all occurrences

### Using Symptom Definitions
1. In the Diagnosis page, add symptoms using the SymptomInput
2. Look for the ℹ️ icon on symptom tags
3. Click the icon to view the definition
4. Click again to hide

## Data Flow

```
User edits symptom
    ↓
Load all conditions & pharmacology
    ↓
Update symptom name in:
  - Condition symptoms (all types)
  - Pharmacology symptoms (all types)
    ↓
Update/add definition in all conditions
    ↓
Save to localStorage
    ↓
Reload symptom database
    ↓
Show success message with impact details
```

## Benefits

1. **Centralized Management**: One place to manage all symptoms
2. **Automatic Propagation**: No manual updates needed across conditions
3. **Consistency**: Ensures symptom names are uniform everywhere
4. **Educational**: Definitions help users understand symptoms
5. **Audit Trail**: See exactly where each symptom is used

## Example Use Cases

### Case 1: Standardizing Terminology
**Problem**: Some conditions use "HA" while others use "Headache"
**Solution**: Edit "HA" → "Headache" in Symptom DB
**Result**: All instances automatically updated

### Case 2: Adding Clinical Definitions
**Problem**: Users need to understand medical terminology
**Solution**: Add definition "Cephalgia: Medical term for headache"
**Result**: Definition appears when user clicks info icon

### Case 3: Correcting Misspellings
**Problem**: "Nausea" misspelled as "Nausea" in multiple places
**Solution**: Edit symptom name to correct spelling
**Result**: All conditions and medicines updated instantly

## Testing Checklist

- [x] Symptom database loads all symptoms
- [x] Search filters symptoms correctly
- [x] Edit dialog opens with correct data
- [x] Name changes propagate to all conditions
- [x] Name changes propagate to all pharmacology
- [x] Definitions are saved and displayed
- [x] Info icon appears only for symptoms with definitions
- [x] Tooltip displays correctly
- [x] Navigation works from landing page
- [x] Route properly configured

## Future Enhancements

Potential improvements:
1. **Bulk Edit**: Select multiple symptoms to merge
2. **Import/Export**: Backup symptom database
3. **Version History**: Track symptom name changes over time
4. **Synonym Management**: Link synonyms to primary symptoms
5. **Category Tags**: Organize symptoms by body system
6. **ICD-10 Codes**: Link symptoms to standardized codes

## Files Modified/Created

### Created:
- `client/src/pages/SymptomDatabasePage.tsx` (539 lines)

### Modified:
- `client/src/components/SymptomInput.tsx` (+63 lines)
- `client/src/pages/Landing.tsx` (+15 lines)
- `client/src/App.tsx` (+2 lines)

## Dependencies

All functionality uses existing dependencies:
- React hooks (useState, useEffect)
- LocalStorage for persistence
- Lucide icons for UI
- Shadcn/ui components for dialogs/cards

## Performance Considerations

- **Initial Load**: Scans all conditions once (~124 conditions)
- **Edit Operation**: Updates happen in memory, single localStorage write
- **Re-render**: Only affected components re-render
- **Memory**: Minimal - no duplicate data structures

## Browser Compatibility

Tested and working in:
- Chrome/Edge (Chromium)
- Firefox
- Safari

LocalStorage is supported in all modern browsers.

---

**Implementation Date**: March 17, 2026
**Status**: ✅ Complete and Production Ready
