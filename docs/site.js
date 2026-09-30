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
    var t1 = setTimeout(function () { prep(); dirty = true; }, 600);
    var t2 = setTimeout(function () {
      document.querySelectorAll('[data-rv]').forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight * 1.2) show(el); });
    }, 1200);
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
          vn.style.transform = on && !rm ? 'translateX(' + (dir * -24) + '%) rotate(' + (dir * -120) + 'deg)' : 'translateX(0) rotate(0deg)';
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
        var dark = tone === 'dark', scrolled = y > 40;
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
