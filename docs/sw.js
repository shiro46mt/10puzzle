var CACHE_NAME = '10puzzle';
var urlsToCache = [
    'index.html',
    'hard.html',
    'style.css',
    'main.css',
    'js/style.js',
    'js/main.js',
    'js/moment.js',
    'js/moment-timezone.js',
    'js/data.json',
];

// インストール処理
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// リソースフェッチ時のキャッシュロード処理
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches
            .match(event.request)
            .then(function(response) {
                return response || fetch(event.request);
            })
    );
});
