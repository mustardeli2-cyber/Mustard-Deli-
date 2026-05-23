import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Facebook, Share2, ClipboardCheck, ArrowRight, RotateCcw, Trophy, ShoppingBag, Heart } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const QUESTIONS = [
  {
    id: 1,
    text: "How do you handle the South African sun?",
    options: [
      { id: 'A', text: "I'm the one bringing the peri-peri to the braai.", trait: 'heat', value: 80 },
      { id: 'B', text: "I prefer a cool breeze and a glass of Chenin.", trait: 'sweet', value: 60 },
      { id: 'C', text: "I'm experimental – what's in the mystery box?", trait: 'umami', value: 70 },
      { id: 'D', text: "Classic and sophisticated, under a wide-brim hat.", trait: 'sophisticated', value: 50 },
    ]
  },
  {
    id: 2,
    text: "Your ideal Friday night involves...",
    options: [
      { id: 'A', text: "Gourmet burgers with friends.", trait: 'bold', value: 70 },
      { id: 'B', text: "A curated cheese and charcuterie board.", trait: 'refined', value: 60 },
      { id: 'C', text: "Testing a fusion recipe I saw on TikTok.", trait: 'experimental', value: 90 },
      { id: 'D', text: "Slow-roasted lamb potjie.", trait: 'classic', value: 80 },
    ]
  },
  {
    id: 3,
    text: "Decide your texture destiny:",
    options: [
      { id: 'A', text: "Smooth and silky, like a velvet curtain.", trait: 'smooth', value: 100 },
      { id: 'B', text: "Pop and crunch – give me whole seeds!", trait: 'textured', value: 100 },
      { id: 'C', text: "Somewhere in between, the golden mean.", trait: 'balanced', value: 100 },
    ]
  }
];

const RESULTS = [
  {
    id: 'firestarter',
    title: "The Firestarter",
    description: "You live for the burn. Your palate is a furnace of ambition. You don't just eat; you conquer.",
    recommendation: "Classic Honey", // Actually maybe Black Gold for heat?
    trait: "High Heat Intensity",
    match: "MD-01 Black Gold"
  },
  {
    id: 'sophisticate',
    title: "The Sophisticate",
    description: "You appreciate the finer notes. Subtlety is your strength. You understand that balance is an art form.",
    recommendation: "Stone Ground",
    trait: "Refined Balance",
    match: "MD-03 Stone Ground"
  },
  {
    id: 'alchemist',
    title: "The Alchemist",
    description: "Rules are for people without imagination. You mix, you match, you transmute the ordinary into the extraordinary.",
    recommendation: "Black Gold",
    trait: "Experimental Umami",
    match: "MD-02 Sweet Honey"
  }
];

export default function TasteQuiz({ onAddToCart }: { onAddToCart: (id: string) => void }) {
  const [step, setStep] = useState(0); // 0: Start, 1-3: Questions, 4: Result
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<any>(null);
  const { user } = useAuth();
  const { earnPoints } = useNotifications();

  const startQuiz = () => setStep(1);

  const handleAnswer = (optionId: string) => {
    const newAnswers = [...answers, optionId];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      const res = calculateResult(newAnswers);
      setStep(4);
      logActivity(res);
      // Give 10 loyalty seeds for profiling taste preferences
      try {
        earnPoints(10, 'Palate Discovery Complete');
      } catch (ptsErr) {
        console.warn('Failed to assign loyalty points:', ptsErr);
      }
    }
  };

  const calculateResult = (ans: string[]) => {
    let res;
    if (ans.includes('A')) res = RESULTS[0];
    else if (ans.includes('D')) res = RESULTS[1];
    else res = RESULTS[2];
    setFinalResult(res);
    return res;
  };

  const logActivity = async (res: any) => {
    const path = 'activity';
    try {
      await addDoc(collection(db, path), {
        type: 'quiz_completed',
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Artisan',
        message: `discovered their signature: "${res.title}"`,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const shareToFB = () => {
    const url = window.location.href;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`I just took the Mustard Deli Taste Quiz and I'm a ${finalResult?.title}! Take the quiz here:`)}`;
    window.open(fbUrl, '_blank');
  };

  const resetQuiz = () => {
    setStep(0);
    setCurrentQuestion(0);
    setAnswers([]);
    setFinalResult(null);
  };

  return (
    <section id="taste-quiz" className="py-24 px-6 md:px-12 bg-white relative overflow-hidden border-b border-brand-border">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center border border-brand-accent/20">
                  <ClipboardCheck className="w-8 h-8 text-brand-accent" />
                </div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-dark mb-6 uppercase">
                Find Your <br/> <span className="text-brand-accent italic serif-italic normal-case font-normal">Savoury Signature</span>
              </h2>
              <p className="text-lg text-brand-dark/60 mb-10 max-w-xl mx-auto leading-relaxed italic serif-italic">
                Five questions stands between you and your artisanal destiny. Our Cortex Flavour engine will decode your palate.
              </p>
              <button 
                onClick={startQuiz}
                className="px-12 py-5 bg-brand-dark text-white font-black uppercase tracking-[0.3em] text-[10px] items-center gap-3 inline-flex hover:bg-brand-accent transition-all group"
              >
                Launch Quiz
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}

          {step > 0 && step < 4 && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Cortex Analysis • Step {currentQuestion + 1}/{QUESTIONS.length}</span>
                <div className="flex gap-1">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className={`h-1 w-8 ${i <= currentQuestion ? 'bg-brand-accent' : 'bg-brand-secondary'}`} />
                  ))}
                </div>
              </div>

              <h3 className="text-3xl md:text-5xl font-bold text-brand-dark leading-tight uppercase tracking-tight">
                {QUESTIONS[currentQuestion].text}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {QUESTIONS[currentQuestion].options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.id)}
                    className="p-8 border border-brand-border bg-brand-bg hover:border-brand-accent group transition-all text-left relative overflow-hidden"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20 group-hover:text-brand-accent mb-4 block">Option {opt.id}</span>
                    <p className="text-lg font-bold text-brand-dark group-hover:translate-x-2 transition-transform">{opt.text}</p>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-accent opacity-0 group-hover:opacity-10 transition-opacity -rotate-45 translate-x-8 -translate-y-8" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && finalResult && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto bg-brand-secondary p-12 relative border border-brand-border"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent px-6 py-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Analysis Complete</span>
              </div>

              <div className="text-center mb-10">
                <Trophy className="w-12 h-12 text-brand-accent mx-auto mb-6" />
                <h3 className="text-5xl font-black uppercase tracking-tighter text-brand-dark mb-4">
                  {finalResult.title}
                </h3>
                <p className="text-lg italic serif-italic text-brand-dark/70 leading-relaxed mb-8">
                  "{finalResult.description}"
                </p>
                <div className="inline-block px-4 py-2 border border-brand-accent/20 text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent italic mb-8">
                  Trait: {finalResult.trait}
                </div>
              </div>

              <div className="bg-white p-8 border border-brand-border flex flex-col md:flex-row items-center gap-8 mb-10">
                <div className="w-32 h-32 bg-brand-bg rounded-sm flex items-center justify-center shrink-0">
                  <Sparkles className="w-12 h-12 text-brand-accent/40" />
                </div>
                <div className="text-center md:text-left flex-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 block mb-2">Artisan Match</span>
                  <h4 className="text-xl font-black uppercase text-brand-dark mb-4">{finalResult.recommendation}</h4>
                  <button 
                    onClick={() => {
                      const p = PRODUCTS.find(prod => prod.name.includes(finalResult.recommendation));
                      if (p) onAddToCart(p.id);
                    }}
                    className="px-6 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors flex items-center gap-3 mx-auto md:mx-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Acquire Batch
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    shareToFB();
                    try { earnPoints(5, 'Palate Discovery Share'); } catch (e) { console.log(e); }
                  }}
                  className="flex-1 py-4 bg-[#1877F2] text-white font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
                >
                  <Facebook className="w-4 h-4" />
                  Share to Facebook (+5 SEEDS)
                </button>
                <button 
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(window.location.origin);
                      alert('Invitation link copied! Share with your friends.');
                      earnPoints(5, 'Palate Discovery Invite');
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                  className="flex-1 py-4 border border-brand-dark text-brand-dark font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-3 hover:bg-brand-dark hover:text-white transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Invite Artisans (+5 SEEDS)
                </button>
                <button 
                  onClick={resetQuiz}
                  className="p-4 border border-brand-border text-brand-dark/40 hover:text-brand-accent transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Background Detail */}
              <div className="absolute bottom-0 right-0 p-4 opacity-5 uppercase font-black text-[60px] leading-none pointer-events-none select-none overflow-hidden">
                Profile
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
