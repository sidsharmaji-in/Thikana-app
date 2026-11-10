// GharDekho Main Application Controller (Slice 1 Owner Listing)
const GharDekho = (() => {
  let state = {
    currentRole: 'tenant', // 'tenant' | 'owner'
    activeTab: 'khojo',    // 'khojo' | 'map' | 'saved' | 'inquiries' | 'profile'
    activeCity: 'All',
    activeGender: 'any',
    activeType: 'all',
    searchQuery: '',
    budgetMax: 20000,
    savedIds: new Set(['prop-kota-01']),
    properties: [],
    inquiries: [],
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
    cityPill: document.getElementById('cityPill'),
    searchInput: document.getElementById('searchInput'),
    chipsContainer: document.getElementById('quickChips'),
    contentArea: document.getElementById('appContent'),
    bottomNav: document.getElementById('bottomNav'),
    detailModal: document.getElementById('detailModal'),
    modalContent: document.getElementById('modalContent'),
    toast: document.getElementById('toastMsg')
  };

  // Initialize App
  async function init() {
    setupEventListeners();
    await fetchProperties();
    render();
  }

  // Fetch properties from local API or fallback to seed
  async function fetchProperties() {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.success && data.properties) {
        state.properties = data.properties;
      }
    } catch (e) {
      console.warn('API fetch failed, falling back to local dataset', e);
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

  // Show toast notification
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.style.display = 'block';
    setTimeout(() => {
      el.toast.style.display = 'none';
    }, 3200);
  }

  // Event Listeners
  function setupEventListeners() {
    // Role switchers
    el.roleTenantBtn.addEventListener('click', () => switchRole('tenant'));
    el.roleOwnerBtn.addEventListener('click', () => switchRole('owner'));

    // Search input
    el.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderFeed();
    });

    // Close detail modal on backdrop click
    el.detailModal.addEventListener('click', (e) => {
      if (e.target === el.detailModal) closeDetail();
    });
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
    renderNav();
    render();
    showToast(`Switched to ${role === 'tenant' ? 'Kirayedaar (Tenant)' : 'Makan Maalik (Owner)'} mode`);
  }

  // Render main content area based on role and tab
  function render() {
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
  }

  // Filter properties
  function getFilteredProperties() {
    return state.properties.filter(p => {
      const matchCity = state.activeCity === 'All' || p.city.toLowerCase() === state.activeCity.toLowerCase();
      const matchGender = state.activeGender === 'any' || p.genderPreference === state.activeGender || p.genderPreference === 'any';
      const matchType = state.activeType === 'all' || p.propertyType === state.activeType;
      const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
      const matchBudget = minPrice <= state.budgetMax;
      const matchQuery = !state.searchQuery || 
        p.title.toLowerCase().includes(state.searchQuery) ||
        p.locality.toLowerCase().includes(state.searchQuery) ||
        p.city.toLowerCase().includes(state.searchQuery);

      return matchCity && matchGender && matchType && matchBudget && matchQuery;
    });
  }

  // Render Tenant Feed
  function renderFeed() {
    const list = getFilteredProperties();
    
    let html = `
      <div class="view-mode-bar">
        <span class="results-count">Showing <b>${list.length}</b> verified rooms</span>
        <div class="view-toggle-btns">
          <button class="view-toggle-btn active" onclick="GharDekho.setTab('khojo')">List</button>
          <button class="view-toggle-btn" onclick="GharDekho.setTab('map')">Map</button>
        </div>
      </div>
      <div class="listings-grid">
    `;

    if (list.length === 0) {
      html += `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-secondary);">
          <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">No rooms found in ${state.activeCity}</h3>
          <p style="font-size: 13px;">Try adjusting filters or searching a nearby locality</p>
          <button class="btn-inspect" style="margin-top: 14px;" onclick="GharDekho.resetFilters()">Reset All Filters</button>
        </div>
      `;
    } else {
      list.forEach(p => {
        const isSaved = state.savedIds.has(p.id);
        const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
        
        // Find if this property has shared rooms
        const sharedRoom = p.rooms.find(r => r.maxOccupancy > 1);

        html += `
          <div class="property-card" onclick="GharDekho.openDetail('${p.id}')">
            <div class="card-media">
              <img src="${p.photos[0]}" alt="${p.title}" loading="lazy" />
              <div class="card-badges-top">
                <span class="badge-tag ${p.isVerified ? 'verified' : ''}">
                  ${p.isVerified ? '🛡️ ' + p.verificationBadge : p.propertyType.toUpperCase()}
                </span>
                <button class="heart-btn ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); GharDekho.toggleSave('${p.id}')">
                  ${isSaved ? '❤️' : '🤍'}
                </button>
              </div>
            </div>

            <div class="card-body">
              <div class="card-locality">
                📍 ${p.locality}, ${p.city}
              </div>
              <h3 class="card-title">${p.title}</h3>

              <!-- Indian Specific Highlights -->
              <div class="trust-strip">
                <span class="trust-item alert-water">💧 ${p.amenities.waterSupply}</span>
                <span class="trust-item power-backup">⚡ ${p.amenities.electricityBackup.split(' ')[0]} Backup</span>
                <span class="trust-item">🚿 ${p.amenities.bathroom.split(' ')[0]} Bath</span>
                <span class="trust-item">🛏️ ${p.flooring}</span>
              </div>

              <!-- Live Shared Room Beds Available -->
              ${sharedRoom ? `
                <div class="sharing-slot-bar">
                  <div class="sharing-slot-info">
                    <span style="font-size: 11px; font-weight: 700; color: var(--color-student);">
                      ${sharedRoom.label.split('(')[0]}
                    </span>
                    <span style="font-size: 11px; color: var(--text-muted);">
                      (${sharedRoom.maxOccupancy - sharedRoom.currentOccupancy} of ${sharedRoom.maxOccupancy} Beds Available)
                    </span>
                  </div>
                  <div class="bed-icons-row">
                    ${sharedRoom.slots.map(s => `
                      <span class="bed-icon ${s.status === 'occupied' ? 'occupied' : ''}" title="${s.status === 'occupied' ? 'Occupied' : 'Vacant Bed'}">
                        🛏️
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="card-footer">
                <div class="price-block">
                  <span class="price-amount">₹${minPrice.toLocaleString('en-IN')}</span>
                  <span class="price-sub">per person / month</span>
                </div>
                <button class="btn-inspect">View & Book</button>
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    el.contentArea.innerHTML = html;
  }

  // Render Map View
  function renderMapView() {
    const list = getFilteredProperties();
    el.contentArea.innerHTML = `
      <div class="view-mode-bar">
        <span class="results-count">Showing <b>${list.length}</b> locations on map</span>
        <div class="view-toggle-btns">
          <button class="view-toggle-btn" onclick="GharDekho.setTab('khojo')">List</button>
          <button class="view-toggle-btn active" onclick="GharDekho.setTab('map')">Map</button>
        </div>
      </div>

      <div class="map-container">
        <div class="map-placeholder">
          <div class="map-pin-pulse"></div>
          <h4 style="color: var(--text-primary); margin-bottom: 4px;">Interactive Google Maps View</h4>
          <p style="font-size: 12px; max-width: 280px; margin-bottom: 12px;">
            Showing pinned verified rooms around ${state.activeCity}. Tap any pin to inspect rooms & nearby landmarks.
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
            ${list.map(p => `
              <button class="chip" style="font-size: 11px;" onclick="GharDekho.openDetail('${p.id}')">
                📍 ${p.locality.split(',')[0]} (₹${Math.min(...p.rooms.map(r => r.pricePerPerson))})
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <h4 style="font-size: 14px; margin-bottom: 10px; color: var(--text-primary);">Nearest Listings:</h4>
      <div class="listings-grid">
        ${list.slice(0, 2).map(p => `
          <div class="property-card" onclick="GharDekho.openDetail('${p.id}')" style="margin-bottom: 8px;">
            <div class="card-body">
              <div class="card-locality">📍 ${p.locality}</div>
              <h3 class="card-title" style="font-size: 14px;">${p.title}</h3>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">
                  ₹${Math.min(...p.rooms.map(r => r.pricePerPerson))}/mo
                </span>
                <span style="font-size: 12px; color: var(--color-trust);">Tap to view</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render Detail Bottom Sheet / Modal
  function openDetail(id) {
    const p = state.properties.find(item => item.id === id);
    if (!p) return;
    state.selectedProperty = p;

    const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));

    el.modalContent.innerHTML = `
      <div class="sheet-handle"></div>
      <button class="sheet-close-btn" onclick="GharDekho.closeDetail()">✕</button>

      <div style="margin-bottom: 14px;">
        <span class="badge-tag verified" style="margin-bottom: 6px;">
          🛡️ ${p.verificationBadge}
        </span>
        <h2 style="font-family: var(--font-display); font-size: 20px; line-height: 1.3; color: var(--text-primary);">
          ${p.title}
        </h2>
        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
          📍 ${p.address}
        </div>
      </div>

      <!-- Photo Gallery -->
      <div style="display: flex; gap: 8px; overflow-x: auto; margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden;">
        ${p.photos.map(url => `
          <img src="${url}" style="height: 160px; border-radius: var(--radius-md); object-fit: cover;" alt="Room View" />
        `).join('')}
      </div>

      <!-- Key Stats Bar -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: var(--bg-surface-raised); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px; text-align: center;">
        <div>
          <div style="font-size: 11px; color: var(--text-muted);">Floor</div>
          <div style="font-size: 13px; font-weight: 700;">${p.floor} of ${p.totalFloors} (${p.flooring.split(' ')[0]})</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-muted);">Gender</div>
          <div style="font-size: 13px; font-weight: 700; text-transform: capitalize;">${p.genderPreference} Only</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-muted);">Deposit</div>
          <div style="font-size: 13px; font-weight: 700;">₹${p.depositAmount} (${p.depositMonths} mo)</div>
        </div>
      </div>

      <!-- Split Sharing Rooms & Live Beds -->
      <h3 style="font-size: 15px; font-family: var(--font-display); margin-bottom: 10px;">
        🛏️ Available Room Configurations & Beds
      </h3>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        ${p.rooms.map(room => `
          <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 14px;">${room.label}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${room.areaSqft} sq.ft · ${room.furnishing} furnished · ${room.bathroomType} bath</div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--color-primary);">
                  ₹${room.pricePerPerson.toLocaleString('en-IN')}<span style="font-size: 11px; font-weight: 400; color: var(--text-muted);">/bed</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
              ${room.slots.map(s => `
                <div style="background: ${s.status === 'occupied' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.15)'}; border: 1px solid ${s.status === 'occupied' ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-trust)'}; padding: 6px 10px; border-radius: var(--radius-sm); font-size: 11px; display: flex; align-items: center; gap: 6px;">
                  <span>🛏️ Slot ${s.slotId.toUpperCase()}</span>
                  <span style="font-weight: 700; color: ${s.status === 'occupied' ? '#EF4444' : 'var(--color-trust)'};">
                    ${s.status === 'occupied' ? 'Occupied' : 'Vacant'}
                  </span>
                  ${s.status === 'available' ? `
                    <button style="background: var(--color-trust); border: none; color: #FFF; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer; margin-left: 4px;" onclick="GharDekho.bookBed('${p.id}', '${room.id}', '${s.slotId}')">
                      Book Bed
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Verified Amenities Checklist (20+ Indian specifics) -->
      <h3 style="font-size: 15px; font-family: var(--font-display); margin-bottom: 10px;">
        ✅ Verified Property Amenities
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px; font-size: 12px;">
        <div class="trust-item power-backup">⚡ <b>Power:</b> ${p.amenities.electricityBackup}</div>
        <div class="trust-item alert-water">💧 <b>Water:</b> ${p.amenities.waterSupply}</div>
        <div class="trust-item">⏰ <b>Water Timing:</b> ${p.amenities.waterTiming}</div>
        <div class="trust-item">📶 <b>WiFi:</b> ${p.amenities.wifi}</div>
        <div class="trust-item">❄️ <b>Cooling:</b> ${p.amenities.cooling}</div>
        <div class="trust-item">🚿 <b>Bathroom:</b> ${p.amenities.bathroom}</div>
        <div class="trust-item">🍳 <b>Cooking:</b> ${p.amenities.kitchen}</div>
        <div class="trust-item">🚗 <b>Parking:</b> ${p.amenities.parking}</div>
        <div class="trust-item">🔒 <b>Security:</b> ${p.amenities.security}</div>
        <div class="trust-item">🥘 <b>Tiffin Nearby:</b> ${p.amenities.tiffinNearby ? 'Yes (50m)' : 'Self-cook'}</div>
      </div>

      <!-- Nearby Landmarks (Google Places API integration) -->
      <h3 style="font-size: 15px; font-family: var(--font-display); margin-bottom: 10px;">
        📍 Nearby Places (Distance Verified)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px;">
        ${p.nearbyPlaces.map(place => `
          <div style="display: flex; justify-content: space-between; background: var(--bg-surface-raised); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; border: 1px solid var(--border-subtle);">
            <span>🏢 ${place.name}</span>
            <strong style="color: var(--color-primary);">${place.distance}</strong>
          </div>
        `).join('')}
      </div>

      <!-- Owner Contact Bar -->
      <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <div style="font-size: 11px; color: var(--color-trust); font-weight: 700;">MAKAN MAALIK (OWNER)</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${p.owner.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Response: ${p.owner.responseRate}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="https://wa.me/${p.owner.whatsapp}?text=Namaste, I saw your room listing on GharDekho: ${encodeURIComponent(p.title)}" target="_blank" style="background: #25D366; color: #FFF; text-decoration: none; padding: 8px 12px; border-radius: var(--radius-md); font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
            💬 WhatsApp
          </a>
          <button onclick="GharDekho.openInquiryModal('${p.id}')" class="btn-inspect" style="padding: 8px 12px; font-size: 12px;">
            In-App Inquiry
          </button>
        </div>
      </div>
    `;

    el.detailModal.classList.add('open');
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

  // Toggle Save Property
  function toggleSave(id) {
    if (state.savedIds.has(id)) {
      state.savedIds.delete(id);
      showToast('Removed from saved rooms');
    } else {
      state.savedIds.add(id);
      showToast('❤️ Saved to your shortlisted rooms');
    }
    render();
  }

  // Render Saved Tab
  function renderSaved() {
    const savedList = state.properties.filter(p => state.savedIds.has(p.id));
    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          Shortlisted Rooms (${savedList.length})
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">Your saved rooms with live availability tracking</p>
      </div>
    `;

    if (savedList.length === 0) {
      el.contentArea.innerHTML += `
        <div style="text-align: center; padding: 60px 10px; color: var(--text-secondary);">
          <div style="font-size: 40px; margin-bottom: 10px;">🤍</div>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">No saved rooms yet</h3>
          <p style="font-size: 13px;">Tap the heart icon on any listing to shortlist it for easy comparison</p>
        </div>
      `;
      return;
    }

    let grid = '<div class="listings-grid">';
    savedList.forEach(p => {
      grid += `
        <div class="property-card" onclick="GharDekho.openDetail('${p.id}')">
          <div class="card-body">
            <div class="card-locality">📍 ${p.locality}, ${p.city}</div>
            <h3 class="card-title">${p.title}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <span class="price-amount">₹${Math.min(...p.rooms.map(r => r.pricePerPerson))}/mo</span>
              <button class="btn-inspect">View Details</button>
            </div>
          </div>
        </div>
      `;
    });
    grid += '</div>';
    el.contentArea.innerHTML += grid;
  }

  // Render Inquiries / Chat
  function renderMessages() {
    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          Messages & Scheduled Visits
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">In-app conversations with Makan Maaliks</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: var(--text-primary);">Ramesh Sharma (Talwandi PG)</strong>
            <span style="font-size: 11px; color: var(--color-trust);">Confirmed Visit</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
            "Haan beta, Room 204 me 2 beds khali hai. Kal 11 baje aa jao dekhne."
          </p>
          <div style="font-size: 11px; color: var(--color-primary); font-weight: 600;">
            📅 Scheduled Visit: Tomorrow, 11:00 AM
          </div>
        </div>
      </div>
    `;
  }

  // Render Profile
  function renderProfile() {
    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px; text-align: center; padding-top: 20px;">
        <div style="width: 72px; height: 72px; background: var(--gradient-primary); border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: var(--shadow-glow);">
          👤
        </div>
        <h2 style="font-family: var(--font-display); font-size: 18px; color: var(--text-primary);">
          ${state.currentRole === 'tenant' ? 'Aman Kumar (Student)' : 'Satish Sharma (Property Owner)'}
        </h2>
        <div style="font-size: 12px; color: var(--color-trust); font-weight: 600; margin-top: 2px;">
          🛡️ Aadhaar Verified Resident
        </div>
      </div>

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
          <span style="color: var(--text-muted);">v1.0.0 (Slice 0 Scaffold)</span>
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

              <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
                <button class="chip" style="font-size: 11px; flex: 1; text-align: center; justify-content: center;" onclick="GharDekho.openDetail('${p.id}')">
                  👁️ Preview
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
          <h4 style="margin-bottom: 12px; color: var(--text-primary);">Step 1: Property Identity & Type</h4>
          
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

  // Render Owner Inquiries
  function renderOwnerInquiries() {
    el.contentArea.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">
          Incoming Tenant Inquiries (${state.inquiries.length})
        </h2>
        <p style="font-size: 12px; color: var(--text-secondary);">Direct leads from students and working professionals</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${state.inquiries.map(inq => `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: var(--text-primary); font-size: 15px;">${inq.tenantName}</strong>
              <span class="badge-tag verified">New Lead</span>
            </div>
            <div style="font-size: 11px; color: var(--color-primary); margin-bottom: 6px;">
              Property: ${inq.propertyTitle}
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); background: var(--bg-surface-raised); padding: 8px 10px; border-radius: var(--radius-sm); margin-bottom: 10px;">
              "${inq.message}"
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: var(--text-muted);">📞 ${inq.tenantPhone}</span>
              <button class="btn-inspect" style="padding: 6px 12px; font-size: 11px;" onclick="alert('Calling tenant: ' + '${inq.tenantPhone}')">
                Call Tenant
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render Bottom Nav Tabs based on Role
  function renderNav() {
    if (state.currentRole === 'tenant') {
      el.bottomNav.innerHTML = `
        <button class="nav-item ${state.activeTab === 'khojo' ? 'active' : ''}" onclick="GharDekho.setTab('khojo')">
          <span class="nav-icon">🏠</span>
          <span>Khojo</span>
        </button>
        <button class="nav-item ${state.activeTab === 'map' ? 'active' : ''}" onclick="GharDekho.setTab('map')">
          <span class="nav-icon">🗺️</span>
          <span>Map</span>
        </button>
        <button class="nav-item ${state.activeTab === 'saved' ? 'active' : ''}" onclick="GharDekho.setTab('saved')">
          <span class="nav-icon">❤️</span>
          <span>Saved</span>
        </button>
        <button class="nav-item ${state.activeTab === 'messages' ? 'active' : ''}" onclick="GharDekho.setTab('messages')">
          <span class="nav-icon">💬</span>
          <span>Chat</span>
        </button>
        <button class="nav-item ${state.activeTab === 'profile' ? 'active' : ''}" onclick="GharDekho.setTab('profile')">
          <span class="nav-icon">👤</span>
          <span>Profile</span>
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
          <span class="nav-icon">💬</span>
          <span>Inquiries</span>
        </button>
        <button class="nav-item ${state.activeTab === 'owner_profile' ? 'active' : ''}" onclick="GharDekho.setTab('owner_profile')">
          <span class="nav-icon">👤</span>
          <span>Profile</span>
        </button>
      `;
    }
  }

  function setTab(tab) {
    state.activeTab = tab;
    renderNav();
    render();
  }

  function setCity(city) {
    state.activeCity = city;
    el.cityPill.textContent = '📍 ' + city;
    render();
    showToast(`Filtering rooms in ${city}`);
  }

  function resetFilters() {
    state.activeCity = 'All';
    state.activeGender = 'any';
    state.activeType = 'all';
    state.searchQuery = '';
    el.searchInput.value = '';
    el.cityPill.textContent = '📍 All Cities';
    render();
  }

  function openInquiryModal(propId) {
    const p = state.properties.find(item => item.id === propId);
    const msg = prompt(`Send inquiry to ${p.owner.name}:`, "Namaste Sir, I am interested in this room. Can I schedule a visit?");
    if (!msg) return;

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: propId,
        tenantName: "Pooja Sharma",
        tenantPhone: "+91 99887 76655",
        message: msg
      })
    }).then(() => {
      showToast('Inquiry sent! Owner will reply within 15 mins.');
      closeDetail();
    });
  }

  function toggleViewport() {
    el.shell.classList.toggle('mode-wide');
    const isWide = el.shell.classList.contains('mode-wide');
    document.getElementById('viewportBtn').textContent = isWide ? '📱 Mobile' : '💻 Wide';
  }

  return {
    init,
    setTab,
    setCity,
    resetFilters,
    openDetail,
    closeDetail,
    bookBed,
    toggleSave,
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
    toggleViewport
  };
})();

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', GharDekho.init);

