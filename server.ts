import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit, 
  Timestamp, 
  serverTimestamp 
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// Initialize Firebase Admin (for Messaging etc)
let firebaseAdminApp: admin.app.App | null = null;
let firebaseConfig: any = null;
let firebaseClientApp: any = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  const projId = firebaseConfig?.projectId;
  
  if (projId) {
    process.env.GCLOUD_PROJECT = projId;
    process.env.GOOGLE_CLOUD_PROJECT = projId;
  }

  // Admin SDK
  if (admin.apps.length === 0) {
    firebaseAdminApp = admin.initializeApp({ projectId: projId });
  } else {
    firebaseAdminApp = admin.app();
  }

  // Client SDK (more reliable in this sandbox for Firestore)
  if (firebaseConfig) {
    firebaseClientApp = initializeClientApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
  }
} catch (error: any) {
  console.error("Firebase initialization error:", error.message);
}

const getDb = () => {
  if (!firebaseClientApp) throw new Error("Firebase Client App not initialized");
  return getClientFirestore(firebaseClientApp, firebaseConfig?.firestoreDatabaseId);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Simple Request Logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // connectivity test
  const testConnection = async () => {
    try {
      const db = getDb();
      console.log("Attempting Firestore connectivity test...");
      const q = query(collection(db, 'notifications'), limit(1));
      const testSnap = await getDocs(q);
      console.log("Firestore connectivity test successful. Docs found:", testSnap.size);
    } catch (err: any) {
      console.error("CRITICAL: Firestore connectivity test FAILED!");
      console.error("Error Code:", err.code);
      console.error("Error Message:", err.message);
      if (err.details) console.error("Error Details:", err.details);
    }
  };
  testConnection();

  // Pre-warm caches
  console.log("Pre-warming caches...");
  setTimeout(() => {
    revalidateProducts().catch(e => console.warn("Initial product warm-up failed:", e.message));
    revalidateReviews().catch(e => console.warn("Initial reviews warm-up failed:", e.message));
  }, 1000);

  // Initialize WooCommerce Client Lazily
  const getWooCommerce = () => {
    const url = process.env.VITE_STORE_URL?.trim();
    const consumerKey = process.env.WOOCOMMERCE_KEY?.trim();
    const consumerSecret = process.env.WOOCOMMERCE_SECRET?.trim();

    if (!url || !consumerKey || !consumerSecret || consumerKey.includes("_your_") || consumerSecret.includes("_your_")) {
      const missing = [];
      if (!url) missing.push("VITE_STORE_URL");
      if (!consumerKey || consumerKey.includes("_your_")) missing.push("WOOCOMMERCE_KEY");
      if (!consumerSecret || consumerSecret.includes("_your_")) missing.push("WOOCOMMERCE_SECRET");
      
      if (missing.length > 0) {
        console.warn(`WooCommerce configuration incomplete or using placeholders. Missing/Invalid: ${missing.join(", ")}. Please configure real keys in the Settings menu.`);
      }
      return null;
    }

    // @ts-ignore - Handle CJS default export in ESM
    let API: any;
    try {
      API = (WooCommerceRestApi as any).default || WooCommerceRestApi;
      if (typeof API !== 'function' && (API as any).WooCommerceRestApi) {
        API = (API as any).WooCommerceRestApi;
      }
    } catch (e) {
      console.error("Failed to load WooCommerceRestApi package:", e);
      return null;
    }

    try {
      const client = new API({
        url: url.replace(/\/$/, ""),
        consumerKey,
        consumerSecret,
        version: "wc/v3",
        queryStringAuth: true,
        wpAPI: true,
        axiosConfig: {
          timeout: 45000, 
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MustardDeli-App/1.1.0 (CloudRun)'
          }
        }
      });

      // Singleton-like pattern inside this execution context
      const originalGet = client.get.bind(client);
      client.get = async (endpoint: string, params?: any) => {
        let lastError;
        for (let i = 0; i < 3; i++) {
          try {
            console.log(`[WooCommerce] Requesting: ${endpoint} (Attempt ${i + 1})`, params ? JSON.stringify(params) : '');
            return await originalGet(endpoint, params);
          } catch (err: any) {
            lastError = err;
            const status = err.response?.status;
            
            // Log warning but be concise
            if (i === 2 || !err.message.includes('timeout')) {
               console.warn(`[WooCommerce] ${endpoint} failed: ${err.message} [Status: ${status || 'N/A'}]`);
            }
            
            // Don't retry client errors except timeouts and rate limits
            if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) break; 
            
            if (i < 2) {
              const delay = 500 * (i + 1); // Shorter initial delay
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        throw lastError;
      };

      return client;
    } catch (e) {
      console.error("Failed to initialize WooCommerce API client:", e);
      return null;
    }
  };

  // Reusable Woo client
  let _wooClient: any = null;
  const getWoo = () => {
    if (!_wooClient) _wooClient = getWooCommerce();
    return _wooClient;
  };

  // API Routes
  // Simple in-memory cache
  const productsCache = {
    data: null as any[] | null,
    timestamp: 0,
    TTL: 1000 * 60 * 30, // 30 minutes TTL
    revalidating: false
  };

  const roleCache: Record<string, { role: string; wcRole?: string; timestamp: number }> = {};
  const ROLE_TTL = 1000 * 60 * 60; // 1 hour for roles

  const profileCache: Record<string, { data: any; timestamp: number }> = {};
  const PROFILE_TTL = 1000 * 60 * 60;

  const ordersCache: Record<string, { data: any[]; timestamp: number }> = {};
  const ORDERS_TTL = 1000 * 60 * 5; // 5 minutes cache for orders

  const reviewsCache = {
    data: null as any[] | null,
    timestamp: 0,
    TTL: 1000 * 60 * 60, // 1 hour for reviews
    revalidating: false
  };

  // Reviews Store (In-memory - still used for product-specific reviews temporarily, but we'll focus on testimonials)
  const reviewsData: Record<string, any[]> = {};

  const STATIC_TESTIMONIALS = [
    { id: 'static-1', text: "Truly authentic and great taste! The Smoked Apricot 'Braaibroodjie' Mustard is a revelation. It has completely transformed our weekend roasts. A true South African gem.", author: "Liza S.", location: "Trustpilot", rating: 5 },
    { id: 'static-2', text: "Incredible variety of mustards. The craftsmanship is evident in every jar. The heat is perfectly balanced with the complexity of the artisanal ingredients. Best mustard we've ever had!", author: "Marco B.", location: "Google Reviews", rating: 5 },
    { id: 'static-3', text: "Absolutely love the brand and following the journey on FB. The Green Fig and Balsamic is my all-time favorite. There is a depth of flavor here that you simply don't find elsewhere.", author: "Cindy V.", location: "Facebook", rating: 5 },
    { id: 'static-4', text: "The Carolina Reaper mustard is not for the faint-hearted! Absolutely incredible kick but with so much flavor. A must-have for any serious braai master.", author: "Gavin P.", location: "Google Reviews", rating: 5 },
    { id: 'static-5', text: "Discovered these at the Crossways Village Market. The Mustard Deli team is so passionate. The Green Fig is a game changer for our family cheese boards.", author: "Sarah D.", location: "Local Market Review", rating: 5 },
    { id: 'static-6', text: "Finally, a mustard that lives up to the 'artisan' label. The Smoked Apricot glaze on a gammon is just perfection. Shipping to Joburg was fast and well-packaged.", author: "Johan K.", location: "Direct Order Review", rating: 5 }
  ];

  app.get("/api/reviews", async (req, res) => {
    const now = Date.now();
    const isStale = now - reviewsCache.timestamp > reviewsCache.TTL;

    // 1. Fetch Firestore reviews (always fresh/fast)
    let firestoreReviews: any[] = [];
    try {
      const db = getDb();
      const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      firestoreReviews = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          author: data.author,
          text: data.text,
          rating: data.rating,
          location: data.location || "Web App",
          date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
    } catch (err) {
      console.error("Firestore reviews fetch failed:", err);
    }

    // 2. Handle WooCommerce Reviews from Cache
    if (reviewsCache.data && !isStale) {
      return res.json([...reviewsCache.data, ...firestoreReviews]);
    }

    // Serve stale + background revalidate
    if (reviewsCache.data && isStale && !reviewsCache.revalidating) {
      console.log("[Cache] Serving stale reviews, revalidating in background...");
      res.json([...reviewsCache.data, ...firestoreReviews]);
      revalidateReviews().catch(() => {});
      return;
    }

    // No cache, must wait or serve static
    if (!reviewsCache.data) {
      try {
        const wooReviews = await revalidateReviews();
        return res.json([...wooReviews, ...firestoreReviews]);
      } catch (err) {
        return res.json([...STATIC_TESTIMONIALS, ...firestoreReviews]);
      }
    } else {
      return res.json([...reviewsCache.data, ...firestoreReviews]);
    }
  });

  async function revalidateReviews() {
    if (reviewsCache.revalidating) return reviewsCache.data || STATIC_TESTIMONIALS;
    reviewsCache.revalidating = true;

    try {
      const woo = getWoo();
      if (!woo) throw new Error("Woo unavailable");

      const response = await woo.get("products/reviews", {
        per_page: 20,
        status: 'approved'
      });

      const wooReviews = response.data.map((r: any) => ({
        id: `woo-${r.id}`,
        text: r.review.replace(/<[^>]*>?/gm, ''),
        author: r.reviewer,
        location: "Verified Buyer",
        rating: r.rating,
        date: r.date_created
      }));

      const allBaseReviews = [...STATIC_TESTIMONIALS, ...wooReviews];
      reviewsCache.data = allBaseReviews;
      reviewsCache.timestamp = Date.now();
      console.log("[Cache] Reviews revalidated successfully");
      return allBaseReviews;
    } catch (err: any) {
      console.error("[Cache] Review revalidation failed:", err.message);
      return reviewsCache.data || STATIC_TESTIMONIALS;
    } finally {
      reviewsCache.revalidating = false;
    }
  }

  app.post("/api/reviews", express.json(), async (req, res) => {
    const { author, text, rating, location = "Web App", userId = "" } = req.body;
    
    if (!author || !text || !rating) {
      return res.status(400).json({ error: "Missing review data" });
    }

    try {
      const db = getDb();
      const newReview = {
        author,
        text,
        rating: Number(rating),
        location,
        userId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'testimonials'), newReview);
      
      // Create activity record
      await addDoc(collection(db, 'activity'), {
        type: 'suggestion_created', // We can use this or add 'testimonial_shared'
        userName: author,
        message: `shared a new brand testimonial: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
        createdAt: serverTimestamp()
      });

      res.status(201).json({ id: docRef.id, ...newReview, date: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error saving testimonial to Firestore:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    const { id } = req.params;
    const localReviews = reviewsData[id] || [];

    const woo = getWooCommerce();
    if (!woo) {
      return res.json(localReviews);
    }

    try {
      const response = await woo.get("products/reviews", {
        product: [id],
        status: 'approved'
      });

      const wooReviews = response.data.map((r: any) => ({
        id: r.id.toString(),
        userName: r.reviewer,
        rating: r.rating,
        comment: r.review.replace(/<[^>]*>?/gm, ''),
        date: new Date(r.date_created).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
      }));

      // Combine local (newly submitted) with WooCommerce reviews
      res.json([...localReviews, ...wooReviews]);
    } catch (error: any) {
      const status = error.response?.status;
      console.error(`WooCommerce Product Reviews API Error [${status || 'No Status'}]: ${error.message}`);
      res.json(localReviews);
    }
  });

  app.post("/api/products/:id/reviews", express.json(), (req, res) => {
    const { id } = req.params;
    const { userName, rating, comment } = req.body;
    
    if (!userName || !rating || !comment) {
      return res.status(400).json({ error: "Missing review data" });
    }

    const newReview = {
      id: Math.random().toString(36).substring(7),
      userName,
      rating: Number(rating),
      comment,
      date: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    if (!reviewsData[id]) reviewsData[id] = [];
    reviewsData[id].unshift(newReview);

    res.status(201).json(newReview);
  });

  app.get("/api/products", async (req, res) => {
    // Check cache first
    const now = Date.now();
    const isStale = now - productsCache.timestamp > productsCache.TTL;

    if (productsCache.data && !isStale) {
      return res.json(productsCache.data);
    }

    // Serve stale but revalidate in background if not already revalidating
    if (productsCache.data && isStale && !productsCache.revalidating) {
      console.log("[Cache] Serving stale products, revalidating in background...");
      res.json(productsCache.data);
      revalidateProducts().catch(() => {});
      return;
    }

    // No cache or stale AND revalidating, must wait or serve fallback
    if (!productsCache.data) {
      try {
        const data = await revalidateProducts();
        return res.json(data);
      } catch (err) {
        return res.json(getFallbackProducts());
      }
    } else {
      // Revalidating already, serve what we have
      return res.json(productsCache.data);
    }
  });

  async function revalidateProducts() {
    if (productsCache.revalidating) return productsCache.data;
    productsCache.revalidating = true;
    
    try {
      const woo = getWoo();
      if (!woo) throw new Error("Woo unavailable");

      const response = await woo.get("products", { 
        per_page: 20,
        status: 'publish'
      });
      
      const products = response.data.map((p: any) => {
        const meta = p.meta_data || [];
        const wholesaleMeta = meta.find((m: any) => 
          m.key === '_wholesale_price' || m.key === '_wholesale_customer_wholesale_price'
        );
        return {
          id: p.id.toString(),
          name: p.name,
          price: `R${p.price}`,
          wholesalePrice: wholesaleMeta?.value ? `R${wholesaleMeta.value}` : undefined,
          description: p.short_description?.replace(/<[^>]*>?/gm, '') || p.description?.replace(/<[^>]*>?/gm, '').substring(0, 100),
          category: p.categories[0]?.name || 'Mustard',
          image: p.images[0]?.src || 'https://images.unsplash.com/photo-1544476072-be664b382103?auto=format&fit=crop&q=80',
          permalink: p.permalink,
          rating: parseFloat(p.average_rating) || 0,
          reviewsCount: p.rating_count || 0,
          stock: p.stock_quantity || 10
        };
      });

      productsCache.data = products;
      productsCache.timestamp = Date.now();
      console.log("[Cache] Products revalidated successfully");
      return products;
    } catch (err: any) {
      console.error("[Cache] Product revalidation failed:", err.message);
      if (!productsCache.data) throw err;
      return productsCache.data;
    } finally {
      productsCache.revalidating = false;
    }
  }

  function getFallbackProducts() {
    return [
      {
        id: '1',
        name: 'Smoked Apricot Braaibroodjie Mustard',
        description: 'A sweet and smoky delight, perfect for the ultimate South African braaibroodjie.',
        category: 'Mustard',
        price: 'R85',
        image: 'https://images.unsplash.com/photo-1589113103503-49052d9a9cb1?auto=format&fit=crop&q=80&w=400',
        stock: 12,
        rating: 4.9,
        reviewsCount: 124,
      },
      {
        id: '2',
        name: 'Green Fig and Balsamic Mustard',
        description: 'An elegant pairing of preserved green figs and aged balsamic vinegar.',
        category: 'Mustard',
        price: 'R95',
        image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcd3327?auto=format&fit=crop&q=80&w=400',
        stock: 3,
        rating: 4.8,
        reviewsCount: 89,
      }
    ];
  }

  app.get("/api/orders", async (req, res) => {
    console.log(`GET /api/orders - Request received for: ${req.query.email}`);
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailKey = email.toString().toLowerCase();

    // Check cache
    const cached = ordersCache[emailKey];
    if (cached && (Date.now() - cached.timestamp < ORDERS_TTL)) {
      return res.json(cached.data);
    }

    const woo = getWooCommerce();
    if (!woo) {
      console.warn("WooCommerce keys not configured. Returning empty order list.");
      return res.json([]);
    }

    try {
      const response = await woo.get("orders", { 
        search: emailKey, // Use search for email matching
        per_page: 50
      });
      
      if (!Array.isArray(response.data)) {
        console.error("WooCommerce Orders API returned non-array data:", response.data);
        return res.json([]);
      }

      // Filter strictly by email to ensure accuracy
      const orders = response.data
        .filter((o: any) => o.billing?.email?.toLowerCase() === emailKey)
        .map((o: any) => ({
        id: o.id,
        number: o.number,
        date: o.date_created,
        status: o.status,
        total: o.total,
        currency: o.currency,
        items: o.line_items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity
        }))
      }));

      // Update cache
      ordersCache[emailKey] = {
        data: orders,
        timestamp: Date.now()
      };

      res.json(orders);
    } catch (error: any) {
      console.error("WooCommerce Orders API Error. Returning empty order list.", {
        message: error.message,
        response: error.response?.data
      });

      // If we have stale cache, return it on error
      if (cached) {
        console.warn("Serving stale orders from cache due to API error.");
        return res.json(cached.data);
      }

      res.json([]);
    }
  });

  app.get("/api/user/role", async (req, res) => {
    console.log(`GET /api/user/role - Request received for: ${req.query.email}`);
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailKey = email.toString().toLowerCase();
    
    // Check cache
    const cached = roleCache[emailKey];
    if (cached && (Date.now() - cached.timestamp < ROLE_TTL)) {
      return res.json({ role: cached.role, wcRole: cached.wcRole });
    }

    const woo = getWooCommerce();
    if (!woo) {
      return res.json({ role: 'customer' });
    }

    try {
      const response = await woo.get("customers", { 
        email: emailKey
      });
      
      if (!Array.isArray(response.data)) {
        console.error("WooCommerce Customers API returned non-array data:", response.data);
        return res.json({ role: 'customer' });
      }

      const customer = response.data.find((c: any) => c.email.toLowerCase() === emailKey);
      
      if (!customer) {
        return res.json({ role: 'customer' });
      }

      // WooCommerce roles can be custom. We map them to our internal roles.
      const wcRole = customer.role || 'customer';
      let mappedRole = 'customer';
      
      if (wcRole.includes('wholesale') || wcRole.includes('stockist')) {
        mappedRole = 'stockist';
      }

      // Update cache
      roleCache[emailKey] = {
        role: mappedRole,
        wcRole,
        timestamp: Date.now()
      };

      res.json({ role: mappedRole, wcRole });
    } catch (error: any) {
      console.error("WooCommerce Customers API Error.", error.message);
      
      // If we have stale cache, use it on error
      if (cached) {
        return res.json({ role: cached.role, wcRole: cached.wcRole });
      }
      
      res.json({ role: 'customer' });
    }
  });

  app.get("/api/user/profile", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    const emailKey = email.toString().toLowerCase();

    // Check cache
    const cached = profileCache[emailKey];
    if (cached && (Date.now() - cached.timestamp < PROFILE_TTL)) {
      return res.json(cached.data);
    }
    
    const woo = getWoo();
    if (!woo) return res.status(503).json({ error: "WooCommerce not configured" });

    try {
      const response = await woo.get("customers", { email: emailKey });
      const customer = response.data.find((c: any) => c.email.toLowerCase() === emailKey);
      
      if (!customer) return res.status(404).json({ error: "User not found" });

      const profile = {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        username: customer.username,
        email: customer.email,
        avatar: customer.avatar_url || "",
        coverImage: customer.meta_data?.find((m: any) => m.key === 'cover_image' || m.key === '_user_cover_image')?.value || "https://images.unsplash.com/photo-1495107333219-6118c392bb81?auto=format&fit=crop&q=80&w=1200",
        role: customer.role,
        billing: customer.billing,
        shipping: customer.shipping
      };

      profileCache[emailKey] = { data: profile, timestamp: Date.now() };
      res.json(profile);
    } catch (err: any) {
      if (cached) return res.json(cached.data);
      res.status(500).json({ error: err.message });
    }
  });

  // Push Notifications API
  app.post("/api/admin/broadcast", async (req, res) => {
    const { title, body, type, link } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: "Title and Body are required" });
    }

    try {
      const db = getDb();
      
      // 1. Save to global notifications collection (for in-app feed)
      const notification = {
        title,
        message: body,
        type: type || 'post',
        link: link || '',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'notifications'), notification);
      
      // 2. Fetch all users who want notifications and have an fcmToken
      const q = query(
        collection(db, 'users'),
        where('wantsNotifications', '==', true),
        where('fcmToken', '!=', '')
      );
      const usersSnap = await getDocs(q);
        
      const tokens = usersSnap.docs.map(doc => doc.data().fcmToken).filter(Boolean);
      
      if (tokens.length > 0) {
        const message = {
          notification: {
            title,
            body
          },
          data: {
            type: type || 'post',
            link: link || ''
          },
          tokens: tokens
        };
        
        if (!firebaseAdminApp) throw new Error("Firebase Admin App not initialized");
        const response = await firebaseAdminApp.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} push notifications.`);
        res.json({ 
          success: true, 
          inApp: true, 
          push: {
            sent: tokens.length,
            success: response.successCount,
            failure: response.failureCount
          }
        });
      } else {
        res.json({ success: true, inApp: true, push: { sent: 0, message: "No registered tokens found" } });
      }
    } catch (error: any) {
      console.error("Broadcast Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    const { model = "gemini-3-flash-preview", contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not set" });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      res.json({
        text: response.text,
        functionCalls: response.functionCalls,
        candidates: response.candidates // Include candidates for grounding/metadata if needed
      });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.status(error.status || 500).json({ 
        error: error.message || "An error occurred during Gemini processing",
        details: error.details
      });
    }
  });

  // Serve static files or Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
