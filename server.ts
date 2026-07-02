import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client setup
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // Health check for deployment
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post("/api/gemini", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }
    
    try {
      const { method, args } = req.body;
      const modelName = args.model || "gemini-1.5-flash";

      let result;
      if (method === "generateContent") {
        const genResult = await ai.models.generateContent({
          model: modelName,
          contents: args.contents || args.prompt || "Hello"
        });
        
        // Handle images if any
        let imageUrl = undefined;
        if (genResult.candidates?.[0]?.content?.parts) {
          for (const part of genResult.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        
        result = { text: genResult.text, imageUrl };
      } else if (method === "generateContentWithSchema") {
        const genResult = await ai.models.generateContent({
           model: modelName,
           contents: args.prompt,
           config: {
             responseMimeType: "application/json",
             responseSchema: args.schema,
           }
        });
        result = { text: genResult.text };
      } else if (method === "analyzeAudio") {
        const { audioBase64, mimeType, prompt } = args;
        const genResult = await ai.models.generateContent({
          model: modelName,
          contents: [
            { inlineData: { mimeType, data: audioBase64 } },
            { text: prompt }
          ]
        });
        result = { text: genResult.text };
      } else if (method === "generateImages") {
        // Use a dedicated image model if requested, or fallback to current
        const imgModel = modelName.includes("image") ? modelName : "gemini-1.5-flash";
        const genResult = await ai.models.generateContent({
          model: imgModel,
          contents: args.prompt,
          config: {
            // For older model compatibility if needed, but generateContent is preferred
          }
        });
        
        let imageUrl = undefined;
        if (genResult.candidates?.[0]?.content?.parts) {
          for (const part of genResult.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        result = { text: genResult.text, imageUrl };
      } else {
        const genResult = await ai.models.generateContent({
          model: modelName,
          contents: args.prompt || args.contents || "Hello"
        });
        result = { text: genResult.text };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      
      const errorMessage = error.message || "";
      const errorDetail = error.details || error.status || "";

      // Handle specific Google API error statuses/messages
      if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key expired")) {
        return res.status(401).json({ 
          error: "INVALID_API_KEY",
          message: "API anahtarı geçersiz veya süresi dolmuş. Lütfen AI Studio Ayarlarından API anahtarınızı kontrol edin.",
          detail: errorMessage
        });
      }

      // Handle rate limits / quota issues
      if (errorMessage.includes("429") || error.status === 429 || errorMessage.includes("quota")) {
        return res.status(429).json({ 
          error: "QUOTA_EXCEEDED",
          message: "API kotası doldu. Lütfen daha sonra tekrar deneyin.",
          detail: errorMessage 
        });
      }
      
      res.status(500).json({ 
        error: "SERVER_ERROR",
        message: "Beklenmedik bir hata oluştu.",
        detail: errorMessage 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
