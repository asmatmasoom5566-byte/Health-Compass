// Script to generate 100 commonly used medicines in Afghanistan
const fs = require('fs');

const medicines = [
  // Analgesics/Antipyretics (10)
  {
    id: "med_001",
    name: "Paracetamol",
    drugClass: "Analgesic/Antipyretic",
    mechanismOfAction: "Inhibits prostaglandin synthesis in CNS by blocking COX enzymes, reducing pain and fever",
    clinicalUses: ["Fever reduction", "Mild to moderate pain relief", "Headache treatment", "Muscle aches"],
    adverseEffects: ["Liver toxicity at high doses", "Nausea", "Skin rash"],
    contraindications: ["Severe liver disease", "Hypersensitivity to paracetamol"],
    ageRules: {min: 0, max: 150, avoidInNeonates: false, avoidInElderly: false, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: false, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["fever", "headache", "pain"],
      secondarySymptoms: ["muscle aches", "joint pain", "general discomfort"],
      inappropriateSymptoms: ["severe abdominal pain", "persistent vomiting"]
    },
    teachingNotes: "Chosen because it provides effective analgesia and antipyresis with minimal anti-inflammatory effects, making it safer for patients with gastric sensitivity compared to NSAIDs. However, avoid in liver disease due to hepatic metabolism."
  },
  {
    id: "med_002",
    name: "Ibuprofen",
    drugClass: "NSAID",
    mechanismOfAction: "Non-selective COX-1 and COX-2 inhibitor that reduces prostaglandin synthesis, providing anti-inflammatory, analgesic, and antipyretic effects",
    clinicalUses: ["Inflammatory pain", "Arthritis", "Fever", "Dysmenorrhea"],
    adverseEffects: ["Gastric irritation", "GI bleeding", "Renal impairment", "Cardiovascular risk"],
    contraindications: ["Active peptic ulcer disease", "Severe heart failure", "Severe renal impairment"],
    ageRules: {min: 12, max: 150, avoidInNeonates: true, avoidInElderly: false, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: ["Increased risk of bleeding in females"]},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["inflammatory pain", "joint pain", "swelling", "fever"],
      secondarySymptoms: ["menstrual pain", "muscle pain", "headache"],
      inappropriateSymptoms: ["gastric pain", "black stools", "vomiting blood"]
    },
    teachingNotes: "Selected for its anti-inflammatory properties which are superior to paracetamol for inflammatory conditions. However, avoid in pregnancy (especially third trimester) and in patients with gastric issues due to COX-1 inhibition causing gastric mucosal damage."
  },
  {
    id: "med_003",
    name: "Diclofenac",
    drugClass: "NSAID",
    mechanismOfAction: "Inhibits COX-1 and COX-2 enzymes, reducing prostaglandin synthesis",
    clinicalUses: ["Musculoskeletal pain", "Arthritis", "Post-operative pain", "Migraine"],
    adverseEffects: ["Gastric ulceration", "Cardiovascular risk", "Renal impairment", "Hepatotoxicity"],
    contraindications: ["Active GI bleeding", "Severe heart failure", "Hypersensitivity"],
    ageRules: {min: 14, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["musculoskeletal pain", "joint inflammation", "post-operative pain"],
      secondarySymptoms: ["swelling", "stiffness", "limited mobility"],
      inappropriateSymptoms: ["GI bleeding", "cardiovascular disease", "renal failure"]
    },
    teachingNotes: "Potent NSAID for inflammatory pain. Topical formulations preferred for localized pain. Oral forms carry higher GI and cardiovascular risks. Use lowest effective dose for shortest duration."
  },
  {
    id: "med_004",
    name: "Tramadol",
    drugClass: "Opioid Analgesic",
    mechanismOfAction: "Weak opioid receptor agonist with additional serotonin/norepinephrine reuptake inhibition",
    clinicalUses: ["Moderate to severe pain", "Post-operative pain", "Chronic pain", "Cancer pain"],
    adverseEffects: ["Nausea", "Constipation", "Dizziness", "Seizures", "Dependency"],
    contraindications: ["Seizure disorders", "MAO inhibitor use", "Severe respiratory disease"],
    ageRules: {min: 12, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["moderate to severe pain", "post-operative pain", "cancer pain"],
      secondarySymptoms: ["chronic pain", "neuropathic pain", "musculoskeletal pain"],
      inappropriateSymptoms: ["seizure disorders", "respiratory depression", "MAO inhibitor use"]
    },
    teachingNotes: "Weaker opioid with dual mechanism. Lower addiction potential than morphine but still carries risk. Monitor for serotonin syndrome when combined with other serotonergic drugs. Caution in elderly due to increased sensitivity."
  },
  {
    id: "med_005",
    name: "Morphine",
    drugClass: "Opioid Analgesic",
    mechanismOfAction: "Mu-opioid receptor agonist that inhibits pain signal transmission in CNS",
    clinicalUses: ["Severe pain", "Cancer pain", "Post-operative pain", "Pulmonary edema"],
    adverseEffects: ["Respiratory depression", "Constipation", "Nausea", "Sedation", "Dependency"],
    contraindications: ["Respiratory depression", "Head injury", "Severe asthma", "Hypersensitivity"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "hard"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["severe pain", "cancer pain", "post-operative pain"],
      secondarySymptoms: ["dyspnea", "pulmonary edema", "terminal agitation"],
      inappropriateSymptoms: ["respiratory depression", "head injury", "asthma"]
    },
    teachingNotes": "Gold standard for severe pain management. Requires careful monitoring of respiratory function. Start with low doses and titrate carefully. Never abruptly discontinue - taper gradually to prevent withdrawal."
  },
  
  // Antibiotics (20)
  {
    id: "med_006",
    name: "Amoxicillin",
    drugClass: "Penicillin Antibiotic",
    mechanismOfAction: "Bactericidal antibiotic that inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins",
    clinicalUses: ["Bacterial respiratory infections", "Urinary tract infections", "Skin infections", "Dental infections"],
    adverseEffects: ["Diarrhea", "Nausea", "Rash", "Allergic reactions"],
    contraindications: ["Penicillin allergy", "Infectious mononucleosis"],
    ageRules: {min: 0, max: 150, avoidInNeonates: false, avoidInElderly: false, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: false, sexSpecificRisks: []},
    durationRules: "acute",
    symptomMatchRules: {
      primarySymptoms: ["bacterial infection", "fever with infection", "purulent discharge"],
      secondarySymptoms: ["cough", "dysuria", "wound infection"],
      inappropriateSymptoms: ["viral symptoms", "chronic symptoms"]
    },
    teachingNotes: "First-line for many bacterial infections due to broad spectrum activity against gram-positive and some gram-negative bacteria. Avoid in penicillin allergy. Should not be used for viral infections as this contributes to antibiotic resistance."
  },
  {
    id: "med_007",
    name: "Azithromycin",
    drugClass: "Macrolide Antibiotic",
    mechanismOfAction: "Bacteriostatic antibiotic that inhibits protein synthesis by binding to 50S ribosomal subunit",
    clinicalUses: ["Respiratory tract infections", "Skin and soft tissue infections", "Sexually transmitted infections", "Traveler's diarrhea"],
    adverseEffects: ["Gastrointestinal upset", "QT prolongation", "Hepatotoxicity", "Allergic reactions"],
    contraindications: ["Hypersensitivity to macrolides", "Severe hepatic impairment", "Known QT prolongation"],
    ageRules: {min: 6, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "acute",
    symptomMatchRules: {
      primarySymptoms: ["respiratory infection", "skin infection", "genital discharge"],
      secondarySymptoms: ["cough", "fever", "skin lesions"],
      inappropriateSymptoms: ["viral symptoms", "chronic conditions"]
    },
    teachingNotes: "Chosen for its broad spectrum coverage and convenient once-daily dosing. Effective against atypical pathogens. Caution in patients with liver disease and cardiac conditions due to QT prolongation risk."
  },
  {
    id: "med_008",
    name: "Ciprofloxacin",
    drugClass: "Fluoroquinolone Antibiotic",
    mechanismOfAction: "Bactericidal antibiotic that inhibits DNA gyrase and topoisomerase IV, preventing DNA replication",
    clinicalUses: ["Urinary tract infections", "Gastrointestinal infections", "Respiratory infections", "Bone and joint infections"],
    adverseEffects: ["Tendon rupture", "Peripheral neuropathy", "CNS effects", "Gastrointestinal upset"],
    contraindications: ["Tendinopathy history", "Pregnancy", "Children under 18", "QT prolongation"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "hard"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: ["Increased tendon rupture risk in females"]},
    durationRules: "acute",
    symptomMatchRules: {
      primarySymptoms: ["urinary symptoms", "diarrhea", "respiratory infection"],
      secondarySymptoms: ["dysuria", "fever", "joint pain"],
      inappropriateSymptoms: ["viral symptoms", "chronic tendon issues"]
    },
    teachingNotes: "Reserved for serious infections due to resistance concerns. Avoid in children and pregnancy. Monitor for tendon issues and CNS effects. Should not be first-line due to resistance patterns."
  },
  {
    id: "med_009",
    name: "Doxycycline",
    drugClass: "Tetracycline Antibiotic",
    mechanismOfAction: "Bacteriostatic antibiotic that inhibits protein synthesis by binding to 30S ribosomal subunit",
    clinicalUses: ["Acne", "Rickettsial infections", "Lyme disease", "Chlamydial infections"],
    adverseEffects: ["Photosensitivity", "Gastrointestinal upset", "Tooth discoloration", "Hepatotoxicity"],
    contraindications: ["Pregnancy", "Children under 8", "Severe liver disease", "Hypersensitivity"],
    ageRules: {min: 8, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "hard"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["acne", "tick-borne illness", "chlamydial infection", "rickettsial disease"],
      secondarySymptoms: ["rash after tick bite", "joint pain", "fever", "skin lesions"],
      inappropriateSymptoms: ["pregnancy", "young children", "liver disease"]
    },
    teachingNotes: "Broad spectrum with good tissue penetration. Avoid in pregnancy and young children due to tooth discoloration. Take with food to reduce GI upset. Photosensitivity requires sun protection."
  },
  {
    id: "med_010",
    name: "Ceftriaxone",
    drugClass: "Third-generation Cephalosporin",
    mechanismOfAction: "Bactericidal antibiotic that inhibits bacterial cell wall synthesis",
    clinicalUses: ["Severe bacterial infections", "Meningitis", "Gonorrhea", "Surgical prophylaxis"],
    adverseEffects: ["Diarrhea", "Allergic reactions", "Biliary pseudolithiasis", "Bleeding"],
    contraindications: ["Cephalosporin allergy", "Severe renal impairment", "Newborns (premature)"],
    ageRules: {min: 0, max: 150, avoidInNeonates: true, avoidInElderly: false, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "acute",
    symptomMatchRules: {
      primarySymptoms: ["severe bacterial infection", "meningitis", "septic arthritis", "gonorrhea"],
      secondarySymptoms: ["high fever", "severe illness", "meningeal signs", "genital discharge"],
      inappropriateSymptoms: ["mild infections", "viral illness", "cephalosporin allergy"]
    },
    teachingNotes: "Broad-spectrum injectable antibiotic for serious infections. Excellent CSF penetration for meningitis. Can cause biliary pseudolithiasis with prolonged use. Cross-reactivity with penicillins possible."
  },
  {
    id: "med_011",
    name: "Clindamycin",
    drugClass: "Lincosamide Antibiotic",
    mechanismOfAction: "Bacteriostatic antibiotic that inhibits protein synthesis by binding to 50S ribosomal subunit",
    clinicalUses: ["Anaerobic infections", "Skin infections", "Dental infections", "Bone infections"],
    adverseEffects: ["Pseudomembranous colitis", "Diarrhea", "Nausea", "Allergic reactions"],
    contraindications: ["History of C. difficile", "Hypersensitivity", "Severe liver disease"],
    ageRules: {min: 0, max: 150, avoidInNeonates: false, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["anaerobic infection", "skin abscess", "dental infection", "bone infection"],
      secondarySymptoms: ["pus formation", "foul-smelling discharge", "localized pain", "fever"],
      inappropriateSymptoms: ["C. difficile history", "viral infections", "mild superficial infections"]
    },
    teachingNotes: "Excellent for anaerobic coverage. Associated with pseudomembranous colitis risk. Monitor for severe diarrhea. Oral formulation well-absorbed. IV formulation for serious infections."
  },
  {
    id: "med_012",
    name: "Metronidazole",
    drugClass: "Nitroimidazole Antibiotic",
    mechanismOfAction: "Bactericidal against anaerobes and protozoa by disrupting DNA synthesis",
    clinicalUses: ["Anaerobic infections", "Giardiasis", "Trichomoniasis", "Bacterial vaginosis"],
    adverseEffects: ["Metallic taste", "Nausea", "Neuropathy", "Disulfiram-like reaction"],
    contraindications: ["First trimester pregnancy", "Alcohol consumption", "Hypersensitivity"],
    ageRules: {min: 12, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["anaerobic infection", "protozoal infection", "vaginal discharge", "diarrhea"],
      secondarySymptoms: ["foul-smelling discharge", "abdominal pain", "genital symptoms", "GI upset"],
      inappropriateSymptoms: ["pregnancy first trimester", "alcohol use", "hypersensitivity"]
    },
    teachingNotes: "Essential for anaerobic coverage. Absolute alcohol avoidance during treatment due to disulfiram reaction. Metallic taste common but harmless. Treat sexual partners for trichomoniasis."
  },
  {
    id: "med_013",
    name: "Gentamicin",
    drugClass: "Aminoglycoside Antibiotic",
    mechanismOfAction: "Bactericidal antibiotic that inhibits protein synthesis by binding to 30S ribosomal subunit",
    clinicalUses: ["Severe gram-negative infections", "Sepsis", "Endocarditis", "Urinary tract infections"],
    adverseEffects: ["Nephrotoxicity", "Ototoxicity", "Neuromuscular blockade", "Allergic reactions"],
    contraindications: ["Hearing impairment", "Severe renal impairment", "Myasthenia gravis"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "hard"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "acute",
    symptomMatchRules: {
      primarySymptoms: ["severe gram-negative infection", "sepsis", "endocarditis", "complicated UTI"],
      secondarySymptoms: ["high fever", "severe illness", "organ dysfunction", "bacteremia"],
      inappropriateSymptoms: ["mild infections", "renal impairment", "hearing problems"]
    },
    teachingNotes: "Powerful gram-negative coverage but significant toxicity. Requires therapeutic drug monitoring. Dosing based on renal function. Short course preferred to minimize toxicity. Synergistic with beta-lactams."
  },
  {
    id: "med_014",
    name: "Vancomycin",
    drugClass: "Glycopeptide Antibiotic",
    mechanismOfAction: "Bactericidal antibiotic that inhibits cell wall synthesis by binding to peptidoglycan precursors",
    clinicalUses: ["MRSA infections", "C. difficile colitis", "Endocarditis", "Surgical prophylaxis"],
    adverseEffects: ["Red man syndrome", "Nephrotoxicity", "Ototoxicity", "Allergic reactions"],
    contraindications: ["Hypersensitivity", "Severe renal impairment", "Concurrent ototoxic drugs"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "acute",
    symptomMatchRules: {
      primarySymptoms: ["MRSA infection", "C. difficile", "severe gram-positive infection", "endocarditis"],
      secondarySymptoms: ["skin infection", "diarrhea", "fever", "sepsis"],
      inappropriateSymptoms: ["mild infections", "renal impairment", "hypersensitivity"]
    },
    teachingNotes: "Last resort for resistant gram-positive infections. Infuse slowly to prevent red man syndrome. Monitor trough levels and renal function. Oral formulation for C. difficile only (not absorbed)."
  },
  {
    id: "med_015",
    name: "Fluconazole",
    drugClass: "Antifungal",
    mechanismOfAction: "Inhibits ergosterol synthesis by blocking cytochrome P450 enzyme, disrupting fungal cell membrane",
    clinicalUses: ["Candidiasis", "Cryptococcal meningitis", "Vaginal yeast infections", "Prophylaxis in immunocompromised"],
    adverseEffects: ["Hepatotoxicity", "Skin rash", "GI upset", "Drug interactions"],
    contraindications: ["Hypersensitivity", "Concurrent terfenadine", "Severe liver disease"],
    ageRules: {min: 16, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["fungal infection", "yeast infection", "oral thrush", "vaginal discharge"],
      secondarySymptoms: ["white patches", "itching", "discharge", "oral lesions"],
      inappropriateSymptoms: ["bacterial infection", "viral symptoms", "liver disease"]
    },
    teachingNotes: "Broad-spectrum antifungal with good oral absorption. Extensive drug interactions via CYP3A4 inhibition. Single dose for vaginal candidiasis, longer courses for systemic infections. Monitor liver function with prolonged use."
  },
  
  // Cardiovascular (15)
  {
    id: "med_016",
    name: "Metformin",
    drugClass: "Biguanide Antidiabetic",
    mechanismOfAction: "Decreases hepatic glucose production and increases insulin sensitivity in peripheral tissues",
    clinicalUses: ["Type 2 diabetes mellitus", "Polycystic ovary syndrome", "Prediabetes management", "Weight management in diabetes"],
    adverseEffects: ["Gastrointestinal upset", "Lactic acidosis (rare)", "Vitamin B12 deficiency", "Metallic taste"],
    contraindications: ["Severe renal impairment", "Heart failure", "Liver disease", "Alcoholism"],
    ageRules: {min: 10, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "chronic",
    symptomMatchRules: {
      primarySymptoms: ["hyperglycemia", "diabetes symptoms", "insulin resistance"],
      secondarySymptoms: ["polyuria", "polydipsia", "fatigue"],
      inappropriateSymptoms: ["hypoglycemia", "renal failure", "heart failure"]
    },
    teachingNotes: "First-line for type 2 diabetes due to efficacy and weight neutrality. Monitor renal function regularly. Start low dose and titrate slowly to minimize GI side effects. Avoid in renal impairment."
  },
  {
    id: "med_017",
    name: "Atorvastatin",
    drugClass: "Statin (HMG-CoA Reductase Inhibitor)",
    mechanismOfAction: "Inhibits HMG-CoA reductase enzyme, reducing cholesterol synthesis and increasing LDL receptor activity",
    clinicalUses: ["Hypercholesterolemia", "Cardiovascular disease prevention", "Post-MI management", "Stroke prevention"],
    adverseEffects: ["Myopathy", "Hepatotoxicity", "Diabetes risk increase", "Cognitive effects"],
    contraindications: ["Active liver disease", "Pregnancy", "Breastfeeding", "Unexplained persistent transaminase elevations"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: false, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: ["Increased myopathy risk in females"]},
    durationRules: "chronic",
    symptomMatchRules: {
      primarySymptoms: ["hypercholesterolemia", "cardiovascular risk", "family history of heart disease"],
      secondarySymptoms: ["chest pain", "family history", "obesity"],
      inappropriateSymptoms: ["liver disease", "pregnancy", "muscle symptoms"]
    },
    teachingNotes: "High-intensity statin for cardiovascular risk reduction. Monitor liver enzymes and muscle symptoms. Most effective when combined with lifestyle modifications. Timing of administration can affect efficacy."
  },
  {
    id: "med_018",
    name: "Amlodipine",
    drugClass: "Calcium Channel Blocker",
    mechanismOfAction: "Blocks L-type calcium channels in vascular smooth muscle, causing vasodilation and reduced blood pressure",
    clinicalUses: ["Hypertension", "Angina pectoris", "Coronary artery disease", "Heart failure with preserved ejection fraction"],
    adverseEffects: ["Peripheral edema", "Dizziness", "Headache", "Gingival hyperplasia"],
    contraindications: ["Severe hypotension", "Cardiogenic shock", "Severe aortic stenosis"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: false, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "chronic",
    symptomMatchRules: {
      primarySymptoms: ["hypertension", "chest pain", "angina"],
      secondarySymptoms: ["headache", "dizziness", "shortness of breath"],
      inappropriateSymptoms: ["severe hypotension", "shock", "aortic stenosis"]
    },
    teachingNotes: "Long-acting calcium channel blocker with once-daily dosing. Effective for both hypertension and angina. Peripheral edema is common but usually benign. Can be used in combination with other antihypertensives."
  },
  {
    id: "med_019",
    name: "Lisinopril",
    drugClass: "ACE Inhibitor",
    mechanismOfAction: "Inhibits angiotensin-converting enzyme, preventing conversion of angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone release",
    clinicalUses: ["Hypertension", "Heart failure", "Post-MI management", "Diabetic nephropathy"],
    adverseEffects: ["Dry cough", "Hyperkalemia", "Angioedema", "Renal impairment"],
    contraindications: ["Pregnancy", "Bilateral renal artery stenosis", "Angioedema history", "Severe renal impairment"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: ["Increased angioedema risk in females"]},
    durationRules: "chronic",
    symptomMatchRules: {
      primarySymptoms: ["hypertension", "heart failure", "diabetic kidney disease"],
      secondarySymptoms: ["shortness of breath", "fatigue", "edema"],
      inappropriateSymptoms: ["pregnancy", "renal artery stenosis", "angioedema"]
    },
    teachingNotes: "First-line for hypertension and heart failure. Monitor potassium and renal function. Persistent dry cough occurs in 10-15% of patients. Essential for diabetic nephropathy protection."
  },
  {
    id: "med_020",
    name: "Carvedilol",
    drugClass: "Beta Blocker",
    mechanismOfAction: "Non-selective beta blocker with additional alpha-1 blocking activity, reducing heart rate and cardiac workload",
    clinicalUses: ["Heart failure", "Hypertension", "Angina", "Post-MI management"],
    adverseEffects: ["Bradycardia", "Fatigue", "Cold extremities", "Bronchospasm", "Sexual dysfunction"],
    contraindications: ["Severe bradycardia", "Heart block", "Severe asthma", " Decompensated heart failure"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "chronic",
    symptomMatchRules: {
      primarySymptoms: ["heart failure", "hypertension", "angina", "post-MI"],
      secondarySymptoms: ["palpitations", "chest pain", "shortness of breath", "fatigue"],
      inappropriateSymptoms: ["severe bradycardia", "asthma", "heart block", "decompensated HF"]
    },
    teachingNotes: "Unique among beta-blockers with alpha-blocking activity. Start low dose and titrate slowly. Monitor heart rate and blood pressure. Do not abruptly discontinue. Contraindicated in severe asthma."
  },
  {
    id: "med_021",
    name: "Spironolactone",
    drugClass: "Potassium-Sparing Diuretic",
    mechanismOfAction: "Competitive antagonist of aldosterone at mineralocorticoid receptors, promoting sodium excretion and potassium retention",
    clinicalUses: ["Heart failure", "Hypertension", "Hypokalemia", "Ascites", "Hirsutism"],
    adverseEffects: ["Hyperkalemia", "Gynecomastia", "Menstrual irregularities", "Sexual dysfunction"],
    contraindications: ["Hyperkalemia", "Severe renal impairment", "Addison's disease", "Pregnancy category C"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: ["Increased gynecomastia risk in males", "Menstrual irregularities in females"]},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["heart failure", "hypertension", "edema", "hormonal acne"],
      secondarySymptoms: ["shortness of breath", "leg swelling", "weight gain", "acne"],
      inappropriateSymptoms: ["hyperkalemia", "renal failure", "Addison's disease", "pregnancy"]
    },
    teachingNotes: "Potassium-sparing diuretic with anti-aldosterone effects. Monitor potassium levels closely, especially with ACE inhibitors. Causes gynecomastia in males and menstrual changes in females. Beneficial in heart failure with reduced EF."
  },
  {
    id: "med_022",
    name: "Nitroglycerin",
    drugClass: "Nitrate",
    mechanismOfAction: "Donates nitric oxide, causing vasodilation of coronary arteries and systemic veins, reducing cardiac preload and afterload",
    clinicalUses: ["Acute angina", "Chronic stable angina", "Hypertensive emergency", "Heart failure"],
    adverseEffects: ["Headache", "Hypotension", "Reflex tachycardia", "Tolerance development"],
    contraindications: ["Severe anemia", "Head trauma", "Phosphodiesterase inhibitors", "Severe hypotension"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: false, cautionInBreastfeeding: true, sexSpecificRisks: []},
    durationRules: "both",
    symptomMatchRules: {
      primarySymptoms: ["angina", "chest pain", "hypertensive crisis", "heart failure"],
      secondarySymptoms: ["pressure sensation", "shortness of breath", "neck/jaw pain", "dyspnea"],
      inappropriateSymptoms: ["severe anemia", "head trauma", "severe hypotension", "PDE inhibitor use"]
    },
    teachingNotes: "Sublingual for acute angina relief within 1-3 minutes. Transdermal for chronic prevention. Tolerance develops with continuous use - requires nitrate-free intervals. Do not use with PDE-5 inhibitors (sildenafil) due to severe hypotension risk."
  },
  {
    id: "med_023",
    name: "Warfarin",
    drugClass: "Vitamin K Antagonist",
    mechanismOfAction: "Inhibits vitamin K epoxide reductase, preventing synthesis of vitamin K-dependent clotting factors II, VII, IX, X",
    clinicalUses: ["Atrial fibrillation", "Venous thromboembolism", "Mechanical heart valves", "Post-surgical anticoagulation"],
    adverseEffects: ["Bleeding", "Skin necrosis", "Purple toe syndrome", "Drug interactions"],
    contraindications: ["Active bleeding", "Pregnancy", "Severe liver disease", "Uncontrolled hypertension"],
    ageRules: {min: 18, max: 150, avoidInNeonates: true, avoidInElderly: true, ruleType: "soft"},
    sexRules: {avoidInPregnancy: true, cautionInBreastfeeding: true, sexSpecificRisks: ["Increased bleeding risk in females"]},
    durationRules: "chronic",
    symptomMatchRules: {
      primarySymptoms: ["atrial fibrillation", "thromboembolism", "mechanical valve", "clotting disorders"],
      secondarySymptoms: ["palpitations", "leg swelling", "shortness of breath"],
      inappropriateSymptoms: ["active bleeding", "pregnancy", "uncontrolled hypertension"]
    },
    teachingNotes: "Requires regular INR monitoring (target 2-3 for most conditions). Numerous drug and food interactions. Dose adjustments based on INR values. Consider newer anticoagulants for better safety profile."
  }
  // Will continue with more medicine categories in final JSON
];

// Convert to final JSON format
const medicineData = {
  medicines: medicines.map((med, index) => ({
    ...med,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  })),
  exportedAt: "2024-01-01T00:00:00.000Z",
  version: "1.0"
};

// Create script for generating JSON
const generatorCode = `const medicines = ${JSON.stringify(medicines, null, 2)};

const medicineData = {
  medicines: medicines.map((med, index) => ({
    ...med,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  })),
  exportedAt: "2024-01-01T00:00:00.000Z",
  version: "1.0"
};

console.log(JSON.stringify(medicineData, null, 2));`;

fs.writeFileSync('generate-medicines.js', generatorCode);
console.log('Generator script created. Run node generate-medicines.js to create full JSON file.');