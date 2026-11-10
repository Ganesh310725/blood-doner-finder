import { db, collection, addDoc, currentUserProfile, auth } from '../firebase.ts';
import { showToast, escapeHtml } from '../utils/toast.ts';
import { FeedbackItem, FeedbackCategory } from '../types.ts';

export function renderContactPage(): string {
  const user = auth.currentUser;
  const profile = currentUserProfile;

  return `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <!-- Header -->
      <div class="border-b border-gray-200 pb-5 text-center">
        <div class="w-12 h-12 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
          📬
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Contact & Community Feedback</h1>
        <p class="text-xs text-gray-500 mt-1 max-w-xl mx-auto">
          Have a question about the platform? Want to report a suspicious blood request or fake donor profile? Share your feedback below.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Left: Contact Information & Emergency Helplines -->
        <div class="space-y-4 md:col-span-1">
          <div class="card-student p-5 space-y-3 bg-red-50/40 border-red-100">
            <h3 class="font-bold text-sm text-red-950 flex items-center gap-1.5">
              <span>🚨 Medical Emergency?</span>
            </h3>
            <p class="text-xs text-red-900 leading-relaxed">
              Do not wait for form responses during acute emergencies. Call emergency ambulance or blood bank lines immediately:
            </p>
            <div class="space-y-1.5 text-xs text-gray-800">
              <div class="flex justify-between font-medium">
                <span>Ambulance:</span>
                <strong class="font-mono text-red-800">108</strong>
              </div>
              <div class="flex justify-between font-medium">
                <span>Red Cross Blood Bank:</span>
                <strong class="font-mono text-red-800">1910</strong>
              </div>
              <div class="flex justify-between font-medium">
                <span>Emergency Services:</span>
                <strong class="font-mono text-red-800">112</strong>
              </div>
            </div>
          </div>

          <div class="card-student p-5 space-y-2 text-xs text-gray-600">
            <h4 class="font-bold text-gray-900">Community Safety</h4>
            <p class="leading-relaxed">
              We take suspicious profiles, monetary demands for blood, or fraudulent requests seriously. Select "Report Suspicious Activity" to notify administrators immediately.
            </p>
          </div>
        </div>

        <!-- Right: Contact Form -->
        <div class="card-student p-6 sm:p-8 md:col-span-2 border border-gray-200">
          <form id="contact-form" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label" for="contact-name">Your Full Name <span class="text-red-600">*</span></label>
                <input 
                  type="text" 
                  id="contact-name" 
                  class="form-input" 
                  placeholder="e.g. Anand Joshi" 
                  value="${escapeHtml(profile?.fullName || user?.displayName || '')}" 
                  required 
                  maxlength="80" 
                />
              </div>

              <div>
                <label class="form-label" for="contact-email">Email Address <span class="text-red-600">*</span></label>
                <input 
                  type="email" 
                  id="contact-email" 
                  class="form-input" 
                  placeholder="anand@example.com" 
                  value="${escapeHtml(profile?.email || user?.email || '')}" 
                  required 
                  autocomplete="email" 
                />
              </div>
            </div>

            <div>
              <label class="form-label" for="contact-category">Subject Category <span class="text-red-600">*</span></label>
              <select id="contact-category" class="form-input font-medium" required>
                <option value="General">General Inquiry</option>
                <option value="Feedback">Platform Feedback & Suggestion</option>
                <option value="Report Suspicious Activity">⚠️ Report Suspicious Request or Fake Profile</option>
                <option value="Emergency Help">Emergency Guidance</option>
              </select>
            </div>

            <div>
              <label class="form-label" for="contact-subject">Subject <span class="text-red-600">*</span></label>
              <input 
                type="text" 
                id="contact-subject" 
                class="form-input" 
                placeholder="Brief summary of your message..." 
                required 
                maxlength="120" 
              />
            </div>

            <div>
              <label class="form-label" for="contact-message">Detailed Message <span class="text-red-600">*</span></label>
              <textarea 
                id="contact-message" 
                rows="5" 
                class="form-input" 
                placeholder="Write your message here. If reporting an issue, please include the relevant hospital name or city..." 
                required 
                maxlength="1000"
              ></textarea>
            </div>

            <div class="pt-2">
              <button type="submit" id="contact-submit-btn" class="btn-primary w-full py-2.5 font-bold">
                Submit Message
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  `;
}

export function setupContactPageEvents() {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('contact-submit-btn') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const name = (document.getElementById('contact-name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('contact-email') as HTMLInputElement).value.trim();
    const category = (document.getElementById('contact-category') as HTMLSelectElement).value as FeedbackCategory;
    const subject = (document.getElementById('contact-subject') as HTMLInputElement).value.trim();
    const message = (document.getElementById('contact-message') as HTMLTextAreaElement).value.trim();

    try {
      const newFeedback: Omit<FeedbackItem, 'id'> = {
        name,
        email,
        category,
        subject,
        message,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'feedbacks'), newFeedback);

      showToast('Thank you! Your message has been submitted to the community team.', 'success');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Message';
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      showToast(err.message || 'Failed to submit feedback', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Message';
    }
  });
}
