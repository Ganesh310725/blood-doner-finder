import { 
  auth, 
  db, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  isUserAdmin,
  currentUserProfile
} from '../firebase.ts';
import { DonorProfile, BloodRequest, UserProfile, FeedbackItem } from '../types.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';
import { ensureDemoDataSeeded } from '../seedData.ts';

export async function renderAdminDashboardPage(): Promise<string> {
  const user = auth.currentUser;
  const isAdmin = user && isUserAdmin(user.email, currentUserProfile?.role);

  if (!isAdmin) {
    return `
      <div class="max-w-md mx-auto py-16 px-4 text-center">
        <div class="card-student p-8 border-t-4 border-t-red-800">
          <div class="w-12 h-12 rounded-full bg-red-100 text-red-800 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🛡️
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Administrator Access Required</h2>
          <p class="text-xs text-gray-600 mb-6 leading-relaxed">
            This dashboard is restricted to verified administrators via secure Firebase authorization. Public registration cannot grant administrator privileges.
          </p>
          ${user ? `
            <div class="bg-gray-100 p-2.5 rounded text-xs text-gray-700 mb-4 font-mono">
              Signed in as: ${escapeHtml(user.email || '')} (Not an authorized administrator)
            </div>
          ` : ''}
          <a href="#/login?role=admin" class="btn-primary text-xs">
            Sign In with Administrator Account
          </a>
        </div>
      </div>
    `;
  }

  let donors: DonorProfile[] = [];
  let requests: BloodRequest[] = [];
  let receivers: UserProfile[] = [];
  let feedbacks: FeedbackItem[] = [];

  try {
    const donorsSnap = await getDocs(collection(db, 'donors'));
    donors = donorsSnap.docs.map(d => ({ userId: d.id, ...d.data() } as DonorProfile));

    const reqSnap = await getDocs(collection(db, 'bloodRequests'));
    requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as BloodRequest));

    const usersSnap = await getDocs(collection(db, 'users'));
    receivers = usersSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as UserProfile))
      .filter(u => u.role === 'receiver');

    const feedSnap = await getDocs(collection(db, 'feedbacks'));
    feedbacks = feedSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackItem));
  } catch (err) {
    console.error('Error fetching admin data:', err);
  }

  const pendingReqs = requests.filter(r => r.status === 'Pending').length;
  const fulfilledReqs = requests.filter(r => r.status === 'Fulfilled').length;

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Top Title Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-gray-900">Platform Administration Dashboard</h1>
            <span class="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Secure RBAC
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Supervise voluntary donor directories, manage urgent blood requirements, and remove inappropriate or fraudulent listings.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="admin-seed-btn" class="btn-secondary text-xs py-2 px-3">
            🔄 Seed Demonstration Donors
          </button>
          <a href="#/" class="btn-outline-red text-xs py-2 px-3">
            View Public Site
          </a>
        </div>
      </div>

      <!-- Metrics Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="card-student p-4 border-l-4 border-l-red-800">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Donors</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">${donors.length}</div>
        </div>

        <div class="card-student p-4 border-l-4 border-l-blue-700">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Receivers</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">${receivers.length}</div>
        </div>

        <div class="card-student p-4 border-l-4 border-l-gray-700">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Requests</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">${requests.length}</div>
        </div>

        <div class="card-student p-4 border-l-4 border-l-amber-500">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pending Requests</div>
          <div class="text-2xl font-bold text-amber-700 mt-1">${pendingReqs}</div>
        </div>

        <div class="card-student p-4 border-l-4 border-l-green-600">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fulfilled</div>
          <div class="text-2xl font-bold text-green-700 mt-1">${fulfilledReqs}</div>
        </div>
      </div>

      <!-- Management Navigation Tabs -->
      <div class="border-b border-gray-200 flex gap-4 text-sm font-semibold">
        <button id="admin-tab-donors" class="py-2.5 px-3 border-b-2 border-red-800 text-red-800 transition">
          🩸 Manage Donors (${donors.length})
        </button>
        <button id="admin-tab-requests" class="py-2.5 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition">
          🏥 Blood Requirements (${requests.length})
        </button>
        <button id="admin-tab-receivers" class="py-2.5 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition">
          👥 Registered Receivers (${receivers.length})
        </button>
        <button id="admin-tab-feedbacks" class="py-2.5 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition">
          📬 Reports & Feedback (${feedbacks.length})
        </button>
      </div>

      <!-- TAB 1: MANAGE DONORS -->
      <div id="admin-panel-donors" class="card-student p-6 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-base text-gray-900">Voluntary Donor Profiles</h3>
          <span class="text-xs text-gray-500">Authorized deletion removes fraudulent entries immediately</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs">
            <thead class="bg-gray-50 font-bold text-gray-700">
              <tr>
                <th class="px-4 py-3 text-left">Donor Name</th>
                <th class="px-4 py-3 text-left">Blood Group</th>
                <th class="px-4 py-3 text-left">City & PIN</th>
                <th class="px-4 py-3 text-left">Age / Gender</th>
                <th class="px-4 py-3 text-left">Availability</th>
                <th class="px-4 py-3 text-left">Public Search</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${donors.length === 0 ? `
                <tr><td colspan="7" class="px-4 py-6 text-center text-gray-400">No registered donors found.</td></tr>
              ` : donors.map(d => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-semibold text-gray-900">${escapeHtml(d.fullName)}</td>
                  <td class="px-4 py-3"><span class="badge-blood text-xs font-mono px-2 py-0.5">${escapeHtml(d.bloodGroup)}</span></td>
                  <td class="px-4 py-3 text-gray-600">${escapeHtml(d.city)} (${escapeHtml(d.pinCode)})</td>
                  <td class="px-4 py-3 text-gray-600">${d.age || 'N/A'} ${d.gender ? `• ${escapeHtml(d.gender)}` : ''}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded font-semibold ${d.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}">
                      ${escapeHtml(d.status || 'available')}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-600">
                    ${d.isPublicConsent !== false ? '<span class="text-green-700 font-bold">Consented</span>' : '<span class="text-gray-400">Hidden</span>'}
                  </td>
                  <td class="px-4 py-3 text-right space-x-2">
                    <button class="admin-del-donor text-red-600 hover:text-red-900 font-semibold cursor-pointer" data-id="${d.userId}" data-name="${escapeHtml(d.fullName)}">
                      Remove
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: MANAGE BLOOD REQUESTS -->
      <div id="admin-panel-requests" class="hidden card-student p-6 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-base text-gray-900">Manage Patient Blood Requirements</h3>
          <span class="text-xs text-gray-500">Verify legitimacy or mark as fulfilled</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs">
            <thead class="bg-gray-50 font-bold text-gray-700">
              <tr>
                <th class="px-4 py-3 text-left">Blood</th>
                <th class="px-4 py-3 text-left">Hospital & City</th>
                <th class="px-4 py-3 text-left">Units</th>
                <th class="px-4 py-3 text-left">Urgency</th>
                <th class="px-4 py-3 text-left">Contact Info</th>
                <th class="px-4 py-3 text-left">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${requests.length === 0 ? `
                <tr><td colspan="7" class="px-4 py-6 text-center text-gray-400">No requests submitted yet.</td></tr>
              ` : requests.map(r => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono font-bold text-red-800">${escapeHtml(r.patientBloodGroup)}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold text-gray-900">${escapeHtml(r.hospitalName)}</div>
                    <div class="text-[11px] text-gray-500">${escapeHtml(r.city)} (PIN: ${escapeHtml(r.pinCode)})</div>
                  </td>
                  <td class="px-4 py-3 font-semibold">${r.unitsNeeded}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded font-semibold ${
                      r.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                      r.urgency === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }">${escapeHtml(r.urgency)}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-gray-900">${escapeHtml(r.receiverName)}</div>
                    <div class="text-[11px] text-gray-500">${escapeHtml(r.receiverPhone)}</div>
                  </td>
                  <td class="px-4 py-3">
                    <select class="admin-status-change form-input text-xs py-1 px-1.5" data-id="${r.id}">
                      <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Donors contacted" ${r.status === 'Donors contacted' ? 'selected' : ''}>Donors contacted</option>
                      <option value="Fulfilled" ${r.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
                      <option value="Cancelled" ${r.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button class="admin-del-req text-red-600 hover:text-red-900 font-semibold cursor-pointer" data-id="${r.id}">
                      Delete
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: MANAGE RECEIVERS -->
      <div id="admin-panel-receivers" class="hidden card-student p-6 space-y-4">
        <h3 class="font-bold text-base text-gray-900">Registered Receiver Accounts</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs">
            <thead class="bg-gray-50 font-bold text-gray-700">
              <tr>
                <th class="px-4 py-3 text-left">Receiver Name</th>
                <th class="px-4 py-3 text-left">Email Address</th>
                <th class="px-4 py-3 text-left">Phone</th>
                <th class="px-4 py-3 text-left">City & PIN</th>
                <th class="px-4 py-3 text-left">Registered Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${receivers.length === 0 ? `
                <tr><td colspan="5" class="px-4 py-6 text-center text-gray-400">No receiver profiles registered yet.</td></tr>
              ` : receivers.map(u => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-semibold text-gray-900">${escapeHtml(u.fullName)}</td>
                  <td class="px-4 py-3 text-gray-600">${escapeHtml(u.email)}</td>
                  <td class="px-4 py-3 text-gray-600 font-mono">${escapeHtml(u.phone || 'N/A')}</td>
                  <td class="px-4 py-3 text-gray-600">${escapeHtml(u.city || '')} (${escapeHtml(u.pinCode || '')})</td>
                  <td class="px-4 py-3 text-gray-500">${new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: MANAGE FEEDBACKS & SUSPICIOUS REPORTS -->
      <div id="admin-panel-feedbacks" class="hidden card-student p-6 space-y-4">
        <h3 class="font-bold text-base text-gray-900">User Inquiries & Suspicious Activity Reports</h3>
        ${feedbacks.length === 0 ? `
          <p class="text-xs text-gray-500 py-4 text-center">No reports or feedback submissions in database.</p>
        ` : `
          <div class="space-y-3">
            ${feedbacks.map(f => `
              <div class="bg-gray-50 border border-gray-200 p-4 rounded text-xs space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm text-gray-900">${escapeHtml(f.subject)}</span>
                  <span class="px-2 py-0.5 rounded font-semibold ${
                    f.category === 'Report Suspicious Activity' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }">
                    ${escapeHtml(f.category)}
                  </span>
                </div>
                <p class="text-gray-700 leading-relaxed">${escapeHtml(f.message)}</p>
                <div class="pt-2 flex justify-between text-[11px] text-gray-400 border-t border-gray-200">
                  <span>From: ${escapeHtml(f.name)} (${escapeHtml(f.email)})</span>
                  <span>Submitted: ${new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

    </div>
  `;
}

export function setupAdminDashboardPageEvents() {
  const user = auth.currentUser;
  if (!user) return;

  // Tabs switching
  const tabDonors = document.getElementById('admin-tab-donors');
  const tabRequests = document.getElementById('admin-tab-requests');
  const tabReceivers = document.getElementById('admin-tab-receivers');
  const tabFeedbacks = document.getElementById('admin-tab-feedbacks');

  const panelDonors = document.getElementById('admin-panel-donors');
  const panelRequests = document.getElementById('admin-panel-requests');
  const panelReceivers = document.getElementById('admin-panel-receivers');
  const panelFeedbacks = document.getElementById('admin-panel-feedbacks');

  const allTabs = [tabDonors, tabRequests, tabReceivers, tabFeedbacks];
  const allPanels = [panelDonors, panelRequests, panelReceivers, panelFeedbacks];

  function switchTab(index: number) {
    allTabs.forEach((tab, i) => {
      if (tab) {
        if (i === index) {
          tab.className = 'py-2.5 px-3 border-b-2 border-red-800 text-red-800 font-bold transition';
        } else {
          tab.className = 'py-2.5 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition font-semibold';
        }
      }
    });

    allPanels.forEach((panel, i) => {
      if (panel) {
        if (i === index) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    });
  }

  if (tabDonors) tabDonors.addEventListener('click', () => switchTab(0));
  if (tabRequests) tabRequests.addEventListener('click', () => switchTab(1));
  if (tabReceivers) tabReceivers.addEventListener('click', () => switchTab(2));
  if (tabFeedbacks) tabFeedbacks.addEventListener('click', () => switchTab(3));

  // Remove donor
  const delDonorBtns = document.querySelectorAll('.admin-del-donor');
  delDonorBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const donorId = target.getAttribute('data-id');
      const donorName = target.getAttribute('data-name');
      if (!donorId) return;

      if (!confirm(`Are you sure you want to remove donor "${donorName}"? This action cannot be undone.`)) return;

      try {
        await deleteDoc(doc(db, 'donors', donorId));
        showToast(`Donor ${donorName} removed successfully`, 'info');
        window.location.reload();
      } catch (err: any) {
        showToast(err.message || 'Failed to remove donor', 'error');
      }
    });
  });

  // Remove request
  const delReqBtns = document.querySelectorAll('.admin-del-req');
  delReqBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const reqId = target.getAttribute('data-id');
      if (!reqId) return;

      if (!confirm('Are you sure you want to delete this blood requirement?')) return;

      try {
        await deleteDoc(doc(db, 'bloodRequests', reqId));
        showToast('Request deleted', 'info');
        window.location.reload();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete request', 'error');
      }
    });
  });

  // Status update
  const statusSelects = document.querySelectorAll('.admin-status-change');
  statusSelects.forEach(select => {
    select.addEventListener('change', async (e) => {
      const target = e.currentTarget as HTMLSelectElement;
      const reqId = target.getAttribute('data-id');
      const newStatus = target.value;
      if (!reqId) return;

      try {
        await updateDoc(doc(db, 'bloodRequests', reqId), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
        showToast(`Request updated to ${newStatus}`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to update request', 'error');
      }
    });
  });

  // Seed demo data button
  const seedBtn = document.getElementById('admin-seed-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      seedBtn.setAttribute('disabled', 'true');
      seedBtn.textContent = 'Seeding Data...';
      try {
        await ensureDemoDataSeeded();
        showToast('Demo community data seeded successfully!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        showToast(err.message || 'Failed to seed data', 'error');
        seedBtn.removeAttribute('disabled');
        seedBtn.textContent = '🔄 Seed Demonstration Donors';
      }
    });
  }
}
