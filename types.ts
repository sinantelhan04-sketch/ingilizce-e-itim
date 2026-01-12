
export interface Word {
  word: string;
  emoji: string; // New field for visual association
  ipa: string;
  type: string;
  turkish_meaning: string;
  definition: string;
  synonym: string;
  antonym: string;
  example_sentence: string;
}

export interface Collocation {
  phrase: string;
  meaning: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  example: string;
}

export interface Exercise {
  id: number;
  type: 'multiple-choice'; 
  question: string;
  options: string[]; 
  answer: string;
}

export interface ConversationScenario {
  setting: string;
  user_role: string;
  ai_role: string;
  objective: string;
  starter_message: string;
  suggested_replies: string[];
}

export interface DailyLesson {
  day: number;
  difficulty_level: string; 
  theme: string;
  target_words: Word[];
  collocations: Collocation[]; 
  grammar_point: GrammarPoint; 
  reading_passage: string; 
  conversation_scenario: ConversationScenario; // New field for Chatbot
  exercises: Exercise[];
  imageUrl?: string; 
}

export interface AnalysisResult {
  score: number; 
  feedback: string;
  corrections: Array<{
    original: string;
    pronounced: string; 
    correct_pronunciation: string; 
    note: string;
  }>;
}

export interface WritingAnalysisResult {
  score: number;
  feedback: string;
  missing_points: string[];
  better_version: string;
}

export interface User {
  username: string;
  password?: string; 
  fullName?: string; 
  email?: string; 
  targetExam?: string; 
  level?: string;
  progress: number;
  isPremium?: boolean; 
  subscriptionDate?: string;
}
