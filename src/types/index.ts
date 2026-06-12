export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  unit_label?: string | null;
  is_featured?: boolean;
  created_at?: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  price_per_dozen: number;   // price for 12 pcs
  dozens: number;            // how many sets of 12 the user wants
  image_url: string;
  category: string;
}

export const cartItemTotal = (item: CartItem) => item.price_per_dozen * item.dozens;

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_date: string; // stored as YYYY-MM-DD string
  items: CartItem[];
  total: number;
  status: 'payment_pending' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  upi_transaction_id?: string | null;
  created_at?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  subscription: PushSubscriptionJSON;
  created_at?: string;
}

// Equivalent to standard browser PushSubscription.toJSON() shape
export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UserProfile {
  phone: string;
  name: string;
  address: string;
  pincode: string;
  is_admin?: boolean;
  created_at?: string;
}
