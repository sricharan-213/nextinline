require('dotenv').config();
require('dotenv').config({ path: '../.env' }); // Fallback if started from backend/ folder
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const applicantsRouter = require('./routes/applicants');
const { startDecayChecker } = require('./services/decayService');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applicants', applicantsRouter);

app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  time: new Date(),
  message: 'NextInLine API running'
}));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ NextInLine API running on port ${PORT}`);
  startDecayChecker();
});
