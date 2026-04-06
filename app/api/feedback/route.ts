import { NextRequest, NextResponse } from 'next/server';
import { openai } from '../../../app/lib/openai';
import { scenarios } from '../../../app/lib/scenarios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, messages } = body;

    const scenario = scenarios[scenarioId] ?? scenarios['chest-pain'];
    const isClinical = scenario.mode === 'clinical';
    const secondaryLabel = isClinical ? 'Professionalism' : 'Empathy';

    const nurseMessages = messages.filter(
  (msg: { role: string }) => msg.role === 'user'
);

if (nurseMessages.length < 3) {
  return NextResponse.json({
    feedback: {
      clarity_score: 3,
      secondary_label: secondaryLabel,
      secondary_score: 3,
      strengths: [
        'You started the interaction clearly.'
      ],
      language_improvements: [
        'This session is too short for a full evaluation.',
        'Try completing at least 3 nurse messages so the feedback can be more accurate.',
      ],
      better_phrasing_example: {
        original: nurseMessages[0]?.content ?? '',
        improved: nurseMessages[0]?.content ?? '',
      },
      alternative_versions: {
        more_empathetic: '',
        more_assertive: '',
      },
      recommended_next_line:
        isClinical
          ? 'Continue the interaction and give a bit more detail before requesting feedback.'
          : 'Continue the interaction with a few more focused questions before requesting feedback.',
    },
  });
}

    const transcript = messages
      .map((msg: { role: string; content: string }) => {
        const speaker =
          msg.role === 'user'
            ? 'Nurse'
            : isClinical
            ? 'Doctor'
            : 'Patient';

        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const secondaryExplanation = isClinical
      ? 'For clinical communication, the secondary score must be Professionalism. Judge calmness, concise wording, confidence, appropriate tone, and how well the nurse communicates under pressure with another clinician.'
      : 'For patient communication, the secondary score must be Empathy. Judge warmth, reassurance, emotional awareness, and whether the nurse sounds human and supportive when appropriate.';

    const prompt = `
You are evaluating a clinical English communication simulation.

This is NOT primarily a nursing-skills evaluation.
Do NOT focus mainly on whether the nurse covered every clinical question.
Your main job is to evaluate the quality of the nurse's spoken English communication in a realistic clinical context.

---

CORE INTERPRETATION RULE:

Treat ALL input as SPOKEN communication, not written text.

---

PUNCTUATION RULE (STRICT):

- You must NEVER mention punctuation, capitalization, or formatting in any part of the feedback.
- This includes (but is not limited to): commas, exclamation marks, sentence structure, capitalization, or written correctness.
- Any feedback referring to punctuation or writing mechanics is INVALID.

---

COMMUNICATION STANDARD:

Evaluate how natural, clear, and effective the nurse sounds in a real Canadian clinical setting.

Use this context as a professional reference point, not a cultural one.

Do NOT make general statements about "Canadian communication style".
Focus only on observable communication behaviors in a clinical setting.

Focus on:
- clarity
- natural spoken phrasing
- professionalism
- calm tone under pressure
- efficiency of communication
- empathy (when appropriate)
- assertiveness (when appropriate)

---

CONTEXTUAL ANCHORING (USE SPARINGLY):

You may occasionally use a short phrase such as:

"In a Canadian hospital setting..."

ONLY when it makes the feedback more concrete or practical.

When used, it must:

- refer to a specific communication behavior (e.g., urgency, directness, prioritization)
- improve clarity of the feedback
- sound natural and professional

Avoid:

- generic or vague statements
- repeated use across feedback
- cultural explanations or commentary

The goal is to make feedback more grounded in real clinical communication, not more abstract.

---

STYLE GUIDELINES:

- Prefer spoken nurse language over written or academic language
- Avoid textbook phring
- Avoid overly polished or "perfect" English
- Avoid robotic or scripted communication
- Avoid corporate, therapy-like, or overly diplomatic tone
- Keep phrasing practical and usable in real-time interaction

Whenever suggesting improvements, prefer concrete rephrasing over abstract advice.

The output should sound like something a competent nurse would realistically say out loud.

---

EMPATHY:

When appropriate, briefly acknowledge the patient’s emotional state in a natural and human way.
Do NOT be overly sentimental or wordy.

---

ASSERTIVENESS:

Ensure communication is clear, direct, and confident when needed.
Do NOT sound aggressive or rigid.

---

CLINICAL MODE ADJUSTMENT:

If this is a doctor interaction, prioritize clarity and directness over empathy.

IMPORTANT:
- The JSON key "more_empathetic" must still be used
- BUT in clinical scenarios, this field should contain a CLEARER / MORE DIRECT version (not a warmer one)

---

OUTPUT REQUIREMENTS (STRICT):

Return ONLY valid JSON with the following structure:

{
  "clarity_score": number (0-10),
  "secondary_label": string,
  "secondary_score": number (0-10),
  "strengths": string[],
  "language_improvements": string[],
  "better_phrasing_example": {
    "original": string,
    "improved": string
  },
  "alternative_versions": {
    "more_empathetic": string,
    "more_assertive": string
  },
  "recommended_next_line": string
}

---

OUTPUT CONSTRAINTS:

- Do NOT mention punctuation anywhere in:
  - strengths
  - language_improvements
  - better_phrasing_example
  - alternative_versions
  - recommended_next_line

- Feedback must reflect spoken communication quality only

- Avoid vague feedback such as "be more clear" or "improve tone". All feedback must be specific and actionable.

- Focus ONLY on meaningful communication improvements (clarity, tone, natural phrasing)

---

IMPORTANT:

All feedback must feel realistic, practical, and immediately usable in real clinical interactions.

Avoid nitpicking.
Avoid irrelevant corrections.
Focus on what actually improves real-world communication.

---

Scenario title: ${scenario.title}
Scenario context: ${scenario.clinicalContext}
Scenario mode: ${scenario.mode}

Scenario-specific guidance:
${scenario.evaluationCriteria.map((item) => `- ${item}`).join('\\n')}

Conversation transcript:
${transcript}

---

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

---

Important instructions:

- Score from 1 to 10.
- "clarity_score" should reflect how clear, natural, and easy to follow the nurse’s language was.
- "secondary_label" must be exactly "${secondaryLabel}".
- "secondary_score" must evaluate the meaning of "${secondaryLabel}", not a generic second score.
- ${secondaryExplanation}
- "strengths" should focus on communication strengths, not medical correctness.
- "language_improvements" should focus on wording, phrasing, tone, awkwardness, or unclear spoken English.
- "better_phrasing_example" should pick ONE nurse line from the interaction that could be improved and provide a better, more natural spoken version.

- "alternative_versions.more_empathetic" should offer:
  ${
    isClinical
      ? 'a clearer, more direct, and more professionally usable version of the nurse’s communication.'
      : 'a more empathetic version of the nurse’s communication style.'
  }

- "alternative_versions.more_assertive" should offer a more confident / concise / professionally assertive version.

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