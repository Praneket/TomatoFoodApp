import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiClock, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { catalogAPI, cartAPI } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../store';
import toast from 'react-hot-toast';

export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((s) => s.auth);
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['food', id], queryFn: () => catalogAPI.getFoodById(id) });
  const food = data?.data?.data?.food;

  const handleAdd = async () => {
    if (!accessToken) { navigate('/login'); return; }
    setAdding(true);
    try {
      const { data: cartData } = await cartAPI.add({ foodId: food._id, name: food.name, price: food.price, image: food.image, restaurantId: food.restaurantId, quantity: 1 });
      dispatch(setCart(cartData.data));
      toast.success(`${food.name} added to cart! 🛒`);
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed to add'); }
    finally { setAdding(false); }
  };

  if (isLoading) return <div className="container-app py-20 text-center"><div className="text-4xl animate-bounce">🍽️</div></div>;
  if (!food) return (
    <div className="container-app py-20 text-center">
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Food not found</h2>
    </div>
  );

  return (
    <div className="container-app py-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-6"><FiArrowLeft /> Back</button>
      <div className="glass-card overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-600">
          {food.image
            ? <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{food.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{food.category}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-primary">₹{food.discountPrice || food.price}</p>
              {food.discountPrice && <p className="text-sm text-gray-400 line-through">₹{food.price}</p>}
            </div>
          </div>
          {food.description && <p className="text-gray-600 dark:text-gray-300 mb-4">{food.description}</p>}
          <div className="flex flex-wrap gap-3 mb-6">
            <span className={`badge ${food.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>{food.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
            {food.isPopular && <span className="badge badge-popular">🔥 Popular</span>}
            {food.calories && <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{food.calories} cal</span>}
            {food.preparationTime && (
              <span className="badge bg-gray-100 text-gray-700 dark:bg-dark-muted dark:text-gray-300">
                <FiClock className="w-3 h-3" /> {food.preparationTime} min
              </span>
            )}
          </div>
          {food.allergens?.length > 0 && (
            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">⚠️ Allergens: {food.allergens.join(', ')}</p>
            </div>
          )}
          <button onClick={handleAdd} disabled={adding} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
            {adding ? 'Adding...' : <><FiPlus className="w-5 h-5" /> Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}
