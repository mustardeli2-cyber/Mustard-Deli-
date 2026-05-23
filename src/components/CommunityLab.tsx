import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, Plus, Star, User, Clock, Check, Loader2, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';

interface Suggestion {
  id: string;
  name: string;
  description: string;
  authorName: string;
  votes: number;
  createdAt: any;
}

export default function CommunityLab() {
  const { user } = useAuth();
  const { earnPoints } = useNotifications();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'suggestions'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Suggestion[];
      setSuggestions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suggestions');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName || !newDesc || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'suggestions'), {
        name: newName,
        description: newDesc,
        authorName: user.displayName || 'Anonymous Member',
        authorId: user.uid,
        votes: 0,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'activity'), {
        type: 'suggestion_created',
        userId: user.uid,
        userName: user.displayName || 'Anonymous Member',
        message: `suggested a new flavor breakthrough: "${newName}"`,
        targetId: docRef.id,
        createdAt: serverTimestamp()
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#2F4F4F']
      });

      // Award loyalty points for contributing an experimental formula
      try {
        await earnPoints(10, 'Artisanal Flavour Suggestion');
      } catch (ptsErr) {
        console.warn('Failed to assign loyalty points:', ptsErr);
      }

      setNewName('');
      setNewDesc('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (suggestion: Suggestion) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'suggestions', suggestion.id);
      await updateDoc(docRef, {
        votes: increment(1)
      });

      await addDoc(collection(db, 'activity'), {
        type: 'vote_cast',
        userId: user.uid,
        userName: user.displayName || 'Anonymous Member',
        message: `supported the "${suggestion.name}" batch`,
        targetId: suggestion.id,
        createdAt: serverTimestamp()
      });

      // Award loyalty points for casting an experimental formula vote
      try {
        await earnPoints(2, 'Artisanal Selection Vote');
      } catch (ptsErr) {
        console.warn('Failed to assign loyalty points:', ptsErr);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  return (
    <section className="py-32 px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-accent/10 flex items-center justify-center">
                <Beaker className="w-5 h-5 text-brand-accent" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Experimental Program</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-dark mb-6 uppercase">The Community Lab</h2>
            <p className="text-[#5B5550] text-lg leading-relaxed italic serif-italic">
              Where bold ideas ferment. Suggest a new flavour profile and help us decide what slow-made batch hits the pantry next.
            </p>
          </div>
          
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="group flex items-center gap-4 px-8 py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-accent transition-all duration-500 shadow-xl"
          >
            {isAdding ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Discard Idea
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
                Submit Flavour Profile
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-20"
            >
              <div className="bg-brand-bg p-8 md:p-12 border border-brand-border">
                {user ? (
                  <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 mb-4 block">Flavour Name</label>
                        <input 
                          type="text" 
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Smoky Cape Gooseberry"
                          className="w-full bg-white border border-brand-border px-6 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 mb-4 block">The Profile (Description)</label>
                        <textarea 
                          required
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          placeholder="Describe the heat level, acid balance, and recommended pairings..."
                          rows={4}
                          className="w-full bg-white border border-brand-border px-6 py-4 text-xs font-bold tracking-wider outline-none focus:border-brand-accent transition-colors resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div className="p-8 border border-brand-accent/20 bg-brand-accent/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-4">Submission Guidelines</h4>
                        <ul className="space-y-3">
                          {['Natural ingredients only', 'Artisanal focus', 'South African inspiration preferred'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-brand-dark/60 uppercase tracking-wide">
                              <Star className="w-2.5 h-2.5 text-brand-accent" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-8 md:mt-0 w-full py-6 bg-brand-accent text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bottle This Idea'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm font-black uppercase tracking-widest text-brand-dark mb-6">You must be a synced member to suggest flavours</p>
                    <p className="text-xs text-brand-dark/40 uppercase font-bold tracking-widest max-w-md mx-auto">Join the bridge to participate in the community lab and help us craft the next batch.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-brand-bg animate-pulse border border-brand-border" />
            ))
          ) : (
            suggestions.map((suggestion) => (
              <motion.div 
                key={suggestion.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-brand-bg p-8 border border-brand-border flex flex-col hover:border-brand-accent/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-dark/30" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-brand-dark">{suggestion.authorName}</p>
                      <div className="flex items-center gap-1.5 opacity-40">
                         <Clock className="w-2.5 h-2.5" />
                         <span className="text-[7px] font-bold uppercase tracking-widest">In Cubator</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-border rounded-full">
                    <Star className="w-2.5 h-2.5 text-brand-accent fill-brand-accent" />
                    <span className="text-[10px] font-black text-brand-dark">{suggestion.votes}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-brand-dark mb-4 uppercase group-hover:text-brand-accent transition-colors">
                  {suggestion.name}
                </h3>
                
                <p className="text-[#5B5550] text-[11px] leading-relaxed italic serif-italic mb-8 line-clamp-3">
                  "{suggestion.description}"
                </p>

                <div className="mt-auto pt-6 border-t border-brand-border/50 flex justify-between items-center">
                   <div className="flex gap-4 items-center">
                     <button 
                      onClick={() => handleVote(suggestion)}
                      disabled={!user}
                      className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                        user 
                          ? 'text-brand-accent hover:text-brand-dark' 
                          : 'text-brand-dark/20 cursor-not-allowed'
                      }`}
                     >
                       {user ? 'Support Batch' : 'Sync to Vote'}
                     </button>
                     
                     <button 
                        onClick={() => {
                          const url = window.location.href;
                          navigator.clipboard.writeText(`Check out this experimental Mustard Deli profile: ${suggestion.name} - ${url}`);
                          const btn = document.activeElement as HTMLElement;
                          if (btn) btn.innerText = "COPIED!";
                          setTimeout(() => { if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share2 w-3 h-3"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg> SHARE'; }, 2000);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-accent transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                   </div>
                   <span className="text-[8px] font-bold text-brand-dark/30 uppercase tracking-widest">
                     ID: {suggestion.id.slice(0, 8)}
                   </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {!loading && suggestions.length === 0 && (
          <div className="text-center py-20 border border-dashed border-brand-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40">No experiments yet. Be the first to suggest a flavour.</p>
          </div>
        )}
      </div>
    </section>
  );
}
