import 'server-only';

/** 환경 변수를 읽을 때 앞뒤 공백·줄바꿈을 제거한다 (Vercel 대시보드 붙여넣기 실수 방지). */
export function env(key: string, fallback = ''): string {
  return (process.env[key] ?? fallback).trim();
}
