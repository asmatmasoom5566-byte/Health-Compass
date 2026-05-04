# How to Use Suggested Conditions in All Visits

## Quick Start Guide

### Adding Suggested Conditions to a Visit

**Step 1: Open Edit Mode**
- Click "Add Patient" or select existing patient and click "Edit Patient"

**Step 2: Add/Edit a Visit**
- Click "Add Visit" button, or edit existing visit

**Step 3: Enter Conditions**
```
┌─────────────────────────────────────────────┐
│ Suggested Conditions                        │
│ ┌─────────────────────────────────────────┐ │
│ │ [Type your conditions here]             │ │
│ └─────────────────────────────────────────┘ │
│ Separate multiple conditions with commas    │
└─────────────────────────────────────────────┘
```

**Example Input:**
```
Major Depressive Disorder, Generalized Anxiety Disorder, PTSD
```

**Step 4: Save**
- Click "Save Patient Record"
- Conditions are now tracked for that visit

---

## What You'll See

### In Edit Mode

```
Visit 1 - First Visit
┌──────────────────────────────────────────┐
│ Date: [2024-01-15]                       │
│ Treatment Response: [Not evaluated yet▼] │
│                                          │
│ Complaints:                              │
│ [Patient's complaints...]                │
│                                          │
│ Treatment:                               │
│ [Treatment details...]                   │
│                                          │
│ Initially Suggested Conditions:          │ ← Dynamic label!
│ [Depression, Anxiety]                    │
│ Separate multiple conditions with commas │
└──────────────────────────────────────────┘
```

### In View Mode (With Conditions)

```
Visit 1 - January 15, 2024
[Best response ✓]

Complaints:
Anhedonia, depression

Treatment:
Fluoxetine 10mg daily

Initially Suggested Conditions:
┌────────────────────────┐ ┌────────────────────┐
│ Major Depressive       │ │ Generalized        │
│ Disorder               │ │ Anxiety Disorder   │
└────────────────────────┘ └────────────────────┘
```

### In View Mode (Without Conditions)

```
Visit 1 - January 15, 2024
[Best response ✓]

Complaints:
Anhedonia, depression

Treatment:
Fluoxetine 10mg daily

[No suggested conditions section shown]
```

---

## Copy History Output

### When Conditions Are Present

```
Age: 25
Sex: Male

FIRST VISIT - 2024-01-15
Complaints: anhedonia, depression
Treatment: fluoxetine 10mg daily
Response: Not evaluated yet
Initially Suggested Conditions: Major Depressive Disorder, Generalized Anxiety Disorder

SECOND VISIT - 2024-01-29
Complaints: slight improvement
Treatment: increase fluoxetine to 20mg
Response: Moderate response
Now Suggested Conditions: Major Depressive Disorder
```

### When No Conditions

```
Age: 25
Sex: Male

FIRST VISIT - 2024-01-15
Complaints: anhedonia, depression
Treatment: fluoxetine 10mg daily
Response: Not evaluated yet
```

---

## Tips & Best Practices

### ✅ DO:

1. **Be Specific**
   ```
   ✓ "Major Depressive Disorder, Single Episode, Moderate"
   ✗ "Depression"
   ```

2. **Use Standard Terminology**
   ```
   ✓ "Generalized Anxiety Disorder"
   ✗ "Anxiety issues"
   ```

3. **Track Changes Over Time**
   ```
   Visit 1: "Bipolar Disorder vs MDD"
   Visit 2: "Major Depressive Disorder"
   Visit 3: "MDD (in remission)"
   ```

4. **Include Comorbidities**
   ```
   "Hypertension, Type 2 Diabetes, Hyperlipidemia, Obesity"
   ```

5. **Note Severity/Status**
   ```
   "PTSD (severe)", "Mild Cognitive Impairment", "Controlled Hypertension"
   ```

### ❌ DON'T:

1. Don't use abbreviations without context
2. Don't include patient identifiers
3. Don't mix symptoms with diagnoses
4. Don't use informal terms

---

## Common Scenarios

### Scenario 1: Initial Diagnosis Unclear

**Visit 1:**
```
Enter: "Depression vs Adjustment Disorder vs Bipolar Disorder"
System stores: ['Depression', 'Adjustment Disorder', 'Bipolar Disorder']
Label shows: "Initially Suggested Conditions"
```

**Visit 2:**
```
Enter: "Major Depressive Disorder"
System stores: ['Major Depressive Disorder']
Label shows: "Now Suggested Conditions"
```

---

### Scenario 2: Multiple Chronic Conditions

**Every Visit:**
```
Enter: "Hypertension, Type 2 Diabetes, Hyperlipidemia"
Shows all active chronic conditions
Updates each visit to track status
```

---

### Scenario 3: Acute Condition Resolution

**Visit 1 (Acute):**
```
Enter: "Streptococcal Pharyngitis"
```

**Visit 2 (Resolved):**
```
Leave empty or remove condition
System omits section from copy output
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Move to next field | Tab |
| Move to previous field | Shift+Tab |
| Submit form | Ctrl+S / Cmd+S |
| Cancel editing | Escape |
| Add line break | Shift+Enter |

---

## Data Format

### Input Format (What You Type)
```
Condition 1, Condition 2, Condition 3
```

### Stored Format (In Database)
```javascript
['Condition 1', 'Condition 2', 'Condition 3']
```

### Display Format (On Screen)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Condition 1 │ │ Condition 2 │ │ Condition 3 │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Copy Format (In Clipboard)
```
Suggested Conditions: Condition 1, Condition 2, Condition 3
```

---

## Troubleshooting

### Issue: Can't see the field

**Solution:** Make sure you're in Edit mode
- Click "Edit Patient" or "Add Patient"
- Field appears after "Treatment" textarea

---

### Issue: Conditions not saving

**Solution:** Check format
- Use commas to separate conditions
- Avoid trailing spaces
- Click "Save Patient Record"

---

### Issue: Too many badges showing

**Solution:** This is normal - they wrap automatically
- Badges will flow to multiple lines if needed
- Scroll down to see all conditions
- Consider being more concise

---

### Issue: Can't read long condition names

**Solution:** Badges wrap text
- Hover over badge to see full name (tooltip)
- Consider using standard abbreviations
- Keep names concise when entering

---

## Privacy Reminder

⚠️ **IMPORTANT:** Always de-identify before sharing

✅ Safe to copy:
```
Major Depressive Disorder, Generalized Anxiety Disorder
```

❌ Never include:
```
John Doe's Depression (patient ID: 12345)
```

The system automatically removes identifiers, but always double-check!

---

## Summary

**To add suggested conditions:**
1. Go to Edit mode
2. Find "Suggested Conditions" field
3. Type conditions separated by commas
4. Save patient record

**To view conditions:**
- Look for badge section in view mode
- Only appears when conditions exist
- Shows with appropriate heading

**To copy conditions:**
- Use "Copy History" button
- Automatically included when present
- Omitted when empty

**Remember:**
- First visit = "Initially Suggested Conditions"
- Follow-up visits = "Now Suggested Conditions"
- Only shows when data exists
- Helps track diagnostic reasoning

---

**Questions?** Refer to `SUGGESTED_CONDITIONS_UI_COMPLETE.md` for detailed documentation.
