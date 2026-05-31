export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  created_at?: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_date: string; // stored as YYYY-MM-DD string
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
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
  created_at?: string;
}
