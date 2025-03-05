import type { DatabaseAdapter, OrderDetails, ProductDetails, RefundDetails } from './types';

export class RestApiAdapter implements DatabaseAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
  }

  private async fetchFromApi<T>(endpoint: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching from API (${endpoint}):`, error);
      return null;
    }
  }

  async fetchOrderInfo(orderId: string): Promise<OrderDetails | null> {
    return this.fetchFromApi<OrderDetails>(`/api/orders/${orderId}`);
  }

  async fetchProductInfo(productId: string): Promise<ProductDetails | null> {
    return this.fetchFromApi<ProductDetails>(`/api/products/${productId}`);
  }

  async fetchRefundInfo(orderId: string): Promise<RefundDetails | null> {
    return this.fetchFromApi<RefundDetails>(`/api/refunds/order/${orderId}`);
  }
}