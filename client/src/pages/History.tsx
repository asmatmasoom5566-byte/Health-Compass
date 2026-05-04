import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { 
  Clock, 
  Tag, 
  Copy, 
  Check, 
  Calendar,
  User,
  Activity,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Stethoscope,
  FileText
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { HistorySummary } from "../components/HistorySummary";
import { useSymptomTracker } from "../hooks/use-symptom-tracker";
import { Link } from "wouter";

interface SearchHistory {
  id: number;
  symptoms: string[];
  timestamp: string;
}

export default function History() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SearchHistory | null>(null);
  
  const { data: rawHistory = [], isLoading, refetch } = useQuery<SearchHistory[]>({
    queryKey: ["/api/search-history"],
  });

  const { selectedSymptoms, clinicalHistory } = useSymptomTracker();
  
  // Load current demographics from localStorage
  const [currentDemographics, setCurrentDemographics] = useState({
    age: '' as number | '',
    sex: '' as 'Male' | 'Female' | '',
    duration: '' as number | '',
    durationUnit: '' as 'hours' | 'days' | 'weeks' | 'months' | 'years' | ''
  });
  
  useEffect(() => {
    const storedDemographics = localStorage.getItem('patientDemographics');
    if (storedDemographics) {
      try {
        const parsed = JSON.parse(storedDemographics);
        setCurrentDemographics(parsed);
      } catch (e) {
        console.error('Failed to parse demographics from localStorage', e);
      }
    }
  }, []);
  
  // Load current scored conditions
  const [currentScoredConditions, setCurrentScoredConditions] = useState<any[]>([]);
  
  useEffect(() => {
    const storedScoredConditions = localStorage.getItem('currentScoredConditions');
    if (storedScoredConditions) {
      try {
        const parsed = JSON.parse(storedScoredConditions);
        setCurrentScoredConditions(parsed);
      } catch (e) {
        console.error('Failed to parse scored conditions from localStorage', e);
      }
    }
  }, []);
  
  // Filter history based on search term and date
  const filteredHistory = Array.isArray(rawHistory) 
    ? rawHistory.filter(item => {
        const matchesSearch = !searchTerm || 
          item.symptoms.some((symptom: string) => 
            symptom.toLowerCase().includes(searchTerm.toLowerCase())
          );
        const matchesDate = !dateFilter || 
          format(new Date(item.timestamp), "yyyy-MM-dd") === dateFilter;
        return matchesSearch && matchesDate;
      })
    : [];

  const copyToClipboard = (id: number, symptoms: string[]) => {
    navigator.clipboard.writeText(symptoms.join(", "));
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Symptoms copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(filteredHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `clinical-history-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({ 
      title: "Export Started", 
      description: "Your clinical history is downloading." 
    });
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      // In a real app, this would call an API endpoint
      toast({ 
        title: "History Cleared", 
        description: "All clinical history has been removed.",
        variant: "destructive"
      });
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Clinical History</h1>
                <p className="text-sm text-muted-foreground">Patient records and search documentation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Back to Diagnosis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Current Patient Summary */}
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Current Patient Summary
              </CardTitle>
              <CardDescription>
                Active patient information and current presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistorySummary 
                demographics={currentDemographics}
                chiefComplaints={selectedSymptoms}
                suggestedConditions={currentScoredConditions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

