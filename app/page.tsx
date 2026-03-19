'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [scenarioId, setScenarioId] = useState('chest-pain');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setMessages([]);
    setInput('');
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

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl bg-white shadow rounded p-4 flex flex-col h-[80vh]">
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

        <div className="flex-1 overflow-y-auto border p-3 rounded mb-4 space-y-3">
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

        <div className="flex gap-2">
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
      </div>
    </main>
  );
}