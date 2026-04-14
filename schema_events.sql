-- 이벤트 추적 테이블
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT     NOT NULL,   -- 'quiz_start' | 'quiz_complete' | 'newsletter_click' | 'insta_click'
  session_id  TEXT,                -- 세션 식별자 (프론트에서 생성)
  duration_ms INTEGER,             -- quiz_complete 시 소요 시간(ms)
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_type    ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
