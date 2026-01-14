
import React, { useState, useEffect } from 'react';
import { UserRole, AppState, User, SKU, Order, OrderStatus, ReturnRecord, Notification } from './types';
import Login from './views/Login';
import AdminDashboard from './views/Admin/AdminDashboard';
import SalesDashboard from './views/Sales/SalesDashboard';
import ApproverDashboard from './views/Approver/ApproverDashboard';
import Navbar from './components/Navbar';

const INITIAL_SKUS: SKU[] = [
  { id: 'SKU001', name: 'Premium Espresso Beans 1kg', warehouseStock: 150 },
  { id: 'SKU002', name: 'Dairy Milk 1L (Pack of 12)', warehouseStock: 80 },
  { id: 'SKU003', name: 'Caramel Syrup 750ml', warehouseStock: 200 },
  { id: 'SKU004', name: 'Paper Cups 8oz (1000pcs)', warehouseStock: 45 },
];

const INITIAL_USERS: User[] = [
  { id: 'U01', username: 'admin', name: 'Admin User', email: 'admin@company.com', password: 'password123', role: UserRole.ADMIN },
  { id: 'U02', username: 'john_sales', name: 'John Sales', email: 'john@company.com', password: 'password123', role: UserRole.SALES },
  { id: 'U03', username: 'jane_sales', name: 'Jane Sales', email: 'jane@company.com', password: 'password123', role: UserRole.SALES },
  { id: 'U04', username: 'sarah_spv', name: 'Sarah Supervisor', email: 'sarah@company.com', password: 'password123', role: UserRole.SPV },
  { id: 'U05', username: 'mike_mgr', name: 'Mike Manager', email: 'mike@company.com', password: 'password123', role: UserRole.MANAGER },
];

const INITIAL_RETURNS: ReturnRecord[] = [
  { id: 'RET-001', salesId: 'john_sales', salesName: 'John Sales', skuId: 'SKU001', skuName: 'Premium Espresso Beans 1kg', quantity: 5, createdAt: new Date().toISOString() },
  { id: 'RET-002', salesId: 'jane_sales', salesName: 'Jane Sales', skuId: 'SKU002', skuName: 'Dairy Milk 1L (Pack of 12)', quantity: 2, createdAt: new Date().toISOString() },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('sales_flow_state_v6');
    if (saved) return JSON.parse(saved);
    return {
      currentUser: null,
      users: INITIAL_USERS,
      skus: INITIAL_SKUS,
      orders: [],
      returns: INITIAL_RETURNS,
      notifications: []
    };
  });

  useEffect(() => {
    localStorage.setItem('sales_flow_state_v6', JSON.stringify(state));
  }, [state]);

  const addNotification = (notif: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `NT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
  };

  const markNotificationsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => {
        const isForMe = n.toUserId === prev.currentUser?.id || n.toRole === prev.currentUser?.role;
        return isForMe ? { ...n, isRead: true } : n;
      })
    }));
  };

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const updateSkus = (newSkus: SKU[]) => {
    setState(prev => ({ ...prev, skus: newSkus }));
  };

  const setReturns = (newReturns: ReturnRecord[]) => {
    setState(prev => ({ ...prev, returns: newReturns }));
  };

  const triggerSyncNotification = () => {
    addNotification({
      toRole: UserRole.SALES,
      title: 'Inventory Synchronized',
      message: 'Admin has updated the stock and returns catalog. Please verify your dashboard.',
      type: 'INFO'
    });
  };

  const addReturnRecord = (record: ReturnRecord) => {
    setState(prev => ({ ...prev, returns: [...prev.returns, record] }));
  };

  const deleteReturnRecord = (id: string) => {
    setState(prev => ({ ...prev, returns: prev.returns.filter(r => r.id !== id) }));
  };

  const addUser = (user: User) => {
    setState(prev => ({ ...prev, users: [...prev.users, user] }));
  };

  const deleteUser = (id: string) => {
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
  };

  const updateUser = (updatedUser: User) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    }));
  };

  const addOrder = (order: Order) => {
    setState(prev => ({ ...prev, orders: [...prev.orders, order] }));
    addNotification({
      toRole: UserRole.SPV,
      title: 'New Order Submission',
      message: `${order.salesName} has submitted a new order (${order.id}). Pending your review.`,
      type: 'ALERT'
    });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, message?: string) => {
    const order = state.orders.find(o => o.id === orderId);
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => 
        o.id === orderId ? { ...o, status, rejectionMessage: message } : o
      )
    }));

    if (!order) return;

    // Notify Manager when SPV approves
    if (status === OrderStatus.PENDING_MANAGER) {
      addNotification({
        toRole: UserRole.MANAGER,
        title: 'Order Reviewed by SPV',
        message: `Order ${orderId} from ${order.salesName} has been reviewed by Supervisor and is pending Manager approval.`,
        type: 'INFO'
      });
    }

    // Notify Admin when Manager approves
    if (status === OrderStatus.APPROVED) {
      addNotification({
        toRole: UserRole.ADMIN,
        title: 'Order Final Approval',
        message: `Manager has approved order ${orderId} from ${order.salesName}. Ready for processing.`,
        type: 'SUCCESS'
      });
      // Also notify the sales person
      addNotification({
        toUserId: order.salesId,
        title: 'Order Approved',
        message: `Your order ${orderId} has received final approval from the Manager.`,
        type: 'SUCCESS'
      });
    }

    // Notify Sales if rejected
    if (status === OrderStatus.REJECTED_SPV || status === OrderStatus.REJECTED_MANAGER) {
      addNotification({
        toUserId: order.salesId,
        title: 'Order Rejected',
        message: `Your order ${orderId} was rejected. Reason: ${message || 'No details provided.'}`,
        type: 'ALERT'
      });
    }
  };

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} users={state.users} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={state.currentUser} 
        onLogout={handleLogout} 
        notifications={state.notifications}
        onMarkRead={markNotificationsRead}
      />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {state.currentUser.role === UserRole.ADMIN && (
          <AdminDashboard 
            state={state} 
            onUpdateSkus={updateSkus}
            onSetReturns={setReturns}
            onAddReturn={addReturnRecord}
            onDeleteReturn={deleteReturnRecord}
            onAddUser={addUser}
            onDeleteUser={deleteUser}
            onUpdateUser={updateUser}
            onTriggerSyncNotif={triggerSyncNotification}
          />
        )}
        {state.currentUser.role === UserRole.SALES && (
          <SalesDashboard state={state} onAddOrder={addOrder} />
        )}
        {(state.currentUser.role === UserRole.SPV || state.currentUser.role === UserRole.MANAGER) && (
          <ApproverDashboard state={state} onUpdateStatus={updateOrderStatus} />
        )}
      </main>
    </div>
  );
};

export default App;
