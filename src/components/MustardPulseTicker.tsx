import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Camera, Beaker, Star, Zap, Wand2, Trophy, Scan } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface Activity {
  id: string;
  type: 'gallery_upload' | 'gallery_like' | 'suggestion_created' | 'vote_cast' | 'alchemy_transmuted';
  userName: string;
  message: string;
  createdAt: any;
}

export default function MustardPulseTicker() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'activity'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      setActivities(data);
      if (data.length > 0) {
        setIndex(0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activity');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activities.length <= 1) return;
    
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 6000);
    
    return () => clearInterval(timer);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const activity = activities[index];

  const getIcon = (type: string) => {
    switch (type) {
      case 'gallery_upload': return <Camera className="w-4 h-4 text-brand-dark" />;
      case 'gallery_like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'suggestion_created': return <Beaker className="w-4 h-4 text-brand-accent" />;
      case 'vote_cast': return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      case 'alchemy_transmuted': return <Wand2 className="w-4 h-4 text-brand-accent" />;
      case 'quiz_completed': return <Trophy className="w-4 h-4 text-brand-accent" />;
      case 'ar_scan': return <Scan className="w-4 h-4 text-brand-accent" />;
      default: return <Sparkles className="w-4 h-4 text-brand-accent" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'gallery_upload': return "Moment Captured @ Live";
      case 'gallery_like': return "Artisan Appreciation";
      case 'suggestion_created': return "Flavour Breakthrough Found";
      case 'vote_cast': return "Batch Support Received";
      case 'alchemy_transmuted': return "Flavor Transmutation Sync";
      case 'quiz_completed': return "Palate Decoded";
      case 'ar_scan': return "Molecular Scan Logged";
      default: return "Cortex Live Pulse";
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-40 hidden md:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          className="bg-white border border-brand-border p-4 shadow-xl flex items-start gap-4 max-w-sm rounded-sm overflow-hidden"
        >
          <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center shrink-0 border border-brand-border">
            {getIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-accent">
                {getLabel(activity.type)}
              </span>
              <div className="flex items-center gap-1">
                <Zap className="w-2 h-2 text-yellow-500 fill-yellow-500 animate-pulse" />
                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
              </div>
            </div>
            <p className="text-[10px] text-brand-dark leading-tight line-clamp-2">
              <span className="font-black uppercase tracking-tight">{activity.userName}</span>
              <span className="mx-1 text-brand-dark/60 font-medium">recently</span>
              <span className="text-brand-dark/80 font-medium italic">{activity.message}</span>
            </p>
          </div>
          
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-bg -translate-x-8 -translate-y-8 rotate-45 -z-10 opacity-50" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
