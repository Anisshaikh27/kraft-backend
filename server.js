require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const aiRoutes = require('./routes/ai');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');

const app = express();

// Basic CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Weblify.AI Backend' });
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;