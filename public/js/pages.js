/**
 * pages.js - Fills in dynamic content for each public page.
 * The page is chosen with <body data-page="...">.
 */
(function () {
  'use strict';
  const S = Store.settings();
  const D = Store.data;
  const esc = Store.esc;
  const $ = (id) => document.getElementById(id);

  const placeholderSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#E2E8F0"/>' +
    '<circle cx="200" cy="155" r="70" fill="#94A3B8"/><path d="M60 400c0-95 62-150 140-150s140 55 140 150z" fill="#94A3B8"/></svg>');

  const pages = {
    home() {
      $('hero-headline').textContent = S.heroHeadline;
      $('hero-sub').textContent = S.heroSubheadline;
      $('hero-name').textContent = S.name;
      $('hero-location').textContent = S.location;
      $('headshot').src = S.headshotUrl || placeholderSvg;
      $('resume-btn').href = S.resumeUrl || '/about';
      $('stats').innerHTML = D.metrics.map((m) =>
        `<div class="stat"><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></div>`).join('');
      $('competencies').innerHTML = D.competencies.map((c) =>
        `<div class="comp"><i class="fa-solid fa-circle-check"></i>${esc(c)}</div>`).join('');
    },

    about() {
      $('about-photo').src = S.aboutImageUrl || placeholderSvg;
      $('about-photo').alt = 'Portrait of ' + S.name;
      // Admin-authored HTML from the rich text editor
      $('about-content').innerHTML = D.pages.about || '<p>Content coming soon.</p>';
    },

    services() {
      const list = [...D.services].sort((a, b) => (a.order || 0) - (b.order || 0));
      $('services-grid').innerHTML = list.length ? list.map((s) => `
        <article class="card service-card">
          <div class="service-icon"><i class="${esc(s.icon || 'fa-solid fa-star')}"></i></div>
          <h3>${esc(s.title)}</h3><p>${esc(s.description)}</p>
        </article>`).join('') : '<p class="empty">No services yet.</p>';
    },

    projects() {
      const excerptOf = (p) => p.excerpt || String(p.description || '').split(/\s+/).slice(0, 50).join(' ');
      const cats = ['All', ...new Set(D.projects.map((p) => p.category).filter(Boolean))];
      const modal = $('project-modal');
      // Only http(s) links are rendered (blocks javascript: URLs)
      const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
      const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
      const linkHtml = (p) => {
        const u = safeUrl(p.projectUrl);
        return u ? `<br><i class="fa-solid fa-link"></i> <a class="project-link" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(hostOf(u))} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '';
      };

      const draw = (cat) => {
        const items = D.projects.filter((p) => cat === 'All' || p.category === cat);
        $('projects-grid').innerHTML = items.length ? items.map((p) => `
          <article class="card project-card">
            <div class="project-img" ${p.imageUrl ? `style="background-image:url('${esc(p.imageUrl)}')"` : ''}>
              ${p.imageUrl ? '' : '<i class="fa-solid fa-diagram-project"></i>'}
              <span class="badge">${esc(p.category)}</span>
            </div>
            <div class="project-body">
              <h3>${esc(p.title)}</h3>
              <p class="meta"><i class="fa-regular fa-calendar"></i> ${esc(p.date)}<br><i class="fa-regular fa-building"></i> ${esc(p.organization)}${linkHtml(p)}</p>
              <p class="excerpt">${esc(excerptOf(p))}</p>
              <button class="btn btn-outline btn-sm" data-id="${esc(p.id)}">Read full details</button>
            </div>
          </article>`).join('') : '<p class="empty">No projects in this category.</p>';
      };

      const open = (p) => {
        const paras = String(p.description || '').split(/\n{2,}/).map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('');
        $('modal-body').innerHTML = `
          ${p.imageUrl ? `<img class="modal-img" src="${esc(p.imageUrl)}" alt="${esc(p.title)}">` : ''}
          <span class="badge badge-static">${esc(p.category)}</span>
          <h2 id="modal-title">${esc(p.title)}</h2>
          <p class="meta"><i class="fa-regular fa-calendar"></i> ${esc(p.date)} &nbsp; <i class="fa-regular fa-building"></i> ${esc(p.organization)}${linkHtml(p)}</p>
          <p class="modal-hook">${esc(excerptOf(p))}</p>
          <h3>About this project</h3>${paras}`;
        modal.hidden = false; document.body.style.overflow = 'hidden'; modal.querySelector('.modal-close').focus();
      };
      const close = () => { modal.hidden = true; document.body.style.overflow = ''; };

      $('projects-grid').addEventListener('click', (e) => {
        const b = e.target.closest('[data-id]'); if (!b) return;
        const p = D.projects.find((x) => x.id === b.dataset.id); if (p) open(p);
      });
      modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.modal-close')) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

      $('filters').innerHTML = cats.map((c, i) => `<button class="filter ${i ? '' : 'active'}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
      $('filters').addEventListener('click', (e) => {
        const b = e.target.closest('.filter'); if (!b) return;
        document.querySelectorAll('.filter').forEach((x) => x.classList.toggle('active', x === b));
        draw(b.dataset.cat);
      });
      draw('All');
    },

    hire() {
      $('c-phone').textContent = S.phone; $('c-phone').href = 'tel:' + S.phone.replace(/\s/g, '');
      $('c-email').textContent = S.email; $('c-email').href = 'mailto:' + S.email;
      $('c-location').textContent = S.location;
      $('c-availability').textContent = S.availability;
      $('why-list').innerHTML = D.whyHire.map((w) => `
        <li><span class="why-icon"><i class="${esc(w.icon || 'fa-solid fa-check')}"></i></span>
        <div><strong>${esc(w.title)}</strong><p>${esc(w.description)}</p></div></li>`).join('');

      const form = $('contact-form'), status = $('form-status');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());
        status.className = 'form-status'; status.textContent = 'Sending...';
        try {
          const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const out = await res.json();
          if (!res.ok || !out.ok) throw new Error(out.error || 'Could not send message.');
          D.messages.unshift({ id: Store.uid(), ...payload, at: new Date().toISOString() });
          Store.save();
          form.reset();
          status.classList.add('ok'); status.textContent = 'Thank you! Your message has been sent.';
        } catch (err) {
          status.classList.add('err'); status.textContent = err.message;
        }
      });
    }
  };

  const fn = pages[document.body.dataset.page];
  if (fn) fn();
})();
