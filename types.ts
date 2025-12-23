
export interface Word {
  word: string;
  ipa: string;
  type: string;
  turkish_meaning: string;
  definition: string;
  synonym: string;
  antonym: string;
  example_sentence: string;
}

export interface Exercise {
  id: number;
  type: 'fill-in-blank' | 'matching';
  question: string;
  options?: string[]; // For fill-in-blank or matching pairs
  answer: string;
}

export interface DailyLesson {
  day: number;
  difficulty_level: string; // e.g., "Day 5 - A2/B1 Transition"
  theme: string;
  target_words: Word[];
  reading_passage: string; // HTML or Markdown string
  exercises: Exercise[];
  imageUrl?: string; // New field for generated image
}

export interface AnalysisResult {
  score: number; // 0-100 score
  feedback: string;
  corrections: Array<{
    original: string;
    pronounced: string;
    note: string;
  }>;
}
