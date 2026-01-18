import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Tag, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { SearchHistory } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { data: rawHistory = [], isLoading } = useQuery<SearchHistory[]>({
    queryKey: ["/api/search-history"],
  });

  const history = rawHistory.slice(0, 5);

  const copyToClipboard = (id: number, symptoms: string[]) => {
    navigator.clipboard.writeText(symptoms.join(", "));
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Symptoms copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search History</h1>
          <p className="text-muted-foreground">Previous symptom searches and patient queries</p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-4 pr-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24" />
              </Card>
            ))
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border">
              <p className="text-muted-foreground">No search history found.</p>
            </div>
          ) : (
            history.map((item) => (
              <Card key={item.id} className="hover-elevate transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.timestamp), "PPP p")}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(item.id, item.symptoms)}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.symptoms.map((symptom, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-primary/5 text-primary text-xs px-2 py-1 rounded-full border border-primary/10"
                      >
                        <Tag className="w-3 h-3" />
                        {symptom}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
