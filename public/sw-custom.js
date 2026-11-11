/* global self, URL */
/* Small Workbox companion: focus the existing Aether window when a notification is tapped. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const scopePath = new URL(self.registration.scope).pathname;
      for (const client of windows) {
        const clientPath = new URL(client.url).pathname;
        if (clientPath.startsWith(scopePath) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(self.registration.scope);
    }),
  );
});
