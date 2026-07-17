const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const auth = require('./config/auth');
const { toNodeHandler } = require('better-auth/node');
const { notFound, errorHandler } = require('./middleware/errorHandler');

//const registryRoutes = require('./routes/registryRoutes');
// const authRoutes = require('./routes/authRoutes'); // add once created

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

//app.use('/api/registry', registryRoutes);
// app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;