import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

// Lazy initialize OpenAI client
let _openai: OpenAI | undefined;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      try {
        _openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
      } catch (error) {
        // Mock OpenAI client for development without API key
        _openai = {
          chat: {
            completions: {
              create: async (params: any) => {
                // Return a mock response for development
                const mockResponse = {
                  choices: [{
                    message: {
                      content: "This is a mock response. To enable AI features, please configure your OpenAI API key."
                    }
                  }]
                };
                // Simulate some delay to mimic API call
                await new Promise(resolve => setTimeout(resolve, 500));
                return mockResponse;
              }
            }
          }
        } as any;
        console.warn("OpenAI API key not found. Running with mock AI responses for development.");
      }
    } else {
      // Mock OpenAI client for development without API key
      _openai = {
        chat: {
          completions: {
            create: async (params: any) => {
              // Return a mock response for development
              const mockResponse = {
                choices: [{
                  message: {
                    content: "This is a mock response. To enable AI features, please configure your OpenAI API key."
                  }
                }]
              };
              // Simulate some delay to mimic API call
              await new Promise(resolve => setTimeout(resolve, 500));
              return mockResponse;
            }
          }
        }
      } as any;
      console.warn("OpenAI API key not found. Running with mock AI responses for development.");
    }
  }
  return _openai!; // Assert non-null since we initialize it in the if block
}

export async function chat(messages: { role: "user" | "assistant" | "system", content: string }[]) {
  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    messages: messages as any,
  });
  return { content: response.choices[0]?.message?.content || "" };
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      
      // Check if we're using the mock client (which doesn't support streaming)
      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        // Use the non-streaming mock method for development
        const mockResponse = await getOpenAIClient().chat.completions.create({
          model: "gpt-5.1",
          messages: chatMessages,
        });
        
        fullResponse = mockResponse.choices[0]?.message?.content || "";
        
        // Stream the response in chunks to simulate streaming
        const chunkSize = 10;
        for (let i = 0; i < fullResponse.length; i += chunkSize) {
          const content = fullResponse.substring(i, i + chunkSize);
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } else {
        // Stream response from OpenAI
        const stream = await getOpenAIClient().chat.completions.create({
          model: "gpt-5.1",
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 2048,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}