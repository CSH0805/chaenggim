-- 챙김 데이터베이스 스키마
-- thoughtforge DB를 다른 프로젝트와 함께 쓰므로 모든 테이블에 ck_ 접두어를 붙인다.
-- TiDB Cloud / 구버전 MySQL 호환을 위해 트리거·프로시저·이벤트·윈도 함수는 사용하지 않는다.

CREATE TABLE IF NOT EXISTS ck_users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL,              -- 항상 소문자로 저장
  password_hash VARCHAR(100) NOT NULL,              -- bcrypt 해시
  nickname      VARCHAR(30)  NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ck_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ck_lists (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(60)  NOT NULL,
  situation   ENUM('여행','캠핑','면접','시험','운동','이사','기타') NOT NULL DEFAULT '기타',
  emoji       VARCHAR(16)  NOT NULL DEFAULT '📌',
  event_date  DATE         NULL,
  memo        VARCHAR(500) NULL,
  is_template TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ck_lists_user (user_id, is_template, event_date),
  CONSTRAINT fk_ck_lists_user FOREIGN KEY (user_id) REFERENCES ck_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ck_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  category   ENUM('옷','세면·위생','전자기기','서류·지갑','음식','기타') NOT NULL DEFAULT '기타',
  quantity   INT          NOT NULL DEFAULT 1,
  is_checked TINYINT(1)   NOT NULL DEFAULT 0,
  is_ai      TINYINT(1)   NOT NULL DEFAULT 0,       -- AI가 만든 항목이면 1
  ai_reason  VARCHAR(255) NULL,                     -- AI가 이 항목을 추천한 이유
  sort_order INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ck_items_list (list_id, sort_order),
  KEY idx_ck_items_user (user_id, name),
  CONSTRAINT fk_ck_items_list FOREIGN KEY (list_id) REFERENCES ck_lists (id) ON DELETE CASCADE,
  CONSTRAINT fk_ck_items_user FOREIGN KEY (user_id) REFERENCES ck_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ck_ai_logs (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  list_id       INT UNSIGNED NULL,                  -- 생성 직후(저장 전)에는 NULL
  kind          ENUM('generate','review') NOT NULL,
  response_json TEXT         NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ck_ai_logs_user (user_id, created_at),
  CONSTRAINT fk_ck_ai_logs_user FOREIGN KEY (user_id) REFERENCES ck_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ck_ai_logs_list FOREIGN KEY (list_id) REFERENCES ck_lists (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
