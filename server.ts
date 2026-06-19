import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Gemini Setup
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
  
  // API Routes
  app.post("/api/gemini", async (req, res) => {
    try {
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
      } else if (method === "generateImages") {
        // Fallback for image generation if requested, 
        // Note:Imagen model handling might differ - simpler to respond with content if standard
        const genResult = await model.generateContent(args.prompt);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
