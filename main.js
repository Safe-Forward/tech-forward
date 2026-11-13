// Tech-Forward: Einblendungen, Scroll-Szenen, 3D-Kippen und Magnet-Knöpfe.
// Ohne dieses Skript ist die Seite vollständig lesbar; es setzt nur Klassen und CSS-Variablen.
(() => {
  const html = document.documentElement;
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const feinerZeiger = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const LEISTE = 48;
  html.classList.add('bereit');

  const sicher = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Überschriften Wort für Wort zerlegen
  document.querySelectorAll('[data-woerter]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text
      .split(/\s+/)
      .map((w, i) => `<span class="wort" aria-hidden="true" style="--i:${i}">${sicher(w)}</span>`)
      .join(' ');
  });

  // Aussage: jedes Wort leuchtet beim Scrollen auf
  document.querySelectorAll('.aussage-text').forEach((el) => {
    const woerter = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.style.setProperty('--n', woerter.length);
    el.innerHTML = woerter.map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}">${sicher(w)}</span>`).join(' ');
  });

  const szenen = [...document.querySelectorAll('[data-szene]')];
  const start = document.querySelector('.start');
  const leiste = document.querySelector('.leiste');

  if (ruhig) {
    html.classList.add('ruhig', 'los');
    document.querySelectorAll('[data-zeigen]').forEach((el) => el.classList.add('sichtbar'));
    szenen.forEach((s) => s.style.setProperty('--p', 1));
    leiste && leiste.classList.add('gescrollt');
    return;
  }

  // Start-Sequenz nach dem ersten Bild
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('los')));

  // Einblenden beim Hineinscrollen
  const zeigen = new IntersectionObserver(
    (eintraege) => {
      eintraege.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('sichtbar');
          zeigen.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
  );
  document.querySelectorAll('[data-zeigen]').forEach((el) => zeigen.observe(el));

  // Endlos-Animationen nur laufen lassen, solange sie sichtbar sind
  const schleifen = new IntersectionObserver(
    (eintraege) => eintraege.forEach((e) => e.target.classList.toggle('laeuft', e.isIntersecting)),
    { threshold: 0.25 }
  );
  document.querySelectorAll('[data-schleife]').forEach((el) => schleifen.observe(el));

  // Scroll-Fortschritt als CSS-Variable --p (0 bis 1)
  let vh = window.innerHeight;
  let geplant = false;
  const begrenzen = (x) => Math.min(1, Math.max(0, x));

  function rechnen() {
    geplant = false;
    const y = window.scrollY;
    const gesamt = Math.max(1, html.scrollHeight - vh);
    html.style.setProperty('--seite', (y / gesamt).toFixed(4));
    if (leiste) leiste.classList.toggle('gescrollt', y > 8);
    if (start) start.style.setProperty('--p', begrenzen(y / (vh * 0.9)).toFixed(4));

    for (const s of szenen) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      let p;
      if (s.dataset.szene === 'durch') {
        p = (vh * 0.85 - r.top) / Math.max(1, r.height * 0.9);
      } else {
        p = (LEISTE - r.top) / Math.max(1, r.height - (vh - LEISTE));
      }
      s.style.setProperty('--p', begrenzen(p).toFixed(4));
    }
  }

  const anstossen = () => {
    if (!geplant) {
      geplant = true;
      requestAnimationFrame(rechnen);
    }
  };
  window.addEventListener('scroll', anstossen, { passive: true });
  window.addEventListener('resize', () => {
    vh = window.innerHeight;
    anstossen();
  });
  rechnen();

  if (!feinerZeiger) return;

  // Karten kippen räumlich mit der Maus, Lichtfleck folgt dem Zeiger
  document.querySelectorAll('[data-kippen]').forEach((k) => {
    k.addEventListener('pointermove', (e) => {
      const r = k.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      k.style.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`);
      k.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
      k.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      k.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    k.addEventListener('pointerleave', () => {
      k.style.setProperty('--rx', '0deg');
      k.style.setProperty('--ry', '0deg');
    });
  });

  // Logo im Start folgt der Maus in 3D
  if (start) {
    window.addEventListener(
      'pointermove',
      (e) => {
        if (window.scrollY > vh) return;
        start.style.setProperty('--hx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
        start.style.setProperty('--hy', (e.clientY / vh - 0.5).toFixed(3));
      },
      { passive: true }
    );
  }

  // Magnet-Knöpfe
  document.querySelectorAll('[data-magnet]').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.22;
      const dy = (e.clientY - r.top - r.height / 2) * 0.32;
      b.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => {
      b.style.transform = '';
    });
  });
})();
