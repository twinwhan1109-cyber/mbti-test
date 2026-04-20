// POST /api/undo-reset
// 가장 최근 초기화 직전 데이터를 백업 테이블에서 복원 (관리자 전용)

export async function onRequestPost(context) {
  const { request, env } = context;
  const RESET_SECRET = env.RESET_SECRET;

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
    // 백업 데이터 존재 여부 확인
    const { count } = await env.DB
      .prepare('SELECT COUNT(*) AS count FROM events_backup')
      .first();

    if (!count || count === 0) {
      return json({ error: '복원할 백업 데이터가 없습니다.' }, 404);
    }

    // 현재 데이터 삭제 후 백업에서 복원
    await env.DB.prepare('DELETE FROM events').run();
    await env.DB.prepare('DELETE FROM results').run();

    await env.DB.prepare(`
      INSERT INTO events (event_type, session_id, duration_ms, question_num, ip_address, created_at)
      SELECT event_type, session_id, duration_ms, question_num, ip_address, created_at FROM events_backup
    `).run();
    await env.DB.prepare(`
      INSERT INTO results (result_mbti, source_page, user_agent, created_at)
      SELECT result_mbti, source_page, user_agent, created_at FROM results_backup
    `).run();

    return json({ success: true, message: '데이터가 복원되었습니다.', restored: count });
  } catch (e) {
    console.error('[undo-reset] DB error:', e.message);
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
