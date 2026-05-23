importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC0smBIxMoO4IODPzj4G-KYdj56aSaRVco",
  authDomain: "gen-lang-client-0554021789.firebaseapp.com",
  projectId: "gen-lang-client-0554021789",
  storageBucket: "gen-lang-client-0554021789.firebasestorage.app",
  messagingSenderId: "1096317289980",
  appId: "1:1096317289980:web:86cf62991c109fe8a01e79"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus().then(c => c.navigate(link));
      }
      return clients.openWindow(link);
    })
  );
});
