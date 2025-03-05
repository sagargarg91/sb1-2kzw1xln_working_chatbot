import { supabase } from '../supabase';
import type { DatabaseAdapter, OrderDetails, ProductDetails, RefundDetails } from './types';

export class SupabaseAdapter implements DatabaseAdapter {
  async fetchOrderInfo(orderId: string): Promise<OrderDetails | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              name,
              description
            )
          )
        `)
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      
      if (data) {
        return {
          order_id: data.order_id,
          status: data.status,
          total: data.total,
          created_at: data.created_at,
          items: data.order_items
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  async fetchProductInfo(productId: string): Promise<ProductDetails | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async fetchRefundInfo(orderId: string): Promise<RefundDetails | null> {
    try {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching refund:', error);
      return null;
    }
  }
}