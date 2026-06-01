import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiRefreshCw } from 'react-icons/fi';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  "What's trending today? 🔥",
  "Recommend something spicy 🌶️",
  "Best vegetarian options 🥗",
  "Cheap meals under ₹200 💰",
  "How do I track my order? 📍",
  "What coupons are available? 🎟️",
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Tomato AI 🍅 Your personal food assistant. I can help you find the perfect meal, track orders, and discover great deals. What are you craving today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data } = await aiAPI.chat({ messages: newMessages.map(({ role, content }) => ({ role, content })) });
      setMessages([...newMessages, { role: 'assistant', content: data.data.reply }]);
    } catch {
      toast.error('AI service unavailable');
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again! 🙏" }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared! How can I help you today? 🍅" }]);
  };

  return (
    <div className="container-app py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">🤖 Tomato AI Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Powered by AI • Ask me anything about food!</p>
        </div>
        <button onClick={clearChat} className="btn-ghost flex items-center gap-2 text-sm">
          <FiRefreshCw className="w-4 h-4" /> Clear
        </button>
      </div>

      {/* Chat Window */}
      <div className="glass-card overflow-hidden flex flex-col" style={{ height: 'min(65vh, 600px)' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm flex-shrink-0 mt-1">🍅</div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-white rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center text-sm flex-shrink-0 mt-1">👤</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm">🍅</div>
              <div className="bg-gray-100 dark:bg-dark-border px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} animate={{ y: [-3, 3, -3] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-2 h-2 bg-gray-400 rounded-full" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-dark-border">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} onClick={() => sendMessage(p)}
                className="flex-shrink-0 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about food, restaurants, orders..."
              className="input-field flex-1 text-sm"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 py-2.5 rounded-xl">
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
