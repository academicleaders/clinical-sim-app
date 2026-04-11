import { NextRequest, NextResponse } from 'next/server';
import { openai } from '../../../app/lib/openai';
import { scenarios } from '../../../app/lib/scenarios';

type CharacterProfile = {
  firstName: string;
  age: number;
  gender: 'male' | 'female';
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenarioId,
      messages,
      characterProfile,
    }: {
      scenarioId?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      characterProfile?: CharacterProfile;
    } = body;

    const scenario =
      scenarios[scenarioId ?? 'chest-pain'] ?? scenarios['chest-pain'];

    const transcript = (messages ?? [])
      .map((msg) => {
        const speaker =
          msg.role === 'user'
            ? 'Nurse'
            : scenario.mode === 'clinical'
            ? 'Doctor'
            : scenario.mode === 'family'
            ? 'Family Member'
            : 'Patient';

        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    let characterDescription = '';

    if (scenario.mode === 'patient' && characterProfile) {
      const { firstName, age, gender } = characterProfile;
      characterDescription = `You are a ${age}-year-old ${
        gender === 'male' ? 'man' : 'woman'
      } named ${firstName}.`;
    }

    const systemPrompt = `
You are simulating a clinical communication scenario.

${
  scenario.mode === 'clinical'
    ? `You are a doctor speaking with a nurse.
The user is the nurse.
You must respond as the doctor only.
Be realistic, concise, and appropriate to the scenario.
Do not speak as a patient.
Do not explain that you are an AI.`
: scenario.mode === 'family'
    ? `You are a family member speaking with a nurse about a loved one.
The user is the nurse.
You must respond as the family member only.
You are not the patient.
Be realistic, emotionally believable, and appropriate to the scenario.
Do not explain that you are an AI.`
    : `You are a patient speaking with a nurse.
The user is the nurse.
You must respond as the patient only.
Never call the user "doctor".
Be realistic, natural, and brief unless the nurse asks for more detail.
Do not explain that you are an AI.`
}

Scenario title:
${scenario.title}

Clinical context:
${scenario.clinicalContext}

Persona:
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

Conversation so far:
${transcript || 'Nurse has not said anything yet.'}

Respond with ONLY the next reply from the ${
  scenario.mode === 'clinical'
    ? 'doctor'
    : scenario.mode === 'family'
    ? 'family member'
    : 'patient'
}.
Do not include labels like "Doctor:" or "Patient:".
Do not add explanations.
Just write the natural next reply.
`;

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: systemPrompt,
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      console.error('Empty OpenAI response in /api/chat:', response);
      return NextResponse.json({
        reply: 'Sorry, I am having trouble responding right now.',
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong in /api/chat.' },
      { status: 500 }
    );
  }
}