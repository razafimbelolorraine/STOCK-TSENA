/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus, 
  TrendingDown, 
  Search, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  X,
  Clock,
  RotateCcw,
  RefreshCw,
  Box,
  Banknote,
  Download,
  Calendar,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from './hooks/useInventory';
import { cn, formatCurrency } from './lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

type View = 'dashboard' | 'inventory' | 'sales' | 'history' | 'restock';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low'>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [saleProductId, setSaleProductId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('1');
  
  const { 
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
    exportInventoryCsv,
    exportActivitiesCsv,
    getRestockList,
    restockProduct,
    getMonthlyRestockExpenses
  } = useInventory();

  const stats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const topCategories = getTopCategories();
  const topProducts = getTopProducts();
  const restockList = getRestockList();
  const monthlyExpenses = getMonthlyRestockExpenses();

  const todayRevenue = stats[stats.length - 1].revenue;
  const todayMargin = stats[stats.length - 1].margin;
  const todaySalesCount = stats[stats.length - 1].salesCount;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen bg-brand-bg flex text-slate-800 font-sans antialiased h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-brand-sidebar flex flex-col h-full border-r border-brand-border shrink-0 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-60"
      )}>
        <div className={cn("p-6 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-white whitespace-nowrap overflow-hidden">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
                <Box className="text-white w-5 h-5" />
              </div>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>STOCK<span className="text-brand-primary">PRO</span></motion.span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
              <Box className="text-white w-6 h-6" />
            </div>
          )}
        </div>

        <div className="px-3 mb-2">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-brand-text-nav hover:bg-slate-800 transition-colors border border-slate-800/50"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 w-full px-1"><ChevronLeft size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Réduire</span></div>}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Tableau de bord" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem 
            icon={<Package size={18} />} 
            label="Inventaire" 
            active={activeView === 'inventory'} 
            onClick={() => setActiveView('inventory')} 
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem 
            icon={<ShoppingCart size={18} />} 
            label="Ventes" 
            active={activeView === 'sales'} 
            onClick={() => setActiveView('sales')} 
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem 
            icon={<RefreshCw size={18} />} 
            label="Réassort" 
            active={activeView === 'restock'} 
            onClick={() => setActiveView('restock')} 
            badge={restockList.length > 0 ? restockList.length : undefined}
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem 
            icon={<History size={18} />} 
            label="Historique" 
            active={activeView === 'history'} 
            onClick={() => setActiveView('history')} 
            isCollapsed={isSidebarCollapsed}
          />
        </nav>

        <div className={cn("p-4 border-t border-slate-800 mt-auto", isSidebarCollapsed && "flex flex-col items-center")}>
          {!isSidebarCollapsed ? (
            <button 
              onClick={() => {
                setActiveView('inventory');
                setInventoryFilter('low');
              }}
              className="w-full text-left p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all group"
            >
              <p className="text-[10px] text-brand-text-nav font-bold uppercase tracking-widest mb-2 group-hover:text-white">Statut Stock</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white">{lowStockCount} alertes</span>
                {lowStockCount > 0 && <span className="w-2 h-2 bg-brand-danger rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
              </div>
            </button>
          ) : (
            <div className="relative">
              <button 
                onClick={() => {
                  setActiveView('inventory');
                  setInventoryFilter('low');
                }}
                className={cn(
                  "p-3 rounded-xl transition-all relative",
                  lowStockCount > 0 ? "bg-brand-danger/20 text-brand-danger" : "bg-slate-900 text-slate-500"
                )}
              >
                <AlertCircle size={20} />
                {lowStockCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-danger rounded-full border-2 border-brand-sidebar" />}
              </button>
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="mt-4 px-2">
              <p className="text-[10px] text-brand-text-nav font-bold uppercase tracking-widest leading-tight">Utilisateur</p>
              <p className="text-sm text-slate-300 font-medium truncate">Admin Épicerie</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="px-8 py-4 bg-white border-b border-brand-border flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {activeView === 'dashboard' && "Tableau de Bord"}
              {activeView === 'inventory' && "Gestion de l'Inventaire"}
              {activeView === 'sales' && "Suivi des Ventes"}
              {activeView === 'restock' && "Prévisions de Réassort"}
              {activeView === 'history' && "Historique de l'Activité"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {activeView === 'inventory' && (
                <button 
                  onClick={() => exportInventoryCsv()}
                  className="px-3 py-1.5 text-brand-text-muted hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center gap-1.5 border border-transparent hover:border-brand-border"
                >
                  <Download size={14} /> Exporter CSV
                </button>
              )}
              {activeView === 'sales' && (
                <>
                  <button 
                    onClick={() => exportToExcel('day')}
                    className="px-3 py-1.5 text-brand-text-muted hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center gap-1.5 border border-transparent hover:border-brand-border"
                    title="Exporter Jour"
                  >
                    <Download size={14} /> Jour
                  </button>
                  <button 
                    onClick={() => exportToExcel('month')}
                    className="px-3 py-1.5 text-brand-text-muted hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center gap-1.5 border border-transparent hover:border-brand-border"
                    title="Exporter Mois"
                  >
                    <Download size={14} /> Mois
                  </button>
                </>
              )}
              {activeView === 'history' && (
                <button 
                  onClick={() => exportActivitiesCsv()}
                  className="px-3 py-1.5 text-brand-text-muted hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center gap-1.5 border border-transparent hover:border-brand-border"
                >
                  <Download size={14} /> Exporter CSV
                </button>
              )}
              {activeView === 'dashboard' && (
                <div className="flex bg-slate-50 border border-brand-border rounded-lg overflow-hidden divide-x divide-brand-border">
                  <div className="px-2 py-1.5 flex items-center gap-1.5 shrink-0">
                    <Download size={12} className="text-brand-text-muted" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">Export</span>
                  </div>
                  <button 
                    onClick={() => {
                      exportInventoryCsv();
                      exportActivitiesCsv();
                      exportToExcel('full');
                    }}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white"
                  >
                    Au complet
                  </button>
                  <button 
                    onClick={() => {
                      exportToExcel('day');
                    }}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white"
                  >
                    Journée
                  </button>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-brand-border mx-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-brand-border rounded-lg text-xs focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none w-48 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeView === 'inventory' && (
              <button 
                onClick={() => setShowProductModal(true)}
                className="bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <Plus size={16} />
                Nouveau Produit
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {activeView === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  label="Recettes du jour" 
                  value={formatCurrency(todayRevenue)} 
                  subValue="Chiffre d'affaires" 
                  icon={<Banknote className="text-emerald-600" />}
                  color="bg-emerald-50"
                />
                <StatCard 
                  label="Marge Brute" 
                  value={formatCurrency(todayMargin)} 
                  subValue="Rentabilité brute" 
                  icon={<TrendingUp className="text-orange-600" />}
                  color="bg-orange-50"
                />
                <StatCard 
                  label="Ventes aujourd'hui" 
                  value={todaySalesCount} 
                  subValue="Articles vendus" 
                  icon={<ShoppingCart className="text-blue-600" />}
                  color="bg-blue-50"
                />
                <StatCard 
                  label="Alertes Stock" 
                  value={lowStockCount} 
                  subValue="Réassort requis" 
                  icon={<AlertCircle className="text-red-600" />}
                  color="bg-red-50"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
                  <h3 className="text-sm font-bold mb-6 italic-serif text-slate-800">Revenue & Marge (7j)</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }} 
                        />
                        <Area type="monotone" dataKey="revenue" name="Recettes" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="margin" name="Marge" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorMargin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
                  <h3 className="text-sm font-bold mb-6 italic-serif text-slate-800">Volume de vente mensuel</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }} 
                        />
                        <Bar dataKey="volume" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold italic-serif text-slate-800 uppercase tracking-tight">Top Produits</h3>
                    <TrendingUp size={16} className="text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center bg-brand-sidebar text-white rounded-lg text-[10px] font-bold">{i+1}</span>
                          <div>
                            <p className="font-bold text-xs text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-brand-text-muted italic-serif leading-none mt-0.5">Vendu: {p.quantity} {p.unit}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full">
                          <TrendingUp size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold italic-serif text-slate-800 uppercase tracking-tight">Ventes par Catégorie</h3>
                    <Box size={16} className="text-slate-400" />
                  </div>
                  <div className="space-y-5">
                    {topCategories.map((c, i) => (
                      <CategoryBar 
                        key={i} 
                        label={c.name} 
                        value={Math.round((c.value / (topCategories.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100)} 
                        color={i === 0 ? "bg-brand-primary" : i === 1 ? "bg-brand-accent" : i === 2 ? "bg-brand-warning" : "bg-slate-400"} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'inventory' && (
            <div className="bg-white rounded-xl border border-brand-border shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
               <div className="px-6 py-4 border-b border-brand-border bg-slate-50/50 flex justify-between items-center shrink-0">
                <div className="flex gap-1.5 font-sans">
                  <button 
                    onClick={() => setInventoryFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", 
                      inventoryFilter === 'all' ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 border border-brand-border hover:bg-slate-50"
                    )}
                  >
                    Tout ({products.length})
                  </button>
                  <button 
                    onClick={() => setInventoryFilter('low')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", 
                      inventoryFilter === 'low' ? "bg-brand-danger text-white shadow-sm" : "bg-white text-slate-500 border border-brand-border hover:bg-slate-50"
                    )}
                  >
                    Alertes ({lowStockCount})
                  </button>
                </div>
                {inventoryFilter === 'low' && (
                  <button onClick={() => setInventoryFilter('all')} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors">
                    <X size={12} /> Réinitialiser
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto scroll-area">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border bg-white sticky top-0 z-10 shadow-sm">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Produit</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Catégorie</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Achat</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Vente</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-center">Stock</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Statut</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .filter(p => inventoryFilter === 'all' ? true : p.stock <= p.minStock)
                      .map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-xs text-slate-900">{product.name}</div>
                          <div className="text-[10px] text-brand-text-nav font-mono uppercase tracking-tight">#{product.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] px-2 py-0.5 bg-slate-100 rounded-md font-black text-slate-500 uppercase tracking-widest border border-slate-200/50">{product.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-900">{formatCurrency(product.purchasePrice)}</div>
                          <div className="text-[10px] text-brand-text-muted font-medium italic-serif">/ {product.unit}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-brand-primary">{formatCurrency(product.price)}</div>
                          <div className="text-[10px] text-brand-text-muted font-medium italic-serif">/ {product.unit}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-black text-xs",
                              product.stock <= product.minStock ? "text-brand-danger" : "text-slate-900"
                            )}>
                              {product.stock} <span className="text-[10px] font-medium text-brand-text-muted lowercase">{product.unit}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.stock <= 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-red-50 text-brand-danger border border-red-100/50">
                              <TrendingDown size={10} /> Rupture
                            </span>
                          ) : product.stock <= product.minStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-orange-50 text-brand-warning border border-orange-100/50">
                              <AlertCircle size={10} /> Réassort
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-emerald-50 text-brand-accent border border-emerald-100/50">
                              <TrendingUp size={10} /> Stable
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                const qty = window.prompt(`Réapprovisionner ${product.name} ? (quantité en ${product.unit})`, "10");
                                if (qty && !isNaN(parseFloat(qty))) restockProduct(product.id, parseFloat(qty));
                              }}
                              className="p-1.5 text-brand-accent hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-1 bg-emerald-50/30"
                              title="Réassort"
                            >
                              <Archive size={14} />
                              <span className="text-[10px] font-bold uppercase">Réassort</span>
                            </button>
                            <button 
                              onClick={() => {
                                const qty = window.prompt(`Quantité à vendre de ${product.name} ?`, "1");
                                if (qty && !isNaN(parseFloat(qty))) recordSale(product.id, parseFloat(qty));
                              }}
                              className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors border border-transparent"
                              title="Vendre"
                            >
                              <Plus size={14} />
                            </button>
                            <button 
                              onClick={() => deleteProduct(product.id)}
                              className="p-1.5 text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors pl-2"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
              {/* Sales List */}
              <div className="lg:col-span-2 flex flex-col min-h-0 gap-6">
                {/* Sale Input Form */}
                <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm shrink-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center">
                      <Plus size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 tracking-tight italic-serif">Enregistrer une Vente</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted pl-1">Produit</label>
                      <select 
                        className="w-full px-4 py-2 bg-slate-50 border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs font-bold text-slate-700"
                        value={saleProductId}
                        onChange={(e) => setSaleProductId(e.target.value)}
                      >
                        <option value="">Sélectionner un produit...</option>
                        {products
                          .filter(p => p.stock > 0)
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit} dispos)</option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted pl-1">Quantité</label>
                      <input 
                        type="number" 
                        step="0.001"
                        min="0"
                        className="w-full px-4 py-2 bg-slate-50 border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs font-bold text-slate-700"
                        placeholder="1"
                        value={saleQuantity}
                        onChange={(e) => setSaleQuantity(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!saleProductId) {
                          alert("Veuillez sélectionner un produit.");
                          return;
                        }
                        const qty = parseFloat(saleQuantity);
                        if (isNaN(qty) || qty <= 0) {
                          alert("Veuillez saisir une quantité valide.");
                          return;
                        }

                        const product = products.find(p => p.id === saleProductId);
                        if (product && product.stock < qty) {
                          alert(`Stock insuffisant pour ${product.name}. Stock actuel: ${product.stock} ${product.unit}`);
                          return;
                        }

                        const success = recordSale(saleProductId, qty);
                        if (success) {
                          setSaleProductId('');
                          setSaleQuantity('1');
                        }
                      }}
                      className="bg-brand-primary text-white py-2 px-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={14} /> Valider
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                  <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-slate-50/20 shrink-0">
                    <div className="flex items-center gap-2 font-sans">
                      <h3 className="font-bold text-sm text-slate-800">Journal des Ventes</h3>
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md text-brand-text-muted font-black tracking-widest border border-slate-200/50 uppercase">{sales.length} VENTES</span>
                    </div>
                  </div>
                <div className="flex-1 overflow-auto scroll-area">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Date</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Produit</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-center">Qté</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-right">Total</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[...sales].reverse().map(sale => (
                        <tr key={sale.id} className={cn("text-xs transition-colors hover:bg-slate-50/30 group", sale.cancelled && "opacity-40 grayscale italic line-through")}>
                          <td className="px-6 py-4 text-brand-text-muted font-mono leading-tight text-[10px]">
                            {new Date(sale.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{sale.productName}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-slate-700">{sale.quantity}</span>
                            <span className="text-[9px] text-brand-text-muted uppercase ml-1">{sale.unit}</span>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 text-right">{formatCurrency(sale.totalAmount)}</td>
                          <td className="px-6 py-4 text-right">
                            {!sale.cancelled ? (
                              <button 
                                onClick={() => cancelSale(sale.id)}
                                className="p-1.5 text-slate-300 hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-all"
                              >
                                <RotateCcw size={14} />
                              </button>
                            ) : (
                              <span className="text-[9px] font-black text-brand-danger uppercase tracking-tighter">ANNULÉ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sales Stats Sidebar */}
              <div className="space-y-6 flex flex-col shrink-0">
                <div className="bg-brand-sidebar text-white p-6 rounded-xl shadow-xl relative overflow-hidden shrink-0 border border-slate-700">
                  <div className="relative z-10">
                    <h3 className="text-brand-text-nav text-[10px] font-bold uppercase tracking-widest mb-4">Mois en cours</h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <p className="text-2xl font-black tracking-tight">{formatCurrency(todayRevenue)}</p>
                          <p className="text-[9px] text-brand-accent font-black tracking-widest uppercase mt-1">Recettes Total</p>
                        </div>
                        <Banknote size={24} className="opacity-20 translate-y-1" />
                      </div>

                      <div className="pt-4 border-t border-slate-700">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <p className="text-xl font-bold text-orange-400 tracking-tight">{formatCurrency(monthlyExpenses)}</p>
                            <p className="text-[9px] text-orange-200/50 font-black tracking-widest uppercase mt-1">Total Dépenses (Réassort)</p>
                          </div>
                          <TrendingDown size={20} className="text-orange-400 opacity-40 shrink-0" />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[8px] font-black text-brand-text-nav uppercase tracking-tighter">
                          <span>Objectif Hebdo</span>
                          <span>{Math.min(100, Math.round((todayRevenue / 50000) * 100))}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-accent shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-1000" style={{ width: `${Math.min(100, (todayRevenue / 50000) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl scale-150" />
                </div>

                <div className="bg-white p-5 rounded-xl border border-brand-border shadow-sm flex flex-col shrink-0">
                  <h4 className="font-black text-[10px] mb-6 italic-serif uppercase tracking-widest text-slate-800 flex items-center justify-between">
                    Top Catégories <TrendingUp size={12} className="text-brand-accent" />
                  </h4>
                  <div className="space-y-5">
                    {topCategories.map((c, i) => (
                      <CategoryBar 
                        key={i} 
                        label={c.name} 
                        value={Math.round((c.value / (topCategories.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100)} 
                        color={i === 0 ? "bg-brand-primary" : i === 1 ? "bg-brand-accent" : "bg-brand-warning"} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'restock' && (
            <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm flex flex-col h-full min-h-0 overflow-hidden shrink-0">
              <div className="flex items-center gap-3 mb-8 shrink-0">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-brand-primary border border-blue-100/50">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold italic-serif text-slate-900 leading-tight">Suggestions de Réassort</h3>
                  <p className="text-[10px] text-brand-text-muted font-black uppercase tracking-widest mt-1 italic opacity-70">Basé sur les ventes des 7 derniers jours</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto scroll-area">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                  {restockList.map(item => (
                    <div key={item.id} className="p-5 rounded-xl border border-brand-border bg-slate-50/20 hover:bg-white hover:border-brand-primary/30 transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white border border-brand-border text-brand-text-muted rounded-md uppercase tracking-tighter">#{item.id.slice(0, 5)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                          <div className="p-3 bg-white rounded-lg border border-slate-100 flex flex-col items-center">
                            <p className="text-brand-text-muted text-[8px] uppercase font-black mb-1 tracking-widest">Ventes Hebdo</p>
                            <p className="text-xs font-black text-slate-800">{item.avgWeeklySales} <span className="text-[9px] font-medium lowercase italic-serif">u.</span></p>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-100 flex flex-col items-center">
                            <p className="text-brand-text-muted text-[8px] uppercase font-black mb-1 tracking-widest">Stock</p>
                            <p className={cn("text-xs font-black", item.stock <= item.minStock ? "text-brand-danger" : "text-slate-800")}>
                              {item.stock} <span className="text-[9px] font-medium lowercase italic-serif">u.</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100/60">
                        <div className="flex items-center justify-between text-brand-primary mb-3">
                          <span className="text-[9px] font-black uppercase tracking-widest italic">Suggéré</span>
                          <span className="text-xl font-black tracking-tighter">+{item.suggestion}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const qty = window.prompt(`Réception de stock pour ${item.name}. Quantité :`, item.suggestion.toString());
                            if (qty && !isNaN(parseInt(qty))) updateProduct(item.id, { stock: item.stock + parseInt(qty) });
                          }}
                          className="w-full bg-brand-primary text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-[0.98] shadow-sm"
                        >
                          Réceptionner
                        </button>
                      </div>
                    </div>
                  ))}
                  {restockList.length === 0 && (
                    <div className="col-span-full py-20 text-center shrink-0">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0 border border-emerald-100 shadow-sm">
                        <TrendingUp size={24} />
                      </div>
                      <p className="text-[11px] font-black text-brand-text-nav uppercase tracking-[0.2em] italic leading-relaxed">Stock optimal.<br/>Tout est sous contrôle.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="bg-white rounded-xl border border-brand-border shadow-sm flex flex-col h-full min-h-0 overflow-hidden shrink-0">
               <div className="px-6 py-4 border-b border-brand-border bg-slate-50/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Archive className="text-slate-400" size={16} />
                  <h3 className="font-bold italic-serif text-sm text-slate-800 tracking-tight">Archives Journalières</h3>
                </div>
                <div className="flex gap-1.5">
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-sm border border-slate-900">2026</button>
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-slate-400 border border-brand-border hover:bg-slate-50">2025</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scroll-area shrink-0">
                {activities.map(activity => (
                  <div key={activity.id} className="p-4 hover:bg-slate-50/50 transition-all flex items-center gap-4 group">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm border transition-transform duration-200 group-hover:scale-105",
                      activity.type === 'SALE' ? "bg-emerald-50 text-brand-accent border-emerald-100" :
                      activity.type === 'CANCEL_SALE' ? "bg-red-50 text-brand-danger border-red-100" :
                      activity.type === 'ADD_PRODUCT' ? "bg-blue-50 text-brand-primary border-blue-100" :
                      "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {activity.type === 'SALE' && <ShoppingCart size={16} />}
                      {activity.type === 'CANCEL_SALE' && <RotateCcw size={16} />}
                      {activity.type === 'ADD_PRODUCT' && <Plus size={16} />}
                      {activity.type === 'EDIT_PRODUCT' && <Package size={16} />}
                      {activity.type === 'DELETE_PRODUCT' && <Trash2 size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 group-hover:text-brand-primary transition-colors truncate">{activity.description}</p>
                      <p className="text-[10px] text-brand-text-muted font-medium mt-0.5 flex items-center gap-2 uppercase tracking-tight">
                        <Clock size={10} className="shrink-0 text-slate-300" />
                        {new Date(activity.date).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                    <div className="shrink-0 text-[9px] font-mono px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-brand-text-nav font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                      #{activity.id.slice(0, 4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-brand-border overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                <h2 className="text-sm font-bold tracking-tight italic-serif text-slate-800">Ajouter un produit</h2>
                <button onClick={() => setShowProductModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addProduct({
                      name: formData.get('name') as string,
                      category: formData.get('category') as any,
                      unit: formData.get('unit') as any,
                      purchasePrice: parseFloat(formData.get('purchasePrice') as string),
                      price: parseFloat(formData.get('price') as string),
                      stock: parseFloat(formData.get('stock') as string),
                      minStock: parseFloat(formData.get('minStock') as string),
                    });
                    setShowProductModal(false);
                  }}
                  className="space-y-4"
                >
                  <InputGroup label="Nom du produit" name="name" placeholder="ex: Riz Long Grain" required />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted pl-1">Catégorie</label>
                      <select name="category" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs font-bold text-slate-700">
                        <option value="épicerie">Épicerie</option>
                        <option value="alimentaire">Alimentaire</option>
                        <option value="non alimentaire">Non alimentaire</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted pl-1">Unité</label>
                      <select name="unit" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs font-bold text-slate-700">
                        <option value="u">Pièce (u)</option>
                        <option value="kg">Kilo (kg)</option>
                        <option value="L">Litre (L)</option>
                        <option value="g">Gramme (g)</option>
                        <option value="ml">Millilitre (ml)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Prix d'achat (Ar)" name="purchasePrice" type="number" step="1" placeholder="1800" required />
                    <InputGroup label="Prix de vente (Ar)" name="price" type="number" step="1" placeholder="2500" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Stock initial" name="stock" type="number" step="0.001" placeholder="10" required />
                    <InputGroup label="Stock Minimal" name="minStock" type="number" step="0.001" placeholder="5" required />
                  </div>
                  
                  <div className="pt-4">
                    <button className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-brand-primary/20 active:scale-[0.98] text-xs uppercase tracking-widest">
                      Créer le produit
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .italic-serif {
          font-family: 'Georgia', serif;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge, isCollapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number, isCollapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center rounded-lg transition-all duration-200 group relative",
        active ? "bg-slate-800 text-white shadow-sm" : "text-brand-text-nav hover:bg-slate-800/30 hover:text-slate-200",
        isCollapsed ? "justify-center px-0 py-3" : "justify-between px-3 py-2"
      )}
      title={isCollapsed ? label : ""}
    >
      <div className={cn("flex items-center gap-3", isCollapsed && "gap-0")}>
        <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110 text-brand-text-nav")}>{icon}</span>
        {!isCollapsed && <span className="font-medium text-xs tracking-tight">{label}</span>}
      </div>
      {badge !== undefined && (
        <span className={cn(
          "text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0",
          active ? "bg-brand-primary text-white" : "bg-brand-danger text-white",
          isCollapsed ? "absolute -top-1 -right-1 scale-75" : ""
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, subValue, icon, color }: { label: string, value: string | number, subValue: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-brand-border shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 p-3 rounded-bl-xl translate-x-0.5 translate-y--0.5", color)}>
        {icon}
      </div>
      <div>
        <p className="text-brand-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-xl font-black tracking-tight mb-2 text-slate-900">{value}</p>
        <p className="text-[10px] text-brand-text-muted font-medium flex items-center gap-1">
          {subValue}
        </p>
      </div>
    </div>
  );
}

interface CategoryBarProps {
  label: string;
  value: number;
  color: string;
  key?: any;
}

function CategoryBar({ label, value, color }: CategoryBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-brand-text-muted">{label}</span>
        <span className="text-slate-900">{value}%</span>
      </div>
      <div className="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InputGroup({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted pl-1">{label}</label>
      <input 
        {...props}
        className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
}
