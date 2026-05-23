import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Mail, CheckCircle2 } from 'lucide-react';

export default function LeadMagnet() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(() => {
    return localStorage.getItem('mustard_newsletter_subscribed') === 'true';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Store in local storage as requested
      const subscribers = JSON.parse(localStorage.getItem('mustard_subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('mustard_subscribers', JSON.stringify(subscribers));
      }
      localStorage.setItem('mustard_newsletter_subscribed', 'true');
      setIsSubmitted(true);
    }
  };

  return (
    <section className="py-24 bg-brand-dark text-white overflow-hidden border-y border-brand-border/10">
      <div className="max-w-7xl mx-auto px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl" />
            <div className="relative">
              <span className="text-brand-accent text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">
                Seasonal Exclusive
              </span>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.9] mb-8">
                Make her day <br /> <span className="text-brand-accent">Extraordinary.</span>
              </h2>
              <p className="text-white/60 text-lg max-w-md leading-relaxed mb-8">
                Download our free Mother's Day Cookbook eBook. 15 artisanal recipes designed to celebrate with bold flavour.
              </p>
              
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-white/80">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand-accent" />
                  Mustard-Glazed Sunday Roasts
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand-accent" />
                  Savory Brunch Delights
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand-accent" />
                  Artisanal Dressing Secrets
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white p-12 lg:p-16 border border-brand-border relative"
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="relative z-10">
                <h3 className="text-brand-dark text-2xl font-black uppercase tracking-tight mb-2">
                  Join the Inner Circle
                </h3>
                <p className="text-brand-dark/50 text-xs font-bold uppercase tracking-widest mb-8">
                  Get our eBook + Weekly Flavour Updates
                </p>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/30" />
                    <input 
                      type="email" 
                      required
                      placeholder="YOUR@EMAIL.COM"
                      className="w-full bg-brand-secondary border border-brand-border px-12 py-5 text-brand-dark text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-accent transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-brand-accent text-white py-5 px-8 text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-colors flex items-center justify-center gap-3"
                  >
                    Send My Free Copy
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-[9px] text-brand-dark/30 mt-6 font-bold uppercase tracking-widest text-center">
                  By joining, you agree to receive flavour updates and exclusive offers.
                </p>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-brand-accent" />
                </div>
                <h3 className="text-brand-dark text-2xl font-black uppercase tracking-tight mb-4">
                  You're in!
                </h3>
                <p className="text-brand-dark/60 text-sm leading-relaxed max-w-xs mx-auto">
                  Welcome to the world of Mustard Deli. Your Mother's Day Cookbook should arrive shortly, followed by our best culinary secrets.
                </p>
              </motion.div>
            )}
            
            {/* Design Accents */}
            <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-brand-accent/20 -translate-y-2 translate-x-2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-brand-accent/20 translate-y-2 -translate-x-2" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
