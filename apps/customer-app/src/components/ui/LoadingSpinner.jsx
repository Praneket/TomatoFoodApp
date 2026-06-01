import { motion } from 'framer-motion';

export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizes[size]} border-3 border-primary/20 border-t-primary rounded-full`}
        style={{ borderWidth: 3 }}
      />
      {fullScreen && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-dark/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🍅</span>
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}
