/* どないやマップ Service Worker  v13
   方針：
   - 外部ドメイン（地図タイル・CDN）には一切触らない ← 白地図の原因を根絶
   - HTML はネットワーク優先（更新がすぐ反映される）
   - 同一ドメインの静的ファイルのみキャッシュ
   - 起動時に古い世代のキャッシュを全消去 */

const VERSION = 'donaiya-shopnavi-v4';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon_192.png',
  './icon_180.png',
  './icon_512.png',
  './favicon.ico'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      // 1つ失敗しても install 全体を落とさない
      Promise.all(SHELL.map((u) => c.add(u).catch(() => null)))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // GET 以外は何もしない
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  // ★最重要★ 外部ドメインは完全に素通し。
  // respondWith を呼ばなければブラウザが通常どおり取得する。
  // 地図タイル・Leaflet CDN はすべてここを通る。
  if (url.origin !== self.location.origin) return;

  // HTML はネットワーク優先（オフライン時のみキャッシュ）
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // その他の同一ドメインファイルはキャッシュ優先
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
