'use strict';

const $ = selector => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const cover = $('#cover');
const pages = $('#pages');
let opening = false;

function scatter(x, y, kiss = false) {
  if (reduced.matches) return;
  const count = kiss ? 61 : 46;
  const radius = Math.min(145, window.innerWidth * .29);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dot = document.createElement('span');
    const heartOutline = kiss && i < 51;
    const t = 2 * Math.PI * i / 51;
    const distance = 45 + Math.random() * radius;
    const dx = heartOutline ? radius * Math.sin(t) ** 3 : Math.cos(angle) * distance;
    const dy = heartOutline
      ? -radius * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 16 - 36
      : Math.sin(angle) * distance - (kiss ? 60 : 15);
    dot.className = 'particle';
    dot.textContent = heartOutline ? '✦' : (kiss ? ['♡','💋','♥'][i % 3] : ['✦','·','♡'][i % 3]);
    dot.setAttribute('aria-hidden', 'true');
    Object.assign(dot.style,{left:x+'px',top:y+'px'});
    dot.style.setProperty('--x',dx+'px');
    dot.style.setProperty('--y',dy+'px');
    dot.style.setProperty('--rot',(Math.random()*35-17)+'deg');
    dot.style.setProperty('--size',(heartOutline ? 10 : 9+Math.random()*12)+'px');
    dot.style.setProperty('--duration',(heartOutline ? 1.85 : 1.2+Math.random()*.8)+'s');
    document.body.append(dot);
    dot.addEventListener('animationend',()=>dot.remove(),{once:true});
  }
}

for (let i=0;i<10;i++) {
  const mote=document.createElement('span');
  mote.className='speck';
  mote.textContent=i%4===0?'♡':'✦';
  Object.assign(mote.style,{left:(7+(i*31)%86)+'%',top:(10+(i*17)%68)+'%',animationDelay:(i*-.6)+'s'});
  $('.art-specks').append(mote);
}

const sections = [...document.querySelectorAll('nav a')];
function sectionFromHash() {
  return sections.some(link=>link.hash===location.hash) ? location.hash : '#letter';
}
function goToSection(hash, smooth = true) {
  const target = $(hash);
  target.querySelector('h2').focus({preventScroll:true});
  target.scrollIntoView({behavior:smooth && !reduced.matches ? 'smooth':'instant',block:'start'});
}
function showPages(hash) {
  cover.hidden = true;
  pages.hidden = false;
  cover.inert = false;
  document.body.classList.remove('opening');
  document.body.classList.add('reading');
  $('.skip').href = '#letter';
  opening = false;
  goToSection(hash,false);
}
function openLetter(hash) {
  if (opening) return;
  if (!pages.hidden) {goToSection(hash);return;}
  opening = true;
  cover.inert = true;
  document.body.classList.add('opening');
  if (!reduced.matches) {
    const rect = $('.seal').getBoundingClientRect();
    setTimeout(()=>scatter(rect.x+rect.width/2,rect.y+rect.height/2),420);
  }
  setTimeout(()=>showPages(hash),reduced.matches ? 0 : 3800);
}
$('#open').addEventListener('click',()=>openLetter('#letter'));
sections.forEach(link=>link.addEventListener('click',event=>{
  if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
  event.preventDefault();
  if (opening) return;
  history.replaceState(null,'', link.hash);
  openLetter(link.hash);
}));
if (location.hash && sections.some(link=>link.hash===location.hash)) showPages(sectionFromHash());
window.addEventListener('hashchange',()=>{if(!opening && sections.some(link=>link.hash===location.hash)) openLetter(sectionFromHash());});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if (!entry.isIntersecting) return;
    if (!reduced.matches) entry.target.classList.add('ink-reveal');
    observer.unobserve(entry.target);
  }),{threshold:.12});
  document.querySelectorAll('.paper p,.notes-section .section-head,.note,.blessing blockquote,.finale h2').forEach(item=>observer.observe(item));
  const navObserver = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){
      sections.forEach(link=>{
        if(link.hash==='#'+entry.target.id) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    }
  }),{rootMargin:'-12% 0px -50% 0px'});
  document.querySelectorAll('#pages>section').forEach(item=>navObserver.observe(item));
}

let queuedScroll=false;
window.addEventListener('scroll',()=>{
  if(reduced.matches || queuedScroll)return;
  queuedScroll=true;
  requestAnimationFrame(()=>{
    if(!cover.hidden)$('.art-inner').style.setProperty('--parallax',Math.min(window.scrollY*.08,12)+'px');
    else if(window.scrollY<900)$('#letter').style.setProperty('--sun-shift',Math.min(34,window.scrollY*.06)+'px');
    queuedScroll=false;
  });
},{passive:true});

const surprise=$('#surprise');
surprise.addEventListener('click',()=>{
  const message=$('#surprise-message');
  message.hidden=!message.hidden;
  surprise.setAttribute('aria-expanded',String(!message.hidden));
  surprise.querySelector('span').textContent=message.hidden?'Show me a little surprise ♡':'Close the surprise ♡';
});
$('#kiss').addEventListener('click',event=>{
  const box=event.currentTarget.getBoundingClientRect();
  scatter(box.left+box.width/2,box.top+box.height/2,true);
  $('#kiss-message').hidden=false;
  $('#kiss-message').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});
});

let lastGlint=0;
document.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||reduced.matches||!event.target.closest('button,summary,.art')||event.timeStamp-lastGlint<85)return;
  lastGlint=event.timeStamp;
  const glint=document.createElement('i');
  glint.className='cursor-glint';
  Object.assign(glint.style,{left:event.clientX+8+'px',top:event.clientY+9+'px'});
  document.body.append(glint);
  glint.addEventListener('animationend',()=>glint.remove(),{once:true});
});

// Keep the same native audio output when Julie opens the envelope.
const audio = $('#audio');
const player = $('#player-toggle');
const songLink = $('#cover-song');
const volume = $('#volume');
const status = $('#audio-status');
let fadeTimer;
let requestId = 0;
let intentToPlay = false;
let hasStarted = false;

function selectedVolume() {
  return Number(volume.value) / 100;
}

function syncPlayer(playing) {
  document.body.classList.toggle('playing', playing);
  for (const button of [player, songLink]) {
    button.setAttribute('aria-pressed', String(playing));
  }
  player.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' A Little Song for You');
  player.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
  songLink.querySelector('span').textContent = playing ? 'Pause our song ♡' : 'Play our song ♡';
}

function fadeVolume(target, duration, finished) {
  clearTimeout(fadeTimer);
  const from = audio.volume;
  const start = performance.now();
  function tick() {
    const elapsed = Math.min(1, (performance.now() - start) / duration);
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * elapsed));
    if (elapsed < 1) fadeTimer = setTimeout(tick, 25);
    else if (finished) finished();
  }
  tick();
}

function reportFailure(error) {
  intentToPlay = false;
  hasStarted = false;
  clearTimeout(fadeTimer);
  syncPlayer(false);
  const blocked = error?.name === 'NotAllowedError';
  status.textContent = blocked
    ? 'Tap Play again to allow sound in this browser.'
    : 'The song could not play. Open assets/music.mp3 from the address bar to check the file.';
}

function toggleMusic() {
  const id = ++requestId;
  clearTimeout(fadeTimer);
  status.textContent = '';
  if (intentToPlay) {
    intentToPlay = false;
    if (hasStarted && !audio.paused) fadeVolume(0, 300, () => audio.pause());
    else audio.pause();
    return;
  }

  intentToPlay = true;
  if (audio.error) audio.load();
  // Start audibly even if the browser delays timers during the opening animation.
  if (audio.paused) audio.volume = selectedVolume() * 0.4;
  audio.play().then(() => {
    if (id !== requestId || !intentToPlay) return;
    fadeVolume(selectedVolume(), 450);
  }).catch(error => {
    if (id === requestId) reportFailure(error);
  });
}

audio.addEventListener('playing', () => {
  if (!intentToPlay || audio.paused) return;
  hasStarted = true;
  syncPlayer(true);
  status.textContent = selectedVolume() === 0 ? 'Song volume is zero. Move the volume slider to hear it.' : '';
});
audio.addEventListener('pause', () => {
  if (!audio.paused) return;
  clearTimeout(fadeTimer);
  intentToPlay = false;
  hasStarted = false;
  syncPlayer(false);
});
audio.addEventListener('error', () => {
  if (intentToPlay) reportFailure(audio.error);
});
player.addEventListener('click', toggleMusic);
songLink.addEventListener('click', toggleMusic);
volume.addEventListener('input', () => {
  if (!intentToPlay) return;
  clearTimeout(fadeTimer);
  audio.volume = selectedVolume();
  status.textContent = audio.volume === 0 ? 'Song volume is zero. Move the volume slider to hear it.' : '';
});
