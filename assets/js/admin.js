(function () {
  const SIG = window.SIG; const t = SIG.t; const $ = SIG.$, $$ = SIG.$$; const store = SIG.store;
  const S = { user: null, sec: 'overview', regs: [], abs: [], members: [], news: [], events: [], pubs: [], msgs: [], settings: {}, q: '', mq: '', scanner: null };
  const V = (f, k) => { const el = f.elements.namedItem(k); return el ? (el.type === 'checkbox' ? el.checked : String(el.value).trim()) : ''; };
  const esc = SIG.esc;

  const SECTIONS = () => [
    ['overview', t('نظرة عامة', 'Overview'), ''],
    ['event', t('الفعالية والمواعيد', 'Event & schedule'), ''],
    ['regs', t('التسجيلات', 'Registrations'), S.regs.length],
    ['attend', t('الحضور والشهادات', 'Attendance & certificates'), S.regs.filter((r) => r.checkedIn).length],
    ['abs', t('الملخصات البحثية', 'Abstracts'), S.abs.filter((a) => a.status === 'review').length],
    ['members', t('الأعضاء والبطاقات', 'Members & cards'), S.members.length],
    ['library', t('المنشورات والمجلات', 'Publications'), S.pubs.length],
    ['news', t('شريط الأخبار', 'News bar'), S.news.length],
    ['msgs', t('الرسائل', 'Messages'), S.msgs.filter((m) => !m.read).length]
  ];
  const ABS = () => ({ review: [t('قيد المراجعة', 'In review'), 'tag-orange'], oral: [t('مقبول — شفهي', 'Accepted — oral'), 'tag-green'], poster: [t('مقبول — ملصق', 'Accepted — poster'), 'tag-blue'], revise: [t('يحتاج تعديل', 'Needs revision'), 'tag-orange'], reject: [t('مرفوض', 'Rejected'), 'tag-gray'] });
  const DEPT = () => ({ admin: t('الإدارة', 'Administration'), reg: t('التسجيل والعضوية', 'Registration'), sci: t('اللجنة العلمية', 'Scientific committee'), media: t('الإعلام', 'Media'), spons: t('الرعاية', 'Sponsorship') });

  async function loadAll() {
    const safe = (p) => p.catch(() => []);
    [S.regs, S.abs, S.members, S.events, S.pubs, S.msgs] = await Promise.all([safe(store.list('registrations')), safe(store.list('abstracts')), safe(store.list('members')), safe(store.list('events')), safe(store.list('publications')), safe(store.list('messages'))]);
    S.news = await safe(store.list('news'));
    S.settings = await store.settings().catch(() => Object.assign({}, (window.SIG_CONFIG || {}).event));
  }

  function nav() {
    $('#admin-nav').innerHTML = SECTIONS().map((s) => '<button type="button" data-sec="' + s[0] + '"' + (S.sec === s[0] ? ' aria-current="page"' : '') + '><span>' + s[1] + '</span><span class="count">' + (s[2] === '' ? '' : s[2]) + '</span></button>').join('') +
      '<hr><a href="index.html">' + t('عرض الموقع', 'View site') + '</a><button type="button" id="signout">' + t('تسجيل الخروج', 'Sign out') + '</button>';
    $$('#admin-nav [data-sec]').forEach((b) => b.addEventListener('click', () => { S.sec = b.dataset.sec; stopScanner(); render(); }));
    $('#signout').addEventListener('click', async () => { await store.signOut(); location.href = 'index.html'; });
  }

  function csv(rows, name) {
    const out = '﻿' + rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    SIG.download(name, out, 'text/csv;charset=utf-8');
  }

  // ---------- sections ----------
  const R = {};
  R.overview = () => {
    const k = [[t('التسجيلات', 'Registrations'), S.regs.length], [t('الحضور', 'Checked in'), S.regs.filter((r) => r.checkedIn).length], [t('ملخصات بانتظار المراجعة', 'Abstracts to review'), S.abs.filter((a) => a.status === 'review').length], [t('الأعضاء', 'Members'), S.members.length], [t('رسائل جديدة', 'New messages'), S.msgs.filter((m) => !m.read).length]];
    return '<h1 style="font-size:28px">' + t('نظرة عامة', 'Overview') + '</h1>' +
      '<div class="grid" style="--min:180px;--gap:14px">' + k.map((x) => '<div class="card"><span class="muted" style="font-size:14px">' + x[0] + '</span><b class="latin" style="font-size:32px;color:var(--red)">' + x[1] + '</b></div>').join('') + '</div>' +
      '<div class="card"><h2 style="font-size:19px">' + t('الفعالية القادمة', 'Upcoming event') + '</h2><p>' + esc(t(S.settings.titleAr, S.settings.titleEn)) + ' — ' + esc(SIG.fmtDate(S.settings.date)) + ' · ' + (S.settings.registrationOpen === false ? t('التسجيل مغلق', 'Registration closed') : t('التسجيل مفتوح', 'Registration open')) + '</p>' +
      '<div class="row" style="--gap:10px"><button class="btn btn-soft" data-go="event">' + t('تعديل الفعالية', 'Edit event') + '</button><button class="btn btn-soft" data-go="attend">' + t('تسجيل حضور', 'Check in') + '</button><button class="btn btn-soft" data-go="abs">' + t('مراجعة الملخصات', 'Review abstracts') + '</button><button class="btn btn-soft" data-go="news">' + t('نشر خبر', 'Post news') + '</button></div></div>';
  };
  R.event = () => {
    const s = S.settings; const d = String(s.date || '').slice(0, 16);
    return '<h1 style="font-size:28px">' + t('الفعالية القادمة', 'Upcoming event') + '</h1>' +
      '<form id="f-settings" class="panel panel-pad form"><div class="grid" style="--min:260px;--gap:14px">' +
      '<label class="field"><span>' + t('العنوان (عربي)', 'Title (Arabic)') + '</span><input name="titleAr" required value="' + esc(s.titleAr) + '"></label>' +
      '<label class="field"><span>' + t('العنوان (إنجليزي)', 'Title (English)') + '</span><input name="titleEn" required dir="ltr" value="' + esc(s.titleEn) + '"></label>' +
      '<label class="field"><span>' + t('التاريخ والوقت', 'Date & time') + '</span><input name="date" type="datetime-local" required value="' + esc(d) + '"></label>' +
      '<label class="field"><span>' + t('المدة بالساعات', 'Duration (hours)') + '</span><input name="durationHours" type="number" min="1" max="72" value="' + esc(s.durationHours || 8) + '"></label>' +
      '<label class="field"><span>' + t('المكان (عربي)', 'Venue (Arabic)') + '</span><input name="venueAr" value="' + esc(s.venueAr) + '"></label>' +
      '<label class="field"><span>' + t('المكان (إنجليزي)', 'Venue (English)') + '</span><input name="venueEn" dir="ltr" value="' + esc(s.venueEn) + '"></label>' +
      '<label class="field"><span>' + t('ساعات التعليم المستمر', 'CME hours') + '</span><input name="cmeHours" value="' + esc(s.cmeHours) + '"></label>' +
      '</div><label class="consent"><input type="checkbox" name="registrationOpen"' + (s.registrationOpen === false ? '' : ' checked') + '><span>' + t('التسجيل مفتوح', 'Registration open') + '</span></label>' +
      '<button class="btn btn-primary" style="align-self:flex-start">' + t('حفظ', 'Save') + '</button></form>' +
      '<h2 style="font-size:22px;margin-top:12px">' + t('مواعيد الاجتماعات الدورية والورش', 'Group meetings & workshops schedule') + '</h2>' +
      '<form id="f-event" class="panel panel-pad grid" style="--min:180px;--gap:12px;align-items:end">' +
      '<label class="field"><span>' + t('اسم الفعالية', 'Name') + '</span><input name="title" required></label>' +
      '<label class="field"><span>' + t('النوع', 'Type') + '</span><select name="type"><option value="meeting">' + t('اجتماع دوري', 'Group meeting') + '</option><option value="workshop">' + t('ورشة متخصصة', 'Workshop') + '</option><option value="annual">' + t('ملتقى / مؤتمر', 'Meeting / conference') + '</option></select></label>' +
      '<label class="field"><span>' + t('التاريخ', 'Date') + '</span><input name="date" type="date" required></label>' +
      '<label class="field"><span>' + t('المكان', 'Venue') + '</span><input name="place"></label>' +
      '<button class="btn btn-primary">' + t('إضافة', 'Add') + '</button></form>' +
      (S.events.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>' + t('الفعالية', 'Event') + '</th><th>' + t('النوع', 'Type') + '</th><th>' + t('التاريخ', 'Date') + '</th><th>' + t('المكان', 'Venue') + '</th><th></th></tr></thead><tbody>' +
        S.events.map((e) => '<tr><td><strong>' + esc(e.title) + '</strong></td><td>' + SIG.typeLabel(e.type) + '</td><td class="latin">' + esc(e.date) + '</td><td>' + esc(e.place || '') + '</td><td><button class="btn btn-outline btn-sm" data-del-event="' + esc(e.id) + '">' + t('حذف', 'Delete') + '</button></td></tr>').join('') + '</tbody></table></div>' : '');
  };
  R.regs = () => {
    const q = S.q.toLowerCase();
    const list = S.regs.filter((r) => !q || [r.name, r.email, r.ticket, r.mobile].join(' ').toLowerCase().includes(q));
    return '<div class="row between"><h1 style="font-size:28px">' + t('التسجيلات', 'Registrations') + '</h1><button class="btn btn-outline" id="exp-regs">' + t('تصدير CSV (Excel)', 'Export CSV (Excel)') + '</button></div>' +
      '<label class="search"><span style="color:#8A7E81">' + SIG.icon.search + '</span><input type="search" id="q" value="' + esc(S.q) + '" placeholder="' + t('ابحث بالاسم أو البريد أو رقم التذكرة', 'Search by name, email or ticket') + '" aria-label="' + t('بحث', 'Search') + '"></label>' +
      (list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>' + t('الاسم', 'Name') + '</th><th>' + t('البريد', 'Email') + '</th><th>' + t('الجوال', 'Mobile') + '</th><th>' + t('الفئة', 'Category') + '</th><th>' + t('التذكرة', 'Ticket') + '</th><th>' + t('الحالة', 'Status') + '</th></tr></thead><tbody>' +
        list.map((r) => '<tr><td><strong>' + esc(r.name) + '</strong></td><td class="latin">' + esc(r.email) + '</td><td class="latin">' + esc(r.mobile) + '</td><td>' + SIG.categoryLabel(r.category) + '</td><td class="latin">' + esc(r.ticket) + '</td><td><span class="tag ' + (r.checkedIn ? 'tag-green">' + t('حضر', 'Attended') : 'tag-blue">' + t('مسجل', 'Registered')) + '</span></td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty">' + t('لا توجد تسجيلات.', 'No registrations.') + '</div>');
  };
  R.attend = () => {
    const done = S.regs.filter((r) => r.checkedIn).sort((a, b) => String(b.checkinAt || '').localeCompare(String(a.checkinAt || '')));
    const pending = done.filter((r) => !r.certIssued).length;
    return '<h1 style="font-size:28px">' + t('الحضور والشهادات', 'Attendance & certificates') + '</h1>' +
      '<div class="panel panel-pad stack"><p class="muted">' + t('امسح رمز التذكرة أو بطاقة العضو، أو أدخل الرقم يدوياً.', 'Scan the ticket or member card QR, or type the number.') + '</p>' +
      '<form id="f-checkin" class="row" style="--gap:10px;align-items:end"><label class="field" style="flex:1 1 260px"><span>' + t('رقم التذكرة أو العضوية', 'Ticket or member number') + '</span><input name="code" required dir="ltr" placeholder="SIG-XXXX" autocomplete="off"></label>' +
      '<button class="btn btn-primary">' + t('تسجيل الحضور', 'Check in') + '</button><button type="button" class="btn btn-outline" id="scan-btn">' + SIG.icon.scan + t('مسح بالكاميرا', 'Scan with camera') + '</button></form>' +
      '<div id="reader" style="max-width:420px;width:100%"></div></div>' +
      '<div class="row between"><h2 style="font-size:20px">' + t('الحاضرون', 'Attendees') + ' (' + done.length + ')</h2><div class="row" style="--gap:10px">' +
      '<button class="btn btn-primary" id="issue"' + (pending ? '' : ' disabled') + '>' + t('إصدار الشهادات', 'Issue certificates') + ' (' + pending + ')</button><button class="btn btn-outline" id="exp-att">' + t('تصدير CSV', 'Export CSV') + '</button></div></div>' +
      (done.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>' + t('الاسم', 'Name') + '</th><th>' + t('التذكرة', 'Ticket') + '</th><th>' + t('الوقت', 'Time') + '</th><th>' + t('الشهادة', 'Certificate') + '</th></tr></thead><tbody>' +
        done.map((r) => '<tr><td><strong>' + esc(r.name) + '</strong></td><td class="latin">' + esc(r.ticket) + '</td><td>' + (r.checkinAt ? SIG.fmtTime(r.checkinAt) : '') + '</td><td>' + (r.certIssued ? '<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="certificate.html?id=' + encodeURIComponent(r.id) + '">' + t('عرض', 'View') + '</a>' : '<span class="tag tag-gray">' + t('لم تصدر', 'Not issued') + '</span>') + '</td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty">' + t('لا يوجد حضور مسجل بعد.', 'No check-ins yet.') + '</div>');
  };
  R.abs = () => {
    const ST = ABS();
    return '<h1 style="font-size:28px">' + t('مراجعة الملخصات البحثية', 'Abstract review') + '</h1>' +
      (S.abs.length ? S.abs.map((a) => '<article class="card"><div class="row between"><div class="stack" style="--gap:4px"><strong style="font-size:16.5px">' + esc(a.title) + '</strong><span class="muted" style="font-size:13.5px">' + esc(a.name) + ' · <span class="latin">' + esc(a.email) + '</span> · ' + esc(a.ref) + '</span></div><span class="tag ' + (ST[a.status] || ST.review)[1] + '">' + (ST[a.status] || ST.review)[0] + '</span></div>' +
        '<details><summary style="cursor:pointer;font-weight:600;color:var(--red-d)">' + t('عرض الملخص', 'Read abstract') + '</summary><p style="margin-top:10px;white-space:pre-line">' + esc(a.authors) + '\n\n' + esc(a.body) + '</p>' + (a.link ? '<a href="' + esc(a.link) + '" target="_blank" rel="noopener">' + t('الملف المرفق', 'Attachment') + '</a>' : '') + '</details>' +
        '<div class="row" style="--gap:8px"><button class="btn btn-sm" style="background:var(--green-bg);color:var(--green)" data-abs="' + esc(a.id) + '" data-st="oral">' + t('قبول شفهي', 'Accept oral') + '</button><button class="btn btn-sm" style="background:var(--blue-bg);color:var(--blue)" data-abs="' + esc(a.id) + '" data-st="poster">' + t('قبول ملصق', 'Accept poster') + '</button><button class="btn btn-sm" style="background:var(--orange-bg);color:var(--orange)" data-abs="' + esc(a.id) + '" data-st="revise">' + t('طلب تعديل', 'Request revision') + '</button><button class="btn btn-outline btn-sm" data-abs="' + esc(a.id) + '" data-st="reject">' + t('رفض', 'Reject') + '</button></div></article>').join('')
        : '<div class="empty">' + t('لا توجد ملخصات.', 'No abstracts.') + '</div>');
  };
  R.members = () => {
    const q = S.mq.toLowerCase();
    const list = S.members.filter((m) => !q || [SIG.memberName(m), m.email, m.memberNo, m.org].join(' ').toLowerCase().includes(q));
    return '<div class="row between"><h1 style="font-size:28px">' + t('الأعضاء وطباعة البطاقات', 'Members & card printing') + '</h1><div class="row" style="--gap:10px"><a class="btn btn-primary" href="card.html?all=1" target="_blank" rel="noopener">' + t('طباعة كل البطاقات', 'Print all cards') + '</a><button class="btn btn-outline" id="exp-mem">' + t('تصدير CSV', 'Export CSV') + '</button></div></div>' +
      '<label class="search"><span style="color:#8A7E81">' + SIG.icon.search + '</span><input type="search" id="mq" value="' + esc(S.mq) + '" placeholder="' + t('ابحث بالاسم أو رقم العضوية أو الجهة', 'Search by name, member no. or institution') + '" aria-label="' + t('بحث', 'Search') + '"></label>' +
      (list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>' + t('الاسم', 'Name') + '</th><th>' + t('رقم العضوية', 'Member no.') + '</th><th>' + t('الفئة', 'Category') + '</th><th>' + t('الجهة', 'Institution') + '</th><th>' + t('البطاقة', 'Card') + '</th></tr></thead><tbody>' +
        list.map((m) => '<tr><td><strong>' + esc(SIG.memberName(m)) + '</strong><div class="muted latin" style="font-size:12.5px">' + esc(m.email) + '</div></td><td class="latin">' + esc(m.memberNo) + '</td><td>' + SIG.categoryLabel(m.category) + '</td><td>' + esc(m.org || '') + '</td><td><a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="card.html?uid=' + encodeURIComponent(m.uid || m.id) + '">' + t('طباعة', 'Print') + '</a></td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty">' + t('لا يوجد أعضاء.', 'No members.') + '</div>');
  };
  R.library = () => '<h1 style="font-size:28px">' + t('المنشورات والمجلات', 'Publications & journals') + '</h1>' +
    '<p class="muted">' + t('روابط مواد الفعاليات السابقة تُضبط في ملف assets/js/config.js. هنا تضيف منشورات الأعضاء وروابط المجلات.', 'Past-event material links live in assets/js/config.js. Add member publications and journal links here.') + '</p>' +
    '<form id="f-pub" class="panel panel-pad grid" style="--min:180px;--gap:12px;align-items:end">' +
    '<label class="field" style="grid-column:1/-1"><span>' + t('العنوان', 'Title') + '</span><input name="title" required></label>' +
    '<label class="field"><span>' + t('النوع', 'Type') + '</span><select name="kind"><option value="pubs">' + t('منشور عضو', 'Member publication') + '</option><option value="journals">' + t('مجلة علمية', 'Journal') + '</option></select></label>' +
    '<label class="field"><span>' + t('السنة', 'Year') + '</span><input name="year" inputmode="numeric" maxlength="4"></label>' +
    '<label class="field"><span>' + t('الرابط', 'Link') + '</span><input name="url" type="url" required dir="ltr" placeholder="https://"></label>' +
    '<button class="btn btn-primary">' + t('إضافة', 'Add') + '</button></form>' +
    S.pubs.map((p) => '<div class="card row between" style="flex-direction:row"><div class="stack" style="--gap:2px"><strong>' + esc(p.title) + '</strong><span class="muted" style="font-size:13px">' + (p.kind === 'journals' ? t('مجلة', 'Journal') : t('منشور', 'Publication')) + ' · ' + esc(p.year || '') + '</span></div><button class="btn btn-outline btn-sm" data-del-pub="' + esc(p.id) + '">' + t('حذف', 'Delete') + '</button></div>').join('');
  R.news = () => '<h1 style="font-size:28px">' + t('شريط الأخبار', 'News bar') + '</h1>' +
    '<p class="muted">' + t('عند عدم وجود أخبار يعرض الموقع الأخبار الافتراضية.', 'When empty, the site shows the default news items.') + '</p>' +
    '<form id="f-news" class="row" style="--gap:10px;align-items:end"><label class="field" style="flex:1 1 360px"><span>' + t('خبر جديد', 'New item') + '</span><input name="text" required></label><button class="btn btn-primary">' + t('نشر', 'Publish') + '</button></form>' +
    S.news.map((n) => '<div class="card row between" style="flex-direction:row"><span>' + esc(n.text) + '</span><button class="btn btn-outline btn-sm" data-del-news="' + esc(n.id) + '">' + t('حذف', 'Delete') + '</button></div>').join('');
  R.msgs = () => {
    const D = DEPT();
    return '<h1 style="font-size:28px">' + t('الرسائل', 'Messages') + '</h1>' +
      (S.msgs.length ? S.msgs.map((m) => '<article class="card"' + (m.read ? '' : ' style="border-color:var(--rose300)"') + '><div class="row between"><strong>' + esc(m.subject) + '</strong><span class="tag tag-rose">' + esc(D[m.dept] || m.dept) + '</span></div><span class="muted" style="font-size:13.5px">' + esc(m.name) + ' · <a class="latin" href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a> · ' + SIG.fmtDate(m.createdAt) + '</span><p style="white-space:pre-line;color:var(--ink)">' + esc(m.message) + '</p>' +
        (m.read ? '' : '<button class="btn btn-soft btn-sm" style="align-self:flex-start" data-read="' + esc(m.id) + '">' + t('تمييز كمقروءة', 'Mark as read') + '</button>') + '</article>').join('')
        : '<div class="empty">' + t('لا توجد رسائل.', 'No messages.') + '</div>');
  };

  // ---------- actions ----------
  async function checkIn(code) {
    code = String(code || '').trim().toUpperCase(); if (!code) return;
    let r = S.regs.find((x) => String(x.ticket).toUpperCase() === code) || S.regs.find((x) => String(x.memberNo || '').toUpperCase() === code);
    if (!r) {
      const m = S.members.find((x) => String(x.memberNo).toUpperCase() === code);
      if (m) r = S.regs.find((x) => x.email === m.email);
      if (m && !r) {
        const s = S.settings;
        r = await store.add('registrations', { name: SIG.memberName(m), email: m.email, mobile: m.mobile || '', category: m.category || '', schs: m.schs || '', ticket: store.code('SIG'), memberNo: m.memberNo, uid: m.uid, eventTitle: s.titleAr || '', eventTitleEn: s.titleEn || '', eventDate: s.date || '', cmeHours: s.cmeHours || '', checkedIn: false, certIssued: false, walkIn: true });
        S.regs.unshift(r);
      }
    }
    if (!r) { SIG.toast(t('لم يُعثر على تذكرة أو عضو بهذا الرقم', 'No ticket or member found for this code')); return; }
    if (r.checkedIn) { SIG.toast(r.name + ' — ' + t('مسجل حضوره مسبقاً', 'already checked in')); return; }
    const at = new Date().toISOString();
    await store.update('registrations', r.id, { checkedIn: true, checkinAt: at });
    Object.assign(r, { checkedIn: true, checkinAt: at });
    SIG.toast(t('تم تسجيل حضور ', 'Checked in: ') + r.name);
    render();
  }
  async function startScanner() {
    const box = $('#reader'); if (!box) return;
    try {
      if (!window.Html5Qrcode) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/vendor/html5-qrcode.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      S.scanner = new window.Html5Qrcode('reader');
      let last = '';
      await S.scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (text) => { if (text === last) return; last = text; setTimeout(() => (last = ''), 3000); checkIn(text); });
    } catch (e) { SIG.toast(t('تعذر تشغيل الكاميرا — اسمح بالوصول أو أدخل الرقم يدوياً.', 'Camera unavailable — allow access or type the number.')); }
  }
  function stopScanner() { if (S.scanner) { S.scanner.stop().catch(() => {}); S.scanner = null; } }

  function bind() {
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => { S.sec = b.dataset.go; render(); }));
    const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
    on('#f-settings', 'submit', async (e) => {
      e.preventDefault(); const f = e.target;
      const data = { titleAr: V(f, 'titleAr'), titleEn: V(f, 'titleEn'), date: V(f, 'date'), durationHours: Number(V(f, 'durationHours')) || 8, venueAr: V(f, 'venueAr'), venueEn: V(f, 'venueEn'), cmeHours: V(f, 'cmeHours'), registrationOpen: V(f, 'registrationOpen') };
      try { await store.set('settings', 'site', data); Object.assign(S.settings, data); SIG.toast(t('تم الحفظ', 'Saved')); } catch (err) { SIG.toast(store.authError(err)); }
    });
    on('#f-event', 'submit', async (e) => {
      e.preventDefault(); const f = e.target;
      try { const ev = await store.add('events', { title: V(f, 'title'), type: V(f, 'type'), date: V(f, 'date'), place: V(f, 'place') }); S.events.unshift(ev); render(); } catch (err) { SIG.toast(store.authError(err)); }
    });
    $$('[data-del-event]').forEach((b) => b.addEventListener('click', async () => { if (!confirm(t('حذف هذه الفعالية؟', 'Delete this event?'))) return; await store.remove('events', b.dataset.delEvent); S.events = S.events.filter((x) => x.id !== b.dataset.delEvent); render(); }));
    on('#q', 'input', (e) => { S.q = e.target.value; const pos = e.target.selectionStart; render(); const el = $('#q'); el.focus(); el.setSelectionRange(pos, pos); });
    on('#mq', 'input', (e) => { S.mq = e.target.value; const pos = e.target.selectionStart; render(); const el = $('#mq'); el.focus(); el.setSelectionRange(pos, pos); });
    on('#exp-regs', 'click', () => csv([['Name', 'Email', 'Mobile', 'Category', 'SCFHS', 'Ticket', 'Member no.', 'Checked in', 'Registered at']].concat(S.regs.map((r) => [r.name, r.email, r.mobile, r.category, r.schs, r.ticket, r.memberNo || '', r.checkedIn ? 'yes' : 'no', r.createdAt])), 'sig-registrations.csv'));
    on('#exp-att', 'click', () => csv([['Name', 'Email', 'Ticket', 'Check-in time', 'Certificate']].concat(S.regs.filter((r) => r.checkedIn).map((r) => [r.name, r.email, r.ticket, r.checkinAt, r.certIssued ? 'issued' : ''])), 'sig-attendance.csv'));
    on('#exp-mem', 'click', () => csv([['Member no.', 'Name', 'Email', 'Mobile', 'Category', 'SCFHS', 'Institution', 'Department', 'Job title', 'Interest', 'Joined']].concat(S.members.map((m) => [m.memberNo, SIG.memberName(m), m.email, m.mobile, m.category, m.schs, m.org, m.dept, m.job, m.interest, m.createdAt])), 'sig-members.csv'));
    on('#f-checkin', 'submit', async (e) => { e.preventDefault(); const f = e.target; await checkIn(V(f, 'code')); const i = $('#f-checkin input'); if (i) { i.value = ''; i.focus(); } });
    on('#scan-btn', 'click', () => (S.scanner ? stopScanner() : startScanner()));
    on('#issue', 'click', async (e) => {
      e.target.disabled = true;
      const todo = S.regs.filter((r) => r.checkedIn && !r.certIssued);
      for (const r of todo) { try { await store.update('registrations', r.id, { certIssued: true }); r.certIssued = true; } catch (err) {} }
      SIG.toast(t('أُصدرت ', 'Issued ') + todo.length + t(' شهادة', ' certificates')); render();
    });
    $$('[data-abs]').forEach((b) => b.addEventListener('click', async () => {
      try { await store.update('abstracts', b.dataset.abs, { status: b.dataset.st }); const a = S.abs.find((x) => x.id === b.dataset.abs); if (a) a.status = b.dataset.st; render(); } catch (err) { SIG.toast(store.authError(err)); }
    }));
    on('#f-pub', 'submit', async (e) => { e.preventDefault(); const f = e.target; try { const p = await store.add('publications', { title: V(f, 'title'), kind: V(f, 'kind'), year: V(f, 'year'), url: V(f, 'url') }); S.pubs.unshift(p); render(); } catch (err) { SIG.toast(store.authError(err)); } });
    $$('[data-del-pub]').forEach((b) => b.addEventListener('click', async () => { await store.remove('publications', b.dataset.delPub); S.pubs = S.pubs.filter((x) => x.id !== b.dataset.delPub); render(); }));
    on('#f-news', 'submit', async (e) => { e.preventDefault(); const f = e.target; try { const n = await store.add('news', { text: V(f, 'text') }); S.news.unshift(n); render(); } catch (err) { SIG.toast(store.authError(err)); } });
    $$('[data-del-news]').forEach((b) => b.addEventListener('click', async () => { await store.remove('news', b.dataset.delNews); S.news = S.news.filter((x) => x.id !== b.dataset.delNews); render(); }));
    $$('[data-read]').forEach((b) => b.addEventListener('click', async () => { await store.update('messages', b.dataset.read, { read: true }); const m = S.msgs.find((x) => x.id === b.dataset.read); if (m) m.read = true; render(); }));
  }

  function render() {
    if ($('#admin-view').classList.contains('hidden')) return;
    nav();
    $('#admin-main').innerHTML = (R[S.sec] || R.overview)();
    bind();
  }

  function guard(html) { $('#loading').classList.add('hidden'); const g = $('#guard'); g.innerHTML = '<div class="panel panel-pad stack" style="--gap:14px">' + html + '</div>'; g.classList.remove('hidden'); }

  async function init() {
    try { S.user = await store.currentUser(); } catch (e) { S.user = null; }
    if (store.isFirebase && !S.user) { guard('<h1 style="font-size:24px">' + t('لوحة التحكم للمشرفين', 'Admins only') + '</h1><p class="muted">' + t('سجّل دخولك بحساب المشرف أولاً.', 'Sign in with an admin account first.') + '</p><a class="btn btn-primary" style="align-self:flex-start" href="portal.html?next=admin.html">' + t('دخول', 'Sign in') + '</a>'); return; }
    const ok = await store.isAdmin(S.user || { uid: 'demo' });
    if (!ok) { guard('<h1 style="font-size:24px">' + t('لا تملك صلاحية المشرف', 'You are not an admin') + '</h1><p class="muted">' + t('أضف مستنداً باسم معرّف حسابك (UID) في مجموعة admins داخل Firestore — راجع README.', 'Add a document named with your account UID in the Firestore “admins” collection — see README.') + '</p><code class="latin" style="background:var(--rose50);padding:10px;border-radius:10px">' + esc(S.user ? S.user.uid : '') + '</code>'); return; }
    await loadAll();
    $('#loading').classList.add('hidden'); $('#admin-view').classList.remove('hidden');
    render();
  }
  document.addEventListener('sig:ready', init);
  document.addEventListener('sig:lang', render);
})();
