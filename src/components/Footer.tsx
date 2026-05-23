import { Instagram, Facebook, Twitter, Mail, MapPin, Phone, Share2, Star } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import BrandReviewModal from './BrandReviewModal';

export default function Footer() {
  const { earnPoints, addLocalNotification } = useNotifications();
  const { user } = useAuth();
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const copyTextToClipboard = (text: string): boolean => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn("navigator.clipboard failed, running fallback copy method", e);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Fallback copy to clipboard failed entirely", err);
      return false;
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mustard Deli - Artisan Flavours',
          text: 'Check out these handcrafted South African mustards!',
          url: shareUrl,
        });
        if (user) {
          earnPoints(5, 'Sharing Mustard Deli App');
        }
        addLocalNotification('Shared! 🌟', 'Thank you for spreading the news about Mustard Deli!');
        return;
      } catch (err) {
        console.log('Error from navigator.share:', err);
      }
    }

    // Fallback strategy
    const success = copyTextToClipboard(shareUrl);
    if (success) {
      if (user) {
        earnPoints(5, 'Sharing Mustard Deli App');
      }
      addLocalNotification('Link Copied! 🔗', 'Mustard Deli web link is copied to your clipboard. Send it to friends to earn profile seeds!');
    } else {
      addLocalNotification('Share App Link 🌐', `Copy this link to share the deli: ${shareUrl}`);
    }
  };

  return (
    <footer className="bg-brand-dark text-white py-24 px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16 border-b border-white/10 pb-20">
        <div className="max-w-xs">
          <div className="flex flex-col mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-1">Mount Croix, PE</span>
            <h1 className="text-2xl font-bold tracking-tight uppercase">MUSTARD DELI</h1>
          </div>
          <p className="text-white/50 text-xs leading-relaxed mb-6 uppercase tracking-wider">
            26 Brister Crescent, Mount Croix, Port Elizabeth
          </p>
          <div className="flex gap-16">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Loyalty Tier</span>
              <span className="text-xs font-bold uppercase tracking-wider">Golden Seed Member</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Mustard Points</span>
              <span className="text-xs font-bold uppercase tracking-wider">1,240 XP</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end uppercase tracking-[0.2em]">
          <span className="text-[10px] opacity-40 mb-6">Explore</span>
          <div className="flex flex-col md:items-end gap-4 text-xs font-bold">
            <a href="#shop" className="hover:text-brand-accent transition-colors text-right">Mustard Shop</a>
            <a href="#bundles" className="hover:text-brand-accent transition-colors text-right">Gift Bundles & Packs</a>
            <a href="#recipes" className="hover:text-brand-accent transition-colors text-right font-bold">Recipe Lab</a>
            <a href="#community-gallery" className="hover:text-brand-accent transition-colors text-right">Community Album</a>
            <a href="#locations" className="hover:text-brand-accent transition-colors text-right">Stockists</a>
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="hover:text-brand-accent transition-colors text-right cursor-pointer flex items-center justify-end gap-2"
            >
              Rate Experience <Star className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:items-end uppercase tracking-[0.2em]">
          <span className="text-[10px] opacity-40 mb-6">Connect With Us</span>
          <div className="flex flex-col md:items-end gap-4 text-xs font-bold">
            <a href="https://www.instagram.com/themustardeli" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors text-right">Instagram</a>
            <a href="https://www.facebook.com/mustardeli" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors text-right">Facebook</a>
            <a href="https://www.x.com/mustardeli" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors text-right">X (Twitter)</a>
            <button onClick={handleShare} className="hover:text-brand-accent transition-colors text-right cursor-pointer flex items-center gap-2">
              Share App <Share2 className="w-3 h-3" />
            </button>
            <a href="mailto:hello@mustardeli.co.za" className="hover:text-brand-accent transition-colors text-right">hello@mustardeli.co.za</a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 gap-4 text-[10px] uppercase tracking-[0.3em] text-white/30">
        <div className="flex gap-8">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Shipping</a>
        </div>
        <div>&copy; {new Date().getFullYear()} Mustard Deli. Handcrafted Integrity.</div>
      </div>

      <BrandReviewModal 
        isOpen={isReviewOpen} 
        onClose={() => setIsReviewOpen(false)} 
      />
    </footer>
  );
}
