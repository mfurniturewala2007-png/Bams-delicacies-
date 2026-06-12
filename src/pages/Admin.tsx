import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { Product, Order } from '../types';
import { supabase } from '../utils/supabase';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';
import { BAMS_MENU } from '../utils/seedMenu';
import { useAuth } from '../context/AuthContext';

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

const DEFAULT_TEMPLATE_CONFIRMED =
`Hi {customer_name} 👋

✅ *Order Confirmed!*
Your order from *Bam's Delicacies* has been confirmed! 🎉

📦 *Order Summary:*
{item_lines}

💰 *Total: ₹{total}*
📅 *Pick up: {delivery_date}*
🏪 *Bam Delicacies pickup address:*
A1/18 Brahma Aangan Society, 5th floor, Salunke Vihar Road, Kondhwa, Pune 411048

📍 *Customer's address:*
{customer_address}
*(Note: Delivery charges for the above customer's address will be paid by the customer)*

We're preparing your delicacies with love! Sit tight 🍽️
— Bam's Delicacies`;

const DEFAULT_TEMPLATE_READY =
`Hi {customer_name} 👋

🍽️ *Your Order is Ready!*

Your delicacies from *Bam's Delicacies* are freshly prepared and ready for you!

📦 *Your Order:*
{item_lines}

Please *pick up your order* or let us know if you'd like to schedule delivery. 📞

— Bam's Delicacies`;

const DEFAULT_TEMPLATE_DELIVERY =
`Hi {customer_name} 🚗

Your order from *Bam's Delicacies* is *Out for Delivery!*

🛵 We're on our way to:
📍 {customer_address}

Please be available to receive your fresh delicacies!

— Bam's Delicacies 🍽️`;

const DEFAULT_TEMPLATE_PICKUP =
`Hi {customer_name} 👋

🎉 *Your order is ready for pickup!*

Your delicacies from *Bam's Delicacies* are freshly made and ready to collect.

Please come pick up your order at your convenience.
📞 Call us if you need directions or have any questions!

— Bam's Delicacies 🍽️`;

const Admin: React.FC = () => {
  const { profile, isLoadingProfile } = useAuth();
  const navigate = useNavigate();

  // Tab State: 0 = Products, 1 = Orders, 2 = Templates
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(1);

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

  // Festival settings states
  const [festivalEnabled, setFestivalEnabled] = useState(true);
  const [festivalEndDate, setFestivalEndDate] = useState('2026-06-10T23:59');
  const [festivalDeliveryDate, setFestivalDeliveryDate] = useState('2026-06-12');
  const [isSavingFestivalSettings, setIsSavingFestivalSettings] = useState(false);

  // Message templates states
  const [templateConfirmed, setTemplateConfirmed] = useState<string>(DEFAULT_TEMPLATE_CONFIRMED);
  const [templateReady, setTemplateReady] = useState<string>(DEFAULT_TEMPLATE_READY);
  const [templateDelivery, setTemplateDelivery] = useState<string>(DEFAULT_TEMPLATE_DELIVERY);
  const [templatePickup, setTemplatePickup] = useState<string>(DEFAULT_TEMPLATE_PICKUP);
  const [isSavingTemplates, setIsSavingTemplates] = useState<boolean>(false);

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
  const [orderSubTab, setOrderSubTab] = useState<'active' | 'pending' | 'confirmed' | 'cancelled'>('active');

  // WhatsApp Confirmation: track which orderId is currently being confirmed
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  // WhatsApp 3-stage notification tracking: which stages have been sent per order
  const [whatsappSent, setWhatsappSent] = useState<Record<string, Set<'confirmed' | 'ready' | 'delivery' | 'pickup'>>>({});

  // Delivery type modal for 3rd stage
  const [deliveryTypeModalOrderId, setDeliveryTypeModalOrderId] = useState<string | null>(null);

  // Notify All Customers State
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  // Helper: detect if an order is a combo/festival order
  const isComboOrder = (order: Order): boolean => {
    return order.items.some((i) =>
      (i.category && i.category.toLowerCase().includes('pheli')) ||
      (i.name && (i.name.toLowerCase().includes('combo') || i.name.toLowerCase().includes('pheli')))
    );
  };

  // Date Filters
  const { saturday: thisSat, sunday: thisSun } = getAvailableDeliveryDates();
  const nextSat = addDays(thisSat, 7);
  const nextSun = addDays(thisSun, 7);

  // 1. Define standard weekend options
  const baseOptions = [
    { date: thisSat, label: 'This Saturday', dbStr: format(thisSat, 'yyyy-MM-dd') },
    { date: thisSun, label: 'This Sunday', dbStr: format(thisSun, 'yyyy-MM-dd') },
    { date: nextSat, label: 'Next Saturday', dbStr: format(nextSat, 'yyyy-MM-dd') },
    { date: nextSun, label: 'Next Sunday', dbStr: format(nextSun, 'yyyy-MM-dd') },
  ];

  // 2. Build festival option if enabled and valid
  const festivalOpt = festivalEnabled && festivalDeliveryDate ? (() => {
    const parts = festivalDeliveryDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const dObj = new Date(year, month, day);
        if (!isNaN(dObj.getTime())) {
          return { date: dObj, label: '✨ Pheli Raat ✨', dbStr: festivalDeliveryDate };
        }
      }
    }
    return null;
  })() : null;

  // 3. Deduplicate standard options with festival options
  const initialOptions: typeof baseOptions = [];
  if (festivalOpt) {
    initialOptions.push(festivalOpt);
  }
  baseOptions.forEach((opt) => {
    if (!festivalOpt || opt.dbStr !== festivalOpt.dbStr) {
      initialOptions.push(opt);
    } else {
      // Merge: append label to show it's both
      festivalOpt.label = `✨ Pheli Raat (${opt.label}) ✨`;
    }
  });

  // 4. Scan loaded orders to dynamically extract and add other dates (e.g. June 12)
  const existingDbStrs = new Set(initialOptions.map((o) => o.dbStr));
  const additionalOptions: typeof baseOptions = [];
  const uniqueOrderDates = Array.from(new Set(orders.map((o) => o.delivery_date))).sort();

  uniqueOrderDates.forEach((dateStr) => {
    if (!existingDbStrs.has(dateStr)) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const hasFestive = orders.some((o) => o.delivery_date === dateStr && isComboOrder(o));
        additionalOptions.push({
          date: dObj,
          label: hasFestive ? '✨ Festive Combo ✨' : 'Other Date',
          dbStr: dateStr,
        });
      }
    }
  });

  const filterOptions = [
    { date: new Date(), label: 'All Orders', dbStr: 'all' },
    ...initialOptions,
    ...additionalOptions,
  ];

  const [activeFilterDateStr, setActiveFilterDateStr] = useState<string>('all');

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
        .in('key', [
          'max_orders_per_day',
          'max_orders_saturday',
          'max_orders_sunday',
          'festival_deal_enabled',
          'festival_deal_end_date',
          'festival_deal_delivery_date',
          'whatsapp_template_confirmed',
          'whatsapp_template_ready',
          'whatsapp_template_delivery',
          'whatsapp_template_pickup'
        ]);

      if (error) throw error;
      if (data) {
        const general = data.find(r => r.key === 'max_orders_per_day')?.value || '15';
        const sat = data.find(r => r.key === 'max_orders_saturday')?.value || general;
        const sun = data.find(r => r.key === 'max_orders_sunday')?.value || general;
        
        setMaxOrdersSatInput(sat);
        setMaxOrdersSunInput(sun);

        const festEnabled = data.find(r => r.key === 'festival_deal_enabled')?.value !== 'false';
        const festEnd = data.find(r => r.key === 'festival_deal_end_date')?.value || '2026-06-10T23:59';
        const festDelivery = data.find(r => r.key === 'festival_deal_delivery_date')?.value || '2026-06-12';
        
        setFestivalEnabled(festEnabled);
        setFestivalEndDate(festEnd);
        setFestivalDeliveryDate(festDelivery);

        if (festEnabled) {
          setActiveFilterDateStr(festDelivery);
        }

        const tempConf = data.find(r => r.key === 'whatsapp_template_confirmed')?.value || DEFAULT_TEMPLATE_CONFIRMED;
        const tempReady = data.find(r => r.key === 'whatsapp_template_ready')?.value || DEFAULT_TEMPLATE_READY;
        const tempDeliv = data.find(r => r.key === 'whatsapp_template_delivery')?.value || DEFAULT_TEMPLATE_DELIVERY;
        const tempPick = data.find(r => r.key === 'whatsapp_template_pickup')?.value || DEFAULT_TEMPLATE_PICKUP;

        setTemplateConfirmed(tempConf);
        setTemplateReady(tempReady);
        setTemplateDelivery(tempDeliv);
        setTemplatePickup(tempPick);
      }
    } catch (e) {
      console.warn('Failed to load settings.');
    }
  };

  const handleSaveTemplates = async () => {
    try {
      setIsSavingTemplates(true);
      const { error } = await supabase
        .from('settings')
        .upsert([
          { key: 'whatsapp_template_confirmed', value: templateConfirmed },
          { key: 'whatsapp_template_ready', value: templateReady },
          { key: 'whatsapp_template_delivery', value: templateDelivery },
          { key: 'whatsapp_template_pickup', value: templatePickup }
        ]);

      if (error) throw error;
      showToast('Message templates updated successfully! ✓', 'success');
    } catch (err: any) {
      alert(`Failed to save message templates. Error: ${err.message}`);
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const formatMessageWithOrder = (template: string, order: Order, isStage1 = false) => {
    const itemLines = order.items.map((i) => {
      const doz = i.dozens !== undefined ? i.dozens : (i as any).quantity ?? 1;
      const pcs = doz * 12;
      const lineTotal = i.price_per_dozen !== undefined
        ? i.price_per_dozen * doz
        : (i as any).price * doz;
      if (isStage1) {
        return `• ${i.name} — ${doz} dozen (${pcs} pcs) — ₹${lineTotal}`;
      } else {
        return `• ${i.name} — ${doz} dozen`;
      }
    }).join('\n');

    let deliveryFormatted = order.delivery_date;
    try {
      if (order.delivery_date) {
        const d = new Date(order.delivery_date);
        if (!isNaN(d.getTime())) {
          deliveryFormatted = format(d, 'EEEE, MMM d');
        }
      }
    } catch (e) {
      console.warn("Failed to format order delivery date:", e);
    }

    return template
      .replace(/{customer_name}/g, order.customer_name)
      .replace(/{item_lines}/g, itemLines)
      .replace(/{total}/g, order.total.toString())
      .replace(/{delivery_date}/g, deliveryFormatted)
      .replace(/{customer_address}/g, order.customer_address);
  };

  // Logging for mounting confirmation
  useEffect(() => {
    console.log("Admin component mounted at:", window.location.href);
  }, []);

  useEffect(() => {
    if (!isLoadingProfile && profile?.is_admin) {
      loadProducts();
      loadOrders();
      loadMaxOrders();
    }
  }, [isLoadingProfile, profile]);

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

      // Upload to bucket with explicit content type
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          contentType: file.type,
          duplex: 'half'
        });

      if (error) throw error;

      // Fetch public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setUploadedImageUrl(urlData.publicUrl);
      showToast('Image uploaded successfully! ✓', 'success');
    } catch (err: any) {
      console.error('Storage upload failed:', err);
      showToast(`Upload failed: ${err.message || 'Check bucket configuration'}`, 'error');
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
      // Prevent saving large base64 data URLs to Supabase database
      const finalImgUrl = uploadedImageUrl && !uploadedImageUrl.startsWith('data:') ? uploadedImageUrl : null;

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
        .upload(filePath, file, {
          contentType: file.type,
          duplex: 'half'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setEditUploadedImageUrl(urlData.publicUrl);
      showToast('Image uploaded successfully! ✓', 'success');
    } catch (err: any) {
      console.error('Storage upload failed:', err);
      showToast(`Upload failed: ${err.message || 'Check bucket configuration'}`, 'error');
      setEditUploadedImageUrl(null);
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
      // Prevent saving large base64 data URLs to Supabase database
      const finalImgUrl = editUploadedImageUrl && !editUploadedImageUrl.startsWith('data:') ? editUploadedImageUrl : null;

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

  // Save Festival Settings (Pheli Raat)
  const handleSaveFestivalSettings = async () => {
    try {
      setIsSavingFestivalSettings(true);

      const { error: errEnabled } = await supabase
        .from('settings')
        .upsert({ key: 'festival_deal_enabled', value: String(festivalEnabled) });
      if (errEnabled) throw errEnabled;

      const { error: errEnd } = await supabase
        .from('settings')
        .upsert({ key: 'festival_deal_end_date', value: festivalEndDate });
      if (errEnd) throw errEnd;

      const { error: errDelivery } = await supabase
        .from('settings')
        .upsert({ key: 'festival_deal_delivery_date', value: festivalDeliveryDate });
      if (errDelivery) throw errDelivery;

      showToast("Pheli Raat festival settings updated successfully! ✓", "success");
      if (festivalEnabled) {
        setActiveFilterDateStr(festivalDeliveryDate);
      } else {
        setActiveFilterDateStr(format(thisSat, 'yyyy-MM-dd'));
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save festival settings. Error: ${err.message}`);
    } finally {
      setIsSavingFestivalSettings(false);
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

  // Orders CRUD: Delete Cancelled Order
  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this cancelled order?')) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setOrders((prev) => prev.filter((o) => o.id !== id));
        showToast('Cancelled order deleted successfully ✓', 'success');
      } catch (err: any) {
        console.error('Failed to delete order:', err);
        alert(`Error deleting order: ${err?.message || 'Please try again.'}`);
      }
    }
  };



  // WhatsApp Stage 1: Order Confirmed
  const buildWhatsAppConfirmedLink = (order: Order): string => {
    const rawTemplate = templateConfirmed || DEFAULT_TEMPLATE_CONFIRMED;
    const message = formatMessageWithOrder(rawTemplate, order, true);
    const encoded = encodeURIComponent(message);
    const phone = `91${order.customer_phone}`;
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  // WhatsApp Stage 2: Order Ready
  const buildWhatsAppReadyLink = (order: Order): string => {
    const rawTemplate = templateReady || DEFAULT_TEMPLATE_READY;
    const message = formatMessageWithOrder(rawTemplate, order, false);
    const encoded = encodeURIComponent(message);
    const phone = `91${order.customer_phone}`;
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  // WhatsApp Stage 3a: Out for Delivery
  const buildWhatsAppDeliveryLink = (order: Order): string => {
    const rawTemplate = templateDelivery || DEFAULT_TEMPLATE_DELIVERY;
    const message = formatMessageWithOrder(rawTemplate, order, false);
    const encoded = encodeURIComponent(message);
    const phone = `91${order.customer_phone}`;
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  // WhatsApp Stage 3b: Ready for Pickup
  const buildWhatsAppPickupLink = (order: Order): string => {
    const rawTemplate = templatePickup || DEFAULT_TEMPLATE_PICKUP;
    const message = formatMessageWithOrder(rawTemplate, order, false);
    const encoded = encodeURIComponent(message);
    const phone = `91${order.customer_phone}`;
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  // WhatsApp Stage 1: Confirm & notify — update status to 'confirmed' then open WhatsApp
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

      // 3. Mark stage as sent
      setWhatsappSent((prev) => {
        const updated = { ...prev };
        updated[order.id] = new Set([...(updated[order.id] || []), 'confirmed']);
        return updated;
      });

      // 4. Open WhatsApp
      window.open(buildWhatsAppConfirmedLink(order), '_blank');

      // 5. Show success toast
      showToast('Order confirmed! WhatsApp opened ✓', 'success');
    } catch (err) {
      console.error('Failed to confirm order:', err);
      alert('Error confirming order. Please try again.');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  // WhatsApp Stage 2: Order Ready
  const handleOrderReady = (order: Order) => {
    setWhatsappSent((prev) => {
      const updated = { ...prev };
      updated[order.id] = new Set([...(updated[order.id] || []), 'ready']);
      return updated;
    });
    window.open(buildWhatsAppReadyLink(order), '_blank');
    showToast('"Order Ready" WhatsApp sent ✓', 'success');
  };

  // WhatsApp Stage 3: Out for Delivery
  const handleOutForDelivery = (order: Order) => {
    setDeliveryTypeModalOrderId(null);
    setWhatsappSent((prev) => {
      const updated = { ...prev };
      updated[order.id] = new Set([...(updated[order.id] || []), 'delivery']);
      return updated;
    });
    window.open(buildWhatsAppDeliveryLink(order), '_blank');
    showToast('"Out for Delivery" WhatsApp sent ✓', 'success');
  };

  // WhatsApp Stage 3: Ready for Pickup
  const handleReadyForPickup = (order: Order) => {
    setDeliveryTypeModalOrderId(null);
    setWhatsappSent((prev) => {
      const updated = { ...prev };
      updated[order.id] = new Set([...(updated[order.id] || []), 'pickup']);
      return updated;
    });
    window.open(buildWhatsAppPickupLink(order), '_blank');
    showToast('"Ready for Pickup" WhatsApp sent ✓', 'success');
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
    .filter((o) => activeFilterDateStr === 'all' || o.delivery_date === activeFilterDateStr)
    .sort((a, b) => {
      if (a.status === 'payment_pending' && b.status !== 'payment_pending') return -1;
      if (b.status === 'payment_pending' && a.status !== 'payment_pending') return 1;
      return 0;
    });
  
  // Calculate slotsCount as non-cancelled orders matching the selected date
  const slotsCount = filteredOrders.filter(o => o.status !== 'cancelled').length;

  // Filter orders for the current sub-tab
  const getSubTabOrders = (ordersList: Order[]) => {
    switch (orderSubTab) {
      case 'active':
        return ordersList.filter(o => o.status !== 'cancelled');
      case 'pending':
        return ordersList.filter(o => o.status === 'pending' || o.status === 'payment_pending');
      case 'confirmed':
        return ordersList.filter(o => o.status === 'confirmed' || o.status === 'delivered');
      case 'cancelled':
        return ordersList.filter(o => o.status === 'cancelled');
      default:
        return ordersList;
    }
  };

  const displayedOrders = getSubTabOrders(filteredOrders);


  const getActiveLimit = () => {
    const activeOpt = filterOptions.find(o => o.dbStr === activeFilterDateStr);
    if (activeOpt && activeOpt.dbStr !== 'all') {
      const day = activeOpt.date.getDay(); // 6 = Sat, 0 = Sun
      if (day === 6) return maxOrdersSatInput;
      if (day === 0) return maxOrdersSunInput;
    }
    return maxOrdersSatInput;
  };

  // Gate view
  // ── Admin Gate ────────────────────────────────────────────────────────────
  // Show a spinner while the profile is being loaded from Supabase.
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Not logged in at all → redirect to home.
  if (!profile) {
    navigate('/');
    return null;
  }

  // Logged in but not an admin → show access-denied screen.
  if (!profile.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-card text-center">
          <img src="/logo.jpeg" alt="Bam's Delicacies Logo" className="w-20 h-20 rounded-full mx-auto mb-6 object-cover border border-border shadow-md" />
          <h1 className="font-serif font-black text-3xl text-heading mb-2">Access Denied</h1>
          <p className="font-sans text-muted text-sm mb-6">You do not have permission to view this page.</p>
          <Link
            to="/"
            className="inline-block bg-primary text-white font-sans font-bold py-3 px-8 rounded-xl hover:bg-primary-hover transition-all duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-text select-text w-full max-w-full overflow-x-hidden">
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
              onClick={() => setActiveTab(1)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm tracking-wide transition-all duration-200 border-l-2 ${
                activeTab === 1
                  ? 'bg-surface-2 border-primary text-primary'
                  : 'border-transparent text-text/70 hover:text-text hover:bg-surface-2/40'
              }`}
            >
              <span>📋</span>
              <span>Orders</span>
              {filteredOrders.filter(o => o.status !== 'cancelled').length > 0 && (
                <span className="ml-auto bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{filteredOrders.filter(o => o.status !== 'cancelled').length}</span>
              )}
            </button>
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
              onClick={() => setActiveTab(2)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm tracking-wide transition-all duration-200 border-l-2 ${
                activeTab === 2
                  ? 'bg-surface-2 border-primary text-primary'
                  : 'border-transparent text-text/70 hover:text-text hover:bg-surface-2/40'
              }`}
            >
              <span>💬</span>
              <span>Message Templates</span>
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

      {/* ── Mobile Bottom Nav (visible only on mobile) ──────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-colors ${
            activeTab === 1 ? 'text-primary' : 'text-muted'
          }`}
        >
          <span className="text-lg">📋</span>
          <span>Orders</span>
          {filteredOrders.filter(o => o.status !== 'cancelled').length > 0 && (
            <span className="absolute -top-1 right-6 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {filteredOrders.filter(o => o.status !== 'cancelled').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab(0)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-colors ${
            activeTab === 0 ? 'text-primary' : 'text-muted'
          }`}
        >
          <span className="text-lg">🍱</span>
          <span>Products</span>
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-colors ${
            activeTab === 2 ? 'text-primary' : 'text-muted'
          }`}
        >
          <span className="text-lg">💬</span>
          <span>Templates</span>
        </button>
        <Link
          to="/"
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold text-muted"
        >
          <span className="text-lg">🏠</span>
          <span>Home</span>
        </Link>
      </nav>

      {/* ── Main content area ────────────────────────────────────── */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen pb-28 md:pb-8 bg-bg/95 relative z-10 flex flex-col w-full max-w-full overflow-x-hidden">
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
                  className="bg-primary text-white font-sans font-bold text-sm px-4 py-2.5 md:px-5 md:py-3 min-h-[48px] min-w-[48px] rounded-xl shadow-primary hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  + Add
                </button>
                {!isSeeded && (
                  <button
                    onClick={handleSeedMenu}
                    disabled={isSeeding}
                    className="text-[11px] font-sans font-semibold text-muted hover:text-text bg-surface-2 hover:bg-border/30 px-3 py-1.5 min-h-[48px] rounded-lg border border-border/50 transition-all duration-200 select-none disabled:opacity-50"
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
                            <div className="flex items-center justify-center min-h-[48px] min-w-[48px]">
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
                            </div>
                            {/* Star Toggle */}
                            <button
                              onClick={() => handleToggleFeatured(prod.id, prod.is_featured ?? false)}
                              className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-surface-2 rounded-xl transition-all duration-200"
                              title={prod.is_featured ? 'Featured' : 'Not Featured'}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={prod.is_featured ? "#F5C200" : "none"} stroke={prod.is_featured ? "#F5C200" : "#9CA3AF"} strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.468.868-.468 1.04 0l2.125 5.757a1 1 0 00.95.69h6.04c.5 0 .708.641.304.933l-4.887 3.555a1 1 0 00-.364 1.118l1.867 5.06a1 1 0 00-1.54 1.118l-4.888-3.555a1 1 0 00-1.176 0l-4.888 3.555a1 1 0 00-1.54-1.118l1.867-5.06a1 1 0 00-.364-1.118L2.093 10.88c-.404-.292-.196-.933.304-.933h6.04a1 1 0 00.95-.69l2.125-5.757z" />
                              </svg>
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-2 text-primary min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-primary/10 rounded-xl transition-all duration-200"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-2 text-error min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-error/10 rounded-xl transition-all duration-200"
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
                          <option value="Pheli Raat">Pheli Raat</option>
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
                      <div className="space-y-3">
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
                          {uploadedImageUrl && uploadedImageUrl.startsWith('http') && uploadedImageUrl.includes('supabase') && (
                            <span className="text-xs text-success">✓ Upload success!</span>
                          )}
                        </div>

                        {/* Direct URL Input Option */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted flex-shrink-0">— OR —</span>
                          <input
                            type="url"
                            placeholder="Paste Direct Image URL (e.g. https://example.com/pic.jpg)"
                            value={uploadedImageUrl && !uploadedImageUrl.startsWith('data:') ? uploadedImageUrl : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUploadedImageUrl(val || null);
                              setImagePreview(val || null);
                            }}
                            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text text-xs font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250"
                          />
                        </div>

                        {/* Direct URL Explanatory Tip */}
                        {(!uploadedImageUrl || !uploadedImageUrl.includes('supabase')) && (
                          <div className="text-[10px] text-muted leading-relaxed bg-surface-2/30 p-3 rounded-lg border border-border/30">
                            💡 <strong>Tip:</strong> You can upload a file, or just paste a direct image URL (from Postimages, Imgur, Discord, etc.) in the field above!
                          </div>
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
                          <option value="Pheli Raat">Pheli Raat</option>
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
                      <div className="space-y-3">
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
                          {editUploadedImageUrl && editUploadedImageUrl.startsWith('http') && editUploadedImageUrl.includes('supabase') && (
                            <span className="text-xs text-success">✓ Upload success!</span>
                          )}
                        </div>

                        {/* Direct URL Input Option */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted flex-shrink-0">— OR —</span>
                          <input
                            type="url"
                            placeholder="Paste Direct Image URL (e.g. https://example.com/pic.jpg)"
                            value={editUploadedImageUrl && !editUploadedImageUrl.startsWith('data:') ? editUploadedImageUrl : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditUploadedImageUrl(val || null);
                              setEditImagePreview(val || null);
                            }}
                            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text text-xs font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-250"
                          />
                        </div>

                        {/* Direct URL Explanatory Tip */}
                        {(!editUploadedImageUrl || !editUploadedImageUrl.includes('supabase')) && (
                          <div className="text-[10px] text-muted leading-relaxed bg-surface-2/30 p-3 rounded-lg border border-border/30">
                            💡 <strong>Tip:</strong> You can upload a file, or just paste a direct image URL (from Postimages, Imgur, Discord, etc.) in the field above!
                          </div>
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
                    <span className="text-yellow text-xs font-bold uppercase tracking-wider">
                      {activeFilterDateStr === 'all' ? 'Total Orders:' : 'Slots:'}
                    </span>
                    <span className="bg-yellow text-bg font-sans font-black text-xs px-2 py-0.5 rounded-full shadow-yellow">
                      {activeFilterDateStr === 'all' ? filteredOrders.length : `${slotsCount} / ${getActiveLimit()}`}
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

            {/* Pheli Raat Festive Combo Settings Card */}
            <div className="bg-surface border border-border p-6 rounded-2xl mb-8 flex flex-col gap-6 shadow-card text-left select-none animate-fade-slide-up animate-delay-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-heading">Pheli Raat Festive Settings</h3>
                <p className="text-muted text-xs font-sans mt-1">Configure your limited-time festival combo promotion details. When disabled or expired, it is hidden from customers.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active / Enabled Toggle */}
                <div className="flex flex-col justify-between p-4 bg-surface-2 border border-border rounded-xl">
                  <label className="text-xs font-sans font-bold text-text/80 uppercase tracking-wider mb-2">Enable Pheli Raat Deal</label>
                  <button
                    onClick={() => setFestivalEnabled(!festivalEnabled)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                      festivalEnabled ? 'bg-primary shadow-primary' : 'bg-bg border border-border'
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-bg transition-transform duration-300 ${
                      festivalEnabled ? 'translate-x-8 bg-surface-2' : 'translate-x-1 bg-muted'
                    }`} />
                  </button>
                </div>
                {/* End Date (Countdown End) */}
                <div className="flex flex-col gap-1.5 p-4 bg-surface-2 border border-border rounded-xl">
                  <label className="text-xs font-sans font-bold text-[#3D2000]/80 uppercase tracking-wider">Countdown Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={festivalEndDate}
                    onChange={(e) => setFestivalEndDate(e.target.value)}
                    className="bg-bg border border-border rounded-xl px-3 py-2 text-text font-sans font-semibold focus:outline-none focus:border-primary mt-1"
                  />
                </div>
                {/* Delivery Date */}
                <div className="flex flex-col gap-1.5 p-4 bg-surface-2 border border-border rounded-xl">
                  <label className="text-xs font-sans font-bold text-[#3D2000]/80 uppercase tracking-wider">Festival Delivery Date</label>
                  <input
                    type="date"
                    value={festivalDeliveryDate}
                    onChange={(e) => setFestivalDeliveryDate(e.target.value)}
                    className="bg-bg border border-border rounded-xl px-3 py-2 text-text font-sans font-semibold focus:outline-none focus:border-primary mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveFestivalSettings}
                  disabled={isSavingFestivalSettings}
                  className="w-full sm:w-auto bg-primary text-bg font-sans font-black text-sm uppercase tracking-wider px-6 py-3.5 rounded-full shadow-primary hover:scale-[1.03] active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {isSavingFestivalSettings ? 'Saving...' : 'Update Festive Settings ✓'}
                </button>
              </div>
            </div>

            {/* Date Filter buttons — horizontal scroll on mobile */}
            <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 select-none overflow-x-auto pb-1 scrollbar-none flex-nowrap w-full max-w-full">
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
                        {opt.dbStr === 'all' ? 'All Dates' : format(opt.date, 'MMM d')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Order Status Sub-Tabs */}
            <div className="flex bg-surface-2/40 p-1.5 rounded-2xl mb-8 select-none overflow-x-auto scrollbar-none flex-nowrap gap-1 border border-border/40 w-full max-w-full md:max-w-fit mx-auto md:mx-0">
              {[
                { id: 'active', label: 'All Active', count: filteredOrders.filter(o => o.status !== 'cancelled').length, icon: '📋' },
                { id: 'pending', label: 'Pending', count: filteredOrders.filter(o => o.status === 'pending' || o.status === 'payment_pending').length, icon: '⏳' },
                { id: 'confirmed', label: 'Confirmed', count: filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'delivered').length, icon: '✅' },
                { id: 'cancelled', label: 'Cancelled', count: filteredOrders.filter(o => o.status === 'cancelled').length, icon: '❌' },
              ].map((tab) => {
                const isActive = orderSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOrderSubTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-white shadow-primary shadow-sm scale-[1.02]'
                        : 'text-muted hover:text-text hover:bg-surface-2/60'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-primary' : 'bg-surface-2 text-muted'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders display: cards on mobile, table on desktop */}
            {ordersLoading ? (
              <div className="flex-grow flex items-center justify-center py-20 select-none">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-transparent"></div>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-3xl bg-surface/30 select-none">
                <span className="text-5xl mb-4 animate-float" style={{ animationDuration: '3.5s' }}>
                  {orderSubTab === 'active' ? '🎉' : orderSubTab === 'pending' ? '✨' : orderSubTab === 'confirmed' ? '🍳' : '🗑️'}
                </span>
                <h3 className="font-serif font-bold text-xl text-heading">
                  {orderSubTab === 'active' ? 'No active orders' : orderSubTab === 'pending' ? 'No pending orders' : orderSubTab === 'confirmed' ? 'No confirmed orders' : 'No cancelled orders'}
                </h3>
                <p className="text-muted text-xs mt-2 max-w-xs px-4">
                  {orderSubTab === 'active' ? 'All slots are open! Customers can place new orders on the website.' 
                   : orderSubTab === 'pending' ? 'All orders have been processed. Great job!' 
                   : orderSubTab === 'confirmed' ? 'Orders will show here once confirmed or delivered.' 
                   : 'Cancelled orders that have not been deleted will appear here.'}
                </p>
              </div>
            ) : (
              <>
                {/* ── Mobile order cards (hidden on md+) ── */}
                <div className="md:hidden flex flex-col gap-4">
                  {displayedOrders.map((ord, idx) => {
                    const hasCombo = isComboOrder(ord) && ord.delivery_date === festivalDeliveryDate;
                    return (
                    <div
                      key={ord.id}
                      className={`bg-surface border rounded-2xl p-4 shadow-card flex flex-col gap-3 ${
                        ord.status === 'payment_pending'
                          ? 'border-warning border-l-4'
                          : hasCombo
                          ? 'border-yellow/60 border-l-4'
                          : 'border-border'
                      }`}
                    >
                      {/* Row header: number + name + status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-text text-sm">
                              {ord.status === 'payment_pending' && <span className="mr-1">⚠️</span>}
                              #{idx + 1} — {ord.customer_name}
                            </p>
                            {hasCombo && (
                              <span className="inline-flex items-center gap-1 bg-yellow/15 border border-yellow/40 text-yellow text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse-glow">
                                🎁 Festive Combo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted font-mono mt-0.5">{ord.customer_phone}</p>
                        </div>
                        {/* Status select */}
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                          className={`px-2 py-1 min-h-[48px] rounded-lg border text-xs font-bold focus:outline-none cursor-pointer flex-shrink-0 ${
                            ord.status === 'payment_pending' ? 'bg-muted/10 border-muted/35 text-muted'
                            : ord.status === 'pending' ? 'bg-warning/10 border-warning/35 text-warning'
                            : ord.status === 'confirmed' ? 'bg-yellow/10 border-yellow/35 text-[#9E7C00]'
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

                      {/* ── WhatsApp 3-Stage Notification Panel (mobile) ── */}
                      {ord.status !== 'cancelled' && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted/60 select-none">WhatsApp Notifications</p>
                          <div className="grid grid-cols-3 gap-2">
                            {/* Stage 1: Confirmed */}
                            <button
                              onClick={() => handleConfirmAndNotify(ord)}
                              disabled={confirmingOrderId === ord.id}
                              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 min-h-[48px] rounded-xl text-[10px] font-bold border transition-all duration-200 disabled:opacity-50 active:scale-[0.98] ${
                                whatsappSent[ord.id]?.has('confirmed')
                                  ? 'bg-[#25D366]/10 border-[#25D366]/40 text-[#1a9e4a]'
                                  : 'bg-surface-2 border-border text-text hover:border-[#25D366]/50'
                              }`}
                            >
                              <span className="text-lg">✅</span>
                              <span>{confirmingOrderId === ord.id ? 'Sending...' : 'Confirm'}</span>
                            </button>

                            {/* Stage 2: Ready */}
                            <button
                              onClick={() => handleOrderReady(ord)}
                              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 min-h-[48px] rounded-xl text-[10px] font-bold border transition-all duration-200 active:scale-[0.98] ${
                                whatsappSent[ord.id]?.has('ready')
                                  ? 'bg-yellow/10 border-yellow/40 text-[#9E7C00]'
                                  : 'bg-surface-2 border-border text-text hover:border-yellow/50'
                              }`}
                            >
                              <span className="text-lg">🍽️</span>
                              <span>Ready</span>
                            </button>

                            {/* Stage 3: Delivery / Pickup */}
                            <button
                              onClick={() => setDeliveryTypeModalOrderId(ord.id)}
                              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 min-h-[48px] rounded-xl text-[10px] font-bold border transition-all duration-200 active:scale-[0.98] ${
                                whatsappSent[ord.id]?.has('delivery') || whatsappSent[ord.id]?.has('pickup')
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'bg-surface-2 border-border text-text hover:border-primary/50'
                              }`}
                            >
                              <span className="text-lg">{whatsappSent[ord.id]?.has('pickup') ? '🏠' : '🚗'}</span>
                              <span>{whatsappSent[ord.id]?.has('pickup') ? 'Pickup' : 'Delivery'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete action for cancelled orders (mobile) */}
                      {ord.status === 'cancelled' && (
                        <div className="pt-2 border-t border-border/50">
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold bg-error/10 hover:bg-error/20 border border-error/30 text-error transition-all duration-200 active:scale-[0.98]"
                          >
                            <span>🗑️</span>
                            <span>Delete Order</span>
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
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
                        {displayedOrders.map((ord, idx) => {
                          const hasCombo = isComboOrder(ord) && ord.delivery_date === festivalDeliveryDate;
                          return (
                          <tr
                            key={ord.id}
                            className={`hover:bg-surface-2/30 transition-colors duration-150 ${
                              ord.status === 'payment_pending'
                                ? 'bg-warning/5 border-l-2 border-warning'
                                : hasCombo
                                ? 'bg-yellow/[0.03] border-l-2 border-yellow/50'
                                : ''
                            }`}
                          >
                            <td className="py-4 px-6 font-mono text-muted/80">
                              {ord.status === 'payment_pending' && <span className="mr-1" title="Awaiting payment">⚠️</span>}
                              {idx + 1}
                            </td>
                            <td className="py-4 px-6 text-left">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-text">{ord.customer_name}</span>
                                {hasCombo && (
                                  <span className="inline-flex items-center gap-1 bg-yellow/15 border border-yellow/40 text-yellow text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">
                                    🎁 Festive Combo
                                  </span>
                                )}
                              </div>
                            </td>
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
                                  : ord.status === 'confirmed' ? 'bg-yellow/10 border-yellow/35 text-[#9E7C00]'
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
                              {/* ── WhatsApp 3-Stage Notification (Desktop) ── */}
                              {ord.status !== 'cancelled' ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  {/* Stage 1: Confirmed */}
                                  <button
                                    onClick={() => handleConfirmAndNotify(ord)}
                                    disabled={confirmingOrderId === ord.id}
                                    title="Send WhatsApp: Order Confirmed"
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 disabled:opacity-50 border ${
                                      whatsappSent[ord.id]?.has('confirmed')
                                        ? 'bg-[#25D366] border-[#25D366] text-white shadow-sm'
                                        : 'bg-surface-2 border-border text-text hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#1a9e4a]'
                                    }`}
                                  >
                                    <span className="text-sm">✅</span>
                                  </button>

                                  {/* Stage 2: Ready */}
                                  <button
                                    onClick={() => handleOrderReady(ord)}
                                    title="Send WhatsApp: Order Ready"
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 border ${
                                      whatsappSent[ord.id]?.has('ready')
                                        ? 'bg-yellow border-yellow text-bg shadow-sm'
                                        : 'bg-surface-2 border-border text-text hover:border-yellow hover:bg-yellow/10 hover:text-[#9E7C00]'
                                    }`}
                                  >
                                    <span className="text-sm">🍽️</span>
                                  </button>

                                  {/* Stage 3: Delivery / Pickup */}
                                  <button
                                    onClick={() => setDeliveryTypeModalOrderId(ord.id)}
                                    title="Send WhatsApp: Dispatch / Pickup"
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 border ${
                                      whatsappSent[ord.id]?.has('delivery') || whatsappSent[ord.id]?.has('pickup')
                                        ? 'bg-primary border-primary text-white shadow-sm'
                                        : 'bg-surface-2 border-border text-text hover:border-primary hover:bg-primary/10 hover:text-primary-hover'
                                    }`}
                                  >
                                    <span className="text-sm">{whatsappSent[ord.id]?.has('pickup') ? '🏠' : '🚗'}</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-error/10 hover:bg-error/20 border border-error/30 text-error transition-all duration-200"
                                  title="Delete Cancelled Order"
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Templates tab screen */}
        {activeTab === 2 && (
          <div className="flex-grow flex flex-col text-left select-none animate-fade-slide-up pb-8">
            <div className="flex flex-col gap-3 mb-6 md:mb-8 pb-4 border-b border-border/40">
              <h2 className="font-serif font-black text-2xl md:text-3xl text-heading">Message Templates</h2>
              <p className="text-muted text-xs font-sans mt-1">Customize the WhatsApp notifications sent to customers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Form: The Textareas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Stage 1 Template */}
                <div className="bg-surface border border-border p-5 rounded-2xl shadow-card flex flex-col gap-3">
                  <label className="text-xs font-sans font-bold text-text uppercase tracking-wider">
                    Stage 1: Order Confirmed Template
                  </label>
                  <span className="text-[11px] text-muted -mt-1.5">Sent when confirming and approving the order.</span>
                  <textarea
                    rows={10}
                    value={templateConfirmed}
                    onChange={(e) => setTemplateConfirmed(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-sans text-text focus:outline-none focus:border-primary resize-y min-h-[200px]"
                    placeholder="Enter Stage 1 message template..."
                  />
                </div>

                {/* Stage 2 Template */}
                <div className="bg-surface border border-border p-5 rounded-2xl shadow-card flex flex-col gap-3">
                  <label className="text-xs font-sans font-bold text-text uppercase tracking-wider">
                    Stage 2: Order Ready Template
                  </label>
                  <span className="text-[11px] text-muted -mt-1.5">Sent when the items are fully prepared.</span>
                  <textarea
                    rows={7}
                    value={templateReady}
                    onChange={(e) => setTemplateReady(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-sans text-text focus:outline-none focus:border-primary resize-y min-h-[140px]"
                    placeholder="Enter Stage 2 message template..."
                  />
                </div>

                {/* Stage 3a Template */}
                <div className="bg-surface border border-border p-5 rounded-2xl shadow-card flex flex-col gap-3">
                  <label className="text-xs font-sans font-bold text-text uppercase tracking-wider">
                    Stage 3a: Out for Delivery Template
                  </label>
                  <span className="text-[11px] text-muted -mt-1.5">Sent when orders are dispatched with the courier.</span>
                  <textarea
                    rows={6}
                    value={templateDelivery}
                    onChange={(e) => setTemplateDelivery(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-sans text-text focus:outline-none focus:border-primary resize-y min-h-[120px]"
                    placeholder="Enter Stage 3a message template..."
                  />
                </div>

                {/* Stage 3b Template */}
                <div className="bg-surface border border-border p-5 rounded-2xl shadow-card flex flex-col gap-3">
                  <label className="text-xs font-sans font-bold text-text uppercase tracking-wider">
                    Stage 3b: Ready for Pickup Template
                  </label>
                  <span className="text-[11px] text-muted -mt-1.5">Sent when items are ready to be picked up by the customer.</span>
                  <textarea
                    rows={6}
                    value={templatePickup}
                    onChange={(e) => setTemplatePickup(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-sans text-text focus:outline-none focus:border-primary resize-y min-h-[120px]"
                    placeholder="Enter Stage 3b message template..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={loadMaxOrders}
                    className="px-5 py-3 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-2 transition-all duration-200"
                  >
                    Reset to Last Saved
                  </button>
                  <button
                    onClick={handleSaveTemplates}
                    disabled={isSavingTemplates}
                    className="bg-primary text-white font-sans font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-primary hover:bg-primary-hover active:scale-95 transition-all duration-300 disabled:opacity-50"
                  >
                    {isSavingTemplates ? 'Saving...' : 'Save Templates ✓'}
                  </button>
                </div>
              </div>

              {/* Right Sidebar: Guide & Tags */}
              <div className="space-y-6">
                <div className="bg-surface border border-border p-6 rounded-2xl shadow-card flex flex-col gap-4 text-left">
                  <h3 className="font-serif font-bold text-lg text-heading">Placeholder Guide</h3>
                  <p className="text-muted text-xs font-sans leading-relaxed">You can use any of these placeholder tags in your message text. They will be automatically replaced with the customer's actual order details when sending.</p>
                  
                  <div className="space-y-4 font-sans text-xs">
                    <div className="flex flex-col gap-1 border-b border-border/40 pb-2.5">
                      <code className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded max-w-fit">{`{customer_name}`}</code>
                      <span className="text-muted">The name of the customer.</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-border/40 pb-2.5">
                      <code className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded max-w-fit">{`{item_lines}`}</code>
                      <span className="text-muted">The list of items ordered (with quantities).</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-border/40 pb-2.5">
                      <code className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded max-w-fit">{`{total}`}</code>
                      <span className="text-muted">The total price amount (e.g. 360).</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-border/40 pb-2.5">
                      <code className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded max-w-fit">{`{delivery_date}`}</code>
                      <span className="text-muted">The formatted delivery/pickup date.</span>
                    </div>
                    <div className="flex flex-col gap-1 pb-1">
                      <code className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded max-w-fit">{`{customer_address}`}</code>
                      <span className="text-muted">The customer's delivery address.</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface border border-border p-6 rounded-2xl shadow-card flex flex-col gap-2">
                  <span className="text-[28px]">💡</span>
                  <h4 className="font-serif font-bold text-text mt-2">Formatting Tip</h4>
                  <p className="text-muted text-xs font-sans leading-relaxed">
                    Use asterisks for bolding text in WhatsApp, e.g. <code className="font-mono bg-surface-2 px-1 text-text">*bold text*</code>.
                    <br/><br/>
                    Use emojis to make the messages look friendly and premium for customers!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Tab Bar (visible only on mobile) ───────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-stretch select-none shadow-2xl pb-[env(safe-area-inset-bottom,0px)]">
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-all duration-200 ${
            activeTab === 1 ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted/70'
          }`}
        >
          <span className="text-xl">📋</span>
          <span className="font-sans">Orders</span>
        </button>
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
          onClick={() => setActiveTab(2)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-all duration-200 ${
            activeTab === 2 ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted/70'
          }`}
        >
          <span className="text-xl">💬</span>
          <span className="font-sans">Templates</span>
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

      {/* ── Delivery Type Choice Modal ─────────────────────────────── */}
      {deliveryTypeModalOrderId && (() => {
        const ord = orders.find(o => o.id === deliveryTypeModalOrderId);
        if (!ord) return null;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              onClick={() => setDeliveryTypeModalOrderId(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <div className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-slide-up">
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="font-serif font-bold text-lg text-heading">Stage 3: Notify Customer</h3>
                  <p className="text-muted text-xs font-sans mt-0.5">{ord.customer_name}</p>
                </div>
                <button
                  onClick={() => setDeliveryTypeModalOrderId(null)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary active:scale-95 transition-all duration-200"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm text-text/80 font-sans">Choose the appropriate notification for this order:</p>

                {/* Out for Delivery */}
                <button
                  onClick={() => handleOutForDelivery(ord)}
                  className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/60 bg-surface-2 hover:bg-primary/5 transition-all duration-200 text-left"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">🚗</span>
                  <div>
                    <p className="font-bold text-text text-sm">Out for Delivery</p>
                    <p className="text-muted text-xs mt-0.5">Customer's order is on its way to their address</p>
                  </div>
                </button>

                {/* Ready for Pickup */}
                <button
                  onClick={() => handleReadyForPickup(ord)}
                  className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-yellow/60 bg-surface-2 hover:bg-yellow/5 transition-all duration-200 text-left"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">🏠</span>
                  <div>
                    <p className="font-bold text-text text-sm">Ready for Pickup</p>
                    <p className="text-muted text-xs mt-0.5">Ask customer to come collect their order</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsNotifyModalOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-slide-up">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl text-heading">🔔 Notify All</h3>
              <button
                onClick={() => setIsNotifyModalOpen(false)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary active:scale-95 transition-all duration-200"
                aria-label="Close modal"
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
