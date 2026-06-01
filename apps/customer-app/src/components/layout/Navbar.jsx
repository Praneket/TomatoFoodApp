import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiUser, FiSun, FiMoon, FiMenu, FiX,
  FiSearch, FiLogOut, FiPackage, FiMessageCircle, FiHeart,
  FiChevronDown,
} from 'react-icons/fi';
import { toggleTheme, logout, setSearchQuery } from '../../store';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/ai-chat',     label: '✨ AI Chat' },
];

export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, accessToken } = useSelector((s) => s.auth);
  const { theme, searchQuery } = useSelector((s) => s.ui);
  const { items } = useSelector((s) => s.cart);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!localSearch.trim()) return;
    dispatch(setSearchQuery(localSearch));
    navigate(`/restaurants?search=${encodeURIComponent(localSearch)}`);
    setSearchOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setProfileOpen(false);
    toast.success('See you soon! 👋');
    navigate('/');
  };

  const cartCount = items?.length || 0;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-dark/80 backdrop-blur-xl shadow-md border-b border-primary/10'
            : 'bg-white/95 dark:bg-dark/95 border-b border-gray-100 dark:border-dark-border'
        }`}
      >
        <div className="container-app">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <motion.span
                whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
                className="text-2xl select-none"
              >
                🍅
              </motion.span>
              <span className="font-display font-bold text-xl text-gradient">Tomato</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === to
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
              <div className="relative w-full">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search food, restaurants..."
                  className="input-field pl-10 pr-4 py-2.5 text-sm rounded-xl"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1">

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden btn-ghost p-2.5 rounded-xl"
              >
                <FiSearch className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(toggleTheme())}
                className="btn-ghost p-2.5 rounded-xl"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark'
                      ? <FiSun className="w-5 h-5 text-amber-400" />
                      : <FiMoon className="w-5 h-5" />
                    }
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {/* Cart */}
              <Link to="/cart" className="relative btn-ghost p-2.5 rounded-xl">
                <FiShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-0.5 -right-0.5 bg-gradient-primary text-white text-2xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Auth */}
              {accessToken ? (
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <FiChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="absolute right-0 mt-2 w-56 z-50 overflow-hidden"
                          style={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,107,53,0.12)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(255,107,53,0.1)',
                          }}
                        >
                          {/* User info */}
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-1.5">
                            {[
                              { to: '/profile',  icon: FiUser,          label: 'My Profile' },
                              { to: '/orders',   icon: FiPackage,       label: 'My Orders' },
                              { to: '/ai-chat',  icon: FiMessageCircle, label: 'AI Assistant' },
                            ].map(({ to, icon: Icon, label }) => (
                              <Link key={to} to={to} onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                <Icon className="w-4 h-4 text-primary/70" />
                                {label}
                              </Link>
                            ))}
                          </div>

                          <div className="border-t border-gray-100 dark:border-dark-border py-1.5">
                            <button onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"
                            >
                              <FiLogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login"    className="btn-ghost text-sm px-4 py-2">Login</Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden btn-ghost p-2.5 rounded-xl"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={menuOpen ? 'x' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden pb-3"
              >
                <form onSubmit={handleSearch} className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    autoFocus
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search food, restaurants..."
                    className="input-field pl-10 text-sm"
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-gray-100 dark:border-dark-border"
              >
                <div className="py-4 space-y-1">
                  {NAV_LINKS.map(({ to, label }) => (
                    <Link key={to} to={to}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                  {!accessToken && (
                    <div className="flex gap-2 pt-2 px-1">
                      <Link to="/login"    className="btn-secondary flex-1 text-center text-sm py-2.5">Login</Link>
                      <Link to="/register" className="btn-primary flex-1 text-center text-sm py-2.5">Sign Up</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </>
  );
}
