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
  Plus, 
  TrendingDown, 
  Search, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  X,
  RotateCcw,
  RefreshCw,
  Box,
  Banknote
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
    getRestockList
  } = useInventory();

  const stats = getWeeklyStats();
  const restockList = getRestockList();

  const todayRevenue = stats[stats.length - 1].revenue;
  const todaySalesCount = stats[stats.length - 1].salesCount;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex text-[#1D1D1F] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-bottom border-gray-100">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Box className="text-white w-5 h-5" />
            </div>
            <span>StockPro</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Tableau de bord" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
          />
          <NavItem 
            icon={<Package size={20} />} 
            label="Inventaire" 
            active={activeView === 'inventory'} 
            onClick={() => setActiveView('inventory')} 
          />
          <NavItem 
            icon={<ShoppingCart size={20} />} 
            label="Ventes" 
            active={activeView === 'sales'} 
            onClick={() => setActiveView('sales')} 
          />
          <NavItem 
            icon={<RefreshCw size={20} />} 
            label="Réassort" 
            active={activeView === 'restock'} 
            onClick={() => setActiveView('restock')} 
            badge={restockList.length > 0 ? restockList.length : undefined}
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Historique" 
            active={activeView === 'history'} 
            onClick={() => setActiveView('history')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Statut Stock</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{lowStockCount} alertes</span>
              {lowStockCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeView === 'dashboard' && "Tableau de Bord"}
              {activeView === 'inventory' && "Gestion de l'Inventaire"}
              {activeView === 'sales' && "Suivi des Ventes"}
              {activeView === 'restock' && "Prévisions de Réassort"}
              {activeView === 'history' && "Historique de l'Activité"}
            </h1>
            <p className="text-gray-500 mt-1">Gérez vos stocks et visualisez vos performances.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-black outline-none w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeView === 'inventory' && (
              <button 
                onClick={() => setShowProductModal(true)}
                className="bg-black text-white px-5 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus size={20} />
                Nouveau Produit
              </button>
            )}
          </div>
        </header>

        <div className="space-y-8">
          {activeView === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  label="Recettes du jour" 
                  value={formatCurrency(todayRevenue)} 
                  subValue="+12% vs hier" 
                  icon={<Banknote className="text-emerald-600" />}
                  color="bg-emerald-50"
                />
                <StatCard 
                  label="Ventes aujourd'hui" 
                  value={todaySalesCount} 
                  subValue="Nombre d'articles vendus" 
                  icon={<ShoppingCart className="text-blue-600" />}
                  color="bg-blue-50"
                />
                <StatCard 
                  label="Alertes Stock" 
                  value={lowStockCount} 
                  subValue="Produits à réapprovisionner" 
                  icon={<AlertCircle className="text-red-600" />}
                  color="bg-red-50"
                />
              </div>

              {/* Chart Section */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6 italic-serif">Performance des 7 derniers jours</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeView === 'inventory' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Produit</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Catégorie</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Prix</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Stock Actuel</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{product.name}</div>
                        <div className="text-xs text-gray-400 font-mono uppercase">{product.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full font-medium">{product.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold text-sm",
                            product.stock <= product.minStock ? "text-red-600" : "text-gray-900"
                          )}>{product.stock}</span>
                          <span className="text-xs text-gray-400">/ min {product.minStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock <= 0 ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase">
                            <TrendingDown size={14} /> Rupture
                          </span>
                        ) : product.stock <= product.minStock ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-orange-500 uppercase">
                            <AlertCircle size={14} /> Réassort requis
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase">
                            <TrendingUp size={14} /> Stable
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const qty = window.prompt(`Combien de ${product.name} voulez-vous vendre ?`, "1");
                              if (qty && !isNaN(parseInt(qty))) recordSale(product.id, parseInt(qty));
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Vendre"
                          >
                            <ShoppingCart size={18} />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                        Aucun produit en stock. Cliquez sur "Nouveau Produit" pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales List */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Dernières Ventes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Date & Heure</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Produit</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Qté</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Total</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Statut</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...sales].reverse().map(sale => (
                        <tr key={sale.id} className={cn("text-sm", sale.cancelled && "opacity-50 grayscale")}>
                          <td className="px-6 py-4 text-gray-500 font-mono">
                            {new Date(sale.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 font-semibold">{sale.productName}</td>
                          <td className="px-6 py-4 font-mono">{sale.quantity}</td>
                          <td className="px-6 py-4 font-bold">{formatCurrency(sale.totalAmount)}</td>
                          <td className="px-6 py-4">
                            {sale.cancelled ? (
                              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Annulé</span>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase">Validé</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!sale.cancelled && (
                              <button 
                                onClick={() => cancelSale(sale.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Annuler la vente"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales Stats Sidebar */}
              <div className="space-y-6">
                <div className="bg-black text-white p-6 rounded-3xl shadow-xl">
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Résumé Recettes</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-3xl font-light">{formatCurrency(todayRevenue)}</p>
                        <p className="text-xs text-emerald-400 font-medium">Aujourd'hui</p>
                      </div>
                      <Banknote size={32} className="opacity-20 translate-y-1" />
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold mb-4 italic-serif">Top Catégories</h4>
                  <div className="space-y-3">
                    <CategoryBar label="Électronique" value={65} color="bg-blue-500" />
                    <CategoryBar label="Vêtements" value={45} color="bg-purple-500" />
                    <CategoryBar label="Alimentation" value={30} color="bg-orange-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'restock' && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <RefreshCw className="text-blue-600" />
                <h3 className="text-xl font-bold italic-serif">Liste de Réassort Hebdomadaire Suggérée</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restockList.map(item => (
                  <div key={item.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30 hover:border-blue-200 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-lg">{item.name}</h4>
                        <span className="text-xs font-mono px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">ID: {item.id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div className="p-3 bg-white rounded-xl border border-gray-100">
                          <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Ventes Hebdo</p>
                          <p className="text-lg font-bold">{item.avgWeeklySales} unités</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-100">
                          <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Stock Actuel</p>
                          <p className={cn("text-lg font-bold", item.stock <= item.minStock ? "text-red-500" : "text-gray-900")}>
                            {item.stock} u.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-blue-700">
                        <span className="text-xs font-bold uppercase tracking-wider">Quantité Suggérée</span>
                        <span className="text-3xl font-black">+{item.suggestion}</span>
                      </div>
                      <p className="text-[10px] text-blue-400 mt-1 italic">Basé sur la moyenne hebdomadaire + 20% de marge de sécurité.</p>
                      <button 
                        onClick={() => {
                          const qty = window.prompt(`Réception de stock pour ${item.name}. Quantité :`, item.suggestion.toString());
                          if (qty && !isNaN(parseInt(qty))) updateProduct(item.id, { stock: item.stock + parseInt(qty) });
                        }}
                        className="w-full mt-4 bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                      >
                        Valider Réception
                      </button>
                    </div>
                  </div>
                ))}
                {restockList.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    <Box size={48} className="mx-auto mb-4 opacity-10" />
                    <p>Le stock est optimal. Aucune suggestion de réassort pour le moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold">Journal d'Activité</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {activities.map(activity => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      activity.type === 'SALE' ? "bg-emerald-50 text-emerald-600" :
                      activity.type === 'CANCEL_SALE' ? "bg-red-50 text-red-600" :
                      activity.type === 'ADD_PRODUCT' ? "bg-blue-50 text-blue-600" :
                      "bg-gray-50 text-gray-400"
                    )}>
                      {activity.type === 'SALE' && <ShoppingCart size={22} />}
                      {activity.type === 'CANCEL_SALE' && <RotateCcw size={22} />}
                      {activity.type === 'ADD_PRODUCT' && <Plus size={22} />}
                      {activity.type === 'EDIT_PRODUCT' && <Package size={22} />}
                      {activity.type === 'DELETE_PRODUCT' && <Trash2 size={22} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{activity.description}</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {new Date(activity.date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      #{activity.id}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Ajouter un produit</h2>
                  <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <X size={24} />
                  </button>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addProduct({
                      name: formData.get('name') as string,
                      category: formData.get('category') as string,
                      price: parseFloat(formData.get('price') as string),
                      stock: parseInt(formData.get('stock') as string),
                      minStock: parseInt(formData.get('minStock') as string),
                    });
                    setShowProductModal(false);
                  }}
                  className="space-y-5"
                >
                  <InputGroup label="Nom du produit" name="name" placeholder="ex: iPhone 15 Pro" required />
                  <InputGroup label="Catégorie" name="category" placeholder="ex: Électronique" required />
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Prix (Ar)" name="price" type="number" step="1" placeholder="2500" required />
                    <InputGroup label="Stock initial" name="stock" type="number" placeholder="10" required />
                  </div>
                  <InputGroup label="Alerte Stock Minimal" name="minStock" type="number" placeholder="5" required />
                  
                  <div className="pt-6">
                    <button className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
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

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
        active ? "bg-black text-white shadow-lg shadow-black/10" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>{icon}</span>
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, subValue, icon, color }: { label: string, value: string | number, subValue: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 p-4 rounded-bl-3xl translate-x-1 translate-y--1", color)}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight mb-2">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{subValue}</p>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-black/5 w-full group-hover:bg-black/10 transition-colors" />
    </div>
  );
}

function CategoryBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InputGroup({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">{label}</label>
      <input 
        {...props}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm font-medium"
      />
    </div>
  );
}
