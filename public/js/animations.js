/* ============================================================
   ANIMATIONS.JS — Sakura Cherry Blossom Theme
   Particles, Petal Fall, Cursor, Tilt, Scroll Reveal, Parallax
   ============================================================ */

(function () {
  'use strict';

  // ─── SCROLL PROGRESS BAR ───────────────────────────
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ─── CUSTOM CURSOR ─────────────────────────────────
  function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    // Hide on mobile/touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Expand ring on interactive elements
    const interactiveSelectors = 'a, button, input, .check-tab, .step-card, .feature-card, .mono, [data-tilt], [data-magnetic]';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      }
    });

    document.addEventListener('mousedown', () => {
      ring.classList.add('cursor-click');
      dot.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', () => {
      ring.classList.remove('cursor-click');
      dot.classList.remove('cursor-click');
    });
  }

  // ─── SAKURA PETAL FALL ─────────────────────────────
  function initSakuraPetals() {
    const petalCount = 15;
    const petalSVGs = [
      // Small petal
      `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="6" cy="6" rx="5" ry="3" fill="rgba(245,183,208,0.5)" transform="rotate(30 6 6)"/></svg>`,
      // Medium petal
      `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="8" cy="8" rx="6" ry="3.5" fill="rgba(232,145,185,0.4)" transform="rotate(-20 8 8)"/></svg>`,
      // Tiny dot petal
      `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="3" fill="rgba(250,218,221,0.4)"/></svg>`,
    ];

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      petal.innerHTML = petalSVGs[Math.floor(Math.random() * petalSVGs.length)];
      petal.style.left = Math.random() * 100 + '%';
      petal.style.animationDuration = (8 + Math.random() * 12) + 's';
      petal.style.animationDelay = Math.random() * 10 + 's';
      document.body.appendChild(petal);
    }
  }

  // ─── PARTICLES BACKGROUND (Cherry Blossom) ─────────
  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mousePos = { x: -1000, y: -1000 };
    let animationId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    });

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
        // Pink-tinted particles
        this.type = Math.random();
      }

          const force = (120 - dist) / 120;
          this.x -= dx * force * 0.02;
          this.y -= dy * force * 0.02;
        }

        // Wrap around
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        if (this.type > 0.6) {
          // Pink particles
          ctx.fillStyle = `rgba(232, 145, 185, ${this.opacity * 0.6})`;
        } else if (this.type > 0.3) {
          // Soft pink particles
          ctx.fillStyle = `rgba(245, 183, 208, ${this.opacity * 0.5})`;
        } else {
          // White-ish particles
          ctx.fillStyle = `rgba(240, 234, 240, ${this.opacity * 0.3})`;
        }
        ctx.fill();
      }
    }

    // Create particles
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 80);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const opacity = (1 - dist / 130) * 0.08;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(232, 145, 185, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      connectParticles();
      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Pause when not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
  }

  // ─── SCROLL REVEAL ANIMATIONS ─────────────────────
  function initScrollReveal() {
    const elements = document.querySelectorAll('[data-scroll-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay) || 0;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(el => {
      el.classList.add('scroll-hidden');
      observer.observe(el);
    });
  }

  // ─── TEXT REVEAL ANIMATION ─────────────────────────
  function initTextReveal() {
    const elements = document.querySelectorAll('[data-text-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay) || 0;
          setTimeout(() => {
            entry.target.classList.add('text-revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    elements.forEach(el => {
      el.classList.add('text-hidden');
      observer.observe(el);
    });
  }

  // ─── TILT EFFECT ON CARDS ─────────────────────────
  function initTiltEffect() {
    const cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'transform 0.1s ease';

        // Dynamic glare
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        card.style.setProperty('--glare-x', glareX + '%');
        card.style.setProperty('--glare-y', glareY + '%');
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  // ─── MAGNETIC EFFECT ──────────────────────────────
  function initMagneticEffect() {
    const elements = document.querySelectorAll('[data-magnetic]');
    if (!elements.length) return;

    elements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        el.style.transition = 'transform 0.2s ease';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  // ─── PARALLAX ON HERO ELEMENTS ────────────────────
  function initParallax() {
    const heroGlow = document.querySelector('.hero-glow');
    const heroGrid = document.querySelector('.hero-grid');
    const orbs = document.querySelectorAll('.hero-orb');
    const scrollIndicator = document.getElementById('scroll-indicator');

    if (!heroGlow && !heroGrid && !orbs.length) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const rate = scrollY * 0.3;

      if (heroGlow) {
        heroGlow.style.transform = `translateX(-50%) translateY(${rate * 0.4}px)`;
        heroGlow.style.opacity = Math.max(0, 1 - scrollY / 600);
      }

      if (heroGrid) {
        heroGrid.style.transform = `translateY(${rate * 0.15}px)`;
      }

      orbs.forEach((orb, i) => {
        const speed = [0.2, -0.15, 0.25][i] || 0.2;
        orb.style.transform = `translateY(${scrollY * speed}px)`;
      });

      // Fade scroll indicator
      if (scrollIndicator) {
        scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 200);
        scrollIndicator.style.transform = `translateX(-50%) translateY(${scrollY * 0.5}px)`;
      }
    }, { passive: true });
  }

  // ─── SMOOTH REVEAL FOR STAT BARS ──────────────────
  function initStatBars() {
    const bars = document.querySelectorAll('.stat-bar-fill');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('stat-bar-animated');
          }, 400);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    bars.forEach(bar => observer.observe(bar));
  }

  // ─── HERO BADGE ANIMATION ────────────────────────
  function initHeroBadge() {
    const badge = document.querySelector('.hero-badge');
    if (!badge) return;

    // Shimmer effect
    setInterval(() => {
      badge.classList.add('badge-shimmer');
      setTimeout(() => badge.classList.remove('badge-shimmer'), 1000);
    }, 5000);
  }

  // ─── NAVBAR HIDE ON SCROLL DOWN ──────────────────
  function initSmartNav() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    let lastScroll = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScroll = window.scrollY;

          if (currentScroll > 100) {
            if (currentScroll > lastScroll && currentScroll > 200) {
              nav.classList.add('nav-hidden');
            } else {
              nav.classList.remove('nav-hidden');
            }
            nav.classList.add('nav-scrolled');
          } else {
            nav.classList.remove('nav-hidden');
            nav.classList.remove('nav-scrolled');
          }

          lastScroll = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── RIPPLE EFFECT ON BUTTONS ─────────────────────
  function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn-scan, .btn-discord, .btn-submit, .btn-sm');

    buttons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  // ─── STAGGERED FADE FOR FEATURE CARDS ────────────
  function initFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.querySelector('.feature-icon').style.transform = 'scale(1.2) rotate(5deg)';
      });

      card.addEventListener('mouseleave', function() {
        this.querySelector('.feature-icon').style.transform = 'scale(1) rotate(0deg)';
      });
    });
  }

  // ─── SMOOTH ANCHOR SCROLL ────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ─── TYPING EFFECT ON INPUT PLACEHOLDER ──────────
  function initTypingPlaceholder() {
    const input = document.getElementById('check-input');
    if (!input) return;

    const texts = [
      'discord.gg/invite...',
      'Paste a User ID...',
      'Server vanity URL...',
      'discord.gg/discord...',
    ];

    let textIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let pauseTimeout;

    function type() {
      // Don't animate if user is focused
      if (document.activeElement === input) {
        pauseTimeout = setTimeout(type, 1000);
        return;
      }

      const current = texts[textIdx];

      if (!deleting) {
        input.placeholder = current.slice(0, charIdx + 1);
        charIdx++;

        if (charIdx >= current.length) {
          deleting = true;
          pauseTimeout = setTimeout(type, 2500);
          return;
        }
        pauseTimeout = setTimeout(type, 60 + Math.random() * 40);
      } else {
        input.placeholder = current.slice(0, charIdx);
        charIdx--;

        if (charIdx <= 0) {
          deleting = false;
          textIdx = (textIdx + 1) % texts.length;
          pauseTimeout = setTimeout(type, 500);
          return;
        }
        pauseTimeout = setTimeout(type, 30);
      }
    }

    setTimeout(type, 2000);

    // Restore default placeholder on focus
    input.addEventListener('focus', () => {
      clearTimeout(pauseTimeout);
    });

    input.addEventListener('blur', () => {
      if (!input.value) {
        setTimeout(type, 1000);
      }
    });
  }

  // ─── GLOW FOLLOW ON CHECK CARD ────────────────────
  function initGlowFollow() {
    const card = document.querySelector('.check-card');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--glow-x', x + 'px');
      card.style.setProperty('--glow-y', y + 'px');
    });
  }

  // ─── COUNTER ANIMATION WITH INTERSECTION ──────────
  function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('counter-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  // ─── INITIALIZATION ───────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initCustomCursor();
    initSakuraPetals();
    initParticles();
    initScrollReveal();
    initTextReveal();
    initTiltEffect();
    initMagneticEffect();
    initParallax();
    initStatBars();
    initHeroBadge();
    initSmartNav();
    initRippleEffect();
    initFeatureCards();
    initSmoothScroll();
    initTypingPlaceholder();
    initGlowFollow();
    initCounterAnimation();

    // Loading overlay fade
    document.body.classList.add('loaded');
  });

})();
