const CACHE = 'blog-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/static/icon.png',
  '/static/quotes.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // 只缓存同源静态资源
  // 音频/视频文件直接用网络获取（不缓存，避免播放问题）
  if (url.match(/\.(mp3|m4a|mp4)(\?|$)/)) {
    return;
  }
  // 图片文件：缓存优先
  if (url.match(/\.(jpg|jpeg|png|ico)(\?|$)/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetched = fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }
  // 其他静态文件：网络优先，缓存备用（仅同源）
  if (url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});