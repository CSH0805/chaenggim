// 사용법: npm run db:init (로컬) / npm run db:init:cloud (TiDB Cloud)
// 1) DB 이름 없이 접속 → 2) CREATE DATABASE IF NOT EXISTS → 3) db/schema.sql 실행
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { connectionOptions, databaseName } from './db-config.mjs';

const dbName = databaseName();
const conn = await mysql.createConnection(connectionOptions({ withDatabase: false }));

try {
  // DB 이름은 식별자라 ? 플레이스홀더를 쓸 수 없으므로 db-config 에서 형식을 검증한 뒤 백틱으로 감싼다.
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.changeUser({ database: dbName });

  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  const statements = schema
    .replace(/--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sql of statements) {
    await conn.query(sql);
    console.log('✔', sql.split('\n')[0]);
  }
  console.log(`\n데이터베이스 "${dbName}" 준비 완료 (${statements.length}개 문장 실행)`);
} catch (err) {
  console.error('DB 초기화 실패:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
