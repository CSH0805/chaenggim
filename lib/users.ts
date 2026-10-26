import 'server-only';
import bcrypt from 'bcryptjs';
import { execute, query } from './db';

export const DEMO_EMAIL = 'demo@chaenggim.com';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  nickname: string;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    'SELECT id, email, password_hash, nickname FROM ck_users WHERE email = ? LIMIT 1',
    [normalizeEmail(email)],
  );
  return rows[0] ?? null;
}

/** 새 사용자를 만든다. 이메일이 이미 있으면 null */
export async function createUser(email: string, password: string, nickname: string) {
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await execute(
      'INSERT INTO ck_users (email, password_hash, nickname) VALUES (?, ?, ?)',
      [normalizeEmail(email), hash, nickname],
    );
    return { id: result.insertId, nickname };
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') return null;
    throw err;
  }
}

/** 이메일·비밀번호가 맞으면 사용자, 아니면 null */
export async function verifyLogin(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? { id: user.id, nickname: user.nickname } : null;
}
