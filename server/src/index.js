// GharDekho Server Entry Point (Slice P1 Modular Architecture)
const app = require('./app');
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🏠 GharDekho Server running on http://localhost:${PORT}`);
  console.log(`✨ Mix A+C Design System active (Dark Slate + Saffron Orange)`);
});

module.exports = server;
