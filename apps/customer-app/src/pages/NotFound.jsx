import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="text-8xl mb-6">🍅</div>
        <h1 className="font-display text-4xl font-bold mb-3 text-gray-900 dark:text-white">404 - Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like this page went out for delivery and never came back!</p>
        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">Go Home</button>
      </motion.div>
    </div>
  );
}
