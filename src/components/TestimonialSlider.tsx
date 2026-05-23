import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, ChevronLeft, ChevronRight, Star, MessageSquare } from 'lucide-react';
import { fetchWithRetry } from '../lib/fetchUtils';
import BrandReviewModal from './BrandReviewModal';

interface Testimonial {
  id: number | string;
  text: string;
  author: string;
  location: string;
  rating: number;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    text: "Truly authentic and great taste! The Smoked Apricot 'Braaibroodjie' Mustard is a revelation. It has completely transformed our weekend roasts. A true South African gem.",
    author: "Liza S.",
    location: "Trustpilot",
    rating: 5
  },
  {
    id: 2,
    text: "Incredible variety of mustards. The craftsmanship is evident in every jar. The heat is perfectly balanced with the complexity of the artisanal ingredients. Best mustard we've ever had!",
    author: "Marco B.",
    location: "Google Reviews",
    rating: 5
  },
  {
    id: 3,
    text: "Absolutely love the brand and following the journey on FB. The Green Fig and Balsamic is my all-time favorite. There is a depth of flavor here that you simply don't find elsewhere.",
    author: "Cindy V.",
    location: "Facebook",
    rating: 5
  },
  {
    id: 4,
    text: "The Fiery Reaper Mustard has a pleasant burn for people who like that sort of thing! Absolutely incredible kick but what separates it from hot sauces is that it retains its incredibly rich flavor. A must-have for any serious braai master.",
    author: "Gavin P.",
    location: "Google Reviews",
    rating: 5
  },
  {
    id: 5,
    text: "Discovered these at the Crossways Village Market. The Mustard Deli team is so passionate. The Green Fig is a game changer for our family cheese boards.",
    author: "Sarah D.",
    location: "Local Market Review",
    rating: 5
  },
  {
    id: 6,
    text: "Finally, a mustard that lives up to the 'artisan' label. The Smoked Apricot glaze on a gammon is just perfection. Shipping to Joburg was fast and well-packaged.",
    author: "Johan K.",
    location: "Direct Order Review",
    rating: 5
  }
];

export default function TestimonialSlider() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    fetchWithRetry('/api/reviews')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
          // Don't reset currentIndex if we are just refreshing
        }
      })
      .catch(err => {
        console.error("Failed to fetch testimonials, using defaults:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const next = () => {
    if (testimonials.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    if (testimonials.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  if (loading && testimonials.length === 0) return null;
  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex] || testimonials[0];

  if (!currentTestimonial) return null;

  return (
    <section id="testimonials" className="py-24 bg-brand-secondary border-b border-brand-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="relative">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Quote className="w-12 h-12 text-brand-accent/20 mb-8" />
            
            <div className="relative h-[400px] md:h-[240px] w-full">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentTestimonial.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipeThreshold = 50;
                    if (offset.x < -swipeThreshold) {
                      next();
                    } else if (offset.x > swipeThreshold) {
                      prev();
                    }
                  }}
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.5 }
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
                >
                  <p className="text-lg md:text-2xl font-black text-brand-dark uppercase tracking-tight leading-loose italic serif-italic mb-8 px-4 line-clamp-6 md:line-clamp-4">
                    "{currentTestimonial.text}"
                  </p>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex gap-1 mb-3">
                      {[...Array(typeof currentTestimonial.rating === 'number' ? currentTestimonial.rating : 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-brand-accent text-brand-accent" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-dark">
                      {currentTestimonial.author} — {currentTestimonial.location}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-6 md:gap-12 mt-12">
              <button 
                onClick={prev}
                className="p-4 text-brand-dark/30 hover:text-brand-accent transition-colors border border-transparent hover:border-brand-accent rounded-full shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-2 px-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                    }}
                    className="p-4 group"
                    aria-label={`Go to testimonial ${idx + 1}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 shrink-0 ${
                      idx === currentIndex ? 'bg-brand-accent w-6' : 'bg-brand-dark/10 group-hover:bg-brand-dark/30'
                    }`} />
                  </button>
                ))}
              </div>

              <button 
                onClick={next}
                className="p-4 text-brand-dark/30 hover:text-brand-accent transition-colors border border-transparent hover:border-brand-accent rounded-full shrink-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-12">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full border border-brand-border flex items-center justify-center group-hover:border-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-all duration-500">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-dark/40 group-hover:text-brand-dark transition-colors">
                  Share Your Story
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BrandReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReviews}
      />
    </section>
  );
}
