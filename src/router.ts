import { renderNavbar, setupNavbarEvents } from './components/navbar.ts';
import { renderFooter } from './components/footer.ts';
import { renderHomePage, setupHomePageEvents } from './pages/home.ts';
import { renderLoginPage, setupLoginPageEvents } from './pages/login.ts';
import { renderDonorRegistrationPage, setupDonorRegistrationPageEvents } from './pages/registerDonor.ts';
import { renderReceiverRegistrationPage, setupReceiverRegistrationPageEvents } from './pages/registerReceiver.ts';
import { renderDonorDashboardPage, setupDonorDashboardPageEvents } from './pages/donorDashboard.ts';
import { renderReceiverDashboardPage, setupReceiverDashboardPageEvents } from './pages/receiverDashboard.ts';
import { renderFindDonorsPage, setupFindDonorsPageEvents } from './pages/findDonors.ts';
import { renderBloodRequestsPage, setupBloodRequestsPageEvents } from './pages/bloodRequests.ts';
import { renderAdminDashboardPage, setupAdminDashboardPageEvents } from './pages/adminDashboard.ts';
import { renderAboutPage } from './pages/about.ts';
import { renderContactPage, setupContactPageEvents } from './pages/contact.ts';

export async function handleRouting() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const rawHash = window.location.hash || '#/';
  const path = rawHash.split('?')[0];

  let mainHtml = '';
  let setupFn: (() => void) | null = null;

  switch (path) {
    case '':
    case '#':
    case '#/':
      mainHtml = await renderHomePage();
      setupFn = setupHomePageEvents;
      break;
    case '#/login':
      mainHtml = renderLoginPage();
      setupFn = setupLoginPageEvents;
      break;
    case '#/register-donor':
      mainHtml = renderDonorRegistrationPage();
      setupFn = setupDonorRegistrationPageEvents;
      break;
    case '#/register-receiver':
      mainHtml = renderReceiverRegistrationPage();
      setupFn = setupReceiverRegistrationPageEvents;
      break;
    case '#/donor-dashboard':
      mainHtml = await renderDonorDashboardPage();
      setupFn = setupDonorDashboardPageEvents;
      break;
    case '#/receiver-dashboard':
      mainHtml = await renderReceiverDashboardPage();
      setupFn = setupReceiverDashboardPageEvents;
      break;
    case '#/find-donors':
      mainHtml = await renderFindDonorsPage();
      setupFn = setupFindDonorsPageEvents;
      break;
    case '#/blood-requests':
      mainHtml = await renderBloodRequestsPage();
      setupFn = setupBloodRequestsPageEvents;
      break;
    case '#/admin-dashboard':
      mainHtml = await renderAdminDashboardPage();
      setupFn = setupAdminDashboardPageEvents;
      break;
    case '#/about':
      mainHtml = renderAboutPage();
      break;
    case '#/contact':
      mainHtml = renderContactPage();
      setupFn = setupContactPageEvents;
      break;
    default:
      mainHtml = `
        <div class="max-w-md mx-auto py-20 px-4 text-center">
          <div class="card-student p-8">
            <h2 class="text-3xl font-extrabold text-red-800">404</h2>
            <p class="text-gray-600 mt-2">The requested page does not exist.</p>
            <a href="#/" class="btn-primary mt-4 inline-block text-xs">Return to Home</a>
          </div>
        </div>
      `;
  }

  // Assemble full page with Navbar and Footer
  appContainer.innerHTML = `
    <div id="navbar-slot">
      ${renderNavbar()}
    </div>
    <main id="main-content" class="flex-1">
      ${mainHtml}
    </main>
    <div id="footer-slot">
      ${renderFooter()}
    </div>
  `;

  // Attach navbar events
  setupNavbarEvents();

  // Attach page events
  if (setupFn) {
    setupFn();
  }

  // Scroll to top on navigation
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    handleRouting();
  });
  handleRouting();
}
