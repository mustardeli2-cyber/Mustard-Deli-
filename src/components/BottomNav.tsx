import { motion } from 'motion/react';
import { Home, ShoppingBag, Heart, User, Search, MapPin, Activity, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  bagCount: number;
  wishlistCount: number;
  onOpenBag: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
}

export default function BottomNav({ 
  activeTab, 
  onTabChange, 
  bagCount, 
  wishlistCount,
  onOpenBag,
  onOpenWishlist,
  onOpenAuth,
  onOpenSearch
}: BottomNavProps) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', action: () => { 
      onTabChange('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }},
    { id: 'shop', icon: Search, label: 'Shop', action: () => {
      onTabChange('home');
      const el = document.getElementById('shop');
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }},
    { id: 'locations', icon: MapPin, label: 'Find Us', action: () => {
      onTabChange('home');
      const el = document.getElementById('locations');
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }},
    ...(isAdmin ? [{ id: 'admin', icon: Activity, label: 'Admin', action: () => {
      onTabChange('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}] : []),
    ...(user ? [{ id: 'messages', icon: Mail, label: 'Inbox', action: () => {
      onTabChange('messages');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}] : []),
    { id: 'bag', icon: ShoppingBag, label: 'Bag', count: bagCount, action: onOpenBag },
    { id: 'profile', icon: User, label: 'Profile', action: onOpenAuth },
  ];

  return (
    <div className="fixed bottom-0 md:bottom-8 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto md:min-w-[500px] z-[60] px-4 py-2 pb-safe md:pb-2">
      <div className="bg-white/90 backdrop-blur-lg border border-brand-border md:rounded-full px-6 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] md:shadow-2xl overflow-hidden flex items-center justify-between md:justify-center md:gap-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center gap-1 p-2 relative min-w-[64px] md:min-w-[72px] group"
            >
              <div className="relative">
                <item.icon 
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? 'text-brand-accent scale-110' : 'text-brand-dark/40 group-hover:text-brand-dark'
                  }`} 
                />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-brand-accent text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-colors duration-300 ${
                isActive ? 'text-brand-dark' : 'text-brand-dark/30 group-hover:text-brand-dark/60'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="bottomNavDot"
                  className="absolute -bottom-1 w-1 h-1 bg-brand-accent rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
