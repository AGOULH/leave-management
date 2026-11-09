(function () {
  const SIG = window.SIG; const t = SIG.t; const $ = SIG.$, $$ = SIG.$$;
  const S = { user: null, member: null, regs: [], abs: [], sec: 'card', admin: false };
  const V = (f, k) => { const el = f.elements.namedItem(k); return el ? String(el.value).trim() : ''; };
  const STATUS = () => ({
    review: [t('قيد المراجعة', 'In review'), 'tag-orange', 1], oral: [t('مقبول — عرض شفهي', 'Accepted — oral'), 'tag-green', 2], poster: [t('مقبول — ملصق', 'Accepted — poster'), 'tag-blue', 2], revise: [t('يحتاج تعديل', 'Needs revision'), 'tag-orange', 2], reject: [t('غير مقبول', 'Not accepted'), 'tag-gray', 2]
  });

  function setSec(k) {
    S.sec = k;
    $$('[data-sec]').forEach((b) => (b.dataset.sec === k ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
    $$('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== k));
  }

  function render() {
    if (!S.user) return;
    const m = S.member || { email: S.user.email, memberNo: '' };
    $('#hello').textContent = t('مرحباً', 'Welcome') + (m.first ? t('، ', ', ') + m.first : '');
    $('#admin-link').classList.toggle('hidden', !S.admin);

    $('[data-panel="card"]').innerHTML = S.member
      ? '<div style="flex:1 1 380px;max-width:460px">' + SIG.memberCard(m) + '</div><div class="stack" style="flex:1 1 260px;--gap:12px"><h2 style="font-size:22px">' + t('بطاقة العضوية الرقمية', 'Digital membership card') + '</h2><p class="muted" style="line-height:1.8">' + t('اعرض الرمز عند بوابة أي فعالية ليُسجَّل حضورك فوراً.', 'Show this code at any event door to check in instantly.') + '</p><div class="row" style="--gap:10px"><a class="btn btn-primary" href="card.html?uid=' + encodeURIComponent(S.user.uid) + '" target="_blank" rel="noopener">' + t('طباعة / حفظ PDF', 'Print / save PDF') + '</a></div>' +
        '<div class="row" style="--gap:10px;padding-top:8px"><span class="tag tag-rose">' + S.regs.length + ' ' + t('تسجيل', 'registrations') + '</span><span class="tag tag-rose">' + S.regs.filter((r) => r.certIssued).length + ' ' + t('شهادة', 'certificates') + '</span><span class="tag tag-rose">' + S.abs.length + ' ' + t('ملخص', 'abstracts') + '</span></div></div>'
      : '<div class="empty" style="flex:1 1 100%">' + t('لم نجد ملف عضوية لهذا الحساب.', 'No member profile found for this account.') + ' <a href="membership.html">' + t('أكمل العضوية', 'Complete membership') + '</a></div>';

    $('[data-panel="regs"]').innerHTML = '<div class="row between"><h2 style="font-size:22px">' + t('تسجيلاتي في الفعاليات', 'My event registrations') + '</h2><a class="btn btn-primary btn-sm" href="events.html#register">' + t('تسجيل في فعالية', 'Register for an event') + '</a></div>' +
      (S.regs.length ? S.regs.map((r) => '<article class="card card-rose row between" style="flex-direction:row"><div class="stack" style="--gap:4px"><strong>' + SIG.esc(t(r.eventTitle, r.eventTitleEn || r.eventTitle)) + '</strong><span class="muted" style="font-size:14px">' + (r.eventDate ? SIG.fmtDate(r.eventDate) + ' · ' : '') + '<span class="latin">' + SIG.esc(r.ticket) + '</span></span></div>' +
        '<div class="row" style="--gap:10px"><span class="tag ' + (r.checkedIn ? 'tag-green">' + t('حضر', 'Attended') : 'tag-blue">' + t('مؤكد', 'Confirmed')) + '</span><button type="button" class="btn btn-outline btn-sm" data-qr="' + SIG.esc(r.ticket) + '">' + t('التذكرة', 'Ticket') + '</button></div><div class="qr-slot" style="flex:1 1 100%"></div></article>').join('')
        : '<div class="empty">' + t('لا توجد تسجيلات بعد.', 'No registrations yet.') + '</div>');
    $$('[data-qr]').forEach((b) => b.addEventListener('click', () => { const slot = b.closest('article').querySelector('.qr-slot'); slot.innerHTML = slot.innerHTML ? '' : '<div class="ticket"><div class="qr">' + SIG.qrSvg(b.dataset.qr, 150) + '</div></div>'; }));

    const certs = S.regs.filter((r) => r.certIssued);
    $('[data-panel="certs"]').innerHTML = '<h2 style="font-size:22px">' + t('شهادات الحضور', 'Attendance certificates') + '</h2>' +
      (certs.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>' + t('الفعالية', 'Event') + '</th><th>' + t('التاريخ', 'Date') + '</th><th>' + t('الساعات', 'Hours') + '</th><th>' + t('الشهادة', 'Certificate') + '</th></tr></thead><tbody>' +
        certs.map((r) => '<tr><td>' + SIG.esc(t(r.eventTitle, r.eventTitleEn || r.eventTitle)) + '</td><td class="muted">' + (r.eventDate ? SIG.fmtDate(r.eventDate) : '') + '</td><td class="muted">' + SIG.esc(r.cmeHours || '—') + '</td><td><a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="certificate.html?id=' + encodeURIComponent(r.id) + '">PDF</a></td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty">' + t('تظهر شهاداتك هنا بعد تسجيل حضورك في الفعالية وإصدار الشهادات.', 'Your certificates appear here after you check in at an event and certificates are issued.') + '</div>') +
      '<p class="muted" style="font-size:13.5px">' + t('كل شهادة تحمل رمز تحقق يمكن لجهة العمل التأكد منه.', 'Each certificate carries a verification code your employer can check.') + '</p>';

    const ST = STATUS();
    $('[data-panel="abs"]').innerHTML = '<h2 style="font-size:22px">' + t('ملخصاتي البحثية', 'My abstracts') + '</h2>' +
      (S.abs.length ? S.abs.map((a) => { const s = ST[a.status] || ST.review; return '<article class="card"><div class="row between"><strong>' + SIG.esc(a.title) + '</strong><span class="tag ' + s[1] + '">' + s[0] + '</span></div><span class="muted latin" style="font-size:13px">' + SIG.esc(a.ref || '') + '</span><div class="progress3"><span class="done"></span><span class="' + (s[2] === 1 ? 'now' : 'done') + '"></span><span class="' + (s[2] === 2 ? 'done' : '') + '"></span></div></article>'; }).join('')
        : '<div class="empty">' + t('لم تقدّم ملخصات بعد.', 'No abstracts yet.') + ' <a href="events.html?mode=abstract#register">' + t('قدّم ملخصاً', 'Submit one') + '</a></div>');

    const p = S.member || {};
    $('[data-panel="profile"]').innerHTML = '<h2 style="font-size:22px">' + t('الملف الشخصي', 'Profile') + '</h2>' +
      '<form id="f-profile" class="form"><div class="grid" style="--min:240px;--gap:14px">' +
      '<label class="field"><span>' + t('الاسم', 'Name') + '</span><input value="' + SIG.esc(SIG.memberName(p)) + '" disabled></label>' +
      '<label class="field"><span>' + t('البريد', 'Email') + '</span><input value="' + SIG.esc(S.user.email) + '" disabled dir="ltr"></label>' +
      '<label class="field"><span>' + t('رقم الجوال', 'Mobile') + '</span><input name="mobile" value="' + SIG.esc(p.mobile || '') + '" dir="ltr"></label>' +
      '<label class="field"><span>' + t('رقم التصنيف المهني', 'SCFHS no.') + '</span><input name="schs" value="' + SIG.esc(p.schs || '') + '" dir="ltr"></label>' +
      '<label class="field"><span>' + t('جهة العمل', 'Institution') + '</span><input name="org" value="' + SIG.esc(p.org || '') + '"></label>' +
      '<label class="field"><span>' + t('القسم', 'Department') + '</span><input name="dept" value="' + SIG.esc(p.dept || '') + '"></label>' +
      '<label class="field"><span>' + t('المسمى الوظيفي', 'Job title') + '</span><input name="job" value="' + SIG.esc(p.job || '') + '"></label>' +
      '</div><button type="submit" class="btn btn-primary" style="align-self:flex-start">' + t('حفظ التعديلات', 'Save changes') + '</button></form>';
    const fp = $('#f-profile');
    if (fp) fp.addEventListener('submit', async (e) => {
      e.preventDefault(); if (!S.member) return;
      const data = {}; ['mobile', 'schs', 'org', 'dept', 'job'].forEach((k) => (data[k] = V(fp, k)));
      try { await SIG.store.update('members', S.user.uid, data); Object.assign(S.member, data); SIG.toast(t('تم الحفظ', 'Saved')); } catch (err) { SIG.toast(SIG.store.authError(err)); }
    });
    setSec(S.sec);
  }

  async function load() {
    S.member = await SIG.store.member(S.user.uid).catch(() => null);
    S.regs = await SIG.store.list('registrations', 'email', S.user.email).catch(() => []);
    S.abs = await SIG.store.list('abstracts', 'email', S.user.email).catch(() => []);
    S.admin = await SIG.store.isAdmin(S.user).catch(() => false);
  }

  async function showPortal() {
    $('#auth-view').classList.add('hidden'); $('#loading').classList.remove('hidden');
    await load();
    $('#loading').classList.add('hidden'); $('#portal-view').classList.remove('hidden');
    render();
  }

  async function init() {
    $$('[data-sec]').forEach((b) => b.addEventListener('click', () => setSec(b.dataset.sec)));
    const h = location.hash.replace('#', ''); if (['card', 'regs', 'certs', 'abs', 'profile'].includes(h)) S.sec = h;
    $('#signout').addEventListener('click', async () => { await SIG.store.signOut(); location.href = 'index.html'; });
    const f = $('#f-login'); const msg = f.querySelector('.form-msg');
    const show = (text, ok) => { msg.textContent = text; msg.className = 'form-msg ' + (ok ? 'ok' : 'err'); };
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      try {
        S.user = await SIG.store.signIn(V(f, 'email'), f.elements.namedItem('password').value);
        const next = SIG.param('next'); if (next && /^[a-z]+\.html$/.test(next)) { location.href = next; return; }
        await showPortal();
      } catch (err) { show(SIG.store.authError(err)); }
      btn.disabled = false;
    });
    $('#forgot').addEventListener('click', async () => {
      const email = V(f, 'email');
      if (!email) { show(t('اكتب بريدك أولاً ثم اضغط «نسيت كلمة المرور».', 'Type your email first, then tap Forgot password.')); return; }
      if (!SIG.store.isFirebase) { show(t('غير متاح في الوضع التجريبي.', 'Not available in demo mode.')); return; }
      try { await SIG.store.resetPassword(email); show(t('أرسلنا رابط إعادة التعيين إلى بريدك.', 'We emailed you a reset link.'), true); } catch (err) { show(SIG.store.authError(err)); }
    });
    try { S.user = await SIG.store.currentUser(); } catch (e) { S.user = null; }
    if (S.user) await showPortal();
    else { $('#loading').classList.add('hidden'); $('#auth-view').classList.remove('hidden'); }
  }
  document.addEventListener('sig:ready', init);
  document.addEventListener('sig:lang', render);
})();
