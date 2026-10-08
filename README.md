# Dictor Abdalla Olame - Portfolio & Admin Dashboard

Responsive portfolio site (HTML5, CSS3, vanilla JS) served by Node.js + Express.
**Storage:** all content and admin edits are kept in the browser's `localStorage` (no MongoDB needed).

## Structure
```
dictor-portfolio/
├── package.json        # express + dotenv
├── .env.example        # PORT=3000
├── src/app.js          # Express server, page routes, /api/contact
└── public/
    ├── index.html  about.html  services.html  projects.html  hire-me.html
    ├── admin/index.html            # login + dashboard (CKEditor 5 via CDN)
    ├── css/styles.css  css/admin.css
    └── js/
        ├── store.js    # localStorage data layer, seed content, PBKDF2 password hashing
        ├── layout.js   # top bar, nav, social bar, WhatsApp button, footer
        ├── pages.js    # fills each public page from stored data
        └── admin.js    # dashboard: settings, about editor, CRUD managers, account
```

## Setup
1. Install Node.js 18+.
2. `cd dictor-portfolio && npm install`
3. (Optional) `cp .env.example .env` and change `PORT`.
4. `npm start` (or `node src/app.js`), then open http://localhost:3000

## Admin
- URL: http://localhost:3000/admin
- Default login: `admin@dictor.local` / `Admin@12345`
- **Change it** under *Account*. Passwords are salted and hashed with PBKDF2 (150k iterations); the session lasts for the browser tab.
- Manage: settings (logo, favicon, headshot, phone, email, socials, hero text), About page (CKEditor), metrics, projects, services, contact messages, backup/reset.

## Test persistence
Admin > Metrics > Edit "Projects Completed" > value `25+` > Save changes, then refresh `/` to see `25+`.

## Important limits of browser storage
- Data is per browser and per origin (`localhost:3000` is separate from other ports/hosts). Other visitors see the seed content, not your edits.
- Clearing site data erases edits. Use *Account > Export JSON* to back up and *Import JSON* to restore.
- Admin auth is client-side, so it protects the dashboard UI but is not true server-side security. For a public deployment, move storage to MongoDB/Mongoose and add server sessions.
- Images uploaded in Settings are stored as data URLs (max 400 KB each); hosted image URLs are preferred.
- CKEditor, Font Awesome and Google Fonts load from CDNs, so internet access is needed for those.
