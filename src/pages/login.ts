import { 
  auth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail,
  db, 
  doc, 
  getDoc, 
  setDoc, 
  isUserAdmin 
} from '../firebase.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';
import { UserRole } from '../types.ts';

export function renderLoginPage(): string {
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const initialRole = urlParams.get('role') || 'donor';
  const showForgotDirectly = urlParams.get('action') === 'forgot-password';

  return `
    <div class="max-w-md mx-auto px-4 py-12">
      <div class="card-student p-6 sm:p-8 border border-gray-200">
        
        <!-- SECTION 1: FORGOT PASSWORD VIEW (Visible if triggered) -->
        <div id="forgot-password-panel" class="${showForgotDirectly ? '' : 'hidden'} space-y-5">
          <div class="text-center">
            <div class="w-12 h-12 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl shadow-xs">
              🔑
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Reset Your Password</h2>
            <p class="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Enter your registered email address and we will send an official password reset link through Firebase Authentication.
            </p>
          </div>

          <!-- Success Alert Message (Shown after successful email dispatch) -->
          <div id="reset-success-alert" class="hidden bg-green-50 border border-green-300 rounded-md p-3.5 text-xs text-green-900 space-y-2">
            <div class="flex items-start gap-2">
              <span class="text-green-700 font-bold text-sm">✅</span>
              <div>
                <strong class="font-bold">Password Reset Email Dispatched!</strong>
                <p id="reset-success-message" class="text-green-800 mt-0.5 leading-relaxed">
                  We've sent a password recovery link to your email.
                </p>
              </div>
            </div>
            <p class="text-[11px] text-green-700 pt-1 border-t border-green-200">
              Please check your inbox (and spam/junk folder). Click the link in the email to set a new password, then return here to sign in.
            </p>
          </div>

          <!-- Error Alert Message -->
          <div id="reset-error-alert" class="hidden bg-red-50 border border-red-300 rounded-md p-3 text-xs text-red-900 space-y-1">
            <div class="flex items-start gap-2">
              <span class="text-red-700 font-bold text-sm">⚠️</span>
              <div id="reset-error-message" class="leading-relaxed"></div>
            </div>
          </div>

          <!-- Password Reset Form -->
          <form id="forgot-password-form" class="space-y-4">
            <div>
              <label class="form-label" for="reset-email">Registered Email Address <span class="text-red-600">*</span></label>
              <div class="relative">
                <input 
                  type="email" 
                  id="reset-email" 
                  class="form-input text-sm pl-9" 
                  placeholder="name@example.com" 
                  required 
                  autocomplete="email"
                />
                <svg class="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <span class="text-[10px] text-gray-500 mt-1 block">A secure reset link from Firebase Auth will be sent to this address.</span>
            </div>

            <button type="submit" id="submit-reset-btn" class="btn-primary w-full py-2.5 text-sm font-semibold cursor-pointer">
              Send Password Reset Link
            </button>

            <button type="button" id="back-to-login-btn" class="btn-secondary w-full py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5">
              <span>← Back to Sign In</span>
            </button>
          </form>
        </div>

        <!-- SECTION 2: STANDARD LOGIN VIEW -->
        <div id="standard-login-panel" class="${showForgotDirectly ? 'hidden' : ''} space-y-5">
          <!-- Header -->
          <div class="text-center">
            <div class="w-12 h-12 bg-red-800 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl shadow">
              🩸
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Sign In to Platform</h2>
            <p class="text-xs text-gray-500 mt-1">
              Access your Blood Donor or Receiver Dashboard
            </p>
          </div>

          <!-- Role Selector Tabs -->
          <div class="flex border-b border-gray-200 text-sm">
            <button id="tab-donor" class="flex-1 py-2.5 text-center font-semibold transition border-b-2 ${initialRole === 'donor' ? 'border-red-800 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-700'}">
              🩸 Donor
            </button>
            <button id="tab-receiver" class="flex-1 py-2.5 text-center font-semibold transition border-b-2 ${initialRole === 'receiver' ? 'border-red-800 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-700'}">
              🏥 Receiver
            </button>
            <button id="tab-admin" class="py-2.5 px-3 text-center font-semibold transition border-b-2 ${initialRole === 'admin' ? 'border-purple-800 text-purple-800' : 'border-transparent text-gray-400 hover:text-gray-700'}">
              🛡️ Admin
            </button>
          </div>

          <!-- Role Explainer Badge -->
          <div id="role-hint" class="bg-red-50 text-red-900 border border-red-200 rounded p-2.5 text-xs flex items-start gap-2">
            <span class="font-bold">Target Role:</span>
            <span id="role-hint-text">
              ${initialRole === 'donor' 
                ? 'Donor Dashboard: Update availability and manage patient contact requests.'
                : initialRole === 'receiver'
                ? 'Receiver Dashboard: Post blood requirements and view donor contacts.'
                : 'Admin Dashboard: Requires administrative verification.'}
            </span>
          </div>

          <!-- PRIMARY AUTH: Google Sign-In -->
          <div class="space-y-2">
            <button id="google-signin-btn" class="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-md shadow-sm font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition cursor-pointer">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google <span class="text-green-700 font-semibold">(Instant Sign-In)</span></span>
            </button>
            <div class="text-[11px] text-center text-gray-500">
              ✓ Pre-configured with Firebase Authentication
            </div>
          </div>

          <!-- Operation not allowed informative banner (hidden by default) -->
          <div id="operation-not-allowed-banner" class="hidden bg-amber-50 border border-amber-300 rounded-md p-3 text-xs text-amber-900 space-y-2">
            <div class="flex items-start gap-2">
              <span class="text-amber-600 font-bold text-sm">⚠️</span>
              <div class="leading-relaxed">
                <strong>Email/Password Sign-In Disabled in Firebase Console:</strong>
              </div>
            </div>
            <p class="text-amber-800 text-[11px] leading-relaxed">
              Firebase requires Email/Password to be toggled ON in your project console before it can accept email sign-ins.
            </p>
            <div class="space-y-1 text-[11px] text-gray-700 bg-white p-2.5 rounded border border-amber-200">
              <div><strong>How to enable (15 seconds):</strong></div>
              <ol class="list-decimal list-inside space-y-0.5 text-gray-600">
                <li>Open <a href="https://console.firebase.google.com/project/gen-lang-client-0078832552/authentication/providers" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline font-semibold">Firebase Console &gt; Authentication &gt; Sign-in method</a></li>
                <li>Click <strong>Email/Password</strong> and toggle <strong>Enable</strong> ON</li>
                <li>Click <strong>Save</strong></li>
              </ol>
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" id="banner-google-btn" class="btn-primary text-xs flex-1 py-1.5">
                Sign In with Google Instead
              </button>
              <a href="https://console.firebase.google.com/project/gen-lang-client-0078832552/authentication/providers" target="_blank" rel="noopener noreferrer" class="btn-secondary text-xs flex-1 py-1.5 text-center">
                Open Firebase Console ↗
              </a>
            </div>
          </div>

          <!-- Divider -->
          <div class="relative my-4 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
            <span class="relative bg-white px-3 text-xs text-gray-400 uppercase font-medium">Or sign in with email</span>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="space-y-4">
            <input type="hidden" id="selected-role" value="${escapeHtml(initialRole)}" />

            <div>
              <label class="form-label" for="login-email">Email Address</label>
              <input 
                type="email" 
                id="login-email" 
                class="form-input" 
                placeholder="name@example.com" 
                required 
                autocomplete="email"
              />
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="form-label mb-0" for="login-password">Password</label>
                <!-- Trigger for Forgot Password flow -->
                <button type="button" id="forgot-password-link" class="text-xs text-red-700 hover:underline font-semibold cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <input 
                type="password" 
                id="login-password" 
                class="form-input" 
                placeholder="••••••••" 
                required 
                autocomplete="current-password"
              />
            </div>

            <button type="submit" id="login-submit-btn" class="btn-secondary w-full py-2.5 font-semibold text-gray-800 hover:bg-gray-100 cursor-pointer">
              <span>Sign In with Email</span>
            </button>
          </form>

          <!-- Create Account Link -->
          <div class="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600 space-y-2">
            <div>Don't have an account yet?</div>
            <div class="flex justify-center gap-3 font-semibold">
              <a href="#/register-donor" class="text-red-700 hover:underline">Register as Donor →</a>
              <span class="text-gray-300">|</span>
              <a href="#/register-receiver" class="text-red-700 hover:underline">Register as Receiver →</a>
            </div>
            <div class="pt-2">
              <a href="#/about" class="text-gray-400 hover:text-gray-600">Learn more about this community project</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function setupLoginPageEvents() {
  const form = document.getElementById('login-form') as HTMLFormElement | null;
  const roleInput = document.getElementById('selected-role') as HTMLInputElement | null;
  const tabDonor = document.getElementById('tab-donor');
  const tabReceiver = document.getElementById('tab-receiver');
  const tabAdmin = document.getElementById('tab-admin');
  const roleHintText = document.getElementById('role-hint-text');
  const notAllowedBanner = document.getElementById('operation-not-allowed-banner');
  const bannerGoogleBtn = document.getElementById('banner-google-btn');

  // Forgot password flow elements
  const forgotLink = document.getElementById('forgot-password-link');
  const forgotPanel = document.getElementById('forgot-password-panel');
  const loginPanel = document.getElementById('standard-login-panel');
  const backToLoginBtn = document.getElementById('back-to-login-btn');
  const forgotForm = document.getElementById('forgot-password-form') as HTMLFormElement | null;
  const resetEmailInput = document.getElementById('reset-email') as HTMLInputElement | null;
  const resetSuccessAlert = document.getElementById('reset-success-alert');
  const resetSuccessMessage = document.getElementById('reset-success-message');
  const resetErrorAlert = document.getElementById('reset-error-alert');
  const resetErrorMessage = document.getElementById('reset-error-message');
  const submitResetBtn = document.getElementById('submit-reset-btn') as HTMLButtonElement | null;

  // Toggle to Forgot Password View
  if (forgotLink && forgotPanel && loginPanel) {
    forgotLink.addEventListener('click', () => {
      loginPanel.classList.add('hidden');
      forgotPanel.classList.remove('hidden');

      // Pre-fill email from login input if present
      const loginEmail = (document.getElementById('login-email') as HTMLInputElement)?.value.trim();
      if (resetEmailInput) {
        if (loginEmail) resetEmailInput.value = loginEmail;
        resetEmailInput.focus();
      }

      // Reset alert states
      resetSuccessAlert?.classList.add('hidden');
      resetErrorAlert?.classList.add('hidden');
    });
  }

  // Back to Login View
  if (backToLoginBtn && forgotPanel && loginPanel) {
    backToLoginBtn.addEventListener('click', () => {
      forgotPanel.classList.add('hidden');
      loginPanel.classList.remove('hidden');
    });
  }

  // Handle sendPasswordResetEmail submission
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = resetEmailInput?.value.trim();

      if (!email) {
        showToast('Please enter your email address', 'error');
        return;
      }

      resetSuccessAlert?.classList.add('hidden');
      resetErrorAlert?.classList.add('hidden');

      if (submitResetBtn) {
        submitResetBtn.disabled = true;
        submitResetBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sending Reset Email...
        `;
      }

      try {
        // Execute official Firebase Authentication sendPasswordResetEmail
        await sendPasswordResetEmail(auth, email);

        if (submitResetBtn) {
          submitResetBtn.disabled = false;
          submitResetBtn.innerHTML = 'Send Password Reset Link';
        }

        if (resetSuccessMessage) {
          resetSuccessMessage.textContent = `A password reset link has been dispatched to ${email}. Please check your inbox and follow the instructions to set your new password.`;
        }
        resetSuccessAlert?.classList.remove('hidden');
        showToast('Password reset link sent to your email!', 'success');
      } catch (err: any) {
        if (submitResetBtn) {
          submitResetBtn.disabled = false;
          submitResetBtn.innerHTML = 'Send Password Reset Link';
        }

        let userMsg = 'Failed to send password reset email. Please try again.';
        if (err.code === 'auth/user-not-found') {
          userMsg = 'No account found with this email address. Please register or verify the spelling.';
        } else if (err.code === 'auth/invalid-email') {
          userMsg = 'Please enter a valid email address (e.g., name@example.com).';
        } else if (err.code === 'auth/too-many-requests') {
          userMsg = 'Too many requests. Please wait a few minutes before requesting another reset email.';
        } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
          userMsg = 'Email/Password provider is not yet enabled in the Firebase Console. Please sign in with Google or enable Email/Password in your project settings.';
        } else if (err.message) {
          userMsg = err.message;
        }

        if (resetErrorMessage) {
          resetErrorMessage.textContent = userMsg;
        }
        resetErrorAlert?.classList.remove('hidden');
        showToast(userMsg, 'error');
      }
    });
  }

  function setRole(role: UserRole) {
    if (roleInput) roleInput.value = role;
    [tabDonor, tabReceiver, tabAdmin].forEach(t => {
      if (t) {
        t.className = 'py-2.5 text-center font-semibold transition border-b-2 border-transparent text-gray-500 hover:text-gray-700';
      }
    });

    if (role === 'donor' && tabDonor) {
      tabDonor.className = 'flex-1 py-2.5 text-center font-semibold transition border-b-2 border-red-800 text-red-800';
      if (roleHintText) roleHintText.textContent = 'Donor Dashboard: Update availability and manage patient contact requests.';
    } else if (role === 'receiver' && tabReceiver) {
      tabReceiver.className = 'flex-1 py-2.5 text-center font-semibold transition border-b-2 border-red-800 text-red-800';
      if (roleHintText) roleHintText.textContent = 'Receiver Dashboard: Post blood requirements and view donor contacts.';
    } else if (role === 'admin' && tabAdmin) {
      tabAdmin.className = 'py-2.5 px-3 text-center font-semibold transition border-b-2 border-purple-800 text-purple-800';
      if (roleHintText) roleHintText.textContent = 'Admin Dashboard: Requires administrative verification.';
    }
  }

  if (tabDonor) tabDonor.addEventListener('click', () => setRole('donor'));
  if (tabReceiver) tabReceiver.addEventListener('click', () => setRole('receiver'));
  if (tabAdmin) tabAdmin.addEventListener('click', () => setRole('admin'));

  // Google Sign In trigger logic
  const triggerGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      const isAdmin = isUserAdmin(user.email);

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const desiredRole = (roleInput?.value as UserRole) || 'receiver';
        const newUser = {
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || 'Community Member',
          role: isAdmin ? 'admin' : desiredRole,
          phone: '',
          city: '',
          pinCode: '',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newUser);
        if (isAdmin) {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        }
      }

      showToast('Signed in with Google successfully!', 'success');
      if (isAdmin) {
        window.location.hash = '#/admin-dashboard';
      } else {
        const role = userSnap.exists() ? userSnap.data().role : (roleInput?.value || 'donor');
        window.location.hash = role === 'donor' ? '#/donor-dashboard' : '#/receiver-dashboard';
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      showToast(err.message || 'Google sign in failed', 'error');
    }
  };

  const googleBtn = document.getElementById('google-signin-btn');
  if (googleBtn) googleBtn.addEventListener('click', triggerGoogleSignIn);
  if (bannerGoogleBtn) bannerGoogleBtn.addEventListener('click', triggerGoogleSignIn);

  // Form submit (email and password)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('login-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('login-password') as HTMLInputElement).value;
      const submitBtn = document.getElementById('login-submit-btn') as HTMLButtonElement;

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Signing in...';

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        showToast('Logged in successfully!', 'success');

        // Check user record
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.exists() ? userDoc.data().role : (roleInput?.value || 'donor');
        const isAdmin = isUserAdmin(user.email, role);

        if (isAdmin) {
          window.location.hash = '#/admin-dashboard';
        } else if (role === 'donor') {
          window.location.hash = '#/donor-dashboard';
        } else {
          window.location.hash = '#/receiver-dashboard';
        }
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In with Email</span>';

        if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
          console.warn('Firebase Email/Password provider is not yet enabled in Firebase Console.');
          notAllowedBanner?.classList.remove('hidden');
          showToast('Email/Password provider is not enabled in Firebase Console yet. Please enable it or sign in with Google.', 'error', 6000);
          googleBtn?.classList.add('ring-4', 'ring-red-400');
          setTimeout(() => googleBtn?.classList.remove('ring-4', 'ring-red-400'), 3000);
        } else {
          console.error('Login error:', err.message || err);
          showToast(err.message || 'Invalid email or password', 'error');
        }
      }
    });
  }
}
