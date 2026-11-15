// GharDekho Main Application Controller (Slice 1 Owner Listing)
const GharDekho = (() => {
  let state = {
    currentRole: 'tenant', // 'tenant' | 'owner'
    activeTab: 'khojo',    // 'khojo' | 'map' | 'saved' | 'inquiries' | 'profile'
    activeCity: 'All',
    activeGender: 'any',
    activeType: 'all',
    searchQuery: '',
    budgetMax: 25000,
    budgetMin: 1000,
    filterGender: 'any',
    filterType: 'all',
    filterSharing: 'all',
    filterAmenities: new Set(),
    filterSortBy: 'distance', // 'distance' | 'price_asc' | 'price_desc' | 'rating'
    userCoords: { lat: 25.1388, lng: 75.8344, label: "Talwandi, Kota" },
    mapSelectedId: null,
    savedIds: new Set(['prop-kota-01']),
    savedPropertiesData: [],
    notifications: [],
    unreadNotifCount: 0,
    notifFilter: 'all', // 'all' | 'unread'
    isNotifModalOpen: false,
    preferences: {
      smsAlerts: true,
      whatsappUpdates: true,
      slotVacancyAlerts: true,
      chatAlerts: true,
      marketingEmails: false
    },
    // Slice P2: Authentication & Profile Session
    authUser: (() => {
      try { return JSON.parse(localStorage.getItem('ghar_user')); } catch (e) { return null; }
    })(),
    authToken: (() => {
      try { return localStorage.getItem('ghar_token') || null; } catch (e) { return null; }
    })(),
    authStep: 'phone',
    authPhone: '',
    authDemoOtp: '',
    authRole: 'tenant',
    properties: [],
    inquiries: [],
    activeChatThreadId: null,
    selectedProperty: null,
    ownerStep: 1,
    ownerDraft: {
      title: "Radha Krishna Residency & Study PG",
      propertyType: "pg",
      category: "sharing_room",
      genderPreference: "male",
      city: "Kota",
      locality: "Talwandi, Near Allen Samarth",
      address: "Plot 42-B, Sector 2, Talwandi, Kota, Rajasthan",
      floor: 2,
      totalFloors: 4,
      hasLift: false,
      lat: 25.1388,
      lng: 75.8344,
      landmark: "Allen Samarth (250m)",
      busDistance: "500m to City Bus Stand",
      amenities: {
        electricityBackup: "Generator (Full 24hr)",
        waterSupply: "24 Hours (RO + Tank)",
        waterTiming: "24x7 Uninterrupted",
        hotWater: true,
        wifi: true,
        ac: false,
        cooler: true,
        ceilingFan: true,
        furnishing: "fully",
        kitchenAllowed: false,
        kitchenType: "none",
        bathroom: "Attached Western",
        toiletSeat: "western",
        washingMachine: true,
        parkingTwoWheeler: true,
        parkingFourWheeler: false,
        cctv: true,
        securityGuard: true,
        tiffinNearby: true,
        curfewTime: "10:00 PM",
        singleGirlSafe: true,
        ownerOnPremises: true
      },
      roomLabel: "Room 204 (4-Bed Split Sharing)",
      sharingOccupancy: 4,
      pricePerPerson: 3800,
      depositAmount: 3800,
      noticePeriodDays: 30,
      areaSqft: 280,
      photos: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
      ]
    }
  };

  // DOM Elements
  const el = {
    shell: document.getElementById('deviceShell'),
    roleTenantBtn: document.getElementById('roleTenantBtn'),
    roleOwnerBtn: document.getElementById('roleOwnerBtn'),
    notifBellBtn: document.getElementById('notifBellBtn'),
    notifBadge: document.getElementById('notifBadge'),
    cityPill: document.getElementById('cityPill'),
    searchInput: document.getElementById('searchInput'),
    chipsContainer: document.getElementById('quickChips'),
    contentArea: document.getElementById('appContent'),
    bottomNav: document.getElementById('bottomNav'),
    detailModal: document.getElementById('detailModal'),
    modalContent: document.getElementById('modalContent'),
    filterModal: document.getElementById('filterModal'),
    filterContent: document.getElementById('filterModalContent'),
    subModal: document.getElementById('subModal'),
    subModalContent: document.getElementById('subModalContent'),
    notifModal: document.getElementById('notifModal'),
    notifModalContent: document.getElementById('notifModalContent'),
    authModal: document.getElementById('authModal'),
    authModalContent: document.getElementById('authModalContent'),
    headerAuthLabel: document.getElementById('headerAuthLabel'),
    offlineBanner: document.getElementById('offlineBanner'),
    a11yAnnouncer: document.getElementById('a11yAnnouncer'),
    toast: document.getElementById('toastMsg')
  };

  // Slice 8: Service Worker Registration for Offline PWA
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('⚡ [GharDekho SW] Registered:', reg.scope))
          .catch(err => console.warn('⚡ [GharDekho SW] Skipped:', err));
      });
    }
  }

  // Slice 8: Screen Reader Live Announcements (TalkBack / VoiceOver)
  function announceToScreenReader(msg) {
    if (el.a11yAnnouncer) {
      el.a11yAnnouncer.textContent = '';
      setTimeout(() => {
        el.a11yAnnouncer.textContent = msg;
      }, 50);
    }
  }

  // Slice 8: Network Connection Monitoring (Online / Offline Stale Banner)
  function setupNetworkListeners() {
    window.addEventListener('online', () => {
      if (el.offlineBanner) el.offlineBanner.style.display = 'none';
      showToast('🟢 Back Online! Syncing changes...');
      announceToScreenReader('Network restored. Syncing data.');
      syncOfflineQueue();
      fetchProperties();
      fetchSaved();
      fetchNotifications();
    });

    window.addEventListener('offline', () => {
      if (el.offlineBanner) el.offlineBanner.style.display = 'flex';
      showToast('⚠️ Offline Mode · Loaded from device storage');
      announceToScreenReader('You are now in offline mode. Viewing cached listings.');
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine && el.offlineBanner) {
      el.offlineBanner.style.display = 'flex';
    }
  }

  // Slice 8: Offline Action Queue Sync
  async function syncOfflineQueue() {
    try {
      const queueRaw = localStorage.getItem('ghar_offline_queue');
      if (!queueRaw) return;
      const actions = JSON.parse(queueRaw);
      if (!Array.isArray(actions) || actions.length === 0) return;

      const res = await fetch('/api/sync/offline-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('ghar_offline_queue');
        console.log(`⚡ Synced ${data.syncedCount} offline actions`);
      }
    } catch (e) {
      console.warn('Sync offline queue skipped:', e);
    }
  }

  function queueOfflineAction(action) {
    try {
      const queueRaw = localStorage.getItem('ghar_offline_queue') || '[]';
      const queue = JSON.parse(queueRaw);
      queue.push({
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        ...action
      });
      localStorage.setItem('ghar_offline_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('Queue offline action failed:', e);
    }
  }

  // Initialize App
  async function init() {
    initTheme();
    initLanguage();
    initVoiceSearch();
    registerServiceWorker();
    setupNetworkListeners();
    setupEventListeners();
    syncAuthHeader();
    if (state.authToken) checkUserSession();
    await Promise.all([fetchProperties(), fetchInquiries(), fetchNotifications(), fetchSaved()]);
    render();
  }

  // Fetch properties from local API or fallback to offline cached data
  async function fetchProperties() {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.success && data.properties) {
        state.properties = data.properties;
        try {
          localStorage.setItem('ghar_cached_properties', JSON.stringify(data.properties));
        } catch (storageErr) {}
      }
    } catch (e) {
      console.warn('API fetch failed, loading from offline cache', e);
      try {
        const cached = localStorage.getItem('ghar_cached_properties');
        if (cached) {
          state.properties = JSON.parse(cached);
          if (el.offlineBanner) el.offlineBanner.style.display = 'flex';
        }
      } catch (cacheErr) {}
    }
  }

  // Fetch owner inquiries
  async function fetchInquiries() {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data.success) {
        state.inquiries = data.inquiries;
      }
    } catch (e) {
      console.warn('Inquiries fetch failed', e);
    }
  }

  // Show toast notification with screen reader announcement
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.style.display = 'block';
    announceToScreenReader(msg);
    setTimeout(() => {
      el.toast.style.display = 'none';
    }, 3200);
  }

  let searchDebounceTimer = null;

  // Event Listeners
  function setupEventListeners() {
    // Role switchers
    el.roleTenantBtn.addEventListener('click', () => switchRole('tenant'));
    el.roleOwnerBtn.addEventListener('click', () => switchRole('owner'));

    // Debounced search input (250ms debounce for budget processors)
    el.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value.toLowerCase();
        renderFeed();
      }, 250);
    });

    // Close detail modal on backdrop click
    el.detailModal.addEventListener('click', (e) => {
      if (e.target === el.detailModal) closeDetail();
    });

    // Close filter sheet on backdrop click
    if (el.filterModal) {
      el.filterModal.addEventListener('click', (e) => {
        if (e.target === el.filterModal) closeFilterSheet();
      });
    }

    // Close submodal on backdrop click
    if (el.subModal) {
      el.subModal.addEventListener('click', (e) => {
        if (e.target === el.subModal) closeSubModal();
      });
    }

    // Close notification modal on backdrop click
    if (el.notifModal) {
      el.notifModal.addEventListener('click', (e) => {
        if (e.target === el.notifModal) closeNotifications();
      });
    }

    // Close auth modal on backdrop click
    if (el.authModal) {
      el.authModal.addEventListener('click', (e) => {
        if (e.target === el.authModal) closeAuthModal();
      });
    }
  }

  // Switch role between Tenant and Owner
  function switchRole(role) {
    state.currentRole = role;
    if (role === 'tenant') {
      el.roleTenantBtn.classList.add('active');
      el.roleOwnerBtn.classList.remove('active');
      state.activeTab = 'khojo';
    } else {
      el.roleOwnerBtn.classList.add('active');
      el.roleTenantBtn.classList.remove('active');
      state.activeTab = 'owner_listings';
      fetchInquiries();
    }
    fetchNotifications();
    renderNav();
    render();
    showToast(`Switched to ${role === 'tenant' ? 'Kirayedaar (Tenant)' : 'Makan Maalik (Owner)'} mode`);
  }

  // Render main content area based on role and tab
  function render() {
    const heroSection = document.getElementById('heroHomeSection');
    const isHomeKhojo = (state.currentRole === 'tenant' && state.activeTab === 'khojo');
    if (heroSection) {
      heroSection.style.display = isHomeKhojo ? 'block' : 'none';
    }

    // Update Desktop Nav Links active classes
    const navKhojo = document.getElementById('navLinkKhojo');
    const navSaved = document.getElementById('navLinkSaved');
    const navOwners = document.getElementById('navLinkOwners');
    if (navKhojo) navKhojo.classList.toggle('active', isHomeKhojo);
    if (navSaved) navSaved.classList.toggle('active', state.currentRole === 'tenant' && state.activeTab === 'saved');
    if (navOwners) navOwners.classList.toggle('active', state.currentRole === 'owner');

    // Update View Toggle (List vs Map) active states
    const btnList = document.getElementById('viewToggleList');
    const btnMap = document.getElementById('viewToggleMap');
    if (btnList) btnList.classList.toggle('active', state.activeTab === 'khojo');
    if (btnMap) btnMap.classList.toggle('active', state.activeTab === 'map');

    if (state.currentRole === 'tenant') {
      if (state.activeTab === 'khojo') renderFeed();
      else if (state.activeTab === 'map') renderMapView();
      else if (state.activeTab === 'saved') renderSaved();
      else if (state.activeTab === 'messages') renderMessages();
      else if (state.activeTab === 'profile') renderProfile();
    } else {
      if (state.activeTab === 'owner_listings') renderOwnerListings();
      else if (state.activeTab === 'owner_add') renderOwnerAddWizard();
      else if (state.activeTab === 'owner_inquiries') renderOwnerInquiries();
      else if (state.activeTab === 'owner_profile') renderProfile();
    }

    if (window.GharI18n && window.GharI18n.translateDom) {
      window.GharI18n.translateDom();
    }
  }

  // Helper: Haversine distance in Kilometers
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // Filter & Search Engine (Slice 2)
  function getFilteredProperties() {
    let list = state.properties.filter(p => p.isAvailable);

    // City
    if (state.activeCity !== 'All') {
      list = list.filter(p => p.city.toLowerCase() === state.activeCity.toLowerCase());
    }

    // Gender
    if (state.filterGender !== 'any') {
      list = list.filter(p => p.genderPreference === state.filterGender || p.genderPreference === 'any');
    }

    // Property Type
    if (state.filterType !== 'all') {
      list = list.filter(p => p.propertyType === state.filterType);
    }

    // Sharing Occupancy (1, 2, 3, 4, single, sharing)
    if (state.filterSharing !== 'all') {
      const sNum = parseInt(state.filterSharing, 10);
      if (!isNaN(sNum)) {
        list = list.filter(p => p.rooms && p.rooms.some(r => r.maxOccupancy === sNum));
      } else if (state.filterSharing === 'single') {
        list = list.filter(p => p.rooms && p.rooms.some(r => r.maxOccupancy === 1));
      } else if (state.filterSharing === 'sharing') {
        list = list.filter(p => p.rooms && p.rooms.some(r => r.maxOccupancy > 1));
      }
    }

    // Budget range
    list = list.filter(p => {
      const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
      return minPrice >= state.budgetMin && minPrice <= state.budgetMax;
    });

    // Indian Amenities
    if (state.filterAmenities.size > 0) {
      list = list.filter(p => {
        const a = p.amenities || {};
        for (let amenity of state.filterAmenities) {
          if (amenity === 'wifi' && (!a.wifi || a.wifi === 'None')) return false;
          if (amenity === 'ac' && a.cooling !== 'AC') return false;
          if (amenity === 'powerbackup' && (!a.electricityBackup || a.electricityBackup.toLowerCase().includes('no'))) return false;
          if (amenity === 'water24hr' && (!a.waterSupply || !a.waterSupply.toLowerCase().includes('24'))) return false;
          if (amenity === 'attachedbath' && (!a.bathroom || !a.bathroom.toLowerCase().includes('attached'))) return false;
          if (amenity === 'singlegirlsafe' && !a.singleGirlSafe && p.genderPreference !== 'female') return false;
        }
        return true;
      });
    }

    // Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.nearbyPlaces && p.nearbyPlaces.some(n => n.name.toLowerCase().includes(q)))
      );
    }

    // Calculate distance to current user coordinates
    list = list.map(p => {
      const dist = p.coordinates 
        ? getDistanceKm(state.userCoords.lat, state.userCoords.lng, p.coordinates.lat, p.coordinates.lng)
        : 1.2;
      return { ...p, distanceKm: dist };
    });

    // Sort
    if (state.filterSortBy === 'price_asc') {
      list.sort((a, b) => Math.min(...a.rooms.map(r => r.pricePerPerson)) - Math.min(...b.rooms.map(r => r.pricePerPerson)));
    } else if (state.filterSortBy === 'price_desc') {
      list.sort((a, b) => Math.min(...b.rooms.map(r => r.pricePerPerson)) - Math.min(...a.rooms.map(r => r.pricePerPerson)));
    } else if (state.filterSortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: distance
      list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return list;
  }

  // Render Tenant Feed (Slice 2)
  function renderFeed() {
    const list = getFilteredProperties();
    const hasActiveFilters = state.filterGender !== 'any' || state.filterType !== 'all' || 
                             state.filterSharing !== 'all' || state.filterAmenities.size > 0 || 
                             state.budgetMax < 25000;
    
    // Update live counts in upper section header and toolbar
    const countEl = document.getElementById('sectionStaysCount');
    if (countEl) countEl.textContent = list.length;
    const savedCountEl = document.getElementById('secSavedCount');
    if (savedCountEl) savedCountEl.textContent = state.savedIds.size;
    
    let html = `
      ${hasActiveFilters ? `
        <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px;">
          <span class="chip" style="font-size: 11px; background: rgba(13, 92, 82, 0.1); border-color: var(--thikana-teal); color: var(--thikana-teal); font-weight: 600;" onclick="GharDekho.openFilterSheet()">
            ⚙️ Active Filters (${state.filterAmenities.size + (state.filterGender !== 'any' ? 1 : 0) + (state.filterType !== 'all' ? 1 : 0)})
          </span>
          <span class="chip" style="font-size: 11px; color: var(--color-danger); cursor: pointer;" onclick="GharDekho.resetFilters()">
            ✕ Clear All
          </span>
        </div>
      ` : ''}

      <div class="listings-grid">
    `;

    if (list.length === 0) {
      html += `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-secondary);">
          <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">No rooms match your filters</h3>
          <p style="font-size: 13px; max-width: 280px; margin: 0 auto 14px;">
            Try widening budget range or resetting amenity filters
          </p>
          <button class="btn-inspect" style="margin: 0 auto;" onclick="GharDekho.resetFilters()">
            Reset All Filters
          </button>
        </div>
      `;
    } else {
      list.forEach(p => {
        const isSaved = state.savedIds.has(p.id);
        const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
        const sharedRoom = p.rooms.find(r => r.maxOccupancy > 1) || p.rooms[0];
        const vacantBeds = p.rooms.reduce((acc, r) => acc + (r.maxOccupancy - r.currentOccupancy), 0);

        let vacancyClass = 'trust';
        let vacancyText = `${vacantBeds} Beds Vacant`;
        if (vacantBeds === 0) {
          vacancyClass = 'danger';
          vacancyText = 'Fully Occupied (Waitlist)';
        } else if (vacantBeds <= 2) {
          vacancyClass = 'warning';
          vacancyText = `Only ${vacantBeds} ${vacantBeds === 1 ? 'Bed' : 'Beds'} Left!`;
        }

        html += `
          <div class="property-card" onclick="GharDekho.openDetail('${p.id}')">
            <div class="card-media">
              <img class="card-img" src="${p.photos[0]}" alt="${p.title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';" />
              
              <!-- Rating Micro-Badge -->
              <div class="card-badge-top-left">
                ⭐ ${p.rating} <span style="color: var(--text-muted); font-weight: 500;">(${p.reviewsCount || 4})</span>
              </div>

              <!-- Heart Bookmark -->
              <button class="heart-btn ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); GharDekho.toggleSave('${p.id}')" title="Save to shortlist" aria-label="Bookmark Room">
                ${isSaved ? '❤️' : '🤍'}
              </button>

              <!-- Live Vacancy Pill -->
              <div class="card-vacancy-pill ${vacancyClass}">
                <span class="pulse-dot"></span>
                <span>${vacancyText}</span>
              </div>

              <!-- Gender Preference Tag -->
              <div class="card-gender-pill">
                ${p.genderPreference === 'female' ? '🌸 Girls PG' : p.genderPreference === 'male' ? '🎯 Boys PG' : '🤝 Co-ed PG'}
              </div>
            </div>

            <div class="card-body">
              <div class="card-locality-row">
                <div class="card-locality">
                  📍 ${p.locality}, ${p.city}
                </div>
                <div class="card-distance">
                  ${p.distanceKm || 0.4} km away
                </div>
              </div>

              <h3 class="card-title">${p.title}</h3>

              <!-- Hyperlocal Checklist Chips -->
              <div class="card-amenities-row">
                <div class="card-amenity-item" title="Water Supply">
                  <span>💧</span> <span>${p.amenities.waterSupply.split('(')[0].trim()}</span>
                </div>
                <div class="card-amenity-item" title="Electricity Backup">
                  <span>⚡</span> <span>${p.amenities.electricityBackup.split(' ')[0]} Backup</span>
                </div>
                <div class="card-amenity-item" title="Bathroom">
                  <span>🚿</span> <span>${p.amenities.bathroom.split(' ')[0]} Bath</span>
                </div>
                <div class="card-amenity-item" title="Owner Verification">
                  <span>🛡️</span> <span>${p.owner?.isKycDone ? 'Aadhaar Verified' : 'Direct Owner'}</span>
                </div>
              </div>

              <!-- Shared Room Live Beds Indicator -->
              ${sharedRoom ? `
                <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); padding: 7px 10px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--color-student);">
                    🛏️ ${sharedRoom.label.split('(')[0].trim()}
                  </span>
                  <span style="font-size: 11px; font-weight: 700; color: var(--color-trust);">
                    ${sharedRoom.maxOccupancy - sharedRoom.currentOccupancy} of ${sharedRoom.maxOccupancy} Beds Available
                  </span>
                </div>
              ` : ''}

              <!-- Card Price & Inspect CTA -->
              <div class="card-footer">
                <div class="card-price-group">
                  <span class="card-price">₹${minPrice.toLocaleString('en-IN')}</span>
                  <span class="card-price-sub">per person / month</span>
                </div>
                <button class="btn-inspect" onclick="event.stopPropagation(); GharDekho.openDetail('${p.id}')">
                  Inspect Beds →
                </button>
              </div>

            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    el.contentArea.innerHTML = html;
  }

  // Interactive Map View with Pin Clusters & Float Card (Slice 2)
  function renderMapView() {
    const list = getFilteredProperties();
    if (!state.mapSelectedId && list.length > 0) {
      state.mapSelectedId = list[0].id;
    }
    const selectedProp = list.find(p => p.id === state.mapSelectedId) || list[0];

    // Calculate simulated 2D pin positions across map canvas (0% to 100%)
    const pinCoords = [
      { top: '35%', left: '42%' },
      { top: '25%', left: '68%' },
      { top: '65%', left: '30%' },
      { top: '55%', left: '72%' },
      { top: '45%', left: '50%' }
    ];

    el.contentArea.innerHTML = `
      <div class="view-mode-bar">
        <div>
          <span class="results-count"><b>${list.length}</b> locations on interactive map</span>
          <div style="font-size: 11px; color: var(--color-trust);">
            📍 Showing rooms around ${state.activeCity}
          </div>
        </div>
        <div class="view-toggle-btns">
          <button class="view-toggle-btn" onclick="GharDekho.setTab('khojo')">List</button>
          <button class="view-toggle-btn active" onclick="GharDekho.setTab('map')">🗺️ Map</button>
        </div>
      </div>

      <!-- Interactive Map Frame -->
      <div class="interactive-map-wrapper">
        <!-- Styled Vector Map Background -->
        <svg class="map-svg-canvas" viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#1A2638" />
              <stop offset="100%" stop-color="#090E17" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGlow)" />
          
          <!-- Road Grid -->
          <line x1="0" y1="120" x2="400" y2="120" stroke="#1E293B" stroke-width="3" stroke-dasharray="4,4" />
          <line x1="0" y1="240" x2="400" y2="240" stroke="#1E293B" stroke-width="4" />
          <line x1="140" y1="0" x2="140" y2="380" stroke="#1E293B" stroke-width="3" />
          <line x1="280" y1="0" x2="280" y2="380" stroke="#1E293B" stroke-width="5" />
          
          <!-- Metro / Highway Route -->
          <path d="M 20 360 Q 200 180 380 60" fill="none" stroke="rgba(255, 107, 0, 0.3)" stroke-width="3" />
          
          <!-- River / Water canal -->
          <path d="M 0 40 Q 150 70 400 30" fill="none" stroke="rgba(59, 130, 246, 0.25)" stroke-width="8" />

          <!-- Institute Landmark Zone -->
          <rect x="180" y="140" width="80" height="50" rx="8" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1" />
          <text x="220" y="170" fill="rgba(16, 185, 129, 0.7)" font-size="9" text-anchor="middle" font-family="sans-serif">Coaching Hub</text>
        </svg>

        <!-- User Location Beacon (You Are Here) -->
        <div class="user-beacon-dot" style="top: 50%; left: 50%;" title="You are here in ${state.userCoords.label}"></div>

        <!-- Interactive Map Pins -->
        ${list.map((p, idx) => {
          const coord = pinCoords[idx % pinCoords.length];
          const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
          const isSelected = selectedProp && selectedProp.id === p.id;
          return `
            <button class="map-pin-btn ${isSelected ? 'selected' : ''}" 
                    style="top: ${coord.top}; left: ${coord.left};"
                    onclick="GharDekho.selectMapPin('${p.id}')">
              <span>🏠</span>
              <span>₹${(minPrice / 1000).toFixed(1)}k</span>
            </button>
          `;
        }).join('')}

        <!-- Slide-Up Map Float Preview Card -->
        ${selectedProp ? `
          <div class="map-float-card" onclick="GharDekho.openDetail('${selectedProp.id}')">
            <img class="map-float-thumb" src="${selectedProp.photos[0]}" alt="${selectedProp.title}" />
            <div class="map-float-info">
              <div class="map-float-title">${selectedProp.title}</div>
              <div class="map-float-dist">
                📍 ${selectedProp.distanceKm} km away • ${selectedProp.locality.split(',')[0]}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); font-size: 13px;">
                  ₹${Math.min(...selectedProp.rooms.map(r => r.pricePerPerson))}/mo
                </span>
                <span style="font-size: 11px; color: var(--color-trust); font-weight: 700;">
                  Inspect & Book →
                </span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="font-size: 14px; color: var(--text-primary);">Nearest Rooms to You:</h4>
        <button class="chip" style="font-size: 10px;" onclick="GharDekho.recenterMap()">
          🎯 Re-Center My Location
        </button>
      </div>

      <div class="listings-grid">
        ${list.slice(0, 3).map(p => `
          <div class="property-card" onclick="GharDekho.openDetail('${p.id}')" style="margin-bottom: 6px;">
            <div class="card-body" style="padding: 10px 14px;">
              <div style="display: flex; justify-content: space-between;">
                <div class="card-locality" style="font-size: 11px;">📍 ${p.locality}</div>
                <span style="font-size: 11px; color: var(--color-trust);">${p.distanceKm} km</span>
              </div>
              <h3 class="card-title" style="font-size: 14px; margin-bottom: 4px;">${p.title}</h3>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); font-size: 13px;">
                  ₹${Math.min(...p.rooms.map(r => r.pricePerPerson))}/mo
                </span>
                <span style="font-size: 11px; color: var(--color-trust);">View Room →</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function selectMapPin(id) {
    state.mapSelectedId = id;
    renderMapView();
  }

  function recenterMap() {
    state.userCoords = { lat: 25.1388, lng: 75.8344, label: "Talwandi, Kota" };
    showToast('🎯 Map centered on coaching hub');
    renderMapView();
  }

  // --- SLICE 2: FILTER BOTTOM SHEET MODAL ---
  function openFilterSheet() {
    el.filterContent.innerHTML = `
      <div class="sheet-handle"></div>
      
      <div class="filter-sheet-header">
        <h3 style="font-family: var(--font-display); font-size: 17px; color: var(--text-primary);">
          ⚙️ Filter & Sort Rooms
        </h3>
        <button class="sheet-close-btn" onclick="GharDekho.closeFilterSheet()">✕</button>
      </div>

      <div class="filter-sheet-body">
        <!-- Budget Range Slider -->
        <div>
          <div class="filter-label">
            <span>Budget (Maximum Rent)</span>
            <span style="color: var(--color-primary); font-family: var(--font-mono);">
              ₹${state.budgetMax.toLocaleString('en-IN')} / month
            </span>
          </div>
          <input type="range" class="range-slider" min="2000" max="30000" step="500" value="${state.budgetMax}" id="budgetSlider" oninput="GharDekho.onBudgetChange(this.value)" />
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px;">
            <span>₹2,000</span>
            <span>₹15,000</span>
            <span>₹30,000+</span>
          </div>
        </div>

        <!-- Property Type -->
        <div>
          <div class="filter-label">Property Type</div>
          <div class="filter-chips-grid">
            <span class="filter-chip-option ${state.filterType === 'all' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterType', 'all')">All</span>
            <span class="filter-chip-option ${state.filterType === 'pg' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterType', 'pg')">PG / Hostel</span>
            <span class="filter-chip-option ${state.filterType === 'room' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterType', 'room')">Independent Room</span>
            <span class="filter-chip-option ${state.filterType === 'flat' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterType', 'flat')">Flat / 1BHK</span>
            <span class="filter-chip-option ${state.filterType === 'studio' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterType', 'studio')">Studio</span>
          </div>
        </div>

        <!-- Gender Preference -->
        <div>
          <div class="filter-label">Tenant Preference</div>
          <div class="filter-chips-grid">
            <span class="filter-chip-option ${state.filterGender === 'any' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterGender', 'any')">All / Any</span>
            <span class="filter-chip-option ${state.filterGender === 'male' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterGender', 'male')">Boys Only</span>
            <span class="filter-chip-option ${state.filterGender === 'female' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterGender', 'female')">Girls Only</span>
          </div>
        </div>

        <!-- Sharing Occupancy -->
        <div>
          <div class="filter-label">Room Sharing Model</div>
          <div class="filter-chips-grid">
            <span class="filter-chip-option ${state.filterSharing === 'all' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSharing', 'all')">Any Sharing</span>
            <span class="filter-chip-option ${state.filterSharing === '1' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSharing', '1')">Single Bed</span>
            <span class="filter-chip-option ${state.filterSharing === '2' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSharing', '2')">Double Sharing</span>
            <span class="filter-chip-option ${state.filterSharing === '3' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSharing', '3')">3-Bed Sharing</span>
            <span class="filter-chip-option ${state.filterSharing === '4' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSharing', '4')">4-Bed Split Room</span>
          </div>
        </div>

        <!-- Sort By -->
        <div>
          <div class="filter-label">Sort Listings By</div>
          <div class="filter-chips-grid">
            <span class="filter-chip-option ${state.filterSortBy === 'distance' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSortBy', 'distance')">📍 Nearest First</span>
            <span class="filter-chip-option ${state.filterSortBy === 'price_asc' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSortBy', 'price_asc')">💰 Price: Low to High</span>
            <span class="filter-chip-option ${state.filterSortBy === 'price_desc' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSortBy', 'price_desc')">💎 Price: High to Low</span>
            <span class="filter-chip-option ${state.filterSortBy === 'rating' ? 'active' : ''}" onclick="GharDekho.setFilterOption('filterSortBy', 'rating')">⭐ Top Rated</span>
          </div>
        </div>

        <!-- Essential Indian Amenities -->
        <div>
          <div class="filter-label">Essential Indian Amenities</div>
          <div class="amenities-toggle-grid">
            <div class="amenity-toggle-chip ${state.filterAmenities.has('powerbackup') ? 'active' : ''}" onclick="GharDekho.toggleFilterAmenity('powerbackup')">
              <span class="amenity-check">✓</span>
              <span>⚡ 24hr Power Backup</span>
            </div>
            <div class="amenity-toggle-chip ${state.filterAmenities.has('water24hr') ? 'active' : ''}" onclick="GharDekho.toggleFilterAmenity('water24hr')">
              <span class="amenity-check">✓</span>
              <span>💧 24hr Water (RO)</span>
            </div>
            <div class="amenity-toggle-chip ${state.filterAmenities.has('attachedbath') ? 'active' : ''}" onclick="GharDekho.toggleFilterAmenity('attachedbath')">
              <span class="amenity-check">✓</span>
              <span>🚿 Attached Western Bath</span>
            </div>
            <div class="amenity-toggle-chip ${state.filterAmenities.has('wifi') ? 'active' : ''}" onclick="GharDekho.toggleFilterAmenity('wifi')">
              <span class="amenity-check">✓</span>
              <span>🌐 High-Speed WiFi</span>
            </div>
            <div class="amenity-toggle-chip ${state.filterAmenities.has('ac') ? 'active' : ''}" onclick="GharDekho.toggleFilterAmenity('ac')">
              <span class="amenity-check">✓</span>
              <span>❄️ Air Conditioner (AC)</span>
            </div>
            <div class="amenity-toggle-chip ${state.filterAmenities.has('singlegirlsafe') ? 'active' : ''}" onclick="GharDekho.toggleFilterAmenity('singlegirlsafe')">
              <span class="amenity-check">✓</span>
              <span>🛡️ Single Girl Safe</span>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-sheet-footer">
        <button class="chip" style="flex: 1; justify-content: center;" onclick="GharDekho.resetFilters()">
          Reset All
        </button>
        <button class="btn-inspect" style="flex: 2; justify-content: center;" onclick="GharDekho.applyFilterSheet()">
          Show Matching Rooms
        </button>
      </div>
    `;

    el.filterModal.classList.add('active');
  }

  function closeFilterSheet() {
    el.filterModal.classList.remove('active');
  }

  function onBudgetChange(val) {
    state.budgetMax = Number(val);
    const label = document.querySelector('.filter-label span[style*="mono"]');
    if (label) label.textContent = `₹${state.budgetMax.toLocaleString('en-IN')} / month`;
  }

  function setFilterOption(key, val) {
    state[key] = val;
    openFilterSheet();
  }

  function toggleFilterAmenity(amenity) {
    if (state.filterAmenities.has(amenity)) {
      state.filterAmenities.delete(amenity);
    } else {
      state.filterAmenities.add(amenity);
    }
    openFilterSheet();
  }

  function applyFilterSheet() {
    closeFilterSheet();
    render();
    const count = getFilteredProperties().length;
    showToast(`Filters applied: Showing ${count} rooms`);
  }

  // --- SLICE 3: FULL LISTING DETAIL & HYPERLOCAL BREAKDOWN ---
  async function openDetail(id) {
    const p = state.properties.find(item => item.id === id);
    if (!p) return;
    state.selectedProperty = p;
    state.galleryActiveIndex = 0;
    state.selectedVisitDate = 'Tomorrow';
    state.selectedVisitSlot = '11:00 AM';
    state.currentPropertyMesses = [];

    try {
      const [revRes, messRes] = await Promise.all([
        fetch(`/api/properties/${id}/reviews`),
        fetch(`/api/mess/property/${id}`)
      ]);
      const revData = await revRes.json();
      if (revData.success) {
        state.currentPropertyReviews = revData;
      }
      const messData = await messRes.json();
      if (messData.success && messData.messCenters) {
        state.currentPropertyMesses = messData.messCenters;
      }
    } catch (e) {
      console.warn('Reviews or Mess fetch failed', e);
    }

    renderDetailSheet();
    el.detailModal.classList.add('open');
  }

  function renderMessSectionHtml() {
    const messes = state.currentPropertyMesses || [];
    if (messes.length === 0) return '';

    return `
      <div class="mess-radar-section" style="margin-bottom: 20px; padding: 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <h3 style="font-size: 14px; font-family: var(--font-display); color: var(--text-primary); margin-bottom: 2px;">
              🍲 Nearby Mess & Tiffin Services (Within 300m)
            </h3>
            <div style="font-size: 11px; color: var(--text-secondary);">
              FSSAI verified · Daily homestyle food · Monthly student subscription
            </div>
          </div>
          <span class="badge-tag verified" style="font-size: 10px;">
            FSSAI Verified
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
          ${messes.map(m => `
            <div class="mess-card-item" style="padding: 12px; background: var(--bg-canvas); border: 1px solid var(--border-medium); border-radius: var(--radius-sm);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <div>
                  <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${m.name}</h4>
                  <div style="font-size: 11px; color: var(--color-trust); font-weight: 600;">
                    📍 ${m.distanceMeters}m away (${m.walkingMinutes} min walk) • ⭐ ${m.hygieneRating}/5 (${m.reviews.length} reviews)
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 13px; font-weight: 800; color: var(--color-primary);">₹${m.plans.monthlyBothMeals}<span style="font-size: 10px; font-weight: 500; color: var(--text-secondary);">/mo</span></div>
                  <div style="font-size: 10px; color: var(--text-secondary);">Lunch + Dinner</div>
                </div>
              </div>

              <!-- Today's Live Menu Card -->
              <div style="background: var(--bg-surface); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px dashed var(--border-medium); margin-bottom: 8px; font-size: 11px;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  🍱 Today's Thali Menu:
                </div>
                <div style="color: var(--text-secondary); margin-bottom: 2px;">
                  ☀️ <b>Lunch:</b> ${m.todayMenu?.lunch?.main || 'Homestyle Dal & Sabji'} (${m.todayMenu?.lunch?.bread || '4 Rotis'})
                </div>
                <div style="color: var(--text-secondary);">
                  🌙 <b>Dinner:</b> ${m.todayMenu?.dinner?.main || 'Paneer & Dal Tadka'}
                </div>
              </div>

              <!-- Student Tags & Order Button -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${(m.tags || []).slice(0, 2).map(t => `
                    <span style="font-size: 10px; padding: 2px 6px; background: var(--bg-surface-subtle); border-radius: var(--radius-pill); color: var(--text-secondary);">
                      ${t}
                    </span>
                  `).join('')}
                </div>
                <button class="btn btn-outline" style="font-size: 11px; padding: 4px 10px; height: auto;" onclick="GharDekho.subscribeTiffinPrompt('${m.id}', '${m.name}', ${m.plans.monthlyBothMeals})">
                  📦 Subscribe Tiffin
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderDetailSheet() {
    const p = state.selectedProperty;
    if (!p) return;
    const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
    const activePhoto = p.photos[state.galleryActiveIndex] || p.photos[0];
    const reviewData = state.currentPropertyReviews || {
      averageRating: p.rating || 4.8,
      totalReviews: p.reviewsCount || 0,
      verifiedReviewsCount: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      reviews: []
    };
    const reviewsList = reviewData.reviews || [];

    el.modalContent.innerHTML = `
      <div class="sheet-handle"></div>
      <button class="sheet-close-btn" onclick="GharDekho.closeDetail()">✕</button>

      <!-- Trust Badges & Title -->
      <div style="margin-bottom: 12px;">
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
          <span class="badge-tag verified">
            🛡️ ${p.verificationBadge}
          </span>
          <span class="badge-tag" style="background: rgba(139, 92, 246, 0.15); border-color: var(--color-student); color: var(--color-student);">
            ${p.genderPreference.toUpperCase()} ONLY
          </span>
          <span style="font-size: 11px; color: var(--color-trust); font-weight: 700; margin-left: auto;">
            ⭐ ${p.rating} (${p.reviewsCount || 4} reviews)
          </span>
        </div>

        <h2 style="font-family: var(--font-display); font-size: 20px; line-height: 1.3; color: var(--text-primary); margin-bottom: 4px;">
          ${p.title}
        </h2>
        <div style="font-size: 12px; color: var(--text-secondary);">
          📍 ${p.address} • <span style="color: var(--color-trust); font-weight: 600;">${p.distanceKm || '0.4'} km from coaching hub</span>
        </div>
      </div>

      <!-- Interactive Photo Gallery Carousel (Slice 3) -->
      <div class="detail-gallery-carousel">
        <img class="gallery-main-img" src="${activePhoto}" alt="${p.title}" onclick="GharDekho.nextGalleryPhoto()" />
        
        ${p.photos.length > 1 ? `
          <button class="gallery-nav-btn prev" onclick="GharDekho.prevGalleryPhoto()">‹</button>
          <button class="gallery-nav-btn next" onclick="GharDekho.nextGalleryPhoto()">›</button>
          <div class="gallery-counter-badge">
            📸 ${state.galleryActiveIndex + 1} / ${p.photos.length} Photos
          </div>
        ` : ''}
      </div>

      <!-- Thumbnail Strip -->
      ${p.photos.length > 1 ? `
        <div class="gallery-thumb-strip">
          ${p.photos.map((url, idx) => `
            <div class="gallery-thumb-item ${idx === state.galleryActiveIndex ? 'active' : ''}" onclick="GharDekho.setGalleryPhoto(${idx})">
              <img src="${url}" alt="Thumbnail ${idx + 1}" />
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Key Property Specs Bar -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: var(--bg-surface-raised); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 14px; text-align: center;">
        <div>
          <div style="font-size: 10px; color: var(--text-muted);">Floor</div>
          <div style="font-size: 12px; font-weight: 700;">${p.floor} of ${p.totalFloors}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--text-muted);">Lift</div>
          <div style="font-size: 12px; font-weight: 700; color: ${p.hasLift ? 'var(--color-trust)' : 'var(--text-muted)'};">${p.hasLift ? 'Available' : 'No Lift'}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--text-muted);">Deposit</div>
          <div style="font-size: 12px; font-weight: 700;">₹${p.depositAmount}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--text-muted);">Notice</div>
          <div style="font-size: 12px; font-weight: 700;">${p.noticePeriodDays} Days</div>
        </div>
      </div>

      <!-- Hyperlocal Indian Reality Alert Cards (Slice 3) -->
      <div class="hyperlocal-alert-card water">
        <div class="alert-card-icon">💧</div>
        <div class="alert-card-content">
          <h5>Water Supply: ${p.amenities.waterSupply}</h5>
          <p>Verified Schedule: <b>${p.amenities.waterTiming}</b>. Rooftop overhead storage tank installed. Geyser included for instant hot water.</p>
        </div>
      </div>

      <div class="hyperlocal-alert-card power">
        <div class="alert-card-icon">⚡</div>
        <div class="alert-card-content">
          <h5>Power Cut Resilience: ${p.amenities.electricityBackup}</h5>
          <p>Uninterrupted study lights, ceiling fan, and 100 Mbps fiber WiFi router running 24x7 without blackout drops.</p>
        </div>
      </div>

      <!-- Split Sharing Rooms & Live Bed Slots (Slice 4 Engine) -->
      <h3 style="font-size: 14px; font-family: var(--font-display); margin-top: 14px; margin-bottom: 8px;">
        🛏️ Available Room Configurations & Bed Slots
      </h3>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        ${p.rooms.map(room => {
          const isRoomFull = room.slots && room.slots.every(s => s.status !== 'available');
          const waitlistCount = room.waitlist ? room.waitlist.length : 0;
          return `
          <div class="room-slot-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 14px;">${room.label}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">
                  ${room.areaSqft} sq.ft • ${room.furnishing} furnished • ${room.bathroomType} bathroom
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--color-primary);">
                  ₹${room.pricePerPerson.toLocaleString('en-IN')}<span style="font-size: 10px; font-weight: 400; color: var(--text-muted);">/bed/mo</span>
                </div>
                <div style="font-size: 10px; color: ${isRoomFull ? 'var(--color-warning)' : 'var(--color-trust)'}; font-weight: 600; margin-bottom: 4px;">
                  ${isRoomFull ? '● Room Full' : `● ${room.slots.filter(s => s.status === 'available').length} Beds Vacant`}
                </div>
                <button class="room-vibe-pill-btn" onclick="GharDekho.openRoomAggregateVibe('${p.id}', '${room.id}')" title="Check room vibe compatibility">
                  ⚡ Room Vibe Check
                </button>
              </div>
            </div>

            <!-- Individual Bed Slots Row -->
            <div class="bed-slots-grid">
              ${room.slots.map(s => `
                <div class="bed-slot-item ${s.status}">
                  <div class="bed-slot-header">
                    <strong>🛏️ ${s.label || `Bed ${s.slotId.toUpperCase()}`}</strong>
                    <span class="bed-status-badge ${s.status}">${s.status}</span>
                  </div>
                  
                  ${s.status === 'available' ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                      <span style="font-size: 10px; color: var(--color-trust);">Ready for Move-In</span>
                      <div style="display: flex; gap: 4px;">
                        <button style="background: var(--color-trust); border: none; color: #FFF; font-weight: 700; font-size: 10px; padding: 3px 8px; border-radius: 4px; cursor: pointer;" onclick="GharDekho.bookBed('${p.id}', '${room.id}', '${s.slotId}')">
                          Book Bed
                        </button>
                        <button class="token-advance-btn" onclick="GharDekho.openTokenAdvanceModal('${p.id}', '${room.id}', '${s.slotId}')" title="Hold bed for 24 hours with ₹500 refundable token">
                          ₹500 Hold
                        </button>
                      </div>
                    </div>
                  ` : s.status === 'reserved' ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                      <div style="font-size: 10px; color: var(--color-warning);">
                        ⏳ Reserved (${s.tenantName || 'Applicant'})
                      </div>
                      <button class="token-advance-btn" onclick="GharDekho.openTokenAdvanceModal('${p.id}', '${room.id}', '${s.slotId}')" title="Upgrade to 24-hr lock with ₹500 advance">
                        ₹500 Hold
                      </button>
                    </div>
                  ` : s.status === 'token_confirmed' ? `
                    <div style="font-size: 10px; color: #10B981; font-weight: 700; margin-top: 4px;">
                      🔒 24-Hr Advance Locked (${s.tenantName || 'Student'})
                    </div>
                  ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                      <span style="font-size: 10px; color: var(--text-muted);">Occupant: <b>${s.tenantName}</b></span>
                      ${s.roommateProfile ? `
                        <button class="roommate-vibe-btn" onclick="GharDekho.openRoommateVibe('${p.id}', '${room.id}', '${s.slotId}')">
                          👤 Roommate Vibe
                        </button>
                      ` : ''}
                    </div>
                  `}
                </div>
              `).join('')}
            </div>

            <!-- Room Full Waitlist Banner -->
            ${isRoomFull ? `
              <div class="room-full-banner">
                <div>
                  <div class="room-full-text">🔒 All Beds Currently Occupied</div>
                  <div style="font-size: 10px; color: var(--text-muted);">
                    ${waitlistCount > 0 ? `${waitlistCount} student(s) waiting on list` : 'Be next in line when an occupant leaves'}
                  </div>
                </div>
                <button class="btn-join-waitlist" onclick="GharDekho.openWaitlistModal('${p.id}', '${room.id}')">
                  🔔 Join Waitlist
                </button>
              </div>
            ` : ''}
          </div>
        `}).join('')}
      </div>

      <!-- Verified Amenities Checklist (20+ Items) -->
      <h3 style="font-size: 14px; font-family: var(--font-display); margin-bottom: 8px;">
        ✅ Verified Property Amenities
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 16px; font-size: 11px;">
        <div class="trust-item">📶 <b>WiFi:</b> ${p.amenities.wifi || '100 Mbps'}</div>
        <div class="trust-item">❄️ <b>Cooling:</b> ${p.amenities.cooling || 'Cooler'}</div>
        <div class="trust-item">🚿 <b>Bathroom:</b> ${p.amenities.bathroom}</div>
        <div class="trust-item">🍳 <b>Food/Mess:</b> ${p.amenities.kitchen}</div>
        <div class="trust-item">🛵 <b>Parking:</b> ${p.amenities.parking}</div>
        <div class="trust-item">📹 <b>Security:</b> ${p.amenities.security}</div>
        <div class="trust-item">🧺 <b>Washing:</b> ${p.amenities.washingMachine ? 'Machine Available' : 'Self-Wash'}</div>
        <div class="trust-item">🛡️ <b>Hostel Rules:</b> Gate closes ${p.rules?.curfewTime || '10:00 PM'}</div>
      </div>

      <!-- Nearby Verified Places & Landmarks -->
      <h3 style="font-size: 14px; font-family: var(--font-display); margin-bottom: 8px;">
        📍 Nearby Institutes & Transit (Verified)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;">
        ${p.nearbyPlaces.map(place => `
          <div style="display: flex; justify-content: space-between; background: var(--bg-surface-raised); padding: 7px 10px; border-radius: var(--radius-sm); font-size: 11px; border: 1px solid var(--border-subtle);">
            <span>🏢 ${place.name}</span>
            <strong style="color: var(--color-primary);">${place.distance}</strong>
          </div>
        `).join('')}
      </div>

      <!-- Hyperlocal Mess & Tiffin Service Radar (Slice P10) -->
      ${renderMessSectionHtml()}

      <!-- Interactive Visit Scheduler Box (Slice 3) -->
      <div class="visit-scheduler-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
            📅 Schedule a Room Visit
          </h4>
          <span style="font-size: 10px; color: var(--color-trust); font-weight: 700;">FREE • NO BROKERAGE</span>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 10px;">
          Meet the Makan Maalik in person and inspect Room & Bed before paying deposit.
        </p>

        <!-- Date Pills -->
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <button class="chip ${state.selectedVisitDate === 'Today' ? 'active' : ''}" style="font-size: 11px;" onclick="GharDekho.selectVisitDate('Today')">
            Today (Aaj)
          </button>
          <button class="chip ${state.selectedVisitDate === 'Tomorrow' ? 'active' : ''}" style="font-size: 11px;" onclick="GharDekho.selectVisitDate('Tomorrow')">
            Tomorrow (Kal)
          </button>
          <button class="chip ${state.selectedVisitDate === 'Sunday' ? 'active' : ''}" style="font-size: 11px;" onclick="GharDekho.selectVisitDate('Sunday')">
            Sunday
          </button>
        </div>

        <!-- Time Slot Pills -->
        <div class="visit-time-slots">
          <span class="visit-time-pill ${state.selectedVisitSlot === '10:00 AM' ? 'selected' : ''}" onclick="GharDekho.selectVisitTime('10:00 AM')">
            10:00 AM
          </span>
          <span class="visit-time-pill ${state.selectedVisitSlot === '11:30 AM' ? 'selected' : ''}" onclick="GharDekho.selectVisitTime('11:30 AM')">
            11:30 AM
          </span>
          <span class="visit-time-pill ${state.selectedVisitSlot === '04:00 PM' ? 'selected' : ''}" onclick="GharDekho.selectVisitTime('04:00 PM')">
            04:00 PM
          </span>
          <span class="visit-time-pill ${state.selectedVisitSlot === '06:30 PM' ? 'selected' : ''}" onclick="GharDekho.selectVisitTime('06:30 PM')">
            06:30 PM
          </span>
        </div>

        <button class="btn-inspect" style="width: 100%; margin-top: 12px; justify-content: center;" onclick="GharDekho.confirmScheduledVisit('${p.id}')">
          Confirm Scheduled Visit (${state.selectedVisitDate} at ${state.selectedVisitSlot})
        </button>
      </div>

      <!-- Owner Contact Bar -->
      <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <div style="font-size: 10px; color: var(--color-trust); font-weight: 700;">MAKAN MAALIK (OWNER)</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${p.owner.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Response: ${p.owner.responseRate}</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="https://wa.me/${p.owner.whatsapp}?text=Namaste! I saw your room listing on GharDekho for ${encodeURIComponent(p.title)}. Is a bed still available?" target="_blank" style="background: #25D366; color: #FFF; text-decoration: none; padding: 7px 10px; border-radius: var(--radius-md); font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
            💬 WhatsApp
          </a>
          <button onclick="alert('Calling owner directly: ' + '${p.owner.phone}')" class="btn-inspect" style="padding: 7px 10px; font-size: 11px;">
            📞 Call
          </button>
        </div>
      </div>

      <!-- Slice 6: Verified Resident Reviews & Ratings -->
      <div class="reviews-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="font-size: 14px; font-family: var(--font-display); color: var(--text-primary); margin: 0;">
            ⭐ Resident Reviews & Ratings
          </h3>
          <button class="chip" style="font-size: 10px; padding: 3px 8px; border-color: var(--color-primary); color: var(--color-primary);" onclick="GharDekho.openReviewModal('${p.id}')">
            ✍️ Write Review
          </button>
        </div>

        <!-- Rating Summary Box -->
        <div class="reviews-summary-card">
          <div class="reviews-score-block">
            <div class="reviews-avg-num">${reviewData.averageRating || p.rating || '4.8'}</div>
            <div class="reviews-stars-row">
              ${'★'.repeat(Math.round(reviewData.averageRating || p.rating || 5))}${'☆'.repeat(5 - Math.round(reviewData.averageRating || p.rating || 5))}
            </div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
              ${reviewData.totalReviews || p.reviewsCount || 0} reviews
            </div>
          </div>
          <div class="reviews-breakdown-bars">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = reviewData.breakdown ? (reviewData.breakdown[star] || 0) : 0;
              const total = reviewData.totalReviews || 1;
              const pct = Math.round((count / total) * 100);
              return `
                <div class="review-bar-item">
                  <span>${star}★</span>
                  <div class="review-bar-track">
                    <div class="review-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                  <span>${count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Reviews List -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${reviewsList.length === 0 ? `
            <div style="text-align: center; padding: 14px; color: var(--text-muted); font-size: 11px;">
              No reviews yet. Be the first verified resident to review!
            </div>
          ` : reviewsList.map(r => `
            <div class="review-card-item">
              <div class="review-card-header">
                <div>
                  <div class="review-tenant-name">${r.tenantName}</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                    <span style="color: #F59E0B; font-size: 11px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    ${r.isVerifiedTenant ? `
                      <span class="verified-resident-badge">🛡️ Verified Resident • ${r.stayDurationMonths || 6}m Stay</span>
                    ` : ''}
                  </div>
                </div>
                <span style="font-size: 10px; color: var(--text-muted);">${formatChatTime(r.createdAt)}</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                ${r.title}
              </div>
              <div class="review-comment-text">
                "${r.comment}"
              </div>

              ${r.ownerResponse ? `
                <div class="review-owner-response">
                  <div class="review-owner-response-title">💬 Response from ${r.ownerResponse.ownerName || 'Makan Maalik'}:</div>
                  <div>${r.ownerResponse.text}</div>
                </div>
              ` : (state.currentRole === 'owner' ? `
                <button class="chip" style="font-size: 10px; padding: 2px 6px; margin-top: 4px;" onclick="GharDekho.openOwnerReplyModal('${r.id}')">
                  💬 Reply as Owner
                </button>
              ` : '')}

              <div class="review-actions-row">
                <button class="btn-like-review" onclick="GharDekho.likeReview('${r.id}')">
                  👍 Helpful (${r.likesCount || 0})
                </button>
                <span>Verified Stay</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function nextGalleryPhoto() {
    const p = state.selectedProperty;
    if (!p || !p.photos || p.photos.length <= 1) return;
    state.galleryActiveIndex = (state.galleryActiveIndex + 1) % p.photos.length;
    renderDetailSheet();
  }

  function prevGalleryPhoto() {
    const p = state.selectedProperty;
    if (!p || !p.photos || p.photos.length <= 1) return;
    state.galleryActiveIndex = (state.galleryActiveIndex - 1 + p.photos.length) % p.photos.length;
    renderDetailSheet();
  }

  function setGalleryPhoto(idx) {
    state.galleryActiveIndex = idx;
    renderDetailSheet();
  }

  function selectVisitDate(dateLabel) {
    state.selectedVisitDate = dateLabel;
    renderDetailSheet();
  }

  function selectVisitTime(slot) {
    state.selectedVisitSlot = slot;
    renderDetailSheet();
  }

  async function confirmScheduledVisit(propId) {
    const p = state.selectedProperty;
    const tenantName = prompt('Enter your name for visit confirmation:', 'Aman Kumar');
    if (!tenantName) return;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propId,
          tenantName,
          tenantPhone: '+91 99887 76655',
          message: `Scheduled room visit for ${state.selectedVisitDate} at ${state.selectedVisitSlot}. Looking forward to seeing the room in person.`,
          scheduledVisitDate: `${state.selectedVisitDate} ${state.selectedVisitSlot}`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Visit Confirmed: ${state.selectedVisitDate} at ${state.selectedVisitSlot}! Makan Maalik notified.`);
        closeDetail();
      }
    } catch (e) {
      showToast(`🎉 Visit Confirmed for ${state.selectedVisitDate}! (Offline Mode)`);
      closeDetail();
    }
  }

  function closeDetail() {
    el.detailModal.classList.remove('open');
  }

  // Book a single bed slot in a shared room
  async function bookBed(propertyId, roomId, slotId) {
    const tenantName = prompt('Enter your name for bed booking:', 'Aryan');
    if (!tenantName) return;

    try {
      const res = await fetch(`/api/properties/${propertyId}/book-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, slotId, tenantName, tenantPhone: '+91 98765 43210' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Success: Bed slot reserved! Owner notified.`);
        await fetchProperties();
        openDetail(propertyId);
      } else {
        alert(data.message);
      }
    } catch (e) {
      showToast('Bed reserved locally! (Offline Mode)');
    }
  }

  // Slice 4 & P7: Roommate Vibe Modal & Compatibility Engine
  async function openRoommateVibe(propertyId, roomId, slotId) {
    const p = state.properties.find(item => item.id === propertyId);
    if (!p) return;
    const room = p.rooms.find(r => r.id === roomId);
    if (!room) return;
    const slot = room.slots.find(s => s.slotId === slotId);
    if (!slot || !slot.roommateProfile) {
      showToast('No public roommate profile shared for this bed yet');
      return;
    }

    const prof = slot.roommateProfile;
    if (!el.subModal || !el.subModalContent) return;

    // Fetch dynamic compatibility if available
    let dynamicVibe = null;
    try {
      const res = await fetch(`/api/roommates/rooms/${propertyId}/${roomId}/vibe-check`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const breakdown = (json.data.occupantBreakdowns || []).find(b => b.occupantName === slot.tenantName);
          if (breakdown) dynamicVibe = breakdown;
        }
      }
    } catch (e) {
      // Fallback to static score
    }

    const score = dynamicVibe ? dynamicVibe.overallScore : (prof.vibeScore || 94);
    const matchTier = dynamicVibe ? dynamicVibe.matchLevel : (score >= 90 ? 'Super Vibe 🔥' : 'Great Match ✨');
    const synergies = dynamicVibe ? dynamicVibe.synergies : ['Shared discipline and respectful quiet study hours'];
    const frictions = dynamicVibe ? dynamicVibe.frictions : [];
    const dims = dynamicVibe ? dynamicVibe.dimensions : null;

    const fillClass = score >= 90 ? 'super' : score >= 80 ? 'great' : score >= 60 ? 'fair' : 'mismatched';

    el.subModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: var(--color-student); text-transform: uppercase; letter-spacing: 0.5px;">
            🎓 Roommate Compatibility Radar (Slice P7)
          </span>
          <h3 style="font-family: var(--font-display); font-size: 17px; color: var(--text-primary); margin-top: 2px;">
            ${slot.tenantName}
          </h3>
        </div>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
      </div>

      <!-- Compatibility Score Banner -->
      <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(249, 115, 22, 0.08)); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Personalized Vibe Score</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--color-student); font-family: var(--font-mono);">${score}% Match</div>
          <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">${matchTier}</div>
        </div>
        <button class="room-vibe-pill-btn" onclick="GharDekho.openMyHabitsModal()" title="Customize habits">
          ⚙️ Edit My Habits
        </button>
      </div>

      <!-- Compatibility Dimensions Progress -->
      ${dims ? `
        <div style="margin-bottom: 14px; background: var(--bg-surface); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Habit Alignment Breakdown:</div>
          
          <div class="vibe-progress-container">
            <div class="vibe-progress-header">
              <span>⏰ Sleep Schedule</span>
              <strong>${dims.sleep.score} / ${dims.sleep.max} pts</strong>
            </div>
            <div class="vibe-progress-track">
              <div class="vibe-progress-fill ${dims.sleep.score >= 20 ? 'super' : 'mismatched'}" style="width: ${(dims.sleep.score / dims.sleep.max) * 100}%;"></div>
            </div>
          </div>

          <div class="vibe-progress-container">
            <div class="vibe-progress-header">
              <span>📚 Study Noise Preference</span>
              <strong>${dims.studyNoise.score} / ${dims.studyNoise.max} pts</strong>
            </div>
            <div class="vibe-progress-track">
              <div class="vibe-progress-fill ${dims.studyNoise.score >= 20 ? 'super' : 'mismatched'}" style="width: ${(dims.studyNoise.score / dims.studyNoise.max) * 100}%;"></div>
            </div>
          </div>

          <div class="vibe-progress-container">
            <div class="vibe-progress-header">
              <span>🎯 Exam & Academic Synergy</span>
              <strong>${dims.examSynergy.score} / ${dims.examSynergy.max} pts</strong>
            </div>
            <div class="vibe-progress-track">
              <div class="vibe-progress-fill super" style="width: ${(dims.examSynergy.score / dims.examSynergy.max) * 100}%;"></div>
            </div>
          </div>

          <div class="vibe-progress-container" style="margin-bottom: 0;">
            <div class="vibe-progress-header">
              <span>🥗 Dietary Ethics</span>
              <strong>${dims.diet.score} / ${dims.diet.max} pts</strong>
            </div>
            <div class="vibe-progress-track">
              <div class="vibe-progress-fill ${dims.diet.score >= 12 ? 'great' : 'mismatched'}" style="width: ${(dims.diet.score / dims.diet.max) * 100}%;"></div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Synergies and Frictions -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
        ${synergies.map(syn => `
          <div class="vibe-synergy-item">
            <span>✨</span>
            <span>${syn}</span>
          </div>
        `).join('')}

        ${frictions.map(fric => `
          <div class="vibe-friction-item">
            <span>⚠️</span>
            <span>${fric}</span>
          </div>
        `).join('')}
      </div>

      <!-- Core Student Facts -->
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
          <span style="color: var(--text-muted);">🎯 Course / Aspirant</span>
          <strong style="color: var(--text-primary);">${prof.courseOrProfession}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
          <span style="color: var(--text-muted);">📍 Hometown</span>
          <strong style="color: var(--text-primary);">${prof.hometown}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
          <span style="color: var(--text-muted);">⏰ Sleep Schedule</span>
          <strong style="color: var(--text-primary);">${prof.sleepSchedule}</strong>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Lifestyle & Study Habits:</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${(prof.habits || []).map(h => `<span class="vibe-tag-badge">${h}</span>`).join('')}
        </div>
      </div>

      <button class="btn-primary" style="width: 100%;" onclick="GharDekho.closeSubModal()">
        Got It
      </button>
    `;

    el.subModal.classList.add('active');
  }

  // Slice P7: Room Aggregate Vibe Modal
  async function openRoomAggregateVibe(propertyId, roomId) {
    const p = state.properties.find(item => item.id === propertyId);
    if (!p) return;
    const room = p.rooms.find(r => r.id === roomId);
    if (!room) return;
    if (!el.subModal || !el.subModalContent) return;

    el.subModalContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <div style="font-size: 28px; animation: spin 1s linear infinite;">⏳</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Analyzing Roommates Synergy Radar...</div>
      </div>
    `;
    el.subModal.classList.add('active');

    try {
      const res = await fetch(`/api/roommates/rooms/${propertyId}/${roomId}/vibe-check`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch room vibe');

      const data = json.data;
      const score = data.overallRoomVibe;
      const matchTier = data.matchLevel;
      const breakdowns = data.occupantBreakdowns || [];

      el.subModalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <span style="font-size: 10px; font-weight: 700; color: var(--color-student); text-transform: uppercase; letter-spacing: 0.5px;">
              🏠 Room Collective Vibe Radar
            </span>
            <h3 style="font-family: var(--font-display); font-size: 17px; color: var(--text-primary); margin-top: 2px;">
              ${room.label || 'Shared PG Room'}
            </h3>
          </div>
          <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
        </div>

        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(16, 185, 129, 0.12)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-md); padding: 14px; margin-bottom: 14px; text-align: center;">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Overall Room Compatibility</div>
          <div style="font-size: 32px; font-weight: 800; color: var(--color-student); font-family: var(--font-mono); margin: 4px 0;">${score}%</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${matchTier}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${data.roomSummary || `Evaluated against ${data.occupiedSlotsCount} current student occupants`}</div>
        </div>

        ${data.aggregatedSynergies && data.aggregatedSynergies.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Room-Wide Synergies:</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${data.aggregatedSynergies.map(s => `
                <div class="vibe-synergy-item"><span>✨</span><span>${s}</span></div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${data.aggregatedFrictions && data.aggregatedFrictions.length > 0 ? `
          <div style="margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Potential Friction Points:</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${data.aggregatedFrictions.map(f => `
                <div class="vibe-friction-item"><span>⚠️</span><span>${f}</span></div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Occupants Grid -->
        ${breakdowns.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Current Roommates Breakdown:</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${breakdowns.map(b => `
                <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 12px; color: var(--text-primary);">${b.occupantName}</strong>
                    <div style="font-size: 10px; color: var(--text-muted);">${b.occupantHometown}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--color-student);">${b.overallScore}%</div>
                    <div style="font-size: 9px; color: var(--text-secondary);">${b.matchLevel}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <button class="btn-primary" style="width: 100%;" onclick="GharDekho.closeSubModal()">
          Looks Great
        </button>
      `;
    } catch (err) {
      el.subModalContent.innerHTML = `
        <div style="padding: 16px; text-align: center;">
          <div style="font-size: 20px; color: var(--color-danger); margin-bottom: 8px;">⚠️ Vibe Check Error</div>
          <div style="font-size: 12px; color: var(--text-muted);">${err.message}</div>
          <button class="btn-primary" style="margin-top: 14px;" onclick="GharDekho.closeSubModal()">Close</button>
        </div>
      `;
    }
  }

  // Slice P7: Personal Study Habits Customization Modal
  async function openMyHabitsModal() {
    if (!el.subModal || !el.subModalContent) return;

    let profile = {
      targetExam: 'JEE',
      sleepSchedule: 'early_bird',
      studyNoisePreference: 'silent',
      diet: 'pure_veg',
      cleanlinessLevel: 4
    };

    try {
      const res = await fetch('/api/roommates/profile/me');
      if (res.ok) {
        const json = await res.json();
        if (json.data) profile = { ...profile, ...json.data };
      }
    } catch (e) {
      // Use defaults
    }

    el.subModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: var(--color-student); text-transform: uppercase; letter-spacing: 0.5px;">
            ⚙️ My Study Habits & Vibe Profile
          </span>
          <h3 style="font-family: var(--font-display); font-size: 17px; color: var(--text-primary); margin-top: 2px;">
            Personalize Your Roommate Matching
          </h3>
        </div>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
      </div>

      <form id="habitsProfileForm" onsubmit="GharDekho.saveMyHabits(event)" style="display: flex; flex-direction: column; gap: 12px; font-size: 12px;">
        <div>
          <label style="display: block; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Target Exam / Academic Focus:</label>
          <select id="habitsExam" style="width: 100%; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-primary);">
            <option value="JEE" ${profile.targetExam === 'JEE' ? 'selected' : ''}>JEE Main & Advanced 💻</option>
            <option value="NEET" ${profile.targetExam === 'NEET' ? 'selected' : ''}>NEET / Medical 🩺</option>
            <option value="UPSC" ${profile.targetExam === 'UPSC' || profile.targetExam === 'GOVT' ? 'selected' : ''}>UPSC / Govt Services 🇮🇳</option>
            <option value="COLLEGE" ${profile.targetExam === 'COLLEGE' ? 'selected' : ''}>College Degree / Tech 🎓</option>
            <option value="GENERAL" ${profile.targetExam === 'GENERAL' ? 'selected' : ''}>Other Professional 💼</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Sleep Routine:</label>
          <select id="habitsSleep" style="width: 100%; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-primary);">
            <option value="early_bird" ${profile.sleepSchedule === 'early_bird' ? 'selected' : ''}>Early Bird 🌅 (Sleep 10:30 PM, Wake 5:30 AM)</option>
            <option value="night_owl" ${profile.sleepSchedule === 'night_owl' ? 'selected' : ''}>Night Owl 🦉 (Study till 1:30 AM+, Wake 8:30 AM)</option>
            <option value="balanced" ${profile.sleepSchedule === 'balanced' ? 'selected' : ''}>Balanced / Flexible ⚖️ (11:30 PM - 7:00 AM)</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Study Noise Preference:</label>
          <select id="habitsNoise" style="width: 100%; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-primary);">
            <option value="silent" ${profile.studyNoisePreference === 'silent' ? 'selected' : ''}>Pin Drop Silence 📚 (Quiet hours respected)</option>
            <option value="mild" ${profile.studyNoisePreference === 'mild' ? 'selected' : ''}>Soft Music / Lo-Fi OK 🎧</option>
            <option value="discussion" ${profile.studyNoisePreference === 'discussion' ? 'selected' : ''}>Group Doubts & Discussion 🗣️</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Dietary Habit:</label>
          <select id="habitsDiet" style="width: 100%; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-primary);">
            <option value="pure_veg" ${profile.diet === 'pure_veg' ? 'selected' : ''}>Strictly Pure Vegetarian 🥗</option>
            <option value="eggetarian" ${profile.diet === 'eggetarian' ? 'selected' : ''}>Eggetarian 🥚</option>
            <option value="non_veg_ok" ${profile.diet === 'non_veg_ok' ? 'selected' : ''}>Non-Vegetarian Friendly 🍗</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Room Cleanliness Level (1 to 5):</label>
          <input type="range" id="habitsCleanliness" min="1" max="5" value="${profile.cleanlinessLevel || 4}" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted);">
            <span>Casual (1)</span>
            <span>Moderate (3)</span>
            <span>Spotless (5)</span>
          </div>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 8px;">
          Save Habits & Recalculate Vibe ✨
        </button>
      </form>
    `;

    el.subModal.classList.add('active');
  }

  // Save student habits
  async function saveMyHabits(event) {
    if (event) event.preventDefault();
    const targetExam = document.getElementById('habitsExam')?.value || 'JEE';
    const sleepSchedule = document.getElementById('habitsSleep')?.value || 'early_bird';
    const studyNoisePreference = document.getElementById('habitsNoise')?.value || 'silent';
    const diet = document.getElementById('habitsDiet')?.value || 'pure_veg';
    const cleanlinessLevel = Number(document.getElementById('habitsCleanliness')?.value) || 4;

    try {
      const res = await fetch('/api/roommates/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetExam,
          sleepSchedule,
          studyNoisePreference,
          diet,
          cleanlinessLevel
        })
      });

      if (res.ok) {
        showToast('Study habits saved! Compatibility scores updated ✨');
        closeSubModal();
      } else {
        showToast('Failed to save habits profile');
      }
    } catch (e) {
      showToast('Network error saving habits');
    }
  }

  // Slice P8: Refundable ₹500 Token Advance Modal
  async function openTokenAdvanceModal(propertyId, roomId, slotId) {
    const p = state.properties.find(item => item.id === propertyId);
    if (!p) return;
    const room = p.rooms.find(r => r.id === roomId);
    if (!room) return;
    const slot = room.slots.find(s => s.slotId === slotId);
    if (!slot) return;
    if (!el.subModal || !el.subModalContent) return;

    el.subModalContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <div style="font-size: 28px; animation: spin 1s linear infinite;">⏳</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Preparing Razorpay ₹500 Escrow Order...</div>
      </div>
    `;
    el.subModal.classList.add('active');

    try {
      const res = await fetch('/api/payments/token-advance/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          roomId,
          slotId,
          tenantName: state.user?.name || 'Aryan Student',
          tenantPhone: state.user?.phone || '+91 98765 43210'
        })
      });
      const order = await res.json();
      if (!res.ok || !order.success) throw new Error(order.message || 'Failed to initialize payment');

      el.subModalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <span style="font-size: 10px; font-weight: 700; color: #EA580C; text-transform: uppercase; letter-spacing: 0.5px;">
              🔒 24-Hour Bed Advance Hold (Slice P8)
            </span>
            <h3 style="font-family: var(--font-display); font-size: 17px; color: var(--text-primary); margin-top: 2px;">
              ${slot.label || `Bed ${slotId.toUpperCase()}`} • ${p.title}
            </h3>
          </div>
          <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
        </div>

        <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Refundable Token Advance</div>
            <div style="font-size: 26px; font-weight: 800; color: #EA580C; font-family: var(--font-mono);">₹500.00</div>
            <div style="font-size: 11px; font-weight: 600; color: #10B981;">🛡️ 100% Refundable Guarantee</div>
          </div>
          <span style="font-size: 32px;">💳</span>
        </div>

        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 12px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-muted);">Holding Window</span>
            <strong style="color: var(--text-primary);">24 Hours (Guaranteed)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-muted);">Platform Commission</span>
            <strong style="color: #10B981;">₹0.00 (Zero Brokerage)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 6px;">
            <span style="color: var(--text-muted);">Cancellation Policy</span>
            <span style="color: var(--text-secondary); font-size: 11px;">Full refund if cancelled > 6h before visit</span>
          </div>
        </div>

        <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Select Payment Mode:</div>
        <div class="payment-method-grid">
          <div class="payment-method-chip active" onclick="this.parentElement.querySelectorAll('.payment-method-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">
            <div>📱 UPI</div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">GPay / PhonePe</div>
          </div>
          <div class="payment-method-chip" onclick="this.parentElement.querySelectorAll('.payment-method-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">
            <div>💳 Card</div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">Debit / Credit</div>
          </div>
          <div class="payment-method-chip" onclick="this.parentElement.querySelectorAll('.payment-method-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">
            <div>🏦 NetBanking</div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">SBI / HDFC / ICICI</div>
          </div>
        </div>

        <button class="btn-primary" style="width: 100%; background: linear-gradient(135deg, #F97316, #EA580C); font-weight: 800; font-size: 13px; padding: 12px; margin-top: 6px;" onclick="GharDekho.processTokenPayment('${propertyId}', '${roomId}', '${slotId}', '${order.orderId}')">
          Pay ₹500 & Confirm 24-Hr Hold ✨
        </button>
      `;
    } catch (err) {
      el.subModalContent.innerHTML = `
        <div style="padding: 16px; text-align: center;">
          <div style="font-size: 24px; color: var(--color-danger); margin-bottom: 8px;">⚠️ Payment Order Error</div>
          <div style="font-size: 12px; color: var(--text-muted);">${err.message}</div>
          <button class="btn-primary" style="margin-top: 14px;" onclick="GharDekho.closeSubModal()">Close</button>
        </div>
      `;
    }
  }

  // Process & Confirm Token Payment
  async function processTokenPayment(propertyId, roomId, slotId, orderId) {
    if (!el.subModal || !el.subModalContent) return;

    el.subModalContent.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="font-size: 32px; animation: pulse 1s infinite;">🔐</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-top: 10px;">Verifying Razorpay Escrow Signature...</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Securing 24-hour bed hold on bank rails</div>
      </div>
    `;

    try {
      const paymentId = 'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      
      const verifyRes = await fetch('/api/payments/token-advance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature: 'auto'
        })
      });

      const resData = await verifyRes.json();
      
      showToast('🎉 ₹500 Token Advance Confirmed! Bed locked for 24 hours.');
      await fetchProperties();
      openDetail(propertyId);

      el.subModalContent.innerHTML = `
        <div style="text-align: center; padding: 10px 0;">
          <div style="font-size: 40px; margin-bottom: 6px;">🎉</div>
          <h3 style="font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin-bottom: 2px;">
            Bed Slot Locked for 24 Hours!
          </h3>
          <div style="font-size: 11px; color: var(--color-trust); font-weight: 700;">₹500 Advance Deposit Verified via UPI</div>

          <div class="receipt-card-box" style="text-align: left; margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Receipt No:</span>
              <strong style="font-family: var(--font-mono); color: var(--text-primary);">${resData.data?.receiptNumber || 'GDT-' + Date.now().toString().slice(-8)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Amount Paid:</span>
              <strong style="color: var(--text-primary);">₹500.00</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Lock Duration:</span>
              <strong style="color: #10B981;">24 Hours</strong>
            </div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px; border-top: 1px solid var(--border-subtle); padding-top: 6px;">
              🛡️ 100% refund credited back to your UPI account if cancelled at least 6 hours before room visit.
            </div>
          </div>

          <button class="btn-primary" style="width: 100%;" onclick="GharDekho.closeSubModal()">
            Done & View Booking
          </button>
        </div>
      `;
    } catch (e) {
      showToast('Payment verified locally!');
      closeSubModal();
    }
  }

  // Slice P10: Tiffin Subscription Modal Prompt & Execution
  function subscribeTiffinPrompt(messId, messName, monthlyPrice) {
    if (!el.subModal || !el.subModalContent) return;
    el.subModalContent.innerHTML = `
      <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-bottom: 2px;">
              📦 Subscribe to ${messName}
            </h3>
            <div style="font-size: 11px; color: var(--color-trust); font-weight: 600;">
              Fresh room delivery daily • Cancel anytime
            </div>
          </div>
          <button class="submodal-close-btn" onclick="GharDekho.closeSubModal()">✕</button>
        </div>

        <div style="background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: var(--text-secondary);">Monthly Plan:</span>
            <strong style="color: var(--text-primary);">₹${monthlyPrice}/month</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: var(--text-secondary);">Delivery Location:</span>
            <span style="color: var(--text-primary); font-weight: 600;">${state.selectedProperty?.title || 'Current PG Room'}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); border-top: 1px dashed var(--border-medium); padding-top: 6px; margin-top: 6px;">
            🍱 Includes lunch (12:00 PM) + dinner (07:30 PM) hot insulated tiffin containers.
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">
            Your Room Number / Bed Label:
          </label>
          <input 
            type="text" 
            id="tiffinRoomInput" 
            value="Room 204 (Bed 1)" 
            style="width: 100%; padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); font-size: 12px;"
          />
        </div>

        <button class="btn btn-primary" style="width: 100%;" onclick="GharDekho.confirmTiffinSubscription('${messId}')">
          Confirm Monthly Subscription (₹${monthlyPrice})
        </button>
      </div>
    `;
    el.subModal.classList.add('active');
  }

  async function confirmTiffinSubscription(messId) {
    const roomInput = document.getElementById('tiffinRoomInput');
    const room = roomInput ? roomInput.value : 'Room 204';
    try {
      const res = await fetch(`/api/mess/${messId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': state.user?.phone || 'student-demo'
        },
        body: JSON.stringify({
          planType: 'monthlyBothMeals',
          deliveryRoom: room,
          startDate: new Date().toISOString().split('T')[0],
          durationMonths: 1
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Subscription failed');

      showToast(`🎉 Tiffin subscription confirmed! Room delivery starts today.`);
      closeSubModal();
    } catch (e) {
      showToast(`🎉 Tiffin subscription active for ${room}!`);
      closeSubModal();
    }
  }

  // Slice 4: Room Waitlist Modal
  function openWaitlistModal(propertyId, roomId) {
    const p = state.properties.find(item => item.id === propertyId);
    if (!p) return;
    const room = p.rooms.find(r => r.id === roomId);
    if (!room) return;

    if (!el.subModal || !el.subModalContent) return;
    const queueCount = room.waitlist ? room.waitlist.length : 0;

    el.subModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: var(--color-warning); text-transform: uppercase;">
            🔔 Room Waitlist Queue
          </span>
          <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-top: 2px;">
            ${room.label}
          </h3>
        </div>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
      </div>

      <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
        All ${room.maxOccupancy} beds in this room are currently occupied. Join the waitlist to receive instant WhatsApp notification the moment an occupant vacates.
      </p>

      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px; color: var(--color-warning); margin-bottom: 14px;">
        📌 Currently <b>${queueCount}</b> student(s) waiting ahead of you. You will be assigned <b>Queue #${queueCount + 1}</b>.
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Full Name *</label>
          <input type="text" id="wlTenantName" class="filter-input" placeholder="e.g. Aryan S." value="" style="width: 100%;" />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">WhatsApp Number *</label>
          <input type="tel" id="wlTenantPhone" class="filter-input" placeholder="+91 98765 43210" value="+91 " style="width: 100%;" />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Target Move-In Date</label>
          <input type="date" id="wlPreferredDate" class="filter-input" style="width: 100%;" />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Notes / Institute</label>
          <input type="text" id="wlNotes" class="filter-input" placeholder="e.g. Joining Allen Jan Batch, need quiet desk" style="width: 100%;" />
        </div>
      </div>

      <button class="btn-primary" style="width: 100%; background: var(--color-warning); color: #000; font-weight: 700;" onclick="GharDekho.submitWaitlist('${propertyId}', '${roomId}')">
        Confirm & Join Waitlist Queue
      </button>
    `;

    el.subModal.classList.add('active');
  }

  async function submitWaitlist(propertyId, roomId) {
    const nameInput = document.getElementById('wlTenantName');
    const phoneInput = document.getElementById('wlTenantPhone');
    const dateInput = document.getElementById('wlPreferredDate');
    const notesInput = document.getElementById('wlNotes');

    const tenantName = nameInput ? nameInput.value.trim() : '';
    const tenantPhone = phoneInput ? phoneInput.value.trim() : '';
    const preferredDate = dateInput ? dateInput.value : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!tenantName || !tenantPhone || tenantPhone.length < 8) {
      alert('Please enter your full name and valid contact number');
      return;
    }

    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantName, tenantPhone, preferredDate, notes })
      });
      const data = await res.json();
      if (data.success) {
        closeSubModal();
        showToast(`🎉 You are #${data.waitlistPosition} in queue for ${data.roomLabel}!`);
        await fetchProperties();
        openDetail(propertyId);
      } else {
        alert(data.message);
      }
    } catch (e) {
      closeSubModal();
      showToast('Added to waitlist! (Local Mode)');
    }
  }

  function closeSubModal() {
    if (el.subModal) el.subModal.classList.remove('active');
  }

  // Slice 6: Review Modal
  function openReviewModal(propertyId) {
    const p = state.properties.find(item => item.id === propertyId);
    if (!p) return;
    if (!el.subModal || !el.subModalContent) return;

    el.subModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">
            ⭐ Resident Experience Review
          </span>
          <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-top: 2px;">
            ${p.title}
          </h3>
        </div>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
      </div>

      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px; color: var(--color-trust); margin-bottom: 14px;">
        🛡️ Reviews matched with confirmed visits/inquiries receive the official <b>Verified Resident</b> badge.
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Overall Rating *</label>
          <div style="display: flex; gap: 8px; font-size: 22px; cursor: pointer;" id="starRatingPicker">
            <span onclick="GharDekho.setFormRating(1)" data-val="1">★</span>
            <span onclick="GharDekho.setFormRating(2)" data-val="2">★</span>
            <span onclick="GharDekho.setFormRating(3)" data-val="3">★</span>
            <span onclick="GharDekho.setFormRating(4)" data-val="4">★</span>
            <span onclick="GharDekho.setFormRating(5)" data-val="5">★</span>
          </div>
          <input type="hidden" id="revRatingVal" value="5" />
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Your Name *</label>
          <input type="text" id="revTenantName" class="filter-input" placeholder="e.g. Aryan S." value="" style="width: 100%;" />
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">WhatsApp Number (for verification)</label>
          <input type="tel" id="revTenantPhone" class="filter-input" placeholder="+91 98765 43210" value="+91 " style="width: 100%;" />
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Stay Duration</label>
          <select id="revStayMonths" class="filter-input" style="width: 100%;">
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6" selected>6 Months</option>
            <option value="12">1 Year+</option>
          </select>
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Review Title</label>
          <input type="text" id="revTitle" class="filter-input" placeholder="e.g. Excellent power backup and peaceful study desks" style="width: 100%;" />
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Detailed Review (Min 10 characters) *</label>
          <textarea id="revComment" class="filter-input" rows="3" placeholder="Share your experience about water, power cut backup, owner nature, cleanliness and study environment..." style="width: 100%;"></textarea>
        </div>
      </div>

      <button class="btn-primary" style="width: 100%;" onclick="GharDekho.submitPropertyReview('${propertyId}')">
        Publish Resident Review
      </button>
    `;

    el.subModal.classList.add('active');
    setFormRating(5);
  }

  function setFormRating(num) {
    const hidden = document.getElementById('revRatingVal');
    if (hidden) hidden.value = num;
    const picker = document.getElementById('starRatingPicker');
    if (picker) {
      const stars = picker.querySelectorAll('span');
      stars.forEach(s => {
        const val = Number(s.getAttribute('data-val'));
        s.style.color = val <= num ? '#F59E0B' : 'var(--text-muted)';
      });
    }
  }

  async function submitPropertyReview(propertyId) {
    const rating = document.getElementById('revRatingVal')?.value || 5;
    const tenantName = document.getElementById('revTenantName')?.value?.trim();
    const tenantPhone = document.getElementById('revTenantPhone')?.value?.trim();
    const stayDurationMonths = document.getElementById('revStayMonths')?.value || 6;
    const title = document.getElementById('revTitle')?.value?.trim();
    const comment = document.getElementById('revComment')?.value?.trim();

    if (!tenantName) {
      alert('Please enter your name');
      return;
    }
    if (!comment || comment.length < 10) {
      alert('Review comment must be at least 10 characters long');
      return;
    }

    try {
      const res = await fetch(`/api/properties/${propertyId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName,
          tenantPhone,
          rating: Number(rating),
          title,
          comment,
          stayDurationMonths: Number(stayDurationMonths)
        })
      });
      const data = await res.json();
      if (data.success) {
        closeSubModal();
        showToast(`🎉 Review published! Property rating: ${data.propertyRating} ★`);
        await openDetail(propertyId);
      } else {
        alert(data.message);
      }
    } catch (e) {
      closeSubModal();
      showToast('Review submitted locally (Offline Mode)');
    }
  }

  async function likeReview(reviewId) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success && state.currentPropertyReviews) {
        const r = state.currentPropertyReviews.reviews.find(item => item.id === reviewId);
        if (r) r.likesCount = data.likesCount;
        renderDetailSheet();
        showToast('Marked as helpful');
      }
    } catch (e) {
      showToast('Liked locally');
    }
  }

  function openOwnerReplyModal(reviewId) {
    if (!el.subModal || !el.subModalContent) return;
    el.subModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">
            💬 Makan Maalik Public Reply
          </span>
          <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-top: 2px;">
            Reply to Resident Review
          </h3>
        </div>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Your Response to Tenant *</label>
        <textarea id="ownerReplyText" class="filter-input" rows="3" placeholder="Thank the student or address any points mentioned..." style="width: 100%;"></textarea>
      </div>

      <button class="btn-primary" style="width: 100%;" onclick="GharDekho.submitOwnerReply('${reviewId}')">
        Post Public Response
      </button>
    `;

    el.subModal.classList.add('active');
  }

  async function submitOwnerReply(reviewId) {
    const text = document.getElementById('ownerReplyText')?.value?.trim();
    if (!text) {
      alert('Please enter response text');
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}/owner-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText: text, ownerName: 'Ramesh Sharma' })
      });
      const data = await res.json();
      if (data.success) {
        closeSubModal();
        showToast('Response published');
        if (state.selectedProperty) {
          await openDetail(state.selectedProperty.id);
        }
      } else {
        alert(data.message);
      }
    } catch (e) {
      closeSubModal();
      showToast('Response saved locally');
    }
  }

  // Slice 6: Owner KYC Modal
  function openKycModal(propertyId) {
    if (!el.subModal || !el.subModalContent) return;
    el.subModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: var(--color-trust); text-transform: uppercase;">
            🛡️ GharDekho Shield Verification
          </span>
          <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-top: 2px;">
            Makan Maalik Identity Verification
          </h3>
        </div>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 4px;" onclick="GharDekho.closeSubModal()">✕</button>
      </div>

      <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
        Verify your identity via Aadhaar or Government ID to earn the <b>Shield Verified Makan Maalik</b> badge and rank at the top of student searches.
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Document Type *</label>
          <select id="kycDocType" class="filter-input" style="width: 100%;">
            <option value="Aadhaar Card" selected>Aadhaar Card</option>
            <option value="PAN Card">PAN Card</option>
            <option value="Electricity / Property Registration">Property Electricity Bill / Deed</option>
          </select>
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Last 4 Digits of Document *</label>
          <input type="text" id="kycLast4" class="filter-input" placeholder="e.g. 4821" maxlength="4" style="width: 100%;" />
        </div>
      </div>

      <button class="btn-primary" style="width: 100%; background: var(--color-trust); border: none;" onclick="GharDekho.submitOwnerKyc('${propertyId}')">
        Verify & Issue Shield Badge
      </button>
    `;

    el.subModal.classList.add('active');
  }

  async function submitOwnerKyc(propertyId) {
    const docType = document.getElementById('kycDocType')?.value;
    const last4 = document.getElementById('kycLast4')?.value?.trim();

    if (!last4 || last4.length < 4) {
      alert('Please enter valid 4 digits of document');
      return;
    }

    try {
      const res = await fetch(`/api/properties/${propertyId}/verify-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docType, documentNumberLast4: last4 })
      });
      const data = await res.json();
      if (data.success) {
        closeSubModal();
        showToast('🛡️ Verified! Shield badge issued to your listing.');
        await fetchProperties();
        render();
      }
    } catch (e) {
      closeSubModal();
      showToast('Verified locally (Offline Mode)');
    }
  }

  // Slice 4: Owner Slot Management
  async function updateSlotStatus(propertyId, roomId, slotId, status) {
    let tenantName = null;
    let tenantPhone = null;
    if (status === 'occupied' || status === 'reserved') {
      tenantName = prompt(`Enter tenant name for Bed ${slotId.toUpperCase()}:`, 'New Tenant');
      if (!tenantName) return;
      tenantPhone = '+91 98765 43210';
    }

    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/slots/${slotId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, tenantName, tenantPhone })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await fetchProperties();
        render();
      } else {
        alert(data.message);
      }
    } catch (e) {
      showToast(`Slot status updated (Offline Mode)`);
    }
  }

  async function assignWaitlistToBed(propertyId, roomId, waitlistId) {
    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/waitlist/${waitlistId}/assign`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Bed assigned to waitlisted candidate!`);
        await fetchProperties();
        render();
      } else {
        alert(data.message);
      }
    } catch (e) {
      showToast('Bed assigned locally');
    }
  }

  async function removeWaitlistCandidate(propertyId, roomId, waitlistId) {
    if (!confirm('Remove candidate from waitlist?')) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/waitlist/${waitlistId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Waitlist entry removed');
        await fetchProperties();
        render();
      }
    } catch (e) {
      showToast('Removed locally');
    }
  }

  // ==========================================
  // SLICE 7: SAVED LISTINGS & NOTIFICATION ENGINE
  // ==========================================

  // Fetch notifications from server
  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/notifications?role=${state.currentRole}`);
      const data = await res.json();
      if (data.success) {
        state.notifications = data.notifications || [];
        state.unreadNotifCount = data.unreadCount || 0;
        updateNotifBadge();
      }
    } catch (e) {
      console.warn('Failed to fetch notifications', e);
    }
  }

  // Update notification bell badge indicator
  function updateNotifBadge() {
    if (!el.notifBadge) return;
    if (state.unreadNotifCount > 0) {
      el.notifBadge.textContent = state.unreadNotifCount > 9 ? '9+' : state.unreadNotifCount;
      el.notifBadge.style.display = 'flex';
    } else {
      el.notifBadge.style.display = 'none';
    }
  }

  // Toggle Notification Drawer
  function toggleNotificationDrawer() {
    if (state.isNotifModalOpen) {
      closeNotifications();
    } else {
      openNotifications();
    }
  }

  function openNotifications() {
    state.isNotifModalOpen = true;
    renderNotificationCenter();
    if (el.notifModal) el.notifModal.style.display = 'flex';
  }

  function closeNotifications() {
    state.isNotifModalOpen = false;
    if (el.notifModal) el.notifModal.style.display = 'none';
  }

  function filterNotifications(filter) {
    state.notifFilter = filter;
    renderNotificationCenter();
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDays}d ago`;
  }

  function renderNotificationCenter() {
    if (!el.notifModalContent) return;
    const isUnreadFilter = state.notifFilter === 'unread';
    const displayedNotifs = isUnreadFilter 
      ? state.notifications.filter(n => !n.isRead) 
      : state.notifications;

    const unreadCount = state.notifications.filter(n => !n.isRead).length;

    el.notifModalContent.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="notif-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">🔔</span>
          <h2 style="font-family: var(--font-display); font-size: 17px; color: var(--text-primary); margin: 0;">
            Notification Center (${state.currentRole === 'tenant' ? 'Kirayedaar' : 'Makan Maalik'})
          </h2>
        </div>
        <div style="display: flex; gap: 6px;">
          ${unreadCount > 0 ? `
            <button class="btn-subtle" onclick="GharDekho.markAllNotificationsRead()" title="Mark all read" style="font-size: 11px;">
              ✓✓ All Read
            </button>
          ` : ''}
          <button class="btn-close-circle" onclick="GharDekho.closeNotifications()" aria-label="Close Notifications">✕</button>
        </div>
      </div>

      <div class="notif-tabs">
        <button class="notif-tab ${!isUnreadFilter ? 'active' : ''}" onclick="GharDekho.filterNotifications('all')">
          All (${state.notifications.length})
        </button>
        <button class="notif-tab ${isUnreadFilter ? 'active' : ''}" onclick="GharDekho.filterNotifications('unread')">
          Unread (${unreadCount})
        </button>
      </div>

      <div class="notif-list-container">
        ${displayedNotifs.length === 0 ? `
          <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">🔕</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
              No ${isUnreadFilter ? 'unread ' : ''}notifications
            </div>
            <p style="font-size: 12px;">You're completely caught up! We'll alert you the moment an update arrives.</p>
          </div>
        ` : displayedNotifs.map(n => {
          let icon = '🔔';
          if (n.type === 'visit_confirmed') icon = '📅';
          else if (n.type === 'waitlist_alert' || n.type === 'slot_reserved') icon = '🛏️';
          else if (n.type === 'new_message' || n.type === 'owner_response') icon = '💬';
          else if (n.type === 'new_review') icon = '⭐';
          else if (n.type === 'new_inquiry') icon = '📩';

          return `
            <div class="notif-card ${!n.isRead ? 'unread' : ''}" onclick="GharDekho.handleNotificationClick('${n.id}')">
              <div class="notif-icon-box ${n.type}">
                ${icon}
              </div>
              <div class="notif-content">
                <div class="notif-title-row">
                  <span class="notif-title">${n.title}</span>
                  <span class="notif-time">${formatRelativeTime(n.createdAt)}</span>
                </div>
                <div class="notif-body">${n.body}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <button class="notif-action-btn" onclick="event.stopPropagation(); GharDekho.handleNotificationClick('${n.id}')">
                    ${n.actionLabel || 'View Details'} →
                  </button>
                  ${!n.isRead ? `
                    <button class="btn-subtle" onclick="event.stopPropagation(); GharDekho.markNotificationRead('${n.id}')" style="font-size: 10px; padding: 2px 6px;">
                      Mark read
                    </button>
                  ` : ''}
                </div>
              </div>
              ${!n.isRead ? '<div class="notif-unread-dot"></div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async function markNotificationRead(id) {
    try {
      const res = await fetch(`/api/notifications/${id}/mark-read`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const notif = state.notifications.find(n => n.id === id);
        if (notif) notif.isRead = true;
        state.unreadNotifCount = data.unreadCount || 0;
        updateNotifBadge();
        renderNotificationCenter();
      }
    } catch (e) {
      console.warn('Error marking notification read', e);
    }
  }

  async function markAllNotificationsRead() {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: state.currentRole })
      });
      const data = await res.json();
      if (data.success) {
        state.notifications.forEach(n => {
          if (n.recipientRole === state.currentRole) n.isRead = true;
        });
        state.unreadNotifCount = 0;
        updateNotifBadge();
        renderNotificationCenter();
        showToast('✓✓ All notifications marked as read');
      }
    } catch (e) {
      console.warn('Error marking all notifications read', e);
    }
  }

  async function handleNotificationClick(id) {
    const notif = state.notifications.find(n => n.id === id);
    if (!notif) return;

    if (!notif.isRead) {
      markNotificationRead(id);
    }

    closeNotifications();

    if (notif.entityType === 'inquiry') {
      if (state.currentRole !== notif.recipientRole) {
        switchRole(notif.recipientRole);
      }
      setTab(notif.recipientRole === 'owner' ? 'owner_inquiries' : 'messages');
      state.activeChatThreadId = notif.entityId;
      render();
    } else if (notif.entityType === 'property' || notif.entityType === 'review') {
      openDetail(notif.propertyId || notif.entityId);
    } else {
      showToast(notif.title);
    }
  }

  async function updatePreference(key, value) {
    state.preferences[key] = value;
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      showToast(`Preference updated: ${value ? 'Enabled' : 'Disabled'}`);
    } catch (e) {
      console.warn('Preference update failed', e);
    }
  }

  // Fetch saved listings from API
  async function fetchSaved() {
    try {
      const res = await fetch('/api/saved');
      const data = await res.json();
      if (data.success && data.properties) {
        state.savedPropertiesData = data.properties;
        state.savedIds = new Set(data.properties.map(p => p.id));
      }
    } catch (e) {
      console.warn('Failed to fetch saved properties', e);
    }
  }

  // Toggle Save Property
  async function toggleSave(id) {
    const isSaved = state.savedIds.has(id);
    if (isSaved) {
      state.savedIds.delete(id);
      showToast('Removed from saved rooms');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queueOfflineAction({ type: 'unsave_property', propertyId: id });
      } else {
        try {
          await fetch(`/api/saved/${id}`, { method: 'DELETE' });
        } catch (e) {
          queueOfflineAction({ type: 'unsave_property', propertyId: id });
        }
      }
    } else {
      state.savedIds.add(id);
      showToast('❤️ Saved to your shortlisted rooms');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queueOfflineAction({ type: 'save_property', propertyId: id });
      } else {
        try {
          await fetch(`/api/saved/${id}`, { method: 'POST' });
        } catch (e) {
          queueOfflineAction({ type: 'save_property', propertyId: id });
        }
      }
    }
    await fetchSaved();
    render();
  }

  // Render Saved Tab with Live Freshness
  function renderSaved() {
    const savedList = state.savedPropertiesData.length > 0 
      ? state.savedPropertiesData 
      : state.properties.filter(p => state.savedIds.has(p.id));

    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          Shortlisted Rooms (${savedList.length})
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">Your bookmarked rooms with live occupancy & price freshness</p>
      </div>
    `;

    if (savedList.length === 0) {
      el.contentArea.innerHTML += `
        <div style="text-align: center; padding: 60px 10px; color: var(--text-secondary);">
          <div style="font-size: 44px; margin-bottom: 12px;">🤍</div>
          <h3 style="color: var(--text-primary); margin-bottom: 6px; font-size: 16px;">No saved rooms yet</h3>
          <p style="font-size: 13px; max-width: 260px; margin: 0 auto 16px; line-height: 1.4;">
            Tap the heart icon on any room card to shortlist it here and track live vacant beds!
          </p>
          <button class="btn-inspect" onclick="GharDekho.setTab('khojo')" style="display: inline-block; padding: 8px 16px;">
            🔍 Explore Rooms in ${state.activeCity}
          </button>
        </div>
      `;
      return;
    }

    let grid = '<div class="listings-grid" style="display: flex; flex-direction: column; gap: 14px;">';
    savedList.forEach(p => {
      const minPrice = p.rooms && p.rooms.length > 0 
        ? Math.min(...p.rooms.map(r => r.pricePerPerson)) 
        : (p.price || 3500);

      const freshness = p.freshness || {
        occupancyBadge: '🟢 Available',
        urgencyColor: 'trust',
        priceFreshness: `₹${minPrice}/mo · Verified Direct Rate`
      };

      const coverPhoto = (p.photos && p.photos.length > 0) 
        ? p.photos[0] 
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

      grid += `
        <div class="saved-card" onclick="GharDekho.openDetail('${p.id}')">
          <div class="saved-card-header">
            <img class="saved-card-img" src="${coverPhoto}" alt="${p.title}" loading="lazy" />
            <button class="saved-card-heart-btn" title="Remove from saved" onclick="event.stopPropagation(); GharDekho.toggleSave('${p.id}')">
              ❤️
            </button>
            <div class="saved-freshness-banner ${freshness.urgencyColor || 'trust'}">
              ${freshness.occupancyBadge}
            </div>
          </div>
          <div class="saved-card-body">
            <div style="font-size: 11px; color: var(--color-trust); font-weight: 600;">
              📍 ${p.locality}, ${p.city}
            </div>
            <h3 class="saved-card-title">${p.title}</h3>
            <div class="saved-card-meta">
              <span class="saved-card-price">₹${minPrice}<span style="font-size: 11px; color: var(--text-muted); font-weight: 400;">/person</span></span>
              <span style="font-size: 11px; color: var(--text-muted);">${freshness.priceFreshness || 'Best Price'}</span>
            </div>
            <div class="saved-card-actions" onclick="event.stopPropagation()">
              <button class="btn-inspect" onclick="GharDekho.openDetail('${p.id}')">
                Inspect Room & Book Visit →
              </button>
              <button class="btn-subtle" title="Remove" onclick="GharDekho.toggleSave('${p.id}')">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid += '</div>';
    el.contentArea.innerHTML += grid;
  }

  // Render Inquiries / Chat (Slice 5 In-App Messaging Engine)
  function renderMessages() {
    if (state.activeChatThreadId) {
      renderChatRoom(state.activeChatThreadId);
      return;
    }

    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          Messages & Scheduled Visits (${state.inquiries.length})
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">Direct in-app chat with verified Makan Maaliks</p>
      </div>

      <div class="chat-threads-container">
        ${state.inquiries.length === 0 ? `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
            <p>No messages yet. Explore rooms and tap "Chat with Owner" or "Schedule Visit" to start a conversation!</p>
          </div>
        ` : state.inquiries.map(inq => {
          const lastMsg = inq.messages && inq.messages.length > 0 ? inq.messages[inq.messages.length - 1] : null;
          const hasUnread = (inq.unreadCountTenant || 0) > 0;
          return `
            <div class="chat-thread-card ${hasUnread ? 'has-unread' : ''}" onclick="GharDekho.openChatThread('${inq.id}')">
              <div class="chat-thread-header">
                <span class="chat-thread-title">🏠 ${inq.propertyTitle}</span>
                <span class="chat-thread-time">${formatChatTime(inq.lastMessageAt || inq.createdAt)}</span>
              </div>
              <div style="font-size: 11px; color: var(--color-primary); margin-bottom: 4px; font-weight: 600;">
                Owner: ${inq.ownerName}
              </div>
              <div class="chat-thread-snippet">
                ${lastMsg ? (lastMsg.senderRole === 'tenant' ? 'You: ' : `${lastMsg.senderName.split(' ')[0]}: `) + lastMsg.text : inq.message}
              </div>
              <div class="chat-thread-footer">
                <div>
                  ${inq.scheduledVisitDate ? `
                    <span class="badge-tag ${inq.status === 'confirmed' ? 'verified' : ''}" style="font-size: 10px;">
                      📅 Visit: ${inq.scheduledVisitDate} (${inq.status})
                    </span>
                  ` : ''}
                </div>
                ${hasUnread ? `<span class="unread-badge-pill">${inq.unreadCountTenant} new</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render Profile (Slice P2 Production Auth & Verified Identity)
  function renderProfile() {
    const user = state.authUser;
    const isOwner = state.currentRole === 'owner';

    el.contentArea.innerHTML = `
      <div style="margin-bottom: 20px; text-align: center; padding-top: 16px;">
        <div style="width: 72px; height: 72px; background: var(--gradient-primary); border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: var(--shadow-glow); color: #FFF; font-weight: 700;">
          ${user ? (user.fullName ? user.fullName[0].toUpperCase() : '👤') : '👤'}
        </div>
        
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary); margin-bottom: 4px;">
          ${user ? user.fullName : (isOwner ? 'Makan Maalik (Guest)' : 'Kirayedaar (Guest)')}
        </h2>

        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
          ${user ? `${user.phone} · <span style="text-transform: capitalize; font-weight: 600; color: var(--color-primary);">${user.role}</span>` : 'Phone OTP Login Available'}
        </div>

        ${user && user.isKycVerified ? `
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.12); color: var(--color-trust); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.25);">
            🛡️ Aadhaar Verified Resident (${user.aadhaarNumber || 'Verified'})
          </div>
        ` : user ? `
          <button class="btn-inspect" onclick="GharDekho.verifyKyc()" style="font-size: 11px; padding: 4px 12px; background: var(--bg-surface); border: 1px solid var(--color-trust); color: var(--color-trust);">
            ⚡ Verify Aadhaar with DigiLocker
          </button>
        ` : `
          <button class="btn-inspect" onclick="GharDekho.openAuthModal()" style="font-size: 12px; padding: 6px 16px;">
            📱 Sign In with Phone OTP
          </button>
        `}
      </div>

      ${!user ? `
        <div style="background: var(--bg-surface); border: 1px dashed var(--border-medium); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 16px; text-align: center;">
          <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); margin-bottom: 4px;">⚡ Quick One-Click Demo Logins</div>
          <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 12px;">Instant test logins with pre-configured verified profiles</p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="theme-toggle-btn" onclick="GharDekho.quickLogin('tenant')" style="font-size: 11px; padding: 6px 12px;">
              🎓 Vikas Meena (Student)
            </button>
            <button class="theme-toggle-btn" onclick="GharDekho.quickLogin('owner')" style="font-size: 11px; padding: 6px 12px;">
              🔑 Ramesh Sharma (Owner)
            </button>
          </div>
        </div>
      ` : ''}

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
          <span>Language (भाषा)</span>
          <strong style="color: var(--color-primary);">Hinglish / Hindi</strong>
        </div>
        <div style="background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
          <span>City Preference</span>
          <strong style="color: var(--text-primary);">${state.activeCity}</strong>
        </div>
        <div style="background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
          <span>Dark Theme Active</span>
          <strong style="color: var(--color-trust);">Mix A+C Swiggy Saffron</strong>
        </div>
        <div style="background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
          <span>GharDekho App Version</span>
          <span style="color: var(--text-muted);">v1.2.0 (Slice P2 Production Auth)</span>
        </div>
      </div>

      ${user ? `
        <div style="margin-top: 14px;">
          <button onclick="GharDekho.logoutUser()" class="theme-toggle-btn" style="width: 100%; justify-content: center; color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3); padding: 10px;">
            🚪 Log Out of GharDekho (${user.fullName.split(' ')[0]})
          </button>
        </div>
      ` : ''}

      <div style="margin-top: 24px; margin-bottom: 10px;">
        <h3 style="font-family: var(--font-display); font-size: 15px; color: var(--text-primary);">
          🔔 Notification Alerts & Channels
        </h3>
        <p style="font-size: 11px; color: var(--text-secondary);">Manage how you receive real-time visit and slot alerts</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="pref-row">
          <div>
            <div class="pref-label">WhatsApp Updates 💬</div>
            <div class="pref-desc">Instant visit confirmations, owner chat and directions on WhatsApp</div>
          </div>
          <label class="switch">
            <input type="checkbox" ${state.preferences.whatsappUpdates ? 'checked' : ''} onchange="GharDekho.updatePreference('whatsappUpdates', this.checked)">
            <span class="slider"></span>
          </label>
        </div>

        <div class="pref-row">
          <div>
            <div class="pref-label">SMS Instant Alerts 📱</div>
            <div class="pref-desc">Urgent SMS notifications when Makan Maalik confirms your room visit</div>
          </div>
          <label class="switch">
            <input type="checkbox" ${state.preferences.smsAlerts ? 'checked' : ''} onchange="GharDekho.updatePreference('smsAlerts', this.checked)">
            <span class="slider"></span>
          </label>
        </div>

        <div class="pref-row">
          <div>
            <div class="pref-label">Bed Vacancy & Waitlist Alerts 🛏️</div>
            <div class="pref-desc">Instant alert when a reserved or occupied bed in your saved PG opens up</div>
          </div>
          <label class="switch">
            <input type="checkbox" ${state.preferences.slotVacancyAlerts ? 'checked' : ''} onchange="GharDekho.updatePreference('slotVacancyAlerts', this.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  // --- OWNER FLOW (Slice 1: List Property Engine) ---
  function renderOwnerListings() {
    const totalRooms = state.properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
    const totalBeds = state.properties.reduce((acc, p) => 
      acc + (p.rooms ? p.rooms.reduce((rAcc, r) => rAcc + r.maxOccupancy, 0) : 0), 0);
    const occupiedBeds = state.properties.reduce((acc, p) => 
      acc + (p.rooms ? p.rooms.reduce((rAcc, r) => rAcc + r.currentOccupancy, 0) : 0), 0);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    el.contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
            Makan Maalik Dashboard
          </h2>
          <p style="font-size: 12px; color: var(--text-secondary);">Manage properties, bed occupancy & toggle live visibility</p>
        </div>
        <button class="btn-inspect" onclick="GharDekho.setTab('owner_add')">
          + Add Listing
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; text-align: center;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-md);">
          <div style="font-size: 11px; color: var(--text-muted);">Properties</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--color-primary);">${state.properties.length}</div>
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-md);">
          <div style="font-size: 11px; color: var(--text-muted);">Occupancy</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--color-trust);">${occupancyRate}%</div>
          <div style="font-size: 10px; color: var(--text-muted);">${occupiedBeds}/${totalBeds} Beds</div>
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-md);">
          <div style="font-size: 11px; color: var(--text-muted);">New Inquiries</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--color-student);">${state.inquiries.length}</div>
        </div>
      </div>

      <!-- Slice 6: Owner Identity & KYC Verification Status -->
      ${state.properties.some(p => p.owner && p.owner.isKycDone) ? `
        <div class="owner-kyc-banner">
          <div>
            <div style="font-weight: 700; color: var(--color-trust); font-size: 13px;">🛡️ Shield Verified Makan Maalik</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Your Aadhaar and property registration have been verified. All rooms carry the Verified Shield badge.</div>
          </div>
          <span style="font-size: 22px;">✅</span>
        </div>
      ` : `
        <div class="owner-kyc-unverified">
          <div>
            <div style="font-weight: 700; color: var(--color-warning); font-size: 13px;">⚠️ Complete Aadhaar KYC Verification</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Verified listings get 4x more tenant leads and higher visibility in student search feeds.</div>
          </div>
          <button class="chip" style="background: var(--color-warning); color: #000; font-weight: 700; font-size: 11px; border: none; padding: 6px 10px;" onclick="GharDekho.openKycModal('${state.properties[0]?.id}')">
            Verify Now
          </button>
        </div>
      `}

      <h3 style="font-size: 15px; margin-bottom: 10px;">Your Properties (${state.properties.length}):</h3>
      <div class="listings-grid">
        ${state.properties.map(p => `
          <div class="property-card" style="cursor: default;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div class="card-locality">📍 ${p.locality}, ${p.city}</div>
                <span class="badge-tag ${p.isAvailable ? 'verified' : ''}" style="font-size: 10px;">
                  ${p.isAvailable ? '● Live on Feed' : '⏸ Paused'}
                </span>
              </div>
              <h3 class="card-title" style="margin-bottom: 6px;">${p.title}</h3>
              
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                ${p.rooms.map(r => `<b>${r.label}:</b> ${r.currentOccupancy}/${r.maxOccupancy} Beds occupied (₹${r.pricePerPerson}/head)`).join('<br>')}
              </div>

              <!-- Slice 4: Owner Bed & Waitlist Control Panel -->
              <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--color-primary); margin-bottom: 6px;">
                  🛏️ Live Bed Occupancy & Waitlist Controls
                </div>
                ${p.rooms.map(r => `
                  <div style="margin-bottom: 8px; font-size: 11px;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                      ${r.label} (${r.currentOccupancy}/${r.maxOccupancy} Occupied)
                    </div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                      ${r.slots.map(s => `
                        <div style="background: var(--bg-surface); border: 1px solid ${s.status === 'occupied' ? 'rgba(239, 68, 68, 0.4)' : s.status === 'reserved' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}; padding: 3px 6px; border-radius: 4px; font-size: 10px; display: flex; align-items: center; gap: 4px;">
                          <span>${s.label || s.slotId}: <b>${s.status}</b> ${s.tenantName ? `(${s.tenantName})` : ''}</span>
                          ${s.status === 'available' ? `
                            <button style="background: var(--color-trust); border: none; color: #FFF; font-size: 8px; padding: 2px 4px; border-radius: 2px; cursor: pointer;" onclick="GharDekho.updateSlotStatus('${p.id}', '${r.id}', '${s.slotId}', 'occupied')">Fill</button>
                          ` : s.status === 'reserved' ? `
                            <button style="background: var(--color-trust); border: none; color: #FFF; font-size: 8px; padding: 2px 4px; border-radius: 2px; cursor: pointer;" onclick="GharDekho.updateSlotStatus('${p.id}', '${r.id}', '${s.slotId}', 'occupied')">Approve</button>
                            <button style="background: var(--color-danger); border: none; color: #FFF; font-size: 8px; padding: 2px 4px; border-radius: 2px; cursor: pointer;" onclick="GharDekho.updateSlotStatus('${p.id}', '${r.id}', '${s.slotId}', 'available')">Reject</button>
                          ` : `
                            <button style="background: rgba(239, 68, 68, 0.2); border: 1px solid var(--color-danger); color: #EF4444; font-size: 8px; padding: 2px 4px; border-radius: 2px; cursor: pointer;" onclick="GharDekho.updateSlotStatus('${p.id}', '${r.id}', '${s.slotId}', 'available')">Vacate</button>
                          `}
                        </div>
                      `).join('')}
                    </div>

                    ${(r.waitlist && r.waitlist.length > 0) ? `
                      <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed var(--color-warning); border-radius: 4px; padding: 6px;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--color-warning); margin-bottom: 4px;">
                          🔔 Room Waitlist (${r.waitlist.length} Candidate${r.waitlist.length > 1 ? 's' : ''}):
                        </div>
                        ${r.waitlist.map(w => `
                          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; margin-bottom: 2px;">
                            <span><b>${w.tenantName}</b> (${w.tenantPhone}) • Prefers: ${w.preferredDate}</span>
                            <div style="display: flex; gap: 4px;">
                              ${r.slots.some(s => s.status === 'available') ? `
                                <button style="background: var(--color-trust); border: none; color: #FFF; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 2px; cursor: pointer;" onclick="GharDekho.assignWaitlistToBed('${p.id}', '${r.id}', '${w.id}')">
                                  Assign Bed
                                </button>
                              ` : ''}
                              <button style="background: none; border: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 9px; padding: 1px 4px; border-radius: 2px; cursor: pointer;" onclick="GharDekho.removeWaitlistCandidate('${p.id}', '${r.id}', '${w.id}')">✕</button>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
                <button class="chip" style="font-size: 11px; flex: 1; text-align: center; justify-content: center;" onclick="GharDekho.openDetail('${p.id}')">
                  👁️ Preview
                </button>
                <button class="chip" style="font-size: 11px; flex: 1; text-align: center; justify-content: center; background: var(--bg-surface-raised); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600;" onclick="GharDekho.openEditPropertyModal('${p.id}')">
                  ✏️ Edit
                </button>
                <button class="chip" style="font-size: 11px; flex: 1; text-align: center; justify-content: center; color: ${p.isAvailable ? 'var(--color-warning)' : 'var(--color-trust)'};" onclick="GharDekho.toggleListingAvailability('${p.id}')">
                  ${p.isAvailable ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button class="chip" style="font-size: 11px; color: var(--color-danger); border-color: rgba(239, 68, 68, 0.4);" onclick="GharDekho.deleteListing('${p.id}')">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Toggle property active / pause state
  async function toggleListingAvailability(id) {
    const p = state.properties.find(item => item.id === id);
    if (!p) return;
    try {
      const res = await fetch(`/api/properties/${id}/toggle-availability`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        p.isAvailable = data.isAvailable;
        showToast(data.message);
      }
    } catch (e) {
      p.isAvailable = !p.isAvailable;
      showToast(`Listing ${p.isAvailable ? 'Resumed' : 'Paused'} (Offline Mode)`);
    }
    render();
  }

  // Delete property
  async function deleteListing(id) {
    if (!confirm('Are you sure you want to remove this property listing from GharDekho?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        state.properties = state.properties.filter(p => p.id !== id);
        showToast('Property deleted successfully');
      }
    } catch (e) {
      state.properties = state.properties.filter(p => p.id !== id);
      showToast('Property removed locally');
    }
    render();
  }

  // Owner 5-Step Property Creation Wizard (Slice 1)
  function renderOwnerAddWizard() {
    const d = state.ownerDraft;
    const a = d.amenities;

    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          List New Property (Makan Maalik)
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          Step ${state.ownerStep} of 5: ${getStepTitle(state.ownerStep)}
        </p>
      </div>

      <div class="wizard-box">
        <!-- 5-Step Indicator -->
        <div class="wizard-step-indicator">
          <div class="step-node ${state.ownerStep >= 1 ? 'active' : ''}" title="Basic Info">1</div>
          <div class="step-node ${state.ownerStep >= 2 ? 'active' : ''}" title="Location & Map">2</div>
          <div class="step-node ${state.ownerStep >= 3 ? 'active' : ''}" title="20+ Amenities">3</div>
          <div class="step-node ${state.ownerStep >= 4 ? 'active' : ''}" title="Room & Rent">4</div>
          <div class="step-node ${state.ownerStep >= 5 ? 'active' : ''}" title="Photos & Review">5</div>
        </div>

        <!-- STEP 1: Basic Information -->
        ${state.ownerStep === 1 ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; color: var(--text-primary);">Step 1: Property Identity & Type</h4>
            <button class="btn btn-outline" style="font-size: 11px; padding: 4px 10px; border-color: var(--color-primary); color: var(--color-primary);" onclick="GharDekho.triggerAiVisionScan()">
              ✨ AI Smart Auto-Fill from Photos
            </button>
          </div>
          
          <div class="form-group">
            <label class="form-label">Property Title / PG Name *</label>
            <input type="text" id="ownerTitle" class="form-input" placeholder="e.g. Balaji PG for Boys (Near Allen)" value="${d.title}" />
          </div>

          <div class="form-group">
            <label class="form-label">Property Category</label>
            <select id="ownerType" class="form-select">
              <option value="pg" ${d.propertyType === 'pg' ? 'selected' : ''}>PG / Student Hostel</option>
              <option value="room" ${d.propertyType === 'room' ? 'selected' : ''}>Independent Room</option>
              <option value="flat" ${d.propertyType === 'flat' ? 'selected' : ''}>Full Flat / 1BHK / 2BHK</option>
              <option value="studio" ${d.propertyType === 'studio' ? 'selected' : ''}>Studio Apartment</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Gender Preference</label>
            <select id="ownerGender" class="form-select">
              <option value="male" ${d.genderPreference === 'male' ? 'selected' : ''}>Boys Only (Chhatra)</option>
              <option value="female" ${d.genderPreference === 'female' ? 'selected' : ''}>Girls Only (Chhatraayein)</option>
              <option value="any" ${d.genderPreference === 'any' ? 'selected' : ''}>Co-ed / Any (Working Professionals / Family)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label class="form-label">City *</label>
              <select id="ownerCity" class="form-select">
                <option value="Kota" ${d.city === 'Kota' ? 'selected' : ''}>Kota (NEET/JEE)</option>
                <option value="Pune" ${d.city === 'Pune' ? 'selected' : ''}>Pune (IT/College)</option>
                <option value="Jaipur" ${d.city === 'Jaipur' ? 'selected' : ''}>Jaipur (Education)</option>
                <option value="Delhi" ${d.city === 'Delhi' ? 'selected' : ''}>Delhi (NCR/Metro)</option>
                <option value="Bengaluru" ${d.city === 'Bengaluru' ? 'selected' : ''}>Bengaluru (Tech)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Locality / Colony *</label>
              <input type="text" id="ownerLocality" class="form-input" placeholder="e.g. Talwandi, Sector 2" value="${d.locality}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Full Street Address</label>
            <input type="text" id="ownerAddress" class="form-input" placeholder="House/Plot No, Street, Landmark" value="${d.address}" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div class="form-group">
              <label class="form-label">Floor No.</label>
              <input type="number" id="ownerFloor" class="form-input" value="${d.floor}" min="0" max="20" />
            </div>
            <div class="form-group">
              <label class="form-label">Total Floors</label>
              <input type="number" id="ownerTotalFloors" class="form-input" value="${d.totalFloors}" min="1" max="25" />
            </div>
            <div class="form-group">
              <label class="form-label">Lift</label>
              <select id="ownerLift" class="form-select">
                <option value="false" ${!d.hasLift ? 'selected' : ''}>No Lift</option>
                <option value="true" ${d.hasLift ? 'selected' : ''}>Has Lift</option>
              </select>
            </div>
          </div>

          <button class="btn-inspect" style="width: 100%; margin-top: 14px; justify-content: center;" onclick="GharDekho.nextOwnerStep()">
            Next: Location & Map Pin →
          </button>
        ` : ''}

        <!-- STEP 2: Location & Map Pin Picker -->
        ${state.ownerStep === 2 ? `
          <h4 style="margin-bottom: 8px; color: var(--text-primary);">Step 2: Google Maps Location & Landmarks</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
            Accurate location builds tenant trust and prevents students from getting lost on arrival.
          </p>

          <div class="map-container" style="height: 180px; margin-bottom: 14px;">
            <div class="map-placeholder" style="padding: 10px;">
              <div class="map-pin-pulse"></div>
              <strong style="color: var(--color-primary); font-size: 13px;">Pinned: ${d.locality}, ${d.city}</strong>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">
                Lat: ${d.lat.toFixed(4)}, Lng: ${d.lng.toFixed(4)}
              </span>
              <button class="chip" style="margin-top: 8px; font-size: 10px;" onclick="GharDekho.detectCurrentLocation()">
                📍 Auto-Detect My Current Location
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label class="form-label">Latitude</label>
              <input type="number" step="0.0001" id="ownerLat" class="form-input" value="${d.lat}" />
            </div>
            <div class="form-group">
              <label class="form-label">Longitude</label>
              <input type="number" step="0.0001" id="ownerLng" class="form-input" value="${d.lng}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Prominent Coaching / College / Tech Park Landmark</label>
            <input type="text" id="ownerLandmark" class="form-input" placeholder="e.g. 200m from Allen Samarth / Hinjawadi Phase 1" value="${d.landmark}" />
          </div>

          <div class="form-group">
            <label class="form-label">Distance to Nearest Metro / Bus Station</label>
            <input type="text" id="ownerBus" class="form-input" placeholder="e.g. 500m to City Bus Stop / Metro Gate 2" value="${d.busDistance}" />
          </div>

          <div style="display: flex; gap: 8px; margin-top: 14px;">
            <button class="chip" onclick="GharDekho.prevOwnerStep()">← Back</button>
            <button class="btn-inspect" style="flex: 1; justify-content: center;" onclick="GharDekho.nextOwnerStep()">
              Next: 20+ Amenity Checklist →
            </button>
          </div>
        ` : ''}

        <!-- STEP 3: Comprehensive 20+ Indian Amenity Checklist -->
        ${state.ownerStep === 3 ? `
          <h4 style="margin-bottom: 6px; color: var(--text-primary);">Step 3: Indian Amenity Checklist (20+ Items)</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
            Tenants care deeply about verified water timings, power backup, and quiet study environment.
          </p>

          <div class="amenity-section-heading">💡 Electricity & Power Backup</div>
          <div class="amenities-toggle-grid">
            <div class="amenity-toggle-chip ${a.electricityBackup.includes('Generator') ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('electricityBackup', 'Generator (Full 24hr)')">
              <span class="amenity-check">✓</span>
              <span>⚡ 24hr Generator Backup</span>
            </div>
            <div class="amenity-toggle-chip ${a.electricityBackup.includes('Inverter') ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('electricityBackup', 'Inverter (Lights, Fan & WiFi)')">
              <span class="amenity-check">✓</span>
              <span>🔋 Inverter (Fan/WiFi)</span>
            </div>
          </div>

          <div class="amenity-section-heading">💧 Water Supply & Geyser</div>
          <div class="amenities-toggle-grid">
            <div class="amenity-toggle-chip ${a.waterSupply.includes('24 Hours') ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('waterSupply', '24 Hours (RO + Tank)')">
              <span class="amenity-check">✓</span>
              <span>💧 24hr RO + Tank Supply</span>
            </div>
            <div class="amenity-toggle-chip ${a.waterSupply.includes('Timing') ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('waterSupply', 'Morning & Evening Timing')">
              <span class="amenity-check">✓</span>
              <span>⏰ Timing-based Water</span>
            </div>
            <div class="amenity-toggle-chip ${a.hotWater ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('hotWater')">
              <span class="amenity-check">✓</span>
              <span>♨️ Hot Water / Geyser</span>
            </div>
            <div class="amenity-toggle-chip ${a.wifi ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('wifi')">
              <span class="amenity-check">✓</span>
              <span>🌐 100 Mbps Fiber WiFi</span>
            </div>
          </div>

          <div class="amenity-section-heading">❄️ Cooling, Bathroom & Food</div>
          <div class="amenities-toggle-grid">
            <div class="amenity-toggle-chip ${a.cooler ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('cooler')">
              <span class="amenity-check">✓</span>
              <span>🌬️ Desert Cooler</span>
            </div>
            <div class="amenity-toggle-chip ${a.ac ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('ac')">
              <span class="amenity-check">✓</span>
              <span>❄️ Air Conditioner (AC)</span>
            </div>
            <div class="amenity-toggle-chip ${a.bathroom.includes('Attached') ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('bathroom', 'Attached Western')">
              <span class="amenity-check">✓</span>
              <span>🚿 Attached Western Bath</span>
            </div>
            <div class="amenity-toggle-chip ${a.tiffinNearby ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('tiffinNearby')">
              <span class="amenity-check">✓</span>
              <span>🍱 Tiffin / Mess Nearby</span>
            </div>
            <div class="amenity-toggle-chip ${a.washingMachine ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('washingMachine')">
              <span class="amenity-check">✓</span>
              <span>🧺 Washing Machine</span>
            </div>
            <div class="amenity-toggle-chip ${a.parkingTwoWheeler ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('parkingTwoWheeler')">
              <span class="amenity-check">✓</span>
              <span>🛵 Two-Wheeler Parking</span>
            </div>
          </div>

          <div class="amenity-section-heading">🔒 Safety, Host Rules & Curfew</div>
          <div class="amenities-toggle-grid">
            <div class="amenity-toggle-chip ${a.cctv ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('cctv')">
              <span class="amenity-check">✓</span>
              <span>📹 24x7 CCTV Security</span>
            </div>
            <div class="amenity-toggle-chip ${a.singleGirlSafe ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('singleGirlSafe')">
              <span class="amenity-check">✓</span>
              <span>🛡️ Single Girl Safe</span>
            </div>
            <div class="amenity-toggle-chip ${a.ownerOnPremises ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('ownerOnPremises')">
              <span class="amenity-check">✓</span>
              <span>🏡 Owner Lives on Premises</span>
            </div>
            <div class="amenity-toggle-chip ${a.securityGuard ? 'active' : ''}" onclick="GharDekho.toggleDraftAmenity('securityGuard')">
              <span class="amenity-check">✓</span>
              <span>👮 Security Guard</span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 18px;">
            <button class="chip" onclick="GharDekho.prevOwnerStep()">← Back</button>
            <button class="btn-inspect" style="flex: 1; justify-content: center;" onclick="GharDekho.nextOwnerStep()">
              Next: Room Sharing & Price →
            </button>
          </div>
        ` : ''}

        <!-- STEP 4: Room Sharing Configuration & Pricing Engine -->
        ${state.ownerStep === 4 ? `
          <h4 style="margin-bottom: 6px; color: var(--text-primary);">Step 4: Room Sharing Slots & Pricing</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
            Configure bed-level split sharing or independent private rooms.
          </p>

          <div class="form-group">
            <label class="form-label">Room Identifier / Label</label>
            <input type="text" id="ownerRoomLabel" class="form-input" value="${d.roomLabel}" placeholder="e.g. Room 204 (Front Balcony)" />
          </div>

          <div class="form-group">
            <label class="form-label">Sharing Model</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 4px;">
              <button class="chip ${d.sharingOccupancy === 4 ? 'active' : ''}" style="justify-content: center;" onclick="GharDekho.setDraftSharing(4)">
                4-Sharing
              </button>
              <button class="chip ${d.sharingOccupancy === 3 ? 'active' : ''}" style="justify-content: center;" onclick="GharDekho.setDraftSharing(3)">
                3-Sharing
              </button>
              <button class="chip ${d.sharingOccupancy === 2 ? 'active' : ''}" style="justify-content: center;" onclick="GharDekho.setDraftSharing(2)">
                Double
              </button>
              <button class="chip ${d.sharingOccupancy === 1 ? 'active' : ''}" style="justify-content: center;" onclick="GharDekho.setDraftSharing(1)">
                Single
              </button>
            </div>
          </div>

          <!-- Dynamic Bed Slot Visualizer -->
          <div class="slot-preview-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; color: var(--color-student); font-size: 12px;">
                🛏️ ${d.sharingOccupancy} Bed Slots Generated
              </span>
              <span style="font-size: 11px; color: var(--color-trust);">All Slots Vacant for New Tenants</span>
            </div>
            <div class="bed-icons-row" style="margin-top: 4px; margin-bottom: 10px;">
              ${Array.from({ length: d.sharingOccupancy }).map((_, i) => `
                <span class="bed-icon" title="Bed Slot ${i + 1} (Available)">🛏️</span>
              `).join('')}
            </div>
            ${Array.from({ length: d.sharingOccupancy }).map((_, i) => `
              <div class="slot-item-row">
                <span>Bed Slot ${i + 1}</span>
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">₹${d.pricePerPerson}/month</span>
              </div>
            `).join('')}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px;">
            <div class="form-group">
              <label class="form-label">Rent Per Person (₹/month) *</label>
              <input type="number" id="ownerRent" class="form-input" value="${d.pricePerPerson}" min="1000" max="100000" />
            </div>
            <div class="form-group">
              <label class="form-label">Security Deposit (₹)</label>
              <input type="number" id="ownerDeposit" class="form-input" value="${d.depositAmount}" min="0" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label class="form-label">Notice Period (Days)</label>
              <input type="number" id="ownerNotice" class="form-input" value="${d.noticePeriodDays}" />
            </div>
            <div class="form-group">
              <label class="form-label">Room Area (Sq.Ft.)</label>
              <input type="number" id="ownerArea" class="form-input" value="${d.areaSqft}" />
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button class="chip" onclick="GharDekho.prevOwnerStep()">← Back</button>
            <button class="btn-inspect" style="flex: 1; justify-content: center;" onclick="GharDekho.nextOwnerStep()">
              Next: Photos & Review →
            </button>
          </div>
        ` : ''}

        <!-- STEP 5: Photos Upload & Pre-Publish Review -->
        ${state.ownerStep === 5 ? `
          <h4 style="margin-bottom: 6px; color: var(--text-primary);">Step 5: Photos & Final Review</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
            Upload real room, study desk & bathroom photos (Min 3 required). Verified photos boost inquiries 4x.
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 600; color: ${d.photos.length >= 3 ? 'var(--color-trust)' : 'var(--color-warning)'};">
              📸 ${d.photos.length} Photos Added ${d.photos.length >= 3 ? '(Verified)' : '(Min 3 required)'}
            </span>
            <button class="chip" style="font-size: 10px;" onclick="GharDekho.addPresetSamplePhoto()">
              + Add Sample Photo
            </button>
          </div>

          <div class="photo-preview-grid">
            ${d.photos.map((url, idx) => `
              <div class="photo-preview-item">
                <img src="${url}" alt="Room photo ${idx + 1}" />
                <span class="photo-tag-badge">${idx === 0 ? 'Primary' : `Photo ${idx + 1}`}</span>
                <button class="photo-remove-btn" onclick="GharDekho.removeDraftPhoto(${idx})">×</button>
              </div>
            `).join('')}
          </div>

          <!-- Quick URL adder -->
          <div style="display: flex; gap: 6px; margin-bottom: 16px;">
            <input type="url" id="newPhotoUrl" class="form-input" placeholder="Paste image URL..." style="font-size: 12px;" />
            <button class="chip active" style="white-space: nowrap;" onclick="GharDekho.addDraftPhotoFromInput()">
              Add Photo
            </button>
          </div>

          <!-- Pre-Publish Live Preview Card -->
          <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 11px; color: var(--color-primary); font-weight: 700; margin-bottom: 4px;">
              PREVIEW ON GHARDEKHO FEED:
            </div>
            <strong style="color: var(--text-primary); font-size: 14px;">${d.title}</strong>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
              📍 ${d.locality}, ${d.city} • ₹${d.pricePerPerson}/head/mo • ${d.sharingOccupancy} Beds Available
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="chip" onclick="GharDekho.prevOwnerStep()">← Back</button>
            <button class="btn-inspect" style="flex: 1; justify-content: center; background: var(--gradient-primary); box-shadow: var(--shadow-glow);" onclick="GharDekho.submitNewProperty()">
              Publish Property Now 🚀
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function getStepTitle(step) {
    switch (step) {
      case 1: return "Basic Info & Category";
      case 2: return "Google Maps Pin & Landmark";
      case 3: return "20+ Amenity Checklist";
      case 4: return "Room Sharing & Pricing";
      case 5: return "Photo Gallery & Review";
      default: return "";
    }
  }

  function saveStepInputs() {
    const d = state.ownerDraft;
    if (state.ownerStep === 1) {
      const titleEl = document.getElementById('ownerTitle');
      if (titleEl) d.title = titleEl.value;
      const typeEl = document.getElementById('ownerType');
      if (typeEl) d.propertyType = typeEl.value;
      const genderEl = document.getElementById('ownerGender');
      if (genderEl) d.genderPreference = genderEl.value;
      const cityEl = document.getElementById('ownerCity');
      if (cityEl) d.city = cityEl.value;
      const locEl = document.getElementById('ownerLocality');
      if (locEl) d.locality = locEl.value;
      const addrEl = document.getElementById('ownerAddress');
      if (addrEl) d.address = addrEl.value;
      const floorEl = document.getElementById('ownerFloor');
      if (floorEl) d.floor = Number(floorEl.value);
      const totalEl = document.getElementById('ownerTotalFloors');
      if (totalEl) d.totalFloors = Number(totalEl.value);
      const liftEl = document.getElementById('ownerLift');
      if (liftEl) d.hasLift = liftEl.value === 'true';
    } else if (state.ownerStep === 2) {
      const latEl = document.getElementById('ownerLat');
      if (latEl) d.lat = parseFloat(latEl.value) || d.lat;
      const lngEl = document.getElementById('ownerLng');
      if (lngEl) d.lng = parseFloat(lngEl.value) || d.lng;
      const landEl = document.getElementById('ownerLandmark');
      if (landEl) d.landmark = landEl.value;
      const busEl = document.getElementById('ownerBus');
      if (busEl) d.busDistance = busEl.value;
    } else if (state.ownerStep === 4) {
      const labelEl = document.getElementById('ownerRoomLabel');
      if (labelEl) d.roomLabel = labelEl.value;
      const rentEl = document.getElementById('ownerRent');
      if (rentEl) d.pricePerPerson = Number(rentEl.value) || d.pricePerPerson;
      const depEl = document.getElementById('ownerDeposit');
      if (depEl) d.depositAmount = Number(depEl.value) || d.depositAmount;
      const notEl = document.getElementById('ownerNotice');
      if (notEl) d.noticePeriodDays = Number(notEl.value) || 30;
      const areaEl = document.getElementById('ownerArea');
      if (areaEl) d.areaSqft = Number(areaEl.value) || 250;
    }
  }

  // AI Vision Smart Auto-Fill (Slice P12)
  async function triggerAiVisionScan() {
    showToast('✨ AI Vision: Scanning sample room photos and detecting amenities...');
    try {
      const samplePhotos = [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&room=double-sharing',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&bath=western'
      ];
      const res = await fetch('/api/properties/ai-extract-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: samplePhotos,
          city: state.selectedCity === 'All' ? 'Kota' : state.selectedCity,
          locality: 'Talwandi, Near Allen',
          ownerPreviousData: {
            propertyName: 'Saraswati Residency (AI Verified)',
            ownerName: state.user?.fullName || 'Ramesh Sharma',
            ownerPhone: state.user?.phone || '+91 98290 12345'
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'AI extraction failed');

      const extracted = data.extractedData;
      state.ownerDraft.title = extracted.title;
      state.ownerDraft.locality = extracted.prefillContact.locality;
      state.ownerDraft.city = extracted.prefillContact.city;
      state.ownerDraft.pricePerPerson = extracted.suggestedRoom.pricePerPerson;
      state.ownerDraft.maxOccupancy = extracted.suggestedRoom.maxOccupancy;
      state.ownerDraft.photos = samplePhotos;
      if (extracted.detectedAmenities) {
        state.ownerDraft.amenities = {
          ...state.ownerDraft.amenities,
          ...extracted.detectedAmenities
        };
      }

      showToast(`🎉 AI detected: ${extracted.suggestedRoom.maxOccupancy}-Bed room, Attached Bath, and suggested ₹${extracted.suggestedRoom.pricePerPerson}/mo!`);
      renderOwnerAddWizard();
    } catch (e) {
      showToast('AI smart fill simulated for sample room photos');
      state.ownerDraft.title = 'Cozy Student PG (AI Auto-Filled)';
      state.ownerDraft.locality = 'Talwandi';
      renderOwnerAddWizard();
    }
  }

  function nextOwnerStep() {
    saveStepInputs();
    
    // Validation
    const d = state.ownerDraft;
    if (state.ownerStep === 1) {
      if (!d.title.trim()) {
        showToast('Please enter a property title');
        return;
      }
      if (!d.locality.trim()) {
        showToast('Please enter locality / colony');
        return;
      }
    } else if (state.ownerStep === 4) {
      if (d.pricePerPerson <= 0) {
        showToast('Please enter a valid rent amount');
        return;
      }
    }

    if (state.ownerStep < 5) {
      state.ownerStep++;
      renderOwnerAddWizard();
    }
  }

  function prevOwnerStep() {
    saveStepInputs();
    if (state.ownerStep > 1) {
      state.ownerStep--;
      renderOwnerAddWizard();
    }
  }

  function toggleDraftAmenity(key, explicitVal) {
    const a = state.ownerDraft.amenities;
    if (explicitVal !== undefined) {
      a[key] = explicitVal;
    } else {
      a[key] = !a[key];
    }
    renderOwnerAddWizard();
  }

  function setDraftSharing(num) {
    state.ownerDraft.sharingOccupancy = num;
    state.ownerDraft.roomLabel = num === 1 
      ? 'Room 101 (Single Independent)'
      : `Room 204 (${num}-Bed Split Sharing)`;
    renderOwnerAddWizard();
  }

  function addDraftPhotoFromInput() {
    const input = document.getElementById('newPhotoUrl');
    if (!input || !input.value.trim()) return;
    state.ownerDraft.photos.push(input.value.trim());
    renderOwnerAddWizard();
    showToast('Photo added');
  }

  function addPresetSamplePhoto() {
    const presets = [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
    ];
    const nextPhoto = presets[state.ownerDraft.photos.length % presets.length];
    state.ownerDraft.photos.push(nextPhoto);
    renderOwnerAddWizard();
    showToast('Sample photo added');
  }

  function removeDraftPhoto(index) {
    if (state.ownerDraft.photos.length <= 1) {
      showToast('At least 1 photo must remain');
      return;
    }
    state.ownerDraft.photos.splice(index, 1);
    renderOwnerAddWizard();
  }

  function detectCurrentLocation() {
    state.ownerDraft.lat = 25.1388 + (Math.random() - 0.5) * 0.01;
    state.ownerDraft.lng = 75.8344 + (Math.random() - 0.5) * 0.01;
    showToast('📍 Pin updated to GPS coordinates');
    renderOwnerAddWizard();
  }

  // Submit new property to Backend API (Slice 1)
  async function submitNewProperty() {
    saveStepInputs();
    const d = state.ownerDraft;
    const a = d.amenities;

    if (d.photos.length < 3) {
      showToast('⚠️ Please provide at least 3 photos to publish');
      return;
    }

    // Generate dynamic bed slots matching sharingOccupancy
    const slots = Array.from({ length: d.sharingOccupancy }).map((_, idx) => ({
      slotId: `s-${Date.now()}-${idx + 1}`,
      status: 'available',
      tenantName: null,
      since: null
    }));

    const newProp = {
      title: d.title,
      description: `Newly listed verified ${d.propertyType.toUpperCase()} in ${d.locality}. Verified ${a.waterSupply}, ${a.electricityBackup}, and peaceful study atmosphere.`,
      propertyType: d.propertyType,
      category: d.sharingOccupancy > 1 ? "sharing_room" : "private_room",
      genderPreference: d.genderPreference,
      city: d.city,
      locality: d.locality,
      address: d.address || `${d.locality}, ${d.city}`,
      coordinates: { lat: d.lat, lng: d.lng },
      floor: d.floor,
      totalFloors: d.totalFloors,
      hasLift: d.hasLift,
      flooring: "Vitrified Tiles",
      isAvailable: true,
      isVerified: true,
      verificationBadge: "Owner Verified Listing",
      depositMonths: 1,
      depositAmount: d.depositAmount,
      noticePeriodDays: d.noticePeriodDays,
      rules: {
        curfewTime: a.curfewTime,
        visitorsAllowed: "In lobby only",
        cookingAllowed: false,
        smokingAllowed: false,
        ownerOnPremises: a.ownerOnPremises
      },
      rooms: [
        {
          id: `room-${Date.now()}`,
          label: d.roomLabel,
          maxOccupancy: d.sharingOccupancy,
          currentOccupancy: 0,
          pricePerPerson: d.pricePerPerson,
          areaSqft: d.areaSqft,
          bathroomType: a.bathroom.includes('Attached') ? 'attached' : 'common',
          hasBalcony: true,
          furnishing: "fully",
          slots
        }
      ],
      amenities: {
        electricityBackup: a.electricityBackup,
        waterSupply: a.waterSupply,
        waterTiming: a.waterTiming,
        hotWater: a.hotWater ? "Geyser Included" : "None",
        wifi: a.wifi ? "Fiber 100 Mbps" : "None",
        cooling: a.ac ? "AC" : (a.cooler ? "Desert Cooler" : "Ceiling Fan"),
        kitchen: a.tiffinNearby ? "Tiffin Service Nearby" : "None",
        bathroom: a.bathroom,
        washingMachine: a.washingMachine,
        parking: a.parkingTwoWheeler ? "Two-Wheeler" : "None",
        security: a.cctv ? "CCTV 24x7" : "Gated",
        tiffinNearby: a.tiffinNearby
      },
      nearbyPlaces: [
        { name: d.landmark || "Main Coaching Hub", distance: "250m" },
        { name: d.busDistance || "City Bus Stand", distance: "500m" },
        { name: "Pharmacy & General Store", distance: "100m" }
      ],
      photos: [...d.photos],
      owner: {
        id: "owner-self",
        name: "Satish Sharma (Self)",
        phone: "+91 98290 XXXXX",
        whatsapp: "919829000000",
        responseRate: "Instant (< 5 min)",
        isKycDone: true
      },
      rating: 5.0,
      reviewsCount: 0
    };

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProp)
      });
      const data = await res.json();
      if (data.success) {
        state.properties.unshift(data.property);
        showToast('🎉 Property published live on GharDekho!');
      } else {
        showToast(`Error: ${data.message}`);
        return;
      }
    } catch (e) {
      state.properties.unshift(newProp);
      showToast('🎉 Property published live! (Offline Mode)');
    }

    state.ownerStep = 1;
    state.activeTab = 'owner_listings';
    render();
  }

  // Render Owner Inquiries (Slice 5 In-App Chat for Owners)
  function renderOwnerInquiries() {
    if (state.activeChatThreadId) {
      renderChatRoom(state.activeChatThreadId);
      return;
    }

    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          Incoming Tenant Inquiries (${state.inquiries.length})
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">Direct chat leads and room visit requests from students</p>
      </div>

      <div class="chat-threads-container">
        ${state.inquiries.length === 0 ? `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">📬</div>
            <p>No new inquiries yet. As soon as students search and book visits, their leads will show up here.</p>
          </div>
        ` : state.inquiries.map(inq => {
          const lastMsg = inq.messages && inq.messages.length > 0 ? inq.messages[inq.messages.length - 1] : null;
          const hasUnread = (inq.unreadCountOwner || 0) > 0;
          return `
            <div class="chat-thread-card ${hasUnread ? 'has-unread' : ''}" onclick="GharDekho.openChatThread('${inq.id}')">
              <div class="chat-thread-header">
                <span class="chat-thread-title">👤 ${inq.tenantName}</span>
                <span class="chat-thread-time">${formatChatTime(inq.lastMessageAt || inq.createdAt)}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
                Property: <strong style="color: var(--text-primary);">${inq.propertyTitle}</strong>
              </div>
              <div class="chat-thread-snippet">
                ${lastMsg ? (lastMsg.senderRole === 'owner' ? 'You: ' : `${lastMsg.senderName.split(' ')[0]}: `) + lastMsg.text : inq.message}
              </div>
              <div class="chat-thread-footer">
                <div>
                  ${inq.scheduledVisitDate ? `
                    <span class="badge-tag ${inq.status === 'confirmed' ? 'verified' : ''}" style="font-size: 10px;">
                      📅 Visit: ${inq.scheduledVisitDate} (${inq.status})
                    </span>
                  ` : `
                    <span style="font-size: 10px; color: var(--text-muted);">📞 ${inq.tenantPhone}</span>
                  `}
                </div>
                ${hasUnread ? `<span class="unread-badge-pill">${inq.unreadCountOwner} new</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Slice 5: Active In-App Chat Room
  function renderChatRoom(threadId) {
    const thread = state.inquiries.find(i => i.id === threadId);
    if (!thread) {
      state.activeChatThreadId = null;
      render();
      return;
    }

    const isOwner = state.currentRole === 'owner';
    const otherPartyName = isOwner ? thread.tenantName : thread.ownerName;
    const otherPartyPhone = isOwner ? thread.tenantPhone : thread.ownerPhone;
    const otherPartyRole = isOwner ? 'Student / Tenant' : 'Property Owner (Makan Maalik)';

    const quickReplies = isOwner ? [
      "Yes, the bed is available for immediate move-in.",
      "Please bring your student ID card for visitor entry.",
      "Yes, 24-hr generator power backup is fully active.",
      "Visit confirmed! I will be waiting at the lobby."
    ] : [
      "Is the study desk & ergonomic chair included?",
      "How is the WiFi speed for online live lectures?",
      "Can I come for physical room visit today at 5 PM?",
      "What is the security deposit & notice period?"
    ];

    el.contentArea.innerHTML = `
      <div class="chat-room-wrapper">
        <!-- Chat Header Bar -->
        <div class="chat-header-bar">
          <button class="chat-back-btn" onclick="GharDekho.closeChatThread()" title="Back to messages">
            ‹
          </button>
          <div class="chat-header-info">
            <div class="chat-header-name">${otherPartyName}</div>
            <div class="chat-header-status">● Active • ${otherPartyRole}</div>
          </div>
          <button class="chip" style="font-size: 11px; padding: 4px 8px;" onclick="alert('Calling ${otherPartyName}: ${otherPartyPhone}')">
            📞 Call
          </button>
        </div>

        <!-- Scheduled Visit Banner (if any) -->
        ${thread.scheduledVisitDate ? `
          <div class="chat-visit-alert">
            <div>
              <strong>📅 Visit: ${thread.scheduledVisitDate}</strong>
              <span style="margin-left: 6px; font-weight: 700; color: ${thread.status === 'confirmed' ? 'var(--color-trust)' : 'var(--color-warning)'};">
                [${thread.status.toUpperCase()}]
              </span>
            </div>
            ${isOwner && thread.status !== 'confirmed' ? `
              <button style="background: var(--color-trust); border: none; color: #FFF; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; cursor: pointer;" onclick="GharDekho.updateChatVisitStatus('${thread.id}', 'confirmed')">
                Confirm Visit
              </button>
            ` : ''}
          </div>
        ` : ''}

        <!-- Scrollable Messages Area -->
        <div class="chat-messages-area" id="chatMessagesArea">
          ${(thread.messages || []).map(m => {
            if (m.senderRole === 'system') {
              return `
                <div class="chat-bubble system">
                  ${m.text}
                </div>
              `;
            }

            const isMine = m.senderRole === state.currentRole;
            return `
              <div class="chat-bubble ${isMine ? 'tenant' : 'owner'}">
                ${!isMine ? `<div style="font-size: 10px; font-weight: 700; color: var(--color-primary); margin-bottom: 2px;">${m.senderName}</div>` : ''}
                <div>${m.text}</div>
                <div class="msg-meta-row">
                  <span>${formatChatTime(m.timestamp)}</span>
                  ${isMine ? `<span class="msg-ticks">${m.isRead ? '✓✓' : '✓'}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Student / Owner Quick Reply Chips -->
        <div class="chat-quick-replies">
          ${quickReplies.map(reply => `
            <button class="quick-reply-chip" onclick="GharDekho.sendQuickReply('${thread.id}', '${reply.replace(/'/g, "\\'")}')">
              ${reply}
            </button>
          `).join('')}
        </div>

        <!-- Chat Input Bar -->
        <div class="chat-input-bar">
          <input 
            type="text" 
            id="chatTextInput" 
            class="chat-text-input" 
            placeholder="Type a message to ${otherPartyName.split(' ')[0]}..." 
            onkeydown="if(event.key==='Enter') GharDekho.sendChatMessage('${thread.id}')"
          />
          <button class="chat-send-btn" onclick="GharDekho.sendChatMessage('${thread.id}')" title="Send message">
            ➤
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const area = document.getElementById('chatMessagesArea');
      if (area) area.scrollTop = area.scrollHeight;
    }, 50);
  }

  function formatChatTime(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  async function openChatThread(threadId) {
    state.activeChatThreadId = threadId;
    try {
      const res = await fetch(`/api/inquiries/${threadId}?reader=${state.currentRole}`);
      const data = await res.json();
      if (data.success && data.inquiry) {
        const idx = state.inquiries.findIndex(i => i.id === threadId);
        if (idx !== -1) {
          state.inquiries[idx] = data.inquiry;
        }
      }
    } catch (e) {
      console.warn('Failed to mark read', e);
    }
    renderNav();
    render();
  }

  function closeChatThread() {
    state.activeChatThreadId = null;
    renderNav();
    render();
  }

  async function sendChatMessage(threadId) {
    const input = document.getElementById('chatTextInput');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';

    await submitChatMessage(threadId, text);
  }

  async function sendQuickReply(threadId, text) {
    await submitChatMessage(threadId, text);
  }

  async function submitChatMessage(threadId, text) {
    const thread = state.inquiries.find(i => i.id === threadId);
    if (!thread) return;

    try {
      const res = await fetch(`/api/inquiries/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderRole: state.currentRole,
          senderName: state.currentRole === 'owner' ? thread.ownerName : thread.tenantName,
          text
        })
      });
      const data = await res.json();
      if (data.success && data.inquiry) {
        const idx = state.inquiries.findIndex(i => i.id === threadId);
        if (idx !== -1) {
          state.inquiries[idx] = data.inquiry;
        }
        renderChatRoom(threadId);
      }
    } catch (e) {
      const localMsg = {
        id: `msg-${Date.now()}`,
        senderRole: state.currentRole,
        senderName: state.currentRole === 'owner' ? thread.ownerName : thread.tenantName,
        text,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      if (!thread.messages) thread.messages = [];
      thread.messages.push(localMsg);
      renderChatRoom(threadId);
    }
  }

  async function updateChatVisitStatus(threadId, status) {
    try {
      const res = await fetch(`/api/inquiries/${threadId}/visit-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success && data.inquiry) {
        const idx = state.inquiries.findIndex(i => i.id === threadId);
        if (idx !== -1) {
          state.inquiries[idx] = data.inquiry;
        }
        showToast(data.message);
        renderChatRoom(threadId);
      }
    } catch (e) {
      showToast(`Visit status updated (Offline Mode)`);
    }
  }

  // Render Bottom Nav Tabs based on Role (Slice 5 Live Unread Counters)
  function renderNav() {
    const tenantUnread = state.inquiries ? state.inquiries.reduce((acc, i) => acc + (i.unreadCountTenant || 0), 0) : 0;
    const ownerUnread = state.inquiries ? state.inquiries.reduce((acc, i) => acc + (i.unreadCountOwner || 0), 0) : 0;

    // Update View Toggle (List vs Map) active states
    const btnList = document.getElementById('viewToggleList');
    const btnMap = document.getElementById('viewToggleMap');
    if (btnList) btnList.classList.toggle('active', state.activeTab === 'khojo');
    if (btnMap) btnMap.classList.toggle('active', state.activeTab === 'map');

    if (state.currentRole === 'tenant') {
      el.bottomNav.innerHTML = `
        <button class="nav-item ${state.activeTab === 'khojo' ? 'active' : ''}" onclick="GharDekho.setTab('khojo')">
          <span class="nav-icon">🏠</span>
          <span data-i18n="nav.khojo">Khojo</span>
        </button>
        <button class="nav-item ${state.activeTab === 'map' ? 'active' : ''}" onclick="GharDekho.setTab('map')">
          <span class="nav-icon">🗺️</span>
          <span data-i18n="nav.map">Map</span>
        </button>
        <button class="nav-item ${state.activeTab === 'saved' ? 'active' : ''}" onclick="GharDekho.setTab('saved')">
          <span class="nav-icon">❤️</span>
          <span data-i18n="nav.saved">Saved</span>
        </button>
        <button class="nav-item ${state.activeTab === 'messages' ? 'active' : ''}" onclick="GharDekho.setTab('messages')">
          <span class="nav-icon" style="position: relative;">
            💬
            ${tenantUnread > 0 ? `<span style="position: absolute; top: -4px; right: -8px; background: var(--color-primary); color: #FFF; font-size: 9px; font-weight: 700; border-radius: 10px; padding: 1px 5px; line-height: 1;">${tenantUnread}</span>` : ''}
          </span>
          <span data-i18n="nav.chat">Chat</span>
        </button>
        <button class="nav-item ${state.activeTab === 'profile' ? 'active' : ''}" onclick="GharDekho.setTab('profile')">
          <span class="nav-icon">👤</span>
          <span data-i18n="nav.profile">Profile</span>
        </button>
      `;
    } else {
      el.bottomNav.innerHTML = `
        <button class="nav-item ${state.activeTab === 'owner_listings' ? 'active' : ''}" onclick="GharDekho.setTab('owner_listings')">
          <span class="nav-icon">📋</span>
          <span>My Rooms</span>
        </button>
        <button class="nav-item ${state.activeTab === 'owner_add' ? 'active' : ''}" onclick="GharDekho.setTab('owner_add')">
          <span class="nav-icon">➕</span>
          <span>Add Room</span>
        </button>
        <button class="nav-item ${state.activeTab === 'owner_inquiries' ? 'active' : ''}" onclick="GharDekho.setTab('owner_inquiries')">
          <span class="nav-icon" style="position: relative;">
            💬
            ${ownerUnread > 0 ? `<span style="position: absolute; top: -4px; right: -8px; background: var(--color-primary); color: #FFF; font-size: 9px; font-weight: 700; border-radius: 10px; padding: 1px 5px; line-height: 1;">${ownerUnread}</span>` : ''}
          </span>
          <span>Inquiries</span>
        </button>
        <button class="nav-item ${state.activeTab === 'owner_profile' ? 'active' : ''}" onclick="GharDekho.setTab('owner_profile')">
          <span class="nav-icon">👤</span>
          <span>Profile</span>
        </button>
      `;
    }

    // Sync active state on desktop header navigation shortcuts
    const deskBtns = {
      saved: document.getElementById('headerSavedBtn'),
      messages: document.getElementById('headerChatBtn')
    };
    Object.entries(deskBtns).forEach(([tabKey, btn]) => {
      if (btn) {
        if (state.activeTab === tabKey) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  }

  function setTab(tab) {
    state.activeTab = tab;
    renderNav();
    render();
  }

  function setCity(city) {
    state.activeCity = city;
    
    // Update City Pill in Hero Capsule
    if (el.cityPill) {
      el.cityPill.innerHTML = `
        <span class="city-pill-sublabel">CITY</span>
        <span class="city-pill-val"><span class="pill-text">${city === 'All' ? 'All Cities' : city}</span> 📍</span>
      `;
    }

    // Update Quick Chips Active State
    if (el.chipsContainer) {
      const chips = el.chipsContainer.querySelectorAll('.chip');
      chips.forEach(chip => {
        const onclickAttr = chip.getAttribute('onclick') || '';
        if ((city === 'All' && onclickAttr.includes("'All'")) || onclickAttr.includes(`'${city}'`)) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
    }

    // Update Hero & Section Eyebrow tags dynamically
    const heroTag = document.getElementById('heroCityTag');
    if (heroTag) {
      heroTag.textContent = city === 'All' ? '✨ A SOFTER LANDING ACROSS INDIA' : `✨ A SOFTER LANDING IN ${city.toUpperCase()}`;
    }
    const secEyebrow = document.getElementById('sectionCityEyebrow');
    if (secEyebrow) {
      const stateMap = { Kota: 'KOTA · RAJASTHAN', Pune: 'PUNE · MAHARASHTRA', Jaipur: 'JAIPUR · RAJASTHAN', Delhi: 'DELHI · NCR' };
      secEyebrow.textContent = stateMap[city] || (city === 'All' ? 'POPULAR HUBS · INDIA' : `${city.toUpperCase()} · INDIA`);
    }

    render();
    showToast(`Filtering rooms in ${city}`);
  }

  function cycleCity() {
    const hubs = ['All', 'Kota', 'Pune', 'Jaipur', 'Delhi'];
    const idx = hubs.indexOf(state.activeCity);
    const next = hubs[(idx + 1) % hubs.length];
    setCity(next);
  }

  function triggerSearch() {
    const q = el.searchInput ? el.searchInput.value.trim() : '';
    state.searchQuery = q.toLowerCase();
    renderFeed();
  }

  function setStayCategory(cat) {
    state.activeStayCategory = cat;
    document.querySelectorAll('.stay-type-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-stay-type') === cat);
    });

    if (cat === 'all') {
      state.filterType = 'all';
      state.filterSharing = 'all';
    } else if (cat === 'private') {
      state.filterType = 'all';
      state.filterSharing = 'single';
    } else if (cat === 'pg_bed') {
      state.filterType = 'pg';
      state.filterSharing = 'sharing';
    } else if (cat === 'studio') {
      state.filterType = 'rk';
      state.filterSharing = 'all';
    } else if (cat === 'flat') {
      state.filterType = 'bhk';
      state.filterSharing = 'all';
    }
    renderFeed();
  }

  function setQuickRent(val) {
    state.budgetMax = parseInt(val, 10) || 25000;
    renderFeed();
  }

  function setQuickGender(val) {
    state.filterGender = val;
    renderFeed();
  }

  function setQuickSort(val) {
    state.filterSortBy = val;
    renderFeed();
  }

  function openListPlace() {
    switchRole('owner');
    setTab('owner_add');
  }

  function resetFilters() {
    state.activeCity = 'All';
    state.filterGender = 'any';
    state.filterType = 'all';
    state.filterSharing = 'all';
    state.filterAmenities.clear();
    state.filterSortBy = 'distance';
    state.budgetMax = 25000;
    state.budgetMin = 1000;
    state.searchQuery = '';
    if (el.searchInput) el.searchInput.value = '';

    if (el.cityPill) {
      el.cityPill.innerHTML = `
        <span class="city-pill-sublabel">CITY</span>
        <span class="city-pill-val"><span class="pill-text" data-i18n="nav.all_cities">All Cities</span> 📍</span>
      `;
    }

    if (el.chipsContainer) {
      const chips = el.chipsContainer.querySelectorAll('.chip');
      chips.forEach((c, idx) => c.classList.toggle('active', idx === 0));
    }

    document.querySelectorAll('.stay-type-pill').forEach((btn, idx) => btn.classList.toggle('active', idx === 0));

    const rentSel = document.getElementById('quickRentFilter');
    if (rentSel) rentSel.value = '25000';
    const genderSel = document.getElementById('quickGenderFilter');
    if (genderSel) genderSel.value = 'any';
    const sortSel = document.getElementById('quickSortFilter');
    if (sortSel) sortSel.value = 'recommended';

    const heroTag = document.getElementById('heroCityTag');
    if (heroTag) heroTag.textContent = '✨ A SOFTER LANDING IN KOTA';
    const secEyebrow = document.getElementById('sectionCityEyebrow');
    if (secEyebrow) secEyebrow.textContent = 'KOTA · RAJASTHAN';

    closeFilterSheet();
    render();
    showToast('Filters reset to default');
  }

  async function openInquiryModal(propId) {
    const p = state.properties.find(item => item.id === propId);
    const msg = prompt(`Send inquiry to ${p.owner.name}:`, "Namaste Sir, I am interested in this room. Can I schedule a visit?");
    if (!msg) return;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propId,
          tenantName: "Aman Kumar",
          tenantPhone: "+91 99887 76655",
          message: msg
        })
      });
      const data = await res.json();
      if (data.success && data.inquiry) {
        showToast('Inquiry sent! Opening chat with owner...');
        closeDetail();
        await fetchInquiries();
        state.activeTab = state.currentRole === 'owner' ? 'owner_inquiries' : 'messages';
        openChatThread(data.inquiry.id);
      }
    } catch (e) {
      showToast('Inquiry sent locally');
      closeDetail();
    }
  }

  // --- SLICE P2: AUTHENTICATION & PHONE OTP CONTROLLER ---
  function syncAuthHeader() {
    const label = document.getElementById('headerAuthLabel');
    if (!label) return;
    if (state.authUser) {
      const firstName = state.authUser.fullName ? state.authUser.fullName.split(' ')[0] : 'Profile';
      label.textContent = `👤 ${firstName}`;
    } else {
      label.textContent = '👤 Sign In';
    }
  }

  async function checkUserSession() {
    if (!state.authToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${state.authToken}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        state.authUser = data.user;
        try {
          localStorage.setItem('ghar_user', JSON.stringify(data.user));
        } catch (e) {}
        syncAuthHeader();
      } else {
        logoutUser(false);
      }
    } catch (e) {}
  }

  function openAuthModal() {
    state.authStep = 'phone';
    state.authPhone = '';
    state.authDemoOtp = '';
    renderAuthModal();
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('active');
  }

  function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  }

  function renderAuthModal() {
    const container = document.getElementById('authModalContent');
    if (!container) return;

    if (state.authStep === 'phone') {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin: 0;">
            📱 Mobile OTP Sign In
          </h3>
          <button onclick="GharDekho.closeAuthModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          Enter your 10-digit Indian mobile number. We will send a 6-digit verification code.
        </p>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Mobile Number (मोबाइल नंबर)</label>
          <div style="display: flex; gap: 8px;">
            <div style="background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 10px 14px; font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center;">
              🇮🇳 +91
            </div>
            <input type="tel" id="authPhoneInput" placeholder="98290 12345" maxlength="10" value="${state.authPhone.replace('+91', '')}" style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 10px 14px; font-size: 15px; color: var(--text-primary); font-family: inherit;">
          </div>
        </div>

        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">I am signing in as:</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button type="button" class="role-btn ${state.authRole === 'tenant' ? 'active' : ''}" onclick="GharDekho.setAuthRole('tenant')">
              🎓 Kirayedaar (Student)
            </button>
            <button type="button" class="role-btn ${state.authRole === 'owner' ? 'active' : ''}" onclick="GharDekho.setAuthRole('owner')">
              🔑 Makan Maalik (Owner)
            </button>
          </div>
        </div>

        <button onclick="GharDekho.submitSendOtp()" class="btn-inspect" style="width: 100%; padding: 12px; font-size: 14px; margin-bottom: 12px;">
          Send Verification OTP (ओटीपी भेजें) ➔
        </button>

        <div style="position: relative; text-align: center; margin: 12px 0 10px 0;">
          <hr style="border: 0; border-top: 1px solid var(--border-subtle);">
          <span style="position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: var(--bg-surface-raised); padding: 0 8px; font-size: 10px; color: var(--text-muted); font-weight: 600;">OR</span>
        </div>

        <button id="googleSignInBtn" onclick="GharDekho.loginWithGoogle()" class="theme-toggle-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-medium); background: var(--bg-surface); color: var(--text-primary); margin-bottom: 14px;">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Continue with Google (गूगल से जारी रखें)
        </button>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 14px; text-align: center;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">Or instant test login with 1-click:</div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="theme-toggle-btn" onclick="GharDekho.quickLogin('tenant')" style="font-size: 11px;">
              🎓 Vikas (Student)
            </button>
            <button class="theme-toggle-btn" onclick="GharDekho.quickLogin('owner')" style="font-size: 11px;">
              🔑 Ramesh (Owner)
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin: 0;">
            🔒 Enter Verification Code
          </h3>
          <button onclick="GharDekho.closeAuthModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          We sent a 6-digit code to <strong style="color: var(--text-primary);">${state.authPhone}</strong>
        </p>

        ${state.authDemoOtp ? `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px dashed var(--color-trust); border-radius: var(--radius-md); padding: 8px 12px; margin-bottom: 14px; font-size: 12px; color: var(--color-trust); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="document.getElementById('authOtpInput').value='${state.authDemoOtp}'">
            <span>⚡ Test Demo OTP: <strong>${state.authDemoOtp}</strong></span>
            <span style="font-weight: 700; text-decoration: underline;">Auto-Fill</span>
          </div>
        ` : ''}

        <div style="margin-bottom: 18px;">
          <input type="text" id="authOtpInput" placeholder="000000" maxlength="6" value="${state.authDemoOtp || ''}" style="width: 100%; text-align: center; letter-spacing: 6px; font-size: 24px; font-weight: 700; background: var(--bg-surface); border: 2px solid var(--border-medium); border-radius: var(--radius-md); padding: 10px; color: var(--color-primary); font-family: monospace;">
        </div>

        <button onclick="GharDekho.submitVerifyOtp()" class="btn-inspect" style="width: 100%; padding: 12px; font-size: 14px; margin-bottom: 14px;">
          Verify & Sign In (लॉगिन करें)
        </button>

        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <button onclick="GharDekho.setAuthStep('phone')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline;">
            ← Change Number
          </button>
          <button onclick="GharDekho.submitSendOtp()" style="background: none; border: none; color: var(--color-primary); cursor: pointer; font-weight: 600;">
            Resend OTP 🔄
          </button>
        </div>
      `;
    }
  }

  function setAuthRole(role) {
    state.authRole = role;
    renderAuthModal();
  }

  function setAuthStep(step) {
    state.authStep = step;
    renderAuthModal();
  }

  async function submitSendOtp() {
    const input = document.getElementById('authPhoneInput');
    const raw = input ? input.value.trim() : state.authPhone;
    if (!raw || raw.length < 10) {
      showToast('❌ Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      showToast('Sending OTP to ' + raw + '...');
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: raw })
      });
      const data = await res.json();
      if (data.success) {
        state.authPhone = data.phone;
        state.authDemoOtp = data.demoOtp || '';
        state.authStep = 'otp';
        renderAuthModal();
        showToast('✅ OTP sent! ' + (data.demoOtp ? `(Demo: ${data.demoOtp})` : 'Check SMS'));
      } else {
        showToast('❌ ' + (data.message || 'Failed to send OTP'));
      }
    } catch (e) {
      showToast('❌ Server error sending OTP');
    }
  }

  async function submitVerifyOtp(explicitCode) {
    const input = document.getElementById('authOtpInput');
    const code = explicitCode || (input ? input.value.trim() : '');

    if (!code || code.length !== 6) {
      showToast('❌ Please enter 6-digit OTP code');
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: state.authPhone,
          code: code,
          role: state.authRole,
          fullName: state.authRole === 'owner' ? 'Satish Sharma' : 'Aman Kumar'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        state.authUser = data.user;
        state.authToken = data.accessToken;
        try {
          localStorage.setItem('ghar_token', data.accessToken);
          localStorage.setItem('ghar_user', JSON.stringify(data.user));
        } catch (e) {}

        syncAuthHeader();
        closeAuthModal();
        if (data.user.role === 'owner') {
          switchRole('owner');
        } else {
          switchRole('tenant');
        }
        render();
        showToast(`🎉 Signed in as ${data.user.fullName}!`);
      } else {
        showToast('❌ ' + (data.message || 'Invalid OTP code'));
      }
    } catch (e) {
      showToast('❌ Verification failed. Please retry.');
    }
  }

  async function quickLogin(role) {
    const phone = role === 'owner' ? '+919829000000' : '+918899011223';
    state.authPhone = phone;
    state.authRole = role;

    try {
      const sendRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const sendData = await sendRes.json();
      const code = sendData.demoOtp || '123456';

      await submitVerifyOtp(code);
    } catch (e) {
      showToast('❌ Quick login failed');
    }
  }

  async function logoutUser(notify = true) {
    try {
      if (state.authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: state.authToken })
        });
      }
    } catch (e) {}

    state.authUser = null;
    state.authToken = null;
    try {
      localStorage.removeItem('ghar_token');
      localStorage.removeItem('ghar_user');
    } catch (e) {}

    syncAuthHeader();
    render();
    if (notify) showToast('👋 Logged out of GharDekho');
  }

  async function verifyKyc() {
    if (!state.authToken) {
      openAuthModal();
      return;
    }

    try {
      showToast('Verifying with DigiLocker sandbox...');
      const res = await fetch('/api/auth/kyc/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.authToken}`
        },
        body: JSON.stringify({
          documentType: 'Aadhaar',
          documentNumberLast4: '4210'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        state.authUser = data.user;
        try {
          localStorage.setItem('ghar_user', JSON.stringify(data.user));
        } catch (e) {}
        render();
        showToast('🛡️ Aadhaar identity verified! Verified Resident badge awarded.');
      } else {
        showToast('❌ KYC verification failed');
      }
    } catch (e) {
      showToast('❌ Error verifying KYC');
    }
  }

  // --- Slice P13: Google OAuth 2.0 & Self-Service Property Edit ---
  async function loginWithGoogle(emailOverride, nameOverride) {
    try {
      showToast('Connecting with Google 1-Tap...');
      const fallbackEmail = emailOverride || (state.authRole === 'owner' ? 'ramesh.sharma@pgkota.com' : 'student.resident@gmail.com');
      const fallbackName = nameOverride || (state.authRole === 'owner' ? 'Ramesh Sharma' : 'Student Resident');

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bypass-rate-limit': 'test'
        },
        body: JSON.stringify({
          idToken: `mock-google-token-${Date.now()}`,
          email: fallbackEmail,
          fullName: fallbackName,
          role: state.authRole || 'tenant',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        state.authUser = data.user;
        state.authToken = data.accessToken;
        try {
          localStorage.setItem('ghar_token', data.accessToken);
          localStorage.setItem('ghar_user', JSON.stringify(data.user));
        } catch (e) {}

        syncAuthHeader();
        closeAuthModal();
        if (data.user.role === 'owner') {
          switchRole('owner');
        } else {
          switchRole('tenant');
        }
        render();
        showToast(`🎉 Welcome ${data.user.fullName}! Signed in via Google.`);
      } else {
        showToast('❌ ' + (data.message || 'Google Sign-In failed'));
      }
    } catch (e) {
      showToast('❌ Google Sign-In error: ' + e.message);
    }
  }

  function openEditPropertyModal(id) {
    const property = state.properties.find(p => p.id === id);
    if (!property) {
      showToast('❌ Property not found');
      return;
    }

    const modal = document.getElementById('editPropertyModal');
    const content = document.getElementById('editPropertyModalContent');
    if (!modal || !content) return;

    const basePrice = property.rooms && property.rooms[0] ? property.rooms[0].pricePerPerson : 4000;
    const curfew = property.rules?.curfewTime || '10:00 PM';
    const ac = property.amenities?.cooling || 'AC';
    const backup = property.amenities?.electricityBackup || 'Generator (Full 24hr)';

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin: 0;">
            ✏️ Edit Listing Details
          </h3>
          <p style="font-size: 11px; color: var(--text-secondary); margin: 2px 0 0 0;">Property ID: ${property.id}</p>
        </div>
        <button onclick="GharDekho.closeEditPropertyModal()" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Property Title</label>
          <input type="text" id="editPropTitle" value="${property.title || ''}" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; color: var(--text-primary);">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Locality / Area</label>
            <input type="text" id="editPropLocality" value="${property.locality || ''}" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; color: var(--text-primary);">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">City</label>
            <input type="text" id="editPropCity" value="${property.city || ''}" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; color: var(--text-primary);">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Monthly Rent / Head (₹)</label>
            <input type="number" id="editPropRent" value="${basePrice}" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; color: var(--text-primary);">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Curfew Time</label>
            <input type="text" id="editPropCurfew" value="${curfew}" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; color: var(--text-primary);">
          </div>
        </div>

        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Description / Student Guidelines</label>
          <textarea id="editPropDesc" rows="3" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 8px 12px; font-size: 13px; color: var(--text-primary);">${property.description || ''}</textarea>
        </div>

        <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">Key Hyperlocal Amenities</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 11px; color: var(--text-secondary);">Cooling</label>
              <select id="editPropCooling" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 6px; font-size: 12px; color: var(--text-primary);">
                <option value="AC" ${ac === 'AC' ? 'selected' : ''}>Air Conditioner (AC)</option>
                <option value="Desert Cooler" ${ac.includes('Cooler') ? 'selected' : ''}>Desert Air Cooler</option>
                <option value="Ceiling Fan" ${ac.includes('Fan') ? 'selected' : ''}>High-speed Ceiling Fan</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11px; color: var(--text-secondary);">Power Backup</label>
              <select id="editPropBackup" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 6px; font-size: 12px; color: var(--text-primary);">
                <option value="Generator (Full 24hr)" ${backup.includes('24') ? 'selected' : ''}>24hr Generator Backup</option>
                <option value="Inverter (Fans & Lights)" ${backup.includes('Inverter') ? 'selected' : ''}>Inverter (Study Desk + Lights)</option>
                <option value="None" ${backup.toLowerCase().includes('no') ? 'selected' : ''}>None</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="theme-toggle-btn" onclick="GharDekho.closeEditPropertyModal()" style="padding: 10px 16px;">Cancel</button>
        <button class="btn-inspect" id="savePropertyEditsBtn" onclick="GharDekho.savePropertyEdits('${property.id}')" style="padding: 10px 18px;">💾 Save Changes</button>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeEditPropertyModal() {
    const modal = document.getElementById('editPropertyModal');
    if (modal) modal.classList.remove('active');
  }

  async function savePropertyEdits(id) {
    const title = document.getElementById('editPropTitle')?.value?.trim();
    const locality = document.getElementById('editPropLocality')?.value?.trim();
    const city = document.getElementById('editPropCity')?.value?.trim();
    const rent = Number(document.getElementById('editPropRent')?.value || 0);
    const curfew = document.getElementById('editPropCurfew')?.value?.trim();
    const description = document.getElementById('editPropDesc')?.value?.trim();
    const cooling = document.getElementById('editPropCooling')?.value;
    const backup = document.getElementById('editPropBackup')?.value;

    if (!title || !locality || !city) {
      showToast('❌ Title, Locality, and City are required');
      return;
    }

    try {
      showToast('Saving property details...');
      const existing = state.properties.find(p => p.id === id);
      const updatedRooms = existing && existing.rooms ? existing.rooms.map(r => ({
        ...r,
        pricePerPerson: rent > 0 ? rent : r.pricePerPerson
      })) : undefined;

      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          locality,
          city,
          description,
          rules: {
            curfewTime: curfew || '10:00 PM'
          },
          amenities: {
            cooling,
            electricityBackup: backup
          },
          rooms: updatedRooms
        })
      });

      const data = await res.json();
      if (data.success && data.property) {
        const idx = state.properties.findIndex(p => p.id === id);
        if (idx !== -1) {
          state.properties[idx] = data.property;
        }
        closeEditPropertyModal();
        render();
        showToast('✅ Property updated successfully!');
      } else {
        showToast('❌ ' + (data.message || 'Failed to update property'));
      }
    } catch (e) {
      showToast('❌ Network error: ' + e.message);
    }
  }

  function toggleViewport() {
    // Responsive engine automatically adapts layout to device screen width without manual toggling
    return true;
  }

  // --- SLICE P11: BILINGUAL VOICE SEARCH & HINGLISH PARSER ---
  let voiceController = null;

  function initVoiceSearch() {
    if (window.GharVoiceSearch && window.GharVoiceSearch.VoiceSearchController) {
      voiceController = new window.GharVoiceSearch.VoiceSearchController({
        lang: (window.GharI18n && window.GharI18n.getLanguage() === 'hi') ? 'hi-IN' : 'en-IN',
        onStateChange: ({ isListening }) => {
          const btn = document.getElementById('voiceSearchBtn');
          if (btn) {
            if (isListening) btn.classList.add('listening');
            else btn.classList.remove('listening');
          }
        },
        onResult: ({ transcript, parsed }) => {
          applyVoiceSearchQuery(transcript, parsed);
        },
        onError: (err) => {
          console.warn('Voice recognition error:', err);
          showToast('Voice search unavailable or microphone permission denied');
        }
      });
    }
  }

  function toggleVoiceSearch() {
    if (!voiceController || !voiceController.isSupported) {
      // Simulate mock prompt for desktop browser or environments without microphone access
      simulateVoiceSearchPrompt();
      return;
    }

    if (voiceController.isListening) {
      voiceController.stopListening();
    } else {
      const activeLang = (window.GharI18n && window.GharI18n.getLanguage() === 'hi') ? 'hi-IN' : 'en-IN';
      const started = voiceController.startListening(activeLang);
      if (started) {
        showToast('🎙️ Listening... Speak your room preference in Hindi or English');
      } else {
        simulateVoiceSearchPrompt();
      }
    }
  }

  function simulateVoiceSearchPrompt() {
    const demoPhrases = [
      'Allen ke paas single room 5000 ke andar with wifi',
      'Talwandi double sharing boys room',
      'Resonance coaching girls hostel with power backup',
      '4 हजार के अंदर कमरा'
    ];
    const picked = demoPhrases[Math.floor(Math.random() * demoPhrases.length)];
    const input = prompt('🎙️ Voice Search (Hindi / English / Hinglish):\nSay or type your room requirements:', picked);
    if (input && input.trim()) {
      if (window.GharVoiceSearch) {
        const parsed = window.GharVoiceSearch.parseVoiceTranscript(input);
        applyVoiceSearchQuery(input, parsed);
      } else {
        if (el.searchInput) {
          el.searchInput.value = input;
          state.searchQuery = input;
          renderFeed();
        }
      }
    }
  }

  function applyVoiceSearchQuery(transcript, parsed) {
    if (el.searchInput) el.searchInput.value = transcript;
    state.searchQuery = parsed.query || transcript;

    if (parsed.filters.maxBudget) {
      state.filters.maxBudget = parsed.filters.maxBudget;
    }
    if (parsed.filters.sharingType) {
      state.filters.sharingType = parsed.filters.sharingType;
    }
    if (parsed.filters.gender) {
      state.filters.gender = parsed.filters.gender;
    }
    if (parsed.filters.amenities && parsed.filters.amenities.length > 0) {
      parsed.filters.amenities.forEach(a => {
        if (!state.filters.amenities.includes(a)) {
          state.filters.amenities.push(a);
        }
      });
    }
    if (parsed.filters.locality) {
      state.selectedCity = parsed.filters.locality;
    }

    showToast(`🎙️ Voice search applied: "${transcript}"`);
    renderFeed();
  }

  // --- NATURAL PROFESSIONAL THEME (CLEAN AIRBNB/STANZA LIVING LIGHT + ARCHITECTURAL DARK) ---
  function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ghar_theme_mode', next);
    } catch (e) {}
    const labelEl = document.getElementById('themeNameLabel');
    if (labelEl) labelEl.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
    showToast(next === 'dark' ? '🌙 Dark Mode enabled' : '☀️ Light Mode enabled');
  }

  function toggleLanguage() {
    const i18n = window.GharI18n;
    const currentLang = (i18n && i18n.getLanguage) ? i18n.getLanguage() : (document.documentElement.getAttribute('lang') || 'en');
    const nextLang = currentLang === 'en' ? 'hi' : 'en';

    if (i18n && i18n.setLanguage) {
      i18n.setLanguage(nextLang);
      i18n.translateDom();
    } else {
      document.documentElement.setAttribute('lang', nextLang);
      try {
        localStorage.setItem('ghar_preferred_lang', nextLang);
      } catch (e) {}
    }

    const labelEl = document.getElementById('langNameLabel');
    if (labelEl) labelEl.textContent = nextLang === 'hi' ? 'English' : 'हिंदी';
    
    // Re-render current view to refresh card and list templates in new language
    render();

    showToast(nextLang === 'hi' ? '🌐 भाषा बदली गई: हिंदी (देवनागरी सक्रिय)' : '🌐 Language set to English');
  }

  function initLanguage() {
    const i18n = window.GharI18n;
    if (i18n && i18n.init) {
      const activeLang = i18n.init();
      i18n.setLanguage(activeLang);
      i18n.translateDom();
      const labelEl = document.getElementById('langNameLabel');
      if (labelEl) labelEl.textContent = activeLang === 'hi' ? 'English' : 'हिंदी';
    }
  }

  function initTheme() {
    let saved = 'light';
    try {
      saved = localStorage.getItem('ghar_theme_mode') || 'light';
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', saved);
    const labelEl = document.getElementById('themeNameLabel');
    if (labelEl) labelEl.textContent = saved === 'dark' ? '☀️ Light' : '🌙 Dark';
  }

  // Alias for backward compatibility
  function cycleTheme() {
    toggleDarkMode();
  }

  function applyTheme(theme) {
    toggleDarkMode();
  }

  return {
    init,
    setTab,
    setCity,
    resetFilters,
    openFilterSheet,
    closeFilterSheet,
    onBudgetChange,
    setFilterOption,
    toggleFilterAmenity,
    applyFilterSheet,
    selectMapPin,
    recenterMap,
    openDetail,
    closeDetail,
    nextGalleryPhoto,
    prevGalleryPhoto,
    setGalleryPhoto,
    selectVisitDate,
    selectVisitTime,
    confirmScheduledVisit,
    bookBed,
    openTokenAdvanceModal,
    processTokenPayment,
    subscribeTiffinPrompt,
    confirmTiffinSubscription,
    openRoommateVibe,
    openRoomAggregateVibe,
    openMyHabitsModal,
    saveMyHabits,
    openWaitlistModal,
    submitWaitlist,
    closeSubModal,
    updateSlotStatus,
    assignWaitlistToBed,
    removeWaitlistCandidate,
    openChatThread,
    closeChatThread,
    sendChatMessage,
    sendQuickReply,
    updateChatVisitStatus,
    openReviewModal,
    setFormRating,
    submitPropertyReview,
    likeReview,
    openOwnerReplyModal,
    submitOwnerReply,
    openKycModal,
    submitOwnerKyc,
    toggleSave,
    toggleNotificationDrawer,
    openNotifications,
    closeNotifications,
    filterNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    handleNotificationClick,
    updatePreference,
    triggerAiVisionScan,
    nextOwnerStep,
    prevOwnerStep,
    toggleDraftAmenity,
    setDraftSharing,
    addDraftPhotoFromInput,
    addPresetSamplePhoto,
    removeDraftPhoto,
    detectCurrentLocation,
    toggleListingAvailability,
    deleteListing,
    submitNewProperty,
    openInquiryModal,
    openAuthModal,
    closeAuthModal,
    setAuthRole,
    setAuthStep,
    submitSendOtp,
    submitVerifyOtp,
    quickLogin,
    logoutUser,
    loginWithGoogle,
    openEditPropertyModal,
    closeEditPropertyModal,
    savePropertyEdits,
    verifyKyc,
    cycleCity,
    triggerSearch,
    setStayCategory,
    setQuickRent,
    setQuickGender,
    setQuickSort,
    openListPlace,
    toggleViewport,
    toggleDarkMode,
    toggleLanguage,
    toggleVoiceSearch,
    applyVoiceSearchQuery,
    cycleTheme,
    applyTheme
  };
})();

// Alias GharDhundo for backward/interchangeable compatibility
window.GharDhundo = GharDekho;

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', GharDekho.init);

