(function () {
  const SIG = window.SIG; const t = SIG.t; const $ = SIG.$, $$ = SIG.$$;
  const C = window.SIG_CONFIG || {};
  const S = { tab: 'materials', cat: 'all', q: '', album: null, user: null, pubs: [] };

  function setTab(k) {
    S.tab = k;
    $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === k ? 'true' : 'false'));
    $('#tab-materials').classList.toggle('hidden', k !== 'materials');
    $('#tab-gallery').classList.toggle('hidden', k !== 'gallery');
    renderGallery();
  }

  function renderMaterials() {
    $('#i-search').innerHTML = SIG.icon.search;
    const defs = [['all', t('الكل', 'All')], ['annual', t('الملتقيات والمؤتمرات', 'Meetings & conferences')], ['meeting', t('الاجتماعات الدورية', 'Group meetings')], ['workshop', t('الورش', 'Workshops')], ['pubs', t('منشورات الأعضاء', 'Member publications')], ['journals', t('المجلات العلمية', 'Journals')]];
    $('#cats').innerHTML = defs.map((d) => '<button type="button" data-cat="' + d[0] + '" aria-pressed="' + (S.cat === d[0]) + '">' + d[1] + '</button>').join('');
    $$('#cats button').forEach((b) => b.addEventListener('click', () => { S.cat = b.dataset.cat; renderMaterials(); }));

    const q = S.q.trim().toLowerCase();
    let items = [];
    if (S.cat === 'pubs' || S.cat === 'journals' || S.cat === 'all') {
      items = items.concat(S.pubs.filter((p) => S.cat === 'all' || p.kind === S.cat).map((p) => ({ type: p.kind === 'journals' ? t('مجلة علمية', 'Journal') : t('منشور عضو', 'Member publication'), year: p.year || '', title: p.title, ar: p.title, en: p.title, url: p.url, key: p.id, pub: true })));
    }
    if (S.cat !== 'pubs' && S.cat !== 'journals') {
      items = items.concat(SIG.ARCHIVE.filter((e) => S.cat === 'all' || e.type === S.cat).map((e) => ({ type: SIG.typeLabel(e.type), year: e.date.slice(0, 4), ar: e.ar, en: e.en, title: t(e.ar, e.en), url: (C.materials || {})[e.key] || '', key: e.key })));
    }
    items = items.filter((m) => !q || m.ar.toLowerCase().includes(q) || m.en.toLowerCase().includes(q) || String(m.year).includes(q));
    $('#result-line').textContent = items.length + ' ' + t('نتيجة', 'results');
    if (!items.length) {
      $('#items').innerHTML = '<div class="empty" style="grid-column:1/-1"><span style="color:var(--red)">' + SIG.icon.book + '</span><strong style="font-size:18px">' + t('لا توجد مواد في هذا القسم بعد', 'Nothing here yet') + '</strong><p class="muted" style="max-width:480px">' + t('يضيف المشرفون المواد من لوحة التحكم، ويمكن للأعضاء إرسال منشوراتهم لإدراجها.', 'Admins add materials from the dashboard, and members can send their publications for listing.') + '</p><a class="btn btn-outline" href="contact.html">' + t('أرسل منشورك', 'Send your publication') + '</a></div>';
      return;
    }
    $('#items').innerHTML = items.map((m) =>
      '<article class="card"><div class="row between"><span class="tag tag-rose">' + SIG.esc(m.type) + '</span><span class="muted latin" style="font-size:13.5px">' + SIG.esc(m.year) + '</span></div>' +
      '<h3>' + SIG.esc(m.title) + '</h3><p>' + (m.pub ? '' : t('عروض المحاضرات ومواد الفعالية', 'Lecture slides and event materials')) + '</p>' +
      '<div class="row" style="--gap:10px"><button type="button" class="btn btn-primary btn-sm" data-open="' + SIG.esc(m.key) + '" data-url="' + SIG.esc(m.url || '') + '">' + (S.user || m.pub ? '' : SIG.icon.lock) + t('عرض المواد', 'Open materials') + '</button>' +
      (m.pub ? '' : '<button type="button" class="btn btn-outline btn-sm" data-album="' + SIG.esc(m.key) + '">' + t('الصور', 'Photos') + '</button>') + '</div></article>').join('');
    $$('[data-open]').forEach((b) => b.addEventListener('click', () => openMaterials(b.dataset.url, b.dataset.open)));
    $$('[data-album]').forEach((b) => b.addEventListener('click', () => { S.album = b.dataset.album; setTab('gallery'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
  }

  function openMaterials(url, key) {
    const isPub = S.pubs.some((p) => p.id === key);
    if (!isPub && SIG.store.isFirebase && !S.user) { SIG.toast(t('المواد للأعضاء — سجّل دخولك أو أنشئ عضوية مجانية.', 'Materials are for members — sign in or join for free.')); setTimeout(() => (location.href = 'portal.html?next=library.html'), 1200); return; }
    if (!url) { SIG.toast(t('المواد قيد الإضافة — ستتوفر قريباً.', 'Materials are being added — available soon.')); return; }
    window.open(url, '_blank', 'noopener');
  }

  function renderGallery() {
    const G = C.gallery || {};
    const albumsEl = $('#albums'), view = $('#album-view');
    if (S.album) {
      const e = SIG.ARCHIVE.find((x) => x.key === S.album);
      albumsEl.classList.add('hidden'); view.classList.remove('hidden');
      const photos = G[S.album] || [];
      view.innerHTML = '<div class="row" style="--gap:14px"><button type="button" class="btn btn-outline" id="back">' + t('كل الألبومات', 'All albums') + '</button><h2 style="font-size:24px">' + SIG.esc(e ? t(e.ar, e.en) : '') + (e ? ' — ' + e.date.slice(0, 4) : '') + '</h2></div>' +
        (photos.length
          ? '<div class="grid" style="--min:220px;--gap:12px">' + photos.map((src, i) => '<a class="photo" href="' + SIG.esc(src) + '" target="_blank" rel="noopener"><img src="' + SIG.esc(src) + '" alt="' + t('صورة ', 'Photo ') + (i + 1) + '" loading="lazy"></a>').join('') + '</div>'
          : '<div class="empty"><span style="color:var(--red)">' + SIG.icon.image + '</span><strong>' + t('لم تُرفع صور هذه الفعالية بعد', 'Photos for this event are not uploaded yet') + '</strong></div>');
      $('#back').addEventListener('click', () => { S.album = null; renderGallery(); });
      return;
    }
    view.classList.add('hidden'); albumsEl.classList.remove('hidden');
    albumsEl.innerHTML = SIG.ARCHIVE.map((e) => {
      const cover = (G[e.key] || [])[0];
      return '<button type="button" class="album" data-key="' + e.key + '"><span class="album-cover">' + (cover ? '<img src="' + SIG.esc(cover) + '" alt="" loading="lazy">' : SIG.icon.image) + '</span><span class="album-body"><strong style="font-size:16px">' + SIG.esc(t(e.ar, e.en)) + '</strong><span class="muted latin" style="font-size:13.5px">' + e.date.slice(0, 4) + ' · ' + (G[e.key] || []).length + ' ' + t('صورة', 'photos') + '</span></span></button>';
    }).join('');
    $$('.album').forEach((b) => b.addEventListener('click', () => { S.album = b.dataset.key; renderGallery(); }));
  }

  async function init() {
    $$('[data-tab]').forEach((b) => b.addEventListener('click', () => { S.album = null; setTab(b.dataset.tab); }));
    $('#q').addEventListener('input', (e) => { S.q = e.target.value; renderMaterials(); });
    const ev = SIG.param('event');
    if (SIG.param('tab') === 'gallery') { S.album = ev; setTab('gallery'); }
    else if (ev) { const e = SIG.ARCHIVE.find((x) => x.key === ev); if (e) { S.q = e.date.slice(0, 4); $('#q').value = S.q; } }
    renderMaterials(); renderGallery();
    try { S.user = await SIG.store.currentUser(); } catch (e) {}
    try { S.pubs = await SIG.store.list('publications'); } catch (e) { S.pubs = []; }
    renderMaterials();
  }
  document.addEventListener('sig:ready', init);
  document.addEventListener('sig:lang', () => { renderMaterials(); renderGallery(); });
})();
