import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave } from 'react-icons/fi';
import { userAPI } from '../services/api';
import { setCredentials } from '../store';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, accessToken, refreshToken } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.updateProfile(form);
      dispatch(setCredentials({ user: data.data.user, accessToken, refreshToken }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  return (
    <div className="container-app py-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-8 text-gray-900 dark:text-white">My Profile 👤</h1>
      <div className="glass-card p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-3xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mt-1">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'name',  icon: FiUser,  label: 'Full Name',    type: 'text' },
            { key: 'phone', icon: FiPhone, label: 'Phone Number', type: 'tel' },
          ].map(({ key, icon: Icon, label, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-200">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  disabled={!editing} className={`input-field pl-10 ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-200">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="email" value={user?.email} disabled className="input-field pl-10 opacity-60 cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
                <FiSave className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2">
              <FiEdit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-border">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Account Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Loyalty Points', value: user?.loyaltyPoints || 0, icon: '⭐' },
              { label: 'Referral Code',  value: user?.referralCode || 'N/A', icon: '🎁' },
              { label: 'Member Since',   value: user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024', icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="text-center p-3 bg-gray-50 dark:bg-dark-muted rounded-xl">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
