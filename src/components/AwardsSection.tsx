import { motion } from 'motion/react';
import { Award, Trophy, Star, ShieldCheck } from 'lucide-react';

const AWARDS = [
  {
    title: "Aurora International Taste Challenge",
    year: "2025",
    achievement: "Gold Award",
    description: "Smoked Apricot 'Braaibroodjie' Mustard",
    icon: Trophy
  },
  {
    title: "Food & Beverage Awards",
    year: "2025",
    achievement: "Gold Award",
    description: "Smoked Apricot 'Braaibroodjie' Mustard",
    icon: Award
  }
];

export default function AwardsSection() {
  return (
    <section className="py-24 bg-brand-dark text-white border-y border-white/5">
      <div className="max-w-7xl mx-auto px-12">
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <span className="text-brand-accent font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Distinction</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight">
              Award-Winning <span className="serif-italic lowercase text-brand-accent">Integrity</span>
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="text-white/50 max-w-sm text-sm leading-relaxed lowercase italic serif-italic md:text-right">
              "Recognized globally for our commitment to the craft of slow-made, artisanal mustard."
            </p>
            <a 
              href="https://mustardeli.co.za/awards/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-accent text-[10px] font-bold uppercase tracking-widest border-b border-brand-accent/50 pb-1 hover:border-brand-accent transition-all"
            >
              Explore All Awards
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {AWARDS.map((award, idx) => (
            <motion.div
              key={award.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="relative p-10 border border-white/10 group hover:border-brand-accent transition-all duration-500"
            >
              <div className="mb-8 relative">
                <award.icon className="w-10 h-10 text-brand-accent transition-transform duration-500 group-hover:scale-110" />
                <span className="absolute -top-2 -right-2 text-[40px] font-black opacity-5 group-hover:opacity-10 transition-opacity">
                  {award.year}
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight uppercase mb-2 group-hover:text-brand-accent transition-colors">
                {award.title}
              </h3>
              <p className="text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                {award.achievement}
              </p>
              <p className="text-white/40 text-xs leading-relaxed font-light">
                {award.description}
              </p>
              
              <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-brand-accent group-hover:w-full transition-all duration-700"></div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-20 flex justify-center opacity-20 hover:opacity-40 transition-opacity">
          <div className="flex items-center gap-12 grayscale">
            {/* These would be logos if I had the assets */}
            <ShieldCheck className="w-8 h-8" />
            <div className="w-[1px] h-8 bg-white/20"></div>
            <Award className="w-8 h-8" />
            <div className="w-[1px] h-8 bg-white/20"></div>
            <Trophy className="w-8 h-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
