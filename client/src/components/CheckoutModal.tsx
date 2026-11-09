import React, { useState } from 'react';
import { X, CreditCard, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderCode: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { totalAmount, clearCart } = useCartStore();

  const [formData, setFormData] = useState({
    recipientName: user?.name || '',
    recipientPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    note: '',
    paymentMethod: 'VNPAY', // 'VNPAY' | 'COD'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Create Order with atomic transaction backend
      const order: any = await api.post('/orders', {
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        shippingAddress: formData.shippingAddress,
        note: formData.note,
        paymentMethod: formData.paymentMethod,
      });

      // 2. If VNPAY, generate payment URL and redirect
      if (formData.paymentMethod === 'VNPAY') {
        const paymentRes: any = await api.post(`/payments/create-url/${order.id}`);
        if (paymentRes?.paymentUrl) {
          clearCart();
          window.location.href = paymentRes.paymentUrl;
          return;
        }
      }

      // COD order flow
      await clearCart();
      setIsLoading(false);
      onSuccess(order.orderCode);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-800">
            Thông tin thanh toán & Đặt hàng
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ tên người nhận *
            </label>
            <input
              type="text"
              required
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số điện thoại liên hệ *
            </label>
            <input
              type="tel"
              required
              value={formData.recipientPhone}
              onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              placeholder="0912345678"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Địa chỉ nhận hàng chi tiết *
            </label>
            <input
              type="text"
              required
              value={formData.shippingAddress}
              onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú đơn hàng (nếu có)
            </label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              placeholder="Giao hàng trong giờ hành chính..."
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                  formData.paymentMethod === 'VNPAY'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VNPAY"
                  checked={formData.paymentMethod === 'VNPAY'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'VNPAY' })}
                  className="sr-only"
                />
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold">VNPAY Sandbox</span>
                <span className="text-[10px] text-slate-500">QR / Thẻ ATM / Visa</span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                  formData.paymentMethod === 'COD'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={formData.paymentMethod === 'COD'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                  className="sr-only"
                />
                <Truck className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-bold">Thanh toán COD</span>
                <span className="text-[10px] text-slate-500">Tiền mặt khi nhận hàng</span>
              </label>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Tổng thanh toán</span>
              <span className="text-lg font-black text-slate-900">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : formData.paymentMethod === 'VNPAY' ? (
                'Chuyển tới VNPAY'
              ) : (
                'Xác nhận Đặt hàng'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
