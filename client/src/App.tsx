import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard, Product } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { AdminOrdersModal } from './components/AdminOrdersModal';
import { OrderResultModal } from './components/OrderResultModal';
import { Footer } from './components/Footer';
import { api } from './services/api';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Loader2,
  X,
  ShoppingCart,
} from 'lucide-react';

export const App: React.FC = () => {
  const { initAuth, isAuthenticated } = useAuthStore();
  const { fetchCart, addItem } = useCartStore();

  // Query States
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<any>({
    page: 1,
    limit: 8,
    totalItems: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>();
  const [sort, setSort] = useState('newest');
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Modals & Drawers
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOrdersOpen, setIsAdminOrdersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Order Result Modal State (e.g. from VNPAY redirect)
  const [orderResult, setOrderResult] = useState<{
    isOpen: boolean;
    isSuccess: boolean;
    orderCode: string;
    amount?: number;
    message?: string;
  }>({
    isOpen: false,
    isSuccess: false,
    orderCode: '',
  });

  // 1. Initial auth & cart restore
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, isAuthenticated]);

  // 2. Detect VNPAY return redirect in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSuccessParam = params.get('isSuccess');
    const orderCodeParam = params.get('orderCode');
    const amountParam = params.get('amount');
    const messageParam = params.get('message');

    if (isSuccessParam !== null && orderCodeParam) {
      setOrderResult({
        isOpen: true,
        isSuccess: isSuccessParam === 'true',
        orderCode: orderCodeParam,
        amount: amountParam ? Number(amountParam) : undefined,
        message: messageParam || undefined,
      });

      // Clean URL params without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 3. Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data: any = await api.get('/categories');
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  // 4. Fetch products with debounce
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const params: Record<string, any> = {
          page: currentPage,
          limit: 8,
          sort,
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategorySlug) params.categorySlug = selectedCategorySlug;
        if (isFeaturedOnly) params.isFeatured = true;

        const res: any = await api.get('/products', { params });
        setProducts(res.items || []);
        setPaginationMeta(res.meta || { page: 1, limit: 8, totalItems: 0, totalPages: 1 });
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [search, selectedCategorySlug, sort, isFeaturedOnly, currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Hệ thống Demo E-Commerce Full-Stack - Tích hợp cổng thanh toán VNPAY Sandbox</span>
      </div>

      {/* Navbar */}
      <Navbar
        onSearchChange={(kw) => {
          setSearch(kw);
          setCurrentPage(1);
        }}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onOpenAdminOrders={() => setIsAdminOrdersOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-8 sm:p-12 mb-8 text-white overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4 border border-white/10">
              Công nghệ & Thời trang 2026
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Khám phá Thế giới Mua sắm Thông minh tại ShopVerse
            </h1>
            <p className="mt-3 text-sm text-indigo-100/90 leading-relaxed">
              Trải nghiệm mua hàng trực tuyến mượt mà với tính năng tìm kiếm, phân loại linh hoạt và thanh toán tức thì qua cổng VNPAY.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Filters */}
        <ProductFilters
          categories={categories}
          selectedCategorySlug={selectedCategorySlug}
          onSelectCategory={(slug) => {
            setSelectedCategorySlug(slug);
            setCurrentPage(1);
          }}
          sort={sort}
          onSortChange={(s) => setSort(s)}
          isFeaturedOnly={isFeaturedOnly}
          onToggleFeatured={(feat) => {
            setIsFeaturedOnly(feat);
            setCurrentPage(1);
          }}
          onPriceChange={() => {}}
        />

        {/* Product Grid */}
        {isLoadingProducts ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-semibold">Đang tải danh sách sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={(product) => setSelectedProduct(product)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {paginationMeta.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: paginationMeta.totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}

                <button
                  disabled={currentPage >= paginationMeta.totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(paginationMeta.totalPages, p + 1))
                  }
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-square bg-slate-100">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase">
                    {selectedProduct.category?.name || 'Sản phẩm'}
                  </span>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mt-2">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {selectedProduct.description}
                </p>
                <div className="mt-4">
                  <span className="text-xs text-slate-400 block font-medium">Tình trạng:</span>
                  <span
                    className={`text-xs font-bold ${
                      selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {selectedProduct.stock > 0
                      ? `Còn hàng (${selectedProduct.stock} sản phẩm)`
                      : 'Hết hàng'}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Đơn giá:</span>
                  <span className="text-lg font-black text-slate-900">
                    {Number(selectedProduct.price).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  disabled={selectedProduct.stock <= 0}
                  onClick={() => {
                    addItem(selectedProduct, 1);
                    setSelectedProduct(null);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        onCheckout={() => {
          if (!isAuthenticated) {
            setAuthModal({ isOpen: true, mode: 'login' });
          } else {
            setIsCheckoutOpen(true);
          }
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(orderCode) => {
          setIsCheckoutOpen(false);
          setOrderResult({
            isOpen: true,
            isSuccess: true,
            orderCode,
            message: 'Đơn hàng COD của bạn đã được tiếp nhận thành công!',
          });
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
      />

      {/* Admin Orders Modal */}
      <AdminOrdersModal
        isOpen={isAdminOrdersOpen}
        onClose={() => setIsAdminOrdersOpen(false)}
      />

      {/* Order Result Modal */}
      <OrderResultModal
        isOpen={orderResult.isOpen}
        isSuccess={orderResult.isSuccess}
        orderCode={orderResult.orderCode}
        amount={orderResult.amount}
        message={orderResult.message}
        onClose={() => setOrderResult((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
