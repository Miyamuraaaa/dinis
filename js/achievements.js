/* ═══════════════════════════════════════════════════════════
   ACHIEVEMENTS.JS — Achievement system
   ═══════════════════════════════════════════════════════════ */

'use strict';

const Achievements = (() => {
  const ALL = [
    { id: 'first_star',      emoji: '⭐', name: 'First Star',        desc: 'You opened a letter from the heart',     chapter: 1 },
    { id: 'made_a_choice',   emoji: '🦋', name: 'Choices Made',      desc: 'You chose from the heart',               chapter: 1 },
    { id: 'chapter_1_done',  emoji: '💌', name: 'The Beginning',     desc: 'Completed Chapter I',                    chapter: 1 },
    { id: 'memory_match',    emoji: '🌸', name: 'Memory Keeper',     desc: 'Found your first memory pair',           chapter: 2 },
    { id: 'perfect_memory',  emoji: '🎯', name: 'Flawless Memory',   desc: 'Completed the game in ≤ 16 moves',       chapter: 2 },
    { id: 'chapter_2_done',  emoji: '💞', name: 'Little Moments',   desc: 'Completed Chapter II',                   chapter: 2 },
    { id: 'first_memory',    emoji: '📸', name: 'Memory Found',      desc: 'Discovered your first memory star',      chapter: 3 },
    { id: 'all_memories',    emoji: '🌟', name: 'All Memories',      desc: 'Explored all 8 memory stars',            chapter: 3 },
    { id: 'chapter_3_done',  emoji: '🪐', name: 'Our Universe',      desc: 'Completed Chapter III',                  chapter: 3 },
    { id: 'garden_explorer', emoji: '🌱', name: 'Explorer',          desc: 'Found your first garden secret',         chapter: 4 },
    { id: 'garden_complete', emoji: '🌷', name: 'Secret Garden',     desc: 'Discovered all hidden flowers',          chapter: 4 },
    { id: 'chapter_4_done',  emoji: '🍃', name: 'Into the Garden',   desc: 'Completed Chapter IV',                   chapter: 4 },
    { id: 'first_reveal',    emoji: '💖', name: 'First Love',        desc: 'Revealed your first love note',          chapter: 5 },
    { id: 'all_revealed',    emoji: '💝', name: 'Beloved',           desc: 'Revealed all 12 love notes',             chapter: 5 },
    { id: 'chapter_5_done',  emoji: '🫀', name: 'Heart Open',        desc: 'Completed Chapter V',                    chapter: 5 },
    { id: 'final_letter',    emoji: '📜', name: 'The Final Letter',  desc: 'You read the letter written for you',    chapter: 6 },
    { id: 'journey_complete',emoji: '🌌', name: 'Through Our Stars', desc: 'You completed the entire journey',       chapter: 6 },
    { id: 'easter_egg',      emoji: '🥚', name: 'Easter Egg!',       desc: 'You found something hidden…',            chapter: null },
  ];

  let unlocked = new Set();
  let listeners = [];

  function init() {
    const data = Store.get();
    unlocked = new Set(data.achievements || []);
  }

  function unlock(id, opts = {}) {
    if (unlocked.has(id)) return;
    unlocked.add(id);

    Store.update(d => {
      if (!d.achievements.includes(id)) d.achievements.push(id);
    });

    const def = ALL.find(a => a.id === id);
    if (!def) return;

    // Play sound
    AudioEngine.achievement();

    // Show toast
    showToast(def);

    // Notify listeners
    listeners.forEach(fn => fn(def));
  }

  function has(id) { return unlocked.has(id); }
  function count()  { return unlocked.size; }

  function showToast(def) {
    const toast = document.getElementById('achievement-toast');
    const nameEl = document.getElementById('achievement-name');
    if (!toast || !nameEl) return;

    nameEl.textContent = `${def.emoji} ${def.name}`;
    toast.querySelector('.achievement-icon').textContent = def.emoji;
    toast.classList.remove('hidden', 'hide');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.classList.add('hidden'), 400);
    }, 3500);
  }

  function renderPanel() {
    const grid = document.getElementById('achievements-grid');
    const countEl = document.getElementById('achievement-count');
    if (!grid) return;

    grid.innerHTML = '';
    ALL.forEach(a => {
      const isUnlocked = unlocked.has(a.id);
      const item = el('div', { className: `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}` }, [
        el('span', { className: 'ai-emoji' }, [isUnlocked ? a.emoji : '🔒']),
        el('div',  { className: 'ai-name'  }, [a.name]),
        el('div',  { className: 'ai-desc'  }, [isUnlocked ? a.desc : '???']),
      ]);
      grid.appendChild(item);
    });

    if (countEl) countEl.textContent = unlocked.size;

    // Update progress stars on star map
    updateProgressStars();
  }

  function updateProgressStars() {
    const chaptersDone = [1,2,3,4,5,6].filter(i => unlocked.has(`chapter_${i}_done`) || (i === 6 && unlocked.has('journey_complete')));
    chaptersDone.forEach(i => {
      const star = document.getElementById(`pstar-${i}`);
      if (star) {
        star.textContent = '★';
        star.classList.add('filled');
      }
    });

    const countEl = document.getElementById('achievement-count');
    if (countEl) countEl.textContent = unlocked.size;
  }

  function onUnlock(fn) { listeners.push(fn); }

  return { ALL, init, unlock, has, count, renderPanel, updateProgressStars, onUnlock };
})();

window.Achievements = Achievements;
