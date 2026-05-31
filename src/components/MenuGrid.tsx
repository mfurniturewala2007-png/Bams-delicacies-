import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '../utils/supabase';
import ProductCard from './ProductCard';

// Gourmet Fallback Products for offline/initial empty database states
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-1',
    name: "Mughlai Mutton Dum Biryani",
    description: "Mom's signature long-grain basmati rice layered with tender marinated mutton and secret spices, dum-cooked to perfection. Serves 1-2.",
    price: 480,
    image_url: null,
    category: 'mains',
    in_stock: true,
  },
  {
    id: 'mock-2',
    name: "Mom's Special Butter Chicken",
    description: "Succulent tandoori grilled chicken chunks simmered in a rich, creamy, buttery tomato gravy. Mildly spiced and packed with rich flavors.",
    price: 390,
    image_url: null,
    category: 'mains',
    in_stock: true,
  },
  {
    id: 'mock-3',
    name: "Tandoori Paneer Tikka Masala",
    description: "Spiced paneer cottage cheese cubes charcoal grilled in tandoor then simmered in a thick, semi-dry aromatic onion tomato masala gravy.",
    price: 320,
    image_url: null,
    category: 'mains',
    in_stock: true,
  },
  {
    id: 'mock-4',
    name: "Crispy Punjabi Samosas (4pcs)",
    description: "Golden flaky deep-fried pastry shells stuffed with spiced mashed green peas and potatoes. Served with tangy sweet tamarind chutney.",
    price: 120,
    image_url: null,
    category: 'snacks',
    in_stock: true,
  },
  {
    id: 'mock-5',
    name: "Rich Badami Gajar Halwa",
    description: "Slow-cooked grated red winter carrots simmered in thickened milk, sugar, ghee, and generously garnished with roasted slivered almonds.",
    price: 150,
    image_url: null,
    category: 'desserts',
    in_stock: true,
  },
  {
    id: 'mock-6',
    name: "Fresh Garlic Butter Naan (2pcs)",
    description: "Fluffy leavened flatbreads loaded with crushed fresh garlic and chopped coriander leaves, baked inside tandoor and brushed with butter.",
    price: 90,
    image_url: null,
    category: 'breads',
    in_stock: true,
  },
];

const SkeletonCard: React.FC = () => (
  <div className="bg-surface border border-border rounded-2xl p-6 h-[450px] flex flex-col justify-between animate-pulse">
    <div>
      <div className="w-full aspect-square bg-surface-2 rounded-xl mb-4" />
      <div className="h-6 bg-surface-2 rounded w-2/3 mb-3" />
      <div className="h-4 bg-surface-2 rounded w-full mb-2" />
      <div className="h-4 bg-surface-2 rounded w-4/5" />
    </div>
    <div>
      <div className="h-6 bg-surface-2 rounded w-1/3 mb-4" />
      <div className="h-12 bg-surface-2 rounded-full w-full" />
    </div>
  </div>
);

const MenuGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Query products that are active and in stock
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // If query succeeds but tables are empty, load gourmet fallback mock products
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        console.warn('Supabase products fetch skipped or failed. Using offline gourmet menu list.');
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by category tab
  const categories = ['all', 'mains', 'snacks', 'breads', 'desserts'];
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <section id="menu" className="py-24 px-6 md:px-12 bg-surface border-t border-border/40 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="font-serif font-black text-4xl md:text-6xl text-white tracking-tight">
            This Week's Menu
          </h2>
          <div className="w-24 h-1 bg-yellow mx-auto mt-4 rounded-full shadow-yellow" />
          <p className="text-muted text-sm md:text-base mt-4 max-w-md mx-auto leading-relaxed">
            Freshly prepared, small-batch homemade courses. Choose your favorites below!
          </p>
        </div>

        {/* Dynamic Category Filtering Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-sans text-xs md:text-sm font-semibold tracking-wider uppercase transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-yellow border-yellow text-bg shadow-yellow'
                  : 'bg-surface-2 border-border text-white/80 hover:text-yellow hover:border-yellow'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid display logic */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-bg/50">
            <span className="text-4xl">🥘</span>
            <h3 className="font-serif font-bold text-xl text-yellow mt-4">No Items Available</h3>
            <p className="text-muted text-sm mt-2">Check back shortly as we prepare fresh recipes.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuGrid;
