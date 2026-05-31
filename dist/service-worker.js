// Bam's Delicacies — Service Worker
// CRITICAL: No import/export. Vanilla JS only.

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification("Bam's Delicacies", {
      body: data.body || "You have an update from Bam's Delicacies!",
      icon: '/logo.jpeg',
      badge: '/logo.jpeg',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
