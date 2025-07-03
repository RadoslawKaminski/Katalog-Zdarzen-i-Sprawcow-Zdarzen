// Ustaw nazwę i wersję pamięci podręcznej. Zmieniaj tę wersję przy każdej aktualizacji!
const CACHE_NAME = 'katalog-sprawcow-cache-4';

// Lista plików, które tworzą "skorupę" aplikacji i muszą być dostępne offline.
const urlsToCache = [
  '.', // Oznacza główny plik HTML (index.html)
  'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js',
  'https://unpkg.com/dexie@3/dist/dexie.js'
];

// Zdarzenie 'install': Uruchamiane przy pierwszej instalacji Service Workera.
// Otwiera cache i zapisuje w nim wszystkie pliki "skorupy".
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Otwarto cache i zapisano pliki aplikacji');
        return cache.addAll(urlsToCache);
      })
  );
});

// Zdarzenie 'fetch': Przechwytuje wszystkie zapytania sieciowe ze strony.
// Sprawdza, czy zasób jest w cache. Jeśli tak, podaje go z cache. Jeśli nie, pobiera z sieci.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jeśli znaleziono w cache, zwróć odpowiedź z cache
        if (response) {
          return response;
        }
        // W przeciwnym razie, pobierz z sieci
        return fetch(event.request);
      }
    )
  );
});

// Zdarzenie 'activate': Uruchamiane, gdy nowy Service Worker przejmuje kontrolę.
// Służy do posprzątania starych, nieużywanych wersji pamięci podręcznej.
self.addEventListener('activate', event => {
  // Lista dozwolonych nazw cache (w tym wypadku tylko jedna, aktualna)
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Jeśli stary cache nie znajduje się na białej liście, usuń go
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});