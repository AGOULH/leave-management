(function () {
  const SIG = window.SIG; const t = SIG.t; const $ = SIG.$;
  let done = null;
  const V = (f, k) => { const el = f.elements.namedItem(k); return el ? String(el.value).trim() : ''; };

  function renderDone() {
    if (!done) return;
    const box = $('#join-done');
    box.innerHTML =
      '<span class="success-icon">' + SIG.icon.check + '</span>' +
      '<h2 style="font-size:28px">' + t('أهلاً بك في المجموعة', 'Welcome to SIG') + (done.first ? t('، ', ', ') + SIG.esc(done.first) : '') + '</h2>' +
      '<p class="muted" style="font-size:16px;line-height:1.8;max-width:560px">' + (SIG.store.isFirebase
        ? t('أرسلنا رابط تأكيد إلى بريدك. بطاقتك الرقمية جاهزة في بوابة العضو ويمكنك التسجيل في الفعاليات بضغطة.', 'We emailed you a confirmation link. Your digital card is ready in the member portal and you can register for events in one tap.')
        : t('تم إنشاء الحساب (وضع تجريبي — محفوظ في هذا المتصفح). بطاقتك الرقمية جاهزة في بوابة العضو.', 'Account created (demo mode — saved in this browser). Your digital card is ready in the member portal.')) + '</p>' +
      SIG.memberCard(done) +
      '<a class="btn btn-primary" href="portal.html">' + t('الذهاب إلى بوابة العضو', 'Go to the member portal') + '</a>';
  }

  async function submit(e) {
    e.preventDefault();
    const f = e.target; const msg = f.querySelector('.form-msg'); msg.classList.add('hidden');
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const profile = {};
      ['title', 'first', 'middle', 'last', 'gender', 'nationality', 'mobile', 'category', 'schs', 'org', 'dept', 'job', 'interest'].forEach((k) => (profile[k] = V(f, k)));
      done = await SIG.store.signUp(V(f, 'email'), f.elements.namedItem('password').value, profile);
      f.classList.add('hidden'); $('#join-done').classList.remove('hidden'); renderDone();
      window.scrollTo({ top: $('#join-done').offsetTop - 20, behavior: 'smooth' });
    } catch (err) { msg.textContent = SIG.store.authError(err); msg.classList.remove('hidden'); }
    btn.disabled = false;
  }

  function init() {
    $('#f-join').addEventListener('submit', submit);
    $('#pw-toggle').addEventListener('click', (e) => {
      const inp = $('#f-join').elements.namedItem('password');
      const show = inp.type === 'password'; inp.type = show ? 'text' : 'password';
      e.target.dataset.ar = show ? 'إخفاء' : 'إظهار'; e.target.dataset.en = show ? 'Hide' : 'Show';
      e.target.textContent = t(e.target.dataset.ar, e.target.dataset.en);
    });
  }
  document.addEventListener('sig:ready', init);
  document.addEventListener('sig:lang', renderDone);
})();
