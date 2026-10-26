import 'server-only';
import { CATEGORIES, LIMITS, SITUATIONS, SITUATION_EMOJI, type Category, type Situation } from './constants';
import { badRequest } from './http';
import type { NewItemInput } from './types';

type Body = Record<string, unknown>;

/** 문자열 필드를 꺼내 trim 하고 길이를 검사한다. 비어 있으면 null */
export function text(body: Body, key: string, label: string, max: number, required = false): string | null {
  const raw = body[key];
  if (raw === undefined || raw === null || raw === '') {
    if (required) throw badRequest(`${label}을(를) 입력해 주세요.`);
    return null;
  }
  if (typeof raw !== 'string') throw badRequest(`${label} 형식이 올바르지 않아요.`);
  const value = raw.trim();
  if (!value && required) throw badRequest(`${label}을(를) 입력해 주세요.`);
  if ([...value].length > max) throw badRequest(`${label}은(는) ${max}자 이하로 입력해 주세요.`);
  return value || null;
}

export function isSituation(v: unknown): v is Situation {
  return typeof v === 'string' && (SITUATIONS as readonly string[]).includes(v);
}

export function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);
}

function dateOrNull(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw badRequest('날짜 형식이 올바르지 않아요.');
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw badRequest('없는 날짜예요.');
  return v;
}

function emojiOrDefault(v: unknown, situation: Situation): string {
  if (typeof v === 'string' && v.trim() && [...v.trim()].length <= 8) return v.trim();
  return SITUATION_EMOJI[situation];
}

export function quantity(v: unknown): number {
  const n = v === undefined ? 1 : Number(v);
  if (!Number.isInteger(n) || n < 1 || n > LIMITS.quantityMax) {
    throw badRequest(`수량은 1~${LIMITS.quantityMax} 사이로 입력해 주세요.`);
  }
  return n;
}

export interface ListFields {
  title: string;
  situation: Situation;
  emoji: string;
  event_date: string | null;
  memo: string | null;
}

/** 리스트 생성용 전체 검증 */
export function listFields(body: Body): ListFields {
  const situation = body.situation === undefined ? '기타' : body.situation;
  if (!isSituation(situation)) throw badRequest('상황 값이 올바르지 않아요.');
  return {
    title: text(body, 'title', '제목', LIMITS.title, true)!,
    situation,
    emoji: emojiOrDefault(body.emoji, situation),
    event_date: dateOrNull(body.event_date),
    memo: text(body, 'memo', '메모', LIMITS.memo),
  };
}

/** 리스트 수정용: 보낸 필드만 검증해서 돌려준다 */
export function listPatch(body: Body): Partial<ListFields> {
  const patch: Partial<ListFields> = {};
  if ('title' in body) patch.title = text(body, 'title', '제목', LIMITS.title, true)!;
  if ('situation' in body) {
    if (!isSituation(body.situation)) throw badRequest('상황 값이 올바르지 않아요.');
    patch.situation = body.situation;
  }
  if ('emoji' in body) patch.emoji = emojiOrDefault(body.emoji, patch.situation ?? '기타');
  if ('event_date' in body) patch.event_date = dateOrNull(body.event_date);
  if ('memo' in body) patch.memo = text(body, 'memo', '메모', LIMITS.memo);
  if (Object.keys(patch).length === 0) throw badRequest('수정할 내용이 없어요.');
  return patch;
}

/** 새 항목 하나 검증 */
export function newItem(raw: unknown): NewItemInput {
  if (!raw || typeof raw !== 'object') throw badRequest('항목 형식이 올바르지 않아요.');
  const body = raw as Body;
  const category = body.category === undefined ? '기타' : body.category;
  if (!isCategory(category)) throw badRequest('카테고리 값이 올바르지 않아요.');
  const isAi = body.is_ai === true || body.is_ai === 1;
  return {
    name: text(body, 'name', '항목 이름', LIMITS.itemName, true)!,
    category,
    quantity: quantity(body.quantity),
    is_ai: isAi,
    ai_reason: isAi ? (text(body, 'ai_reason', 'AI 이유', 255) ?? null) : null,
  };
}

export interface ItemPatch {
  name?: string;
  category?: Category;
  quantity?: number;
  is_checked?: number;
}

export function itemPatch(body: Body): ItemPatch {
  const patch: ItemPatch = {};
  if ('name' in body) patch.name = text(body, 'name', '항목 이름', LIMITS.itemName, true)!;
  if ('category' in body) {
    if (!isCategory(body.category)) throw badRequest('카테고리 값이 올바르지 않아요.');
    patch.category = body.category;
  }
  if ('quantity' in body) patch.quantity = quantity(body.quantity);
  if ('is_checked' in body) patch.is_checked = body.is_checked ? 1 : 0;
  if (Object.keys(patch).length === 0) throw badRequest('수정할 내용이 없어요.');
  return patch;
}
