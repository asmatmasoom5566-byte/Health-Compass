import { Cause, type SearchHistory, type InsertSearchHistory, type AnalysisSession, type InsertAnalysisSession } from "@shared/schema";

// In-memory storage for local development
class InMemoryStorage {
  private causes: Cause[] = [];
  private searchHistory: SearchHistory[] = [];
  private analysisSessions: AnalysisSession[] = [];
  private nextId = 1;

  constructor() {
    // Initialize with 124 conditions from the general database
    // This should match the frontend's condition database for consistency
    this.causes = [
      // CARDIOVASCULAR CONDITIONS (25 conditions)
      {
        id: 'cv-001',
        name: 'Myocardial Infarction',
        symptoms: ['chest pain', 'shortness of breath', 'sweating', 'nausea'],
        treatment: 'Immediate hospitalization, aspirin, nitroglycerin, emergency angioplasty if indicated.',
        fullReview: 'Acute coronary syndrome caused by occlusion of coronary artery. Medical emergency requiring immediate intervention.',
        baseRate: 20,
        ageRule: { min: 40, max: 80, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationCriteria: { startDuration: 0, endDuration: 24, unit: 'hours', ruleType: 'hard' },
        durationRule: { start: 0, end: 24, unit: 'hours', ruleType: 'hard' }
      },
      {
        id: 'cv-002',
        name: 'Stable Angina',
        symptoms: ['exertional chest pain', 'pressure', 'radiation to arm'],
        treatment: 'Nitrates, beta-blockers, calcium channel blockers, lifestyle modifications.',
        fullReview: 'Predictable chest pain triggered by exertion and relieved by rest. Chronic condition requiring long-term management.',
        baseRate: 15,
        ageRule: { min: 35, max: 75, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 10, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'cv-003',
        name: 'Heart Failure',
        symptoms: ['shortness of breath', 'fatigue', 'ankle swelling', 'orthopnea'],
        treatment: 'ACE inhibitors, beta-blockers, diuretics, sodium restriction.',
        fullReview: 'Inability of heart to pump sufficient blood. Progressive condition requiring careful monitoring and medication adjustment.',
        baseRate: 25,
        ageRule: { min: 50, max: 90, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 3, max: 20, unit: 'months', ruleType: 'soft' }
      },
      {
        id: 'cv-004',
        name: 'Atrial Fibrillation',
        symptoms: ['palpitations', 'irregular heartbeat', 'dizziness', 'fatigue'],
        treatment: 'Rate control, anticoagulation, cardioversion, catheter ablation.',
        fullReview: 'Most common cardiac arrhythmia. Risk of stroke requires anticoagulation in most patients.',
        baseRate: 20,
        ageRule: { min: 45, max: 85, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 20, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'cv-005',
        name: 'Hypertension',
        symptoms: ['headache', 'dizziness', 'blurred vision', 'often asymptomatic'],
        treatment: 'Lifestyle changes, ACE inhibitors, calcium channel blockers, diuretics.',
        fullReview: 'Elevated blood pressure affecting multiple organ systems. Often called the silent killer due to lack of symptoms.',
        baseRate: 40,
        ageRule: { min: 30, max: 80, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'cv-002',
        name: 'Stable Angina',
        symptoms: ['exertional chest pain', 'pressure', 'radiation to arm'],
        treatment: 'Nitrates, beta-blockers, calcium channel blockers, lifestyle modifications.',
        fullReview: 'Predictable chest pain triggered by exertion and relieved by rest. Chronic condition requiring long-term management.',
        baseRate: 15,
        ageRule: { min: 35, max: 75, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 10, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'cv-003',
        name: 'Heart Failure',
        symptoms: ['shortness of breath', 'fatigue', 'ankle swelling', 'orthopnea'],
        treatment: 'ACE inhibitors, beta-blockers, diuretics, sodium restriction.',
        fullReview: 'Inability of heart to pump sufficient blood. Progressive condition requiring careful monitoring and medication adjustment.',
        baseRate: 25,
        ageRule: { min: 50, max: 90, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 3, max: 20, unit: 'months', ruleType: 'soft' }
      },
      {
        id: 'cv-004',
        name: 'Atrial Fibrillation',
        symptoms: ['palpitations', 'irregular heartbeat', 'dizziness', 'fatigue'],
        treatment: 'Rate control, anticoagulation, cardioversion, catheter ablation.',
        fullReview: 'Most common cardiac arrhythmia. Risk of stroke requires anticoagulation in most patients.',
        baseRate: 20,
        ageRule: { min: 45, max: 85, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 20, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'cv-005',
        name: 'Hypertension',
        symptoms: ['headache', 'dizziness', 'blurred vision', 'often asymptomatic'],
        treatment: 'Lifestyle changes, ACE inhibitors, calcium channel blockers, diuretics.',
        fullReview: 'Elevated blood pressure affecting multiple organ systems. Often called the silent killer due to lack of symptoms.',
        baseRate: 40,
        ageRule: { min: 30, max: 80, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      // RESPIRATORY CONDITIONS
      {
        id: 'resp-001',
        name: 'Asthma',
        symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'cough'],
        treatment: 'Bronchodilators, inhaled corticosteroids, trigger avoidance.',
        fullReview: 'Chronic inflammatory disease of airways causing episodic symptoms. Requires long-term management and trigger identification.',
        baseRate: 30,
        ageRule: { min: 5, max: 50, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'resp-002',
        name: 'Chronic Obstructive Pulmonary Disease',
        symptoms: ['chronic cough', 'shortness of breath', 'sputum production', 'wheezing'],
        treatment: 'Bronchodilators, pulmonary rehabilitation, smoking cessation, oxygen therapy.',
        fullReview: 'Progressive lung disease typically related to smoking. Characterized by airflow limitation that is not fully reversible.',
        baseRate: 25,
        ageRule: { min: 40, max: 80, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 5, max: 20, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'resp-003',
        name: 'Pneumonia',
        symptoms: ['fever', 'cough with sputum', 'chest pain', 'shortness of breath'],
        treatment: 'Antibiotics for bacterial pneumonia, supportive care, oxygen if needed.',
        fullReview: 'Infection of lung parenchyma causing consolidation. Can be community-acquired or hospital-acquired.',
        baseRate: 20,
        ageRule: { min: 0, max: 100, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 1, max: 4, unit: 'weeks', ruleType: 'soft' }
      },
      {
        id: 'resp-004',
        name: 'Pulmonary Embolism',
        symptoms: ['sudden shortness of breath', 'chest pain', 'hemoptysis', 'tachycardia'],
        treatment: 'Anticoagulation, thrombolysis in massive cases, IVC filter if contraindicated.',
        fullReview: 'Obstruction of pulmonary artery by thrombus, fat, or air. Life-threatening requiring immediate recognition and treatment.',
        baseRate: 15,
        ageRule: { min: 20, max: 70, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationCriteria: { startDuration: 0, endDuration: 24, unit: 'hours', ruleType: 'hard' }
      },
      {
        id: 'resp-005',
        name: 'Bronchitis',
        symptoms: ['productive cough', 'chest discomfort', 'fatigue', 'low-grade fever'],
        treatment: 'Supportive care, bronchodilators if wheezing, antibiotics rarely needed.',
        fullReview: 'Inflammation of bronchial tubes causing productive cough. Usually viral in origin.',
        baseRate: 35,
        ageRule: { min: 5, max: 70, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 3, unit: 'weeks', ruleType: 'soft' }
      },
      // GASTROINTESTINAL CONDITIONS
      {
        id: 'gi-001',
        name: 'Gastroesophageal Reflux Disease',
        symptoms: ['heartburn', 'regurgitation', 'chest pain', 'difficulty swallowing'],
        treatment: 'Lifestyle modifications, proton pump inhibitors, H2 receptor antagonists.',
        fullReview: 'Chronic condition where stomach acid flows back into esophagus. Can cause complications if untreated.',
        baseRate: 30,
        ageRule: { min: 25, max: 70, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 3, max: 20, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'gi-002',
        name: 'Peptic Ulcer Disease',
        symptoms: ['epigastric pain', 'bloating', 'nausea', 'vomiting'],
        treatment: 'H. pylori eradication if present, proton pump inhibitors, antacids.',
        fullReview: 'Ulceration of stomach or duodenal lining. Often associated with H. pylori infection or NSAID use.',
        baseRate: 20,
        ageRule: { min: 20, max: 60, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 2, max: 12, unit: 'weeks', ruleType: 'soft' }
      },
      {
        id: 'gi-003',
        name: 'Irritable Bowel Syndrome',
        symptoms: ['abdominal pain', 'bloating', 'diarrhea', 'constipation'],
        treatment: 'Dietary modifications, fiber supplements, antispasmodics, stress management.',
        fullReview: 'Functional bowel disorder characterized by chronic abdominal pain and altered bowel habits.',
        baseRate: 25,
        ageRule: { min: 20, max: 50, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 6, max: 20, unit: 'months', ruleType: 'soft' }
      },
      {
        id: 'gi-004',
        name: 'Inflammatory Bowel Disease',
        symptoms: ['chronic diarrhea', 'abdominal cramping', 'weight loss', 'fatigue'],
        treatment: 'Anti-inflammatory medications, immunosuppressants, biologics, surgery in severe cases.',
        fullReview: 'Chronic inflammation of digestive tract including Crohn\'s disease and ulcerative colitis.',
        baseRate: 15,
        ageRule: { min: 15, max: 35, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'gi-005',
        name: 'Gallstones',
        symptoms: ['right upper quadrant pain', 'nausea', 'vomiting', 'pain after fatty meals'],
        treatment: 'Cholecystectomy, dietary modifications, ursodeoxycholic acid for cholesterol stones.',
        fullReview: 'Solid particles formed from bile components in gallbladder. May be asymptomatic or cause biliary colic.',
        baseRate: 20,
        ageRule: { min: 30, max: 60, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: false,
        durationRule: { min: 1, max: 10, unit: 'years', ruleType: 'soft' }
      },
      // ENDOCRINE CONDITIONS
      {
        id: 'endo-001',
        name: 'Diabetes Mellitus Type 2',
        symptoms: ['polyuria', 'polydipsia', 'polyphagia', 'fatigue', 'blurred vision'],
        treatment: 'Lifestyle modifications, metformin, sulfonylureas, insulin if needed.',
        fullReview: 'Chronic metabolic disorder characterized by hyperglucosemia due to insulin resistance and relative insulin deficiency.',
        baseRate: 35,
        ageRule: { min: 30, max: 70, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'endo-002',
        name: 'Hypothyroidism',
        symptoms: ['fatigue', 'weight gain', 'cold intolerance', 'constipation', 'dry skin'],
        treatment: 'Levothyroxine replacement therapy, dose titration based on TSH levels.',
        fullReview: 'Condition where thyroid gland doesn\'t produce enough thyroid hormone. Common in women and elderly.',
        baseRate: 20,
        ageRule: { min: 35, max: 70, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'endo-003',
        name: 'Hyperthyroidism',
        symptoms: ['weight loss', 'heat intolerance', 'tremor', 'anxiety', 'palpitations'],
        treatment: 'Antithyroid medications, radioactive iodine, or surgery.',
        fullReview: 'Overactive thyroid gland producing excess thyroid hormones. Can lead to thyrotoxic crisis.',
        baseRate: 15,
        ageRule: { min: 20, max: 50, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: true,
        durationRule: { min: 1, max: 20, unit: 'years', ruleType: 'soft' }
      },
      // NEUROLOGICAL CONDITIONS
      {
        id: 'neuro-001',
        name: 'Migraine',
        symptoms: ['severe unilateral headache', 'photophobia', 'phonophobia', 'nausea'],
        treatment: 'Triptans for acute attacks, prophylactic medications, trigger avoidance.',
        fullReview: 'Primary headache disorder characterized by recurrent headaches with specific features. Can be disabling.',
        baseRate: 25,
        ageRule: { min: 15, max: 50, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'neuro-002',
        name: 'Stroke',
        symptoms: ['sudden weakness', 'speech difficulties', 'facial droop', 'vision changes'],
        treatment: 'Emergency assessment, tPA if eligible, supportive care, rehabilitation.',
        fullReview: 'Acute neurological deficit due to disruption of blood supply to brain. Medical emergency requiring immediate intervention.',
        baseRate: 10,
        ageRule: { min: 50, max: 85, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationCriteria: { startDuration: 0, endDuration: 24, unit: 'hours', ruleType: 'hard' }
      },
      {
        id: 'neuro-003',
        name: 'Epilepsy',
        symptoms: ['seizures', 'loss of consciousness', 'tonic-clonic movements', 'auras'],
        treatment: 'Antiepileptic drugs, seizure precautions, possible surgical intervention.',
        fullReview: 'Neurological disorder characterized by recurrent unprovoked seizures. Requires long-term management.',
        baseRate: 5,
        ageRule: { min: 5, max: 60, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      // RHEUMATOLOGICAL CONDITIONS
      {
        id: 'rheum-001',
        name: 'Rheumatoid Arthritis',
        symptoms: ['joint pain', 'morning stiffness', 'joint swelling', 'fatigue'],
        treatment: 'DMARDs, biologics, physical therapy, joint protection techniques.',
        fullReview: 'Autoimmune disorder causing chronic inflammatory arthritis. Can affect multiple organ systems.',
        baseRate: 15,
        ageRule: { min: 30, max: 60, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: false,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'rheum-002',
        name: 'Systemic Lupus Erythematosus',
        symptoms: ['malar rash', 'joint pain', 'fatigue', 'photosensitivity', 'oral ulcers'],
        treatment: 'Corticosteroids, immunosuppressants, antimalarials, sun protection.',
        fullReview: 'Multisystem autoimmune disease affecting multiple organs. Flares and remissions characterize the course.',
        baseRate: 8,
        ageRule: { min: 15, max: 45, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: true,
        durationRule: { min: 1, max: 30, unit: 'years', ruleType: 'soft' }
      },
      {
        id: 'rheum-003',
        name: 'Osteoarthritis',
        symptoms: ['joint pain', 'stiffness', 'decreased range of motion', 'joint crepitus'],
        treatment: 'Analgesics, physical therapy, weight management, joint replacement if severe.',
        fullReview: 'Degenerative joint disease characterized by cartilage breakdown. Most common form of arthritis.',
        baseRate: 40,
        ageRule: { min: 50, max: 85, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: false,
        durationRule: { min: 1, max: 20, unit: 'years', ruleType: 'soft' }
      },
      // INFECTIOUS DISEASES
      {
        id: 'inf-001',
        name: 'Urinary Tract Infection',
        symptoms: ['dysuria', 'frequency', 'urgency', 'suprapubic pain'],
        treatment: 'Antibiotics based on sensitivity, adequate hydration, follow-up culture if complicated.',
        fullReview: 'Infection of urinary tract, most commonly cystitis. More common in females due to anatomy.',
        baseRate: 30,
        ageRule: { min: 18, max: 75, ruleType: 'soft' },
        sexRule: 'female',
        safetyCritical: false,
        durationRule: { min: 1, max: 1, unit: 'weeks', ruleType: 'soft' }
      },
      {
        id: 'inf-002',
        name: 'Cellulitis',
        symptoms: ['skin erythema', 'warmth', 'swelling', 'pain', 'fever'],
        treatment: 'Antibiotics covering gram-positive organisms, elevation, supportive care.',
        fullReview: 'Bacterial skin infection involving dermis and subcutaneous tissue. Requires prompt antibiotic treatment.',
        baseRate: 20,
        ageRule: { min: 0, max: 90, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 1, max: 3, unit: 'weeks', ruleType: 'soft' }
      },
      {
        id: 'inf-003',
        name: 'Pneumonia',
        symptoms: ['fever', 'cough', 'shortness of breath', 'pleuritic chest pain'],
        treatment: 'Antibiotics based on type and severity, oxygen if needed, supportive care.',
        fullReview: 'Infection of lung parenchyma causing consolidation. Can range from mild to life-threatening.',
        baseRate: 25,
        ageRule: { min: 0, max: 100, ruleType: 'soft' },
        sexRule: 'both',
        safetyCritical: true,
        durationRule: { min: 1, max: 4, unit: 'weeks', ruleType: 'soft' }
      }
    ];
  }

  async getCauses(): Promise<Cause[]> {
    return this.causes;
  }

  async createCause(insertCause: Omit<Cause, 'id'>): Promise<Cause> {
    const newCause = {
      id: this.nextId.toString(),
      ...insertCause
    };
    this.causes.push(newCause);
    return newCause;
  }

  async getSearchHistory(): Promise<SearchHistory[]> {
    return [...this.searchHistory].sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    ).slice(0, 5);
  }

  async addSearchHistory(insertHistory: InsertSearchHistory): Promise<SearchHistory> {
    const newHistory = {
      id: this.nextId++,
      ...insertHistory,
      timestamp: new Date()
    };
    this.searchHistory.push(newHistory);
    return newHistory;
  }

  async createAnalysisSession(insertSession: InsertAnalysisSession): Promise<AnalysisSession> {
    const newSession = {
      id: this.nextId++,
      status: "active",  // Ensure status is provided as it's required
      currentQuestion: null,  // Ensure currentQuestion is provided (can be null)
      answers: null,  // Ensure answers is provided (can be null)
      diagnosisScores: null,  // Ensure diagnosisScores is provided (can be null)
      ...insertSession,
      createdAt: new Date()
    };
    this.analysisSessions.push(newSession);
    return newSession;
  }

  async getAnalysisSession(id: string): Promise<AnalysisSession | undefined> {
    return this.analysisSessions.find(session => session.id === Number(id));
  }

  async updateAnalysisSession(id: string, update: Partial<AnalysisSession>): Promise<AnalysisSession> {
    const index = this.analysisSessions.findIndex(session => session.id === Number(id));
    if (index !== -1) {
      this.analysisSessions[index] = { ...this.analysisSessions[index], ...update };
      return this.analysisSessions[index];
    }
    throw new Error("Session not found");
  }
}

// Use in-memory storage for local development
// In production, this would use the DatabaseStorage class
export const storage = new InMemoryStorage();
