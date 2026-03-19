import { NextRequest, NextResponse } from 'next/server';
import { openai } from '../../../app/lib/openai';
import { scenarios } from '../../../app/lib/scenarios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, messages } = body;

    const scenario = scenarios[scenarioId] ?? scenarios['chest-pain'];

    const transcript = messages
      .map((msg: { role: string; content: string }) => {
        const speaker = msg.role === 'user' ? 'Nurse' : 'Patient';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const prompt = `
You are evaluating a nursing communication simulation.

Scenario title: ${scenario.title}
Scenario context: ${scenario.clinicalContext}

Evaluation criteria:
${scenario.evaluationCriteria.map((item) => `- ${item}`).join('\n')}

Conversation transcript:
${transcript}

Return ONLY valid JSON in this exact format:

{
  "score": number,
  "strengths": ["...", "..."],
  "missed_opportunities": ["...", "..."],
  "next_question": "..."
}

Do not use markdown.
Do not wrap the JSON in code fences.
Keep it concise, practical, and clinically relevant.
Base the feedback on the evaluation criteria above.
`;

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
    });

    const text = response.output_text.trim();

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        feedback: text,
      });
    }

    return NextResponse.json({
      feedback: parsed,
    });
  } catch (error) {
    console.error('Feedback route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong in /api/feedback.' },
      { status: 500 }
    );
  }
}