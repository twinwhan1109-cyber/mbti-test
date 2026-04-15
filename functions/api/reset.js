// POST /api/reset
// 모든 이벤트 및 결과 데이터 초기화 (관리자 전용)

const RESET_SECRET = 'dig-reset-9zb4k-2024';

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400);
  }

  if (body.secret !== RESET_SECRET) {
    return json({ error: '인증 실패' }, 403);
  }

  try {
    // 1. 기존 백업 데이터 제거
    await env.DB.prepare('DELETE FROM events_backup').run();
    await env.DB.prepare('DELETE FROM results_backup').run();

    // 2. 현재 데이터를 백업 테이블에 복사
    await env.DB.prepare(`
      INSERT INTO events_backup (event_type, session_id, duration_ms, question_num, ip_address, created_at)
      SELECT event_type, session_id, duration_ms, question_num, ip_address, created_at FROM events
    `).run();
    await env.DB.prepare(`
      INSERT INTO results_backup (result_mbti, source_page, user_agent, created_at)
      SELECT result_mbti, source_page, user_agent, created_at FROM results
    `).run();

    // 3. 원본 데이터 삭제
    await env.DB.prepare('DELETE FROM events').run();
    await env.DB.prepare('DELETE FROM results').run();

    return json({ success: true, message: '모든 데이터가 초기화되었습니다.' });
  } catch (e) {
    console.error('[reset] DB error:', e.message);
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
