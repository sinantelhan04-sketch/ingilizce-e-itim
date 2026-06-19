import express from "express";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check for deployment
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post("/api/gemini", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const { method, args } = req.body;
      const modelName = args.model || "gemini-3-flash-preview";
      const model = genAI.getGenerativeModel({ model: modelName });

      let result;
      if (method === "generateContent") {
        const genResult = await model.generateContent(args.contents);
        result = { text: genResult.response.text() };
      } else if (method === "generateContentWithSchema") {
        const genResult = await model.generateContent({
           contents: [{ role: 'user', parts: [{ text: args.prompt }] }],
           generationConfig: {
             responseMimeType: "application/json",
             responseSchema: args.schema,
           }
        });
        result = { text: genResult.response.text() };
      } else if (method === "analyzeAudio") {
        const { audioBase64, mimeType, prompt } = args;
        const genResult = await model.generateContent([
          { inlineData: { mimeType, data: audioBase64 } },
          { text: prompt }
        ]);
        result = { text: genResult.response.text() };
      } else {
        const genResult = await model.generateContent(args.prompt || args.contents || "Hello");
        result = { text: genResult.response.text() };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
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
