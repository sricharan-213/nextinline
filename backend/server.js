require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const companiesRouter = require('./routes/companies');
const jobsRouter = require('./routes/jobs');
const applicantsRouter = require('./routes/applicants');
const { startDecayChecker } = require('./services/decayService');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/companies', companiesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applicants', applicantsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startDecayChecker(); // starts the 30-second polling loop
});

module.exports = app;
