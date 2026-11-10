# GharDekho 🏠
### Open-Source Rental Marketplace for Students & Working Professionals

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/sidsharmaji/ghardekho/pulls)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)

An open, community-driven rental and student accommodation discovery platform designed to solve student housing fragmentation, eliminate broker exploitation, and provide transparent rental listings across Indian college hubs.

---

## 🌟 Key Features

- **Dual-Role Experience:**
  - **Kirayedaar (Tenant):** Search rooms/PGs, filter by coaching hub, college, or metro station, inspect verified Jal Board timing, power backup status, and live bed occupancy.
  - **Makan Maalik (Owner):** Owner dashboard to manage active properties, post listings via a streamlined 4-step wizard, and receive direct tenant inquiries without intermediary broker charges.
- **Split-Room Sharing Engine:** Real-time tracking of individual bed allocations (e.g., *"Room 204: 4 Beds total — 2 Occupied, 2 Available"*) with instant reservation capabilities.
- **Hyper-Local Indian Realities:**
  - Water supply breakdown (24hr municipal connection vs specific Jal Board supply hours)
  - Power backup verification (Inverter support vs 24x7 Generator)
  - Bathroom configurations (Attached Western vs Common Indian/Western)
  - Nearby tiffin and mess service availability indicators
  - Direct, zero-commission WhatsApp chat integration
- **Interactive Map Mode:** Verified property geolocation pins with walking and transit distance calculations.

---

## 📁 Repository Structure

```
ghardekho/
├── client/             # Mobile-first interactive web application
├── server/             # Node.js + Express REST API with rental listings engine
├── mobile/             # React Native + Expo cross-platform mobile client
└── docs/
    ├── PLAN.md         # Architecture blueprint & development roadmap
    ├── DESIGN.md       # Color tokens, accessibility standards & UI specs
    └── TESTLOG.md      # Testing and validation logs
```

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/sidsharmaji/ghardekho.git
cd ghardekho
```

### 2. Start the Backend API & Web Application
```bash
cd server
npm install
npm start
```
Open [http://localhost:4000](http://localhost:4000) in your browser.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
