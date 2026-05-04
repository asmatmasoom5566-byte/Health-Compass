import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Heart, 
  Activity, 
  Droplets,
  AlertTriangle,
  CheckCircle,
  Info,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClinicalCalculatorsProps {
  className?: string;
}

export function ClinicalCalculators({ className }: ClinicalCalculatorsProps) {
  const [activeCalculator, setActiveCalculator] = useState('cha2ds2');
  
  return (
    <Card className={cn("border border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Clinical Calculators
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Medical calculators and risk assessment tools
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCalculator === 'cha2ds2' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCalculator('cha2ds2')}
            className="gap-2"
          >
            <Heart className="w-4 h-4" />
            CHA2DS2-VASc
          </Button>
          <Button
            variant={activeCalculator === 'curb65' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCalculator('curb65')}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            CURB-65
          </Button>
          <Button
            variant={activeCalculator === 'phq9' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCalculator('phq9')}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            PHQ-9
          </Button>
          <Button
            variant={activeCalculator === 'gad7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCalculator('gad7')}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            GAD-7
          </Button>
          <Button
            variant={activeCalculator === 'hdrs17' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCalculator('hdrs17')}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            HDRS-17
          </Button>
        </div>

        {activeCalculator === 'cha2ds2' && <CHA2DS2Calculator />}
        {activeCalculator === 'curb65' && <CURB65Calculator />}
        {activeCalculator === 'phq9' && <PHQ9Calculator />}
        {activeCalculator === 'gad7' && <GAD7Calculator />}
        {activeCalculator === 'hdrs17' && <HDRS17Calculator />}
      </CardContent>
    </Card>
  );
}


function CHA2DS2Calculator() {
  const [congestiveHeartFailure, setCongestiveHeartFailure] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [age75, setAge75] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [stroke, setStroke] = useState(false);
  const [vascularDisease, setVascularDisease] = useState(false);
  const [age65, setAge65] = useState(false);
  const [sexCategory, setSexCategory] = useState<'male' | 'female'>('male');
  
  const calculateScore = () => {
    let score = 0;
    if (congestiveHeartFailure) score += 1;
    if (hypertension) score += 1;
    if (age75) score += 2;
    if (diabetes) score += 1;
    if (stroke) score += 2;
    if (vascularDisease) score += 1;
    if (age65 && !age75) score += 1;
    if (sexCategory === 'female') score += 1;
    return score;
  };
  
  const score = calculateScore();
  const riskLevel = score === 0 ? 'Low' : score <= 2 ? 'Moderate' : 'High';
  const anticoagulation = score >= 2 ? 'Recommended' : score === 1 ? 'Consider' : 'Not recommended';
  
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>CHF/LV dysfunction</Label>
          <Button
            variant={congestiveHeartFailure ? "default" : "outline"}
            size="sm"
            onClick={() => setCongestiveHeartFailure(!congestiveHeartFailure)}
          >
            {congestiveHeartFailure ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Hypertension</Label>
          <Button
            variant={hypertension ? "default" : "outline"}
            size="sm"
            onClick={() => setHypertension(!hypertension)}
          >
            {hypertension ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Age ≥ 75 years</Label>
          <Button
            variant={age75 ? "default" : "outline"}
            size="sm"
            onClick={() => setAge75(!age75)}
          >
            {age75 ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Diabetes mellitus</Label>
          <Button
            variant={diabetes ? "default" : "outline"}
            size="sm"
            onClick={() => setDiabetes(!diabetes)}
          >
            {diabetes ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Stroke/TIA/thromboembolism</Label>
          <Button
            variant={stroke ? "default" : "outline"}
            size="sm"
            onClick={() => setStroke(!stroke)}
          >
            {stroke ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Vascular disease</Label>
          <Button
            variant={vascularDisease ? "default" : "outline"}
            size="sm"
            onClick={() => setVascularDisease(!vascularDisease)}
          >
            {vascularDisease ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Age 65-74 years</Label>
          <Button
            variant={age65 ? "default" : "outline"}
            size="sm"
            onClick={() => setAge65(!age65)}
          >
            {age65 ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Sex category</Label>
          <Select value={sexCategory} onValueChange={(v: 'male' | 'female') => setSexCategory(v)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">CHA2DS2-VASc Score:</span>
          <Badge variant="secondary" className="text-lg">{score}</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Risk Level:</span>
          <Badge 
            variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Moderate' ? 'default' : 'secondary'}
          >
            {riskLevel}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Anticoagulation:</span>
          <Badge 
            variant={anticoagulation === 'Recommended' ? 'default' : anticoagulation === 'Consider' ? 'secondary' : 'outline'}
          >
            {anticoagulation}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Risk Categories:</div>
          <div>• Score 0: Low risk (0.6% annual stroke risk)</div>
          <div>• Score 1: Moderate risk (2.8% annual stroke risk)</div>
          <div>• Score ≥ 2: High risk (4.0% annual stroke risk)</div>
        </div>
      </div>
    </div>
  );
}


function CURB65Calculator() {
  const [confusion, setConfusion] = useState(false);
  const [urea, setUrea] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [age65, setAge65] = useState(false);
  
  const calculateScore = () => {
    let score = 0;
    if (confusion) score += 1;
    if (age65) score += 1;
    
    const ureaValue = parseFloat(urea);
    if (!isNaN(ureaValue) && ureaValue >= 7) score += 1;
    
    const rrValue = parseFloat(respiratoryRate);
    if (!isNaN(rrValue) && rrValue >= 30) score += 1;
    
    const bpValue = parseFloat(bloodPressure);
    if (!isNaN(bpValue) && bpValue < 90) score += 1;
    
    return score;
  };
  
  const score = calculateScore();
  const riskLevel = score === 0 ? 'Low' : score <= 2 ? 'Moderate' : 'High';
  const management = score === 0 ? 'Outpatient' : score <= 2 ? 'Consider admission' : 'Hospitalize';
  
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>New confusion/disorientation</Label>
          <Button
            variant={confusion ? "default" : "outline"}
            size="sm"
            onClick={() => setConfusion(!confusion)}
          >
            {confusion ? 'Yes' : 'No'}
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="urea">Blood urea nitrogen (mmol/L)</Label>
          <Input
            id="urea"
            type="number"
            value={urea}
            onChange={(e) => setUrea(e.target.value)}
            placeholder="e.g., 8.5"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="respiratory">Respiratory rate (breaths/min)</Label>
          <Input
            id="respiratory"
            type="number"
            value={respiratoryRate}
            onChange={(e) => setRespiratoryRate(e.target.value)}
            placeholder="e.g., 25"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bp">Systolic BP (mmHg)</Label>
          <Input
            id="bp"
            type="number"
            value={bloodPressure}
            onChange={(e) => setBloodPressure(e.target.value)}
            placeholder="e.g., 85"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Age ≥ 65 years</Label>
          <Button
            variant={age65 ? "default" : "outline"}
            size="sm"
            onClick={() => setAge65(!age65)}
          >
            {age65 ? 'Yes' : 'No'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">CURB-65 Score:</span>
          <Badge variant="secondary" className="text-lg">{score}</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Risk Level:</span>
          <Badge 
            variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Moderate' ? 'default' : 'secondary'}
          >
            {riskLevel}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Management:</span>
          <Badge 
            variant={management === 'Hospitalize' ? 'destructive' : management === 'Consider admission' ? 'default' : 'secondary'}
          >
            {management}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Risk Categories:</div>
          <div>• Score 0: Low risk (1.5% mortality)</div>
          <div>• Score 1-2: Moderate risk (9.2% mortality)</div>
          <div>• Score 3-5: High risk (50% mortality)</div>
        </div>
      </div>
    </div>
  );
}

function PHQ9Calculator() {
  const [scores, setScores] = useState<number[]>(Array(9).fill(0));
  
  const criteria = [
    'ANHEDONIA (Little Interest or Pleasure In Previously Pleasurable Activities)',
    'LOW MOOD (Feeling Down, Depressed, or Hopeless)',
    'SLEEP CHANGES (Trouble falling or Staying asleep, or Sleeping too much)',
    'FATIGUE (Feeling tired or having little energy)',
    'ANOREXIA or OVEREATING',
    'LOW SELF-ESTEEM, GUILT, or SELF-BLAME (Feeling bad about self, Feeling like failure or having let self or others down)',
    'COGNITIVE DIFFICULTY OR POOR FOCUS (Difficulty focusing attention or making decisions)',
    'PSYCHOMOTOR RETARDATION OR AGITATION (Moving or speaking so slowly that others could have noticed, or being so fidgety or restless that it\'s hard to sit still)',
    'SUICIDAL IDEATION OR SELF-HARM THOUGHTS (Thoughts of ending life or harming self, even if would not act on them)'
  ];
  
  const descriptions = [
    "Example: Activities like listening to music, gardening, using social media, or going for walks feel boring or pointless.\n0 = Enjoys usual activities\n1 = Several days\n2 = More than half the days\n3 = Nearly every day: Avoids almost everything daily",
    "Example: Feeling emotionally heavy, frequent crying spells, or belief that nothing will improve.\n0 = Mood is generally best\n1 = Some days feeling low\n2 = Feel depressed many days\n3 = Feeling depressed nearly every day",
    "Example: Takes hours to fall asleep, wakes up early without reason, or sleeps excessively but still feels tired.\n0 = Normal sleep\n1 = Occasional sleep changes\n2 = Sleep issues most nights\n3 = Severe sleep disturbance most nights",
    "Example: Waking up feeling drained, avoiding chores due to tiredness, needing long rest breaks.\n0 = Feels energetic\n1 = Tired some days\n2 = Fatigue on most days\n3 = Fatigue every day",
    "Example: Skipping meals due to lack of hunger, or eating large quantities without appetite.\n0 = Normal eating habits\n1 = Occasional appetite change\n2 = Eating changes noticeable most days\n3 = Appetite changes nearly every day",
    "Example: Repeated thoughts like I'm not good enough, or guilt for small mistakes.\n0 = Feels okay about self\n1 = Rare guilt or self-doubt\n2 = Negative self-perception most days\n3 = Persistent feelings of worthlessness",
    "Example: Hard to follow what you're reading or watching TV because mind wanders.\n0 = Normal concentration\n1 = Some difficulty focusing\n2 = Noticeable concentration issues most days\n3 = Inability to concentrate daily",
    "Example: Speech and movement slowed down noticeably, or restlessness with constant pacing, tapping, or shifting.\n0 = Normal movement/speed\n1 = Some days slight slowness or restlessness\n2 = Noticeable psychomotor changes most days\n3 = Obvious and constant changes in speed or restlessness",
    "Example: Thoughts that you would be better off dead or of hurting yourself in some way.\n0 = No such thoughts\n1 = Rare, occasional thoughts\n2 = Frequent thoughts without plans\n3 = Persistent or daily thoughts of death/self-harm"
  ];
  
  const calculateTotal = () => {
    return scores.reduce((sum, score) => sum + score, 0);
  };
  
  const updateScore = (index: number, value: number) => {
    const newScores = [...scores];
    newScores[index] = value;
    setScores(newScores);
  };
  
  const totalScore = calculateTotal();
  const severity = totalScore <= 4 ? 'Minimal or none' : 
                  totalScore <= 9 ? 'Mild depression' : 
                  totalScore <= 14 ? 'Moderate depression' : 
                  totalScore <= 19 ? 'Moderately severe depression' : 'Severe depression';
  
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="text-sm text-muted-foreground mb-4">
        PATIENT HEALTH QUESTIONNAIRE-9 (PHQ-9)
        <br />
        Over the last 2 weeks, how often have you been bothered by the following problems?
      </div>
      
      {criteria.map((item, index) => (
        <div key={index} className="space-y-2 p-3 bg-background/50 rounded-lg">
          <Label className="font-medium">{index + 1}. {item}</Label>
          <div className="text-xs text-muted-foreground mb-1">{descriptions[index]}</div>
          <div className="flex gap-2 flex-wrap">
            {['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((option, optIndex) => (
              <Button
                key={optIndex}
                variant={scores[index] === optIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateScore(index, optIndex)}
                className="text-xs"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      ))}
      
      <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">PHQ-9 Total Score:</span>
          <Badge variant="secondary" className="text-lg">{totalScore}/27</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Severity:</span>
          <Badge 
            variant={severity === 'Minimal or none' ? 'secondary' : 
                    severity === 'Mild depression' ? 'outline' : 
                    severity === 'Moderate depression' ? 'default' : 
                    severity === 'Moderately severe depression' ? 'destructive' : 'destructive'}
          >
            {severity}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Scoring Severity:</div>
          <div>• Minimal or none (0–4)</div>
          <div>• Mild depression (5–9)</div>
          <div>• Moderate depression (10–14)</div>
          <div>• Moderately severe depression (15–19)</div>
          <div>• Severe depression (20–27)</div>
        </div>
      </div>
    </div>
  );
}

function HDRS17Calculator() {
  const [scores, setScores] = useState<number[]>(Array(17).fill(0));
  
  const criteria = [
    'DEPRESSED MOOD (Sadness, Hopelessness, Helplessness, and Tearfulness)',
    'FEELINGS OF GUILT (Self-reproach to delusional guilt)',
    'SUICIDE (Suicidal ideation or attempts)',
    'INSOMNIA – Early (Difficulty initiating sleep)',
    'INSOMNIA – Middle (Waking during the night)',
    'INSOMNIA – Late (Waking early morning than desired and unable to go back to sleep)',
    'WORK AND ACTIVITIES (Loss of interest, Productivity, Anhedonia)',
    'PSYCHOMOTOR RETARDATION (Slowing of Movements, Speech, and Thinking)',
    'AGITATION (Restlessness, Fidgeting, Pacing)',
    'PSYCHIC ANXIETY (Internal tension, Worry)',
    'SOMATIC ANXIETY (Physical symptoms of anxiety such as Palpitations, Sweating, GI upset)',
    'Gastrointestinal Symptoms (Anorexia, Nausea, Constipation)',
    'General Somatic Symptoms (Fatigue, Body aches)',
    'Genital Symptoms (Loss of libido, Sexual dysfunction)',
    'Hypochondriasis (Excessive concern about health or Illness)',
    'Weight Loss (Over past 1–2 weeks)',
    'Insight (Understanding of illness)'
  ];
  
  const descriptions = [
    "0 = Absent\n1 = Sadness but no crying\n2 = Sad most of the day, occasionally crying\n3 = Frequent crying, hopelessness\n4 = Persistent sadness, can't control crying, profound hopelessness",
    "0 = None\n1 = Mild guilt or self-reproach\n2 = Repeated guilt or rumination about past failures\n3 = Delusional guilt, irrational self-blame\n4 = Fixed guilt ideas or religious/moral delusion",
    "0 = Absent\n1 = Feels life is not worth living\n2 = Wishes to be dead or suicidal thoughts without plan\n3 = Suicidal ideation with plan\n4 = Suicide attempts or definite plans",
    "0 = No trouble\n1 = Takes >30 mins to fall asleep\n2 = Severe delay, often awake for hours",
    "0 = None\n1 = Occasional waking, returns to sleep\n2 = Frequent waking, difficulty to sleep again",
    "0 = Sleeps until desired time\n1 = Wakes early but sometimes falls back asleep\n2 = Wakes >1 hour early, cannot return to sleep",
    "0 = Normal functioning\n1 = Slight decrease in productivity or interest\n2 = Clearly reduced productivity or interest\n3 = Hard to initiate work or activities\n4 = Totally inactive or bedridden",
    "0 = Normal\n1 = Slightly slowing of movements or speech\n2 = Noticeable delay in response\n3 = Marked retardation, monotone speech\n4 = Severe retardation, patient very slow or mute",
    "0 = Calm\n1 = Slight restlessness\n2 = Shifting, can't sit still\n3 = Pacing or hand-wringing\n4 = Severe agitation, pulling hair/clothes",
    "0 = None\n1 = Mild tension\n2 = Frequent worries, can't relax\n3 = Near panic or very anxious\n4 = Constant, unrelieved anxiety",
    "0 = None\n1 = Mild (sweaty palms, dry mouth)\n2 = Moderate (tremor, tachycardia)\n3 = Severe interference\n4 = Incapacitating physical symptoms",
    "0 = None\n1 = Anorexia\n2 = Marked anorexia, nausea, or stomach pain",
    "0 = None\n1 = Mild fatigue\n2 = Severe tiredness, generalized aches",
    "0 = Normal libido\n1 = Reduced interest\n2 = Complete loss of libido, sexual dysfunction",
    "0 = None\n1 = Occasional worry\n2 = Frequent concerns, seeks reassurance\n3 = Persistent worry, despite reassurance\n4 = Delusional belief of serious illness",
    "0 = No loss\n1 = 1-2 kg loss\n2 = >2 kg loss",
    "0 = Full insight, acknowledges illness, need for treatment\n1 = Partial insight, doubts but somewhat aware\n2 = Denies illness or blames others"
  ];
  
  const maxScores = [4, 4, 4, 2, 2, 2, 4, 4, 4, 4, 4, 2, 2, 2, 4, 2, 2]; // Max scores for each item
  
  const calculateTotal = () => {
    return scores.reduce((sum, score) => sum + score, 0);
  };
  
  const updateScore = (index: number, value: number) => {
    const newScores = [...scores];
    newScores[index] = value;
    setScores(newScores);
  };
  
  const totalScore = calculateTotal();
  const severity = totalScore <= 7 ? 'Normal' : 
                  totalScore <= 13 ? 'Mild depression' : 
                  totalScore <= 18 ? 'Moderate depression' : 
                  totalScore <= 22 ? 'Severe depression' : 'Very severe depression';
  
  const responseStatus = totalScore <= 7 ? 'Remission' :
                        totalScore <= 13 ? 'Response' :
                        totalScore <= 18 ? 'Partial Response' : 'Non-response';
  
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="text-sm text-muted-foreground mb-4">
        HAMILTON DEPRESSION RATING SCALE (HDRS-17)
        <br />
        Rate the severity of symptoms over the past week:
      </div>
      
      {criteria.map((item, index) => (
        <div key={index} className="space-y-2 p-3 bg-background/50 rounded-lg">
          <Label className="font-medium">{index + 1}. {item}</Label>
          <div className="text-xs text-muted-foreground mb-1">{descriptions[index]}</div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({length: maxScores[index] + 1}, (_, optIndex) => (
              <Button
                key={optIndex}
                variant={scores[index] === optIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateScore(index, optIndex)}
                className="text-xs"
              >
                {optIndex}
              </Button>
            ))}
          </div>
        </div>
      ))}
      
      <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">HDRS-17 Total Score:</span>
          <Badge variant="secondary" className="text-lg">{totalScore}/52</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Severity:</span>
          <Badge 
            variant={severity === 'Normal' ? 'secondary' : 
                    severity === 'Mild depression' ? 'outline' : 
                    severity === 'Moderate depression' ? 'default' : 
                    severity === 'Severe depression' ? 'destructive' : 'destructive'}
          >
            {severity}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Treatment Status:</span>
          <Badge 
            variant={responseStatus === 'Remission' ? 'secondary' : 
                    responseStatus === 'Response' ? 'outline' : 
                    responseStatus === 'Partial Response' ? 'default' : 'destructive'}
          >
            {responseStatus}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Interpretation:</div>
          <div>• Normal (0–7)</div>
          <div>• Mild depression (8–13)</div>
          <div>• Moderate depression (14–18)</div>
          <div>• Severe depression (19–22)</div>
          <div>• Very severe depression (≥23)</div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1 mt-2">
          <div className="font-medium">Treatment Response:</div>
          <div>• Remission: Score ≤7</div>
          <div>• Response: ≥50% reduction from baseline</div>
          <div>• Partial Response: 25–49% reduction</div>
          <div>• Non-response: &lt;25% reduction</div>
        </div>
      </div>
    </div>
  );
}

function GAD7Calculator() {
  const [scores, setScores] = useState<number[]>(Array(7).fill(0));
  
  const calculateTotal = () => {
    return scores.reduce((sum, score) => sum + score, 0);
  };
  
  const updateScore = (index: number, value: number) => {
    const newScores = [...scores];
    newScores[index] = value;
    setScores(newScores);
  };
  
  const totalScore = calculateTotal();
  const severity = totalScore === 0 ? 'None' : 
                  totalScore <= 4 ? 'Minimal' : 
                  totalScore <= 9 ? 'Mild' : 
                  totalScore <= 14 ? 'Moderate' : 'Severe';
  
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="text-sm text-muted-foreground mb-4">
        Over the last 2 weeks, how often have you been bothered by the following problems?
      </div>
      
      {[
        'Feeling nervous, anxious, or on edge',
        'Not being able to stop or control worrying',
        'Worrying too much about different things',
        'Trouble relaxing',
        'Being so restless that it is hard to sit still',
        'Becoming easily annoyed or irritable',
        'Feeling afraid as if something awful might happen'
      ].map((item, index) => (
        <div key={index} className="space-y-2 p-3 bg-background/50 rounded-lg">
          <Label className="font-medium">{index + 1}. {item}</Label>
          <div className="flex gap-2 flex-wrap">
            {['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((option, optIndex) => (
              <Button
                key={optIndex}
                variant={scores[index] === optIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateScore(index, optIndex)}
                className="text-xs"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      ))}
      
      <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">GAD-7 Total Score:</span>
          <Badge variant="secondary" className="text-lg">{totalScore}/21</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Severity:</span>
          <Badge 
            variant={severity === 'None' ? 'secondary' : 
                    severity === 'Minimal' ? 'outline' : 
                    severity === 'Mild' ? 'default' : 
                    severity === 'Moderate' ? 'destructive' : 'destructive'}
          >
            {severity}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Recommendation:</div>
          <div>• 0-4: Monitor</div>
          <div>• 5-9: Consider therapy</div>
          <div>• 10+: Further evaluation recommended</div>
        </div>
      </div>
    </div>
  );
}