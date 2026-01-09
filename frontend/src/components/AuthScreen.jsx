import React, { useState, useEffect } from 'react';
import { Lock, User, Phone, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import api from '../utils/api';

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'collection_boy',
    adminSecret: ''
  });

  useEffect(() => {
    const savedMobile = localStorage.getItem('remembered_mobile');
    if (savedMobile) {
      setFormData(prev => ({ ...prev, mobile: savedMobile }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.mobile || !formData.password) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
    }

    if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
        if (formData.role === 'admin' && formData.adminSecret !== "hithvi02122023") {
            setError("Invalid Admin Secret Key.");
            setLoading(false);
            return;
        }
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { mobile: formData.mobile, password: formData.password }
        : { 
            name: formData.name, 
            mobile: formData.mobile, 
            password: formData.password, 
            role: formData.role 
          };

      const { data } = await api.post(endpoint, payload);
      
      if (rememberMe) {
        localStorage.setItem('remembered_mobile', formData.mobile);
      } else {
        localStorage.removeItem('remembered_mobile');
      }

      localStorage.setItem('finance_user', JSON.stringify(data));
      onLogin(data);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Connection failed. Is the Backend Server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600 skew-y-3 origin-top-left -translate-y-20 z-0"></div>
      
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-10 relative">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Secure Finance Management
          </p>
        </div>

        {error && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-pulse">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="mobile"
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repeat Password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Join As</label>
              <div className="flex gap-2">
                {['collection_boy', 'lender', 'admin'].map((role) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all uppercase ${
                            formData.role === role 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {role === 'collection_boy' ? 'Staff' : role}
                    </button>
                ))}
              </div>
            </div>
          )}

          {!isLogin && formData.role === 'admin' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-red-500 uppercase tracking-wider">Admin Secret Key</label>
              <div className="relative">
                <input
                  type="password"
                  name="adminSecret"
                  placeholder="Enter Secret Code"
                  className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm text-red-700 placeholder:text-red-300"
                  value={formData.adminSecret}
                  onChange={handleChange}
                />
              </div>
              <p className="text-[10px] text-red-400">Only authorized administrators can use this role.</p>
            </div>
          )}

          {isLogin && (
            <div className="flex items-center gap-2">
                <button 
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                    }`}
                >
                    {rememberMe && <Check className="w-3 h-3 text-white" />}
                </button>
                <label className="text-sm text-slate-600 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    Remember Me
                </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}`}
          >
            {loading ? 'Processing...' : (isLogin ? 'LOG IN' : 'REGISTER')}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            {isLogin ? "New to FinancePro?" : "Already have an account?"}
            <button
              onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData(prev => ({ 
                      ...prev, 
                      password: '', 
                      confirmPassword: '', 
                      adminSecret: '' 
                  }));
              }}
              className="ml-2 text-blue-600 font-bold hover:underline focus:outline-none"
            >
              {isLogin ? 'Create Account' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;