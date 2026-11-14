const GHPATH = '/skor-mahjong';
const APP_PREFIX = 'skormj_';
const VERSION = 'version_02';
const CACHE_NAME = APP_PREFIX + VERSION;

const SVG_MASTER = 'https://raw.githubusercontent.com/budijoe/skor-mahjong/main';

// Aset lokal utama
const LOCAL_URLS = [
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/manifest.webmanifest`,
  `${GHPATH}/icon-192.png`,
  `${GHPATH}/icon-512.png`,
  `${GHPATH}/apple-touch-icon.png`
];

// Seluruh aset SVG tile Mahjong & budijoe-pixel.svg
const SVG_URLS = [
  `${SVG_MASTER}/budijoe-pixel.svg`,
  // Naga & Angin
  `${SVG_MASTER}/svg/01-white-dragon.svg`,
  `${SVG_MASTER}/svg/02-green-dragon.svg`,
  `${SVG_MASTER}/svg/03-red-dragon.svg`,
  `${SVG_MASTER}/svg/04-east-wind.svg`,
  `${SVG_MASTER}/svg/05-south-wind.svg`,
  `${SVG_MASTER}/svg/06-west-wind.svg`,
  `${SVG_MASTER}/svg/07-north-wind.svg`,
  // Wan (Characters 1-9)
  `${SVG_MASTER}/svg/08-characters-1.svg`,
  `${SVG_MASTER}/svg/09-characters-2.svg`,
  `${SVG_MASTER}/svg/10-characters-3.svg`,
  `${SVG_MASTER}/svg/11-characters-4.svg`,
  `${SVG_MASTER}/svg/12-characters-5.svg`,
  `${SVG_MASTER}/svg/13-characters-6.svg`,
  `${SVG_MASTER}/svg/14-characters-7.svg`,
  `${SVG_MASTER}/svg/15-characters-8.svg`,
  `${SVG_MASTER}/svg/16-characters-9.svg`,
  // Tong (Circles 1-9)
  `${SVG_MASTER}/svg/17-circles-1-variant-4.svg`,
  `${SVG_MASTER}/svg/18-circles-2.svg`,
  `${SVG_MASTER}/svg/19-circles-3.svg`,
  `${SVG_MASTER}/svg/20-circles-4.svg`,
  `${SVG_MASTER}/svg/21-circles-5.svg`,
  `${SVG_MASTER}/svg/22-circles-6.svg`,
  `${SVG_MASTER}/svg/23-circles-7.svg`,
  `${SVG_MASTER}/svg/24-circles-8.svg`,
  `${SVG_MASTER}/svg/25-circles-9.svg`,
  // Sok (Bamboos 1-9)
  `${SVG_MASTER}/svg/26-bamboos-1.svg`,
  `${SVG_MASTER}/svg/27-bamboos-2.svg`,
  `${SVG_MASTER}/svg/28-bamboos-3.svg`,
  `${SVG_MASTER}/svg/29-bamboos-4.svg`,
  `${SVG_MASTER}/svg/30-bamboos-5.svg`,
  `${SVG_MASTER}/svg/31-bamboos-6.svg`,
  `${SVG_MASTER}/svg/32-bamboos-7.svg`,
  `${SVG_MASTER}/svg/33-bamboos-8.svg`,
  `${SVG_MASTER}/svg/34-bamboos-9.svg`,
  // Bunga Merah & Hitam
  `${SVG_MASTER}/svg/35-spring.svg`,
  `${SVG_MASTER}/svg/36-summer.svg`,
  `${SVG_MASTER}/svg/37-autumn.svg`,
  `${SVG_MASTER}/svg/38-winter.svg`,
  `${SVG_MASTER}/svg/39-plum.svg`,
  `${SVG_MASTER}/svg/40-orchid.svg`,
  `${SVG_MASTER}/svg/41-chrysanthemum.svg`,
  `${SVG_MASTER}/svg/42-bamboo.svg`,
  // KIM / Joker
  `${SVG_MASTER}/svg/44-joker-clown.svg`
];

const URLS = [...LOCAL_URLS, ...SVG_URLS];

// 1. Install Service Worker & simpan aset utama + semua SVG ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & hapus cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key.startsWith(APP_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-first untuk navigasi halaman (agar update HTML cepat diterima)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(`${GHPATH}/index.html`))
    );
    return;
  }

  // Cache-first untuk aset lokal, gambar SVG GitHub, dan CDN (Tailwind, FontAwesome, Fonts, html2canvas)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const isAllowedOrigin =
          event.request.url.startsWith(self.location.origin) ||
          event.request.url.startsWith('https://raw.githubusercontent.com/') ||
          event.request.url.startsWith('https://cdn.tailwindcss.com') ||
          event.request.url.startsWith('https://cdnjs.cloudflare.com') ||
          event.request.url.startsWith('https://fonts.googleapis.com') ||
          event.request.url.startsWith('https://fonts.gstatic.com');

        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque') && isAllowedOrigin) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      }).catch(() => {});
    })
  );
});