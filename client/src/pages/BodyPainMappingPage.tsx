import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Stethoscope, 
  History, 
  Database, 
  Settings,
  Activity,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Plus,
  RotateCcw,
  User,
  Search
} from 'lucide-react';
import { BodyPainMapping } from '../components/BodyPainMapping';
import { SuggestionList } from '../components/SuggestionList';
import { useSymptomTracker } from '../hooks/use-symptom-tracker';
import { Cause } from '@shared/schema';

export default function BodyPainMappingPage() {
  const { causes, selectedSymptoms, addSymptom, removeSymptom, clearSymptoms } = useSymptomTracker();
  const [selectedCondition, setSelectedCondition] = useState<Cause | null>(null);
  const [painRegions, setPainRegions] = useState<string[]>([]);

  const handlePainRegionsChange = (regions: string[]) => {
    setPainRegions(regions);
  };

  const handleSelectCause = (cause: Cause) => {
    setSelectedCondition(cause);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent text-3xl font-black drop-shadow-lg">
            Body Pain Mapping System
          </h1>
          <p className="text-sm text-muted-foreground">Visualize and analyze pain locations for diagnostic support</p>
        </div>
      </div>

      <Tabs defaultValue="mapping" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mapping" className="gap-2">
            <User className="w-4 h-4" />
            Body Mapping
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Body Mapping Tab */}
        <TabsContent value="mapping" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Body Mapping */}
            <div className="lg:col-span-2 space-y-6">
              <BodyPainMapping 
                onPainRegionsChange={handlePainRegionsChange} 
              />
            </div>

            {/* Right Panel - Suggestions and Details */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-black bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">
                    <Search className="w-5 h-5 text-primary" />
                    Suggested Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SuggestionList 
                    causes={causes.filter(cause => 
                      painRegions.length === 0 || 
                      (cause.painRegions && painRegions.some(region => cause.painRegions?.includes(region)))
                    )}
                    selectedSymptoms={selectedSymptoms}
                    onSelect={handleSelectCause}
                    onAddSymptom={addSymptom}
                    onEdit={(cause) => console.log('Edit cause:', cause)}
                    onDelete={(causeId) => console.log('Delete cause:', causeId)}
                  />
                </CardContent>
              </Card>

              {/* Selected Condition Details */}
              {selectedCondition && (
                <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-black bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      Condition Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-b pb-3">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                          {selectedCondition.name}
                        </h2>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                          Typical Symptoms
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCondition.symptoms && selectedCondition.symptoms.length > 0 ? (
                           selectedCondition.symptoms.map((symptom, index) => {
                           const symptomText = typeof symptom === 'string' ? symptom : (symptom as any).typicalSymptom || '';
                              return (
                                <Badge key={index} variant="secondary" className="text-sm bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800">
                                  {symptomText}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-muted-foreground italic">No typical symptoms listed</p>
                          )}
                        </div>
                      </div>

                      {selectedCondition.atypicalSymptoms && selectedCondition.atypicalSymptoms.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                            Atypical Symptoms
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedCondition.atypicalSymptoms.map((symptom, index) => (
                              <Badge key={index} variant="outline" className="text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}


                      {selectedCondition.treatment && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
                            Treatment
                          </h3>
                          <div className="prose prose-sm max-w-none dark:prose-invert bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                            {selectedCondition.treatment.split('\n').map((paragraph, index) => (
                              <p key={index}>{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCondition.painRegions && selectedCondition.painRegions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                            Associated Pain Regions
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedCondition.painRegions.map((region, index) => (
                              <Badge key={index} variant="outline" className="text-sm bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                                {region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Condition Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Browse and search the comprehensive database of medical conditions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {causes.slice(0, 6).map((cause, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{cause.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cause.symptoms?.slice(0, 3).join(', ') || 'No symptoms listed'}
                      </p>
                      {cause.painRegions && cause.painRegions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {cause.painRegions.slice(0, 2).map((region, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                          {cause.painRegions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{cause.painRegions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Pain Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Most Common Pain Sites</span>
                    <Badge variant="secondary" className="text-lg">
                      {painRegions.length > 0 ? painRegions.length : 'Select pain sites'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Associated Conditions</span>
                    <Badge variant="secondary" className="text-lg">
                      {causes.filter(c => 
                        c.painRegions && painRegions.some(region => c.painRegions?.includes(region))
                      ).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Symptom Matches</span>
                    <Badge variant="secondary" className="text-lg">
                      {selectedSymptoms.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                    <span className="text-sm">Head pain + neck stiffness</span>
                    <span className="text-xs text-muted-foreground">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                    <span className="text-sm">Lower back pain radiating</span>
                    <span className="text-xs text-muted-foreground">15 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                    <span className="text-sm">Chest pain with dyspnea</span>
                    <span className="text-xs text-muted-foreground">1 hour ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Pain Mapping Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Pain Sensitivity</span>
                  <Badge variant="outline">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-Suggest Conditions</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Save Mapping History</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Advanced Visualization</span>
                  <Badge variant="outline">Disabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}