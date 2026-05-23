export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Mustard' | 'Deli' | 'Sugar-Free' | 'Chilli';
  price: string;
  wholesalePrice?: string;
  image: string;
  stock: number;
  nutrition: {
    calories: string;
    fat: string;
    sugar: string;
    protein: string;
  };
  isVegan?: boolean;
  ingredients?: string[];
  productRecipes?: { title: string; excerpt: string }[];
  attributes?: string[];
  pairings?: string[];
  awards?: { title: string; year: string; image?: string }[];
  rating?: number;
  reviewsCount?: number;
  isMemberOnly?: boolean;
  isBestseller?: boolean;
  relatedProducts?: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  mustardUsed: string;
  isMemberOnly?: boolean;
}

export interface Stockist {
  id: string;
  name: string;
  location: string;
  city: string;
  province: 'Western Cape' | 'Gauteng' | 'Eastern Cape' | 'KwaZulu-Natal' | 'Free State' | 'Limpopo' | 'Mpumalanga' | 'North West' | 'Northern Cape';
  type: 'Retailer' | 'Market';
  lat: number;
  lng: number;
  website?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  lat: number;
  lng: number;
}

export const STOCKISTS: Stockist[] = [
  // Eastern Cape
  { id: 'ec-1', name: 'Emerald Vale Brewing Corporation Events', location: 'Chintsa East', city: 'East London', province: 'Eastern Cape', type: 'Retailer', lat: -32.81, lng: 28.12 },
  { id: 'ec-2', name: 'The Bakery Graaff Reinet', location: 'Somerset St', city: 'Graaff Reinet', province: 'Eastern Cape', type: 'Retailer', lat: -32.25, lng: 24.53 },
  { id: 'ec-3', name: 'Makhanda Fruit & Veg', location: 'Beaufort St', city: 'Grahamstown', province: 'Eastern Cape', type: 'Retailer', lat: -33.31, lng: 26.52 },
  { id: 'ec-4', name: 'Le Chameleon', location: 'Main St', city: 'Humansdorp', province: 'Eastern Cape', type: 'Retailer', lat: -34.03, lng: 24.77 },
  { id: 'ec-5', name: 'Harvest Moon Deli', location: 'Da Gama Rd', city: 'Jeffreys Bay', province: 'Eastern Cape', type: 'Retailer', lat: -34.05, lng: 24.92 },
  { id: 'ec-6', name: 'Infood Deli', location: 'Jeffreys St', city: 'Jeffreys Bay', province: 'Eastern Cape', type: 'Retailer', lat: -34.05, lng: 24.92 },
  { id: 'ec-7', name: 'The Oystercatcher', location: 'Beach Rd', city: 'Kei Mouth', province: 'Eastern Cape', type: 'Retailer', lat: -32.68, lng: 28.37 },
  { id: 'ec-8', name: 'The Bakery', location: 'Kenton Rd', city: 'Kenton on Sea', province: 'Eastern Cape', type: 'Retailer', lat: -33.68, lng: 26.67 },
  { id: 'ec-9', name: 'Daniell Farmstall African Arts and Vintage', location: 'R75 Highway', city: 'Kirkwood', province: 'Eastern Cape', type: 'Retailer', lat: -33.39, lng: 25.44 },
  { id: 'ec-10', name: 'Little Farm Shop Kleinemonde', location: 'R72 Highway', city: 'Port Alfred', province: 'Eastern Cape', type: 'Retailer', lat: -33.53, lng: 27.02 },
  { id: 'ec-11', name: 'Wharf Street Fruit & Veg', location: 'Wharf St', city: 'Port Alfred', province: 'Eastern Cape', type: 'Retailer', lat: -33.59, lng: 26.89 },
  { id: 'ec-12', name: 'Axel & Son (Coming Soon)', location: 'Richmond Hill', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.96, lng: 25.61 },
  { id: 'ec-13', name: 'Elephant Walk Farmstall', location: 'Colleen Glen', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.94, lng: 25.41 },
  { id: 'ec-14', name: 'Grass Roof', location: 'Sardinia Bay Rd', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -34.01, lng: 25.52 },
  { id: 'ec-15', name: 'Lochners Moffett On Main', location: 'Walmer', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 25.59 },
  { id: 'ec-16', name: 'Mustard Deli', location: 'Baakens Valley', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 25.61 },
  { id: 'ec-17', name: 'Our Spar', location: 'Walmer', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.98, lng: 25.58 },
  { id: 'ec-18', name: 'Settlers Butchery', location: 'Walmer', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 25.59 },
  { id: 'ec-19', name: 'Stadium Butchery', location: 'Humewood', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 25.64 },
  { id: 'ec-20', name: 'The Water Collective', location: 'Walmer', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 25.59 },
  { id: 'ec-21', name: 'Yumm PE', location: 'Walmer', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 25.59 },
  { id: 'ec-22', name: 'Somersetler Karoo Trading Co.', location: 'Charles St', city: 'Somerset East', province: 'Eastern Cape', type: 'Retailer', lat: -32.72, lng: 25.58 },
  { id: 'ec-23', name: 'The Bakery – St Francis Bay', location: 'Village Centre', city: 'St Francis Bay', province: 'Eastern Cape', type: 'Retailer', lat: -34.16, lng: 24.83 },
  { id: 'ec-24', name: 'Pacific Prawns', location: 'Santareme', city: 'St Francis Bay', province: 'Eastern Cape', type: 'Retailer', lat: -34.17, lng: 24.84 },
  { id: 'ec-25', name: 'Toni’s Deli – The Quays', location: 'Port St Francis', city: 'St Francis Bay', province: 'Eastern Cape', type: 'Retailer', lat: -34.19, lng: 24.86 },
  { id: 'ec-26', name: 'Tsitsikamma Village Inn', location: 'Driehoek St', city: 'Storms River', province: 'Eastern Cape', type: 'Retailer', lat: -33.97, lng: 23.88 },
  { id: 'ec-27', name: 'Nanaga Farm Stall', location: 'N2 Highway', city: 'Sundays River Valley', province: 'Eastern Cape', type: 'Retailer', lat: -33.72, lng: 25.89 },
  { id: 'ec-28', name: 'Moores Wholesale Meats', location: 'Magennis St', city: 'Uitenhage', province: 'Eastern Cape', type: 'Retailer', lat: -33.77, lng: 25.39 },

  // Western Cape
  { id: 'wc-1', name: 'The Shed Farmstall and Lucern Lodge', location: 'N1 Highway', city: 'Beaufort West', province: 'Western Cape', type: 'Retailer', lat: -32.35, lng: 22.58 },
  { id: 'wc-2', name: 'The Deli', location: 'Betty’s Bay', city: 'Betty’s Bay', province: 'Western Cape', type: 'Retailer', lat: -34.35, lng: 18.89 },
  { id: 'wc-3', name: 'Frankie Fenner Meat Merchants – Claremont', location: 'Claremont', city: 'Cape Town', province: 'Western Cape', type: 'Retailer', lat: -33.97, lng: 18.46 },
  { id: 'wc-4', name: 'Frankie Fenner Meat Merchants – Gardens', location: 'Gardens', city: 'Cape Town', province: 'Western Cape', type: 'Retailer', lat: -33.93, lng: 18.41 },
  { id: 'wc-5', name: 'Frankie Fenner Meat Merchants – Woodstock', location: 'Woodstock', city: 'Cape Town', province: 'Western Cape', type: 'Retailer', lat: -33.92, lng: 18.44 },
  { id: 'wc-6', name: 'The Foodbarn Café & Tapas', location: 'Noordhoek', city: 'Cape Town', province: 'Western Cape', type: 'Retailer', lat: -34.10, lng: 18.36 },
  { id: 'wc-7', name: 'Velskoendraai Farm Stall and Restaurant', location: 'Clanwilliam', city: 'Clanwilliam', province: 'Western Cape', type: 'Retailer', lat: -32.17, lng: 18.89 },
  { id: 'wc-8', name: 'Spiro’s Mega Mica', location: 'Durbanville', city: 'Durbanville', province: 'Western Cape', type: 'Retailer', lat: -33.83, lng: 18.64 },
  { id: 'wc-9', name: 'Deli on Main (Coming Soon)', location: 'Dwarskersbos', city: 'Dwarskersbos', province: 'Western Cape', type: 'Retailer', lat: -32.69, lng: 18.23 },
  { id: 'wc-10', name: 'La Paris Deli', location: 'Franschhoek', city: 'Franschhoek', province: 'Western Cape', type: 'Retailer', lat: -33.86, lng: 18.96 },
  { id: 'wc-11', name: 'Foodbarn George', location: 'George', city: 'George', province: 'Western Cape', type: 'Retailer', lat: -33.96, lng: 22.45 },
  { id: 'wc-12', name: 'Redberry Farm', location: 'George', city: 'George', province: 'Western Cape', type: 'Retailer', lat: -33.96, lng: 22.38 },
  { id: 'wc-13', name: 'Supa Value Foods George', location: 'George', city: 'George', province: 'Western Cape', type: 'Retailer', lat: -33.96, lng: 22.45 },
  { id: 'wc-14', name: 'Veld en Vleis Deli (Coming Soon)', location: 'Hartenbos', city: 'Hartenbos', province: 'Western Cape', type: 'Retailer', lat: -34.12, lng: 22.10 },
  { id: 'wc-15', name: 'Piccalilli', location: 'Hermanus', city: 'Hermanus', province: 'Western Cape', type: 'Retailer', lat: -34.41, lng: 19.24 },
  { id: 'wc-16', name: 'Carry Me Home Restaurant & Deli', location: 'Kleinmond', city: 'Kleinmond', province: 'Western Cape', type: 'Retailer', lat: -34.34, lng: 19.01 },
  { id: 'wc-17', name: 'Metelerkamps', location: 'Knysna', city: 'Knysna', province: 'Western Cape', type: 'Retailer', lat: -34.03, lng: 23.05 },
  { id: 'wc-18', name: 'Charlesford Farm Meat Co. & Deli', location: 'Knysna', city: 'Knysna', province: 'Western Cape', type: 'Retailer', lat: -34.02, lng: 23.06 },
  { id: 'wc-19', name: 'Gypsys Gin Bar', location: 'Ladismith', city: 'Ladismith', province: 'Western Cape', type: 'Retailer', lat: -33.49, lng: 21.26 },
  { id: 'wc-20', name: 'Wes-Handelshuis at Camp Roadhouse', location: 'Oudtshoorn', city: 'Oudtshoorn', province: 'Western Cape', type: 'Retailer', lat: -33.59, lng: 22.20 },
  { id: 'wc-21', name: 'Elephant Walk Farm Stall', location: 'Plettenberg Bay', city: 'Plettenberg Bay', province: 'Western Cape', type: 'Retailer', lat: -34.03, lng: 23.36 },
  { id: 'wc-22', name: 'Ilovani', location: 'Plettenberg Bay', city: 'Plettenberg Bay', province: 'Western Cape', type: 'Retailer', lat: -34.03, lng: 23.34 },
  { id: 'wc-23', name: 'KARoo2Plett', location: 'Plettenberg Bay', city: 'Plettenberg Bay', province: 'Western Cape', type: 'Retailer', lat: -34.05, lng: 23.37 },
  { id: 'wc-24', name: 'Nature’s Way Farm Stall', location: 'Plettenberg Bay', city: 'Plettenberg Bay', province: 'Western Cape', type: 'Retailer', lat: -33.96, lng: 23.51 },
  { id: 'wc-25', name: 'The Deli Factory', location: 'Plettenberg Bay', city: 'Plettenberg Bay', province: 'Western Cape', type: 'Retailer', lat: -34.05, lng: 23.35 },
  { id: 'wc-26', name: 'Lemon+Lime Deli', location: 'Pringle Bay', city: 'Pringle Bay', province: 'Western Cape', type: 'Retailer', lat: -34.35, lng: 18.82 },
  { id: 'wc-27', name: 'Poetsies Deli (Coming Soon)', location: 'Saint Helena Bay', city: 'Saint Helena Bay', province: 'Western Cape', type: 'Retailer', lat: -32.73, lng: 18.02 },
  { id: 'wc-28', name: 'Tredici', location: 'Swellendam', city: 'Swellendam', province: 'Western Cape', type: 'Retailer', lat: -34.02, lng: 20.44 },
  { id: 'wc-29', name: 'AP Foods', location: 'Vredendal', city: 'Vredendal', province: 'Western Cape', type: 'Retailer', lat: -31.66, lng: 18.50 },
  { id: 'wc-30', name: 'Four&twenty Cafe & Pantry', location: 'Wynberg', city: 'Wynberg', province: 'Western Cape', type: 'Retailer', lat: -34.00, lng: 18.46 },

  // Gauteng
  { id: 'gt-1', name: 'Jackson’s Real Food Market and Eatery', location: 'Bryanston', city: 'Bryanston', province: 'Gauteng', type: 'Retailer', lat: -26.046, lng: 28.026 },
  { id: 'gt-2', name: 'Sloane’s Butchery & Deli', location: 'Bryanston', city: 'Bryanston', province: 'Gauteng', type: 'Retailer', lat: -26.047, lng: 28.024 },
  { id: 'gt-3', name: 'Weleda Health & Pharmacy', location: 'Bryanston', city: 'Bryanston', province: 'Gauteng', type: 'Retailer', lat: -26.042, lng: 28.021 },
  { id: 'gt-4', name: 'Midstream Superspar', location: 'Clayville', city: 'Clayville', province: 'Gauteng', type: 'Retailer', lat: -25.922, lng: 28.192 },
  { id: 'gt-5', name: 'Jacksons Real Food Market & Eatery Kyalami Corner', location: 'Midrand', city: 'Midrand', province: 'Gauteng', type: 'Retailer', lat: -25.998, lng: 28.077 },
  { id: 'gt-6', name: 'Maggies Farm- Home of the Chicken Pie', location: 'Mogale City', city: 'Mogale City', province: 'Gauteng', type: 'Retailer', lat: -26.012, lng: 27.755 },

  // Free State
  { id: 'fs-1', name: 'Kraal Family Butchery & Deli', location: 'Bloemfontein', city: 'Bloemfontein', province: 'Free State', type: 'Retailer', lat: -29.11, lng: 26.22 },

  // KwaZulu-Natal
  { id: 'kzn-1', name: 'The Fat Whale', location: 'Durban', city: 'Durban', province: 'KwaZulu-Natal', type: 'Retailer', lat: -29.85, lng: 31.02 },
  { id: 'kzn-2', name: 'The Pantry on 103', location: 'Howick', city: 'Howick', province: 'KwaZulu-Natal', type: 'Retailer', lat: -29.47, lng: 30.22 },
  { id: 'kzn-3', name: 'Heritage Butchery', location: 'Ladysmith', city: 'Ladysmith', province: 'KwaZulu-Natal', type: 'Retailer', lat: -28.55, lng: 29.77 },
  { id: 'kzn-4', name: 'Sweet Gang & Friends', location: 'Margate', city: 'Margate', province: 'KwaZulu-Natal', type: 'Retailer', lat: -30.85, lng: 30.37 },
  { id: 'kzn-5', name: 'Little Pig Delicatessen', location: 'Pennington', city: 'Pennington', province: 'KwaZulu-Natal', type: 'Retailer', lat: -30.38, lng: 30.69 },
  { id: 'kzn-6', name: 'Ons Eie Winkel', location: 'Pongola', city: 'Pongola', province: 'KwaZulu-Natal', type: 'Retailer', lat: -27.38, lng: 31.62 },
  { id: 'kzn-7', name: 'Ants and Mustard', location: 'Saint Lucia Estuary', city: 'Saint Lucia Estuary', province: 'KwaZulu-Natal', type: 'Retailer', lat: -28.37, lng: 32.41 },
  { id: 'kzn-8', name: 'Deli..sh', location: 'Southbroom', city: 'Southbroom', province: 'KwaZulu-Natal', type: 'Retailer', lat: -30.91, lng: 30.31 },

  // Limpopo
  { id: 'lp-1', name: 'Willemien Cake Studio', location: 'Groblersdal', city: 'Groblersdal', province: 'Limpopo', type: 'Retailer', lat: -25.16, lng: 29.39 },
  { id: 'lp-2', name: 'Stella’s Farm Deli', location: 'Haenertsburg', city: 'Haenertsburg', province: 'Limpopo', type: 'Retailer', lat: -23.94, lng: 29.93 },
  { id: 'lp-3', name: 'Safari Supply Co and Deli (Coming Soon)', location: 'Hoedspruit', city: 'Hoedspruit', province: 'Limpopo', type: 'Retailer', lat: -24.35, lng: 30.95 },
  { id: 'lp-4', name: 'Hiesterhof', location: 'Polokwane', city: 'Polokwane', province: 'Limpopo', type: 'Retailer', lat: -23.89, lng: 29.44 },

  // Mpumalanga
  { id: 'mp-1', name: 'Bergen Cheese', location: 'Dullstroom', city: 'Dullstroom', province: 'Mpumalanga', type: 'Retailer', lat: -25.41, lng: 30.10 },

  // North West
  { id: 'nw-1', name: 'Halfpad Handelshuis', location: 'Delareyville', city: 'Delareyville', province: 'North West', type: 'Retailer', lat: -27.14, lng: 25.46 },
  { id: 'nw-2', name: 'Die Blikspens Biltong Deli & Bottelstoor', location: 'Koster', city: 'Koster', province: 'North West', type: 'Retailer', lat: -25.86, lng: 26.89 },
  { id: 'nw-3', name: 'Aqua Miracle', location: 'Ventersdorp', city: 'Ventersdorp', province: 'North West', type: 'Retailer', lat: -26.31, lng: 26.82 },

  // Online
  { id: 'on-1', name: 'LuLuLocal', location: 'Parktown North, Johannesburg', city: 'Johannesburg', province: 'Gauteng', type: 'Retailer', lat: -26.13, lng: 28.03, website: 'https://lululocal.co.za/' },
  { id: 'on-2', name: 'Organic Footprints', location: 'Port Elizabeth', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'Retailer', lat: -33.94, lng: 25.53, website: 'https://organicfootprints.co.za/' },

  // Grass Roots / Markets
  { id: 'gr-1', name: 'House of Froggit', location: 'Cape Town', city: 'Cape Town', province: 'Western Cape', type: 'Market', lat: -33.92, lng: 18.42 },
  { id: 'gr-2', name: 'Love Organics', location: 'Greyton', city: 'Greyton', province: 'Western Cape', type: 'Market', lat: -34.05, lng: 19.61 },
  { id: 'gr-3', name: 'Twee Jongens', location: 'Cape Town', city: 'Cape Town', province: 'Western Cape', type: 'Market', lat: -33.92, lng: 18.42 },
  { id: 'gr-4', name: 'White Butterfly', location: 'Johannesburg', city: 'Johannesburg', province: 'Gauteng', type: 'Market', lat: -26.20, lng: 28.04 },
];

export const EVENTS: Event[] = [
  { id: 'e1', title: 'Crossways Village Market', date: '1st & Last Sunday Monthly', location: 'Thornhill, Gqeberha', lat: -33.90, lng: 25.07 },
  { id: 'e2', title: 'Selected Public Holidays', date: 'Check Website for Dates', location: 'Crossways Farm Village', lat: -33.90, lng: 25.07 },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Smoked Apricot Braaibroodjie Mustard',
    description: 'A beautifully mild, sweet and smoky delight, perfect for the ultimate South African braaibroodjie pairing.',
    category: 'Mustard',
    price: 'R85',
    image: 'https://images.unsplash.com/photo-1589113103503-49052d9a9cb1?auto=format&fit=crop&q=80&w=400',
    stock: 12,
    nutrition: { calories: '25kcal', fat: '1.0g', sugar: '4.5g', protein: '1.0g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Sugar', 'Dried Apricots', 'Smoked Salt', 'Spices'],
    productRecipes: [
      { title: 'The Ultimate Braaibroodjie', excerpt: 'Slather generously on sourdough with aged cheddar, tomato, and onion before grilling.' },
      { title: 'Apricot Glazed Halloumi', excerpt: 'Warm 2 tbsp of mustard and brush over halloumi skewers in the final minutes of grilling.' },
      { title: 'Smoked Chicken Marinade', excerpt: 'Whisk with olive oil, lemon, and crushed garlic for a signature poultry brine.' }
    ],
    attributes: ['Mild Flavor', 'New Arrival', 'Preservative-Free', 'Vegan Friendly'],
    pairings: ['Classic Braaibroodjie', 'Grilled Halloumi', 'Smoked Gammon', 'Grilled Cheese', 'Sourdough'],
    awards: [
      { title: 'Food & Beverage Awards Gold', year: '2025' },
      { title: 'Aurora International Taste Challenge Gold', year: '2025' }
    ],
    rating: 4.9,
    reviewsCount: 124,
    isBestseller: true,
    relatedProducts: ['2', '13']
  },
  {
    id: '2',
    name: 'Green Fig and Balsamic Mustard',
    description: 'A mild, elegant pairing of preserved green ripe figs and aged gourmet balsamic vinegar with no heat.',
    category: 'Mustard',
    price: 'R95',
    image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcd3327?auto=format&fit=crop&q=80&w=400',
    stock: 3,
    nutrition: { calories: '30kcal', fat: '0.8g', sugar: '6.0g', protein: '0.6g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Balsamic Vinegar', 'Sugar', 'Preserved Green Figs', 'Salt'],
    productRecipes: [
      { title: 'Brie & Fig Crostini', excerpt: 'Top toasted baguette with brie, a dollop of this mustard, and a slice of fresh fig.' },
      { title: 'Fig & Gorgonzola Tartlets', excerpt: 'Spread a thin layer on puff pastry before topping with gorgonzola and walnuts.' }
    ],
    attributes: ['Mild Flavor', 'Best Seller', 'Handcrafted', 'Vegan Friendly'],
    pairings: ['Cured Meats', 'Roasted Pork', 'Brie Cheese', 'Boerenkaas', 'Walnuts'],
    rating: 4.8,
    reviewsCount: 89,
    isBestseller: true,
    relatedProducts: ['3', '13']
  },
  {
    id: '3',
    name: 'Honey and Whisky Mustard',
    description: 'Smooth honey and premium whisky blended into a completely mild, aromatic mustard seed canvas.',
    category: 'Mustard',
    price: 'R95',
    image: 'https://images.unsplash.com/photo-1541336318485-a74e5033878b?auto=format&fit=crop&q=80&w=400',
    stock: 8,
    nutrition: { calories: '35kcal', fat: '1.0g', sugar: '7.5g', protein: '0.8g' },
    isVegan: false,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Raw Honey', 'Whisky', 'Sugar', 'Salt'],
    productRecipes: [
      { title: 'Whisky Mustard Glazed Salmon', excerpt: 'Mix with a little olive oil and coat fresh salmon fillets before pan-searing.' },
      { title: 'Honey-Whisky Pork Belly', excerpt: 'Use as a rub for slow-roasted pork belly to create a sticky, boozy crackling.' }
    ],
    attributes: ['Mild Flavor', 'Award Winning'],
    pairings: ['Rare Roast Beef', 'Mature Cheddar', 'Smoked Salmon', 'Pork Belly'],
    rating: 5.0,
    reviewsCount: 56,
  },
  {
    id: '4',
    name: 'Sugar-Free Artisan Mustard',
    description: 'All of our signature mild mustard flavor with absolutely none of the sugar. Perfect for diabetics.',
    category: 'Sugar-Free',
    price: 'R80',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=400',
    stock: 2,
    nutrition: { calories: '8kcal', fat: '0.6g', sugar: '0.1g', protein: '0.6g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Stevia', 'Tumeric', 'Salt'],
    productRecipes: [
      { title: 'Sugar-Free Deli Coleslaw', excerpt: 'Use this mustard as the base for a creamy, low-carb coleslaw dressing.' },
      { title: 'Zesty Sugar-Free Vinaigrette', excerpt: 'Emulsify with apple cider vinegar and flaxseed oil for a keto-friendly salad topping.' }
    ],
    attributes: ['Mild Flavor', 'Preservative-Free', 'Non-GMO', 'Vegan Friendly'],
    pairings: ['Grilled Asparagus', 'Steamed Fish', 'Chicken Salad', 'Avocado'],
    rating: 4.7,
    reviewsCount: 42,
  },
  {
    id: '5',
    name: 'Craft Beer Artisan Mustard',
    description: 'A robust, mild mustard profile infused with local South African craft ale for a deep, complex malty finish.',
    category: 'Mustard',
    price: 'R85',
    image: 'https://images.unsplash.com/photo-1590541705626-66504a5d9181?auto=format&fit=crop&q=80&w=400',
    stock: 15,
    nutrition: { calories: '15kcal', fat: '0.8g', sugar: '0.5g', protein: '1.0g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Craft Beer (Contains Gluten)', 'Salt', 'Spices'],
    productRecipes: [
      { title: 'Craft Beer Mustard Sausage Roll', excerpt: 'Mix into high-quality pork sausage meat for a rich, malty appetizer.' },
      { title: 'Beer Mustard Cheese Dip', excerpt: 'Blend with warm beer, cheddar, and cream cheese for the ultimate pretzel dip.' }
    ],
    attributes: ['Mild Flavor', 'Handcrafted', 'Non-GMO', 'Vegan Friendly'],
    pairings: ['Soft Pretzels', 'Beer-Battered Fish', 'Beef Sliders', 'Knockwurst'],
    rating: 4.9,
    reviewsCount: 67,
  },
  {
    id: '6',
    name: 'Fiery Reaper Mustard',
    description: 'Features a pleasant burn for people who like that sort of thing. But what separates it from hot sauces is the fact that it retains incredible flavor as well—it is not so hot you cannot really taste anything once consumed.',
    category: 'Chilli',
    price: 'R110',
    image: 'https://images.unsplash.com/photo-1549474843-ed830045ce82?auto=format&fit=crop&q=80&w=400',
    stock: 5,
    nutrition: { calories: '12kcal', fat: '0.8g', sugar: '1.5g', protein: '0.6g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Sugar', 'Carolina Reaper Chillies', 'Salt', 'Spices'],
    productRecipes: [
      { title: 'Wings with Pleasant Burn', excerpt: 'Toss hot wings in a mixture of melted butter and Fiery Reaper Mustard for heat that leaves perfect flavor behind.' },
      { title: 'Spicy Reaper Aioli', excerpt: 'Fold a teaspoon into garlic mayonnaise for a burger sauce that bites back beautifully without destroying flavor.' }
    ],
    attributes: ['Pleasant Burn', 'Retains Flavor', 'Vegan Friendly'],
    pairings: ['Fried Chicken', 'Tacos', 'Hot Dogs', 'Burgers', 'Braai'],
    rating: 4.9,
    reviewsCount: 156,
    isMemberOnly: false,
  },
  {
    id: '14',
    name: 'Spicy Jalapeno Mustard',
    description: 'A superb mild-to-medium heat mustard with a little bite, highlighting fresh jalapeno fruitiness alongside our clean, gourmet mustard seeds.',
    category: 'Chilli',
    price: 'R85',
    image: 'https://images.unsplash.com/photo-1590541705626-66504a5d9181?auto=format&fit=crop&q=80&w=400',
    stock: 14,
    nutrition: { calories: '15kcal', fat: '0.9g', sugar: '2.0g', protein: '0.8g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Sugar', 'Spicy Jalapeno Peppers', 'Salt', 'Spices'],
    productRecipes: [
      { title: 'Jalapeno Popper Dip', excerpt: 'Whisk a generous tablespoon with cream cheese, cheddar, and minced jalapenos for a warm oven baked dip.' }
    ],
    attributes: ['A Little Bite', 'Fresh Jalapeno', 'Vegan Friendly'],
    pairings: ['Ham Sandwiches', 'Gourmet Dogs', 'Pretzels', 'Burgers'],
    rating: 4.9,
    reviewsCount: 22,
  },
  {
    id: '15',
    name: 'Sugar free Spicy Jalapeno Mustard',
    description: 'A sugar-free mustard with a little bite. Enjoy the fresh, vibrant jalapeno fruitiness with no added sugars or artificial sweeteners.',
    category: 'Sugar-Free',
    price: 'R85',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=400',
    stock: 8,
    nutrition: { calories: '8kcal', fat: '0.9g', sugar: '0.1g', protein: '0.8g' },
    isVegan: true,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Stevia', 'Spicy Jalapeno Peppers', 'Salt', 'Spices'],
    productRecipes: [
      { title: 'Low-Carb Jalapeno Vinaigrette', excerpt: 'Vigorously shake with extra virgin olive oil and apple cider vinegar for a spicy keto-friendly salad dressing.' }
    ],
    attributes: ['No Added Sugar', 'A Little Bite', 'Keto & Diabetic Friendly'],
    pairings: ['Avocado Toast', 'Grilled Chicken Salad', 'Hard Boiled Eggs'],
    rating: 4.8,
    reviewsCount: 15,
  },
  {
    id: '7',
    name: 'Deli Selection Gherkins',
    description: 'Traditional spiced gherkins, preserved in our signature vinegar blend.',
    category: 'Deli',
    price: 'R75',
    image: 'https://images.unsplash.com/photo-1581448670421-fd50442b3fbd?auto=format&fit=crop&q=80&w=400',
    stock: 20,
    nutrition: { calories: '12kcal', fat: '0.1g', sugar: '2.5g', protein: '0.3g' },
    isVegan: true,
    ingredients: ['Cucumbers', 'Water', 'Spirit Vinegar', 'Sugar', 'Mustard Seeds', 'Salt', 'Spices'],
    attributes: ['Non-GMO', 'Preservative-Free', 'Vegan Friendly'],
    pairings: ['Reuben Sandwich', 'Charcuterie Board', 'Potato Salad'],
    rating: 4.8,
    reviewsCount: 34,
  },
  {
    id: '9',
    name: 'Garlic & Herb Deli Pickles',
    description: 'Crisp deli slices infused with roasted garlic and wild harvested herbs.',
    category: 'Deli',
    price: 'R75',
    image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400',
    stock: 22,
    nutrition: { calories: '12kcal', fat: '0.1g', sugar: '2.5g', protein: '0.3g' },
    isVegan: true,
    ingredients: ['Cucumbers', 'Water', 'Spirit Vinegar', 'Sugar', 'Garlic', 'Dill', 'Mustard Seeds', 'Salt', 'Spices'],
    attributes: ['Non-GMO', 'Artisan', 'Vegan Friendly'],
    pairings: ['Burgers', 'Deli Sandwiches', 'Salads'],
    rating: 0,
    reviewsCount: 0,
  },
  {
    id: '10',
    name: 'Classic Dijon Mustard',
    description: 'A traditional French-style Dijon, offering a smooth texture and balanced heat.',
    category: 'Mustard',
    price: 'R85',
    image: 'https://images.unsplash.com/photo-1549474843-ed830045ce82?auto=format&fit=crop&q=80&w=400',
    stock: 10,
    nutrition: { calories: '15kcal', fat: '1.2g', sugar: '0.2g', protein: '1.2g' },
    isVegan: false,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Robertson Wine (Casein Processed)', 'Salt'],
    attributes: ['Traditional', 'Artisan'],
    pairings: ['Steak', 'Salad Dressing', 'Vinaigrette'],
    rating: 4.7,
    reviewsCount: 28,
  },
  {
    id: '11',
    name: 'Champagne Mustard',
    description: 'A luxury mustard infused with premium champagne for a sophisticated, bubbly zing.',
    category: 'Mustard',
    price: 'R120',
    image: 'https://images.unsplash.com/photo-1589113103503-49052d9a9cb1?auto=format&fit=crop&q=80&w=400',
    stock: 5,
    nutrition: { calories: '18kcal', fat: '1.0g', sugar: '2.0g', protein: '1.0g' },
    isVegan: false,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Robertson Champagne (Casein Processed)', 'Sugar', 'Salt'],
    attributes: ['Limited Edition', 'Luxury'],
    pairings: ['Oysters', 'Grilled Chicken', 'Asparagus'],
    rating: 4.9,
    reviewsCount: 15,
  },
  {
    id: '12',
    name: 'Honey Mustard',
    description: 'A delicate balance of sweetness and tang, made with raw mountain honey.',
    category: 'Mustard',
    price: 'R85',
    image: 'https://images.unsplash.com/photo-1589113103503-49052d9a9cb1?auto=format&fit=crop&q=80&w=400',
    stock: 15,
    nutrition: { calories: '35kcal', fat: '1.0g', sugar: '7.5g', protein: '1.0g' },
    isVegan: false,
    ingredients: ['Mustard Seeds', 'Water', 'Spirit Vinegar', 'Raw Honey', 'Sugar', 'Salt', 'Spices'],
    attributes: ['Classic', 'All Natural'],
    pairings: ['Chicken Strips', 'Ham Sandwiches', 'Salad Dressing'],
    rating: 4.8,
    reviewsCount: 45,
  },
  {
    id: '13',
    name: '2 Product Cardboard Gift Box',
    description: 'A premium, sustainable cardboard gift box designed to fit two of our artisanal jars perfectly. Includes tissue paper and natural string wrapping.',
    category: 'Deli',
    price: 'R15',
    image: 'https://images.unsplash.com/photo-1549462980-478ac921f471?auto=format&fit=crop&q=80&w=400',
    stock: 100,
    nutrition: { calories: '0', fat: '0', sugar: '0', protein: '0' },
    attributes: ['Sustainable', 'Gift Ready'],
    rating: 5.0,
    reviewsCount: 12,
  },
];

export const RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Craft Beer Mustard Sausage & Bean One-Pot',
    description: 'A hearty meal featuring our signature Craft Beer Mustard and smoky beans.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600',
    mustardUsed: 'Craft Beer Mustard',
  },
  {
    id: 'r2',
    title: 'Mustard Pasta Bake with Spinach & Feta',
    description: 'A creamy, comforting pasta bake elevated with the sharp, complex notes of our Green Fig Mustard.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=600',
    mustardUsed: 'Green Fig Mustard',
  },
  {
    id: 'r3',
    title: 'Braai Chicken Thighs with Mustard Marinade',
    description: 'Succulent chicken marinated in Smoked Apricot Mustard, grilled to perfection.',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=600',
    mustardUsed: 'Smoked Apricot Mustard',
  },
  {
    id: 'r4',
    title: 'Reaper Mustard Beef Burger',
    description: 'A perfect gourmet burger topped with our Fiery Reaper Mustard, offering a pleasant burn while fully retaining deep, rich meat and spice flavors.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    mustardUsed: 'Fiery Reaper Mustard',
    isMemberOnly: true,
  },
];
