// 사용법: npm run db:seed (로컬) / npm run db:seed:cloud (TiDB Cloud)
// 데모 계정을 만들거나 갱신하고, 데모 계정의 리스트를 지운 뒤 샘플 3개를 다시 넣는다.
// → 여러 번 실행해도 데이터가 중복되지 않는다.
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { connectionOptions } from './db-config.mjs';

const DEMO_EMAIL = 'demo@chaenggim.com';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NICKNAME = '체험러';

// 서버 위치와 상관없이 서울 기준 날짜(YYYY-MM-DD)
function seoulDate(offsetDays = 0) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// [이름, 카테고리, 수량, 체크 여부, AI 추천 이유(없으면 null)]
const SAMPLE_LISTS = [
  {
    title: '2박3일 부산 여행',
    situation: '여행',
    emoji: '🌊',
    event_date: seoulDate(5),
    memo: 'KTX 09:30 서울역 출발 · 해운대 숙소 체크인 15시',
    is_template: 0,
    items: [
      ['신분증', '서류·지갑', 1, 1, null],
      ['KTX 승차권(앱)', '서류·지갑', 1, 1, null],
      ['카드·현금', '서류·지갑', 1, 0, null],
      ['휴대폰 충전기', '전자기기', 1, 1, null],
      ['보조배터리', '전자기기', 1, 0, '지도·사진 사용이 많아 배터리가 빨리 닳아요'],
      ['갈아입을 옷', '옷', 2, 1, null],
      ['속옷·양말', '옷', 3, 0, null],
      ['잠옷', '옷', 1, 0, null],
      ['바람막이', '옷', 1, 0, '바닷가는 저녁에 바람이 강해 쌀쌀할 수 있어요'],
      ['칫솔·치약', '세면·위생', 1, 1, null],
      ['선크림', '세면·위생', 1, 0, '해변 산책 중 햇볕에 오래 노출돼요'],
      ['상비약', '세면·위생', 1, 0, '소화제·진통제 정도는 챙기면 안심이에요'],
      ['물', '음식', 1, 0, null],
      ['우산', '기타', 1, 0, null],
    ],
  },
  {
    title: '면접 준비',
    situation: '면접',
    emoji: '👔',
    event_date: seoulDate(2),
    memo: '오전 10시 면접 · 30분 일찍 도착하기',
    is_template: 0,
    items: [
      ['신분증', '서류·지갑', 1, 1, null],
      ['수험표·면접 안내 문자', '서류·지갑', 1, 0, null],
      ['이력서 사본', '서류·지갑', 2, 1, null],
      ['포트폴리오', '서류·지갑', 1, 0, '면접관이 추가 자료를 요청할 수 있어요'],
      ['정장', '옷', 1, 1, null],
      ['구두', '옷', 1, 0, null],
      ['손수건', '세면·위생', 1, 0, null],
      ['휴대폰 충전기', '전자기기', 1, 0, null],
      ['보조배터리', '전자기기', 1, 0, null],
      ['필기구', '기타', 1, 1, null],
      ['예상 질문 메모', '기타', 1, 0, null],
      ['물', '음식', 1, 0, null],
    ],
  },
  {
    title: '캠핑 템플릿',
    situation: '캠핑',
    emoji: '⛺',
    event_date: null,
    memo: '1박2일 오토캠핑 기본 세트',
    is_template: 1,
    items: [
      ['텐트', '기타', 1, 0, null],
      ['침낭', '기타', 2, 0, null],
      ['캠핑 의자', '기타', 2, 0, null],
      ['랜턴', '전자기기', 1, 0, null],
      ['보조배터리', '전자기기', 1, 0, null],
      ['휴대폰 충전기', '전자기기', 1, 0, null],
      ['여벌 옷', '옷', 1, 0, null],
      ['경량 패딩', '옷', 1, 0, '산속은 밤에 기온이 크게 떨어져요'],
      ['칫솔·치약', '세면·위생', 1, 0, null],
      ['물티슈', '세면·위생', 2, 0, null],
      ['모기 기피제', '세면·위생', 1, 0, '풀숲 근처는 벌레가 많아요'],
      ['물', '음식', 4, 0, null],
      ['고기·채소', '음식', 1, 0, null],
      ['라면', '음식', 4, 0, null],
      ['신분증', '서류·지갑', 1, 0, null],
    ],
  },
];

const conn = await mysql.createConnection(connectionOptions());

try {
  await conn.beginTransaction();

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await conn.query(
    `INSERT INTO ck_users (email, password_hash, nickname) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), nickname = VALUES(nickname)`,
    [DEMO_EMAIL, hash, DEMO_NICKNAME],
  );
  const [[user]] = await conn.query('SELECT id FROM ck_users WHERE email = ?', [DEMO_EMAIL]);

  // 기존 데모 데이터 정리 (ck_items 는 ON DELETE CASCADE 로 함께 삭제)
  await conn.query('DELETE FROM ck_ai_logs WHERE user_id = ?', [user.id]);
  await conn.query('DELETE FROM ck_lists WHERE user_id = ?', [user.id]);

  for (const list of SAMPLE_LISTS) {
    const [result] = await conn.query(
      `INSERT INTO ck_lists (user_id, title, situation, emoji, event_date, memo, is_template)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, list.title, list.situation, list.emoji, list.event_date, list.memo, list.is_template],
    );
    const rows = list.items.map(([name, category, quantity, checked, reason], i) => [
      result.insertId, user.id, name, category, quantity, checked, reason ? 1 : 0, reason, i + 1,
    ]);
    await conn.query(
      `INSERT INTO ck_items (list_id, user_id, name, category, quantity, is_checked, is_ai, ai_reason, sort_order)
       VALUES ?`,
      [rows],
    );
    console.log(`✔ ${list.emoji} ${list.title} (항목 ${rows.length}개)`);
  }

  await conn.commit();
  console.log(`\n데모 계정 준비 완료: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
} catch (err) {
  await conn.rollback();
  console.error('시드 실패:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
