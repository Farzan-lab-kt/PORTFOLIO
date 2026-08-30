const home = document.getElementById('home');
const backgroundVideo = document.getElementById('backgroundVideo');
const portalLayer = document.getElementById('portalLayer');
const portalVideo = document.getElementById('portalVideo');
const destinationReveal = document.getElementById('destinationReveal');
const status = document.getElementById('transitionStatus');
const buttons = [...document.querySelectorAll('.mc-button')];

const homeMusic = new Audio('assets/home-music.mp3');
const portalSound = new Audio('assets/portal-sound.mp3');
const hoverSound = new Audio('assets/button-hover.mp3');

homeMusic.loop = true;
homeMusic.volume = 0.22;
homeMusic.preload = 'auto';

portalSound.loop = false;
portalSound.volume = 0.14;
portalSound.preload = 'auto';

hoverSound.loop = false;
hoverSound.volume = 1.0;
hoverSound.preload = 'auto';

// Explicitly preload the audio assets so the first interaction does not
// wait for a fresh network/decode request.
homeMusic.load();
portalSound.load();
hoverSound.load();
portalVideo.preload = 'auto';

let transitioning = false;
let destinationRevealTimer = null;
let portalEndedHandler = null;

function playHomeMusic() {
  homeMusic.play().catch(() => {});
}

window.addEventListener('pointerdown', playHomeMusic, { once: true, passive: true });
window.addEventListener('keydown', playHomeMusic, { once: true });

buttons.forEach((button) => {
  // Hover sound is strictly pointer-entry driven. Keyboard focus does not
  // trigger it, and each entry starts one clean click sound.
  button.addEventListener('pointerenter', () => {
    if (transitioning) return;

    // Start/keep the Home background music on the user's first real
    // pointer interaction so browser autoplay restrictions do not leave
    // the Home page silent.
    playHomeMusic();

    // The supplied click sound is hover-entry only: one sharp, immediate
    // playback whenever the pointer enters a button.
    hoverSound.pause();
    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});
  });

  button.addEventListener('click', () => beginPortalTransition(button.dataset.target));
});

function beginPortalTransition(target) {
  if (transitioning) return;
  transitioning = true;
  home.classList.add('is-transitioning');
  buttons.forEach((button) => { button.disabled = true; });
  status.textContent = `Entering ${target}.`;

  // Stop/reset any previous transition state.
  if (destinationRevealTimer) {
    clearTimeout(destinationRevealTimer);
    destinationRevealTimer = null;
  }
  if (portalEndedHandler) {
    portalSound.removeEventListener('ended', portalEndedHandler);
    portalEndedHandler = null;
  }

  homeMusic.volume = 0.06;

  portalSound.pause();
  portalSound.currentTime = 0;
  portalVideo.pause();
  portalVideo.currentTime = 0;
  portalVideo.loop = true;

  // IMPORTANT: the destination-reveal mask is transparent while the portal
  // is playing. A black mask above the video was the cause of the reported
  // black-screen problem.
  destinationReveal.classList.remove('is-revealing');

  // Show the actual portal layer immediately. The video element is already
  // preloaded and the layer itself is not black-masked by another element.
  portalLayer.classList.add('is-active');

  // Both play calls happen directly inside the user's click event. This keeps
  // the portal sound tied to the same gesture and avoids an artificial delay.
  portalSound.play().catch(() => {});
  portalVideo.play().catch(() => {
    // If the browser has not decoded the first frame yet, retry once it has.
    const retry = () => {
      portalVideo.play().catch(() => {});
      portalVideo.removeEventListener('canplay', retry);
    };
    portalVideo.addEventListener('canplay', retry, { once: true });
  });

  // Reveal is an integration event for the eventual destination section.
  // The Home standalone build has no destination content to reveal yet.
  destinationRevealTimer = window.setTimeout(() => {
    destinationReveal.classList.add('is-revealing');
    window.dispatchEvent(new CustomEvent('portfolio:destination-reveal', {
      detail: { target }
    }));
  }, 6500);

  portalEndedHandler = () => finishPortalTransition(target);
  portalSound.addEventListener('ended', portalEndedHandler, { once: true });
}

function finishPortalTransition(target) {
  if (!transitioning) return;

  if (destinationRevealTimer) {
    clearTimeout(destinationRevealTimer);
    destinationRevealTimer = null;
  }
  if (portalEndedHandler) {
    portalSound.removeEventListener('ended', portalEndedHandler);
    portalEndedHandler = null;
  }

  portalVideo.pause();
  portalVideo.currentTime = 0;
  portalSound.pause();
  portalSound.currentTime = 0;
  portalLayer.classList.remove('is-active');

  window.dispatchEvent(new CustomEvent('portfolio:destination-ready', {
    detail: { target }
  }));

  transitioning = false;
  home.classList.remove('is-transitioning');
  buttons.forEach((button) => { button.disabled = false; });
  homeMusic.volume = 0.22;
  status.textContent = '';
}

window.portfolioHome = {
  beginPortalTransition,
  isTransitioning: () => transitioning
};
