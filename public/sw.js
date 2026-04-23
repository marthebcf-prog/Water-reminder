self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "💧 Water Reminder", {
      body: data.body || "¡Hora de hidratarte!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "water-reminder",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
