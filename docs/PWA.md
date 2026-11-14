# Aether PWA implementation

Aether is configured as an installable Progressive Web App. It remains a web application; installation gives it a standalone window and a
home-screen/launcher icon where supported. It does not grant unrestricted access to native device permissions.

## Included

- Web App Manifest with a stable app identity, `standalone` display mode, theme/background colors, and `any` + `maskable` icons.
- Android/Chromium install button using `beforeinstallprompt` when the browser provides it.
- Platform-specific fallback instructions for iOS/iPadOS and desktop browsers where the install event is not exposed.
- iOS web-app meta tags, Apple touch icon, and launch artwork for common iPhone/iPad sizes. OS launch images stay out of the service-worker
  precache so each device does not download every screen size.
- Aether intro overlay on cold standalone-app launches only; ordinary browser visits are not blocked by a splash screen. It honors `prefers-reduced-motion`.
- Workbox precaches the app shell and static assets. Recent forecasts are retained in the app-level cache for offline use.
- Safe-area padding for devices with display cutouts and home indicators.
- Optional severe-weather alerts. The bell control requests permission. Fresh forecasts can trigger an alert while Aether is open when a
  thunderstorm or intense rain is expected within six hours.
- Notification clicks focus an existing Aether window or open the app scope through `public/sw-custom.js`.

## Permissions and platform boundaries

| Capability | Behavior |
| --- | --- |
| Location | Requested only after the user activates **Use my location**. The browser/OS owns the permission prompt. |
| Notifications | Optional. Requested only after the user enables alerts. On iPhone/iPad, install Aether to the Home Screen first. |
| Offline storage | Managed by the browser's service worker and local storage; no separate permission prompt. |
| Camera, microphone, contacts, Bluetooth | Not requested because this weather dashboard has no feature that requires them. |

A PWA cannot request every native-app permission. Browser support, secure-context requirements, installed state, and OS policy vary. Aether
feature-detects the APIs it uses and never bypasses platform prompts.

## Background push notifications

The included weather alerts are **foreground alerts**. Aether checks forecasts while open and may display a persistent service-worker
notification. It does not schedule forecasts after the app is closed.

Real background Web Push requires all of the following and is intentionally not faked in this frontend-only project:

1. A server-side Web Push sender.
2. VAPID public/private keys stored securely on the server.
3. A backend endpoint to create, persist, refresh, and delete each PushSubscription.
4. A push event handler in the service worker and a server scheduler/condition evaluator.

Never put a VAPID private key or a server secret in the Vite client bundle.

## Install behavior by platform

- **Android / Chromium:** when available, `beforeinstallprompt` opens the native install confirmation. Otherwise the dialog explains the
  browser-menu route.
- **iOS / iPadOS:** Safari and supported browsers use the Share menu and **Add to Home Screen**. iOS does not expose Chromium's
  `beforeinstallprompt` event, so Aether displays platform instructions instead.
- **Desktop Chromium:** install from the custom button when `beforeinstallprompt` is available, or from the browser's install menu.

The app should be served from HTTPS in production. `localhost` is treated as a secure development origin by modern browsers.

## Test checklist

1. Use Node 22.22.2+ and run `npm ci && npm run check`.
2. Run `npm run build`, then serve `dist` over HTTPS or use `npm run preview`. The service worker and browser install prompt are intentionally not enabled in `vite dev`, to avoid interfering with HMR.
3. In Chrome DevTools > Application, verify the generated manifest, icons, service-worker scope, screenshots, `launch_handler`, and offline navigation fallback.
4. Install from a supported Chromium browser and confirm the app opens in standalone display mode with the Aether icon.
5. On iOS/iPadOS, use Share > Add to Home Screen and verify the touch icon and startup artwork.
6. Reload with the network disabled and confirm the app shell opens and a recently fetched forecast is shown with the offline status banner.
7. Enable weather alerts with the bell button. Use a test forecast with a thunderstorm/intense-rain WMO code to verify the notification and
   click-to-focus behavior.
8. Test denied notification permission and reduced-motion preferences; neither should break the dashboard.
