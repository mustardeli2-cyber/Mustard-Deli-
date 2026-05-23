import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, X, Flame, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PRODUCTS } from '../constants';

interface FlavourAssistantProps {
  onAddToCart: (productId: string) => void;
}

export default function FlavourAssistant({ onAddToCart }: FlavourAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [heatLevel, setHeatLevel] = useState(50);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hello! I am your Mustard Deli Flavour Assistant. Need help choosing the perfect mustard or a recipe idea?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const productInfo = PRODUCTS.map(p => `- ${p.name}: ${p.description} | IMAGE_URL: ${p.image} | STOCK: ${p.stock > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}${p.awards ? ` | AWARDS: ${p.awards.map(a => `${a.year} ${a.title}`).join(', ')}` : ''}`).join('\n');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemini-3-flash-preview",
          contents: `You are a professional chef and flavour expert for "Mustard Deli", a South African artisanal mustard brand. 
              
              USER'S PREFERRED HEAT LEVEL: ${heatLevel}/100 (Where 0 is sweet/mild and 100 is intense/hot). 
              Prioritize products that align with this heat preference if relevant.

              Our current products, their image URLs, and stock status:
              ${productInfo}

              Goal: Answer the user's question about food pairings, recipes, or mustard recommendations.

              STRICT FORMATTING RULES:
              1. Use Markdown for your responses.
              2. When recommending a product, you MUST include its image using Markdown syntax: ![PRODUCT NAME](IMAGE_URL). 
              3. Use the EXACT IMAGE_URL provided in the list above. Do NOT hypothesize or change the URLs.
              4. Put the image on its OWN LINE, followed by the product name as a **BOLD HEADER**.
              5. Use bullet points for pairings and numbered lists for recipe steps.
              6. Only recommend products that are 'AVAILABLE'. 
              7. Mention the "Community Lab" section for user-submitted experimental flavour profiles.
              8. If you recommend multiple products, space them out clearly with images for each.

              User Question: ${userMessage}`
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.statusText}`);
      }

      const resultData = await response.json();
      const text = resultData.text || "I'm sorry, I couldn't formulate a response. Please try asking about our specific mustards!";
      setMessages(prev => [...prev, { role: 'bot', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to the flavour kitchen. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-10 right-10 z-[100]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-brand-dark text-white p-5 border border-white/10 shadow-2xl flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-brand-accent mr-3" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Flavour Helper</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 right-6 md:right-10 w-[90vw] md:w-[400px] h-[550px] bg-brand-bg border border-brand-dark z-[101] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="bg-brand-dark p-6 text-white flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-bold tracking-tight uppercase text-sm">Flavour Assistant</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-brand-accent rounded-full"></span>
                  <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Online</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 p-2 hover:bg-white/10 transition-colors group"
                aria-label="Close Assistant"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-brand-secondary border-b border-brand-border p-4">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-3 h-3 ${heatLevel > 70 ? 'text-brand-accent scale-125 animate-pulse' : 'text-brand-dark/40'} transition-all`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-dark">Set Heat Profile</span>
                  </div>
                  <span className="text-[8px] font-black text-brand-accent tracking-tighter">{heatLevel}% INTENSITY</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={heatLevel} 
                 onChange={(e) => setHeatLevel(parseInt(e.target.value))}
                 className="w-full accent-brand-accent h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer"
               />
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-bg"
            >
              {messages.map((m, i) => {
                if (!m) return null;
                return (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] uppercase tracking-widest text-brand-dark/40 mb-1 font-bold">
                        {m.role === 'user' ? 'Your Inquiry' : 'Chef Assistant'}
                      </span>
                      <div className={`p-4 text-xs leading-relaxed border ${m.role === 'user' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white border-brand-border text-brand-dark shadow-sm'}`}>
                        {m.role === 'user' ? (
                          m.text
                        ) : (
                          <div className="prose-none max-w-none text-xs leading-relaxed space-y-3">
                            <ReactMarkdown
                              components={{
                                img: ({ ...props }) => (
                                  <div className="my-4 first:mt-0 flex flex-col items-center">
                                    <div className="bg-white border border-brand-border p-2 shadow-sm hover:shadow-md transition-shadow">
                                      <img 
                                        {...props} 
                                        className="max-h-40 w-auto object-contain" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    {props.alt && (
                                      <div className="flex flex-col items-center gap-3 mt-3">
                                        <span className="text-[8px] uppercase tracking-widest text-brand-dark/40 font-black">
                                          {props.alt}
                                        </span>
                                        <button 
                                          onClick={() => {
                                            const product = PRODUCTS.find(p => p.name.toLowerCase() === props.alt?.toLowerCase());
                                            if (product) onAddToCart(product.id);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark text-white text-[8px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors"
                                        >
                                          <ShoppingBag className="w-3 h-3" />
                                          Add to Bag
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ),
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-3">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-3">{children}</ol>,
                                li: ({ children }) => <li className="pl-1 uppercase tracking-tight font-medium">{children}</li>,
                                strong: ({ children }) => <strong className="font-black text-brand-dark">{children}</strong>
                              }}
                            >
                              {m.text || ""}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-brand-border p-4 shadow-sm flex gap-1">
                    <div className="w-1 h-1 bg-brand-accent rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-brand-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 bg-brand-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-brand-dark flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for pairings..."
                className="flex-1 bg-brand-secondary border border-brand-border px-5 py-3 text-xs tracking-wider uppercase font-bold outline-none focus:border-brand-accent transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-brand-dark text-white p-3 hover:bg-brand-accent transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
