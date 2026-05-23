import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../contexts/NotificationContext';
import { Wheat, ChevronRight } from 'lucide-react';

export default function HarvestTicker() {
  const { notifications } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="bg-brand-dark overflow-hidden border-y border-brand-accent/20">
      <div className="flex">
        <div className="bg-brand-accent px-4 py-3 flex items-center gap-2 z-10">
          <Wheat className="w-3.5 h-3.5 text-white animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
            The Harvest News
          </span>
        </div>
        
        <div className="flex-1 relative flex items-center py-3">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12">
            {notifications.concat(notifications).map((note, idx) => (
              <div key={`${note.id}-${idx}`} className="flex items-center gap-4 group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">
                  [{note.type}]
                </span>
                <span className="text-[10px] font-medium text-white/80 tracking-wide uppercase">
                  {note.message}
                </span>
                {note.link && (
                  <ChevronRight className="w-3 h-3 text-brand-accent group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
