import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

const Home        = lazy(() => import('./pages/Home'));
const Restaurants = lazy(() => import('./pages/Restaurants'));
const Restaurant  = lazy(() => import('./pages/Restaurant'));
const FoodDetail  = lazy(() => import('./pages/FoodDetail'));
const Cart        = lazy(() => import('./pages/Cart'));
const Checkout    = lazy(() => import('./pages/Checkout'));
const Orders      = lazy(() => import('./pages/Orders'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Profile     = lazy(() => import('./pages/Profile'));
const Login       = lazy(() => import('./pages/Login'));
const Register    = lazy(() => import('./pages/Register'));
const AIChat      = lazy(() => import('./pages/AIChat'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const NotFound    = lazy(() => import('./pages/NotFound'));

export default function App() {
  const { theme } = useSelector((s) => s.ui);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-dark flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Routes>
                <Route path="/"                    element={<Home />} />
                <Route path="/restaurants"         element={<Restaurants />} />
                <Route path="/restaurants/:id"     element={<Restaurant />} />
                <Route path="/food/:id"            element={<FoodDetail />} />
                <Route path="/login"               element={<Login />} />
                <Route path="/register"            element={<Register />} />
                <Route path="/auth/callback"       element={<AuthCallback />} />
                <Route path="/cart"                element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout"            element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders"              element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/orders/:orderId/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="/profile"             element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/ai-chat"             element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
                <Route path="*"                    element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </div>
  );
}
