
const CONFIG = {
  friendName: "Bestie",
  message: 
  "I hope you have the best birthday ever! I couldnt be there to get you a real cake, but I hope this one makes you smile. Its been my pleasure to be your friend, watching you grow and learn and become the amazing person you are. I hope this year is full of love, laughter, and all the things that make you happy. Happy birthday! (˶>⩊<˶)",
  blowThreshold: 0.28, // lower = more sensitive mic. try 0.10–0.22
  blowHoldMs: 250 // how long you need to sustain the "blow" volume
};

document.getElementById('cover-name').textContent = CONFIG.friendName;
document.getElementById('msg-body').textContent = CONFIG.message;

const coverScreen = document.getElementById('cover-screen');
const cakeScreen = document.getElementById('cake-screen');
const messageScreen = document.getElementById('message-screen');

const openBtn = document.getElementById('open-btn');
const gift = document.getElementById('gift');
const micBtn = document.getElementById('mic-btn');
const fallbackBtn = document.getElementById('fallback-btn');
const statusLine = document.getElementById('status-line');
const meterFill = document.getElementById('meter-fill');
const candles = [...document.querySelectorAll('.candle')];
const replayBtn = document.getElementById('replay-btn');
const cakeInstruction = document.getElementById('cake-instruction');

function showScreen(el){
  const audio = new Audio('minecraft-click-noises.mp3');
  audio.play();
  [coverScreen, cakeScreen, messageScreen].forEach(s => s.classList.add('hidden'));
  el.classList.remove('hidden');
}

function openCake(){
  showScreen(cakeScreen);
}
openBtn.addEventListener('click', openCake);
gift.addEventListener('click', openCake);

let audioCtx, analyser, dataArray, rafId;
let loudFrames = 0;
let alreadyBlownOut = false;

async function startListening(){
  if(alreadyBlownOut) return;
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.fftSize);

    micBtn.classList.add('listening');
    statusLine.textContent = "listening... blow gently into your mic";
    loudFrames = 0;
    tick();
  }catch(err){
    statusLine.textContent = "couldn't access the mic — use the hold button below instead";
  }
}

function tick(){
  if(alreadyBlownOut) return;
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for(let i=0;i<dataArray.length;i++){
    const v = (dataArray[i]-128)/128;
    sum += v*v;
  }
  const rms = Math.sqrt(sum/dataArray.length);
  meterFill.style.width = Math.min(100, rms*260) + "%";

  if(rms > CONFIG.blowThreshold){
    loudFrames++;
  } else {
    loudFrames = Math.max(0, loudFrames-1);
  }

  const framesNeeded = CONFIG.blowHoldMs / 16.6;
  if(loudFrames >= framesNeeded){
    blowOutCandles();
    return;
  }
  rafId = requestAnimationFrame(tick);
}

micBtn.addEventListener('click', startListening);

/* fallback: press and hold */
let holdTimer;
function holdStart(){
  const audio = new Audio('minecraft-click-noises.mp3');
  audio.play();
  if(alreadyBlownOut) return;
  statusLine.textContent = "keep holding...";
  holdTimer = setTimeout(blowOutCandles, 700);
}
function holdEnd(){
  clearTimeout(holdTimer);
  if(!alreadyBlownOut) statusLine.textContent = "tap the mic and blow";
}
fallbackBtn.addEventListener('mousedown', holdStart);
fallbackBtn.addEventListener('touchstart', holdStart);
fallbackBtn.addEventListener('mouseup', holdEnd);
fallbackBtn.addEventListener('mouseleave', holdEnd);
fallbackBtn.addEventListener('touchend', holdEnd);

function blowOutCandles(){
  if(alreadyBlownOut) return;
  alreadyBlownOut = true;
  cancelAnimationFrame(rafId);
  if(audioCtx) audioCtx.close();
  micBtn.classList.remove('listening');
  statusLine.textContent = "";
  cakeInstruction.textContent = "NICE BLOW!";

  candles.forEach((c, i) => {
    setTimeout(() => c.classList.add('out'), i*120);
  });

  setTimeout(() => {
    showScreen(messageScreen);
    launchConfetti();
  }, 1600);
}

function launchConfetti(){
  //add mp3 file with confetti sound effect
  const audio = new Audio('levelup.mp3');
  audio.play();
  const colors = ['#F2A8C4','#D9C6EC','#F8CE4E','#AFC79B','#8A5D3B'];
  for(let i=0;i<70;i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random()*100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.animationDuration = (2.5 + Math.random()*2) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}

replayBtn.addEventListener('click', () => {
  alreadyBlownOut = false;
  loudFrames = 0;
  candles.forEach(c => c.classList.remove('out'));
  cakeInstruction.textContent = "MAKE A WISH";
  statusLine.textContent = "tap the mic and blow";
  meterFill.style.width = '0%';
  showScreen(cakeScreen);
});