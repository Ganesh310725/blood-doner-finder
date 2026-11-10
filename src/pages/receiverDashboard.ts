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
  deleteDoc
} from '../firebase.ts';
import { UserProfile, BloodRequest, ContactRequest } from '../types.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';

export async function renderReceiverDashboardPage(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    return `
      <div class="max-w-md mx-auto py-16 px-4 text-center">
        <div class="card-student p-8">
          <p class="text-gray-600 mb-4">Please log in to view your Receiver Dashboard.</p>
          <a href="#/login?role=receiver" class="btn-primary">Sign In as Receiver</a>
        </div>
      </div>
    `;
  }

  let userProfile: UserProfile | null = null;
  let myBloodRequests: BloodRequest[] = [];
  let myContactRequests: ContactRequest[] = [];

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      userProfile = userSnap.data() as UserProfile;
    }

    // Fetch blood requests created by this receiver
    const reqRef = collection(db, 'bloodRequests');
    const reqQuery = query(reqRef, where('receiverId', '==', user.uid));
    const reqSnap = await getDocs(reqQuery);
    myBloodRequests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as BloodRequest));

    // Fetch contact requests sent to donors
    const contactRef = collection(db, 'contactRequests');
    const contactQuery = query(contactRef, where('receiverId', '==', user.uid));
    const contactSnap = await getDocs(contactQuery);
    myContactRequests = contactSnap.docs.map(d => ({ id: d.id, ...d.data() } as ContactRequest));
  } catch (err) {
    console.error('Error fetching receiver dashboard data:', err);
  }

  const pendingRequests = myBloodRequests.filter(r => r.status === 'Pending').length;
  const acceptedContacts = myContactRequests.filter(c => c.status === 'Accepted').length;

  return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Welcome Header -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-red-800">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-2xl">
            🏥
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-900">
                Welcome, ${escapeHtml(userProfile?.fullName || user.displayName || 'Receiver')}!
              </h1>
              <span class="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Receiver Account
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              📍 ${escapeHtml(userProfile?.city || 'City')} (PIN: ${escapeHtml(userProfile?.pinCode || '------')}) • ${escapeHtml(user.email || '')}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <a href="#/find-donors" class="btn-primary text-xs py-2 px-3 flex-1 md:flex-none">
            🔍 Search Donors
          </a>
          <a href="#/blood-requests?action=new" class="btn-outline-red text-xs py-2 px-3 flex-1 md:flex-none">
            + Create Blood Request
          </a>
          <button id="receiver-logout-btn" class="btn-secondary text-xs py-2 px-3">
            Sign Out
          </button>
        </div>
      </div>

      <!-- Quick Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card-student p-4 border-l-4 border-l-red-700">
          <div class="text-xs font-semibold text-gray-500 uppercase">My Active Blood Requirements</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">${pendingRequests} Pending</div>
        </div>
        <div class="card-student p-4 border-l-4 border-l-green-600">
          <div class="text-xs font-semibold text-gray-500 uppercase">Donors Accepted Contacts</div>
          <div class="text-2xl font-bold text-green-700 mt-1">${acceptedContacts} Connected</div>
        </div>
        <div class="card-student p-4 border-l-4 border-l-blue-600">
          <div class="text-xs font-semibold text-gray-500 uppercase">Total Requests Sent</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">${myContactRequests.length} Donor Inquiries</div>
        </div>
      </div>

      <!-- Section 1: Contact Requests Sent to Donors (With Revealed Phone Numbers) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Contact Requests to Donors</span>
              ${acceptedContacts > 0 ? `<span class="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">${acceptedContacts} Numbers Available</span>` : ''}
            </h2>
            <p class="text-xs text-gray-500">
              When a donor accepts your contact request, their phone number is revealed below so you can call them directly.
            </p>
          </div>
          <a href="#/find-donors" class="text-xs font-bold text-red-700 hover:underline">
            + Search & Request More Donors
          </a>
        </div>

        ${myContactRequests.length === 0 ? `
          <div class="card-student p-6 text-center text-gray-500">
            <p class="text-sm">You haven't sent any contact requests to donors yet.</p>
            <p class="text-xs text-gray-400 mt-1">Visit "Find Donors", filter by blood group and city, then click "Request Contact".</p>
            <a href="#/find-donors" class="btn-primary text-xs py-2 px-4 mt-3 inline-block">Find Donors Now</a>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${myContactRequests.map(contact => {
              const isAccepted = contact.status === 'Accepted';
              const isPending = contact.status === 'Pending';
              const isDeclined = contact.status === 'Declined';

              return `
                <div class="card-student p-5 border-l-4 ${isAccepted ? 'border-l-green-600 bg-green-50/20' : isPending ? 'border-l-amber-500' : 'border-l-gray-400'}">
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 class="font-bold text-sm text-gray-900">Donor: ${escapeHtml(contact.donorName)}</h4>
                      <p class="text-xs text-gray-500">For Hospital: ${escapeHtml(contact.hospitalName)} • Blood: <span class="font-mono font-bold text-red-800">${escapeHtml(contact.patientBloodGroup)}</span></p>
                    </div>
                    <span class="text-xs px-2.5 py-0.5 rounded font-semibold ${
                      isAccepted ? 'bg-green-100 text-green-800' :
                      isPending ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }">
                      ${escapeHtml(contact.status)}
                    </span>
                  </div>

                  ${isAccepted ? `
                    <div class="bg-white border border-green-300 rounded p-3 my-2 text-xs space-y-1.5 shadow-xs">
                      <div class="font-bold text-green-800 flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z"/></svg>
                        Donor Contact Details Unlocked!
                      </div>
                      <div class="flex items-center justify-between pt-1">
                        <span class="text-gray-600">Phone:</span>
                        <a href="tel:${escapeHtml(contact.donorPhoneRevealed || '')}" class="font-mono font-bold text-sm text-red-800 hover:underline">
                          📞 ${escapeHtml(contact.donorPhoneRevealed || 'Contact center')}
                        </a>
                      </div>
                      ${contact.donorEmailRevealed ? `
                        <div class="flex items-center justify-between text-gray-600">
                          <span>Email:</span>
                          <span class="font-medium">${escapeHtml(contact.donorEmailRevealed)}</span>
                        </div>
                      ` : ''}
                      <p class="text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                        Please call immediately to coordinate hospital donation time.
                      </p>
                    </div>
                  ` : isPending ? `
                    <p class="text-xs text-amber-800 bg-amber-50 p-2 rounded my-2">
                      ⏳ Contact request delivered. Waiting for donor to review and accept. Once accepted, their phone number will appear here.
                    </p>
                  ` : `
                    <p class="text-xs text-gray-500 bg-gray-50 p-2 rounded my-2">
                      Donor was unable to accept this request${contact.declineReason ? ` (${escapeHtml(contact.declineReason)})` : ''}. Please search and contact alternative donors.
                    </p>
                  `}

                  <div class="text-[11px] text-gray-400 mt-2 flex justify-between">
                    <span>Sent on ${new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Section 2: Submitted Blood Requests -->
      <div class="space-y-4 pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">My Submitted Blood Requirements</h2>
            <p class="text-xs text-gray-500">Requirements listed on the public emergency directory.</p>
          </div>
          <a href="#/blood-requests?action=new" class="btn-primary text-xs py-1.5 px-3">
            + New Requirement
          </a>
        </div>

        ${myBloodRequests.length === 0 ? `
          <div class="card-student p-6 text-center text-gray-500">
            <p class="text-sm">You haven't posted any blood requirements yet.</p>
            <a href="#/blood-requests?action=new" class="btn-outline-red text-xs py-2 px-4 mt-3 inline-block">Submit Blood Requirement</a>
          </div>
        ` : `
          <div class="space-y-3">
            ${myBloodRequests.map(req => {
              return `
                <div class="card-student p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="badge-blood text-xs font-mono px-2 py-0.5">${escapeHtml(req.patientBloodGroup)}</span>
                      <span class="font-bold text-sm text-gray-900">${escapeHtml(req.hospitalName)}</span>
                      <span class="text-xs px-2 py-0.5 rounded font-semibold ${
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'Donors contacted' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'Fulfilled' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-600'
                      }">
                        ${escapeHtml(req.status)}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500">
                      📍 ${escapeHtml(req.hospitalLocation ? `${req.hospitalLocation}, ` : '')}${escapeHtml(req.city)} • Units Needed: <strong>${req.unitsNeeded}</strong> • Urgency: <strong>${escapeHtml(req.urgency)}</strong>
                    </p>
                    <p class="text-[11px] text-gray-400">
                      Required Date: ${escapeHtml(req.requiredDate)} • Posted on ${new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <!-- Status Updater -->
                  <div class="flex items-center gap-2 pt-2 sm:pt-0">
                    <select class="req-status-select form-input text-xs py-1 px-2 w-auto" data-id="${req.id}">
                      <option value="Pending" ${req.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Donors contacted" ${req.status === 'Donors contacted' ? 'selected' : ''}>Donors contacted</option>
                      <option value="Fulfilled" ${req.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled ✓</option>
                      <option value="Cancelled" ${req.status === 'Cancelled' ? 'selected' : ''}>Cancelled ✕</option>
                    </select>
                    <button class="btn-delete-req text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer" data-id="${req.id}" title="Delete listing">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
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

export function setupReceiverDashboardPageEvents() {
  const user = auth.currentUser;
  if (!user) return;

  const logoutBtn = document.getElementById('receiver-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.hash = '#/login';
    });
  }

  // Handle status update of blood requests
  const statusSelects = document.querySelectorAll('.req-status-select');
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
        showToast(`Request status updated to ${newStatus}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `bloodRequests/${reqId}`);
      }
    });
  });

  // Handle delete of blood requests
  const deleteBtns = document.querySelectorAll('.btn-delete-req');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const reqId = target.getAttribute('data-id');
      if (!reqId) return;

      if (!confirm('Are you sure you want to remove this blood requirement?')) return;

      try {
        await deleteDoc(doc(db, 'bloodRequests', reqId));
        showToast('Blood requirement deleted', 'info');
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bloodRequests/${reqId}`);
      }
    });
  });
}
