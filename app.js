"use strict";

let duration = 60_000;
const indentationWidth = 4;
const PROGRESS_KEY = "home-row-progress-v1";
const CUSTOM_KEY = "home-row-custom-passages-v1";
const PREFS_KEY = "home-row-prefs-v1";

const view = Object.fromEntries([
  "passage", "progress", "lesson-link", "keyboard", "hands", "finger-name", "next-keys",
  "restart", "finish-run", "next", "retry", "result-next", "result-close", "practice-missed",
  "passage-choice", "passage-pb", "line-count", "cursor-position", "time", "time-label",
  "time-fill", "timer-card", "wpm", "cpm", "accuracy", "results", "result-title",
  "result-pb-badge", "result-summary", "res-wpm", "res-raw-wpm", "res-accuracy", "res-chars",
  "result-chart", "missed-keys-list", "session-status", "difficulty", "difficulty-label",
  "level-control", "passage-kind", "terminal", "run-example", "run-typed", "click-sound",
  "preview-sound", "indent-help", "python-run-controls", "python-toggles",
  "toggle-auto-indent", "toggle-skip-setup", "toggle-caret", "toggle-zen",
  "focus-overlay", "resume-focus", "tab-hint", "streak-pill", "open-palette",
  "command-palette", "palette-search", "palette-list", "open-custom", "custom-modal",
  "custom-close", "custom-cancel", "custom-save", "custom-title", "custom-kind",
  "custom-text", "custom-error", "editor-split", "copy-python", "clear-python",
  "terminal-verify", "python-runtime-status"
].map(id => [id, document.getElementById(id)]));

const pythonKeywords = new Set((
  "False None True and as assert async await break class continue def del elif else except " +
  "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield"
).split(" "));
const tokenPattern = /(?<comment>#[^\n]*)|(?<string>(?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(?<number>\b\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?[\d_]+)?\b)|(?<name>\b[A-Za-z_]\w*\b)|(?<symbol>[^\s])/g;

addKeys(view.keyboard);
const hands = new HandDisplay(view.hands);
const sounds = new TypingSounds(view["click-sound"], view["preview-sound"]);
const terminal = new PythonTerminal(view.terminal, view["run-example"], view["run-typed"], {
  split: view["editor-split"],
  copyButton: view["copy-python"],
  clearButton: view["clear-python"],
  verifyBadge: view["terminal-verify"],
  runtimeStatus: view["python-runtime-status"]
});
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const durationButtons = [...document.querySelectorAll("[data-duration]")];

let mode = "python";
let savedDuration = 60_000;
let options = [];
let passageIndex = 0;
let passage = null;
let overridePassage = null;
let slots = [];
let lastPosition = { line: 0, column: 0 };
let run = null;
let ticker = undefined;
let activeSlot = null;
let expectedKeys = [];
let floatingCaret = null;
let sourceEl = null;

let autoIndent = false;
let skipSetup = false;
let barCaret = false;
let zenActive = false;
let tabRestartArmedAt = 0;
let tabHintTimer = null;
let awakeTimer = null;
let lastErrorHintAt = 0;
let paletteItems = [];
let paletteSelected = 0;

// ============================================================================
// Persistence (Personal Bests, Daily Streak, Custom Passages, Preferences)
// ============================================================================
function todayStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterdayStamp() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStamp(d);
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bestWpm: parsed.bestWpm || 0,
        streakDays: parsed.streakDays || 0,
        lastPracticeDate: parsed.lastPracticeDate || "",
        passages: parsed.passages && typeof parsed.passages === "object" ? parsed.passages : {}
      };
    }
  } catch {}
  return { bestWpm: 0, streakDays: 0, lastPracticeDate: "", passages: {} };
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {}
}

function recordRunProgress(fileKey, wpm, accuracyNum, isDrill) {
  const progress = loadProgress();
  const today = todayStamp();
  if (progress.lastPracticeDate !== today) {
    progress.streakDays = progress.lastPracticeDate === yesterdayStamp() ? (progress.streakDays || 0) + 1 : 1;
    progress.lastPracticeDate = today;
  }
  const previousBest = progress.bestWpm || 0;
  if (wpm > previousBest) progress.bestWpm = wpm;

  let isPassagePB = false;
  if (!isDrill && fileKey) {
    const prev = progress.passages[fileKey];
    if (!prev || wpm > prev.bestWpm) isPassagePB = wpm > 0;
    progress.passages[fileKey] = {
      bestWpm: Math.max(prev?.bestWpm || 0, wpm),
      bestAccuracy: Math.max(prev?.bestAccuracy || 0, accuracyNum),
      runs: (prev?.runs || 0) + 1
    };
  } else {
    isPassagePB = wpm > previousBest && wpm > 0;
  }

  saveProgress(progress);
  updateProgressChrome(progress);
  return isPassagePB;
}

function updateProgressChrome(progress = loadProgress()) {
  const streak = progress.streakDays || 0;
  const best = progress.bestWpm || 0;
  view["streak-pill"].textContent = `${streak}d streak · Best ${best} WPM`;

  if (passage && !passage.isDrill) {
    const pb = progress.passages[passage.file];
    if (pb) {
      view["passage-pb"].textContent = `PB: ${pb.bestWpm} WPM · ${pb.bestAccuracy}%`;
      view["passage-pb"].classList.add("has-pb");
    } else {
      view["passage-pb"].textContent = "No PB yet";
      view["passage-pb"].classList.remove("has-pb");
    }
  } else if (passage?.isDrill) {
    view["passage-pb"].textContent = "Targeted drill";
    view["passage-pb"].classList.remove("has-pb");
  }
}

function loadCustomPassages() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveCustomPassage(entry) {
  const existing = loadCustomPassages().filter(item => item.file !== entry.file);
  existing.unshift(entry);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(existing.slice(0, 20)));
  } catch {}
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    autoIndent = Boolean(p.autoIndent);
    skipSetup = Boolean(p.skipSetup);
    barCaret = Boolean(p.barCaret);
    zenActive = Boolean(p.zenActive);
  } catch {}
  syncToggleButtons();
}

function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ autoIndent, skipSetup, barCaret, zenActive }));
  } catch {}
}

function syncToggleButtons() {
  view["toggle-auto-indent"].setAttribute("aria-pressed", String(autoIndent));
  view["toggle-skip-setup"].setAttribute("aria-pressed", String(skipSetup));
  view["toggle-caret"].setAttribute("aria-pressed", String(barCaret));
  view["toggle-caret"].textContent = barCaret ? "Block caret" : "Bar caret";
  view["toggle-zen"].setAttribute("aria-pressed", String(zenActive));
  document.body.classList.toggle("zen-active", zenActive);
  view.passage.classList.toggle("caret-bar", barCaret);
}

// ============================================================================
// Passage Pool & Dropdown Population
// ============================================================================
function loadChoices() {
  const level = view.difficulty.value;
  const custom = loadCustomPassages();
  const english = [
    ...englishPassages.filter(e => e.level === level),
    ...custom.filter(e => e.kind === "english")
  ];
  const python = [
    ...codingPassages.filter(e => e.level === level),
    ...custom.filter(e => e.kind === "python")
  ];

  if (mode === "english") {
    options = english;
    view["difficulty-label"].textContent = "English level";
  } else if (mode === "python") {
    options = python;
    view["difficulty-label"].textContent = "Python level";
  } else {
    options = [
      ...english,
      ...python,
      { file: "⚡ Procedural syntax drill", level, kind: "python", isProceduralSentinel: true, text: "" }
    ];
    view["difficulty-label"].textContent = "Level";
  }

  const progress = loadProgress();
  view["passage-choice"].replaceChildren();
  for (const [index, exercise] of options.entries()) {
    const choice = document.createElement("option");
    choice.value = String(index);
    const pb = progress.passages[exercise.file];
    choice.textContent = pb
      ? `✓ ${exercise.file} (${pb.bestWpm} WPM)`
      : exercise.file;
    view["passage-choice"].append(choice);
  }
  const addCustom = document.createElement("option");
  addCustom.value = "__custom__";
  addCustom.textContent = "+ Custom code / text…";
  view["passage-choice"].append(addCustom);
}

function chooseRandom(avoid = null) {
  const pool = options.filter(ex => ex !== avoid);
  const picked = pool[Math.floor(Math.random() * pool.length)] || options[0];
  return options.indexOf(picked);
}

function resolveCurrentPassage() {
  if (overridePassage) return overridePassage;
  const selected = options[passageIndex] || options[0];
  if (selected?.isProceduralSentinel) {
    const randomKind = Math.random() < 0.7 ? "python" : "english";
    return generateRandomDrill({ kind: randomKind, level: view.difficulty.value });
  }
  return selected;
}

// ============================================================================
// Syntax Highlighting & Passage DOM Building
// ============================================================================
function highlightPython(source) {
  const styles = Array(source.length).fill("");
  for (const token of source.matchAll(tokenPattern)) {
    const found = Object.keys(token.groups).find(type => token.groups[type] !== undefined);
    const style = found === "name" && pythonKeywords.has(token[0]) ? "keyword" : found;
    styles.fill(style, token.index, token.index + token[0].length);
  }
  return styles;
}

function addCharacter(container, row, symbol, line, column, indent = 0, style = "") {
  const item = document.createElement("span");
  item.className = "character";
  if (style) item.classList.add(style);
  if (symbol === "\n") item.classList.add("newline");
  if (symbol === " " && column < indent && column % indentationWidth === 0) {
    item.classList.add("indent-guide", "indent-tab-start");
  }
  item.textContent = symbol === "\n" ? "↵" : symbol;
  if (symbol === " ") item.dataset.marker = "·";
  container.append(item);
  slots.push({ symbol, item, row, line, column, indent, entered: null });
}

function addCodeLines(source) {
  const lines = passage.text.split("\n");
  const styles = highlightPython(passage.text);
  lines.forEach((line, lineIndex) => {
    const row = document.createElement("div");
    row.className = "source-line";
    const number = document.createElement("span");
    number.className = "line-number";
    number.textContent = lineIndex + 1;
    const code = document.createElement("span");
    code.className = "line-code";
    const indent = line.length - line.trimStart().length;
    for (let column = 0; column < line.length; column++) {
      addCharacter(code, row, line[column], lineIndex, column, indent, styles[slots.length]);
    }
    if (lineIndex < lines.length - 1) addCharacter(code, row, "\n", lineIndex, line.length);
    row.append(number, code);
    source.append(row);
  });
  lastPosition = { line: lines.length - 1, column: lines.at(-1).length };
  view["line-count"].textContent = lines.length + " lines";
}

function addEnglishParagraphs(source) {
  const paragraphs = passage.text.split("\n\n");
  paragraphs.forEach((paragraph, line) => {
    const row = document.createElement("p");
    row.className = "source-line";
    let column = 0;
    for (const word of paragraph.match(/\S+| +/g) || []) {
      const container = word.startsWith(" ") ? row : document.createElement("span");
      if (container !== row) {
        container.className = "word";
        row.append(container);
      }
      for (const symbol of word) addCharacter(container, row, symbol, line, column++);
    }
    if (line < paragraphs.length - 1) {
      addCharacter(row, row, "\n", line, column++);
      addCharacter(row, row, "\n", line, column);
    }
    source.append(row);
  });
  lastPosition = { line: paragraphs.length - 1, column: paragraphs.at(-1).length };
  view["line-count"].textContent = paragraphs.length + " paragraphs";
}

function buildPassage() {
  const accessibleText = document.createElement(passage.kind === "python" ? "pre" : "p");
  accessibleText.className = "visually-hidden";
  accessibleText.textContent = passage.text;
  sourceEl = document.createElement("div");
  sourceEl.className = "source";
  sourceEl.setAttribute("aria-hidden", "true");
  floatingCaret = document.createElement("div");
  floatingCaret.id = "floating-caret";
  floatingCaret.className = "floating-caret";
  sourceEl.append(floatingCaret);

  slots = [];
  if (passage.kind === "python") addCodeLines(sourceEl);
  else addEnglishParagraphs(sourceEl);
  view.passage.classList.toggle("english-passage", passage.kind === "english");
  view.passage.replaceChildren(accessibleText, sourceEl);
  view.passage.scrollTop = 0;
  view.passage.scrollLeft = 0;
}

function applySkipSetup() {
  if (!skipSetup || passage.kind !== "python") return;
  const lines = passage.text.split("\n");
  let startLine = typeof passage.logicLine === "number"
    ? passage.logicLine
    : detectLogicStartLine(passage.text);
  while (startLine < lines.length && !lines[startLine].trim()) startLine += 1;
  if (startLine <= 0) return;

  const firstLogicIndex = slots.findIndex(s => s.line >= startLine);
  if (firstLogicIndex <= 0) return;
  for (let i = 0; i < firstLogicIndex; i++) {
    slots[i].entered = slots[i].symbol;
    slots[i].item.classList.add("correct", "prefilled");
  }
  run.cursor = firstLogicIndex;
  run.startCursor = firstLogicIndex;
}

function clearKeyboardHeatmap() {
  for (const key of physicalKeys.values()) {
    key.element.classList.remove("heat-1", "heat-2", "heat-3");
  }
}

function applyKeyboardHeatmap() {
  clearKeyboardHeatmap();
  for (const [code, stat] of run.keyStats) {
    if (!stat.misses) continue;
    const key = physicalKeys.get(code);
    if (!key) continue;
    const rate = stat.misses / Math.max(1, stat.attempts);
    const tier = stat.misses >= 3 || rate >= 0.35 ? "heat-3" : stat.misses === 2 || rate >= 0.18 ? "heat-2" : "heat-1";
    key.element.classList.add(tier);
  }
}

// ============================================================================
// Session Lifecycle
// ============================================================================
function syncDrillChoiceOption() {
  const existingDrillOpt = view["passage-choice"].querySelector('option[value="__drill__"]');
  if (overridePassage) {
    const drillOpt = existingDrillOpt || document.createElement("option");
    drillOpt.value = "__drill__";
    drillOpt.textContent = overridePassage.file;
    if (!existingDrillOpt) view["passage-choice"].prepend(drillOpt);
    view["passage-choice"].value = "__drill__";
  } else {
    existingDrillOpt?.remove();
    view["passage-choice"].value = String(passageIndex);
  }
}

function loadPassage(focus = false) {
  clearInterval(ticker);
  ticker = undefined;
  document.body.classList.remove("is-typing");
  clearTabHint();
  clearKeyboardHeatmap();
  lastErrorHintAt = 0;

  passage = resolveCurrentPassage();
  run = {
    cursor: 0,
    startCursor: 0,
    correct: 0,
    attempts: 0,
    hits: 0,
    fixedErrors: 0,
    started: null,
    pausedAt: null,
    pausedTotal: 0,
    ended: null,
    lastSampleAt: 0,
    intervalErrors: 0,
    history: [],
    keyStats: new Map(),
    missedChars: new Map()
  };

  const isPython = passage.kind === "python";
  syncDrillChoiceOption();
  view["passage-kind"].textContent = isPython ? "py" : "EN";
  view["python-toggles"].hidden = !isPython;
  view["lesson-link"].hidden = !isPython || !passage.chapter;
  view["indent-help"].hidden = !isPython;
  view["python-runtime-status"].hidden = !isPython;

  if (isPython && passage.chapter) view["lesson-link"].href = lessonBaseUrl + passage.chapter;
  else view["lesson-link"].removeAttribute("href");

  view["time-label"].textContent = duration === 0 ? "Unlimited" : "Time left";
  view["time-fill"].max = duration === 0 ? 100 : duration / 1000;
  view["finish-run"].hidden = true;
  terminal.reset();
  terminal.setPassage(passage.file);
  view["python-run-controls"].hidden = !isPython;
  if (isPython) setTimeout(() => terminal.warmup(), 450);

  view.results.hidden = true;
  view["focus-overlay"].hidden = true;
  view["session-status"].textContent = "Ready";
  activeSlot = null;
  hands.clear();
  buildPassage();
  applySkipSetup();
  updateProgressChrome();
  updateCursor();
  updateMetrics();

  if (focus) {
    view.passage.focus({ preventScroll: true });
    view["focus-overlay"].hidden = true;
  }
}

function updateCaret() {
  if (!floatingCaret || !sourceEl) return;
  if (!activeSlot || run.ended !== null) {
    floatingCaret.hidden = true;
    return;
  }
  floatingCaret.hidden = false;
  const sourceRect = sourceEl.getBoundingClientRect();
  const itemRect = activeSlot.item.getBoundingClientRect();
  const x = itemRect.left - sourceRect.left;
  const y = itemRect.top - sourceRect.top;
  const width = Math.max(8, itemRect.width || 8);
  const height = Math.max(16, itemRect.height || 18);
  floatingCaret.style.width = `${width}px`;
  floatingCaret.style.height = `${height}px`;
  floatingCaret.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function updateCursor() {
  if (activeSlot) {
    activeSlot.item.classList.remove("current");
    activeSlot.row.classList.remove("current-line");
  }

  const next = slots[run.cursor];
  activeSlot = run.ended === null ? next : null;
  const position = next ?? lastPosition;
  view["cursor-position"].textContent = passage.kind === "python"
    ? "Ln " + (position.line + 1) + ", Col " + (position.column + 1)
    : "Paragraph " + (position.line + 1);

  terminal.setAvailability(passage.kind === "python" && run.cursor > 0);
  const totalTypeable = Math.max(1, slots.length - run.startCursor);
  const typedCount = Math.max(0, run.cursor - run.startCursor);
  view.progress.textContent = run.started === null
    ? "Type to start"
    : Math.floor(typedCount / totalTypeable * 100) + "% typed";

  if (activeSlot) {
    activeSlot.item.classList.add("current");
    activeSlot.row.classList.add("current-line");
    keepCurrentVisible(activeSlot);
  }
  updateCaret();
  updateGuide(activeSlot?.symbol);
}

function formatKeyLabel(character) {
  if (character === "\n") return "Enter";
  if (character === " ") return "Space";
  return `'${character}'`;
}

function updateGuide(character, errorNotice = null) {
  for (const previous of expectedKeys) previous.element.classList.remove("expected");
  expectedKeys = [];
  view["next-keys"].replaceChildren();
  const guide = getGuide(character);
  if (!guide) {
    view["finger-name"].classList.remove("guide-error");
    view["finger-name"].textContent = "Ready for another run";
    view["next-keys"].setAttribute("aria-label", "No next key");
    hands.guide(expectedKeys);
    return;
  }

  const { key, shift } = guide;
  expectedKeys = shift ? [shift, key] : [key];
  for (const expected of expectedKeys) expected.element.classList.add("expected");

  if (errorNotice) {
    view["finger-name"].classList.add("guide-error");
    view["finger-name"].textContent = errorNotice;
  } else if (performance.now() >= lastErrorHintAt) {
    view["finger-name"].classList.remove("guide-error");
    view["finger-name"].textContent = shift
      ? fingerNames[shift.finger] + " on Shift · " + fingerNames[key.finger]
      : fingerNames[key.finger];
  }

  const keyLabel = key.code.startsWith("Key") ? key.label.toUpperCase() : key.label;
  const labels = shift ? ["Shift", keyLabel] : [key.code === "Period" ? "Full stop (.)" : keyLabel];
  view["next-keys"].setAttribute("aria-label", "Next key: " + labels.join(" plus "));
  for (const label of labels) {
    const keycap = document.createElement("kbd");
    keycap.textContent = label;
    view["next-keys"].append(keycap);
  }
  hands.guide(expectedKeys);
}

function keepCurrentVisible({ item, row }) {
  if (!sourceEl) return;
  const sourceRect = sourceEl.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const itemTop = itemRect.top - sourceRect.top;
  const itemHeight = itemRect.height || 24;
  const targetTop = itemTop - view.passage.clientHeight / 2 + itemHeight / 2;
  const maxTop = Math.max(0, view.passage.scrollHeight - view.passage.clientHeight);
  view.passage.scrollTop = Math.max(0, Math.min(maxTop, targetTop));

  if (passage.kind === "english") return;
  const area = view.passage.getBoundingClientRect();
  const leftGutter = area.left + (row.firstElementChild?.getBoundingClientRect().width || 0);
  if (itemRect.right > area.right - 14) {
    view.passage.scrollLeft += itemRect.right - area.right + 24;
  } else if (itemRect.left < leftGutter + 8) {
    view.passage.scrollLeft -= leftGutter + 14 - itemRect.left;
  }
}

function activeElapsed(now = performance.now()) {
  if (run.started === null) return 0;
  const endRef = run.ended ?? run.pausedAt ?? now;
  const raw = endRef - run.started - run.pausedTotal;
  return duration > 0 ? Math.min(duration, Math.max(0, raw)) : Math.max(0, raw);
}

function updateMetrics(now = performance.now()) {
  const elapsed = activeElapsed(now);
  const minutes = Math.max(elapsed, 1000) / 60_000;
  const wpm = elapsed ? Math.round(run.correct / 5 / minutes) : 0;
  const rawWpm = elapsed ? Math.round(run.attempts / 5 / minutes) : 0;
  const cpm = elapsed ? Math.round(run.attempts / minutes) : 0;
  const accuracyNum = run.attempts ? Math.round(run.hits / run.attempts * 100) : null;
  const accuracy = accuracyNum !== null ? accuracyNum + "%" : "—";

  if (duration === 0) {
    const secs = Math.floor(elapsed / 1000);
    view.time.textContent = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
    const totalTypeable = Math.max(1, slots.length - run.startCursor);
    const pct = Math.round(Math.max(0, run.cursor - run.startCursor) / totalTypeable * 100);
    view["time-fill"].value = pct;
    view["timer-card"].classList.remove("urgent");
  } else {
    const seconds = Math.ceil((duration - elapsed) / 1000);
    view.time.textContent = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
    view["time-fill"].value = (duration - elapsed) / 1000;
    view["timer-card"].classList.toggle("urgent", seconds > 0 && seconds <= 10 && run.ended === null);
  }

  view.wpm.textContent = wpm;
  view.cpm.textContent = cpm;
  view.accuracy.textContent = accuracy;
  return { wpm, rawWpm, cpm, accuracy, accuracyNum: accuracyNum ?? 100, elapsed };
}

function checkDeadline(now) {
  if (run.ended !== null) return true;
  if (duration > 0 && run.started !== null && run.pausedAt === null && activeElapsed(now) >= duration) {
    finishRun("Time is up", now);
    return true;
  }
  return false;
}

function sampleTimeline(now) {
  if (run.started === null || run.pausedAt !== null) return;
  const elapsed = activeElapsed(now);
  if (elapsed - run.lastSampleAt >= 2000 || run.history.length === 0) {
    const minutes = Math.max(elapsed, 1000) / 60_000;
    const wpm = Math.round(run.correct / 5 / minutes);
    const rawWpm = Math.round(run.attempts / 5 / minutes);
    run.history.push({ sec: Math.round(elapsed / 1000), wpm, rawWpm, errors: run.intervalErrors });
    run.lastSampleAt = elapsed;
    run.intervalErrors = 0;
  }
}

function tick() {
  const now = performance.now();
  if (!checkDeadline(now)) {
    updateMetrics(now);
    sampleTimeline(now);
  }
}

function startRun(now) {
  if (run.started !== null) return;
  run.started = now;
  run.lastSampleAt = 0;
  document.body.classList.add("is-typing");
  if (duration === 0) view["finish-run"].hidden = false;
  const label = duration === 0 ? "Unlimited mode started" : (duration / 60_000) + "-minute test started";
  view["session-status"].textContent = label;
  ticker = setInterval(tick, 125);
}

function pauseRun(message = "Paused — click or press any key to resume") {
  if (!run || run.started === null || run.ended !== null || run.pausedAt !== null) return;
  run.pausedAt = performance.now();
  clearInterval(ticker);
  ticker = undefined;
  document.body.classList.remove("is-typing");
  view["resume-focus"].textContent = message;
  view["focus-overlay"].hidden = false;
  view["session-status"].textContent = "Test paused";
}

function resumeRun(now = performance.now()) {
  if (!run || run.pausedAt === null) return;
  run.pausedTotal += now - run.pausedAt;
  run.pausedAt = null;
  view["focus-overlay"].hidden = true;
  document.body.classList.add("is-typing");
  ticker = setInterval(tick, 125);
  view["session-status"].textContent = "Test resumed";
}

// ============================================================================
// Results Dashboard, Sparkline SVG & Weak-Key Drill
// ============================================================================
function renderSparkline(history) {
  const svg = view["result-chart"];
  svg.replaceChildren();
  const ns = "http://www.w3.org/2000/svg";
  const W = 480, H = 96, padX = 12, padY = 12;
  const pts = history.length >= 2 ? history : [{ sec: 0, wpm: 0, errors: 0 }, ...(history.length ? history : [{ sec: 1, wpm: 0, errors: 0 }])];
  const maxWpm = Math.max(20, ...pts.map(p => p.wpm));

  // Subtle horizontal reference grid
  for (const frac of [0.25, 0.5, 0.75]) {
    const y = padY + (H - padY * 2) * frac;
    const grid = document.createElementNS(ns, "line");
    grid.setAttribute("x1", padX);
    grid.setAttribute("x2", W - padX);
    grid.setAttribute("y1", y);
    grid.setAttribute("y2", y);
    grid.setAttribute("stroke", "#2a2d40");
    grid.setAttribute("stroke-dasharray", "3 4");
    svg.append(grid);
  }

  const coords = pts.map((p, i) => {
    const x = padX + (i / Math.max(1, pts.length - 1)) * (W - padX * 2);
    const y = H - padY - (p.wpm / maxWpm) * (H - padY * 2);
    return { x, y, errors: p.errors, wpm: p.wpm };
  });

  const defs = document.createElementNS(ns, "defs");
  const grad = document.createElementNS(ns, "linearGradient");
  grad.setAttribute("id", "wpmFill");
  grad.setAttribute("x1", "0");
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", "0");
  grad.setAttribute("y2", "1");
  const s1 = document.createElementNS(ns, "stop");
  s1.setAttribute("offset", "0%");
  s1.setAttribute("stop-color", "#c6b5ff");
  s1.setAttribute("stop-opacity", "0.35");
  const s2 = document.createElementNS(ns, "stop");
  s2.setAttribute("offset", "100%");
  s2.setAttribute("stop-color", "#c6b5ff");
  s2.setAttribute("stop-opacity", "0.0");
  grad.append(s1, s2);
  defs.append(grad);
  svg.append(defs);

  const lineD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L ${coords.at(-1).x.toFixed(1)} ${H - padY} L ${coords[0].x.toFixed(1)} ${H - padY} Z`;

  const area = document.createElementNS(ns, "path");
  area.setAttribute("d", areaD);
  area.setAttribute("fill", "url(#wpmFill)");
  svg.append(area);

  const line = document.createElementNS(ns, "path");
  line.setAttribute("d", lineD);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#c6b5ff");
  line.setAttribute("stroke-width", "2.2");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.append(line);

  for (const c of coords) {
    if (!c.errors) continue;
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", c.x.toFixed(1));
    dot.setAttribute("cy", c.y.toFixed(1));
    dot.setAttribute("r", "3.6");
    dot.setAttribute("fill", "#ff7e96");
    dot.setAttribute("stroke", "#141620");
    dot.setAttribute("stroke-width", "1.2");
    svg.append(dot);
  }
}

function renderMissedKeys() {
  const container = view["missed-keys-list"];
  container.replaceChildren();
  if (run.missedChars.size === 0) {
    const clean = document.createElement("span");
    clean.textContent = "Flawless accuracy — 0 missed keys!";
    clean.style.color = "var(--mint)";
    container.append(clean);
    view["practice-missed"].hidden = true;
    return;
  }

  const label = document.createElement("span");
  label.textContent = "Most missed:";
  container.append(label);

  const sorted = [...run.missedChars.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  for (const [ch, count] of sorted) {
    const chip = document.createElement("span");
    chip.className = "miss-chip";
    const display = ch === "\n" ? "↵" : ch === " " ? "Space" : ch;
    chip.textContent = `${display} ×${count}`;
    container.append(chip);
  }
  view["practice-missed"].hidden = false;
}

function finishRun(title, now) {
  run.ended = now;
  clearInterval(ticker);
  ticker = undefined;
  document.body.classList.remove("is-typing");
  view["focus-overlay"].hidden = true;
  view["finish-run"].hidden = true;
  hands.clear();
  updateCursor();

  const { wpm, rawWpm, cpm, accuracy, accuracyNum } = updateMetrics(now);
  run.history.push({ sec: Math.round(activeElapsed(now) / 1000), wpm, rawWpm, errors: run.intervalErrors });

  const unfixedErrors = slots
    .slice(run.startCursor, run.cursor)
    .filter(s => s.item.classList.contains("error")).length;

  const isPB = recordRunProgress(passage.file, wpm, accuracyNum, Boolean(passage.isDrill));
  applyKeyboardHeatmap();
  loadChoices();
  syncDrillChoiceOption();

  const summary = `${wpm} WPM · ${cpm} CPM · ${accuracy} accuracy`;
  view["result-title"].textContent = title;
  view["result-pb-badge"].hidden = !isPB;
  view["result-summary"].textContent = summary;
  view["res-wpm"].textContent = wpm;
  view["res-raw-wpm"].textContent = rawWpm;
  view["res-accuracy"].textContent = accuracy;
  view["res-chars"].textContent = `${run.correct} / ${run.fixedErrors} / ${unfixedErrors}`;

  renderSparkline(run.history);
  renderMissedKeys();

  view.results.hidden = false;
  view["session-status"].textContent = title + ". " + summary;
  if (document.activeElement === view.passage) view.retry.focus({ preventScroll: true });
}

// ============================================================================
// Typing Character Handling, Auto-Indent & Backspace
// ============================================================================
function recordKeyTelemetry(expectedChar, keyObj, matched) {
  const code = keyObj?.code || getGuide(expectedChar)?.key?.code;
  if (code) {
    const prev = run.keyStats.get(code) || { attempts: 0, misses: 0 };
    prev.attempts += 1;
    if (!matched) prev.misses += 1;
    run.keyStats.set(code, prev);
  }
  if (!matched) {
    run.missedChars.set(expectedChar, (run.missedChars.get(expectedChar) || 0) + 1);
    run.intervalErrors += 1;
  }
}

function writeCharacter(character, physicalKeyObj = null) {
  const slot = slots[run.cursor];
  const matches = character === slot.symbol;
  slot.entered = character;
  slot.item.classList.add(matches ? "correct" : "error");
  if (!matches) {
    slot.item.textContent = character === "\n" ? "↵" : character === " " ? "·" : character;
  }
  recordKeyTelemetry(slot.symbol, physicalKeyObj, matches);
  run.cursor += 1;
  run.attempts += 1;
  if (matches) {
    run.correct += 1;
    run.hits += 1;
  }
  return matches;
}

function performAutoIndent() {
  if (!autoIndent || passage.kind !== "python") return;
  while (run.cursor < slots.length) {
    const slot = slots[run.cursor];
    if (slot.symbol === " " && slot.column < slot.indent) {
      slot.entered = " ";
      slot.item.classList.add("correct", "auto-indented");
      run.cursor += 1;
    } else {
      break;
    }
  }
}

function backspace() {
  if (run.cursor <= run.startCursor) return;
  // Strip any contiguous auto-indented leading spaces cleanly together.
  while (run.cursor > run.startCursor && slots[run.cursor - 1].item.classList.contains("auto-indented")) {
    const skipped = slots[--run.cursor];
    skipped.entered = null;
    skipped.item.classList.remove("correct", "auto-indented");
  }
  if (run.cursor <= run.startCursor) {
    updateCursor();
    updateMetrics();
    return;
  }
  const slot = slots[--run.cursor];
  if (slot.item.classList.contains("error")) run.fixedErrors += 1;
  if (slot.entered === slot.symbol) run.correct -= 1;
  slot.entered = null;
  slot.item.classList.remove("correct", "error", "auto-indented");
  slot.item.textContent = slot.symbol === "\n" ? "↵" : slot.symbol;
  updateCursor();
  updateMetrics();
}

function animateKey(key, event, error = false) {
  if (!key) return;
  hands.down(key, error);
  if (event.code !== key.code) hands.up(key.code);
}

function showTabHint() {
  view["tab-hint"].hidden = false;
  clearTimeout(tabHintTimer);
  tabHintTimer = setTimeout(() => clearTabHint(), 1500);
}

function clearTabHint() {
  tabRestartArmedAt = 0;
  view["tab-hint"].hidden = true;
  clearTimeout(tabHintTimer);
}

// ============================================================================
// Command Palette & Custom Code Modal
// ============================================================================
function buildPaletteCandidates(query) {
  const q = query.trim().toLowerCase();
  const actions = [
    { type: "mode", mode: "python", tag: "MODE", name: "Switch to Python mode", meta: "10 Easy · 10 Med · 10 Hard" },
    { type: "mode", mode: "english", tag: "MODE", name: "Switch to English mode", meta: "5 Easy · 5 Med · 5 Hard" },
    { type: "mode", mode: "random", tag: "MODE", name: "Switch to Random mode", meta: "Mixed + procedural" },
    { type: "duration", duration: 1, tag: "TIME", name: "Duration: 1 minute", meta: "60s sprint" },
    { type: "duration", duration: 3, tag: "TIME", name: "Duration: 3 minutes", meta: "180s endurance" },
    { type: "duration", duration: 5, tag: "TIME", name: "Duration: 5 minutes", meta: "300s deep practice" },
    { type: "duration", duration: 0, tag: "TIME", name: "Duration: Unlimited (no time limit)", meta: "Type at your own pace" },
    { type: "toggle", key: "autoIndent", tag: "OPT", name: `Auto-indent (${autoIndent ? "ON" : "OFF"})`, meta: "IDE indent on Enter" },
    { type: "toggle", key: "skipSetup", tag: "OPT", name: `Skip setup (${skipSetup ? "ON" : "OFF"})`, meta: "Jump to logic lines" },
    { type: "toggle", key: "barCaret", tag: "OPT", name: `Caret style (${barCaret ? "Bar" : "Block"})`, meta: "Toggle cursor" },
    { type: "toggle", key: "zenActive", tag: "OPT", name: `Focus mode (${zenActive ? "ON" : "OFF"})`, meta: "Dim chrome" },
    { type: "custom", tag: "NEW", name: "+ Add custom code or text…", meta: "Paste snippet" }
  ];

  const progress = loadProgress();
  const allPassages = [
    ...codingPassages.map(p => ({ ...p, listKind: "python" })),
    ...englishPassages.map(p => ({ ...p, listKind: "english" })),
    ...loadCustomPassages().map(p => ({ ...p, listKind: p.kind }))
  ].map(p => {
    const pb = progress.passages[p.file];
    const metaParts = [p.level || "custom"];
    if (p.chapter) metaParts.push(`Ch ${p.chapter}`);
    if (pb) metaParts.push(`✓ ${pb.bestWpm} WPM`);
    return {
      type: "passage",
      passage: p,
      tag: p.listKind === "python" ? "PY" : "EN",
      name: p.file,
      meta: metaParts.join(" · ")
    };
  });

  const combined = [...allPassages, ...actions];
  return combined.filter(item =>
    !q || item.name.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q)
  ).slice(0, 20);
}

function renderPalette() {
  paletteItems = buildPaletteCandidates(view["palette-search"].value);
  paletteSelected = Math.min(paletteSelected, Math.max(0, paletteItems.length - 1));
  view["palette-list"].replaceChildren();
  paletteItems.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-item" + (index === paletteSelected ? " selected" : "");
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", String(index === paletteSelected));

    const left = document.createElement("span");
    left.className = "palette-item-main";
    const tag = document.createElement("span");
    tag.className = "palette-tag";
    tag.textContent = item.tag;
    const name = document.createElement("span");
    name.className = "palette-name";
    name.textContent = item.name;
    left.append(tag, name);

    const meta = document.createElement("span");
    meta.className = "palette-meta";
    meta.textContent = item.meta;

    btn.append(left, meta);
    btn.addEventListener("click", () => executePaletteItem(item));
    view["palette-list"].append(btn);
  });
}

function executePaletteItem(item) {
  if (!item) return;
  closePalette(false);
  if (item.type === "mode") {
    selectMode(item.mode);
  } else if (item.type === "duration") {
    selectDuration(item.duration);
  } else if (item.type === "toggle") {
    if (item.key === "autoIndent") view["toggle-auto-indent"].click();
    else if (item.key === "skipSetup") view["toggle-skip-setup"].click();
    else if (item.key === "barCaret") view["toggle-caret"].click();
    else if (item.key === "zenActive") view["toggle-zen"].click();
  } else if (item.type === "custom") {
    openCustomModal();
  } else if (item.type === "passage") {
    overridePassage = null;
    const targetMode = item.passage.kind;
    if (mode !== targetMode) {
      mode = targetMode;
      for (const b of modeButtons) b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
    }
    if (item.passage.level && view.difficulty.value !== item.passage.level) {
      view.difficulty.value = item.passage.level;
    }
    loadChoices();
    const idx = options.findIndex(o => o.file === item.passage.file);
    passageIndex = idx >= 0 ? idx : 0;
    loadPassage(true);
  }
}

function openPalette() {
  if (!view["custom-modal"].hidden) closeCustomModal(false);
  if (run?.started !== null && run.ended === null && run.pausedAt === null) pauseRun();
  view["command-palette"].hidden = false;
  view["palette-search"].value = "";
  paletteSelected = 0;
  renderPalette();
  view["palette-search"].focus();
}

function closePalette(refocus = true) {
  view["command-palette"].hidden = true;
  if (refocus) view.passage.focus({ preventScroll: true });
}

function openCustomModal() {
  if (!view["command-palette"].hidden) closePalette(false);
  if (run?.started !== null && run.ended === null && run.pausedAt === null) pauseRun();
  view["custom-error"].hidden = true;
  view["custom-title"].value = "";
  view["custom-kind"].value = mode === "english" ? "english" : "python";
  view["custom-text"].value = "";
  view["custom-modal"].hidden = false;
  view["custom-title"].focus();
}

function closeCustomModal(refocus = true) {
  view["custom-modal"].hidden = true;
  if (!overridePassage) view["passage-choice"].value = String(passageIndex);
  if (refocus) view.passage.focus({ preventScroll: true });
}

function submitCustomPassage() {
  const rawText = view["custom-text"].value.replace(/\r\n/g, "\n").replace(/\t/g, "    ").trim();
  if (rawText.length < 10) {
    view["custom-error"].textContent = "Please enter at least 10 characters to practice.";
    view["custom-error"].hidden = false;
    return;
  }
  const kind = view["custom-kind"].value;
  const fallbackTitle = kind === "python" ? `custom_${Date.now() % 1000}.py` : `Custom text ${Date.now() % 1000}`;
  const title = view["custom-title"].value.trim() || fallbackTitle;
  const entry = {
    file: title,
    kind,
    level: view.difficulty.value,
    chapter: kind === "python" ? 1 : undefined,
    logicLine: kind === "python" ? detectLogicStartLine(rawText) : 0,
    isCustom: true,
    text: rawText
  };
  saveCustomPassage(entry);
  overridePassage = null;
  if (mode !== kind && mode !== "random") {
    mode = kind;
    for (const b of modeButtons) b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
  }
  loadChoices();
  const idx = options.findIndex(o => o.file === entry.file);
  passageIndex = idx >= 0 ? idx : 0;
  closeCustomModal(false);
  loadPassage(true);
}

// ============================================================================
// Mode & Duration Helpers + Keyboard Handler
// ============================================================================
function restoreDurationIfNeeded() {
  if (duration === 30_000) {
    duration = savedDuration;
    for (const item of durationButtons) {
      item.setAttribute("aria-pressed", String(Number(item.dataset.duration) * 60_000 === duration));
    }
  }
}

function selectMode(nextMode) {
  overridePassage = null;
  restoreDurationIfNeeded();
  if (mode === nextMode) {
    view.passage.focus({ preventScroll: true });
    return;
  }
  mode = nextMode;
  for (const item of modeButtons) item.setAttribute("aria-pressed", String(item.dataset.mode === mode));
  loadChoices();
  passageIndex = mode === "random" ? chooseRandom(passage) : 0;
  loadPassage(true);
}

function selectDuration(minutesVal) {
  overridePassage = null;
  const requested = Number(minutesVal) * 60_000;
  savedDuration = requested;
  if (duration !== requested) {
    duration = requested;
    for (const item of durationButtons) {
      item.setAttribute("aria-pressed", String(Number(item.dataset.duration) === Number(minutesVal)));
    }
    loadPassage(true);
  } else {
    view.passage.focus({ preventScroll: true });
  }
}

function keyDown(event) {
  // Global Cmd/Ctrl + K quick switcher
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (view["command-palette"].hidden) openPalette();
    else closePalette(true);
    return;
  }

  // Modal keyboard handling
  if (!view["command-palette"].hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (paletteItems.length) {
        paletteSelected = (paletteSelected + 1) % paletteItems.length;
        renderPalette();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (paletteItems.length) {
        paletteSelected = (paletteSelected - 1 + paletteItems.length) % paletteItems.length;
        renderPalette();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      executePaletteItem(paletteItems[paletteSelected]);
    }
    return;
  }

  if (!view["custom-modal"].hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCustomModal(true);
    }
    return;
  }

  if (!view.results.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      view.results.hidden = true;
    }
    return;
  }

  if (event.target.closest?.("button, a, input, textarea, select, [contenteditable]") ||
    event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
    return;
  }

  const focused = document.activeElement === view.passage;
  if (!focused && document.activeElement !== document.body) return;

  const now = performance.now();

  if (event.key === "Escape") {
    event.preventDefault();
    if (run.started !== null && run.ended === null) {
      if (run.pausedAt === null) {
        pauseRun("Paused — press any key to resume · Esc again to reset");
      } else {
        loadPassage(true);
      }
    } else if (zenActive) {
      zenActive = false;
      savePrefs();
      syncToggleButtons();
    } else if (focused) {
      view.passage.blur();
    }
    return;
  }

  // Tab + Enter instant restart (within 1500ms)
  if (event.key === "Enter" && tabRestartArmedAt && now - tabRestartArmedAt <= 1500) {
    event.preventDefault();
    clearTabHint();
    loadPassage(true);
    return;
  }

  if (checkDeadline(now)) return;
  const physicalKey = physicalKeys.get(event.code);

  if (event.key === "Shift") {
    if (physicalKey && !event.repeat) {
      hands.down(physicalKey);
      sounds.play();
    }
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    clearTabHint();
    if (run.pausedAt !== null) resumeRun(now);
    if (run.cursor > run.startCursor) {
      animateKey(physicalKeys.get("Backspace"), event);
      sounds.play();
      backspace();
    }
    return;
  }

  const slot = slots[run.cursor];
  if (!slot) return;

  // Trap Tab inside the editor whenever typing/focused so focus never escapes to links/controls.
  if (event.key === "Tab") {
    event.preventDefault();
    if (event.repeat) return;
    if (!focused) view.passage.focus({ preventScroll: true });
    if (run.pausedAt !== null) resumeRun(now);
    const canIndent = !event.shiftKey && passage.kind === "python" && slot.column < slot.indent;
    if (canIndent) {
      clearTabHint();
      startRun(now);
      animateKey(physicalKeys.get("Tab"), event);
      sounds.play();
      const remaining = Math.min(indentationWidth - slot.column % indentationWidth, slot.indent - slot.column);
      for (let cell = 0; cell < remaining; cell++) writeCharacter(" ", physicalKeys.get("Tab"));
      if (run.cursor === slots.length) finishRun("Passage complete", now);
      else {
        updateCursor();
        updateMetrics(now);
      }
    } else {
      tabRestartArmedAt = now;
      showTabHint();
    }
    return;
  }

  clearTabHint();
  const character = event.key === "Enter" ? "\n" : event.key;
  const typed = getGuide(character);
  if (!typed) return;

  event.preventDefault();
  if (event.repeat) return;

  if (!focused) view.passage.focus({ preventScroll: true });
  view["focus-overlay"].hidden = true;
  if (run.pausedAt !== null) resumeRun(now);
  startRun(now);

  // Match the printed character to the illustrated keyboard even on a remapped layout.
  const expectedSymbol = slot.symbol;
  const typo = character !== expectedSymbol;
  animateKey(typed.key, event, typo);
  sounds.play(typo);
  writeCharacter(character, typed.key);

  if (!typo && character === "\n") performAutoIndent();

  if (run.cursor === slots.length) {
    finishRun("Passage complete", now);
    return;
  }

  if (typo) {
    lastErrorHintAt = now + 950;
    const expectedGuide = getGuide(expectedSymbol);
    const fingerText = expectedGuide ? fingerNames[expectedGuide.key.finger] : "Home row";
    const notice = `Pressed ${formatKeyLabel(character)} · Expected ${formatKeyLabel(expectedSymbol)} (${fingerText})`;
    updateCursor();
    updateGuide(slots[run.cursor]?.symbol, notice);
  } else {
    lastErrorHintAt = 0;
    updateCursor();
  }
  updateMetrics(now);
}

// ============================================================================
// Event Wiring
// ============================================================================
for (const button of modeButtons) {
  button.addEventListener("click", () => selectMode(button.dataset.mode));
}

for (const button of durationButtons) {
  button.addEventListener("click", () => selectDuration(button.dataset.duration));
}

view.difficulty.addEventListener("change", () => {
  overridePassage = null;
  loadChoices();
  passageIndex = mode === "random" ? chooseRandom(passage) : 0;
  loadPassage(true);
});

view["passage-choice"].addEventListener("change", event => {
  if (event.target.value === "__custom__") {
    openCustomModal();
    return;
  }
  overridePassage = null;
  passageIndex = Number(event.target.value);
  loadPassage(true);
});

view["toggle-auto-indent"].addEventListener("click", () => {
  autoIndent = !autoIndent;
  savePrefs();
  syncToggleButtons();
  if (autoIndent && run?.started === null) performAutoIndent();
  updateCursor();
  view.passage.focus({ preventScroll: true });
});

view["toggle-skip-setup"].addEventListener("click", () => {
  skipSetup = !skipSetup;
  savePrefs();
  syncToggleButtons();
  loadPassage(true);
});

view["toggle-caret"].addEventListener("click", () => {
  barCaret = !barCaret;
  savePrefs();
  syncToggleButtons();
  updateCaret();
  view.passage.focus({ preventScroll: true });
});

view["toggle-zen"].addEventListener("click", () => {
  zenActive = !zenActive;
  savePrefs();
  syncToggleButtons();
  view.passage.focus({ preventScroll: true });
});

view["resume-focus"].addEventListener("click", () => {
  view["focus-overlay"].hidden = true;
  if (run?.pausedAt !== null) resumeRun(performance.now());
  view.passage.focus({ preventScroll: true });
});

view["focus-overlay"].addEventListener("click", () => {
  view["focus-overlay"].hidden = true;
  if (run?.pausedAt !== null) resumeRun(performance.now());
  view.passage.focus({ preventScroll: true });
});

view.passage.addEventListener("blur", () => {
  hands.clear();
  if (run?.started !== null && run.ended === null && view.results.hidden &&
    view["command-palette"].hidden && view["custom-modal"].hidden) {
    pauseRun("Click or press any key to resume");
  }
});

view.passage.addEventListener("focus", () => {
  view["focus-overlay"].hidden = true;
});

view.restart.addEventListener("click", () => {
  overridePassage = null;
  restoreDurationIfNeeded();
  loadPassage(true);
});

view["finish-run"].addEventListener("click", () => {
  if (run?.started !== null && run.ended === null) {
    finishRun("Session finished", performance.now());
  }
});

view.retry.addEventListener("click", () => loadPassage(true));

view["result-close"].addEventListener("click", () => {
  view.results.hidden = true;
});

view["result-next"].addEventListener("click", () => {
  overridePassage = null;
  restoreDurationIfNeeded();
  passageIndex = mode === "random" ? chooseRandom(passage) : (passageIndex + 1) % options.length;
  loadPassage(true);
});

view.next.addEventListener("click", () => {
  overridePassage = null;
  restoreDurationIfNeeded();
  passageIndex = mode === "random" ? chooseRandom(passage) : (passageIndex + 1) % options.length;
  loadPassage(true);
});

view["practice-missed"].addEventListener("click", () => {
  const missed = [...run.missedChars.keys()];
  const drill = generateRandomDrill({
    kind: passage.kind,
    level: view.difficulty.value,
    missedKeys: missed
  });
  overridePassage = drill;
  if (duration !== 30_000) savedDuration = duration;
  duration = 30_000;
  for (const item of durationButtons) item.setAttribute("aria-pressed", "false");
  loadPassage(true);
});

view["run-example"].addEventListener("click", event => {
  terminal.run(passage.text, event.currentTarget, { isTyped: false });
});

view["run-typed"].addEventListener("click", event => {
  const source = slots.slice(0, run.cursor).map(slot => slot.entered).join("");
  terminal.run(source, event.currentTarget, { isTyped: true, expectedSource: passage.text });
});

// Command Palette & Custom Modal events
view["open-palette"].addEventListener("click", openPalette);
view["palette-search"].addEventListener("input", () => {
  paletteSelected = 0;
  renderPalette();
});
view["command-palette"].addEventListener("click", event => {
  if (event.target === view["command-palette"]) closePalette(true);
});

view["open-custom"].addEventListener("click", openCustomModal);
view["custom-close"].addEventListener("click", () => closeCustomModal(true));
view["custom-cancel"].addEventListener("click", () => closeCustomModal(true));
view["custom-save"].addEventListener("click", submitCustomPassage);
view["custom-modal"].addEventListener("click", event => {
  if (event.target === view["custom-modal"]) closeCustomModal(true);
});

// Gently wake dimmed top chrome while mouse moves
document.addEventListener("mousemove", () => {
  if (!document.body.classList.contains("is-typing") && !document.body.classList.contains("zen-active")) return;
  document.body.classList.add("chrome-awake");
  clearTimeout(awakeTimer);
  awakeTimer = setTimeout(() => document.body.classList.remove("chrome-awake"), 1800);
});

new ResizeObserver(() => updateCaret()).observe(view.passage);

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", event => hands.up(event.code));
document.addEventListener("visibilitychange", () => {
  if (document.hidden && run?.started !== null && run.ended === null) pauseRun();
  else tick();
});
window.addEventListener("blur", () => {
  hands.clear();
  if (run?.started !== null && run.ended === null && view.results.hidden) pauseRun();
});

loadPrefs();
loadChoices();
loadPassage();
updateProgressChrome();
