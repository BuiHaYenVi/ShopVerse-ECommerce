import React, { useState } from 'react';
import { ShoppingCart, Check, Star } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  imageUrl: string;
  isFeatured?: boolean;
  category?: { id: string; name: string; slug: string };
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const formattedPrice = Number(product.price).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    await addItem(product, 1);
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Nổi bật
          </span>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category && (
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              {product.category.name}
            </span>
          )}
          <h3 className="mt-1 text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Giá bán</span>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {formattedPrice}
            </span>
          </div>

          <button
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
            className={`p-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${
              product.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdding
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
            }`}
            title="Thêm vào giỏ"
          >
            {isAdding ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
