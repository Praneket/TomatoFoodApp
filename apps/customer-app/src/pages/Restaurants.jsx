import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiSearch, FiStar, FiClock, FiTruck } from 'react-icons/fi';
import { restaurantAPI } from '../services/api';

const CUISINES = ['All', 'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'American'];
const SORT_OPTIONS = [
  { value: 'rating',        label: '⭐ Top Rated' },
  { value: 'popular',       label: '🔥 Most Popular' },
  { value: 'delivery_time', label: '⚡ Fastest Delivery' },
  { value: 'new',           label: '✨ Newest' },
];

export default function Restaurants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('rating');
  const [vegOnly, setVegOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', search, cuisine, sort, vegOnly, page],
    queryFn: () => restaurantAPI.getAll({
      search: search || undefined,
      cuisine: cuisine !== 'All' ? cuisine : undefined,
      sort, page, limit: 12,
    }),
    placeholderData: (prev) => prev,
  });

  const restaurants = data?.data?.data?.restaurants || [];
  const meta = data?.data?.data?.meta || {};

  return (
    <div className="container-app py-8">
      <h1 className="font-display text-3xl font-bold mb-6 text-gray-900 dark:text-white">Restaurants 🏪</h1>

      {/* Filters */}
      <div className="glass-card p-4 mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search restaurants..." className="input-field pl-10 text-sm" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field sm:w-48 text-sm">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-medium text-green-700 dark:text-green-400">
            <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="accent-green-500" />
            🥗 Veg Only
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CUISINES.map((c) => (
            <button key={c} onClick={() => { setCuisine(c); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                cuisine === c ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="skeleton h-40 rounded-none" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-4 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-xl font-bold mb-2 text-gray-900 dark:text-white">No restaurants found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{meta.total || restaurants.length} restaurants found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className="restaurant-card" onClick={() => navigate(`/restaurants/${r._id}`)}>
                <div className="h-44 bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                  {r.coverImage
                    ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl">🏪</div>}
                  {!r.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold bg-black/60 px-3 py-1 rounded-full text-sm">Closed</span>
                    </div>
                  )}
                  {r.isFeatured && <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">Featured</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-base truncate text-gray-900 dark:text-white">{r.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{r.cuisine?.join(', ')}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-sm">
                      <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{r.rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-gray-400 text-xs">({r.totalRatings || 0})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{r.deliveryTime || 30}m</span>
                      <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" />{r.deliveryFee === 0 ? 'Free' : `₹${r.deliveryFee}`}</span>
                    </div>
                  </div>
                  {r.minOrder > 0 && <p className="text-xs text-gray-400 mt-1">Min order: ₹{r.minOrder}</p>}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                    page === p ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-dark-muted text-gray-900 dark:text-white hover:bg-primary/10'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
