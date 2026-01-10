import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cause } from "@shared/schema";
import {
  Edit2,
  Trash2,
  AlertCircle,
  Info,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SuggestionListProps {
  causes: Cause[];
  selectedSymptoms: string[];
  onEdit: (cause: Cause) => void;
  onDelete: (id: string) => void;
  onSelect: (cause: Cause) => void;
}

interface ScoredCause extends Cause {
  score: number;
  matchCount: number;
  matchedSymptoms: string[];
}

export function SuggestionList({
  causes,
  selectedSymptoms,
  onEdit,
  onDelete,
}: SuggestionListProps) {
  const [viewingCause, setViewingCause] = useState<ScoredCause | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [chatInput, setChatInput] = useState("");

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/chat/conversations", activeConversationId, "messages"],
    enabled: !!activeConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/conversations", {
        title: `Analysis: ${selectedSymptoms.slice(0, 3).join(", ")}`,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveConversationId(data.id);
      // Automatically send initial analysis prompt
      sendMessage.mutate({
        conversationId: data.id,
        content: `I am experiencing these symptoms: ${selectedSymptoms.join(", ")}. Based on these, can you provide a medical analysis and suggest potential conditions?`,
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: number;
      content: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/chat/conversations/${conversationId}/messages`,
        { content },
      );
      return res.json();
    },
    onSuccess: () => {
      setChatInput("");
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/conversations", activeConversationId, "messages"],
      });
    },
  });

  const handleStartAIAnalysis = () => {
    setIsAIChatOpen(true);
    if (!activeConversationId) {
      createConversation.mutate();
    }
  };

  const scoredCauses = useMemo(() => {
    return causes
      .map((cause) => {
        const matched = cause.symptoms.filter((s) =>
          selectedSymptoms.some((ss) => s.toLowerCase().includes(ss.toLowerCase())),
        );

        let rawScore = 0;
        if (cause.symptoms.length > 0) {
          rawScore = (matched.length / cause.symptoms.length) * 100;
        }

        const weightedScore = rawScore;

        const finalScore =
          selectedSymptoms.length > 0 && matched.length === 0
            ? 0
            : weightedScore;

        return {
          ...cause,
          score: Math.round(finalScore),
          matchCount: matched.length,
          matchedSymptoms: matched,
        } as ScoredCause;
      })
      .sort((a, b) => {
        // Primary sort: Match count (descending)
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount;
        }
        // Secondary sort: Score/Percentage (descending)
        return b.score - a.score;
      })
      .filter((c) => c.matchCount > 0);
  }, [causes, selectedSymptoms]);

  if (selectedSymptoms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
        <div className="bg-muted p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Waiting for input
        </h3>
        <p className="text-muted-foreground mt-2 max-w-xs">
          Enter symptoms on the left to see potential cause suggestions based on
          your database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Matches Found
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-primary hover:text-primary hover:bg-primary/5 border-primary/20"
          onClick={handleStartAIAnalysis}
          disabled={createConversation.isPending}
        >
          {createConversation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          AI Analysis
        </Button>
      </div>

      {scoredCauses.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 rounded-xl">
          <p className="text-muted-foreground">
            No matching causes found in database.
          </p>
        </div>
      ) : (
        scoredCauses.map((cause, index) => (
          <motion.div
            key={cause.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white dark:bg-slate-800 p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3
                  className="text-lg font-bold text-foreground flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setViewingCause(cause)}
                >
                  {cause.name}
                  {cause.matchCount === cause.symptoms.length && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold tracking-wider uppercase">
                      Perfect Match
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Likelihood: {cause.score}%
                </p>
              </div>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingCause(cause)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-3">
              <div>
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
                  Symptoms
                </p>
                <div className="flex flex-wrap gap-1">
                  {cause.symptoms.map((symptom) => {
                    const isMatched = selectedSymptoms.some((ss) =>
                      symptom.toLowerCase().includes(ss.toLowerCase()),
                    );
                    return (
                      <span
                        key={symptom}
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                          isMatched
                            ? "bg-green-100 border-green-200 text-green-700 font-bold dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                            : "bg-muted/30 border-transparent text-muted-foreground/60",
                        )}
                      >
                        {symptom}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                  Symptom Details
                </p>
                <p className="text-[10px] text-foreground leading-relaxed">
                  {cause.details || "No details available."}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                  Atypical Symptoms
                </p>
                <div className="flex flex-wrap gap-1">
                  {cause.atypicalSymptoms?.length ? (
                    cause.atypicalSymptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="text-[9px] px-1.5 py-0.5 rounded border bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
                      >
                        {symptom}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-muted-foreground italic">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                  Note
                </p>
                <p className="text-[10px] text-foreground leading-relaxed">
                  {cause.note || "No note available."}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                  Lab Test
                </p>
                <p className="text-[10px] text-foreground leading-relaxed">
                  {cause.labTest || "No lab tests specified."}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
                  Treatment
                </p>
                <p className="text-[10px] text-foreground leading-relaxed">
                  {cause.treatment || "No treatment specified."}
                </p>
              </div>
            </div>

            <div className="space-y-1 mt-3">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cause.score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-colors duration-500",
                    cause.score > 75
                      ? "bg-gradient-to-r from-green-500 to-green-400"
                      : cause.score > 40
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : "bg-gradient-to-r from-slate-400 to-slate-300",
                  )}
                />
              </div>
            </div>
          </motion.div>
        ))
      )}

      {/* Cause Detail Dialog */}
      <Dialog
        open={!!viewingCause}
        onOpenChange={(open) => !open && setViewingCause(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {viewingCause?.name}
              {viewingCause &&
                viewingCause.matchCount === viewingCause.symptoms.length && (
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold tracking-wider uppercase">
                    Perfect Match
                  </span>
                )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Match Score
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {viewingCause?.score}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  Associated Symptoms
                  <span className="text-xs font-normal text-muted-foreground">
                    ({viewingCause?.matchCount} matches)
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {viewingCause?.symptoms.map((symptom) => {
                    const isMatched = selectedSymptoms.some((ss) =>
                      symptom.toLowerCase().includes(ss.toLowerCase()),
                    );
                    return (
                      <span
                        key={symptom}
                        className={cn(
                          "text-xs px-3 py-1 rounded-full border font-medium transition-colors",
                          isMatched
                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                            : "bg-muted/30 border-transparent text-muted-foreground",
                        )}
                      >
                        {symptom}
                      </span>
                    );
                  })}
                </div>
              </div>

              {viewingCause?.atypicalSymptoms && viewingCause.atypicalSymptoms.length > 0 && (
                <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/10">
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">
                    Atypical Symptoms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {viewingCause.atypicalSymptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="text-xs px-3 py-1 rounded-full border border-purple-200 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400 font-medium"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingCause?.details && (
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                    Condition Details
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {viewingCause.details}
                  </p>
                </div>
              )}

              {viewingCause?.labTest && (
                <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
                    Lab Tests
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {viewingCause.labTest}
                  </p>
                </div>
              )}

              {viewingCause?.note && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                    Condition Note
                  </p>
                  <p className="text-sm text-foreground italic leading-relaxed">
                    "{viewingCause.note}"
                  </p>
                </div>
              )}

              {viewingCause?.treatment && (
                <div className="bg-green-500/5 p-4 rounded-lg border border-green-500/10">
                  <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-2">
                    Recommended Treatment
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {viewingCause.treatment}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI Chat Dialog */}
      <Dialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Symptom Analysis
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh] p-0">
            <div className="p-6">
              <div className="space-y-4">
                {(messages as any[]).map((m: any) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl p-4 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                        : "bg-muted text-foreground mr-auto rounded-tl-none",
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="bg-muted text-foreground mr-auto rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs animate-pulse">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim() && activeConversationId) {
                  sendMessage.mutate({
                    conversationId: activeConversationId,
                    content: chatInput,
                  });
                }
              }}
              className="flex gap-2"
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask follow-up questions..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full h-10 w-10"
                disabled={sendMessage.isPending || !chatInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setViewingCause(null)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (viewingCause) onEdit(viewingCause);
                setViewingCause(null);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
