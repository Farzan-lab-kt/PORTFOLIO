const bgMusic = document.getElementById('bgMusic');
const windSound = document.getElementById('windSound');
const soundControl = document.getElementById('soundControl');
const soundLabel = soundControl.querySelector('.sound-label');
const tumbleweed = document.querySelector('.tumbleweed');

let musicOn = false;
let tumbleTimer;

async function startMusic() {
  try {
    bgMusic.volume = 0.28;
    await bgMusic.play();
    musicOn = true;
    soundControl.classList.add('on');
    soundControl.setAttribute('aria-pressed', 'true');
    soundLabel.textContent = 'MUSIC: ON';
  } catch (error) {
    musicOn = false;
  }
}

function stopMusic() {
  bgMusic.pause();
  musicOn = false;
  soundControl.classList.remove('on');
  soundControl.setAttribute('aria-pressed', 'false');
  soundLabel.textContent = 'MUSIC: OFF';
}

soundControl.addEventListener('click', async () => {
  if (musicOn) stopMusic();
  else await startMusic();
});

// The browser may block autoplay, so the first meaningful interaction can unlock the music.
window.addEventListener('pointerdown', async (event) => {
  if (!musicOn && !event.target.closest('#soundControl')) await startMusic();
}, { once: true });

function playWind() {
  windSound.currentTime = 0;
  windSound.volume = 0.32;
  windSound.play().catch(() => {});
}

function launchTumbleweed() {
  tumbleweed.classList.remove('roll');
  void tumbleweed.offsetWidth;
  tumbleweed.style.setProperty('--travel', `${7.5 + Math.random() * 3}s`);
  tumbleweed.classList.add('roll');
  playWind();

  const travelMs = parseFloat(tumbleweed.style.getPropertyValue('--travel')) * 1000;
  clearTimeout(tumbleTimer);
  tumbleTimer = setTimeout(() => {
    const delay = 3500 + Math.random() * 3500;
    tumbleTimer = setTimeout(launchTumbleweed, delay);
  }, travelMs);
}

// Start after a delay so the page gets a quiet opening before the first pass.
setTimeout(launchTumbleweed, 2200);

// Arriving from Home is not a gesture inside this document, so the shell has to
// start the music itself. Routing through startMusic/stopMusic rather than the
// audio element keeps musicOn, the button state and its label in sync.
window.portfolioAbout = {
  startMusic,
  stopMusic,
  isMusicOn: () => musicOn
};
