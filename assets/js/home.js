(function () {
  const SIG = window.SIG; const t = SIG.t;
  let settings = null, news = null, timer = null;

  const SERVICES = [
    ['cal', 'events.html', 'الملتقيات السنوية', 'Annual meetings', 'مؤتمر علمي ليوم واحد يجمع خبراء محليين وإقليميين لتبادل أحدث المستجدات في المجال.', 'A one-day conference where local and regional experts share the latest updates in the field.'],
    ['users', 'events.html', 'الاجتماعات الدورية', 'Regular group meetings', 'لقاءات منتظمة لمناقشة الحالات والتحديات الفنية والسريرية والإدارية.', 'Regular sessions on technical, clinical and administrative cases and challenges.'],
    ['board', 'events.html', 'ورش عمل متخصصة', 'Specialised workshops', 'تدريب عملي على تحديد فصائل الدم والتحري عن الأجسام المضادة واختبارات التوافق.', 'Hands-on training in blood grouping, antibody investigation and compatibility testing.'],
    ['book', 'library.html', 'المكتبة العلمية', 'Scientific library', 'عروض ومواد الفعاليات السابقة ومنشورات الأعضاء والمجلات العلمية، مع بحث وتصفية.', 'Past event presentations, member publications and journals — searchable and filterable.'],
    ['card', 'membership.html', 'بطاقة عضوية رقمية', 'Digital membership card', 'بطاقة برمز QR تُستخدم للتسجيل السريع عند بوابة الفعالية بدلاً من الطباعة.', 'A QR-coded card for fast check-in at the event door instead of printing.'],
    ['cert', 'portal.html', 'شهادات حضور إلكترونية', 'Online attendance certificates', 'تصدر بعد تسجيل الحضور مع ساعات التعليم الطبي المستمر.', 'Issued after check-in, with CME hours included.']
  ];

  function renderStatic() {
    SIG.$('#services').innerHTML = SERVICES.map((s) =>
      '<a class="card" href="' + s[1] + '"><span class="icon-box">' + SIG.icon[s[0]] + '</span><h3>' + t(s[2], s[3]) + '</h3><p>' + t(s[4], s[5]) + '</p></a>').join('');
    SIG.$('#archive-highlights').innerHTML = SIG.ARCHIVE.slice(0, 3).map((e) =>
      '<article class="card"><span style="font-size:13.5px;font-weight:600;color:var(--red-d)">' + SIG.fmtDate(e.date) + '</span><h3>' + t(e.ar, e.en) + '</h3><p>' + t(e.placeAr, e.placeEn) + '</p>' +
      '<div class="row" style="--gap:16px"><a href="library.html?event=' + e.key + '" style="font-weight:600;text-decoration:none">' + t('المواد العلمية', 'Materials') + '</a><a href="library.html?tab=gallery&event=' + e.key + '" style="font-weight:600;text-decoration:none">' + t('الصور', 'Photos') + '</a></div></article>').join('');
    SIG.$('#ev-cal-icon').innerHTML = SIG.icon.cal;
    SIG.$('#ev-pin-icon').innerHTML = SIG.icon.pin;
    SIG.$('#ev-cert-icon').innerHTML = SIG.icon.cert;
  }

  function renderNews() {
    if (!news) return;
    const items = news.map((n) => '<span>' + SIG.esc(t(n.ar, n.en)) + '</span>').join('');
    SIG.$('#ticker').innerHTML = items + items;
  }

  function renderEvent() {
    if (!settings) return;
    SIG.$('#ev-title').textContent = t(settings.titleAr, settings.titleEn);
    const ts = Date.parse(settings.date);
    SIG.$('#ev-date').textContent = isNaN(ts) ? t('[التاريخ يُحدَّد لاحقاً]', '[Date to be announced]') : SIG.fmtDate(new Date(ts), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    SIG.$('#ev-hijri').textContent = isNaN(ts) ? '' : SIG.fmtHijri(ts);
    SIG.$('#ev-venue').textContent = t(settings.venueAr, settings.venueEn);
    SIG.$('#ev-cme').textContent = t('ساعات تعليم طبي مستمر معتمدة: ', 'Accredited CME hours: ') + (settings.cmeHours || '[—]');
    tick();
  }

  function tick() {
    const el = SIG.$('#countdown');
    const ts = Date.parse(settings && settings.date);
    if (isNaN(ts)) { el.innerHTML = ''; return; }
    const diff = ts - Date.now();
    if (diff <= 0) {
      el.style.display = 'block';
      el.innerHTML = '<div style="padding:16px;font-weight:600;color:var(--red-d)">' + t('انطلقت الفعالية — تابع البرنامج من صفحة الفعاليات', 'The event has started — see the Events page') + '</div>';
      return;
    }
    const p = (n) => String(n).padStart(2, '0');
    const parts = [[Math.floor(diff / 864e5), t('يوم', 'Days')], [Math.floor(diff / 36e5) % 24, t('ساعة', 'Hours')], [Math.floor(diff / 6e4) % 60, t('دقيقة', 'Minutes')], [Math.floor(diff / 1e3) % 60, t('ثانية', 'Seconds')]];
    el.innerHTML = parts.map((x) => '<div><b>' + p(x[0]) + '</b><span>' + x[1] + '</span></div>').join('');
  }

  async function init() {
    renderStatic();
    settings = Object.assign({}, (window.SIG_CONFIG || {}).event); renderEvent();
    news = SIG.DEFAULT_NEWS; renderNews();
    clearInterval(timer); timer = setInterval(tick, 1000);
    try { settings = await SIG.store.settings(); renderEvent(); } catch (e) {}
    try { news = await SIG.store.news(); renderNews(); } catch (e) {}
  }
  document.addEventListener('sig:ready', init);
  document.addEventListener('sig:lang', () => { renderStatic(); renderEvent(); renderNews(); });
})();
