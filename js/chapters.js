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

  const INTRO_TEXT = "I'm not good with words in the moment — I get quiet when I feel the most. But I remember when things started to shift. It wasn't loud. It wasn't dramatic. It was just… you. And suddenly, the ordinary days didn't feel so ordinary anymore. There was a warmth I couldn't explain — like I'd been waiting for you without even knowing it.";

  const CHOICE_RESPONSES = {
    a: {
      art: "🌷💛",
      text: "Your smile — I noticed it. It's the kind that reaches your eyes. I still catch myself hoping to see it, even on your hardest days.",
    },
    b: {
      art: "🫶✨",
      text: "Nervous but happy — that's exactly what you do to me. Every time. There's something about you that makes my heart skip.",
    },
    c: {
      art: "🌙💫",
      text: "That secret hope — it was you. And here we are. I'm so grateful I stayed.",
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
    { id: "a", emoji: "👀", label: "The way you look at me" },
    { id: "b", emoji: "🌙", label: "Late night talks" },
    { id: "c", emoji: "🎵", label: "Our song" },
    { id: "d", emoji: "🌸", label: "Cherry blossoms" },
    { id: "e", emoji: "📚", label: "Reading together" },
    { id: "f", emoji: "📞", label: "Late night calls" },
    { id: "g", emoji: "🍜", label: "Our favourite meal" },
    { id: "h", emoji: "🤝", label: "Hand in hand" },
  ];

  const MESSAGES = {
    a: "The way you look at me makes me wish time would stop. It's one of those moments I never want to end.",
    b: "The conversations that go on too long—and somehow still never feel long enough.",
    c: "That one song that slowly became ours. Now every time it plays, it always brings me back to you.",
    d: "You remind me of spring. Gentle, beautiful, and the reason everything feels a little brighter.",
    e: "Even when we're just reading together in silence, it feels peaceful because it's with you.",
    f: "We're miles apart, but every late night call makes the distance disappear, even if it's only for a little while.",
    g: "Food always tastes better when you're sitting across from me. I never remember what we ate—only that you were there.",
    h: "Your hand in mine. It says 'I'm here,' and somehow that's all I ever need.",
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
  {
    emoji: "🎬",
    title: "Cinema Day",
    text: "I still think about the time we went to the cinema together. I wasn't paying attention to the movie as much as I was paying attention to you. I remember wishing time would just stop right there, because being beside you was all I wanted."
  },
  {
    emoji: "😂",
    title: "Your Laugh",
    text: "Your laugh will always be my favourite sound. The way you laugh when something catches you off guard, the way your smile gets bigger without you noticing—it never fails to make my day better."
  },
  {
    emoji: "💬",
    title: "Late Night Calls",
    text: "Even though we're miles apart, talking to you at the end of the day makes the distance disappear for a while. Those conversations are some of my favourite memories."
  },
  {
    emoji: "📱",
    title: "Our Messages",
    text: "The random updates, the good mornings, the good nights, the 'ingat ka,' the little jokes—we probably don't realize it, but those messages became one of my favourite parts of every day."
  },
  {
    emoji: "🍜",
    title: "Eating Together",
    text: "It never really mattered what we were eating. Somehow every meal felt better because it was with you. I'd choose those simple moments over anything fancy."
  },
  {
    emoji: "🤍",
    title: "Your Hugs",
    text: "Every hug from you feels like the safest place in the world. For a few seconds, everything else disappears, and all I want is for that moment to last a little longer."
  },
  {
    emoji: "🌍",
    title: "Travelling Together",
    text: "One day we'll finally travel together. New cities, new food, new places—but my favourite part won't be the destination. It'll just be experiencing everything with you."
  },
  {
    emoji: "🌙",
    title: "Sleepy You",
    text: "I love the version of you that's almost asleep. Quiet, comfortable, and completely yourself. It's one of those little moments that always reminds me how lucky I am."
  },
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
  {
    emoji: "👧",
    x: "15%",
    y: "25%",
    title: "The Ate",
    msg: "I admire the way you carry so much on your shoulders. Being the oldest isn't easy, yet you continue showing up for everyone. I just hope you remember that you don't always have to be the strong one. You deserve to be taken care of too."
  },
  {
    emoji: "👭",
    x: "55%",
    y: "15%",
    title: "For Ainna",
    msg: "The way you love Ainna is one of the most beautiful things about you. It's selfless, patient, and unconditional. I know you'd do anything for her, and seeing that side of you only makes me love you even more."
  },
  {
    emoji: "🌙",
    x: "75%",
    y: "45%",
    title: "The Overthinker",
    msg: "I know there are nights when your mind refuses to rest. I may not always know the right words, and I can't make those thoughts disappear, but I hope you know you'll never have to face them alone. I'll always stay beside you."
  },
  {
    emoji: "💬",
    x: "30%",
    y: "65%",
    title: "Mahal",
    msg: "Every time you call me 'mahal,' I swear my heart melts a little. It's such a simple word, yet when it comes from you, it somehow carries all the warmth, comfort, and love in the world."
  },
  {
    emoji: "🌍",
    x: "70%",
    y: "75%",
    title: "Our Future",
    msg: "One day we'll finally travel together. We'll visit places we've only talked about, make memories we'll tell for years, and laugh over the little things. No matter where life takes us, my favourite destination will always be wherever you are."
  },
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
  {
    cover: "👧",
    text: "The way you carry the weight of being the oldest without ever asking for recognition. You always put everyone else first, and I hope you know it's okay to let someone take care of you too."
  },
  {
    cover: "👭",
    text: "The way you love Ainna. Patiently, selflessly, and with your whole heart. Watching you care for her makes me admire you more than you'll ever know."
  },
  {
    cover: "😢",
    text: "The fact that you've gone through things that should've broken you, yet you still choose kindness. You're still here, still trying, still loving. That's one of the strongest things I've ever seen."
  },
  {
    cover: "🌙",
    text: "Your overthinking mind. I know it keeps you awake some nights, and I wish I could quiet every fear for you. Until then, I'll just keep reminding you that you never have to carry everything alone."
  },
  {
    cover: "💬",
    text: "The way you call me 'mahal.' It's such a simple word, yet somehow every time you say it, it feels brand new. I'll never get tired of hearing it."
  },
  {
    cover: "🎒",
    text: "Your strength. You balance family, school, responsibilities, and still somehow find time to ask me if I'm okay. That's the kind of love I'll never take for granted."
  },
  {
    cover: "😂",
    text: "Your laugh. Especially the one that comes out when you aren't expecting to laugh. If I could spend my whole life trying to hear that sound, I'd happily do it."
  },
  {
    cover: "📝",
    text: "The way you care so deeply. Sometimes it makes you overthink, sometimes it hurts you—but it's also what makes your heart so beautiful."
  },
  {
    cover: "🤍",
    text: "The way you've slowly let me into your world. Piece by piece, story by story, fear by fear. Thank you for trusting me with the parts of you that not everyone gets to see."
  },
  {
    cover: "☀️",
    text: "Your determination. Even when life gets unfair, even when you're exhausted, you still keep moving forward. I hope you know how inspiring that is."
  },
  {
    cover: "🌍",
    text: "The future we always talk about. Travelling together, making memories in places we've never been, and growing older side by side. I can't wait for that chapter of our story."
  },
  {
    cover: "💖",
    text: "Most of all, I love you. Not just the happy version of you, but every version. The tired one, the overthinking one, the quiet one, the emotional one. Being loved by you is the greatest gift I've ever received, and I'll never stop choosing you."
  },
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
  {
    type: "p",
    text: "You made it."
  },
  {
    type: "p",
    text: "If you're reading this, then you've walked through every little piece of my heart that I could put into this website. Every chapter, every message, every little interaction was made with one person in mind—you."
  },
  {
    type: "highlight",
    text: "Every click was another way of saying, 'I love you.'"
  },
  {
    type: "p",
    text: "I'm not always the best at expressing what I feel. You already know that. Most of the time, I get quiet when my heart is the loudest. That's why I made this instead. I wanted you to have something you could come back to whenever you needed a reminder of how deeply you're loved."
  },
  {
    type: "p",
    text: "I know life hasn't always been kind to you. I know you've carried responsibilities that weren't meant for someone your age. You've had nights where your mind wouldn't let you rest, moments where you questioned yourself, and days where you felt like you had to be strong for everyone else."
  },
  {
    type: "highlight",
    text: "But please, never forget this: you never have to be strong all the time."
  },
  {
    type: "p",
    text: "You are not difficult to love. You are not 'too much.' You are not a burden. You're simply someone who has been through more than most people realize, and despite all of that, you still choose kindness. You still choose to love. That's one of the bravest things I've ever witnessed."
  },
  {
    type: "p",
    text: "I admire the way you take care of Ainna, the way you continue showing up for your family, and the way you always find the time to ask if I'm okay even when you're carrying so much yourself. I notice those things. I always will."
  },
  {
    type: "highlight",
    text: "You deserve the same love that you give so freely to everyone else."
  },
  {
    type: "p",
    text: "Thank you for trusting me with your heart. Thank you for letting me see the parts of you that the rest of the world doesn't. The happy moments, the overthinking, the quiet nights, the tears, the laughter—every version of you has become my favourite."
  },
  {
    type: "p",
    text: "I know we're still young, and there's so much life waiting for us. We'll probably make mistakes, learn new things, and grow in ways we can't even imagine yet. But one thing I hope never changes is that, no matter where life takes us, we keep choosing each other."
  },
  {
    type: "highlight",
    text: "One day, we'll finally travel together—not because the place matters, but because we'll be there together."
  },
  {
    type: "p",
    text: "Whether we're watching another movie, eating somewhere new, laughing over something completely stupid, or simply sitting beside each other in comfortable silence, I know those ordinary moments will become my favourite memories."
  },
  {
    type: "p",
    text: "Happy Girlfriend's Day, mahal. Thank you for loving me, for believing in us, and for being the incredible woman that you are. I hope this little project reminds you, even for just a moment, how truly special you are to me."
  },
  {
    type: "highlight",
    text: "I love you. Yesterday, today, tomorrow, and every day after that. Always."
  },
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
