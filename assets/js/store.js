/* SIG data layer: Firebase (when configured) or local demo storage */
(function () {
  const C = window.SIG_CONFIG || {};
  const SIG = (window.SIG = window.SIG || {});
  const hasFb = !!(C.firebase && C.firebase.apiKey && C.firebase.projectId);
  const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
  let ready = null;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res;
      s.onerror = () => rej(new Error('Failed to load ' + src)); document.head.appendChild(s);
    });
  }
  function init() {
    if (ready) return ready;
    ready = (async () => {
      if (!hasFb) return null;
      await loadScript(FB + 'firebase-app-compat.js');
      await Promise.all([loadScript(FB + 'firebase-auth-compat.js'), loadScript(FB + 'firebase-firestore-compat.js')]);
      if (!firebase.apps.length) firebase.initializeApp(C.firebase);
      return { auth: firebase.auth(), db: firebase.firestore() };
    })();
    return ready;
  }

  // ---- local demo storage ----
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem('sig_db_' + k) || '[]'); } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem('sig_db_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const now = () => new Date().toISOString();

  const store = {
    isFirebase: hasFb,
    init,
    code(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase(); },

    async add(col, data) {
      const fb = await init();
      const doc = Object.assign({}, data, { createdAt: now() });
      if (fb) { const ref = await fb.db.collection(col).add(doc); return Object.assign({ id: ref.id }, doc); }
      const arr = LS.get(col); const item = Object.assign({ id: rid() }, doc); arr.unshift(item); LS.set(col, arr); return item;
    },
    async list(col, field, value) {
      const fb = await init();
      let out;
      if (fb) {
        let q = fb.db.collection(col);
        if (field) q = q.where(field, '==', value);
        const snap = await q.get();
        out = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      } else {
        out = LS.get(col);
        if (field) out = out.filter((x) => x[field] === value);
      }
      return out.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    },
    async get(col, id) {
      const fb = await init();
      if (fb) { const d = await fb.db.collection(col).doc(id).get(); return d.exists ? Object.assign({ id: d.id }, d.data()) : null; }
      return LS.get(col).find((x) => x.id === id) || null;
    },
    async set(col, id, data) {
      const fb = await init();
      if (fb) { await fb.db.collection(col).doc(id).set(data, { merge: true }); return; }
      const arr = LS.get(col); const i = arr.findIndex((x) => x.id === id);
      if (i > -1) arr[i] = Object.assign({}, arr[i], data); else arr.unshift(Object.assign({ id, createdAt: now() }, data));
      LS.set(col, arr);
    },
    async update(col, id, data) {
      const fb = await init();
      if (fb) { await fb.db.collection(col).doc(id).update(data); return; }
      const arr = LS.get(col); const i = arr.findIndex((x) => x.id === id);
      if (i > -1) { arr[i] = Object.assign({}, arr[i], data); LS.set(col, arr); }
    },
    async remove(col, id) {
      const fb = await init();
      if (fb) { await fb.db.collection(col).doc(id).delete(); return; }
      LS.set(col, LS.get(col).filter((x) => x.id !== id));
    },

    // ---- site settings (upcoming event) ----
    async settings() {
      const base = Object.assign({}, C.event || {});
      try { const s = await store.get('settings', 'site'); if (s) Object.assign(base, s); } catch (e) {}
      return base;
    },
    async news() {
      try { const n = await store.list('news'); if (n.length) return n.map((x) => ({ id: x.id, ar: x.text, en: x.text })); } catch (e) {}
      return SIG.DEFAULT_NEWS;
    },

    // ---- auth ----
    async currentUser() {
      const fb = await init();
      if (fb) return new Promise((res) => { const un = fb.auth.onAuthStateChanged((u) => { un(); res(u ? { uid: u.uid, email: u.email, verified: u.emailVerified } : null); }); });
      try { return JSON.parse(localStorage.getItem('sig_session') || 'null'); } catch (e) { return null; }
    },
    async signUp(email, password, profile) {
      const fb = await init();
      email = String(email).trim().toLowerCase();
      let user;
      if (fb) {
        const cred = await fb.auth.createUserWithEmailAndPassword(email, password);
        user = { uid: cred.user.uid, email };
        try { await cred.user.sendEmailVerification(); } catch (e) {}
      } else {
        if (LS.get('members').some((m) => m.email === email)) { const err = new Error('exists'); err.code = 'auth/email-already-in-use'; throw err; }
        user = { uid: rid(), email };
      }
      const memberNo = 'SIG-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      const data = Object.assign({}, profile, { email, uid: user.uid, memberNo, createdAt: now() });
      if (fb) await fb.db.collection('members').doc(user.uid).set(data);
      else { const m = LS.get('members'); m.unshift(Object.assign({ id: user.uid }, data)); LS.set('members', m); localStorage.setItem('sig_session', JSON.stringify(user)); }
      return data;
    },
    async signIn(email, password) {
      const fb = await init();
      email = String(email).trim().toLowerCase();
      if (fb) { const c = await fb.auth.signInWithEmailAndPassword(email, password); return { uid: c.user.uid, email: c.user.email }; }
      const m = LS.get('members').find((x) => x.email === email);
      if (!m) { const err = new Error('not found'); err.code = 'auth/user-not-found'; throw err; }
      const u = { uid: m.uid, email }; localStorage.setItem('sig_session', JSON.stringify(u)); return u;
    },
    async signOut() {
      const fb = await init();
      if (fb) return fb.auth.signOut();
      localStorage.removeItem('sig_session');
    },
    async resetPassword(email) {
      const fb = await init();
      if (fb) return fb.auth.sendPasswordResetEmail(String(email).trim());
    },
    async member(uid) { return store.get('members', uid); },
    async isAdmin(user) {
      if (!user) return false;
      const fb = await init();
      if (!fb) return true; // demo mode: admin view open (local data only)
      try { const d = await fb.db.collection('admins').doc(user.uid).get(); return d.exists; } catch (e) { return false; }
    },
    authError(e) {
      const c = (e && e.code) || '';
      const t = SIG.t;
      if (c.includes('email-already-in-use')) return t('هذا البريد مسجل مسبقاً — جرّب الدخول.', 'This email is already registered — try signing in.');
      if (c.includes('weak-password')) return t('كلمة المرور ضعيفة (8 أحرف على الأقل).', 'Password is too weak (min 8 characters).');
      if (c.includes('invalid-email')) return t('البريد الإلكتروني غير صحيح.', 'Invalid email address.');
      if (c.includes('user-not-found') || c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('invalid-login')) return t('البريد أو كلمة المرور غير صحيحة.', 'Incorrect email or password.');
      if (c.includes('too-many-requests')) return t('محاولات كثيرة — حاول بعد قليل.', 'Too many attempts — try again shortly.');
      if (c.includes('permission-denied')) return t('ليست لديك صلاحية لهذا الإجراء.', 'You do not have permission for this action.');
      return t('حدث خطأ، حاول مرة أخرى.', 'Something went wrong, please try again.');
    }
  };
  SIG.store = store;
})();
