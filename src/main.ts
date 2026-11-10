import './index.css';
import { subscribeAuth } from './firebase.ts';
import { initRouter, handleRouting } from './router.ts';
import { ensureDemoDataSeeded } from './seedData.ts';

// Bootstrap app on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Seed demo data if database is empty
  await ensureDemoDataSeeded();

  // Initialize client-side router
  initRouter();

  // Re-route and re-render on auth state change
  subscribeAuth(() => {
    handleRouting();
  });
});
