// Shared behaviour: reveals, parallax depth, adaptive header, artwork ambience, record sleeves.
(function () {
  var EASE = 'cubic-bezier(.16,1,.3,1)';
  function init(opts) {
    opts = opts || {};
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var header = document.querySelector('[data-site-header]');
    var lastY = window.scrollY, dirty = true, raf, cur = null, hidden = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    function show(el) {
      el.style.opacity = '1'; el.style.transform = 'none';
      if (el.dataset.reveal === 'img') el.style.clipPath = 'inset(0% 0% 0% 0%)';
      io.unobserve(el);
    }
    function prep() {
      if (rm) return;
      document.querySelectorAll('[data-reveal]:not([data-rv])').forEach(function (el) {
        el.dataset.rv = '1';
        var d = Math.min(+(el.dataset.d || 0), 140);
        if (el.dataset.reveal === 'img') {
          el.style.clipPath = 'inset(6% 0% 0% 0%)';
          el.style.transition = 'clip-path 1s ' + EASE + ' ' + d + 'ms';
        } else {
          el.style.opacity = '0'; el.style.transform = 'translate3d(0,12px,0)';
          el.style.transition = 'opacity .7s ease ' + d + 'ms, transform .9s ' + EASE + ' ' + d + 'ms';
        }
        if (el.getBoundingClientRect().top < window.innerHeight) setTimeout(function () { show(el); }, 40);
        else io.observe(el);
      });
    }
    function showAll() { document.querySelectorAll('[data-rv]').forEach(show); }
    prep();
    // The export mounts after native anchor navigation; restore direct section links.
    function followInitialAnchor() {
      if (!location.hash) return;
      var id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    if (document.fonts) document.fonts.ready.then(function () { requestAnimationFrame(followInitialAnchor); });
    else requestAnimationFrame(followInitialAnchor);
    var t1 = setTimeout(function () { prep(); dirty = true; }, 600);
    var t2 = setTimeout(function () {
      document.querySelectorAll('[data-rv]').forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight * 1.2) show(el); });
    }, 1200);
    var scrollAnimation = null;
    function stopScroll() {
      if (scrollAnimation !== null) cancelAnimationFrame(scrollAnimation);
      scrollAnimation = null;
    }
    function smoothAnchor(event) {
      var link = event.target.closest('[data-smooth-scroll]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var url = new URL(link.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      var target = document.getElementById(url.hash.slice(1));
      if (!target) return;
      event.preventDefault(); stopScroll();
      var from = window.scrollY;
      var offset = Math.max((header ? header.getBoundingClientRect().height : 0) + 24, parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      var to = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, from + target.getBoundingClientRect().top - offset));
      var duration = 1600, started = performance.now();
      function finish() {
        scrollAnimation = null;
        if (location.hash !== url.hash) history.pushState(null, '', url.hash);
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
      if (rm) { window.scrollTo({top:to, behavior:'instant'}); finish(); return; }
      function step(now) {
        var t = Math.min(1, (now - started) / duration);
        var eased = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        window.scrollTo({top:from+(to-from)*eased, behavior:'instant'});
        if (t < 1) scrollAnimation = requestAnimationFrame(step); else finish();
      }
      scrollAnimation = requestAnimationFrame(step);
    }
    document.addEventListener('click', smoothAnchor);
    window.addEventListener('wheel', stopScroll, {passive:true});
    window.addEventListener('touchstart', stopScroll, {passive:true});
    window.addEventListener('keydown', stopScroll);
    function mark() { dirty = true; }
    function onShow(e) { if (e.persisted) { showAll(); hidden = false; if (header) header.style.transform = 'none'; dirty = true; } }
    window.addEventListener('scroll', mark, { passive: true });
    window.addEventListener('resize', mark);
    window.addEventListener('pageshow', onShow);
    function setArt(v) {
      if (v === cur) return; cur = v;
      document.querySelectorAll('[data-art-layer]').forEach(function (l) { l.style.opacity = l.dataset.artLayer === v ? '1' : '0'; });
      document.querySelectorAll('[data-art]').forEach(function (it) {
        var on = it.dataset.art === v;
        it.querySelectorAll('[data-vinyl]').forEach(function (vn) {
          var dir = +(vn.dataset.vinyl || 1);
          vn.style.transform = on && !rm ? 'translateX(' + (dir * 34) + '%) rotate(' + (dir * -120) + 'deg)' : 'translateX(0) rotate(0deg)';
        });
      });
      if (opts.onArt) opts.onArt(v);
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!dirty) return;
      dirty = false;
      var y = window.scrollY, vh = window.innerHeight;
      if (header) {
        var tone = 'light';
        document.querySelectorAll('[data-tone]').forEach(function (s) { if (s.getBoundingClientRect().top <= 36) tone = s.dataset.tone; });
        var dark = tone === 'dark', scrolled = y > 16;
        header.dataset.scrolled = String(scrolled);
        header.style.color = dark ? '#F1F2EC' : '#18241B';
        header.style.background = scrolled ? (dark ? 'rgba(14,20,16,0.42)' : 'rgba(241,242,236,0.78)') : 'transparent';
        header.style.backdropFilter = header.style.webkitBackdropFilter = scrolled ? 'blur(18px) saturate(1.2)' : 'none';
        header.style.boxShadow = scrolled ? (dark ? '0 1px 0 rgba(241,242,236,0.08)' : '0 1px 0 rgba(24,36,27,0.08)') : 'none';
      }
      if (!rm) {
        document.querySelectorAll('[data-speed]').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
          var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
          if (el.classList.contains('hero-photo')) off = Math.max(-32, Math.min(32, off));
          if (el.firstElementChild) el.firstElementChild.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
        });
      }
      var items = document.querySelectorAll('[data-art]');
      if (items.length) {
        var best = null, bd = 1e9;
        items.forEach(function (it) {
          var r = it.getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - vh * 0.5);
          if (d < bd) { bd = d; best = it.dataset.art; }
        });
        if (best) setArt(best);
      }
      if (opts.onFrame) opts.onFrame(y, vh, rm);
    }
    raf = requestAnimationFrame(frame);
    return function () {
      stopScroll(); document.removeEventListener('click', smoothAnchor);
      window.removeEventListener('wheel', stopScroll); window.removeEventListener('touchstart', stopScroll); window.removeEventListener('keydown', stopScroll);
      cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); io.disconnect();
      window.removeEventListener('scroll', mark); window.removeEventListener('resize', mark); window.removeEventListener('pageshow', onShow);
    };
  }
  // Paints a soft colour field from an artwork: draws it at 4x4 and lets the browser upscale.
  function colourField(layer, src) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = 4; c.height = 4;
      c.getContext('2d').drawImage(img, 0, 0, 4, 4);
      c.setAttribute('aria-hidden', 'true');
      c.style.cssText = 'position:absolute;inset:-12%;width:124%;height:124%;filter:blur(48px) saturate(1.1);';
      layer.insertBefore(c, layer.firstChild);
    };
    img.src = src;
  }
  window.Site = { init: init, colourField: colourField };
})();
