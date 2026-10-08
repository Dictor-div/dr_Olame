/**
 * store.js - Browser-storage data layer (replaces MongoDB).
 * Everything is kept as one JSON document in window.localStorage.
 * Collections mirror the requested models:
 *   settings (Setting), pages (PageContent), projects, services, metrics, user
 * plus competencies and contact messages.
 */
(function (global) {
  'use strict';

  const KEY = 'dictor_portfolio_v1';
  const SESSION_KEY = 'dictor_admin_session';
  const DEFAULT_ADMIN = { name: 'Dictor Abdalla Olame', email: 'admin@dictor.local', password: 'Admin@12345' };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /** Escape text before injecting into innerHTML */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Seed content ---------- */
  const ABOUT_HTML = `
<h2>Professional Summary</h2>
<p>Results-driven professional with expertise in Business, Information Technology, and community development. Experienced in education and humanitarian programs, using digital tools and data-driven approaches to empower youth, refugees, and vulnerable populations. A strong communicator and collaborator with a proven track record in inclusive education, entrepreneurship training, and program facilitation across multicultural environments.</p>

<h2>Professional Experience</h2>
<h3>Business &amp; Entrepreneurship Facilitator</h3>
<p><strong>Resilience Action International (RAI)</strong> &mdash; 2026 &ndash; Present</p>
<ul>
<li>Facilitate entrepreneurship training for youth and refugee entrepreneurs to support economic empowerment.</li>
<li>Guide participants in developing business ideas, business plans, and financial sustainability strategies.</li>
<li>Support small business growth through mentorship, coaching, and practical skills training.</li>
<li>Help participants build financial literacy, market analysis, and business management skills.</li>
<li>Collaborate with program teams to strengthen livelihood programs and community resilience initiatives.</li>
</ul>
<h3>Special Needs Specialist (Learner Support Assistant)</h3>
<p><strong>Humanity &amp; Inclusion (HI)</strong> &mdash; June 2024 &ndash; December 2025</p>
<ul>
<li>Provided academic and psychosocial support to learners with disabilities and diverse learning needs.</li>
<li>Promoted inclusive access to STEM education and digital literacy programs.</li>
<li>Adapted teaching materials and digital resources to support accessible learning for all students.</li>
<li>Developed Individualized Education Plans (IEPs) and assisted students with Activities of Daily Living (ADLs).</li>
<li>Collaborated with educators to monitor student progress and implement inclusive teaching strategies.</li>
<li>Contributed to Humanity &amp; Inclusion's capacity-building initiatives in the Kakuma program.</li>
</ul>

<h2>Education</h2>
<ul>
<li><strong>Bachelor of Arts &ndash; General Studies &amp; Information Systems</strong> (ongoing), Saint Louis University, Missouri (Online) &mdash; 2025&ndash;2028</li>
<li><strong>Certificate in IT in Business</strong>, Don Bosco Technical Institute, Kakuma &mdash; 2023</li>
<li><strong>Kenya Certificate of Secondary Education (KCSE)</strong>, Greenlight Refugee Secondary School &mdash; 2022</li>
<li><strong>Kenya Certificate of Primary Education (KCPE)</strong>, Fuji Refugee Camp &mdash; 2018</li>
</ul>

<h2>Certifications &amp; Professional Development</h2>
<ul>
<li>AI for Operations, Admin &amp; Planning &mdash; PoliSync / Globethics / Microsoft Elevate (2026)</li>
<li>Democracy in Sudan Online Course &mdash; AMEL, African Middle Eastern Leadership (2026)</li>
<li>Basics of Data Science &mdash; UniAthena / Cambridge International Qualifications (2025)</li>
<li>Public International Law &mdash; Open Society University Network (2025)</li>
<li>Technology &amp; Human Rights in the 21st Century &mdash; Open Society University Network (2025)</li>
<li>Certificate of Competency, Perform Computer Operations &mdash; Kitale National Polytechnic (2025)</li>
<li>Duolingo English Test (B2, score 110/160) &mdash; Duolingo (2025)</li>
<li>OSUN Virtual Student Leadership Conference &mdash; Open Society University Network (2024)</li>
<li>Interreligious Cooperation for Peace (9 ECTS credits) &mdash; Globethics &amp; Jesuit Worldwide Learning (2024)</li>
<li>Peace Leader Studies, Professional Certificate &mdash; Hekima University College &amp; JWL (2024)</li>
<li>Creative Writing and Design, Professional Certificate &mdash; St. Joseph's College Bangalore &amp; JWL (2023)</li>
<li>Global English Language (GEL), CEFR C1 &mdash; Jesuit Worldwide Learning &amp; Resilience Action Int'l (2023)</li>
<li>Leadership Training Certificate &mdash; Greenlight Refugee Secondary School (2021)</li>
</ul>
<p><em>Academic transcripts available from:</em> Creighton University (GPA 3.26, 30 credit hours, Fall 2023&ndash;Fall 2024) and Al-Quds University &ndash; Human Rights &amp; International Law (Score 81, Spring 2024/2025).</p>

<h2>Key Achievements</h2>
<ul>
<li>Delivered entrepreneurship training that directly supported the economic empowerment of youth and refugee entrepreneurs in Kakuma.</li>
<li>Contributed to inclusive education programs that improved access to STEM learning for students with disabilities.</li>
<li>Supported communication campaigns that increased community awareness and participation in youth programs.</li>
<li>Applied digital data collection tools (KoboCollect, SurveyCTO, and Taroworks) to improve program information management.</li>
<li>Completed over 12 professional certificates and online courses in law, technology, peace-building, ethics, and data science.</li>
<li>Achieved CEFR C1 English proficiency and B2 on the Duolingo English Test (110/160).</li>
</ul>

<h2>Technical Skills</h2>
<ul>
<li><strong>Software:</strong> Microsoft Office Suite (Word, Excel, PowerPoint, Access, Publisher), GitHub, Visual Studio</li>
<li><strong>Data &amp; Research:</strong> R Programming, KoboCollect, SurveyCTO, Data Collection &amp; Analysis</li>
<li><strong>Web &amp; Design:</strong> Basic Web Development, Graphic Design (GDE-1, 97%), Creative Writing</li>
</ul>

<h2>Languages</h2>
<p>English, Swahili, Arabic, and Tira (Sudanese dialect).</p>

<h2>References</h2>
<p><strong>David Omondi</strong><br>Area Manager &ndash; Kakuma, Humanity &amp; Inclusion</p>
<p><strong>Dr. Eboni Chism</strong><br>Student Advisor, Saint Louis University<br>eboni.chism@slu.edu</p>`;

  function defaults() {
    return {
      version: 1,
      settings: {
        name: 'Dictor Abdalla Olame',
        siteTitle: 'Dictor Abdalla Olame | Business & IT Specialist',
        logoText: 'Dictor Olame',
        logoUrl: '',
        faviconUrl: '',
        headshotUrl: '',
        aboutImageUrl: '',
        footerLogoUrl: '/assets/logo.png',
        phone: '+254 755 803 938',
        email: 'douglasdictor409@gmail.com',
        location: 'Kakuma, Kenya',
        availability: 'Available for consultancy, facilitation and part-time roles. Typical response within 24 hours.',
        heroHeadline: 'Business & IT Specialist | Education & Community Development Professional',
        heroSubheadline: 'I use digital tools, data and practical training to empower youth, refugees and learners with disabilities across Kakuma and beyond.',
        resumeUrl: '/about',
        website: 'https://dictorolame.vercel.app',
        whatsapp: 'https://wa.me/254755803938',
        facebook: 'https://facebook.com/',
        linkedin: 'https://linkedin.com/',
        github: 'https://github.com/',
        twitter: 'https://twitter.com/',
        instagram: 'https://instagram.com/'
      },
      pages: { about: ABOUT_HTML },
      metrics: [
        { id: uid(), key: 'projects', value: '20+', label: 'Projects Completed' },
        { id: uid(), key: 'youth', value: '500+', label: 'Target Youth to Train' },
        { id: uid(), key: 'students', value: '120+', label: 'Students Mentored' },
        { id: uid(), key: 'certs', value: '12+', label: 'Certificates Earned' },
        { id: uid(), key: 'experience', value: '3+', label: 'Years of Field Experience' },
        { id: uid(), key: 'languages', value: '4', label: 'Languages Spoken' },
        { id: uid(), key: 'orgs', value: '2', label: 'Humanitarian Partners' }
      ],
      competencies: [
        'Business & Entrepreneurship', 'Information Technology', 'Communication', 'Community Economic Empowerment',
        'R Programming', 'Stakeholder Engagement', 'Digital Literacy Training', 'Data Collection & Analysis',
        'Cross-Cultural Teamwork', 'Youth Empowerment Programs', 'Basic Web Development', 'Social Media & Digital Comms',
        'Inclusive Education Support', 'Cybersecurity Fundamentals', 'Community Outreach', 'Refugee Community Engagement',
        'Microsoft Office Suite', 'Program Facilitation'
      ],
      services: [
        { id: uid(), order: 1, icon: 'fa-solid fa-briefcase', title: 'Entrepreneurship Training', description: 'Practical coaching on business ideas, business plans, financial literacy and market analysis for youth and refugee entrepreneurs.' },
        { id: uid(), order: 2, icon: 'fa-solid fa-laptop-code', title: 'Digital Literacy Training', description: 'Hands-on Microsoft Office and everyday digital skills sessions that help learners and small businesses work confidently online.' },
        { id: uid(), order: 3, icon: 'fa-solid fa-universal-access', title: 'Inclusive Education Support', description: 'Learner support for students with disabilities, including adapted materials and Individualized Education Plans (IEPs).' },
        { id: uid(), order: 4, icon: 'fa-solid fa-chart-column', title: 'Data Collection & Analysis', description: 'Survey design and field data collection with KoboCollect and SurveyCTO, with analysis in R for clear program reporting.' },
        { id: uid(), order: 5, icon: 'fa-solid fa-code', title: 'Basic Web Development', description: 'Clean, responsive websites and landing pages built with HTML, CSS and JavaScript for organisations and individuals.' },
        { id: uid(), order: 6, icon: 'fa-solid fa-people-group', title: 'Community Outreach & Youth Programs', description: 'Program facilitation, communication campaigns and outreach that increase youth participation in community initiatives.' }
      ],
      projects: [
        { id: uid(), title: "Youth & Refugee Entrepreneurship Training", category: "Entrepreneurship", date: "2026", organization: "Resilience Action International (RAI)", excerpt: "What does it take to turn an idea into a business when resources are scarce? In Kakuma, young people and refugee entrepreneurs are finding out, one business plan at a time, through practical training, mentorship and coaching that builds income, skills and confidence.", description: "This is an entrepreneurship training program for youth and refugee entrepreneurs in Kakuma, delivered with Resilience Action International (RAI). It exists to support economic empowerment by helping people turn business ideas into small enterprises that can earn a steady income.\n\nAs Business & Entrepreneurship Facilitator, I guide participants from a first idea to a written business plan and a financial sustainability strategy. Sessions build financial literacy, market analysis and business management skills through practical, hands-on exercises.\n\nTraining is followed by mentorship and coaching, so small businesses keep growing after the classroom. I work alongside the program team to connect this work to wider livelihood programs and community resilience initiatives.\n\nThe aim is simple: participants leave able to plan, price, track their money and make informed decisions, which strengthens their families and the wider Kakuma community.", imageUrl: '', projectUrl: '' },
        { id: uid(), title: "Inclusive STEM Learning Support", category: "Education", date: "Jun 2024 - Dec 2025", organization: "Humanity & Inclusion (HI)", excerpt: "Every learner deserves a seat in the science and computer lab. This project opened STEM and digital literacy classes to students with disabilities through adapted materials, individual learning plans and daily support, so that no student was left watching from the sidelines.", description: "This project made STEM education and digital literacy programs open to learners with disabilities and diverse learning needs, within the Kakuma program of Humanity & Inclusion (HI). The principle behind it is inclusion: every student learns alongside their peers, with the support needed to take part fully.\n\nAs Special Needs Specialist (Learner Support Assistant), I gave academic and psychosocial support to individual learners. I adapted teaching materials and digital resources so they were accessible, developed Individualized Education Plans (IEPs), and assisted students with Activities of Daily Living (ADLs) so that personal needs did not stand in the way of learning.\n\nI worked closely with educators to monitor each student's progress and apply inclusive teaching strategies in the classroom, and I contributed to HI's broader capacity-building initiatives in Kakuma.\n\nThe result was improved access to STEM learning for students with disabilities, and a stronger foundation of inclusive practice in the classrooms I supported.", imageUrl: '', projectUrl: '' },
        { id: uid(), title: "Digital Data Collection Systems", category: "Data & Research", date: "2024 - 2025", organization: "Humanity & Inclusion (HI)", excerpt: "Good programs run on good information. By using mobile tools such as KoboCollect, SurveyCTO and Taroworks, this project made program data easier to gather, check and act on, helping teams make decisions that reach the learners and families who need support.", description: "Programs depend on reliable information about who is being served and how well. This project applied digital data collection tools to improve how that information is gathered and managed in the field.\n\nUsing KoboCollect, SurveyCTO and Taroworks, I worked with program data on mobile devices, from setting up clear forms to collecting responses and keeping the information organised. Where deeper analysis was needed, I used R programming for cleaning, summaries and reporting.\n\nDigital collection helps reduce the errors and delays that come with manual records, and it makes results quicker to share with colleagues.\n\nThe outcome is better program information management: data that is easier to organise, check and use when teams plan their next steps.", imageUrl: '', projectUrl: '' },
        { id: uid(), title: "Youth Awareness Communication Campaign", category: "Community", date: "2024", organization: "Community youth programs, Kakuma", excerpt: "Programs only change lives when people know about them. This campaign used clear messages, social media and community outreach to bring youth programs to the attention of young people in Kakuma and encourage more of them to take part.", description: "This project supported communication campaigns designed to increase community awareness of, and participation in, youth programs in Kakuma. Many young people miss opportunities simply because they never hear about them, so clear communication was the starting point.\n\nMy role covered preparing simple, accessible messages, supporting social media and digital communication, and community outreach through direct conversations with young people and community members.\n\nKakuma is home to people from many countries and languages, so the campaign depended on cross-cultural teamwork and on messages that different groups could understand and trust.\n\nThe campaign increased community awareness and participation in youth programs, connecting more young people to learning and empowerment opportunities.", imageUrl: '', projectUrl: '' },
        { id: uid(), title: "Digital Literacy Mentorship", category: "Education", date: "2023 - 2025", organization: "Community learning programs, Kakuma", excerpt: "Confidence with a computer opens doors to learning and work. Through patient, hands-on mentorship, this project helped more than 120 students build everyday digital skills, from computer basics and Microsoft Office to using technology safely and with purpose.", description: "This mentorship project helps students build the digital skills they need for school, work and everyday life. It starts where each learner is, with computer basics, and builds towards confident use of Microsoft Office tools including Word, Excel and PowerPoint.\n\nSessions are hands-on and paced to the learner, with practice tasks that mirror real situations such as writing a CV, preparing a presentation or organising information in a spreadsheet.\n\nSafe and responsible technology use is part of every level, and the approach is adapted so that learners with different abilities and learning needs can take part.\n\nMore than 120 students have been mentored, leaving with practical skills and the confidence to use technology for learning and for work.", imageUrl: '', projectUrl: '' },
        { id: uid(), title: "Personal Portfolio Website", category: "Web Development", date: "2026", organization: "Self-initiated", excerpt: "A portfolio should be easy to update and easy to trust. This responsive website, built with HTML, CSS and JavaScript, brings experience, services and projects together in one place, with an admin dashboard that lets content change without touching code.", description: "This project is the portfolio website you are viewing. It was designed to present my experience, services and projects clearly, and to work well on mobile, tablet and desktop.\n\nIt is built with HTML5, CSS3 and vanilla JavaScript, served by Node.js and Express. A password-protected admin dashboard lets me update the About page, metrics, services, projects and site settings without editing code.\n\nThe project reflects my basic web development skills alongside my business and information systems background.", imageUrl: '', projectUrl: 'https://dictorolame.vercel.app' },
        { id: uid(), title: "Portfolio Website for Afaf Obang", category: "Web Development", date: "2026", organization: "Client project - Afaf Obang", excerpt: "Your portfolio is often the first impression you make. For Afaf Obang, I designed and built a clean, responsive website that presents her profile, work and contact details clearly, so opportunities can find her and trust her within seconds.", description: "This project is a personal portfolio website designed and developed for Afaf Obang. Its purpose is to give her a professional online presence where employers, partners and clients can quickly learn who she is, what she has done and how to reach her.\n\nI handled the work from start to finish: planning the pages and structure, designing a clean layout, and building the site with HTML, CSS and JavaScript so it loads quickly and works well on mobile, tablet and desktop.\n\nThe content is organised so visitors can find the essentials without searching: a clear introduction, her experience and skills, selected work, and an easy way to get in touch.\n\nThe result is a professional, easy-to-read portfolio that Afaf can share on her CV, social profiles and applications.", imageUrl: '', projectUrl: '' },
        { id: uid(), title: "Website for Raise Again Hope Again NGO", category: "Web Development", date: "2026", organization: "Raise Again Hope Again (NGO)", excerpt: "An NGO's website has to earn trust quickly. For Raise Again Hope Again, I built a clear, responsive website that tells the organisation's story, shows its work and makes it easy for supporters, partners and the community to connect.", description: "This project is a website for Raise Again Hope Again, a non-governmental organisation (NGO). Its purpose is to give the organisation a credible online home where visitors can understand its mission, see the work it does and find out how to get involved.\n\nI designed and developed the site from start to finish: planning the structure, building a clean and readable layout, and using HTML, CSS and JavaScript so it works well on mobile, tablet and desktop.\n\nThe content is organised around what supporters and partners look for: who the organisation is, what it does, the people and communities it serves, and clear ways to get in touch.\n\nThe result is a professional online presence that helps the organisation share its story, build trust with partners and supporters, and reach more of the community it serves.", imageUrl: '', projectUrl: '' }
      ],
      whyHire: [
        { id: uid(), icon: 'fa-solid fa-earth-africa', title: 'Field-tested in humanitarian settings', description: 'Hands-on experience with Humanity & Inclusion and Resilience Action International in Kakuma, working with refugees, youth and learners with disabilities.' },
        { id: uid(), icon: 'fa-solid fa-laptop-code', title: 'Business and IT in one profile', description: 'I combine entrepreneurship training with data tools (R, KoboCollect, SurveyCTO) and basic web development.' },
        { id: uid(), icon: 'fa-solid fa-universal-access', title: 'Inclusive by design', description: 'I adapt materials and methods so every learner can take part, including those with special needs.' },
        { id: uid(), icon: 'fa-solid fa-language', title: 'Multilingual and multicultural', description: 'Fluent in English, Swahili and Arabic, with Tira spoken at home, and comfortable in cross-cultural teams.' },
        { id: uid(), icon: 'fa-solid fa-certificate', title: 'Always learning', description: 'Over 12 certificates in data science, law, peace-building and technology, with a degree in progress.' }
      ],
      messages: [],
      user: null
    };
  }

  /* ---------- Persistence ---------- */
  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        data = JSON.parse(raw);
        // Migration: add fields introduced after the data was first saved
        const d = defaults(); let changed = false;
        Object.keys(d).forEach((k) => { if (data[k] === undefined) { data[k] = d[k]; changed = true; } });
        Object.keys(d.settings).forEach((k) => { if (data.settings[k] === undefined) { data.settings[k] = d.settings[k]; changed = true; } });
        (data.projects || []).forEach((p) => {
          if (p.excerpt === undefined) { p.excerpt = String(p.description || '').split(/\s+/).slice(0, 50).join(' '); changed = true; }
        });
        if (changed) save();
        return data;
      }
    } catch (e) { console.warn('Storage read failed, re-seeding', e); }
    data = defaults();
    save();
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (e) { alert('Browser storage is full. Use smaller images (or image URLs).'); return false; }
  }

  /* ---------- Password hashing (PBKDF2 via Web Crypto) ---------- */
  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function ensureUser() {
    if (data.user) return;
    const salt = uid() + uid();
    data.user = { name: DEFAULT_ADMIN.name, email: DEFAULT_ADMIN.email, salt, password: await hashPassword(DEFAULT_ADMIN.password, salt) };
    save();
  }

  async function login(email, password) {
    await ensureUser();
    const u = data.user;
    const ok = email.trim().toLowerCase() === u.email.toLowerCase() && (await hashPassword(password, u.salt)) === u.password;
    if (ok) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: u.email, at: Date.now() }));
    return ok;
  }

  async function changeCredentials({ name, email, currentPassword, newPassword }) {
    const u = data.user;
    if ((await hashPassword(currentPassword, u.salt)) !== u.password) return false;
    u.name = name || u.name;
    u.email = email || u.email;
    if (newPassword) { u.salt = uid() + uid(); u.password = await hashPassword(newPassword, u.salt); }
    return save();
  }

  /* ---------- Public API ---------- */
  load();

  global.Store = {
    esc, uid, save,
    get data() { return data; },
    settings: () => data.settings,
    isLoggedIn: () => !!sessionStorage.getItem(SESSION_KEY),
    logout: () => sessionStorage.removeItem(SESSION_KEY),
    login, changeCredentials, ensureUser,
    DEFAULT_ADMIN,
    upsert(col, item) {
      if (!item.id) item.id = uid();
      const i = data[col].findIndex((x) => x.id === item.id);
      if (i >= 0) data[col][i] = item; else data[col].push(item);
      return save();
    },
    remove(col, id) { data[col] = data[col].filter((x) => x.id !== id); return save(); },
    exportJSON() { const d = JSON.parse(JSON.stringify(data)); return JSON.stringify(d, null, 2); },
    importJSON(text) { const d = JSON.parse(text); if (!d.settings || !d.pages) throw new Error('Invalid backup'); data = d; return save(); },
    reset() { localStorage.removeItem(KEY); load(); }
  };
})(window);
