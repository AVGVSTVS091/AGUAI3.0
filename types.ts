export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 encoded content
  description: string;
  uploadDate: string; // ISO string
}

export interface FollowUp {
  id: string;
  timestamp: string; // ISO string
}

export interface Note {
  id: string;
  content: string;
  lastUpdated: string; // ISO string
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

export type PriceListType = 'distributor' | 'consumer' | 'company' | 'cost';

export interface PriceList {
  type: PriceListType;
  fileName: string;
  uploadDate: string;
  products: Product[];
}

export interface BudgetItem {
  product: Product;
  quantity: number;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // ISO string
  items: BudgetItem[];
  discount: number; // Percentage
  subtotal: number;
  total: number;
}

export interface Client {
  id: string;
  companyName: string;
  countryCode: string;
  phoneNumber: string;
  industry: string;
  rating: number; // 0-5
  followUps: FollowUp[];
  quotes: FileRecord[];
  invoices: FileRecord[];
  notes: Note[];
  whatsAppStatus: 'unknown' | 'checking' | 'available' | 'unavailable';
  nextFollowUpDate: string | null; // ISO string
  isPaused: boolean;
  pausedTimeLeft: number | null; // Time left in milliseconds when paused
  status: 'active' | 'suspended';
  budgets: Budget[];
  clientType: 'A' | 'B' | 'C' | 'D' | null;
}