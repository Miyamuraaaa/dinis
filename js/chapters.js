/* ═══════════════════════════════════════════════════════════
   CHAPTERS.JS — All chapter logic and content
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────
   CHAPTER 1: The Moment We Met
   ────────────────────────────────────────────── */
const Chapter1 = (() => {
  let bgAnim = null;
  let currentChoice = null;

  const INTRO_TEXT = "I'm not good with words in the moment — I get quiet when I feel the most. But I remember when things started to shift. It wasn't loud. It wasn't dramatic. It was just yk, you. And suddenly, the ordinary days didn't feel so ordinary anymore. There was a warmth I couldn't explain — like I'd been waiting for you without even knowing it.";

  const CHOICE_RESPONSES = {
    a: {
      art: "😊✨",
      text: "Your smile — I noticed it. It's the kind that reaches your eyes. I still catch myself hoping to see it, even on your hardest days.",
    },
    b: {
      art: "🦋💫",
      text: "Nervous but happy — that's exactly what you do to me. Every time. There's something about you that makes my heart skip.",
    },
    c: {
      art: "🌟💭",
      text: "That secret hope — it was you. And here we are.",
    },
  };

  function init() {
    const canvas = document.getElementById("c1-canvas");
    if (canvas) {
      bgAnim = StarCanvas.createChapterBg(canvas, "#e8b89d");
      bgAnim.start();
    }

    // Start typewriter on page 1
    const storyEl = document.getElementById("c1-story-1");
    if (storyEl) {
      typewriter(storyEl, INTRO_TEXT, { speed: 18, delay: 50, onDone: () => {
        const btn = document.getElementById("c1-next-1");
        if (btn) show(btn, "anim-fade-in-up");
        Achievements.unlock("first_star");
      }});
    }

    // Page 1 → 2
    document.getElementById("c1-next-1")?.addEventListener("click", () => {
      AudioEngine.chime();
      goToPage("c1-page-1", "c1-page-2");
    });

    // Choices
    ["c1-choice-1","c1-choice-2","c1-choice-3"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", e => {
        const choice = e.currentTarget.dataset.choice;
        currentChoice = choice;
        AudioEngine.sparkle(e.clientX);
        burst(e.clientX, e.clientY, { emojis: ["💕","✨","💫","⭐"] });

        Store.update(d => { d.choices.c1 = choice; });
        Achievements.unlock("made_a_choice");
        applyChoice(choice);

        goToPage("c1-page-2", "c1-page-3");
      });
    });

    // Page 3 → 4
    document.getElementById("c1-next-3")?.addEventListener("click", () => {
      AudioEngine.chime();
      goToPage("c1-page-3", "c1-page-4");

      // Heartbeat after letter appears
      setTimeout(() => AudioEngine.heartbeat(), 800);
    });

    // Complete chapter 1
    document.getElementById("c1-complete")?.addEventListener("click", e => {
      AudioEngine.achievement();
      burst(e.clientX, e.clientY, { count: 12, emojis: ["⭐","💫","✨","🌟","💖"] });
      Achievements.unlock("chapter_1_done");

      Store.update(d => {
        if (!d.completedChapters.includes(1)) d.completedChapters.push(1);
      });

      setTimeout(() => App.returnToMap(1), 800);
    });

    // Restore previous choice
    const saved = Store.get().choices.c1;
    if (saved) {
      currentChoice = saved;
    }
  }

  function applyChoice(choice) {
    const data = CHOICE_RESPONSES[choice];
    if (!data) return;
    const artEl = document.getElementById("choice-response-art");
    const textEl = document.getElementById("c1-choice-response");
    if (artEl) artEl.textContent = data.art;
    if (textEl) typewriter(textEl, data.text, { speed: 18, onDone: () => {
      const btn = document.getElementById("c1-next-3");
      if (btn) show(btn, "anim-fade-in-up");
    }});
  }

  function goToPage(fromId, toId) {
    const from = document.getElementById(fromId);
    const to   = document.getElementById(toId);
    if (!from || !to) return;

    from.classList.remove("active");
    from.style.display = "none";
    to.style.display = "flex";
    to.classList.add("active");

    void to.offsetWidth;
    to.style.animation = "fadeInUp 0.5s ease";
  }

  function destroy() {
    bgAnim?.stop();
  }

  return { init, destroy };
})();

/* ──────────────────────────────────────────────
   CHAPTER 2: The Little Things (Memory Game)
   ────────────────────────────────────────────── */
const Chapter2 = (() => {
  let bgAnim = null;
  let flipped = [], matched = new Set(), moves = 0, pairs = 0;
  let isLocked = false;

  const CARDS = [
    { id: "a", emoji: "☕", label: "Morning coffee" },
    { id: "b", emoji: "🌙", label: "Late night talks" },
    { id: "c", emoji: "🎵", label: "Our song" },
    { id: "d", emoji: "🌸", label: "Cherry blossoms" },
    { id: "e", emoji: "📚", label: "Reading together" },
    { id: "f", emoji: "🌟", label: "Stargazing" },
    { id: "g", emoji: "🍜", label: "Our favourite meal" },
    { id: "h", emoji: "🤝", label: "Hand in hand" },
  ];

  const MESSAGES = {
    a: "The way you look at me. Sometimes you don't even realize you're doing it, but in those moments, I feel like the luckiest person alive.",
    b: "The conversations that go on too long — and still don't feel long enough.",
    c: "That song that accidentally became ours. Now it plays and I think of you. Always.",
    d: "You remind me of spring. Soft, beautiful, and full of promise.",
    e: "Comfortable silence with you is my favourite place. Just knowing you're there — that's enough.",
    f: "Even with miles between us, looking at the same night sky somehow makes me feel a little closer to you. Until one day, we'll look at it side by side.",
    g: "Food tastes better when you're across the table. Even when it's simple. Even when it's messy.",
    h: "Your hand in mine. It says 'I'm here' without a single word.",
  };

  function init() {
    const canvas = document.getElementById("c2-canvas");
    if (canvas) {
      bgAnim = StarCanvas.createChapterBg(canvas, "#f4a5b5");
      bgAnim.start();
    }

    document.getElementById("c2-start")?.addEventListener("click", () => {
      AudioEngine.chime();
      hide(document.getElementById("c2-intro"));
      const game = document.getElementById("memory-game");
      show(game);
      buildGrid();
    });

    document.getElementById("c2-complete")?.addEventListener("click", e => {
      AudioEngine.achievement();
      burst(e.clientX, e.clientY, { count: 12, emojis: ["🌸","💕","✨","⭐"] });
      Achievements.unlock("chapter_2_done");
      Store.update(d => {
        if (!d.completedChapters.includes(2)) d.completedChapters.push(2);
      });
      setTimeout(() => App.returnToMap(2), 800);
    });
  }

  function buildGrid() {
    flipped = []; matched = new Set(); moves = 0; pairs = 0;
    isLocked = false;

    const doubled = shuffle([...CARDS, ...CARDS].map((c, i) => ({ ...c, uid: `${c.id}-${i}` })));
    const grid = document.getElementById("memory-grid");
    if (!grid) return;
    grid.innerHTML = "";

    doubled.forEach(card => {
      const wrapper = el("div", { className: "memory-card-wrapper", role: "gridcell", tabindex: "0", "aria-label": "Memory card" });
      const flip = el("div", { className: "memory-card-flip" });
      const front = el("div", { className: "card-face card-front" }, ["★"]);
      const back  = el("div", { className: "card-face card-back", html: card.emoji }, []);
      back.dataset.cardId  = card.id;
      back.dataset.cardUid = card.uid;

      flip.appendChild(front);
      flip.appendChild(back);
      wrapper.appendChild(flip);
      grid.appendChild(wrapper);

      const handleFlip = () => {
        if (isLocked || flipped.length >= 2) return;
        if (matched.has(card.uid)) return;
        if (flipped.find(f => f.uid === card.uid)) return;

        AudioEngine.sparkle(wrapper.getBoundingClientRect().left);
        flip.classList.add("flipped");
        flipped.push({ uid: card.uid, id: card.id, el: flip });

        if (flipped.length === 2) checkMatch();
      };

      wrapper.addEventListener("click", handleFlip);
      wrapper.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") handleFlip(); });
    });
  }

  function checkMatch() {
    moves++;
    document.getElementById("moves-count").textContent = moves;
    isLocked = true;

    const [a, b] = flipped;

    if (a.id === b.id) {
      // Match!
      AudioEngine.match();
      matched.add(a.uid);
      matched.add(b.uid);

      [a.el, b.el].forEach(flip => {
        const back = flip.querySelector(".card-back");
        if (back) back.classList.add("matched-style");
        flip.classList.add("matched");
      });

      pairs++;
      document.getElementById("pairs-found").textContent = `${pairs}/8`;
      flipped = [];
      isLocked = false;

      if (pairs === 1) Achievements.unlock("memory_match");

      if (pairs === 8) {
        if (moves <= 16) Achievements.unlock("perfect_memory");

        // Show message for last matched card
        const msg = MESSAGES[a.id];
        setTimeout(() => {
          const completeEl = document.getElementById("game-complete");
          const msgEl = document.getElementById("complete-message-text");
          if (completeEl && msgEl) {
            msgEl.textContent = msg;
            show(completeEl, "anim-fade-in-up");
            AudioEngine.celebration();
            confettiRain(50);
          }
        }, 500);
      }
    } else {
      // No match
      setTimeout(() => {
        a.el.classList.remove("flipped");
        b.el.classList.remove("flipped");
        flipped = [];
        isLocked = false;
      }, 1000);
    }
  }

  function destroy() { bgAnim?.stop(); }

  return { init, destroy };
})();

/* ──────────────────────────────────────────────
   CHAPTER 3: Our Memories (Star Gallery)
   ────────────────────────────────────────────── */
const Chapter3 = (() => {
  let bgAnim = null;
  let viewedCount = 0;

  const MEMORIES = [
    { emoji: "🎬", title: "The Cinema", text: "Sitting beside you in that theater, I remember wishing the movie would never end — not because of what was on the screen, but because it meant I got to be next to you. If I could stop time anywhere, it'd be there." },
    { emoji: "🎉", title: "Your Laugh",  text: "The laugh you do when something catches you off guard." },
    { emoji: "🌧️", title: "Rainy Days",  text: "Whenever it rains, I wonder what you're doing. I hope you're warm, safe, and smiling. One day, we'll listen to the rain together instead of from different places." },
    { emoji: "📱", title: "The Messages", text: "Every chika and random moments." },
    { emoji: "🍕", title: "Late Night Cravings", text: "Even when we're eating miles apart, I still catch myself wishing you were sitting across from me. One day, every late-night meal will be together." },
    { emoji: "🤗", title: "Your Hugs",   text: "The kind of hug where I don't want to let go. Where the world goes quiet and everything feels exactly right." },
    { emoji: "✈️", title: "Amsterdam",  text: "The dream we painted together — windmills, canals, freedom. We haven't made it yet. But we will. And it'll be everything." },
    { emoji: "💤", title: "Sleepy You",  text: "You, wala lang, love lang kita" },
  ];

  const POSITIONS = [
    { top: "15%", left: "20%" }, { top: "10%", left: "55%" },
    { top: "30%", left: "80%" }, { top: "55%", left: "65%" },
    { top: "70%", left: "40%" }, { top: "60%", left: "10%" },
    { top: "80%", left: "75%" }, { top: "85%", left: "25%" },
  ];

  function init() {
    const canvas = document.getElementById("c3-canvas");
    if (canvas) {
      bgAnim = StarCanvas.createChapterBg(canvas, "#c5b3e8");
      bgAnim.start();
    }

    document.getElementById("c3-start")?.addEventListener("click", () => {
      AudioEngine.chime();
      hide(document.getElementById("c3-intro"));
      const constEl = document.getElementById("memory-constellation");
      show(constEl, "anim-fade-in");
      buildStars();
    });

    document.getElementById("c3-complete")?.addEventListener("click", e => {
      AudioEngine.achievement();
      burst(e.clientX, e.clientY, { count: 12, emojis: ["📸","💕","✨","🌟"] });
      Achievements.unlock("chapter_3_done");
      Store.update(d => {
        if (!d.completedChapters.includes(3)) d.completedChapters.push(3);
      });
      setTimeout(() => App.returnToMap(3), 800);
    });
  }

  function buildStars() {
    const container = document.getElementById("memory-stars-container");
    if (!container) return;
    container.innerHTML = "";

    const saved = Store.get().memoryViewed || [];
    viewedCount = saved.length;
    updateCounter();

    MEMORIES.forEach((mem, i) => {
      const pos = POSITIONS[i];
      const btn = el("button", {
        className: `memory-star-btn ${saved.includes(i) ? "viewed" : ""}`,
        style: `top:${pos.top};left:${pos.left};animation-delay:${i*0.3}s`,
        "aria-label": `Memory star ${i+1}`,
      }, [mem.emoji]);

      btn.addEventListener("click", e => {
        AudioEngine.sparkle(e.clientX);
        burst(e.clientX, e.clientY, { count: 6, emojis: ["✨","⭐","💫"] });
        revealMemory(mem, i, btn);
      });

      container.appendChild(btn);
    });

    document.getElementById("gallery-total").textContent = MEMORIES.length;
  }

  function revealMemory(mem, index, btn) {
    const card = document.getElementById("memory-card");
    const titleEl = document.getElementById("mc-title");
    const textEl = document.getElementById("mc-text");
    const emojiEl = document.getElementById("mc-emoji");

    if (!card) return;

    // Reset card
    card.classList.remove("revealed");
    emojiEl.textContent = mem.emoji;
    void card.offsetWidth;

    setTimeout(() => {
      titleEl.textContent = mem.title;
      textEl.textContent = mem.text;
      card.classList.add("revealed");
      AudioEngine.reveal();
    }, 100);

    // Mark as viewed
    if (!btn.classList.contains("viewed")) {
      btn.classList.add("viewed");
      viewedCount++;
      updateCounter();

      Store.update(d => {
        if (!d.memoryViewed) d.memoryViewed = [];
        if (!d.memoryViewed.includes(index)) d.memoryViewed.push(index);
      });

      if (viewedCount === 1) Achievements.unlock("first_memory");

      if (viewedCount >= MEMORIES.length) {
        Achievements.unlock("all_memories");
        setTimeout(() => {
          const completeBtn = document.getElementById("c3-complete");
          if (completeBtn) show(completeBtn, "anim-fade-in-up");
        }, 600);
      }
    }
  }

  function updateCounter() {
    const el = document.getElementById("gallery-viewed");
    if (el) el.textContent = viewedCount;
  }

  function destroy() { bgAnim?.stop(); }

  return { init, destroy };
})();

/* ──────────────────────────────────────────────
   CHAPTER 4: The Secret Garden
   ────────────────────────────────────────────── */
const Chapter4 = (() => {
  let bgAnim = null;
  let foundCount = 0;

  const FLOWERS = [
    { emoji: "👧", x: "15%", y: "25%", title: "The Ate", msg: "The way you carry the weight of being the oldest. hugss mahall, remember ha, you don't have to be strong all the time." },
    { emoji: "👭", x: "55%", y: "15%", title: "For Ainna", msg: "How you love your sister. Selflessly. Fiercely. Even when it breaks you. That love is the purest thing I've ever seen." },
    { emoji: "🌙", x: "75%", y: "45%", title: "The Overthinker", msg: "The nights you can't sleep because your mind won't stop. I can't take those thoughts away. But I'll stay awake with you. Always." },
    { emoji: "💬", x: "30%", y: "65%", title: "The Way You Speak", msg: "The way you say 'mahal' — like it's the softest word in the world." },
    { emoji: "💐", x: "70%", y: "75%", title: "The Future", msg: "Travelling togetherr, and si Goku The Universe Destroyer." },
  ];

  function init() {
    const canvas = document.getElementById("c4-canvas");
    if (canvas) {
      bgAnim = StarCanvas.createChapterBg(canvas, "#90d4a8");
      bgAnim.start();
    }

    document.getElementById("c4-start")?.addEventListener("click", () => {
      AudioEngine.chime();
      hide(document.getElementById("c4-intro"));
      const garden = document.getElementById("secret-garden");
      show(garden, "anim-fade-in");
      buildGarden();
    });

    document.getElementById("close-secret-message")?.addEventListener("click", () => {
      hide(document.getElementById("secret-message-panel"));
    });

    document.getElementById("c4-complete")?.addEventListener("click", e => {
      AudioEngine.achievement();
      burst(e.clientX, e.clientY, { count: 12, emojis: ["🌸","🌹","🌺","🌻","💐"] });
      Achievements.unlock("chapter_4_done");
      Store.update(d => {
        if (!d.completedChapters.includes(4)) d.completedChapters.push(4);
      });
      setTimeout(() => App.returnToMap(4), 800);
    });
  }

  function buildGarden() {
    const container = document.getElementById("garden-items");
    if (!container) return;
    container.innerHTML = "";

    const saved = Store.get().gardenFound || [];
    foundCount = saved.length;
    updateProgress();

    FLOWERS.forEach((f, i) => {
      const flower = el("div", {
        className: `garden-flower ${saved.includes(i) ? "found" : ""}`,
        style: `left:${f.x};top:${f.y};animation-delay:${i * 0.5}s`,
        "aria-label": f.title,
        tabindex: "0",
        role: "button",
      }, [f.emoji]);

      if (!saved.includes(i)) {
        const handleFind = e => {
          if (flower.classList.contains("found")) return;
          flower.classList.add("found");
          AudioEngine.sparkle(e.clientX || window.innerWidth / 2);
          burst(
            (parseFloat(f.x) / 100) * window.innerWidth,
            (parseFloat(f.y) / 100) * 380,
            { count: 8, emojis: ["🌸","✨","💫","⭐"] }
          );
          foundCount++;
          updateProgress();

          Store.update(d => {
            if (!d.gardenFound) d.gardenFound = [];
            if (!d.gardenFound.includes(i)) d.gardenFound.push(i);
          });

          if (foundCount === 1) Achievements.unlock("garden_explorer");
          if (foundCount >= FLOWERS.length) Achievements.unlock("garden_complete");

          showSecretMessage(f);
        };

        flower.addEventListener("click", handleFind);
        flower.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") handleFind(e);
        });
      }

      container.appendChild(flower);
    });
  }

  function showSecretMessage(f) {
    const panel = document.getElementById("secret-message-panel");
    const emojiEl = document.getElementById("secret-flower-emoji");
    const titleEl = document.getElementById("secret-message-title");
    const textEl  = document.getElementById("secret-message-text");
    if (!panel) return;

    emojiEl.textContent = f.emoji;
    titleEl.textContent = f.title;
    textEl.textContent  = f.msg;
    show(panel);
  }

  function updateProgress() {
    const el = document.getElementById("garden-found");
    const bar = document.getElementById("garden-bar-inner");
    const hint = document.getElementById("garden-hint-text");

    if (el) el.textContent = foundCount;
    if (bar) bar.style.width = `${(foundCount / FLOWERS.length) * 100}%`;

    if (hint) {
      if (foundCount === 0)              hint.textContent = "🔍 Explore the garden... secrets are hidden everywhere";
      else if (foundCount < FLOWERS.length) hint.textContent = `🌿 ${FLOWERS.length - foundCount} more secrets to discover...`;
      else                               hint.textContent = "🌟 You found all the secrets!";
    }

    if (foundCount >= FLOWERS.length) {
      const completeBtn = document.getElementById("c4-complete");
      if (completeBtn) show(completeBtn, "anim-fade-in-up");
    }
  }

  function destroy() { bgAnim?.stop(); }

  return { init, destroy };
})();

/* ──────────────────────────────────────────────
   CHAPTER 5: What I Love About You
   ────────────────────────────────────────────── */
const Chapter5 = (() => {
  let bgAnim = null;
  let revealed = new Set();

  const LOVE_ITEMS = [
    { cover: "👧", text: "The way you carry the weight of being the oldest. Hugss mahall, remember ha, you don't have to be strong all the time, love." },
    { cover: "👭", text: "How you love your sister Ainna. Selflessly. Fiercely. Even when it breaks you. That love is the purest thing I've ever seen." },
    { cover: "😢", text: "You've been through more than most people realize, yet you still choose kindness and love. Your strength inspires me every day." },
    { cover: "🌙", text: "The nights you can't sleep because your mind won't stop running. I can't take those thoughts away. But I'll stay awake with you. Always." },
    { cover: "💬", text: "The way you say 'mahal' — like it's the softest word in the world." },
    { cover: "🎒", text: "Your strength. You carry so much — family, school, expectations — and you still find time to check on me." },
    { cover: "🌸", text: "Your laugh. The one that escapes when you're caught off guard. It's my favourite sound — and I'm always trying to earn it." },
    { cover: "📝", text: "That you overthink. I know it exhausts you — but it also means you care deeply. And that's something I'll never take for granted." },
    { cover: "🤝", text: "The way you're learning to let me in. Slowly. Messily. It's not perfect — but it's real. And that's all I've ever wanted." },
    { cover: "☀️", text: "Your persistence. Even when you want to give up — you don't. You keep going. For Ainna. For your family. For us. I see it. And I'm in awe of you." },
    { cover: "💭", text: "The future we dream about — Travelling togetherr, and si Goku The Universe Destroyer." },
    { cover: "💖", text: "Being loved by you — the real you, the messy, tired, overthinking, beautiful you — is the greatest gift I have ever received." },
  ];

  function init() {
    const canvas = document.getElementById("c5-canvas");
    if (canvas) {
      bgAnim = StarCanvas.createChapterBg(canvas, "#f9c5d0");
      bgAnim.start();
    }

    document.getElementById("c5-start")?.addEventListener("click", () => {
      AudioEngine.chime();
      hide(document.getElementById("c5-intro"));
      const puzzle = document.getElementById("love-puzzle");
      show(puzzle, "anim-fade-in");
      buildGrid();
    });

    document.getElementById("c5-complete")?.addEventListener("click", e => {
      AudioEngine.achievement();
      burst(e.clientX, e.clientY, { count: 15, emojis: ["💖","💕","💝","✨","🌟"] });
      Achievements.unlock("chapter_5_done");
      Store.update(d => {
        if (!d.completedChapters.includes(5)) d.completedChapters.push(5);
      });
      setTimeout(() => App.returnToMap(5), 800);
    });
  }

  function buildGrid() {
    const grid = document.getElementById("love-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const saved = Store.get().loveRevealed || [];
    revealed = new Set(saved);

    const totalEl = document.getElementById("love-total");
    const revealedEl = document.getElementById("love-revealed");
    if (totalEl) totalEl.textContent = LOVE_ITEMS.length;
    if (revealedEl) revealedEl.textContent = revealed.size;

    LOVE_ITEMS.forEach((item, i) => {
      const isRevealed = revealed.has(i);
      const card = el("div", {
        className: `love-item ${isRevealed ? "revealed" : ""}`,
        tabindex: "0",
        role: "button",
        "aria-label": isRevealed ? item.text : `Love note ${i + 1}`,
      });

      const number = el("span", { className: "item-number" }, [`${i + 1}`]);
      const cover  = el("div",  { className: "item-cover"   }, [item.cover]);
      const text   = el("div",  { className: "item-text"    }, [item.text]);

      card.appendChild(number);
      card.appendChild(cover);
      card.appendChild(text);
      grid.appendChild(card);

      const handleReveal = e => {
        if (card.classList.contains("revealed")) return;
        AudioEngine.sparkle(e.clientX || window.innerWidth / 2);
        burst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, {
          count: 6, emojis: ["💖","✨","💫","💕"]
        });

        card.classList.add("revealed");
        revealed.add(i);

        Store.update(d => {
          if (!d.loveRevealed) d.loveRevealed = [];
          if (!d.loveRevealed.includes(i)) d.loveRevealed.push(i);
        });

        const revEl = document.getElementById("love-revealed");
        if (revEl) revEl.textContent = revealed.size;

        if (revealed.size === 1) Achievements.unlock("first_reveal");
        if (revealed.size >= LOVE_ITEMS.length) {
          Achievements.unlock("all_revealed");
          AudioEngine.celebration();
          setTimeout(() => {
            const btn = document.getElementById("c5-complete");
            if (btn) show(btn, "anim-fade-in-up");
          }, 600);
        }
      };

      card.addEventListener("click", handleReveal);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") handleReveal(e);
      });
    });

    // Check if already complete
    if (revealed.size >= LOVE_ITEMS.length) {
      const btn = document.getElementById("c5-complete");
      if (btn) show(btn);
    }
  }

  function destroy() { bgAnim?.stop(); }

  return { init, destroy };
})();

/* ──────────────────────────────────────────────
   CHAPTER 6: Forever (The Final Letter)
   ────────────────────────────────────────────── */
const Chapter6 = (() => {
  let bgAnim = null;

  const LETTER_PARAGRAPHS = [
    { type: "p", text: "You made it." },
    { type: "p", text: "Through all the chaos, the late nights, the family battles, and the weight you carry that no one else sees." },
    { type: "highlight", text: "You are not your past. You are not your fears. You are not the weight you carry." },
    { type: "p", text: "You are the girl who loves her sister like a mother. The daughter who still shows up even when it hurts. The partner who gives everything, even when she has nothing left." },
    { type: "p", text: "And I see all of you — the strong parts, the breaking parts, the parts you hide because you think they're too much." },
    { type: "highlight", text: "Nothing about you is too much for me." },
    { type: "p", text: "I get quiet when I feel the most. But I want you to know — every day, I thank the universe for you." },
    { type: "p", text: "Maybe that's why I made all of this. Because sometimes I can write the things my voice struggles to say." },
    { type: "p", text: "You are not a burden. You are not defined by the things people misunderstand about you. You are someone who has been hurt — and you're still choosing to love. That's the bravest thing I've ever seen." },
    { type: "highlight", text: "You are my favourite person. My home. My always." },
    { type: "p", text: "Happy Girlfriend's Day, love. But honestly — every day I get with you feels like a celebration." },
    { type: "highlight", text: "Thank you for being you, I love you :))" },
  ];

  function init() {
    const canvas = document.getElementById("c6-canvas");
    if (canvas) {
      bgAnim = StarCanvas.createChapterBg(canvas, "#f9e785");
      bgAnim.start();
    }

    document.getElementById("c6-start")?.addEventListener("click", () => {
      AudioEngine.chime();
      hide(document.getElementById("c6-intro"));
      const content = document.getElementById("finale-content");
      show(content, "anim-fade-in");
      typeLetter();
    });

    document.getElementById("view-all-achievements")?.addEventListener("click", () => {
      App.showAchievements();
    });

    document.getElementById("restart-journey")?.addEventListener("click", () => {
      App.goToScreen("starmap");
    });
  }

  async function typeLetter() {
    const bodyEl = document.getElementById("finale-letter-body");
    if (!bodyEl) return;

    bodyEl.innerHTML = "";
    Achievements.unlock("final_letter");

    for (const para of LETTER_PARAGRAPHS) {
      const p = document.createElement("p");
      if (para.type === "highlight") p.className = "highlight";
      bodyEl.appendChild(p);

      await typewriter(p, para.text, { speed: 18 });
      await wait(200);
    }

    // Show finale extras
    setTimeout(() => {
      AudioEngine.heartbeat();
      Achievements.unlock("journey_complete");
      confettiRain(80);
      AudioEngine.celebration();

      const wish = document.getElementById("finale-wish");
      if (wish) {
        show(wish, "anim-fade-in-up");
        buildWishHearts();
      }

      Store.update(d => {
        if (!d.completedChapters.includes(6)) d.completedChapters.push(6);
      });
    }, 1500);
  }

  function buildWishHearts() {
    const container = document.getElementById("wish-hearts");
    if (!container) return;
    const hearts = ["💖","💗","💓","💞","💕"];
    hearts.forEach((h, i) => {
      const span = el("span", { style: `animation-delay:${i * 0.2}s` }, [h]);
      container.appendChild(span);
    });
  }

  function destroy() { bgAnim?.stop(); }

  return { init, destroy };
})();

window.Chapter1 = Chapter1;
window.Chapter2 = Chapter2;
window.Chapter3 = Chapter3;
window.Chapter4 = Chapter4;
window.Chapter5 = Chapter5;
window.Chapter6 = Chapter6;
