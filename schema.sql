-- MBTI 결과 저장 테이블
CREATE TABLE IF NOT EXISTS results (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  result_mbti TEXT     NOT NULL,           -- 예: "INFP"
  source_page TEXT,                        -- 어느 URL에서 왔는지 (선택)
  user_agent  TEXT,                        -- 브라우저 정보 (자동)
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 조회 속도를 높이기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_mbti       ON results(result_mbti);
CREATE INDEX IF NOT EXISTS idx_created_at ON results(created_at);
