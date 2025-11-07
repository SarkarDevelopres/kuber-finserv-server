// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./middleware/connectDB'); // must return a Promise!

mongoose.set('bufferCommands', false); // fail fast instead of buffering

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const adminRouter = require('./routes/admin.routes');
const empRouter = require('./routes/employee.routes');

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/employee', empRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// --- DB diagnostics (optional) ---
mongoose.connection.on('error', (e) => console.error('[db] error:', e.message));
mongoose.connection.on('disconnected', () => console.error('[db] disconnected'));

async function main() {
  // 1) Connect to Mongo FIRST
  await connectDB(); // must resolve only when connected
  console.log('[db] connected');

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[boot] fatal:', err);
  process.exit(1);
});
