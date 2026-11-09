import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface OrderResultModalProps {
  isOpen: boolean;
  isSuccess: boolean;
  orderCode: string;
  amount?: number;
  message?: string;
  onClose: () => void;
}

export const OrderResultModal: React.FC<OrderResultModalProps> = ({
  isOpen,
  isSuccess,
  orderCode,
  amount,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-slate-800">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán chưa hoàn tất'}
        </h3>

        <p className="text-xs text-slate-500 mt-2">
          {message || (isSuccess ? 'Đơn hàng của bạn đã được ghi nhận và chuyển cho bộ phận đóng gói.' : 'Đã có sự cố trong quá trình giao dịch hoặc đơn hàng bị hủy.')}
        </p>

        <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-slate-800">{orderCode}</span>
          </div>

          {amount !== undefined && amount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Tổng thanh toán:</span>
              <span className="font-bold text-indigo-600">{amount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Cổng thanh toán:</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              VNPAY Sandbox
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition"
        >
          Tiếp tục mua sắm
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
