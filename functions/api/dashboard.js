// GET /api/dashboard
// 대시보드용 전체 분석 데이터 반환

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. 퀴즈 시작 수 (누적)
    const { starts } = await env.DB
      .prepare("SELECT COUNT(*) AS starts FROM events WHERE event_type = 'quiz_start'")
      .first();

    // 2. 고유 참여자 수 (IP 기준, 없으면 session_id fallback)
    const { unique_participants } = await env.DB
      .prepare(`
        SELECT COUNT(DISTINCT COALESCE(ip_address, session_id)) AS unique_participants
        FROM events
        WHERE event_type = 'quiz_start'
      `)
      .first();

    // 3. 퀴즈 완료 수
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

    // 8. 전환율 = 퀴즈 완료 세션 중 클릭한 고유 세션 / 완료 수 × 100
    const { newsletter_conv_count } = await env.DB
      .prepare(`
        SELECT COUNT(DISTINCT c.session_id) AS newsletter_conv_count
        FROM events c
        INNER JOIN events q ON c.session_id = q.session_id
        WHERE c.event_type = 'newsletter_click'
          AND q.event_type = 'quiz_complete'
          AND c.session_id IS NOT NULL
      `)
      .first();
    const { insta_conv_count } = await env.DB
      .prepare(`
        SELECT COUNT(DISTINCT c.session_id) AS insta_conv_count
        FROM events c
        INNER JOIN events q ON c.session_id = q.session_id
        WHERE c.event_type = 'insta_click'
          AND q.event_type = 'quiz_complete'
          AND c.session_id IS NOT NULL
      `)
      .first();

    const newsletter_conversion = completes > 0
      ? Math.min(100, Math.round(((newsletter_conv_count || 0) / completes) * 100))
      : null;
    const insta_conversion = completes > 0
      ? Math.min(100, Math.round(((insta_conv_count || 0) / completes) * 100))
      : null;

    // 9. 공유 버튼별 클릭 수
    const { kakao_shares }    = await env.DB.prepare("SELECT COUNT(*) AS kakao_shares    FROM events WHERE event_type = 'share_kakao'").first();
    const { facebook_shares } = await env.DB.prepare("SELECT COUNT(*) AS facebook_shares FROM events WHERE event_type = 'share_facebook'").first();
    const { twitter_shares }  = await env.DB.prepare("SELECT COUNT(*) AS twitter_shares  FROM events WHERE event_type = 'share_twitter'").first();
    const { link_shares }     = await env.DB.prepare("SELECT COUNT(*) AS link_shares     FROM events WHERE event_type = 'share_link'").first();
    const { image_saves }     = await env.DB.prepare("SELECT COUNT(*) AS image_saves     FROM events WHERE event_type = 'image_save'").first();
    // 총 공유수: 이미지 저장(다운로드)은 제외, 링크 복사는 포함
    const total_shares = (kakao_shares || 0) + (facebook_shares || 0) + (twitter_shares || 0) + (link_shares || 0);

    // 10. MBTI 유형별 분포
    const { results: by_mbti } = await env.DB
      .prepare('SELECT result_mbti, COUNT(*) AS count FROM results GROUP BY result_mbti ORDER BY count DESC')
      .all();

    // 11. 최근 30일 일별 완료 수
    const { results: daily } = await env.DB
      .prepare(`
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM results
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
      .all();

    // 12. 문항별 이탈 수
    const { results: abandon_raw } = await env.DB
      .prepare(`
        SELECT question_num, COUNT(*) AS count
        FROM events
        WHERE event_type = 'quiz_abandon' AND question_num IS NOT NULL
        GROUP BY question_num
        ORDER BY question_num ASC
      `)
      .all();

    const abandon_by_question = abandon_raw.map(r => ({
      question_num: r.question_num,
      abandon_count: r.count,
      abandon_rate: starts > 0 ? Math.round((r.count / starts) * 100) : 0,
    }));

    return json({
      unique_participants,
      quiz_starts: starts,
      quiz_completes: completes,
      completion_rate,
      avg_session_sec,
      newsletter_clicks,
      insta_clicks,
      newsletter_conversion,
      insta_conversion,
      kakao_shares,
      facebook_shares,
      twitter_shares,
      link_shares,
      image_saves,
      total_shares,
      by_mbti,
      daily_last_30: daily,
      abandon_by_question,
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
