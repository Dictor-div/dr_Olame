/**
 * admin.js - Admin dashboard logic.
 * Session = sessionStorage flag set after a successful (PBKDF2-hashed) login.
 * Every save writes to localStorage via Store, so public pages reflect changes on refresh.
 */
(function () {
  'use strict';
  const esc = Store.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const D = () => Store.data;
  let editor = null;

  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ''), 2500);
  }

  /* ---------- Auth ---------- */
  async function init() {
    await Store.ensureUser();
    $('#default-email').textContent = Store.DEFAULT_ADMIN.email;
    if (Store.isLoggedIn()) showDash(); else $('#login-view').hidden = false;
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const ok = await Store.login(f.get('email'), f.get('password'));
    if (ok) { $('#login-view').hidden = true; showDash(); }
    else $('#login-msg').textContent = 'Incorrect email or password.';
  });

  $('#logout').addEventListener('click', () => { Store.logout(); location.reload(); });

  function showDash() {
    $('#dash-view').hidden = false;
    openTab('settings');
  }

  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (b) openTab(b.dataset.tab);
  });

  function openTab(name) {
    if (editor) { editor.destroy().catch(() => {}); editor = null; }
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    const panel = $('#panel'); panel.innerHTML = '';
    ({ settings: tabSettings, about: tabAbout, metrics: tabMetrics, projects: tabProjects,
       services: tabServices, whyhire: tabWhyHire, messages: tabMessages, account: tabAccount }[name])(panel);
  }

  /* ---------- Settings ---------- */
  const settingFields = [
    ['name', 'Full name'], ['logoText', 'Logo text'], ['logoUrl', 'Logo image', 'image'], ['faviconUrl', 'Favicon', 'image'],
    ['headshotUrl', 'Homepage headshot', 'image'], ['aboutImageUrl', 'About page photo (top left)', 'image'], ['footerLogoUrl', 'Footer logo', 'image'], ['siteTitle', 'Site title (browser tab)'],
    ['phone', 'Top-bar phone'], ['email', 'Top-bar email'], ['location', 'Location'], ['whatsapp', 'WhatsApp link'],
    ['facebook', 'Facebook URL'], ['linkedin', 'LinkedIn URL'], ['github', 'GitHub URL'], ['twitter', 'Twitter URL'], ['instagram', 'Instagram URL'],
    ['heroHeadline', 'Hero headline', 'textarea'], ['heroSubheadline', 'Hero subheadline', 'textarea'],
    ['availability', 'Availability (Hire Me page)', 'textarea'], ['resumeUrl', '"View Resume" button link']
  ];

  function tabSettings(p) {
    const S = D().settings;
    p.innerHTML = `<h1>Site settings</h1>
    <form class="card form-grid" id="settings-form">
      ${settingFields.map(([k, label, type]) => `
        <label class="${type === 'textarea' ? 'full' : ''}">${label}
          ${type === 'textarea' ? `<textarea name="${k}" rows="2">${esc(S[k])}</textarea>`
          : type === 'image' ? `<span class="img-row"><input name="${k}" value="${esc(S[k])}" placeholder="https://... or upload"><input type="file" accept="image/*" data-for="${k}"></span>`
          : `<input name="${k}" value="${esc(S[k])}">`}
        </label>`).join('')}
      <label class="full">Core competencies (one per line)
        <textarea name="competencies" rows="8">${esc(D().competencies.join('\n'))}</textarea></label>
      <div class="full note">Uploaded images are stored in this browser (limit ~5 MB total). Prefer small files or hosted URLs.</div>
      <div class="full"><button class="btn primary" type="submit">Save settings</button></div>
    </form>`;

    p.querySelectorAll('input[type=file]').forEach((fi) => fi.addEventListener('change', () => {
      const file = fi.files[0]; if (!file) return;
      if (file.size > 400 * 1024) return toast('Image too large (max 400 KB). Use a URL instead.', true);
      const r = new FileReader();
      r.onload = () => { p.querySelector(`input[name="${fi.dataset.for}"]`).value = r.result; toast('Image loaded - click Save settings'); };
      r.readAsDataURL(file);
    }));

    $('#settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      settingFields.forEach(([k]) => (S[k] = String(f.get(k) || '').trim()));
      D().competencies = String(f.get('competencies')).split('\n').map((s) => s.trim()).filter(Boolean);
      if (Store.save()) toast('Settings saved');
    });
  }

  /* ---------- About page (CKEditor) ---------- */
  function tabAbout(p) {
    p.innerHTML = `<h1>About page editor</h1>
    <div class="card"><textarea id="about-editor"></textarea>
      <div class="row-actions"><button class="btn primary" id="save-about">Save about page</button>
      <a class="btn light" href="/about" target="_blank">Preview</a></div></div>`;
    ClassicEditor.create($('#about-editor'), {
      toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'insertTable', 'undo', 'redo']
    }).then((ed) => { editor = ed; ed.setData(D().pages.about || ''); })
      .catch(() => { p.querySelector('.card').insertAdjacentHTML('afterbegin', '<p class="msg">Editor failed to load (check your internet connection - CKEditor loads from a CDN).</p>'); });
    $('#save-about').addEventListener('click', () => {
      if (!editor) return toast('Editor not ready', true);
      D().pages.about = editor.getData();
      if (Store.save()) toast('About page saved');
    });
  }

  /* ---------- Image upload helper ----------
     Reads a chosen file, scales it down (max 1000px wide) and returns a compressed JPEG data URL
     so it fits comfortably in browser storage. */
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(new Error('Please choose an image file.'));
      if (file.size > 8 * 1024 * 1024) return reject(new Error('Image is larger than 8 MB.'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not open that image.'));
        img.onload = () => {
          const scale = Math.min(1, 1000 / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);   // flatten transparency
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const wordCount = (t) => (String(t).trim() ? String(t).trim().split(/\s+/).length : 0);

  /* ---------- Generic CRUD tab (metrics / projects / services / why hire) ----------
     Field options: type ('text' | 'number' | 'textarea' | 'image'), req, full, rows, maxWords */
  function crud(p, { col, title, fields, columns, sort }) {
    const fieldHtml = (f) => {
      if (f.type === 'image') return `<div class="full upload-field" data-image="${f.name}">
          <span class="label">${f.label}</span>
          <input type="hidden" name="${f.name}">
          <div class="upload-row">
            <div class="upload-preview" data-preview>No image</div>
            <div><input type="file" accept="image/*" data-file>
              <p class="note">JPG, PNG or WebP. It is resized automatically.</p>
              <button type="button" class="btn small light" data-clear hidden>Remove image</button></div>
          </div></div>`;
      const cls = f.full ? 'full' : '';
      if (f.type === 'textarea') return `<label class="${cls}">${f.label}
          <textarea name="${f.name}" rows="${f.rows || 3}" ${f.req ? 'required' : ''} ${f.maxWords ? `data-max-words="${f.maxWords}"` : ''}></textarea>
          ${f.maxWords ? `<span class="counter" data-counter="${f.name}">0 / ${f.maxWords} words</span>` : ''}</label>`;
      return `<label class="${cls}">${f.label}
          <input name="${f.name}" type="${f.type || 'text'}" ${f.req ? 'required' : ''} placeholder="${esc(f.ph || '')}"></label>`;
    };

    p.innerHTML = `<h1>${title}</h1>
    <form class="card form-grid" id="crud-form"><input type="hidden" name="id">
      ${fields.map(fieldHtml).join('')}
      <div class="full row-actions"><button class="btn primary" type="submit" id="crud-save">Add</button>
        <button class="btn light" type="button" id="crud-cancel" hidden>Cancel edit</button></div>
    </form>
    <div class="card table-wrap"><table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}<th>Actions</th></tr></thead><tbody id="crud-body"></tbody></table></div>`;

    const form = $('#crud-form');

    // Refresh image previews and word counters from the current field values
    function syncWidgets() {
      form.querySelectorAll('[data-image]').forEach((box) => {
        const val = form.elements[box.dataset.image].value;
        const prev = box.querySelector('[data-preview]');
        prev.style.backgroundImage = val ? `url("${val}")` : '';
        prev.textContent = val ? '' : 'No image';
        box.querySelector('[data-clear]').hidden = !val;
      });
      form.querySelectorAll('[data-max-words]').forEach((ta) => {
        const n = wordCount(ta.value), max = Number(ta.dataset.maxWords);
        const c = form.querySelector(`[data-counter="${ta.name}"]`);
        c.textContent = `${n} / ${max} words`; c.classList.toggle('over', n > max);
      });
    }

    form.addEventListener('input', syncWidgets);
    form.querySelectorAll('[data-image]').forEach((box) => {
      const hidden = form.elements[box.dataset.image];
      box.querySelector('[data-file]').addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try { hidden.value = await fileToDataUrl(file); syncWidgets(); toast('Image ready - save to keep it'); }
        catch (err) { toast(err.message, true); e.target.value = ''; }
      });
      box.querySelector('[data-clear]').addEventListener('click', () => {
        hidden.value = ''; box.querySelector('[data-file]').value = ''; syncWidgets();
      });
    });

    const reset = () => {
      form.reset(); form.elements['id'].value = '';
      form.querySelectorAll('[data-image] input[type=hidden]').forEach((h) => (h.value = ''));
      $('#crud-save').textContent = 'Add'; $('#crud-cancel').hidden = true; syncWidgets();
    };

    function draw() {
      let rows = [...D()[col]];
      if (sort) rows.sort(sort);
      $('#crud-body').innerHTML = rows.length ? rows.map((r) => `<tr>
        ${columns.map((c) => `<td>${esc(String(r[c.key] ?? '').slice(0, 90))}</td>`).join('')}
        <td><button class="btn small light" data-edit="${r.id}">Edit</button> <button class="btn small danger" data-del="${r.id}">Delete</button></td></tr>`).join('')
        : `<tr><td class="empty" colspan="${columns.length + 1}">Nothing here yet. Use the form above to add one.</td></tr>`;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Enforce word limits (e.g. 50-word project excerpt)
      for (const f of fields.filter((x) => x.maxWords)) {
        if (wordCount(form.elements[f.name].value) > f.maxWords) {
          toast(`${f.label} must be ${f.maxWords} words or fewer.`, true); form.elements[f.name].focus(); return;
        }
      }
      const item = Object.fromEntries(new FormData(form).entries());
      fields.filter((f) => f.type === 'number').forEach((f) => (item[f.name] = Number(item[f.name]) || 0));
      if (!item.id) delete item.id;
      const wasEdit = !!item.id;
      if (Store.upsert(col, item)) { toast(wasEdit ? 'Changes saved' : 'Added'); reset(); draw(); }
    });
    $('#crud-cancel').addEventListener('click', reset);
    $('#crud-body').addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (ed) {
        const r = D()[col].find((x) => x.id === ed.dataset.edit);
        reset();
        Object.keys(r).forEach((k) => { if (form.elements[k]) form.elements[k].value = r[k]; });
        $('#crud-save').textContent = 'Save changes'; $('#crud-cancel').hidden = false;
        syncWidgets(); form.scrollIntoView({ behavior: 'smooth' });
      }
      if (del && confirm('Delete this item? This cannot be undone.')) { Store.remove(col, del.dataset.del); toast('Deleted'); draw(); }
    });
    draw(); syncWidgets();
  }

  const tabMetrics = (p) => crud(p, {
    col: 'metrics', title: 'Homepage metrics',
    fields: [{ name: 'key', label: 'Key (short id)', req: 1, ph: 'projects' }, { name: 'value', label: 'Value', req: 1, ph: '25+' }, { name: 'label', label: 'Label', req: 1, full: 1, ph: 'Projects Completed' }],
    columns: [{ key: 'key', label: 'Key' }, { key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }]
  });

  const tabProjects = (p) => crud(p, {
    col: 'projects', title: 'Projects',
    fields: [
      { name: 'title', label: 'Title', req: 1 }, { name: 'category', label: 'Category', req: 1, ph: 'Education' },
      { name: 'date', label: 'Date', ph: '2026' }, { name: 'organization', label: 'Organization' },
      { name: 'projectUrl', label: 'Project website link (optional, shown beside date and organization)', type: 'url', full: 1, ph: 'https://example.com' },
      { name: 'imageUrl', label: 'Project image (upload)', type: 'image' },
      { name: 'excerpt', label: 'Excerpt - a hook statement (max 50 words)', type: 'textarea', full: 1, req: 1, rows: 3, maxWords: 50 },
      { name: 'description', label: 'Detailed description - what the project is all about (separate paragraphs with a blank line)', type: 'textarea', full: 1, req: 1, rows: 9 }
    ],
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'date', label: 'Date' }, { key: 'organization', label: 'Organization' }]
  });

  const tabServices = (p) => crud(p, {
    col: 'services', title: 'Services',
    fields: [{ name: 'title', label: 'Title', req: 1 }, { name: 'order', label: 'Order', type: 'number', ph: '1' },
      { name: 'icon', label: 'Icon (Font Awesome classes)', full: 1, ph: 'fa-solid fa-briefcase' },
      { name: 'description', label: 'Description', type: 'textarea', full: 1, req: 1 }],
    columns: [{ key: 'order', label: 'Order' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }],
    sort: (a, b) => (a.order || 0) - (b.order || 0)
  });

  const tabWhyHire = (p) => crud(p, {
    col: 'whyHire', title: 'Why hire me (shown on the Hire Me page)',
    fields: [{ name: 'title', label: 'Title', req: 1 }, { name: 'icon', label: 'Icon (Font Awesome classes)', ph: 'fa-solid fa-check' },
      { name: 'description', label: 'Description', type: 'textarea', full: 1, req: 1 }],
    columns: [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }]
  });

  /* ---------- Messages ---------- */
  function tabMessages(p) {
    const msgs = D().messages;
    p.innerHTML = `<h1>Contact messages</h1>` + (msgs.length ? msgs.map((m) => `
      <div class="card"><strong>${esc(m.name)}</strong> &lt;${esc(m.email)}&gt; <small>${new Date(m.at).toLocaleString()}</small>
      <p><em>${esc(m.subject || 'No subject')}</em></p><p>${esc(m.message)}</p>
      <button class="btn small danger" data-id="${m.id}">Delete</button></div>`).join('')
      : '<div class="card empty">No messages yet. Messages sent from the Hire Me form appear here (in this browser).</div>');
    p.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => {
      Store.remove('messages', b.dataset.id); openTab('messages');
    }));
  }

  /* ---------- Account + backup ---------- */
  function tabAccount(p) {
    const u = D().user;
    p.innerHTML = `<h1>Account & backup</h1>
    <form class="card form-grid" id="acct-form">
      <label>Name<input name="name" value="${esc(u.name)}"></label>
      <label>Email<input name="email" type="email" value="${esc(u.email)}"></label>
      <label>Current password<input name="current" type="password" required autocomplete="current-password"></label>
      <label>New password (min 8 chars, optional)<input name="next" type="password" minlength="8" autocomplete="new-password"></label>
      <div class="full"><button class="btn primary" type="submit">Update account</button></div>
    </form>
    <div class="card"><h3>Backup & reset</h3>
      <p class="note">Data lives in this browser only. Export a backup before clearing browser data.</p>
      <div class="row-actions">
        <button class="btn primary" id="export">Export JSON</button>
        <label class="btn light">Import JSON<input type="file" id="import" accept=".json" hidden></label>
        <button class="btn danger" id="reset">Reset to seed content</button></div></div>`;

    $('#acct-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const ok = await Store.changeCredentials({ name: f.get('name'), email: f.get('email'), currentPassword: f.get('current'), newPassword: f.get('next') });
      toast(ok ? 'Account updated' : 'Current password is incorrect', !ok);
      if (ok) e.target.reset();
    });
    $('#export').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
      a.download = 'portfolio-backup.json'; a.click();
    });
    $('#import').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => { try { Store.importJSON(r.result); toast('Backup imported'); openTab('account'); } catch (err) { toast(err.message, true); } };
      r.readAsText(file);
    });
    $('#reset').addEventListener('click', async () => {
      if (!confirm('Reset ALL content and the admin password to defaults?')) return;
      Store.reset(); Store.logout(); location.reload();
    });
  }

  init();
})();
