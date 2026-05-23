import { motion } from 'motion/react';
import { RECIPES } from '../constants';
import { Play, Lock, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRODUCTS } from '../constants';

interface RecipeSectionProps {
  onAddToCart: (productId: string) => void;
}

export default function RecipeSection({ onAddToCart }: RecipeSectionProps) {
  const { user } = useAuth();

  const handleAddToCart = (mustardName: string) => {
    // Precise shop integration for recipe ingredients
    const product = PRODUCTS.find(p => p.name.toLowerCase().includes(mustardName.toLowerCase()));
    if (product) {
      onAddToCart(product.id);
    }
  };

  return (
    <section id="recipes" className="py-32 px-12 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.3em] mb-4 block">Kitchen Inspiration</span>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-brand-dark uppercase">
            Artisanal <span className="serif-italic lowercase">Recipes</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-brand-border border border-brand-border">
          {RECIPES.map((recipe, idx) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group bg-brand-bg p-8"
            >
              {recipe.isMemberOnly && !user && (
                <div className="absolute top-12 right-12 bg-white/90 backdrop-blur-sm px-4 py-2 flex items-center gap-2 border border-brand-accent/30 z-10 shadow-lg">
                  <Lock className="w-3 h-3 text-brand-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Member Access</span>
                </div>
              )}
              
              <div className="aspect-[16/9] overflow-hidden mb-8 border border-brand-border relative">
                <img 
                  src={recipe.image} 
                  alt={recipe.title}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${recipe.isMemberOnly && !user ? 'blur-sm grayscale' : ''}`}
                />
                {recipe.isMemberOnly && !user && (
                  <div className="absolute inset-0 bg-brand-dark/10 flex items-center justify-center">
                     <span className="bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">Sync to View Method</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-[1px] bg-brand-accent"></span>
                  <span className="text-brand-dark/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {recipe.isMemberOnly ? 'Experimental Recipe' : 'Featured Dish'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-brand-dark mb-4 uppercase">{recipe.title}</h3>
                <p className="text-[#5B5550] text-sm mb-8 leading-relaxed italic serif-italic">
                  "Featuring {recipe.mustardUsed}"
                </p>
                <div className="flex items-center gap-6 mt-auto">
                  <button 
                    disabled={recipe.isMemberOnly && !user}
                    className={`text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 transition-all ${
                      recipe.isMemberOnly && !user 
                        ? 'border-brand-dark/10 text-brand-dark/30 cursor-not-allowed' 
                        : 'border-brand-dark hover:border-brand-accent hover:text-brand-accent'
                    }`}
                  >
                    {recipe.isMemberOnly && !user ? 'Locked Content' : 'Read Method'}
                  </button>
                  <button 
                    onClick={() => handleAddToCart(recipe.mustardUsed)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-brand-accent hover:text-brand-dark transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Shop Mustard
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <a 
            href="https://mustardeli.co.za/recipes/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-10 py-5 border border-brand-dark text-brand-dark text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand-dark hover:text-white transition-all group"
          >
            Explore More Recipes
            <Play className="w-3 h-3 fill-current group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
