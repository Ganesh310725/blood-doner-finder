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
import { UserProfile } from '../types.ts';

export function renderReceiverRegistrationPage(): string {
  return `
    <div class="max-w-xl mx-auto px-4 py-10">
      <div class="card-student p-6 sm:p-8 border border-gray-200">
        <!-- Title & Intro -->
        <div class="border-b border-gray-200 pb-5 mb-6 text-center">
          <div class="w-12 h-12 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            🏥
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Receiver Account Registration</h2>
          <p class="text-xs text-gray-500 mt-1">
            Register to post blood requirements and directly connect with willing voluntary donors in your city.
          </p>
        </div>

        <!-- Emergency Disclaimer -->
        <div class="bg-red-50 border-l-4 border-red-700 p-3 rounded text-xs text-red-900 mb-6 flex items-start gap-2">
          <svg class="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          <div class="leading-relaxed">
            <strong>Immediate Emergency Notice:</strong> If the patient is undergoing active hemorrhaging or trauma, immediately utilize hospital blood reserves and contact certified blood banks. Online donor matching depends on voluntary responses.
          </div>
        </div>

        <!-- Operation Not Allowed Fallback Banner (Hidden by default) -->
        <div id="receiver-op-not-allowed-banner" class="hidden bg-amber-50 border border-amber-300 rounded-md p-3 mb-6 text-xs text-amber-900 space-y-2">
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

        <!-- Form -->
        <form id="receiver-register-form" class="space-y-4">
          <div>
            <label class="form-label" for="receiver-phone">Contact Phone Number <span class="text-red-600">*</span></label>
            <input type="tel" id="receiver-phone" class="form-input" placeholder="10-digit mobile number" required pattern="[0-9]{10}" />
            <span class="text-[10px] text-gray-500">Used by donors to call you once you connect.</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label" for="receiver-city">City / District <span class="text-red-600">*</span></label>
              <input type="text" id="receiver-city" class="form-input" placeholder="e.g. Bengaluru, Hyderabad" required maxlength="60" />
            </div>

            <div>
              <label class="form-label" for="receiver-pincode">PIN Code <span class="text-red-600">*</span></label>
              <input type="text" id="receiver-pincode" class="form-input" placeholder="e.g. 560001" required pattern="[0-9]{6}" maxlength="6" />
            </div>
          </div>

          <!-- Fast 1-Click Google Registration (RECOMMENDED) -->
          <div class="pt-3 border-t border-gray-200 space-y-2">
            <button type="button" id="receiver-google-register-btn" class="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-md shadow-sm font-bold text-sm flex items-center justify-center gap-3 transition cursor-pointer">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Register with Google <span class="text-green-700 font-semibold">(Instant)</span></span>
            </button>
            <div class="text-[11px] text-center text-gray-500">
              Signs in with Google and saves your receiver contact details immediately.
            </div>
          </div>

          <!-- Divider -->
          <div class="relative my-4 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
            <span class="relative bg-white px-3 text-xs text-gray-400 uppercase font-medium">Or register with email &amp; password</span>
          </div>

          <div>
            <label class="form-label" for="receiver-name">Full Name</label>
            <input type="text" id="receiver-name" class="form-input" placeholder="e.g. Sunita Verma" maxlength="80" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label" for="receiver-email">Email Address</label>
              <input type="email" id="receiver-email" class="form-input" placeholder="sunita@example.com" autocomplete="email" />
            </div>

            <div>
              <label class="form-label" for="receiver-password">Password</label>
              <input type="password" id="receiver-password" class="form-input" placeholder="Minimum 6 characters" minlength="6" autocomplete="new-password" />
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" id="receiver-register-submit" class="btn-secondary w-full py-2.5 font-semibold text-gray-800 hover:bg-gray-100">
              Register with Email &amp; Password
            </button>
          </div>

          <div class="text-center text-xs text-gray-600 pt-3">
            Already have an account? <a href="#/login?role=receiver" class="text-red-700 font-bold hover:underline">Sign In as Receiver</a>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function setupReceiverRegistrationPageEvents() {
  const form = document.getElementById('receiver-register-form') as HTMLFormElement | null;
  const googleBtn = document.getElementById('receiver-google-register-btn') as HTMLButtonElement | null;
  const opBanner = document.getElementById('receiver-op-not-allowed-banner');

  // Google Registration
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const phone = (document.getElementById('receiver-phone') as HTMLInputElement)?.value.trim();
      const city = (document.getElementById('receiver-city') as HTMLInputElement)?.value.trim();
      const pinCode = (document.getElementById('receiver-pincode') as HTMLInputElement)?.value.trim();

      if (!phone || phone.length !== 10) {
        showToast('Please enter your 10-digit Phone Number first', 'error');
        return;
      }
      if (!city || !pinCode) {
        showToast('Please enter your City and PIN Code first', 'error');
        return;
      }

      googleBtn.disabled = true;
      googleBtn.innerHTML = 'Connecting with Google...';

      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const user = res.user;
        const uid = user.uid;
        const fullName = user.displayName || (document.getElementById('receiver-name') as HTMLInputElement)?.value.trim() || 'Receiver';
        const email = user.email || (document.getElementById('receiver-email') as HTMLInputElement)?.value.trim() || '';

        const userDoc: UserProfile = {
          id: uid,
          email,
          fullName,
          role: 'receiver',
          phone,
          city,
          pinCode,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', uid), userDoc);

        showToast('Receiver account created successfully with Google!', 'success');
        window.location.hash = '#/receiver-dashboard';
      } catch (err: any) {
        console.error('Google receiver registration error:', err);
        showToast(err.message || 'Google registration failed', 'error');
        googleBtn.disabled = false;
        googleBtn.innerHTML = `
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Register with Google (Instant)</span>
        `;
      }
    });
  }

  // Form submit for email & password
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('receiver-register-submit') as HTMLButtonElement;

      const fullName = (document.getElementById('receiver-name') as HTMLInputElement).value.trim();
      const email = (document.getElementById('receiver-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('receiver-password') as HTMLInputElement).value;
      const phone = (document.getElementById('receiver-phone') as HTMLInputElement).value.trim();
      const city = (document.getElementById('receiver-city') as HTMLInputElement).value.trim();
      const pinCode = (document.getElementById('receiver-pincode') as HTMLInputElement).value.trim();

      if (!email || !password) {
        showToast('Please enter an email and password or use Register with Google above', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating account...';

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        const userDoc: UserProfile = {
          id: uid,
          email,
          fullName: fullName || 'Receiver',
          role: 'receiver',
          phone,
          city,
          pinCode,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', uid), userDoc);

        showToast('Receiver account created successfully!', 'success');
        window.location.hash = '#/receiver-dashboard';
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
          console.error('Receiver registration error:', err.message || err);
          showToast(err.message || 'Registration failed', 'error');
        }
      }
    });
  }
}
