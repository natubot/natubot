// const CACHE_NAME = 'cache-1';
const CACHE_STATIC_NAME = 'static-v2';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';
const CACHE_DYNAMIC_LIMIT = 50;

function clearCache(cacheName, numeroItemps) {
    caches.open(cacheName)
        .then(cache => {
            return cache.keys()
                .then(keys => {
                    if (keys.length > numeroItemps) {
                        cache.delete(keys[0])
                            .then(clearCache(cacheName, numeroItemps));
                    }
                });
        });
}

self.addEventListener('install', e => {

    const cacheProm = caches.open(CACHE_STATIC_NAME)
        .then(cache => {
            return cache.addAll([
                '/natubot/',
                '/natubot/index.html',
                '/natubot/img/codebar-logo.png',
                '/natubot/js/jquery-1.3.2.min.js',
                '/natubot/js/JsBarcode.all.min.js',
                '/natubot/js/scripts.js',
                '/natubot/js/bootstrap.min.js',
                '/natubot/js/popper.js',
                '/natubot/js/dataTable.js',
                '/natubot/manifest.json',
                '/natubot/css/style.css',
                '/natubot/css/datatable.css',
            ]);
        });

    const cacheInmutable = caches.open(CACHE_INMUTABLE_NAME)
        .then(cache => {
            return cache.addAll([
                '/natubot/css/bootstrap.min.css',
            ]);
        });

    e.waitUntil(Promise.all([cacheProm, cacheInmutable]));
});

self.addEventListener('fetch', e => {

    // 5 - Cache & Network race
    const respuesta = new Promise((resolve, reject) => {
        let rechazada = false;
        const falloUnaVez = () => {
            if (rechazada) {
                if (/\.(png|jpg|gif|tiff)$/i.test(e.request.url)) {
                    resolve(caches.match('/img/codebar-logo.png'));
                } else {
                    reject('No se ha encontrado una respuesta');
                }
            } else {
                rechazada = true;
            }
        };

        fetch(e.request).then(resp => {
            resp.ok ? resolve(resp) : falloUnaVez();
        }).catch(falloUnaVez);

        caches.match(e.request).then(resp => {
            resp ? resolve(resp) : falloUnaVez();
        }).catch(falloUnaVez);

    });

    e.respondWith(respuesta);

});
