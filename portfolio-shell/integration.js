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
    applyAudio(name);
  }

  // Hiding a frame does not stop the media inside it, so every switch has to
  // hand audio over by hand: silence the sections that are leaving, wake the
  // one arriving. Home's music is a detached Audio object and About's needs to
  // keep its button label in step, so both go through their own exports rather
  // than through stopFrameMedia's DOM query.
  function frameApi(frame, key) {
    try {
      const win = frame.contentWindow;
      return (win && win[key]) || null;
    } catch (_) {
      return null;
    }
  }

  function applyAudio(name) {
    const homeApi = frameApi(homeFrame, 'portfolioHome');
    if (homeApi && homeApi.pauseMusic) {
      if (name === 'home') homeApi.resumeMusic();
      else homeApi.pauseMusic();
    }

    const aboutApi = frameApi(aboutFrame, 'portfolioAbout');
    if (aboutApi) {
      if (name === 'about') aboutApi.startMusic();
      else aboutApi.stopMusic();
    } else if (name !== 'about') {
      stopFrameMedia(aboutFrame);
    }

    if (name !== 'projects') stopFrameMedia(projectsFrame);
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

        // Still inside the user's click, so this is the last moment the
        // destination's audio can be unlocked. The transition runs for several
        // seconds and the gesture does not survive it.
        if (target === 'about') {
          const aboutApi = frameApi(aboutFrame, 'portfolioAbout');
          if (aboutApi && aboutApi.primeMusic) aboutApi.primeMusic();
        }

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
