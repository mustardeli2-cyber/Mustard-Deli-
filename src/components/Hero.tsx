import { motion } from 'motion/react';
import { ArrowRight, ShoppingBag, Trophy, Leaf } from 'lucide-react';

interface HeroProps {
  onAddToCart: (productId: string) => void;
  onExplore: () => void;
  onFindStockist: () => void;
  onGoToBundles?: () => void;
}

export default function Hero({ onAddToCart, onExplore, onFindStockist, onGoToBundles }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-24 px-6 md:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="md:col-span-7 flex flex-col justify-center"
        >
          <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.3em] mb-6 block">
            Est. 2012
          </span>
          <h2 className="text-[42px] leading-[0.9] md:text-[84px] font-black tracking-tighter mb-8 uppercase text-brand-dark">
            CRAFTED<br/>WITH<br/><span className="serif-italic lowercase">Intention.</span>
          </h2>
          <p className="text-lg text-[#5B5550] max-w-md leading-relaxed mb-10 font-normal">
            Experience the finest artisanal mustard and reserve blends handcrafted in South Africa — shipped directly to your pantry. Enjoy free delivery on orders over R450!
          </p>

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-4 mb-10 p-4 border border-brand-accent/20 bg-brand-accent/5 inline-flex self-start"
          >
            <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-brand-dark" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Join the Harvest</p>
              <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">Earn seeds for free artisanal reserves</p>
            </div>
          </motion.div>
          
          <div className="flex flex-wrap gap-4">
            <motion.button
              onClick={onExplore}
              whileHover={{ scale: 1.02 }}
              className="px-10 py-5 bg-brand-dark text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors"
            >
              Explore The Pantry
            </motion.button>
            <motion.button
              onClick={onGoToBundles || onFindStockist}
              whileHover={{ scale: 1.02 }}
              className="px-10 py-5 border border-brand-dark text-brand-dark text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand-secondary transition-colors"
            >
              Gift Bundles & Packs
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="md:col-span-5 bg-brand-secondary relative flex items-center justify-center p-8 md:p-12 h-full min-h-[500px]"
        >
          <div className="w-full h-full border border-brand-border flex flex-col p-8 justify-between relative overflow-hidden bg-brand-secondary/50">
            <div className="flex justify-between items-start z-10">
              <div className="text-[64px] font-black opacity-10">01</div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-50">Monthly Special</p>
                <p className="font-bold text-sm tracking-tight uppercase">Smoked Apricot Braai Mustard</p>
              </div>
            </div>

            {/* Central Graphic Element */}
            <div className="relative w-full h-[240px] bg-white shadow-lg flex items-center justify-center overflow-hidden group">
               <div className="absolute w-[120%] h-[120%] border-[20px] border-brand-bg rounded-full opacity-30 animate-pulse"></div>
               <div className="z-10 text-center px-6">
                 <p className="text-xs italic serif-italic opacity-60 mb-2">Artisan Focus</p>
                 <div className="w-16 h-[1px] bg-brand-accent mx-auto"></div>
                 <p className="mt-4 text-2xl font-bold tracking-tight uppercase leading-tight">Handcrafted Eastern Cape Produce</p>
               </div>
            </div>

              <div className="flex justify-between items-end z-10 pt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1 leading-none">Status</span>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-brand-accent" />
                    <span className="text-xl font-black uppercase">2025 Gold Winner</span>
                  </div>
                </div>
                <button 
                  onClick={() => onAddToCart('1')}
                  className="px-6 py-3 bg-white text-brand-dark text-[10px] font-black uppercase tracking-widest border border-brand-border flex items-center gap-2 hover:bg-brand-accent hover:text-white transition-all shadow-md active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Quick Add
                </button>
              </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
