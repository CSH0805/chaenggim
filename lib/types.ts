import type { Category, Situation } from './constants';

export interface ListSummary {
  id: number;
  title: string;
  situation: Situation;
  emoji: string;
  event_date: string | null;
  memo: string | null;
  is_template: number;
  updated_at: string;
  total: number;
  checked: number;
}

export interface Item {
  id: number;
  list_id: number;
  name: string;
  category: Category;
  quantity: number;
  is_checked: number;
  is_ai: number;
  ai_reason: string | null;
  sort_order: number;
}

export interface ListDetail extends Omit<ListSummary, 'total' | 'checked'> {
  items: Item[];
}

export interface NewItemInput {
  name: string;
  category: Category;
  quantity: number;
  is_ai?: boolean;
  ai_reason?: string | null;
}

export interface AiGenerated {
  title: string;
  emoji: string;
  items: { name: string; category: Category; quantity: number; reason: string }[];
}

export interface AiReview {
  missing: { name: string; category: Category; reason: string }[];
  tip: string;
}

export interface Stats {
  totalLists: number;
  completedLists: number;
  templateCount: number;
  bySituation: { situation: Situation; count: number }[];
  items: { total: number; checked: number; rate: number };
  topItems: { name: string; count: number }[];
  aiItems: number;
}
