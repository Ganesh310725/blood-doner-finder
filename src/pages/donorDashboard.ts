import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  signOut,
  handleFirestoreError,
  OperationType,
  addDoc,
  deleteDoc,
  orderBy
} from '../firebase.ts';
import { UserProfile, DonorProfile, ContactRequest, DonationRecord, BloodComponentType } from '../types.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';

export async function renderDonorDashboardPage(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    return `
      <div class="max-w-md mx-auto py-16 px-4 text-center">
        <div class="card-student p-8">
          <p class="text-gray-600 mb-4">Please log in to view your Donor Dashboard.</p>
          <a href="#/login?role=donor" class="btn-primary">Sign In as Donor</a>
        </div>
      </div>
    `;
  }

  let userProfile: UserProfile | null = null;
  let donorProfile: DonorProfile | null = null;
  let contactRequests: ContactRequest[] = [];
  let pastDonations: DonationRecord[] = [];

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      userProfile = userSnap.data() as UserProfile;
    }

    const donorDocRef = doc(db, 'donors', user.uid);
    const donorSnap = await getDoc(donorDocRef);
    if (donorSnap.exists()) {
      donorProfile = donorSnap.data() as DonorProfile;
    }

    // Fetch contact requests received by this donor
    const reqRef = collection(db, 'contactRequests');
    const q = query(reqRef, where('donorId', '==', user.uid));
    const reqSnap = await getDocs(q);
    contactRequests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as ContactRequest));

    // Fetch past donations from donors/{uid}/donationHistory sub-collection
    const donationsRef = collection(db, 'donors', user.uid, 'donationHistory');
    const donationsSnap = await getDocs(donationsRef);
    pastDonations = donationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DonationRecord));
    // Sort descending by donation date
    pastDonations.sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());
  } catch (err) {
    console.error('Error fetching donor dashboard data:', err);
  }

  const currentStatus = donorProfile?.status || 'available';
  const bg = donorProfile?.bloodGroup || 'O+';
  const pendingRequestsCount = contactRequests.filter(r => r.status === 'Pending').length;

  // Donation Stats & Next Eligibility Calculation
  const totalDonations = pastDonations.length;
  const totalUnits = pastDonations.reduce((sum, d) => sum + (Number(d.units) || 1), 0);

  let nextEligibleDateString = '';
  let daysRemaining = 0;
  let isEligibleNow = true;

  if (pastDonations.length > 0) {
    const latestDonation = new Date(pastDonations[0].donationDate);
    const intervalDays = donorProfile?.gender === 'Female' ? 120 : 90; // Standard 90 days male / 120 days female interval
    const nextEligibleTime = latestDonation.getTime() + intervalDays * 24 * 60 * 60 * 1000;
    const nowTime = Date.now();

    if (nowTime < nextEligibleTime) {
      isEligibleNow = false;
      daysRemaining = Math.ceil((nextEligibleTime - nowTime) / (24 * 60 * 60 * 1000));
      nextEligibleDateString = new Date(nextEligibleTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Top Welcome Banner -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-red-800">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-red-800 text-white flex items-center justify-center font-bold text-2xl shadow font-mono">
            ${escapeHtml(bg)}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-900">
                Welcome, ${escapeHtml(userProfile?.fullName || donorProfile?.fullName || 'Donor')}!
              </h1>
              <span class="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Donor Profile
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>📍 ${escapeHtml(donorProfile?.city || userProfile?.city || 'City not set')} (PIN: ${escapeHtml(donorProfile?.pinCode || userProfile?.pinCode || '------')})</span>
              <span>•</span>
              <span>Age: ${donorProfile?.age || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto">
          <button id="donor-edit-profile-btn" class="btn-secondary text-xs py-2 px-3 flex-1 md:flex-none cursor-pointer">
            ✏️ Edit Profile
          </button>
          <button id="donor-logout-btn" class="btn-outline-red text-xs py-2 px-3 flex-1 md:flex-none cursor-pointer">
            Sign Out
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="card-student p-4 border-l-4 border-l-red-800">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Donations</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">${totalDonations} Completed</div>
        </div>
        <div class="card-student p-4 border-l-4 border-l-green-600">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Units Contributed</div>
          <div class="text-2xl font-bold text-green-700 mt-1">${totalUnits} Units</div>
        </div>
        <div class="card-student p-4 border-l-4 border-l-amber-500">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pending Requests</div>
          <div class="text-2xl font-bold text-amber-700 mt-1">${pendingRequestsCount} Pending</div>
        </div>
        <div class="card-student p-4 border-l-4 border-l-blue-600">
          <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Donation Eligibility</div>
          <div class="text-sm font-bold ${isEligibleNow ? 'text-green-700' : 'text-amber-700'} mt-2">
            ${isEligibleNow ? '🟢 Eligible Now' : `🟡 Rest (${daysRemaining}d)`}
          </div>
        </div>
      </div>

      <!-- Quick Availability Status Switcher Card -->
      <div class="card-student p-6 border-t-4 ${currentStatus === 'available' ? 'border-t-green-600' : currentStatus === 'resting' ? 'border-t-amber-500' : 'border-t-gray-400'}">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>Donation Availability Status</span>
              ${currentStatus === 'available' ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold">Available to Donate</span>' :
                currentStatus === 'resting' ? '<span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">Temporarily Resting</span>' :
                '<span class="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-bold">Unavailable</span>'}
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">
              Control whether patients can contact you in emergency searches. Change this anytime with 1 click.
            </p>
          </div>

          <!-- 1-Click Status Buttons -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button class="status-toggle-btn text-xs font-semibold py-2 px-3 rounded border transition cursor-pointer ${currentStatus === 'available' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}" data-status="available">
              🟢 Available
            </button>
            <button class="status-toggle-btn text-xs font-semibold py-2 px-3 rounded border transition cursor-pointer ${currentStatus === 'resting' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}" data-status="resting">
              🟡 Resting (Recovery)
            </button>
            <button class="status-toggle-btn text-xs font-semibold py-2 px-3 rounded border transition cursor-pointer ${currentStatus === 'unavailable' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}" data-status="unavailable">
              ⚪ Busy / Unavailable
            </button>
          </div>
        </div>
      </div>

      <!-- SECTION: PAST BLOOD DONATION HISTORY (NEW SUB-COLLECTION) -->
      <div class="card-student p-6 space-y-5 border-t-4 border-t-red-700">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span class="text-red-700">🩸</span>
              <span>Past Blood Donations History</span>
              <span class="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">
                ${pastDonations.length} Records
              </span>
            </h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Log of your past blood donations and hospital visits, securely stored in your personal donation history.
            </p>
          </div>

          <button id="open-log-donation-btn" class="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Log Past Donation</span>
          </button>
        </div>

        <!-- Next Donation Eligibility Banner -->
        <div class="p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
          isEligibleNow ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">${isEligibleNow ? '✅' : '⏳'}</span>
            <div>
              <strong class="font-bold">${isEligibleNow ? 'Eligible to Donate Blood' : 'Mandatory Recovery Period'}</strong>
              <p class="text-[11px] mt-0.5 ${isEligibleNow ? 'text-green-700' : 'text-amber-800'}">
                ${isEligibleNow 
                  ? 'At least 90 days have elapsed since your last logged donation. You can safely volunteer when compatible requests arise.'
                  : `Next safe donation date: <strong>${nextEligibleDateString}</strong> (${daysRemaining} days remaining for healthy red blood cell replenishment).`}
              </p>
            </div>
          </div>
          <span class="text-[11px] font-mono px-2 py-1 rounded bg-white border font-bold shadow-2xs hidden sm:inline">
            Interval: ${donorProfile?.gender === 'Female' ? '120 Days' : '90 Days'}
          </span>
        </div>

        <!-- Donations Table / Cards -->
        ${pastDonations.length === 0 ? `
          <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 space-y-2">
            <div class="text-3xl">📝</div>
            <h4 class="font-bold text-sm text-gray-800">No past donations logged yet</h4>
            <p class="text-xs text-gray-500 max-w-sm mx-auto">
              Keep a verified personal record of your blood donations, hospitals visited, and units contributed.
            </p>
            <button id="empty-log-donation-btn" class="btn-outline-red text-xs py-1.5 px-3 mt-2 cursor-pointer">
              Log Your First Donation
            </button>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-xs">
              <thead class="bg-gray-50 font-bold text-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left">Donation Date</th>
                  <th class="px-4 py-3 text-left">Hospital / Blood Bank</th>
                  <th class="px-4 py-3 text-left">Location</th>
                  <th class="px-4 py-3 text-left">Units &amp; Component</th>
                  <th class="px-4 py-3 text-left">Notes / Certificate</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${pastDonations.map(record => `
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 font-semibold text-gray-900 font-mono">
                      📅 ${new Date(record.donationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td class="px-4 py-3 font-bold text-gray-900">
                      🏥 ${escapeHtml(record.hospitalName)}
                    </td>
                    <td class="px-4 py-3 text-gray-600">
                      ${escapeHtml(record.hospitalLocation || 'N/A')}
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold text-[11px]">
                        ${record.units || 1} Unit • ${escapeHtml(record.componentType || 'Whole Blood')}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600 max-w-xs truncate" title="${escapeHtml(record.notes || '')}">
                      ${escapeHtml(record.notes || '—')}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button 
                        class="btn-delete-donation text-red-600 hover:text-red-900 font-semibold p-1 hover:bg-red-50 rounded transition cursor-pointer" 
                        data-id="${record.id}" 
                        data-hospital="${escapeHtml(record.hospitalName)}"
                        title="Delete this record"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Contact Requests Received Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Blood Contact Requests Received</span>
              ${pendingRequestsCount > 0 ? `<span class="bg-red-700 text-white text-xs px-2 py-0.5 rounded-full font-bold">${pendingRequestsCount} Pending</span>` : ''}
            </h2>
            <p class="text-xs text-gray-500">
              When a patient family requests your blood group, their message appears here. Your phone number is only shared if you click Accept.
            </p>
          </div>
        </div>

        ${contactRequests.length === 0 ? `
          <div class="card-student p-8 text-center text-gray-500 space-y-2">
            <div class="text-3xl">📬</div>
            <p class="font-medium text-gray-700">No contact requests received yet.</p>
            <p class="text-xs text-gray-400">
              When patient families search for ${escapeHtml(bg)} blood in ${escapeHtml(donorProfile?.city || 'your area')}, their requests will arrive here.
            </p>
          </div>
        ` : `
          <div class="grid grid-cols-1 gap-4">
            ${contactRequests.map(req => {
              const isPending = req.status === 'Pending';
              const isAccepted = req.status === 'Accepted';
              const isDeclined = req.status === 'Declined';

              return `
                <div class="card-student p-5 border-l-4 ${isPending ? 'border-l-amber-500' : isAccepted ? 'border-l-green-600' : 'border-l-gray-400'}">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                      <span class="badge-blood text-xs font-mono px-2 py-1">${escapeHtml(req.patientBloodGroup || bg)}</span>
                      <div>
                        <h4 class="font-bold text-sm text-gray-900">Request from ${escapeHtml(req.receiverName)}</h4>
                        <p class="text-xs text-gray-500">Hospital: <strong>${escapeHtml(req.hospitalName)}</strong> • Urgency: <span class="font-semibold text-red-700">${escapeHtml(req.urgency || 'Normal')}</span></p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs px-2.5 py-0.5 rounded font-semibold ${
                        isPending ? 'bg-amber-100 text-amber-800' :
                        isAccepted ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-600'
                      }">
                        Status: ${escapeHtml(req.status)}
                      </span>
                    </div>
                  </div>

                  <!-- Request Message & Context -->
                  <div class="py-3 text-xs text-gray-700 space-y-2">
                    ${req.message ? `
                      <div class="bg-gray-50 p-2.5 rounded border border-gray-100 italic">
                        "${escapeHtml(req.message)}"
                      </div>
                    ` : ''}

                    <div class="flex flex-wrap gap-x-6 gap-y-1 text-gray-500 text-[11px]">
                      <span>Receiver Phone: <strong>${escapeHtml(req.receiverPhone || 'Provided upon contact')}</strong></span>
                      <span>Receiver Email: <strong>${escapeHtml(req.receiverEmail || 'N/A')}</strong></span>
                      <span>Received: ${new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>

                    ${isAccepted ? `
                      <div class="bg-green-50 border border-green-200 text-green-900 p-2.5 rounded text-xs">
                        ✅ <strong>You accepted this request!</strong> Your contact phone has been securely revealed to ${escapeHtml(req.receiverName)}. Please coordinate with them or the hospital blood bank for donation timings.
                      </div>
                    ` : ''}

                    ${isDeclined ? `
                      <div class="bg-gray-100 text-gray-600 p-2 rounded text-xs">
                        You declined this request${req.declineReason ? `: "${escapeHtml(req.declineReason)}"` : '.'}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Action Buttons if Pending -->
                  ${isPending ? `
                    <div class="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button class="btn-decline-req text-xs font-semibold py-1.5 px-3 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer" data-id="${req.id}">
                        Decline Request
                      </button>
                      <button class="btn-accept-req btn-primary text-xs py-1.5 px-4 cursor-pointer" data-id="${req.id}" data-name="${escapeHtml(req.receiverName)}">
                        ✓ Accept & Share Phone Number
                      </button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Donor Health & Post-Donation Guidelines -->
      <div class="card-student p-6 bg-red-50/40 border border-red-100">
        <h3 class="font-bold text-sm text-red-950 mb-2 flex items-center gap-1.5">
          <span>❤️ Voluntary Donor Best Practices</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
          <div>
            <strong class="text-gray-900 block mb-1">Before Donating:</strong>
            Drink plenty of fluids (500ml water), eat a wholesome iron-rich meal, avoid smoking 2 hours before, and avoid alcohol 24 hours prior.
          </div>
          <div>
            <strong class="text-gray-900 block mb-1">Interval Requirements:</strong>
            Male donors can safely donate every 90 days. Female donors can safely donate every 120 days. Use the "Resting" status switch during recovery!
          </div>
          <div>
            <strong class="text-gray-900 block mb-1">At the Blood Bank:</strong>
            Show a valid photo ID. Doctors will test hemoglobin levels and take vital readings before drawing blood. Never hesitate to ask questions.
          </div>
        </div>
      </div>

      <!-- MODAL 1: LOG PAST DONATION MODAL -->
      <div id="log-donation-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-gray-200 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🩸</span>
              <h3 class="font-bold text-base text-gray-900">Log Past Blood Donation</h3>
            </div>
            <button id="close-log-modal-btn" class="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">&times;</button>
          </div>

          <form id="log-donation-form" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="log-date">Donation Date <span class="text-red-600">*</span></label>
                <input 
                  type="date" 
                  id="log-date" 
                  class="form-input text-sm" 
                  required 
                  max="${todayStr}" 
                  value="${todayStr}"
                />
              </div>

              <div>
                <label class="form-label" for="log-component">Component Donated <span class="text-red-600">*</span></label>
                <select id="log-component" class="form-input text-sm" required>
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="Platelets">Platelets (Single Donor)</option>
                  <option value="Plasma">Plasma (Apheresis)</option>
                  <option value="Red Blood Cells">Packed Red Blood Cells</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label" for="log-hospital">Hospital / Blood Bank Name <span class="text-red-600">*</span></label>
              <input 
                type="text" 
                id="log-hospital" 
                class="form-input text-sm" 
                placeholder="e.g. AIIMS Blood Bank, KEM Hospital" 
                required 
                maxlength="150" 
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="log-location">Hospital Location / City</label>
                <input 
                  type="text" 
                  id="log-location" 
                  class="form-input text-sm" 
                  placeholder="e.g. Parel, Mumbai" 
                  maxlength="150" 
                />
              </div>

              <div>
                <label class="form-label" for="log-units">Units Donated</label>
                <input 
                  type="number" 
                  id="log-units" 
                  class="form-input text-sm" 
                  min="1" 
                  max="5" 
                  value="1" 
                  required 
                />
              </div>
            </div>

            <div>
              <label class="form-label" for="log-notes">Additional Notes / Certificate Reference</label>
              <textarea 
                id="log-notes" 
                rows="2" 
                class="form-input text-sm" 
                placeholder="e.g. Certificate #1042, voluntary blood drive at college..." 
                maxlength="500"
              ></textarea>
            </div>

            <div class="bg-gray-50 p-2.5 rounded text-xs text-gray-500 border border-gray-100">
              ℹ️ Logging this donation updates your personal donation count and recalculates your next safe eligibility window.
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" id="cancel-log-btn" class="btn-secondary text-xs cursor-pointer">Cancel</button>
              <button type="submit" id="save-log-btn" class="btn-primary text-xs cursor-pointer">Save Donation Record</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL 2: EDIT PROFILE MODAL (Hidden by default) -->
      <div id="edit-profile-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-gray-200 pb-3">
            <h3 class="font-bold text-base text-gray-900">Edit Donor Profile</h3>
            <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">&times;</button>
          </div>

          <form id="edit-profile-form" class="space-y-4">
            <div>
              <label class="form-label" for="edit-name">Full Name</label>
              <input type="text" id="edit-name" class="form-input" value="${escapeHtml(userProfile?.fullName || donorProfile?.fullName || '')}" required />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="edit-city">City / District</label>
                <input type="text" id="edit-city" class="form-input" value="${escapeHtml(donorProfile?.city || '')}" required />
              </div>
              <div>
                <label class="form-label" for="edit-pincode">PIN Code</label>
                <input type="text" id="edit-pincode" class="form-input" value="${escapeHtml(donorProfile?.pinCode || '')}" required pattern="[0-9]{6}" maxlength="6" />
              </div>
            </div>

            <div>
              <label class="form-label" for="edit-phone">Phone Number (Private)</label>
              <input type="tel" id="edit-phone" class="form-input" value="${escapeHtml(userProfile?.phone || '')}" required pattern="[0-9]{10}" />
            </div>

            <label class="flex items-start gap-2 pt-1 cursor-pointer">
              <input type="checkbox" id="edit-consent" ${donorProfile?.isPublicConsent !== false ? 'checked' : ''} class="mt-0.5 rounded text-red-700" />
              <span class="text-xs text-gray-700">Display my profile in public blood donor search results</span>
            </label>

            <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button type="button" id="cancel-edit-btn" class="btn-secondary text-xs cursor-pointer">Cancel</button>
              <button type="submit" id="save-edit-btn" class="btn-primary text-xs cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function setupDonorDashboardPageEvents() {
  const user = auth.currentUser;
  if (!user) return;

  // Sign out button
  const logoutBtn = document.getElementById('donor-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.hash = '#/login';
    });
  }

  // 1-Click Status switchers
  const statusBtns = document.querySelectorAll('.status-toggle-btn');
  statusBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const newStatus = target.getAttribute('data-status') as 'available' | 'resting' | 'unavailable';
      if (!newStatus) return;

      try {
        const donorRef = doc(db, 'donors', user.uid);
        await updateDoc(donorRef, {
          status: newStatus,
          isAvailable: newStatus === 'available',
          updatedAt: new Date().toISOString()
        });
        showToast(`Availability status updated to: ${newStatus}`, 'success');
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `donors/${user.uid}`);
      }
    });
  });

  // Accept contact request
  const acceptBtns = document.querySelectorAll('.btn-accept-req');
  acceptBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const reqId = target.getAttribute('data-id');
      const receiverName = target.getAttribute('data-name');
      if (!reqId) return;

      if (!confirm(`Are you sure you want to accept this request? Your phone number will be shared with ${receiverName} to coordinate blood donation.`)) {
        return;
      }

      target.disabled = true;
      target.textContent = 'Accepting...';

      try {
        // Fetch private phone from user doc
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const phone = userSnap.exists() ? userSnap.data().phone : '';
        const email = user.email || '';

        const reqRef = doc(db, 'contactRequests', reqId);
        await updateDoc(reqRef, {
          status: 'Accepted',
          donorPhoneRevealed: phone,
          donorEmailRevealed: email,
          updatedAt: new Date().toISOString()
        });

        showToast('Request accepted! Your contact has been revealed to the receiver.', 'success');
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `contactRequests/${reqId}`);
      }
    });
  });

  // Decline contact request
  const declineBtns = document.querySelectorAll('.btn-decline-req');
  declineBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const reqId = target.getAttribute('data-id');
      if (!reqId) return;

      const reason = prompt('Optional reason for declining (e.g. "Recently donated", "Traveling out of town", "Medical rest"):') || 'Unavailable at this time';

      try {
        const reqRef = doc(db, 'contactRequests', reqId);
        await updateDoc(reqRef, {
          status: 'Declined',
          declineReason: reason,
          updatedAt: new Date().toISOString()
        });
        showToast('Request declined.', 'info');
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `contactRequests/${reqId}`);
      }
    });
  });

  // --- LOG PAST DONATION MODAL & SUBMISSION (NEW) ---
  const logModal = document.getElementById('log-donation-modal');
  const openLogBtn = document.getElementById('open-log-donation-btn');
  const emptyLogBtn = document.getElementById('empty-log-donation-btn');
  const closeLogBtn = document.getElementById('close-log-modal-btn');
  const cancelLogBtn = document.getElementById('cancel-log-btn');
  const logForm = document.getElementById('log-donation-form') as HTMLFormElement | null;

  const showLogModal = () => logModal?.classList.remove('hidden');
  const hideLogModal = () => logModal?.classList.add('hidden');

  if (openLogBtn) openLogBtn.addEventListener('click', showLogModal);
  if (emptyLogBtn) emptyLogBtn.addEventListener('click', showLogModal);
  if (closeLogBtn) closeLogBtn.addEventListener('click', hideLogModal);
  if (cancelLogBtn) cancelLogBtn.addEventListener('click', hideLogModal);

  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('save-log-btn') as HTMLButtonElement;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const donationDate = (document.getElementById('log-date') as HTMLInputElement).value;
      const componentType = (document.getElementById('log-component') as HTMLSelectElement).value as BloodComponentType;
      const hospitalName = (document.getElementById('log-hospital') as HTMLInputElement).value.trim();
      const hospitalLocation = (document.getElementById('log-location') as HTMLInputElement).value.trim();
      const units = parseInt((document.getElementById('log-units') as HTMLInputElement).value, 10) || 1;
      const notes = (document.getElementById('log-notes') as HTMLTextAreaElement).value.trim();

      if (!donationDate || !hospitalName) {
        showToast('Please provide both donation date and hospital name', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Donation Record';
        return;
      }

      try {
        const donationData: Omit<DonationRecord, 'id'> = {
          donorId: user.uid,
          donationDate,
          hospitalName,
          hospitalLocation: hospitalLocation || undefined,
          units,
          componentType,
          notes: notes || undefined,
          createdAt: new Date().toISOString()
        };

        // Write directly to sub-collection /donors/{uid}/donationHistory
        const subColRef = collection(db, 'donors', user.uid, 'donationHistory');
        await addDoc(subColRef, donationData);

        showToast('Past blood donation logged successfully!', 'success');
        hideLogModal();
        window.location.reload();
      } catch (err: any) {
        console.error('Error logging donation:', err);
        handleFirestoreError(err, OperationType.CREATE, `donors/${user.uid}/donationHistory`);
      }
    });
  }

  // Delete past donation record
  const deleteDonationBtns = document.querySelectorAll('.btn-delete-donation');
  deleteDonationBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const recordId = target.getAttribute('data-id');
      const hospital = target.getAttribute('data-hospital') || 'this hospital';
      if (!recordId) return;

      if (!confirm(`Are you sure you want to delete the donation record for ${hospital}?`)) {
        return;
      }

      try {
        await deleteDoc(doc(db, 'donors', user.uid, 'donationHistory', recordId));
        showToast('Donation record deleted.', 'info');
        window.location.reload();
      } catch (err: any) {
        console.error('Error deleting donation record:', err);
        handleFirestoreError(err, OperationType.DELETE, `donors/${user.uid}/donationHistory/${recordId}`);
      }
    });
  });

  // Edit profile modal handling
  const editModal = document.getElementById('edit-profile-modal');
  const openEditBtn = document.getElementById('donor-edit-profile-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const editForm = document.getElementById('edit-profile-form') as HTMLFormElement | null;

  if (openEditBtn && editModal) {
    openEditBtn.addEventListener('click', () => editModal.classList.remove('hidden'));
  }

  const hideModal = () => editModal?.classList.add('hidden');
  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', hideModal);

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('save-edit-btn') as HTMLButtonElement;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const fullName = (document.getElementById('edit-name') as HTMLInputElement).value.trim();
      const city = (document.getElementById('edit-city') as HTMLInputElement).value.trim();
      const pinCode = (document.getElementById('edit-pincode') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('edit-phone') as HTMLInputElement).value.trim();
      const isPublicConsent = (document.getElementById('edit-consent') as HTMLInputElement).checked;

      try {
        const now = new Date().toISOString();
        // Update user doc
        await updateDoc(doc(db, 'users', user.uid), {
          fullName,
          city,
          pinCode,
          phone,
          updatedAt: now
        });

        // Update donor doc
        await updateDoc(doc(db, 'donors', user.uid), {
          fullName,
          city,
          pinCode,
          isPublicConsent,
          updatedAt: now
        });

        showToast('Profile updated successfully!', 'success');
        hideModal();
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    });
  }
}
