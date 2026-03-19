'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type FeedbackData = {
  score: number;
  strengths: string[];
  missed_opportunities: string[];
  next_question: string;
} | string;

export default function Home() {
  const [scenarioId, setScenarioId] = useState('chest-pain');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setFeedback(null);
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

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-white shadow rounded p-4 flex flex-col">
        <h1 className="text-xl font-semibold mb-4">
          Clinical Communication Simulator
        </h1>

        <div className="mb-4 flex gap-2 items-center">
          <label className="text-sm font-medium">Scenario:</label>
          <select
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value);
              setMessages([]);
              setFeedback(null);
            }}
            className="border rounded p-2"
          >
            <option value="chest-pain">Chest Pain</option>
            <option value="abdominal-pain">Abdominal Pain</option>
          </select>

          <button
            onClick={handleReset}
            className="ml-auto bg-gray-200 px-3 py-2 rounded"
          >
            Reset
          </button>
        </div>

        <div className="mb-3 p-3 border rounded bg-gray-50">
          <p className="text-sm font-semibold">
            {scenarioId === 'chest-pain'
              ? 'Chest Pain Scenario'
              : 'Abdominal Pain Scenario'}
          </p>
          <p className="text-xs text-gray-600">
            {scenarioId === 'chest-pain'
              ? 'Emergency department triage case.'
              : 'Urgent care abdominal pain case.'}
          </p>
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
                {msg.role === 'user' ? 'You' : 'Patient'}
              </p>
              <p>{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded max-w-[80%] bg-gray-200 mr-auto">
              <p className="text-sm font-medium mb-1">Patient</p>
              <p>Typing...</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded p-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the patient a question..."
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
            {feedbackLoading ? 'Generating Feedback...' : 'Get Feedback'}
          </button>
        </div>

        {structuredFeedback && (
          <div className="border rounded p-4 bg-gray-50 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Feedback</h2>
              <p className="text-2xl font-bold mt-1">
                Score: {structuredFeedback.score}/10
              </p>
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
              <h3 className="font-semibold mb-2">Missed Opportunities</h3>
              <ul className="list-disc pl-5 space-y-1">
                {structuredFeedback.missed_opportunities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Suggested Next Question</h3>
              <p>{structuredFeedback.next_question}</p>
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