import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MessageSquare, ShieldCheck, Heart } from 'lucide-react';
import { fetchWithRetry } from '../lib/fetchUtils';
import { useAuth } from '../contexts/AuthContext';

interface BrandReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BrandReviewModal({ isOpen, onClose, onSuccess }: BrandReviewModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    author: user?.displayName || '',
    text: '',
    rating: 5,
    location: 'Web App'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetchWithRetry('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.uid || ''
        })
      });

      if (!res.ok) throw new Error('Failed to submit testimonial');

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ author: '', text: '', rating: 5, location: 'Web App' });
        onClose();
        if (onSuccess) onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white border border-brand-border relative overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-dark p-8 md:p-12 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent block mb-4">The Maker's Ledger</span>
              <h2 className="text-4xl font-black uppercase tracking-tight leading-none mb-4">
                Share Your <span className="serif-italic lowercase text-brand-accent">Journey</span>
              </h2>
              <p className="text-xs text-white/40 font-medium uppercase tracking-[0.1em] max-w-xs">
                Your feedback helps us maintain artisanal integrity.
              </p>
            </div>

            {/* Form Content */}
            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-8 h-8 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-dark mb-2">Thank You, Artisan</h3>
                    <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest">Your story has been added to our records.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 block ml-1">Display Name</label>
                        <input
                          required
                          value={formData.author}
                          onChange={e => setFormData(p => ({ ...p, author: e.target.value }))}
                          placeholder="ARTISAN S."
                          className="w-full bg-brand-secondary border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 block ml-1">Rating</label>
                        <div className="flex items-center gap-2 h-[50px] px-5 bg-brand-secondary border border-brand-border">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, rating: star }))}
                              className="focus:outline-none transition-transform active:scale-90"
                            >
                              <Star className={`w-4 h-4 ${star <= formData.rating ? 'fill-brand-accent text-brand-accent' : 'text-brand-dark/10'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 block ml-1">Your Experience</label>
                      <textarea
                        required
                        value={formData.text}
                        onChange={e => setFormData(p => ({ ...p, text: e.target.value }))}
                        placeholder="Tell us about your favourite pairing or app experience..."
                        rows={4}
                        className="w-full bg-brand-secondary border border-brand-border p-5 text-xs font-medium leading-relaxed outline-none focus:border-brand-accent transition-colors resize-none"
                      />
                    </div>

                    {error && (
                      <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{error}</p>
                    )}

                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full py-5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-accent transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? 'Recording...' : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Submit Testimonial
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-3 pt-4 opacity-30">
                       <ShieldCheck className="w-3 h-3" />
                       <span className="text-[8px] font-black uppercase tracking-[0.2em]">Verified Secure Submission</span>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
