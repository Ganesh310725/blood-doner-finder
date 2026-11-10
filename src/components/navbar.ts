import { auth, currentUserProfile, currentDonorProfile, signOut, isUserAdmin } from '../firebase.ts';
import { escapeHtml } from '../utils/toast.ts';

export function renderNavbar(): string {
  const currentHash = window.location.hash || '#/';
  const user = auth.currentUser;
  const profile = currentUserProfile;
  const isAdmin = user && isUserAdmin(user.email, profile?.role);

  const isActive = (hash: string) => {
    if (hash === '#/' && (currentHash === '' || currentHash === '#' || currentHash === '#/')) return 'text-red-700 font-bold border-b-2 border-red-700';
    if (hash !== '#/' && currentHash.startsWith(hash)) return 'text-red-700 font-bold border-b-2 border-red-700';
    return 'text-gray-700 hover:text-red-700 font-medium';
  };

  let authSection = '';

  if (user) {
    let dashboardLink = '#/receiver-dashboard';
    let roleBadge = '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-semibold">Receiver</span>';

    if (isAdmin) {
      dashboardLink = '#/admin-dashboard';
      roleBadge = '<span class="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-semibold">Admin</span>';
    } else if (profile?.role === 'donor') {
      dashboardLink = '#/donor-dashboard';
      const bg = currentDonorProfile?.bloodGroup || 'Donor';
      roleBadge = `<span class="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>${escapeHtml(bg)}
      </span>`;
    }

    authSection = `
      <div class="flex items-center gap-3">
        <a href="${dashboardLink}" class="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-red-700 py-1 px-2.5 rounded bg-gray-100 hover:bg-gray-200 transition">
          <svg class="w-4 h-4 text-red-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
          <span class="max-w-[120px] truncate">${escapeHtml(profile?.fullName || user.displayName || 'Dashboard')}</span>
          ${roleBadge}
        </a>
        <button id="nav-logout-btn" class="text-xs font-medium text-gray-500 hover:text-red-700 py-1.5 px-2.5 rounded border border-gray-300 hover:border-red-400 bg-white transition cursor-pointer">
          Sign Out
        </button>
      </div>
    `;
  } else {
    authSection = `
      <div class="flex items-center gap-2">
        <a href="#/login" class="text-sm font-semibold text-gray-700 hover:text-red-700 px-3 py-1.5 rounded hover:bg-gray-100 transition">
          Login
        </a>
        <div class="relative group">
          <button id="nav-register-toggle" class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <span>Register</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <div class="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
            <a href="#/register-donor" class="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700">
              🩸 Register as Donor
            </a>
            <a href="#/register-receiver" class="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 border-t border-gray-100">
              🏥 Register as Receiver
            </a>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center">
            <a href="#/" class="flex items-center gap-2.5 text-red-800 hover:opacity-95">
              <div class="w-9 h-9 rounded-full bg-red-800 text-white flex items-center justify-center font-bold shadow-sm">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="font-extrabold text-lg tracking-tight text-gray-900 leading-none">Blood Donor <span class="text-red-800">Finder</span></span>
                <span class="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">Community Healthcare Network</span>
              </div>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="hidden md:ml-8 md:flex md:space-x-6 text-sm">
              <a href="#/" class="${isActive('#/')} py-5 px-1 transition">Home</a>
              <a href="#/find-donors" class="${isActive('#/find-donors')} py-5 px-1 transition">Find Donors</a>
              <a href="#/blood-requests" class="${isActive('#/blood-requests')} py-5 px-1 transition flex items-center gap-1.5">
                <span>Blood Requests</span>
                <span class="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">Urgent</span>
              </a>
              <a href="#/about" class="${isActive('#/about')} py-5 px-1 transition">About Us</a>
              <a href="#/contact" class="${isActive('#/contact')} py-5 px-1 transition">Contact</a>
              ${isAdmin ? `<a href="#/admin-dashboard" class="${isActive('#/admin-dashboard')} py-5 px-1 text-purple-700 transition font-bold">Admin</a>` : ''}
            </nav>
          </div>

          <!-- Auth Buttons & Mobile Menu Toggle -->
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center">
              ${authSection}
            </div>

            <!-- Mobile menu button -->
            <button id="mobile-menu-toggle" type="button" class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none" aria-label="Toggle navigation">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile navigation panel -->
      <div id="mobile-nav-panel" class="hidden md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
        <a href="#/" class="block py-2 text-sm font-semibold text-gray-700 hover:text-red-700">Home</a>
        <a href="#/find-donors" class="block py-2 text-sm font-semibold text-gray-700 hover:text-red-700">Find Donors</a>
        <a href="#/blood-requests" class="block py-2 text-sm font-semibold text-gray-700 hover:text-red-700">Blood Requests</a>
        <a href="#/about" class="block py-2 text-sm font-semibold text-gray-700 hover:text-red-700">About Us</a>
        <a href="#/contact" class="block py-2 text-sm font-semibold text-gray-700 hover:text-red-700">Contact & Feedback</a>
        ${isAdmin ? `<a href="#/admin-dashboard" class="block py-2 text-sm font-bold text-purple-700">Admin Dashboard</a>` : ''}
        <div class="pt-3 border-t border-gray-200">
          ${authSection}
        </div>
      </div>
    </header>
  `;
}

export function setupNavbarEvents() {
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.hash = '#/login';
      } catch (err) {
        console.error('Error signing out:', err);
      }
    });
  }

  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobilePanel = document.getElementById('mobile-nav-panel');
  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', () => {
      mobilePanel.classList.toggle('hidden');
    });
  }
}
