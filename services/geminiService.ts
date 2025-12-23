import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { DailyLesson, AnalysisResult, Word, Exercise } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LESSON_MODEL = "gemini-3-flash-preview";
// Switched to gemini-3-flash-preview for audio analysis as native-audio model is Live API only or 404s on generateContent
const AUDIO_MODEL = "gemini-3-flash-preview"; 
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const IMAGE_MODEL = "gemini-2.5-flash-image";

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
    reading_passage: { type: Type.STRING },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["fill-in-blank", "matching"] },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
        },
        required: ["id", "type", "question", "answer"]
      },
    },
  },
  required: ["day", "difficulty_level", "theme", "target_words", "reading_passage", "exercises"],
};

// Schema for just regenerating passage and exercises
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
          type: { type: Type.STRING, enum: ["fill-in-blank", "matching"] },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
        },
        required: ["id", "type", "question", "answer"]
      },
    },
  },
  required: ["reading_passage", "exercises"],
};

export const generateLesson = async (day: number): Promise<DailyLesson> => {
  const difficultyPercent = Math.min(100, day * 3 + 10); // Starts at ~13%, ends at 100%
  
  // Dynamic complexity instruction based on day
  let structureInstruction = "";
  if (day <= 10) {
    structureInstruction = "EXTREMELY IMPORTANT: Use simple Subject-Verb-Object sentence structures. Avoid complex relative clauses, passive voice, or long sentences. Keep it very clear and easy to read (A2/B1 level syntax), even if the vocabulary is academic.";
  } else if (day <= 20) {
    structureInstruction = "Use moderate sentence structures (B2 level). Mix simple and compound sentences.";
  } else {
    structureInstruction = "Use advanced, complex sentence structures (C1 level) typical of academic journals.";
  }

  const prompt = `
    Role: You are an expert AI English tutor specialized in YDS, YÖKDİL, and TOEFL for Turkish speakers.
    Task: Create a structured lesson for Day ${day} of a 30-day curriculum.
    
    Requirements:
    1. Difficulty: Day ${day}/30 (approx ${difficultyPercent}% difficulty). Scale from A2 (Day 1) to C1 (Day 30).
    2. Theme: Choose a random academic theme (Science, History, Environment, Medicine, or Technology).
    3. Target Words: 10 advanced academic words suitable for the theme.
    4. Reading Passage: 100-150 words. Academic tone. MUST include all 10 target words. Wrap target words in **double asterisks** for bolding (e.g. **hypothesis**).
    5. **Sentence Structure Constraint**: ${structureInstruction}
    6. Exercises: 
       - 3 Fill-in-the-blank questions based on the text/vocab.
       - 2 Meaning matching questions.
    
    Output strictly valid JSON matching the schema provided.
  `;

  try {
    const response = await ai.models.generateContent({
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
    
    return JSON.parse(text) as DailyLesson;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateThemeImage = async (theme: string): Promise<string | undefined> => {
  const prompt = `Create a high-quality, modern, academic illustration representing the theme: "${theme}". 
  Style: Minimalist, flat vector art, vibrant colors, suitable for an educational app header. No text in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
        }
      }
    });

    // Extract image from parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return undefined;
  }
};

export const regeneratePassage = async (currentTheme: string, words: Word[]): Promise<{ reading_passage: string, exercises: Exercise[] }> => {
  const wordList = words.map(w => w.word).join(", ");
  
  const prompt = `
    Role: Expert English Tutor.
    Task: Write a TOTALLY NEW and DIFFERENT reading passage using specific target words.
    
    Context:
    - Theme: ${currentTheme}
    - Target Words to use (mandatory): ${wordList}
    
    Requirements:
    1. Reading Passage: Write a NEW paragraph (100-150 words) that is different from the previous one but uses the SAME target words.
    2. Wrap target words in **double asterisks** (e.g. **hypothesis**).
    3. Keep sentences clear and readable.
    4. Exercises: Create 5 NEW exercises (3 fill-in-blank, 2 matching) based on this new text.
    
    Output strictly valid JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
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

export const getQuickDefinition = async (word: string, contextSentence: string): Promise<{ meaning: string, pronunciation: string }> => {
  const prompt = `
    Task: Provide a quick Turkish definition and IPA pronunciation for the word "${word}" based on its context.
    Context Sentence: "${contextSentence}"
    
    Return JSON: { "meaning": "Turkish meaning (concise)", "pronunciation": "IPA" }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      meaning: { type: Type.STRING },
      pronunciation: { type: Type.STRING }
    },
    required: ["meaning", "pronunciation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: LESSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text!) as { meaning: string, pronunciation: string };
  } catch (e) {
    return { meaning: "Çeviri alınamadı", pronunciation: "" };
  }
};

export const translateSentence = async (sentence: string): Promise<string> => {
  const prompt = `Translate this academic English sentence to Turkish. Keep it professional and accurate.
  Sentence: "${sentence}"`;
  
  try {
      const response = await ai.models.generateContent({
          model: LESSON_MODEL,
          contents: prompt,
      });
      return response.text?.trim() || "Çeviri yapılamadı.";
  } catch (e) {
      console.error(e);
      return "Çeviri hatası.";
  }
};

export const analyzePronunciation = async (audioBase64: string, passageText: string): Promise<AnalysisResult> => {
  const prompt = `
    Task: Analyze the user's pronunciation of the provided text.
    Context: The user is a Turkish speaker learning academic English.
    Reference Text: "${passageText.substring(0, 500)}..." (Focus on the target academic vocabulary).
    
    Instructions:
    1. Listen to the audio.
    2. Compare it to standard English pronunciation (RP or General American).
    3. Identify words that were mispronounced.
    4. Calculate a SCORE (0-100) based on accuracy, clarity, and fluency.
    5. Provide specific feedback in Turkish.
    
    Output JSON format:
    {
      "score": 85,
      "feedback": "General feedback string in Turkish...",
      "corrections": [
        { "original": "word", "pronounced": "phonetic approximation of user error", "note": "Correction tip in Turkish" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
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

  } catch (error) {
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

// Global audio context variable to allow stopping
let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isStopped = false; // Flag to prevent playTTS from starting if stopped

export const stopTTS = () => {
  isStopped = true;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    currentSource = null;
  }
  if (currentAudioContext && currentAudioContext.state !== 'closed') {
    currentAudioContext.close();
    currentAudioContext = null;
  }
};

export const playTTS = async (text: string): Promise<void> => {
  isStopped = false; // Reset on new play request
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Puck' is often clearer and has good pacing for learners compared to 'Kore'
            prebuiltVoiceConfig: { voiceName: 'Puck' }, 
          },
        },
      },
    });

    if (isStopped) return; // Check if stopped during fetch

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    if (currentAudioContext && currentAudioContext.state !== 'closed') {
        currentAudioContext.close();
    }
    
    if (isStopped) return; // Check again

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
    console.error("TTS Error:", error);
    throw error;
  }
};
