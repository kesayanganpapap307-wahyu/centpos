export type Category = 'Semua' | 'Makanan' | 'Minuman' | 'Snack' | 'Sembako' | 'Lainnya';

export interface Product {
  id: string;
  name: string;
  category: Category;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  image?: string;
  color?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
}

export type PaymentMethod = 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  cashierName: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    subtotal: number;
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
}
