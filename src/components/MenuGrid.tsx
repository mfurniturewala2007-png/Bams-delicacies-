import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '../utils/supabase';
import ProductCard from './ProductCard';

// Gourmet Fallback Products for offline/initial empty database states
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-1',
    name: "Chicken Keema Samosa",
    description: "Crispy samosas stuffed with spiced chicken keema. 12 pcs per order.",
    price: 360,
    image_url: null,
    category: 'Non-Veg Samosa',
    unit_label: '12 pcs',
    in_stock: true,
  },
  {
    id: 'mock-2',
    name: "Smoked Dal Samosa",
    description: "Crispy samosas with a smoky spiced dal filling. 12 pcs per order.",
    price: 300,
    image_url: null,
    category: 'Veg Samosa',
    unit_label: '12 pcs',
    in_stock: true,
  },
  {
    id: 'mock-3',
    name: "Chicken Cream Tikka",
    description: "Tender chicken marinated in a creamy spiced blend, char-grilled to perfection. 12 pcs per order.",
    price: 420,
    image_url: null,
    category: 'Chicken Starter',
    unit_label: '12 pcs',
    in_stock: true,
  },
  {
    id: 'mock-4',
    name: "Mutton Keema Pattice",
    description: "Hearty pattice with a richly spiced mutton keema filling. 12 pcs per order.",
    price: 480,
    image_url: null,
    category: 'Mutton Starter',
    unit_label: '12 pcs',
    in_stock: true,
  }
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
  const categories = ['all', 'Non-Veg Samosa', 'Veg Samosa', 'Chicken Starter', 'Mutton Starter'];
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <section id="menu" className="py-24 px-6 md:px-12 bg-surface border-t border-border/40 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="font-serif font-black text-4xl md:text-6xl text-heading tracking-tight">
            This Week's Menu
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full shadow-primary" />
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
                  ? 'bg-primary border-primary text-white shadow-primary'
                  : 'bg-surface-2 border-border text-text/80 hover:text-primary hover:border-primary'
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
            <h3 className="font-serif font-bold text-xl text-heading mt-4">No Items Available</h3>
            <p className="text-muted text-sm mt-2">Check back shortly as we prepare fresh recipes.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuGrid;
