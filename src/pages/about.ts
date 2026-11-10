export function renderAboutPage(): string {
  return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <!-- Mission Statement Header -->
      <div class="text-center space-y-4 border-b border-gray-200 pb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
          Community Health Initiative
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          About Blood Donor Finder
        </h1>
        <blockquote class="text-lg sm:text-xl font-semibold text-red-800 italic max-w-2xl mx-auto leading-relaxed">
          "Connecting willing blood donors with people in need, because every donation can make a difference."
        </blockquote>
      </div>

      <!-- Section 1: What is Blood Donor Finder & Why Created -->
      <section class="card-student p-6 sm:p-8 space-y-4">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span class="text-red-700">🩸</span> What is Blood Donor Finder?
        </h2>
        <p class="text-sm text-gray-700 leading-relaxed">
          <strong>Blood Donor Finder</strong> is a free community-help platform created to solve one of the most stressful challenges in medical emergencies: finding compatible, available blood donors in real time.
        </p>
        <p class="text-sm text-gray-700 leading-relaxed">
          During urgent medical treatments, surgeries, or unexpected accidents, hospital blood banks may face shortages of specific blood groups (especially negative Rh factors like O-, A-, and AB-). Families are often left scrambling through messaging groups and social media. This platform provides a centralized, trustworthy directory where donors can voluntarily register their blood group and availability, and patient families can quickly connect with them in their city.
        </p>
      </section>

      <!-- Section 2: How It Connects Donors and Receivers -->
      <section class="card-student p-6 sm:p-8 space-y-6">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span class="text-red-700">🤝</span> How the Platform Works
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Donor Flow -->
          <div class="border border-red-100 bg-red-50/30 p-5 rounded-lg space-y-3">
            <h3 class="font-bold text-base text-red-900 flex items-center gap-2">
              <span>🩸 For Voluntary Donors</span>
            </h3>
            <ol class="space-y-2 text-xs text-gray-700 list-decimal list-inside leading-relaxed">
              <li><strong>Register with Medical Info:</strong> Create an account with your blood group, city, age, and contact phone.</li>
              <li><strong>Maintain Availability:</strong> Keep your status as "Available" or toggle to "Resting" if you recently donated.</li>
              <li><strong>Review Contact Requests:</strong> Receive requests with hospital name, urgency, and patient blood group.</li>
              <li><strong>Accept & Save Lives:</strong> If you are available to donate, accept the request to securely reveal your contact phone to the family.</li>
            </ol>
          </div>

          <!-- Receiver Flow -->
          <div class="border border-blue-100 bg-blue-50/30 p-5 rounded-lg space-y-3">
            <h3 class="font-bold text-base text-blue-900 flex items-center gap-2">
              <span>🏥 For Receivers & Families</span>
            </h3>
            <ol class="space-y-2 text-xs text-gray-700 list-decimal list-inside leading-relaxed">
              <li><strong>Search Donors:</strong> Filter available donors by required blood group and city.</li>
              <li><strong>Post Blood Requirement:</strong> Publish your requirement on the community board with hospital location.</li>
              <li><strong>Send Consent Request:</strong> Submit a secure contact request to matching donors with case details.</li>
              <li><strong>Direct Hospital Coordination:</strong> When a donor accepts, call them directly to organize hospital donation.</li>
            </ol>
          </div>
        </div>
      </section>

      <!-- Section 3: Safety, Privacy & Medical Boundaries (Crucial Requirement) -->
      <section class="card-student p-6 sm:p-8 bg-amber-50/40 border border-amber-200 space-y-4">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span class="text-amber-700">⚠️</span> Crucial Medical & Safety Standards
        </h2>
        
        <ul class="space-y-3 text-xs text-gray-700">
          <li class="flex items-start gap-2">
            <span class="font-bold text-amber-800 text-sm">•</span>
            <div>
              <strong>Non-Medical Discovery Tool:</strong> Blood Donor Finder is a communication bridge, NOT a hospital, blood bank, or diagnostic medical provider. We do not independently declare or certify anyone medically eligible to donate.
            </div>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold text-amber-800 text-sm">•</span>
            <div>
              <strong>Mandatory Professional Verification:</strong> Blood compatibility and donor fitness (vital signs, hemoglobin levels, infectious disease screening, interval compliance) must be independently verified by certified doctors and licensed laboratory staff at the blood center.
            </div>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold text-amber-800 text-sm">•</span>
            <div>
              <strong>Strict Privacy Safeguards:</strong> We never publicly publish personal phone numbers or street addresses on the internet. All contact occurs strictly through a consent-based request mechanism.
            </div>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold text-amber-800 text-sm">•</span>
            <div>
              <strong>Severe Emergencies:</strong> If a patient is in acute trauma or critical surgery, always rely on immediate hospital emergency stocks and licensed blood banks. Online matching should be used as a supplementary community effort.
            </div>
          </li>
        </ul>
      </section>

      <!-- Section 4: Project Background & Contact -->
      <section class="card-student p-6 sm:p-8 text-center space-y-3">
        <h3 class="font-bold text-base text-gray-900">Developed as a Practical College Student Project</h3>
        <p class="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed">
          This web application was designed and engineered as a practical software engineering project demonstrating full-stack web technologies, Firebase serverless cloud architecture, and attribute-based security rules for public healthcare.
        </p>
        <div class="pt-2 flex justify-center gap-4">
          <a href="#/find-donors" class="btn-primary text-xs">Find Donors</a>
          <a href="#/contact" class="btn-secondary text-xs">Send Feedback or Report Listing</a>
        </div>
      </section>

    </div>
  `;
}
