
import type { Confidence } from './answer-core';
export interface DailyQuizRow {
  date: string; question_no: number; question_text: string; options: string[];
  correct_text: string; correct_letter: string; confidence: Confidence;
  candidates: string[] | null; sources: string[];
}
export interface DayAnswers {
  date: string;
  questions: { questionNo: number; questionText: string; options: string[]; correctText: string; correctLetter: string; confidence: Confidence; candidates: string[]; sources: string[] }[];
  status: 'verified' | 'uncertain' | 'partial' | 'none';
}
export type AnswerMode = 'short' | 'full';
export type ThemePref = 'system' | 'light' | 'dark';
export type LanguagePref = 'en' | 'ur';
