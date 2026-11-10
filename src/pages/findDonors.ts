import { 
  auth, 
  db, 
  collection, 
  getDocs, 
  addDoc,
  currentUserProfile
} from '../firebase.ts';
import { DonorProfile, BloodGroup, ContactRequest } from '../types.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';

export async function renderFindDonorsPage(): Promise<string> {
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const filterBlood = urlParams.get('blood') || '';
  const filterCity = urlParams.get('city') || '';
  const filterPincode = urlParams.get('pincode') || '';

  let allDonors: DonorProfile[] = [];
  try {
    const donorsSnap = await getDocs(collection(db, 'donors'));
    allDonors = donorsSnap.docs.map(d => ({ userId: d.id, ...d.data() } as DonorProfile));
  } catch (err) {
    console.error('Error fetching donors from Firestore:', err);
  }

  // Filter in memory for maximum search flexibility (case-insensitive city, substring, pincode, consent)
  const filteredDonors = allDonors.filter(d => {
    // Must have consented to public display
    if (d.isPublicConsent === false) return false;

    // Blood filter
    if (filterBlood && d.bloodGroup !== filterBlood) return false;

    // City filter
    if (filterCity) {
      const qCity = filterCity.toLowerCase();
      if (!d.city.toLowerCase().includes(qCity)) return false;
    }

    // PIN code filter
    if (filterPincode && !d.pinCode.includes(filterPincode)) return false;

    return true;
  });

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <!-- Page Header -->
      <div class="border-b border-gray-200 pb-5">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span>Find Voluntary Blood Donors</span>
          <span class="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full">
            ${filteredDonors.length} Donors Found
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-1">
          Search registered voluntary blood donors by blood group, city, or PIN code. Direct contact is facilitated through a privacy-protected consent request.
        </p>
      </div>

      <!-- Filter Controls Bar -->
      <div class="card-student p-4 sm:p-5 bg-white border border-gray-200">
        <form id="donor-filter-form" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label class="form-label text-xs">Blood Group</label>
            <select id="filter-blood" class="form-input text-sm font-semibold">
              <option value="">All Blood Groups</option>
              <option value="A+" ${filterBlood === 'A+' ? 'selected' : ''}>A+ (Positive)</option>
              <option value="A-" ${filterBlood === 'A-' ? 'selected' : ''}>A- (Negative)</option>
              <option value="B+" ${filterBlood === 'B+' ? 'selected' : ''}>B+ (Positive)</option>
              <option value="B-" ${filterBlood === 'B-' ? 'selected' : ''}>B- (Negative)</option>
              <option value="AB+" ${filterBlood === 'AB+' ? 'selected' : ''}>AB+ (Positive)</option>
              <option value="AB-" ${filterBlood === 'AB-' ? 'selected' : ''}>AB- (Negative)</option>
              <option value="O+" ${filterBlood === 'O+' ? 'selected' : ''}>O+ (Positive)</option>
              <option value="O-" ${filterBlood === 'O-' ? 'selected' : ''}>O- (Universal Donor)</option>
            </select>
          </div>

          <div>
            <label class="form-label text-xs">City / District</label>
            <input type="text" id="filter-city" value="${escapeHtml(filterCity)}" placeholder="e.g. Mumbai, Delhi, Bengaluru" class="form-input text-sm" />
          </div>

          <div>
            <label class="form-label text-xs">PIN Code</label>
            <input type="text" id="filter-pincode" value="${escapeHtml(filterPincode)}" placeholder="e.g. 400001" class="form-input text-sm" maxlength="6" />
          </div>

          <div class="flex items-end gap-2">
            <button type="submit" class="btn-primary w-full py-2.5 text-sm">
              Apply Filters
            </button>
            <button type="button" id="clear-filter-btn" class="btn-secondary py-2.5 px-3 text-xs" title="Reset Filters">
              Reset
            </button>
          </div>
        </form>
      </div>

      <!-- Privacy Assurance Banner -->
      <div class="bg-gray-100 border border-gray-300 p-3 rounded-md text-xs text-gray-700 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-red-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
          <span><strong>Privacy Protected:</strong> Donor phone numbers are kept confidential until the donor voluntarily accepts your request.</span>
        </div>
        <span class="text-[11px] text-gray-500 hidden sm:inline">No commercial agents • 100% Voluntary</span>
      </div>

      <!-- Donors Cards Grid -->
      ${filteredDonors.length === 0 ? `
        <div class="card-student p-12 text-center text-gray-500 space-y-3">
          <div class="text-4xl">🔍</div>
          <h3 class="text-lg font-bold text-gray-800">No matching donors found</h3>
          <p class="text-xs text-gray-500 max-w-md mx-auto">
            Try clearing the filters or broadening your search city. You can also submit an urgent Blood Requirement so nearby donors and community members can reach out to you.
          </p>
          <div class="pt-2 flex justify-center gap-3">
            <button id="empty-clear-btn" class="btn-secondary text-xs">Clear Filters</button>
            <a href="#/blood-requests?action=new" class="btn-primary text-xs">+ Post Blood Requirement</a>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          ${filteredDonors.map(donor => {
            const isAvail = donor.status === 'available';
            const isResting = donor.status === 'resting';

            return `
              <div class="card-student p-5 flex flex-col justify-between hover:border-red-400 hover:shadow-md transition">
                <div>
                  <div class="flex items-start justify-between gap-2 mb-3">
                    <span class="badge-blood text-base px-3 py-1 font-mono shadow-xs">
                      ${escapeHtml(donor.bloodGroup)}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded font-semibold ${
                      isAvail ? 'bg-green-100 text-green-800' :
                      isResting ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }">
                      ${isAvail ? '🟢 Available' : isResting ? '🟡 Resting' : '⚪ Busy'}
                    </span>
                  </div>

                  <h3 class="font-bold text-base text-gray-900">${escapeHtml(donor.fullName)}</h3>
                  <p class="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <span>📍 <strong>${escapeHtml(donor.city)}</strong></span>
                    <span>•</span>
                    <span>PIN: ${escapeHtml(donor.pinCode)}</span>
                  </p>

                  <div class="bg-gray-50 p-2 rounded text-xs text-gray-500 mt-3 space-y-0.5 border border-gray-100">
                    <div>Age: <strong>${donor.age || '18-65'}</strong> ${donor.gender ? `• Gender: ${escapeHtml(donor.gender)}` : ''}</div>
                    <div class="text-[11px] text-gray-400">Registered Voluntary Donor</div>
                  </div>
                </div>

                <div class="pt-4 mt-4 border-t border-gray-100">
                  <button 
                    class="btn-request-contact btn-primary w-full text-xs py-2" 
                    data-id="${donor.userId}" 
                    data-name="${escapeHtml(donor.fullName)}" 
                    data-blood="${escapeHtml(donor.bloodGroup)}"
                    data-city="${escapeHtml(donor.city)}"
                  >
                    Request Contact
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Contact Request Modal -->
      <div id="contact-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-gray-200 pb-3">
            <div>
              <h3 class="font-bold text-base text-gray-900">Request Donor Contact</h3>
              <p class="text-xs text-gray-500">To donor: <strong id="modal-donor-name" class="text-red-800"></strong></p>
            </div>
            <button id="modal-close-btn" class="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">&times;</button>
          </div>

          <form id="contact-request-form" class="space-y-3">
            <input type="hidden" id="modal-donor-id" />
            <input type="hidden" id="modal-donor-blood" />

            <div>
              <label class="form-label text-xs" for="modal-receiver-name">Your Full Name <span class="text-red-600">*</span></label>
              <input type="text" id="modal-receiver-name" class="form-input text-xs" required />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label text-xs" for="modal-receiver-phone">Your Phone <span class="text-red-600">*</span></label>
                <input type="tel" id="modal-receiver-phone" class="form-input text-xs" placeholder="10 digits" required pattern="[0-9]{10}" />
              </div>
              <div>
                <label class="form-label text-xs" for="modal-receiver-email">Your Email</label>
                <input type="email" id="modal-receiver-email" class="form-input text-xs" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label text-xs" for="modal-hospital">Hospital Name <span class="text-red-600">*</span></label>
                <input type="text" id="modal-hospital" class="form-input text-xs" placeholder="e.g. Apollo Hospital" required />
              </div>
              <div>
                <label class="form-label text-xs" for="modal-urgency">Urgency</label>
                <select id="modal-urgency" class="form-input text-xs">
                  <option value="Emergency">Emergency (Immediate)</option>
                  <option value="Urgent">Urgent (24h)</option>
                  <option value="Normal">Normal (Scheduled)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label text-xs" for="modal-message">Message for Donor</label>
              <textarea id="modal-message" rows="3" class="form-input text-xs" placeholder="Provide brief patient details or unit requirement..."></textarea>
            </div>

            <div class="bg-gray-50 p-2.5 rounded text-[11px] text-gray-600 border border-gray-200">
              ℹ️ Sending this request notifies the donor. Once they approve it, their phone number will be displayed in your Receiver Dashboard.
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" id="modal-cancel-btn" class="btn-secondary text-xs">Cancel</button>
              <button type="submit" id="modal-submit-btn" class="btn-primary text-xs">Send Request</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function setupFindDonorsPageEvents() {
  const form = document.getElementById('donor-filter-form') as HTMLFormElement | null;
  const clearBtn = document.getElementById('clear-filter-btn');
  const emptyClearBtn = document.getElementById('empty-clear-btn');

  const handleFilter = (e?: Event) => {
    if (e) e.preventDefault();
    const blood = (document.getElementById('filter-blood') as HTMLSelectElement)?.value || '';
    const city = (document.getElementById('filter-city') as HTMLInputElement)?.value.trim() || '';
    const pincode = (document.getElementById('filter-pincode') as HTMLInputElement)?.value.trim() || '';

    const params = new URLSearchParams();
    if (blood) params.set('blood', blood);
    if (city) params.set('city', city);
    if (pincode) params.set('pincode', pincode);

    window.location.hash = `#/find-donors?${params.toString()}`;
  };

  if (form) form.addEventListener('submit', handleFilter);

  const resetFilters = () => {
    window.location.hash = '#/find-donors';
  };
  if (clearBtn) clearBtn.addEventListener('click', resetFilters);
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', resetFilters);

  // Modal elements
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const contactForm = document.getElementById('contact-request-form') as HTMLFormElement | null;

  const hideModal = () => modal?.classList.add('hidden');
  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

  // Request contact buttons
  const requestBtns = document.querySelectorAll('.btn-request-contact');
  requestBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const user = auth.currentUser;
      if (!user) {
        showToast('Please sign in or register to contact donors', 'info');
        window.location.hash = '#/login?role=receiver';
        return;
      }

      const target = e.currentTarget as HTMLButtonElement;
      const donorId = target.getAttribute('data-id') || '';
      const donorName = target.getAttribute('data-name') || '';
      const donorBlood = target.getAttribute('data-blood') || '';

      const modalDonorName = document.getElementById('modal-donor-name');
      const modalDonorId = document.getElementById('modal-donor-id') as HTMLInputElement;
      const modalDonorBlood = document.getElementById('modal-donor-blood') as HTMLInputElement;
      const receiverNameInput = document.getElementById('modal-receiver-name') as HTMLInputElement;
      const receiverPhoneInput = document.getElementById('modal-receiver-phone') as HTMLInputElement;
      const receiverEmailInput = document.getElementById('modal-receiver-email') as HTMLInputElement;

      if (modalDonorName) modalDonorName.textContent = `${donorName} (${donorBlood})`;
      if (modalDonorId) modalDonorId.value = donorId;
      if (modalDonorBlood) modalDonorBlood.value = donorBlood;

      // Prefill receiver details from current profile
      if (currentUserProfile) {
        if (receiverNameInput) receiverNameInput.value = currentUserProfile.fullName;
        if (receiverPhoneInput) receiverPhoneInput.value = currentUserProfile.phone;
        if (receiverEmailInput) receiverEmailInput.value = currentUserProfile.email;
      } else {
        if (receiverEmailInput) receiverEmailInput.value = user.email || '';
        if (receiverNameInput) receiverNameInput.value = user.displayName || '';
      }

      modal?.classList.remove('hidden');
    });
  });

  // Submit contact request form
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) {
        showToast('Authentication required', 'error');
        return;
      }

      const submitBtn = document.getElementById('modal-submit-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const donorId = (document.getElementById('modal-donor-id') as HTMLInputElement).value;
      const donorBlood = (document.getElementById('modal-donor-blood') as HTMLInputElement).value;
      const receiverName = (document.getElementById('modal-receiver-name') as HTMLInputElement).value.trim();
      const receiverPhone = (document.getElementById('modal-receiver-phone') as HTMLInputElement).value.trim();
      const receiverEmail = (document.getElementById('modal-receiver-email') as HTMLInputElement).value.trim();
      const hospitalName = (document.getElementById('modal-hospital') as HTMLInputElement).value.trim();
      const urgency = (document.getElementById('modal-urgency') as HTMLSelectElement).value;
      const message = (document.getElementById('modal-message') as HTMLTextAreaElement).value.trim();
      const donorName = document.getElementById('modal-donor-name')?.textContent || 'Donor';

      try {
        const contactReq: Omit<ContactRequest, 'id'> = {
          donorId,
          donorName,
          receiverId: user.uid,
          receiverName,
          receiverPhone,
          receiverEmail,
          patientBloodGroup: donorBlood,
          hospitalName,
          urgency,
          message,
          status: 'Pending',
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'contactRequests'), contactReq);

        showToast('Contact request sent to donor! You can track response on your dashboard.', 'success');
        hideModal();
        window.location.hash = '#/receiver-dashboard';
      } catch (err: any) {
        console.error('Error sending contact request:', err);
        showToast(err.message || 'Failed to send contact request', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Request';
      }
    });
  }
}
