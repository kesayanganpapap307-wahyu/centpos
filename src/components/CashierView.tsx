'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ArrowRight, 
  ShoppingBag, 
  User, 
  Percent, 
  RotateCcw,
  Sparkles,
  Barcode,
  Upload
} from 'lucide-react';
import { Product, CartItem, Category, StoreSettings, Transaction, PaymentMethod, CustomerTier } from '../types/pos';
import { formatCurrency, generateInvoiceNumber } from '../utils/format';

interface CashierViewProps {
  products: Product[];
  onUpdateProductStock: (productId: string, quantityDeducted: number) => void;
  onSaveTransaction: (transaction: Transaction) => void;
  settings: StoreSettings;
  onSaveSettings?: (settings: StoreSettings) => void;
  onOpenReceipt: (transaction: Transaction) => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  onUpdateProductStock,
  onSaveTransaction,
  settings,
  onSaveSettings,
  onOpenReceipt,
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<Category>('Semua');
  const [selectedTier, setSelectedTier] = useState<CustomerTier>('customer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Pelanggan Umum');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  // Helper untuk mendapatkan harga jual berdasarkan tier harga (Customer, Agen, Member)
  const getProductPriceForTier = (product: Product, tier: CustomerTier = selectedTier) => {
    if (tier === 'agen' && product.agentPrice && product.agentPrice > 0) {
      return product.agentPrice;
    }
    if (tier === 'member' && product.memberPrice && product.memberPrice > 0) {
      return product.memberPrice;
    }
    return product.sellPrice;
  };

  const handleTierChange = (newTier: CustomerTier) => {
    setSelectedTier(newTier);
    setCart((prevCart) =>
      prevCart.map((item) => ({
        ...item,
        priceTier: newTier,
        selectedPrice: getProductPriceForTier(item.product, newTier),
      }))
    );
  };

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Sembako', 'Lainnya'];

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const tierPrice = getProductPriceForTier(product, selectedTier);

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart; // limit to stock
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, selectedPrice: tierPrice, priceTier: selectedTier }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  // Barcode quick scan
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const matched = products.find(
      (p) => p.barcode.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (matched && matched.stock > 0) {
      addToCart(matched);
      setSearchQuery('');
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemPrice = item.selectedPrice ?? getProductPriceForTier(item.product, item.priceTier || selectedTier);
      return acc + itemPrice * item.quantity;
    }, 0);
  }, [cart, selectedTier]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    return settings.enableTax ? (taxableAmount * settings.taxPercent) / 100 : 0;
  }, [taxableAmount, settings.enableTax, settings.taxPercent]);

  const totalAmount = Math.round(taxableAmount + taxAmount);

  const changeAmount = Math.max(0, amountPaid - totalAmount);

  // Quick cash buttons based on total
  const quickCashOptions = useMemo(() => {
    if (totalAmount <= 0) return [];
    const baseOptions = [10000, 20000, 50000, 100000, 200000, 500000];
    const higherOptions = baseOptions.filter((opt) => opt >= totalAmount);
    return Array.from(new Set([totalAmount, ...higherOptions])).slice(0, 5);
  }, [totalAmount]);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid(totalAmount);
    setPaymentMethod('TUNAI');
    setIsCheckoutModalOpen(true);
  };

  const handleCompleteTransaction = () => {
    if (amountPaid < totalAmount && paymentMethod === 'TUNAI') {
      alert('Jumlah pembayaran kurang dari total belanja.');
      return;
    }

    const defaultCustomerLabel =
      selectedTier === 'agen'
        ? 'Pelanggan Agen'
        : selectedTier === 'member'
        ? 'Pelanggan Member'
        : 'Pelanggan Umum';

    const transaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date().toISOString(),
      cashierName: settings.cashierName,
      customerName: customerName.trim() || defaultCustomerLabel,
      customerTier: selectedTier,
      items: cart.map((item) => {
        const itemPrice = item.selectedPrice ?? getProductPriceForTier(item.product, item.priceTier || selectedTier);
        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          sellPrice: itemPrice,
          subtotal: itemPrice * item.quantity,
          priceTier: item.priceTier || selectedTier,
        };
      }),
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      amountPaid: paymentMethod === 'TUNAI' ? amountPaid : totalAmount,
      changeAmount: paymentMethod === 'TUNAI' ? changeAmount : 0,
    };

    // Deduct stock for all items
    cart.forEach((item) => {
      onUpdateProductStock(item.product.id, item.quantity);
    });

    onSaveTransaction(transaction);
    setIsCheckoutModalOpen(false);
    clearCart();
    onOpenReceipt(transaction);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden bg-slate-50">
        {/* Search & Barcode Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Cari nama produk atau scan barcode (Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </form>

          {/* Quick Barcode Scanner badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
            <Barcode className="w-4 h-4 text-emerald-600" />
            <span>Barcode Scanner Ready</span>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2" />
              <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci atau kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`relative flex flex-col justify-between text-left p-3.5 rounded-2xl bg-white border transition-all text-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 active:scale-[0.98] ${
                      isOutOfStock ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                    } ${inCart ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}
                  >
                    {/* Badge Stock / InCart */}
                    <div className="flex items-center justify-between gap-1 w-full mb-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          Habis
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">
                          Stok: {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Color dot & Name */}
                    <div className="flex items-start gap-2.5 my-1">
                      <div
                        className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 ${
                          product.color || 'bg-emerald-500'
                        }`}
                      />
                      <h4 className="font-semibold text-sm line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    {/* Price & Cart counter */}
                    {(() => {
                      const tierPrice = getProductPriceForTier(product, selectedTier);
                      const isTierActive = selectedTier !== 'customer' && product.sellPrice !== tierPrice;

                      return (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            {isTierActive ? (
                              <>
                                <span className="text-[10px] line-through text-slate-400 leading-none">
                                  {formatCurrency(product.sellPrice)}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`text-sm font-bold ${
                                    selectedTier === 'agen' ? 'text-blue-700' : 'text-purple-700'
                                  }`}>
                                    {formatCurrency(tierPrice)}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                                    selectedTier === 'agen' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {selectedTier}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-emerald-700">
                                {formatCurrency(product.sellPrice)}
                              </span>
                            )}
                          </div>
                          {inCart && (
                            <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Sidebar */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-full shadow-lg">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Keranjang Kasir</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {cart.reduce((a, b) => a + b.quantity, 0)} item
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Customer Input */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Nama Pelanggan / Meja..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full text-xs bg-transparent border-0 focus:outline-hidden text-slate-700 placeholder-slate-400 font-medium"
          />
        </div>

        {/* Customer Tier / Tipe Harga Switcher */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold text-slate-700">
            <span>Tipe Harga Jual:</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              selectedTier === 'agen'
                ? 'bg-blue-100 text-blue-800'
                : selectedTier === 'member'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {selectedTier === 'agen' ? '🏢 Harga Agen' : selectedTier === 'member' ? '⭐ Harga Member' : '👤 Customer Umum'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleTierChange('customer')}
              className={`py-1.5 px-1.5 rounded-lg border text-center transition-all ${
                selectedTier === 'customer'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleTierChange('agen')}
              className={`py-1.5 px-1.5 rounded-lg border text-center transition-all ${
                selectedTier === 'agen'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🏢 Agen
            </button>
            <button
              type="button"
              onClick={() => handleTierChange('member')}
              className={`py-1.5 px-1.5 rounded-lg border text-center transition-all ${
                selectedTier === 'member'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⭐ Member
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Keranjang Kosong</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px] mt-1">
                Pilih produk dari katalog di sebelah kiri untuk memulai transaksi.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = item.selectedPrice ?? getProductPriceForTier(item.product, item.priceTier || selectedTier);
              const isSpecialTier = item.priceTier && item.priceTier !== 'customer';

              return (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h5>
                      {isSpecialTier && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          item.priceTier === 'agen' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.priceTier}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatCurrency(itemPrice)} / {item.product.unit}
                    </p>
                    <p className="text-xs font-bold text-emerald-700 mt-1">
                      {formatCurrency(itemPrice * item.quantity)}
                    </p>
                  </div>

                {/* Stepper Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold w-6 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 disabled:opacity-40 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center ml-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Cart Summary & Checkout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          {/* Quick Discount Selector */}
          {cart.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1 font-medium">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                Diskon Toko:
              </span>
              <div className="flex gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                      discountPercent === pct
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtotal & Breakdown */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon ({discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {settings.enableTax && (
              <div className="flex justify-between">
                <span>PPN ({settings.taxPercent}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Bayar</span>
              <span className="text-emerald-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-xl shadow-md hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span>Bayar Sekarang (F4)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Pembayaran Kasir</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pelanggan: <span className="font-semibold text-slate-700">{customerName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Total Due Highlight */}
              <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Total Tagihan
                </span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('TUNAI')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                      paymentMethod === 'TUNAI'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>Tunai (Cash)</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('QRIS');
                      setAmountPaid(totalAmount);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-teal-600" />
                    <span>QRIS Statis</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('TRANSFER');
                      setAmountPaid(totalAmount);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>Transfer/Debit</span>
                  </button>
                </div>
              </div>

              {/* Cash specific UI */}
              {paymentMethod === 'TUNAI' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jumlah Uang Diterima
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min={totalAmount}
                        value={amountPaid || ''}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        className="w-full pl-11 pr-4 py-2.5 text-lg font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Chips */}
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                      Pilihan Cepat Uang Pas / Pecahan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickCashOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAmountPaid(opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            amountPaid === opt
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {opt === totalAmount ? 'Uang Pas' : formatCurrency(opt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kembalian Alert */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Uang Kembalian:</span>
                    <span
                      className={`text-lg font-bold ${
                        amountPaid < totalAmount ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {amountPaid < totalAmount
                        ? `Kurang ${formatCurrency(totalAmount - amountPaid)}`
                        : formatCurrency(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS / Transfer details */}
              {paymentMethod === 'QRIS' && (
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-teal-600" />
                      <span>Scan QRIS Kasir Toko</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Total: {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {/* QR Image Box */}
                  <div className="mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-xs max-w-[220px] flex flex-col items-center justify-center">
                    {settings.qrisImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={settings.qrisImage}
                        alt="QRIS Toko"
                        className="w-full max-h-52 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="py-4 text-center text-slate-400">
                        <QrCode className="w-24 h-24 mx-auto text-slate-300 stroke-[1.2] mb-1" />
                        <p className="text-[11px] text-slate-500 font-medium">
                          Foto QRIS belum di-upload
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Upload or Change QRIS directly from Cashier */}
                  {onSaveSettings && (
                    <div className="pt-0.5">
                      <input
                        type="file"
                        id="quick-qris-upload"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 3 * 1024 * 1024) {
                            alert('Ukuran gambar maksimal 3 MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              onSaveSettings({ ...settings, qrisImage: reader.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <label
                        htmlFor="quick-qris-upload"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{settings.qrisImage ? 'Ganti Foto QRIS' : 'Upload Foto QRIS Toko'}</span>
                      </label>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    Mendukung GoPay, OVO, Dana, BCA, Mandiri, ShopeePay
                  </p>
                </div>
              )}

              {paymentMethod === 'TRANSFER' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-semibold text-slate-700">Bank Transfer / EDC Toko:</p>
                  <p className="text-slate-600">BCA: 876-0123-999 a.n CentPOS Toko</p>
                  <p className="text-slate-600">Mandiri: 137-00-9988-1234</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-100"
              >
                Batal
              </button>

              <button
                onClick={handleCompleteTransaction}
                disabled={paymentMethod === 'TUNAI' && amountPaid < totalAmount}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Selesaikan & Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
