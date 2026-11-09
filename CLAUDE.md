# SIG website — project memory

Static bilingual (AR default / EN) site for the Saudi Immunohaematology Group. No build step. Hosted on GitHub Pages (`agoulh.github.io/leave-management/`, branch main, root). Previous leave-management app is on branch `backup-leave-app`.

## Structure
- `*.html` pages; each loads `assets/js/config.js` → `common.js` → `store.js` → page script.
- `assets/css/style.css` — single stylesheet, tokens in `:root` (red #C8102E, light backgrounds only — never dark blocks).
- `assets/js/common.js` — `SIG.t(ar,en)`, `SIG.setLang`, header/footer render, icons, `SIG.ARCHIVE` (past events), helpers (`qrSvg`, `calUrl`, `memberCard`, `fmtDate`).
- `assets/js/store.js` — `SIG.store`: Firebase compat 10.12.2 when `config.firebase` is filled, otherwise localStorage demo. API: `add/list/get/set/update/remove`, `settings()`, `news()`, `signUp/signIn/signOut/currentUser/isAdmin/member`.
- `firestore.rules` — collections: settings, news, events, publications, registrations, abstracts, members, messages, notify, admins.

## Conventions
- i18n: static text = Arabic inside the element + English in `data-en` (also `data-en-ph`, `data-en-aria`). Dynamic text uses `SIG.t()` and re-renders on `sig:lang`.
- Page scripts start on `sig:ready`.
- Read form fields with `form.elements.namedItem(k)` (never `form.name` / `form.title`).
- Fonts: 'GE SS Two' then IBM Plex Sans Arabic (Google Fonts), Arial for Latin codes.
- Keep it free: no Firebase Storage, no paid APIs.
