import { NextRequest, NextResponse } from 'next/server';

type RequestBody = {
  type?: 'scheduling' | 'demand';
  payload?: any;
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const extractJson = (text: string) => {
  const trimmed = text.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const makeSchedulingPrompt = (payload: any) => {
  return [
    'You are an expert scheduling AI assistant for a service business.',
    'Return STRICT JSON only with this shape:',
    '{"primary":{"date":"Month D, YYYY","time":"h:mm AM/PM","reason":"...","cancellationRisk":number},"backups":[{"date":"Month D, YYYY","time":"h:mm AM/PM","reason":"...","cancellationRisk":number}]}.',
    'Rules:',
    '- Suggest one best slot and up to two backup slots.',
    '- Avoid blocked dates and avoid highly conflicted slots based on existing bookings.',
    '- Use user historical preferences when possible.',
    '- cancellationRisk must be 0-100 integer.',
    '- Keep reasons short and practical.',
    `Data: ${JSON.stringify(payload)}`,
  ].join('\n');
};

const makeDemandPrompt = (payload: any) => {
  return [
    'You are an operations demand-forecasting AI for a booking platform.',
    'Return STRICT JSON only with this shape:',
    '{"forecast":[{"day":"Monday","probability":number,"predictedLoad":"Low|Moderate|High|Full","suggestedStaff":"..."}],"summary":{"busiestDay":"...","lowDemandDay":"...","note":"..."}}.',
    'Rules:',
    '- Forecast for exactly: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.',
    '- probability must be integer 0-100.',
    '- predictedLoad should map probability bands logically.',
    '- suggestedStaff must be concise and actionable.',
    '- note should be one short sentence.',
    `Data: ${JSON.stringify(payload)}`,
  ].join('\n');
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 503 });
    }

    const body: RequestBody = await req.json();
    if (!body?.type || !body?.payload) {
      return NextResponse.json({ error: 'Missing type or payload.' }, { status: 400 });
    }

    const userPrompt = body.type === 'scheduling'
      ? makeSchedulingPrompt(body.payload)
      : makeDemandPrompt(body.payload);

    const completionRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'Return valid JSON only. Do not include markdown fences.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!completionRes.ok) {
      const text = await completionRes.text();
      return NextResponse.json({ error: 'AI provider request failed.', details: text }, { status: 502 });
    }

    const completionJson = await completionRes.json();
    const text = completionJson?.choices?.[0]?.message?.content;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No AI response content returned.' }, { status: 502 });
    }

    const parsed = JSON.parse(extractJson(text));
    return NextResponse.json({ result: parsed });
  } catch (error: any) {
    console.error('AI insights route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI insights.', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
