const CACHE = 'nexet-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './exercises-data.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    // اول تلاش برای گرفتن نسخه‌ی تازه از شبکه
    fetch(e.request)
      .then(res => {
        // یه کپی از پاسخ موفق رو توی کش به‌روز کن (برای دفعه‌ی بعد)
        if (res && res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        // شبکه شکست خورد (قطعی/کندی) — از کش استفاده کن
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          // نه شبکه جواب داد، نه کش چیزی داشت (مثلاً اولین بازدید بدون اینترنت پایدار)
          if (e.request.mode === 'navigate') {
            return new Response(
              `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>NeXet</title></head>
              <body style="background:#0a0a0f;color:#f5f5f7;font-family:system-ui,sans-serif;
              display:flex;align-items:center;justify-content:center;min-height:100vh;
              text-align:center;padding:20px;margin:0;">
              <div>
                <h2>اتصال برقرار نشد</h2>
                <p style="color:#999;">اینترنت خود را بررسی کنید و دوباره تلاش کنید.</p>
                <button onclick="location.reload()" style="margin-top:12px;padding:12px 24px;
                border:none;border-radius:10px;background:linear-gradient(135deg,#ff6a3d,#e8431a);
                color:#fff;font-weight:700;font-size:14px;">تلاش دوباره</button>
              </div>
              </body></html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          }
          return new Response('', { status: 504, statusText: 'Network error' });
        })
      )
  );
});
