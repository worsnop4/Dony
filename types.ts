
export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  SPV = 'SPV',
  MANAGER = 'MANAGER'
}

export enum OrderStatus {
  NEW = 'NEW',
  PENDING_SPV = 'PENDING_SPV',
  PENDING_MANAGER = 'PENDING_MANAGER',
  APPROVED = 'APPROVED',
  REJECTED_SPV = 'REJECTED_SPV',
  REJECTED_MANAGER = 'REJECTED_MANAGER'
}

export enum OrderType {
  REGULAR = 'REGULAR',
  ADDITIONAL = 'ADDITIONAL'
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface SKU {
  id: string;
  name: string;
  warehouseStock: number;
}

export interface ReturnRecord {
  id: string;
  salesId: string; // This corresponds to the username or unique ID from the import
  salesName: string;
  skuId: string;
  skuName: string;
  quantity: number;
  createdAt: string;
}

export interface OrderItem {
  skuId: string;
  skuName: string;
  quantity: number;
}

export interface Order {
  id: string;
  salesId: string;
  salesName: string;
  type: OrderType;
  items: OrderItem[];
  status: OrderStatus;
  poFile?: string; 
  rejectionMessage?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  toUserId?: string;
  toRole?: UserRole;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  skus: SKU[];
  orders: Order[];
  returns: ReturnRecord[];
  notifications: Notification[];
}
