// Service worker: maakt de site installeerbaar en offline bruikbaar.
// scripts/build.mjs vult VERSIE en BESTANDEN in; bij elke wijziging aan de site krijgt de cache een nieuwe versie.
const VERSIE = '__VERSIE__';
const BESTANDEN = ['__BESTANDEN__'];
const CACHE = 'kookboek-' + VERSIE, FONTS = 'kookboek-fonts';

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE)
    .then(c => c.addAll(BESTANDEN.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('kookboek-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

// Pagina en recepten: eerst het netwerk (altijd de nieuwste versie), na 3 seconden of zonder verbinding uit de cache.
async function netwerkEerst(req, sleutel) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(res => {
    if (!res.ok) throw new Error(res.status);
    cache.put(sleutel, res.clone());
    return res;
  });
  net.catch(() => {});
  try {
    return await Promise.race([net, new Promise((_, nee) => setTimeout(nee, 3000))]);
  } catch {
    return (await cache.match(sleutel)) || net;
  }
}

// Iconen, lettertype en overige bestanden: uit de cache, anders ophalen en bewaren.
async function cacheEerst(req, naam) {
  const cache = await caches.open(naam);
  const hit = await cache.match(req, { ignoreSearch: naam === CACHE });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) { e.respondWith(cacheEerst(req, FONTS)); return; }
  if (url.origin !== location.origin) return;
  // Twee talen: ./ (Nederlands) en en/ (Engels), elk met een eigen receptenbestand.
  const en = /\/en\/(index\.html)?$/.test(url.pathname);
  if (req.mode === 'navigate') e.respondWith(netwerkEerst(req, en ? 'en/' : './'));
  else if (/\/recepten(\.en)?\.json$/.test(url.pathname)) e.respondWith(netwerkEerst(req, url.pathname.endsWith('.en.json') ? 'recepten.en.json' : 'recepten.json'));
  else e.respondWith(cacheEerst(req, CACHE));
});

// Tik op een timermelding: terug naar de open site (of open hem).
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(c => 'focus' in c);
    return c ? c.focus() : self.clients.openWindow('./');
  }));
});
