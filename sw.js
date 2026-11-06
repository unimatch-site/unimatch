/*
 * sw.js — deixa o UniMatch abrir mesmo com pouco ou nenhum sinal.
 *
 * Estratégia "rede primeiro": com internet, sempre busca a versão mais nova
 * (e atualiza a cópia guardada); sem internet, usa a última cópia. Assim uma
 * atualização no GitHub aparece normalmente para quem está online.
 * Se mudar a lista de arquivos abaixo, troque o número da versão.
 */
const CACHE = "unimatch-v10";
const CORE = ["./", "index.html", "data.js", "css/styles.css", "js/scoring.js", "js/app.js", "js/fotos.js",
  "manifest.webmanifest", "img/icone-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
