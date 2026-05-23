import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Camera, Scan, Shield, Share2, Info, Zap, Sparkles, Beaker, Wand2, Eye, EyeOff, Rotate3d, Box } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function ApothecaryAR() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * 20, y: x * 20 });
  };

  const startScan = (product: any) => {
    setIsScanning(true);
    setScannedProduct(null);
    setTimeout(async () => {
      setScannedProduct(product);
      setIsScanning(false);
      logScan(product);
    }, 2000);
  };

  const logScan = async (product: any) => {
    const path = 'activity';
    try {
      await addDoc(collection(db, path), {
        type: 'ar_scan',
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Artisan',
        message: `analyzed the molecular structure of ${product.name}`,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <section id="apothecary-ar" className="py-32 px-6 md:px-12 bg-brand-dark text-white overflow-hidden border-b border-white/5 relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="grid grid-cols-12 h-full">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border-r border-white h-full" />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          
          {/* Left: Interactive Shelf */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setRotation({ x: 0, y: 0 })}
            className="relative perspective-1000 hidden md:block"
          >
            <div className="flex items-center gap-3 mb-12">
               <div className="w-8 h-8 rounded-full border border-brand-accent flex items-center justify-center animate-pulse">
                 <Scan className="w-4 h-4 text-brand-accent" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent">Apothecary AR • Lens Active</span>
            </div>

            <div className="grid grid-cols-2 gap-12 relative">
              {PRODUCTS.slice(0, 4).map((p, i) => (
                <motion.div
                  key={p.id}
                  style={{
                    rotateX: rotation.x,
                    rotateY: rotation.y,
                    transformStyle: 'preserve-3d',
                  }}
                  whileHover={{ scale: 1.05, translateZ: 50 }}
                  onClick={() => startScan(p)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[3/4] bg-brand-bg/5 border border-white/10 p-8 flex flex-col items-center justify-end relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Simulated Jar Silhouette */}
                    <div className="w-24 h-36 bg-gradient-to-b from-brand-dark/40 to-brand-dark border-x border-t border-white/10 rounded-t-xl mb-4 relative">
                       <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-12 border border-white/5 bg-white/5 rounded-sm flex items-center justify-center">
                          <span className="text-[6px] font-black text-white/20 uppercase tracking-tighter">Artisan Batch</span>
                       </div>
                    </div>

                    <h4 className="text-[10px] font-black uppercase tracking-widest text-center group-hover:text-brand-accent transition-colors">{p.name}</h4>
                    <span className="text-[7px] text-white/40 uppercase font-bold tracking-tighter mt-1 italic serif-italic">Click to scan formula</span>
                    
                    {/* Corner Scanners */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-l border-t border-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Scanning Overlay */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
                >
                  <div className="w-full h-1 bg-brand-accent absolute top-0 animate-scan-line" />
                  <div className="bg-brand-dark/90 p-6 border border-brand-accent flex items-center gap-4">
                     <Wand2 className="w-6 h-6 text-brand-accent animate-spin" />
                     <span className="text-xs font-black uppercase tracking-[0.2em]">Deconstructing Esters...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Data View */}
          <div>
            <div className="mb-12">
               <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 uppercase">
                Apothecary <br/> <span className="text-brand-accent italic serif-italic normal-case font-normal">AR Lens</span>
               </h2>
               <p className="text-lg text-white/50 leading-relaxed italic serif-italic max-w-xl">
                 Reveal the hidden chemical romance within each jar. Our augmented vision layer decodes terroir, heat-decay rates, and artisanal provenance in real-time.
               </p>
            </div>

            {/* Mobile Product Selector (Hidden on MD/Desktop where shelf is visible) */}
            <div className="md:hidden mb-12">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent block mb-4">Select Jar to Scan</span>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
                 {PRODUCTS.map((p) => (
                   <button
                     key={p.id}
                     onClick={() => startScan(p)}
                     className="w-32 aspect-square bg-white/5 border border-white/10 shrink-0 flex flex-col items-center justify-center gap-3 hover:border-brand-accent transition-colors"
                   >
                     <div className="w-8 h-12 bg-white/10 rounded-sm" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-center px-2 line-clamp-2">{p.name}</span>
                   </button>
                 ))}
               </div>
            </div>

            <div className="space-y-8">
               {/* Privacy Banner */}
               <div className={`p-6 border transition-all duration-500 ${isPrivate ? 'bg-brand-secondary/10 border-white/10' : 'bg-brand-accent/5 border-brand-accent/40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isPrivate ? <EyeOff className="w-5 h-5 text-white/40" /> : <Eye className="w-5 h-5 text-brand-accent" />}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest">{isPrivate ? 'View: Private Session' : 'View: Shared Experience'}</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">Only you can see these artisanal insights currently.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPrivate(!isPrivate)}
                      className="px-4 py-2 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all"
                    >
                      {isPrivate ? 'Go Public' : 'Make Private'}
                    </button>
                  </div>
               </div>

               {/* Result Card */}
               <AnimatePresence mode="wait">
                 {scannedProduct ? (
                   <motion.div
                     key={scannedProduct.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="bg-white p-10 text-brand-dark relative shadow-2xl overflow-hidden"
                   >
                     <div className="flex justify-between items-start mb-8">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-brand-accent block mb-2">Molecular Profile • {scannedProduct.id}</span>
                          <h3 className="text-3xl font-black uppercase tracking-tight">{scannedProduct.name}</h3>
                        </div>
                        <Rotate3d className="w-6 h-6 text-brand-dark/20" />
                     </div>

                     <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                             <span className="text-brand-dark/40">Heat Stability</span>
                             <span>94%</span>
                          </div>
                          <div className="h-1 bg-brand-bg">
                             <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-brand-accent" />
                          </div>
                          <p className="text-[10px] italic serif-italic text-brand-dark/60">"Optimized for high-altitude flavor preservation."</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                             <span className="text-brand-dark/40">Terroir Depth</span>
                             <span>82%</span>
                          </div>
                          <div className="h-1 bg-brand-bg">
                             <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-brand-dark" />
                          </div>
                          <p className="text-[10px] italic serif-italic text-brand-dark/60">"Strong mineral notes from the Western Cape seeds."</p>
                        </div>
                     </div>

                     <div className="p-6 bg-brand-bg border-l-4 border-brand-accent mb-8">
                        <div className="flex gap-4">
                           <Box className="w-5 h-5 text-brand-accent shrink-0" />
                           <p className="text-[11px] leading-relaxed italic serif-italic text-brand-dark/80 font-medium">
                              <span className="font-black uppercase tracking-widest text-brand-dark not-italic block mb-1 text-[8px]">Scan Analysis:</span>
                              Internal structure reveals a complex lattice of honey-infused enzymes. Recommended for immediate pairing with cured meats or aged cheddar.
                           </p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button className="flex-1 py-4 bg-brand-dark text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors flex items-center justify-center gap-2">
                           <Zap className="w-3 h-3" />
                           Optimize Palette
                        </button>
                        {!isPrivate && (
                          <button className="aspect-square bg-brand-secondary border border-brand-border flex items-center justify-center hover:bg-brand-bg transition-colors">
                             <Share2 className="w-4 h-4 text-brand-dark" />
                          </button>
                        )}
                     </div>
                     
                     {/* HUD Decoration */}
                     <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                        <Beaker className="w-24 h-24" />
                     </div>
                   </motion.div>
                 ) : (
                   <div className="aspect-video border-2 border-dashed border-white/10 flex flex-col items-center justify-center bg-white/5 group">
                      <Camera className="w-8 h-8 text-white/20 mb-4 group-hover:text-brand-accent transition-colors duration-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white transition-colors duration-500">Scan Product for Analysis</span>
                   </div>
                 )}
               </AnimatePresence>

               {/* Technical Specs Footer */}
               <div className="flex items-center gap-8 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500/40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Cortex Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rotate3d className="w-4 h-4 text-brand-accent/40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Holographic Rendering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500/40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Real-time Spectral Sync</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
