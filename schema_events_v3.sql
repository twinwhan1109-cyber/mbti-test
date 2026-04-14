-- IP 주소 컬럼 추가 (고유 참여자 수 집계용)
ALTER TABLE events ADD COLUMN ip_address TEXT;

-- 공유 이벤트 인덱스 (event_type 인덱스로 커버됨)
CREATE INDEX IF NOT EXISTS idx_events_ip ON events(ip_address);
