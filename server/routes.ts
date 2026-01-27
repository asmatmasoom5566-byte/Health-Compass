import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { insertSearchHistorySchema } from "@shared/schema";
import { chat } from "./replit_integrations/chat";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  registerChatRoutes(app);
  registerImageRoutes(app);

  app.post("/api/analysis/start", async (req, res) => {
    const { symptom } = req.body;
    if (!symptom) return res.status(400).json({ error: "Symptom required" });

    // Initial AI prompt to generate first OPD question
    const prompt = `User reported symptom: "${symptom}". Generate a primary Onset, Precipitation, Duration (OPD) question for a doctor to ask. Keep it concise.`;
    const aiResponse = await chat([{ role: "user", content: prompt }]);
    const question = aiResponse.content;

    const session = await storage.createAnalysisSession({
      initialSymptom: symptom,
      currentQuestion: question,
      answers: [],
      diagnosisScores: [],
      status: "active"
    });
    res.json(session);
  });

  app.post("/api/analysis/:id/answer", async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body; // boolean
    const session = await storage.getAnalysisSession(Number(id));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const newAnswers = [...(session.answers || []), { question: session.currentQuestion!, answer }];
    
    // AI prompt for follow-up and scoring
    const causes = await storage.getCauses();
    const prompt = `Initial symptom: ${session.initialSymptom}. 
History of questions and answers: ${JSON.stringify(newAnswers)}.
Available conditions: ${JSON.stringify(causes.map(c => ({name: c.name, symptoms: c.symptoms})))}.
Based on this, either:
1. Generate the next follow-up question.
2. If enough info, return "COMPLETED" followed by a JSON array of the top 3 potential conditions with confidence scores (0-100).
Return ONLY the question or "COMPLETED: [JSON]"`;

    const aiResponse = await chat([{ role: "user", content: prompt }]);
    const content = aiResponse.content;

    if (content.startsWith("COMPLETED")) {
      const scores = JSON.parse(content.replace("COMPLETED:", "").trim());
      const updated = await storage.updateAnalysisSession(Number(id), {
        answers: newAnswers,
        diagnosisScores: scores,
        status: "completed",
        currentQuestion: null
      });
      res.json(updated);
    } else {
      const updated = await storage.updateAnalysisSession(Number(id), {
        answers: newAnswers,
        currentQuestion: content,
        status: "active"
      });
      res.json(updated);
    }
  });

  app.get("/api/search-history", async (req, res) => {
    const history = await storage.getSearchHistory();
    res.json(history);
  });

  app.post("/api/search-history", async (req, res) => {
    const result = insertSearchHistorySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid search history data" });
    }
    const history = await storage.addSearchHistory(result.data);
    res.json(history);
  });

  return httpServer;
}
