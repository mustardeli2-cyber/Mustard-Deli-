import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, MessageSquare, Wine, Utensils, Info } from 'lucide-react';
import { PRODUCTS } from '../constants';

// Extract product info for Gemini context
const productContext = PRODUCTS.map(p => ({
  name: p.name,
  description: p.description,
  pairings: p.pairings,
  category: p.category
}));

export default function MustardSommelier() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Welcome to the Mustard Deli. I am your AI Sommelier. Are you planning a braai, a cheese board, or perhaps a gourmet sandwich? Tell me what's on the menu, and I'll find your perfect artisanal pairing." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemini-3-flash-preview",
          contents: userMessage,
          config: {
            systemInstruction: `
              You are the "Mustard Sommelier" for Mustard Deli, a premium South African artisanal mustard brand based in Gqeberha.
              Your voice is elegant, passionate about food, and expert in culinary pairings.
              You have deep knowledge of the following products:
              ${JSON.stringify(productContext)}

              Rules:
              1. Always recommend one or more of the specific Mustard Deli products listed above.
              2. Explain WHY the pairing works (e.g., "The smoky notes of our Smoked Apricot compliment the saltiness of the aged cheddar").
              3. Mention South African culinary context where appropriate (braai, biltong, boerewors).
              4. Keep responses concise but evocative (max 3-4 sentences).
              5. If a user asks for something unrelated to food or mustard, politely steer them back to artisanal pairings.
              6. Use a "Sommelier" or "Alchemist" persona.
            `,
            temperature: 0.8,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.statusText}`);
      }

      const resultData = await response.json();
      const aiText = resultData.text || "I apologize, my tasting notes are a bit fuzzy. Could you rephrase your menu?";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: "Apologies, the cellar is currently closed for a private tasting. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 bg-brand-dark text-white p-4 shadow-2xl flex items-center gap-3 group"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-brand-accent transition-transform group-hover:rotate-12" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">AI Sommelier</span>
      </motion.button>

      {/* Chat Windows */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-96 h-[500px] bg-white border border-brand-border shadow-2xl z-50 flex flex-col overflow-hidden rounded-sm"
          >
            {/* Header */}
            <div className="p-4 bg-brand-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wine className="w-4 h-4 text-brand-accent" />
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Mustard Sommelier</h3>
                   <span className="text-[8px] opacity-60 uppercase tracking-tighter">Artisanal AI Assistant</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-secondary/30 custom-scrollbar"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-3 text-[11px] leading-relaxed shadow-sm ${
                    m.role === 'ai' 
                      ? 'bg-white border border-brand-border text-brand-dark italic serif-italic' 
                      : 'bg-brand-dark text-white font-medium'
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-brand-border p-3 flex gap-1">
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-brand-accent rounded-full" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-brand-accent rounded-full" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-brand-accent rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-brand-border bg-white">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for a pairing recommendation..."
                  className="flex-1 bg-brand-secondary/50 border border-brand-border px-4 py-3 text-[11px] focus:outline-none focus:border-brand-dark/50"
                  autoFocus
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !query.trim()}
                  className="bg-brand-dark text-white p-3 hover:bg-brand-accent transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                  onClick={() => { setQuery("How do I make a 3-minute pan sauce with mustard?"); }}
                  className="whitespace-nowrap px-3 py-1.5 border border-brand-border rounded-full text-[8px] font-black uppercase tracking-widest text-[#A3A31F] hover:border-brand-dark hover:text-brand-dark transition-all animate-pulse"
                >
                  🔥 3-Min Pan Sauce
                </button>
                <button 
                  onClick={() => { setQuery("What goes well with a Boerewors roll?"); }}
                  className="whitespace-nowrap px-3 py-1.5 border border-brand-border rounded-full text-[8px] font-bold uppercase tracking-widest text-brand-dark/40 hover:border-brand-dark hover:text-brand-dark transition-all"
                >
                  Boerewors Pairing
                </button>
                <button 
                  onClick={() => { setQuery("Best mustard for a cheese board?"); }}
                  className="whitespace-nowrap px-3 py-1.5 border border-brand-border rounded-full text-[8px] font-bold uppercase tracking-widest text-brand-dark/40 hover:border-brand-dark hover:text-brand-dark transition-all"
                >
                  Cheese Board
                </button>
                <button 
                  onClick={() => { setQuery("I'm making roast chicken..."); }}
                  className="whitespace-nowrap px-3 py-1.5 border border-brand-border rounded-full text-[8px] font-bold uppercase tracking-widest text-brand-dark/40 hover:border-brand-dark hover:text-brand-dark transition-all"
                >
                  Roast Chicken
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
