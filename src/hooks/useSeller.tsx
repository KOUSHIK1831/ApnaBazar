import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Seller {
  id: string;
  user_id: string;
  full_name: string | null;
  store_name: string | null;
  store_slug: string | null;
  store_description: string | null;
  location: string | null;
  phone: string | null;
  contact_number: string | null;
  store_number: string | null;
  maps_url: string | null;
  banner_url: string | null;
  theme_color: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  stock?: number;
  low_stock_threshold?: number;
  created_at: string;
}

export interface FileRecord {
  id: string;
  seller_id: string;
  file_url: string;
  file_type: string | null;
  status: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  buyer_name: string | null;
  buyer_phone: string | null;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  buyer_name: string | null;
  buyer_phone: string | null;
  created_at: string;
  product?: Product;
}

export function useSeller() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeller = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('sellers')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setSeller(data);
  }, [user]);

  const fetchProducts = useCallback(async () => {
    if (!seller) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });
    setProducts(data || []);
  }, [seller]);

  const fetchFiles = useCallback(async () => {
    if (!seller) return;
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });
    setFiles(data || []);
  }, [seller]);

  const fetchOrders = useCallback(async () => {
    if (!seller) return;
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }, [seller]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (!error) await fetchOrders();
    return { error };
  };

  const createSeller = async (data: Partial<Seller>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const payload = {
      user_id: user.id,
      full_name: data.full_name,
      store_name: data.store_name,
      store_slug: data.store_slug,
      store_description: data.store_description,
      location: data.location,
      phone: data.phone || data.contact_number,
      contact_number: data.contact_number || data.phone,
      store_number: data.store_number,
      maps_url: data.maps_url,
      banner_url: data.banner_url,
      theme_color: data.theme_color,
    };

    try {
      // The trigger handle_new_user auto-creates a row on signup, so we should update first.
      const { data: updated, error: updateError } = await supabase
        .from('sellers')
        .update(payload)
        .eq('user_id', user.id)
        .select();

      if (updateError) return { error: updateError };
      
      if (updated && updated.length > 0) {
        await fetchSeller();
        return { error: null };
      }

      // If no row was updated, try inserting (just in case the trigger didn't run)
      const { error: insertError } = await supabase
        .from('sellers')
        .insert(payload);

      if (insertError) return { error: insertError };
      
      await fetchSeller();
      return { error: null };
    } catch (err) {
      console.error('createSeller unexpected error', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const updateSellerProfile = async (updates: Partial<Seller>) => {
    if (!seller) return { error: new Error('No seller profile found') };
    
    const { error } = await supabase
      .from('sellers')
      .update(updates)
      .eq('id', seller.id);

    if (!error) await fetchSeller();
    return { error };
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);
    if (!error) await fetchProducts();
    return { error };
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (!error) await fetchProducts();
    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchSeller().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchSeller]);

  useEffect(() => {
    if (seller) {
      fetchProducts();
      fetchFiles();
      fetchOrders();
    }
  }, [seller, fetchProducts, fetchFiles, fetchOrders]);

  return {
    seller,
    products,
    files,
    orders,
    loading,
    fetchSeller,
    fetchProducts,
    fetchFiles,
    fetchOrders,
    createSeller,
    updateSellerProfile,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
  };
}
