importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Receive Firebase config from the main page via postMessage
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG' && !self.__firebaseInitialized) {
    self.__firebaseInitialized = true;
    firebase.initializeApp(event.data.config);
    setupMessaging(firebase.messaging());
  }
});

function setupMessaging(messaging) {
  // Background notification handler (app closed / backgrounded)
  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification ?? {};
    const data = payload.data ?? {};

    self.registration.showNotification(title || 'AegisFlow AI', {
      body: body || '',
      icon: icon || '/logos/aegisflow-icon.png',
      badge: '/logos/aegisflow-icon.png',
      tag: data.alert_id || data.incident_id || 'aegisflow',
      data: data,
      actions: data.url ? [{ action: 'open', title: 'Xem ngay' }] : [],
      vibrate: [200, 100, 200],
      requireInteraction: data.severity === 'critical',
    });
  });
}

// Click on notification -> open relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};
  let url = '/';
  if (data.type === 'alert') url = '/dashboard/alerts';
  else if (data.type === 'rescue_request') url = '/team/map';
  else if (data.type === 'incident') url = '/dashboard/incidents';
  else if (data.url) url = data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
