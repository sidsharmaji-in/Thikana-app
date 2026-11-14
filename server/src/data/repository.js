// GharDekho Data Repository Layer (Slice P1 Architecture)
// Encapsulates in-memory mock and future Prisma/PostGIS database adapter

const initialProperties = require('./seed');

let properties = JSON.parse(JSON.stringify(initialProperties));

let inquiries = [
  {
    id: "inq-101",
    propertyId: "prop-kota-01",
    propertyTitle: "Saraswati PG & Study Rooms (Boys)",
    ownerId: "owner-sharma",
    ownerName: "Ramesh Sharma (Ex-Teacher)",
    ownerPhone: "+91 98290 XXXXX",
    tenantName: "Vikas Meena",
    tenantPhone: "+91 88990 11223",
    status: "confirmed",
    scheduledVisitDate: "Tomorrow, 11:00 AM",
    createdAt: "2026-11-10T10:00:00.000Z",
    lastMessageAt: "2026-11-10T10:15:00.000Z",
    unreadCountTenant: 1,
    unreadCountOwner: 0,
    messages: [
      {
        id: "msg-101-1",
        senderRole: "tenant",
        senderName: "Vikas Meena",
        text: "Namaste Sir, I am preparing for NEET 2027 at Allen. Is slot 3 still available in Room 204? Can I visit tomorrow at 11 AM?",
        timestamp: "2026-11-10T10:00:00.000Z",
        isRead: true
      },
      {
        id: "msg-101-2",
        senderRole: "owner",
        senderName: "Ramesh Sharma",
        text: "Haan Vikas beta, slot 3 is vacant. You can visit at 11 AM tomorrow. I am on the premises to show you the study desk and room.",
        timestamp: "2026-11-10T10:08:00.000Z",
        isRead: true
      },
      {
        id: "msg-101-3",
        senderRole: "system",
        senderName: "GharDekho Concierge",
        text: "📅 Room Visit Confirmed for Tomorrow at 11:00 AM. Location: Plot 42-B, Sector 2, Talwandi.",
        timestamp: "2026-11-10T10:10:00.000Z",
        isRead: true
      },
      {
        id: "msg-101-4",
        senderRole: "owner",
        senderName: "Ramesh Sharma",
        text: "Also please bring your Allen ID card along for visitor entry register.",
        timestamp: "2026-11-10T10:15:00.000Z",
        isRead: false
      }
    ]
  }
];

let reviews = [
  {
    id: "rev-201",
    propertyId: "prop-kota-01",
    tenantName: "Vikas Meena",
    tenantPhone: "+91 88990 11223",
    rating: 5,
    title: "Best study environment for NEET aspirants in Talwandi",
    comment: "The 24hr generator power backup was a lifesaver during peak Kota summer. Ramesh Sir treats us like his own children. Quiet study desk in Room 204 with ergonomic chair made studying 12 hours easy.",
    isVerifiedTenant: true,
    stayDurationMonths: 6,
    likesCount: 16,
    createdAt: "2026-10-15T12:00:00.000Z",
    ownerResponse: {
      ownerName: "Ramesh Sharma",
      text: "Dhanyawad Vikas beta! We wish you all the very best for NEET 2027. Study hard and keep shining!",
      respondedAt: "2026-10-16T14:30:00.000Z"
    }
  },
  {
    id: "rev-202",
    propertyId: "prop-kota-01",
    tenantName: "Priyansh Mandowara",
    tenantPhone: "+91 97888 44332",
    rating: 4,
    title: "Very clean rooms and uninterrupted RO water",
    comment: "Geyser hot water and RO drinking water are 24x7. The 10:00 PM curfew is strictly monitored by biometric gate, which is actually very reassuring for parents.",
    isVerifiedTenant: true,
    stayDurationMonths: 10,
    likesCount: 9,
    createdAt: "2026-09-20T08:00:00.000Z",
    ownerResponse: null
  },
  {
    id: "rev-203",
    propertyId: "prop-pune-02",
    tenantName: "Ananya Deshmukh",
    tenantPhone: "+91 98220 33445",
    rating: 5,
    title: "Super safe for female software engineers",
    comment: "High speed 200 Mbps fiber made remote work seamless. Swiggy/Zomato reach the 3rd floor easily. Walking distance to Wipro Circle.",
    isVerifiedTenant: true,
    stayDurationMonths: 12,
    likesCount: 24,
    createdAt: "2026-10-02T15:00:00.000Z",
    ownerResponse: {
      ownerName: "Sunita Kulkarni",
      text: "Thank you Ananya! So glad the WiFi was reliable for your tech sprints.",
      respondedAt: "2026-10-03T10:00:00.000Z"
    }
  }
];

let savedProperties = new Set(['prop-kota-01']);

// Slice P2: User & Session Storage
let users = [
  {
    id: "user-tenant-01",
    phone: "+918899011223",
    fullName: "Vikas Meena",
    role: "tenant",
    email: "vikas.meena@allen.in",
    city: "Kota",
    isKycVerified: true,
    aadhaarNumber: "XXXX-XXXX-4210",
    createdAt: "2026-10-01T10:00:00.000Z"
  },
  {
    id: "user-owner-01",
    phone: "+919829000000",
    fullName: "Ramesh Sharma",
    role: "owner",
    email: "ramesh.sharma@pgkota.com",
    city: "Kota",
    isKycVerified: true,
    aadhaarNumber: "XXXX-XXXX-8821",
    createdAt: "2026-09-01T10:00:00.000Z"
  },
  {
    id: "user-admin-01",
    phone: "+919999900000",
    fullName: "Platform Administrator",
    role: "admin",
    email: "admin@ghardekho.in",
    city: "New Delhi",
    isKycVerified: true,
    aadhaarNumber: "XXXX-XXXX-0001",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

const otpStore = new Map();
const refreshTokens = new Map();

let notificationPreferences = {
  whatsappUpdates: true,
  slotVacancyAlerts: true,
  priceDropAlerts: true,
  reviewReplies: true,
  marketingEmails: false
};

let notifications = [
  {
    id: "notif-101",
    recipientRole: "tenant",
    recipientPhone: "+91 98765 43210",
    type: "visit_confirmed",
    title: "Visit Confirmed! 📅",
    body: "Ramesh Sharma confirmed your room visit for Tomorrow at 11:00 AM at Saraswati PG, Talwandi.",
    entityType: "inquiry",
    entityId: "inq-101",
    propertyId: "prop-kota-01",
    createdAt: "2026-11-10T10:10:00.000Z",
    isRead: false,
    priority: "high",
    actionLabel: "View Chat & Pass"
  },
  {
    id: "notif-102",
    recipientRole: "tenant",
    recipientPhone: "+91 98765 43210",
    type: "waitlist_alert",
    title: "Waitlist Alert! Bed Vacancy Opened 🛏️",
    body: "A bed just became available in 4-Bed Split Room at Krishna Boys Residency. Reserve your slot before it is taken!",
    entityType: "property",
    entityId: "prop-kota-01",
    propertyId: "prop-kota-01",
    createdAt: "2026-11-09T18:00:00.000Z",
    isRead: false,
    priority: "high",
    actionLabel: "Reserve Bed Now"
  },
  {
    id: "notif-103",
    recipientRole: "owner",
    recipientPhone: "+91 98290 00000",
    type: "new_inquiry",
    title: "New Student Inquiry Received! 📩",
    body: "Vikas Meena requested a room visit for NEET 2027 preparation.",
    entityType: "inquiry",
    entityId: "inq-101",
    propertyId: "prop-kota-01",
    createdAt: "2026-11-08T11:00:00.000Z",
    isRead: false,
    priority: "normal",
    actionLabel: "Review Inquiry"
  },
  {
    id: "notif-104",
    recipientRole: "tenant",
    recipientPhone: "+91 98765 43210",
    type: "owner_response",
    title: "Makan Maalik Responded to Your Review 💬",
    body: "Ramesh Sharma replied: \"Dhanyawad Vikas beta! We wish you all the very best for NEET 2027.\"",
    entityType: "review",
    entityId: "rev-201",
    propertyId: "prop-kota-01",
    createdAt: "2026-10-16T14:30:00.000Z",
    isRead: true,
    priority: "normal",
    actionLabel: "View Review"
  },
  {
    id: "notif-105",
    recipientRole: "owner",
    recipientPhone: "+91 98290 00000",
    type: "new_review",
    title: "New 5-Star Review Received! ⭐",
    body: "Vikas Meena left a verified review: 'Best PG near Allen Samarth!'",
    entityType: "property",
    entityId: "prop-kota-01",
    propertyId: "prop-kota-01",
    createdAt: "2026-10-15T18:00:00.000Z",
    isRead: true,
    priority: "normal",
    actionLabel: "Reply to Tenant"
  }
];

function createNotification({
  recipientRole = 'tenant',
  recipientPhone = '',
  type = 'general',
  title,
  body,
  entityType = 'property',
  entityId = '',
  propertyId = '',
  actionLabel = 'View Details',
  priority = 'normal'
}) {
  const notif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientRole,
    recipientPhone,
    type,
    title,
    body,
    entityType,
    entityId,
    propertyId,
    createdAt: new Date().toISOString(),
    isRead: false,
    priority,
    actionLabel
  };
  notifications.unshift(notif);
  return notif;
}

// Haversine distance in Kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

// Repository API
const repository = {
  // Properties
  getProperties(query) {
    const { city, budgetMin, budgetMax, gender, type, sharing, query: searchKeyword, lat, lng, radiusKm, amenities, sortBy } = query || {};

    let results = properties.filter(p => p.isAvailable);

    // City filter
    if (city && city.toLowerCase() !== 'all') {
      results = results.filter(p => p.city.toLowerCase() === city.toLowerCase());
    }

    // Gender preference
    if (gender && gender !== 'any') {
      results = results.filter(p => p.genderPreference === gender || p.genderPreference === 'any');
    }

    // Property type
    if (type && type !== 'all') {
      results = results.filter(p => p.propertyType === type);
    }

    // Sharing occupancy (1, 2, 3, 4)
    if (sharing && sharing !== 'all') {
      const sNum = parseInt(sharing, 10);
      results = results.filter(p => p.rooms && p.rooms.some(r => r.maxOccupancy === sNum));
    }

    // Budget range (Min & Max)
    if (budgetMin || budgetMax) {
      const min = budgetMin ? Number(budgetMin) : 0;
      const max = budgetMax ? Number(budgetMax) : Infinity;
      results = results.filter(p => {
        const minRoomPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
        return minRoomPrice >= min && minRoomPrice <= max;
      });
    }

    // Amenity filters
    if (amenities) {
      const amenityList = Array.isArray(amenities) ? amenities : amenities.split(',');
      results = results.filter(p => {
        const a = p.amenities || {};
        return amenityList.every(item => {
          const key = item.trim().toLowerCase();
          if (key === 'wifi') return a.wifi && a.wifi !== 'None';
          if (key === 'ac') return a.cooling === 'AC';
          if (key === 'powerbackup') return a.electricityBackup && !a.electricityBackup.toLowerCase().includes('no');
          if (key === 'water24hr') return a.waterSupply && a.waterSupply.toLowerCase().includes('24');
          if (key === 'attachedbath') return a.bathroom && a.bathroom.toLowerCase().includes('attached');
          if (key === 'singlegirlsafe') return a.singleGirlSafe || p.genderPreference === 'female';
          return true;
        });
      });
    }

    // Keyword search
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase();
      results = results.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.nearbyPlaces && p.nearbyPlaces.some(n => n.name.toLowerCase().includes(q)))
      );
    }

    // Haversine distance
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      results = results.map(p => {
        const distanceKm = getDistanceFromLatLonInKm(userLat, userLng, p.coordinates.lat, p.coordinates.lng);
        return { ...p, distanceKm };
      });

      if (radiusKm) {
        const r = parseFloat(radiusKm);
        results = results.filter(p => p.distanceKm <= r);
      }
    }

    // Sorting
    if (sortBy === 'price_asc') {
      results.sort((a, b) => Math.min(...a.rooms.map(r => r.pricePerPerson)) - Math.min(...b.rooms.map(r => r.pricePerPerson)));
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => Math.min(...b.rooms.map(r => r.pricePerPerson)) - Math.min(...a.rooms.map(r => r.pricePerPerson)));
    } else if (sortBy === 'distance' && lat && lng) {
      results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (sortBy === 'rating') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (lat && lng) {
      results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return results;
  },

  getPropertyById(id) {
    return properties.find(p => p.id === id);
  },

  createProperty(data) {
    const { rooms } = data;
    const processedRooms = rooms.map((r, idx) => {
      const maxOcc = r.maxOccupancy || 1;
      const slots = r.slots && r.slots.length > 0 ? r.slots : Array.from({ length: maxOcc }, (_, sIdx) => ({
        slotId: `s-${idx + 1}-${sIdx + 1}`,
        label: `Bed ${String.fromCharCode(65 + sIdx)}`,
        status: 'available',
        tenantName: null,
        tenantPhone: null,
        since: null,
        roommateProfile: null
      }));

      return {
        ...r,
        id: r.id || `room-${Date.now()}-${idx + 1}`,
        maxOccupancy: maxOcc,
        currentOccupancy: slots.filter(s => s.status === 'occupied').length,
        waitlist: r.waitlist || [],
        slots
      };
    });

    const newProperty = {
      id: `prop-${Date.now()}`,
      isAvailable: true,
      isVerified: true,
      verificationBadge: "Owner Verified Listing",
      createdAt: new Date().toISOString(),
      rating: 5.0,
      reviewsCount: 0,
      rules: {
        curfewTime: data.rules?.curfewTime || "10:00 PM",
        visitorsAllowed: data.rules?.visitorsAllowed || "Lobby only",
        cookingAllowed: data.rules?.cookingAllowed || false,
        smokingAllowed: false,
        ownerOnPremises: data.rules?.ownerOnPremises ?? true
      },
      ...data,
      rooms: processedRooms
    };

    properties.unshift(newProperty);
    return newProperty;
  },

  updateProperty(id, updates = {}) {
    const property = properties.find(p => p.id === id);
    if (!property) return null;

    const allowedFields = [
      'title', 'description', 'city', 'locality', 'coordinates',
      'propertyType', 'genderPreference', 'furnishing', 'photos',
      'nearbyPlaces', 'owner'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        property[field] = updates[field];
      }
    });

    if (updates.rules && typeof updates.rules === 'object') {
      property.rules = {
        ...property.rules,
        ...updates.rules
      };
    }

    if (updates.amenities && typeof updates.amenities === 'object') {
      property.amenities = {
        ...property.amenities,
        ...updates.amenities
      };
    }

    if (Array.isArray(updates.rooms)) {
      property.rooms = updates.rooms.map((r, idx) => {
        const existingRoom = (property.rooms || []).find(er => er.id === r.id);
        const maxOcc = r.maxOccupancy || (existingRoom ? existingRoom.maxOccupancy : 1);
        let slots = r.slots;
        if (!slots || slots.length === 0) {
          slots = existingRoom && existingRoom.slots ? existingRoom.slots : Array.from({ length: maxOcc }, (_, sIdx) => ({
            slotId: `s-${idx + 1}-${sIdx + 1}`,
            label: `Bed ${String.fromCharCode(65 + sIdx)}`,
            status: 'available',
            tenantName: null,
            tenantPhone: null,
            since: null,
            roommateProfile: null
          }));
        }
        return {
          ...(existingRoom || {}),
          ...r,
          id: r.id || (existingRoom ? existingRoom.id : `room-${Date.now()}-${idx + 1}`),
          maxOccupancy: maxOcc,
          currentOccupancy: slots.filter(s => s.status === 'occupied').length,
          slots
        };
      });
    }

    property.updatedAt = new Date().toISOString();
    return property;
  },

  togglePropertyAvailability(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return null;
    property.isAvailable = !property.isAvailable;
    return property;
  },

  deleteProperty(id) {
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) return false;
    properties.splice(index, 1);
    return true;
  },

  verifyOwner(id, { documentType, documentNumberLast4 }) {
    const property = properties.find(p => p.id === id);
    if (!property) return null;

    if (!property.owner) property.owner = {};
    property.owner.isKycDone = true;
    property.owner.verificationStatus = 'verified';
    property.owner.kycDocumentType = documentType;
    property.owner.verificationBadge = 'Aadhaar & Shield Verified Makan Maalik';
    property.owner.verifiedAt = new Date().toISOString();

    return property.owner;
  },

  // Slots & Waitlist
  bookSlot(propertyId, { roomId, slotId, tenantName, tenantPhone, status = 'occupied', roommateProfile }) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return { error: 'PROPERTY_NOT_FOUND' };

    const room = property.rooms.find(r => r.id === roomId);
    if (!room) return { error: 'ROOM_NOT_FOUND' };

    const slot = room.slots.find(s => s.slotId === slotId);
    if (!slot) return { error: 'SLOT_NOT_FOUND' };

    if (slot.status !== 'available') {
      return { error: 'SLOT_UNAVAILABLE' };
    }

    slot.status = status === 'reserved' ? 'reserved' : 'occupied';
    slot.tenantName = tenantName || 'New Tenant';
    slot.tenantPhone = tenantPhone || null;
    slot.since = new Date().toISOString().split('T')[0];
    if (roommateProfile) {
      slot.roommateProfile = roommateProfile;
    }
    room.currentOccupancy = room.slots.filter(s => s.status === 'occupied').length;

    return { slot, room, property };
  },

  updateSlotStatus(propertyId, roomId, slotId, { status, tenantName, tenantPhone, roommateProfile }) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return { error: 'PROPERTY_NOT_FOUND' };

    const room = property.rooms.find(r => r.id === roomId);
    if (!room) return { error: 'ROOM_NOT_FOUND' };

    const slot = room.slots.find(s => s.slotId === slotId);
    if (!slot) return { error: 'SLOT_NOT_FOUND' };

    slot.status = status;
    if (status === 'available') {
      slot.tenantName = null;
      slot.tenantPhone = null;
      slot.since = null;
      slot.roommateProfile = null;
    } else {
      if (tenantName) slot.tenantName = tenantName;
      if (tenantPhone) slot.tenantPhone = tenantPhone;
      if (!slot.since) slot.since = new Date().toISOString().split('T')[0];
      if (roommateProfile !== undefined) slot.roommateProfile = roommateProfile;
    }

    room.currentOccupancy = room.slots.filter(s => s.status === 'occupied').length;
    return { slot, room };
  },

  joinWaitlist(propertyId, roomId, { tenantName, tenantPhone, preferredDate, notes }) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return { error: 'PROPERTY_NOT_FOUND' };

    const room = property.rooms.find(r => r.id === roomId);
    if (!room) return { error: 'ROOM_NOT_FOUND' };

    if (!room.waitlist) room.waitlist = [];

    const entry = {
      id: `wl-${Date.now()}`,
      tenantName: tenantName.trim(),
      tenantPhone: tenantPhone.trim(),
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      notes: notes || 'Awaiting vacant bed notification',
      createdAt: new Date().toISOString()
    };

    room.waitlist.push(entry);
    return { entry, room };
  },

  getWaitlist(propertyId, roomId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return null;

    const room = property.rooms.find(r => r.id === roomId);
    if (!room) return null;

    return room.waitlist || [];
  },

  removeWaitlist(propertyId, roomId, waitlistId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return { error: 'PROPERTY_NOT_FOUND' };

    const room = property.rooms.find(r => r.id === roomId);
    if (!room) return { error: 'ROOM_NOT_FOUND' };

    if (!room.waitlist) room.waitlist = [];
    const idx = room.waitlist.findIndex(w => w.id === waitlistId);
    if (idx === -1) return { error: 'ENTRY_NOT_FOUND' };

    const removed = room.waitlist.splice(idx, 1)[0];
    return { removed };
  },

  assignWaitlist(propertyId, roomId, waitlistId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return { error: 'PROPERTY_NOT_FOUND' };

    const room = property.rooms.find(r => r.id === roomId);
    if (!room) return { error: 'ROOM_NOT_FOUND' };

    if (!room.waitlist) room.waitlist = [];
    const candidateIndex = room.waitlist.findIndex(w => w.id === waitlistId);
    if (candidateIndex === -1) return { error: 'CANDIDATE_NOT_FOUND' };

    const vacantSlot = room.slots.find(s => s.status === 'available');
    if (!vacantSlot) return { error: 'NO_VACANT_SLOT' };

    const candidate = room.waitlist.splice(candidateIndex, 1)[0];
    vacantSlot.status = 'occupied';
    vacantSlot.tenantName = candidate.tenantName;
    vacantSlot.tenantPhone = candidate.tenantPhone;
    vacantSlot.since = new Date().toISOString().split('T')[0];
    room.currentOccupancy = room.slots.filter(s => s.status === 'occupied').length;

    return { candidate, vacantSlot, room };
  },

  // Inquiries & Messages
  createInquiry({ propertyId, tenantName, tenantPhone, message, scheduledVisitDate }) {
    const property = properties.find(p => p.id === propertyId);
    const now = new Date().toISOString();
    const initialMessages = [];

    if (message) {
      initialMessages.push({
        id: `msg-${Date.now()}-1`,
        senderRole: 'tenant',
        senderName: tenantName,
        text: message,
        timestamp: now,
        isRead: false
      });
    }

    if (scheduledVisitDate) {
      initialMessages.push({
        id: `msg-${Date.now()}-2`,
        senderRole: 'system',
        senderName: 'GharDekho Concierge',
        text: `📅 Visit Requested for ${scheduledVisitDate}. Waiting for Makan Maalik confirmation.`,
        timestamp: now,
        isRead: false
      });
    }

    const inquiry = {
      id: `inq-${Date.now()}`,
      propertyId,
      propertyTitle: property ? property.title : 'Rental Property',
      ownerId: property?.owner?.id || 'owner-default',
      ownerName: property?.owner?.name || 'Property Owner',
      ownerPhone: property?.owner?.phone || '+91 98000 00000',
      tenantName,
      tenantPhone: tenantPhone || '',
      message,
      scheduledVisitDate: scheduledVisitDate || null,
      status: 'pending',
      createdAt: now,
      lastMessageAt: now,
      unreadCountTenant: 0,
      unreadCountOwner: initialMessages.length > 0 ? 1 : 0,
      messages: initialMessages
    };

    inquiries.unshift(inquiry);

    createNotification({
      recipientRole: 'owner',
      type: 'new_inquiry',
      title: `New Inquiry from ${tenantName}! 📩`,
      body: `${tenantName} requested a visit for ${property ? property.title : 'your property'}.`,
      entityType: 'inquiry',
      entityId: inquiry.id,
      propertyId: property ? property.id : propertyId,
      priority: 'high',
      actionLabel: 'Open Chat & Reply'
    });

    return inquiry;
  },

  getInquiries(filter) {
    const { phone } = filter || {};
    let results = [...inquiries];
    if (phone) {
      results = results.filter(inq => inq.tenantPhone === phone || inq.ownerPhone.includes(phone));
    }
    return results;
  },

  getInquiryById(id, readerRole) {
    const inquiry = inquiries.find(inq => inq.id === id);
    if (!inquiry) return null;

    if (readerRole === 'tenant') {
      inquiry.unreadCountTenant = 0;
      if (inquiry.messages) {
        inquiry.messages.forEach(m => {
          if (m.senderRole !== 'tenant') m.isRead = true;
        });
      }
    } else if (readerRole === 'owner') {
      inquiry.unreadCountOwner = 0;
      if (inquiry.messages) {
        inquiry.messages.forEach(m => {
          if (m.senderRole !== 'owner') m.isRead = true;
        });
      }
    }

    return inquiry;
  },

  addInquiryMessage(inquiryId, { senderRole, senderName, text }) {
    const inquiry = inquiries.find(inq => inq.id === inquiryId);
    if (!inquiry) return null;

    const role = senderRole === 'owner' ? 'owner' : 'tenant';
    const name = senderName || (role === 'owner' ? inquiry.ownerName : inquiry.tenantName);
    const now = new Date().toISOString();

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderRole: role,
      senderName: name,
      text,
      timestamp: now,
      isRead: false
    };

    if (!inquiry.messages) inquiry.messages = [];
    inquiry.messages.push(newMsg);
    inquiry.lastMessageAt = now;

    if (role === 'tenant') {
      inquiry.unreadCountOwner = (inquiry.unreadCountOwner || 0) + 1;
      createNotification({
        recipientRole: 'owner',
        type: 'new_message',
        title: `New message from ${inquiry.tenantName} 💬`,
        body: text.length > 80 ? text.substring(0, 77) + '...' : text,
        entityType: 'inquiry',
        entityId: inquiry.id,
        propertyId: inquiry.propertyId,
        actionLabel: 'Reply in Chat'
      });
    } else {
      inquiry.unreadCountTenant = (inquiry.unreadCountTenant || 0) + 1;
      createNotification({
        recipientRole: 'tenant',
        type: 'new_message',
        title: `New reply from ${inquiry.ownerName || 'Makan Maalik'} 💬`,
        body: text.length > 80 ? text.substring(0, 77) + '...' : text,
        entityType: 'inquiry',
        entityId: inquiry.id,
        propertyId: inquiry.propertyId,
        actionLabel: 'Open Chat'
      });
    }

    return { newMsg, inquiry };
  },

  updateVisitStatus(inquiryId, { status, scheduledVisitDate, note }) {
    const inquiry = inquiries.find(inq => inq.id === inquiryId);
    if (!inquiry) return null;

    inquiry.status = status;
    if (scheduledVisitDate) {
      inquiry.scheduledVisitDate = scheduledVisitDate;
    }

    const now = new Date().toISOString();
    let statusText = '';
    if (status === 'confirmed') {
      statusText = `📅 Room Visit Confirmed for ${inquiry.scheduledVisitDate || 'the requested time'}! ${note ? `Note: ${note}` : ''}`;
      createNotification({
        recipientRole: 'tenant',
        type: 'visit_confirmed',
        title: 'Room Visit Confirmed! 📅',
        body: `${inquiry.ownerName || 'Makan Maalik'} confirmed your visit for ${inquiry.scheduledVisitDate || 'the requested time'}.`,
        entityType: 'inquiry',
        entityId: inquiry.id,
        propertyId: inquiry.propertyId,
        priority: 'high',
        actionLabel: 'View Schedule & Directions'
      });
    } else if (status === 'rescheduled') {
      statusText = `🔄 Visit Rescheduled to ${scheduledVisitDate || inquiry.scheduledVisitDate}.${note ? ` Note: ${note}` : ''}`;
      createNotification({
        recipientRole: 'tenant',
        type: 'visit_rescheduled',
        title: 'Room Visit Rescheduled 🔄',
        body: `${inquiry.ownerName || 'Makan Maalik'} proposed a new visit time: ${scheduledVisitDate || inquiry.scheduledVisitDate}.`,
        entityType: 'inquiry',
        entityId: inquiry.id,
        propertyId: inquiry.propertyId,
        priority: 'high',
        actionLabel: 'Review New Time'
      });
    } else if (status === 'cancelled') {
      statusText = `❌ Visit Cancelled.${note ? ` Reason: ${note}` : ''}`;
    } else if (status === 'visited') {
      statusText = `✅ Room Inspection Completed. Hope you liked the property!`;
    } else {
      statusText = `⏳ Visit status updated to ${status}.`;
    }

    const sysMsg = {
      id: `msg-${Date.now()}`,
      senderRole: 'system',
      senderName: 'GharDekho Concierge',
      text: statusText.trim(),
      timestamp: now,
      isRead: true
    };

    if (!inquiry.messages) inquiry.messages = [];
    inquiry.messages.push(sysMsg);
    inquiry.lastMessageAt = now;

    return { inquiry, statusText: statusText.trim() };
  },

  // Reviews
  getReviews(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return null;

    const propReviews = reviews.filter(r => r.propertyId === propertyId);
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    propReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    const averageRating = propReviews.length > 0 
      ? Math.round((propReviews.reduce((sum, r) => sum + r.rating, 0) / propReviews.length) * 10) / 10
      : property.rating || 5.0;

    return {
      propertyId,
      averageRating,
      totalReviews: propReviews.length,
      verifiedReviewsCount: propReviews.filter(r => r.isVerifiedTenant).length,
      breakdown,
      reviews: propReviews
    };
  },

  createReview(propertyId, { tenantName, rating, title, comment, tenantPhone, stayDurationMonths, isVerifiedTenant }) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return null;

    const matchingInquiry = inquiries.find(i => 
      i.propertyId === propertyId && 
      (
        (tenantPhone && i.tenantPhone && i.tenantPhone.includes(tenantPhone.slice(-6))) ||
        (i.tenantName && i.tenantName.toLowerCase().includes(tenantName.toLowerCase()))
      )
    );

    const verified = isVerifiedTenant === true || (matchingInquiry && (matchingInquiry.status === 'confirmed' || matchingInquiry.status === 'visited'));

    const newReview = {
      id: `rev-${Date.now()}`,
      propertyId,
      tenantName,
      tenantPhone: tenantPhone || '',
      rating: Number(rating),
      title: title || 'Resident Review',
      comment,
      isVerifiedTenant: Boolean(verified),
      stayDurationMonths: stayDurationMonths ? Number(stayDurationMonths) : 1,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      ownerResponse: null
    };

    reviews.unshift(newReview);

    const propReviews = reviews.filter(r => r.propertyId === propertyId);
    const avg = propReviews.reduce((sum, r) => sum + r.rating, 0) / propReviews.length;
    property.rating = Math.round(avg * 10) / 10;
    property.reviewsCount = propReviews.length;

    createNotification({
      recipientRole: 'owner',
      type: 'new_review',
      title: `New ${rating}★ Review for ${property.title}! ⭐`,
      body: `${tenantName}: "${comment.substring(0, 60)}..."`,
      entityType: 'property',
      entityId: property.id,
      propertyId: property.id,
      actionLabel: 'Reply to Review'
    });

    return { review: newReview, property };
  },

  addOwnerResponse(reviewId, { responseText, ownerName }) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return null;

    review.ownerResponse = {
      ownerName: ownerName || 'Makan Maalik',
      text: responseText,
      respondedAt: new Date().toISOString()
    };

    createNotification({
      recipientRole: 'tenant',
      type: 'owner_response',
      title: `${ownerName || 'Makan Maalik'} Responded to Your Review 💬`,
      body: `"${responseText.trim().substring(0, 75)}..."`,
      entityType: 'review',
      entityId: review.id,
      propertyId: review.propertyId,
      actionLabel: 'View Response'
    });

    return review;
  },

  likeReview(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return null;
    review.likesCount = (review.likesCount || 0) + 1;
    return review.likesCount;
  },

  // Saved Properties
  getSaved() {
    const list = [];
    for (const propId of savedProperties) {
      const property = properties.find(p => p.id === propId);
      if (property) {
        const totalBeds = property.rooms ? property.rooms.reduce((acc, r) => acc + (r.maxOccupancy || 0), 0) : 0;
        const occupiedBeds = property.rooms ? property.rooms.reduce((acc, r) => acc + (r.currentOccupancy || 0), 0) : 0;
        const availableBeds = Math.max(0, totalBeds - occupiedBeds);
        const minPrice = property.rooms && property.rooms.length > 0
          ? Math.min(...property.rooms.map(r => r.pricePerPerson))
          : property.price;

        let occupancyBadge = '🟢 Available';
        let urgencyColor = 'trust';
        if (!property.isAvailable) {
          occupancyBadge = '⚠️ Listing Paused by Owner';
          urgencyColor = 'danger';
        } else if (availableBeds === 0) {
          occupancyBadge = '🛑 Fully Occupied (Waitlist Open)';
          urgencyColor = 'danger';
        } else if (availableBeds <= 2) {
          occupancyBadge = `⚡ Only ${availableBeds} ${availableBeds === 1 ? 'Bed' : 'Beds'} Left!`;
          urgencyColor = 'warning';
        } else {
          occupancyBadge = `🟢 ${availableBeds} Beds Vacant`;
        }

        list.push({
          ...property,
          isSaved: true,
          freshness: {
            isAvailable: property.isAvailable,
            totalBeds,
            occupiedBeds,
            availableBeds,
            occupancyBadge,
            urgencyColor,
            priceFreshness: `₹${minPrice}/mo · Verified Direct Rate`,
            lastChecked: new Date().toISOString()
          }
        });
      } else {
        list.push({
          id: propId,
          title: 'Listing No Longer Available',
          locality: 'Unknown Area',
          city: 'Delisted',
          photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
          isSaved: true,
          isAvailable: false,
          freshness: {
            isAvailable: false,
            occupancyBadge: '⚠️ Listing Removed or Expired',
            urgencyColor: 'danger',
            priceFreshness: 'Archived',
            statusAlert: 'This property has been taken off the market by the owner.'
          }
        });
      }
    }
    return list;
  },

  saveProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return null;
    savedProperties.add(property.id);
    return { propertyId: property.id, savedCount: savedProperties.size };
  },

  removeSavedProperty(id) {
    const existed = savedProperties.has(id);
    savedProperties.delete(id);
    return { existed, savedCount: savedProperties.size };
  },

  // Notifications
  getNotifications(filter) {
    const { role = 'tenant', unreadOnly } = filter || {};
    let list = notifications;
    if (role && role !== 'all') {
      list = list.filter(n => n.recipientRole === role);
    }
    const unreadCount = list.filter(n => !n.isRead).length;
    if (unreadOnly === 'true' || unreadOnly === true) {
      list = list.filter(n => !n.isRead);
    }
    return { list, unreadCount };
  },

  createNotification(data) {
    return createNotification(data);
  },

  markNotificationRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return null;
    notif.isRead = true;
    const roleUnread = notifications.filter(n => n.recipientRole === notif.recipientRole && !n.isRead).length;
    return { notification: notif, unreadCount: roleUnread };
  },

  markAllNotificationsRead(role = 'tenant') {
    let count = 0;
    notifications.forEach(n => {
      if ((role === 'all' || n.recipientRole === role) && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    return count;
  },

  getPreferences() {
    return notificationPreferences;
  },

  updatePreferences(updates) {
    notificationPreferences = {
      ...notificationPreferences,
      ...updates
    };
    return notificationPreferences;
  },

  // Offline Sync
  syncOfflineActions(actions) {
    const results = [];
    for (const act of actions) {
      if (act.type === 'save_property' && act.propertyId) {
        savedProperties.add(act.propertyId);
        results.push({ actionId: act.id, status: 'synced', result: 'saved' });
      } else if (act.type === 'unsave_property' && act.propertyId) {
        savedProperties.delete(act.propertyId);
        results.push({ actionId: act.id, status: 'synced', result: 'unsaved' });
      } else {
        results.push({ actionId: act.id, status: 'skipped', reason: 'unknown action type' });
      }
    }
    return results;
  },

  // Stats
  getStats() {
    const totalBeds = properties.reduce((acc, p) => 
      acc + (p.rooms ? p.rooms.reduce((rAcc, r) => rAcc + r.maxOccupancy, 0) : 0), 0);
    const occupiedBeds = properties.reduce((acc, p) => 
      acc + (p.rooms ? p.rooms.reduce((rAcc, r) => rAcc + r.currentOccupancy, 0) : 0), 0);

    return {
      totalProperties: properties.length,
      activeCities: [...new Set(properties.map(p => p.city))],
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      totalInquiries: inquiries.length
    };
  },

  // Slice P2: Authentication & User Management
  createOrUpdateOtp(phone, code, ttlSeconds = 600) {
    const now = Date.now();
    const existing = otpStore.get(phone) || { requestHistory: [] };

    // Rate limit: max 3 requests in 5 minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentRequests = existing.requestHistory.filter(t => t > fiveMinutesAgo);

    if (recentRequests.length >= 3) {
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP requests for this phone number. Please wait 5 minutes before trying again.'
      };
    }

    recentRequests.push(now);
    const expiresAt = now + ttlSeconds * 1000;

    otpStore.set(phone, {
      code,
      expiresAt,
      attempts: 0,
      requestHistory: recentRequests
    });

    return {
      success: true,
      expiresAt: new Date(expiresAt).toISOString()
    };
  },

  verifyOtp(phone, code) {
    const now = Date.now();
    const record = otpStore.get(phone);

    if (!record) {
      return { success: false, error: 'OTP_NOT_FOUND', message: 'No active OTP found. Please request a new OTP.' };
    }

    if (now > record.expiresAt) {
      otpStore.delete(phone);
      return { success: false, error: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new verification code.' };
    }

    if (record.attempts >= 5) {
      otpStore.delete(phone);
      return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    if (record.code !== code) {
      record.attempts++;
      return {
        success: false,
        error: 'INVALID_OTP',
        message: `Incorrect verification code. ${5 - record.attempts} attempts remaining.`
      };
    }

    // Success: consume OTP so it cannot be re-used
    otpStore.delete(phone);
    return { success: true };
  },

  findUserByPhone(phone) {
    return users.find(u => u.phone === phone) || null;
  },

  findUserById(id) {
    return users.find(u => u.id === id) || null;
  },

  findUserByEmail(email) {
    if (!email) return null;
    const clean = String(email).trim().toLowerCase();
    return users.find(u => u.email && u.email.toLowerCase() === clean) || null;
  },

  findUserByGoogleId(googleId) {
    if (!googleId) return null;
    return users.find(u => u.googleId === googleId) || null;
  },

  createUser({ phone = null, fullName, role = 'tenant', city = 'Kota', email = null, googleId = null, avatarUrl = null }) {
    const newUser = {
      id: `user-${Date.now()}`,
      phone,
      fullName: fullName || 'GharDekho Resident',
      role: role || 'tenant',
      email,
      googleId,
      avatarUrl,
      isEmailVerified: !!googleId,
      city,
      isKycVerified: false,
      aadhaarNumber: null,
      createdAt: new Date().toISOString()
    };
    users.unshift(newUser);
    return newUser;
  },

  updateUser(id, updates = {}) {
    const user = users.find(u => u.id === id);
    if (!user) return null;

    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.city !== undefined) user.city = updates.city;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.googleId !== undefined) user.googleId = updates.googleId;
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.isEmailVerified !== undefined) user.isEmailVerified = updates.isEmailVerified;

    return user;
  },

  storeRefreshToken(token, userId, ttlDays = 7) {
    const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
    refreshTokens.set(token, { userId, expiresAt });
  },

  isValidRefreshToken(token) {
    if (!token || !refreshTokens.has(token)) return false;
    const record = refreshTokens.get(token);
    if (Date.now() > record.expiresAt) {
      refreshTokens.delete(token);
      return false;
    }
    return record;
  },

  revokeRefreshToken(token) {
    return refreshTokens.delete(token);
  },

  setUserKyc(userId, { documentType, documentNumberLast4 }) {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    user.isKycVerified = true;
    user.kycDocumentType = documentType || 'Aadhaar';
    user.aadhaarNumber = `XXXX-XXXX-${documentNumberLast4}`;
    user.kycVerifiedAt = new Date().toISOString();

    return user;
  },

  // Reset helper for clean testing
  _resetState() {
    properties = JSON.parse(JSON.stringify(initialProperties));
    savedProperties = new Set(['prop-kota-01']);
    otpStore.clear();
    refreshTokens.clear();
  }
};

module.exports = repository;
