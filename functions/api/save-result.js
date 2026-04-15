// POST /api/save-result
// 사용자의 MBTI 결과를 D1 DB에 저장

const VALID_MBTI = [
  'ESTJ','ESTP','ESFJ','ESFP',
  'ENTJ','ENTP','ENFJ','ENFP',
  'ISTJ','ISTP','ISFJ','ISFP',
  'INTJ','INTP','INFJ','INFP',
];

export async function onRequestPost(context) {
  const { request, env } = context;

  // JSON 파싱
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400);
  }

  const { result_mbti, source_page } = body;

  // MBTI 값 검증 (16개 유형만 허용)
  if (!result_mbti || !VALID_MBTI.includes(result_mbti)) {
    return json({ error: '유효하지 않은 MBTI 유형입니다.' }, 400);
  }

  // DB에 저장
  try {
    await env.DB.prepare(
      'INSERT INTO results (result_mbti, source_page, user_agent) VALUES (?, ?, ?)'
    )
    .bind(
      result_mbti,
      source_page || null,
      request.headers.get('User-Agent') || null
    )
    .run();

    return json({ success: true });
  } catch (e) {
    console.error('[save-result] DB error:', e.message, { result_mbti });
    return json({ error: 'DB 저장 중 오류가 발생했습니다.' }, 500);
  }
}

// JSON 응답 헬퍼
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
