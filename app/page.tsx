'use client';

import { useEffect, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type CharacterProfile = {
  firstName: string;
  age: number;
  gender: 'male' | 'female';
};

function generateRandomCharacter(): CharacterProfile {
  const maleNames = ['James', 'David', 'Michael', 'Robert', 'Daniel', 'Peter'];
  const femaleNames = ['Maria', 'Sarah', 'Laura', 'Anna', 'Sofia', 'Emma'];
  const genders: Array<'male' | 'female'> = ['male', 'female'];

  const gender = genders[Math.floor(Math.random() * genders.length)];
  const firstName =
    gender === 'male'
      ? maleNames[Math.floor(Math.random() * maleNames.length)]
      : femaleNames[Math.floor(Math.random() * femaleNames.length)];

  const age = Math.floor(Math.random() * (68 - 27 + 1)) + 27;

  return {
    firstName,
    age,
    gender,
  };
}

type FeedbackData =
  | {
      clarity_score: number;
      secondary_label: string;
      secondary_score: number;
      strengths: string[];
      language_improvements: string[];
      better_phrasing_example: {
        original: string;
        improved: string;
      };
      alternative_versions: {
        more_empathetic: string;
        more_assertive: string;
      };
      recommended_next_line: string;
    }
  | string;

const scenarioMeta: Record<string, { title: string; subtitle: string }> = {
  'chest-pain': {
    title: 'Chest Pain Scenario',
    subtitle: 'Emergency department triage case.',
  },
  'challenging-doctor-interaction': {
    title: 'Challenging Doctor Interaction Scenario',
    subtitle:
      'Clinical communication with a skeptical doctor who pushes for clear reasoning.',
  },
  fever: {
    title: 'Fever Scenario',
    subtitle: 'Urgent care infection screening case.',
  },
  'anxious-patient': {
    title: 'Anxious Patient Scenario',
    subtitle: 'Emergency triage with an anxious and worried patient.',
  },
  'confused-patient': {
    title: 'Confused Patient Scenario',
    subtitle:
      'Emergency triage with a mildly disoriented patient after head injury.',
  },
  'abdominal-pain': {
    title: 'Abdominal Pain Scenario',
    subtitle: 'Urgent care abdominal pain case.',
  },
  'shortness-of-breath': {
    title: 'Shortness of Breath Scenario',
    subtitle: 'Emergency department respiratory assessment case.',
  },
  headache: {
    title: 'Headache Scenario',
    subtitle: 'Urgent care neurological symptom assessment case.',
  },
  'random-issue': {
    title: 'Random Issue Scenario',
    subtitle: 'General intake scenario with an unpredictable complaint.',
  },
  'busy-doctor-handoff': {
    title: 'Busy Doctor Handoff Scenario',
    subtitle: 'Clinical communication with a busy doctor under time pressure.',
  },
  'unclear-patient': {
  title: 'Unclear Patient Scenario',
  subtitle: 'Patient who struggles to explain symptoms clearly.',
},
'jargon-doctor': {
  title: 'Jargon-Rich Doctor Scenario',
  subtitle: 'Doctor who speaks quickly using compressed and technical language.',
},
'frustrated-patient': {
    title: 'Frustrated Patient Scenario',
    subtitle: 'Triage interaction with an angry patient who has been waiting too long.',
  },
   'limited-english-patient': {
    title: 'Limited English Patient Scenario',
    subtitle: 'Patient with very basic English requiring simple and clear communication.',
  },
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'patient' | 'clinical'>('patient');
  const [scenarioId, setScenarioId] = useState('chest-pain');
  const [characterProfile, setCharacterProfile] =
    useState<CharacterProfile>(generateRandomCharacter());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setFeedback(null);

    if (mode === 'patient') {
      setCharacterProfile(generateRandomCharacter());
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId,
          messages: updatedMessages,
          characterProfile,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: data.reply,
          },
        ]);
      } else {
        console.error('No reply returned from /api/chat:', data);
      }
    } catch (error) {
      console.error('Frontend chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetFeedback = async () => {
    if (messages.length === 0 || feedbackLoading) return;

    setFeedbackLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId,
          messages,
        }),
      });

      const data = await res.json();

      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const structuredFeedback =
    feedback && typeof feedback !== 'string' ? feedback : null;

  const allScenarios = [
    { id: 'chest-pain', mode: 'patient' as const },
    { id: 'abdominal-pain', mode: 'patient' as const },
    { id: 'shortness-of-breath', mode: 'patient' as const },
    { id: 'headache', mode: 'patient' as const },
    { id: 'random-issue', mode: 'patient' as const },
    { id: 'anxious-patient', mode: 'patient' as const },
    { id: 'confused-patient', mode: 'patient' as const },
    { id: 'fever', mode: 'patient' as const },
    { id: 'busy-doctor-handoff', mode: 'clinical' as const },
    { id: 'challenging-doctor-interaction', mode: 'clinical' as const },
    { id: 'unclear-patient', mode: 'patient' as const },
    { id: 'frustrated-patient', mode: 'patient' as const },
    { id: 'limited-english-patient', mode: 'patient' as const },
{ id: 'jargon-doctor', mode: 'clinical' as const },

  ];

  const visibleScenarios = allScenarios.filter(
    (scenario) => scenario.mode === mode
  );

  const currentScenario =
    scenarioMeta[scenarioId] ?? scenarioMeta['chest-pain'];

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-3 sm:p-6">
      <div className="w-full max-w-3xl bg-white shadow rounded p-4 flex flex-col">
        <h1 className="text-xl font-semibold mb-4">
          Clinical Communication Simulator
        </h1>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mode:</label>
            <select
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value as 'patient' | 'clinical';
                setMode(newMode);
                setMessages([]);
                setFeedback(null);

                if (newMode === 'patient') {
                  setScenarioId('chest-pain');
                  setCharacterProfile(generateRandomCharacter());
                } else {
                  setScenarioId('busy-doctor-handoff');
                }
              }}
              className="border rounded p-2 flex-1"
            >
              <option value="patient">Patient Communication</option>
              <option value="clinical">Clinical Communication</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label className="text-sm font-medium shrink-0">
                Scenario:
              </label>
              <select
                value={scenarioId}
                onChange={(e) => {
                  setScenarioId(e.target.value);
                  setMessages([]);
                  setFeedback(null);

                  if (mode === 'patient') {
                    setCharacterProfile(generateRandomCharacter());
                  }
                }}
                className="border rounded p-2 flex-1 min-w-0"
              >
                {visibleScenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenarioMeta[scenario.id]?.title.replace(
                      ' Scenario',
                      ''
                    ) ?? scenario.id}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReset}
              className="bg-gray-200 px-3 py-2 rounded sm:w-auto w-full"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mb-3 p-3 border rounded bg-gray-50">
          <p className="text-sm font-semibold">{currentScenario.title}</p>
          <p className="text-xs text-gray-600">{currentScenario.subtitle}</p>
          {mode === 'patient' && mounted && (
            <p className="text-xs text-gray-500 mt-1">
              {characterProfile.firstName}, {characterProfile.age}
            </p>
          )}
        </div>

        <div className="h-[50vh] overflow-y-auto border p-3 rounded mb-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-100 ml-auto'
                  : 'bg-gray-200 mr-auto'
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {msg.role === 'user'
                  ? 'You'
                  : mode === 'clinical'
                  ? 'Doctor'
                  : 'Patient'}
              </p>
              <p>{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded max-w-[80%] bg-gray-200 mr-auto">
              <p className="text-sm font-medium mb-1">
                {mode === 'clinical' ? 'Doctor' : 'Patient'}
              </p>
              <p>Typing...</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded p-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'clinical'
                ? 'Speak to the doctor...'
                : 'Ask the patient a question...'
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={handleGetFeedback}
            disabled={messages.length === 0 || feedbackLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {feedbackLoading
              ? 'Evaluating...'
              : mode === 'clinical'
              ? 'Evaluate Communication'
              : 'End Session & Evaluate'}
          </button>
        </div>

        {structuredFeedback && (
          <div className="border rounded p-4 bg-gray-50 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Feedback</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded border bg-white p-3">
                  <p className="text-sm text-gray-600">Clarity</p>
                  <p className="text-2xl font-bold">
                    {structuredFeedback.clarity_score}/10
                  </p>
                </div>
                <div className="rounded border bg-white p-3">
                  <p className="text-sm text-gray-600">
                    {structuredFeedback.secondary_label}
                  </p>
                  <p className="text-2xl font-bold">
                    {structuredFeedback.secondary_score}/10
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Strengths</h3>
              <ul className="list-disc pl-5 space-y-1">
                {structuredFeedback.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Language Improvements</h3>
              <ul className="list-disc pl-5 space-y-1">
                {structuredFeedback.language_improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded border bg-white p-4 space-y-2">
              <h3 className="font-semibold">Better Phrasing Example</h3>
              <div>
                <p className="text-sm text-gray-600 mb-1">Original</p>
                <p className="italic">
                  “{structuredFeedback.better_phrasing_example.original}”
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Improved</p>
                <p className="font-medium">
                  “{structuredFeedback.better_phrasing_example.improved}”
                </p>
              </div>
            </div>

            <div className="rounded border bg-white p-4 space-y-3">
              <h3 className="font-semibold">Alternative Versions</h3>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  More Empathetic
                </p>
                <p>{structuredFeedback.alternative_versions.more_empathetic}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  More Assertive
                </p>
                <p>{structuredFeedback.alternative_versions.more_assertive}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                Recommended Next Line
              </h3>
              <p>{structuredFeedback.recommended_next_line}</p>
            </div>
          </div>
        )}

        {feedback && typeof feedback === 'string' && (
          <div className="border rounded p-4 bg-gray-50 whitespace-pre-wrap">
            <h2 className="text-lg font-semibold mb-2">Feedback</h2>
            <p>{feedback}</p>
          </div>
        )}
      </div>
    </main>
  );
}