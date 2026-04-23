/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Unit = 'u' | 'kg' | 'L' | 'g' | 'ml';
export type Category = 'épicerie' | 'alimentaire' | 'non alimentaire' | 'autre';

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: Unit;
  purchasePrice: number;
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
  unit: Unit;
  purchasePriceAtSale: number;
  priceAtSale: number;
  totalAmount: number;
  totalMargin: number;
  date: string;
  cancelled: boolean;
}

export type ActivityType = 
  | 'ADD_PRODUCT' 
  | 'EDIT_PRODUCT' 
  | 'DELETE_PRODUCT' 
  | 'SALE' 
  | 'CANCEL_SALE'
  | 'RESTOCK';

export interface Restock {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePriceAtRestock: number;
  totalCost: number;
  date: string;
}

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
