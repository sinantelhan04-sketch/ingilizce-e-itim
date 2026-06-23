import { DailyLesson, AnalysisResult, Word, Exercise, WritingAnalysisResult } from "../types";

const LESSON_MODEL = "gemini-2.0-flash";
const AUDIO_MODEL = "gemini-2.0-flash"; 
const TTS_MODEL = "gemini-2.0-flash";
const IMAGE_MODEL = "gemini-2.0-flash";

const CACHE_VERSION = "v3_mondly_emoji";

const callBackendGemini = async (method: string, args: any) => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, args })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("API_QUOTA_EXCEEDED");
      }
      const errData = await response.json();
      throw new Error(errData.error || "API_ERROR");
    }
    return await response.json();
  } catch (error: any) {
    if (error.message === "API_QUOTA_EXCEEDED") throw error;
    console.error("Backend Call Failed:", error);
    throw error;
  }
};

export const generateLesson = async (day: number, userLevel: string = "A1"): Promise<DailyLesson> => {
  const cacheKey = `yds_lesson_${userLevel}_${day}_${CACHE_VERSION}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
      try {
          return JSON.parse(cachedData) as DailyLesson;
      } catch (e) {
          localStorage.removeItem(cacheKey);
      }
  }

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

  // Define schema locally for client-side to pass to proxy
  const schema = {
    type: "object",
    properties: {
      day: { type: "integer" },
      difficulty_level: { type: "string" },
      theme: { type: "string" },
      target_words: {
        type: "array",
        items: {
          type: "object",
          properties: {
            word: { type: "string" },
            emoji: { type: "string" },
            ipa: { type: "string" },
            type: { type: "string" },
            turkish_meaning: { type: "string" },
            definition: { type: "string" },
            synonym: { type: "string" },
            antonym: { type: "string" },
            example_sentence: { type: "string" },
          },
          required: ["word", "emoji", "ipa", "type", "turkish_meaning", "definition", "synonym", "antonym", "example_sentence"]
        },
      },
      collocations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phrase: { type: "string" },
            meaning: { type: "string" },
          },
          required: ["phrase", "meaning"]
        }
      },
      grammar_point: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          example: { type: "string" },
        },
        required: ["title", "explanation", "example"]
      },
      reading_passage: { type: "string" },
      conversation_scenario: {
        type: "object",
        properties: {
          setting: { type: "string" },
          user_role: { type: "string" },
          ai_role: { type: "string" },
          objective: { type: "string" },
          starter_message: { type: "string" },
          suggested_replies: { type: "array", items: { type: "string" } }
        },
        required: ["setting", "user_role", "ai_role", "objective", "starter_message", "suggested_replies"]
      },
      exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            type: { type: "string" },
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
          },
          required: ["id", "type", "question", "options", "answer"]
        },
      },
    },
    required: ["day", "difficulty_level", "theme", "target_words", "collocations", "grammar_point", "reading_passage", "conversation_scenario", "exercises"],
  };

  try {
    const result = await callBackendGemini("generateContentWithSchema", {
      prompt,
      schema,
      model: LESSON_MODEL
    });

    const lessonData = JSON.parse(result.text) as DailyLesson;
    try { localStorage.setItem(cacheKey, JSON.stringify(lessonData)); } catch (e) {}
    return lessonData;
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error.message.includes("403") || error.message.includes("API key")) {
        throw new Error("INVALID_API_KEY");
    }
    if (error.message === "API_QUOTA_EXCEEDED") {
        throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
};


export const getChatReply = async (history: {role: string, parts: {text: string}[]}[], userLevel: string): Promise<{text: string, suggestions: string[]}> => {
    const prompt = `
      Roleplay partner. Level: ${userLevel}. Concise (max 2 sentences). Correct gently.
      Output JSON: { "text": "...", "suggestions": ["...", "...", "..."] }
    `;
    const schema = {
        type: "object",
        properties: { text: { type: "string" }, suggestions: { type: "array", items: { type: "string" } } },
        required: ["text", "suggestions"]
    };

    try {
        const result = await callBackendGemini("generateContentWithSchema", {
            prompt: prompt + "\nHistory: " + JSON.stringify(history),
            schema,
            model: LESSON_MODEL
        });
        return JSON.parse(result.text) as {text: string, suggestions: string[]};
    } catch (e) {
        return { text: "Connection error. Please check your API key.", suggestions: ["Retry"] };
    }
};

export const generateThemeImage = async (theme: string): Promise<string | undefined> => {
  // Disabling image generation calls temporarily due to widespread quota limits (limit: 0) on experimental image models
  return undefined; 
};

export const regeneratePassage = async (currentTheme: string, words: Word[], userLevel: string = "A1"): Promise<{ reading_passage: string, exercises: Exercise[] }> => {
  const wordList = words.map(w => w.word).join(", ");
  const prompt = `Rewrite reading passage on "${currentTheme}". Level: ${userLevel}. Words: ${wordList}. 4 new MCQs. Return JSON.`;
  const schema = {
    type: "object",
    properties: {
      reading_passage: { type: "string" },
      exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            type: { type: "string" },
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
          },
          required: ["id", "type", "question", "options", "answer"]
        },
      },
    },
    required: ["reading_passage", "exercises"],
  };
  try {
    const result = await callBackendGemini("generateContentWithSchema", { prompt, schema, model: LESSON_MODEL });
    return JSON.parse(result.text) as { reading_passage: string, exercises: Exercise[] };
  } catch (error) { throw error; }
};

export const getQuickDefinition = async (word: string, contextSentence: string): Promise<{ turkish_meaning: string, english_definition: string, pronunciation: string, emoji: string }> => {
  const prompt = `Explain "${word}" for Turkish student. Context: "${contextSentence}". Return JSON {turkish_meaning, english_definition, pronunciation, emoji}`;
  const schema = {
    type: "object",
    properties: { turkish_meaning: { type: "string" }, english_definition: { type: "string" }, pronunciation: { type: "string" }, emoji: { type: "string" } },
    required: ["turkish_meaning", "english_definition", "pronunciation", "emoji"]
  };
  try {
    const result = await callBackendGemini("generateContentWithSchema", { prompt, schema, model: LESSON_MODEL });
    return JSON.parse(result.text);
  } catch (e) { return { turkish_meaning: "...", english_definition: "...", pronunciation: "", emoji: "❓" }; }
};

export const translateSentence = async (sentence: string): Promise<string> => {
  try {
      const result = await callBackendGemini("generateContent", { contents: `Translate to Turkish: "${sentence}"`, model: LESSON_MODEL });
      return result.text?.trim() || "Error";
  } catch (e) { return "Çeviri hatası."; }
};

export const evaluateWriting = async (originalPassage: string, userText: string): Promise<WritingAnalysisResult> => {
    const prompt = `Evaluate Turkish summary of: "${originalPassage.substring(0,300)}". Student: "${userText}". JSON: score, feedback, missing_points, better_version.`;
    const schema = {
        type: "object",
        properties: { score: { type: "number" }, feedback: { type: "string" }, missing_points: { type: "array", items: { type: "string" } }, better_version: { type: "string" } },
        required: ["score", "feedback", "missing_points", "better_version"]
    };
    try {
        const result = await callBackendGemini("generateContentWithSchema", { prompt, schema, model: LESSON_MODEL });
        return JSON.parse(result.text);
    } catch (e) { throw new Error("Eval failed"); }
};

export const analyzePronunciation = async (audioBase64: string, passageText: string, mimeType: string = "audio/wav"): Promise<AnalysisResult> => {
  try {
    const result = await callBackendGemini("analyzeAudio", { audioBase64, mimeType, prompt: `Analyze pronunciation vs: "${passageText.substring(0,300)}". JSON: score, feedback, corrections.`, model: AUDIO_MODEL });
    return JSON.parse(result.text) as AnalysisResult;
  } catch (error: any) {
    console.error("Pronunciation Analysis Error:", error);
    return { 
        score: 0, 
        feedback: "Analiz sırasında bir hata oluştu. (Backend proxy)", 
        corrections: [] 
    };
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
  return playFallbackTTS(text);
};