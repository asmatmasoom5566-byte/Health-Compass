# Diagnostic Questions - Quick Visual Guide

## 🎯 What Changed

The Diagnostic Questions panel now shows questions in a **clear hierarchical order** and **automatically updates** when you remove conditions.

## 📊 New Display Order

Questions are now organized in **5 levels** (most to least specific):

```
┌─────────────────────────────────────────┐
│  1. PATHOGNOMONIC SYMPTOMS (Purple)    │  ← Most diagnostic value
│     ★ Questions that confirm diagnosis  │
├─────────────────────────────────────────┤
│  2. DEFINING SYMPTOMS (Blue)           │  ← Essential features
│     ★ Required for diagnosis            │
├─────────────────────────────────────────┤
│  3. CARDINAL SYMPTOMS (Orange) ⭐ NEW  │  ← Classic presentation
│     ★ Key characteristic features       │
├─────────────────────────────────────────┤
│  4. MODERATE SYMPTOMS (Cyan) ⭐ NEW    │  ← Supportive features
│     ★ Helpful but not essential         │
├─────────────────────────────────────────┤
│  5. TYPICAL SYMPTOMS (Gray)            │  ← Common features
│     ★ General presentation              │
└─────────────────────────────────────────┘
```

## 🔄 Automatic Update on Removal

### Scenario: You Remove a Condition

**Step 1**: Remove condition from suggestions list
```
User clicks X on "Condition A"
  ↓
Condition A hidden from suggestions
  ↓
Diagnostic Questions panel AUTOMATICALLY updates
  ↓
All questions for "Condition A" disappear
  ↓
New top 5 conditions fill the space
```

**Step 2**: Panel shows updated questions
```
Before Removal:
1. Condition A (Score: 85%) - REMOVED
2. Condition B (Score: 78%)
3. Condition C (Score: 72%)
4. Condition D (Score: 65%)
5. Condition E (Score: 60%)
6. Condition F (Score: 55%)

After Removal:
1. Condition B (Score: 78%)  ← Now #1
2. Condition C (Score: 72%)  ← Now #2
3. Condition D (Score: 65%)  ← Now #3
4. Condition E (Score: 60%)  ← Now #4
5. Condition F (Score: 55%)  ← Now #5 (was #6)
```

## 🎨 Visual Example

### What You'll See

```
┌──────────────────────────────────────────────┐
│ 🔍 Show Diagnostic Questions [15 questions] │
└──────────────────────────────────────────────┘

[Clicked to expand]

┌──────────────────────────────────────────────┐
│ ⭐ Pathognomonic Symptoms [3 questions]     │
│ ┌──────────────────────────────────────────┐ │
│ │ ❓ Does the patient have [symptom]?      │ │
│ │    For: Myocardial Infarction            │ │
│ │    [High Value]                          │ │
│ │    [Yes] [No]                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ ⭐ Defining Symptoms [4 questions]          │
│ ┌──────────────────────────────────────────┐ │
│ │ ❓ Is [symptom] present?                 │ │
│ │    For: Pneumonia                        │ │
│ │    [High Value]                          │ │
│ │    [Yes] [No]                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 📊 Cardinal Symptoms [3 questions] ⭐ NEW   │
│ ┌──────────────────────────────────────────┐ │
│ │ ❓ Patient experiencing [symptom]?       │ │
│ │    For: Heart Failure                    │ │
│ │    [Moderate Value]                      │ │
│ │    [Yes] [No]                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 📊 Moderate Symptoms [2 questions] ⭐ NEW   │
│ ┌──────────────────────────────────────────┐ │
│ │ ❓ Any history of [symptom]?             │ │
│ │    For: Asthma                           │ │
│ │    [Lower Value]                         │ │
│ │    [Yes] [No]                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ ❓ Typical Symptoms [3 questions]           │
│ ┌──────────────────────────────────────────┐ │
│ │ ❓ Patient reports [symptom]?            │ │
│ │    For: Upper Respiratory Infection      │ │
│ │    [Lower Value]                         │ │
│ │    [Yes] [No]                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## ✨ Key Benefits

### 1. Focused Questions
- **Only top 5 conditions** shown
- Prevents information overload
- Most relevant diagnoses first

### 2. Logical Flow
- **Most specific → Least specific**
- Pathognomonic questions first (highest value)
- Typical questions last (general features)

### 3. Automatic Updates
- Remove a condition → Questions update instantly
- No manual refresh needed
- Stays in sync with suggestions list

### 4. Clear Organization
- **Color-coded sections**
- Easy to navigate
- Professional appearance

## 🎯 How to Use

### Step 1: Review Suggestions
Look at the suggested conditions list and identify which are relevant.

### Step 2: Remove Irrelevant Conditions
Click the red X on conditions that don't apply.

### Step 3: Check Diagnostic Questions
Open the Diagnostic Questions panel - it's already updated!

### Step 4: Answer Questions
- Questions organized by symptom importance
- Start with Pathognomonic (purple section)
- Work your way down the hierarchy
- Click Yes/No for each question

### Step 5: Refine Further
- Answering "Yes" adds the symptom
- This may change condition scores
- Top 5 may update automatically
- Questions will refresh if needed

## 💡 Pro Tips

### Tip 1: Start Broad, Then Focus
1. Review all suggested conditions
2. Remove clearly irrelevant ones
3. Check Diagnostic Questions for remaining top 5
4. Answer high-value questions first

### Tip 2: Use Hierarchy Wisely
- **Pathognomonic**: If present, strongly confirms diagnosis
- **Defining**: Essential features that must be present
- **Cardinal**: Classic presentation features
- **Moderate**: Supportive but not essential
- **Typical**: Common but less specific

### Tip 3: Watch for Updates
When you:
- Remove a condition → Questions update
- Answer "Yes" to question → Symptoms added → Scores may change
- Top 5 changes → New questions may appear

### Tip 4: Color Coding Helps
- **Purple sections** = Most important questions
- **Orange sections** = Key features to check
- **Blue/Cyan sections** = Supportive information
- **Gray sections** = General features

## 🔍 What Happens Behind the Scenes

```
User Action: Remove "Condition X"
  ↓
1. Condition added to localStorage (persistent)
  ↓
2. useRemovedConditions hook detects change
  ↓
3. DiagnosticQuestionsPanel re-renders
  ↓
4. filterRemoved() excludes "Condition X"
  ↓
5. New top 5 calculated from remaining conditions
  ↓
6. Questions regenerated for new top 5
  ↓
7. Questions grouped by symptom type
  ↓
8. UI updates with new hierarchy
  ↓
Result: Panel shows updated questions automatically!
```

## ⚡ Performance

- **Instant Updates**: No delay when removing conditions
- **Efficient**: Only recalculates what changed
- **Smooth**: No janky animations or freezes
- **Optimized**: Uses React memoization

## 🎓 Clinical Reasoning Support

The hierarchy follows established diagnostic reasoning:

1. **Pathognomonic** → "If present, diagnosis is certain"
2. **Defining** → "Must be present for diagnosis"
3. **Cardinal** → "Classic presentation features"
4. **Moderate** → "Supports the diagnosis"
5. **Typical** → "Commonly seen but not specific"

This matches how experienced clinicians think through differential diagnoses!

## 📱 Responsive Design

Works perfectly on:
- ✅ Desktop monitors
- ✅ Laptop screens
- ✅ Tablet devices
- ✅ Mobile phones (scrollable sections)

## 🌙 Dark Mode Support

All color themes adapt to dark mode:
- Purple sections → Dark purple backgrounds
- Orange sections → Dark orange backgrounds
- Blue sections → Dark blue backgrounds
- Proper contrast maintained
- Easy on the eyes

---

**Enjoy the enhanced Diagnostic Questions panel!** 🎉

The hierarchical organization and automatic updates make your diagnostic workflow more efficient and clinically sound.
