import { 
  auth, 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  currentUserProfile 
} from '../firebase.ts';
import { BloodRequest, BloodGroup, UrgencyLevel } from '../types.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';

export async function renderBloodRequestsPage(): Promise<string> {
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const isNewAction = urlParams.get('action') === 'new';
  const filterBlood = urlParams.get('blood') || '';
  const filterCity = urlParams.get('city') || '';

  let allRequests: BloodRequest[] = [];
  try {
    const snap = await getDocs(collection(db, 'bloodRequests'));
    allRequests = snap.docs.map(d => ({ id: d.id, ...d.data() } as BloodRequest));
    allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching blood requests:', err);
  }

  // Filter
  const filteredRequests = allRequests.filter(req => {
    if (filterBlood && req.patientBloodGroup !== filterBlood) return false;
    if (filterCity && !req.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
    return true;
  });

  const user = auth.currentUser;

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-200 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>Community Blood Requirements</span>
            <span class="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full">
              ${filteredRequests.length} Active Listings
            </span>
          </h1>
          <p class="text-xs text-gray-500 mt-1">
            Urgent requests from hospitals and families. If you are an eligible donor nearby, please respond or share.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="toggle-list-view-btn" class="btn-secondary text-xs py-2 px-3 ${!isNewAction ? 'border-red-700 text-red-700 font-bold' : ''}">
            📋 Browse Requests
          </button>
          <button id="toggle-new-view-btn" class="btn-primary text-xs py-2 px-4 ${isNewAction ? 'ring-2 ring-red-400' : ''}">
            + Post Blood Requirement
          </button>
        </div>
      </div>

      <!-- VIEW 1: Post Requirement Form (Hidden or visible depending on action) -->
      <div id="post-requirement-panel" class="${isNewAction ? '' : 'hidden'} card-student p-6 sm:p-8 border-2 border-red-200 bg-white">
        <div class="border-b border-gray-100 pb-4 mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span class="text-red-700">🩸</span> Submit a Patient Blood Requirement
          </h2>
          <p class="text-xs text-gray-500 mt-1">
            Fill in the medical details and hospital location. This will be published immediately to voluntary donors.
          </p>
        </div>

        ${!user ? `
          <div class="bg-amber-50 border border-amber-300 p-4 rounded text-center text-xs text-amber-900 space-y-2 mb-6">
            <p class="font-bold">Please Sign In to Post a Blood Requirement</p>
            <p>Creating an account takes less than 30 seconds and lets you track donor responses and update request status.</p>
            <div class="flex justify-center gap-3 pt-1">
              <a href="#/login?role=receiver" class="btn-primary text-xs">Sign In</a>
              <a href="#/register-receiver" class="btn-secondary text-xs">Register as Receiver</a>
            </div>
          </div>
        ` : ''}

        <form id="create-blood-request-form" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="form-label" for="req-blood-group">Required Blood Group <span class="text-red-600">*</span></label>
              <select id="req-blood-group" class="form-input font-bold text-red-900" required>
                <option value="">Select Blood Group</option>
                <option value="A+">A+ (A Positive)</option>
                <option value="A-">A- (A Negative)</option>
                <option value="B+">B+ (B Positive)</option>
                <option value="B-">B- (B Negative)</option>
                <option value="AB+">AB+ (AB Positive)</option>
                <option value="AB-">AB- (AB Negative)</option>
                <option value="O+">O+ (O Positive)</option>
                <option value="O-">O- (O Negative)</option>
              </select>
            </div>

            <div>
              <label class="form-label" for="req-units">Units Needed <span class="text-red-600">*</span></label>
              <input type="number" id="req-units" class="form-input" min="1" max="20" value="1" required />
            </div>

            <div>
              <label class="form-label" for="req-urgency">Urgency Level <span class="text-red-600">*</span></label>
              <select id="req-urgency" class="form-input font-semibold" required>
                <option value="Emergency">🚨 Emergency (Immediate / Surgery)</option>
                <option value="Urgent">⚠️ Urgent (Within 24 Hours)</option>
                <option value="Normal">ℹ️ Normal (Planned 2-5 Days)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label" for="req-hospital-name">Hospital Name <span class="text-red-600">*</span></label>
              <input type="text" id="req-hospital-name" class="form-input" placeholder="e.g. Lilavati Hospital & Research Centre" required maxlength="120" />
            </div>

            <div>
              <label class="form-label" for="req-hospital-location">Hospital Area / Ward / Street <span class="text-red-600">*</span></label>
              <input type="text" id="req-hospital-location" class="form-input" placeholder="e.g. Bandra West, Near Reclamation" required maxlength="150" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="form-label" for="req-city">City / District <span class="text-red-600">*</span></label>
              <input type="text" id="req-city" class="form-input" placeholder="e.g. Mumbai" value="${escapeHtml(currentUserProfile?.city || '')}" required maxlength="60" />
            </div>

            <div>
              <label class="form-label" for="req-pincode">PIN Code <span class="text-red-600">*</span></label>
              <input type="text" id="req-pincode" class="form-input" placeholder="e.g. 400050" value="${escapeHtml(currentUserProfile?.pinCode || '')}" required pattern="[0-9]{6}" maxlength="6" />
            </div>

            <div>
              <label class="form-label" for="req-date">Required Date <span class="text-red-600">*</span></label>
              <input type="text" id="req-date" class="form-input" placeholder="e.g. Today evening, 12th Nov" required maxlength="40" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label class="form-label" for="req-contact-name">Contact Person Name <span class="text-red-600">*</span></label>
              <input type="text" id="req-contact-name" class="form-input" value="${escapeHtml(currentUserProfile?.fullName || user?.displayName || '')}" required />
            </div>

            <div>
              <label class="form-label" for="req-contact-phone">Contact Phone for Hospital Verification <span class="text-red-600">*</span></label>
              <input type="tel" id="req-contact-phone" class="form-input" value="${escapeHtml(currentUserProfile?.phone || '')}" placeholder="10-digit mobile number" required pattern="[0-9]{10}" />
            </div>
          </div>

          <div>
            <label class="form-label" for="req-notes">Case Details & Additional Information</label>
            <textarea id="req-notes" rows="3" class="form-input" placeholder="Specify patient condition (e.g. Platelet requirement, planned bypass surgery, replacement donor needed)..."></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-3">
            <button type="button" id="cancel-post-btn" class="btn-secondary text-xs">Cancel</button>
            <button type="submit" id="submit-req-btn" ${!user ? 'disabled' : ''} class="btn-primary text-sm py-2 px-6">
              Publish Blood Requirement
            </button>
          </div>
        </form>
      </div>

      <!-- VIEW 2: Browse Community Requests Board -->
      <div id="browse-requirements-panel" class="${isNewAction ? 'hidden' : ''} space-y-6">
        
        <!-- Filter bar -->
        <div class="card-student p-4 bg-white border border-gray-200">
          <form id="req-filter-form" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label text-xs">Filter by Blood Group</label>
              <select id="req-filter-blood" class="form-input text-sm">
                <option value="">All Blood Groups</option>
                <option value="A+" ${filterBlood === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${filterBlood === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${filterBlood === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${filterBlood === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${filterBlood === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${filterBlood === 'AB-' ? 'selected' : ''}>AB-</option>
                <option value="O+" ${filterBlood === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${filterBlood === 'O-' ? 'selected' : ''}>O-</option>
              </select>
            </div>

            <div>
              <label class="form-label text-xs">Filter by City</label>
              <input type="text" id="req-filter-city" value="${escapeHtml(filterCity)}" placeholder="e.g. Mumbai, Delhi, Bengaluru" class="form-input text-sm" />
            </div>

            <div class="flex items-end gap-2">
              <button type="submit" class="btn-primary w-full py-2.5 text-sm">
                Filter Requests
              </button>
              <button type="button" id="req-reset-filter-btn" class="btn-secondary py-2.5 px-3 text-xs">
                Reset
              </button>
            </div>
          </form>
        </div>

        <!-- Requests Grid -->
        ${filteredRequests.length === 0 ? `
          <div class="card-student p-12 text-center text-gray-500 space-y-2">
            <div class="text-4xl">🏥</div>
            <p class="font-bold text-gray-700">No active blood requests match your filter.</p>
            <p class="text-xs text-gray-400">Be the first to post a requirement or clear filters to view all entries.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${filteredRequests.map(req => {
              const isEmergency = req.urgency === 'Emergency';
              const isUrgent = req.urgency === 'Urgent';
              const isFulfilled = req.status === 'Fulfilled';

              return `
                <div class="card-student p-5 border-l-4 ${isFulfilled ? 'border-l-green-600 bg-green-50/10' : isEmergency ? 'border-l-red-700' : isUrgent ? 'border-l-amber-500' : 'border-l-blue-600'} flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div class="flex items-start justify-between mb-3">
                      <span class="badge-blood text-sm font-mono px-3 py-1">
                        ${escapeHtml(req.patientBloodGroup)}
                      </span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs px-2 py-0.5 rounded font-semibold ${
                          isEmergency ? 'bg-red-100 text-red-800' :
                          isUrgent ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }">
                          ${escapeHtml(req.urgency)}
                        </span>
                        <span class="text-xs px-2 py-0.5 rounded font-medium ${
                          isFulfilled ? 'bg-green-100 text-green-800 font-bold' :
                          req.status === 'Donors contacted' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-700'
                        }">
                          ${escapeHtml(req.status)}
                        </span>
                      </div>
                    </div>

                    <h3 class="font-bold text-base text-gray-900">${escapeHtml(req.hospitalName)}</h3>
                    <p class="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                      <span>📍 ${escapeHtml(req.hospitalLocation ? `${req.hospitalLocation}, ` : '')}<strong>${escapeHtml(req.city)}</strong></span>
                      <span>(PIN: ${escapeHtml(req.pinCode)})</span>
                    </p>

                    <div class="bg-gray-50 p-3 rounded text-xs text-gray-700 my-3 space-y-1.5 border border-gray-100">
                      <div class="flex justify-between">
                        <span class="text-gray-500">Units Required:</span>
                        <strong class="text-red-900 font-mono">${req.unitsNeeded} Units</strong>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">Needed By:</span>
                        <span class="font-semibold text-gray-800">${escapeHtml(req.requiredDate)}</span>
                      </div>
                      ${req.additionalNotes ? `
                        <div class="pt-1.5 border-t border-gray-200 text-gray-600 text-[11px] italic">
                          "${escapeHtml(req.additionalNotes)}"
                        </div>
                      ` : ''}
                    </div>

                    <div class="text-xs text-gray-600 bg-red-50/50 p-2 rounded border border-red-100 space-y-0.5">
                      <div class="font-semibold text-gray-900">Contact Person: ${escapeHtml(req.receiverName)}</div>
                      <div class="flex items-center gap-2">
                        <span>Phone:</span>
                        <a href="tel:${escapeHtml(req.receiverPhone)}" class="font-mono font-bold text-red-800 hover:underline">
                          📞 ${escapeHtml(req.receiverPhone)}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div class="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <span class="text-[11px] text-gray-400">Posted ${new Date(req.createdAt).toLocaleDateString()}</span>
                    <a href="#/find-donors?blood=${encodeURIComponent(req.patientBloodGroup)}&city=${encodeURIComponent(req.city)}" class="text-xs font-bold text-red-700 hover:underline">
                      Find Matching Donors →
                    </a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

export function setupBloodRequestsPageEvents() {
  const toggleListBtn = document.getElementById('toggle-list-view-btn');
  const toggleNewBtn = document.getElementById('toggle-new-view-btn');
  const postPanel = document.getElementById('post-requirement-panel');
  const browsePanel = document.getElementById('browse-requirements-panel');
  const cancelPostBtn = document.getElementById('cancel-post-btn');

  const showPost = () => {
    postPanel?.classList.remove('hidden');
    browsePanel?.classList.add('hidden');
    toggleNewBtn?.classList.add('ring-2', 'ring-red-400');
    toggleListBtn?.classList.remove('border-red-700', 'text-red-700', 'font-bold');
  };

  const showBrowse = () => {
    postPanel?.classList.add('hidden');
    browsePanel?.classList.remove('hidden');
    toggleNewBtn?.classList.remove('ring-2', 'ring-red-400');
    toggleListBtn?.classList.add('border-red-700', 'text-red-700', 'font-bold');
  };

  if (toggleNewBtn) toggleNewBtn.addEventListener('click', showPost);
  if (toggleListBtn) toggleListBtn.addEventListener('click', showBrowse);
  if (cancelPostBtn) cancelPostBtn.addEventListener('click', showBrowse);

  // Filter form
  const filterForm = document.getElementById('req-filter-form') as HTMLFormElement | null;
  const resetBtn = document.getElementById('req-reset-filter-btn');

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const blood = (document.getElementById('req-filter-blood') as HTMLSelectElement).value;
      const city = (document.getElementById('req-filter-city') as HTMLInputElement).value.trim();

      const params = new URLSearchParams();
      if (blood) params.set('blood', blood);
      if (city) params.set('city', city);
      window.location.hash = `#/blood-requests?${params.toString()}`;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.location.hash = '#/blood-requests';
    });
  }

  // Create blood request form
  const createForm = document.getElementById('create-blood-request-form') as HTMLFormElement | null;
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) {
        showToast('Please sign in as receiver to submit a blood request', 'error');
        window.location.hash = '#/login?role=receiver';
        return;
      }

      const submitBtn = document.getElementById('submit-req-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';

      const patientBloodGroup = (document.getElementById('req-blood-group') as HTMLSelectElement).value as BloodGroup;
      const unitsNeeded = parseInt((document.getElementById('req-units') as HTMLInputElement).value, 10) || 1;
      const urgency = (document.getElementById('req-urgency') as HTMLSelectElement).value as UrgencyLevel;
      const hospitalName = (document.getElementById('req-hospital-name') as HTMLInputElement).value.trim();
      const hospitalLocation = (document.getElementById('req-hospital-location') as HTMLInputElement).value.trim();
      const city = (document.getElementById('req-city') as HTMLInputElement).value.trim();
      const pinCode = (document.getElementById('req-pincode') as HTMLInputElement).value.trim();
      const requiredDate = (document.getElementById('req-date') as HTMLInputElement).value.trim();
      const receiverName = (document.getElementById('req-contact-name') as HTMLInputElement).value.trim();
      const receiverPhone = (document.getElementById('req-contact-phone') as HTMLInputElement).value.trim();
      const additionalNotes = (document.getElementById('req-notes') as HTMLTextAreaElement).value.trim();

      try {
        const newReq: Omit<BloodRequest, 'id'> = {
          receiverId: user.uid,
          receiverName,
          receiverPhone,
          receiverEmail: user.email || '',
          patientBloodGroup,
          unitsNeeded,
          hospitalName,
          hospitalLocation,
          city,
          pinCode,
          requiredDate,
          urgency,
          additionalNotes: additionalNotes || undefined,
          status: 'Pending',
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'bloodRequests'), newReq);

        showToast('Blood requirement published successfully! Donors can now view and respond.', 'success');
        window.location.hash = '#/receiver-dashboard';
      } catch (err: any) {
        console.error('Error submitting blood request:', err);
        showToast(err.message || 'Failed to publish requirement', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Blood Requirement';
      }
    });
  }
}
