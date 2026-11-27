/* sync.js — Mummy ka data roz Claude tak (27 Nov 2026, Claude; Nitesh: "sara data tere pass a jaye daily ka").
   App ka saara 'tgt_' data (mock ke natije + har jawab, paath ke jawab, ⭐ star) chupchaap usi Firebase par bhejta hai
   jo 1v1 ke liye pehle se laga hai: /sync/<device-id>.json (har phone ki apni jagah, ek-doosre ko nahi mitata).
   Kab: app khulne ke 4 sec baad · app band/peeche jane par · mock jama hote hi · khula ho to har 5 min (sirf badlav ho to).
   Fail ho (net nahi) to chup — app ke kaam me koi rukawat nahi. Padhna: MUMMY GK MASTERY/24_SANSKRIT_MOCKS/_work/sync_padho.py */
(function () {
  'use strict';
  var BASE = 'https://tgtgk-live-default-rtdb.asia-southeast1.firebasedatabase.app/tgtgk_mp_live_84k9x2';
  var DEV_K = 'tgt_sync_dev_v1', LAST_K = 'tgt_sync_last_v1';
  var SKIP = { 'tgt_gk_extra_chapters_v1': 1 };   /* 📥 se jode poore paath — bhaari, aur data nahi */
  var GAP = 5 * 60 * 1000;
  function ls(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function devId() {
    var d = ls(DEV_K);
    if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); lsSet(DEV_K, d); }
    return d;
  }
  function collect() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf('tgt_') !== 0 || k.indexOf('tgt_sync_') === 0 || SKIP[k]) continue;
        out[k] = localStorage.getItem(k);
      }
    } catch (_) {}
    return out;
  }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return s.length + ':' + h; }
  var busy = false;
  function send(force, why) {
    if (busy || typeof fetch !== 'function') return;
    var data = collect(), hs = hash(JSON.stringify(data)), now = Date.now(), last = {};
    try { last = JSON.parse(ls(LAST_K) || '{}') || {}; } catch (_) {}
    if (!force && last.h === hs) return;                                   /* kuch nahi badla */
    if (!force && why === 'timer' && last.t && now - last.t < GAP) return;
    var active = null; try { active = JSON.parse(ls('tgt_gk_active_user_v1')); } catch (_) {}
    var body = JSON.stringify({ dev: devId(), t: now, iso: new Date(now).toISOString(), why: why || '',
      page: (location.pathname.split('/').pop() || 'index.html'), active: active,
      ua: String(navigator.userAgent || '').slice(0, 120), data: data });
    var opts = { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body };
    if (body.length < 60000) opts.keepalive = true;                         /* chhota ho to band hote waqt bhi pahunche */
    busy = true;
    fetch(BASE + '/sync/' + devId() + '.json', opts).then(function (r) {
      busy = false; if (r && r.ok) lsSet(LAST_K, JSON.stringify({ h: hs, t: now }));
    }).catch(function () { busy = false; });
  }
  window.tgtSync = function (force, why) { try { send(!!force, why || (force ? 'force' : '')); } catch (_) { busy = false; } };
  setTimeout(function () { window.tgtSync(false, 'load'); }, 4000);
  setInterval(function () { if (!document.hidden) window.tgtSync(false, 'timer'); }, GAP);
  document.addEventListener('visibilitychange', function () { if (document.hidden) window.tgtSync(false, 'hide'); });
  window.addEventListener('pagehide', function () { window.tgtSync(false, 'pagehide'); });
})();
