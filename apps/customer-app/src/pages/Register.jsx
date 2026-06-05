import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'customer',          label: '🛒 Customer',          desc: 'Order food' },
  { value: 'restaurant_owner',  label: '🏪 Restaurant Owner',  desc: 'Manage restaurant' },
  { value: 'delivery_partner',  label: '🛵 Delivery Partner',  desc: 'Deliver orders' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [showPass, setShowPass]  = useState(false);
  const [loading, setLoading]    = useState(false);
  const [errors, setErrors]      = useState({});

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Please verify your email. 📧');
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.error?.details?.[0]?.msg;
      toast.error(detail || err.response?.data?.error?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name',  icon: FiUser,  type: 'text',  placeholder: 'Full Name',       label: 'Full Name' },
    { key: 'email', icon: FiMail,  type: 'email', placeholder: 'you@example.com', label: 'Email' },
    { key: 'phone', icon: FiPhone, type: 'tel',   placeholder: '+91 9876543210',   label: 'Phone (optional)' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-hero dark:bg-gradient-dark">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)' }}
        />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(247,197,159,0.2) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 sm:p-10">

          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍅</div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Join thousands of food lovers</p>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-dark-border rounded-2xl py-3.5 px-4 hover:bg-gray-50 dark:hover:bg-dark-muted transition-all font-medium text-sm mb-6 text-gray-700 dark:text-gray-200"
          >
            <FcGoogle className="w-5 h-5" /> Continue with Google
          </motion.button>

          <div className="divider mb-6">or register with email</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, icon: Icon, type, placeholder, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={`input-field pl-11 ${errors[key] ? 'border-red-400' : ''}`}
                  />
                </div>
                {errors[key] && <p className="text-red-500 text-xs mt-1.5">⚠ {errors[key]}</p>}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-400' : ''}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.password}</p>}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setForm({ ...form, role: value })}
                    className={`p-3 rounded-xl border-2 text-center transition-all text-xs font-medium ${
                      form.role === value
                        ? 'border-primary bg-primary/8 text-primary'
                        : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-primary/40'
                    }`}
                  >
                    <div className="text-lg mb-1">{label.split(' ')[0]}</div>
                    <div className="font-semibold">{label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-gray-400 text-2xs mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="btn-primary w-full py-4 text-base rounded-2xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creating account...
                </span>
              ) : 'Create Account 🎉'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
