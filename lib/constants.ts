// 서버·클라이언트가 함께 쓰는 고정 값

export const SITUATIONS = ['여행', '캠핑', '면접', '시험', '운동', '이사', '기타'] as const;
export type Situation = (typeof SITUATIONS)[number];

export const SITUATION_EMOJI: Record<Situation, string> = {
  여행: '✈️',
  캠핑: '⛺',
  면접: '👔',
  시험: '📝',
  운동: '🏃',
  이사: '📦',
  기타: '📌',
};

export const CATEGORIES = ['옷', '세면·위생', '전자기기', '서류·지갑', '음식', '기타'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<Category, string> = {
  옷: '👕',
  '세면·위생': '🧴',
  전자기기: '🔌',
  '서류·지갑': '👛',
  음식: '🍙',
  기타: '🎒',
};

// AI 만들기 화면의 선택 칩
export const DURATIONS = ['당일', '1박2일', '2박3일', '3박 이상'] as const;
export const COMPANIONS = ['혼자', '친구', '가족'] as const;
export const WEATHERS = ['더움', '추움', '비', '상관없음'] as const;

export const AI_REST_MESSAGE = 'AI가 잠시 쉬고 있어요. 직접 추가해 주세요 🙏';

export const LIMITS = {
  title: 60,
  memo: 500,
  itemName: 50,
  quantityMax: 99,
  place: 30,
  nickname: 30,
} as const;
