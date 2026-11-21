"use strict";

let duration = 60_000;
const indentationWidth = 4;
const view = Object.fromEntries([
  "passage", "progress", "lesson-link", "keyboard", "hands", "finger-name", "next-keys",
  "restart", "next", "retry", "passage-choice", "line-count", "cursor-position", "time",
  "time-fill", "timer-card", "wpm", "cpm", "accuracy", "results", "result-title",
  "result-summary", "session-status", "difficulty", "level-control", "passage-kind",
  "terminal", "run-example", "run-typed", "click-sound", "preview-sound", "indent-help", "python-run-controls"
].map(id => [id, document.getElementById(id)]));

const pythonKeywords = new Set((
  "False None True and as assert async await break class continue def del elif else except " +
  "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield"
).split(" "));
const tokenPattern = /(?<comment>#[^\n]*)|(?<string>(?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(?<number>\b\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?[\d_]+)?\b)|(?<name>\b[A-Za-z_]\w*\b)|(?<symbol>[^\s])/g;

addKeys(view.keyboard);
const hands = new HandDisplay(view.hands);
const sounds = new TypingSounds(view["click-sound"], view["preview-sound"]);
const terminal = new PythonTerminal(view.terminal, view["run-example"], view["run-typed"]);
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const durationButtons = [...document.querySelectorAll("[data-duration]")];
let mode = "python";
let options = [];
let passageIndex = 0;
let passage;
let slots = [];
let lastPosition;
let run;
let ticker;
let activeSlot = null;
let expectedKeys = [];

function loadChoices() {
  const python = codingPassages.filter(exercise => exercise.level === view.difficulty.value);
  options = mode === "english" ? englishPassages : mode === "python" ? python : [...englishPassages, ...python];
  view["passage-choice"].replaceChildren();
  for (const [index, exercise] of options.entries()) {
    const choice = document.createElement("option");
    choice.value = index;
    choice.textContent = exercise.file;
    view["passage-choice"].append(choice);
  }
  view["level-control"].hidden = mode === "english";
}

function chooseRandom(avoid = null) {
  const kind = Math.random() < .5 ? "english" : "python";
  const fromKind = options.filter(exercise => exercise.kind === kind && exercise !== avoid);
  return options.indexOf(fromKind[Math.floor(Math.random() * fromKind.length)]);
}

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
    item.classList.add("indent-guide");
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
    for (const word of paragraph.match(/\S+| +/g)) {
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
  const source = document.createElement("div");
  source.className = "source";
  source.setAttribute("aria-hidden", "true");
  slots = [];
  if (passage.kind === "python") addCodeLines(source);
  else addEnglishParagraphs(source);
  view.passage.classList.toggle("english-passage", passage.kind === "english");
  view.passage.replaceChildren(accessibleText, source);
  view.passage.scrollTop = 0;
  view.passage.scrollLeft = 0;
}

function loadPassage(focus = false) {
  clearInterval(ticker);
  ticker = undefined;
  run = { cursor: 0, correct: 0, attempts: 0, hits: 0, started: null, ended: null };
  passage = options[passageIndex];
  const isPython = passage.kind === "python";
  view["passage-choice"].value = passageIndex;
  view["passage-kind"].textContent = isPython ? "py" : "EN";
  view["lesson-link"].hidden = !isPython;
  view["indent-help"].hidden = !isPython;
  if (isPython) view["lesson-link"].href = lessonBaseUrl + passage.chapter;
  else view["lesson-link"].removeAttribute("href");
  view["time-fill"].max = duration / 1000;
  terminal.reset();
  view["python-run-controls"].hidden = !isPython;
  view.results.hidden = true;
  view["session-status"].textContent = "Ready";
  activeSlot = null;
  hands.clear();
  buildPassage();
  updateCursor();
  updateMetrics();
  if (focus) view.passage.focus({ preventScroll: true });
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
  view.progress.textContent = run.started === null ? "Type to start" : Math.floor(run.cursor / slots.length * 100) + "% typed";

  if (activeSlot) {
    activeSlot.item.classList.add("current");
    activeSlot.row.classList.add("current-line");
    keepCurrentVisible(activeSlot);
  }
  updateGuide(activeSlot?.symbol);
}

function updateGuide(character) {
  for (const previous of expectedKeys) previous.element.classList.remove("expected");
  expectedKeys = [];
  view["next-keys"].replaceChildren();
  const guide = getGuide(character);
  if (!guide) {
    view["finger-name"].textContent = "Ready for another run";
    view["next-keys"].setAttribute("aria-label", "No next key");
    hands.guide(expectedKeys);
    return;
  }

  const { key, shift } = guide;
  expectedKeys = shift ? [shift, key] : [key];
  for (const expected of expectedKeys) expected.element.classList.add("expected");
  view["finger-name"].textContent = shift
    ? fingerNames[shift.finger] + " on Shift · " + fingerNames[key.finger]
    : fingerNames[key.finger];
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
  const area = view.passage.getBoundingClientRect();
  const position = item.getBoundingClientRect();
  if (position.bottom > area.bottom - 13) {
    view.passage.scrollTop += position.bottom - area.bottom + 27;
  } else if (position.top < area.top + 8) {
    view.passage.scrollTop -= area.top + 12 - position.top;
  }
  if (passage.kind === "english") return;
  const left = area.left + row.firstElementChild.getBoundingClientRect().width;
  if (position.right > area.right - 13) {
    view.passage.scrollLeft += position.right - area.right + 20;
  } else if (position.left < left + 7) {
    view.passage.scrollLeft -= left + 11 - position.left;
  }
}

function updateMetrics(now = performance.now()) {
  const elapsed = run.started === null ? 0 : Math.min(duration, (run.ended ?? now) - run.started);
  const seconds = Math.ceil((duration - elapsed) / 1000);
  const minutes = Math.max(elapsed, 1000) / 60_000;
  const wpm = elapsed ? Math.round(run.correct / 5 / minutes) : 0;
  const cpm = elapsed ? Math.round(run.attempts / minutes) : 0;
  const accuracy = run.attempts ? Math.round(run.hits / run.attempts * 100) + "%" : "—";
  view.time.textContent = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  view["time-fill"].value = (duration - elapsed) / 1000;
  view["timer-card"].classList.toggle("urgent", seconds > 0 && seconds <= 10 && run.ended === null);
  view.wpm.textContent = wpm;
  view.cpm.textContent = cpm;
  view.accuracy.textContent = accuracy;
  return { wpm, cpm, accuracy };
}

function checkDeadline(now) {
  if (run.ended !== null) return true;
  if (run.started !== null && now >= run.started + duration) {
    finishRun("Time is up", run.started + duration);
    return true;
  }
  return false;
}

function tick() {
  const now = performance.now();
  if (!checkDeadline(now)) updateMetrics(now);
}

function startRun(now) {
  if (run.started !== null) return;
  run.started = now;
  const minutes = duration / 60_000;
  view["session-status"].textContent = minutes + "-minute test started";
  ticker = setInterval(tick, 125);
}

function finishRun(title, now) {
  run.ended = now;
  clearInterval(ticker);
  ticker = undefined;
  hands.clear();
  updateCursor();
  const { wpm, cpm, accuracy } = updateMetrics(now);
  const summary = wpm + " WPM · " + cpm + " CPM · " + accuracy + " accuracy";
  view["result-title"].textContent = title;
  view["result-summary"].textContent = summary;
  view.results.hidden = false;
  view["session-status"].textContent = title + ". " + summary;
  if (document.activeElement === view.passage) view.retry.focus({ preventScroll: true });
}

function writeCharacter(character) {
  const slot = slots[run.cursor];
  const matches = character === slot.symbol;
  slot.entered = character;
  slot.item.classList.add(matches ? "correct" : "error");
  if (!matches) {
    slot.item.textContent = character === "\n" ? "↵" : character === " " ? "·" : character;
  }
  run.cursor += 1;
  run.attempts += 1;
  if (matches) {
    run.correct += 1;
    run.hits += 1;
  }
}

function backspace() {
  if (run.cursor === 0) return;
  const slot = slots[--run.cursor];
  if (slot.entered === slot.symbol) run.correct -= 1;
  slot.entered = null;
  slot.item.classList.remove("correct", "error");
  slot.item.textContent = slot.symbol === "\n" ? "↵" : slot.symbol;
  updateCursor();
  updateMetrics();
}

function animateKey(key, event, error = false) {
  hands.down(key, error);
  if (event.code !== key.code) hands.up(key.code);
}

function keyDown(event) {
  if (event.target.closest?.("button, a, input, textarea, select, [contenteditable]") ||
    event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;

  const focused = document.activeElement === view.passage;
  if (!focused && document.activeElement !== document.body) return;
  if (event.key === "Escape" && focused) {
    event.preventDefault();
    view["passage-choice"].focus({ preventScroll: true });
    return;
  }
  const now = performance.now();
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
    if (run.cursor) {
      animateKey(physicalKeys.get("Backspace"), event);
      sounds.play();
    }
    backspace();
    return;
  }

  if (event.key === "Tab" && event.repeat && focused) {
    event.preventDefault();
    return;
  }
  const slot = slots[run.cursor];
  const canIndent = event.key === "Tab" && !event.shiftKey && focused && slot.column < slot.indent;
  const character = event.key === "Enter" ? "\n" : event.key;
  const typed = getGuide(character);
  if (!canIndent && !typed) return;
  event.preventDefault();
  if (event.repeat) return;

  if (!focused) view.passage.focus({ preventScroll: true });
  startRun(now);
  if (canIndent) {
    animateKey(physicalKeys.get("Tab"), event);
    sounds.play();
    const remaining = Math.min(indentationWidth - slot.column % indentationWidth, slot.indent - slot.column);
    for (let cell = 0; cell < remaining; cell++) writeCharacter(" ");
  } else {
    // Match the printed character to the illustrated keyboard even on a remapped layout.
    const typo = character !== slot.symbol;
    animateKey(typed.key, event, typo);
    sounds.play(typo);
    writeCharacter(character);
  }

  if (run.cursor === slots.length) {
    finishRun("Passage complete", now);
  } else {
    updateCursor();
    updateMetrics(now);
  }
}

for (const button of modeButtons) {
  button.addEventListener("click", () => {
    if (mode === button.dataset.mode) {
      view.passage.focus({ preventScroll: true });
      return;
    }
    mode = button.dataset.mode;
    for (const item of modeButtons) item.setAttribute("aria-pressed", String(item === button));
    loadChoices();
    passageIndex = mode === "random" ? chooseRandom(passage) : 0;
    loadPassage(true);
  });
}

for (const button of durationButtons) {
  button.addEventListener("click", () => {
    const requested = Number(button.dataset.duration) * 60_000;
    if (duration !== requested) {
      duration = requested;
      for (const item of durationButtons) item.setAttribute("aria-pressed", String(item === button));
      loadPassage(true);
    } else {
      view.passage.focus({ preventScroll: true });
    }
  });
}

view.difficulty.addEventListener("change", () => {
  loadChoices();
  passageIndex = mode === "random" ? chooseRandom(passage) : 0;
  loadPassage(true);
});

view["passage-choice"].addEventListener("change", event => {
  passageIndex = Number(event.target.value);
  loadPassage(true);
});
view.restart.addEventListener("click", () => loadPassage(true));
view.retry.addEventListener("click", () => loadPassage(true));
view.next.addEventListener("click", () => {
  passageIndex = mode === "random" ? chooseRandom(passage) : (passageIndex + 1) % options.length;
  loadPassage(true);
});
view["run-example"].addEventListener("click", event => terminal.run(passage.text, event.currentTarget));
view["run-typed"].addEventListener("click", event => {
  const source = slots.slice(0, run.cursor).map(slot => slot.entered).join("");
  terminal.run(source, event.currentTarget);
});
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", event => hands.up(event.code));
document.addEventListener("visibilitychange", tick);
window.addEventListener("blur", () => hands.clear());
loadChoices();
loadPassage();
