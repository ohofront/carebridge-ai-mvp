export default async function handler(request) {
  if (request.method !== 'GET') {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 405 });
  }

  const hasAI = Boolean(process.env.OPENAI_API_KEY);

  return Response.json(
    {
      aiConfigured: hasAI,
      mode: hasAI ? 'ai-available' : 'demo-only',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
