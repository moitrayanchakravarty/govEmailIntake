const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const auth = require('./config/auth');
const { toNodeHandler } = require('better-auth/node');
const { notFound, errorHandler } = require('./middleware/errorHandler');

//const registryRoutes = require('./routes/registryRoutes'); // was commented out — now active

const auditRoutes = require('./routes/auditRoutes');

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// Better Auth's own routes (login, session, etc.) — must come before the
// JSON body parser below, since it reads the raw request body itself.
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

//app.use('/api/registry', registryRoutes); // now actually mounted
app.use('/api/admin', auditRoutes);        // login-logs endpoint lives under here

app.use(notFound);
app.use(errorHandler);

module.exports = app;