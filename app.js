/* Logan's Reads — app logic (v1) */
(function () {
  "use strict";
const APP_VERSION = "v4";
  const { PHONEMES, SOUNDS, FAMILIES, SIGHT, SENTENCES, STORIES, UNLOCKS, WORD_EMOJI } = window.LRData || {};

  /* ---------- progress store ---------- */
  const KEY = "logansReadsV1";
  const store = {
    data: { stars: 0, sounds: {}, words: {}, stories: {}, sentencesRead: 0 },
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) this.data = Object.assign(this.data, JSON.parse(raw));
      } catch (e) { /* fresh start */ }
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
    },
    reset() {
      this.data = { stars: 0, sounds: {}, words: {}, stories: {}, sentencesRead: 0 };
      this.save();
    },
  };
  store.load();

  const d = store.data;
  const stars = () => d.stars;

  /* ---------- audio: pre-recorded natural voice clips ---------- */
  const AUDIO_BASE = "audio/";
  const audioCache = {};
  let audioUnlocked = false;
  function clip(name) {
    if (!audioCache[name]) {
      const a = new Audio(AUDIO_BASE + name + ".mp3");
      a.preload = "auto";
      audioCache[name] = a;
    }
    return audioCache[name];
  }
  function unlockAudio() {
    if (audioUnlocked) return; audioUnlocked = true;
    try {
      const a = clip("ui_yes"); a.volume = 0;
      const p = a.play();
      if (p) p.then(() => { try { a.pause(); a.currentTime = 0; } catch (e) {} a.volume = 1; }).catch(() => { a.volume = 1; });
    } catch (e) {}
  }
  document.addEventListener("pointerdown", unlockAudio, { once: true });

  /* speechSynthesis fallback, only if a clip file is missing */
  function synthSpeak(text, rate) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve(); return; }
      let done = false;
      const fin = () => { if (!done) { done = true; resolve(); } };
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = rate || 0.95; u.pitch = 1.1;
        u.onend = fin; u.onerror = fin;
        speechSynthesis.speak(u);
        setTimeout(fin, 6000);
      } catch (e) { fin(); }
    });
  }
  /* play a clip; fall back to synthesized fallbackText on error */
  function sayClip(name, fallbackText, rate) {
    unlockAudio();
    return new Promise((resolve) => {
      let settled = false;
      const a = clip(name);
      const cleanup = () => { a.removeEventListener("ended", done); a.removeEventListener("error", onErr); };
      const done = () => { if (settled) return; settled = true; cleanup(); resolve(); };
      const onErr = () => { if (settled) return; settled = true; cleanup(); synthSpeak(fallbackText, rate).then(resolve); };
      a.addEventListener("ended", done);
      a.addEventListener("error", onErr);
      try { a.currentTime = 0; } catch (e) {}
      const p = a.play();
      if (p) p.catch(onErr);
      setTimeout(done, 6000); /* safety net */
    });
  }
  const say = (t) => synthSpeak(t); /* generic fallback */

  const PHONEME_CLIP = { a:"ph_a", b:"ph_b", c:"ph_c", d:"ph_d", e:"ph_e", f:"ph_f",
    g:"ph_g", h:"ph_h", i:"ph_i", j:"ph_j", k:"ph_c", l:"ph_l", m:"ph_m",
    n:"ph_n", o:"ph_o", p:"ph_p", r:"ph_r", s:"ph_s", t:"ph_t", u:"ph_u", w:"ph_w" };
  const sayPhoneme = (ch) => sayClip(PHONEME_CLIP[ch] || "ph_m", PHONEMES[ch] || ch, 0.9);
  const wordClip = (w) => w === "3" ? "w_three" : "w_" + String(w).toLowerCase().replace(/[^a-z]/g, "");
  const sayWord = (w) => sayClip(wordClip(w), w, 0.9);
  const PRAISE_CLIPS = ["ui_yes", "ui_great", "ui_didit", "ui_awesome", "ui_superstar"];
  const PRAISE_TEXT = ["Yes!", "Great reading!", "You did it!", "Awesome!", "Super star reading!"];
  const praise = () => {
    const i = Math.floor(Math.random() * PRAISE_CLIPS.length);
    return sayClip(PRAISE_CLIPS[i], PRAISE_TEXT[i], 0.95);
  };

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------- helpers ---------- */
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const app = () => $("#app");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function starBurst(n) {
    n = n || 1;
    d.stars += n;
    store.save();
    const badge = $("#starCount");
    if (badge) {
      badge.textContent = "⭐ " + d.stars;
      badge.classList.remove("pop");
      void badge.offsetWidth;
      badge.classList.add("pop");
    }
    const layer = $("#celebrate");
    if (!layer) return;
    for (let i = 0; i < 14 * n; i++) {
      const s = document.createElement("div");
      s.className = "confetti";
      s.textContent = ["⭐", "🌟", "✨", "🎉"][Math.floor(Math.random() * 4)];
      s.style.left = (10 + Math.random() * 80) + "vw";
      s.style.animationDelay = (Math.random() * 0.4) + "s";
      s.style.fontSize = (22 + Math.random() * 26) + "px";
      layer.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  function unlocked(key) { return stars() >= UNLOCKS[key]; }

  function topbar(title, opts) {
    opts = opts || {};
    return `<header class="topbar">
      <button class="iconbtn" data-nav="home" aria-label="Home">🏠</button>
      <h1>${esc(title)}</h1>
      <div class="stars" id="starCount">⭐ ${stars()}</div>
    </header>`;
  }

  function lockNote(key) {
    const need = UNLOCKS[key] - stars();
    return `<div class="locked"><div class="lockemoji">🔒</div>
      <p>Earn ${need} more star${need === 1 ? "" : "s"} to unlock!</p>
      <p class="hint">Keep reading in the open activities. 🌟</p></div>`;
  }

  /* ---------- HOME ---------- */
  function showHome() {
    const cards = [
      { key: "sounds", emoji: "🔤", name: "Sounds", desc: "Hear letter sounds" },
      { key: "blend", emoji: "🧩", name: "Blend Words", desc: "Sound out words" },
      { key: "picture", emoji: "🖼️", name: "Picture Words", desc: "Match the picture" },
      { key: "stories", emoji: "📖", name: "Stories", desc: "Read sentences" },
    ];
    app().innerHTML = `
      <div class="home">
        <div class="mascot">🌟</div>
        <h1 class="apptitle">Logan's Reads</h1>
        <p class="welcome">Hi Logan! Ready to read?</p>
        <button class="saybtn" id="helloBtn" aria-label="Say hello">🔊</button>
        <div class="stars big" id="starCount">⭐ ${stars()}</div>
        <div class="cards">
          ${cards.map(c => unlocked(c.key) ? `
            <button class="card" data-go="${c.key}">
              <span class="cardemoji">${c.emoji}</span>
              <span class="cardname">${c.name}</span>
              <span class="carddesc">${c.desc}</span>
            </button>` : `
            <button class="card lockedcard" data-lock="${c.key}">
              <span class="cardemoji">🔒</span>
              <span class="cardname">${c.name}</span>
              <span class="carddesc">${UNLOCKS[c.key]} ⭐ to unlock</span>
            </button>`).join("")}
        </div>
        <button class="grownups" data-nav="parents">👪 Grown-ups</button>
      </div>
      <div id="celebrate"></div>`;
    $("#helloBtn").addEventListener("click", () => sayClip("ui_hi", "Hi Logan! Ready to read?"));
  }

  /* ---------- LEVEL 1: SOUNDS ---------- */
  function showSounds() {
    app().innerHTML = topbar("Letter Sounds") + `
      <div class="pad">
        <p class="instr">Tap a letter to hear its sound! 👆</p>
        <div class="soundgrid">
          ${SOUNDS.map(s => `<button class="soundbtn" data-ch="${s.ch}">
            <span class="bigletter">${s.ch.toUpperCase()}</span>
          </button>`).join("")}
        </div>
        <div class="soundstage" id="stage">
          <p class="hint">Pick a letter above ☝️</p>
        </div>
      </div><div id="celebrate"></div>`;
    $$(".soundbtn").forEach(btn => btn.addEventListener("click", async () => {
      const ch = btn.dataset.ch;
      const info = SOUNDS.find(s => s.ch === ch);
      const stage = $("#stage");
      $$(".soundbtn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      stage.innerHTML = `
        <div class="bigletter huge pop-in">${ch.toUpperCase()}</div>
        <div class="soundemoji">${info.emoji}</div>
        <div class="soundword">${info.word}</div>`;
      await sayPhoneme(ch);
      await wait(250);
      await sayWord(info.word);
      if (!d.sounds[ch]) { d.sounds[ch] = 1; }
      else if (d.sounds[ch] < 3) { d.sounds[ch]++; }
      if (d.sounds[ch] === 3) starBurst(1);
      store.save();
    }));
  }

  /* ---------- LEVEL 2: BLEND ---------- */
  function showBlend() {
    if (!unlocked("blend")) { app().innerHTML = topbar("Blend Words") + `<div class="pad">${lockNote("blend")}</div>`; return; }
    app().innerHTML = topbar("Blend Words") + `
      <div class="pad">
        <p class="instr">Pick a word family! 👆</p>
        <div class="famgrid">
          ${FAMILIES.map((f, i) => `<button class="fambtn" data-fam="${i}">
            <span class="famname">${f.name}</span>
            <span class="famcount">${f.words.length} words</span>
          </button>`).join("")}
        </div>
      </div><div id="celebrate"></div>`;
    $$(".fambtn").forEach(b => b.addEventListener("click", () => showBlendWord(+b.dataset.fam, 0)));
  }

  function showBlendWord(famIdx, wordIdx) {
    const fam = FAMILIES[famIdx];
    const [word, emoji] = fam.words[wordIdx];
    const letters = word.split("");
    if (!d.words[word]) d.words[word] = { seen: 0, independent: 0, helped: 0 };
    d.words[word].seen++;
    store.save();
    let helpLevel = 0;

    app().innerHTML = topbar("Blend Words") + `
      <div class="pad blendpad">
        <p class="instr">Try to read it, Logan! Then tap <b>BLEND</b>. 💪</p>
        <div class="letters" id="letters">
          ${letters.map((ch, i) => `<button class="letter" data-i="${i}">${ch.toUpperCase()}</button>`).join("")}
        </div>
        <div class="wordpic hidden" id="wordpic"><span id="wordemoji"></span></div>
        <div class="btnrow">
          <button class="bigbtn blend" id="blendBtn">🧩 BLEND</button>
          <button class="bigbtn help" id="helpBtn">🔊 Help Me</button>
        </div>
        <div class="btnrow">
          <button class="navbtn" id="prevBtn">⬅ Back</button>
          <button class="navbtn" id="nextBtn">Next ➡</button>
        </div>
      </div><div id="celebrate"></div>`;

    $$(".letter").forEach(btn => btn.addEventListener("click", async () => {
      const i = +btn.dataset.i;
      btn.classList.add("lit");
      await sayPhoneme(letters[i]);
      setTimeout(() => btn.classList.remove("lit"), 600);
    }));

    const letterEls = () => $$("#letters .letter");

    async function playSounds(gap) {
      const els = letterEls();
      for (let i = 0; i < els.length; i++) {
        els[i].classList.add("lit");
        await sayPhoneme(letters[i]);
        await wait(gap);
        els[i].classList.remove("lit");
      }
    }

    async function doBlend() {
      const btn = $("#blendBtn");
      btn.disabled = true;
      /* round 1: slow, separated */
      await playSounds(450);
      /* round 2: closer together */
      await playSounds(160);
      /* bring letters together + say whole word */
      $("#letters").classList.add("together");
      await wait(450);
      await sayWord(word);
      /* reveal picture + celebrate */
      const pic = $("#wordpic");
      $("#wordemoji").textContent = emoji;
      pic.classList.remove("hidden");
      pic.classList.add("pop-in");
      await praise();
      starBurst(1);
      const w = d.words[word];
      if (helpLevel === 0) w.independent++; else w.helped++;
      store.save();
      btn.disabled = false;
    }

    $("#blendBtn").addEventListener("click", doBlend);

    $("#helpBtn").addEventListener("click", async () => {
      const btn = $("#helpBtn");
      btn.disabled = true;
      helpLevel++;
      if (helpLevel === 1) {
        await playSounds(450);            /* individual sounds */
      } else if (helpLevel === 2) {
        await playSounds(160);            /* slow blend */
      } else {
        $("#letters").classList.add("together");
        await wait(300);
        await sayWord(word);  /* whole word */
        $("#letters").classList.remove("together");
        /* helpLevel stays > 0: he needed help with this word */
      }
      btn.disabled = false;
    });

    const goWord = (di) => {
      const n = fam.words.length;
      showBlendWord(famIdx, (wordIdx + di + n) % n);
    };
    $("#prevBtn").addEventListener("click", () => goWord(-1));
    $("#nextBtn").addEventListener("click", () => goWord(1));
  }

  /* ---------- LEVEL 3: PICTURE WORDS ---------- */
  function showPicture() {
    if (!unlocked("picture")) { app().innerHTML = topbar("Picture Words") + `<div class="pad">${lockNote("picture")}</div>`; return; }
    const all = [];
    FAMILIES.forEach(f => f.words.forEach(([w, e]) => all.push([w, e])));
    /* prefer words Logan hasn't mastered yet */
    const pool = all.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const [word, emoji] = pool[0];
    const others = pool.filter(([w]) => w !== word).slice(0, 2);
    const choices = [[word, emoji], ...others];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    if (!d.words[word]) d.words[word] = { seen: 0, independent: 0, helped: 0 };
    d.words[word].seen++;
    let helped = false;

    app().innerHTML = topbar("Picture Words") + `
      <div class="pad">
        <p class="instr">Read the word, then tap the matching picture! 👀</p>
        <div class="bigword" id="bigword">${word.toUpperCase()}</div>
        <div class="btnrow"><button class="bigbtn help" id="hearBtn">🔊 Hear it</button></div>
        <div class="picgrid">
          ${choices.map(([w, e]) => `<button class="picbtn" data-w="${w}"><span>${e}</span></button>`).join("")}
        </div>
        <div class="feedback" id="feedback"></div>
      </div><div id="celebrate"></div>`;

    $("#hearBtn").addEventListener("click", async () => {
      helped = true;
      const btn = $("#hearBtn");
      btn.disabled = true;
      for (const ch of word) { await sayPhoneme(ch); await wait(200); }
      await wait(200);
      await sayWord(word);
      btn.disabled = false;
    });

    let answered = false;
    $$(".picbtn").forEach(btn => btn.addEventListener("click", async () => {
      if (answered) return;
      const fb = $("#feedback");
      if (btn.dataset.w === word) {
        answered = true;
        btn.classList.add("correct");
        fb.innerHTML = `<p class="good">Yes! ${word.toUpperCase()}! 🎉</p>`;
        await sayClip("ui_yes", "Yes!"); await sayWord(word);
        await praise();
        starBurst(1);
        const w = d.words[word];
        if (helped) w.helped++; else w.independent++;
        store.save();
        await wait(1600);
        showPicture();
      } else {
        btn.classList.add("wrong");
        setTimeout(() => btn.classList.remove("wrong"), 700);
        fb.innerHTML = `<p class="tryagain">Try again! 💛 Tap 🔊 if you need help.</p>`;
        await sayClip("ui_tryagain", "Try again!");
        setTimeout(() => { if (!answered) fb.innerHTML = ""; }, 2500);
      }
    }));
  }

  /* ---------- LEVEL 4: STORIES (sentences + mini stories) ---------- */
  function showStories() {
    if (!unlocked("stories")) { app().innerHTML = topbar("Stories") + `<div class="pad">${lockNote("stories")}</div>`; return; }
    app().innerHTML = topbar("Stories") + `
      <div class="pad">
        <p class="instr">Tap a sentence to read it! 📖</p>
        <div class="sentlist">
          ${SENTENCES.map((s, i) => `<button class="sentbtn" data-i="${i}">
            <span class="sentemoji">${s.emoji}</span><span>${esc(s.text)}</span>
          </button>`).join("")}
        </div>
        <p class="instr">Or read a little story! 🌟</p>
        <div class="storygrid">
          ${STORIES.map(st => `<button class="storybtn" data-id="${st.id}">
            <span class="storyemoji">${st.emoji}</span>
            <span class="storyname">${esc(st.title)}</span>
            ${d.stories[st.id] ? '<span class="donebadge">⭐ read</span>' : ""}
          </button>`).join("")}
        </div>
      </div><div id="celebrate"></div>`;
    $$(".sentbtn").forEach(b => b.addEventListener("click", () => showSentence(+b.dataset.i)));
    $$(".storybtn").forEach(b => b.addEventListener("click", () => showStory(b.dataset.id, 0)));
  }

  function showSentence(i) {
    const s = SENTENCES[i];
    const words = s.text.replace(".", "").split(" ");
    app().innerHTML = topbar("Read it!") + `
      <div class="pad">
        <div class="storyemoji big">${s.emoji}</div>
        <p class="instr">Tap any word if you get stuck! 👆</p>
        <div class="sentence" id="sentence">
          ${words.map(w => `<button class="wordbtn" data-w="${esc(w)}">${esc(w)}</button>`).join(" ")}
        </div>
        <div class="btnrow"><button class="bigbtn help" id="readBtn">🔊 Read to me</button></div>
        <div class="btnrow"><button class="navbtn" data-nav="stories">⬅ Stories</button></div>
      </div><div id="celebrate"></div>`;
    $$(".wordbtn").forEach(b => b.addEventListener("click", async () => {
      b.classList.add("lit");
      await sayWord(b.dataset.w);
      b.classList.remove("lit");
    }));
    $("#readBtn").addEventListener("click", async () => {
      const btn = $("#readBtn");
      btn.disabled = true;
      await sayClip("sen_" + i, s.text, 0.95);
      btn.disabled = false;
      d.sentencesRead++;
      starBurst(1);
      store.save();
    });
  }

  function showStory(id, page) {
    const st = STORIES.find(x => x.id === id);
    if (page < st.pages.length) {
      const p = st.pages[page];
      const words = p.text.replace(".", "").split(" ");
      app().innerHTML = topbar(st.title) + `
        <div class="pad">
          <div class="storyemoji big pop-in">${p.emoji}</div>
          <div class="sentence" id="sentence">
            ${words.map(w => `<button class="wordbtn" data-w="${esc(w)}">${esc(w)}</button>`).join(" ")}
          </div>
          <div class="btnrow"><button class="bigbtn help" id="readBtn">🔊 Read to me</button></div>
          <div class="btnrow">
            ${page > 0 ? `<button class="navbtn" id="backPg">⬅ Back</button>` : `<button class="navbtn" data-nav="stories">⬅ Stories</button>`}
            <button class="bigbtn blend" id="nextPg">${page === st.pages.length - 1 ? "Finish ⭐" : "Next ➡"}</button>
          </div>
          <p class="hint">Page ${page + 1} of ${st.pages.length}</p>
        </div><div id="celebrate"></div>`;
      $$(".wordbtn").forEach(b => b.addEventListener("click", async () => {
        b.classList.add("lit");
        await sayWord(b.dataset.w);
        b.classList.remove("lit");
      }));
      $("#readBtn").addEventListener("click", () => sayClip("p_" + id + "_" + page, p.text, 0.95));
      const back = $("#backPg");
      if (back) back.addEventListener("click", () => showStory(id, page - 1));
      $("#nextPg").addEventListener("click", () => showStory(id, page + 1));
      return;
    }
    /* comprehension question */
    const q = st.question;
    const choices = q.choices.slice();
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    let answered = false;
    app().innerHTML = topbar("You did it!") + `
      <div class="pad">
        <div class="storyemoji big">🏆</div>
        <p class="instr big">${esc(q.text)}</p>
        <div class="picgrid">
          ${choices.map(([label, e, ok]) => `<button class="picbtn qbtn" data-ok="${ok ? 1 : 0}">
            <span>${e}</span><span class="qlabel">${esc(label)}</span>
          </button>`).join("")}
        </div>
        <div class="feedback" id="feedback"></div>
      </div><div id="celebrate"></div>`;
    sayClip("q_" + id, q.text, 0.95);
    $$(".qbtn").forEach(btn => btn.addEventListener("click", async () => {
      if (answered) return;
      const fb = $("#feedback");
      if (btn.dataset.ok === "1") {
        answered = true;
        btn.classList.add("correct");
        fb.innerHTML = `<p class="good">Yes! Great reading, Logan! 🎉</p>`;
        await sayClip("ui_great", "Yes! Great reading, Logan!");
        starBurst(2);
        d.stories[id] = (d.stories[id] || 0) + 1;
        store.save();
        await wait(1800);
        showStories();
      } else {
        btn.classList.add("wrong");
        setTimeout(() => btn.classList.remove("wrong"), 700);
        fb.innerHTML = `<p class="tryagain">Try again! 💛</p>`;
        await sayClip("ui_tryagain", "Try again!");
      }
    }));
  }

  /* ---------- PARENTS ---------- */
  function showParents() {
    const soundCount = Object.keys(d.sounds).length;
    const wordEntries = Object.entries(d.words);
    const attempted = wordEntries.length;
    const indep = wordEntries.reduce((n, [, w]) => n + (w.independent || 0), 0);
    const helped = wordEntries.reduce((n, [, w]) => n + (w.helped || 0), 0);
    const storiesDone = Object.keys(d.stories).length;
    app().innerHTML = topbar("For Grown-ups") + `
      <div class="pad parent">
        <h2>Logan's progress 🌟</h2>
        <div class="statgrid">
          <div class="stat"><span class="statnum">⭐ ${d.stars}</span><span>Stars earned</span></div>
          <div class="stat"><span class="statnum">${soundCount}/${SOUNDS.length}</span><span>Letter sounds tried</span></div>
          <div class="stat"><span class="statnum">${attempted}</span><span>Words attempted</span></div>
          <div class="stat"><span class="statnum">${indep}</span><span>Read independently</span></div>
          <div class="stat"><span class="statnum">${helped}</span><span>Read with help</span></div>
          <div class="stat"><span class="statnum">${d.sentencesRead}</span><span>Sentences read</span></div>
          <div class="stat"><span class="statnum">${storiesDone}/${STORIES.length}</span><span>Stories finished</span></div>
        </div>
        <p class="hint">Progress saves on this device only. No accounts, no ads, no tracking.</p>
        <div class="btnrow">
          <button class="navbtn" data-nav="home">⬅ Back to Logan</button>
          <p class="tiny">Logan's Reads v4</p>
          <button class="navbtn danger" id="resetBtn">Reset progress</button>
        </div>
      </div>`;
    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Reset all of Logan's progress?")) { store.reset(); showParents(); }
    });
  }

  /* ---------- router ---------- */
  const routes = {
    home: showHome, sounds: showSounds, blend: showBlend,
    picture: showPicture, stories: showStories, parents: showParents,
  };
  function nav(name) {
    try { window.scrollTo(0, 0); } catch (e) {}
    (routes[name] || showHome)();
  }
  /* one delegated handler for all nav buttons — survives re-renders */
  function bindGlobalNav() {
    document.addEventListener("click", (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-nav],[data-go],[data-lock]") : null;
      if (!t || t.disabled) return;
      if (t.dataset.nav) { nav(t.dataset.nav); return; }
      if (t.dataset.go) { nav(t.dataset.go); return; }
      if (t.dataset.lock) {
        const key = t.dataset.lock;
        const nm = t.querySelector(".cardname");
        sayClip("ui_locked", "That is locked. Earn " + UNLOCKS[key] + " stars to open it!");
      }
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
  }
  document.addEventListener("DOMContentLoaded", () => {
    /* unlock audio on first touch (iOS Safari) */
    const unlock = () => {
      try {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(" ");
          u.volume = 0;
          speechSynthesis.speak(u);
          speechSynthesis.cancel();
        }
      } catch (e) {}
      document.removeEventListener("touchend", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchend", unlock, { passive: true });
    document.addEventListener("click", unlock);
    bindGlobalNav();
    nav("home");
  });

  /* test/debug handle */
  window.LR = { store, nav, say, showHome, showSounds, showBlend, showBlendWord, showPicture, showStories, UNLOCKS, d: () => store.data };
})();
