/* ═══════════════════════════════════════════════════════════
   UTILS.JS — Shared helpers & localStorage wrapper
   ═══════════════════════════════════════════════════════════ */

'use strict';

/** Simple localStorage save/load with JSON */
const Store = {
  KEY: 'through_our_stars_v1',

  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : this._defaults();
    } catch {
      return this._defaults();
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch { /* storage full or private mode */ }
  },

  _defaults() {
    return {
      completedChapters: [],
      achievements: [],
      choices: {},
      gardenFound: [],
      loveRevealed: [],
      memoryViewed: [],
    };
  },

  update(fn) {
    const data = this.get();
    fn(data);
    this.save(data);
    return data;
  },
};

/** Typewriter effect — optimized */
function typewriter(element, text, opts = {}) {
  const {
    speed = 18,
    delay = 0,
    onDone = null,
    cursorChar = '▍',
  } = opts;

  return new Promise(resolve => {
    let i = 0;

    element.textContent = '';

    const textNode = document.createTextNode('');
    
    const cursor = document.createElement('span');
    cursor.textContent = cursorChar;
    cursor.style.cssText =
      'opacity:1;animation:dotBlink 0.7s step-end infinite;color:var(--rose-gold)';

    element.appendChild(textNode);
    element.appendChild(cursor);


    function tick() {
      if (i < text.length) {

        textNode.nodeValue += text[i];
        i++;

        setTimeout(tick, speed);

      } else {

        cursor.remove();

        if (onDone) onDone();

        resolve();
      }
    }

    setTimeout(tick, delay);
  });
}

/** Create element with attributes and content */
function el(tag, attrs = {}, children = []) {
  const elem = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') elem.className = v;
    else if (k === 'html') elem.innerHTML = v;
    else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
    else elem.setAttribute(k, v);
  }
  children.forEach(c => {
    if (typeof c === 'string') elem.append(document.createTextNode(c));
    else if (c) elem.appendChild(c);
  });
  return elem;
}

/** Delay promise */
const wait = ms => new Promise(r => setTimeout(r, ms));

/** Show element (remove hidden class + add animation class) */
function show(elem, animClass = '') {
  if (!elem) return;
  elem.classList.remove('hidden');
  if (animClass) {
    elem.classList.remove(animClass);
    void elem.offsetWidth; // force reflow
    elem.classList.add(animClass);
  }
}

/** Hide element */
function hide(elem) {
  if (elem) elem.classList.add('hidden');
}

/** Clamp number */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Random int [min, max) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

/** Shuffle array in-place (Fisher-Yates) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Map a value from one range to another */
const mapRange = (v, a1, b1, a2, b2) => a2 + ((v - a1) / (b1 - a1)) * (b2 - a2);

/** Particle explosion helper — creates DOM hearts/stars at a position */
function burst(x, y, opts = {}) {
  const { count = 8, emojis = ['✨','💫','⭐','🌟','💖'], container = document.body } = opts;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.textContent = emojis[randInt(0, emojis.length)];
    p.style.cssText = `
      position:fixed;
      left:${x}px; top:${y}px;
      font-size:${randInt(14,28)}px;
      pointer-events:none;
      z-index:9999;
      will-change:transform,opacity;
    `;
    container.appendChild(p);

    const angle = (i / count) * Math.PI * 2;
    const dist  = randInt(40, 100);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    p.animate([
      { transform: `translate(0,0) scale(1)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 },
    ], {
      duration: randInt(600, 1000),
      easing: 'ease-out',
      fill: 'forwards',
    }).onfinish = () => p.remove();
  }
}

/** Create confetti rain */
function confettiRain(count = 60) {
  const colors = ['#c2876a','#f4a5b5','#c5b3e8','#f9e785','#90d4a8','#fce4ec'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = randInt(6, 14);
    p.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: -20px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[randInt(0, colors.length)]};
      animation-duration: ${randInt(2000, 4000)}ms;
      animation-delay: ${randInt(0, 2000)}ms;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 6000);
  }
}

window.Store       = Store;
window.typewriter  = typewriter;
window.el          = el;
window.wait        = wait;
window.show        = show;
window.hide        = hide;
window.clamp       = clamp;
window.randInt     = randInt;
window.shuffle     = shuffle;
window.lerp        = lerp;
window.mapRange    = mapRange;
window.burst       = burst;
window.confettiRain = confettiRain;
