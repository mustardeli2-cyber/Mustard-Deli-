import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, Microscope, Star, Zap, FlaskConical, Clock, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface ExperimentalBatch {
  id: string;
  name: string;
  codename: string;
  description: string;
  intensity: number;
  ingredients: string[];
  status: 'Development' | 'Curing' | 'Ready';
  tierRequired: 'Seedling' | 'Sprout' | 'Harvest';
  availability: number; // percentage
}

const EXPERIMENTS: ExperimentalBatch[] = [
  {
    id: 'exp-1',
    name: 'Wild Rooibos & Smoked Honey',
    codename: 'R-01',
    description: 'A deep, fynbos-infused mustard base with tannins from wild-harvested Rooibos and a lick of cold-smoked artisanal honey.',
    intensity: 2,
    ingredients: ['Mustard seeds', 'Wild Rooibos', 'Smoked Honey', 'Cider Vinegar'],
    status: 'Curing',
    tierRequired: 'Sprout',
    availability: 45
  },
  {
    id: 'exp-2',
    name: 'Ghost Pepper & Fermented Pineapple',
    codename: 'GP-44',
    description: 'A lacto-fermented tropical blast. Severe heat balanced by the funk and acidity of aged pineapple pulp.',
    intensity: 5,
    ingredients: ['Ghost Pepper', 'Fermented Pineapple', 'Yellow Mustard Seeds', 'Sea Salt'],
    status: 'Development',
    tierRequired: 'Harvest',
    availability: 12
  },
  {
    id: 'exp-3',
    name: 'Black Garlic & Espresso Stout',
    codename: 'BG-00',
    description: 'Umami-heavy experiment using 60-day aged black garlic and a local micro-brewery coffee stout reduction.',
    intensity: 1,
    ingredients: ['Black Garlic', 'Espresso Stout', 'Dark Mustard Seeds', 'Balsamic'],
    status: 'Ready',
    tierRequired: 'Seedling',
    availability: 88
  }
];

export default function Laboratory() {
  const { profile } = useAuth();
  const { addLocalNotification, earnPoints } = useNotifications();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const userTier = profile?.tier || 'Seedling';
  const tierWeights = { 'Seedling': 0, 'Sprout': 1, 'Harvest': 2 };

  const hasAccess = (required: string) => {
    return tierWeights[userTier as keyof typeof tierWeights] >= tierWeights[required as keyof typeof tierWeights];
  };

  const reserveTaste = async (batch: ExperimentalBatch) => {
    if (!hasAccess(batch.tierRequired)) return;
    
    // Simulate reservation
    addLocalNotification(
      "Laboratory Access Granted! 🔬",
      `Reservation confirmed for ${batch.codename}: ${batch.name}. You'll be notified when the batch is ready for pickup or shipping.`
    );
    
    // Reward for active membership engagement
    await earnPoints(5, `Experiment Reservation: ${batch.codename}`);
  };

  return (
    <div className="bg-brand-dark p-6 md:p-12 border-y border-brand-border/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-accent rounded-full">
                <FlaskConical className="w-5 h-5 text-brand-dark" />
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">The Taste Alchemist's Laboratory</h2>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-brand-accent uppercase leading-none mb-4 italic">
              First Taste <span className="text-white font-serif italic lowercase font-thin tracking-normal">Access</span>
            </h1>
            <p className="text-brand-accent/60 text-xs font-medium leading-relaxed uppercase tracking-widest">
              Exclusive early access to experimental small-batches before they hit the retail shelves. Secure your archive today.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4">
            <div className="text-right">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Tier</p>
              <p className="text-sm font-black text-brand-accent uppercase tracking-tighter">{userTier}</p>
            </div>
            <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center">
               {userTier === 'Harvest' ? <Star className="w-5 h-5 text-brand-dark" /> : <Zap className="w-5 h-5 text-brand-dark" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXPERIMENTS.map((batch) => {
            const accessible = hasAccess(batch.tierRequired);
            const isSelected = selectedId === batch.id;

            return (
              <motion.div
                key={batch.id}
                layout
                onClick={() => setSelectedId(isSelected ? null : batch.id)}
                className={`group relative overflow-hidden transition-all cursor-pointer ${
                  accessible ? 'bg-white/5 border-white/20' : 'bg-black/40 border-white/5 grayscale pointer-events-none'
                } border p-6 hover:border-brand-accent/50 ${isSelected ? 'md:col-span-2' : ''}`}
              >
                {!accessible && (
                  <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-8 h-8 text-white/30 mb-4" />
                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest leading-normal">
                      Requires {batch.tierRequired} Tier Access
                    </p>
                    <p className="text-[9px] text-white/40 mt-2 font-medium">Earn more Seeds to level up</p>
                  </div>
                )}

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-brand-accent font-black text-xs uppercase tracking-widest mb-1">{batch.codename}</h3>
                    <h4 className="text-white text-xl font-black uppercase tracking-tight">{batch.name}</h4>
                  </div>
                  <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                    batch.status === 'Ready' ? 'bg-green-500/20 text-green-400' : 
                    batch.status === 'Curing' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {batch.status}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isSelected ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <p className="text-[11px] text-white/70 font-medium leading-relaxed italic">
                        "{batch.description}"
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase mb-2">Ingredients</p>
                          <div className="flex flex-wrap gap-2">
                            {batch.ingredients.map(i => (
                              <span key={i} className="text-[9px] text-brand-accent font-bold px-2 py-1 bg-brand-accent/10 border border-brand-accent/20">
                                {i}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase mb-2">Heat Profile</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <div key={v} className={`w-4 h-1 ${v <= batch.intensity ? 'bg-brand-accent' : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reserveTaste(batch);
                        }}
                        className="w-full bg-brand-accent py-4 text-brand-dark font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white transition-all group/btn"
                      >
                         Secure Archive Bottle
                         <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${batch.availability}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Batch Availability</span>
                        <span>{batch.availability}% Remaining</span>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
