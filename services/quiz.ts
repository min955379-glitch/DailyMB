
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restGetDailyQuiz, backendConfigured } from './backend';
import type { DailyQuizRow, DayAnswers } from '../lib/types';
const CACHE_PREFIX = 'dailymb-day-';
function toDay(date: string, rows: DailyQuizRow[]): DayAnswers {
  const questions = rows.sort((a,b)=>a.question_no-b.question_no).map((r)=>({ questionNo:r.question_no, questionText:r.question_text, options:r.options ?? [], correctText:r.correct_text, correctLetter:r.correct_letter, confidence:r.confidence, candidates: Array.isArray(r.candidates)? (r.candidates as string[]) : [], sources:r.sources ?? [] }));
  const status: DayAnswers['status'] = questions.length===0?'none':questions.every(q=>q.confidence==='verified')?'verified':questions.some(q=>q.confidence==='uncertain')?'uncertain':'partial';
  return { date, questions, status };
}
export async function fetchDay(date: string): Promise<DayAnswers> {
  if (backendConfigured) {
    try { const data = await restGetDailyQuiz(`select=*&date=eq.${date}&order=question_no.asc`);
      const day = toDay(date, data as DailyQuizRow[]); await AsyncStorage.setItem(CACHE_PREFIX+date, JSON.stringify(day)); return day;
    } catch { /* fall through to cache */ }
  }
  const cached = await AsyncStorage.getItem(CACHE_PREFIX+date);
  if (cached) return JSON.parse(cached) as DayAnswers; // offline fallback: last known answers
  return { date, questions: [], status: 'none' };
}
export async function fetchHistory(days = 30): Promise<DayAnswers[]> {
  const since = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
  if (!backendConfigured) return [];
  let data: unknown[]; try { data = await restGetDailyQuiz(`select=*&date=gte.${since}&order=date.desc,question_no.asc`); } catch { return []; }
  const byDate = new Map<string, DailyQuizRow[]>(); for (const r of data as DailyQuizRow[]) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  return [...byDate.entries()].map(([d,rows])=>toDay(d,rows));
}
export function formatAnswers(day: DayAnswers, mode: 'short'|'full'): string {
  if (mode==='short') return day.questions.map(q=>`${q.questionNo}. ${q.correctLetter}`).join('\n');
  return day.questions.map(q=>`Question ${q.questionNo}: ${q.questionText}\nAnswer: ${q.correctText}`).join('\n\n');
}
