
import React, { useState } from 'react';
import { AppState, Order, OrderType, OrderStatus, SKU, OrderItem } from '../../types';
import { PlusCircle, History, ShoppingCart, ArrowLeft, Camera, Send, X, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SalesDashboardProps {
  state: AppState;
  onAddOrder: (order: Order) => void;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ state, onAddOrder }) => {
  const [view, setView] = useState<'HOME' | 'CREATE' | 'HISTORY'>('HOME');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.REGULAR);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [poFile, setPoFile] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  const selectedSku = state.skus.find(s => s.id === selectedSkuId);
  
  // Updated logic: Calculate return stock for the selected SKU based on the CURRENT user's username
  const returnStock = selectedSku && state.currentUser
    ? state.returns
        .filter(r => r.skuId === selectedSku.id && r.salesId.toLowerCase() === state.currentUser?.username.toLowerCase())
        .reduce((acc, r) => acc + r.quantity, 0)
    : 0;

  const addToCart = () => {
    if (!selectedSku || quantity <= 0) return;
    const existing = cart.find(i => i.skuId === selectedSkuId);
    if (existing) {
      setCart(cart.map(i => i.skuId === selectedSkuId ? { ...i, quantity: i.quantity + quantity } : i));
    } else {
      setCart([...cart, { skuId: selectedSku.id, skuName: selectedSku.name, quantity }]);
    }
    setSelectedSkuId('');
    setQuantity(1);
  };

  const removeFromCart = (skuId: string) => {
    setCart(cart.filter(i => i.skuId !== skuId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPoFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitOrder = () => {
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      salesId: state.currentUser!.id,
      salesName: state.currentUser!.name,
      type: orderType,
      items: cart,
      status: OrderStatus.PENDING_SPV,
      poFile: poFile || undefined,
      createdAt: new Date().toISOString(),
    };
    onAddOrder(newOrder);
    setCart([]);
    setPoFile(null);
    setShowReview(false);
    setView('HISTORY');
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.APPROVED: return 'bg-green-100 text-green-700';
      case OrderStatus.REJECTED_SPV: 
      case OrderStatus.REJECTED_MANAGER: return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {view === 'HOME' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-bottom-10 duration-500">
          <button 
            onClick={() => setView('CREATE')}
            className="h-64 bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center gap-4 hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="bg-blue-100 p-6 rounded-full group-hover:bg-blue-600 transition-colors">
              <PlusCircle className="w-12 h-12 text-blue-600 group-hover:text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">Create New Order</span>
          </button>
          <button 
            onClick={() => setView('HISTORY')}
            className="h-64 bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center gap-4 hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="bg-slate-100 p-6 rounded-full group-hover:bg-slate-800 transition-colors">
              <History className="w-12 h-12 text-slate-600 group-hover:text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">Order History</span>
          </button>
        </div>
      )}

      {view === 'CREATE' && !showReview && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('HOME')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-800">New Order Details</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
              <button 
                onClick={() => setOrderType(OrderType.REGULAR)}
                className={`py-2 px-4 rounded-lg font-bold transition-all ${orderType === OrderType.REGULAR ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >Regular</button>
              <button 
                onClick={() => setOrderType(OrderType.ADDITIONAL)}
                className={`py-2 px-4 rounded-lg font-bold transition-all ${orderType === OrderType.ADDITIONAL ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >Additional</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Item</label>
                <select 
                  value={selectedSkuId}
                  onChange={(e) => setSelectedSkuId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Choose an SKU...</option>
                  {state.skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedSku && (
                <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in zoom-in-95">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-blue-600 font-bold uppercase">Warehouse</p>
                    <p className="text-2xl font-extrabold text-blue-900">{selectedSku.warehouseStock}</p>
                  </div>
                  <div className="w-px bg-blue-200"></div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-blue-600 font-bold uppercase">Your Returns</p>
                    <p className="text-2xl font-extrabold text-blue-900">{returnStock}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <input 
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  placeholder="Qty"
                />
                <button 
                  onClick={addToCart}
                  disabled={!selectedSku}
                  className="bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-200"
                >Add to Cart</button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Current Cart
            </h3>
            {cart.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic">No items added yet</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.skuId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-700">{item.skuName}</p>
                      <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.skuId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                ))}
                <button 
                  onClick={() => setShowReview(true)}
                  className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800"
                >Review Order</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showReview && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowReview(false)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-800">Review & Submit</h2>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Type</p>
                <p className="text-lg font-bold text-blue-600">{orderType}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <p className="text-lg font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Order Summary</h4>
              <div className="space-y-2">
                {cart.map(i => (
                  <div key={i.skuId} className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">{i.skuName}</span>
                    <span className="font-bold">x{i.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Attach Purchase Order (PO)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 cursor-pointer bg-slate-50 transition-all">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-600">Camera / Browse</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                </label>
                <div className="bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden h-32 relative">
                  {poFile ? (
                    <img src={poFile} alt="PO Preview" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No file attached</span>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={submitOrder}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" /> Submit to Supervisor
            </button>
          </div>
        </div>
      )}

      {view === 'HISTORY' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('HOME')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-800">My Orders</h2>
          </div>

          <div className="space-y-4">
            {state.orders.filter(o => o.salesId === state.currentUser?.id).length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed">
                <p className="text-slate-400">You haven't placed any orders yet.</p>
              </div>
            ) : (
              state.orders.filter(o => o.salesId === state.currentUser?.id).reverse().map(order => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-slate-800">{order.id}</p>
                      <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map(item => (
                      <div key={item.skuId} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.skuName}</span>
                        <span className="font-bold text-slate-700">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {order.rejectionMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                      <span className="font-bold">Feedback:</span> {order.rejectionMessage}
                    </div>
                  )}
                  {order.status === OrderStatus.APPROVED && (
                    <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Ready for fulfillment
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
