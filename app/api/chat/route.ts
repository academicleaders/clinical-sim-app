import { NextRequest, NextResponse } from 'next/server';
import { openai } from '../../lib/openai';
import { scenarios } from '../../lib/scenarios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, messages, characterProfile } = body;

    const scenario = scenarios[scenarioId] ?? scenarios['chest-pain'];
let characterDescription = '';

if (scenario.mode === 'patient' && characterProfile) {
  const { firstName, age, gender } = characterProfile;

  characterDescription = `
You are a ${age}-year-old ${gender === 'male' ? 'man' : 'woman'} named ${firstName}.
`;
}
    const systemPrompt = `
You are simulating a patient in a clinical communication training scenario.

Scenario title:
${scenario.title}

Clinical context:
${scenario.clinicalContext}

Interaction type:
${scenario.mode === 'clinical'
  ? 'This is a clinical communication between a nurse and a doctor. The nurse is reporting and should NOT ask patient-style questions. Focus on clarity, structure, and appropriate escalation.'
  : 'This is a nurse-to-patient interaction. The nurse should gather information through appropriate questioning.'}

Patient persona:
${characterDescription}
${scenario.patientPersona}

Presenting complaint:
${scenario.presentingComplaint}

History of present illness:
${scenario.historyOfPresentIllness}

Tone:
${scenario.tone}

Rules:
${scenario.rules.map((rule) => `- ${rule}`).join('\n')}
`;

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    return NextResponse.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong in /api/chat.' },
      { status: 500 }
    );
  }
}