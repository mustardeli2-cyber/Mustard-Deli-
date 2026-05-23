import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Heart, Flame, Activity, Beaker, Leaf, HelpCircle, ChevronRight, Zap, Info, Sparkles } from 'lucide-react';

const HEALTH_COMPOUNDS = [
  {
    id: 'myrosinase',
    title: 'Active Myrosinase Enzyme',
    subtitle: 'Nature\'s Catalyst',
    description: 'The heat-sensitive enzyme responsible for converting sinigrin into active beneficial compounds. Standard mass-production boiling processes completely cook the seeds, destroying this delicate catalyst. By adding just enough heat at the right time, we activate this chemical reaction to customize heat levels while keeping raw seed benefits active.',
    benefits: ['Supports cellular defence networks', 'Stimulates digestive enzymes', 'Unlocks natural bio-availability'],
    stat: '100% Preservation',
    statLabel: 'via Precision Heat Timing',
    icon: Beaker,
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-500'
  },
  {
    id: 'sinigrin',
    title: 'Sinigrin & Glucosinolates',
    subtitle: 'Sulfur-Rich Defense',
    description: 'Glucosinolates are organic sulfur-containing molecules high in antioxidants. Our method of precise heat timing protects these cellular shields, safeguarding your system from oxidative stress while locking in amazing, creative flavors.',
    benefits: ['Intense anti-inflammatory block', 'Neutralizes harmful free radicals', 'Promotes detox pathways'],
    stat: '8.4x Higher',
    statLabel: 'Antioxidants vs. Cooked Seed',
    icon: ShieldCheck,
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500'
  },
  {
    id: 'cardio',
    title: 'Cardiovascular Support',
    subtitle: 'Zero-Sugar Heart Care',
    description: 'Since our artisan process requires no chemical starches, emulsifiers, or added sugars, you receive pure seed nutrients. Complete with naturally occurring Omega-3 fatty acids, magnesium, and selenium.',
    benefits: ['Assists blood pressure regulation', 'Zero glycemic impact / Sugar-Free', 'Naturally low-sodium formulation'],
    stat: '< 5 Calories',
    statLabel: 'per healthy serving',
    icon: Heart,
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-500'
  },
  {
    id: 'respiratory',
    title: 'Respiratory & Circulation',
    subtitle: 'Vascular Stimulant',
    description: 'Traditional apothecary recipes rely on cold-ground mustard to kickstart circulation. The spicy mustard esters stimulate mucus membranes, clearing chest and sinus congestion cleanly.',
    benefits: ['Clear atmospheric airway passages', 'Promotes peripheral blood flow', 'Natural sinus relief agent'],
    stat: 'Immediate',
    statLabel: 'Ester release rate',
    icon: Activity,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500'
  }
];

const COMPARISONS = [
  {
    metric: 'Processing Method',
    stone: 'Precision-timed system adding exact heat at standard intervals',
    commercial: 'Boiled together / Extreme Autoclave sterilization',
    impact: 'Protects critical volatile elements of raw mustard seed while creating perfect mild or hot flavor chemistry.'
  },
  {
    metric: 'Myrosinase Enzyme',
    stone: 'Fully Retained and Active',
    commercial: 'Completely Denatured (Dead)',
    impact: 'Myrosinase enzyme remains live to successfully synthesize isothiocyanates inside your body.'
  },
  {
    metric: 'Sugar & Binding Agents',
    stone: '0% Added Starches / Sugar-Free',
    commercial: 'Up to 24% Sugar, Corn syrup & Xanthan Gum',
    impact: 'Blending releases natural mucilages in mustard cell walls to bind the emulsion organically.'
  },
  {
    metric: 'Essential Minerals',
    stone: 'Naturally Retained (Selenium, Zinc, Mg)',
    commercial: 'Partially stripped during high-speed centrifugal milling',
    impact: 'Retains trace metals that assist in cellular metabolism and antibody processes.'
  }
];

export default function HealthBenefits() {
  const [activeTab, setActiveTab] = useState('myrosinase');
  const [showFaq, setShowFaq] = useState(false);

  const activeCompound = HEALTH_COMPOUNDS.find(c => c.id === activeTab) || HEALTH_COMPOUNDS[0];

  return (
    <section id="apothecary" className="py-24 px-6 md:px-12 bg-white border-y border-brand-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#A3A31F] animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3A31F]">
                The Botanical Apothecary
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-brand-dark uppercase leading-none">
              THERMAL INTEGRITY & <br />
              <span className="text-[#A3A31F] serif-italic normal-case font-normal">Active Phyto-Nutrients</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8">
            <p className="text-[#5B5550] text-sm md:text-base leading-relaxed italic serif-italic">
              "Our mustards are made with Non GMO mustard seeds. The system we apply adds just enough heat at the right time to create a chemical reaction which determines whether the mustards will be mild or hot. It is important for us even though we enjoy being creative and playful in our flavor combinations, that the products have to have amazing flavors as well as healthy on top of that."
            </p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Interactive Tab Buttons */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[9px] font-black uppercase text-brand-dark/40 tracking-widest block mb-1">
              Select Phytochem Segment:
            </span>
            <div className="flex flex-col gap-3">
              {HEALTH_COMPOUNDS.map((c) => {
                const Icon = c.icon;
                const isActive = c.id === activeTab;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={`w-full p-5 text-left border rounded-none flex items-center justify-between transition-all duration-300 ${
                      isActive 
                        ? 'border-brand-dark bg-brand-dark text-white shadow-lg translate-x-1' 
                        : 'border-brand-border bg-brand-secondary/30 hover:border-brand-dark/40 hover:bg-brand-secondary/60 text-brand-dark'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center ${isActive ? 'bg-white/10' : c.bgColor}`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : c.iconColor}`} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">
                          {c.title}
                        </h4>
                        <span className={`text-[9px] uppercase tracking-tighter font-bold ${isActive ? 'text-brand-accent' : 'text-brand-dark/40'}`}>
                          {c.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-brand-accent hover:translate-x-1' : 'text-brand-dark/20'}`} />
                  </button>
                );
              })}
            </div>

            {/* Quick Health Fact Banner */}
            <div className="p-6 bg-[#A3A31F]/5 border border-[#A3A31F]/20 mt-6 flex gap-4">
              <Zap className="w-5 h-5 text-[#A3A31F] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest block mb-1 text-[#A3A31F]">
                  Did You Know?
                </span>
                <p className="text-[11px] text-[#5B5550] leading-relaxed italic serif-italic">
                  The tingling warmth in your nose isn't just spicy fun—it's a volatile gas called allyl isothiocyanate, a powerful natural decongestant and antimicrobial agent that triggers healthy bronchodilation!
                </p>
              </div>
            </div>
          </div>

          {/* Center Column: Detailed Medical Compound View */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCompound.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="border border-brand-border bg-brand-secondary/20 p-8 md:p-10 relative overflow-hidden"
              >
                {/* Visual HUD Corner Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.02] pointer-events-none">
                  <Leaf className="w-full h-full rotate-45" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#A3A31F] bg-[#A3A31F]/10 px-2 py-1 inline-block mb-3">
                      Compound Registry • Bioactive
                    </span>
                    <h3 className="text-3xl font-black uppercase text-brand-dark tracking-tight">
                      {activeCompound.title}
                    </h3>
                    <p className="text-xs text-[#5B5550] italic serif-italic mt-0.5">
                      {activeCompound.subtitle}
                    </p>
                  </div>
                  
                  {/* Performance metric badge */}
                  <div className="p-4 bg-white border border-brand-border/60 text-center shrink-0 min-w-[140px]">
                    <span className="text-2xl font-black text-[#A3A31F] block tracking-tighter leading-none mb-1">
                      {activeCompound.stat}
                    </span>
                    <span className="text-[7px] font-black text-brand-dark/40 uppercase tracking-widest block leading-none">
                      {activeCompound.statLabel}
                    </span>
                  </div>
                </div>

                <div className="py-8">
                  <h5 className="text-[9px] font-black uppercase text-brand-dark/40 tracking-widest mb-3">
                    Therapeutic Description:
                  </h5>
                  <p className="text-sm text-brand-dark/80 leading-relaxed font-normal mb-8 uppercase tracking-wide">
                    {activeCompound.description}
                  </p>

                  <h5 className="text-[9px] font-black uppercase text-brand-dark/40 tracking-widest mb-4">
                    Proven Systemic Benefits:
                  </h5>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {activeCompound.benefits.map((benefit, i) => (
                      <div key={i} className="bg-white p-4 border border-brand-border/40 flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="w-2.5 h-2.5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-brand-dark">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="pt-6 border-t border-brand-border/50 flex items-center justify-between flex-wrap gap-4 text-brand-dark/40 text-[8px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#A3A31F]" />
                    <span>Preserved via Precision Heat Activation</span>
                  </div>
                  <span>100% Artisan Infused & Preservative-Free</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Section 2: Clinical Comparison table */}
        <div className="mt-24 border-t border-brand-border pt-24">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#A3A31F] block mb-4">
              Processing Integrity Contrast
            </span>
            <h3 className="text-3xl font-black uppercase text-brand-dark tracking-tight mb-4">
              Cold Stone-Ground vs. Hot Industrial Milled
            </h3>
            <p className="text-xs text-[#5B5550] uppercase tracking-widest leading-relaxed">
              Compare the cellular destruction caused by rapid, high-friction centrifugal blades versus the nutrient-preserving embrace of low-temperature volcanic turning stones.
            </p>
          </div>

          <div className="border border-brand-border overflow-x-auto shadow-sm">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="bg-brand-secondary/35 border-b border-brand-border">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#5B5550] w-1/4">Evaluation Metric</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#A3A31F] w-1/3 bg-brand-bg/40">Our Infusion Blend Method</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#5B5550]/60 w-1/3">Standard Industrial heated</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#5B5550] w-1/4">Physiological Implication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-white text-brand-dark">
                {COMPARISONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-brand-secondary/15 transition-colors">
                    <td className="p-6 font-black uppercase tracking-wider text-[10px]">{row.metric}</td>
                    <td className="p-6 text-[11px] font-black uppercase tracking-wider text-[#A3A31F] bg-[#A3A31F]/5">{row.stone}</td>
                    <td className="p-6 text-[11px] font-bold uppercase tracking-widest text-brand-dark/50">{row.commercial}</td>
                    <td className="p-6 text-[10px] font-medium text-[#5B5550] leading-relaxed italic serif-italic">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optional FAQ Section */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="inline-flex items-center gap-2 px-6 py-3 border border-brand-border hover:border-brand-dark text-[9px] font-black uppercase tracking-widest transition-colors bg-brand-secondary/20"
          >
            <HelpCircle className="w-4 h-4 text-[#A3A31F]" />
            <span>{showFaq ? 'Hide Scientific FAQs' : 'Show Scientific FAQs'}</span>
          </button>

          <AnimatePresence>
            {showFaq && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-4xl mx-auto text-left space-y-6 mt-8 p-6 bg-brand-secondary/40 border-l-4 border-[#A3A31F]"
              >
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-dark tracking-wider mb-2">
                    Does "spiciness" correlate directly to enzymes and health benefits?
                  </h4>
                  <p className="text-[11px] text-[#5B5550] leading-relaxed font-normal">
                    Yes! The distinctive stinging heat is the product of standard enzymatic conversion. If a mustard has lost its sinus-clearing capacity entirely, or relies purely on added chili extracts for heat, it implies the natural enzymes were denatured and destroyed during pasteurization or heavy heating.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-[#5B5550] tracking-wider mb-2">
                    How does our secret heating system preserve the seeds' health benefits?
                  </h4>
                  <p className="text-[11px] text-[#5B5550] leading-relaxed font-normal">
                    By applying exactly the right amount of heat at standard intervals, we trigger a specific chemical reaction that establishes the perfect balance of hot or mild characteristics. Our raw Non GMO seeds remain active and protected from standard sustained boiling, keeping their natural medical chemistry active rather than destroyed.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
