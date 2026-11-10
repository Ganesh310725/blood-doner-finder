export function renderFooter(): string {
  return `
    <footer class="bg-gray-900 text-gray-300 border-t border-gray-800 mt-auto text-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <!-- Column 1: Platform Overview & Mission -->
          <div class="space-y-3 md:col-span-1">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-bold">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span class="text-white font-bold text-base">Blood Donor Finder</span>
            </div>
            <p class="text-xs text-gray-400 italic">
              "Connecting willing blood donors with people in need, because every donation can make a difference."
            </p>
            <p class="text-xs text-gray-400 leading-relaxed">
              A practical community-help network built to eliminate communication barriers between voluntary blood donors and families facing medical emergencies.
            </p>
          </div>

          <!-- Column 2: Quick Links -->
          <div>
            <h4 class="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-red-400">Quick Navigation</h4>
            <ul class="space-y-2 text-xs">
              <li><a href="#/" class="hover:text-white transition">Home</a></li>
              <li><a href="#/find-donors" class="hover:text-white transition">Find Donors by Blood Group & City</a></li>
              <li><a href="#/blood-requests" class="hover:text-white transition">Emergency Blood Requests</a></li>
              <li><a href="#/about" class="hover:text-white transition">About the Project</a></li>
              <li><a href="#/contact" class="hover:text-white transition">Contact & Feedback</a></li>
              <li><a href="#/login" class="hover:text-white transition">Login / Register</a></li>
            </ul>
          </div>

          <!-- Column 3: Emergency Helplines -->
          <div>
            <h4 class="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-red-400">Emergency Helplines</h4>
            <ul class="space-y-2 text-xs">
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span class="text-gray-400">Ambulance / Emergency:</span>
                <strong class="text-white font-mono">108 / 112</strong>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span class="text-gray-400">Red Cross Blood Bank:</span>
                <strong class="text-white font-mono">1910</strong>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span class="text-gray-400">National Health Helpline:</span>
                <strong class="text-white font-mono">1800-180-1104</strong>
              </li>
              <li class="text-[11px] text-gray-400 mt-2">
                For immediate life-threatening situations, please reach the hospital emergency ward directly without waiting for online responses.
              </li>
            </ul>
          </div>

          <!-- Column 4: Safety & Privacy Guarantee -->
          <div>
            <h4 class="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-red-400">Privacy & Medical Notice</h4>
            <div class="bg-gray-800 p-3 rounded border border-gray-700 text-xs text-gray-300 space-y-1.5">
              <p class="font-medium text-amber-300 flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Non-Medical Discovery Tool
              </p>
              <p class="text-[11px] text-gray-400 leading-normal">
                This platform is an informational bridge. We never share donor contact details publicly. Medical compatibility and screening must be verified by certified medical personnel.
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© ${new Date().getFullYear()} Blood Donor Finder. Community Healthcare Project.</p>
          <p class="flex items-center gap-1">
            <span>Built with care for public health & community service.</span>
          </p>
        </div>
      </div>
    </footer>
  `;
}
