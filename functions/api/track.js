// POST /api/track
// 퀴즈 시작 / 완료 / 버튼 클릭 이벤트 기록

const VALID_EVENTS = [
  'quiz_start', 'quiz_complete',
  'newsletter_click', 'insta_click',
  'quiz_abandon',
  'share_kakao', 'share_facebook', 'share_twitter', 'share_image', 'image_save',
];

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400);
  }

  const { event_type, session_id, duration_ms, question_num } = body;

  if (!VALID_EVENTS.includes(event_type)) {
    return json({ error: '유효하지 않은 이벤트 유형입니다.' }, 400);
  }

  // 접속 IP (Cloudflare → CF-Connecting-IP 헤더 우선)
  const ip_address =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Real-IP') ||
    (request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() ||
    null;

  try {
    await env.DB.prepare(
      'INSERT INTO events (event_type, session_id, duration_ms, question_num, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      event_type,
      session_id || null,
      duration_ms != null ? Math.round(duration_ms) : null,
      question_num != null ? Number(question_num) : null,
      ip_address
    ).run();

    return json({ success: true });
  } catch (e) {
    console.error('[track] DB error:', e.message, { event_type, session_id });
    return json({ error: 'DB 저장 중 오류가 발생했습니다.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
