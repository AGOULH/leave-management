(function () {
  const SIG = window.SIG; const t = SIG.t; const $ = SIG.$, $$ = SIG.$$;
  const S = { view: 'upcoming', mode: 'attend', tab: 'program', filter: 'all', settings: null, events: [], user: null, member: null, ticket: null, abs: null, notify: {} };

  function setView(v) {
    S.view = v;
    $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === v ? 'true' : 'false'));
    $('#view-upcoming').classList.toggle('hidden', v !== 'upcoming');
    $('#view-archive').classList.toggle('hidden', v !== 'archive');
  }
  function setMode(m) {
    S.mode = m;
    $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'));
    $('#f-attend').classList.toggle('hidden', m !== 'attend' || !!S.ticket);
    $('#ticket-box').classList.toggle('hidden', m !== 'attend' || !S.ticket);
    $('#f-abstract').classList.toggle('hidden', m !== 'abstract' || !!S.abs);
    $('#abs-box').classList.toggle('hidden', m !== 'abstract' || !S.abs);
  }
  function setTab(k) {
    S.tab = k;
    $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === k ? 'true' : 'false'));
    $$('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== k));
  }

  function renderEvent() {
    const s = S.settings; if (!s) return;
    const title = t(s.titleAr, s.titleEn);
    $('#ev-title').textContent = title;
    const ts = Date.parse(s.date);
    $('#ev-date').textContent = isNaN(ts) ? t('[التاريخ يُحدَّد لاحقاً]', '[Date to be announced]') : SIG.fmtDate(new Date(ts), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#ev-venue').textContent = t(s.venueAr, s.venueEn);
    $('#ev-cme').textContent = (s.cmeHours || '[—]') + ' ' + t('ساعة تعليم مستمر', 'CME hours');
    $('#cme-hours').textContent = s.cmeHours || '[—]';
    $('#cal-google').href = SIG.calUrl(title, s.date, s.durationHours);
    $('#i-cal').innerHTML = SIG.icon.cal; $('#i-pin').innerHTML = SIG.icon.pin; $('#i-cert').innerHTML = SIG.icon.cert;
  }

  function upcomingOf(type) {
    const today = new Date().toISOString().slice(0, 10);
    return S.events.filter((e) => e.type === type && (e.date || '') >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  }
  function renderFormats() {
    const open = S.settings && S.settings.registrationOpen !== false;
    const cards = [
      { key: 'annual', title: t('الملتقى السنوي', 'Annual Meeting'), ev: open ? { title: t('التفاصيل والتسجيل أدناه', 'Details and registration below') } : null },
      { key: 'meeting', title: t('الاجتماع الدوري للمجموعة', 'Group Regular Meeting'), ev: upcomingOf('meeting') },
      { key: 'workshop', title: t('الورش المتخصصة', 'Specialised Workshops'), ev: upcomingOf('workshop') }
    ];
    $('#formats').innerHTML = cards.map((c) => {
      const has = !!c.ev;
      let body = has
        ? '<span class="muted" style="font-size:14.5px">' + SIG.esc(c.ev.title) + (c.ev.date ? ' — ' + SIG.fmtDate(c.ev.date) : '') + (c.ev.place ? ' · ' + SIG.esc(c.ev.place) : '') + '</span>'
        : '<span class="muted" style="font-size:14.5px">' + t('سيُعلن الموعد القادم هنا وعبر البريد.', 'The next date will be posted here and by email.') + '</span>';
      if (!has) {
        body += S.notify[c.key]
          ? '<span class="tag tag-green">' + t('سنبلغك عند الإعلان', 'We’ll notify you') + '</span>'
          : '<form class="row notify-form" data-type="' + c.key + '" style="--gap:8px"><label class="sr-only" for="n-' + c.key + '">' + t('بريدك', 'Your email') + '</label><input id="n-' + c.key + '" class="input" type="email" required dir="ltr" placeholder="' + t('بريدك الإلكتروني', 'Your email') + '" style="flex:1 1 160px;min-height:42px"><button class="btn btn-outline btn-sm" type="submit">' + t('نبّهني', 'Notify me') + '</button></form>';
      }
      return '<article class="card"><div class="row between"><strong style="font-size:17px">' + c.title + '</strong><span class="tag ' + (has ? 'tag-green">' + t('مُعلن', 'Announced') : 'tag-gray">' + t('لا موعد بعد', 'Not scheduled')) + '</span></div>' + body + '</article>';
    }).join('');
    $$('.notify-form').forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault(); const inp = f.querySelector('input'); if (!inp.checkValidity()) { inp.reportValidity(); return; }
      try { await SIG.store.add('notify', { type: f.dataset.type, email: inp.value.trim().toLowerCase() }); S.notify[f.dataset.type] = true; renderFormats(); SIG.toast(t('تم — سنبلغك عند الإعلان', 'Done — we’ll notify you')); }
      catch (err) { SIG.toast(SIG.store.authError(err)); }
    }));
  }

  function renderTicket() {
    const r = S.ticket; if (!r) return;
    const s = S.settings || {};
    $('#ticket-box').innerHTML =
      '<span class="success-icon">' + SIG.icon.check + '</span><h3 style="font-size:19px">' + t('تم تسجيلك بنجاح', 'You’re registered') + '</h3>' +
      '<p class="muted" style="font-size:14.5px">' + t('شكراً ' + SIG.esc(r.name) + '. احفظ هذه التذكرة (لقطة شاشة) واعرض الرمز عند بوابة التسجيل.', 'Thank you ' + SIG.esc(r.name) + '. Save this ticket (screenshot) and show the code at the registration desk.') + '</p>' +
      '<div class="ticket"><div class="qr">' + SIG.qrSvg(r.ticket, 150) + '</div><b class="latin" style="letter-spacing:.08em;color:var(--red-d)">' + SIG.esc(r.ticket) + '</b><span class="muted" style="font-size:13px">' + SIG.esc(t(s.titleAr, s.titleEn)) + '</span></div>' +
      '<div class="row" style="justify-content:center;--gap:8px"><a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="' + SIG.calUrl(t(s.titleAr, s.titleEn), s.date, s.durationHours) + '">' + t('أضف إلى التقويم', 'Add to calendar') + '</a>' +
      '<button type="button" class="btn btn-outline btn-sm" id="another">' + t('تسجيل شخص آخر', 'Register someone else') + '</button></div>';
    $('#another').addEventListener('click', () => { S.ticket = null; $('#f-attend').reset(); prefill(); setMode('attend'); });
  }
  function renderAbs() {
    const a = S.abs; if (!a) return;
    $('#abs-box').innerHTML =
      '<span class="success-icon">' + SIG.icon.check + '</span><h3 style="font-size:19px">' + t('تم استلام ملخصك', 'Abstract received') + '</h3>' +
      '<p class="muted" style="font-size:14.5px">' + t('رقم الطلب: ', 'Reference: ') + '<b class="latin">' + SIG.esc(a.ref) + '</b></p>' +
      '<ol class="steps"><li class="done"><b>1</b>' + t('تم استلام الملخص', 'Abstract received') + '</li><li class="now"><b>2</b>' + t('مراجعة اللجنة العلمية', 'Scientific committee review') + '</li><li><b>3</b>' + t('القرار: قبول شفهي / ملصق / تعديل', 'Decision: oral / poster / revise') + '</li></ol>' +
      '<a class="btn btn-primary" href="portal.html">' + t('تابع الحالة في بوابة العضو', 'Track status in the portal') + '</a>';
  }

  function renderArchive() {
    $('#archive-title').textContent = t('أرشيف الفعاليات', 'Events archive');
    const today = new Date().toISOString().slice(0, 10);
    const extra = S.events.filter((e) => (e.date || '') < today).map((e) => ({ key: e.id, type: e.type, date: e.date, ar: e.title, en: e.title, placeAr: e.place || '', placeEn: e.place || '', descAr: '', descEn: '' }));
    const all = extra.concat(SIG.ARCHIVE);
    const defs = [['all', t('الكل', 'All') + ' (' + all.length + ')'], ['annual', t('الملتقيات والمؤتمرات', 'Meetings & conferences')], ['workshop', t('الورش', 'Workshops')], ['meeting', t('الاجتماعات الدورية', 'Group meetings')]];
    $('#archive-filters').setAttribute('aria-label', t('تصفية حسب النوع', 'Filter by type'));
    $('#archive-filters').innerHTML = defs.map((d) => '<button type="button" data-f="' + d[0] + '" aria-pressed="' + (S.filter === d[0]) + '">' + d[1] + '</button>').join('');
    $$('#archive-filters button').forEach((b) => b.addEventListener('click', () => { S.filter = b.dataset.f; renderArchive(); }));
    const list = all.filter((e) => S.filter === 'all' || e.type === S.filter);
    $('#archive-list').innerHTML = list.length ? list.map((e) =>
      '<li><article class="card"><div class="row" style="--gap:10px"><b style="font-size:14px;color:var(--red-d)">' + SIG.fmtDate(e.date) + '</b><span class="tag tag-outline" style="font-weight:600">' + SIG.typeLabel(e.type) + '</span></div>' +
      '<h3>' + SIG.esc(t(e.ar, e.en)) + '</h3>' + (e.placeAr ? '<span class="row" style="--gap:8px;font-size:14.5px;color:#4A4043"><span style="color:var(--red)">' + SIG.icon.pin + '</span>' + SIG.esc(t(e.placeAr, e.placeEn)) + '</span>' : '') +
      (e.descAr ? '<p>' + SIG.esc(t(e.descAr, e.descEn)) + '</p>' : '') +
      '<div class="row" style="--gap:16px"><a href="library.html?event=' + encodeURIComponent(e.key) + '" style="font-weight:600;text-decoration:none">' + t('المواد العلمية', 'Materials') + '</a><a href="library.html?tab=gallery&event=' + encodeURIComponent(e.key) + '" style="font-weight:600;text-decoration:none">' + t('الصور', 'Photos') + '</a><a href="portal.html#certs" style="font-weight:600;text-decoration:none">' + t('شهادتي', 'My certificate') + '</a></div></article></li>').join('')
      : '<div class="empty">' + t('لا توجد فعاليات من هذا النوع في الأرشيف.', 'No events of this type in the archive.') + '</div>';
  }

  const F = (f, k) => f.elements.namedItem(k);
  const V = (f, k) => (F(f, k) ? String(F(f, k).value).trim() : '');
  function prefill() {
    if (!S.member && !S.user) return;
    const name = S.member ? [S.member.first, S.member.last].filter(Boolean).join(' ') : '';
    [['#f-attend', true], ['#f-abstract', false]].forEach(([sel, withMobile]) => {
      const f = $(sel);
      if (name && !V(f, 'name')) F(f, 'name').value = name;
      if (S.user && !V(f, 'email')) F(f, 'email').value = S.user.email;
      if (withMobile && S.member && S.member.mobile && !V(f, 'mobile')) F(f, 'mobile').value = S.member.mobile;
    });
  }
  function formErr(form, msg) { const m = form.querySelector('.form-msg'); m.textContent = msg; m.classList.toggle('hidden', !msg); }

  async function submitAttend(e) {
    e.preventDefault(); const f = e.target; formErr(f, '');
    if (!f.checkValidity()) { f.reportValidity(); return; }
    if (S.settings && S.settings.registrationOpen === false) { formErr(f, t('التسجيل مغلق حالياً.', 'Registration is currently closed.')); return; }
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const s = S.settings || {};
      const data = { name: V(f, 'name'), email: V(f, 'email').toLowerCase(), mobile: V(f, 'mobile'), category: V(f, 'category'), schs: V(f, 'schs'), ticket: SIG.store.code('SIG'), eventTitle: s.titleAr || '', eventTitleEn: s.titleEn || '', eventDate: s.date || '', cmeHours: s.cmeHours || '', checkedIn: false, certIssued: false };
      if (S.user) data.uid = S.user.uid;
      if (S.member && S.member.memberNo) data.memberNo = S.member.memberNo;
      S.ticket = await SIG.store.add('registrations', data);
      renderTicket(); setMode('attend');
    } catch (err) { formErr(f, SIG.store.authError(err)); }
    btn.disabled = false;
  }
  async function submitAbstract(e) {
    e.preventDefault(); const f = e.target; formErr(f, '');
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const data = { name: V(f, 'name'), email: V(f, 'email').toLowerCase(), title: V(f, 'title'), authors: V(f, 'authors'), track: V(f, 'track'), format: V(f, 'format'), body: V(f, 'body'), link: V(f, 'link'), ref: SIG.store.code('ABS'), status: 'review' };
      if (S.user) data.uid = S.user.uid;
      S.abs = await SIG.store.add('abstracts', data);
      renderAbs(); setMode('abstract');
    } catch (err) { formErr(f, SIG.store.authError(err)); }
    btn.disabled = false;
  }

  function renderAll() { renderEvent(); renderFormats(); renderArchive(); renderTicket(); renderAbs(); }

  async function init() {
    $$('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    $$('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $$('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $('#f-attend').addEventListener('submit', submitAttend);
    $('#f-abstract').addEventListener('submit', submitAbstract);
    $('#cal-ics').addEventListener('click', () => { const s = S.settings || {}; SIG.downloadIcs(t(s.titleAr, s.titleEn), s.date, s.durationHours, t(s.venueAr, s.venueEn)); });
    if (location.hash === '#archive') setView('archive');
    if (SIG.param('mode') === 'abstract') setMode('abstract');
    S.settings = Object.assign({}, (window.SIG_CONFIG || {}).event);
    renderAll();
    try { S.settings = await SIG.store.settings(); } catch (e) {}
    try { S.events = await SIG.store.list('events'); } catch (e) { S.events = []; }
    renderAll();
    try {
      S.user = await SIG.store.currentUser();
      if (S.user) { S.member = await SIG.store.member(S.user.uid); prefill(); }
    } catch (e) {}
  }
  document.addEventListener('sig:ready', init);
  document.addEventListener('sig:lang', renderAll);
})();
