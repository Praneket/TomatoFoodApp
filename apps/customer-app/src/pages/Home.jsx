import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiArrowRight, FiStar, FiClock, FiTruck, FiZap, FiShield, FiSmile } from 'react-icons/fi';
import { catalogAPI, restaurantAPI } from '../services/api';
import { useDispatch } from 'react-redux';
import { setSearchQuery } from '../store';

const CATEGORIES = [
  { name: 'Biryani', emoji: '🍛', gradient: 'from-orange-400 to-red-500' },
  { name: 'Pizza',   emoji: '🍕', gradient: 'from-yellow-400 to-orange-500' },
  { name: 'Burger',  emoji: '🍔', gradient: 'from-amber-400 to-yellow-500' },
  { name: 'Sushi',   emoji: '🍱', gradient: 'from-pink-400 to-rose-500' },
  { name: 'Pasta',   emoji: '🍝', gradient: 'from-green-400 to-teal-500' },
  { name: 'Dessert', emoji: '🍰', gradient: 'from-purple-400 to-pink-500' },
  { name: 'Salad',   emoji: '🥗', gradient: 'from-lime-400 to-green-500' },
  { name: 'Tacos',   emoji: '🌮', gradient: 'from-red-400 to-pink-500' },
];

const STATS = [
  { icon: '🏪', value: '500+',   label: 'Restaurants',  color: 'text-orange-500' },
  { icon: '🍽️', value: '10K+',  label: 'Menu Items',   color: 'text-pink-500' },
  { icon: '🚀', value: '30 min', label: 'Avg Delivery', color: 'text-blue-500' },
  { icon: '⭐', value: '4.8',    label: 'Avg Rating',   color: 'text-amber-500' },
];

const FEATURES = [
  { icon: FiZap,    title: 'Lightning Fast', desc: 'Delivered in 30 minutes or less', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: FiShield, title: '100% Safe',      desc: 'Contactless delivery available',  color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { icon: FiSmile,  title: 'Best Quality',   desc: 'Curated restaurants only',        color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-900/20' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

function Section({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');

  const { data: trendingData }    = useQuery({ queryKey: ['trending'],         queryFn: () => catalogAPI.getTrending(),            staleTime: 1000 * 60 * 5 });
  const { data: restaurantsData } = useQuery({ queryKey: ['restaurants-home'], queryFn: () => restaurantAPI.getAll({ limit: 8 }), staleTime: 1000 * 60 * 5 });

  const trending    = trendingData?.data?.data?.foods || [];
  const restaurants = restaurantsData?.data?.data?.restaurants || [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    dispatch(setSearchQuery(search));
    navigate(`/restaurants?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-hero dark:bg-gradient-dark">

        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.13) 0%, transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(247,197,159,0.22) 0%, transparent 70%)' }}
          />
          {['🍕','🍔','🍛','🍱','🌮','🍰'].map((em, i) => (
            <motion.div key={i} className="absolute text-3xl select-none opacity-[0.15] dark:opacity-[0.08]"
              style={{ top: `${[15,70,25,55,80,40][i]}%`, left: `${[5,88,92,3,45,50][i]}%` }}
              animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
              transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            >{em}</motion.div>
          ))}
        </div>

        <div className="container-app relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

              {/* Live badge */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.12),rgba(247,197,159,0.15))', border: '1px solid rgba(255,107,53,0.2)', color: '#e85520' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                🚀 Fast Delivery in 30 Minutes
              </motion.div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                className="font-display font-black leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)' }}
              >
                Delicious Food,{' '}
                <span className="text-gradient">Delivered Fast</span>
                <br />
                <span className="text-gray-800 dark:text-white">to Your Door 🍅</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg leading-relaxed"
              >
                Order from 500+ restaurants. Track in real-time. Enjoy every bite.
                Your favourite food is just a tap away.
              </motion.p>

              {/* Search bar */}
              <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                onSubmit={handleSearch} className="flex gap-3 mb-10"
              >
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for pizza, biryani, sushi..."
                    className="input-field pl-12 py-4 text-base rounded-2xl shadow-md"
                  />
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  type="submit" className="btn-primary px-7 py-4 text-base rounded-2xl whitespace-nowrap"
                >
                  Search
                </motion.button>
              </motion.form>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="grid grid-cols-4 gap-3"
              >
                {STATS.map(({ icon, value, label, color }) => (
                  <motion.div key={label} whileHover={{ scale: 1.06, y: -3 }}
                    className="text-center p-3 rounded-2xl bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm border border-white/60 dark:border-dark-border shadow-sm"
                  >
                    <div className="text-xl mb-1">{icon}</div>
                    <div className={`font-display font-bold text-base ${color}`}>{value}</div>
                    <div className="text-2xs text-gray-500 dark:text-gray-400 leading-tight">{label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — illustration */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center items-center relative h-[480px]"
            >
              <motion.div animate={{ y: [-14, 14, -14] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[170px] leading-none select-none filter drop-shadow-2xl"
              >🍅</motion.div>

              {[
                { emoji: '🍕', style: { top: '4%',    left: '4%'   }, delay: 0 },
                { emoji: '🍔', style: { top: '4%',    right: '4%'  }, delay: 0.5 },
                { emoji: '🍛', style: { bottom: '8%', left: '4%'   }, delay: 1 },
                { emoji: '🍱', style: { bottom: '8%', right: '4%'  }, delay: 1.5 },
              ].map(({ emoji, style, delay }, i) => (
                <motion.div key={i} className="absolute" style={style}
                  animate={{ y: [-6, 6, -6], rotate: [-4, 4, -4] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/85 dark:bg-dark-card/85 backdrop-blur-sm border border-white/50 dark:border-dark-border shadow-lg flex items-center justify-center text-3xl">
                    {emoji}
                  </div>
                </motion.div>
              ))}

              {/* Delivery badge */}
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-white dark:bg-dark-card shadow-lg border border-primary/15 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-lg">🛵</div>
                <div>
                  <p className="text-xs text-gray-500">Estimated delivery</p>
                  <p className="font-bold text-gray-900 dark:text-white">25–35 min</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ───────────────────────────────────── */}
      <section className="py-10 bg-white dark:bg-dark-card border-y border-gray-100 dark:border-dark-border">
        <div className="container-app">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-16 container-app">
        <Section>
          <div className="flex items-center justify-between mb-8">
            <motion.div variants={fadeUp}>
              <h2 className="section-title">What's on your mind? 🤔</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Pick a category and explore</p>
            </motion.div>
            <motion.button variants={fadeUp} onClick={() => navigate('/restaurants')}
              className="btn-ghost flex items-center gap-2 text-primary font-semibold"
            >
              See all <FiArrowRight />
            </motion.button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.button key={cat.name} variants={fadeUp}
                whileHover={{ scale: 1.1, y: -6 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/restaurants?category=${cat.name}`)}
                className="flex flex-col items-center gap-2.5 group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl shadow-md group-hover:shadow-xl transition-all duration-300`}>
                  {cat.emoji}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        </Section>
      </section>

      {/* ── TRENDING FOODS ────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="py-16" style={{ background: 'linear-gradient(135deg,#fff8f5 0%,#fff0e8 100%)' }}>
          <div className="container-app">
            <Section>
              <div className="flex items-center justify-between mb-8">
                <motion.div variants={fadeUp}>
                  <h2 className="section-title">🔥 Trending Now</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Most ordered in your area</p>
                </motion.div>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                {trending.slice(0, 10).map((food, i) => (
                  <motion.div key={food._id || i} variants={fadeUp}
                    whileHover={{ scale: 1.04, y: -6 }}
                    className="food-card flex-shrink-0 w-44 cursor-pointer"
                    onClick={() => navigate(`/food/${food._id}`)}
                  >
                    <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                      {food.image
                        ? <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                      }
                      {food.isTrending && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-2xs px-2 py-0.5 rounded-full font-bold">🔥 Hot</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">{food.name}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-primary font-bold text-sm">₹{food.price}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {food.rating?.toFixed(1) || '4.5'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>
          </div>
        </section>
      )}

      {/* ── TOP RESTAURANTS ──────────────────────────────────── */}
      <section className="py-16 container-app">
        <Section>
          <div className="flex items-center justify-between mb-8">
            <motion.div variants={fadeUp}>
              <h2 className="section-title">🏪 Top Restaurants</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Handpicked for you</p>
            </motion.div>
            <motion.button variants={fadeUp} onClick={() => navigate('/restaurants')}
              className="btn-ghost flex items-center gap-2 text-primary font-semibold"
            >
              View all <FiArrowRight />
            </motion.button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {restaurants.slice(0, 8).map((r, i) => (
              <motion.div key={r._id || i} variants={fadeUp}
                className="restaurant-card group cursor-pointer"
                onClick={() => navigate(`/restaurants/${r._id}`)}
              >
                <div className="h-44 bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                  {r.coverImage
                    ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl">🏪</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {!r.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-black/60 px-4 py-1.5 rounded-full">Closed</span>
                    </div>
                  )}
                  {r.isFeatured && (
                    <span className="absolute top-3 left-3 bg-gradient-primary text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">⭐ Featured</span>
                  )}
                  {r.deliveryFee === 0 && (
                    <span className="absolute top-3 right-3 bg-success text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">Free Delivery</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">{r.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{r.cuisine?.join(' • ')}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-1.5">
                      <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{r.rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-gray-400 text-xs">({r.totalRatings || 0})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{r.deliveryTime || 30}m</span>
                      <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" />{r.deliveryFee === 0 ? 'Free' : `₹${r.deliveryFee}`}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      </section>

      {/* ── APP DOWNLOAD BANNER ──────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="container-app relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-5xl mb-4">📱</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Get the Tomato App</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto text-lg">Order faster, track in real-time, and get exclusive app-only deals.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {[{ icon: '🍎', store: 'App Store', sub: 'Download on the' }, { icon: '🤖', store: 'Google Play', sub: 'Get it on' }].map(({ icon, store, sub }) => (
                <motion.button key={store} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-6 py-3.5 rounded-2xl hover:bg-white/25 transition-all"
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="text-left">
                    <div className="text-xs opacity-75">{sub}</div>
                    <div className="font-semibold">{store}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
