import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles } from 'lucide-react';

export default function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('mustard_newsletter_seen');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem('mustard_newsletter_seen', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setTimeout(() => closeModal(), 2000);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white border border-brand-border flex flex-col md:flex-row overflow-hidden shadow-2xl min-h-[450px]"
          >
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-brand-dark hover:text-brand-accent transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Image */}
            <div className="hidden md:flex w-1/2 bg-brand-secondary p-8 items-stretch">
              <div className="flex-1 border border-brand-border p-4 relative overflow-hidden bg-white flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=80&w=800"
                  alt="Mustard Deli Jars"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute top-4 left-4">
                   <Sparkles className="w-6 h-6 text-brand-accent animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center text-center md:text-left">
              <span className="text-brand-accent font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">The Member List</span>
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight leading-tight mb-4">
                Join the <span className="serif-italic lowercase">inner</span> circle.
              </h2>
              <p className="text-xs text-[#5B5550] leading-relaxed mb-8">
                Receive secret recipes, first access to limited small batches, and 15% off your next artisanal pairing.
              </p>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="YOUR EMAIL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-brand-secondary border border-brand-border p-4 text-[10px] font-bold uppercase tracking-widest focus:border-brand-dark focus:outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-brand-dark text-white p-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-accent transition-colors group"
                  >
                    <span>Request Entry</span>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-secondary border border-brand-accent p-6 text-center"
                >
                  <p className="text-brand-accent font-black uppercase tracking-widest text-[10px]">Welcome to the Deli</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-dark/40 mt-1">Check your inbox for your code.</p>
                </motion.div>
              )}

              <p className="mt-8 text-[9px] font-bold uppercase tracking-widest text-brand-dark/20">
                Small batches. Big flavours. No spam.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
