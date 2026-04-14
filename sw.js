// 서비스 워커 설치
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 알림 클릭 시 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') 
  );
});