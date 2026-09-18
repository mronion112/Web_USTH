import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exchangeAuthCode } from '@/services/auth.service';
import { setAccessToken, setRefreshToken } from '@/lib/storage';

export const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const executedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Authorization code missing.');
      return;
    }

    if (executedRef.current) {
      return;
    }
    executedRef.current = true;

    exchangeAuthCode(code)
      .then((tokens) => {
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        window.location.href = '/admin/dashboard';
      })
      .catch((err) => {
        console.error('OAuth2 code exchange failed:', err);
        setError('Login failed. Please try again.');
      });
  }, [searchParams]);

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return <div className="p-8 text-center">Authenticating... Please wait.</div>;
};
