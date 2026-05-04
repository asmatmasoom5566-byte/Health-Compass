# Intelligent Pharmacology Medicine Import System

## Overview
This system provides intelligent auto-correction for importing medicines into the pharmacology database. It handles various data formats, corrects field names, extracts symptoms, and normalizes safety rules automatically.

## Key Features

### 1. Field Name Auto-Correction
The system automatically maps different field names to the correct schema:

**Medicine Name variations:**
- `name` → Medicine Name
- `medicine` → Medicine Name  
- `drug_name` → Medicine Name
- `medicine_name` → Medicine Name

**Drug Class variations:**
- `drug_class` → Drug Class
- `class` → Drug Class
- `category` → Drug Class

**Clinical Information:**
- `uses` → Clinical Uses
- `indications` → Clinical Uses
- `side_effects` → Adverse Effects
- `contra` → Contraindications

### 2. Clinical Uses Processing
Converts text descriptions into structured format:

**Structured Format:**
```
Input: "UTI (dysuria, urgency, frequency)"
Output: ["UTI (dysuria, urgency, frequency)"]
```

**Natural Language Processing:**
```
Input: "Treats bacterial infections including UTI with dysuria and urgency"
Output: ["UTI (dysuria, urgency, frequency)"]
```

### 3. Symptom Extraction
Automatically extracts symptoms from various sources:

- Clinical uses text
- Natural language descriptions
- Condition-symptom associations
- Common medical terminology

### 4. Safety Rule Normalization
Converts various safety rule formats:

**Boolean Values:**
- `"true"`, `"yes"`, `"1"`, `"on"` → `true`
- `"false"`, `"no"`, `"0"`, `"off"` → `false`

**Safety Rules:**
- `avoid_in_pregnancy` → `avoidInPregnancy`
- `caution_in_breastfeeding` → `cautionInBreastfeeding`
- `neonatal_warning` → `avoidInNeonates`

### 5. Missing Field Handling
Gracefully handles missing optional fields:

- Sets appropriate defaults
- Provides warnings for missing critical fields
- Never fails import due to missing optional data

## Import Process Flow

1. **Field Normalization** - Map field names to standard schema
2. **Clinical Use Processing** - Convert text to structured format
3. **Symptom Extraction** - Extract symptoms from text
4. **Safety Rule Normalization** - Convert safety rules to standard format
5. **Validation** - Check for critical missing fields
6. **Summary Generation** - Create detailed import report

## Import Summary Features

The system provides comprehensive feedback:

### ✅ Corrections Made
- List of field name corrections
- Format conversions applied
- Data transformations performed

### ⚠️ Warnings
- Missing optional fields (with defaults set)
- Potential data quality issues
- Non-standard formats detected

### ❌ Errors
- Critical missing fields (prevents import)
- Invalid data structures
- Unrecoverable format issues

### 📊 Statistics
- Number of medicines successfully imported
- Number of failed imports
- Types of corrections applied

## Usage Examples

### Example 1: Field Name Variations
```json
{
  "medicine": "Paracetamol",
  "drug_class": "Analgesic", 
  "mechanism": "Blocks pain signals",
  "uses": "Fever, headache, pain"
}
```
**Result:** Successfully imported with all fields corrected

### Example 2: Clinical Uses Text
```json
{
  "name": "Amoxicillin",
  "drugClass": "Antibiotic",
  "clinicalUses": "Treats bacterial infections including UTI (dysuria, urgency, frequency)"
}
```
**Result:** Extracts structured clinical use with symptoms

### Example 3: Missing Fields
```json
{
  "name": "Ibuprofen"
}
```
**Result:** Imported with defaults for missing fields, warnings provided

### Example 4: Safety Rules
```json
{
  "name": "Warfarin",
  "avoid_in_pregnancy": "true",
  "neonatal_warning": "avoid"
}
```
**Result:** Normalizes safety rules to standard boolean format

## Integration Points

The intelligent import system integrates with:

1. **PharmacologyDataManager** - Import dialog interface
2. **ImportSummaryDialog** - Detailed feedback display
3. **usePharmacology hook** - Core import functionality
4. **Medicine matching engine** - Imported medicines work identically to manually added ones

## Validation Rules

### Critical Fields (Required)
- Medicine Name
- Drug Class (can be defaulted to "Unknown")
- Mechanism of Action (can be defaulted)

### Optional Fields (Will be defaulted)
- Clinical Uses
- Adverse Effects
- Contraindications
- Safety Rules
- Symptom Matching Rules

## Error Handling

The system follows a "fail-safe" approach:
- **Soft errors** → Apply defaults and warn
- **Hard errors** → Prevent import and explain why
- **Recoverable issues** → Auto-correct when possible
- **Irrecoverable issues** → Provide clear error messages

## Testing

The system includes comprehensive test cases covering:
- Field name variations
- Format conversions
- Missing data scenarios
- Safety rule normalization
- Natural language processing
- Edge cases and error conditions

This intelligent import system ensures that medicine data can be imported successfully regardless of the original format, while maintaining data quality and providing clear feedback about any corrections or issues encountered.