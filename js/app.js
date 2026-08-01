/* ═══════════════════════════════════════════════════════════
   APP.JS — Main orchestrator: screens, navigation, preloader
   ═══════════════════════════════════════════════════════════ */

'use strict';

const App = (() => {
  let currentScreen = 'intro';
  let activeChapter = null;
  let starFieldAnim = null;
  let starmapAnim   = null;

  /* ─── Screen registry ─── */
  const SCREENS = {
    intro:     document.getElementById('screen-intro'),
    starmap:   document.getElementById('screen-starmap'),
    'chapter-1': document.getElementById('screen-chapter-1'),
    'chapter-2': document.getElementById('screen-chapter-2'),
    'chapter-3': document.getElementById('screen-chapter-3'),
    'chapter-4': document.getElementById('screen-chapter-4'),
    'chapter-5': document.getElementById('screen-chapter-5'),
    'chapter-6': document.getElementById('screen-chapter-6'),
  };

  const CHAPTER_MODULES = {
    1: Chapter1, 2: Chapter2, 3: Chapter3,
    4: Chapter4, 5: Chapter5, 6: Chapter6,
  };

  /* ─── Preloader ─── */
  async function preload() {
    const bar = document.getElementById('preloader-bar');
    const preloaderCanvas = document.getElementById('preloader-canvas');

    // Start star animation on preloader
    if (preloaderCanvas) {
      const anim = StarCanvas.createPreloaderStars(preloaderCanvas);
      anim.start();
    }

    // Simulate loading progress
    let progress = 0;
    const steps = [
      { label: 'Gathering stardust', value: 20, delay: 300 },
      { label: 'Polishing constellations', value: 45, delay: 400 },
      { label: 'Wrapping love letters', value: 65, delay: 500 },
      { label: 'Planting secret flowers', value: 80, delay: 300 },
      { label: 'Almost ready', value: 95, delay: 400 },
      { label: 'Ready', value: 100, delay: 200 },
    ];

    for (const step of steps) {
      await wait(step.delay);
      progress = step.value;
      if (bar) bar.style.width = `${progress}%`;
    }

    await wait(400);

    // Fade out preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      await wait(900);
      preloader.style.display = 'none';
    }

    // Init app
    init();
  }

  /* ─── Init ─── */
  function init() {
    Achievements.init();
    AudioEngine.init();
    setupAudioControls();
    setupAchievementsPanel();
    setupIntroScreen();
    setupStarMap();
    setupNodeListeners();
    checkProgress();
  }

  /* ─── Audio ─── */
  function setupAudioControls() {
    const controls = document.getElementById('audio-controls');
    const btn = document.getElementById('audio-toggle-btn');
    if (controls) show(controls);

    btn?.addEventListener('click', () => {
      const muted = AudioEngine.toggleMute();
      btn.classList.toggle('muted', muted);
      btn.querySelector('.audio-icon').textContent = muted ? '✕' : '♪';
      btn.title = muted ? 'Unmute Music' : 'Mute Music';
    });
  }

  /* ─── Achievements Panel ─── */
  function setupAchievementsPanel() {
    const panel    = document.getElementById('achievements-panel');
    const overlay  = document.getElementById('achievements-overlay');
    const showBtn  = document.getElementById('show-achievements-btn');
    const closeBtn = document.getElementById('close-achievements');

    showBtn?.addEventListener('click', showAchievements);
    closeBtn?.addEventListener('click', hideAchievements);
    overlay?.addEventListener('click', hideAchievements);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideAchievements();
    });
  }

  function showAchievements() {
    const panel   = document.getElementById('achievements-panel');
    const overlay = document.getElementById('achievements-overlay');
    Achievements.renderPanel();
    show(overlay);
    show(panel);
    requestAnimationFrame(() => panel?.classList.add('show'));
  }

  function hideAchievements() {
    const panel   = document.getElementById('achievements-panel');
    const overlay = document.getElementById('achievements-overlay');
    panel?.classList.remove('show');
    setTimeout(() => {
      hide(panel);
      hide(overlay);
    }, 300);
  }

  /* ─── Intro Screen ─── */
  function setupIntroScreen() {
    // Start star background
    const starCanvas = document.getElementById('star-canvas');
    if (starCanvas) {
      starFieldAnim = StarCanvas.createStarField(starCanvas, { count: 250, speed: 0.2 });
      starFieldAnim.start();
    }

    const envelope = document.getElementById('intro-envelope');
    const beginBtn = document.getElementById('begin-journey-btn');
    const typeEl   = document.getElementById('typewriter-text');
    const sig      = document.getElementById('letter-signature');

    // Click envelope to open
    envelope?.addEventListener('click', async () => {
      if (envelope.classList.contains('open')) return;
      AudioEngine.init();
      AudioEngine.startAmbient('space');
      AudioEngine.chime();

      envelope.classList.add('open');

      await wait(900); // wait for envelope open animation

      // Type the letter
      const TEXT = "I made something for you. Not because I had to — because you deserve something that took time and love to make. Take your time. Explore everything. And know that every word here was written with you in mind.";

      if (typeEl) {
        await typewriter(typeEl, TEXT, { speed: 40, delay: 200 });
      }

      if (sig) show(sig, 'anim-fade-in');
      if (beginBtn) {
        await wait(600);
        show(beginBtn);
        beginBtn.animate([
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 600, fill: 'forwards', easing: 'ease' });
      }
    });

    // Begin journey button
    beginBtn?.addEventListener('click', e => {
      AudioEngine.sparkle(e.clientX);
      burst(e.clientX, e.clientY, { count: 10, emojis: ['⭐','💫','✨','🌟'] });
      goToScreen('starmap');
    });
  }

  /* ─── Star Map Screen ─── */
  function setupStarMap() {
    const smCanvas = document.getElementById('starmap-canvas');
    if (smCanvas) {
      starmapAnim = StarCanvas.createStarField(smCanvas, { count: 300, speed: 0.15, shooting: true });
    }
  }

  /* ─── Chapter Node Listeners ─── */
  function setupNodeListeners() {
    for (let i = 1; i <= 6; i++) {
      const node = document.getElementById(`node-${i}`);
      node?.addEventListener('click', () => handleNodeClick(i));
      node?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') handleNodeClick(i);
      });
    }
  }

  function handleNodeClick(chapterNum) {
    const node = document.getElementById(`node-${chapterNum}`);
    const data = Store.get();
    const unlocked = isChapterUnlocked(chapterNum, data);

    if (!unlocked) {
      AudioEngine.locked();
      node?.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(0)' },
      ], { duration: 300, easing: 'ease' });

      // Show hint tooltip
      const status = document.getElementById(`status-${chapterNum}`);
      if (status) {
        const prev = chapterNum - 1;
        const origText = status.textContent;
        status.textContent = `Complete Chapter ${prev === 6 ? '∞' : toRoman(prev)} first`;
        status.style.color = '#f9e785';
        setTimeout(() => {
          status.textContent = origText;
          status.style.color = '';
        }, 2000);
      }
      return;
    }

    AudioEngine.sparkle();
    goToChapter(chapterNum);
  }

  function isChapterUnlocked(n, data) {
    if (n === 1) return true;
    const prev = n - 1;
    return data.completedChapters.includes(prev);
  }

  function toRoman(n) {
    const map = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'∞' };
    return map[n] || n;
  }

  /* ─── Check & Apply Progress ─── */
  function checkProgress() {
    const data = Store.get();

    data.completedChapters.forEach(n => {
      markChapterComplete(n);
    });

    Achievements.updateProgressStars();
    Achievements.renderPanel();
  }

  function markChapterComplete(n) {
    const node = document.getElementById(`node-${n}`);
    const status = document.getElementById(`status-${n}`);
    const star = node?.querySelector('.node-star');

    if (node) node.classList.remove('locked');
    if (star) {
      star.classList.remove('active');
      star.classList.add('completed');
    }
    if (status) status.textContent = '✓ Completed';

    // Unlock next node
    if (n < 6) {
      const nextNode = document.getElementById(`node-${n + 1}`);
      const nextStatus = document.getElementById(`status-${n + 1}`);
      const nextStar = nextNode?.querySelector('.node-star');
      if (nextNode) nextNode.classList.remove('locked');
      if (nextStar) nextStar.classList.add('active');
      if (nextStatus && nextStatus.textContent.includes('🔒')) {
        nextStatus.textContent = 'Explore →';
      }
      // Animate the map line
      const line = document.getElementById(`line-${n}-${n+1}`);
      if (line) line.classList.add('lit');
    }
  }

  /* ─── Screen Navigation ─── */
  function goToScreen(screenId) {
    const from = SCREENS[currentScreen];
    const to   = SCREENS[screenId];
    if (!to || currentScreen === screenId) return;

    // Special: start starmap canvas when entering
    if (screenId === 'starmap' && starmapAnim) {
      starmapAnim.start();
    }

    // Stop starfield if leaving intro
    if (currentScreen === 'intro' && starFieldAnim) {
      // Keep it for atmosphere, don't stop
    }

    // Transition out
    if (from) {
      from.classList.add('exiting');
      setTimeout(() => {
        from.classList.remove('active', 'exiting');
        from.classList.add('hidden');
      }, 500);
    }

    // Transition in
    setTimeout(() => {
      to.classList.remove('hidden');
      to.classList.add('active', 'entering');
      setTimeout(() => to.classList.remove('entering'), 600);
    }, 250);

    currentScreen = screenId;
  }

  function goToChapter(n) {
    // Destroy previous chapter module
    if (activeChapter && CHAPTER_MODULES[activeChapter]) {
      CHAPTER_MODULES[activeChapter].destroy?.();
    }

    // Stop starmap canvas
    starmapAnim?.stop?.();

    activeChapter = n;
    const screenId = `chapter-${n}`;
    goToScreen(screenId);

    // Init chapter after transition
    setTimeout(() => {
      CHAPTER_MODULES[n]?.init?.();
    }, 400);

    // Setup back button
    const backBtns = document.querySelectorAll(`#screen-${screenId} .back-to-map`);
    backBtns.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => returnToMap(null));
    });
  }

  function returnToMap(completedChapter = null) {
    // Mark completion visually
    if (completedChapter) {
      markChapterComplete(completedChapter);
      Achievements.updateProgressStars();
      Achievements.renderPanel();
    }

    // Destroy active chapter
    if (activeChapter && CHAPTER_MODULES[activeChapter]) {
      CHAPTER_MODULES[activeChapter].destroy?.();
      activeChapter = null;
    }

    goToScreen('starmap');

    // Restart starmap canvas
    setTimeout(() => starmapAnim?.start(), 300);
  }

  // ─── Easter egg: Konami code ───
  function setupKonamiCode() {
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let seq = [];
    document.addEventListener('keydown', e => {
      seq.push(e.key);
      if (seq.length > KONAMI.length) seq.shift();
      if (seq.join(',') === KONAMI.join(',')) {
        Achievements.unlock('easter_egg');
        confettiRain(100);
        AudioEngine.celebration();
        seq = [];
      }
    });
  }

  return {
    preload,
    init,
    goToScreen,
    goToChapter,
    returnToMap,
    showAchievements,
    hideAchievements,
    markChapterComplete,
    setupKonamiCode,
  };
})();

/* ─── Bootstrap ─── */
function startApp() {
  App.preload();
  App.setupKonamiCode?.();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

