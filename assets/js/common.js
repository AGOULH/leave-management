/* SIG common: language, header/footer, shared data and helpers */
(function () {
  const C = window.SIG_CONFIG || {};
  const SIG = (window.SIG = window.SIG || {});

  // ---------- language ----------
  function readLang() { try { const l = localStorage.getItem('sig_lang'); return l === 'en' ? 'en' : 'ar'; } catch (e) { return 'ar'; } }
  SIG.lang = readLang();
  SIG.t = (ar, en) => (SIG.lang === 'en' ? en : ar);
  SIG.isFirebase = !!(C.firebase && C.firebase.apiKey && C.firebase.projectId);

  function applyStatic(root) {
    const en = SIG.lang === 'en';
    root.querySelectorAll('[data-en]').forEach((el) => {
      if (el.dataset.ar === undefined) el.dataset.ar = el.innerHTML;
      el.innerHTML = en ? el.dataset.en : el.dataset.ar;
    });
    root.querySelectorAll('[data-en-ph]').forEach((el) => {
      if (el.dataset.arPh === undefined) el.dataset.arPh = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', en ? el.dataset.enPh : el.dataset.arPh);
    });
    root.querySelectorAll('[data-en-aria]').forEach((el) => {
      if (el.dataset.arAria === undefined) el.dataset.arAria = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', en ? el.dataset.enAria : el.dataset.arAria);
    });
  }
  SIG.applyStatic = applyStatic;

  SIG.setLang = function (l) {
    SIG.lang = l === 'en' ? 'en' : 'ar';
    try { localStorage.setItem('sig_lang', SIG.lang); } catch (e) {}
    document.documentElement.lang = SIG.lang;
    document.documentElement.dir = SIG.lang === 'en' ? 'ltr' : 'rtl';
    renderChrome();
    applyStatic(document);
    document.dispatchEvent(new CustomEvent('sig:lang', { detail: SIG.lang }));
  };

  // ---------- helpers ----------
  SIG.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  SIG.$ = (sel, root) => (root || document).querySelector(sel);
  SIG.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  SIG.fmtDate = function (d, opts) {
    const dt = d instanceof Date ? d : new Date(String(d).length === 10 ? d + 'T00:00:00' : d);
    if (isNaN(dt)) return String(d || '');
    try { return dt.toLocaleDateString(SIG.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn', opts || { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return dt.toDateString(); }
  };
  SIG.fmtHijri = function (d) {
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    try { return dt.toLocaleDateString(SIG.lang === 'en' ? 'en-SA-u-ca-islamic-umalqura' : 'ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; }
  };
  SIG.fmtTime = (d) => { try { return new Date(d).toLocaleTimeString(SIG.lang === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  SIG.toast = function (msg) {
    const old = document.querySelector('.toast'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3200);
  };
  SIG.qrSvg = function (text, size) {
    if (typeof window.qrcode !== 'function') return '<span class="muted">QR</span>';
    const q = window.qrcode(0, 'M'); q.addData(String(text)); q.make();
    const svg = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    return svg.replace('<svg ', '<svg role="img" aria-label="QR ' + SIG.esc(text) + '" style="--qr:' + (size || 132) + 'px" ').replace(/fill="black"/g, 'fill="#5A0A16"').replace(/fill="#000000"/g, 'fill="#5A0A16"');
  };
  SIG.calUrl = function (title, startIso, hours) {
    const s = new Date(startIso); if (isNaN(s)) return '#';
    const e = new Date(s.getTime() + (hours || 8) * 3600000);
    const f = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + f(s) + '/' + f(e);
  };
  SIG.downloadIcs = function (title, startIso, hours, location) {
    const s = new Date(startIso); if (isNaN(s)) return;
    const e = new Date(s.getTime() + (hours || 8) * 3600000);
    const f = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SIG//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@sig', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(s), 'DTEND:' + f(e), 'SUMMARY:' + title, 'LOCATION:' + (location || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    SIG.download('sig-event.ics', ics, 'text/calendar');
  };
  SIG.download = function (name, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  SIG.param = (k) => new URLSearchParams(location.search).get(k);
  SIG.memberName = (m) => (m ? [m.first, m.middle, m.last].filter(Boolean).join(' ') : '');
  SIG.categoryLabel = (k) => ({ tech: SIG.t('أخصائي مختبر', 'Technologist'), sci: SIG.t('عالم / باحث', 'Scientist'), phys: SIG.t('طبيب', 'Physician'), nurse: SIG.t('تمريض', 'Nurse'), student: SIG.t('طالب', 'Student'), other: SIG.t('أخرى', 'Other') }[k] || '');
  SIG.memberCard = function (m) {
    return '<div class="member-card"><div class="mc-info"><div class="row" style="--gap:10px;flex-wrap:nowrap">' + SIG.logo(36) +
      '<strong style="font-size:13px;line-height:1.4">' + SIG.t('المجموعة السعودية لعلم الدم المناعي', 'Saudi Immunohaematology Group') + '</strong></div>' +
      '<div class="stack" style="--gap:3px"><strong style="font-size:20px">' + SIG.esc(SIG.memberName(m)) + '</strong>' +
      '<span class="muted" style="font-size:13.5px">' + SIG.t('عضو', 'Member') + (m.category ? ' — ' + SIG.categoryLabel(m.category) : '') + '</span>' +
      '<b class="latin" style="font-size:13px;color:var(--red-d);letter-spacing:.06em">' + SIG.esc(m.memberNo || '') + '</b></div></div>' +
      '<div class="qr" style="align-self:center">' + SIG.qrSvg(m.memberNo || '', 104) + '</div></div>';
  };

  // ---------- icons ----------
  const I = (d, extra) => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>';
  SIG.icon = {
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    cert: I('<circle cx="12" cy="9" r="5"/><path d="M9 13.5 8 21l4-2 4 2-1-7.5"/>'),
    users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
    board: I('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 9l3 2 3-3 4 3"/>'),
    book: I('<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>'),
    card: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    check: I('<path d="M5 12l5 5L20 7"/>', ' stroke-width="2.4"'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    image: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>'),
    scan: I('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>'),
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', ' style="transform:scaleX(var(--flip,1))"')
  };
  SIG.logo = function (size) {
    return '<svg width="' + (size || 46) + '" height="' + (size || 46) + '" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#FFF6F7" stroke="#F6CDD4" stroke-width="1.5"/><path d="M32 8C32 8 15 28 15 39a17 17 0 0 0 34 0C49 28 32 8 32 8z" fill="#C8102E"/><path d="M32 50V39M32 39l-7.5-8M32 39l7.5-8" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="28.8" r="2.9" fill="#fff"/><circle cx="41" cy="28.8" r="2.9" fill="#fff"/></svg>';
  };

  // ---------- shared data: events archive (from the original site) ----------
  SIG.ARCHIVE = [
    { key: 'am4-2020', type: 'annual', date: '2020-06-27', ar: 'الملتقى السنوي الرابع للمجموعة', en: '4th SIG Annual Meeting', placeAr: 'عن بُعد — بالتعاون مع الأكاديمية الطبية الافتراضية', placeEn: 'Online — with the Virtual Medical Academy', descAr: '', descEn: '' },
    { key: 'am3-2018', type: 'annual', date: '2018-12-02', ar: 'الملتقى السنوي الثالث للمجموعة', en: '3rd SIG Annual Meeting', placeAr: 'فندق هوليداي إن، الخبر', placeEn: 'Holiday Inn Hotel, Al-Khobar', descAr: 'النسخة الثالثة من الملتقى السنوي للمجموعة ليوم واحد.', descEn: 'The third edition of the one-day SIG annual event.' },
    { key: 'sstm4-2018', type: 'annual', date: '2018-03-31', ar: 'المؤتمر الدولي الرابع للجمعية السعودية لطب نقل الدم', en: '4th International Conference of the Saudi Society of Transfusion Medicine', placeAr: 'مركز سلطان بن عبدالعزيز للعلوم والتقنية (سايتك)، الخبر', placeEn: 'Sultan Bin Abdulaziz Science & Technology Center (SciTech), Al-Khobar', descAr: '', descEn: '' },
    { key: 'ws-int-2018', type: 'workshop', date: '2018-03-12', ar: 'ورشة علوم نقل الدم — المستوى المتوسط', en: 'Transfusion Science Intermediate Workshop', placeAr: 'فندق هوليداي إن، الخبر', placeEn: 'Holiday Inn, Al-Khobar', descAr: 'للعاملين في بنوك الدم في تحديد الفصائل والتحري الأساسي عن الأجسام المضادة واختبارات التوافق.', descEn: 'For blood bank staff performing blood grouping, basic antibody investigation and compatibility testing.' },
    { key: 'am2-2017', type: 'annual', date: '2017-12-03', ar: 'الملتقى السنوي الثاني للمجموعة', en: '2nd SIG Annual Meeting', placeAr: 'الخبر', placeEn: 'Al-Khobar', descAr: 'مؤتمر ليوم واحد يجتمع فيه خبراء محليون وإقليميون لتبادل أحدث المستجدات.', descEn: 'A one-day conference where local and regional experts exchange the latest updates.' },
    { key: 'am1-2015', type: 'annual', date: '2015-12-13', ar: 'الملتقى السنوي الأول للمجموعة', en: '1st SIG Annual Meeting', placeAr: 'فندق هوليداي إن، الخبر', placeEn: 'Holiday Inn, Al-Khobar', descAr: 'أول ملتقى سنوي بعد الانضمام رسمياً إلى الجمعية السعودية لطب نقل الدم.', descEn: 'The first annual meeting after officially joining the SSTM.' },
    { key: 'ws-safety-2014', type: 'workshop', date: '2014-05-17', ar: 'ورشة سلامة نقل الدم', en: 'Blood Transfusion Safety Workshop', placeAr: 'قاعة المؤتمرات الرئيسية — مختبر وبنك الدم الإقليمي بالدمام', placeEn: 'Main Conference Room — Dammam Regional Laboratory & Blood Bank', descAr: '', descEn: '' },
    { key: 'sym-2014', type: 'annual', date: '2014-04-27', ar: 'ندوة أمراض الدم وعلوم نقل الدم المتقدمة', en: 'Advanced Haematology & Transfusion Science Symposium', placeAr: 'مركز التعليم الطبي — مستشفى الملك فهد الجامعي، الخبر', placeEn: 'Medical Education Centre, KFHU, Al-Khobar', descAr: 'بالتعاون بين قسم علوم المختبرات الإكلينيكية ومختبر وبنك الدم الإقليمي بالدمام.', descEn: 'Clinical Laboratory Sciences department with Dammam Regional Laboratory & Blood Bank.' },
    { key: 'ws1-2013', type: 'workshop', date: '2013-04-08', ar: 'ورشة علوم نقل الدم الأولى (8–10 أبريل)', en: '1st Blood Transfusion Science Workshop (8–10 April)', placeAr: 'مركز التعليم الطبي — مستشفى الملك فهد الجامعي، الخبر', placeEn: 'Medical Education Centre, KFHU, Al-Khobar', descAr: 'بالتعاون بين قسم علوم المختبرات الإكلينيكية ومختبر وبنك الدم الإقليمي بالدمام.', descEn: 'Clinical Laboratory Sciences department with Dammam Regional Laboratory & Blood Bank.' }
  ];
  SIG.typeLabel = (k) => ({ annual: SIG.t('ملتقى / مؤتمر', 'Meeting / conference'), meeting: SIG.t('اجتماع دوري', 'Group meeting'), workshop: SIG.t('ورشة عمل', 'Workshop') }[k] || k);
  SIG.DEFAULT_NEWS = [
    { ar: 'التسجيل في جميع فعاليات المجموعة مجاني', en: 'Registration for all SIG events is free' },
    { ar: 'العضوية مجانية لجميع المهتمين بعلم الدم المناعي وطب نقل الدم', en: 'Membership is free for everyone in immunohaematology and transfusion medicine' },
    { ar: 'المواد العلمية للفعاليات السابقة متاحة في المكتبة العلمية', en: 'Materials from past events are available in the scientific library' },
    { ar: 'شهادات الحضور تصدر إلكترونياً من بوابة العضو', en: 'Attendance certificates are issued online in the member portal' }
  ];

  // ---------- header / footer ----------
  const NAV = [
    ['home', 'index.html', 'الرئيسية', 'Home'],
    ['about', 'about.html', 'عن المجموعة', 'About'],
    ['events', 'events.html', 'الفعاليات', 'Events'],
    ['library', 'library.html', 'المكتبة العلمية', 'Library'],
    ['membership', 'membership.html', 'العضوية', 'Membership'],
    ['contact', 'contact.html', 'تواصل معنا', 'Contact']
  ];
  function renderChrome() {
    const t = SIG.t;
    const page = document.body.dataset.page || '';
    document.documentElement.style.setProperty('--flip', SIG.lang === 'en' ? '1' : '-1');
    const h = document.getElementById('site-header');
    if (h) {
      h.innerHTML =
        '<header class="site-header"><div class="container header-inner">' +
        '<a class="brand" href="index.html">' + SIG.logo(46) + '<span><strong>' + t('المجموعة السعودية لعلم الدم المناعي', 'Saudi Immunohaematology Group') + '</strong><small>' + t('SIG — الجمعية السعودية لطب نقل الدم', 'SIG — Saudi Society of Transfusion Medicine') + '</small></span></a>' +
        '<button type="button" class="menu-btn" aria-expanded="false" aria-controls="main-nav" aria-label="' + t('القائمة', 'Menu') + '">' + SIG.icon.menu + '</button>' +
        '<nav id="main-nav" class="main-nav" aria-label="' + t('القائمة الرئيسية', 'Main navigation') + '">' +
        NAV.map((n) => '<a href="' + n[1] + '"' + (page === n[0] ? ' aria-current="page"' : '') + '>' + t(n[2], n[3]) + '</a>').join('') +
        '</nav><div class="header-actions">' +
        '<button type="button" class="lang-btn" aria-label="' + t('Switch to English', 'التبديل إلى العربية') + '">' + t('EN', 'ع') + '</button>' +
        '<a class="btn btn-primary btn-sm" href="portal.html">' + SIG.icon.user + t('دخول الأعضاء', 'Member login') + '</a>' +
        '</div></div></header>' +
        (SIG.isFirebase || !document.body.hasAttribute('data-demo-note') ? '' : '<div class="demo-note">' + t('وضع تجريبي: البيانات تُحفظ في هذا المتصفح فقط حتى ربط Firebase (راجع README).', 'Demo mode: data is saved in this browser only until Firebase is connected (see README).') + '</div>');
      h.querySelector('.lang-btn').addEventListener('click', () => SIG.setLang(SIG.lang === 'ar' ? 'en' : 'ar'));
      const mb = h.querySelector('.menu-btn'), nav = h.querySelector('.main-nav');
      mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    }
    const f = document.getElementById('site-footer');
    if (f) {
      const s = C.social || {};
      const soc = [
        ['instagram', 'Instagram', '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>'],
        ['x', 'X', '<path d="M4 4l16 16M20 4L4 20"/>'],
        ['youtube', 'YouTube', '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>'],
        ['facebook', 'Facebook', '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V21M6 11h8"/>']
      ].filter((x) => s[x[0]]).map((x) => '<a href="' + SIG.esc(s[x[0]]) + '" target="_blank" rel="noopener" aria-label="' + x[1] + '"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' + x[2] + '</svg></a>').join('');
      f.innerHTML =
        '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
        '<div class="stack" style="--gap:14px"><div class="row" style="--gap:12px">' + SIG.logo(44) + '<strong>' + t('المجموعة السعودية لعلم الدم المناعي', 'Saudi Immunohaematology Group') + '</strong></div>' +
        '<p class="muted" style="font-size:14.5px;line-height:1.8">' + t('مجموعة علمية تحت مظلة الجمعية السعودية لطب نقل الدم، تسعى لأن تكون المرجع الأول لمراكز الدم وخدمات نقل الدم في المملكة.', 'A scientific group of the Saudi Society of Transfusion Medicine, aiming to be the main reference for blood centres and transfusion services in the Kingdom.') + '</p></div>' +
        '<nav aria-label="' + t('روابط سريعة', 'Quick links') + '"><strong>' + t('روابط سريعة', 'Quick links') + '</strong>' +
        '<a href="about.html">' + t('عن المجموعة', 'About SIG') + '</a><a href="membership.html">' + t('العضوية المجانية', 'Free membership') + '</a><a href="library.html">' + t('المكتبة العلمية', 'Scientific library') + '</a><a href="portal.html">' + t('بوابة العضو', 'Member portal') + '</a><a href="contact.html">' + t('تواصل معنا', 'Contact us') + '</a></nav>' +
        '<nav aria-label="' + t('الفعاليات', 'Events') + '"><strong>' + t('الفعاليات', 'Events') + '</strong>' +
        '<a href="events.html">' + t('الملتقى السنوي', 'Annual Meeting') + '</a><a href="events.html">' + t('الاجتماعات الدورية', 'Group meetings') + '</a><a href="events.html">' + t('الورش المتخصصة', 'Specialised workshops') + '</a><a href="events.html#archive">' + t('أرشيف الفعاليات', 'Events archive') + '</a></nav>' +
        '<div class="stack" style="--gap:10px"><strong>' + t('تواصل', 'Contact') + '</strong>' +
        '<span style="font-size:14.5px">' + SIG.esc(C.contactEmail || t('[البريد الرسمي للمجموعة]', '[Official group email]')) + '</span>' +
        '<span style="font-size:14.5px">' + t('الدمام — المنطقة الشرقية', 'Dammam — Eastern Province') + '</span>' +
        (soc ? '<div class="social">' + soc + '</div>' : '') + '</div>' +
        '</div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' ' + t('المجموعة السعودية لعلم الدم المناعي. جميع الحقوق محفوظة.', 'Saudi Immunohaematology Group. All rights reserved.') + '</span><span>' + t('التسجيل والعضوية مجانية', 'Registration and membership are free') + '</span></div></div></footer>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = SIG.lang;
    document.documentElement.dir = SIG.lang === 'en' ? 'ltr' : 'rtl';
    renderChrome();
    applyStatic(document);
    document.dispatchEvent(new CustomEvent('sig:ready', { detail: SIG.lang }));
  });
})();
