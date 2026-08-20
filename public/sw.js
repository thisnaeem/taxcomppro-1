// Dummy service worker to satisfy browser / extension background requests
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
