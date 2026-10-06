export interface GlobalProduct {
  id: string;
  name: string;
  price: number;
  sellingPrice?: number;
  offerPrice?: number;
  originalPrice?: number;
  images: string[];
  description: string;
  features: string[];
  ingredients: string;
  categoryId: string;
  category: string;
  isFeatured: boolean;
  stock: number;
  rating: number;
  reviewsCount: number;
}

export const mockProducts: GlobalProduct[] = [
  {
    id: "1",
    name: "Premium Raw Honey (500g)",
    price: 850,
    originalPrice: 1050,
    images: ["", "", "", ""],
    description: "Sourced directly from the wild forests, our Premium Raw Honey is unfiltered and unpasteurized to retain all natural enzymes, antioxidants, and nutrients. Its rich, floral flavor makes it a perfect natural sweetener for your daily diet.",
    features: [
      "100% Pure and Unfiltered",
      "Rich in Antioxidants and Natural Enzymes",
      "No Added Sugar or Preservatives",
      "Sustainably Sourced from Wild Forests"
    ],
    ingredients: "100% Pure Raw Honey",
    categoryId: "honey",
    category: "Natural Honey",
    isFeatured: true,
    stock: 50,
    rating: 5.0,
    reviewsCount: 124,
  },
  {
    id: "2",
    name: "Cold Pressed Mustard Oil",
    price: 320,
    originalPrice: 380,
    images: ["", "", "", ""],
    description: "Extracted using traditional wooden churns (Kachi Ghani), this cold-pressed mustard oil retains its natural pungency and health benefits. Ideal for traditional cooking and pickles.",
    features: [
      "Extracted via Traditional Kachi Ghani",
      "High in Monounsaturated Fatty Acids",
      "Strong Natural Pungency and Aroma",
      "No Chemicals or Solvents Used"
    ],
    ingredients: "100% Mustard Seeds",
    categoryId: "oils",
    category: "Organic Oils",
    isFeatured: true,
    stock: 25,
    rating: 4.8,
    reviewsCount: 89,
  },
  {
    id: "3",
    name: "Organic Cow Ghee (1L)",
    price: 1450,
    originalPrice: 1600,
    images: ["", "", "", ""],
    description: "Made from the A2 milk of grass-fed cows using the traditional Bilona method. Our ghee is aromatic, granular, and packed with fat-soluble vitamins.",
    features: [
      "Made via Traditional Bilona Method",
      "Rich in A2 Proteins",
      "Granular Texture and Nutty Aroma",
      "Boosts Digestion and Immunity"
    ],
    ingredients: "Pure Cow Milk Fat",
    categoryId: "ghee",
    category: "Premium Ghee",
    isFeatured: true,
    stock: 15,
    rating: 4.9,
    reviewsCount: 210,
  },
  {
    id: "4",
    name: "Himalayan Pink Salt",
    price: 180,
    originalPrice: 220,
    images: ["", "", "", ""],
    description: "Mined from ancient sea salt deposits in the Himalayas, this natural pink salt is rich in 84 essential minerals and trace elements.",
    features: [
      "100% Natural and Unrefined",
      "Contains 84 Trace Minerals",
      "Lower Sodium Content than Regular Salt",
      "Perfect for Cooking and Seasoning"
    ],
    ingredients: "Himalayan Rock Salt",
    categoryId: "spices",
    category: "Spices & Salts",
    isFeatured: true,
    stock: 30,
    rating: 4.7,
    reviewsCount: 56,
  },
  {
    id: "5",
    name: "Black Seed Oil (100ml)",
    price: 450,
    originalPrice: 500,
    images: ["", "", "", ""],
    description: "100% pure cold-pressed Nigella Sativa oil. Known for its powerful antioxidant and anti-inflammatory properties.",
    features: [
      "Cold-Pressed for Maximum Potency",
      "Rich in Thymoquinone",
      "Promotes Hair and Skin Health",
      "Dietary Supplement Quality"
    ],
    ingredients: "100% Cold-Pressed Black Seed Oil",
    categoryId: "oils",
    category: "Organic Oils",
    isFeatured: true,
    stock: 10,
    rating: 4.9,
    reviewsCount: 42,
  },
  {
    id: "6",
    name: "Wildflower Honey (250g)",
    price: 450,
    originalPrice: 500,
    images: ["", "", "", ""],
    description: "A beautiful blend of nectar collected from various wildflowers. Light, sweet, and versatile.",
    features: [
      "Multi-floral Nectar Blend",
      "Light and Sweet Flavor Profile",
      "Great for Teas and Baking"
    ],
    ingredients: "100% Pure Wildflower Honey",
    categoryId: "honey",
    category: "Natural Honey",
    isFeatured: false,
    stock: 45,
    rating: 4.6,
    reviewsCount: 34,
  }
];

export function getProductById(id: string): GlobalProduct | undefined {
  return mockProducts.find(p => p.id === id);
}

export function getRelatedProducts(categoryId: string, currentProductId: string, limit: number = 4): GlobalProduct[] {
  return mockProducts
    .filter(p => p.categoryId === categoryId && p.id !== currentProductId)
    .slice(0, limit);
}

