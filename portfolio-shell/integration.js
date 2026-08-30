(() => {
  const homeWrap = document.getElementById('homeFrameWrap');
  const projectsWrap = document.getElementById('projectsFrameWrap');
  const aboutWrap = document.getElementById('aboutFrameWrap');
  const homeFrame = document.getElementById('homeFrame');
  const projectsFrame = document.getElementById('projectsFrame');
  const aboutFrame = document.getElementById('aboutFrame');
  const backHome = document.getElementById('backHome');

  let active = 'home';
  let transitionHandoff = false;

  function show(name) {
    const frames = { home: homeWrap, projects: projectsWrap, about: aboutWrap };
    Object.entries(frames).forEach(([key, el]) => {
      const on = key === name;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', String(!on));
    });
    active = name;
    backHome.hidden = name === 'home';
  }

  function homeWindow() {
    try { return homeFrame.contentWindow; } catch (_) { return null; }
  }

  function interceptHomeNavigation() {
    const doc = homeFrame.contentDocument;
    if (!doc) return;

    // Capture before Home's own bubble-phase click handler. The locked Home
    // source is not edited; this listener is part of the new integration layer.
    doc.querySelectorAll('.mc-button').forEach((button) => {
      if (button.dataset.integrationBound === '1') return;
      button.dataset.integrationBound = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (transitionHandoff) return;

        const target = button.dataset.target;
        if (target !== 'projects' && target !== 'about') return;

        const win = homeWindow();
        if (!win || !win.portfolioHome || win.portfolioHome.isTransitioning()) return;

        transitionHandoff = true;
        win.portfolioHome.beginPortalTransition(target);
      }, true);
    });
  }

  homeFrame.addEventListener('load', () => {
    interceptHomeNavigation();

    // The Home source dispatches its completion event on its own window.
    const win = homeWindow();
    if (!win || win.__portfolioIntegrationBound) return;
    win.__portfolioIntegrationBound = true;
    win.addEventListener('portfolio:destination-ready', (event) => {
      const target = event.detail && event.detail.target;
      if (target === 'projects') {
        // Keep Home hidden until Projects has loaded. The destination was
        // never made visible during the portal transition.
        projectsFrame.addEventListener('load', () => {
          show('projects');
          transitionHandoff = false;
        }, { once: true });
        // If already loaded, reveal immediately after the ready event.
        if (projectsFrame.contentDocument && projectsFrame.contentDocument.readyState === 'complete') {
          show('projects');
          transitionHandoff = false;
        }
      } else if (target === 'about') {
        aboutFrame.addEventListener('load', () => {
          show('about');
          transitionHandoff = false;
        }, { once: true });
        if (aboutFrame.contentDocument && aboutFrame.contentDocument.readyState === 'complete') {
          show('about');
          transitionHandoff = false;
        }
      }
    });
  });

  // Back is intentionally an integration-layer control; source files remain locked.
  // Stop any media owned by the Projects iframe before returning to Home.
  // The Projects source itself is untouched; this only controls its embedded
  // document from the integration layer.
  function stopFrameMedia(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      doc.querySelectorAll('audio, video').forEach((media) => {
        media.pause();
        try { media.currentTime = 0; } catch (_) {}
      });
    } catch (_) {}
  }

  backHome.addEventListener('click', () => {
    stopFrameMedia(projectsFrame);
    show('home');
    transitionHandoff = false;
    interceptHomeNavigation();
  });

  // The destination frames are preloaded but never visible before the Home
  // transition announces completion. This preserves each site's relative assets.
  show('home');
})();
