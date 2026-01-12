import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { DailyLesson, AnalysisResult, Word, Exercise, WritingAnalysisResult } from "../types";

// =========================================================================================
// API Key Initialization
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// =========================================================================================

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAiClient = () => {
    return ai;
}

const LESSON_MODEL = "gemini-3-flash-preview";
const AUDIO_MODEL = "gemini-3-flash-preview"; 
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const IMAGE_MODEL = "gemini-2.5-flash-image";

const CACHE_VERSION = "v3_mondly_emoji"; // Version bumped to invalidate old cache without emojis

const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    day: { type: Type.INTEGER },
    difficulty_level: { type: Type.STRING },
    theme: { type: Type.STRING },
    target_words: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          emoji: { type: Type.STRING }, // Added emoji field
          ipa: { type: Type.STRING },
          type: { type: Type.STRING },
          turkish_meaning: { type: Type.STRING },
          definition: { type: Type.STRING },
          synonym: { type: Type.STRING },
          antonym: { type: Type.STRING },
          example_sentence: { type: Type.STRING },
        },
        required: ["word", "emoji", "ipa", "type", "turkish_meaning", "definition", "synonym", "antonym", "example_sentence"]
      },
    },
    collocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaning: { type: Type.STRING },
        },
        required: ["phrase", "meaning"]
      }
    },
    grammar_point: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        explanation: { type: Type.STRING },
        example: { type: Type.STRING },
      },
      required: ["title", "explanation", "example"]
    },
    reading_passage: { type: Type.STRING },
    conversation_scenario: {
      type: Type.OBJECT,
      properties: {
        setting: { type: Type.STRING },
        user_role: { type: Type.STRING },
        ai_role: { type: Type.STRING },
        objective: { type: Type.STRING },
        starter_message: { type: Type.STRING },
        suggested_replies: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["setting", "user_role", "ai_role", "objective", "starter_message", "suggested_replies"]
    },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["multiple-choice"] },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
        },
        required: ["id", "type", "question", "options", "answer"]
      },
    },
  },
  required: ["day", "difficulty_level", "theme", "target_words", "collocations", "grammar_point", "reading_passage", "conversation_scenario", "exercises"],
};

const regenerationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reading_passage: { type: Type.STRING },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["multiple-choice"] },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
        },
        required: ["id", "type", "question", "options", "answer"]
      },
    },
  },
  required: ["reading_passage", "exercises"],
};

const getLevelConfig = (level: string) => {
    switch (level) {
        case 'A1': return { wordCount: "60-80", structure: "Very simple sentences (SVO). Present Simple tense dominance.", themeFocus: "Daily routines, family, home, basic needs." };
        case 'A2': return { wordCount: "80-100", structure: "Simple and compound sentences connected with 'and', 'but'. Past Simple.", themeFocus: "Travel, shopping, local geography, work." };
        case 'B1': return { wordCount: "100-130", structure: "Cohesive paragraphs. Use of future forms, modals, and simple complex sentences.", themeFocus: "Experiences, dreams, hopes, events, basic current affairs." };
        case 'B2': return { wordCount: "140-160", structure: "Complex sentences with relative clauses. Present Perfect. Clear argumentation.", themeFocus: "Abstract topics, technical discussions, social issues." };
        case 'C1': return { wordCount: "160-200", structure: "Sophisticated academic structure. Passive voice, inversion, advanced connectors.", themeFocus: "Academic research, philosophy, global economics." };
        default: return { wordCount: "100-120", structure: "Standard intermediate structure.", themeFocus: "General interest." };
    }
};

export const generateLesson = async (day: number, userLevel: string = "A1"): Promise<DailyLesson> => {
  const cacheKey = `yds_lesson_${userLevel}_${day}_${CACHE_VERSION}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
      try {
          console.log("Serving lesson from cache");
          return JSON.parse(cachedData) as DailyLesson;
      } catch (e) {
          localStorage.removeItem(cacheKey);
      }
  }

  const config = getLevelConfig(userLevel);
  const prompt = `
    Role: Expert English Teacher.
    Target Audience: Student at **${userLevel}** level.
    Day: ${day}/30.
    Task Requirements:
    1. **Difficulty Level**: Set 'difficulty_level' to "${userLevel}".
    2. **Theme**: Topic for Day ${day}.
    3. **Target Words**: 10 essential words. **Must include a relevant 'emoji' for each word.**
    4. **Collocations**: 3 useful phrases.
    5. **Grammar**: One grammar point.
    6. **Reading Passage**: ${config.wordCount} words, ${userLevel} level. Wrap target words in **double asterisks**.
    7. **Conversation Scenario**: Roleplay scenario.
    8. **Exercises**: 4 Multiple Choice questions.
    Output strictly valid JSON.
  `;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: LESSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        temperature: 0.7,
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ] as any,
      },
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");
    
    const lessonData = JSON.parse(text) as DailyLesson;
    try { localStorage.setItem(cacheKey, JSON.stringify(lessonData)); } catch (e) {}
    return lessonData;
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error.message.includes("403") || error.message.includes("API key")) {
        throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};

export const getChatReply = async (history: {role: string, parts: {text: string}[]}[], userLevel: string): Promise<{text: string, suggestions: string[]}> => {
    const prompt = `
      Roleplay partner. Level: ${userLevel}. Concise (max 2 sentences). Correct gently.
      Output JSON: { "text": "...", "suggestions": ["...", "...", "..."] }
    `;
    const schema: Schema = {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
        required: ["text", "suggestions"]
    };

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: LESSON_MODEL,
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return JSON.parse(response.text!) as {text: string, suggestions: string[]};
    } catch (e) {
        return { text: "Connection error. Please check your API key.", suggestions: ["Retry"] };
    }
};

export const generateThemeImage = async (theme: string): Promise<string | undefined> => {
  const prompt = `Cute 3D cartoon illustration: "${theme}". Mondly style, vibrant colors, white background.`;
  try {
    const client = getAiClient();
    // Try fast image model first
    try {
        const response = await client.models.generateContent({
            model: IMAGE_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    } catch(e) {}

    // Fallback to Imagen
    const response = await client.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, aspectRatio: "1:1", outputMimeType: "image/jpeg" }
    });
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    return base64 ? `data:image/jpeg;base64,${base64}` : undefined;
  } catch (error) {
    return undefined;
  }
};

export const regeneratePassage = async (currentTheme: string, words: Word[], userLevel: string = "A1"): Promise<{ reading_passage: string, exercises: Exercise[] }> => {
  const wordList = words.map(w => w.word).join(", ");
  const prompt = `Rewrite reading passage on "${currentTheme}". Level: ${userLevel}. Words: ${wordList}. 4 new MCQs. Return JSON.`;
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: LESSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: regenerationSchema }
    });
    return JSON.parse(response.text!) as { reading_passage: string, exercises: Exercise[] };
  } catch (error) { throw error; }
};

export const getQuickDefinition = async (word: string, contextSentence: string): Promise<{ turkish_meaning: string, english_definition: string, pronunciation: string, emoji: string }> => {
  const prompt = `Explain "${word}" for Turkish student. Context: "${contextSentence}". Return JSON {turkish_meaning, english_definition, pronunciation, emoji}`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: { turkish_meaning: { type: Type.STRING }, english_definition: { type: Type.STRING }, pronunciation: { type: Type.STRING }, emoji: { type: Type.STRING } },
    required: ["turkish_meaning", "english_definition", "pronunciation", "emoji"]
  };
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({ model: LESSON_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text!);
  } catch (e) { return { turkish_meaning: "...", english_definition: "...", pronunciation: "", emoji: "❓" }; }
};

export const translateSentence = async (sentence: string): Promise<string> => {
  try {
      const client = getAiClient();
      const response = await client.models.generateContent({ model: LESSON_MODEL, contents: `Translate to Turkish: "${sentence}"` });
      return response.text?.trim() || "Error";
  } catch (e) { return "Çeviri hatası."; }
};

export const evaluateWriting = async (originalPassage: string, userText: string): Promise<WritingAnalysisResult> => {
    const prompt = `Evaluate Turkish summary of: "${originalPassage.substring(0,300)}". Student: "${userText}". JSON: score, feedback, missing_points, better_version.`;
    const schema: Schema = {
        type: Type.OBJECT,
        properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING }, missing_points: { type: Type.ARRAY, items: { type: Type.STRING } }, better_version: { type: Type.STRING } },
        required: ["score", "feedback", "missing_points", "better_version"]
    };
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({ model: LESSON_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        return JSON.parse(response.text!);
    } catch (e) { throw new Error("Eval failed"); }
};

export const analyzePronunciation = async (audioBase64: string, passageText: string): Promise<AnalysisResult> => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: AUDIO_MODEL,
      contents: { parts: [{ inlineData: { mimeType: "audio/wav", data: audioBase64 } }, { text: `Analyze pronunciation vs: "${passageText.substring(0,300)}". JSON: score, feedback, corrections.` }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text!) as AnalysisResult;
  } catch (error) {
    return { score: 0, feedback: "Analiz hatası (API Key kontrol ediniz).", corrections: [] };
  }
};

// TTS
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let c = 0; c < numChannels; c++) {
    const channelData = buffer.getChannelData(c);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + c] / 32768.0; }
  }
  return buffer;
}

let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isStopped = false; 

export const stopTTS = () => {
  isStopped = true;
  if (currentSource) { try { currentSource.stop(); } catch (e) {} currentSource = null; }
  if (currentAudioContext && currentAudioContext.state !== 'closed') { currentAudioContext.close(); currentAudioContext = null; }
  if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
  window.dispatchEvent(new Event('tts-stopped'));
};

const playFallbackTTS = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        u.onend = () => resolve();
        u.onerror = () => resolve();
        if (isStopped) { resolve(); return; }
        window.speechSynthesis.speak(u);
    }, 50);
  });
};

export const playTTS = async (text: string): Promise<void> => {
  isStopped = false; 
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } },
    });
    if (isStopped) return;
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("No audio");

    if (currentAudioContext) currentAudioContext.close();
    currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(base64), currentAudioContext, 24000, 1);
    
    if (isStopped) { currentAudioContext.close(); return; }
    currentSource = currentAudioContext.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.connect(currentAudioContext.destination);
    return new Promise((resolve) => {
        if (!currentSource) return resolve();
        currentSource.onended = () => { resolve(); currentSource = null; };
        currentSource.start();
    });
  } catch (error) {
    if (isStopped) return;
    return playFallbackTTS(text);
  }
};