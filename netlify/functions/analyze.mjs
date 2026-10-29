import { analyzeDemo, normalizeAIResponse, validateInput } from '../../server/analyzer.js';

import { aiAnalyze } from '../../server/ai.js';

export default async function handler(request) {
  const json = (data, status = 200) =>
    Response.json(data, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  if (request.method !== 'POST') {
    return json({ error: '허용되지 않은 요청입니다.' }, 405);
  }

  try {
    const body = await request.text();

    if (body.length > 16000) {
      return json({ error: '입력 크기를 줄여주세요.' }, 413);
    }

    let input;

    try {
      input = JSON.parse(body);
    } catch {
      return json({ error: '잘못된 JSON 형식입니다.' }, 400);
    }

    const error = validateInput(input);

    if (error) {
      return json({ error }, 400);
    }

    if (/\b\d{6}\s*-?\s*\d{7}\b/.test(input.note)) {
      return json(
        {
          error: '주민등록번호로 보이는 정보가 포함되어 있습니다.',
        },
        400
      );
    }

    if (input.mode === 'demo') {
      return json(analyzeDemo(input));
    }

    if (!process.env.OPENAI_API_KEY) {
      return json(
        {
          error: 'AI API 키가 설정되지 않았습니다.',
        },
        503
      );
    }

    try {
      const result = await aiAnalyze(input);
      return json(result);
    } catch (error) {
      console.error('AI analysis failed:', error.message);

      return json(
        {
          error: 'AI 분석에 실패했습니다.',
        },
        502
      );
    }
  } catch (error) {
    console.error('Request failed:', error);

    return json(
      {
        error: '요청을 처리하지 못했습니다.',
      },
      500
    );
  }
}
