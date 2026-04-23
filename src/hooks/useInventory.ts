import { useState, useEffect } from 'react';
import { Product, Sale, Activity, ActivityType, Restock } from '../types';
import { generateId } from '../lib/utils';
import { subDays, startOfDay, isSameDay, parseISO, setHours, setMinutes, isWithinInterval, format } from 'date-fns';

// Helper to check if a date is within the "Madagascar Shop Day" (6h - 22h)
const isWithinShopDay = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const hour = d.getHours();
  return hour >= 6 && hour < 22;
};

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [restocks, setRestocks] = useState<Restock[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedSales = localStorage.getItem('sales');
    const savedActivities = localStorage.getItem('activities');
    const savedRestocks = localStorage.getItem('restocks');

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedRestocks) setRestocks(JSON.parse(savedRestocks));
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('activities', JSON.stringify(activities));
    localStorage.setItem('restocks', JSON.stringify(restocks));
  }, [products, sales, activities, restocks]);

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
    if (product && !updates.stock) { // Log as edit only if it's not just a stock update from restock/sale
       addActivity('EDIT_PRODUCT', `Produit modifié : ${product.name}`);
    }
  };

  const restockProduct = (id: string, quantity: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newStock = product.stock + quantity;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

    const restockEntry: Restock = {
      id: generateId(),
      productId: id,
      productName: product.name,
      quantity,
      purchasePriceAtRestock: product.purchasePrice,
      totalCost: product.purchasePrice * quantity,
      date: new Date().toISOString(),
    };

    setRestocks(prev => [...prev, restockEntry]);
    addActivity('RESTOCK', `Réassort : +${quantity}${product.unit} ${product.name}`);
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
    const totalCost = product.purchasePrice * quantity;
    const totalMargin = totalAmount - totalCost;

    const newSale: Sale = {
      id: generateId(),
      productId,
      productName: product.name,
      quantity,
      unit: product.unit,
      purchasePriceAtSale: product.purchasePrice,
      priceAtSale: product.price,
      totalAmount,
      totalMargin,
      date: new Date().toISOString(),
      cancelled: false,
    };

    setSales(prev => [...prev, newSale]);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p));
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
      setProducts(prev => prev.map(p => p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p));
    }

    addActivity('CANCEL_SALE', `Vente annulée : ${sale.quantity}${sale.unit} ${sale.productName}`);
  };

  const getWeeklyStats = () => {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const daySales = sales.filter(s => !s.cancelled && isSameDay(parseISO(s.date), date) && isWithinShopDay(s.date));
      const revenue = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
      const margin = daySales.reduce((acc, s) => acc + s.totalMargin, 0);
      stats.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        revenue,
        margin,
        salesCount: daySales.length,
      });
    }
    return stats;
  };

  const getMonthlyStats = () => {
    const months: Record<string, { label: string, revenue: number, margin: number, volume: number }> = {};
    sales.filter(s => !s.cancelled).forEach(s => {
      const date = parseISO(s.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months[key]) {
        months[key] = { 
          label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          revenue: 0,
          margin: 0,
          volume: 0
        };
      }
      months[key].revenue += s.totalAmount;
      months[key].margin += s.totalMargin;
      months[key].volume += s.quantity;
    });
    return Object.values(months).slice(-12);
  };

  const getMonthlyRestockExpenses = () => {
    const now = new Date();
    const currentMonthRestocks = restocks.filter(r => {
      const d = parseISO(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return currentMonthRestocks.reduce((acc, r) => acc + r.totalCost, 0);
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

  const exportToExcel = (period: 'day' | 'month' | 'year' | 'full') => {
    const columnHeaders = "Date,Produit,Quantite,Unite,Prix Unitaire,Total,Statut";
    const now = new Date();
    
    const filteredSales = sales.filter(s => {
      const sDate = parseISO(s.date);
      if (period === 'day') {
        return isSameDay(sDate, now) && isWithinShopDay(s.date);
      }
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
    const filename = period === 'day' ? `export_ventes_journee_${format(now, 'yyyy-MM-dd')}.csv` : `export_ventes_${period}_${format(now, 'yyyy-MM-dd')}.csv`;
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventoryCsv = () => {
    const headers = "ID,Nom,Categorie,Unite,Prix Achat,Prix Vente,Stock,Stock Min,Cree le";
    const rows = products.map(p => [
      p.id,
      p.name,
      p.category,
      p.unit,
      p.purchasePrice,
      p.price,
      p.stock,
      p.minStock,
      p.createdAt
    ].join(','));
    
    const csv = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `inventaire_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportActivitiesCsv = () => {
    const headers = "ID,Type,Description,Date";
    const rows = activities.map(a => [
      a.id,
      a.type,
      a.description,
      a.date
    ].join(','));
    
    const csv = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `historique_${new Date().toISOString().split('T')[0]}.csv`);
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
    restocks,
    addProduct,
    updateProduct,
    restockProduct,
    deleteProduct,
    recordSale,
    cancelSale,
    getWeeklyStats,
    getMonthlyStats,
    getMonthlyRestockExpenses,
    getTopCategories,
    getTopProducts,
    exportToExcel,
    exportInventoryCsv,
    exportActivitiesCsv,
    getRestockList,
  };
}
