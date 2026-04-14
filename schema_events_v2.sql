-- events 테이블에 question_num 컬럼 추가 (quiz_abandon 이벤트용)
ALTER TABLE events ADD COLUMN question_num INTEGER;

CREATE INDEX IF NOT EXISTS idx_events_qnum ON events(question_num);
