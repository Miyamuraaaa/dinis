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

  const INTRO_TEXT = "There is a moment — just one — that changed everything. I didn't know it then. I was just going about my ordinary day, and then you appeared, and the ordinary became extraordinary.";

  const CHOICE_RESPONSES = {
    a: {
      art: "😊✨",
      text: "Your smile — I noticed it too. It's the kind of smile that makes a room feel warmer. The kind that I find myself thinking about days later, hoping to see again.",
    },
    b: {
      art: "🦋💫",
      text: "Nervous but happy — that's exactly what you do to me. Even now. There's something about you that makes my heart skip in the most beautiful way.",
    },
    c: {
      art: "🌟💭",
      text: "That secret hope — it's the best kind. The universe has a way of making those happen. And here we are. I'm so glad we spoke again.",
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
      typewriter(storyEl, INTRO_TEXT, { speed: 40, delay: 600, onDone: () => {
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
    if (textEl) typewriter(textEl, data.text, { speed: 35, onDone: () => {
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
    a: "The way you hold a cup with both hands — it's the softest thing.",
    b: "The conversations that go on too long and not long enough.",
    c: "That one song that became ours without either of us deciding.",
    d: "Spring reminds me of you. Soft, beautiful, and full of promise.",
    e: "Side by side in comfortable silence — that's my favourite place.",
    f: "Looking up together and feeling small — but not alone.",
    g: "The way food tastes better when you're across the table.",
    h: "Your hand in mine. Everything is easier like that.",
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
    { emoji: "🌅", title: "Golden Hour", text: "That evening when the sky turned rose gold and we just sat and watched. No phones, no plans. Just us and the fading light." },
    { emoji: "🎉", title: "Your Laugh",  text: "The laugh you do when something catches you off guard — head tilted back, eyes crinkled. It's my favourite sound in the world." },
    { emoji: "🌧️", title: "Rainy Days",  text: "Rainy days became something I look forward to, because they mean staying in together. Wrapped up, warm, and perfectly still." },
    { emoji: "📱", title: "The Texts",   text: "The 'good morning' texts. The random memes. The 'are you okay?' at midnight. Those tiny messages carry so much love." },
    { emoji: "🍕", title: "Late Night Snacks", text: "Nothing ever tasted better than food at 1am with you. Greasy, ridiculous, perfect." },
    { emoji: "🤗", title: "Your Hugs",   text: "The kind of hug where I don't want to let go. Where the world goes quiet and everything feels exactly right." },
    { emoji: "✈️", title: "Adventures",  text: "Every adventure with you — even the ones that went 'wrong' — became the best stories." },
    { emoji: "💤", title: "Sleepy You",  text: "You when you're almost asleep — soft, peaceful, and completely yourself. That's when I fall in love all over again." },
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
    { emoji: "🌸", x: "15%", y: "25%", title: "The Way You Care", msg: "You check in on the people you love — quietly, consistently, without expecting anything back. That kind of love is rare." },
    { emoji: "🌹", x: "55%", y: "15%", title: "Your Kindness",    msg: "I've watched you be kind when no one was watching. That's the truest kind of beautiful." },
    { emoji: "🌻", x: "75%", y: "45%", title: "Your Strength",    msg: "You carry so much, so gracefully. I hope you know how strong you really are — and how much that strength moves me." },
    { emoji: "🌺", x: "30%", y: "65%", title: "You Being You",    msg: "Your little quirks. Your specific way of seeing the world. There is nobody like you, and I never want anyone else." },
    { emoji: "💐", x: "70%", y: "75%", title: "Our Future",       msg: "I think about the life we'll build. The mornings, the adventures, the quiet evenings. I can't wait for all of it — with you." },
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
    { cover: "😊", text: "The way your eyes crinkle when you smile for real — not the polite smile, the real one." },
    { cover: "🎵", text: "How you hum along to songs without realising you're doing it." },
    { cover: "💬", text: "The way you listen. Fully. Like what I'm saying actually matters." },
    { cover: "🌙", text: "That you're still interesting to me. Every conversation, every day." },
    { cover: "🤗", text: "How you make people feel seen. It's your superpower." },
    { cover: "📚", text: "Your mind. The way you think, question, and wonder about everything." },
    { cover: "🧠", text: "You're the smartest person I know — but you wear it so gently." },
    { cover: "🌸", text: "The softness in you. The tenderness you try to hide but can't." },
    { cover: "✨", text: "The way you make ordinary moments feel like they matter." },
    { cover: "💪", text: "Your resilience. You keep going. I admire that more than you know." },
    { cover: "🎨", text: "Your creativity and the way you see beauty in unexpected places." },
    { cover: "💖", text: "Simply this: being loved by you is the greatest gift I have ever been given." },
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
    { type: "p", text: "You traveled through all our stars — the moment we met, the little things that made me fall, the memories I hold close, the secrets of my heart, and every word I struggle to say out loud." },
    { type: "highlight", text: "All of it was for you." },
    { type: "p", text: "I'm not always good with words in the moment. I get quiet when I feel the most. But I want you to know — I think about how lucky I am. A lot. More than I show." },
    { type: "p", text: "You are the person I want to tell things to first. You're the one whose voice I want to hear when a day is hard. You make everything — the ordinary, the difficult, the mundane — better, just by being in it." },
    { type: "highlight", text: "You are my favourite thing about my life." },
    { type: "p", text: "Happy Girlfriend's Day — though honestly, every day I get with you feels like a celebration." },
    { type: "p", text: "Thank you for being you. Don't ever change." },
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

      await typewriter(p, para.text, { speed: 30 });
      await wait(400);
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
