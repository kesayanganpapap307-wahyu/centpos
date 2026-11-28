export type Category = 'Semua' | 'Makanan' | 'Minuman' | 'Snack' | 'Sembako' | 'Lainnya';
export type CustomerTier = 'customer' | 'agen' | 'member';

export interface Product {
  id: string;
  name: string;
  category: Category;
  barcode: string;
  buyPrice: number;
  sellPrice: number; // Harga Jual Customer Umum
  agentPrice?: number; // Harga Jual Agen / Reseller
  memberPrice?: number; // Harga Jual Member / Khusus
  stock: number;
  unit: string;
  image?: string;
  color?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
  selectedPrice?: number;
  priceTier?: CustomerTier;
}

export type PaymentMethod = 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  cashierName: string;
  customerName: string;
  customerTier?: CustomerTier;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    subtotal: number;
    priceTier?: CustomerTier;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  note?: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  cashierName: string;
  taxPercent: number; // e.g., 0% or 11%
  enableTax: boolean;
  receiptFooter: string;
  currency: string;
  paperSize: '58mm' | '80mm';
  qrisImage?: string; // Data URL or URL of uploaded QRIS
  enableMultiTierPricing?: boolean; // Modul berbayar: Multi-tier harga agen & member
  // Konfigurasi Payment Gateway Midtrans
  midtransClientKey?: string;
  midtransServerKey?: string;
  midtransIsProduction?: boolean;
  multiTierModulePrice?: number; // Biaya lisensi dalam Rupiah (default: 99000)
}

export interface AuthUser {
  id: string;
  display_name: string;
  name?: string;
  email: string;
  username?: string;
  role: 'owner' | 'cashier';
  pin?: string;
  password?: string;
}
