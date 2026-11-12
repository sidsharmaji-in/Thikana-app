/**
 * GharDekho — Mess & Tiffin Service Management (Slice P10)
 * Hyperlocal student food delivery, daily menu tracking, monthly subscriptions,
 * hygiene auditing (FSSAI compliance), and student review voting.
 */

const { EventEmitter } = require('events');

class MessService extends EventEmitter {
  constructor() {
    super();

    // Default Seeded Mess & Tiffin Centers across Indian Student Hubs
    this.messCenters = [
      {
        id: 'mess-kota-01',
        propertyId: 'prop-kota-01',
        name: 'Annapurna Pure Veg Mess & Tiffin',
        operatorName: 'Sunita & Kailash Choudhary',
        distanceMeters: 60,
        walkingMinutes: 1,
        address: 'Opp. Allen Samarth, Sector 2, Talwandi, Kota',
        phone: '+91 98291 12345',
        fssaiNumber: '22223045000123',
        hygieneRating: 4.8,
        hygieneBadge: 'A+ Verified Clean Kitchen',
        dietType: 'pure_veg',
        cuisine: 'Rajasthani & North Indian Ghar Ka Khana',
        plans: {
          monthlyBothMeals: 3200,
          monthlyLunchOnly: 1800,
          monthlyDinnerOnly: 1800,
          singleThali: 90
        },
        timings: {
          breakfast: '07:30 AM - 09:30 AM',
          lunch: '12:00 PM - 02:30 PM',
          dinner: '07:30 PM - 10:00 PM'
        },
        todayMenu: {
          lunch: {
            main: 'Dal Makhani & Paneer Butter Masala',
            bread: '4 Butter Tawa Rotis (Warm)',
            rice: 'Jeera Rice',
            saladSweet: 'Fresh Cucumber Salad + Gulab Jamun (1 pc)',
            updatedAt: '2026-11-12T11:00:00Z'
          },
          dinner: {
            main: 'Sev Tamatar Ki Sabji & Yellow Moong Dal',
            bread: '4 Phulkas',
            rice: 'Steamed Basmati Rice',
            saladSweet: 'Boondi Raita + Pickle',
            updatedAt: '2026-11-12T17:00:00Z'
          }
        },
        reviews: [
          {
            id: 'mrev-01',
            studentName: 'Aryan S.',
            coaching: 'Allen Samarth',
            rating: 5,
            comment: 'Zero oil floating on dal, exactly like home. Very soft rotis.',
            upvotes: 42,
            verifiedStudent: true,
            createdAt: '2026-10-15T12:00:00Z'
          },
          {
            id: 'mrev-02',
            studentName: 'Harshit G.',
            coaching: 'Allen Leader',
            rating: 4.5,
            comment: 'On time delivery even during heavy rain in Kota. Sunday special kheer is amazing.',
            upvotes: 19,
            verifiedStudent: true,
            createdAt: '2026-10-22T14:30:00Z'
          }
        ],
        tags: ['No Soda 🌿', 'RO Water Cooking 💧', 'Custom Spice Level 🌶️', 'Tiffin Room Delivery 📦']
      },
      {
        id: 'mess-kota-02',
        propertyId: 'prop-kota-01',
        name: 'Maharaja Tiffin & Diet Kitchen',
        operatorName: 'Vikram Singh',
        distanceMeters: 180,
        walkingMinutes: 3,
        address: 'Sector 3 Circle, Talwandi, Kota',
        phone: '+91 94140 55667',
        fssaiNumber: '22224012000889',
        hygieneRating: 4.6,
        hygieneBadge: 'FSSAI Gold Certified',
        dietType: 'pure_veg',
        cuisine: 'Balanced Student Nutrition & Sprouts',
        plans: {
          monthlyBothMeals: 3500,
          monthlyLunchOnly: 2000,
          monthlyDinnerOnly: 2000,
          singleThali: 100
        },
        timings: {
          breakfast: '07:00 AM - 09:30 AM',
          lunch: '11:45 AM - 02:15 PM',
          dinner: '07:00 PM - 09:45 PM'
        },
        todayMenu: {
          lunch: {
            main: 'Rajma Masala & Mix Veg',
            bread: '4 Chapatis',
            rice: 'Steamed Rice',
            saladSweet: 'Green Salad + Buttermilk',
            updatedAt: '2026-11-12T11:15:00Z'
          },
          dinner: {
            main: 'Aloo Gobhi & Chana Dal Fry',
            bread: '4 Rotis',
            rice: 'Pulao',
            saladSweet: 'Curd & Onion',
            updatedAt: '2026-11-12T17:15:00Z'
          }
        },
        reviews: [
          {
            id: 'mrev-03',
            studentName: 'Priyansh M.',
            coaching: 'Resonance',
            rating: 4.5,
            comment: 'Clean tiffins, properly sealed with foil. No stomach issues all year.',
            upvotes: 27,
            verifiedStudent: true,
            createdAt: '2026-09-10T19:00:00Z'
          }
        ],
        tags: ['High Protein Options 💪', 'Disposable Containers', 'Diet Charts 🥗']
      },
      {
        id: 'mess-pune-01',
        propertyId: 'prop-pune-01',
        name: 'Aaji Che Jevan (Home Tiffin)',
        operatorName: 'Mangala Patil',
        distanceMeters: 120,
        walkingMinutes: 2,
        address: 'Lane 4, Near Symbiosis, Viman Nagar, Pune',
        phone: '+91 98810 44321',
        fssaiNumber: '21523088000456',
        hygieneRating: 4.9,
        hygieneBadge: 'Home Cooked Hygienic',
        dietType: 'veg_and_egg',
        cuisine: 'Maharashtrian & Homestyle Meals',
        plans: {
          monthlyBothMeals: 3800,
          monthlyLunchOnly: 2100,
          monthlyDinnerOnly: 2100,
          singleThali: 110
        },
        timings: {
          breakfast: '08:00 AM - 10:00 AM',
          lunch: '12:30 PM - 03:00 PM',
          dinner: '08:00 PM - 10:30 PM'
        },
        todayMenu: {
          lunch: {
            main: 'Pithla & Matki Usal',
            bread: '3 Bhakri / 4 Chapatis',
            rice: 'Varan Bhaat',
            saladSweet: 'Thecha + Koshimbir',
            updatedAt: '2026-11-12T11:30:00Z'
          },
          dinner: {
            main: 'Egg Curry / Paneer Bhurji',
            bread: '4 Chapatis',
            rice: 'Jeera Rice',
            saladSweet: 'Solkadhi',
            updatedAt: '2026-11-12T17:30:00Z'
          }
        },
        reviews: [
          {
            id: 'mrev-04',
            studentName: 'Tanvi J.',
            coaching: 'Symbiosis IT',
            rating: 5,
            comment: 'Best bhakri and authentic taste. Delivery right to the hostel gate.',
            upvotes: 35,
            verifiedStudent: true,
            createdAt: '2026-11-01T13:00:00Z'
          }
        ],
        tags: ['Authentic Homestyle 🍲', 'Flexible Cancel Option 📱', 'Weekly Egg Special 🥚']
      }
    ];

    // Subscriptions store: key = sub_${userId}_${messId}
    this.subscriptions = new Map();
  }

  getAllMessCenters(filters = {}) {
    let list = [...this.messCenters];
    if (filters.propertyId) {
      list = list.filter((m) => m.propertyId === filters.propertyId);
    }
    if (filters.dietType) {
      list = list.filter((m) => m.dietType === filters.dietType);
    }
    if (filters.maxMonthlyPrice) {
      const maxPrice = Number(filters.maxMonthlyPrice);
      if (!isNaN(maxPrice)) {
        list = list.filter((m) => m.plans.monthlyBothMeals <= maxPrice);
      }
    }
    if (filters.maxDistanceMeters) {
      const maxDist = Number(filters.maxDistanceMeters);
      if (!isNaN(maxDist)) {
        list = list.filter((m) => m.distanceMeters <= maxDist);
      }
    }
    return list;
  }

  getMessById(messId) {
    return this.messCenters.find((m) => m.id === messId) || null;
  }

  getMessByPropertyId(propertyId) {
    return this.messCenters.filter((m) => m.propertyId === propertyId);
  }

  createMessCenter(payload) {
    if (!payload.name || !payload.name.trim()) {
      throw new Error('MESS_NAME_REQUIRED');
    }
    if (!payload.propertyId) {
      throw new Error('PROPERTY_ID_REQUIRED');
    }
    if (!payload.plans || !payload.plans.monthlyBothMeals) {
      throw new Error('PRICING_PLANS_REQUIRED');
    }

    const newMess = {
      id: `mess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      propertyId: payload.propertyId,
      name: payload.name.trim(),
      operatorName: payload.operatorName || 'Verified Operator',
      distanceMeters: Number(payload.distanceMeters) || 100,
      walkingMinutes: Math.max(1, Math.round((Number(payload.distanceMeters) || 100) / 75)),
      address: payload.address || 'Hyperlocal Kota Hub',
      phone: payload.phone || '+91 98000 00000',
      fssaiNumber: payload.fssaiNumber || '22223000000000',
      hygieneRating: Number(payload.hygieneRating) || 4.5,
      hygieneBadge: payload.hygieneBadge || 'FSSAI Inspected',
      dietType: payload.dietType || 'pure_veg',
      cuisine: payload.cuisine || 'North Indian Home Meals',
      plans: {
        monthlyBothMeals: Number(payload.plans.monthlyBothMeals),
        monthlyLunchOnly: Number(payload.plans.monthlyLunchOnly || Math.round(payload.plans.monthlyBothMeals * 0.55)),
        monthlyDinnerOnly: Number(payload.plans.monthlyDinnerOnly || Math.round(payload.plans.monthlyBothMeals * 0.55)),
        singleThali: Number(payload.plans.singleThali || 90)
      },
      timings: payload.timings || {
        lunch: '12:00 PM - 02:30 PM',
        dinner: '07:30 PM - 10:00 PM'
      },
      todayMenu: payload.todayMenu || {
        lunch: { main: 'Dal Fry & Sabji', bread: '4 Rotis', rice: 'Jeera Rice' },
        dinner: { main: 'Kadhai Paneer & Dal', bread: '4 Rotis', rice: 'Steamed Rice' }
      },
      reviews: [],
      tags: payload.tags || ['Home Style', 'Hygienic Kitchen']
    };

    this.messCenters.push(newMess);
    this.emit('mess:created', newMess);
    return newMess;
  }

  updateDailyMenu(messId, { mealType, menuData }) {
    const mess = this.getMessById(messId);
    if (!mess) {
      throw new Error('MESS_NOT_FOUND');
    }
    if (mealType !== 'lunch' && mealType !== 'dinner') {
      throw new Error('INVALID_MEAL_TYPE');
    }
    if (!menuData || !menuData.main) {
      throw new Error('MAIN_DISH_REQUIRED');
    }

    mess.todayMenu[mealType] = {
      ...menuData,
      updatedAt: new Date().toISOString()
    };

    this.emit('menu:updated', { messId, mealType, menu: mess.todayMenu[mealType] });
    return mess.todayMenu[mealType];
  }

  addStudentReview(messId, { studentName, coaching, rating, comment }) {
    const mess = this.getMessById(messId);
    if (!mess) {
      throw new Error('MESS_NOT_FOUND');
    }
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('INVALID_RATING_RANGE');
    }
    if (!comment || comment.trim().length < 5) {
      throw new Error('COMMENT_TOO_SHORT');
    }

    const newReview = {
      id: `mrev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentName: studentName || 'Verified Student',
      coaching: coaching || 'Coaching Aspirant',
      rating: numRating,
      comment: comment.trim(),
      upvotes: 1,
      verifiedStudent: true,
      createdAt: new Date().toISOString()
    };

    mess.reviews.unshift(newReview);

    // Recalculate average hygieneRating
    const totalScore = mess.reviews.reduce((sum, r) => sum + r.rating, 0);
    mess.hygieneRating = Math.round((totalScore / mess.reviews.length) * 10) / 10;

    this.emit('review:added', { messId, review: newReview, newAverage: mess.hygieneRating });
    return { review: newReview, hygieneRating: mess.hygieneRating };
  }

  upvoteReview(messId, reviewId) {
    const mess = this.getMessById(messId);
    if (!mess) {
      throw new Error('MESS_NOT_FOUND');
    }
    const review = mess.reviews.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('REVIEW_NOT_FOUND');
    }
    review.upvotes += 1;
    return { reviewId, upvotes: review.upvotes };
  }

  subscribeToTiffin(userId, messId, { planType, deliveryRoom, startDate, durationMonths = 1 }) {
    const mess = this.getMessById(messId);
    if (!mess) {
      throw new Error('MESS_NOT_FOUND');
    }
    if (!['monthlyBothMeals', 'monthlyLunchOnly', 'monthlyDinnerOnly'].includes(planType)) {
      throw new Error('INVALID_PLAN_TYPE');
    }
    if (!deliveryRoom || !deliveryRoom.trim()) {
      throw new Error('DELIVERY_ROOM_REQUIRED');
    }

    const pricePerMonth = mess.plans[planType];
    const totalAmount = pricePerMonth * Number(durationMonths);

    const subscription = {
      id: `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: userId || 'student-guest',
      messId: mess.id,
      messName: mess.name,
      planType,
      monthlyPrice: pricePerMonth,
      totalAmount,
      durationMonths,
      deliveryRoom: deliveryRoom.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscription.id, subscription);
    this.emit('subscription:created', subscription);
    return subscription;
  }

  getSubscription(subscriptionId) {
    return this.subscriptions.get(subscriptionId) || null;
  }
}

module.exports = new MessService();
