// ── CANVAS PARTICLE SYSTEM ──
(function initParticles() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, particles = [], mouse = { x: -1000, y: -1000 };
  const PARTICLE_COUNT = 18;

  // Logo-icon sprite (the 7-shard star) — drawn at each particle.
  const sprite = new Image();
  sprite.src = 'assets/logo-icon.png';

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function randomParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 60 + Math.random() * 90,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.006,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      opacity: 0.08 + Math.random() * 0.14,
    };
  }

  function drawSprite(p) {
    if (!sprite.complete || !sprite.naturalWidth) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      // Subtle mouse repulsion
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        p.vx += (dx / dist) * 0.05;
        p.vy += (dy / dist) * 0.05;
      }
      // Speed damping
      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx; p.y += p.vy;
      p.rotation += p.rotSpeed;
      // Wrap edges
      if (p.x < -p.size) p.x = width + p.size;
      if (p.x > width + p.size) p.x = -p.size;
      if (p.y < -p.size) p.y = height + p.size;
      if (p.y > height + p.size) p.y = -p.size;
      drawSprite(p);
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(update);
  }

  window.addEventListener('resize', () => { resize(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(randomParticle());
  update();
})();

// ── LENIS SMOOTH SCROLL ──
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) lenis.scrollTo(target, { offset: -80 });
  });
});

// ── HERO WORD REVEAL ──
(function initHeroReveal() {
  const words = document.querySelectorAll('.hero-heading .word');
  const label = document.querySelector('.hero-label');
  const sub = document.querySelector('.hero-sub');
  const btns = document.querySelectorAll('.hero-btns .btn');

  const tl = gsap.timeline({ delay: 0.3 });
  tl.from(label, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
    .from(words, { y: 60, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' }, '-=0.2')
    .from(sub, { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
    .from(btns, { y: 20, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out' }, '-=0.4');
})();

// ── SCROLL ANIMATIONS ──
(function initScrollAnimations() {
  const triggerOpts = { start: 'top 75%', toggleActions: 'play none none none' };

  // 02 Trust — stagger-up
  gsap.from('.tech-pill', {
    y: 30, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out',
    scrollTrigger: { trigger: '.trust', ...triggerOpts },
  });
  gsap.from('.stat-item', {
    y: 40, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.stats-row', ...triggerOpts },
  });

  // 03 Services — fade-up stagger
  gsap.from('.svc-card', {
    y: 50, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.services-grid', ...triggerOpts },
  });

  // 04 How It Works — sequential slide
  gsap.from('[data-step="1"]', {
    x: -60, opacity: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.steps-row', ...triggerOpts },
  });
  gsap.from('[data-step="2"]', {
    y: 50, opacity: 0, duration: 0.8, delay: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.steps-row', ...triggerOpts },
  });
  gsap.from('[data-step="3"]', {
    x: 60, opacity: 0, duration: 0.8, delay: 0.3, ease: 'power3.out',
    scrollTrigger: { trigger: '.steps-row', ...triggerOpts },
  });
  // Draw connector lines
  ScrollTrigger.create({
    trigger: '.steps-row',
    start: 'top 75%',
    onEnter: () => {
      document.querySelectorAll('.connector-line-1, .connector-line-2').forEach(line => {
        line.style.strokeDashoffset = '0';
      });
    },
  });

  // 05 Impact — scale-up
  gsap.from('.impact-card', {
    scale: 0.88, opacity: 0, stagger: 0.1, duration: 0.7, ease: 'power2.out',
    scrollTrigger: { trigger: '.insight-cards', ...triggerOpts },
  });
  gsap.from('.benchmark', {
    x: -40, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.benchmark-strip', ...triggerOpts },
  });

  // 06 Contact — clip-reveal
  gsap.from('.contact-info > *', {
    clipPath: 'inset(100% 0 0 0)', opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power4.inOut',
    scrollTrigger: { trigger: '.contact', ...triggerOpts },
  });
  gsap.from('.form-field, .form-textarea, .form-submit, .form-alt', {
    clipPath: 'inset(100% 0 0 0)', opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power4.inOut',
    scrollTrigger: { trigger: '.contact-form-wrap', ...triggerOpts },
  });

  // 07 Final CTA — rotate-in
  gsap.from('.cta-heading', {
    y: 40, rotation: 3, opacity: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: '.final-cta', ...triggerOpts },
  });
  gsap.from('.cta-sub', {
    y: 20, opacity: 0, duration: 0.7, delay: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.final-cta', ...triggerOpts },
  });
  gsap.from('.btn--cta', {
    scale: 0.9, opacity: 0, duration: 0.6, delay: 0.4, ease: 'back.out(1.4)',
    scrollTrigger: { trigger: '.final-cta', ...triggerOpts },
  });
})();

// ── STAT COUNTERS ──
(function initStatCounters() {
  const counters = document.querySelectorAll('.stat-num[data-target]');
  counters.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () {
            el.textContent = Math.round(this.targets()[0].val) + suffix;
          },
        });
      },
    });
  });
})();

// ── SERVICE CARD TOGGLE ──
(function initServiceCards() {
  document.querySelectorAll('.svc-card').forEach(card => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('is-open');
      // Close all first
      document.querySelectorAll('.svc-card.is-open').forEach(c => c.classList.remove('is-open'));
      // Open clicked if it wasn't already open
      if (!isOpen) card.classList.add('is-open');
    });
  });
})();

// ── SVG CONNECTOR LINE POSITIONING ──
(function initConnectorLines() {
  function positionConnectors() {
    const steps = document.querySelectorAll('.step');
    const svg = document.querySelector('.steps-connector');
    if (!steps.length || !svg) return;

    const line1 = svg.querySelector('.connector-line-1');
    const line2 = svg.querySelector('.connector-line-2');
    const svgRect = svg.getBoundingClientRect();

    const step1Num = steps[0].querySelector('.step-num');
    const step2Num = steps[1].querySelector('.step-num');
    const step3Num = steps[2].querySelector('.step-num');
    if (!step1Num || !step2Num || !step3Num) return;

    const r1 = step1Num.getBoundingClientRect();
    const r2 = step2Num.getBoundingClientRect();
    const r3 = step3Num.getBoundingClientRect();

    const cx1 = r1.left + r1.width / 2 - svgRect.left;
    const cx2 = r2.left + r2.width / 2 - svgRect.left;
    const cx3 = r3.left + r3.width / 2 - svgRect.left;
    const cy = r1.top + r1.height / 2 - svgRect.top;

    line1.setAttribute('x1', cx1); line1.setAttribute('y1', cy);
    line1.setAttribute('x2', cx2); line1.setAttribute('y2', cy);
    line2.setAttribute('x1', cx2); line2.setAttribute('y1', cy);
    line2.setAttribute('x2', cx3); line2.setAttribute('y2', cy);
  }

  positionConnectors();
  window.addEventListener('resize', positionConnectors);
})();

// ── PLACEHOLDER SYSTEM ──
(function initPlaceholders() {
  fetch('assets/data/placeholders.json')
    .then(r => r.json())
    .then(flags => {
      document.querySelectorAll('.placeholder-slot[data-placeholder]').forEach(el => {
        const key = el.dataset.placeholder;
        if (flags[key] === false) {
          el.classList.add('placeholder-hidden');
        } else {
          el.classList.remove('placeholder-hidden');
        }
      });
      // If case_studies is false, show insight cards; if true, hide them
      const insightCards = document.getElementById('insight-cards');
      if (insightCards) {
        insightCards.style.display = flags.case_studies === true ? 'none' : '';
      }
    })
    .catch(() => {
      // If fetch fails, hide all placeholder slots by default
      document.querySelectorAll('.placeholder-slot').forEach(el => {
        el.classList.add('placeholder-hidden');
      });
    });
})();

// ── NAV SCROLL STATE ──
(function initNavScroll() {
  const nav = document.getElementById('site-nav');
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    onUpdate: self => {
      nav.classList.toggle('scrolled', self.progress > 0);
    },
  });
})();

// ── THEME TOGGLE ──
(function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const root = document.documentElement;
  const navLogo = document.querySelector('.nav-logo-img');
  const LOGO_DARK = 'assets/logo-dark-bg.png';
  const LOGO_LIGHT = 'assets/logo-primary.png';

  const applyLogo = (isLight) => {
    if (navLogo) navLogo.src = isLight ? LOGO_LIGHT : LOGO_DARK;
  };

  const saved = localStorage.getItem('sai-theme');
  if (saved === 'light') {
    root.setAttribute('data-theme', 'light');
    toggle.textContent = '🌙';
    applyLogo(true);
  }

  toggle.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) {
      root.removeAttribute('data-theme');
      localStorage.setItem('sai-theme', 'dark');
      toggle.textContent = '☀️';
      applyLogo(false);
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('sai-theme', 'light');
      toggle.textContent = '🌙';
      applyLogo(true);
    }
  });
})();
