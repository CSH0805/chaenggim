// db-init / db-seed 스크립트가 함께 쓰는 접속 설정 (lib/db.ts 와 같은 규칙)
const env = (key, fallback = '') => (process.env[key] ?? fallback).trim();

export function connectionOptions({ withDatabase = true } = {}) {
  const options = {
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT') || 3306),
    user: env('DB_USER'),
    password: env('DB_PASSWORD'),
    charset: 'utf8mb4',
    dateStrings: true,
  };
  if (env('DB_SSL').toLowerCase() === 'true') {
    options.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  if (withDatabase) options.database = databaseName();
  return options;
}

export function databaseName() {
  const name = env('DB_NAME');
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('DB_NAME 은 영문/숫자/밑줄만 사용할 수 있어요.');
  }
  return name;
}
