// GET /api/stats
// 총 참여자 수 / MBTI별 통계 / 최근 30일 날짜별 참여 수 반환

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. 총 참여자 수
    const { total } = await env.DB
      .prepare('SELECT COUNT(*) AS total FROM results')
      .first();

    // 2. MBTI 유형별 개수 (많은 순)
    const { results: by_mbti } = await env.DB
      .prepare(`
        SELECT result_mbti, COUNT(*) AS count
        FROM results
        GROUP BY result_mbti
        ORDER BY count DESC
      `)
      .all();

    // 3. 최근 30일 날짜별 참여 수
    const { results: daily } = await env.DB
      .prepare(`
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM results
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
      .all();

    return json({ total, by_mbti, daily_last_30: daily });
  } catch (e) {
    return json({ error: '통계 조회 중 오류가 발생했습니다.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
