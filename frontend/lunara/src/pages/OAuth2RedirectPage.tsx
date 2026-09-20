import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_HOME } from '@/lib/access-control';

export function OAuth2RedirectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { exchange } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get('code');
    if (!code) {
      setError('Thiếu mã xác thực Google. Vui lòng đăng nhập lại.');
      return;
    }

    exchange(code)
      .then((account) => {
        let target = ROLE_HOME[account.roleCode];
        try {
          const saved = sessionStorage.getItem('oauth2_redirect_path');
          sessionStorage.removeItem('oauth2_redirect_path');
          if (saved && saved.startsWith('/')) {
            target = saved;
          }
        } catch {}
        navigate(target, { replace: true });
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Đăng nhập Google thất bại.');
      });
  }, [exchange, navigate, params]);

  return (
    <main className="min-h-screen grid place-items-center bg-[#F8F9F5] p-6 text-center">
      <div className="max-w-md rounded-3xl border border-[#E2E8E3] bg-white p-8 shadow-luxury">
        <h1 className="font-display text-2xl font-semibold text-[#14271C]">Lunara</h1>
        {error ? (
          <>
            <p className="mt-4 text-sm text-red-700">{error}</p>
            <Link className="mt-6 inline-block text-sm font-semibold text-[#1E3B2B] underline" to="/auth">
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <p className="mt-4 text-sm text-[#526056]">Đang hoàn tất đăng nhập Google…</p>
        )}
      </div>
    </main>
  );
}
