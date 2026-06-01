import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      authAPI.getMe().then(({ data }) => {
        dispatch(setCredentials({ user: data.data.user, accessToken, refreshToken }));
        toast.success(`Welcome, ${data.data.user.name}! 🍅`);
        navigate('/', { replace: true });
      }).catch(() => {
        toast.error('Authentication failed');
        navigate('/login', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl animate-bounce mb-4">🍅</div>
        <p className="text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}
