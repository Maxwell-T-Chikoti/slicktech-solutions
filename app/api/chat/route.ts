import { NextRequest, NextResponse } from 'next/server';
import { COMPANY_KNOWLEDGE } from '@/app/lib/companyKnowledge';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type RequestBody = {
  message: string;
  history?: Message[];
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are SlickTech Assistant for SlickTech Solutions.

Use the company knowledge below as your source of truth.

${COMPANY_KNOWLEDGE}

Important behavior rules:
- Only answer with information supported by the company knowledge or the user's own message.
- Do not hallucinate or make up facts.
- If details are missing, say: "I don't have that specific information yet," and suggest a practical next step.
- If asked about pricing, schedules, policies, addresses, phone numbers, or contacts that are not explicitly provided, do not invent them.
- Keep answers clear, helpful, and concise.
- When relevant, guide users to booking, services, or support-related next steps.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503 });
    }

    const body: RequestBody = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const safeHistory = history
      .filter((entry) => entry?.role === 'user' || entry?.role === 'assistant')
      .slice(-10);

    const messages: Message[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...safeHistory,
      { role: 'user', content: message },
    ];

    const completionRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages,
      }),
    });

    if (!completionRes.ok) {
      const text = await completionRes.text();
      console.error('Groq API error:', text);
      return NextResponse.json({ error: 'AI request failed.' }, { status: 502 });
    }

    const data = await completionRes.json();
    const assistantMessage = data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 502 });
    }

    return NextResponse.json({
      message: assistantMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request.', details: error?.message },
      { status: 500 }
    );
  }
}
