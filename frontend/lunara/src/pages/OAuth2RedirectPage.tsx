import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exchangeOAuthCode } from '@/lib/api';

export function OAuth2RedirectPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      setError('Thiếu mã xác thực OAuth2.');
      return;
    }
    exchangeOAuthCode(code)
      .then(({ accessToken, refreshToken }) => {
        localStorage.setItem('lunara.accessToken', accessToken);
        if (refreshToken) localStorage.setItem('lunara.refreshToken', refreshToken);
        window.location.assign('/booking');
      })
      .catch((err: Error) => setError(err.message || 'Đăng nhập Google thất bại.'));
  }, [params]);

  return <main className="min-h-screen grid place-items-center p-6">{error || 'Đang hoàn tất đăng nhập Google...'}</main>;
}
