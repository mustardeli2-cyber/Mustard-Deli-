import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  paths: { label: string; active?: boolean; onClick?: () => void }[];
}

export default function Breadcrumbs({ paths }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 py-4 px-8 bg-brand-bg/50 border-b border-brand-border sticky top-20 z-30 backdrop-blur-sm">
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="text-brand-dark/40 hover:text-brand-dark transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </motion.button>
      
      {paths.map((path, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 text-brand-dark/20" />
          <motion.button
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={path.onClick}
            disabled={path.active}
            className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
              path.active 
                ? 'text-brand-accent cursor-default' 
                : 'text-brand-dark/60 hover:text-brand-dark underline decoration-transparent hover:decoration-brand-accent/30 underline-offset-4'
            }`}
          >
            {path.label}
          </motion.button>
        </React.Fragment>
      ))}
    </nav>
  );
}
