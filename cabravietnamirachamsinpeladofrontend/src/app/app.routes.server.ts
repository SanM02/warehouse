import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'tables', renderMode: RenderMode.Prerender },
  { path: 'static-navigation', renderMode: RenderMode.Prerender },
  { path: 'light-sidenav', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'forgot-password', renderMode: RenderMode.Prerender },
  { path: '401', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '500', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender }
];
