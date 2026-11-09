import React from 'react';
import { ShoppingBag, Github, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-800">
                ShopVerse E-Commerce
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Dự án E-Commerce Full-Stack chuẩn mực doanh nghiệp với NestJS, React, Prisma, PostgreSQL và cổng thanh toán trực tuyến VNPAY Sandbox.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Tính năng nổi bật
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li>Xác thực JWT Dual-Token & RBAC</li>
              <li>Bộ lọc đa tiêu chí & Phân trang</li>
              <li>Giao dịch đặt hàng chống Race Condition</li>
              <li>Tích hợp Checksum VNPAY Sandbox</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Công nghệ (Tech Stack)
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li>NestJS + TypeScript</li>
              <li>React 18 + Vite + Tailwind CSS</li>
              <li>PostgreSQL 16 + Prisma ORM</li>
              <li>Docker & GitHub Actions CI</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 ShopVerse Platform. Sẵn sàng cho CV Fresher / Junior Developer.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Bảo mật tiêu chuẩn REST API
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
