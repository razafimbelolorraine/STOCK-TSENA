import { useState, useEffect } from 'react';
import { Product, Sale, Activity, ActivityType } from '../types';
import { generateId } from '../lib/utils';
import { subDays, startOfDay, isSameDay, parseISO } from 'date-fns';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedSales = localStorage.getItem('sales');
    const savedActivities = localStorage.getItem('activities');

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [products, sales, activities]);

  const addActivity = (type: ActivityType, description: string) => {
    const newActivity: Activity = {
      id: generateId(),
      type,
      description,
      date: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
    addActivity('ADD_PRODUCT', `Produit ajouté : ${product.name}`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const product = products.find(p => p.id === id);
    if (product) {
      addActivity('EDIT_PRODUCT', `Produit modifié : ${product.name}`);
    }
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (product) {
      addActivity('DELETE_PRODUCT', `Produit supprimé : ${product.name}`);
    }
  };

  const recordSale = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return false;

    const totalAmount = product.price * quantity;
    const newSale: Sale = {
      id: generateId(),
      productId,
      productName: product.name,
      quantity,
      priceAtSale: product.price,
      totalAmount,
      date: new Date().toISOString(),
      cancelled: false,
    };

    setSales(prev => [...prev, newSale]);
    updateProduct(productId, { stock: product.stock - quantity });
    addActivity('SALE', `Vente réalisée : ${quantity}x ${product.name} (${totalAmount} Ar)`);
    return true;
  };

  const cancelSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.cancelled) return;

    setSales(prev => prev.map(s => s.id === saleId ? { ...s, cancelled: true } : s));
    
    // Restore stock if product still exists
    const product = products.find(p => p.id === sale.productId);
    if (product) {
      updateProduct(sale.productId, { stock: product.stock + sale.quantity });
    }

    addActivity('CANCEL_SALE', `Vente annulée : ${sale.quantity}x ${sale.productName}`);
  };

  const getWeeklyStats = () => {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const daySales = sales.filter(s => !s.cancelled && isSameDay(parseISO(s.date), date));
      const revenue = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
      stats.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        revenue,
        salesCount: daySales.length,
      });
    }
    return stats;
  };

  const getRestockList = () => {
    // Calculer la moyenne des ventes hebdomadaires par produit
    // Pour simplifier, on regarde les ventes des 7 derniers jours
    const lastWeek = subDays(new Date(), 7);
    const weeklySalesMap: Record<string, number> = {};

    sales
      .filter(s => !s.cancelled && parseISO(s.date) >= lastWeek)
      .forEach(s => {
        weeklySalesMap[s.productId] = (weeklySalesMap[s.productId] || 0) + s.quantity;
      });

    return products
      .map(p => {
        const avgWeeklySales = weeklySalesMap[p.id] || 0;
        const suggestion = Math.max(0, (avgWeeklySales * 1.2) - p.stock); // Suggérer 20% de plus que la vente hebdo
        return {
          ...p,
          avgWeeklySales,
          suggestion: Math.ceil(suggestion),
        };
      })
      .filter(p => p.suggestion > 0 || p.stock <= p.minStock)
      .sort((a, b) => (b.suggestion - a.suggestion));
  };

  return {
    products,
    sales,
    activities,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    cancelSale,
    getWeeklyStats,
    getRestockList,
  };
}
