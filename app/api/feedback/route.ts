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
        const speaker =
          msg.role === 'user'
            ? 'Nurse'
            : scenario.mode === 'clinical'
            ? 'Doctor'
            : 'Patient';

        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const secondaryLabel =
      scenario.mode === 'clinical' ? 'Professionalism' : 'Empathy';

    const secondaryExplanation =
      scenario.mode === 'clinical'
        ? 'For clinical communication, the secondary score must be Professionalism. Judge calmness, concise wording, confidence, appropriate tone, and how well the nurse communicates under pressure with another clinician.'
        : 'For patient communication, the secondary score must be Empathy. Judge warmth, reassurance, emotional awareness, and whether the nurse sounds human and supportive when appropriate.';

    const prompt = `
You are evaluating a clinical English communication simulation.

This is NOT primarily a nursing-skills evaluation.
Do NOT focus mainly on whether the nurse covered every clinical question.
Your main job is to evaluate the quality of the nurse's English communication in a realistic clinical context.

When generating feedback and improved phrasing, focus on producing natural, realistic clinical communication that reflects how a competent nurse would actually speak in a Canadian healthcare setting. Do not adopt the role of a nurse yourself; instead, evaluate and refine the user’s message so it sounds appropriate for real-world interactions with patients or doctors.

Prioritize clarity, efficiency, and calm professionalism over "perfect" or overly polished English. Suggested rewrites should sound like spoken communication under mild time pressure — slightly informal but still professional, concise, and easy to follow. Avoid textbook-style phrasing, overly complete sentences, or language that feels rehearsed, literary, or artificial.

Prefer spoken nurse language over written-report language. Avoid sounding corporate, therapy-like, excessively diplomatic, or unnaturally refined. The output should sound like something a competent nurse could realistically say out loud in a real Canadian clinical interaction.

For empathy, ensure the phrasing briefly acknowledges the patient’s emotional state in a natural and supportive way, without becoming overly sentimental, wordy, or soft. For assertiveness, ensure the phrasing is clear, direct, and confident, without sounding cold, rigid, or confrontational.

All suggestions should feel practical, human, and usable immediately in a real clinical setting, rather than idealized or overly refined versions of English.

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
  "secondary_label": "${secondaryLabel}",
  "secondary_score": number,
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
- "secondary_label" must be exactly "${secondaryLabel}".
- "secondary_score" must evaluate the meaning of "${secondaryLabel}", not a generic second score.
- ${secondaryExplanation}
- "strengths" should focus on communication strengths, not medical correctness.
- "language_improvements" should focus on wording, phrasing, tone, awkwardness, robotic wording, or unclear English.
- "better_phrasing_example" should pick ONE nurse line from the interaction that could be improved and provide a better, more natural spoken version.
- "alternative_versions.more_empathetic" should offer a more empathetic version of the nurse’s communication style, but still sound realistic and concise.
- "alternative_versions.more_assertive" should offer a more confident / concise / professionally assertive version, but still sound like real spoken clinical English.
- "recommended_next_line" must always be the next thing the NURSE should say.
- In patient mode, this should usually be a natural next patient-facing question or statement.
- In clinical mode, this should usually be a concise next line to the doctor.
- Avoid overcorrecting into stiff or overly polished English.
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
      .replace(/^```json\\s*/i, '')
      .replace(/^```\\s*/i, '')
      .replace(/\\s*```$/i, '')
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