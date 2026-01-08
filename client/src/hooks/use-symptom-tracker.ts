import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { causeSchema, type Cause } from '@shared/schema';

// Types for our local state
export interface TrackerState {
  causes: Cause[];
  selectedSymptoms: string[];
}

const STORAGE_KEY = 'symptom_tracker_v1';

// Initial seed data if storage is empty
const INITIAL_CAUSES: Cause[] = [
  { id: '1', name: 'Tuberculosis (TB)', symptoms: ['cough', 'blood in cough', 'chest pain', 'fatigue', 'fever', 'weight loss', 'night sweats'], note: 'Nearly 35% of Afghanistan population reportedly infected. Requires 6+ months treatment.', treatment: 'Multi-drug therapy: Rifampicin, Isoniazid, Pyrazinamide, Ethambutol.' },
  { id: '2', name: 'Malaria', symptoms: ['high fever', 'chills', 'sweats', 'headache', 'muscle aches', 'fatigue', 'nausea'], note: 'Concentrated in border regions. Seasonal transmission June-November.', treatment: 'Artemisinin-based combination therapies (ACTs), Chloroquine, or Primaquine.' },
  { id: '3', name: 'Typhoid Fever', symptoms: ['fever', 'headache', 'abdominal pain', 'weakness', 'loss of appetite', 'constipation', 'diarrhea'], note: 'Major waterborne disease in the region.', treatment: 'Antibiotics: Ciprofloxacin, Azithromycin, or Ceftriaxone. Oral/IV rehydration.' },
  { id: '4', name: 'Cholera', symptoms: ['watery diarrhea', 'vomiting', 'leg cramps', 'dehydration', 'rapid heart rate', 'low blood pressure'], note: 'Epidemic-prone; endemic in 13+ Afghan provinces. Fatal within hours if untreated.', treatment: 'Aggressive Oral Rehydration Solution (ORS), IV fluids, Antibiotics (Doxycycline).' },
  { id: '5', name: 'Hepatitis A', symptoms: ['jaundice', 'yellow skin', 'yellow eyes', 'fatigue', 'loss of appetite', 'fever', 'dark urine'], note: 'Most Afghans contract HAV in childhood. Symptoms appear 2-6 weeks after exposure.', treatment: 'Supportive care: rest, adequate nutrition, hydration. Avoid alcohol.' },
  { id: '6', name: 'Measles', symptoms: ['high fever', 'cough', 'runny nose', 'red eyes', 'skin rash', 'koplik spots'], note: 'Highly contagious. Characteristic rash starts on face and spreads.', treatment: 'Supportive care, Vitamin A supplementation, fever management, hydration.' },
  { id: '7', name: 'Leishmaniasis (Cutaneous)', symptoms: ['skin lesions', 'skin ulcers', 'bumps on skin'], note: 'Endemic in northern Afghanistan. Transmitted by sandflies.', treatment: 'Antimonial compounds (Sodium Stibogluconate), Cryotherapy.' },
  { id: '8', name: 'Crimean-Congo Hemorrhagic Fever (CCHF)', symptoms: ['fever', 'muscle ache', 'dizziness', 'neck pain', 'headache', 'sore eyes', 'bruising', 'bleeding'], note: '40% fatality rate. Mood swings and confusion common.', treatment: 'Supportive care, Ribavirin, blood transfusions.' },
  { id: '9', name: 'Dengue Fever', symptoms: ['high fever', 'severe headache', 'pain behind eyes', 'joint pain', 'muscle pain', 'rash', 'bleeding'], note: 'Emerging threat in the region. Known as breakbone fever.', treatment: 'Supportive care, hydration, pain relief (Acetaminophen only). Avoid NSAIDs.' },
  { id: '10', name: 'Brucellosis', symptoms: ['fever', 'profuse sweating', 'night sweats', 'joint pain', 'muscle pain', 'fatigue', 'weakness'], note: 'Endemic in livestock areas. Relapse common if treatment incomplete.', treatment: 'Combination antibiotics: Doxycycline + Rifampicin for 6-8 weeks.' },
  { id: '11', name: 'Diabetes Type 2', symptoms: ['increased thirst', 'frequent urination', 'hunger', 'fatigue', 'blurred vision', 'numbness', 'tingling'], note: 'Affects approx 8.4% of population.', treatment: 'Metformin, Sulfonylureas, diet control, regular exercise.' },
  { id: '12', name: 'Pneumonia', symptoms: ['high fever', 'productive cough', 'difficulty breathing', 'rapid breathing', 'chest pain', 'fatigue'], note: 'Highest pediatric pneumonia mortality globally in this region.', treatment: 'Antibiotics (Amoxicillin, Azithromycin), oxygen therapy, IV fluids.' },
  { id: '13', name: 'Asthma', symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'chronic cough'], note: 'Significant burden of chronic respiratory disease.', treatment: 'Bronchodilators (Salbutamol), inhaled corticosteroids.' },
  { id: '14', name: 'Rheumatic Heart Disease', symptoms: ['shortness of breath', 'fatigue', 'palpitations', 'chest pain', 'joint pain', 'swelling'], note: 'Deaths from this condition are among the highest globally in this region.', treatment: 'Antibiotics (Penicillin), anti-inflammatory meds, heart valve surgery.' },
  { id: '15', name: 'Severe Acute Malnutrition', symptoms: ['stunted growth', 'wasting', 'extreme weight loss', 'weakness', 'fatigue', 'swelling'], note: 'Affects hundreds of thousands of children in the region.', treatment: 'Ready-to-use therapeutic food (RUTF), micronutrient supplementation.' },
  { id: '16', name: 'Depression', symptoms: ['persistent sadness', 'hopelessness', 'loss of interest', 'sleep disturbances', 'fatigue', 'social withdrawal'], note: 'High prevalence due to conflict and displacement.', treatment: 'Psychotherapy (CBT), Antidepressants (SSRIs).' },
  { id: '17', name: 'PTSD', symptoms: ['flashbacks', 'nightmares', 'severe anxiety', 'uncontrollable thoughts', 'avoidance'], note: 'Affects a large portion of the population in conflict zones.', treatment: 'Trauma-focused therapy, psychosocial support, medications.' },
  { id: '18', name: 'Thalassemia', symptoms: ['anemia', 'fatigue', 'pale skin', 'jaundice', 'bone deformities', 'enlarged spleen'], note: 'Genetic blood disorder. High prevalence in the region.', treatment: 'Regular blood transfusions, iron chelation therapy.' },
  { id: '19', name: 'Giardiasis', symptoms: ['watery diarrhea', 'greasy stools', 'stomach cramps', 'gas', 'nausea', 'weight loss'], note: 'Common parasitic infection from contaminated water.', treatment: 'Metronidazole or Tinidazole.' },
  { id: '20', name: 'Amoebiasis', symptoms: ['bloody diarrhea', 'stomach pain', 'fever', 'weight loss'], note: 'Common in areas with poor sanitation.', treatment: 'Nitroimidazole drugs followed by luminal amoebicides.' },
  { id: '21', name: 'Scabies', symptoms: ['intense itching', 'skin rash', 'small sores', 'thin lines on skin'], note: 'Highly contagious skin infestation common in overcrowded areas.', treatment: 'Permethrin cream or Malathion lotion.' },
  { id: '22', name: 'Trachoma', symptoms: ['eye itching', 'eye irritation', 'eye discharge', 'eyelid swelling', 'light sensitivity'], note: 'Leading preventable cause of blindness.', treatment: 'Antibiotics (Azithromycin), surgery for advanced stages.' },
  { id: '23', name: 'Polio', symptoms: ['fever', 'fatigue', 'headache', 'vomiting', 'stiff neck', 'paralysis'], note: 'Afghanistan and Pakistan are the only countries with endemic wild poliovirus.', treatment: 'Supportive care, physical therapy. Prevention via vaccine is critical.' },
  { id: '24', name: 'Hepatitis C', symptoms: ['fatigue', 'jaundice', 'abdominal pain', 'nausea', 'loss of appetite'], note: 'Often asymptomatic initially. Can lead to cirrhosis.', treatment: 'Direct-acting antivirals (Sofosbuvir, Daclatasvir).' },
  { id: '25', name: 'Iron Deficiency Anemia', symptoms: ['extreme fatigue', 'weakness', 'pale skin', 'chest pain', 'shortness of breath', 'cold hands'], note: 'Very common due to nutritional gaps.', treatment: 'Iron supplements, vitamin C, dietary changes.' },
  { id: '26', name: 'Vitamin A Deficiency', symptoms: ['night blindness', 'dry eyes', 'frequent infections', 'skin irritation', 'stunted growth'], note: 'Major cause of preventable blindness in children.', treatment: 'Vitamin A supplementation, dietary improvements.' },
  { id: '27', name: 'COPD', symptoms: ['shortness of breath', 'wheezing', 'chest tightness', 'chronic cough', 'sputum production'], note: 'Common due to high rates of tobacco use and indoor air pollution.', treatment: 'Bronchodilators, steroids, oxygen therapy.' },
  { id: '28', name: 'Stomach Cancer', symptoms: ['difficulty swallowing', 'bloating after eating', 'heartburn', 'nausea', 'stomach pain', 'unintended weight loss'], note: 'One of the most common cancers in the region.', treatment: 'Surgery, chemotherapy, radiation.' },
  { id: '29', name: 'Esophageal Cancer', symptoms: ['difficulty swallowing', 'chest pain', 'weight loss', 'hoarseness', 'chronic cough'], note: 'High prevalence in Northern Afghanistan.', treatment: 'Surgery, chemotherapy, radiation.' },
  { id: '30', name: 'Breast Cancer', symptoms: ['breast lump', 'change in breast shape', 'skin dimpling', 'nipple discharge'], note: 'Most common cancer among women in the region.', treatment: 'Surgery, chemotherapy, radiation, hormone therapy.' },
  { id: '31', name: 'Hypertension (High Blood Pressure)', symptoms: ['headache', 'shortness of breath', 'nosebleeds', 'flushing', 'dizziness'], note: 'Often silent until complications occur.', treatment: 'ACE inhibitors, Beta-blockers, lifestyle changes.' },
  { id: '32', name: 'Ascaris (Roundworm)', symptoms: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'weight loss', 'visible worms'], note: 'Common soil-transmitted helminth.', treatment: 'Albendazole or Mebendazole.' },
  { id: '33', name: 'Hookworm', symptoms: ['itching', 'localized rash', 'abdominal pain', 'diarrhea', 'weight loss', 'fatigue', 'anemia'], note: 'Common parasitic infection.', treatment: 'Albendazole or Mebendazole.' },
  { id: '34', name: 'Rabies', symptoms: ['fever', 'headache', 'muscle spasms', 'hydrophobia', 'confusion', 'paralysis'], note: 'Nearly 100% fatal once symptoms appear. Kabul has high dog bite rates.', treatment: 'Wound cleaning, Rabies immunoglobulin + vaccine (post-exposure only).' },
  { id: '35', name: 'Pertussis (Whooping Cough)', symptoms: ['severe coughing fits', 'whooping sound', 'vomiting after coughing', 'fatigue'], note: 'Serious respiratory infection, especially in infants.', treatment: 'Antibiotics (Azithromycin), supportive care.' },
  { id: '36', name: 'Diphtheria', symptoms: ['thick gray coating in throat', 'sore throat', 'hoarseness', 'swollen glands', 'difficulty breathing'], note: 'Outbreaks still occur due to low vaccination rates.', treatment: 'Antitoxin, antibiotics (Erythromycin or Penicillin).' },
  { id: '37', name: 'Meningitis (Bacterial)', symptoms: ['sudden high fever', 'stiff neck', 'severe headache', 'nausea', 'vomiting', 'confusion', 'sensitivity to light'], note: 'Medical emergency. High fatality rate if untreated.', treatment: 'Immediate IV antibiotics and corticosteroids.' },
  { id: '38', name: 'Tetanus', symptoms: ['jaw cramping', 'muscle spasms', 'stiff neck', 'difficulty swallowing', 'fever'], note: 'Commonly known as lockjaw.', treatment: 'Tetanus immunoglobulin, antibiotics, wound care.' },
  { id: '39', name: 'West Nile Virus', symptoms: ['fever', 'headache', 'body aches', 'vomiting', 'diarrhea', 'joint pain', 'rash'], note: 'Transmitted by mosquitoes.', treatment: 'Supportive care (pain relievers, fluids).' },
  { id: '40', name: 'Goitre (Iodine Deficiency)', symptoms: ['swelling in neck', 'tightness in throat', 'coughing', 'hoarseness', 'difficulty swallowing'], note: 'Common in mountainous regions with low iodine in soil.', treatment: 'Iodized salt, iodine supplements, surgery for large goitres.' },
  { id: '41', name: 'Chronic Kidney Disease', symptoms: ['fatigue', 'swollen ankles', 'shortness of breath', 'blood in urine', 'frequent urination at night'], note: 'Common complication of diabetes and hypertension.', treatment: 'Management of underlying causes, diet changes, dialysis.' },
  { id: '42', name: 'Gallstones', symptoms: ['sudden pain in upper right abdomen', 'nausea', 'vomiting', 'back pain between shoulder blades'], note: 'High prevalence related to dietary habits.', treatment: 'Surgery (Cholecystectomy), medications to dissolve stones.' },
  { id: '43', name: 'Peptic Ulcer', symptoms: ['burning stomach pain', 'feeling of fullness', 'bloating', 'intolerance to fatty foods', 'heartburn', 'nausea'], note: 'Often caused by H. pylori infection.', treatment: 'Antibiotics, proton pump inhibitors (PPIs).' },
  { id: '44', name: 'H. Pylori Infection', symptoms: ['burning stomach pain', 'nausea', 'loss of appetite', 'frequent burping', 'bloating', 'unintentional weight loss'], note: 'Extremely common in areas with poor water sanitation.', treatment: 'Triple therapy: PPI + two antibiotics (Clarithromycin, Amoxicillin).' },
  { id: '45', name: 'Bacillary Dysentery', symptoms: ['diarrhea with blood', 'stomach cramps', 'fever', 'nausea'], note: 'Caused by Shigella bacteria.', treatment: 'Antibiotics, fluid replacement.' },
  { id: '46', name: 'Anxiety Disorder', symptoms: ['excessive worry', 'restlessness', 'fatigue', 'difficulty concentrating', 'irritability', 'muscle tension', 'sleep problems'], note: 'Very common mental health condition in the region.', treatment: 'Therapy, SSRIs, Benzodiazepines (short-term).' },
  { id: '47', name: 'Cataracts', symptoms: ['cloudy vision', 'difficulty seeing at night', 'sensitivity to light', 'halos around lights', 'fading of colors'], note: 'Leading cause of vision loss in the elderly.', treatment: 'Surgery (Lens replacement).' },
  { id: '48', name: 'Glaucoma', symptoms: ['patchy blind spots', 'tunnel vision', 'severe headache', 'eye pain', 'blurred vision', 'halos'], note: 'Can lead to permanent blindness if untreated.', treatment: 'Eye drops, laser treatment, surgery.' },
  { id: '49', name: 'Eczema (Atopic Dermatitis)', symptoms: ['dry skin', 'itching', 'red patches', 'small bumps', 'thickened skin'], note: 'Common skin condition, often exacerbated by environmental factors.', treatment: 'Moisturizers, topical steroids.' },
  { id: '50', name: 'Psoriasis', symptoms: ['red patches of skin', 'silvery scales', 'dry cracked skin', 'itching', 'burning', 'swollen joints'], note: 'Chronic autoimmune skin disease.', treatment: 'Topical treatments, light therapy, systemic medications.' },
  { id: '51', name: 'Epilepsy', symptoms: ['seizures', 'temporary confusion', 'staring spell', 'uncontrollable movements', 'loss of consciousness'], note: 'Significant stigma associated with this condition in the region.', treatment: 'Anti-epileptic drugs (AEDs).' },
  { id: '52', name: 'Oral Thrush (Candidiasis)', symptoms: ['white lesions on tongue', 'redness', 'burning', 'difficulty swallowing', 'loss of taste'], note: 'Common in infants and people with weakened immunity.', treatment: 'Antifungal medications (Nystatin, Fluconazole).' },
  { id: '53', name: 'Otitis Media (Middle Ear Infection)', symptoms: ['ear pain', 'drainage from ear', 'diminished hearing', 'fever', 'irritability'], note: 'Very common in children.', treatment: 'Antibiotics (Amoxicillin), pain relief.' },
  { id: '54', name: 'Sinusitis', symptoms: ['thick nasal discharge', 'stuffy nose', 'facial pain', 'fever', 'headache', 'reduced sense of smell'], note: 'Common chronic condition.', treatment: 'Saline rinses, decongestants, antibiotics if bacterial.' },
  { id: '55', name: 'Pharyngitis (Sore Throat)', symptoms: ['sore throat', 'pain when swallowing', 'swollen glands', 'red tonsils', 'fever'], note: 'Can be viral or bacterial (Strep).', treatment: 'Rest, fluids, antibiotics if Strep confirmed.' },
  { id: '56', name: 'Bronchitis (Acute)', symptoms: ['cough with mucus', 'fatigue', 'shortness of breath', 'slight fever', 'chest discomfort'], note: 'Often follows a cold or flu.', treatment: 'Rest, fluids, cough suppressants.' },
  { id: '57', name: 'Urinary Tract Infection (UTI)', symptoms: ['strong urge to urinate', 'burning sensation when urinating', 'cloudy urine', 'pelvic pain', 'strong-smelling urine'], note: 'Common, especially in women.', treatment: 'Antibiotics (Trimethoprim, Nitrofurantoin).' },
  { id: '58', name: 'Back Pain (Chronic)', symptoms: ['muscle ache', 'shooting pain', 'pain radiating down leg', 'limited flexibility'], note: 'Common among agricultural and manual laborers.', treatment: 'Physical therapy, pain relievers, stretching.' },
  { id: '59', name: 'Osteoarthritis', symptoms: ['joint pain', 'stiffness', 'tenderness', 'loss of flexibility', 'grating sensation'], note: 'Degenerative joint disease common in aging population.', treatment: 'Exercise, weight management, pain relievers.' },
  { id: '60', name: 'Rheumatoid Arthritis', symptoms: ['tender warm swollen joints', 'joint stiffness', 'fatigue', 'fever', 'loss of appetite'], note: 'Autoimmune disorder.', treatment: 'DMARDs, biologics, steroids.' },
  { id: '61', name: 'Gout', symptoms: ['intense joint pain', 'lingering discomfort', 'inflammation', 'redness', 'limited range of motion'], note: 'Form of arthritis related to high uric acid.', treatment: 'NSAIDs, Colchicine, dietary changes.' },
  { id: '62', name: 'Appendicitis', symptoms: ['sudden pain in lower right abdomen', 'nausea', 'vomiting', 'loss of appetite', 'fever', 'constipation', 'diarrhea'], note: 'Medical emergency.', treatment: 'Surgery (Appendectomy).' },
  { id: '63', name: 'Hernia', symptoms: ['bulge in abdomen or groin', 'pain when lifting', 'aching sensation', 'feeling of fullness'], note: 'Common due to heavy manual labor.', treatment: 'Surgery (Hernia repair).' },
  { id: '64', name: 'Hemorrhoids', symptoms: ['painless bleeding during bowel movements', 'itching', 'pain', 'swelling around anus'], note: 'Often related to diet and constipation.', treatment: 'High-fiber diet, topical treatments, surgery if severe.' },
  { id: '65', name: 'Varicose Veins', symptoms: ['dark purple or blue veins', 'veins that look twisted', 'aching legs', 'swelling', 'itching'], note: 'Common in people who stand for long periods.', treatment: 'Compression stockings, exercise, sclerotherapy.' },
  { id: '66', name: 'Hypothyroidism', symptoms: ['fatigue', 'increased sensitivity to cold', 'constipation', 'dry skin', 'weight gain', 'puffy face'], note: 'Common, often related to iodine deficiency.', treatment: 'Levothyroxine (hormone replacement).' },
  { id: '67', name: 'Hyperthyroidism', symptoms: ['unintentional weight loss', 'rapid heartbeat', 'increased appetite', 'anxiety', 'tremor', 'sweating'], note: 'Overactive thyroid.', treatment: 'Anti-thyroid meds, radioactive iodine, surgery.' },
  { id: '68', name: 'Anemia (Megaloblastic)', symptoms: ['fatigue', 'shortness of breath', 'nausea', 'muscle weakness', 'pale skin'], note: 'Often caused by B12 or folate deficiency.', treatment: 'B12 or Folate supplements, dietary changes.' },
  { id: '69', name: 'Parkinson\'s Disease', symptoms: ['tremor', 'slowed movement', 'rigid muscles', 'impaired posture', 'speech changes'], note: 'Progressive nervous system disorder.', treatment: 'Levodopa, Carbidopa, dopamine agonists.' },
  { id: '70', name: 'Dementia (Alzheimer\'s)', symptoms: ['memory loss', 'confusion', 'difficulty with familiar tasks', 'personality changes', 'disorientation'], note: 'Increasingly common as life expectancy rises.', treatment: 'Cholinesterase inhibitors, memantine.' },
  { id: '71', name: 'Sleep Apnea', symptoms: ['loud snoring', 'gasping for air during sleep', 'waking with dry mouth', 'morning headache', 'excessive daytime sleepiness'], note: 'Often undiagnosed.', treatment: 'CPAP machine, lifestyle changes.' },
  { id: '72', name: 'Insomnia', symptoms: ['difficulty falling asleep', 'waking up during night', 'waking too early', 'daytime tiredness'], note: 'Commonly linked to stress and mental health.', treatment: 'Cognitive behavioral therapy for insomnia (CBT-I), sleep hygiene.' },
  { id: '73', name: 'Acne', symptoms: ['whiteheads', 'blackheads', 'red bumps', 'pimples', 'painful lumps'], note: 'Extremely common in adolescents.', treatment: 'Topical treatments (Benzoyl peroxide, Salicylic acid), antibiotics.' },
  { id: '74', name: 'Ringworm (Fungal Infection)', symptoms: ['scaly ring-shaped area', 'itching', 'redness', 'expanding ring'], note: 'Common skin fungus.', treatment: 'Antifungal creams or pills.' },
  { id: '75', name: 'Athlete\'s Foot', symptoms: ['itching between toes', 'burning', 'stinging', 'blisters', 'cracking skin'], note: 'Fungal infection common in warm climates.', treatment: 'Antifungal sprays or creams.' },
  { id: '76', name: 'Chickenpox', symptoms: ['itchy blister-like rash', 'fever', 'headache', 'fatigue', 'loss of appetite'], note: 'Common childhood viral infection.', treatment: 'Supportive care, calamine lotion.' },
  { id: '77', name: 'Shingles', symptoms: ['painful rash', 'fluid-filled blisters', 'itching', 'fever', 'headache', 'sensitivity to light'], note: 'Reactivation of chickenpox virus.', treatment: 'Antiviral meds (Acyclovir), pain relief.' },
  { id: '78', name: 'Mumps', symptoms: ['swollen salivary glands', 'fever', 'headache', 'muscle aches', 'fatigue', 'loss of appetite'], note: 'Viral infection affecting parotid glands.', treatment: 'Supportive care.' },
  { id: '79', name: 'Rubella (German Measles)', symptoms: ['mild fever', 'headache', 'stuffy nose', 'red eyes', 'enlarged lymph nodes', 'pink rash'], note: 'Dangerous during pregnancy.', treatment: 'Supportive care.' },
  { id: '80', name: 'Encephalitis', symptoms: ['headache', 'fever', 'aches in muscles', 'fatigue', 'confusion', 'seizures', 'problems with movement'], note: 'Inflammation of the brain, often viral.', treatment: 'Antiviral meds, supportive care.' },
  { id: '81', name: 'Staph Infection', symptoms: ['boils', 'impetigo', 'cellulitis', 'redness', 'swelling', 'pain'], note: 'Common bacterial skin infection.', treatment: 'Antibiotics, wound drainage.' },
  { id: '82', name: 'Impetigo', symptoms: ['red sores around nose and mouth', 'honey-colored crusts', 'itching'], note: 'Highly contagious skin infection in children.', treatment: 'Antibiotic ointment or pills.' },
  { id: '83', name: 'Cellulitis', symptoms: ['red area of skin that tends to expand', 'swelling', 'tenderness', 'pain', 'warmth', 'fever'], note: 'Serious bacterial skin infection.', treatment: 'Antibiotics.' },
  { id: '84', name: 'Endocarditis', symptoms: ['fever', 'chills', 'new or changed heart murmur', 'fatigue', 'aching joints', 'shortness of breath'], note: 'Infection of the inner lining of heart chambers.', treatment: 'High-dose IV antibiotics.' },
  { id: '85', name: 'Sepsis', symptoms: ['high heart rate', 'confusion', 'extreme pain', 'fever', 'shivering', 'shortness of breath', 'clammy skin'], note: 'Life-threatening medical emergency.', treatment: 'Immediate IV fluids and antibiotics.' },
  { id: '86', name: 'Lyme Disease', symptoms: ['bullseye rash', 'fever', 'chills', 'fatigue', 'body aches', 'headache', 'stiff neck'], note: 'Tick-borne illness.', treatment: 'Antibiotics (Doxycycline).' },
  { id: '87', name: 'Celiac Disease', symptoms: ['diarrhea', 'fatigue', 'weight loss', 'bloating', 'gas', 'abdominal pain', 'nausea'], note: 'Immune reaction to eating gluten.', treatment: 'Strict gluten-free diet.' },
  { id: '88', name: 'Crohn\'s Disease', symptoms: ['diarrhea', 'fever', 'fatigue', 'abdominal pain', 'blood in stool', 'mouth sores', 'reduced appetite'], note: 'Inflammatory bowel disease.', treatment: 'Anti-inflammatory drugs, immune system suppressors.' },
  { id: '89', name: 'Ulcerative Colitis', symptoms: ['diarrhea with blood or pus', 'abdominal pain', 'rectal pain', 'urgency to defecate', 'weight loss', 'fatigue'], note: 'Inflammatory bowel disease.', treatment: 'Anti-inflammatory drugs, surgery in severe cases.' },
  { id: '90', name: 'Irritable Bowel Syndrome (IBS)', symptoms: ['cramping', 'abdominal pain', 'bloating', 'gas', 'diarrhea', 'constipation'], note: 'Common chronic disorder affecting the large intestine.', treatment: 'Dietary changes, stress management, medications.' },
  { id: '91', name: 'Multiple Sclerosis', symptoms: ['numbness in limbs', 'vision loss', 'tingling', 'electric-shock sensations', 'tremor', 'unsteady gait'], note: 'Autoimmune disease of the central nervous system.', treatment: 'Corticosteroids, disease-modifying therapies.' },
  { id: '92', name: 'Lupus', symptoms: ['fatigue', 'fever', 'joint pain', 'butterfly rash on face', 'skin lesions', 'shortness of breath', 'chest pain'], note: 'Systemic autoimmune disease.', treatment: 'NSAIDs, Antimalarials, Corticosteroids.' },
  { id: '93', name: 'Psoriatic Arthritis', symptoms: ['joint pain', 'stiffness', 'swelling', 'swollen fingers and toes', 'foot pain', 'lower back pain'], note: 'Arthritis associated with psoriasis.', treatment: 'NSAIDs, DMARDs, biologics.' },
  { id: '94', name: 'Sjogren\'s Syndrome', symptoms: ['dry eyes', 'dry mouth', 'joint pain', 'stiffness', 'swelling', 'swollen salivary glands'], note: 'Immune system disorder often occurring with other autoimmune diseases.', treatment: 'Eye drops, medications to increase saliva.' },
  { id: '95', name: 'Ankylosing Spondylitis', symptoms: ['pain and stiffness in lower back', 'hip pain', 'joint pain', 'neck pain', 'fatigue'], note: 'Inflammatory arthritis affecting the spine.', treatment: 'NSAIDs, physical therapy, biologics.' },
  { id: '96', name: 'Fibromyalgia', symptoms: ['widespread musculoskeletal pain', 'fatigue', 'sleep issues', 'memory issues', 'mood issues'], note: 'Chronic pain condition.', treatment: 'Pain relievers, antidepressants, physical therapy.' },
  { id: '97', name: 'Chronic Fatigue Syndrome', symptoms: ['extreme fatigue', 'loss of memory', 'sore throat', 'enlarged lymph nodes', 'unexplained muscle or joint pain', 'headaches'], note: 'Complex disorder characterized by extreme fatigue.', treatment: 'Symptom management, lifestyle changes.' },
  { id: '98', name: 'Endometriosis', symptoms: ['painful periods', 'pain with intercourse', 'pain with bowel movements', 'excessive bleeding', 'infertility'], note: 'Common condition where tissue similar to uterine lining grows outside the uterus.', treatment: 'Pain meds, hormone therapy, surgery.' },
  { id: '99', name: 'Polycystic Ovary Syndrome (PCOS)', symptoms: ['irregular periods', 'excess androgen', 'polycystic ovaries', 'weight gain', 'thinning hair'], note: 'Common hormonal disorder among women of reproductive age.', treatment: 'Birth control pills, Metformin, lifestyle changes.' },
  { id: '100', name: 'Erectile Dysfunction', symptoms: ['trouble getting an erection', 'trouble keeping an erection', 'reduced sexual desire'], note: 'Very common condition, often with psychological or vascular causes.', treatment: 'Sildenafil (Viagra), Tadalafil (Cialis), treatment of underlying causes.' },
  { id: '101', name: 'Benign Prostatic Hyperplasia (BPH)', symptoms: ['frequent urge to urinate', 'difficulty starting urination', 'weak urine stream', 'inability to completely empty bladder'], note: 'Common as men age.', treatment: 'Alpha blockers, 5-alpha reductase inhibitors, surgery.' },
  { id: '102', name: 'Migraine', symptoms: ['headache', 'nausea', 'sensitivity to light', 'sensitivity to sound', 'vomiting', 'visual aura'], note: 'Severe headache often on one side of the head.', treatment: 'Triptans, pain relievers, rest in a dark room.' },
  { id: '103', name: 'Allergies (Hay Fever)', symptoms: ['sneezing', 'itchy eyes', 'runny nose', 'watery eyes', 'nasal congestion'], note: 'Reaction to pollen, dust, or pet dander.', treatment: 'Antihistamines, nasal sprays, avoiding triggers.' },
  { id: '104', name: 'Gastroenteritis (Stomach Flu)', symptoms: ['nausea', 'vomiting', 'diarrhea', 'stomach cramps', 'low-grade fever'], note: 'Inflammation of the stomach and intestines.', treatment: 'Hydration (ORS), rest, light diet.' },
  { id: '105', name: 'Tonsillitis', symptoms: ['sore throat', 'swollen tonsils', 'difficulty swallowing', 'fever', 'swollen lymph nodes'], note: 'Inflammation of the tonsils.', treatment: 'Antibiotics if bacterial, rest, fluids.' },
  { id: '106', name: 'Conjunctivitis (Pink Eye)', symptoms: ['redness in eye', 'itchiness', 'discharge from eye', 'crusty eyelids'], note: 'Inflammation of the conjunctiva.', treatment: 'Antibiotic or antihistamine eye drops, warm compress.' },
  { id: '107', name: 'Bronchial Asthma', symptoms: ['shortness of breath', 'wheezing', 'chest tightness', 'coughing especially at night'], note: 'Chronic inflammatory disease of the airways.', treatment: 'Inhalers (Salbutamol), avoid triggers.' },
  { id: '108', name: 'Sinus Headache', symptoms: ['pressure around eyes', 'facial pain', 'nasal congestion', 'headache'], note: 'Pain and pressure caused by sinus inflammation.', treatment: 'Decongestants, saline rinses, pain relievers.' },
  { id: '109', name: 'Food Poisoning', symptoms: ['nausea', 'vomiting', 'watery diarrhea', 'abdominal pain', 'fever'], note: 'Caused by eating contaminated food.', treatment: 'Hydration, rest, gradual return to eating.' },
  { id: '110', name: 'Urinary Calculus (Kidney Stones)', symptoms: ['severe pain in side and back', 'pain that radiates to lower abdomen', 'pain on urination', 'pink or red urine'], note: 'Hard deposits of minerals and salts.', treatment: 'Hydration, pain relievers, medical procedures for large stones.' },
  { id: '111', name: 'Vertigo', symptoms: ['spinning sensation', 'loss of balance', 'nausea', 'vomiting', 'headache'], note: 'Sensation of feeling off-balance.', treatment: 'Epley maneuver, vestibular rehabilitation, medications.' },
  { id: '112', name: 'Anemia (General)', symptoms: ['fatigue', 'weakness', 'pale skin', 'irregular heartbeat', 'shortness of breath'], note: 'Lack of enough healthy red blood cells.', treatment: 'Iron supplements, B12, dietary improvements.' },
  { id: '113', name: 'Gastritis', symptoms: ['burning ache in upper abdomen', 'nausea', 'feeling of fullness after eating'], note: 'Inflammation of the stomach lining.', treatment: 'Antacids, PPIs, avoiding spicy foods.' },
  { id: '114', name: 'Hypoglycemia', symptoms: ['shakiness', 'dizziness', 'sweating', 'hunger', 'fast heartbeat', 'confusion'], note: 'Low blood sugar levels.', treatment: 'Fast-acting carbohydrates (juice, candy), glucagon.' },
  { id: '115', name: 'Hyperglycemia', symptoms: ['increased thirst', 'frequent urination', 'blurred vision', 'fatigue', 'headache'], note: 'High blood sugar levels.', treatment: 'Insulin, medication adjustment, hydration.' },
  { id: '116', name: 'Acid Reflux (GERD)', symptoms: ['heartburn', 'chest pain', 'difficulty swallowing', 'regurgitation of food'], note: 'Backflow of stomach acid into the esophagus.', treatment: 'Antacids, H2 blockers, lifestyle changes.' },
  { id: '117', name: 'Laryngitis', symptoms: ['hoarseness', 'weak voice', 'tickling sensation in throat', 'dry throat'], note: 'Inflammation of the voice box.', treatment: 'Voice rest, hydration, humidifiers.' },
  { id: '118', name: 'Carpal Tunnel Syndrome', symptoms: ['numbness in thumb and fingers', 'tingling in hand', 'weakness in hand', 'pain in wrist'], note: 'Pressure on the median nerve in the wrist.', treatment: 'Wrist splinting, NSAIDs, physical therapy.' },
  { id: '119', name: 'Sciatica', symptoms: ['pain radiating from lower spine to leg', 'numbness in leg', 'tingling in foot', 'muscle weakness'], note: 'Pain affecting the sciatic nerve.', treatment: 'Physical therapy, stretching, pain relievers.' },
  { id: '120', name: 'Alopecia Areata', symptoms: ['patchy hair loss', 'sudden loss of hair', 'smooth bald patches'], note: 'Autoimmune disorder causing hair loss.', treatment: 'Corticosteroids, topical minoxidil.' },
  { id: '121', name: 'Dry Eye Syndrome', symptoms: ['stinging or burning in eyes', 'stringy mucus in eyes', 'sensitivity to light', 'eye redness'], note: 'Eyes don\'t produce enough tears.', treatment: 'Artificial tears, warm compress.' },
  { id: '122', name: 'Dandruff (Seborrheic Dermatitis)', symptoms: ['skin flakes on scalp', 'itchy scalp', 'scaly skin'], note: 'Common scalp condition.', treatment: 'Anti-dandruff shampoos (Ketoconazole).' },
  { id: '123', name: 'Mouth Ulcer (Canker Sore)', symptoms: ['small painful sore in mouth', 'white or yellow sore with red border', 'burning sensation'], note: 'Small, shallow lesions in the mouth.', treatment: 'Topical gels, saline rinses.' },
  { id: '124', name: 'Heat Stroke', symptoms: ['high body temperature', 'altered mental state', 'nausea', 'flushed skin', 'rapid breathing'], note: 'Body overheating due to prolonged exposure to high temperatures.', treatment: 'Immediate cooling, hydration, medical emergency.' },
  { id: '125', name: 'Heat Exhaustion', symptoms: ['heavy sweating', 'rapid pulse', 'dizziness', 'fatigue', 'muscle cramps'], note: 'Body\'s response to excessive loss of water and salt.', treatment: 'Cool environment, hydration (ORS), rest.' },
  { id: '126', name: 'Frostbite', symptoms: ['cold skin and a prickling feeling', 'numbness', 'discolored skin', 'hard or waxy-looking skin'], note: 'Injury caused by freezing of the skin and underlying tissues.', treatment: 'Gradual rewarming, wound care.' },
  { id: '127', name: 'Dehydration', symptoms: ['extreme thirst', 'less frequent urination', 'dark-colored urine', 'fatigue', 'dizziness'], note: 'Body doesn\'t have as much water and fluids as it should.', treatment: 'Hydration (ORS), electrolyte replacement.' },
  { id: '128', name: 'Angina', symptoms: ['chest pain', 'pressure in chest', 'pain in arms, neck, or jaw', 'shortness of breath'], note: 'Reduced blood flow to the heart muscle.', treatment: 'Nitroglycerin, rest, lifestyle changes.' },
  { id: '129', name: 'Bronchiectasis', symptoms: ['chronic cough', 'large amounts of foul-smelling mucus', 'shortness of breath', 'chest pain'], note: 'Condition where airways are widened and damaged.', treatment: 'Antibiotics, chest physiotherapy.' },
  { id: '130', name: 'Emphysema', symptoms: ['shortness of breath', 'wheezing', 'chronic cough', 'fatigue'], note: 'Condition that causes shortness of breath due to damaged air sacs.', treatment: 'Inhalers, oxygen therapy, smoking cessation.' },
  { id: '131', name: 'Pulmonary Embolism', symptoms: ['sudden shortness of breath', 'chest pain that worsens with deep breath', 'coughing up blood', 'rapid pulse'], note: 'Blood clot in the lung.', treatment: 'Anticoagulants, emergency medical care.' },
  { id: '132', name: 'Deep Vein Thrombosis (DVT)', symptoms: ['swelling in one leg', 'pain in leg', 'red or discolored skin on leg', 'feeling of warmth in affected leg'], note: 'Blood clot in a deep vein.', treatment: 'Anticoagulants, compression stockings.' },
  { id: '133', name: 'Arrhythmia', symptoms: ['fluttering in chest', 'racing heartbeat', 'slow heartbeat', 'chest pain', 'shortness of breath'], note: 'Irregular heartbeat.', treatment: 'Medications, pacemaker, lifestyle changes.' },
  { id: '134', name: 'Heart Failure', symptoms: ['shortness of breath', 'fatigue and weakness', 'swelling in legs', 'rapid or irregular heartbeat'], note: 'Heart doesn\'t pump blood as well as it should.', treatment: 'ACE inhibitors, beta-blockers, diuretics.' },
  { id: '135', name: 'Stroke (Ischemic)', symptoms: ['sudden numbness in face or limb', 'confusion', 'trouble speaking', 'trouble seeing in one eye'], note: 'Blood supply to part of the brain is interrupted.', treatment: 'TPA (clot-buster), immediate medical emergency.' },
  { id: '136', name: 'Transient Ischemic Attack (TIA)', symptoms: ['sudden weakness', 'slurred speech', 'vision loss', 'dizziness'], note: 'Temporary period of symptoms similar to those of a stroke.', treatment: 'Aspirin, lifestyle changes, risk management.' },
  { id: '137', name: 'Aneurysm', symptoms: ['sudden severe headache', 'nausea', 'vomiting', 'stiff neck', 'blurred vision'], note: 'Bulge in a blood vessel.', treatment: 'Surgical repair, monitoring.' },
  { id: '138', name: 'Liver Cirrhosis', symptoms: ['fatigue', 'easy bleeding', 'jaundice', 'swelling in legs', 'loss of appetite'], note: 'Late-stage scarring of the liver.', treatment: 'Treatment of underlying cause, lifestyle changes.' },
  { id: '139', name: 'Pancreatitis', symptoms: ['upper abdominal pain', 'abdominal pain that radiates to back', 'fever', 'rapid pulse', 'nausea'], note: 'Inflammation of the pancreas.', treatment: 'Hospitalization, IV fluids, fasting.' },
  { id: '140', name: 'Cholecystitis', symptoms: ['severe pain in upper right abdomen', 'pain that radiates to right shoulder', 'tenderness over abdomen', 'fever'], note: 'Inflammation of the gallbladder.', treatment: 'Hospitalization, fasting, antibiotics, surgery.' },
  { id: '141', name: 'Hyperlipidemia', symptoms: ['usually asymptomatic', 'fatty deposits under skin', 'chest pain if advanced'], note: 'High levels of fats in the blood.', treatment: 'Statins, diet, exercise.' },
  { id: '142', name: 'Hypocalcemia', symptoms: ['muscle cramps', 'numbness and tingling', 'confusion', 'seizures'], note: 'Low levels of calcium in the blood.', treatment: 'Calcium and Vitamin D supplements.' },
  { id: '143', name: 'Hypercalcemia', symptoms: ['excessive thirst', 'frequent urination', 'nausea', 'bone pain', 'confusion'], note: 'High levels of calcium in the blood.', treatment: 'Hydration, medications, treating underlying cause.' },
  { id: '144', name: 'Hypokalemia', symptoms: ['weakness', 'fatigue', 'muscle cramps', 'irregular heartbeat'], note: 'Low levels of potassium in the blood.', treatment: 'Potassium supplements, dietary changes.' },
  { id: '145', name: 'Hyperkalemia', symptoms: ['muscle weakness', 'numbness', 'nausea', 'irregular heartbeat'], note: 'High levels of potassium in the blood.', treatment: 'Medications, diet changes, emergency treatment.' },
  { id: '146', name: 'Hyponatremia', symptoms: ['nausea', 'headache', 'confusion', 'loss of energy', 'seizures'], note: 'Low levels of sodium in the blood.', treatment: 'Fluid restriction, salt replacement.' },
  { id: '147', name: 'Addison\'s Disease', symptoms: ['extreme fatigue', 'weight loss', 'darkening of skin', 'low blood pressure', 'salt craving'], note: 'Adrenal insufficiency.', treatment: 'Hormone replacement therapy.' },
  { id: '148', name: 'Cushing\'s Syndrome', symptoms: ['fatty hump between shoulders', 'rounded face', 'pink or purple stretch marks'], note: 'High levels of cortisol.', treatment: 'Medication, surgery, radiation.' },
  { id: '149', name: 'Polymyalgia Rheumatica', symptoms: ['aches and stiffness in shoulders', 'neck stiffness', 'aching in hips', 'limited range of motion'], note: 'Inflammatory disorder causing muscle pain.', treatment: 'Corticosteroids.' },
  { id: '150', name: 'Scleroderma', symptoms: ['hardening of skin', 'Raynaud\'s phenomenon', 'digestive issues', 'joint pain'], note: 'Group of rare diseases that involve the hardening and tightening of the skin.', treatment: 'Symptom management, immunosuppressants.' },
  { id: '151', name: 'Raynaud\'s Phenomenon', symptoms: ['cold fingers or toes', 'color changes in skin in response to cold', 'numbness', 'prickly feeling upon warming'], note: 'Condition that causes some areas of the body to feel numb and cold.', treatment: 'Keeping warm, medications to dilate blood vessels.' },
];

export function useSymptomTracker() {
  const { toast } = useToast();
  
  // Initialize state from local storage or defaults
  const [causes, setCauses] = useState<Cause[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Simple migration/validation check
        if (Array.isArray(parsed.causes)) {
          return parsed.causes;
        }
      }
    } catch (e) {
      console.error("Failed to load from storage", e);
    }
    return INITIAL_CAUSES;
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.selectedSymptoms)) {
          return parsed.selectedSymptoms;
        }
      }
    } catch (e) {
      console.error("Failed to load symptoms", e);
    }
    return [];
  });

  // No Undo Stack - Removed as per user request
  // const [history, setHistory] = useState<TrackerState[]>([]);

  // Persist to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ causes, selectedSymptoms }));
  }, [causes, selectedSymptoms]);

  // Actions
  const addSymptom = (symptom: string) => {
    const normalized = symptom.toLowerCase().trim();
    if (!normalized || selectedSymptoms.includes(normalized)) return;
    
    setSelectedSymptoms(prev => [...prev, normalized]);
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const clearSymptoms = () => {
    setSelectedSymptoms([]);
  };

  const addCause = (cause: Omit<Cause, 'id'>) => {
    const newCause: Cause = { ...cause, id: crypto.randomUUID() };
    setCauses(prev => [...prev, newCause]);
    toast({ title: "Cause Added", description: `${newCause.name} added to database.` });
  };

  const updateCause = (id: string, updates: Partial<Cause>) => {
    setCauses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast({ title: "Cause Updated", description: "Changes saved successfully." });
  };

  const deleteCause = (id: string) => {
    setCauses(prev => prev.filter(c => c.id !== id));
    toast({ title: "Cause Deleted", variant: "destructive" });
  };

  const resetDatabase = () => {
    setCauses(INITIAL_CAUSES);
    setSelectedSymptoms([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Reset Complete", description: "Database restored to defaults." });
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const schema = z.array(causeSchema);
      const validated = schema.parse(parsed);
      
      setCauses(validated);
      toast({ title: "Import Successful", description: `${validated.length} causes loaded.` });
      return true;
    } catch (e) {
      toast({ 
        title: "Import Failed", 
        description: "Invalid JSON format or schema.", 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    causes,
    selectedSymptoms,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    addCause,
    updateCause,
    deleteCause,
    resetDatabase,
    importData,
    canUndo: false
  };
}
