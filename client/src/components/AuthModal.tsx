import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginAction = useAuthStore((s) => s.login);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const data: any = await api.post('/auth/login', { email, password });
        loginAction(data);
        setIsLoading(false);
        onClose();
      } else {
        const data: any = await api.post('/auth/register', {
          email,
          password,
          name,
          phone: phone || undefined,
          address: address || undefined,
        });
        loginAction(data);
        setIsLoading(false);
        onClose();
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Thao tác không thành công. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                  placeholder="Nguyễn Văn A"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                placeholder="customer@shopverse.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu *</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                placeholder="Tối thiểu 6 ký tự"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                    placeholder="0912345678"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                    placeholder="Quận 1, TP. Hồ Chí Minh"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : mode === 'login' ? (
              'Đăng nhập'
            ) : (
              'Tạo tài khoản'
            )}
          </button>

          {mode === 'login' && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Tài khoản mẫu: <span className="font-semibold text-slate-600">customer@shopverse.com</span> / <span className="font-semibold text-slate-600">Password123!</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
