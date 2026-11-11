const express = require('express');
const cors = require('cors');
const path = require('path');

const securityHeaders = require('./middleware/security');
const propertiesRouter = require('./routes/properties');
const slotsRouter = require('./routes/slots');
const { reviewsRouter, propertyReviewsRouter } = require('./routes/reviews');
const inquiriesRouter = require('./routes/inquiries');
const savedRouter = require('./routes/saved');
const notificationsRouter = require('./routes/notifications');
const syncRouter = require('./routes/sync');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const realtimeRouter = require('./routes/realtime');
const mediaRouter = require('./routes/media');

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(securityHeaders);

// Mount API Route Modules
app.use('/api/auth', authRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/media', mediaRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/properties', slotsRouter);
app.use('/api/properties', propertyReviewsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/saved', savedRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/sync', syncRouter);
app.use('/api', healthRouter);

// Serve Client Static Files and Uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../../client')));

module.exports = app;

