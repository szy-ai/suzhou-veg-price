/* ===== 宿州蔬菜比价 - Service Worker ===== */
var CACHE = 'su-veg-cache-v1';
var CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// 安装：预缓存核心文件
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 网络优先，缓存后备
self.addEventListener('fetch', function(e) {
  // 只处理 GET 请求
  if (e.request.method !== 'GET') return;

  // HTML 文档：网络优先（保证内容新鲜）
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(e.request, resp.clone());
          return resp;
        });
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // 其他资源：缓存优先（快！）
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(e.request, resp.clone());
          return resp;
        });
      });
    })
  );
});
