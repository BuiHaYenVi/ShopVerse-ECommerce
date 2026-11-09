import React from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategorySlug?: string;
  onSelectCategory: (slug?: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  isFeaturedOnly: boolean;
  onToggleFeatured: (featured: boolean) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
  sort,
  onSortChange,
  isFeaturedOnly,
  onToggleFeatured,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectCategory(undefined)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            !selectedCategorySlug
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả sản phẩm
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedCategorySlug === cat.slug
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Controls: Featured Toggle & Sort */}
      <div className="flex items-center gap-3">
        {/* Featured Toggle */}
        <button
          onClick={() => onToggleFeatured(!isFeaturedOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
            isFeaturedOnly
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          ⭐ Nổi bật
        </button>

        {/* Sort selector */}
        <div className="relative flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-8 pr-8 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 hover:bg-slate-100 cursor-pointer appearance-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="name_asc">Tên (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
