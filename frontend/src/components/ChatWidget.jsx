import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';
import './ChatWidget.css';

const WELCOME = "Hi! I'm Pulse 👋 Your PCOS assistant. Ask me anything about PCOS, your results, or how to use the app.";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

    const send = async () => {
      const text = input.trim();
      if (!text || loading) return;

      const userMsg = { role: 'user', content: text };
      const history = [...messages, userMsg];

      setMessages([...history, { role: 'assistant', content: '' }]);
      setInput('');
      setLoading(true);

      try {
        const res = await chatAPI.sendMessage(
          history.map(m => ({ role: m.role, content: m.content }))
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on newlines and process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep the last incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Strip SSE "data: " prefix if present
            const text = trimmed.startsWith('data: ')
              ? trimmed.slice(6)
              : trimmed;

            if (text === '[DONE]') break;

            setMessages(prev => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                ...last,
                content: last.content + text,
              };
              return copy;
            });
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          };
          return copy;
        });
      } finally {
        setLoading(false);
      }
    };
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">P</div>
              <div>
                <strong>Pulse</strong>
                <span className="chat-status">● Online</span>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => {
            const isStreamingBubble = i === messages.length - 1 && m.role === 'assistant' && loading;
            return (
                <div key={i} className={`chat-bubble ${m.role}`}>
                {m.content
                    ? m.content
                    : isStreamingBubble
                    ? <span className="typing-dots"><span/><span/><span/></span>
                    : null
                }
                </div>
            );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about PCOS or your results…"
              rows={1}
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen(o => !o)}>
        {open
          ? <i className="fas fa-times"></i>
          : <i className="fas fa-comment-medical"></i>
        }
      </button>
    </div>
  );
};

export default ChatWidget;