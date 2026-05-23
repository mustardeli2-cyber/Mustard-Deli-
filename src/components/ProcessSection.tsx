import React from 'react';
import { motion } from 'motion/react';
import { Droplets, Timer, ShieldCheck, Scale } from 'lucide-react';

const STEPS = [
  {
    icon: Droplets,
    title: "1. Premium Non GMO Seeds",
    description: "We select the finest grade of Non GMO mustard seeds and pair them with hand-selected dry botanical layers.",
    delay: 0.1
  },
  {
    icon: Timer,
    title: "2. The Precision Heat System",
    description: "Our proprietary system applies exact temperatures at precisely the right moment to activate natural ingredients.",
    delay: 0.2
  },
  {
    icon: Scale,
    title: "3. Heat-Controlled Reaction",
    description: "This precision-timed thermal reaction safely determines whether the mustard profiles will become mild or hot.",
    delay: 0.3
  },
  {
    icon: ShieldCheck,
    title: "4. Playful Flavor Fusion",
    description: "We blend our active seeds to obtain amazing, vibrant flavor combinations that remain naturally healthy.",
    delay: 0.4
  }
];

export default function ProcessSection() {
  return (
    <section className="py-32 px-12 bg-white border-y border-brand-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.4em] mb-6 block">The Maker's Journey</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-brand-dark mb-6 uppercase">
            Four Steps to <span className="serif-italic lowercase">Perfection</span>
          </h2>
          <div className="h-1 w-24 bg-brand-accent mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-[1px] bg-brand-border -z-0"></div>

          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step.delay, duration: 0.6 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 bg-brand-secondary border border-brand-border flex items-center justify-center mb-8 group-hover:border-brand-dark transition-colors duration-500 bg-white">
                <step.icon className="w-8 h-8 text-brand-dark" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark mb-4">{step.title}</h3>
              <p className="text-xs text-[#5B5550] leading-relaxed max-w-[200px]">
                {step.description}
              </p>
              
              {/* Mobile Number Indicator */}
              <div className="lg:hidden absolute -top-4 -left-4 w-10 h-10 bg-brand-dark text-white flex items-center justify-center font-black italic serif-italic text-lg">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 pt-24 border-t border-brand-border text-center">
          <p className="text-xs font-bold text-brand-dark/30 uppercase tracking-[0.3em]">
            Time. Temperature. Tradition.
          </p>
        </div>
      </div>
    </section>
  );
}
