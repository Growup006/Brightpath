require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const parentRoutes = require('./routes/parent');
const tutorRoutes = require('./routes/tutor');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env — set one before starting the server.');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY not set — "Ask My Doubts" tutor endpoint will fail.');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/tutor', tutorRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the frontend (built HTML/CSS/JS) so the whole app runs from one server
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`BrightPath server running on http://localhost:${PORT}`);
});
