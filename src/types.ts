/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  totalAmount: number;
  date: string;
  cancelled: boolean;
}

export type ActivityType = 
  | 'ADD_PRODUCT' 
  | 'EDIT_PRODUCT' 
  | 'DELETE_PRODUCT' 
  | 'SALE' 
  | 'CANCEL_SALE';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  date: string;
}

export interface DailyStats {
  date: string;
  revenue: number;
  salesCount: number;
}
