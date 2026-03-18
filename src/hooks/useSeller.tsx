import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
    // Only send columns that exist in the base sellers table schema.
    // The trigger handle_new_user auto-creates a row on signup, so use upsert.
    const payload: Record<string, unknown> = {
      user_id: user.id,
      full_name: data.full_name,
      store_name: data.store_name,
      store_slug: data.store_slug,
      store_description: data.store_description,
      location: data.location,
      phone: data.contact_number || data.phone, // map contact_number → phone
    };
    const { error } = await supabase
      .from('sellers')
      .upsert(payload, { onConflict: 'user_id' });
    if (!error) await fetchSeller();
    return { error };
  };

  const updateSellerProfile = async (updates: Partial<Seller>) => {
    if (!seller) return;
    // Map frontend fields to base DB columns.
    // contact_number → phone (base schema column)
    // store_number and maps_url don't exist in base schema, so try them
    // but don't fail if they're rejected.
    const safeUpdates: Record<string, unknown> = {};
    if (updates.store_name !== undefined) safeUpdates.store_name = updates.store_name;
    if (updates.store_description !== undefined) safeUpdates.store_description = updates.store_description;
    if (updates.store_slug !== undefined) safeUpdates.store_slug = updates.store_slug;
    if (updates.full_name !== undefined) safeUpdates.full_name = updates.full_name;
    if (updates.location !== undefined) safeUpdates.location = updates.location;
    if (updates.contact_number !== undefined) safeUpdates.phone = updates.contact_number;
    if (updates.phone !== undefined) safeUpdates.phone = updates.phone;

    // First, update guaranteed-safe columns
    const { error } = await supabase
      .from('sellers')
      .update(safeUpdates)
      .eq('id', seller.id);

    // Then try to update extended columns (may not exist yet)
    const extendedUpdates: Record<string, unknown> = {};
    if (updates.contact_number !== undefined) extendedUpdates.contact_number = updates.contact_number;
    if (updates.store_number !== undefined) extendedUpdates.store_number = updates.store_number;
    if (updates.maps_url !== undefined) extendedUpdates.maps_url = updates.maps_url;

    if (Object.keys(extendedUpdates).length > 0) {
      // Try updating extended columns; ignore errors if columns don't exist
      await supabase.from('sellers').update(extendedUpdates).eq('id', seller.id);
    }

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
