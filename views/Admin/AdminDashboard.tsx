
import React, { useState, useRef } from 'react';
import { AppState, SKU, UserRole, ReturnRecord, User, Order, OrderStatus } from '../../types';
import { 
  Database, TrendingUp, RefreshCw, 
  Users, Boxes, UserPlus, Trash2, Plus, X, 
  ShieldCheck, UserCircle, Briefcase, FileText, UploadCloud, AlertCircle, Key, Lock, CheckCircle2,
  List, RotateCw, Fingerprint, DownloadCloud, PieChart, BarChart3
} from 'lucide-react';

interface AdminDashboardProps {
  state: AppState;
  onUpdateSkus: (skus: SKU[]) => void;
  onSetReturns: (records: ReturnRecord[]) => void;
  onAddReturn: (record: ReturnRecord) => void;
  onDeleteReturn: (id: string) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (user: User) => void;
  onTriggerSyncNotif: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  state, onUpdateSkus, onSetReturns, onAddReturn, onDeleteReturn, onAddUser, onDeleteUser, onUpdateUser, onTriggerSyncNotif
}) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'USERS'>('INVENTORY');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCsvHelp, setShowCsvHelp] = useState<{type: 'WH' | 'RET', show: boolean}>({ type: 'WH', show: false });
  const [needsSync, setNeedsSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const whInputRef = useRef<HTMLInputElement>(null);
  const retInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const stats = {
    totalWarehouse: state.skus.reduce((acc, s) => acc + s.warehouseStock, 0),
    totalReturn: state.returns.reduce((acc, r) => acc + r.quantity, 0),
    totalOrders: state.orders.length,
    totalUsers: state.users.length,
  };

  // Aggregate Sales Data for the new dashboard section
  const salesSummary = state.orders.reduce((acc, order) => {
    const key = `${order.salesId}_${order.status}`;
    if (!acc[key]) {
      const user = state.users.find(u => u.id === order.salesId);
      acc[key] = {
        salesId: order.salesId,
        username: user?.username || 'unknown',
        salesName: order.salesName,
        status: order.status,
        totalQty: 0,
        orderCount: 0
      };
    }
    const itemTotal = order.items.reduce((sum, item) => sum + item.quantity, 0);
    acc[key].totalQty += itemTotal;
    acc[key].orderCount += 1;
    return acc;
  }, {} as Record<string, { salesId: string, username: string, salesName: string, status: OrderStatus, totalQty: number, orderCount: number }>);

  const salesSummaryList = Object.values(salesSummary).sort((a, b) => a.salesName.localeCompare(b.salesName));

  const handleRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setNeedsSync(false);
      onTriggerSyncNotif();
    }, 800);
  };

  // CSV Export Logic for Sales Orders
  const handleExportOrders = () => {
    if (state.orders.length === 0) {
      alert("No sales orders found to export.");
      return;
    }

    const csvRows = [['Username', 'Sales Name', 'Product', 'Quantity', 'Status']];

    state.orders.forEach(order => {
      const user = state.users.find(u => u.id === order.salesId);
      const username = user ? user.username : 'unknown';

      order.items.forEach(item => {
        csvRows.push([
          username,
          order.salesName,
          item.skuName,
          item.quantity.toString(),
          order.status
        ]);
      });
    });

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing Logic
  const handleWhCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newSkus: SKU[] = [];

      lines.forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 3) return;
        const [id, name, qty] = parts;
        if (!id || !name || isNaN(parseInt(qty))) return;
        newSkus.push({ id: id.toUpperCase(), name, warehouseStock: parseInt(qty) });
      });

      if (newSkus.length > 0) {
        onUpdateSkus(newSkus);
        setNeedsSync(true);
      } else {
        alert('No valid SKU data found in file. Ensure format is: SKU_ID, SKU_Name, Quantity');
      }
    };
    reader.readAsText(file);
    if (whInputRef.current) whInputRef.current.value = '';
  };

  const handleRetCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newReturns: ReturnRecord[] = [];

      lines.forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 5) return;
        const [salesUsername, salesName, skuId, skuName, qty] = parts;
        if (!salesUsername || !salesName || !skuId || !skuName || isNaN(parseInt(qty))) return;
        newReturns.push({
          id: `RET-${Math.random().toString(36).substr(2, 9)}`,
          salesId: salesUsername.toLowerCase(), 
          salesName,
          skuId: skuId.toUpperCase(),
          skuName,
          quantity: parseInt(qty),
          createdAt: new Date().toISOString()
        });
      });
      
      if (newReturns.length > 0) {
        onSetReturns(newReturns);
        setNeedsSync(true);
      } else {
        alert('No valid return data found. Ensure format is: SalesUsername, SalesName, SKU_ID, SKU_Name, Quantity');
      }
    };
    reader.readAsText(file);
    if (retInputRef.current) retInputRef.current.value = '';
  };

  const getReturnStockForSku = (skuId: string) => {
    return state.returns
      .filter(r => r.skuId === skuId)
      .reduce((acc, r) => acc + r.quantity, 0);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.APPROVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case OrderStatus.REJECTED_SPV: 
      case OrderStatus.REJECTED_MANAGER: return 'bg-rose-100 text-rose-700 border-rose-200';
      case OrderStatus.PENDING_SPV: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.PENDING_MANAGER: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // User Password Reset Modal
  const PasswordResetModal = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);

    if (!editingUser) return null;

    const handleReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) { alert("Passwords do not match!"); return; }
      onUpdateUser({ ...editingUser, password: newPassword });
      setSuccess(true);
      setTimeout(() => setEditingUser(null), 1500);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Key className="w-5 h-5" /></div>
              <h3 className="text-xl font-black text-slate-800">Reset Password</h3>
            </div>
            <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
          </div>
          <div className="p-8">
            {success ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-black text-slate-800">Updated!</h4>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                    <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all font-bold" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                    <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all font-bold" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Save New Password</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // User Management Modal
  const UserModal = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password123');
    const [role, setRole] = useState(UserRole.SALES);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddUser({ id: `U${Date.now()}`, username: username.toLowerCase(), name, email, password, role });
      setShowUserModal(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-2xl font-black text-slate-800">Add System User</h3>
            <button onClick={() => setShowUserModal(false)} className="bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-slate-600"><X /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white transition-all font-bold" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Username</label>
              <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white transition-all font-bold" placeholder="e.g. john_sales" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white transition-all font-bold" placeholder="john@company.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">System Role</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white transition-all font-bold">
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-5 mt-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
              <UserPlus className="w-6 h-6" /> Create Account
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {showUserModal && <UserModal />}
      {editingUser && <PasswordResetModal />}

      {needsSync && (
        <div className="bg-emerald-600 text-white p-4 rounded-3xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 px-4">
            {isSyncing ? <RotateCw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            <span className="font-bold">{isSyncing ? 'Synchronizing catalog data...' : 'Data imported successfully! Verify and finalize the sync.'}</span>
          </div>
          <button onClick={handleRefresh} disabled={isSyncing} className="bg-white text-emerald-700 px-6 py-2.5 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50">
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Syncing...' : 'Sync & Finish'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Control Center</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Operational Oversight & Administration</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleRefresh} className="p-4 bg-white text-slate-500 rounded-2xl hover:bg-slate-100 transition-all group border border-slate-200 shadow-sm">
            <RotateCw className={`w-6 h-6 group-hover:rotate-180 transition-transform duration-500 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl shadow-inner border border-slate-200">
            <button onClick={() => setActiveTab('INVENTORY')} className={`px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'INVENTORY' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
              <Boxes className="w-4 h-4" /> Inventory
            </button>
            <button onClick={() => setActiveTab('USERS')} className={`px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
              <Users className="w-4 h-4" /> Personnel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'WH Inventory', val: stats.totalWarehouse, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Returns Log', val: stats.totalReturn, icon: RefreshCw, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Pipeline', val: stats.totalOrders, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Personnel', val: stats.totalUsers, icon: UserCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-lg transition-all">
            <div className={`p-4 rounded-[1.2rem] ${s.bg} group-hover:scale-110 transition-transform`}><s.icon className={`w-7 h-7 ${s.color}`} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-3xl font-black text-slate-900">{s.val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'INVENTORY' ? (
        <div className="space-y-10">
          {/* SUMMARY OVERVIEW TABLE */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-50/20">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3.5 rounded-2xl text-white shadow-xl shadow-slate-200"><BarChart3 className="w-7 h-7" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Sales Fulfillment Overview</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregated Order Activity by Personnel</p>
                </div>
              </div>
              <button 
                onClick={handleExportOrders}
                className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 active:scale-95"
              >
                <DownloadCloud className="w-5 h-5" /> Export All Sales Orders (CSV)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Salesman Username</th>
                    <th className="px-10 py-6">Salesman Name</th>
                    <th className="px-10 py-6">Approval Status</th>
                    <th className="px-10 py-6 text-center">Total Qty Order</th>
                    <th className="px-10 py-6 text-right">Orders Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {salesSummaryList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-medium italic">No sales order data available to summarize.</td>
                    </tr>
                  ) : (
                    salesSummaryList.map((summary, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6"><span className="text-xs font-black text-slate-500 font-mono flex items-center gap-2"><Fingerprint className="w-3.5 h-3.5" />{summary.username}</span></td>
                        <td className="px-10 py-6"><div className="font-bold text-slate-800">{summary.salesName}</div></td>
                        <td className="px-10 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${getStatusColor(summary.status)}`}>
                            {summary.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-center"><span className="text-xl font-black text-blue-600">{summary.totalQty.toLocaleString()}</span></td>
                        <td className="px-10 py-6 text-right"><span className="text-sm font-bold text-slate-400">{summary.orderCount} Order(s)</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STOCK CATALOG */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Database className="w-7 h-7" /></div>
                <div><h2 className="text-2xl font-black text-slate-800">Warehouse Stock</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Master Product Catalog</p></div>
              </div>
              <div className="flex items-center gap-3">
                <input type="file" ref={whInputRef} onChange={handleWhCsv} accept=".csv" className="hidden" />
                <button onClick={() => whInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-4 rounded-[1.2rem] font-black text-xs uppercase flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"><UploadCloud className="w-5 h-5" /> Import Catalog (CSV)</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr><th className="px-10 py-6">Product Details</th><th className="px-10 py-6 text-center">WH Inventory</th><th className="px-10 py-6 text-right">Returns Pending (All Sales)</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.skus.map(sku => (
                    <tr key={sku.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8"><div className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{sku.name}</div><div className="inline-block mt-2 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase border border-slate-200">{sku.id}</div></td>
                      <td className="px-10 py-8 text-center"><span className="text-2xl font-black text-blue-600">{sku.warehouseStock.toLocaleString()}</span></td>
                      <td className="px-10 py-8 text-right"><div className="flex flex-col items-end"><span className="text-2xl font-black text-rose-500">{getReturnStockForSku(sku.id).toLocaleString()}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Summary</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RETURNS LOG */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-xl shadow-rose-100"><RefreshCw className="w-7 h-7" /></div>
                <div><h2 className="text-2xl font-black text-slate-800">Daily Returns Log</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personnel Returns Management</p></div>
              </div>
              <div className="flex items-center gap-3">
                <input type="file" ref={retInputRef} onChange={handleRetCsv} accept=".csv" className="hidden" />
                <button onClick={() => retInputRef.current?.click()} className="bg-rose-600 text-white px-6 py-4 rounded-[1.2rem] font-black text-xs uppercase flex items-center gap-2 hover:bg-rose-700 transition-all shadow-xl shadow-rose-100"><UploadCloud className="w-5 h-5" /> Import Returns (CSV)</button>
                <button onClick={() => setShowCsvHelp({type: 'RET', show: !showCsvHelp.show})} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all"><AlertCircle className="w-5 h-5" /></button>
              </div>
            </div>
            {showCsvHelp.type === 'RET' && showCsvHelp.show && (
              <div className="px-8 py-6 bg-rose-50 border-b border-rose-100">
                <p className="text-xs font-bold text-rose-700 mb-2 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4" /> Format: [SalesUsername, SalesName, SKU_ID, SKU_Name, Quantity]</p>
                <div className="bg-white/50 p-3 rounded-lg font-mono text-xs text-rose-900 border border-rose-200">john_sales, John Sales, SKU001, Premium Espresso Beans 1kg, 12</div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr><th className="px-10 py-6">Username</th><th className="px-10 py-6">Sales Personnel</th><th className="px-10 py-6">Product Information</th><th className="px-10 py-6 text-center">Return Qty</th><th className="px-10 py-6 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.returns.map(record => (
                    <tr key={record.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-10 py-7"><span className="text-xs font-black text-slate-500 font-mono flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" />{record.salesId}</span></td>
                      <td className="px-10 py-7"><div className="font-bold text-slate-800">{record.salesName}</div></td>
                      <td className="px-10 py-7"><div className="text-sm font-bold text-slate-700">{record.skuName}</div><div className="text-[10px] font-black text-slate-400 uppercase mt-1">{record.skuId}</div></td>
                      <td className="px-10 py-7 text-center"><span className="text-2xl font-black text-rose-600">{record.quantity}</span></td>
                      <td className="px-10 py-7 text-right"><button onClick={() => onDeleteReturn(record.id)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-400">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-50/20">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-100"><Users className="w-8 h-8" /></div>
              <div><h2 className="text-2xl font-black text-slate-800">Personnel Directory</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Accounts & Access Control</p></div>
            </div>
            <button onClick={() => setShowUserModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"><UserPlus className="w-5 h-5" /> Create New Account</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr><th className="px-10 py-6">User Identity</th><th className="px-10 py-6">System Username</th><th className="px-10 py-6">Role</th><th className="px-10 py-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300"><UserCircle className="w-8 h-8 text-indigo-400 group-hover:text-white transition-colors" /></div>
                        <div><div className="font-bold text-slate-800 text-lg leading-tight">{u.name}</div><div className="text-[10px] font-black text-slate-400 uppercase mt-1.5"><span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{u.email}</span></div></div>
                      </div>
                    </td>
                    <td className="px-10 py-8"><div className="flex items-center gap-2.5 text-slate-900 font-black text-sm uppercase"><Fingerprint className="w-4 h-4 text-blue-500" /> {u.username}</div></td>
                    <td className="px-10 py-8"><div className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 border shadow-sm ${u.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{u.role}</div></td>
                    <td className="px-10 py-8 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => setEditingUser(u)} className="p-3 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all"><Key className="w-5 h-5" /></button>{state.currentUser?.id !== u.id && (<button onClick={() => window.confirm(`Delete ${u.name}?`) && onDeleteUser(u.id)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
