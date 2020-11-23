const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/db.js",
  "/index.js",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];
//static files like the icons above
const CACHE_NAME = "static-cache-v1";
//such as apis/json
const DATA_CACHE_NAME = "data-cache-v1";

// install/pre-caching files
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    //cache name above then returns a promise
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      //passes an array of static files into the cache
      return cache.addAll(FILES_TO_CACHE);
    })
  );
//finish to move on the next step
  self.skipWaiting();
});
//function to see if we have new caches
//active service worker and go through keys to map through the keys. to check and see if key does not match our cache name. If it doesn't match then go into the cache and delete it then update it. delete stale cache
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
//stop the browser so we can go onto the next step
  self.clients.claim();
});

// fetch - cache data routes
self.addEventListener("fetch", function(evt) {
  // cache successful requests to the API
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        //ajax request/stop request from going through until we process it.
        //roundabout
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache. If succussful use put response for url put the data from the request made into the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            //then we send it back along the front end.
            return response;
          })
          //use a .catch in case there is an error.
          .catch(err => {
            // Network request failed, try to get it from the cache. Return whatever lives in the response in the cache. If it exists.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  // if the request is not for the API, serve static assets using "offline-first" approach. See if the response matches and then respond. 
  // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
  evt.respondWith(
    caches.match(evt.request).then(function(response) {
      //this is for a page not an api end point.
      return response || fetch(evt.request);
    })
  );
});

