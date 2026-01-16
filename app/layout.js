import './globals.css'

export const metadata = {
  title: 'Golf Trip Planner',
  description: 'Plan your golf trip with friends - track flights, costs, and scores',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Golf Trip',
  },
  themeColor: '#059669',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />

        {/* Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Golf Trip" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* Splash screens for iOS */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        {/* Service Worker Registration with Auto-Update */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('SW registered:', registration.scope);
                      
                      // Check for updates immediately and every 5 minutes
                      registration.update();
                      setInterval(() => registration.update(), 300000);
                      
                      // Listen for new service worker installing
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('New SW installing...');
                        
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available - show toast and reload
                            console.log('New version available, updating...');
                            
                            // Show update toast
                            const toast = document.createElement('div');
                            toast.innerHTML = '🔄 Updating app...';
                            toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
                            document.body.appendChild(toast);
                            
                            // Tell the new SW to take over immediately
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      });
                    })
                    .catch((error) => {
                      console.log('SW registration failed:', error);
                    });
                  
                  // Reload when the new SW takes control
                  let refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                      refreshing = true;
                      console.log('New SW active, reloading...');
                      window.location.reload();
                    }
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
