/*
  Interactive layer for the Projects section.
  The mini-games are intentionally lightweight portfolio demos; the source buttons
  still point to the full C++ projects on GitHub.
*/

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --------------------------- Background particles ---------------------------
const particleLayer = document.querySelector('.particles');
if (particleLayer && !reducedMotion) {
  const count = 34;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.setProperty('--drift', `${Math.round((Math.random() - .5) * 180)}px`);
    p.style.animationDuration = `${7 + Math.random() * 11}s`;
    p.style.animationDelay = `${-Math.random() * 14}s`;
    p.style.transform = `scale(${0.55 + Math.random() * 1.2})`;
    particleLayer.appendChild(p);
  }
}

// ------------------------------ Card tilt ----------------------------------
document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (reducedMotion || event.target.closest('button, a')) return;
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    card.style.transform = `perspective(900px) rotateX(${y * -1.2}deg) rotateY(${x * 1.2}deg) translateY(-7px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

// --------------------------- Shared canvas helper ---------------------------
function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

function pixelText(ctx, text, x, y, size, color, align = 'left') {
  ctx.font = `${size}px MinecraftTen, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}


// --------------------------- Portfolio audio manager -------------------------
const siteBgm = document.getElementById('siteBgm');
const ticBgm = document.getElementById('ticBgm');
const SITE_BGM_VOLUME = 0.20;
const TIC_BGM_VOLUME = 0.20;

if (siteBgm) {
  siteBgm.volume = SITE_BGM_VOLUME;
  siteBgm.loop = true;
  siteBgm.preload = 'auto';
}
if (ticBgm) {
  ticBgm.volume = TIC_BGM_VOLUME;
  ticBgm.loop = true;
  ticBgm.preload = 'auto';
}

let siteAudioStarted = false;

async function startSiteBgm() {
  if (!siteBgm) return false;
  siteBgm.volume = SITE_BGM_VOLUME;
  siteBgm.loop = true;
  try {
    await siteBgm.play();
    siteAudioStarted = true;
    return true;
  } catch (_) {
    return false;
  }
}

function stopSiteBgm() {
  if (!siteBgm) return;
  siteBgm.pause();
}

async function startTicBgm() {
  if (!ticBgm) return;
  // Tic-Tac-Toe owns the audio while it is running.
  stopSiteBgm();
  ticBgm.volume = TIC_BGM_VOLUME;
  ticBgm.currentTime = 0;
  try { await ticBgm.play(); } catch (_) {}
}

function stopTicBgm(resumeSite = true) {
  if (ticBgm) {
    ticBgm.pause();
    ticBgm.currentTime = 0;
  }
  if (resumeSite) startSiteBgm();
}

// --------------------------- My Projects arcade boot -------------------------
const projectBoot = document.getElementById('projectBoot');
const slotMachineTrigger = document.getElementById('slotMachineTrigger');
const slotMachineFrame = document.getElementById('slotMachineFrame');
const bootHint = document.getElementById('bootHint');
const slotMachineSfx = new Audio('assets/slot-machine/slotmachine.mp3');
slotMachineSfx.preload = 'auto';
slotMachineSfx.volume = 0.38;

const slotFrames = [
  'assets/slot-machine/01_idle.png',
  'assets/slot-machine/02_lever.png',
  'assets/slot-machine/03_spin_a.png',
  'assets/slot-machine/04_spin_b.png',
  'assets/slot-machine/05_spin_c.png',
  'assets/slot-machine/06_slow.png',
  'assets/slot-machine/07_jackpot.png',
  'assets/slot-machine/08_access.png',
  'assets/slot-machine/09_opening.png',
  'assets/slot-machine/10_unlocked.png'
];

// Preload every supplied frame so the startup animation never waits on an image request.
slotFrames.forEach((src) => { const img = new Image(); img.src = src; });

let projectBootStarted = false;
let projectBootUnlocked = false;

function setSlotFrame(src) {
  if (slotMachineFrame) slotMachineFrame.src = src;
}

async function beginProjectsBoot() {
  if (!projectBoot || !slotMachineTrigger || projectBootStarted) return;
  projectBootStarted = true;
  slotMachineTrigger.disabled = true;
  projectBoot.classList.add('powering');
  if (bootHint) bootHint.textContent = 'SYSTEM STARTING // PLEASE WAIT';

  // This click is the user's gesture. Start the machine sound immediately.
  try {
    slotMachineSfx.currentTime = 0;
    await slotMachineSfx.play();
  } catch (_) {}

  // The main BGM is prepared silently during the same user gesture so the
  // browser's autoplay policy is satisfied; it is made audible only after
  // the slot-machine animation has completed.
  let preparedSiteAudio = false;
  if (siteBgm) {
    try {
      siteBgm.volume = 0;
      await siteBgm.play();
      preparedSiteAudio = true;
    } catch (_) {}
  }

  const frameDelay = 300;
  for (let i = 1; i < slotFrames.length; i++) {
    await new Promise(resolve => window.setTimeout(resolve, frameDelay));
    setSlotFrame(slotFrames[i]);
  }

  // The machine is now finished. Wait exactly 1 second before bringing
  // the website BGM in at its normal soft volume.
  await new Promise(resolve => window.setTimeout(resolve, 1000));
  if (siteBgm) {
    siteBgm.volume = SITE_BGM_VOLUME;
    siteBgm.loop = true;
    if (!preparedSiteAudio) {
      try { await siteBgm.play(); } catch (_) {}
    }
    siteAudioStarted = !siteBgm.paused;
  }

  if (slotMachineSfx) {
    slotMachineSfx.pause();
    slotMachineSfx.currentTime = 0;
  }

  if (bootHint) bootHint.textContent = 'ACCESS GRANTED // MY PROJECTS ONLINE';
  await new Promise(resolve => window.setTimeout(resolve, 500));
  projectBootUnlocked = true;
  projectBoot.classList.add('unlocking');
  window.setTimeout(() => projectBoot.remove(), 800);
}

slotMachineTrigger?.addEventListener('click', beginProjectsBoot);

// --------------------------- Tic-Tac-Toe -----------------------------------
const ticCanvas = document.getElementById('ticGame');
const ticStatus = document.getElementById('ticStatus');
let tic = { board: Array(9).fill(''), over: false, busy: false, playing: false, timer: 0 };
const ticPreview = ticCanvas?.closest('.game-preview');

function ticReset() {
  stopTicBgm(true);
  window.clearTimeout(tic.timer);
  tic = { board: Array(9).fill(''), over: false, busy: false, playing: false, timer: 0 };
  ticStatus.textContent = 'PRESS PLAY // START BUILD';
  ticPreview?.classList.remove('is-playing');
  drawTic();
}
function ticStart() {
  stopTicBgm(false);
  window.clearTimeout(tic.timer);
  tic = { board: Array(9).fill(''), over: false, busy: false, playing: true, timer: 0 };
  ticStatus.textContent = 'YOUR TURN // X';
  ticPreview?.classList.add('is-playing');
  startTicBgm();
  drawTic();
}

function ticWinner(board) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'DRAW' : null;
}

function minimax(board, maximizing) {
  const result = ticWinner(board);
  if (result === 'O') return 10;
  if (result === 'X') return -10;
  if (result === 'DRAW') return 0;

  if (maximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) if (!board[i]) {
      board[i] = 'O';
      best = Math.max(best, minimax(board, false));
      board[i] = '';
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) if (!board[i]) {
    board[i] = 'X';
    best = Math.min(best, minimax(board, true));
    board[i] = '';
  }
  return best;
}

function ticAiMove() {
  if (tic.over || !tic.playing) return;
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) if (!tic.board[i]) {
    tic.board[i] = 'O';
    const score = minimax(tic.board, false);
    tic.board[i] = '';
    if (score > bestScore) { bestScore = score; bestMove = i; }
  }
  if (bestMove >= 0) tic.board[bestMove] = 'O';
  const result = ticWinner(tic.board);
  if (result) {
    tic.over = true;
    tic.playing = false;
    ticPreview?.classList.remove('is-playing');
    stopTicBgm();
    setGameControls('tic', false);
      ticStatus.textContent = result === 'DRAW' ? 'DRAW // RESET' : `${result} WINS // RESET`;
  } else ticStatus.textContent = 'YOUR TURN // X';
  tic.busy = false;
  drawTic();
}

function drawTic() {
  if (!ticCanvas) return;
  const {ctx,w,h} = setupCanvas(ticCanvas);
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#090820'; ctx.fillRect(0,0,w,h);
  const size = Math.min(h - 42, w - 52, 160);
  const ox = (w-size)/2, oy = (h-size)/2 - 4;
  ctx.shadowColor = '#ff3a96'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff3a96'; ctx.fillRect(ox,oy,size,size); ctx.shadowBlur = 0;
  const cell = size/3;
  for (let i=0;i<9;i++) {
    const x = ox + (i%3)*cell, y = oy + Math.floor(i/3)*cell;
    ctx.fillStyle = '#15123d'; ctx.fillRect(x+2,y+2,cell-4,cell-4);
    const mark = tic.board[i];
    if (mark) {
      ctx.font = `bold ${Math.floor(cell*.58)}px MinecraftTen, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = mark === 'X' ? '#24e7ee' : '#ffe76a';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
      ctx.fillText(mark, x+cell/2, y+cell/2+2); ctx.shadowBlur = 0;
    }
  }
  pixelText(ctx, 'X = YOU', 8, 12, 7, '#24e7ee');
  pixelText(ctx, 'O = AI', w-8, 12, 7, '#ffe76a', 'right');
}

ticCanvas?.addEventListener('click', (e) => {
  if (!tic.playing || tic.busy || tic.over) return;
  const rect = ticCanvas.getBoundingClientRect();
  const size = Math.min(rect.height - 42, rect.width - 52, 160);
  const ox = (rect.width-size)/2, oy = (rect.height-size)/2 - 4;
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if (x < ox || x > ox+size || y < oy || y > oy+size) return;
  const col = Math.floor((x-ox)/(size/3));
  const row = Math.floor((y-oy)/(size/3));
  const index = row*3+col;
  if (tic.board[index]) return;
  tic.board[index] = 'X';
  const result = ticWinner(tic.board);
  if (result) {
    tic.over = true;
    tic.playing = false;
    ticPreview?.classList.remove('is-playing');
    stopTicBgm();
    setGameControls('tic', false);
      ticStatus.textContent = result === 'DRAW' ? 'DRAW // RESET' : 'YOU WIN // RESET';
    drawTic();
    return;
  }
  tic.busy = true; ticStatus.textContent = 'AI THINKING // MINIMAX'; drawTic();
  tic.timer = window.setTimeout(ticAiMove, 180);
});

// -------------------------------- Pong -------------------------------------
const pongCanvas = document.getElementById('pongGame');
const pongStatus = document.getElementById('pongStatus');
let pong = { running: false, playing: false, keys: {}, score: [0,0], pY: 0, aiY: 0, bx:0, by:0, vx:0, vy:0, raf:0, last:0 };
const pongPreview = pongCanvas?.closest('.game-preview');

function pongReset() {
  cancelAnimationFrame(pong.raf);
  const rect = pongCanvas.getBoundingClientRect();
  pong.pY = rect.height/2; pong.aiY = rect.height/2;
  pong.bx = rect.width/2; pong.by = rect.height/2;
  pong.vx = 190; pong.vy = 110; pong.score = [0,0]; pong.running = false; pong.playing = false; pong.last = 0; pong.keys = {};
  pongStatus.textContent = 'PRESS PLAY // START BUILD';
  pongPreview?.classList.remove('is-playing');
  drawPong();
}
function pongStart() {
  cancelAnimationFrame(pong.raf);
  const rect = pongCanvas.getBoundingClientRect();
  pong.pY = rect.height/2; pong.aiY = rect.height/2;
  pong.bx = rect.width/2; pong.by = rect.height/2;
  pong.vx = 190; pong.vy = 110; pong.score = [0,0]; pong.running = true; pong.playing = true; pong.last = performance.now();
  pongStatus.textContent = 'W / S OR ↑ / ↓ // MOVE';
  pongPreview?.classList.add('is-playing');
  pong.raf = requestAnimationFrame(pongLoop);
}
function pongServe(direction) {
  const rect = pongCanvas.getBoundingClientRect();
  pong.bx = rect.width/2; pong.by = rect.height/2;
  pong.vx = 190 * direction; pong.vy = (Math.random()>.5?1:-1) * (75 + Math.random()*90);
}
function drawPong() {
  if (!pongCanvas) return;
  const {ctx,w,h} = setupCanvas(pongCanvas);
  ctx.fillStyle = '#080b24'; ctx.fillRect(0,0,w,h);
  const glow = ctx.createRadialGradient(w/2,h/2,3,w/2,h/2,w*.55);
  glow.addColorStop(0,'rgba(255,35,138,.18)'); glow.addColorStop(1,'rgba(255,35,138,0)');
  ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);
  ctx.setLineDash([5,7]); ctx.strokeStyle='#604b7d'; ctx.beginPath(); ctx.moveTo(w/2,8); ctx.lineTo(w/2,h-8); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#ffe76a'; ctx.shadowColor='#ffe76a'; ctx.shadowBlur=12; ctx.fillRect(12,pong.pY-30,8,60);
  ctx.fillStyle='#24e7ee'; ctx.shadowColor='#24e7ee'; ctx.fillRect(w-20,pong.aiY-30,8,60); ctx.shadowBlur=0;
  ctx.fillStyle='#ff238a'; ctx.shadowColor='#ff238a'; ctx.shadowBlur=14; ctx.fillRect(pong.bx-5,pong.by-5,10,10); ctx.shadowBlur=0;
  pixelText(ctx, String(pong.score[0]).padStart(2,'0'), w*.42, 18, 14, '#ffe76a', 'center');
  pixelText(ctx, String(pong.score[1]).padStart(2,'0'), w*.58, 18, 14, '#24e7ee', 'center');
}
function pongLoop(ts) {
  if (!pongCanvas || !pong.running || !pong.playing) return;
  const dt = Math.min((ts-pong.last)/1000 || 0, .035); pong.last=ts;
  const rect = pongCanvas.getBoundingClientRect(); const w=rect.width,h=rect.height;
  const speed=250;
  if (pong.keys['w']||pong.keys['arrowup']) pong.pY-=speed*dt;
  if (pong.keys['s']||pong.keys['arrowdown']) pong.pY+=speed*dt;
  pong.pY=Math.max(31,Math.min(h-31,pong.pY));
  const aiSpeed=150;
  if (pong.aiY < pong.by-8) pong.aiY += aiSpeed*dt;
  if (pong.aiY > pong.by+8) pong.aiY -= aiSpeed*dt;
  pong.aiY=Math.max(31,Math.min(h-31,pong.aiY));
  pong.bx += pong.vx*dt; pong.by += pong.vy*dt;
  if (pong.by < 5 || pong.by > h-5) { pong.by=Math.max(5,Math.min(h-5,pong.by)); pong.vy*=-1; }
  if (pong.bx < 28 && pong.bx > 18 && Math.abs(pong.by-pong.pY)<35 && pong.vx<0) { pong.vx=Math.abs(pong.vx)*1.04; pong.vy += (pong.by-pong.pY)*3; }
  if (pong.bx > w-28 && pong.bx < w-18 && Math.abs(pong.by-pong.aiY)<35 && pong.vx>0) { pong.vx=-Math.abs(pong.vx)*1.04; pong.vy += (pong.by-pong.aiY)*3; }
  if (pong.bx < -10) { pong.score[1]++; pongServe(1); }
  if (pong.bx > w+10) { pong.score[0]++; pongServe(-1); }
  if (pong.score[0]>=5 || pong.score[1]>=5) {
    pongStatus.textContent = pong.score[0]>=5 ? 'YOU WIN // RESET' : 'AI WINS // RESET';
    pong.running=false;
  }
  drawPong();
  if (pong.running) pong.raf=requestAnimationFrame(pongLoop);
}
window.addEventListener('keydown',(e)=>{ const k=e.key.toLowerCase(); if(['w','s','arrowup','arrowdown'].includes(k) && pong.playing) { pong.keys[k]=true; if(e.target===document.body) e.preventDefault(); } });
window.addEventListener('keyup',(e)=>{ pong.keys[e.key.toLowerCase()]=false; });
pongCanvas?.addEventListener('pointerdown',()=>pongCanvas.focus?.());

// -------------------------------- Snake ------------------------------------
const snakeCanvas = document.getElementById('snakeGame');
const snakeStatus = document.getElementById('snakeStatus');
let snake = { body: [], dir:{x:1,y:0}, next:{x:1,y:0}, food:{x:8,y:6}, score:0, over:false, playing:false, timer:0 };
const snakePreview = snakeCanvas?.closest('.game-preview');
const GRID=20;
function snakeReset() {
  clearTimeout(snake.timer);
  snake.body=[{x:5,y:7},{x:4,y:7},{x:3,y:7}]; snake.dir={x:1,y:0}; snake.next={x:1,y:0}; snake.score=0; snake.over=false; snake.playing=false; snake.timer=0; snake.food=snakeFood(); snakeStatus.textContent='PRESS PLAY // START BUILD'; snakePreview?.classList.remove('is-playing'); drawSnake();
}
function snakeStart() {
  clearTimeout(snake.timer);
  snake.body=[{x:5,y:7},{x:4,y:7},{x:3,y:7}]; snake.dir={x:1,y:0}; snake.next={x:1,y:0}; snake.score=0; snake.over=false; snake.playing=true; snake.timer=0; snake.food=snakeFood(); snakeStatus.textContent='ARROWS / WASD // MOVE'; snakePreview?.classList.add('is-playing'); drawSnake(); snake.timer=window.setTimeout(snakeTick,130);
}
function snakeFood(){
  let p; do { p={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*10)}; } while(snake.body.some(s=>s.x===p.x&&s.y===p.y)); return p;
}
function snakeTurn(dir){ if (snake.dir.x+dir.x===0 && snake.dir.y+dir.y===0) return; snake.next=dir; }
function snakeTick(){
  if(snake.over || !snake.playing) return;
  snake.dir=snake.next; const head={x:snake.body[0].x+snake.dir.x,y:snake.body[0].y+snake.dir.y};
  const hitWall=head.x<0||head.x>=GRID||head.y<0||head.y>=10; const hitSelf=snake.body.some(s=>s.x===head.x&&s.y===head.y);
  if(hitWall||hitSelf){ snake.over=true; snakeStatus.textContent=`GAME OVER // ${snake.score} // RESET`; drawSnake(); return; }
  snake.body.unshift(head);
  if(head.x===snake.food.x&&head.y===snake.food.y){ snake.score++; snake.food=snakeFood(); } else snake.body.pop();
  drawSnake(); snake.timer=window.setTimeout(snakeTick, Math.max(70,130-snake.score*3));
}
function drawSnake(){
  if(!snakeCanvas)return; const {ctx,w,h}=setupCanvas(snakeCanvas); ctx.fillStyle='#06110d';ctx.fillRect(0,0,w,h);
  const cell=Math.min(w/GRID,(h-25)/10); const ox=(w-cell*GRID)/2, oy=8;
  ctx.strokeStyle='rgba(37,227,154,.12)'; ctx.lineWidth=1;
  for(let x=0;x<=GRID;x++){ctx.beginPath();ctx.moveTo(ox+x*cell,oy);ctx.lineTo(ox+x*cell,oy+cell*10);ctx.stroke();}
  for(let y=0;y<=10;y++){ctx.beginPath();ctx.moveTo(ox,oy+y*cell);ctx.lineTo(ox+GRID*cell,oy+y*cell);ctx.stroke();}
  snake.body.forEach((s,i)=>{ctx.fillStyle=i===0?'#b5ff6c':'#25e39a';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=i===0?12:6;ctx.fillRect(ox+s.x*cell+1,oy+s.y*cell+1,cell-2,cell-2);});ctx.shadowBlur=0;
  ctx.fillStyle='#ff238a';ctx.shadowColor='#ff238a';ctx.shadowBlur=12;ctx.fillRect(ox+snake.food.x*cell+cell*.2,oy+snake.food.y*cell+cell*.2,cell*.6,cell*.6);ctx.shadowBlur=0;
  pixelText(ctx,`SCORE: ${String(snake.score).padStart(4,'0')}`,8,h-9,7,'#76ffc5');
}
window.addEventListener('keydown',(e)=>{
  const k=e.key.toLowerCase(); const map={arrowup:{x:0,y:-1},w:{x:0,y:-1},arrowdown:{x:0,y:1},s:{x:0,y:1},arrowleft:{x:-1,y:0},a:{x:-1,y:0},arrowright:{x:1,y:0},d:{x:1,y:0}};
  if(map[k] && snake.playing){ snakeTurn(map[k]); if(e.target===document.body)e.preventDefault(); }
});
document.querySelectorAll('.touch-controls button').forEach(btn=>btn.addEventListener('click',()=>{
  if (!snake.playing) return;
  const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}; snakeTurn(map[btn.dataset.dir]);
}));

// ------------------------------- Controls ---------------------------------
function setGameControls(game, playing) {
  document.querySelectorAll(`.play-game[data-game=\"${game}\"], .stop-game[data-game=\"${game}\"]`).forEach(btn => {
    btn.hidden = btn.classList.contains('play-game') ? playing : !playing;
  });
}

function stopGame(game) {
  if (game === 'tic') ticReset();
  if (game === 'pong') pongReset();
  if (game === 'snake') snakeReset();
  setGameControls(game, false);
}

document.querySelectorAll('.play-game').forEach(btn=>btn.addEventListener('click',()=>{
  const game = btn.dataset.game;
  if(game==='tic') ticStart();
  if(game==='pong') pongStart();
  if(game==='snake') snakeStart();
  setGameControls(game, true);
}));

document.querySelectorAll('.stop-game').forEach(btn=>btn.addEventListener('click',()=> stopGame(btn.dataset.game)));

document.querySelectorAll('.reset-game').forEach(btn=>btn.addEventListener('click',()=>{
  const game = btn.dataset.game;
  if(game==='tic') ticReset();
  if(game==='pong') pongReset();
  if(game==='snake') snakeReset();
  setGameControls(game, false);
}));

function initGames(){
  ticReset();
  startSiteBgm();
  pongReset();
  snakeReset();
  setGameControls('tic', false);
  setGameControls('pong', false);
  setGameControls('snake', false);
}
window.addEventListener('resize',()=>{ drawTic(); drawPong(); drawSnake(); });
window.addEventListener('load',initGames);
