import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [newProdFeatured, setNewProdFeatured] = useState(false);
  
  // Edit Product Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCat, setEditProdCat] = useState('Non-Veg');
  const [editProdUnit, setEditProdUnit] = useState('12 pcs');
  const [editProdStock, setEditProdStock] = useState(true);
  const [editProdFeatured, setEditProdFeatured] = useState(false);
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

  // WhatsApp Confirmation: track which orderId is currently being confirmed
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  // Custom message textarea: track which orderId has its textarea open + the text
  const [customMsgOrderId, setCustomMsgOrderId] = useState<string | null>(null);
  const [customMsgText, setCustomMsgText] = useState<Record<string, string>>({});

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

  // Products CRUD: Toggle Featured
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      // Update local state first for instant responsive feel
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_featured: !currentFeatured } : p))
      );

      const { error } = await supabase
        .from('products')
        .update({ is_featured: !currentFeatured })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update featured state in Supabase:', err);
      // Revert if error
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_featured: currentFeatured } : p))
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
        is_featured: newProdFeatured,
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
      setNewProdFeatured(false);
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
    setEditProdFeatured(prod.is_featured ?? false);
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
        is_featured: editProdFeatured,
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

  // WhatsApp: Build pre-filled deep link for an order
  const buildWhatsAppLink = (order: Order): string => {
    const itemLines = order.items.map((i) => {
      const doz = i.dozens !== undefined ? i.dozens : (i as any).quantity ?? 1;
      const pcs = doz * 12;
      const lineTotal = i.price_per_dozen !== undefined
        ? i.price_per_dozen * doz
        : (i as any).price * doz;
      return `• ${i.name} — ${doz} dozen (${pcs} pcs) — ₹${lineTotal}`;
    }).join('\n');

    const deliveryFormatted = format(new Date(order.delivery_date), 'EEEE, MMM d');

    const message =
`Hi ${order.customer_name} 👋

Your order from *Bam's Delicacies* has been confirmed! 🎉

📦 *Order Summary:*
${itemLines}

💰 *Total: ₹${order.total}*
📅 *Delivery: ${deliveryFormatted}*
📍 *Address: ${order.customer_address}*

Thank you for ordering! We'll see you soon. 🍽️
— Bam's Delicacies`;

    const encoded = encodeURIComponent(message);
    const phone = `91${order.customer_phone}`;
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  // WhatsApp: Confirm & notify — update status to 'confirmed' then open WhatsApp
  const handleConfirmAndNotify = async (order: Order) => {
    try {
      setConfirmingOrderId(order.id);

      // 1. Update status to 'confirmed' in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (error) throw error;

      // 2. Refresh UI state
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'confirmed' } : o))
      );

      // 3. Open WhatsApp
      window.open(buildWhatsAppLink(order), '_blank');

      // 4. Show success toast
      showToast('Order confirmed! WhatsApp opened ✓', 'success');
    } catch (err) {
      console.error('Failed to confirm order:', err);
      alert('Error confirming order. Please try again.');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  // WhatsApp: Send custom update message
  const handleSendCustomMessage = (order: Order) => {
    const text = customMsgText[order.id] || '';
    if (!text.trim()) return;

    const encoded = encodeURIComponent(text.trim());
    const phone = `91${order.customer_phone}`;
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');

    // Collapse textarea and clear text after sending
    setCustomMsgOrderId(null);
    setCustomMsgText((prev) => ({ ...prev, [order.id]: '' }));
    showToast('WhatsApp opened with custom message ✓', 'success');
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
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────── */}
      <aside className="hidden md:flex w-60 bg-surface border-r border-border h-screen sticky top-0 flex-col justify-between flex-shrink-0 z-30 select-none">
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
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm tracking-wide text-text/70 hover:text-text hover:bg-surface-2/40 border-l-2 border-transparent transition-all duration-200"
            >
              <span>🏠</span>
              <span>Back to Website</span>
            </Link>
          </nav>
        </div>

        {/* Admin signout trigger */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => { setIsAuthenticated(false); }}
            className="w-full py-2.5 px-4 rounded-xl font-sans font-bold text-xs tracking-wider text-error hover:bg-error/10 border border-transparent hover:border-error/25 transition-all duration-200 uppercase"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────── */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen pb-24 md:pb-8 bg-bg/95 relative z-10 flex flex-col">
        {/* Products tab screen */}
        {activeTab === 0 && (
          <div className="flex-grow flex flex-col">
            {/* Tab Header bar */}
            <div className="flex justify-between items-start md:items-center mb-6 md:mb-8 pb-4 border-b border-border/40 select-none gap-4">
              <div className="text-left">
                <h2 className="font-serif font-black text-2xl md:text-3xl text-heading">Menu Catalog</h2>
                <p className="text-muted text-xs font-sans mt-1">Add, update stock, or remove delicacies.</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-primary text-white font-sans font-bold text-sm px-4 py-2.5 md:px-5 md:py-3 rounded-xl shadow-primary hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  + Add
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

            {/* Catalog display: cards on mobile, table on desktop */}
            {productsLoading ? (
              <div className="flex-grow flex items-center justify-center py-20 select-none">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-transparent"></div>
              </div>
            ) : (
              <>
                {/* ── Mobile product cards (hidden on md+) ── */}
                <div className="md:hidden flex flex-col gap-3">
                  {products.map((prod) => (
                    <div key={prod.id} className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-3 shadow-card">
                      {/* Thumbnail */}
                      <div className="h-14 w-14 rounded-xl bg-bg border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl">🍽️</span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-text text-sm leading-tight truncate">{prod.name}</p>
                            <p className="text-xs text-muted mt-0.5">{prod.category} · <span className="text-yellow font-bold">₹{prod.price}</span> <span className="text-muted">/ {prod.unit_label || '12 pcs'}</span></p>
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Stock toggle */}
                            <button
                              onClick={() => handleToggleStock(prod.id, prod.in_stock)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                prod.in_stock ? 'bg-primary shadow-primary' : 'bg-surface-2 border border-border'
                              }`}
                              title={prod.in_stock ? 'In Stock' : 'Out of Stock'}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                                prod.in_stock ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
                              }`} />
                            </button>
                            {/* Star Toggle */}
                            <button
                              onClick={() => handleToggleFeatured(prod.id, prod.is_featured ?? false)}
                              className="p-2 hover:bg-surface-2 rounded-xl transition-all duration-200"
                              title={prod.is_featured ? 'Featured' : 'Not Featured'}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={prod.is_featured ? "#F5C200" : "none"} stroke={prod.is_featured ? "#F5C200" : "#9CA3AF"} strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.468.868-.468 1.04 0l2.125 5.757a1 1 0 00.95.69h6.04c.5 0 .708.641.304.933l-4.887 3.555a1 1 0 00-.364 1.118l1.867 5.06a1 1 0 00-1.54 1.118l-4.888-3.555a1 1 0 00-1.176 0l-4.888 3.555a1 1 0 00-1.54-1.118l1.867-5.06a1 1 0 00-.364-1.118L2.093 10.88c-.404-.292-.196-.933.304-.933h6.04a1 1 0 00.95-.69l2.125-5.757z" />
                              </svg>
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-2 text-error hover:bg-error/10 rounded-xl transition-all duration-200"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916C19.5 2.979 18.521 2 17.313 2H6.687C5.479 2 4.5 2.979 4.5 4.184v.916" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted/70 mt-1 line-clamp-1">{prod.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Desktop product table (hidden on mobile) ── */}
                <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-border bg-surface-2 text-muted font-sans text-xs font-bold uppercase tracking-wider select-none">
                          <th className="py-4 px-6">Product</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Price / Dozen</th>
                          <th className="py-4 px-6">Stock Status</th>
                          <th className="py-4 px-6 text-center">Featured</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-sm font-sans">
                        {products.map((prod) => (
                          <tr key={prod.id} className="hover:bg-surface-2/30 transition-colors duration-150">
                            <td className="py-4 px-6 flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-bg border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt={prod.name} className="h-full w-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const fb = e.currentTarget.nextElementSibling as HTMLSpanElement; if (fb) fb.style.display = 'inline'; }}
                                  />
                                ) : null}
                                <span className="text-xl" style={{ display: prod.image_url ? 'none' : 'inline' }}>🍽️</span>
                              </div>
                              <div className="text-left font-bold text-text">
                                {prod.name}
                                <span className="block text-xs font-normal text-muted truncate max-w-xs mt-1">{prod.description || 'No description available'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 capitalize text-text/80">{prod.category}</td>
                            <td className="py-4 px-6 font-serif font-semibold text-yellow">₹{prod.price} <span className="text-xs font-sans text-muted">/ {prod.unit_label || '12 pcs'}</span></td>
                            <td className="py-4 px-6 select-none">
                              <button
                                onClick={() => handleToggleStock(prod.id, prod.in_stock)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                  prod.in_stock ? 'bg-primary shadow-primary' : 'bg-surface-2 border border-border'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                                  prod.in_stock ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
                                }`} />
                              </button>
                            </td>
                            <td className="py-4 px-6 select-none text-center">
                              <button
                                onClick={() => handleToggleFeatured(prod.id, prod.is_featured ?? false)}
                                className="p-2 hover:bg-surface-2 rounded-xl transition-all duration-200 inline-block align-middle"
                                title={prod.is_featured ? 'Featured' : 'Not Featured'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={prod.is_featured ? "#F5C200" : "none"} stroke={prod.is_featured ? "#F5C200" : "#9CA3AF"} strokeWidth="2" className="w-5 h-5 mx-auto">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.468.868-.468 1.04 0l2.125 5.757a1 1 0 00.95.69h6.04c.5 0 .708.641.304.933l-4.887 3.555a1 1 0 00-.364 1.118l1.867 5.06a1 1 0 00-1.54 1.118l-4.888-3.555a1 1 0 00-1.176 0l-4.888 3.555a1 1 0 00-1.54-1.118l1.867-5.06a1 1 0 00-.364-1.118L2.093 10.88c-.404-.292-.196-.933.304-.933h6.04a1 1 0 00.95-.69l2.125-5.757z" />
                                </svg>
                              </button>
                            </td>
                            <td className="py-4 px-6 text-center select-none">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleOpenEditModal(prod)} className="p-2 text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl transition-all duration-200" title="Edit Item">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                </button>
                                <button onClick={() => handleDeleteProduct(prod.id, prod.name)} className="p-2 text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-all duration-200" title="Delete Item">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916C19.5 2.979 18.521 2 17.313 2H6.687C5.479 2 4.5 2.979 4.5 4.184v.916" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
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

                    {/* Featured switch toggle */}
                    <div className="flex items-center gap-4 bg-surface-2/30 border border-border/40 p-4 rounded-xl select-none">
                      <div className="text-left flex-grow">
                        <span className="block text-sm font-bold text-text">Featured Delicacy</span>
                        <span className="text-muted text-xs block mt-0.5">Highlight this product in the top Featured Products carousel.</span>
                      </div>
                      <button
                        onClick={() => setNewProdFeatured(!newProdFeatured)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          newProdFeatured ? 'bg-yellow shadow-yellow' : 'bg-surface-2 border border-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                            newProdFeatured ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
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

                    {/* Featured switch toggle */}
                    <div className="flex items-center gap-4 bg-surface-2/30 border border-border/40 p-4 rounded-xl select-none">
                      <div className="text-left flex-grow">
                        <span className="block text-sm font-bold text-text">Featured Delicacy</span>
                        <span className="text-muted text-xs block mt-0.5">Highlight this product in the top Featured Products carousel.</span>
                      </div>
                      <button
                        onClick={() => setEditProdFeatured(!editProdFeatured)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          editProdFeatured ? 'bg-yellow shadow-yellow' : 'bg-surface-2 border border-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform duration-300 ${
                            editProdFeatured ? 'translate-x-6 bg-surface-2' : 'translate-x-1 bg-muted'
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
            <div className="flex flex-col gap-3 mb-6 md:mb-8 pb-4 border-b border-border/40 select-none">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h2 className="font-serif font-black text-2xl md:text-3xl text-heading">Orders</h2>
                  <p className="text-muted text-xs font-sans mt-1">Review deliveries and statuses.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Notify All Customers Button */}
                  <button
                    onClick={() => { setIsNotifyModalOpen(true); setNotifyState('idle'); setNotifyResult(null); }}
                    className="inline-flex items-center gap-1.5 bg-surface border border-border text-primary font-sans font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-surface-2 hover:border-primary/50 transition-all duration-200"
                  >
                    <span>🔔</span>
                    <span className="hidden sm:inline">Notify All</span>
                  </button>
                  {/* Slots Count Display badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface border border-border">
                    <span className="text-yellow text-xs font-bold uppercase tracking-wider">Slots:</span>
                    <span className="bg-yellow text-bg font-sans font-black text-xs px-2 py-0.5 rounded-full shadow-yellow">
                      {slotsCount} / {getActiveLimit()}
                    </span>
                  </div>
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

            {/* Date Filter buttons — horizontal scroll on mobile */}
            <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 select-none overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none flex-nowrap">
              {filterOptions.map((opt) => {
                const isActive = opt.dbStr === activeFilterDateStr;
                return (
                  <button
                    key={opt.dbStr}
                    onClick={() => setActiveFilterDateStr(opt.dbStr)}
                    className={`flex-shrink-0 px-4 py-2 border rounded-xl font-sans text-xs font-semibold tracking-wider transition-all duration-300 ${
                      isActive
                        ? 'bg-primary border-primary text-white shadow-primary'
                        : 'bg-surface border-border text-text/80 hover:text-primary hover:border-primary'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>{opt.label}</span>
                      <span className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-white/75' : 'text-muted'}`}>
                        {format(opt.date, 'MMM d')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Orders display: cards on mobile, table on desktop */}
            {ordersLoading ? (
              <div className="flex-grow flex items-center justify-center py-20 select-none">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-transparent"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-24 border border-dashed border-border rounded-2xl bg-surface/30 select-none">
                <span className="text-5xl animate-float" style={{ animationDuration: '3.5s' }}>🎉</span>
                <h3 className="font-serif font-bold text-xl text-heading mt-4">No orders yet</h3>
                <p className="text-muted text-sm mt-2 max-w-sm">Slots are fully open! Share the website link.</p>
              </div>
            ) : (
              <>
                {/* ── Mobile order cards (hidden on md+) ── */}
                <div className="md:hidden flex flex-col gap-4">
                  {filteredOrders.map((ord, idx) => (
                    <div
                      key={ord.id}
                      className={`bg-surface border rounded-2xl p-4 shadow-card flex flex-col gap-3 ${
                        ord.status === 'payment_pending' ? 'border-warning border-l-4' : 'border-border'
                      }`}
                    >
                      {/* Row header: number + name + status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-text text-sm">
                            {ord.status === 'payment_pending' && <span className="mr-1">⚠️</span>}
                            #{idx + 1} — {ord.customer_name}
                          </p>
                          <p className="text-xs text-muted font-mono mt-0.5">{ord.customer_phone}</p>
                        </div>
                        {/* Status select */}
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                          className={`px-2 py-1 rounded-lg border text-xs font-bold focus:outline-none cursor-pointer flex-shrink-0 ${
                            ord.status === 'payment_pending' ? 'bg-muted/10 border-muted/35 text-muted'
                            : ord.status === 'pending' ? 'bg-warning/10 border-warning/35 text-warning'
                            : ord.status === 'confirmed' ? 'bg-yellow/10 border-yellow/35 text-yellow'
                            : ord.status === 'delivered' ? 'bg-success/10 border-success/35 text-success'
                            : 'bg-error/10 border-error/35 text-error'
                          }`}
                        >
                          <option value="payment_pending">⏳ Pending Pay</option>
                          <option value="pending">🟠 Pending</option>
                          <option value="confirmed">🟡 Confirmed</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>

                      {/* Items list */}
                      <div className="bg-surface-2/40 rounded-xl p-3">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Items</p>
                        {ord.items && ord.items.map((item, ki) => (
                          <p key={ki} className="text-xs text-text/85">
                            • {item.name} <span className="text-primary font-bold">
                              {item.dozens !== undefined ? `×${item.dozens} doz (${item.dozens * 12} pcs)` : `×${(item as any).quantity}`}
                            </span>
                          </p>
                        ))}
                      </div>

                      {/* Total + Txn row */}
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-yellow text-base">₹{ord.total}</span>
                        {ord.upi_transaction_id && (
                          <span className="font-mono text-xs text-text/70 bg-surface-2 border border-border px-2 py-1 rounded-lg">
                            {ord.upi_transaction_id.slice(0, 12)}
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="text-xs text-muted/80 leading-relaxed">
                        📍 {ord.customer_address}
                      </p>

                      {/* WhatsApp action buttons */}
                      {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                        <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
                          <button
                            onClick={() => handleConfirmAndNotify(ord)}
                            disabled={confirmingOrderId === ord.id}
                            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 active:scale-95"
                            style={{ backgroundColor: confirmingOrderId === ord.id ? '#9ca3af' : '#25D366' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            {confirmingOrderId === ord.id ? 'Confirming...' : 'Confirm & Notify on WhatsApp'}
                          </button>
                          <button
                            onClick={() => setCustomMsgOrderId(customMsgOrderId === ord.id ? null : ord.id)}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold bg-surface-2 border border-border text-text hover:border-primary hover:text-primary transition-all duration-200"
                          >
                            <span>📣</span> Send Custom Update
                          </button>
                          {customMsgOrderId === ord.id && (
                            <div className="flex flex-col gap-2 animate-fade-slide-up">
                              <textarea
                                rows={3}
                                placeholder="Type a custom message..."
                                value={customMsgText[ord.id] || ''}
                                onChange={(e) => setCustomMsgText((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-sans focus:outline-none focus:border-primary resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSendCustomMessage(ord)}
                                  disabled={!(customMsgText[ord.id] || '').trim()}
                                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-40 active:scale-95 transition-all"
                                  style={{ backgroundColor: '#25D366' }}
                                >Send</button>
                                <button
                                  onClick={() => setCustomMsgOrderId(null)}
                                  className="flex-1 py-2.5 rounded-full text-sm font-bold bg-surface-2 border border-border text-muted"
                                >Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Desktop order table (hidden on mobile) ── */}
                <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
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
                          <th className="py-4 px-6">Actions</th>
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
                            <td className="py-4 px-6 font-mono text-muted/80">
                              {ord.status === 'payment_pending' && <span className="mr-1" title="Awaiting payment">⚠️</span>}
                              {idx + 1}
                            </td>
                            <td className="py-4 px-6 font-bold text-text text-left">{ord.customer_name}</td>
                            <td className="py-4 px-6 font-mono text-text/80 text-left">{ord.customer_phone}</td>
                            <td className="py-4 px-6 max-w-xs truncate text-text/70 text-left" title={ord.customer_address}>{ord.customer_address}</td>
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
                            <td className="py-4 px-6 font-serif font-semibold text-yellow">₹{ord.total}</td>
                            <td className="py-4 px-6">
                              {ord.upi_transaction_id ? (
                                <span className="font-mono text-xs text-text/80 bg-surface-2 border border-border px-2 py-1 rounded-lg" title={ord.upi_transaction_id}>
                                  {ord.upi_transaction_id.slice(0, 12)}
                                </span>
                              ) : (
                                <span className="text-muted/50 text-xs font-sans">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 select-none">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none transition-colors duration-250 cursor-pointer ${
                                  ord.status === 'payment_pending' ? 'bg-muted/10 border-muted/35 text-muted'
                                  : ord.status === 'pending' ? 'bg-warning/10 border-warning/35 text-warning'
                                  : ord.status === 'confirmed' ? 'bg-yellow/10 border-yellow/35 text-yellow'
                                  : ord.status === 'delivered' ? 'bg-success/10 border-success/35 text-success'
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
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-2 min-w-[160px]">
                                {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleConfirmAndNotify(ord)}
                                    disabled={confirmingOrderId === ord.id}
                                    title="Mark as confirmed and open WhatsApp to notify customer"
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95"
                                    style={{ backgroundColor: confirmingOrderId === ord.id ? '#9ca3af' : '#25D366' }}
                                    onMouseEnter={(e) => { if (confirmingOrderId !== ord.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1ebe57'; }}
                                    onMouseLeave={(e) => { if (confirmingOrderId !== ord.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#25D366'; }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    {confirmingOrderId === ord.id ? 'Confirming...' : 'Confirm & Notify'}
                                  </button>
                                )}
                                {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                                  <button
                                    onClick={() => { setCustomMsgOrderId(customMsgOrderId === ord.id ? null : ord.id); }}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-surface-2 border border-border text-text hover:border-primary hover:text-primary transition-all duration-200"
                                  >
                                    <span>📣</span><span>Send Update</span>
                                  </button>
                                )}
                                {customMsgOrderId === ord.id && (
                                  <div className="mt-1 flex flex-col gap-2 animate-fade-slide-up">
                                    <textarea
                                      rows={3}
                                      placeholder="Type a custom message..."
                                      value={customMsgText[ord.id] || ''}
                                      onChange={(e) => setCustomMsgText((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                                      className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none placeholder:text-muted/60"
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleSendCustomMessage(ord)} disabled={!(customMsgText[ord.id] || '').trim()} className="flex-1 px-3 py-1.5 rounded-full text-xs font-bold text-white disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all" style={{ backgroundColor: '#25D366' }}>Send</button>
                                      <button onClick={() => setCustomMsgOrderId(null)} className="flex-1 px-3 py-1.5 rounded-full text-xs font-bold bg-surface-2 border border-border text-muted">Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Tab Bar (visible only on mobile) ───────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-stretch select-none shadow-2xl">
        <button
          onClick={() => setActiveTab(0)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-all duration-200 ${
            activeTab === 0 ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted/70'
          }`}
        >
          <span className="text-xl">🍱</span>
          <span className="font-sans">Products</span>
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-all duration-200 ${
            activeTab === 1 ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted/70'
          }`}
        >
          <span className="text-xl">📋</span>
          <span className="font-sans">Orders</span>
        </button>
        <Link
          to="/"
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold text-muted/70 hover:text-text transition-all duration-200"
        >
          <span className="text-xl">🏠</span>
          <span className="font-sans">Website</span>
        </Link>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold text-error/80 transition-all duration-200 active:bg-error/10"
        >
          <span className="text-xl">🚪</span>
          <span className="font-sans">Sign Out</span>
        </button>
      </nav>
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
