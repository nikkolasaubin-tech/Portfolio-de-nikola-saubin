document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const progress = $('[data-scroll-progress]');
  const updateScrollProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  const navToggle = $('.nav-toggle');
  const navLinks = $('.nav-links');
  if (navToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    $$('.nav-links a').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  }

  const formatNumber = (value, format, prefix = '') => {
    if (format === 'separator') return `${prefix}${Math.round(value).toLocaleString('fr-FR')}`;
    if (format === 'percent') return `${prefix}${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
    if (format === 'k') return `${prefix}${Math.round(value).toLocaleString('fr-FR')} K`;
    return `${prefix}${Math.round(value).toLocaleString('fr-FR')}`;
  };

  const animateCount = (el) => {
    if (el.dataset.countDone === 'true') return;
    el.dataset.countDone = 'true';
    const target = Number(String(el.dataset.countTo || '0').replace(',', '.'));
    const format = el.dataset.countFormat || 'separator';
    const prefix = el.dataset.countPrefix || '';
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNumber(target * eased, format, prefix);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target, format, prefix);
    };
    requestAnimationFrame(tick);
  };
  const counters = $$('[data-count-to]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    counters.forEach((counter) => observer.observe(counter));
  } else counters.forEach(animateCount);

  $$('[data-player]').forEach((player) => {
    const audio = $('audio[data-audio]', player);
    const playBtn = $('[data-play]', player);
    const progressBar = $('[data-progress]', player);
    const progressFill = $('[data-progress-fill]', player);
    const timeLabel = $('[data-time]', player);
    const waveform = $('[data-waveform]', player);
    const playIcon = playBtn ? $('.icon-play', playBtn) : null;
    const pauseIcon = playBtn ? $('.icon-pause', playBtn) : null;
    if (!audio || !playBtn) return;

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
    };

    const getDuration = () => Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 30;
    const updateUI = () => {
      const duration = getDuration();
      const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const pct = duration ? (current / duration) * 100 : 0;
      if (progressFill) progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      if (timeLabel) timeLabel.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    };
    const updateIcons = () => {
      const isPlaying = !audio.paused && !audio.ended;
      if (playIcon) playIcon.style.display = isPlaying ? 'none' : '';
      if (pauseIcon) pauseIcon.style.display = isPlaying ? '' : 'none';
      player.classList.toggle('is-playing', isPlaying);
      if (waveform) waveform.classList.toggle('is-playing', isPlaying);
    };

    playBtn.addEventListener('click', async () => {
      try {
        if (audio.paused || audio.ended) await audio.play();
        else audio.pause();
      } catch (error) {
        console.warn('Lecture audio impossible :', error);
        if (timeLabel) timeLabel.textContent = 'Audio indisponible';
      }
      updateIcons(); updateUI();
    });
    ['loadedmetadata','durationchange','timeupdate','canplay'].forEach((evt) => audio.addEventListener(evt, updateUI));
    ['play','pause','ended'].forEach((evt) => audio.addEventListener(evt, updateIcons));
    audio.addEventListener('ended', updateUI);
    if (progressBar) {
      progressBar.addEventListener('click', (event) => {
        const rect = progressBar.getBoundingClientRect();
        const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
        audio.currentTime = Math.min(getDuration(), Math.max(0, ratio * getDuration()));
        updateUI();
      });
    }
    updateIcons(); updateUI();
  });
});

window.addEventListener('error', (event) => {
  const target = event.target;
  if (target && target.tagName === 'IMG') {
    console.warn('Image manquante ou chemin incorrect :', target.getAttribute('src'));
  }
}, true);

document.addEventListener("DOMContentLoaded", () => {
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const $ = (selector, scope = document) => scope.querySelector(selector);

  // Phone carousel
  $$('[data-carousel]').forEach((carousel) => {
    const track = $('[data-carousel-track]', carousel);
    const prevBtn = $('[data-carousel-prev]', carousel);
    const nextBtn = $('[data-carousel-next]', carousel);
    const dotsWrap = carousel.parentElement.querySelector('[data-carousel-dots]');
    const dots = dotsWrap ? $$('button', dotsWrap) : [];
    const slides = track ? $$('.phone-slide', track) : [];
    const axis = carousel.dataset.carouselAxis === 'y' ? 'y' : 'x';
    const screen = track?.closest('.phone-screen');
    if (!track || slides.length <= 1) return;

    let index = 0;
    let startPos = null;
    let delta = 0;

    const update = () => {
      const translateValue = `-${index * 100}%`;
      track.style.transform = axis === 'y'
        ? `translateY(${translateValue})`
        : `translateX(${translateValue})`;
      dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
    };

    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      update();
    };

    prevBtn?.addEventListener('click', () => goTo(index - 1));
    nextBtn?.addEventListener('click', () => goTo(index + 1));
    dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => goTo(dotIndex)));

    track.addEventListener('pointerdown', (event) => {
      startPos = axis === 'y' ? event.clientY : event.clientX;
      delta = 0;
      track.style.transition = 'none';
      track.setPointerCapture?.(event.pointerId);
    });
    track.addEventListener('pointermove', (event) => {
      if (startPos === null) return;
      const currentPos = axis === 'y' ? event.clientY : event.clientX;
      delta = currentPos - startPos;
    });
    const endSwipe = () => {
      if (startPos === null) return;
      if (Math.abs(delta) > 40) {
        if (delta < 0) goTo(index + 1);
        else goTo(index - 1);
      } else {
        update();
      }
      track.style.transition = '';
      startPos = null;
      delta = 0;
    };
    track.addEventListener('pointerup', endSwipe);
    track.addEventListener('pointercancel', endSwipe);

    if (axis === 'y' && screen) {
      let wheelLocked = false;
      screen.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (wheelLocked) return;
        const direction = Math.sign(event.deltaY);
        if (!direction) return;
        wheelLocked = true;
        goTo(index + (direction > 0 ? 1 : -1));
        window.setTimeout(() => { wheelLocked = false; }, 380);
      }, { passive: false });
    }

    update();
  });

  // Image zoom modal
  const zoomSelectors = [
    '.case-image img', '.vhs-preview img', '.proof-grid img', '.instagram-phone img', '.story-phone img',
    '.poster img', '.rap-tile img', '.pile-cover-wrap img', '.pile-gallery img', '.pop-image img',
    '.case-card-image img', '.audio-cover img', '.vhs-feed-frame img', '.lbf-screen img', '.lbf-title-logo'
  ].join(',');

  const zoomable = $$(zoomSelectors)
    .filter((img) => !img.closest('.site-character'));

  if (zoomable.length) {
    const modal = document.createElement('div');
    modal.className = 'img-modal';
    modal.innerHTML = `
      <div class="img-modal-dialog" role="dialog" aria-modal="true" aria-label="Aperçu agrandi de l'image">
        <button class="img-modal-close" type="button" aria-label="Fermer">×</button>
        <img src="" alt="">
      </div>`;
    document.body.appendChild(modal);

    const modalImg = $('img', modal);
    const closeBtn = $('.img-modal-close', modal);
    let lastFocused = null;

    const openModal = (img) => {
      lastFocused = document.activeElement;
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = img.alt || 'Aperçu agrandi';
      modal.classList.add('is-open');
      document.body.classList.add('menu-open');
      closeBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modalImg.src = '';
      document.body.classList.remove('menu-open');
      lastFocused?.focus?.();
    };

    zoomable.forEach((img) => {
      img.classList.add('zoomable-image');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `${img.alt || 'Image'} — cliquer pour agrandir`);
      img.addEventListener('click', () => openModal(img));
      img.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openModal(img);
        }
      });
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }
});


// =========================================================
// V6 — polish recruteur : reveal au scroll + navigation active
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const $ = (selector, scope = document) => scope.querySelector(selector);

  const nav = $('.nav');
  const updateNavState = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', updateNavState, { passive:true });
  updateNavState();

  const revealTargets = [
    '.section-label',
    '.section-title',
    '.about-portrait',
    '.about-content',
    '.pillar',
    '.tl-item',
    '.edu-card',
    '.case-study',
    '.case-block',
    '.case-card',
    '.starlink-head',
    '.audio-player',
    '.sl-block',
    '.pile-head',
    '.pile-cover-wrap',
    '.pile-block',
    '.rap-feature',
    '.affiches',
    '.poster',
    '.foot-story',
    '.pop-world',
    '.pop-stat',
    '.skill-cat',
    '.tools-block',
    '.contact-title',
    '.contact-lead',
    '.contact-card'
  ].join(',');

  const elements = $$(revealTargets).filter((el) => !el.closest('.nav'));
  elements.forEach((el, index) => {
    el.setAttribute('data-reveal', '');
    el.style.setProperty('--reveal-delay', `${Math.min(180, (index % 5) * 45)}ms`);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
    elements.forEach((el) => revealObserver.observe(el));
  } else {
    elements.forEach((el) => el.classList.add('is-visible'));
  }

  const sections = ['about','experience','projects','creative','skills','contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const links = $$('.nav-links a[href^="#"]');

  if ('IntersectionObserver' in window && sections.length && links.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const id = visible.target.id;
      links.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    }, { threshold:[0.18,0.35,0.55], rootMargin:'-18% 0px -55% 0px' });

    sections.forEach((section) => activeObserver.observe(section));
  }
});
