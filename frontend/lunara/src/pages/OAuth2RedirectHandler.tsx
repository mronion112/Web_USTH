import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeAuthCode } from '@/services/auth.service';
import { setAccessToken, setRefreshToken } from '@/lib/storage';

export const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Authorization code missing.');
      return;
    }

    exchangeAuthCode(code)
      .then((tokens) => {
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        navigate('/admin/dashboard', { replace: true });
        window.location.reload(); // Force context reload
      })
      .catch(() => {
        setError('Login failed. Please try again.');
      });
  }, [searchParams, navigate]);

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return <div className="p-8 text-center">Authenticating... Please wait.</div>;
};
