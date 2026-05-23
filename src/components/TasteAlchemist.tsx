import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Beaker, Zap, Flame, Droplets, Leaf, Drumstick, UtensilsCrossed, ChevronRight, Loader2, Wand2, ShoppingBag, Trophy } from 'lucide-react';
import { PRODUCTS } from '../constants';

import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

const INGREDIENTS = [
  { id: 'beef', name: 'Premium Beef', icon: Drumstick, type: 'earth' },
  { id: 'cheese', name: 'Artisan Cheese', icon: Droplets, type: 'water' },
  { id: 'bread', name: 'Fresh Sourdough', icon: Leaf, type: 'air' },
  { id: 'pork', name: 'Smoked Pork', icon: Flame, type: 'fire' },
  { id: 'fish', name: 'Line Fish', icon: Droplets, type: 'water' },
  { id: 'veg', name: 'Root Veg', icon: Leaf, type: 'earth' },
  { id: 'chicken', name: 'Free Range Poultry', icon: Drumstick, type: 'air' },
  { id: 'charcuterie', name: 'Cured Meats', icon: UtensilsCrossed, type: 'fire' },
];

interface AlchemistResult {
  pairingTitle: string;
  mustardRecommendation: string;
  theSecretFormula: string;
  difficulty: "Novice" | "Adept" | "Master";
  intensity: number;
  batchId: string;
  flavorProfile: {
    sweet: number;
    sour: number;
    heat: number;
    umami: number;
    salt: number;
  };
}

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface AlchemistProps {
  onAddToCart: (productId: string) => void;
}

export default function TasteAlchemist({ onAddToCart }: AlchemistProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [result, setResult] = useState<AlchemistResult | null>(null);
  const [isTransmuting, setIsTransmuting] = useState(false);
  const { user } = useAuth();
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'activity'),
      where('type', '==', 'alchemy_transmuted'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentDiscoveries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const toggleIngredient = (id: string) => {
    setSelectedIngredients(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleTransmute = async () => {
    if (selectedIngredients.length === 0) return;
    
    setIsTransmuting(true);
    setResult(null);

    const ingredientsNames = selectedIngredients.map(id => INGREDIENTS.find(ing => ing.id === ing.id)?.name).join(', ');
    const productContext = PRODUCTS.map(p => `- ${p.name}: ${p.description}`).join('\n');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemini-3-flash-preview",
          contents: `You are the "AI Taste Alchemist". Your goal is to suggest the perfect artisanal mustard pairing from the "Mustard Deli" range for a set of ingredients.
          
          SELECTED INGREDIENTS: ${ingredientsNames}
          AVAILABLE MUSTARDS:
          ${productContext}

          Provide a creative, "alchemical" response.
          - pairingTitle: A grand name for the pairing (e.g., "The Obsidian Hearth Marriage").
          - mustardRecommendation: The specific Mustard Deli product name.
          - theSecretFormula: A 2-sentence culinary tip or "formula" for why this works.
          - difficulty: "Novice", "Adept", or "Master".
          - intensity: 1-100.
          - batchId: A unique serial like "MD-ALPHA-42" (use creative greek/alchemy words).
          - flavorProfile: Scores 1-100 for sweet, sour, heat, umami, salt.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                pairingTitle: { type: "STRING" },
                mustardRecommendation: { type: "STRING" },
                theSecretFormula: { type: "STRING" },
                difficulty: { type: "STRING", enum: ["Novice", "Adept", "Master"] },
                intensity: { type: "NUMBER" },
                batchId: { type: "STRING" },
                flavorProfile: {
                  type: "OBJECT",
                  properties: {
                    sweet: { type: "NUMBER" },
                    sour: { type: "NUMBER" },
                    heat: { type: "NUMBER" },
                    umami: { type: "NUMBER" },
                    salt: { type: "NUMBER" }
                  }
                }
              },
              required: ["pairingTitle", "mustardRecommendation", "theSecretFormula", "difficulty", "intensity", "batchId", "flavorProfile"]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.statusText}`);
      }

      const resultData = await response.json();
      const data = JSON.parse(resultData.text.trim()) as AlchemistResult;
      setResult(data);

      // Record Activity
      try {
        await addDoc(collection(db, 'activity'), {
          type: 'alchemy_transmuted',
          userId: user?.uid || 'anonymous',
          userName: user?.displayName || user?.email?.split('@')[0] || 'Artisan',
          message: `transmuted ${ingredientsNames} into "${data.pairingTitle}" [${data.batchId}]`,
          createdAt: serverTimestamp()
        });
      } catch (actErr) {
        console.error("Failed to record activity:", actErr);
      }
    } catch (err) {
      console.error("Alchemy failure:", err);
    } finally {
      setIsTransmuting(false);
    }
  };

  const handleAddToCart = () => {
    if (result) {
      const product = PRODUCTS.find(p => p.name.toLowerCase() === result.mustardRecommendation.toLowerCase());
      if (product) {
        onAddToCart(product.id);
      }
    }
  };

  const chartData = result ? [
    { subject: 'Sweet', A: result.flavorProfile.sweet, fullMark: 100 },
    { subject: 'Sour', A: result.flavorProfile.sour, fullMark: 100 },
    { subject: 'Heat', A: result.flavorProfile.heat, fullMark: 100 },
    { subject: 'Umami', A: result.flavorProfile.umami, fullMark: 100 },
    { subject: 'Salt', A: result.flavorProfile.salt, fullMark: 100 },
  ] : [];

  return (
    <section id="taste-alchemist" className="py-32 px-6 md:px-12 bg-brand-dark text-white overflow-hidden relative">
      {/* Background Gradients (Recipe 7) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Side: The Alchemist's Table */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 border border-brand-accent/40 flex items-center justify-center rotate-45">
                <Beaker className="w-5 h-5 text-brand-accent -rotate-45" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent">Cortex Lab • Experimental</span>
            </div>

            <h2 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-8 uppercase leading-[0.8]">
              Taste <br/> <span className="text-brand-accent italic serif-italic font-normal normal-case">Alchemist</span>
            </h2>

            <p className="text-white/60 text-lg leading-relaxed max-w-md mb-12 italic serif-italic">
              Select up to three base elements from the artisan's table below. The Cortex models will transmute them into a singular flavor breakthrough.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INGREDIENTS.map((ing) => {
                const isSelected = selectedIngredients.includes(ing.id);
                return (
                  <button
                    key={ing.id}
                    onClick={() => toggleIngredient(ing.id)}
                    className={`group relative aspect-square border p-4 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
                      isSelected 
                        ? 'border-brand-accent bg-brand-accent/20 scale-[1.05] shadow-[0_0_30px_rgba(255,87,34,0.15)]' 
                        : 'border-white/10 bg-white/5 hover:border-brand-accent/40'
                    }`}
                  >
                    <ing.icon className={`w-8 h-8 mb-3 transition-all duration-500 ${
                      isSelected ? 'text-brand-accent scale-110' : 'text-white/40 group-hover:text-white'
                    }`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest text-center ${
                      isSelected ? 'text-white' : 'text-white/20'
                    }`}>
                      {ing.name}
                    </span>
                    
                    {/* Element Label */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-20 group-hover:opacity-100 transition-opacity">
                        {ing.type}
                      </span>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-accent rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-12 flex items-center gap-6">
              <button
                onClick={handleTransmute}
                disabled={selectedIngredients.length === 0 || isTransmuting}
                className="group relative px-12 py-5 bg-brand-accent text-brand-dark font-black uppercase tracking-[0.3em] text-[10px] items-center gap-3 flex hover:bg-white transition-all disabled:opacity-20 disabled:cursor-not-allowed overflow-hidden"
              >
                {isTransmuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transmuting...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Transmute Base
                  </>
                )}
                
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="flex -space-x-2">
                {selectedIngredients.map(id => {
                  const ing = INGREDIENTS.find(i => i.id === id);
                  return (
                    <div key={id} className="w-8 h-8 rounded-full bg-brand-dark border border-brand-accent/40 flex items-center justify-center">
                      {ing && <ing.icon className="w-3.5 h-3.5 text-brand-accent" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Discoveries Feed */}
            {recentDiscoveries.length > 0 && (
              <div className="mt-20 border-l border-white/10 pl-8">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30 block mb-6">Recent Community Breakthroughs</span>
                <div className="space-y-4">
                  {recentDiscoveries.map((discovery) => (
                    <motion.div 
                      key={discovery.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-8 h-8 border border-white/5 bg-white/5 flex items-center justify-center rounded-sm">
                        <Zap className="w-3 h-3 text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/80 italic serif-italic">
                          {discovery.message}
                        </p>
                        <span className="text-[7px] font-black uppercase text-brand-accent/60 tracking-widest">{discovery.userName}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: The Resulting Potion */}
          <div className="relative min-h-[600px] flex items-center justify-center">
             {/* Atmospheric Ring */}
             <div className="absolute w-[400px] h-[400px] border border-white/5 rounded-full animate-spin-slow" />
             <div className="absolute w-[300px] h-[300px] border border-brand-accent/10 rounded-full animate-reverse-spin-slow" />

             <AnimatePresence mode="wait">
               {result ? (
                 <motion.div
                   key="result"
                   initial={{ opacity: 0, scale: 0.9, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 1.1, y: -20 }}
                   className="w-full max-w-md bg-white p-12 text-brand-dark relative shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-t-4 border-brand-accent"
                 >
                   {/* Results UI (Recipe 1 + 3) */}
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Formula Created • {result.batchId}</span>
                      </div>
                      <div className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest border border-brand-dark/10 ${
                        result.difficulty === 'Master' ? 'bg-red-50 text-red-600' : 'bg-brand-bg'
                      }`}>
                        {result.difficulty} Level
                      </div>
                   </div>

                   <h3 className="text-4xl font-bold tracking-tight text-brand-dark mb-4 uppercase leading-none">
                     {result.pairingTitle}
                   </h3>

                   <div className="mb-10 p-6 bg-brand-bg border-l-2 border-brand-accent group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-dark/40 block mb-2">Primary Catalyst</span>
                          <span className="text-lg font-bold uppercase text-brand-dark flex items-center gap-2">
                            <Beaker className="w-4 h-4 text-brand-accent" />
                            {result.mustardRecommendation}
                            {PRODUCTS.find(p => p.name.toLowerCase() === result.mustardRecommendation.toLowerCase())?.awards && (
                              <Trophy className="w-3.5 h-3.5 text-brand-accent animate-bounce" />
                            )}
                          </span>
                        </div>
                        <button 
                          onClick={handleAddToCart}
                          className="px-4 py-2 bg-brand-dark text-white text-[8px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors flex items-center gap-2"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Add to Bag
                        </button>
                      </div>
                   </div>

                   {/* Flavor Map (Radar Chart) */}
                   <div className="h-48 w-full mb-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                          <PolarGrid stroke="#eee" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fontWeight: 900, fill: '#000' }} />
                          <Radar
                            name="Flavor Profile"
                            dataKey="A"
                            stroke="#FF5736"
                            fill="#FF5736"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                   </div>

                   <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Heat Transmutation Intensity</span>
                          <span className="text-[9px] font-black text-brand-accent">{result.intensity}%</span>
                        </div>
                        <div className="h-1 bg-brand-border overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${result.intensity}%` }}
                             transition={{ duration: 1, ease: "easeOut" }}
                             className="h-full bg-brand-accent"
                           />
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 block mb-3">The Secret Alchemical Formula</span>
                        <p className="text-sm italic serif-italic text-brand-dark/80 leading-relaxed bg-brand-bg/50 p-4 border border-brand-border">
                          "{result.theSecretFormula}"
                        </p>
                      </div>
                   </div>

                   <div className="mt-10 pt-10 border-t border-brand-border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Zap className={`w-4 h-4 ${result.intensity > 80 ? 'text-red-600 animate-pulse' : 'text-yellow-600 fill-yellow-600'}`} />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-dark/30">
                          {result.intensity > 80 ? 'Volatile Reaction' : 'Stable Reaction'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setResult(null)}
                        className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors"
                      >
                        Reset Table
                      </button>
                   </div>

                   {/* Circular Motif Background */}
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                      <Beaker className="w-64 h-64" />
                   </div>
                 </motion.div>
               ) : !isTransmuting && (
                 <motion.div
                   key="idle"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-center"
                 >
                   <div className="w-32 h-32 border-4 border-dashed border-white/5 rounded-full flex items-center justify-center mx-auto mb-10 group-hover:border-brand-accent/20 transition-colors">
                      <Beaker className="w-12 h-12 text-white/10 animate-pulse" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 block mb-4">Awaiting Catalysts</span>
                   <p className="text-[9px] uppercase font-bold tracking-widest text-white/10 max-w-[200px] mx-auto leading-relaxed">
                     Select elements to unlock hidden alchemical pairings.
                   </p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
