const notes = [
  "ты моя хояйка",
  "просыпаюсь с хорошим настроением после сна с тобой",
  "Хочу вместе отправиться в небольшое путешествие.",
  "Хочу, чтобы у нас было еще много счастливых дней.",
  "Спасибо, что ты появилась в моей жизни. ❤️",
  "Я люблю наши разговоры.",
  "Я ценю каждое время, проведенное вместе.",
  "Никогда не забуду нашу первую фотографию.",
  "Я хочу, чтобы хороших воспоминаний было еще больше.",
  "Твои глаза сводят меня с ума",
  "Мне нравится видеть тебя счастливой.",
  "Я ценю каждое время, проведенное вместе.",
];

const images = [
  "img/photo_2026-07-21_23-03-13.jpg",
  "img/photo_2026-07-21_23-03-49.jpg",
  "img/photo_2026-07-21_23-04-02.jpg",
  "img/photo_2026-07-21_23-04-14.jpg",
];

const emojis = ["❤️","💖","💗","💕","💘","💝","💞","🧡"];

const textBalls = notes.map((note) => ({
  type: "text",
  emoji: emojis[Math.floor(Math.random() * emojis.length)],
  text: note,
}));

const imgBalls = images.map((src) => ({
  type: "img",
  emoji: "📸",
  text: "Фото с любовью 💕",
  src: src,
}));

const allBalls = [...textBalls, ...imgBalls];

// DOM
const leverHandle = document.getElementById("leverHandle");
const leverSlot = document.getElementById("leverSlot");
const resultOverlay = document.getElementById("resultOverlay");
const resultCard = document.getElementById("resultCard");
const resultEmoji = document.getElementById("resultEmoji");
const resultBadge = document.getElementById("resultBadge");
const resultText = document.getElementById("resultText");
const resultNote = document.getElementById("resultNote");
const resultImg = document.getElementById("resultImg");
const closeBtn = document.getElementById("closeBtn");
const shareBtn = document.getElementById("shareBtn");
const ballInTube = document.getElementById("ballInTube");
const machine = document.getElementById("machine");
const windowText = document.getElementById("windowText");
const windowScroll = document.getElementById("windowScroll");
const neonGlow = document.querySelector(".neon-glow");
const pullCountEl = document.getElementById("pullCount");
const goldenCountEl = document.getElementById("goldenCount");
const historyCountEl = document.getElementById("historyCount");
const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const toggleArrow = historyToggle.querySelector(".toggle-arrow");
const balls = document.querySelectorAll(".ball");

// State
let isSpinning = false;
let isDragging = false;
let startY = 0;
let currentTop = 8;
const MIN_TOP = 8;
const MAX_TOP = 128;

let pullCount = 0;
let goldenCount = 0;
let depletedCount = 0;
let history = [];
let activeBalls = 8;
let autoTextTimer = null;

// === SOUNDS (Web Audio API, no files needed) ===
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playLeverSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

function playChimeSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) {}
}

function playGoldenSound() {
  try {
    const ctx = getAudioCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch(e) {}
}

function playBallDropSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch(e) {}
}

// === BG HEARTS ===
function initBgHearts() {
  const container = document.getElementById("bgHearts");
  const symbols = ["❤️","💖","💗","💕","💘","💝"];
  for (let i = 0; i < 15; i++) {
    const h = document.createElement("div");
    h.className = "bg-heart";
    h.textContent = symbols[i % symbols.length];
    h.style.left = (5 + Math.random() * 90) + "%";
    h.style.fontSize = (10 + Math.random() * 14) + "px";
    h.style.animationDuration = (15 + Math.random() * 20) + "s";
    h.style.animationDelay = (Math.random() * 20) + "s";
    container.appendChild(h);
  }
}
initBgHearts();

// === RANDOM BALL ===
function getRandomBall() {
  if (Math.random() < 0.05 && pullCount > 0) {
    return { type: "golden", emoji: "💎", text: "Ты особенная ✨", src: null };
  }
  return allBalls[Math.floor(Math.random() * allBalls.length)];
}

// === HEARTS BURST ===
function spawnHearts() {
  const container = document.createElement("div");
  container.className = "hearts-container";
  document.body.appendChild(container);
  const symbols = ["❤️","💖","💗","💕","💘","💝"];
  for (let i = 0; i < 24; i++) {
    const heart = document.createElement("div");
    heart.className = "heart-particle";
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = (5 + Math.random() * 90) + "%";
    heart.style.top = (45 + Math.random() * 30) + "%";
    heart.style.animationDelay = (Math.random() * 0.6) + "s";
    heart.style.fontSize = (14 + Math.random() * 24) + "px";
    container.appendChild(heart);
  }
  setTimeout(() => container.remove(), 2600);
}

// === BALES DEPLETION ===
function depleteBall() {
  const active = document.querySelectorAll(".ball:not(.depleted)");
  if (active.length === 0) {
    activeBalls = 8;
    document.querySelectorAll(".ball").forEach((b, i) => {
      setTimeout(() => {
        b.classList.remove("depleted");
        b.style.animation = "none";
        void b.offsetWidth;
        b.style.animation = "";
      }, i * 80);
    });
    return;
  }
  const idx = Math.floor(Math.random() * active.length);
  active[idx].classList.add("depleted");
}

// === HISTORY ===
function addToHistory(item) {
  history.unshift(item);
  if (history.length > 50) history.pop();
  historyCountEl.textContent = history.length;
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = history.map((h, i) => {
    const cls = h.golden ? "history-item h-golden" : "history-item";
    const label = h.golden ? "💎 Золотой шар!" : h.isImg ? "📸 Фото" : "📜 " + h.text;
    return `<div class="${cls}"><span class="h-num">#${history.length - i}</span><span class="h-emoji">${h.emoji}</span><span class="h-text">${label}</span></div>`;
  }).join("");
}

// === PULL LEVER ===
function doPullLever(isGolden) {
  if (isSpinning) return;
  isSpinning = true;
  resultOverlay.classList.add("hidden");

  playLeverSound();
  depleteBall();

  machine.classList.remove("shake");
  void machine.offsetWidth;
  machine.classList.add("shake");

  neonGlow.classList.add("active");
  setTimeout(() => neonGlow.classList.remove("active"), 1500);

  ballInTube.classList.remove("drop");
  void ballInTube.offsetWidth;

  if (isGolden) {
    ballInTube.classList.add("golden");
    ballInTube.textContent = "💎";
  } else {
    ballInTube.classList.remove("golden");
    ballInTube.textContent = "💖";
  }

  ballInTube.classList.add("drop");

  const randomBall = getRandomBall();
  const isGoldenBall = randomBall.type === "golden";

  if (isGoldenBall) {
    ballInTube.classList.add("golden");
    ballInTube.textContent = "💎";
  }

  setTimeout(() => {
    playBallDropSound();

    resultEmoji.textContent = isGoldenBall ? "💎" : randomBall.emoji;
    resultBadge.textContent = isGoldenBall ? "★ ЗОЛОТОЙ ШАР ★" : "";

    if (isGoldenBall) {
      resultText.textContent = "Ты особенная ✨";
      resultNote.textContent = "🌟 " + randomBall.text;
      resultNote.style.display = "block";
      resultImg.classList.add("hidden");
      resultCard.classList.add("golden");
      goldenCount++;
      goldenCountEl.textContent = goldenCount;
      playGoldenSound();
    } else if (randomBall.type === "img") {
      resultText.textContent = randomBall.text;
      resultNote.textContent = "";
      resultNote.style.display = "none";
      resultImg.src = randomBall.src;
      resultImg.classList.remove("hidden");
      resultCard.classList.remove("golden");
      playChimeSound();
    } else {
      resultText.textContent = "Записка для тебя:";
      resultNote.textContent = "📜 " + randomBall.text;
      resultNote.style.display = "block";
      resultImg.classList.add("hidden");
      resultCard.classList.remove("golden");
      playChimeSound();
    }

    resultOverlay.classList.remove("hidden");
    spawnHearts();

    windowText.textContent = (isGoldenBall ? "💎" : randomBall.emoji) + " LOVE";

    pullCount++;
    pullCountEl.textContent = pullCount;

    addToHistory({
      emoji: isGoldenBall ? "💎" : randomBall.emoji,
      text: isGoldenBall ? randomBall.text : (randomBall.type === "img" ? "Фото" : randomBall.text),
      golden: isGoldenBall,
      isImg: randomBall.type === "img",
    });

    isSpinning = false;
    resetAutoText();
  }, 700);
}

function snapBack() {
  leverHandle.classList.remove("pulling");
  leverHandle.classList.add("snap-back");
  leverHandle.style.top = MIN_TOP + "px";
  currentTop = MIN_TOP;
  setTimeout(() => leverHandle.classList.remove("snap-back"), 400);
}

function animateLeverToBottom() {
  if (isSpinning) return;
  leverHandle.classList.add("pulling");
  leverHandle.style.top = MAX_TOP + "px";
  doPullLever();
  snapBack();
}

// === AUTO TEXT ===
function resetAutoText() {
  clearInterval(autoTextTimer);
  autoTextTimer = setInterval(() => {
    const msgs = ["— LOVE —", "— TEBЯ ❤️ —", "— СЧАСТЬЕ —", "— ANGELICA —", "— 💕 —"];
    windowScroll.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  }, 2500);
}
resetAutoText();

// === SHARE ===
shareBtn.addEventListener("click", async () => {
  const emoji = resultEmoji.textContent;
  const text = resultNote.textContent || resultText.textContent;
  const shareText = `${emoji} ${text}\n\n— Machina Amoris`;
  try {
    await navigator.clipboard.writeText(shareText);
    shareBtn.textContent = "Скопировано!";
    shareBtn.classList.add("copied");
    setTimeout(() => {
      shareBtn.textContent = "Поделиться";
      shareBtn.classList.remove("copied");
    }, 2000);
  } catch {
    shareBtn.textContent = "Ошибка";
  }
});

// === EVENTS: LEVER ===
leverHandle.addEventListener("click", (e) => { e.stopPropagation(); animateLeverToBottom(); });
leverSlot.addEventListener("click", (e) => { if (e.target === leverHandle) return; animateLeverToBottom(); });

// Mouse drag
leverHandle.addEventListener("mousedown", (e) => {
  if (isSpinning) return;
  isDragging = true;
  startY = e.clientY;
  currentTop = parseInt(leverHandle.style.top) || MIN_TOP;
  leverHandle.classList.add("pulling");
  e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const delta = e.clientY - startY;
  let newTop = Math.max(MIN_TOP, Math.min(MAX_TOP, currentTop + delta));
  leverHandle.style.top = newTop + "px";
  if (newTop >= MAX_TOP) {
    isDragging = false;
    document.body.style.cursor = "";
    doPullLever();
    snapBack();
  }
});

document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.cursor = "";
  const handleTop = parseInt(leverHandle.style.top) || MIN_TOP;
  if (handleTop > MIN_TOP + 15) doPullLever();
  snapBack();
});

// Touch drag
leverHandle.addEventListener("touchstart", (e) => {
  if (isSpinning) return;
  isDragging = true;
  startY = e.touches[0].clientY;
  currentTop = parseInt(leverHandle.style.top) || MIN_TOP;
  leverHandle.classList.add("pulling");
  e.preventDefault();
}, { passive: false });

document.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const delta = e.touches[0].clientY - startY;
  let newTop = Math.max(MIN_TOP, Math.min(MAX_TOP, currentTop + delta));
  leverHandle.style.top = newTop + "px";
  if (newTop >= MAX_TOP) {
    isDragging = false;
    doPullLever();
    snapBack();
  }
}, { passive: true });

document.addEventListener("touchend", () => {
  if (!isDragging) return;
  isDragging = false;
  const handleTop = parseInt(leverHandle.style.top) || MIN_TOP;
  if (handleTop > MIN_TOP + 15) doPullLever();
  snapBack();
});

// === CLOSE / KEYBOARD ===
closeBtn.addEventListener("click", () => { resultOverlay.classList.add("hidden"); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") resultOverlay.classList.add("hidden");
  if ((e.key === "Enter" || e.key === " ") && !isSpinning) {
    e.preventDefault();
    animateLeverToBottom();
  }
});

// === BALL CLICK WOBBLE ===
balls.forEach((ball) => {
  ball.addEventListener("click", () => {
    ball.classList.remove("wobble");
    void ball.offsetWidth;
    ball.classList.add("wobble");
  });
});

// === HISTORY TOGGLE ===
historyToggle.addEventListener("click", () => {
  historyPanel.classList.toggle("hidden");
  toggleArrow.classList.toggle("open");
});
