import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiClock, FiTruck, FiPlus, FiMinus, FiHeart, FiShare2, FiMapPin } from 'react-icons/fi';
import { restaurantAPI, cartAPI } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../store';
import toast from 'react-hot-toast';

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((s) => s.auth);
  const cart = useSelector((s) => s.cart);
  const [activeCategory, setActiveCategory] = useState('All');
  const [addingItem, setAddingItem] = useState(null);
  const [liked, setLiked] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantAPI.getById(id),
  });

  const restaurant = data?.data?.data?.restaurant;
  const categories = restaurant ? ['All', ...new Set(restaurant.menu?.map((i) => i.category))] : [];
  const filteredMenu = restaurant?.menu?.filter((i) => activeCategory === 'All' || i.category === activeCategory) || [];
  const getItemQty = (foodId) => cart.items?.find((i) => i.foodId === foodId)?.quantity || 0;

  const handleAddToCart = async (item) => {
    if (!accessToken) { navigate('/login'); return; }
    setAddingItem(item._id);
    try {
      const { data: cartData } = await cartAPI.add({
        foodId: item._id, name: item.name,
        price: item.discountPrice || item.price,
        image: item.image, restaurantId: id, quantity: 1,
      });
      dispatch(setCart(cartData.data));
      toast.success(`${item.name} added! 🛒`);
    } catch (err) {
      if (err.response?.status === 409) {
        toast(
          (t) => (
            <span className="flex flex-col gap-2">
              <span>Cart has items from another restaurant. Clear and add?</span>
              <span className="flex gap-2">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    await cartAPI.clear();
                    const { data: cartData } = await cartAPI.add({
                      foodId: item._id, name: item.name,
                      price: item.discountPrice || item.price,
                      image: item.image, restaurantId: id, quantity: 1,
                    });
                    dispatch(setCart(cartData.data));
                    toast.success(`${item.name} added! 🛒`);
                  }}
                  className="bg-primary text-white text-xs px-3 py-1 rounded-lg"
                >Clear & Add</button>
                <button onClick={() => toast.dismiss(t.id)} className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-lg">Cancel</button>
              </span>
            </span>
          ),
          { duration: 8000 }
        );
      } else { toast.error(err.response?.data?.error?.message || 'Failed to add item'); }
    } finally { setAddingItem(null); }
  };

  const handleUpdateQty = async (foodId, quantity) => {
    try {
      const { data: cartData } = await cartAPI.update({ foodId, quantity });
      dispatch(setCart(cartData.data));
    } catch { toast.error('Failed to update cart'); }
  };

  if (isLoading) return (
    <div className="container-app py-8 space-y-4">
      <div className="skeleton h-72 rounded-3xl" />
      <div className="skeleton h-8 w-1/3 rounded-xl" />
      <div className="skeleton h-4 w-1/2 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="container-app py-20 text-center">
      <div className="text-6xl mb-4">🏪</div>
      <h2 className="font-display text-2xl font-bold mb-3">Restaurant not found</h2>
      <button onClick={() => navigate('/restaurants')} className="btn-primary px-6 py-3">Browse Restaurants</button>
    </div>
  );

  return (
    <div className="pb-28">
      {/* Cover Image */}
      <div className="h-64 md:h-80 relative overflow-hidden">
        {restaurant.coverImage
          ? <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-300 flex items-center justify-center text-8xl">🏪</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLiked(!liked)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <FiHeart className={`w-5 h-5 ${liked ? 'fill-red-400 text-red-400' : ''}`} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <FiShare2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Restaurant name overlay */}
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="font-display text-3xl font-bold drop-shadow-lg">{restaurant.name}</h1>
          <p className="text-white/80 mt-1 flex items-center gap-1.5">
            <FiMapPin className="w-3.5 h-3.5" />
            {restaurant.cuisine?.join(' • ')}
          </p>
        </div>

        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-white text-xl font-bold bg-black/60 px-6 py-3 rounded-2xl backdrop-blur-sm">
              🔴 Currently Closed
            </span>
          </div>
        )}
      </div>

      <div className="container-app py-6">
        {/* Info Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-6 flex flex-wrap gap-5 items-center"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl">
              <FiStar className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-amber-700 dark:text-amber-400">{restaurant.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <span className="text-gray-500 text-sm">({restaurant.totalRatings || 0} ratings)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FiClock className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-medium">{restaurant.deliveryTime || 30}–{(restaurant.deliveryTime || 30) + 15} mins</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <FiTruck className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm font-medium">
              {restaurant.deliveryFee === 0 ? '🎉 Free Delivery' : `₹${restaurant.deliveryFee} delivery`}
            </span>
          </div>
          {restaurant.minOrder > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              Min order: <span className="font-semibold text-gray-700 dark:text-gray-200">₹{restaurant.minOrder}</span>
            </span>
          )}
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`category-pill flex-shrink-0 ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item, i) => {
              const qty = getItemQty(item._id);
              return (
                <motion.div key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 flex gap-4 hover:shadow-hover transition-shadow"
                >
                  {/* Food image */}
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-600 flex-shrink-0 overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      </span>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</h3>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                    )}
                    {item.calories && (
                      <p className="text-2xs text-gray-400 mb-2">🔥 {item.calories} kcal</p>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="font-bold text-primary">₹{item.discountPrice || item.price}</span>
                        {item.discountPrice && (
                          <span className="text-xs text-gray-400 line-through ml-1.5">₹{item.price}</span>
                        )}
                      </div>

                      {qty === 0 ? (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddToCart(item)}
                          disabled={addingItem === item._id || !restaurant.isOpen}
                          className="btn-primary text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1"
                        >
                          {addingItem === item._id
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 border border-white/40 border-t-white rounded-full" />
                            : <><FiPlus className="w-3 h-3" /> Add</>
                          }
                        </motion.button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleUpdateQty(item._id, qty - 1)} className="qty-btn qty-btn-minus">
                            <FiMinus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-sm text-gray-900 dark:text-white">{qty}</span>
                          <button onClick={() => handleUpdateQty(item._id, qty + 1)} className="qty-btn qty-btn-plus">
                            <FiPlus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cart.items?.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/cart')}
              className="w-full bg-gradient-primary text-white px-6 py-4 rounded-2xl shadow-glow flex items-center justify-between font-semibold"
            >
              <span className="bg-white/20 px-2.5 py-1 rounded-xl text-sm font-bold">
                {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
              </span>
              <span>View Cart</span>
              <span className="font-bold">₹{cart.totalAmount?.toFixed(0)}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
