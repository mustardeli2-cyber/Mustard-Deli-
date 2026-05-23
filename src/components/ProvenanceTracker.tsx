import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, ShieldCheck, Thermometer, Calendar, User, MapPin, FlaskConical, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface BatchData {
  id: string;
  productId: string;
  harvestDate: string;
  bottledDate: string;
  seedSource: string;
  chef: string;
  tastingNotes: string;
  tempProfile: string;
}

export default function ProvenanceTracker() {
  const [batchId, setBatchId] = useState('');
  const [data, setData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // For demo purposes, we allow searching 'MD-2024-X'
      // In a real app, this would hit the batches collection
      // Mocking a successful find if ID matches a specific pattern for the demo
      if (batchId.toUpperCase() === 'MD-2024-ALPHA') {
        setTimeout(() => {
          setData({
            id: 'MD-2024-ALPHA',
            productId: 'Smoked Apricot',
            harvestDate: '2024-03-12',
            bottledDate: '2024-04-02',
            seedSource: 'Swartland Organic Mustard Co.',
            chef: 'Elias M.',
            tastingNotes: 'High smoke on finish. Apricot sweetness is peaked at 12.4 Brix.',
            tempProfile: 'Slow fermentation at 18.5°C constant.'
          });
          setLoading(false);
        }, 1200);
        return;
      }

      const docRef = doc(db, 'batches', batchId.toUpperCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setData(docSnap.data() as BatchData);
      } else {
        setError('Batch ID not found in the archives.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection interrupted. Archival retrieval failed.');
    } finally {
      if (batchId.toUpperCase() !== 'MD-2024-ALPHA') setLoading(false);
    }
  };

  return (
    <section className="py-32 px-12 bg-white border-t border-brand-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-dark text-white text-[8px] font-black uppercase tracking-[0.4em] mb-6">
             <ShieldCheck className="w-3 h-3" />
             Provenance Verification
          </div>
          <h2 className="text-3xl font-bold tracking-tighter text-brand-dark mb-4 uppercase">Verify Your Batch</h2>
          <p className="text-[#5B5550] text-sm serif-italic italic max-w-lg mx-auto">
            Every bottle has a story. Enter the Batch ID found on your label to view its artisanal birth certificate.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-20">
          <div className="relative group">
            <input 
              type="text" 
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="e.g. MD-2024-ALPHA"
              className="w-full bg-brand-bg border-2 border-brand-border px-8 py-5 text-xs font-mono uppercase tracking-widest outline-none focus:border-brand-dark transition-all placeholder:opacity-30"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-dark text-white flex items-center justify-center hover:bg-brand-accent transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-[10px] text-red-500 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </motion.p>
          )}
        </form>

        <AnimatePresence>
          {data && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative"
            >
              {/* The "Certificate" Grid */}
              <div className="bg-brand-bg border border-brand-dark p-8 md:p-16 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                   <ShieldCheck className="w-64 h-64 rotate-12" />
                </div>
                
                <div className="flex justify-between items-start mb-12 border-b border-brand-dark/10 pb-12">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-dark/30 mb-2">Artisanal Archive</p>
                     <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Batch {data.id}</h3>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Purity Status</p>
                     <p className="text-[8px] font-bold text-brand-accent uppercase tracking-[0.3em]">Verified Hand-Made</p>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-y-12 gap-x-16">
                  <div className="space-y-8">
                    <DetailItem icon={FlaskConical} label="Product Profile" value={data.productId} />
                    <DetailItem icon={Calendar} label="Harvest Cycle" value={data.harvestDate} />
                    <DetailItem icon={MapPin} label="Seed Provenance" value={data.seedSource} />
                  </div>
                  <div className="space-y-8">
                     <DetailItem icon={User} label="Master Chef" value={data.chef} />
                     <DetailItem icon={Calendar} label="Bottling Rank" value={data.bottledDate} />
                     <DetailItem icon={Thermometer} label="Temp Profile" value={data.tempProfile} />
                  </div>
                </div>

                <div className="mt-16 pt-12 border-t border-brand-dark/10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                     Tasting Notes from the Lab
                   </p>
                   <p className="text-sm text-brand-dark font-medium uppercase tracking-wide leading-relaxed italic border-l-2 border-brand-accent pl-6">
                     "{data.tastingNotes}"
                   </p>
                </div>

                <div className="mt-12 flex justify-end">
                   <div className="text-[8px] font-mono text-brand-dark/30 uppercase tracking-[0.2em]">
                     Ref: {data.id.toLowerCase()}-verified-run
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 bg-brand-dark/5 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-brand-dark" />
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40 mb-1">{label}</p>
        <p className="text-[10px] font-bold text-brand-dark uppercase tracking-wider font-mono">{value}</p>
      </div>
    </div>
  );
}
