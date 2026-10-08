/**
 * layout.js - Renders the shared site chrome on every public page:
 * top bar, sticky nav, fixed social bar, WhatsApp button and footer.
 * All values come from Store settings so admin edits show up everywhere.
 */
(function () {
  'use strict';
  const S = Store.settings();
  const esc = Store.esc;
  const path = location.pathname.replace(/\/+$/, '') || '/';

  const nav = [
    ['/', 'Home'], ['/about', 'About Me'], ['/services', 'Services'], ['/projects', 'Projects']
  ];

  const social = [
    ['facebook', 'fa-brands fa-facebook-f', 'Facebook'],
    ['linkedin', 'fa-brands fa-linkedin-in', 'LinkedIn'],
    ['github', 'fa-brands fa-github', 'GitHub'],
    ['twitter', 'fa-brands fa-x-twitter', 'Twitter'],
    ['instagram', 'fa-brands fa-instagram', 'Instagram']
  ];

  const socialLink = (key, icon, label, cls) => S[key]
    ? `<a href="${esc(S[key])}" target="_blank" rel="noopener" aria-label="${label}" class="${cls || ''}"><i class="${icon}"></i></a>` : '';

  const logo = S.logoUrl
    ? `<img src="${esc(S.logoUrl)}" alt="${esc(S.logoText)} logo">`
    : `<span class="logo-mark">${esc((S.logoText || 'D').trim().charAt(0))}</span>`;

  // ----- Header (top bar + nav) -----
  document.getElementById('site-header').innerHTML = `
  <div class="topbar">
    <div class="container topbar-inner">
      <div class="topbar-contact">
        <a href="tel:${esc(S.phone.replace(/\s/g, ''))}"><i class="fa-solid fa-phone"></i> ${esc(S.phone)}</a>
        <a href="mailto:${esc(S.email)}"><i class="fa-solid fa-envelope"></i> <span>${esc(S.email)}</span></a>
      </div>
      <div class="topbar-social">
        ${socialLink('facebook', 'fa-brands fa-facebook-f', 'Facebook')}
        ${socialLink('linkedin', 'fa-brands fa-linkedin-in', 'LinkedIn')}
      </div>
    </div>
  </div>
  <header class="navbar">
    <div class="container nav-inner">
      <a href="/" class="logo">${logo}<span class="logo-text">${esc(S.logoText)}</span></a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
      <nav class="nav-links" id="nav-links">
        ${nav.map(([href, label]) => `<a href="${href}" class="${path === href ? 'active' : ''}">${label}</a>`).join('')}
        <a href="/hire-me" class="btn btn-red nav-cta">Hire Me</a>
      </nav>
    </div>
  </header>`;

  // ----- Fixed social bar (left) + WhatsApp (right) -----
  const floating = document.createElement('div');
  floating.innerHTML = `
  <aside class="social-bar" aria-label="Social links">
    ${social.map(([k, i, l]) => socialLink(k, i, l)).join('')}
  </aside>
  <a class="whatsapp" href="${esc(S.whatsapp || 'https://wa.me/254755803938')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
    <span class="whatsapp-label">Chat on WhatsApp</span><i class="fa-brands fa-whatsapp"></i>
  </a>`;
  document.body.append(...floating.children);

  // ----- Footer (4 columns) -----
  document.getElementById('site-footer').innerHTML = `
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        ${S.footerLogoUrl ? `<img class="footer-logo" src="${esc(S.footerLogoUrl)}" alt="${esc(S.name)} logo">` : `<h4>${esc(S.name)}</h4>`}
        <p>${esc(S.heroHeadline)}</p>
        <div class="footer-social">${social.map(([k, i, l]) => socialLink(k, i, l)).join('')}</div>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul>${nav.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}<li><a href="/hire-me">Hire Me</a></li></ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul class="contact-list">
          <li><i class="fa-solid fa-location-dot"></i> ${esc(S.location)}</li>
          <li><i class="fa-solid fa-phone"></i> ${esc(S.phone)}</li>
          <li><i class="fa-solid fa-envelope"></i> ${esc(S.email)}</li>
        </ul>
      </div>
      <div>
        <h4>Copyright</h4>
        <p>&copy; ${new Date().getFullYear()} ${esc(S.name)}. All rights reserved.</p>
        <p class="muted"><a href="/admin">Admin login</a></p>
      </div>
    </div>
  </footer>`;

  // ----- Document title / favicon -----
  if (S.siteTitle && !('keepTitle' in document.body.dataset)) {
    const page = document.body.dataset.title;
    document.title = page ? `${page} | ${S.name}` : S.siteTitle;
  }
  if (S.faviconUrl) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = S.faviconUrl;
  }

  // ----- Mobile menu toggle -----
  const toggle = document.querySelector('.nav-toggle');
  toggle.addEventListener('click', () => {
    const open = document.getElementById('nav-links').classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
})();
