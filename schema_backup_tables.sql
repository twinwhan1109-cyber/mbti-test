-- 초기화 Undo용 백업 테이블 (가장 최근 1회 초기화 직전 데이터 보관)
CREATE TABLE IF NOT EXISTS events_backup (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT     NOT NULL,
  session_id   TEXT,
  duration_ms  INTEGER,
  question_num INTEGER,
  ip_address   TEXT,
  created_at   DATETIME
);

CREATE TABLE IF NOT EXISTS results_backup (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  result_mbti  TEXT     NOT NULL,
  source_page  TEXT,
  user_agent   TEXT,
  created_at   DATETIME
);
