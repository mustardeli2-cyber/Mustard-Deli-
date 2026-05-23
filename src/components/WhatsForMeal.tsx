import React, { useRef, useState, useEffect } from 'react';
import { 
  Sparkles, Camera, Upload, AlertCircle, Check, MapPin, Search, 
  Leaf, Flame, HelpCircle, Utensils, Zap, HelpCircle as HelpIcon,
  ArrowRight, ArrowLeft, RefreshCw, ShoppingCart, Info, List, Plus, 
  ChefHat, Heart, Settings, Minimize2, Eye, HelpCircle as QIcon, BookOpen, Clock, Award, Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS, RECIPES } from '../constants';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import confetti from 'canvas-confetti';

interface WhatsForMealProps {
  onAddToCart: (productId: string) => void;
  onOpenAuth?: () => void;
}

const DIET_OPTIONS = [
  { id: 'traditional', label: 'Traditional', desc: 'No dietary boundaries. Anything culinary goes.', icon: Utensils },
  { id: 'vegan', label: 'Vegan', desc: 'Plant-based exclusively. No cheese, milk, eggs, meat or honey.', icon: Leaf },
  { id: 'vegetarian', label: 'Vegetarian', desc: 'Egg-friendly, dairy and honey allowed. No animal flesh.', icon: Eye },
  { id: 'banter', label: 'Banter / Keto', desc: 'High-fat, ultra low carb. Steer clear of high sugars.', icon: Flame },
  { id: 'gluten-free', label: 'Gluten-Free', desc: 'Celiac friendly. Wheat, rye and barley eliminated.', icon: Check }
];

const OCCASIONS = [
  { id: 'Breakfast', label: 'Breakfast', desc: 'Rise and grind. Sun-baked early pairing.', hours: '5 am - 11 am' },
  { id: 'Tea', label: 'Tea Time', desc: 'Midday escape. Savory crumpets, scones, or fingers.', hours: '11 am - 12 pm / 3 pm - 5 pm' },
  { id: 'Lunch', label: 'Lunch', desc: 'A sustaining platter or craft sandwich benchmark.', hours: '12 pm - 3 pm' },
  { id: 'Supper', label: 'Supper', desc: 'The grand finale. Slow brazed grills and family comfort.', hours: '5 pm - 5 am' }
];

// Helper to guess occasion based on hours
const getSuggestedOccasion = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Breakfast';
  if (hour === 11 || (hour >= 15 && hour < 17)) return 'Tea';
  if (hour >= 12 && hour < 15) return 'Lunch';
  return 'Supper';
};

interface RecommendedMustard {
  productId: string;
  productName: string;
  reason: string;
}

interface SuggestedRecipe {
  title: string;
  prepTime: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  ingredients: string[];
  instructions: string[];
  chefsTip: string;
}

interface AnalysisResults {
  detectedIngredients: string[];
  mustardRecommendations: RecommendedMustard[];
  recipes: SuggestedRecipe[];
}

// Interactive Cooking Science & Help Guides Data
export const BRAAI_CUTS = [
  { id: 'chops', name: 'Lamb Chops & Steaks', desc: 'The vinegar acidity break down tough cell structures and tenderizes stringy fat layers.' },
  { id: 'chicken', name: 'Chicken Wings & Thighs', desc: 'Forms an airtight seal that locks in rich natural juices, preventing dry, white meat over logs.' },
  { id: 'ribs', name: 'Sticky Pork Ribs', desc: 'Mustard seeds carry natural oils that insulate delicate meat caramelized layers from hot ashes.' },
  { id: 'snoek', name: 'West Coast Snoek', desc: 'Acts as an emulsified cement that binds rich Cape apricot preserves safely onto flaky fish skins.' },
  { id: 'boerewors', name: 'Artisanal Boerewors', desc: 'Maintains casing moisture under high flare-ups, locking in dry coriander and game spice notes.' },
  { id: 'halloumi', name: 'Halloumi & Veg Skewers', desc: 'Serves as an adhesive foundation so hickory smoke and char particles cling to dry vegetarian surfaces.' }
];

export const BRAAI_VIBES = [
  { id: 'sticky-sweet', name: 'Sticky Sweet Karoo Apricot', desc: 'Fruity glaze for golden caramelization and heavy sweet glaze crusts.' },
  { id: 'garlic-herb', name: 'Zesty Garlic & Honey Thyme', desc: 'Rustic herb coating to hold seasoning blends and garlic slices over high flames.' },
  { id: 'furious-heat', name: 'Carolina Reaper Fire Baste', desc: 'A rich glaze with a pleasant burn that beautifully retains its rich flavor.' },
  { id: 'sugar-free-keto', name: 'Keto Sugar-Free Zesty Rub', desc: 'Low-carb, seed-forward crust with zero added sugar elements.' }
];

export const getBraaiCombinationResult = (cut: string, vibe: string) => {
  let prodId = '1';
  let prodName = 'Smoked Apricot Braaibroodjie Mustard';
  let price = 'R85';

  if (vibe === 'furious-heat') {
    prodId = '6';
    prodName = 'Fiery Reaper Mustard';
    price = 'R110';
  } else if (vibe === 'sugar-free-keto') {
    prodId = '4';
    prodName = 'Sugar-Free Artisan Mustard';
    price = 'R80';
  } else if (vibe === 'garlic-herb') {
    prodId = '3';
    prodName = 'Honey and Whisky Mustard';
    price = 'R95';
  } else {
    if (cut === 'snoek') {
      prodId = '1';
      prodName = 'Smoked Apricot Braaibroodjie Mustard';
      price = 'R85';
    } else if (cut === 'chops') {
      prodId = '2';
      prodName = 'Green Fig and Balsamic Mustard';
      price = 'R95';
    }
  }

  const cutObj = BRAAI_CUTS.find(c => c.id === cut);
  const vibeObj = BRAAI_VIBES.find(v => v.id === vibe);
  const cutName = cutObj ? cutObj.name : "Cut";
  const vibeName = vibeObj ? vibeObj.name : "Vibe";

  let title = `The Gourmet ${vibeName} Glaze for ${cutName}`;
  let mixInstructions = [
    `Measure out 3 tablespoons of premium ${prodName}.`,
    `Whisk with 1 tablespoon of melted salted butter, 1 tsp lemon juice, and a pinch of rock salt.`,
    `Step 1 (The Pre-Rub): Paint a thin layer onto the raw ${cutName} before browning on the braai grid.`,
    `Step 2 (The Baste): Re-apply generously inside the final 3 minutes of high-flame cooking for a thick, caramelized lacquer.`
  ];
  let h_science = "";

  if (cut === 'chops') {
    h_science = "Tenderizing Acidity: Vinegar within artisanal stone-ground mustard naturally tenderizes tough Lamb muscle fibers during the initial heat-up. It also functions as a sticky adhesive binder, gluing your fresh rosemary springs and crushed garlic directly to the chop skins so they do not fall out into the low charcoal ashes.";
  } else if (cut === 'chicken') {
    h_science = "Moisture Shielding: Poultry fibers shrink rapidly over direct radiant coal heat, losing natural juices. Smearing a stone-ground mustard coat creates an defensive insulating barrier. The oil content blocks fast moisture evaporation, preserving tender succulent breast fibers.";
  } else if (cut === 'snoek') {
    h_science = "Fish Grid Cementation: Delicate line fish skins have a tendency to stick to steel braai grid baskets. The lecithin lipids in our stone-ground recipe lubricate the grid wires while binding your sweet, sticky apricot glaze onto the fish flakes instead of letting it melt down onto hot coals.";
  } else {
    h_science = "Smoke Clinging Mechanism: Wood smoke chips produce millions of volatile flavor particles that only stick to damp, warm grease. Mustard seed lipids create a moist, adhesive skin that captures these rising charcoal hickory elements, double-concentrating authentic braai wood aroma.";
  }

  return { prodId, prodName, price, title, mixInstructions, stealthScience: h_science };
};

export const MO_DISHES = [
  {
    id: 'pan-sauce',
    error: 'Mustard is Just a Hotdog Condiment',
    desc: 'Assuming mustard is just a second-rate raw hotdog smear, rather than the ultimate gourmet binding secret that turns wine, stock, and butter into a silky, thick French-bistro sauce.',
    remedy: '3-Minute Classic Bistro Pan Sauce: Sauté 1 minced shallot or onion garlic mix in your meat drippings for 1 minute. Deglaze the hot pan with 1/2 cup of wine or broth, scraping up all stuck bits. Reduce by half (1 minute), then turn off heat. Whisk in 1 tbsp of Honey and Whisky Mustard and 2 tbsp of cold butter. Watch it magically bind into a glossy pan sauce in seconds!',
    science: 'Aqueous-Lipid Emulsification: Ground mustard seeds pack intense natural lecithins and healthy mucilages. Off heat, these compounds act as physical couplers, locking hydrophobic fats (butter/drippings) and hydrophilic liquids (wine/stock) into a single, perfectly unified velvet sauce that never splits or leaks.',
    recommend: { id: '3', name: 'Honey and Whisky Mustard', price: 'R95' }
  },
  {
    id: 'split-dressing',
    error: 'Greasy Separating Salad Dressings',
    desc: 'Oil floats in separate slick pools above the vinegar, looking unappetizing and sour.',
    remedy: 'Whisk 1 level teaspoon of Green Fig and Balsamic Mustard into the vinegar base first before pouring in olive oils.',
    science: 'Lecithin Emulsification: Ground mustard seeds are packed with lecithin - a surfactant containing a water-loving polar head and a fat-loving nonpolar tail. It acts as an atomic lock, binding oil droplets and vinegar acids into a unified, creamy, stable vinaigrette that never splits on the plate.',
    recommend: { id: '2', name: 'Green Fig and Balsamic Mustard', price: 'R95' }
  },
  {
    id: 'runny-potjie',
    error: 'Runny or Watery Potjie Stews',
    desc: 'The meat is cooked beautifully but the surrounding juices are thin, watery, and slide off your starch.',
    remedy: 'Spoon 2 tablespoons of Honey and Whisky Mustard into the pot 15 minutes before taking the pot off the coals.',
    science: 'Natural Thickeners: Whole mustard hulls absorb liquid and swell up to three times their weight, releasing mucilaginous compounds (soluble fibers). Whisked into a boiling potjie, they bind water molecules and meat fats into a velvety gravy skin without introducing artificial cornflour or gluten gluten.',
    recommend: { id: '3', name: 'Honey and Whisky Mustard', price: 'R95' }
  },
  {
    id: 'flat-drippings',
    error: 'Flat, Dull Oven Pan Gravy',
    desc: 'Your roast pan drippings taste flat and boring, or taste single-note salty without depth.',
    remedy: 'While deglazing your roast pans with warm stock, whisk in 1 tablespoon of Smoked Apricot Braaibroodjie Mustard.',
    science: 'Organic Flavor Enhancers: When meat roasts, it locks down complex sugars (Maillard residues) of amino acids. Mustard vinegar and stone-ground sugars dissolve these stuck brown pan bits in seconds while rounding off raw fat with dynamic, bright organic acids.',
    recommend: { id: '1', name: 'Smoked Apricot Braaibroodjie Mustard', price: 'R85' }
  },
  {
    id: 'tough-stew',
    error: 'Tough, Fibrous Stewing Blends',
    desc: 'Venkison, chuck, or shin pieces remain tough and stringy even after hours of simmering.',
    remedy: 'Massage 2 tablespoons of Sugar-Free Artisan Mustard into raw meat cubes and let rest for 30 minutes before searing.',
    science: 'Connective Tissue Softener: Unpasteurized stone-ground mustard vinegar has a low, controlled pH. Masshing this into muscle beef fibers breaks solid cross-linked collagen and tough structural protein chains prior to cooking, making the meat melt-in-the-mouth soft once stewed.',
    recommend: { id: '4', name: 'Sugar-Free Artisan Mustard', price: 'R80' }
  }
];

export const HERITAGE_STAPLES = [
  {
    id: 'boerie',
    name: 'Gourmet Boerewors Roll',
    average: 'Standard margins loaded with high-fructose commercial ketchup or yellow industrial paste.',
    upgrade: 'Spread a heavy crust of local Craft Beer Artisan Mustard over fresh braai-grilled onions in sourdough.',
    howTo: 'Slice a crispy sourdough hotdog roll. Lay down a foundational spread of Craft Beer Artisan Mustard. Insert the steaming boerewors piece, and cover under vinegar-caramelized white onions and fine chives.',
    science: 'Malt Coordination: Craft beer extracts in the mustard formulation bind with the pork/beef casing oils, mimicking the wood smoke aroma while the stone-ground seeds cut through sausage casing density.',
    recommend: { id: '5', name: 'Craft Beer Artisan Mustard', price: 'R85' }
  },
  {
    id: 'vetkoek',
    name: 'Crispy Vetkoek & Curry Mince',
    average: 'Heavy, greasy yeast dough filled directly with beef curry mince, with no acidity to lighten the palate.',
    upgrade: 'Smear a thin coating of Smoked Apricot Braaibroodjie Mustard inside the vetkoek cavity prior to mincing.',
    howTo: 'Slice your warm, fresh golden vetkoek open. Paint the bottom wall with 2 teaspoons of Smoked Apricot Braaibroodjie Mustard. Spoon in your aromatic curried Cape Malay ground beef mince.',
    science: 'Grease and Spice Balance: The sweet, fruity apricot brightness acts as a natural palate cleanser against deep-fried yeast dough oils, while stone-ground vinegar brings out the organic cumin and coriander flavors of Cape Malay mince.',
    recommend: { id: '1', name: 'Smoked Apricot Braaibroodjie Mustard', price: 'R85' }
  },
  {
    id: 'snoek-upgrade',
    name: 'West Coast Apricot Snoek Braai',
    average: 'Single-note sweet apricot jam painted on the skin, burning easily and providing flat sweetness.',
    upgrade: 'Whisk hot melted butter with equal parts sweet apricot jam and Smoked Apricot Braaibroodjie Mustard to glaze.',
    howTo: 'Combine 2 tbsp apricot jam, 1 tbsp butter, and 2 tbsp Smoked Apricot Braaibroodjie Mustard in a pot. Brush over fish skin and flesh continuously during braai.',
    science: 'Caramelization Control: Mustard seed shells have high smoking points that shield pure sugars from scorching on hot wood coals, while the stone-ground pepper spices turn single-note sweet snoek into a complex bistro masterpiece.',
    recommend: { id: '1', name: 'Smoked Apricot Braaibroodjie Mustard', price: 'R85' }
  },
  {
    id: 'jaffle',
    name: 'Biltong & Cheddar Toasted Jaffle',
    average: 'Melted cheese toastie that tastes heavy, with biltong drying out on high press-heat.',
    upgrade: 'Paint Green Fig and Balsamic Mustard directly onto the interior sourdough sides.',
    howTo: 'Butter your outer bread crusts. On the inside, smear a gorgeous, deep layer of Green Fig and Balsamic Mustard. Fill with sharp aged white cheddar and rich shaved beef biltong, then clamp in your jaffle iron.',
    science: 'Salt & Sweet Contrast: Sweet, sharp preserved green figs match the natural curing spices of sliced South African coriander biltong while cut through fatty cheese density.',
    recommend: { id: '2', name: 'Green Fig and Balsamic Mustard', price: 'R95' }
  },
  {
    id: 'sweet-pot-pap',
    name: 'Sweet Potato Pap & Tomato Sheba',
    average: 'Starch-heavy hot pap bowls served with single-note canned tomatoes.',
    upgrade: 'Fold a high-spirited tablespoon of Sugar-Free Artisan Mustard into your simmering tomato gravy onion mix.',
    howTo: 'While reducing your spicy tomato, onion, and garlic sheba gravy, stir in 1 tbsp of Sugar-Free Artisan Mustard and a pinch of brown sugar.',
    science: 'Acidity Harmony: Commercial tomatoes can taste sour or metallic. The natural turmeric and pure mustard seed warmth in Sugar-Free Mustard balance tomato citric acids, delivering high gourmet notes to comforting pap stews.',
    recommend: { id: '4', name: 'Sugar-Free Artisan Mustard', price: 'R80' }
  }
];

export default function WhatsForMeal({ onAddToCart, onOpenAuth }: WhatsForMealProps) {
  const { earnPoints } = useNotifications();
  const { user } = useAuth();

  // Stealth kitchen academy tools states
  const [activeTool, setActiveTool] = useState<'planner' | 'braai' | 'sauce' | 'heritage'>('planner');
  const [braaiCut, setBraaiCut] = useState<string>('chops');
  const [braaiVibe, setBraaiVibe] = useState<string>('sticky-sweet');
  const [sauceDisaster, setSauceDisaster] = useState<string>('pan-sauce');
  const [heritageStaple, setHeritageStaple] = useState<string>('boerie');

  const getPointsForDifficulty = (diff: string | undefined): number => {
    const d = (diff || 'Easy').toLowerCase();
    if (d === 'hard') return 12;
    if (d === 'moderate' || d === 'medium') return 8;
    return 4;
  };

  const [cookingLoading, setCookingLoading] = useState(false);
  const [cookingSuccessMsg, setCookingSuccessMsg] = useState<string | null>(null);

  const handleMarkRecipeCooked = async (recipe: SuggestedRecipe) => {
    if (!user) {
      alert("Authenticate your Digital Member Profile in the top bar to claim your loyal points and register this creation in your Foodie Diary!");
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setCookingLoading(true);
    try {
      const pts = getPointsForDifficulty(recipe.difficulty);
      
      // Determine what mustard is matched/recommended
      const recomMustardName = results?.mustardRecommendations?.[0]?.productName || 'Smoked Apricot Braaibroodjie Mustard';

      // 1. Log to foodieDiary!
      const docRef = await addDoc(collection(db, 'foodieDiary'), {
        userId: user.uid,
        userName: user.displayName || 'Artisanal Member',
        recipeName: recipe.title,
        mustardUsed: recomMustardName,
        usedWhatsForMeal: true,
        difficulty: recipe.difficulty || 'Moderate',
        stars: 5,
        surprisedBy: recipe.chefsTip || 'The flavor coordination worked flawlessly.',
        experience: `Cooked using the AI "What's For Meal" assistant matched recipes! Prep time: ${recipe.prepTime}.`,
        cookedAt: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: []
      });

      // 2. Add community log pulse
      await addDoc(collection(db, 'activity'), {
        type: 'alchemy_transmuted',
        userId: user.uid,
        userName: user.displayName || 'Artisanal Member',
        message: `cooked the AI Quest: "${recipe.title}" (+${pts} points)!`,
        targetId: docRef.id,
        createdAt: serverTimestamp()
      });

      // 3. Earn points
      await earnPoints(pts, `Completed ${recipe.difficulty} match query: ${recipe.title}`);

      // 4. Confetti and message
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#A3A31F', '#F4F1EA', '#2D2D2D']
      });

      setCookingSuccessMsg(`Success! Saved to your Kitchen Journal and awarded +${pts} loyalty seeds!`);
      setTimeout(() => setCookingSuccessMsg(null), 5000);

    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'foodieDiary');
    } finally {
      setCookingLoading(false);
    }
  };

  // Do your own thing parameters
  const [showOwnThingForm, setShowOwnThingForm] = useState(false);
  const [ownTitle, setOwnTitle] = useState('');
  const [ownMustard, setOwnMustard] = useState(PRODUCTS[0]?.name || 'Smoked Apricot Braaibroodjie Mustard');
  const [ownDifficulty, setOwnDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [ownExperience, setOwnExperience] = useState('');
  const [ownSurprise, setOwnSurprise] = useState('');
  const [isOwnSubmitting, setIsOwnSubmitting] = useState(false);

  const handleOwnThingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownTitle || !ownExperience) return;

    if (!user) {
      alert("Register with your Digital Member account first using the profile icon to file this creation!");
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsOwnSubmitting(true);
    try {
      const pts = getPointsForDifficulty(ownDifficulty);

      // 1. Save to foodieDiary
      const docRef = await addDoc(collection(db, 'foodieDiary'), {
        userId: user.uid,
        userName: user.displayName || 'Artisanal Member',
        recipeName: ownTitle,
        mustardUsed: ownMustard,
        usedWhatsForMeal: false,
        difficulty: ownDifficulty,
        stars: 5,
        surprisedBy: ownSurprise || 'Daring original combination was highly surprising.',
        experience: ownExperience,
        cookedAt: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: []
      });

      // 2. Add community log pulse
      await addDoc(collection(db, 'activity'), {
        type: 'alchemy_transmuted',
        userId: user.uid,
        userName: user.displayName || 'Artisanal Member',
        message: `created custom masterpiece: "${ownTitle}" (+${pts} points)!`,
        targetId: docRef.id,
        createdAt: serverTimestamp()
      });

      // 3. Earn points
      await earnPoints(pts, `Completed Custom DIY Foodie Quest: ${ownTitle}`);

      // 4. Confetti and celebrate
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#A3A31F', '#F1EFE9', '#242420']
      });

      // Clear states
      setOwnTitle('');
      setOwnExperience('');
      setOwnSurprise('');
      setOwnDifficulty('Moderate');
      setShowOwnThingForm(false);

      // Flash success
      setCookingSuccessMsg(`Legendary! Custom recipe scored at ${ownDifficulty} difficulty. Added +${pts} loyalty seeds to your account!`);
      setTimeout(() => setCookingSuccessMsg(null), 6000);

    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'foodieDiary');
    } finally {
      setIsOwnSubmitting(false);
    }
  };

  // Primary active states
  const [diet, setDiet] = useState<string>(() => localStorage.getItem('whatsfor_diet') || 'traditional');
  const [occasion, setOccasion] = useState<string>('Breakfast');
  const [ingredientsText, setIngredientsText] = useState('');
  
  // Image handling
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Loading and result states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRecipeIdx, setActiveRecipeIdx] = useState(0);

  // Refs for camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-set suggested occasion on mount
  useEffect(() => {
    setOccasion(getSuggestedOccasion());
  }, []);

  // Save diet preference
  useEffect(() => {
    localStorage.setItem('whatsfor_diet', diet);
  }, [diet]);

  // Clean stream when unmounting or deactivated
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      setCameraError("Unable to access front or backward camera. Please use File Upload instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const compressImageBase64 = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = dataUrl;
    });
  };

  const takeSnapshot = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.85);
        const compressed = await compressImageBase64(url);
        setImage(compressed);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImageBase64(reader.result as string);
        setImage(compressed);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImageBase64(reader.result as string);
        setImage(compressed);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fun helper messages for culinary loading state
  const runSpinnerMessages = () => {
    const messages = [
      "Gathering stone-ground mustard logs...",
      "Peering into the pantry baskets with Gemini vision...",
      "Whispering to our Smoked Apricot barrels...",
      "Drafting culinary formulas tailored to your diet...",
      "Balancing tang, smoke, heat, and sweetness...",
      "Fining the chef's pairings..."
    ];
    let idx = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingMessage(messages[idx]);
    }, 2800);
    return interval;
  };

  const handleSubmitAnalysis = async () => {
    if (!ingredientsText.trim() && !image) {
      setError("Please outline your ingredients in the dialogue box or snap/upload a bag photo first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    const msgInterval = runSpinnerMessages();

    try {
      // Formulate list of products present
      const availableProductsContext = PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        isVegan: p.isVegan !== false,
        ingredients: p.ingredients || [],
        pairings: p.pairings || []
      }));

      // Set up base prompt for vision + text
      const promptText = `
        You are the Master Chef & Artisanal Food pairing specialist of "Mustard Deli" (South Africa's champion stone-ground mustard artisan).
        
        The user wants to prepare a meal.
        Occasion: "${occasion}"
        Dietary Profile Preference: "${diet}" (Ensure ALL recipes and ingredients match this lifestyle! e.g., if diet is vegan, use vegan proteins, do NOT suggest beef/bacon or honey in recipes unless replaced with plants, etc. If banting/keto/banter, do NOT use sugar/flour/potatoes).
        
        User's Available Ingredients input: "${ingredientsText}"

        Your task:
        1. Identify the ingredients of their meal (if an image is supplied, visually analyze the ingredients. If text is supplied, parse it). Combine them into a precise detected ingredients array.
        2. Filter and recommend 1 to 3 best-suited premium Mustard Deli flavors from the product list below to glaze, season, or pair. Explain exactly WHY they fit this occasion, dietary lifestyle, and the user's specific ingredients.
        
        Mustard Deli Product Catalog Context:
        ${JSON.stringify(availableProductsContext, null, 2)}

        3. Generate EXACTLY 3 custom, inspiring, highly realistic recipes of progressive difficulties for that meal occasion using the identified ingredients alongside the recommended hot/sweet/tangy mustards.
           - Recipe 1 MUST be "Easy" difficulty (lowest culinary complexity, quick assembly).
           - Recipe 2 MUST be "Moderate" difficulty (medium complexity, standard stove cooking or pan sauce assembly).
           - Recipe 3 MUST be "Hard" difficulty (highest complexity, requiring multiple steps, reducing glaze or braai/oven roasting).
        
        CRITICAL instruction: You MUST return a STRICT JSON output matching this schema exactly. Do not include markdown wraps or anything except a clean parseable JSON object.

        JSON Schema:
        {
          "detectedIngredients": ["list", "of", "detected", "ingredients"],
          "mustardRecommendations": [
            {
              "productId": "id matching product catalog",
              "productName": "name matching product catalog exactly",
              "reason": "precise and delightful pair reason"
            }
          ],
          "recipes": [
            {
              "title": "Inspiring Easy Recipe Title",
              "prepTime": "e.g. 15 mins",
              "difficulty": "Easy",
              "ingredients": ["precise ingredient measure 1", "precise ingredient measure 2"],
              "instructions": ["Step A...", "Step B...", "Step C..."],
              "chefsTip": "Detailed instruction on how to incorporate the recommended Mustard Deli product for ultimate gold-winning flavor."
            },
            {
              "title": "Inspiring Moderate Recipe Title",
              "prepTime": "e.g. 30 mins",
              "difficulty": "Moderate",
              "ingredients": ["precise ingredient measure 1", "precise ingredient measure 2"],
              "instructions": ["Step A...", "Step B...", "Step C..."],
              "chefsTip": "Detailed instruction on how to incorporate the recommended Mustard Deli product for ultimate gold-winning flavor."
            },
            {
              "title": "Inspiring Hard Recipe Title",
              "prepTime": "e.g. 50 mins",
              "difficulty": "Hard",
              "ingredients": ["precise ingredient measure 1", "precise ingredient measure 2"],
              "instructions": ["Step A...", "Step B...", "Step C..."],
              "chefsTip": "Detailed instruction on how to incorporate the recommended Mustard Deli product for ultimate gold-winning flavor."
            }
          ]
        }
      `;

      // Structure of contents matching Gemini SDK guidelines
      let contents;
      if (image) {
        const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Clean
              }
            },
            {
              text: promptText
            }
          ]
        };
      } else {
        contents = {
          parts: [
            {
              text: promptText
            }
          ]
        };
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gemini-3.5-flash",
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.35
          }
        })
      });

      if (!response.ok) {
        throw new Error("Our recipe alchemists timed out. Please check your network and try again.");
      }

      const data = await response.json();
      const parsedText = data.text?.trim() || "";
      
      // Clean prefix/suffix from JSON if any is returned
      let cleanJson = parsedText;
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "");
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "");
      }

      const parsedResults: AnalysisResults = JSON.parse(cleanJson);
      setResults(parsedResults);
      setActiveRecipeIdx(0);

      // Award dynamic loyalty seeds
      try {
        await earnPoints(10, "What's For Cook Planner Complete");
      } catch (ptsErr) {
        console.warn("Failed points award:", ptsErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Apologies! Our culinary proxy encountered an error compiling your recipe collection. Please try once again.");
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setIngredientsText('');
    setResults(null);
    setError(null);
  };

  return (
    <div className="py-16 md:py-24 px-4 max-w-7xl mx-auto scroll-mt-20" id="whats-for">
      {/* Visual Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[10px] font-mono font-black tracking-[0.4em] text-brand-accent uppercase bg-brand-accent/15 px-3 py-1 rounded-none inline-block mb-4">
          ✨ THE ARTISAL SOVEREIGN RECIPE PLANNER
        </span>
        <h2 className="text-4xl md:text-5xl font-black uppercase text-brand-dark tracking-tight mb-4 leading-none">
          What's For... Dinner & Tea?
        </h2>
        <p className="text-sm text-[#5B5550] leading-relaxed">
          Stuck without ideas? Snapshot your fridge ingredients, nominate your dietary limits, and let our Gemini Taste Chef recommend matching <span className="text-brand-accent font-bold">Mustard Deli</span> blends along with 3 boutique recipes!
        </p>
      </div>

      {/* Dynamic Sub-tabs Switcher */}
      <div className="max-w-4xl mx-auto mb-12 border border-brand-border bg-white flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-brand-border shadow-sm">
        <button
          onClick={() => setActiveTool('planner')}
          className={`flex-1 py-4.5 px-4 font-black text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
            activeTool === 'planner' ? 'bg-brand-dark text-white shadow-inner' : 'text-[#5B5550] hover:bg-[#A3A31F]/5 hover:text-brand-dark'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-brand-accent" />
          AI Meal Planner
        </button>
        <button
          onClick={() => setActiveTool('braai')}
          className={`flex-1 py-4.5 px-4 font-black text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
            activeTool === 'braai' ? 'bg-brand-dark text-white shadow-inner' : 'text-[#5B5550] hover:bg-[#A3A31F]/5 hover:text-brand-dark'
          }`}
        >
          <Flame className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          Braai Glaze Deck
        </button>
        <button
          onClick={() => setActiveTool('sauce')}
          className={`flex-1 py-4.5 px-4 font-black text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
            activeTool === 'sauce' ? 'bg-brand-dark text-white shadow-inner' : 'text-[#5B5550] hover:bg-[#A3A31F]/5 hover:text-brand-dark'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0 text-brand-accent animate-pulse" />
          Sauce Rescuer
        </button>
        <button
          onClick={() => setActiveTool('heritage')}
          className={`flex-1 py-4.5 px-4 font-black text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
            activeTool === 'heritage' ? 'bg-brand-dark text-white shadow-inner' : 'text-[#5B5550] hover:bg-[#A3A31F]/5 hover:text-brand-dark'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          Heritage Upgrader
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTool === 'planner' && (
          <motion.div
            key="planner-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full"
          >
            {/* Left Control Panel */}
            <div className="lg:col-span-5 bg-white border border-brand-border p-6 md:p-8 space-y-8 shadow-sm">
              
              {/* Step 1: Occasion */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-dark flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-dark text-white rounded-full flex items-center justify-center text-[10px] font-mono">1</span>
                    Occasion Selection
                  </h3>
                  <span className="text-[9px] font-mono text-brand-accent font-bold">Smart suggested setting</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {OCCASIONS.map((occ) => {
                    const isSelected = occasion === occ.id;
                    return (
                      <button
                        key={occ.id}
                        onClick={() => setOccasion(occ.id)}
                        className={`p-4 border text-left transition-all ${
                          isSelected 
                            ? 'border-brand-accent bg-[#A3A31F]/10 shadow-sm' 
                            : 'border-brand-border hover:border-brand-dark'
                        }`}
                      >
                        <span className="block text-xs font-black uppercase tracking-tight text-brand-dark mb-0.5">{occ.label}</span>
                        <span className="block text-[8px] font-mono text-brand-dark/50 uppercase leading-none">{occ.hours}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Dietary Restrictions */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-dark flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-dark text-white rounded-full flex items-center justify-center text-[10px] font-mono">2</span>
                    Your Dietary Profile
                  </h3>
                  <span className="text-[10px] font-mono font-black text-emerald-800">Saves to local device</span>
                </div>

                <div className="space-y-2">
                  {DIET_OPTIONS.map((opt) => {
                    const isSelected = diet === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setDiet(opt.id)}
                        className={`w-full p-3 border text-left flex items-center gap-3 transition-colors ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/60' 
                            : 'border-brand-border hover:bg-brand-secondary/40'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'bg-brand-secondary text-brand-dark'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-black uppercase text-brand-dark">{opt.label}</span>
                          <span className="block text-[10px] text-brand-dark/50">{opt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

          {/* Step 3: Snapshot Or Outline Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-dark flex items-center gap-2">
                <span className="w-5 h-5 bg-brand-dark text-white rounded-full flex items-center justify-center text-[10px] font-mono">3</span>
                Input Fridge Assets
              </h3>
            </div>

            <div className="space-y-4">
              {/* Image Input Container */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative bg-brand-secondary border-2 border-dashed border-brand-border h-48 flex flex-col items-center justify-center text-center p-4 overflow-hidden group"
              >
                {image ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={image} 
                      alt="Fridge Assets" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-brand-dark/50" />
                    <div className="absolute inset-0 flex items-center justify-center gap-3 z-10">
                      <button 
                        onClick={() => setImage(null)}
                        className="p-3 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-widest transition-colors shadow-lg"
                      >
                        Remove Asset
                      </button>
                      <button 
                        onClick={startCamera}
                        className="p-3 bg-white text-brand-dark font-black text-[9px] uppercase tracking-widest hover:bg-brand-secondary transition-colors shadow-lg"
                      >
                        Retake Snapshot
                      </button>
                    </div>
                  </div>
                ) : isCameraActive ? (
                  <div className="absolute inset-0 w-full h-full bg-black">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
                      <button 
                        onClick={takeSnapshot}
                        className="py-2.5 px-6 bg-brand-accent text-white font-black text-[9px] uppercase tracking-widest rounded-none shadow-2xl"
                      >
                        Capture Frame
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="py-2.5 px-6 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest rounded-none shadow-2xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
                        <span className="text-[10px] font-black uppercase text-brand-dark">Compressing payload...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center gap-3 mb-2">
                          <button 
                            onClick={startCamera}
                            className="p-3 bg-brand-dark text-white rounded-none hover:bg-brand-accent transition-colors flex items-center gap-2 font-black text-[9px] tracking-widest uppercase"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Live Camera
                          </button>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-white border border-brand-border text-brand-dark rounded-none hover:bg-brand-secondary transition-colors flex items-center gap-2 font-black text-[9px] tracking-widest uppercase"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            File Upload
                          </button>
                        </div>
                        <p className="text-[9px] font-mono text-brand-dark/40 uppercase tracking-widest">
                          Or drag & drop kitchen photo here
                        </p>
                        {cameraError && (
                          <p className="text-[9px] font-bold text-red-500 mt-2 px-4 max-w-sm mx-auto">{cameraError}</p>
                        )}
                        <input 
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </>
                    )}
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] mb-1.5 leading-none">
                  Manual ingredient checklist (optional)
                </label>
                <textarea
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  placeholder="e.g. skinless chicken thighs, baby spinach, cheddar, garlic cloves, sourdough crusts..."
                  className="w-full border border-brand-border bg-white text-xs font-medium p-4 focus:outline-none focus:border-brand-dark resize-none h-24 placeholder:text-brand-dark/20 custom-scrollbar"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleSubmitAnalysis}
              disabled={loading}
              className="w-full py-5 bg-brand-accent hover:bg-brand-dark text-white font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Alchemy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  Magic Mustard Plan-My-Meal (+10 Seeds)
                </>
              )}
            </button>
            
            {(image || ingredientsText || results) && (
              <button
                onClick={handleClear}
                disabled={loading}
                className="w-full py-4 border border-brand-border bg-white text-brand-dark/70 hover:text-brand-dark font-black text-[9px] uppercase tracking-widest transition-all"
              >
                Reset Planner Slate
              </button>
            )}
          </div>

        </div>

        {/* Right Output Results Panel */}
        <div className="lg:col-span-7 bg-white border border-brand-border p-6 md:p-8 min-h-[500px] flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 space-y-6"
              >
                <div className="relative w-24 h-24 mx-auto">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute inset-0 border-4 border-dashed border-brand-accent rounded-full"
                  />
                  <div className="absolute inset-3 bg-brand-secondary rounded-full flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-brand-dark" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#A3A31F]">Emulsifying Taste Blueprint</h4>
                  <p className="text-xs text-[#5B5550] max-w-sm mx-auto font-medium leading-relaxed italic">
                    "{loadingMessage}"
                  </p>
                </div>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 px-6 border-2 border-dashed border-red-500/20 bg-red-50/50"
              >
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h4 className="text-sm font-black uppercase tracking-wider text-red-900 mb-2">Planner Error</h4>
                <p className="text-xs text-red-700 leading-relaxed max-w-md mx-auto mb-6">
                  {error}
                </p>
                <button 
                  onClick={handleSubmitAnalysis}
                  className="px-6 py-3 bg-red-800 text-white font-black text-[9px] uppercase tracking-widest"
                >
                  Retry Analysis
                </button>
              </motion.div>
            )}

            {!loading && !results && !error && (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-brand-bg/40 border border-dashed border-brand-border/80"
              >
                <ChefHat className="w-16 h-16 text-brand-dark/20 mx-auto mb-6" />
                <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-2">
                  Awaiting Food Assets
                </h3>
                <p className="text-xs text-brand-dark/50 leading-relaxed max-w-md mx-auto px-6">
                  Outline your ingredients in Step 3 on the left panel (either type them manually or configure a quick live snapshot). Click the analyze button to unleash South Africa's leading culinary pairings!
                </p>
              </motion.div>
            )}

            {results && !loading && !error && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {cookingSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-emerald-600 bg-[#E8F5E9] text-emerald-800 p-4 font-mono text-xs flex items-center justify-between shadow-md"
                  >
                    <span className="flex items-center gap-2 md:gap-3 font-semibold">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                      {cookingSuccessMsg}
                    </span>
                    <button 
                      onClick={() => setCookingSuccessMsg(null)} 
                      className="text-emerald-700 font-bold hover:text-emerald-900 ml-4 font-mono text-[9px] bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5"
                    >
                      DISMISS
                    </button>
                  </motion.div>
                )}

                {/* Detected Ingredients Tag list */}
                {results.detectedIngredients?.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-mono font-black text-brand-dark/40 tracking-widest uppercase mb-2">
                      ✔ IDENTIFIED PANTRY ASSETS
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {results.detectedIngredients.map((ing, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 bg-brand-secondary text-brand-dark text-[10px] font-bold uppercase border border-brand-border/60"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mustard Recommendation */}
                {results.mustardRecommendations?.length > 0 && (
                  <div className="bg-[#4B5320]/5 border border-[#4B5320]/20 p-5 md:p-6 rounded-none">
                    <span className="text-[9px] font-mono font-black tracking-widest text-[#A3A31F] uppercase block mb-3">
                      🏆 RECOMMENDED MUSTARD pairings
                    </span>
                    
                    <div className="space-y-4">
                      {results.mustardRecommendations.map((rec, i) => {
                        const recId = rec.productId ? String(rec.productId).trim() : '';
                        const recName = rec.productName ? rec.productName.toLowerCase() : '';
                        
                        // 1. Precise/strict ID Match
                        let matchedProduct = PRODUCTS.find(p => String(p.id).trim() === recId);
                        
                        // 2. Exact or container substring Name Match
                        if (!matchedProduct && recName) {
                          matchedProduct = PRODUCTS.find(p => {
                            const pNameNorm = p.name.toLowerCase();
                            return pNameNorm.includes(recName) || recName.includes(pNameNorm);
                          });
                        }
                        
                        // 3. Loose word token keyword Match (handles & vs and, punctuation, etc)
                        if (!matchedProduct && recName) {
                          const recWords = recName.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && w !== 'mustard' && w !== 'deli');
                          if (recWords.length > 0) {
                            matchedProduct = PRODUCTS.find(p => {
                              const pWords = p.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                              return recWords.some(w => pWords.includes(w));
                            });
                          }
                        }
                        
                        // 4. Default safe fallback to first catalog item so that image is always present
                        if (!matchedProduct) {
                          matchedProduct = PRODUCTS[0];
                        }

                        return (
                          <div key={i} className="flex flex-col md:flex-row items-start justify-between gap-4 pb-4 last:pb-0 border-b last:border-0 border-brand-border/50">
                            <div className="flex items-start gap-3.5">
                              <div className="w-12 h-12 bg-zinc-100 border border-brand-border shrink-0 overflow-hidden text-center flex items-center justify-center">
                                <img 
                                  src={matchedProduct.image} 
                                  alt={rec.productName || matchedProduct.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-black uppercase text-brand-dark leading-tight">{rec.productName || matchedProduct.name}</h4>
                                <p className="text-[11px] text-[#5B5550] mt-1.5 leading-relaxed">{rec.reason}</p>
                              </div>
                            </div>
                            
                            {matchedProduct && (
                              <button
                                onClick={() => onAddToCart(matchedProduct.id)}
                                className="px-5 py-3 whitespace-nowrap bg-brand-dark hover:bg-brand-accent text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-md shrink-0 self-end md:self-center"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                Add jar • {matchedProduct.price}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recipes Carousel/Tabs */}
                <div>
                  <h4 className="text-[9px] font-mono font-black text-brand-dark/40 tracking-widest uppercase mb-3.5">
                    📖 PREPARED ARTISANAL suggestions ({results.recipes?.length || 0})
                  </h4>

                  <div className="flex border-b border-brand-border gap-2 overflow-x-auto pr-2 pb-2 custom-scrollbar">
                    {results.recipes?.map((recipe, idx) => {
                      const isActive = activeRecipeIdx === idx;
                      const diff = recipe.difficulty || (idx === 0 ? 'Easy' : idx === 1 ? 'Moderate' : 'Hard');
                      const pts = getPointsForDifficulty(diff);
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveRecipeIdx(idx);
                            setShowOwnThingForm(false);
                          }}
                          className={`px-4 py-2.5 whitespace-nowrap text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2.5 ${
                            isActive 
                              ? 'border-brand-accent text-brand-dark bg-brand-secondary' 
                              : 'border-transparent text-brand-dark/45 hover:text-brand-dark'
                          }`}
                        >
                          <span>{recipe.title}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase rounded ${
                            diff.toLowerCase() === 'hard' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            diff.toLowerCase() === 'moderate' || diff.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-800 border border-[#A3A31F]/30' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {diff} (+{pts} pts)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {results.recipes && results.recipes[activeRecipeIdx] && !showOwnThingForm && (
                      <motion.div 
                        key={activeRecipeIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        id="recipe-detail"
                        className="py-6 space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black uppercase tracking-tight text-brand-dark">
                            {results.recipes[activeRecipeIdx].title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-[8px] font-mono font-black uppercase tracking-wider ${
                              (results.recipes[activeRecipeIdx].difficulty || 'Moderate').toLowerCase() === 'hard' ? 'bg-rose-100 text-rose-800' :
                              (results.recipes[activeRecipeIdx].difficulty || 'Moderate').toLowerCase() === 'moderate' ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              Difficulty: {results.recipes[activeRecipeIdx].difficulty || 'Moderate'}
                            </span>
                            <span className="px-3 py-1 bg-brand-secondary text-brand-dark font-mono text-[9px] font-black flex items-center gap-1.5 uppercase tracking-wider">
                              <Clock className="w-3 h-3 shrink-0" />
                              {results.recipes[activeRecipeIdx].prepTime}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-[#A3A31F] mb-3 flex items-center gap-1.5">
                              <List className="w-3.5 h-3.5" />
                              Required Ingredients
                            </h4>
                            <ul className="space-y-2">
                              {results.recipes[activeRecipeIdx].ingredients?.map((ing, k) => (
                                <li key={k} className="text-xs text-brand-dark font-medium leading-normal flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0 mt-1.5"></span>
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase text-[#A3A31F] mb-3 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              Culinary Directions
                            </h4>
                            <ol className="space-y-3">
                              {results.recipes[activeRecipeIdx].instructions?.map((inst, k) => (
                                <li key={k} className="text-xs text-brand-dark/80 font-medium leading-relaxed flex items-start gap-2.5">
                                  <span className="text-[10px] font-mono font-black bg-brand-secondary text-brand-dark px-1.5 py-0.5 mt-0.5 min-w-[18px] text-center">
                                    {k + 1}
                                  </span>
                                  <span>{inst}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Chef's Tip */}
                        {results.recipes[activeRecipeIdx].chefsTip && (
                          <div className="border border-brand-accent/30 bg-amber-50/50 p-4 flex items-start gap-3.5">
                            <ChefHat className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[9px] font-black uppercase text-brand-accent tracking-widest mb-1">
                                🍳 CHEF'S PAIRING SECRET
                              </span>
                              <p className="text-xs text-[#5B5550] leading-relaxed font-medium">
                                {results.recipes[activeRecipeIdx].chefsTip}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Interactive Mark Cooked Button */}
                        <div className="border border-brand-border/80 bg-stone-50/60 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
                          <div>
                            <span className="text-[10px] font-mono font-black text-brand-accent tracking-widest uppercase block mb-1">
                              🏆 QUEST VERIFICATION STATUS
                            </span>
                            <h4 className="text-xs font-black uppercase text-brand-dark">
                              Ready to capture your {results.recipes[activeRecipeIdx].difficulty || 'Moderate'} recipe achievement?
                            </h4>
                            <p className="text-[11px] text-[#5B5550] mt-1">
                              Completing this quest awards <span className="text-brand-dark font-black font-semibold font-mono">{getPointsForDifficulty(results.recipes[activeRecipeIdx].difficulty)} dynamic loyalty seeds</span>, logging it directly onto your Foodie Journal!
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleMarkRecipeCooked(results.recipes[activeRecipeIdx])}
                            disabled={cookingLoading}
                            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg hover:translate-y-[-1px] disabled:opacity-50"
                          >
                            {cookingLoading ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Indexing...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Log & Collect +{getPointsForDifficulty(results.recipes[activeRecipeIdx].difficulty)} Seeds
                              </>
                            )}
                          </button>
                        </div>
                        
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Custom DIY "Do Your Own Thing" Portal */}
                  <div className="border-t border-brand-border/40 pt-10 mt-10">
                    <div className="bg-brand-dark text-white p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                      
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full translate-x-12 -translate-y-12"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-accent/5 rounded-full -translate-x-8 translate-y-8"></div>
                      
                      <div className="relative z-10 max-w-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-brand-accent animate-pulse" />
                          <span className="text-[9px] font-mono tracking-[0.25em] text-brand-accent uppercase font-black">
                            DECIDED TO DO YOUR OWN THING?
                          </span>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
                          Share Your Own Custom creation instead!
                        </h3>
                        <p className="text-xs text-[#FAFAF8]/75 mt-2 leading-relaxed font-medium">
                          Crafted a completely unique meal combo instead of our suggested recipes? Let our Head Chef evaluate your originality and award profile points (Easy: 4 pts, Medium: 8 pts, or Hard: 12 pts) matching your culinary skills!
                        </p>
                      </div>

                      <button
                        onClick={() => setShowOwnThingForm(!showOwnThingForm)}
                        className={`relative z-10 px-6 py-4 font-mono text-[9.5px] font-black uppercase tracking-widest transition-all self-stretch md:self-auto text-center ${
                          showOwnThingForm 
                            ? 'bg-stone-100 hover:bg-stone-200 text-brand-dark' 
                            : 'bg-brand-accent hover:bg-brand-accent/90 text-brand-dark'
                        }`}
                      >
                        {showOwnThingForm ? "Hide Journal Pad" : "Open Custom Journal Pad"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showOwnThingForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <form 
                            onSubmit={handleOwnThingSubmit}
                            className="bg-[#A3A31F]/5 border border-dashed border-brand-accent/40 p-6 md:p-8 mt-4 space-y-5"
                          >
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark border-b border-brand-border/40 pb-2 flex items-center gap-2">
                              <Hammer className="w-4 h-4 text-brand-accent" />
                              Custom Recipe Journal Ledger
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] mb-1.5">
                                  Title of Your Creation *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={ownTitle}
                                  onChange={(e) => setOwnTitle(e.target.value)}
                                  placeholder="e.g. Mustard Apricot Glazed Roasted Veggies"
                                  className="w-full p-3 bg-white border border-brand-border text-xs focus:border-[#A3A31F] text-brand-dark focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] mb-1.5">
                                  Which Mustard Deli Flavor Did You Include? *
                                </label>
                                <select
                                  value={ownMustard}
                                  onChange={(e) => setOwnMustard(e.target.value)}
                                  className="w-full p-3 bg-white border border-brand-border text-xs focus:border-[#A3A31F] text-brand-dark focus:outline-none"
                                >
                                  {PRODUCTS.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] mb-1.5">
                                  Assign Difficulty Category (Checked by Head Chef) *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['Easy', 'Moderate', 'Hard'] as const).map((diff) => {
                                    const pts = getPointsForDifficulty(diff);
                                    const isSel = ownDifficulty === diff;
                                    return (
                                      <button
                                        key={diff}
                                        type="button"
                                        onClick={() => setOwnDifficulty(diff)}
                                        className={`py-3 px-2 border text-center transition-colors font-mono text-[9px] font-black uppercase flex flex-col items-center justify-center gap-0.5 ${
                                          isSel 
                                            ? 'border-brand-dark bg-brand-dark text-white' 
                                            : 'border-brand-border bg-white text-brand-dark hover:border-brand-dark'
                                        }`}
                                      >
                                        <span>{diff}</span>
                                        <span className={`text-[8px] font-mono font-medium ${isSel ? 'text-[#A3A31F]' : 'text-brand-dark/40'}`}>
                                          +{pts} Pts
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] mb-1.5">
                                  Briefly explain what surprised you in the process
                                </label>
                                <input
                                  type="text"
                                  value={ownSurprise}
                                  onChange={(e) => setOwnSurprise(e.target.value)}
                                  placeholder="e.g. How the Smoked Apricot seeds popped on high oven grill..."
                                  className="w-full p-3 bg-white border border-brand-border text-xs focus:border-[#A3A31F] text-brand-dark focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] mb-1.5">
                                Share Your Preparation Method & Experience *
                              </label>
                              <textarea
                                required
                                rows={3}
                                value={ownExperience}
                                onChange={(e) => setOwnExperience(e.target.value)}
                                placeholder="Describe the ingredients you threw together and your general method. Let our gastro-alchemist community learn from your creative trials!"
                                className="w-full p-3 bg-white border border-brand-border text-xs focus:border-[#A3A31F] text-brand-dark focus:outline-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isOwnSubmitting}
                              className="w-full md:w-auto px-8 py-3.5 bg-brand-dark hover:bg-[#A3A31F] text-white font-mono text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                              {isOwnSubmitting ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Evaluating Creativity...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  File Custom Creation & Claim Points
                                </>
                              )}
                            </button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
          </motion.div>
        )}

        {activeTool === 'braai' && (
          <motion.div
            key="braai-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full"
          >
            {/* Left Control Column */}
            <div className="lg:col-span-5 bg-white border border-brand-border p-6 md:p-8 space-y-6 shadow-sm animate-fadeIn">
              <div>
                <span className="text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase block mb-1">STEALTH BRAAI EDUCATION</span>
                <h3 className="text-xl font-black uppercase text-brand-dark tracking-tight leading-none mb-2">The Glaze & Binder Deck</h3>
                <p className="text-xs text-[#5B5550]">
                  Select your braai cut and flavor profile vibe. Our alchemist deck explains the stealth science of cooking with mustard and gives a quick-mix lacquer basted right on hot logs!
                </p>
              </div>

              {/* Step A: Braai Cut */}
              <div className="space-y-3">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] border-b border-brand-border pb-1">
                  1. Choose Your Braai Cut / Asset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BRAAI_CUTS.map(cut => (
                    <button
                      key={cut.id}
                      onClick={() => setBraaiCut(cut.id)}
                      className={`p-3 border text-left transition-colors ${
                        braaiCut === cut.id 
                          ? 'border-brand-accent bg-[#A3A31F]/10 font-bold' 
                          : 'border-brand-border hover:bg-[#A3A31F]/5'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase text-brand-dark">{cut.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step B: Flavor Profile */}
              <div className="space-y-3">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#5B5550] border-b border-brand-border pb-1">
                  2. Choose Your Flavor Profile Goal
                </label>
                <div className="space-y-2">
                  {BRAAI_VIBES.map(vibe => (
                    <button
                      key={vibe.id}
                      onClick={() => setBraaiVibe(vibe.id)}
                      className={`w-full p-3 border text-left flex justify-between items-center transition-colors ${
                        braaiVibe === vibe.id
                          ? 'border-brand-accent bg-amber-50/60 font-bold'
                          : 'border-brand-border hover:bg-brand-secondary/40'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-black uppercase text-brand-dark">{vibe.name}</span>
                        <span className="block text-[10px] text-[#5B5550]">{vibe.desc}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${braaiVibe === vibe.id ? 'translate-x-1 text-brand-accent' : 'text-brand-dark/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Output Results Column */}
            <div className="lg:col-span-7 bg-white border border-brand-border p-6 md:p-8 space-y-6">
              {(() => {
                const comboResult = getBraaiCombinationResult(braaiCut, braaiVibe);
                const matchedProduct = PRODUCTS.find(p => p.id === comboResult.prodId);
                return (
                  <>
                    <div className="border-b border-brand-border pb-4">
                      <span className="text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase bg-brand-accent/15 px-2 py-0.5 inline-block mb-3">
                        🔥 SMART OUTCOME
                      </span>
                      <h4 className="text-2xl font-black uppercase text-brand-dark tracking-tight">
                        {comboResult.title}
                      </h4>
                    </div>

                    {/* Recipe Mixture */}
                    <div className="space-y-3.5">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-[#A3A31F] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
                        GRILL MASTER MIX METHOD
                      </h5>
                      <ul className="space-y-2">
                        {comboResult.mixInstructions.map((inst, idx) => (
                          <li key={idx} className="text-xs text-brand-dark font-medium leading-relaxed flex items-start gap-2.5">
                            <span className="text-[9.5px] font-mono font-black bg-brand-secondary text-brand-dark px-1.5 py-0.5 mt-0.5 min-w-[18px] text-center">
                              {idx + 1}
                            </span>
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Stealth Science Box */}
                    <div className="border border-brand-accent/30 bg-amber-50/50 p-5 space-y-2">
                      <span className="block text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase">
                        🧠 THE STEALTH SCIENCE PRINCIPLE (Why it works)
                      </span>
                      <p className="text-xs text-[#5B5550] leading-relaxed font-semibold">
                        {comboResult.stealthScience}
                      </p>
                    </div>

                    {/* Featured Product Match */}
                    {matchedProduct && (
                      <div className="bg-brand-secondary border border-brand-border/60 p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={matchedProduct.image} 
                            alt={matchedProduct.name} 
                            className="w-12 h-12 rounded-none border border-brand-border object-cover shrink-0 text-center flex items-center justify-center text-[10px]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block text-[8px] font-mono text-brand-dark/40 uppercase">REQUIRED ARTISANAL INGREDIENT</span>
                            <span className="block text-xs font-black uppercase text-brand-dark">{matchedProduct.name}</span>
                            <span className="block text-[10px] font-bold text-brand-accent">{matchedProduct.price}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onAddToCart(matchedProduct.id)}
                          className="px-5 py-3 whitespace-nowrap bg-brand-dark hover:bg-brand-accent text-white text-[9.5px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-md hover:translate-y-[-1px]"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-white" />
                          Add jar
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}

        {activeTool === 'sauce' && (
          <motion.div
            key="sauce-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full"
          >
            {/* Left Control Column */}
            <div className="lg:col-span-5 bg-white border border-brand-border p-6 md:p-8 space-y-5 shadow-sm animate-fadeIn">
              <div>
                <span className="text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase block mb-1">THE EMULSIFICATION DECK</span>
                <h3 className="text-xl font-black uppercase text-brand-dark tracking-tight leading-none mb-2">Sauce & Gravy Rescuer</h3>
                <p className="text-xs text-[#5B5550]">
                  Got a kitchen mishap? Select your culinary struggle. Learn the stealth science of emulsifying and thickening sauces cleanly with natural mustard seeds!
                </p>
              </div>

              <div className="space-y-2">
                {MO_DISHES.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => setSauceDisaster(dish.id)}
                    className={`w-full p-4 border text-left transition-colors ${
                      sauceDisaster === dish.id
                        ? 'border-brand-accent bg-[#A3A31F]/10 font-bold'
                        : 'border-brand-border hover:bg-[#A3A31F]/5'
                    }`}
                  >
                    <span className="block text-xs font-black uppercase text-brand-dark leading-tight mb-2 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${sauceDisaster === dish.id ? 'bg-brand-accent animate-ping' : 'bg-brand-dark/20'}`} />
                      {dish.error}
                    </span>
                    <span className="block text-[10px] text-[#5B5550] font-normal leading-relaxed">{dish.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Output Column */}
            <div className="lg:col-span-7 bg-white border border-brand-border p-6 md:p-8 space-y-6">
              {(() => {
                const selectedDisasterObj = MO_DISHES.find(d => d.id === sauceDisaster) || MO_DISHES[0];
                const matchedProduct = PRODUCTS.find(p => p.id === selectedDisasterObj.recommend.id);
                return (
                  <>
                    <div className="border-b border-brand-border pb-4">
                      <span className="text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase bg-brand-accent/15 px-2 py-0.5 inline-block mb-3">
                        🛡 CURE RECIPE
                      </span>
                      <h4 className="text-2xl font-black uppercase text-brand-dark tracking-tight">
                        How to Cure {selectedDisasterObj.error}
                      </h4>
                    </div>

                    {/* How to solve */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-[#A3A31F] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-brand-accent animate-bounce" />
                        THE 20-SECOND REMEDY
                      </h5>
                      <div className="p-4 bg-[#A3A31F]/5 border-l-4 border-brand-accent">
                        <p className="text-xs text-brand-dark font-bold leading-relaxed">
                          {selectedDisasterObj.remedy}
                        </p>
                      </div>
                    </div>

                    {/* Science behind lecithin */}
                    <div className="border border-brand-accent/30 bg-amber-50/50 p-5 space-y-2">
                      <span className="block text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase">
                        🔬 THE STEALTH CHEMISTRY (What you just learned!)
                      </span>
                      <p className="text-xs text-[#5B5550] leading-relaxed font-semibold">
                        {selectedDisasterObj.science}
                      </p>
                    </div>

                    {/* Suggested Product card */}
                    {matchedProduct && (
                      <div className="bg-brand-secondary border border-brand-border/60 p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={matchedProduct.image} 
                            alt={matchedProduct.name} 
                            className="w-12 h-12 border border-brand-border object-cover shrink-0 text-center flex items-center justify-center text-[10px]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block text-[8px] font-mono text-brand-dark/40 uppercase">EMULSIFYING AGENT MATCH</span>
                            <span className="block text-xs font-black uppercase text-brand-dark">{matchedProduct.name}</span>
                            <span className="block text-[10px] font-bold text-brand-accent">{matchedProduct.price}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onAddToCart(matchedProduct.id)}
                          className="px-5 py-3 whitespace-nowrap bg-brand-dark hover:bg-brand-accent text-white text-[9.5px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-md hover:translate-y-[-1px]"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-white" />
                          Add jar
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}

        {activeTool === 'heritage' && (
          <motion.div
            key="heritage-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full animate-fadeIn"
          >
            {/* Left Column menu list */}
            <div className="lg:col-span-5 bg-white border border-brand-border p-6 md:p-8 space-y-5 shadow-sm animate-fadeIn">
              <div>
                <span className="text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase block mb-1">SOUTH AFRICAN COMFORT FOOD</span>
                <h3 className="text-xl font-black uppercase text-brand-dark tracking-tight leading-none mb-2">Heritage Classics Upgrader</h3>
                <p className="text-xs text-[#5B5550]">
                  Select an iconic South African classic. See how swapping standard processed mustard/sweet butter for authentic stone-ground blends upgrades your palate!
                </p>
              </div>

              <div className="space-y-2">
                {HERITAGE_STAPLES.map(staple => (
                  <button
                    key={staple.id}
                    onClick={() => setHeritageStaple(staple.id)}
                    className={`w-full p-4 border text-left transition-colors ${
                      heritageStaple === staple.id
                        ? 'border-brand-accent bg-[#A3A31F]/10 font-bold'
                        : 'border-brand-border hover:bg-[#A3A31F]/5'
                    }`}
                  >
                    <span className="block text-xs font-black uppercase text-brand-dark">{staple.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column output detail card */}
            <div className="lg:col-span-7 bg-white border border-brand-border p-6 md:p-8 space-y-6">
              {(() => {
                const currentStaple = HERITAGE_STAPLES.find(s => s.id === heritageStaple) || HERITAGE_STAPLES[0];
                const matchedProduct = PRODUCTS.find(p => p.id === currentStaple.recommend.id);
                return (
                  <>
                    <div className="border-b border-brand-border pb-4">
                      <span className="text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase bg-brand-accent/15 px-2 py-0.5 inline-block mb-3">
                        🇿🇦 CLASSIC UPGRADE DETAIL
                      </span>
                      <h4 className="text-2xl font-black uppercase text-brand-dark tracking-tight">
                        Upgrading: {currentStaple.name}
                      </h4>
                    </div>

                    {/* Before & After blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-50/55 border border-red-500/10">
                        <span className="block text-[8px] font-mono font-black text-red-700 uppercase tracking-widest mb-1.5">
                          ⚠️ THE STANDARD OUTLET WAY
                        </span>
                        <p className="text-xs text-red-900/80 font-medium leading-relaxed">
                          {currentStaple.average}
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50/55 border border-emerald-500/10">
                        <span className="block text-[8px] font-mono font-black text-emerald-700 uppercase tracking-widest mb-1.5">
                          🌟 THE NOBLE GOURMET ELEVATION
                        </span>
                        <p className="text-xs text-[#10B981] font-bold leading-relaxed font-sans">
                          {currentStaple.upgrade}
                        </p>
                      </div>
                    </div>

                    {/* Practical Directions */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-[#A3A31F] flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5" />
                        SIMPLE ELEVATION DIRECTIONS
                      </h5>
                      <p className="text-xs text-brand-dark leading-relaxed font-semibold bg-brand-secondary/40 p-4 border border-brand-border/60">
                        {currentStaple.howTo}
                      </p>
                    </div>

                    {/* Secret matching reasoning */}
                    <div className="border border-brand-accent/30 bg-amber-50/50 p-5 space-y-2">
                      <span className="block text-[9px] font-mono font-black text-brand-accent tracking-widest uppercase">
                        💡 TASTE ALCHEMY SCIENCE (Why it fits)
                      </span>
                      <p className="text-xs text-[#5B5550] leading-relaxed font-semibold">
                        {currentStaple.science}
                      </p>
                    </div>

                    {/* Matching Product card */}
                    {matchedProduct && (
                      <div className="bg-brand-secondary border border-brand-border/60 p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={matchedProduct.image} 
                            alt={matchedProduct.name} 
                            className="w-12 h-12 border border-brand-border object-cover shrink-0 text-center flex items-center justify-center text-[10px]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block text-[8px] font-mono text-brand-dark/40 uppercase">RECOMMENDED MUSTARD BASE</span>
                            <span className="block text-xs font-black uppercase text-brand-dark">{matchedProduct.name}</span>
                            <span className="block text-[10px] font-bold text-brand-accent">{matchedProduct.price}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onAddToCart(matchedProduct.id)}
                          className="px-5 py-3 whitespace-nowrap bg-brand-dark hover:bg-brand-accent text-white text-[9.5px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-md hover:translate-y-[-1px]"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-white" />
                          Add jar
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
