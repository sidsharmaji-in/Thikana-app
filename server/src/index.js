const express = require('express');
const cors = require('cors');
const path = require('path');
const initialProperties = require('./data/seed');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory runtime database initialized from seed data
let properties = [...initialProperties];
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

// 1. GET /api/properties - Filter & Search
app.get('/api/properties', (req, res) => {
  const { city, budgetMax, gender, type, query, lat, lng } = req.query;

  let results = properties.filter(p => p.isAvailable);

  if (city && city.toLowerCase() !== 'all') {
    results = results.filter(p => p.city.toLowerCase() === city.toLowerCase());
  }

  if (gender && gender !== 'any') {
    results = results.filter(p => p.genderPreference === gender || p.genderPreference === 'any');
  }

  if (type && type !== 'all') {
    results = results.filter(p => p.propertyType === type);
  }

  if (budgetMax) {
    const max = Number(budgetMax);
    results = results.filter(p => {
      // Find min price across all rooms
      const minPrice = Math.min(...p.rooms.map(r => r.pricePerPerson));
      return minPrice <= max;
    });
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  // Calculate distance if coordinates provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    results = results.map(p => {
      const distanceKm = getDistanceFromLatLonInKm(userLat, userLng, p.coordinates.lat, p.coordinates.lng);
      return { ...p, distanceKm };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
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
    ...req.body
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

// 4. POST /api/properties/:id/book-slot - Bed / Slot booking
app.post('/api/properties/:id/book-slot', (req, res) => {
  const { roomId, slotId, tenantName, tenantPhone } = req.body;
  const property = properties.find(p => p.id === req.params.id);
  
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
  const room = property.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  const slot = room.slots.find(s => s.slotId === slotId);
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

  if (slot.status !== 'available') {
    return res.status(400).json({ success: false, message: 'Slot is already occupied or reserved' });
  }

  slot.status = 'occupied';
  slot.tenantName = tenantName || 'New Tenant';
  slot.since = new Date().toISOString().split('T')[0];
  room.currentOccupancy = room.slots.filter(s => s.status === 'occupied').length;

  res.json({
    success: true,
    message: `Bed successfully reserved in ${room.label}! Owner notified.`,
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

