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
      unit: product.unit,
      priceAtSale: product.price,
      totalAmount,
      date: new Date().toISOString(),
      cancelled: false,
    };

    setSales(prev => [...prev, newSale]);
    updateProduct(productId, { stock: product.stock - quantity });
    addActivity('SALE', `Vente réalisée : ${quantity}${product.unit} ${product.name} (${totalAmount} Ar)`);
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

    addActivity('CANCEL_SALE', `Vente annulée : ${sale.quantity}${sale.unit} ${sale.productName}`);
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

  const getMonthlyStats = () => {
    const months: Record<string, { label: string, revenue: number, volume: number }> = {};
    sales.filter(s => !s.cancelled).forEach(s => {
      const date = parseISO(s.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months[key]) {
        months[key] = { 
          label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          revenue: 0,
          volume: 0
        };
      }
      months[key].revenue += s.totalAmount;
      months[key].volume += s.quantity;
    });
    return Object.values(months).slice(-12);
  };

  const getTopCategories = () => {
    const categories: Record<string, number> = {};
    sales.filter(s => !s.cancelled).forEach(s => {
      const product = products.find(p => p.id === s.productId);
      const cat = product?.category || 'autre';
      categories[cat] = (categories[cat] || 0) + s.totalAmount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getTopProducts = () => {
    const pStats: Record<string, { name: string, quantity: number, unit: string }> = {};
    sales.filter(s => !s.cancelled).forEach(s => {
      if (!pStats[s.productId]) {
        pStats[s.productId] = { name: s.productName, quantity: 0, unit: s.unit };
      }
      pStats[s.productId].quantity += s.quantity;
    });
    return Object.values(pStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const exportToExcel = (period: 'day' | 'month' | 'year') => {
    const columnHeaders = "Date,Produit,Quantite,Unite,Prix Unitaire,Total,Statut";
    const now = new Date();
    
    constfilteredSales = sales.filter(s => {
      const sDate = parseISO(s.date);
      if (period === 'day') return isSameDay(sDate, now);
      if (period === 'month') return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      if (period === 'year') return sDate.getFullYear() === now.getFullYear();
      return true;
    });

    const rows = filteredSales.map(s => [
      new Date(s.date).toLocaleString(),
      s.productName,
      s.quantity,
      s.unit,
      s.priceAtSale,
      s.totalAmount,
      s.cancelled ? 'Annulé' : 'Validé'
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + columnHeaders + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_ventes_${period}_${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRestockList = () => {
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
        const suggestion = Math.max(0, (avgWeeklySales * 1.2) - p.stock); 
        return {
          ...p,
          avgWeeklySales,
          suggestion: p.unit === 'u' ? Math.ceil(suggestion) : Number(suggestion.toFixed(2)),
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
    getMonthlyStats,
    getTopCategories,
    getTopProducts,
    exportToExcel,
    getRestockList,
  };
}
