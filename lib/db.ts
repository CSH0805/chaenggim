import 'server-only';
import mysql, { type Pool, type PoolConnection, type PoolOptions } from 'mysql2/promise';
import { env } from './env';

function createPool(): Pool {
  const options: PoolOptions = {
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT') || 3306),
    user: env('DB_USER'),
    password: env('DB_PASSWORD'),
    database: env('DB_NAME'),
    charset: 'utf8mb4',
    connectionLimit: 5,
    waitForConnections: true,
    dateStrings: true, // DATE/DATETIME 을 문자열 그대로 받아 시간대 변환 문제를 피한다
  };
  if (env('DB_SSL').toLowerCase() === 'true') {
    options.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  return mysql.createPool(options);
}

// 개발 서버의 핫 리로드·서버리스 재사용 시 풀이 여러 개 생기지 않도록 globalThis 에 한 번만 만든다.
const globalForDb = globalThis as unknown as { ckPool?: Pool };
export const pool: Pool = globalForDb.ckPool ?? (globalForDb.ckPool = createPool());

type Params = (string | number | boolean | null)[];

/** SELECT 결과 행 배열을 돌려준다. 값은 반드시 ? 플레이스홀더로 넘긴다. */
export async function query<T>(sql: string, params: Params = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** INSERT/UPDATE/DELETE 결과(insertId, affectedRows)를 돌려준다. */
export async function execute(sql: string, params: Params = []) {
  const [result] = await pool.query<mysql.ResultSetHeader>(sql, params);
  return result;
}

/** 여러 테이블에 함께 쓰는 작업을 하나의 트랜잭션으로 묶는다. 오류가 나면 전부 되돌린다. */
export async function withTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
