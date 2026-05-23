import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Utensils, Sandwich, Beef, Flame, ChevronRight, Info, Lock, Share2, Sparkles, X } from 'lucide-react';
import { Product, PRODUCTS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';
import { fetchWithRetry } from '../lib/fetchUtils';

const FLAVOUR_PROFILES: Record<string, { title: string; rarity: string; note: string }> = {
  charcuterie: { title: "The Cured Connoisseur", rarity: "Epicurean Elite", note: "You appreciate the slow-aged, salty depths of artisanal meats." },
  cheese: { title: "The Fromage Philosopher", rarity: "Artisanal Collector", note: "You find clarity in the balance of cream, funk, and acid." },
  sandwiches: { title: "The Sourdough Architect", rarity: "Daily Devotee", note: "You believe the foundation of any great meal is perfectly toasted grain." },
  braai: { title: "The Hearth Warden", rarity: "Legendary Griller", note: "You are the master of the flame, smoke, and sizzle." }
};

const PAIRING_CATEGORIES = [
  { 
    id: 'charcuterie', 
    name: 'Cured Meats', 
    icon: Utensils, 
    description: 'Biltong, Salami, and Smoked Ham',
    color: 'bg-[#8B4513]/10 text-[#8B4513]'
  },
  { 
    id: 'cheese', 
    name: 'Artisan Cheese', 
    icon: Beef, 
    description: 'Mature Cheddar, Brie, and Boerenkaas',
    color: 'bg-[#DAA520]/10 text-[#DAA520]'
  },
  { 
    id: 'sandwiches', 
    name: 'Breads & Toast', 
    icon: Sandwich, 
    description: 'Braaibroodjies, Baguettes, and Sourdough',
    color: 'bg-[#556B2F]/10 text-[#556B2F]'
  },
  { 
    id: 'braai', 
    name: 'The Braai', 
    icon: Flame, 
    description: 'Boerewors, Steak, and Lamb Chops',
    color: 'bg-[#B22222]/10 text-[#B22222]'
  }
];

export default function PairingCompass() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useAuth();

  const handleShareResult = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#B22222', '#2F4F4F']
    });
    setShowShareModal(true);
  };

  useEffect(() => {
    fetchWithRetry('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('API down');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge API data with local constants to get pairings and better descriptions if missing
          const merged = data.map(apiProduct => {
            const local = PRODUCTS.find(p => p.id === apiProduct.id) || 
                         PRODUCTS.find(p => apiProduct.name.toLowerCase().includes(p.name.toLowerCase()));
            
            // Normalize category for the compass filter
            let category = apiProduct.category;
            const catLower = category.toLowerCase();
            if (catLower.includes('mustard')) category = 'Mustard';
            else if (catLower.includes('chilli') || catLower.includes('hot')) category = 'Chilli';
            else if (catLower.includes('sugar')) category = 'Sugar-Free';
            else if (catLower.includes('deli') || catLower.includes('pickle')) category = 'Deli';

            return {
              ...apiProduct,
              category: category as any,
              pairings: local?.pairings || apiProduct.pairings || [],
              attributes: local?.attributes || apiProduct.attributes || [],
              nutrition: local?.nutrition || { calories: 'N/A', fat: 'N/A', sugar: 'N/A', protein: 'N/A' },
              isMemberOnly: local?.isMemberOnly || false
            };
          });
          setProducts(merged);
        }
      })
      .catch(err => {
        console.error('Failed to fetch products for compass:', err);
        // Fallback to PRODUCTS is already done via initial state
      })
      .finally(() => setLoading(false));
  }, []);

  const getRecommendedProducts = (categoryId: string) => {
    const matches = (pairings: string[] | undefined, keywords: string[]) => {
      if (!pairings) return false;
      return pairings.some(p => 
        keywords.some(k => p.toLowerCase().includes(k.toLowerCase()))
      );
    };

    // Filter by category (Mustards only for the compass), stock, and member status
    const availableProducts = products.filter(p => {
      const cat = p.category?.toString().toLowerCase() || "";
      const isMustardRelated = cat.includes('mustard') || 
                               cat.includes('chilli') || 
                               cat.includes('sugar') || 
                               ['mustard', 'chilli', 'sugar-free'].includes(cat);
      const hasStock = p.stock > 0;
      return isMustardRelated && hasStock;
    });

    switch (categoryId) {
      case 'charcuterie':
        return availableProducts.filter(p => matches(p.pairings, ['Cured', 'Meat', 'Gammon', 'Charcuterie', 'Salami', 'Ham', 'Biltong', 'Cold Cuts']));
      case 'cheese':
        return availableProducts.filter(p => matches(p.pairings, ['Cheese', 'Cheddar', 'Brie', 'Boerenkaas', 'Gouda', 'Halloumi', 'Feta']));
      case 'sandwiches':
        return availableProducts.filter(p => matches(p.pairings, ['Sandwich', 'Braaibroodjie', 'Pretzels', 'Bread', 'Bagel', 'Sourdough', 'Toast']));
      case 'braai':
        return availableProducts.filter(p => matches(p.pairings, ['Braai', 'Beef', 'Ribs', 'Chicken', 'Steak', 'Lamb', 'Pork', 'Wors', 'Burgers']));
      default:
        return [];
    }
  };

  return (
    <section className="py-32 px-12 bg-white border-y border-brand-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Introduction */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-brand-dark flex items-center justify-center">
                <Compass className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <span className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-dark">Flavor Navigation</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-brand-dark mb-8 uppercase leading-[0.9]">
              The Pairing <br/> <span className="text-brand-accent italic serif-italic normal-case font-normal">Compass</span>
            </h2>
            
            <p className="text-[#5B5550] text-xl leading-relaxed italic serif-italic max-w-lg mb-12">
              Lost in the pantry? Select a base below to discover the perfect marriage of acid, heat, and texture.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAIRING_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`group relative p-8 border text-left transition-all duration-500 cursor-pointer overflow-hidden ${
                    selectedCategory === cat.id 
                    ? 'border-brand-dark bg-brand-dark text-white shadow-2xl scale-[1.02] z-10' 
                    : 'border-brand-border bg-white hover:border-brand-accent/50 hover:bg-brand-bg shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Selection Indicator */}
                  {selectedCategory === cat.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute top-0 right-0 p-4"
                    >
                      <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                    </motion.div>
                  )}

                  <cat.icon className={`w-8 h-8 mb-6 transition-all duration-500 ${
                    selectedCategory === cat.id 
                      ? 'text-brand-accent scale-110' 
                      : `${cat.color.split(' ')[1]} group-hover:scale-110 group-hover:text-brand-dark opacity-100`
                  }`} />
                  
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-2 transition-colors ${
                    selectedCategory === cat.id ? 'text-white' : 'text-brand-dark'
                  }`}>
                    {cat.name}
                  </h3>
                  
                  <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    selectedCategory === cat.id ? 'text-white/60' : 'text-brand-dark/60'
                  }`}>
                    {cat.description}
                  </p>

                  <div className={`mt-6 pt-6 border-t transition-colors ${
                    selectedCategory === cat.id ? 'border-white/10' : 'border-brand-border/50 group-hover:border-brand-accent/20'
                  }`}>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                      selectedCategory === cat.id ? 'text-brand-accent' : 'text-brand-dark/40 group-hover:text-brand-accent'
                    }`}>
                      {selectedCategory === cat.id ? 'Active Base' : 'Select This Base'}
                      <ChevronRight className={`w-3 h-3 transition-transform ${selectedCategory === cat.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Results Display */}
          <div className="relative min-h-[600px] flex items-center justify-center bg-brand-bg/50 border border-brand-border/50 p-8 rounded-lg">
            {/* Background Decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
               <Compass className="w-[500px] h-[500px]" />
            </div>

            <AnimatePresence mode="wait">
              {selectedCategory ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full space-y-4 relative z-10"
                >
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-6 mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark">Recommended Artisan Pairings</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleShareResult}
                        className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:text-brand-dark flex items-center gap-2 bg-brand-accent/5 px-3 py-1.5 rounded-full transition-colors group"
                      >
                        <Share2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        Share Discovery
                      </button>
                      <button 
                        onClick={() => setSelectedCategory(null)}
                        className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest hover:text-brand-accent flex items-center gap-2"
                      >
                        Reset
                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">×</span>
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-20 text-center">
                      <Compass className="w-10 h-10 text-brand-dark/20 animate-spin mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 italic">Calibrating Compass...</p>
                    </div>
                  ) : getRecommendedProducts(selectedCategory).map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex gap-6 p-5 bg-white border border-brand-border hover:border-brand-accent transition-all duration-500 shadow-sm hover:shadow-lg relative overflow-hidden"
                    >
                      {product.isMemberOnly && !user && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                          <div className="text-center p-4 bg-white shadow-xl border border-brand-border">
                            <Lock className="w-4 h-4 text-brand-accent mx-auto mb-2" />
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-dark">Member Only Batch</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 overflow-hidden bg-white border border-brand-border relative p-3 group-hover:border-brand-accent transition-colors flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://picsum.photos/seed/${product.id}/200/200?grayscale&blur=2`;
                            }}
                          />
                        ) : (
                          <Compass className="w-8 h-8 text-brand-dark/10" />
                        )}
                        <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/5 transition-colors pointer-events-none" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[8px] font-black uppercase tracking-widest text-brand-accent">{product.category}</span>
                        </div>
                        <h4 className="text-lg font-bold tracking-tight text-brand-dark mb-2 uppercase leading-none">
                          {product.name}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                           {product.pairings?.map((p, i) => (
                             <span key={i} className="px-2 py-0.5 bg-brand-bg border border-brand-border text-[7px] font-black uppercase tracking-widest text-brand-dark/40">
                               {p}
                             </span>
                           ))}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-brand-accent group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                  
                  {getRecommendedProducts(selectedCategory).length === 0 && (
                    <div className="text-center py-20">
                       <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">No perfect matches in current stock.</p>
                       <p className="text-[8px] font-bold text-brand-dark/20 uppercase tracking-widest mt-2">Check the Lab for experimental batches.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 bg-white shadow-inner flex items-center justify-center mx-auto mb-8 rounded-full border border-brand-border">
                    <Compass className="w-8 h-8 text-brand-accent animate-spin-slow" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-dark mb-4">Awaiting Input</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 max-w-[240px] mx-auto leading-relaxed">
                    Select a pairing base on the left to calibrate the flavor compass.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Share Discovery Modal */}
      <AnimatePresence>
        {showShareModal && selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 text-brand-dark/20 hover:text-brand-dark transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Discovery Card UI */}
              <div className="p-12 text-center relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-accent" />
                <div className="absolute top-0 left-0 w-full h-full border-[20px] border-brand-bg pointer-events-none opacity-50" />
                
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-brand-accent p-2 flex items-center justify-center relative bg-white">
                    <Compass className="w-10 h-10 text-brand-accent animate-spin-slow" />
                    <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-brand-accent animate-pulse" />
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent mb-4 block">Flavor Profile Discovery</span>
                <h2 className="text-4xl font-bold tracking-tight text-brand-dark mb-4 uppercase">
                  {FLAVOUR_PROFILES[selectedCategory]?.title}
                </h2>
                
                <div className="inline-block px-3 py-1 bg-brand-dark text-white text-[9px] font-black uppercase tracking-[0.2em] mb-8">
                   Rank: {FLAVOUR_PROFILES[selectedCategory]?.rarity}
                </div>

                <p className="text-[#5B5550] italic serif-italic text-lg mb-8 leading-relaxed px-4">
                  "{FLAVOUR_PROFILES[selectedCategory]?.note}"
                </p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-brand-bg p-6 border border-brand-border">
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40 block mb-2">Base Category</span>
                    <span className="text-sm font-bold uppercase text-brand-dark">
                      {PAIRING_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                    </span>
                  </div>
                  <div className="bg-brand-bg p-6 border border-brand-border">
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40 block mb-2">Top Recommendation</span>
                    <span className="text-sm font-bold uppercase text-brand-dark truncate">
                      {getRecommendedProducts(selectedCategory)[0]?.name || "Exclusive Batch"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard.writeText(`My Mustard Deli Flavour Profile: ${FLAVOUR_PROFILES[selectedCategory!]?.title}. Find yours here: ${url}`);
                        const btn = document.activeElement as HTMLElement;
                        if (btn) {
                          const original = btn.innerHTML;
                          btn.innerHTML = "Link Copied!";
                          setTimeout(() => { btn.innerHTML = original; }, 2000);
                        }
                     }}
                     className="w-full bg-brand-dark text-white py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
                   >
                     <Share2 className="w-4 h-4" />
                     Copy Link to Dashboard
                   </button>
                   
                   <button 
                     onClick={() => setShowShareModal(false)}
                     className="w-full bg-brand-bg text-brand-dark/60 py-3 font-bold uppercase tracking-[0.2em] text-[9px] hover:bg-brand-border transition-colors border border-brand-border"
                   >
                     Return to Compass
                   </button>

                   <p className="text-[8px] font-black uppercase tracking-widest text-brand-dark/20 mt-2">
                     Mustard Deli • The Culinary Compass • 2026 Edition
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
