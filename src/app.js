/**
 * app.js - Express server
 * Serves the static pages from /public and exposes one tiny API endpoint
 * (/api/contact) that validates the contact form. All site content and admin
 * changes live in the visitor's browser localStorage (see public/js/store.js).
 */
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Basic security headers
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

// Clean page routes -> HTML files (declared before static so /admin never redirects)
const pages = {
  '/': 'index.html',
  '/about': 'about.html',
  '/services': 'services.html',
  '/projects': 'projects.html',
  '/hire-me': 'hire-me.html',
  '/admin': 'admin/index.html'
};
Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(PUBLIC_DIR, file)));
});

app.use(express.static(PUBLIC_DIR));

// Contact form endpoint: validates input and logs it to the server console.
// The browser also stores the message in localStorage so the admin can read it.
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const valid = [name, email, message].every(v => typeof v === 'string' && v.trim());
  if (!valid || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Name, valid email and message are required.' });
  }
  console.log(`[contact] ${name} <${email}> - ${subject || 'No subject'}\n${message}\n`);
  res.json({ ok: true });
});

// 404 fallback
app.use((req, res) => res.status(404).send('<h1>404 - Page not found</h1><a href="/">Back home</a>'));

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
