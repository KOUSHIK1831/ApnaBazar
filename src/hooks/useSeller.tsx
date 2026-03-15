import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

import { Tables } from '@/integrations/supabase/types';

export type Seller = Tables<'sellers'>;
export type Product = Tables<'products'>;
export type FileRecord = Tables<'files'>;

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
    
    // Check slug uniqueness
    if (data.store_slug) {
      const { data: existing } = await supabase
        .from('sellers')
        .select('id')
        .eq('store_slug', data.store_slug)
        .neq('user_id', user.id)
        .single();
      
      if (existing) {
        return { error: new Error('Store URL is already taken. Please choose a different name or location.') };
      }
    }

    const payload: Partial<Seller> & { user_id: string } = {
      user_id: user.id,
      full_name: data.full_name,
      store_name: data.store_name,
      store_slug: data.store_slug,
      store_description: data.store_description,
      location: data.location,
      phone: data.phone,
      contact_number: data.contact_number,
      store_number: data.store_number,
      maps_url: data.maps_url,
    };
    const { error } = await supabase
      .from('sellers')
      .upsert(payload, { onConflict: 'user_id' });
    if (!error) await fetchSeller();
    return { error };
  };

  const updateSellerProfile = async (updates: Partial<Seller>) => {
    if (!seller) return;

    // Check slug uniqueness
    if (updates.store_slug && updates.store_slug !== seller.store_slug) {
      const { data: existing } = await supabase
        .from('sellers')
        .select('id')
        .eq('store_slug', updates.store_slug)
        .neq('id', seller.id)
        .single();
      
      if (existing) {
        return { error: new Error('Store URL is already taken. Please choose a different name or location.') };
      }
    }

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
