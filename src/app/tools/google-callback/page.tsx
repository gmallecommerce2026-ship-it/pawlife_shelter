'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    const exchange = async () => {
      setStatus('loading');
      try {
        const res = await fetch('https://p3tid.vn/google/oauth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!data.success || !data.refreshToken) {
          throw new Error('Không nhận được refresh_token từ backend.');
        }
        setRefreshToken(data.refreshToken);
        setStatus('done');
      } catch (err: any) {
        setErrorMessage(err?.message || 'Có lỗi xảy ra khi đổi token.');
        setStatus('error');
      }
    };

    exchange();
  }, [code]);

  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: 24, fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Google OAuth Callback (tool nội bộ)
      </h1>

      {!code && <p>Không thấy tham số `code` trên URL — mở lại từ đường link /google/oauth/start.</p>}

      {status === 'loading' && <p>Đang đổi code lấy token...</p>}

      {status === 'error' && (
        <p style={{ color: 'red' }}>Lỗi: {errorMessage}</p>
      )}

      {status === 'done' && refreshToken && (
        <div>
          <p style={{ marginBottom: 8 }}>
            Copy dòng dưới đây vào <code>GOOGLE_REFRESH_TOKEN</code> trong <code>.env</code>:
          </p>
          <textarea
            readOnly
            value={refreshToken}
            style={{ width: '100%', height: 80, padding: 8, fontSize: 13 }}
            onFocus={(e) => e.target.select()}
          />
          <p style={{ marginTop: 16, color: '#888', fontSize: 13 }}>
            Xong việc thì xoá route này khỏi FE + xoá GoogleOAuthController khỏi backend.
          </p>
        </div>
      )}
    </div>
  );
}