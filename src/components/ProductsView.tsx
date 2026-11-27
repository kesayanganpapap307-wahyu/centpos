'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Package, 
  Barcode,
  LayoutGrid,
  List,
  Lock
} from 'lucide-react';
import { Product, Category, StoreSettings } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { UpgradeModal } from './UpgradeModal';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  settings?: StoreSettings;
  onSaveSettings?: (settings: StoreSettings) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  settings,
  onSaveSettings,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Makanan');
  const [barcode, setBarcode] = useState('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [agentPrice, setAgentPrice] = useState<number | undefined>(undefined);
  const [memberPrice, setMemberPrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(0);
  const [unit, setUnit] = useState('pcs');

  const categories: Category[] = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Sembako', 'Lainnya'];

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    return matchCat && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Makanan');
    setBarcode(`899${Math.floor(1000 + Math.random() * 9000)}`);
    setBuyPrice(0);
    setSellPrice(0);
    setAgentPrice(undefined);
    setMemberPrice(undefined);
    setStock(10);
    setUnit('pcs');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setBarcode(p.barcode);
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setAgentPrice(p.agentPrice);
    setMemberPrice(p.memberPrice);
    setStock(p.stock);
    setUnit(p.unit);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAgent = agentPrice && agentPrice > 0 ? agentPrice : undefined;
    const finalMember = memberPrice && memberPrice > 0 ? memberPrice : undefined;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        category,
        barcode: barcode.trim(),
        buyPrice,
        sellPrice,
        agentPrice: finalAgent,
        memberPrice: finalMember,
        stock,
        unit: unit.trim() || 'pcs',
      });
    } else {
      const colors = [
        'bg-amber-500',
        'bg-emerald-500',
        'bg-cyan-500',
        'bg-orange-500',
        'bg-red-500',
        'bg-yellow-500',
        'bg-rose-500',
        'bg-stone-500',
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddProduct({
        id: `prd-${Date.now()}`,
        name: name.trim(),
        category,
        barcode: barcode.trim() || `899${Date.now().toString().slice(-4)}`,
        buyPrice,
        sellPrice,
        agentPrice: finalAgent,
        memberPrice: finalMember,
        stock,
        unit: unit.trim() || 'pcs',
        color: randomColor,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-3 sm:space-y-5 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            <span>Manajemen Produk &amp; Stok</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Kelola katalog harga, barcode SKU, dan jumlah stok barang di toko
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau kode barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Bar & View Mode Toggle */}
        <div className="flex items-center justify-between gap-2 w-full max-w-full overflow-hidden">
          {/* Scrollable Categories on Mobile */}
          <div className="flex-1 overflow-x-auto pb-1 scrollbar-none flex gap-1.5 min-w-0 pr-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Toggle View Mode (Kartu vs Tabel) - Always Visible on Screen */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Tampilan Kartu Modern"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Tampilan Tabel Spreadsheet"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. VIEW MODE: KARTU MODERN (Card Grid) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-400 text-xs sm:text-sm shadow-xs">
              Tidak ada produk yang sesuai kriteria pencarian.
            </div>
          ) : (
            filtered.map((item) => {
              const isLow = item.stock > 0 && item.stock <= 10;
              const isOut = item.stock <= 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 w-full max-w-full overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            item.color || 'bg-emerald-500'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                            {item.name}
                          </h4>
                          <span className="inline-block mt-0.5 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          isOut
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut && <AlertTriangle className="w-3 h-3" />}
                        {item.stock} {item.unit}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.barcode}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-2.5 border-t border-slate-100 gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Harga Customer</span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                        {formatCurrency(item.sellPrice)}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.agentPrice && item.agentPrice > 0 ? (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded">
                            Agen: {formatCurrency(item.agentPrice)}
                          </span>
                        ) : null}
                        {item.memberPrice && item.memberPrice > 0 ? (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1 py-0.5 rounded">
                            Member: {formatCurrency(item.memberPrice)}
                          </span>
                        ) : null}
                      </div>
                      {item.buyPrice > 0 && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                          Modal: {formatCurrency(item.buyPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-lg transition-colors active:scale-95"
                        title="Edit Produk"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin hapus produk "${item.name}"?`)) {
                            onDeleteProduct(item.id);
                          }
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors active:scale-95"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. VIEW MODE: TABEL SPREADSHEET */}
      {viewMode === 'table' && (
        <div className="space-y-2 w-full max-w-full overflow-hidden">
          {/* Mobile swipe hint */}
          <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            <span>👉 Geser tabel ke samping untuk melihat harga &amp; aksi</span>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full max-w-full">
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[580px]">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Nama Produk</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Barcode/SKU</th>
                  <th className="px-4 py-3.5 text-right">Harga Modal</th>
                  <th className="px-4 py-3.5 text-right">Harga Jual</th>
                  <th className="px-4 py-3.5 text-center">Stok</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada produk yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isLow = item.stock > 0 && item.stock <= 10;
                    const isOut = item.stock <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-3 h-3 rounded-full shrink-0 ${
                                item.color || 'bg-emerald-500'
                              }`}
                            />
                            <span className="font-semibold text-slate-900 text-sm">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.barcode}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-500">
                          {formatCurrency(item.buyPrice)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          <div>{formatCurrency(item.sellPrice)}</div>
                          {item.agentPrice && item.agentPrice > 0 ? (
                            <div className="text-[10px] text-blue-700 font-medium">
                              Agen: {formatCurrency(item.agentPrice)}
                            </div>
                          ) : null}
                          {item.memberPrice && item.memberPrice > 0 ? (
                            <div className="text-[10px] text-purple-700 font-medium">
                              Member: {formatCurrency(item.memberPrice)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut && <AlertTriangle className="w-3 h-3" />}
                            {item.stock} {item.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Edit Produk"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin hapus produk "${item.name}"?`)) {
                                  onDeleteProduct(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-base font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Susu Aren"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="Makanan">Makanan</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Snack">Snack</option>
                      <option value="Sembako">Sembako</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                    <input
                      type="text"
                      placeholder="pcs / cup / porsi"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Barcode / SKU</label>
                  <input
                    type="text"
                    placeholder="899..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Harga Modal (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Harga Customer Umum (Rp) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Tingkatan Harga Jual (Agen / Member) */}
                <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="block font-bold text-slate-800 text-xs">
                      Tingkatan Harga Khusus (Opsional):
                    </span>
                    {!settings?.enableMultiTierPricing && (
                      <button
                        type="button"
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-2xs"
                      >
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        <span>Modul Terkunci (Buka PRO)</span>
                      </button>
                    )}
                  </div>

                  {!settings?.enableMultiTierPricing ? (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-center space-y-2">
                      <p className="text-[11px] text-amber-900 font-medium">
                        🔒 Penetapan harga khusus <b>Agen &amp; Member</b> memerlukan <b>Modul Multi-Tier Pricing</b>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                      >
                        Beli / Buka Kunci Modul (Rp 99.000)
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                            🏢 Harga Agen / Reseller (Rp)
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Contoh: 15000"
                            value={agentPrice ?? ''}
                            onChange={(e) => setAgentPrice(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                            ⭐ Harga Member / VIP (Rp)
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Contoh: 16500"
                            value={memberPrice ?? ''}
                            onChange={(e) => setMemberPrice(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-purple-700 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        * Biarkan kosong jika produk ini ingin tetap menggunakan harga customer umum.
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Stok Awal</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Sticky Footer Buttons */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium text-xs hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade / Paywall Modal Modul Multi-Tier Pricing */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUnlock={() => {
          if (settings && onSaveSettings) {
            onSaveSettings({ ...settings, enableMultiTierPricing: true });
          }
        }}
        storeName={settings?.storeName}
      />
    </div>
  );
};
