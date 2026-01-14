
import React, { useState } from 'react';
import { AppState, Order, OrderStatus, UserRole } from '../../types';
import { CheckCircle, XCircle, ChevronRight, Eye, MessageSquare, AlertCircle, ClipboardCheck, History } from 'lucide-react';

interface ApproverDashboardProps {
  state: AppState;
  onUpdateStatus: (orderId: string, status: OrderStatus, message?: string) => void;
}

const ApproverDashboard: React.FC<ApproverDashboardProps> = ({ state, onUpdateStatus }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const role = state.currentUser?.role;
  const isSPV = role === UserRole.SPV;
  const isManager = role === UserRole.MANAGER;

  // Target status for filtering what this user needs to act on
  const targetStatus = isSPV ? OrderStatus.PENDING_SPV : OrderStatus.PENDING_MANAGER;

  const pendingOrders = state.orders.filter(o => o.status === targetStatus);
  const processedOrders = state.orders.filter(o => {
    if (isSPV) return o.status !== OrderStatus.PENDING_SPV;
    if (isManager) return o.status === OrderStatus.APPROVED || o.status === OrderStatus.REJECTED_MANAGER;
    return false;
  });

  const handleApprove = (orderId: string) => {
    const nextStatus = isSPV ? OrderStatus.PENDING_MANAGER : OrderStatus.APPROVED;
    onUpdateStatus(orderId, nextStatus);
    setSelectedOrder(null);
  };

  const handleReject = () => {
    if (!selectedOrder || !rejectionMessage.trim()) return;
    const nextStatus = isSPV ? OrderStatus.REJECTED_SPV : OrderStatus.REJECTED_MANAGER;
    onUpdateStatus(selectedOrder.id, nextStatus, rejectionMessage);
    setSelectedOrder(null);
    setRejectionMessage('');
    setShowRejectionForm(false);
  };

  const currentDisplayOrders = activeTab === 'PENDING' ? pendingOrders : processedOrders;

  const groupedOrders = currentDisplayOrders.reduce((acc, order) => {
    if (!acc[order.salesName]) acc[order.salesName] = [];
    acc[order.salesName].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const getStatusLabel = (status: OrderStatus) => {
    return status.replace('PENDING_', 'Pending ').replace('REJECTED_', 'Rejected by ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">{isSPV ? 'Supervisor' : 'Manager'} Portal</h1>
            <p className="text-slate-500">Review and authorize sales orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button 
            onClick={() => { setActiveTab('PENDING'); setSelectedOrder(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'PENDING' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardCheck className="w-4 h-4" /> Pending ({pendingOrders.length})
          </button>
          <button 
            onClick={() => { setActiveTab('HISTORY'); setSelectedOrder(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>

        {Object.keys(groupedOrders).length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center border-2 border-dashed border-slate-200">
            <CheckCircle className={`w-16 h-16 ${activeTab === 'PENDING' ? 'text-green-200' : 'text-slate-100'} mx-auto mb-4`} />
            <h3 className="text-xl font-bold text-slate-800">No orders to show</h3>
            <p className="text-slate-400">Everything is up to date.</p>
          </div>
        ) : (
          /* Casting Object.entries to fix 'unknown' type inference on orders */
          (Object.entries(groupedOrders) as [string, Order[]][]).map(([salesName, orders]) => (
            <div key={salesName} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sales: {salesName}</span>
                <span className="text-xs font-bold text-slate-400">{orders.length} Order(s)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all ${selectedOrder?.id === order.id ? 'bg-blue-50' : ''}`}
                  >
                    <div>
                      <div className="font-bold text-slate-800">{order.id}</div>
                      <div className="text-xs text-slate-500">
                        {order.items.length} items • {order.type} • {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeTab === 'HISTORY' && (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${order.status === OrderStatus.APPROVED ? 'border-green-200 text-green-600 bg-green-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                          {order.status}
                        </span>
                      )}
                      <ChevronRight className={`w-5 h-5 transition-transform ${selectedOrder?.id === order.id ? 'text-blue-500 translate-x-1' : 'text-slate-300'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="lg:sticky lg:top-24 h-fit">
        {selectedOrder ? (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-10 duration-500">
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedOrder.id}</h2>
                  <p className="text-slate-500 text-sm">Requested by <span className="font-bold text-slate-700">{selectedOrder.salesName}</span></p>
                </div>
                <div className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider ${selectedOrder.type === 'REGULAR' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {selectedOrder.type}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ordered SKUs</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.skuId} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="font-bold text-slate-700 text-sm">{item.skuName}</span>
                      <span className="bg-white px-3 py-1 rounded-lg border-2 border-slate-100 font-black text-slate-900 text-sm">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.poFile && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Purchase Order (PO)</h4>
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-100 h-48 bg-slate-50">
                    <img src={selectedOrder.poFile} alt="PO" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-bold text-xs">
                        <Eye className="w-4 h-4" /> Full View
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'PENDING' ? (
                showRejectionForm ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100">
                      <label className="block text-xs font-black text-red-700 mb-3 flex items-center gap-2 uppercase tracking-widest">
                        <MessageSquare className="w-4 h-4" /> Reason for Rejection
                      </label>
                      <textarea
                        value={rejectionMessage}
                        onChange={(e) => setRejectionMessage(e.target.value)}
                        className="w-full p-4 rounded-xl border border-red-200 outline-none focus:ring-4 focus:ring-red-100 text-sm"
                        placeholder="Please provide details for the sales agent..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowRejectionForm(false); setRejectionMessage(''); }}
                        className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                      >Cancel</button>
                      <button 
                        onClick={handleReject}
                        disabled={!rejectionMessage.trim()}
                        className="flex-[2] bg-red-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-100"
                      >Reject Order</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => setShowRejectionForm(true)}
                      className="flex items-center justify-center gap-2 border-2 border-red-100 text-red-500 py-4 rounded-2xl font-black text-sm hover:bg-red-50 transition-all"
                    >
                      <XCircle className="w-5 h-5" /> REJECT
                    </button>
                    <button 
                      onClick={() => handleApprove(selectedOrder.id)}
                      className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
                    >
                      <CheckCircle className="w-5 h-5" /> APPROVE
                    </button>
                  </div>
                )
              ) : (
                <div className="pt-6 border-t border-slate-50">
                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${selectedOrder.status === OrderStatus.APPROVED ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {selectedOrder.status === OrderStatus.APPROVED ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <div>
                      <p className="text-xs font-black uppercase">Status</p>
                      <p className="font-bold">{getStatusLabel(selectedOrder.status)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">No Order Selected</h3>
            <p className="text-slate-300 text-sm mt-2">Pick an order from the list on the left to see full details and review it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproverDashboard;
