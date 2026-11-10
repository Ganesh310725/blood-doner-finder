import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  db, 
  doc, 
  setDoc 
} from '../firebase.ts';
import { showToast } from '../utils/toast.ts';
import { BloodGroup, UserProfile, DonorProfile } from '../types.ts';

export function renderDonorRegistrationPage(): string {
  return `
    <div class="max-w-2xl mx-auto px-4 py-10">
      <div class="card-student p-6 sm:p-8 border border-gray-200">
        <!-- Title & Intro -->
        <div class="border-b border-gray-200 pb-5 mb-6">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-2xl">🩸</span>
            <h2 class="text-2xl font-bold text-gray-900">Voluntary Blood Donor Registration</h2>
          </div>
          <p class="text-xs text-gray-600 leading-relaxed">
            Join our community directory of voluntary donors. Your personal phone number and street address remain private and are only revealed when you explicitly accept a receiver's request.
          </p>
        </div>

        <!-- Medical Suitability Disclaimer Notice -->
        <div class="bg-amber-50 border-l-4 border-amber-600 p-3.5 rounded text-xs text-amber-900 mb-6 space-y-1">
          <p class="font-bold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Medical Clearance & Suitability Notice
          </p>
          <p class="text-amber-800 leading-relaxed">
            Blood Donor Finder is an informational directory. This website does NOT declare or certify you medically eligible. Standard health checks (hemoglobin &gt;12.5 g/dl, blood pressure, weight &gt;45kg, interval between donations) will be verified by medical officers at the blood donation center or hospital.
          </p>
        </div>

        <!-- Operation Not Allowed Fallback Banner (Hidden by default) -->
        <div id="donor-op-not-allowed-banner" class="hidden bg-amber-50 border border-amber-300 rounded-md p-3 mb-6 text-xs text-amber-900 space-y-2">
          <div class="flex items-start gap-2">
            <span class="text-amber-700 font-bold text-sm">⚠️</span>
            <div class="leading-relaxed">
              <strong>Email/Password Sign-In Disabled in Firebase Console:</strong>
            </div>
          </div>
          <p class="text-amber-800 text-[11px] leading-relaxed">
            Firebase requires Email/Password to be toggled ON in your project console before it can create email accounts.
          </p>
          <div class="space-y-1 text-[11px] text-gray-700 bg-white p-2.5 rounded border border-amber-200">
            <div><strong>How to enable (15 seconds):</strong></div>
            <ol class="list-decimal list-inside space-y-0.5 text-gray-600">
              <li>Open <a href="https://console.firebase.google.com/project/gen-lang-client-0078832552/authentication/providers" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline font-semibold">Firebase Console &gt; Authentication &gt; Sign-in method</a></li>
              <li>Click <strong>Email/Password</strong> and toggle <strong>Enable</strong> ON</li>
              <li>Click <strong>Save</strong></li>
            </ol>
          </div>
        </div>

        <!-- Registration Form -->
        <form id="donor-register-form" class="space-y-5">
          
          <!-- Medical & Biological Details -->
          <div>
            <h4 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">Blood & Health Information</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="form-label" for="donor-blood-group">Blood Group <span class="text-red-600">*</span></label>
                <select id="donor-blood-group" class="form-input font-bold text-red-900" required>
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative / Universal)</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="donor-age">Age <span class="text-red-600">*</span></label>
                <input type="number" id="donor-age" class="form-input" placeholder="18-65" required min="18" max="65" value="25" />
                <span class="text-[10px] text-gray-500">Legal donation age is 18 to 65.</span>
              </div>

              <div>
                <label class="form-label" for="donor-gender">Gender (Optional)</label>
                <select id="donor-gender" class="form-input">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Location Information -->
          <div class="pt-3 border-t border-gray-100">
            <h4 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">Location & Locality</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label" for="donor-city">City / District <span class="text-red-600">*</span></label>
                <input type="text" id="donor-city" class="form-input" placeholder="e.g. Mumbai, Pune, Delhi" required maxlength="60" />
              </div>

              <div>
                <label class="form-label" for="donor-pincode">PIN Code <span class="text-red-600">*</span></label>
                <input type="text" id="donor-pincode" class="form-input" placeholder="e.g. 400001" required pattern="[0-9]{6}" maxlength="6" />
              </div>
            </div>

            <div class="mt-3">
              <label class="form-label" for="donor-address">Locality or Area (Optional)</label>
              <input type="text" id="donor-address" class="form-input" placeholder="e.g. Near Civil Hospital, MG Road" maxlength="120" />
              <span class="text-[10px] text-gray-500">Helps with approximate neighborhood matching; never displayed publicly.</span>
            </div>
          </div>

          <!-- Contact phone -->
          <div class="pt-3 border-t border-gray-100">
            <label class="form-label" for="donor-phone">Phone Number <span class="text-red-600">*</span></label>
            <input type="tel" id="donor-phone" class="form-input" placeholder="e.g. 9876543210" required pattern="[0-9]{10}" title="Please enter 10 digits" />
            <span class="text-[10px] text-gray-500">Kept strictly confidential until you approve a receiver request.</span>
          </div>

          <!-- Donation Availability Status -->
          <div class="pt-3 border-t border-gray-100">
            <h4 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Initial Availability</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input type="radio" name="donor-status" value="available" checked class="text-red-700 focus:ring-red-700" />
                <span class="text-xs font-semibold text-gray-800">Available Now</span>
              </label>
              <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input type="radio" name="donor-status" value="resting" class="text-red-700 focus:ring-red-700" />
                <span class="text-xs font-semibold text-gray-800">Temporarily Resting</span>
              </label>
              <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input type="radio" name="donor-status" value="unavailable" class="text-red-700 focus:ring-red-700" />
                <span class="text-xs font-semibold text-gray-800">Unavailable</span>
              </label>
            </div>
          </div>

          <!-- Consents -->
          <div class="pt-3 border-t border-gray-100 space-y-3 text-xs">
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" id="donor-consent-public" checked required class="mt-0.5 rounded text-red-700 focus:ring-red-700" />
              <span class="text-gray-700 leading-normal">
                <strong>Public Directory Consent:</strong> I agree to list my donor profile (Full name, Blood group, City, and PIN code) in donor searches so patients and families in urgent need can find and contact me.
              </span>
            </label>

            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" id="donor-consent-medical" checked required class="mt-0.5 rounded text-red-700 focus:ring-red-700" />
              <span class="text-gray-700 leading-normal">
                <strong>Voluntary & Medical Disclaimer:</strong> I confirm that I am registering voluntarily. I understand that medical suitability will be determined at the licensed hospital/blood bank at the time of donation.
              </span>
            </label>
          </div>

          <!-- Fast 1-Click Google Registration (RECOMMENDED) -->
          <div class="pt-4 border-t border-gray-200 space-y-3">
            <button type="button" id="donor-google-register-btn" class="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-md shadow-sm font-bold text-sm flex items-center justify-center gap-3 transition cursor-pointer">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Register with Google <span class="text-green-700 font-semibold">(Instant &amp; Verified)</span></span>
            </button>
            <div class="text-[11px] text-center text-gray-500">
              Uses your Google account for authentication and saves your donor profile above.
            </div>
          </div>

          <!-- Divider -->
          <div class="relative my-4 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
            <span class="relative bg-white px-3 text-xs text-gray-400 uppercase font-medium">Or register with email &amp; password</span>
          </div>

          <!-- Account Credentials -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label" for="donor-name">Full Name</label>
              <input type="text" id="donor-name" class="form-input" placeholder="e.g. Ramesh Chandra" maxlength="80" />
            </div>

            <div>
              <label class="form-label" for="donor-email">Email Address</label>
              <input type="email" id="donor-email" class="form-input" placeholder="ramesh@example.com" autocomplete="email" />
            </div>
          </div>

          <div>
            <label class="form-label" for="donor-password">Create Password</label>
            <input type="password" id="donor-password" class="form-input" placeholder="Minimum 6 characters" minlength="6" autocomplete="new-password" />
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button type="submit" id="donor-register-submit" class="btn-secondary w-full py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-100">
              Register with Email &amp; Password
            </button>
          </div>

          <!-- Already have account -->
          <div class="text-center text-xs text-gray-600 pt-2">
            Already registered? <a href="#/login?role=donor" class="text-red-700 font-bold hover:underline">Sign In as Donor</a>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function setupDonorRegistrationPageEvents() {
  const form = document.getElementById('donor-register-form') as HTMLFormElement | null;
  const googleBtn = document.getElementById('donor-google-register-btn') as HTMLButtonElement | null;
  const opBanner = document.getElementById('donor-op-not-allowed-banner');

  function getFormDonorData() {
    const bloodGroup = (document.getElementById('donor-blood-group') as HTMLSelectElement).value as BloodGroup;
    const age = parseInt((document.getElementById('donor-age') as HTMLInputElement).value, 10);
    const gender = (document.getElementById('donor-gender') as HTMLSelectElement).value;
    const city = (document.getElementById('donor-city') as HTMLInputElement).value.trim();
    const pinCode = (document.getElementById('donor-pincode') as HTMLInputElement).value.trim();
    const address = (document.getElementById('donor-address') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('donor-phone') as HTMLInputElement).value.trim();
    const statusRadio = document.querySelector('input[name="donor-status"]:checked') as HTMLInputElement;
    const status = (statusRadio?.value || 'available') as 'available' | 'resting' | 'unavailable';
    const isPublicConsent = (document.getElementById('donor-consent-public') as HTMLInputElement).checked;

    return { bloodGroup, age, gender, city, pinCode, address, phone, status, isPublicConsent };
  }

  // Google Registration
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const data = getFormDonorData();
      if (!data.bloodGroup) {
        showToast('Please select your Blood Group above before registering', 'error');
        return;
      }
      if (!data.phone || data.phone.length !== 10) {
        showToast('Please enter a valid 10-digit Phone Number above', 'error');
        return;
      }
      if (!data.city || !data.pinCode) {
        showToast('Please enter your City and PIN Code above', 'error');
        return;
      }

      googleBtn.disabled = true;
      googleBtn.innerHTML = 'Connecting with Google...';

      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const user = res.user;
        const uid = user.uid;
        const now = new Date().toISOString();
        const fullName = user.displayName || (document.getElementById('donor-name') as HTMLInputElement)?.value.trim() || 'Voluntary Donor';
        const email = user.email || (document.getElementById('donor-email') as HTMLInputElement)?.value.trim() || '';

        // 1. Save user profile
        const userDoc: UserProfile = {
          id: uid,
          email,
          fullName,
          role: 'donor',
          phone: data.phone,
          city: data.city,
          pinCode: data.pinCode,
          address: data.address || undefined,
          createdAt: now
        };
        await setDoc(doc(db, 'users', uid), userDoc);

        // 2. Save public donor listing
        const donorDoc: DonorProfile = {
          userId: uid,
          fullName,
          bloodGroup: data.bloodGroup,
          city: data.city,
          pinCode: data.pinCode,
          age: data.age || 25,
          gender: data.gender || undefined,
          isAvailable: data.status === 'available',
          isPublicConsent: data.isPublicConsent,
          status: data.status,
          createdAt: now
        };
        await setDoc(doc(db, 'donors', uid), donorDoc);

        showToast('Donor profile registered successfully! Welcome to the network.', 'success');
        window.location.hash = '#/donor-dashboard';
      } catch (err: any) {
        console.error('Google donor registration error:', err);
        showToast(err.message || 'Google registration failed', 'error');
        googleBtn.disabled = false;
        googleBtn.innerHTML = `
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Register with Google (Instant &amp; Verified)</span>
        `;
      }
    });
  }

  // Form submit for email & password
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('donor-register-submit') as HTMLButtonElement;

      const fullName = (document.getElementById('donor-name') as HTMLInputElement).value.trim();
      const email = (document.getElementById('donor-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('donor-password') as HTMLInputElement).value;
      const data = getFormDonorData();

      if (!data.bloodGroup) {
        showToast('Please select your blood group', 'error');
        return;
      }
      if (!email || !password) {
        showToast('Please enter an email and password or use Register with Google above', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating account...';

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        const now = new Date().toISOString();

        const userDoc: UserProfile = {
          id: uid,
          email,
          fullName: fullName || 'Voluntary Donor',
          role: 'donor',
          phone: data.phone,
          city: data.city,
          pinCode: data.pinCode,
          address: data.address || undefined,
          createdAt: now
        };
        await setDoc(doc(db, 'users', uid), userDoc);

        const donorDoc: DonorProfile = {
          userId: uid,
          fullName: fullName || 'Voluntary Donor',
          bloodGroup: data.bloodGroup,
          city: data.city,
          pinCode: data.pinCode,
          age: data.age || 25,
          gender: data.gender || undefined,
          isAvailable: data.status === 'available',
          isPublicConsent: data.isPublicConsent,
          status: data.status,
          createdAt: now
        };
        await setDoc(doc(db, 'donors', uid), donorDoc);

        showToast('Donor account registered successfully! Welcome to the network.', 'success');
        window.location.hash = '#/donor-dashboard';
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Register with Email &amp; Password';

        if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
          console.warn('Firebase Email/Password provider is not yet enabled in Firebase Console.');
          opBanner?.classList.remove('hidden');
          showToast('Email/Password provider is not enabled in Firebase Console yet. Please enable it or register with Google.', 'error', 6000);
          googleBtn?.classList.add('ring-4', 'ring-red-400');
          setTimeout(() => googleBtn?.classList.remove('ring-4', 'ring-red-400'), 3000);
        } else {
          console.error('Donor registration error:', err.message || err);
          showToast(err.message || 'Failed to complete registration', 'error');
        }
      }
    });
  }
}
