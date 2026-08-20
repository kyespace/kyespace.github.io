/* KYE Study Notes — the site's only "on this page" navigation.
   Every page used to carry its own bespoke TOC/sidebar; those have
   all been removed in favor of this one shared, auto-built widget so
   there's a single consistent nav experience site-wide (see
   assets/page-toc.css for the left-rail-on-wide-screens layout).

   Builds its list from whatever navigation the page already has, in
   priority order, so it stays organized instead of dumping every
   heading it can find:
     1. an existing nav.toc / .toc block with #anchor links (legacy; none left)
     2. a plain <nav>/.sidebar with #anchor links (legacy; none left)
     3. data-target="#id" buttons (legacy; none left)
     4. fallback: top-level h1/h2[id] headings in document order — this
        is the path every page actually takes today
   Skips itself entirely on pages with fewer than two sections. On
   docker-container-study.html (which shows one "page" of several at a
   time via its own .navbar tab switcher) the heading scan is scoped
   to .page.active, and a MutationObserver rebuilds the list whenever
   that switch happens. Also highlights the current section as you
   scroll via IntersectionObserver. */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function cleanText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll('.new, .sub, .badge, small').forEach(function (x) { x.remove(); });
    var parts = [];
    clone.childNodes.forEach(function (n) { parts.push(n.textContent); });
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function dedupe(entries) {
    var seen = {};
    return entries.filter(function (e) {
      if (!e.id || !e.text || seen[e.id]) return false;
      seen[e.id] = true;
      return true;
    });
  }

  function fromExistingToc() {
    var toc = document.querySelector('nav.toc, .toc');
    if (!toc) return null;
    var links = toc.querySelectorAll('a[href^="#"]');
    if (links.length < 2) return null;
    return dedupe(Array.from(links).map(function (a) {
      return { id: a.getAttribute('href').slice(1), text: cleanText(a) };
    }));
  }

  function fromNavLinks() {
    var links = document.querySelectorAll('nav a[href^="#"], .sidebar a[href^="#"]');
    if (links.length < 2) return null;
    var filtered = Array.from(links).filter(function (a) {
      return !a.closest('.kye-topbar, .kye-toc');
    });
    return dedupe(filtered.map(function (a) {
      return { id: a.getAttribute('href').slice(1), text: cleanText(a) };
    }));
  }

  function fromDataTargets() {
    var btns = document.querySelectorAll('[data-target^="#"]');
    if (btns.length < 2) return null;
    return dedupe(Array.from(btns).map(function (b) {
      return { id: b.getAttribute('data-target').slice(1), text: cleanText(b) };
    }));
  }

  function fromHeadings() {
    // docker-container-study.html shows one "page" of several at a time
    // (its own .navbar switches between them); scope to the visible one
    // so the list only ever shows sections actually on screen.
    var scope = document.querySelector('.page.active') || document.querySelector('main') || document.body;

    var direct = scope.querySelectorAll('h1[id], h2[id]');
    var entries = dedupe(Array.from(direct)
      .filter(function (h) { return !h.closest('.kye-topbar, .kye-toc, nav, footer'); })
      .map(function (h) { return { id: h.id, text: cleanText(h) }; }));
    if (entries.length >= 2) return entries;

    var wrapped = scope.querySelectorAll('[id]');
    entries = dedupe(Array.from(wrapped)
      .filter(function (el) { return !el.closest('.kye-topbar, .kye-toc, nav, footer'); })
      .map(function (el) {
        var heading = el.querySelector('h1,h2,h3');
        return heading ? { id: el.id, text: cleanText(heading) } : null;
      })
      .filter(Boolean));
    return entries.length >= 2 ? entries : null;
  }

  function findEntries() {
    return fromExistingToc() || fromNavLinks() || fromDataTargets() || fromHeadings() || [];
  }

  function headerOffset() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--kye-header-h');
    var n = parseInt(v, 10);
    return isNaN(n) ? 56 : n;
  }

  ready(function () {
    var entries = findEntries();
    if (entries.length < 2) return;

    var wrap = document.createElement('div');
    wrap.className = 'kye-toc';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kye-toc-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', '목차 열기');
    btn.innerHTML = '<span class="kye-toc-icon">📑</span><span class="kye-toc-label">목차</span>';

    var panel = document.createElement('div');
    panel.className = 'kye-toc-panel';
    panel.hidden = true;

    var head = document.createElement('div');
    head.className = 'kye-toc-panel-head';
    var headLabel = document.createElement('span');
    headLabel.textContent = '이 페이지의 목차';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kye-toc-close';
    closeBtn.setAttribute('aria-label', '목차 닫기');
    closeBtn.textContent = '×';
    head.appendChild(headLabel);
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var list = document.createElement('div');
    list.className = 'kye-toc-list';
    panel.appendChild(list);

    var spyObserver = null;

    function renderList(newEntries) {
      list.innerHTML = '';
      if (spyObserver) { spyObserver.disconnect(); spyObserver = null; }

      var linkById = {};
      newEntries.forEach(function (e) {
        var a = document.createElement('a');
        a.href = '#' + e.id;
        a.textContent = e.text;
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var target = document.getElementById(e.id);
          if (target) {
            var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() - 12;
            window.scrollTo({ top: top, behavior: 'smooth' });
            history.pushState(null, '', '#' + e.id);
          }
          close();
        });
        list.appendChild(a);
        linkById[e.id] = a;
      });

      if ('IntersectionObserver' in window) {
        var offset = headerOffset();
        spyObserver = new IntersectionObserver(function (obs) {
          obs.forEach(function (entry) {
            var link = linkById[entry.target.id];
            if (!link) return;
            link.classList.toggle('active', entry.isIntersecting);
          });
        }, { rootMargin: '-' + (offset + 8) + 'px 0px -70% 0px' });
        newEntries.forEach(function (e) {
          var target = document.getElementById(e.id);
          if (target) spyObserver.observe(target);
        });
      }
    }

    renderList(entries);

    // Rebuild when docker-container-study.html's own tab switcher
    // changes which .page is active, so the list tracks what's visible.
    var pages = document.querySelectorAll('.page');
    if (pages.length) {
      var pageObserver = new MutationObserver(function () {
        var next = findEntries();
        if (next.length >= 2) renderList(next);
      });
      pages.forEach(function (p) {
        pageObserver.observe(p, { attributes: true, attributeFilter: ['class'] });
      });
    }

    function onDocClick(ev) {
      if (!wrap.contains(ev.target)) close();
    }
    function onKeydown(ev) {
      if (ev.key === 'Escape') close();
    }
    function open() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', '목차 닫기');
      document.addEventListener('click', onDocClick, true);
      document.addEventListener('keydown', onKeydown);
    }
    function close() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', '목차 열기');
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKeydown);
    }
    btn.addEventListener('click', function () {
      if (panel.hidden) open(); else close();
    });
    closeBtn.addEventListener('click', close);

    wrap.appendChild(panel);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  });
})();
