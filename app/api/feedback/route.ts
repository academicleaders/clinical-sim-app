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
        const speaker = msg.role === 'user'
          ? 'Nurse'
          : scenario.mode === 'clinical'
          ? 'Doctor'
          : 'Patient';

        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const prompt = `
You are evaluating a clinical English communication simulation.

This is NOT primarily a nursing-skills evaluation.
Do NOT focus mainly on whether the nurse covered every clinical question.
Your main job is to evaluate the quality of the nurse's English communication in a realistic clinical context.

Prioritize:
- clarity
- naturalness of phrasing
- professionalism
- empathy when appropriate
- ability to sound calm, human, and effective under pressure

Scenario title: ${scenario.title}
Scenario context: ${scenario.clinicalContext}
Scenario mode: ${scenario.mode}

Scenario-specific guidance:
${scenario.evaluationCriteria.map((item) => `- ${item}`).join('\n')}

Conversation transcript:
${transcript}

Return ONLY valid JSON in this exact format:

{
  "clarity_score": number,
  "empathy_score": number,
  "strengths": ["...", "..."],
  "language_improvements": ["...", "..."],
  "better_phrasing_example": {
    "original": "...",
    "improved": "..."
  },
  "alternative_versions": {
    "more_empathetic": "...",
    "more_assertive": "..."
  },
  "recommended_next_line": "..."
}

Important instructions:
- Score from 1 to 10.
- "clarity_score" should reflect how clear, natural, and easy to follow the nurse’s language was.
- "empathy_score" should reflect warmth, reassurance, and emotional awareness where appropriate.
- "strengths" should focus on communication strengths, not medical correctness.
- "language_improvements" should focus on wording, phrasing, tone, awkwardness, robotic wording, or unclear English.
- "better_phrasing_example" should pick ONE nurse line from the interaction that could be improved and provide a better, more natural version.
- "alternative_versions.more_empathetic" should offer a more empathetic version of the nurse’s communication style.
- "alternative_versions.more_assertive" should offer a more confident / concise / professionally assertive version.
- "recommended_next_line" must always be the next thing the NURSE should say.
- In patient mode, this should usually be a natural next patient-facing question or statement.
- In clinical mode, this should usually be a concise next line to the doctor.
- Do not use markdown.
- Do not wrap the JSON in code fences.
- Keep the feedback practical, concise, and focused on real-world clinical English.
- You may mention clinical relevance lightly, but language quality is the main focus.
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