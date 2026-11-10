const express = require('express');
const cors = require('cors');
const path = require('path');
const initialProperties = require('./data/seed');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory runtime database initialized with deep clone from seed data
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
    stayDurationMonths: 4,
    likesCount: 9,
    createdAt: "2026-09-20T10:00:00.000Z",
    ownerResponse: null
  },
  {
    id: "rev-203",
    propertyId: "prop-jaipur-03",
    tenantName: "Pooja Verma",
    tenantPhone: "+91 94140 11223",
    rating: 5,
    title: "Extremely safe for girls, feels like home",
    comment: "Anita Aunty prepares fresh home-cooked satvik food every day. CCTV and warden provide complete peace of mind. MNIT campus is just 10 mins walk.",
    isVerifiedTenant: true,
    stayDurationMonths: 12,
    likesCount: 22,
    createdAt: "2026-08-14T09:00:00.000Z",
    ownerResponse: {
      ownerName: "Anita Gupta",
      text: "Thank you Pooja beta! You will always be a daughter of this home.",
      respondedAt: "2026-08-15T11:00:00.000Z"
    }
  }
];

// Slice 7 Data Stores: Saved Listings & Notification Center
let savedProperties = new Set(['prop-kota-01']);

let notificationPreferences = {
  smsAlerts: true,
  whatsappUpdates: true,
  slotVacancyAlerts: true,
  chatAlerts: true,
  marketingEmails: false
};

const notifications = [
  {
    id: "notif-101",
    recipientRole: "tenant",
    recipientPhone: "+91 98765 43210",
    type: "visit_confirmed",
    title: "Room Visit Confirmed! 📅",
    body: "Ramesh Sharma confirmed your room visit at Krishna Boys Residency for tomorrow at 04:00 PM.",
    entityType: "inquiry",
    entityId: "inq-101",
    propertyId: "prop-kota-01",
    createdAt: "2026-11-10T09:30:00.000Z",
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

// Helper: Haversine distance in Kilometers
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

// 1. GET /api/properties - Filter & Search (Slice 2 Engine)
app.get('/api/properties', (req, res) => {
  const { city, budgetMin, budgetMax, gender, type, sharing, query, lat, lng, radiusKm, amenities, sortBy } = req.query;

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

  // Amenity filters (WiFi, AC, Power Backup, 24hr Water, Attached Bath, Single Girl Safe)
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

  // Search keyword (query)
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.nearbyPlaces && p.nearbyPlaces.some(n => n.name.toLowerCase().includes(q)))
    );
  }

  // Haversine Geospatial distance calculation
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    results = results.map(p => {
      const distanceKm = getDistanceFromLatLonInKm(userLat, userLng, p.coordinates.lat, p.coordinates.lng);
      return { ...p, distanceKm };
    });

    // Optional radius cut-off (e.g. 5km default or custom)
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

  res.json({
    success: true,
    count: results.length,
    properties: results
  });
});

// 2. GET /api/properties/:id - Detail view
app.get('/api/properties/:id', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  res.json({ success: true, property });
});

// 3. POST /api/properties - Owner creates listing (Slice 1 Validation & Creation)
app.post('/api/properties', (req, res) => {
  const { title, city, locality, propertyType, rooms, photos, amenities } = req.body;

  // Strict Validation per Master Plan
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Property title is required' });
  }
  if (!city || !locality) {
    return res.status(400).json({ success: false, message: 'City and Locality are required' });
  }
  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one room configuration is required' });
  }
  if (!photos || !Array.isArray(photos) || photos.length < 3) {
    return res.status(400).json({ success: false, message: 'Minimum 3 photos required for listing verification' });
  }

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
      curfewTime: req.body.rules?.curfewTime || "10:00 PM",
      visitorsAllowed: req.body.rules?.visitorsAllowed || "Lobby only",
      cookingAllowed: req.body.rules?.cookingAllowed || false,
      smokingAllowed: false,
      ownerOnPremises: req.body.rules?.ownerOnPremises ?? true
    },
    ...req.body,
    rooms: processedRooms
  };

  properties.unshift(newProperty);
  res.status(201).json({ success: true, property: newProperty, message: 'Property published successfully!' });
});

// 3a. PUT /api/properties/:id/toggle-availability - Owner toggles listing on/off
app.put('/api/properties/:id/toggle-availability', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  property.isAvailable = !property.isAvailable;
  res.json({
    success: true,
    isAvailable: property.isAvailable,
    message: `Listing is now ${property.isAvailable ? 'Active & Visible' : 'Paused / Occupied'}`
  });
});

// 3b. DELETE /api/properties/:id - Owner removes listing
app.delete('/api/properties/:id', (req, res) => {
  const index = properties.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Property not found' });

  properties.splice(index, 1);
  res.json({ success: true, message: 'Property deleted successfully' });
});

// 4. POST /api/properties/:id/book-slot - Bed / Slot booking (Slice 4 State Lock)
app.post('/api/properties/:id/book-slot', (req, res) => {
  const { roomId, slotId, tenantName, tenantPhone, status = 'occupied', roommateProfile } = req.body;
  const property = properties.find(p => p.id === req.params.id);
  
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
  const room = property.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  const slot = room.slots.find(s => s.slotId === slotId);
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

  if (slot.status !== 'available') {
    return res.status(400).json({ success: false, message: 'Slot is already occupied or reserved' });
  }

  slot.status = status === 'reserved' ? 'reserved' : 'occupied';
  slot.tenantName = tenantName || 'New Tenant';
  slot.tenantPhone = tenantPhone || null;
  slot.since = new Date().toISOString().split('T')[0];
  if (roommateProfile) {
    slot.roommateProfile = roommateProfile;
  }
  room.currentOccupancy = room.slots.filter(s => s.status === 'occupied').length;

  res.json({
    success: true,
    message: `Bed ${slot.label || slot.slotId} successfully ${slot.status === 'reserved' ? 'reserved' : 'booked'} in ${room.label}! Owner notified.`,
    slot,
    room
  });
});

// 4a. PUT /api/properties/:id/rooms/:roomId/slots/:slotId/status - Owner updates slot status
app.put('/api/properties/:id/rooms/:roomId/slots/:slotId/status', (req, res) => {
  const { status, tenantName, tenantPhone, roommateProfile } = req.body;
  const validStatuses = ['available', 'reserved', 'occupied'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be one of: available, reserved, occupied' });
  }

  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
  
  const room = property.rooms.find(r => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  
  const slot = room.slots.find(s => s.slotId === req.params.slotId);
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

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

  res.json({
    success: true,
    message: `Bed ${slot.label || slot.slotId} is now ${status}`,
    slot,
    room
  });
});

// 4b. POST /api/properties/:id/rooms/:roomId/waitlist - Tenant joins waitlist for full room
app.post('/api/properties/:id/rooms/:roomId/waitlist', (req, res) => {
  const { tenantName, tenantPhone, preferredDate, notes } = req.body;
  
  if (!tenantName || !tenantName.trim()) {
    return res.status(400).json({ success: false, message: 'Tenant name is required for waitlist registration' });
  }
  if (!tenantPhone || !tenantPhone.trim()) {
    return res.status(400).json({ success: false, message: 'Contact phone number is required' });
  }

  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const room = property.rooms.find(r => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

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

  res.status(201).json({
    success: true,
    message: `Added to waitlist! You are #${room.waitlist.length} in queue.`,
    waitlistPosition: room.waitlist.length,
    entry,
    roomLabel: room.label
  });
});

// 4c. GET /api/properties/:id/rooms/:roomId/waitlist - View room waitlist
app.get('/api/properties/:id/rooms/:roomId/waitlist', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const room = property.rooms.find(r => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  res.json({
    success: true,
    count: room.waitlist ? room.waitlist.length : 0,
    waitlist: room.waitlist || []
  });
});

// 4d. DELETE /api/properties/:id/rooms/:roomId/waitlist/:waitlistId - Remove from waitlist
app.delete('/api/properties/:id/rooms/:roomId/waitlist/:waitlistId', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const room = property.rooms.find(r => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  if (!room.waitlist) room.waitlist = [];
  const idx = room.waitlist.findIndex(w => w.id === req.params.waitlistId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Waitlist entry not found' });

  const removed = room.waitlist.splice(idx, 1)[0];
  res.json({ success: true, message: 'Candidate removed from waitlist', removed });
});

// 4e. POST /api/properties/:id/rooms/:roomId/waitlist/:waitlistId/assign - Owner assigns waitlisted candidate to vacant bed
app.post('/api/properties/:id/rooms/:roomId/waitlist/:waitlistId/assign', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const room = property.rooms.find(r => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  if (!room.waitlist) room.waitlist = [];
  const candidateIndex = room.waitlist.findIndex(w => w.id === req.params.waitlistId);
  if (candidateIndex === -1) {
    return res.status(404).json({ success: false, message: 'Waitlist candidate not found' });
  }

  // Find first available slot
  const vacantSlot = room.slots.find(s => s.status === 'available');
  if (!vacantSlot) {
    return res.status(400).json({ success: false, message: 'No vacant bed available to assign in this room. Please release a bed first.' });
  }

  const candidate = room.waitlist.splice(candidateIndex, 1)[0];
  vacantSlot.status = 'occupied';
  vacantSlot.tenantName = candidate.tenantName;
  vacantSlot.tenantPhone = candidate.tenantPhone;
  vacantSlot.since = new Date().toISOString().split('T')[0];
  room.currentOccupancy = room.slots.filter(s => s.status === 'occupied').length;

  res.json({
    success: true,
    message: `Bed ${vacantSlot.label || vacantSlot.slotId} assigned to ${candidate.tenantName}!`,
    assignedSlot: vacantSlot,
    candidate,
    room
  });
});

// 5. POST /api/inquiries - Tenant sends contact / chat lead (Slice 5 In-App Chat)
app.post('/api/inquiries', (req, res) => {
  const { propertyId, tenantName, tenantPhone, message, scheduledVisitDate } = req.body;
  const property = properties.find(p => p.id === propertyId);
  
  const now = new Date().toISOString();
  const initialMessages = [];

  if (message && message.trim()) {
    initialMessages.push({
      id: `msg-${Date.now()}-1`,
      senderRole: 'tenant',
      senderName: tenantName || 'Tenant',
      text: message.trim(),
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
    tenantName: tenantName || 'Interested Tenant',
    tenantPhone: tenantPhone || '',
    message: message || '',
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
    title: `New Inquiry from ${tenantName || 'Student'}! 📩`,
    body: `${tenantName || 'A student'} requested a visit for ${property ? property.title : 'your property'}.`,
    entityType: 'inquiry',
    entityId: inquiry.id,
    propertyId: property ? property.id : propertyId,
    priority: 'high',
    actionLabel: 'Open Chat & Reply'
  });

  res.status(201).json({ success: true, inquiry, message: 'Inquiry and chat thread created!' });
});

// 6. GET /api/inquiries - List inquiries / chat threads
app.get('/api/inquiries', (req, res) => {
  const { role, phone } = req.query;
  let results = [...inquiries];

  if (phone) {
    results = results.filter(inq => inq.tenantPhone === phone || inq.ownerPhone.includes(phone));
  }

  res.json({ success: true, count: results.length, inquiries: results });
});

// 6a. GET /api/inquiries/:id - Single chat thread with messages
app.get('/api/inquiries/:id', (req, res) => {
  const inquiry = inquiries.find(inq => inq.id === req.params.id);
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry thread not found' });

  // Mark as read based on reader role
  const { reader } = req.query;
  if (reader === 'tenant') {
    inquiry.unreadCountTenant = 0;
    if (inquiry.messages) {
      inquiry.messages.forEach(m => {
        if (m.senderRole !== 'tenant') m.isRead = true;
      });
    }
  } else if (reader === 'owner') {
    inquiry.unreadCountOwner = 0;
    if (inquiry.messages) {
      inquiry.messages.forEach(m => {
        if (m.senderRole !== 'owner') m.isRead = true;
      });
    }
  }

  res.json({ success: true, inquiry });
});

// 6b. POST /api/inquiries/:id/messages - Send message in chat thread
app.post('/api/inquiries/:id/messages', (req, res) => {
  const { senderRole, senderName, text } = req.body;
  const inquiry = inquiries.find(inq => inq.id === req.params.id);
  
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry thread not found' });
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
  }

  const role = senderRole === 'owner' ? 'owner' : 'tenant';
  const name = senderName || (role === 'owner' ? inquiry.ownerName : inquiry.tenantName);
  const now = new Date().toISOString();

  const newMsg = {
    id: `msg-${Date.now()}`,
    senderRole: role,
    senderName: name,
    text: text.trim(),
    timestamp: now,
    isRead: false
  };

  if (!inquiry.messages) inquiry.messages = [];
  inquiry.messages.push(newMsg);
  inquiry.lastMessageAt = now;

  // Increment unread count for recipient
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

  res.status(201).json({
    success: true,
    message: newMsg,
    inquiry
  });
});

// 6c. PUT /api/inquiries/:id/visit-status - Update scheduled room visit status
app.put('/api/inquiries/:id/visit-status', (req, res) => {
  const { status, scheduledVisitDate, note } = req.body;
  const inquiry = inquiries.find(inq => inq.id === req.params.id);
  
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry thread not found' });
  
  const validStatuses = ['confirmed', 'rescheduled', 'cancelled', 'visited', 'pending'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

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

  res.json({
    success: true,
    message: statusText.trim(),
    status: inquiry.status,
    inquiry
  });
});

// 7. GET /api/properties/:id/reviews - Retrieve property reviews & rating stats (Slice 6)
app.get('/api/properties/:id/reviews', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const propReviews = reviews.filter(r => r.propertyId === req.params.id);
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  propReviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    breakdown[star] = (breakdown[star] || 0) + 1;
  });

  const averageRating = propReviews.length > 0 
    ? Math.round((propReviews.reduce((sum, r) => sum + r.rating, 0) / propReviews.length) * 10) / 10
    : property.rating || 5.0;

  res.json({
    success: true,
    propertyId: req.params.id,
    averageRating,
    totalReviews: propReviews.length,
    verifiedReviewsCount: propReviews.filter(r => r.isVerifiedTenant).length,
    breakdown,
    reviews: propReviews
  });
});

// 7a. POST /api/properties/:id/reviews - Submit resident review
app.post('/api/properties/:id/reviews', (req, res) => {
  const { tenantName, rating, title, comment, tenantPhone, stayDurationMonths, isVerifiedTenant } = req.body;
  const property = properties.find(p => p.id === req.params.id);
  
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  if (!rating || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
  }

  if (!tenantName || !tenantName.trim()) {
    return res.status(400).json({ success: false, message: 'Tenant name is required' });
  }

  if (!comment || comment.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Review comment must be at least 10 characters long' });
  }

  // Check verified tenant status against inquiries
  const matchingInquiry = inquiries.find(i => 
    i.propertyId === req.params.id && 
    (
      (tenantPhone && i.tenantPhone && i.tenantPhone.includes(tenantPhone.slice(-6))) ||
      (i.tenantName && i.tenantName.toLowerCase().includes(tenantName.trim().toLowerCase()))
    )
  );

  const verified = isVerifiedTenant === true || (matchingInquiry && (matchingInquiry.status === 'confirmed' || matchingInquiry.status === 'visited'));

  const newReview = {
    id: `rev-${Date.now()}`,
    propertyId: req.params.id,
    tenantName: tenantName.trim(),
    tenantPhone: tenantPhone || '',
    rating: Number(rating),
    title: title ? title.trim() : 'Resident Review',
    comment: comment.trim(),
    isVerifiedTenant: Boolean(verified),
    stayDurationMonths: stayDurationMonths ? Number(stayDurationMonths) : 1,
    likesCount: 0,
    createdAt: new Date().toISOString(),
    ownerResponse: null
  };

  reviews.unshift(newReview);

  // Recalculate property overall rating
  const propReviews = reviews.filter(r => r.propertyId === req.params.id);
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

  res.status(201).json({
    success: true,
    review: newReview,
    propertyRating: property.rating,
    reviewsCount: property.reviewsCount,
    message: 'Review published successfully!'
  });
});

// 7b. POST /api/reviews/:reviewId/owner-response - Makan Maalik public reply
app.post('/api/reviews/:reviewId/owner-response', (req, res) => {
  const { responseText, ownerName } = req.body;
  const review = reviews.find(r => r.id === req.params.reviewId);
  
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  if (!responseText || !responseText.trim()) {
    return res.status(400).json({ success: false, message: 'Response text cannot be empty' });
  }

  review.ownerResponse = {
    ownerName: ownerName || 'Makan Maalik',
    text: responseText.trim(),
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

  res.json({
    success: true,
    review,
    message: 'Owner response published successfully'
  });
});

// 7c. POST /api/reviews/:reviewId/like - Upvote helpful review
app.post('/api/reviews/:reviewId/like', (req, res) => {
  const review = reviews.find(r => r.id === req.params.reviewId);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  review.likesCount = (review.likesCount || 0) + 1;
  res.json({ success: true, likesCount: review.likesCount });
});

// 7d. POST /api/properties/:id/verify-owner - Submit Aadhaar / Government KYC Verification
app.post('/api/properties/:id/verify-owner', (req, res) => {
  const { documentType, documentNumberLast4 } = req.body;
  const property = properties.find(p => p.id === req.params.id);
  
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
  if (!documentType || !documentNumberLast4) {
    return res.status(400).json({ success: false, message: 'Document type and last 4 digits are required for Aadhaar KYC' });
  }

  if (!property.owner) property.owner = {};
  property.owner.isKycDone = true;
  property.owner.verificationStatus = 'verified';
  property.owner.kycDocumentType = documentType;
  property.owner.verificationBadge = 'Aadhaar & Shield Verified Makan Maalik';
  property.owner.verifiedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Makan Maalik identity verified successfully!',
    owner: property.owner
  });
});

// ==========================================
// SLICE 7: SAVED LISTINGS & NOTIFICATION CENTER
// ==========================================

// 8a. GET /api/saved - Retrieve tenant shortlisted rooms with live freshness
app.get('/api/saved', (req, res) => {
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
      // Soft-deleted or delisted property notice
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

  res.json({
    success: true,
    savedCount: list.length,
    properties: list
  });
});

// 8b. POST /api/saved/:id - Save property to wishlist
app.post('/api/saved/:id', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  savedProperties.add(property.id);
  res.json({
    success: true,
    isSaved: true,
    propertyId: property.id,
    savedCount: savedProperties.size,
    message: '❤️ Room shortlisted to your Saved list!'
  });
});

// 8c. DELETE /api/saved/:id - Remove property from saved list
app.delete('/api/saved/:id', (req, res) => {
  const existed = savedProperties.has(req.params.id);
  savedProperties.delete(req.params.id);

  res.json({
    success: true,
    isSaved: false,
    propertyId: req.params.id,
    savedCount: savedProperties.size,
    message: existed ? 'Removed from your shortlisted rooms' : 'Property was not in saved list'
  });
});

// 8d. GET /api/notifications - Notification center feed
app.get('/api/notifications', (req, res) => {
  const { role = 'tenant', unreadOnly } = req.query;
  
  let list = notifications;
  if (role && role !== 'all') {
    list = list.filter(n => n.recipientRole === role);
  }

  const unreadCount = list.filter(n => !n.isRead).length;

  if (unreadOnly === 'true') {
    list = list.filter(n => !n.isRead);
  }

  res.json({
    success: true,
    count: list.length,
    unreadCount,
    notifications: list
  });
});

// 8e. POST /api/notifications/:id/mark-read - Mark single notification as read
app.post('/api/notifications/:id/mark-read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notif.isRead = true;
  const roleUnread = notifications.filter(n => n.recipientRole === notif.recipientRole && !n.isRead).length;

  res.json({
    success: true,
    notification: notif,
    unreadCount: roleUnread,
    message: 'Notification marked as read'
  });
});

// 8f. POST /api/notifications/mark-all-read - Mark all notifications as read
app.post('/api/notifications/mark-all-read', (req, res) => {
  const { role = 'tenant' } = req.body || {};
  let count = 0;

  notifications.forEach(n => {
    if ((role === 'all' || n.recipientRole === role) && !n.isRead) {
      n.isRead = true;
      count++;
    }
  });

  res.json({
    success: true,
    markedCount: count,
    unreadCount: 0,
    message: 'All notifications marked as read'
  });
});

// 8g. POST /api/notifications/send - Dispatch / trigger new notification
app.post('/api/notifications/send', (req, res) => {
  const { recipientRole, recipientPhone, type, title, body, entityType, entityId, propertyId, actionLabel, priority } = req.body;

  if (!recipientRole || !title || !body) {
    return res.status(400).json({ success: false, message: 'recipientRole, title, and body are required' });
  }

  const notif = createNotification({
    recipientRole,
    recipientPhone,
    type: type || 'general',
    title,
    body,
    entityType,
    entityId,
    propertyId,
    actionLabel,
    priority: priority || 'normal'
  });

  res.status(201).json({
    success: true,
    notification: notif,
    message: 'Notification dispatched successfully'
  });
});

// 8h. GET /api/notifications/preferences - Notification settings
app.get('/api/notifications/preferences', (req, res) => {
  res.json({
    success: true,
    preferences: notificationPreferences
  });
});

// 8i. PUT /api/notifications/preferences - Update notification settings
app.put('/api/notifications/preferences', (req, res) => {
  const updates = req.body || {};
  notificationPreferences = {
    ...notificationPreferences,
    ...updates
  };

  res.json({
    success: true,
    preferences: notificationPreferences,
    message: 'Notification preferences updated successfully'
  });
});

// 8. GET /api/stats - Platform overview stats
app.get('/api/stats', (req, res) => {
  const totalBeds = properties.reduce((acc, p) => 
    acc + p.rooms.reduce((rAcc, r) => rAcc + r.maxOccupancy, 0), 0);
  const occupiedBeds = properties.reduce((acc, p) => 
    acc + p.rooms.reduce((rAcc, r) => rAcc + r.currentOccupancy, 0), 0);

  res.json({
    totalProperties: properties.length,
    activeCities: [...new Set(properties.map(p => p.city))],
    totalBeds,
    occupiedBeds,
    availableBeds: totalBeds - occupiedBeds,
    totalInquiries: inquiries.length
  });
});

// Serve client static files
app.use(express.static(path.join(__dirname, '../../client')));

app.listen(PORT, () => {
  console.log(`🏠 GharDekho Server running on http://localhost:${PORT}`);
  console.log(`✨ Mix A+C Design System active (Dark Slate + Saffron Orange)`);
});
