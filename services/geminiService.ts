
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { DailyLesson, AnalysisResult, Word, Exercise, WritingAnalysisResult } from "../types";

// Safe Initialization
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI;

if (apiKey && apiKey !== "undefined" && apiKey !== "") {
    ai = new GoogleGenAI({ apiKey: apiKey });
} else {
    console.error("CRITICAL: API Key is missing. The app will fail to generate content.");
}

const getAiClient = () => {
    if (!ai) {
        throw new Error("API Anahtarı bulunamadı. Lütfen Vercel ayarlarından API_KEY eklediğinizden emin olun.");
    }
    return ai;
}

const LESSON_MODEL = "gemini-3-flash-preview";
const AUDIO_MODEL = "gemini-3-flash-preview"; 
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Cache version key to invalidate old data if structure changes
const CACHE_VERSION = "v2_mondly";

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
          ipa: { type: Type.STRING },
          type: { type: Type.STRING },
          turkish_meaning: { type: Type.STRING },
          definition: { type: Type.STRING },
          synonym: { type: Type.STRING },
          antonym: { type: Type.STRING },
          example_sentence: { type: Type.STRING },
        },
        required: ["word", "ipa", "type", "turkish_meaning", "definition", "synonym", "antonym", "example_sentence"]
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

// Helper to determine curriculum configuration based on Selected Level
const getLevelConfig = (level: string) => {
    switch (level) {
        case 'A1':
            return {
                wordCount: "60-80",
                structure: "Very simple sentences (SVO). Present Simple tense dominance.",
                themeFocus: "Daily routines, family, home, basic needs."
            };
        case 'A2':
            return {
                wordCount: "80-100",
                structure: "Simple and compound sentences connected with 'and', 'but'. Past Simple.",
                themeFocus: "Travel, shopping, local geography, work."
            };
        case 'B1':
            return {
                wordCount: "100-130",
                structure: "Cohesive paragraphs. Use of future forms, modals, and simple complex sentences.",
                themeFocus: "Experiences, dreams, hopes, events, basic current affairs."
            };
        case 'B2':
            return {
                wordCount: "140-160",
                structure: "Complex sentences with relative clauses. Present Perfect. Clear argumentation.",
                themeFocus: "Abstract topics, technical discussions, social issues."
            };
        case 'C1':
            return {
                wordCount: "160-200",
                structure: "Sophisticated academic structure. Passive voice, inversion, advanced connectors.",
                themeFocus: "Academic research, philosophy, global economics."
            };
        default:
            return {
                wordCount: "100-120",
                structure: "Standard intermediate structure.",
                themeFocus: "General interest."
            };
    }
};

export const generateLesson = async (day: number, userLevel: string = "A1"): Promise<DailyLesson> => {
  // 1. Check LocalStorage Cache
  const cacheKey = `yds_lesson_${userLevel}_${day}_${CACHE_VERSION}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
      try {
          console.log("Serving lesson from cache");
          return JSON.parse(cachedData) as DailyLesson;
      } catch (e) {
          console.warn("Cache parse error, fetching new data");
          localStorage.removeItem(cacheKey);
      }
  }

  const config = getLevelConfig(userLevel);
  
  const prompt = `
    Role: Expert English Teacher.
    Target Audience: Student at **${userLevel}** level.
    Day: ${day}/30.
    
    Task Requirements:
    1. **Difficulty Level**: Set the 'difficulty_level' field explicitly to "${userLevel}" in the output JSON.
    2. **Theme**: Specific topic for Day ${day}.
    3. **Target Words**: 10 essential words for ${userLevel}.
    4. **Collocations**: 3 useful phrases.
    5. **Grammar**: One specific grammar point, explained simply.
    6. **Reading Passage**: ${config.wordCount} words, ${userLevel} level. Wrap target words in **double asterisks**.
    7. **Conversation Scenario**: Create a roleplay scenario related to the theme.
       - Setting: Where does it take place?
       - User Role: Who is the student?
       - AI Role: Who are you?
       - Starter Message: The first thing the AI says to start the chat.
       - Suggested Replies: 3 options for the student to reply with.
    8. **Exercises**: 4 Multiple Choice questions.
    
    Output strictly valid JSON matching schema.
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
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    const lessonData = JSON.parse(text) as DailyLesson;

    try {
        localStorage.setItem(cacheKey, JSON.stringify(lessonData));
    } catch (e) {
        console.warn("LocalStorage full or disabled, skipping cache save.");
    }

    return lessonData;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const getChatReply = async (history: {role: string, parts: {text: string}[]}[], userLevel: string): Promise<{text: string, suggestions: string[]}> => {
    const prompt = `
      You are a roleplay partner in an English learning app.
      Level: ${userLevel}.
      Keep responses concise (max 2 sentences).
      Correct the user gently if they make big mistakes, but prioritize flow.
      Produce 3 short suggested replies for the user for the NEXT turn.
      
      Output JSON: { "text": "Your reply...", "suggestions": ["Option 1", "Option 2", "Option 3"] }
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["text", "suggestions"]
    };

    try {
        const client = getAiClient();
        // Construct the chat history for context
        const contents = [
            ...history,
            { role: 'user', parts: [{ text: prompt }] }
        ];

        const response = await client.models.generateContent({
            model: LESSON_MODEL,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        return JSON.parse(response.text!) as {text: string, suggestions: string[]};
    } catch (e) {
        console.error("Chat Error", e);
        return { text: "I didn't quite catch that. Could you say it again?", suggestions: ["Yes", "No"] };
    }
};

export const generateThemeImage = async (theme: string): Promise<string | undefined> => {
  const prompt = `Create a cute, colorful, 3D cartoon style illustration for an English lesson about: "${theme}". 
  Style: Mondly/Duolingo style, vibrant colors, soft lighting, 3D isometric or icon style. 
  White or simple colored background. No text.`;

  const generateWithImagen = async () => {
    try {
      const client = getAiClient();
      const response = await client.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/jpeg"
        }
      });
      const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64Image) {
        return `data:image/jpeg;base64,${base64Image}`;
      }
    } catch (e) {
      console.error("Imagen fallback failed", e);
    }
    return undefined;
  };

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    // If no image part returned, try fallback
    return await generateWithImagen();
  } catch (error) {
    console.warn("Gemini Image Model failed, switching to Imagen...", error);
    return await generateWithImagen();
  }
};

export const regeneratePassage = async (currentTheme: string, words: Word[], userLevel: string = "A1"): Promise<{ reading_passage: string, exercises: Exercise[] }> => {
  const wordList = words.map(w => w.word).join(", ");
  const config = getLevelConfig(userLevel);
  
  const prompt = `
    Role: Expert Teacher.
    Task: Rewrite a reading passage on "${currentTheme}".
    Target Level: ${userLevel}
    Target Words: ${wordList}
    
    Requirements:
    1. New cohesive paragraph using target words.
    2. Style: ${config.structure}
    3. Wrap target words in **double asterisks**.
    4. 4 NEW Multiple Choice questions.
    
    Output strictly valid JSON matching the schema.
  `;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: LESSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: regenerationSchema,
        temperature: 0.8, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text) as { reading_passage: string, exercises: Exercise[] };
  } catch (error) {
    console.error("Gemini Regeneration Error:", error);
    throw error;
  }
};

export const getQuickDefinition = async (word: string, contextSentence: string): Promise<{ turkish_meaning: string, english_definition: string, pronunciation: string, emoji: string }> => {
  const prompt = `
    Task: Explain "${word}" for a Turkish student.
    Context: "${contextSentence}"
    Return JSON with Turkish meaning, English definition, IPA, and an Emoji.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      turkish_meaning: { type: Type.STRING },
      english_definition: { type: Type.STRING },
      pronunciation: { type: Type.STRING },
      emoji: { type: Type.STRING }
    },
    required: ["turkish_meaning", "english_definition", "pronunciation", "emoji"]
  };

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: LESSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text!) as { turkish_meaning: string, english_definition: string, pronunciation: string, emoji: string };
  } catch (e) {
    return { turkish_meaning: "Çeviri alınamadı", english_definition: "Definition unavailable", pronunciation: "", emoji: "❓" };
  }
};

export const translateSentence = async (sentence: string): Promise<string> => {
  const prompt = `Translate to Turkish: "${sentence}"`;
  
  try {
      const client = getAiClient();
      const response = await client.models.generateContent({
          model: LESSON_MODEL,
          contents: prompt,
      });
      return response.text?.trim() || "Çeviri yapılamadı.";
  } catch (e) {
      console.error(e);
      return "Çeviri hatası.";
  }
};

export const evaluateWriting = async (originalPassage: string, userText: string): Promise<WritingAnalysisResult> => {
    const prompt = `
      Evaluate Turkish summary of: "${originalPassage.substring(0, 500)}".
      Student Summary: "${userText}".
      
      Return JSON: score (0-100), feedback (Turkish), missing_points, better_version.
    `;
  
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          missing_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          better_version: { type: Type.STRING }
        },
        required: ["score", "feedback", "missing_points", "better_version"]
    };

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: LESSON_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        return JSON.parse(response.text!) as WritingAnalysisResult;
    } catch (e) {
        console.error("Writing Eval Error", e);
        throw new Error("Değerlendirme yapılamadı");
    }
};

export const analyzePronunciation = async (audioBase64: string, passageText: string): Promise<AnalysisResult> => {
  const prompt = `
    Analyze pronunciation. Reference: "${passageText.substring(0, 500)}".
    Output JSON: score, feedback (Turkish), corrections list.
  `;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: AUDIO_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned");
    return JSON.parse(text) as AnalysisResult;

  } catch (error: any) {
    console.error("Audio Analysis Error:", error);
    return {
      score: 0,
      feedback: "Ses analizi şu anda yapılamadı. Lütfen tekrar deneyin.",
      corrections: []
    };
  }
};

// --- TTS Helpers ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isStopped = false; 

export const stopTTS = () => {
  isStopped = true;
  if (currentSource) {
    try { currentSource.stop(); } catch (e) {}
    currentSource = null;
  }
  if (currentAudioContext && currentAudioContext.state !== 'closed') {
    currentAudioContext.close();
    currentAudioContext = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  window.dispatchEvent(new Event('tts-stopped'));
};

const playFallbackTTS = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    const cleanText = text.trim();
    if (!cleanText) { resolve(); return; }

    window.speechSynthesis.cancel();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US'; 
        utterance.rate = 0.9;
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                               voices.find(v => v.lang === 'en-US') || 
                               voices.find(v => v.lang.startsWith('en'));
        
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        if (isStopped) { resolve(); return; }

        window.speechSynthesis.speak(utterance);
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
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, 
          },
        },
      },
    });

    if (isStopped) return;

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    if (currentAudioContext && currentAudioContext.state !== 'closed') {
        currentAudioContext.close();
    }
    
    if (isStopped) return;

    currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (currentAudioContext.state === 'suspended') {
      await currentAudioContext.resume();
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      currentAudioContext,
      24000,
      1,
    );
    
    if (isStopped) {
        currentAudioContext.close();
        return;
    }

    currentSource = currentAudioContext.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(currentAudioContext.destination);

    return new Promise((resolve) => {
        if (!currentSource) return resolve();
        
        currentSource.onended = () => {
            resolve();
            currentSource = null;
        };
        currentSource.start();
    });

  } catch (error) {
    console.warn("Gemini TTS failed, switching to browser fallback.");
    if (isStopped) return;
    return playFallbackTTS(text);
  }
};
