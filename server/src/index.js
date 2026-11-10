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
    tenantName: "Vikas Meena",
    tenantPhone: "+91 88990 11223",
    message: "Namaste Sir, I am preparing for NEET 2027 at Allen. Is slot 3 still available in Room 204? Can I visit tomorrow at 11 AM?",
    scheduledVisitDate: "2026-11-12T11:00:00Z",
    status: "pending",
    createdAt: new Date().toISOString()
  }
];
let reviews = [];

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

// 5. POST /api/inquiries - Tenant sends contact / chat lead
app.post('/api/inquiries', (req, res) => {
  const { propertyId, tenantName, tenantPhone, message, scheduledVisitDate } = req.body;
  const property = properties.find(p => p.id === propertyId);
  
  const inquiry = {
    id: `inq-${Date.now()}`,
    propertyId,
    propertyTitle: property ? property.title : 'Rental Property',
    tenantName,
    tenantPhone,
    message,
    scheduledVisitDate: scheduledVisitDate || null,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  inquiries.unshift(inquiry);
  res.status(201).json({ success: true, inquiry });
});

// 6. GET /api/inquiries - Owner retrieves inquiries
app.get('/api/inquiries', (req, res) => {
  res.json({ success: true, count: inquiries.length, inquiries });
});

// 7. GET /api/stats - Platform overview stats
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
