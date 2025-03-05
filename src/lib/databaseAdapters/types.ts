export interface DatabaseAdapter {
  fetchOrderInfo(orderId: string): Promise<OrderDetails | null>;
  fetchProductInfo(productId: string): Promise<ProductDetails | null>;
  fetchRefundInfo(orderId: string): Promise<RefundDetails | null>;
}

export interface OrderDetails {
  order_id: string;
  status: string;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface ProductDetails {
  product_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface RefundDetails {
  order_id: string;
  amount: number;
  status: string;
  reason?: string;
}