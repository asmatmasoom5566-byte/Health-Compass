import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { insertSearchHistorySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register AI Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Placeholder for future sync endpoint
  app.post(api.sync.push.path, async (req, res) => {
    // In a real implementation, we would save to DB here.
    // For now, just acknowledge.
    res.json({ success: true });
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
