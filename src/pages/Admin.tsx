import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Product, Order } from '../types';
import { supabase } from '../utils/supabase';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';
import { BAMS_MENU } from '../utils/seedMenu';

// Default mock menu list as fallback if Supabase returns empty
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: "Chicken Keema Samosa",
    description: "Crispy samosas stuffed with spiced chicken keema. 12 pcs per order.",
    price: 360,
    image_url: null,
    category: 'Non-Veg',
    unit_label: '12 pcs',
    in_stock: true,
  },
  {
    id: 'prod-2',
    name: "Smoked Dal Samosa",
    description: "Crispy samosas with a smoky spiced dal filling. 12 pcs per order.",
    price: 300,
    image_url: null,
    category: 'Veg',
    unit_label: '12 pcs',
    in_stock: true,
  },
];

const Admin: React.FC = () => {
  // Gating State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [authError, setAuthError] = useState('');

  // Tab State: 0 = Products, 1 = Orders
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  // Products Tab States
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Product Form States
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCat, setNewProdCat] = useState('Non-Veg');
  const [newProdUnit, setNewProdUnit] = useState('12 pcs');
  const [newProdStock, setNewProdStock] = useState(true);
  
  // Edit Product Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCat, setEditProdCat] = useState('Non-Veg');
  const [editProdUnit, setEditProdUnit] = useState('12 pcs');
  const [editProdStock, setEditProdStock] = useState(true);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editUploadedImageUrl, setEditUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  // Max orders settings states
  const [maxOrdersSatInput, setMaxOrdersSatInput] = useState('15');
  const [maxOrdersSunInput, setMaxOrdersSunInput] = useState('15');
  const [isSavingMaxOrders, setIsSavingMaxOrders] = useState(false);

  // Image Upload States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Seeding states
  const [isSeeded, setIsSeeded] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Orders Tab States
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Notify All Customers State
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  // Date Filters
  const { saturday: thisSat, sunday: thisSun } = getAvailableDeliveryDates();
  const nextSat = addDays(thisSat, 7);
  const nextSun = addDays(thisSun, 7);

  const filterOptions = [
    { date: thisSat, label: 'This Saturday', dbStr: format(thisSat, 'yyyy-MM-dd') },
    { date: thisSun, label: 'This Sunday', dbStr: format(thisSun, 'yyyy-MM-dd') },
    { date: nextSat, label: 'Next Saturday', dbStr: format(nextSat, 'yyyy-MM-dd') },
    { date: nextSun, label: 'Next Sunday', dbStr: format(nextSun, 'yyyy-MM-dd') },
  ];

  const [activeFilterDateStr, setActiveFilterDateStr] = useState<string>(
    format(thisSat, 'yyyy-MM-dd')
  );

  // Load Products & Orders
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch (err) {
      console.warn('Failed to load products list from database. Falling back to default records.');
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // cast JSON items to CartItem[]
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.warn('Failed to load orders list from database.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadMaxOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['max_orders_per_day', 'max_orders_saturday', 'max_orders_sunday']);

      if (error) throw error;
      if (data) {
        const general = data.find(r => r.key === 'max_orders_per_day')?.value || '15';
        const sat = data.find(r => r.key === 'max_orders_saturday')?.value || general;
        const sun = data.find(r => r.key === 'max_orders_sunday')?.value || general;
        
        setMaxOrdersSatInput(sat);
        setMaxOrdersSunInput(sun);
      }
    } catch (e) {
      console.warn('Failed to load settings.');
    }
  };

  // Logging for mounting confirmation
  useEffect(() => {
    console.log("Admin component mounted at:", window.location.href);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadOrders();
      loadMaxOrders();
    }
  }, [isAuthenticated]);

  // Auth Submit Action
  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'bamsadmin';

    if (passwordInput === adminPassword) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setIsShaking(true);
      setAuthError('Incorrect password');
      setPasswordInput('');
      setTimeout(() => {
        setIsShaking(false);
      }, 300);
    }
  };

  // Products CRUD: Toggle Stock
  const handleToggleStock = async (id: string, currentStock: boolean) => {
    try {
      // Update local state first for instant responsive feel
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, in_stock: !currentStock } : p))
      );

      const { error } = await supabase
        .from('products')
        .update({ in_stock: !currentStock })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update stock state in Supabase:', err);
      // Revert if error
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, in_stock: currentStock } : p))
      );
    }
  };

  // Products CRUD: Delete Item
  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error('Failed to delete item from database:', err);
        alert('Could not delete product. Database error occurred.');
      }
    }
  };

  // Upload Product Image to Bucket
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Setup local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      // ACTION NEEDED: create bucket "product-images" in Supabase dashboard and set to PUBLIC
      // Upload to bucket
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      // Fetch public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setUploadedImageUrl(urlData.publicUrl);
    } catch (err) {
      // ACTION NEEDED: create bucket "product-images" in Supabase dashboard if upload fails
      console.warn('Storage uploads offline. Visual previews generated locally.', err);
      // Generate standard plate fallback url for demo
      setUploadedImageUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Products CRUD: Save Form Item
  const handleSaveProduct = async () => {
    const errors: { [key: string]: string } = {};
    if (!newProdName.trim()) errors.name = 'Product name is required';
    if (!newProdPrice.trim() || isNaN(Number(newProdPrice))) {
      errors.price = 'Enter a valid numeric price';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      // Use uploaded image URL, preview, or default placeholder if empty
      const finalImgUrl = uploadedImageUrl || imagePreview || null;

      const newProduct = {
        name: newProdName.trim(),
        description: newProdDesc.trim() || null,
        price: Number(newProdPrice),
        category: newProdCat,
        in_stock: newProdStock,
        unit_label: newProdUnit.trim() || '12 pcs',
        image_url: finalImgUrl,
      };

      // ACTION NEEDED: add INSERT policy for products table to allow public / anon inserts if not using Supabase auth
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setProducts((prev) => [data[0], ...prev]);
      } else {
        // Fallback mockup local insertion
        const mockItem: Product = {
          id: `local-${Date.now()}`,
          ...newProduct,
        };
        setProducts((prev) => [mockItem, ...prev]);
      }

      // Close modal & reset fields
      setIsAddModalOpen(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setNewProdCat('Non-Veg');
      setNewProdUnit('12 pcs');
      setNewProdStock(true);
      setImagePreview(null);
      setUploadedImageUrl(null);

    } catch (err: any) {
      console.error('Failed to create new product in Supabase. Full error object:', err);
      alert(`Error: ${err?.message || 'Please try again.'}`);
    }
  };

  // Products CRUD: Seed default gourmet BAMS menu
  const handleSeedMenu = async () => {
    const confirmSeed = window.confirm("This will DELETE all existing products and load Bam's real menu. Continue?");
    if (!confirmSeed) return;

    try {
      setIsSeeding(true);

      // 1. Delete all existing products in Supabase
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .not('id', 'is', null);

      if (deleteError) throw deleteError;

      // 2. Batch insert the BAMS_MENU seed array
      const { error: insertError } = await supabase
        .from('products')
        .insert(BAMS_MENU);

      if (insertError) throw insertError;

      // 3. Mark seeded and reload products to show real new menu
      setIsSeeded(true);
      showToast("Menu seeded! 17 products loaded. ✓", "success");
      await loadProducts();

    } catch (err: any) {
      console.error('Seed Menu failed. Full error object:', err);
      const errMsg = err?.message || 'Please try again.';
      const errDetails = err?.details ? `\nDetails: ${err.details}` : '';
      const errHint = err?.hint ? `\nHint: ${err.hint}` : '';
      const errCode = err?.code ? `\nCode: ${err.code}` : '';
      showToast(`Error seeding menu: ${errMsg}`, 'error');
      alert(`Seed Menu failed.\n\nError: ${errMsg}${errDetails}${errHint}${errCode}\n\nFull Object: ${JSON.stringify(err, null, 2)}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Products CRUD: Open Edit Modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdDesc(prod.description || '');
    setEditProdPrice(String(prod.price));
    setEditProdCat(prod.category || 'Non-Veg');
    setEditProdUnit(prod.unit_label || '12 pcs');
    setEditProdStock(prod.in_stock);
    setEditImagePreview(prod.image_url);
    setEditUploadedImageUrl(prod.image_url);
    setIsEditModalOpen(true);
  };

  // Products CRUD: Upload Image for Editing
  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingEditImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setEditUploadedImageUrl(urlData.publicUrl);
    } catch (err) {
      console.warn('Storage upload failed, using local preview.', err);
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  // Products CRUD: Save Edited Product
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    const errors: { [key: string]: string } = {};
    if (!editProdName.trim()) errors.name = 'Product name is required';
    if (!editProdPrice.trim() || isNaN(Number(editProdPrice))) {
      errors.price = 'Enter a valid numeric price';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const finalImgUrl = editUploadedImageUrl || editImagePreview || null;

      const updatedProduct = {
        name: editProdName.trim(),
        description: editProdDesc.trim() || null,
        price: Number(editProdPrice),
        category: editProdCat,
        in_stock: editProdStock,
        unit_label: editProdUnit.trim() || '12 pcs',
        image_url: finalImgUrl,
      };

      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', editingProduct.id);

      if (error) throw error;

      showToast("Product updated successfully! ✓", "success");
      await loadProducts();
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Failed to update product:', err);
      alert(`Error: ${err?.message || 'Please try again.'}`);
    }
  };

  // Settings: Save Max Orders per weekend day
  const handleSaveMaxOrders = async () => {
    try {
      setIsSavingMaxOrders(true);
      const satVal = Number(maxOrdersSatInput);
      const sunVal = Number(maxOrdersSunInput);
      if (isNaN(satVal) || satVal <= 0 || isNaN(sunVal) || sunVal <= 0) {
        alert('Please enter a valid positive capacity for both days.');
        return;
      }

      const { error: errorSat } = await supabase
        .from('settings')
        .upsert({ key: 'max_orders_saturday', value: String(satVal) });

      if (errorSat) throw errorSat;

      const { error: errorSun } = await supabase
        .from('settings')
        .upsert({ key: 'max_orders_sunday', value: String(sunVal) });

      if (errorSun) throw errorSun;

      // Backward compatibility backup
      await supabase
        .from('settings')
        .upsert({ key: 'max_orders_per_day', value: String(satVal) });

      showToast(`Order capacity updated: Saturday = ${satVal}, Sunday = ${sunVal}! ✓`, 'success');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save capacity settings. Error: ${err.message}`);
    } finally {
      setIsSavingMaxOrders(false);
    }
  };

  // Orders CRUD: Update Status dropdown
  const handleUpdateStatus = async (orderId: string, newStatus: 'payment_pending' | 'pending' | 'confirmed' | 'delivered' | 'cancelled') => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
      alert('Error updating order status in database.');
    }
  };

  // Send push notification to all subscribed customers
  const handleNotifyAll = async () => {
    if (!notifyMessage.trim()) return;
    try {
      setNotifyState('sending');

      // Fetch all push subscriptions from Supabase
      const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('subscription');

      if (error) throw error;
      if (!subs || subs.length === 0) {
        setNotifyState('error');
        setNotifyResult('No subscribers found. Ask customers to opt-in first.');
        return;
      }

      const subscriptions = subs.map((row) => row.subscription);

      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions, message: notifyMessage.trim() }),
      });

      if (!res.ok) throw new Error('API call failed');
      const result = await res.json();

      setNotifyState('sent');
      setNotifyResult(`Sent to ${result.sent} subscriber(s). Failed: ${result.failed}.`);
      setNotifyMessage('');
    } catch (err) {
      console.error('Failed to send push notification:', err);
      setNotifyState('error');
      setNotifyResult('Failed to send. Check VAPID keys and API configuration.');
    }
  };

  // Filter orders matching selected date — payment_pending shown first
  const filteredOrders = orders
    .filter((o) => o.delivery_date === activeFilterDateStr)
    .sort((a, b) => {
      if (a.status === 'payment_pending' && b.status !== 'payment_pending') return -1;
      if (b.status === 'payment_pending' && a.status !== 'payment_pending') return 1;
      return 0;
    });
  const slotsCount = filteredOrders.length;
  const getActiveLimit = () => {
    const activeOpt = filterOptions.find(o => o.dbStr === activeFilterDateStr);
    if (activeOpt) {
      const day = activeOpt.date.getDay(); // 6 = Sat, 0 = Sun
      if (day === 6) return maxOrdersSatInput;
      if (day === 0) return maxOrdersSunInput;
    }
    return maxOrdersSatInput;
  };

  // Gate view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4 select-text">
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(200,81,27,0.05) 0%, rgba(255,248,238,0) 70%)' }} />
        
        <div
          className={`w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-card text-center transition-all duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <img src="/logo.jpeg" alt="Bam's Delicacies Logo" className="w-20 h-20 rounded-full mx-auto mb-6 object-cover border border-border shadow-md" />
          <h1 className="font-serif font-black text-3xl text-heading mb-2">Admin Login</h1>
          <p className="font-sans text-muted text-xs mb-8">Manage products, orders, and slot availabilities.</p>

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-xs font-sans font-bold text-text/70 uppercase tracking-widest mb-2.5">
                Enter Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="••••••••"
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3.5 text-text font-mono placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  authError ? 'border-error' : 'border-border'
                }`}
                autoFocus
              />
              {authError && (
                <span className="text-error text-xs font-semibold mt-2 block font-sans">
                  ⚠️ {authError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white font-sans font-bold py-3.5 rounded-xl hover:bg-primary-hover hover:scale-[1.02] hover:shadow-primary shadow-md active:scale-98 transition-all duration-300"
            >
              Verify Credentials
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-bg text-text select-text">
      {/* 1. Sidebar Panel (Fixed left, 240px) */}
      <aside className="w-60 bg-surface border-r border-border h-screen sticky top-0 flex flex-col justify-between flex-shrink-0 z-30 select-none">
        <div>
          {/* Logo & Brand Header */}
          <div className="p-6 border-b border-border flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Bam's Delicacies"
              className="h-10 w-10 rounded-full object-cover border border-border"
            />
            <div className="flex flex-col text-left">
              <span className="font-serif font-black text-heading text-sm tracking-tight leading-none">
                Bam's
              </span>
              <span className="font-serif text-[11px] text-muted/70 tracking-wider font-bold mt-1 uppercase">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-2 mt-6">
            <button
              onClick={() => setActiveTab(0)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm tracking-wide transition-all duration-200 border-l-2 ${
                activeTab === 0
                  ? 'bg-surface-2 border-primary text-primary'
                  : 'border-transparent text-text/70 hover:text-text hover:bg-surface-2/40'
              }`}
            >
              <span>🍱</span>
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm tracking-wide transition-all duration-200 border-l-2 ${
                activeTab === 1
                  ? 'bg-surface-2 border-primary text-primary'
                  : 'border-transparent text-text/70 hover:text-text hover:bg-surface-2/40'
              }`}
            >
              <span>📋</span>
              <span>Orders</span>
            </button>
          </nav>
        </div>

        {/* Admin signout trigger */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              setIsAuthenticated(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl font-sans font-bold text-xs tracking-wider text-error hover:bg-error/10 border border-transparent hover:border-error/25 transition-all duration-200 uppercase"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main content area */}
      <main className="flex-grow p-8 overflow-y-auto h-screen bg-bg/95 relative z-10 flex flex-col">
        {/* Products tab screen */}
        {activeTab === 0 && (
          <div className="flex-grow flex flex-col">
            {/* Tab Header bar */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-border/40 select-none">
              <div className="text-left">
                <h2 className="font-serif font-black text-3xl text-heading">Menu Catalog</h2>
                <p className="text-muted text-xs font-sans mt-1">Add, update stock status, or remove delicacies.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-primary text-white font-sans font-bold text-sm px-5 py-3 rounded-xl shadow-primary hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  + Add Product
                </button>
                {!isSeeded && (
                  <button
                    onClick={handleSeedMenu}
                    disabled={isSeeding}
                    className="text-[11px] font-sans font-semibold text-muted hover:text-text bg-surface-2 hover:bg-border/30 px-3 py-1.5 rounded-lg border border-border/50 transition-all duration-200 select-none disabled:opacity-50"
                  >
                    {isSeeding ? 'Seeding...' : '🌱 Seed Bam\'s Menu'}
                  </button>
                )}
              </div>
            </div>

            {/* Catalog list grid view */}
            {productsLoading ? (
              <div className="flex-grow flex items-center justify-center py-20 select-none">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-transparent"></div>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-surface-2 text-muted font-sans text-xs font-bold uppercase tracking-wider select-none">
                        <th className="py-4 px-6">Product</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Price / Dozen</th>
                        <th className="py-4 px-6">Stock Status</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm font-sans">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-surface-2/30 transition-colors duration-150">
                          {/* Image & Title Details */}
                          <td className="py-4 px-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-bg border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt={prod.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLSpanElement;
                                    if (fallback) fallback.style.display = 'inline';
                                  }}
                                />
                              ) : null}
                              <span
                                className="text-xl"
                                style={{ display: prod.image_url ? 'none' : 'inline' }}
                              >
                                🍽️
                              </span>
                            </div>
                            <div className="text-left font-bold text-text">
                              {prod.name}
                              <span className="block text-xs font-normal text-muted truncate max-w-xs mt-1">
                                {prod.description || 'No description available'}
                              </span>
                            </div>
                          </td>

                          {/* Category Cell */}
                          <td className="py-4 px-6 capitalize text-text/80">
                            {prod.category}
                          </td>

                          {/* Price Cell */}
                          <td className="py-4 px-6 font-serif font-semibold text-yellow">
                            ₹{prod.price} <span className="text-xs font-sans text-muted">/ {prod.unit_label || '12 pcs'}</span>
                          </td>

                          {/* stock status switch toggle */}
                          <td className="py-4 px-6 select-none">
                            <button
                              onClick={() => handleToggleStock(prod.id, prod.in_stock)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                prod.in_stock ? 'bg-primary shadow-primary' : 'bg-surface-2 border border-border'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                                  prod.in_stock ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Actions buttons */}
                          <td className="py-4 px-6 text-center select-none">
                            <div className="flex items-center justify-center gap-1">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(prod)}
                                className="p-2 text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl transition-all duration-200"
                                title="Edit Item"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                  />
                                </svg>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-2 text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-all duration-200"
                                title="Delete Item"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-1.816A2.25 2.25 0 0122.167 2h-4.333a2.25 2.25 0 01-2.244 2.077v1.816m-7.5 0V4a2.25 2.25 0 012.244-2.243h4.333M19 19H5"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* "+ Add Product" Modal overlay popup */}
            {isAddModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 select-text">
                <div onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                
                <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-fade-slide-up flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h3 className="font-serif font-bold text-xl text-heading">Add New Delicacy</h3>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-1 rounded-lg bg-surface-2 border border-border text-text hover:text-primary transition-all duration-200"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Form scroll container */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-grow text-left">
                    {/* Name input */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Product Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={(e) => {
                          setNewProdName(e.target.value);
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        placeholder="e.g. Special Chicken Dum Biryani"
                        className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250 ${
                          formErrors.name ? 'border-error' : 'border-border'
                        }`}
                      />
                      {formErrors.name && (
                        <span className="text-error text-xs font-sans mt-1 block">{formErrors.name}</span>
                      )}
                    </div>

                    {/* Category & Price dual row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                          Category
                        </label>
                        <select
                          value={newProdCat}
                          onChange={(e) => setNewProdCat(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250"
                        >
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Veg">Veg</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                          Price (₹) <span className="text-primary">*</span>
                        </label>
                        <input
                          type="text"
                          value={newProdPrice}
                          onChange={(e) => {
                            setNewProdPrice(e.target.value);
                            if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }));
                          }}
                          placeholder="e.g. 360"
                          className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250 ${
                            formErrors.price ? 'border-error' : 'border-border'
                          }`}
                        />
                        {formErrors.price && (
                          <span className="text-error text-xs font-sans mt-1 block">{formErrors.price}</span>
                        )}
                      </div>
                    </div>

                    {/* Unit Label Field */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Unit Label (e.g. 12 pcs, 6 pcs)
                      </label>
                      <input
                        type="text"
                        value={newProdUnit}
                        onChange={(e) => setNewProdUnit(e.target.value)}
                        placeholder="e.g. 12 pcs"
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250"
                      />
                    </div>

                    {/* Description field */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <textarea
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Provide details about flavors, portions, preparation, or key ingredients..."
                        rows={3}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250 resize-none"
                      />
                    </div>

                    {/* Image Upload Input Area */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Product Image
                      </label>
                      <div className="flex gap-4 items-center">
                        <label className="bg-surface-2 border border-border border-dashed hover:border-primary rounded-xl px-4 py-3 cursor-pointer text-xs font-bold text-text hover:text-primary transition-all duration-200 flex-shrink-0 flex items-center gap-2 select-none">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                          <span>📂 Choose Image File</span>
                        </label>
                        
                        {/* Status indicator */}
                        {isUploadingImage && (
                          <span className="text-xs text-primary animate-pulse">Uploading file...</span>
                        )}
                        {uploadedImageUrl && (
                          <span className="text-xs text-success">✓ Upload success!</span>
                        )}
                      </div>

                      {/* Preview box */}
                      {imagePreview && (
                        <div className="mt-3 relative h-28 w-28 rounded-xl border border-border overflow-hidden bg-bg/50 flex items-center justify-center">
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            onClick={() => {
                              setImagePreview(null);
                              setUploadedImageUrl(null);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white text-[10px]"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stock switch toggle */}
                    <div className="flex items-center gap-4 bg-surface-2/30 border border-border/40 p-4 rounded-xl select-none">
                      <div className="text-left flex-grow">
                        <span className="block text-sm font-bold text-text">Initial Stock Status</span>
                        <span className="text-muted text-xs block mt-0.5">Toggle whether customers can order this instantly on load.</span>
                      </div>
                      <button
                        onClick={() => setNewProdStock(!newProdStock)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          newProdStock ? 'bg-primary shadow-primary' : 'bg-surface-2 border border-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                            newProdStock ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Modal Sticky Footer buttons */}
                  <div className="px-6 py-4 border-t border-border bg-surface-2/65 flex justify-end gap-3 flex-shrink-0 select-none">
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-2 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProduct}
                      disabled={isUploadingImage}
                      className="bg-primary text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-primary hover:bg-primary-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Product
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* "Edit Product" Modal overlay popup */}
            {isEditModalOpen && editingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 select-text">
                <div onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                
                <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-fade-slide-up flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h3 className="font-serif font-bold text-xl text-heading">Edit Delicacy</h3>
                    <button
                      onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                      className="p-1 rounded-lg bg-surface-2 border border-border text-text hover:text-primary transition-all duration-200"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Form scroll container */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-grow text-left">
                    {/* Name input */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Product Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={editProdName}
                        onChange={(e) => {
                          setEditProdName(e.target.value);
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        placeholder="e.g. Chicken Keema Samosa"
                        className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250 ${
                          formErrors.name ? 'border-error' : 'border-border'
                        }`}
                      />
                      {formErrors.name && (
                        <span className="text-error text-xs font-sans mt-1 block">{formErrors.name}</span>
                      )}
                    </div>

                    {/* Category & Price dual row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                          Category
                        </label>
                        <select
                          value={editProdCat}
                          onChange={(e) => setEditProdCat(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250"
                        >
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Veg">Veg</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                          Price (₹) <span className="text-primary">*</span>
                        </label>
                        <input
                          type="text"
                          value={editProdPrice}
                          onChange={(e) => {
                            setEditProdPrice(e.target.value);
                            if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }));
                          }}
                          placeholder="e.g. 360"
                          className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250 ${
                            formErrors.price ? 'border-error' : 'border-border'
                          }`}
                        />
                        {formErrors.price && (
                          <span className="text-error text-xs font-sans mt-1 block">{formErrors.price}</span>
                        )}
                      </div>
                    </div>

                    {/* Unit Label Field */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Unit Label (e.g. 12 pcs, 6 pcs)
                      </label>
                      <input
                        type="text"
                        value={editProdUnit}
                        onChange={(e) => setEditProdUnit(e.target.value)}
                        placeholder="e.g. 12 pcs"
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250"
                      />
                    </div>

                    {/* Description field */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <textarea
                        value={editProdDesc}
                        onChange={(e) => setEditProdDesc(e.target.value)}
                        placeholder="Provide details about flavors, portion, ingredients..."
                        rows={3}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250 resize-none"
                      />
                    </div>

                    {/* Image Upload Input Area */}
                    <div>
                      <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                        Product Image
                      </label>
                      <div className="flex gap-4 items-center">
                        <label className="bg-surface-2 border border-border border-dashed hover:border-primary rounded-xl px-4 py-3 cursor-pointer text-xs font-bold text-text hover:text-primary transition-all duration-200 flex-shrink-0 flex items-center gap-2 select-none">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditImageFileChange}
                            className="hidden"
                          />
                          <span>📂 Choose Image File</span>
                        </label>
                        
                        {/* Status indicator */}
                        {isUploadingEditImage && (
                          <span className="text-xs text-primary animate-pulse">Uploading file...</span>
                        )}
                        {editUploadedImageUrl && (
                          <span className="text-xs text-success">✓ Upload success!</span>
                        )}
                      </div>

                      {/* Preview box */}
                      {editImagePreview && (
                        <div className="mt-3 relative h-28 w-28 rounded-xl border border-border overflow-hidden bg-bg/50 flex items-center justify-center">
                          <img src={editImagePreview} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            onClick={() => {
                              setEditImagePreview(null);
                              setEditUploadedImageUrl(null);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white text-[10px]"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stock switch toggle */}
                    <div className="flex items-center gap-4 bg-surface-2/30 border border-border/40 p-4 rounded-xl select-none">
                      <div className="text-left flex-grow">
                        <span className="block text-sm font-bold text-text">Stock Status</span>
                        <span className="text-muted text-xs block mt-0.5">Toggle whether customers can order this instantly.</span>
                      </div>
                      <button
                        onClick={() => setEditProdStock(!editProdStock)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          editProdStock ? 'bg-primary shadow-primary' : 'bg-surface-2 border border-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                            editProdStock ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Modal Sticky Footer buttons */}
                  <div className="px-6 py-4 border-t border-border bg-surface-2/65 flex justify-end gap-3 flex-shrink-0 select-none">
                    <button
                      onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                      className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-2 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProduct}
                      disabled={isUploadingEditImage}
                      className="bg-primary text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-primary hover:bg-primary-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders tab screen */}
        {activeTab === 1 && (
          <div className="flex-grow flex flex-col">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 select-none">
              <div className="text-left">
                <h2 className="font-serif font-black text-3xl text-heading">Orders Manager</h2>
                <p className="text-muted text-xs font-sans mt-1">Review weekend deliveries, booking capacities, and statuses.</p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Notify All Customers Button */}
                <button
                  onClick={() => {
                    setIsNotifyModalOpen(true);
                    setNotifyState('idle');
                    setNotifyResult(null);
                  }}
                  className="inline-flex items-center gap-2 bg-surface border border-border text-primary font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-surface-2 hover:border-primary/50 transition-all duration-200"
                >
                  <span>🔔</span>
                  <span>Notify All Customers</span>
                </button>

                {/* Slots Count Display badge */}
                <div className="self-start inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface border border-border">
                  <span className="text-yellow text-xs font-bold uppercase tracking-wider">Slot Tally:</span>
                  <span className="bg-yellow text-bg font-sans font-black text-xs px-2.5 py-0.5 rounded-full shadow-yellow">
                    {slotsCount} / {getActiveLimit()} bookings
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Orders Limit Configuration Card */}
            <div className="bg-surface border border-border p-6 rounded-2xl mb-8 flex flex-col gap-6 shadow-card text-left select-none animate-fade-slide-up">
              <div>
                <h3 className="font-serif font-bold text-lg text-heading">Weekend Order Capacity</h3>
                <p className="text-muted text-xs font-sans mt-1">Set the maximum slots available for Saturday and Sunday deliveries separately. This dynamically controls customer order limits.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Saturday Slots Limit */}
                <div className="flex flex-col gap-1.5 p-4 bg-surface-2 border border-border rounded-xl">
                  <label className="text-xs font-sans font-bold text-text/80 uppercase tracking-wider">Saturday Capacity</label>
                  <input
                    type="number"
                    value={maxOrdersSatInput}
                    onChange={(e) => setMaxOrdersSatInput(e.target.value)}
                    className="bg-bg border border-border rounded-xl px-4 py-2.5 text-text font-sans font-bold focus:outline-none focus:border-primary text-center mt-1"
                    min={1}
                  />
                </div>
                {/* Sunday Slots Limit */}
                <div className="flex flex-col gap-1.5 p-4 bg-surface-2 border border-border rounded-xl">
                  <label className="text-xs font-sans font-bold text-text/80 uppercase tracking-wider">Sunday Capacity</label>
                  <input
                    type="number"
                    value={maxOrdersSunInput}
                    onChange={(e) => setMaxOrdersSunInput(e.target.value)}
                    className="bg-bg border border-border rounded-xl px-4 py-2.5 text-text font-sans font-bold focus:outline-none focus:border-primary text-center mt-1"
                    min={1}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveMaxOrders}
                  disabled={isSavingMaxOrders}
                  className="w-full sm:w-auto bg-primary text-bg font-sans font-black text-sm uppercase tracking-wider px-6 py-3.5 rounded-full shadow-primary hover:scale-[1.03] active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {isSavingMaxOrders ? 'Saving capacities...' : 'Update Capacity Limits ✓'}
                </button>
              </div>
            </div>

            {/* Top Date Filter buttons bar */}
            <div className="flex flex-wrap gap-3 mb-8 select-none">
              {filterOptions.map((opt) => {
                const isActive = opt.dbStr === activeFilterDateStr;
                return (
                  <button
                    key={opt.dbStr}
                    onClick={() => setActiveFilterDateStr(opt.dbStr)}
                    className={`px-5 py-2.5 border rounded-xl font-sans text-xs md:text-sm font-semibold tracking-wider transition-all duration-300 ${
                      isActive
                        ? 'bg-primary border-primary text-white shadow-primary hover:scale-[1.02]'
                        : 'bg-surface border-border text-text/80 hover:text-primary hover:border-primary hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>{opt.label}</span>
                      <span className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-white/75' : 'text-muted'}`}>
                        {format(opt.date, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Orders Data Table Display grid */}
            {ordersLoading ? (
              <div className="flex-grow flex items-center justify-center py-20 select-none">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-transparent"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-24 border border-dashed border-border rounded-2xl bg-surface/30 select-none">
                <span className="text-5xl animate-float" style={{ animationDuration: '3.5s' }}>🎉</span>
                <h3 className="font-serif font-bold text-xl text-heading mt-4">
                  No orders for this day yet
                </h3>
                <p className="text-muted text-sm mt-2 max-w-sm">
                  Slots are fully open! Share the website link to invite customers.
                </p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-surface-2 text-muted font-sans text-xs font-bold uppercase tracking-wider select-none">
                        <th className="py-4 px-6">#</th>
                        <th className="py-4 px-6">Customer</th>
                        <th className="py-4 px-6">Contact info</th>
                        <th className="py-4 px-6">Address</th>
                        <th className="py-4 px-6">Items Order</th>
                        <th className="py-4 px-6">Total Amount</th>
                        <th className="py-4 px-6">Txn ID</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm font-sans">
                      {filteredOrders.map((ord, idx) => (
                        <tr
                          key={ord.id}
                          className={`hover:bg-surface-2/30 transition-colors duration-150 ${
                            ord.status === 'payment_pending' ? 'bg-warning/5 border-l-2 border-warning' : ''
                          }`}
                        >
                          {/* Row Number */}
                          <td className="py-4 px-6 font-mono text-muted/80">
                            {ord.status === 'payment_pending' && (
                              <span className="mr-1" title="Awaiting payment">⚠️</span>
                            )}
                            {idx + 1}
                          </td>

                          {/* Customer Name */}
                          <td className="py-4 px-6 font-bold text-text text-left">
                            {ord.customer_name}
                          </td>

                          {/* Phone Info */}
                          <td className="py-4 px-6 font-mono text-text/80 text-left">
                            {ord.customer_phone}
                          </td>

                          {/* Address Info */}
                          <td className="py-4 px-6 max-w-xs truncate text-text/70 text-left" title={ord.customer_address}>
                            {ord.customer_address}
                          </td>

                          {/* Items Cart list */}
                          <td className="py-4 px-6 text-left">
                            <ul className="list-none space-y-1">
                              {ord.items && ord.items.map((item, keyIdx) => (
                                <li key={keyIdx} className="text-xs text-text/85">
                                  • {item.name}{' '}
                                  <span className="text-primary font-bold">
                                    {item.dozens !== undefined ? `×${item.dozens} doz (${item.dozens * 12} pcs)` : `×${(item as any).quantity}`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>

                          {/* Total Bill */}
                          <td className="py-4 px-6 font-serif font-semibold text-yellow">
                            ₹{ord.total}
                          </td>

                          {/* UPI Transaction ID */}
                          <td className="py-4 px-6">
                            {ord.upi_transaction_id ? (
                              <span
                                className="font-mono text-xs text-text/80 bg-surface-2 border border-border px-2 py-1 rounded-lg"
                                title={ord.upi_transaction_id}
                              >
                                {ord.upi_transaction_id.slice(0, 12)}
                              </span>
                            ) : (
                              <span className="text-muted/50 text-xs font-sans">—</span>
                            )}
                          </td>

                          {/* Live Dropdown Status Select */}
                          <td className="py-4 px-6 select-none">
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleUpdateStatus(
                                  ord.id,
                                  e.target.value as 'payment_pending' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none transition-colors duration-250 cursor-pointer ${
                                ord.status === 'payment_pending'
                                  ? 'bg-muted/10 border-muted/35 text-muted'
                                  : ord.status === 'pending'
                                  ? 'bg-warning/10 border-warning/35 text-warning'
                                  : ord.status === 'confirmed'
                                  ? 'bg-yellow/10 border-yellow/35 text-yellow'
                                  : ord.status === 'delivered'
                                  ? 'bg-success/10 border-success/35 text-success'
                                  : 'bg-error/10 border-error/35 text-error'
                              }`}
                            >
                              <option value="payment_pending" className="bg-surface text-muted font-bold">⏳ Payment Pending</option>
                              <option value="pending" className="bg-surface text-warning font-bold">🟠 Pending</option>
                              <option value="confirmed" className="bg-surface text-yellow font-bold">🟡 Confirmed</option>
                              <option value="delivered" className="bg-surface text-success font-bold">✅ Delivered</option>
                              <option value="cancelled" className="bg-surface text-error font-bold">❌ Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Notify All Customers Modal ──────────────────────────────────── */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsNotifyModalOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-slide-up">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl text-heading">🔔 Notify All Customers</h3>
              <button
                onClick={() => setIsNotifyModalOpen(false)}
                className="p-1 rounded-lg bg-surface-2 border border-border text-text hover:text-primary transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-muted text-sm font-sans">
                This will send a push notification to all opted-in customers. Make sure your VAPID keys are configured.
              </p>

              <div>
                <label className="block text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">
                  Message
                </label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="e.g. Your delivery is confirmed for Saturday! 🎉"
                  rows={4}
                  disabled={notifyState === 'sending' || notifyState === 'sent'}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 resize-none disabled:opacity-50"
                />
              </div>

              {/* Result feedback */}
              {notifyResult && (
                <div className={`px-4 py-3 rounded-xl text-sm font-sans font-medium ${
                  notifyState === 'sent'
                    ? 'bg-success/10 border border-success/25 text-success'
                    : 'bg-error/10 border border-error/25 text-error'
                }`}>
                  {notifyResult}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-2/65 flex justify-end gap-3">
              <button
                onClick={() => setIsNotifyModalOpen(false)}
                className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-2 transition-all duration-200"
              >
                {notifyState === 'sent' ? 'Close' : 'Cancel'}
              </button>
              {notifyState !== 'sent' && (
                <button
                  onClick={handleNotifyAll}
                  disabled={notifyState === 'sending' || !notifyMessage.trim()}
                  className="inline-flex items-center gap-2 bg-primary text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-primary hover:bg-primary-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notifyState === 'sending' ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Notification</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Box */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-surface border-primary text-text shadow-primary'
              : 'bg-surface border-error/50 text-error shadow-lg'
          }`}
        >
          <span className="text-xl">{toast.type === 'success' ? '🎉' : '❌'}</span>
          <div className="flex flex-col text-left">
            <span className="font-sans font-bold text-sm">
              {toast.type === 'success' ? 'Success!' : 'Error'}
            </span>
            <span className="font-sans text-xs text-text/80 mt-0.5">
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
