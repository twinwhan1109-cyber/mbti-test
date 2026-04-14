// GET /api/dashboard
// 대시보드용 전체 분석 데이터 반환

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. 전체 참여자 수 (results 테이블 기준)
    const { total } = await env.DB
      .prepare('SELECT COUNT(*) AS total FROM results')
      .first();

    // 2. 퀴즈 시작 수
    const { starts } = await env.DB
      .prepare("SELECT COUNT(*) AS starts FROM events WHERE event_type = 'quiz_start'")
      .first();

    // 3. 퀴즈 완료 수 (events 기준)
    const { completes } = await env.DB
      .prepare("SELECT COUNT(*) AS completes FROM events WHERE event_type = 'quiz_complete'")
      .first();

    // 4. 완료율 = 완료 수 / 시작 수 × 100
    const completion_rate = starts > 0 ? Math.round((completes / starts) * 100) : null;

    // 5. 평균 세션 시간
    const { avg_ms } = await env.DB
      .prepare("SELECT AVG(duration_ms) AS avg_ms FROM events WHERE event_type = 'quiz_complete' AND duration_ms IS NOT NULL")
      .first();
    const avg_session_sec = avg_ms ? Math.round(avg_ms / 1000) : null;

    // 6. 뉴스레터 클릭 수
    const { newsletter_clicks } = await env.DB
      .prepare("SELECT COUNT(*) AS newsletter_clicks FROM events WHERE event_type = 'newsletter_click'")
      .first();

    // 7. 인스타그램 클릭 수
    const { insta_clicks } = await env.DB
      .prepare("SELECT COUNT(*) AS insta_clicks FROM events WHERE event_type = 'insta_click'")
      .first();

    // 8. 전환율 (각각 100% 상한)
    const newsletter_conversion = completes > 0
      ? Math.min(100, Math.round(((newsletter_clicks || 0) / completes) * 100))
      : null;
    const insta_conversion = completes > 0
      ? Math.min(100, Math.round(((insta_clicks || 0) / completes) * 100))
      : null;

    // 9. MBTI 유형별 분포
    const { results: by_mbti } = await env.DB
      .prepare('SELECT result_mbti, COUNT(*) AS count FROM results GROUP BY result_mbti ORDER BY count DESC')
      .all();

    // 10. 최근 30일 일별 완료 수
    const { results: daily } = await env.DB
      .prepare(`
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM results
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
      .all();

    return json({
      total_participants: total,
      quiz_starts: starts,
      quiz_completes: completes,
      completion_rate,
      avg_session_sec,
      newsletter_clicks,
      insta_clicks,
      newsletter_conversion,
      insta_conversion,
      by_mbti,
      daily_last_30: daily,
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
