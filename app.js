"use strict";

const view = Object.fromEntries([
  "kind", "passage-title", "passage", "progress", "progress-label", "accuracy", "lesson-link",
  "keyboard", "hands", "finger-name", "next-keys", "feedback", "restart", "next"
].map(id => [id, document.getElementById(id)]));

addKeys(view.keyboard);
const hands = new HandDisplay(view.hands);
const modeButtons = [...document.querySelectorAll("[data-mode]")];
let mode = "mixed";
let passageIndex = 0;
let passage;
let characters = [];
let cursor = 0;
let attempts = 0;
let expectedKeys = [];

function buildPassage() {
  const fragment = document.createDocumentFragment();
  const isCode = passage.kind === "python";
  const accessibleText = document.createElement("span");
  accessibleText.className = "visually-hidden";
  accessibleText.textContent = passage.text;
  fragment.append(accessibleText);
  const groups = isCode ? passage.text.split("\n") : passage.text.match(/\S+| +/g);
  characters = [];
  groups.forEach((group, index) => {
    const segment = document.createElement("span");
    segment.setAttribute("aria-hidden", "true");
    if (!isCode && group.trim()) segment.className = "word";
    if (isCode && group.trimStart().startsWith("#")) segment.className = "comment";
    for (const character of group) {
      const item = document.createElement("span");
      item.className = "character";
      item.textContent = character;
      if (character === " ") {
        item.style.whiteSpace = "pre";
        item.dataset.marker = "·";
      }
      characters.push(item);
      segment.append(item);
    }

    if (isCode && index < groups.length - 1) {
      const newline = document.createElement("span");
      newline.className = "character newline";
      newline.textContent = "↵";
      characters.push(newline);
      segment.append(newline, "\n");
    }

    fragment.append(segment);
  });
  view.passage.replaceChildren(fragment);
  view.passage.classList.toggle("is-code", isCode);
  view.passage.scrollTop = 0;
  view.passage.scrollLeft = 0;
}

function loadPassage(focus = false) {
  passage = passageGroups[mode][passageIndex];
  cursor = 0;
  attempts = 0;
  hands.clear();
  view.kind.textContent = passage.kind === "python" ? "Python" : "English";
  view.kind.classList.toggle("python", passage.kind === "python");
  view["passage-title"].textContent = passage.title;
  view["lesson-link"].hidden = !passage.chapter;
  if (passage.chapter) {
    view["lesson-link"].href = lessonBaseUrl + passage.chapter;
  } else {
    view["lesson-link"].removeAttribute("href");
  }
  buildPassage();
  setFeedback("Type the highlighted character to begin.");
  updateStats();
  updateGuide();
  if (focus) view.passage.focus({ preventScroll: true });
}

function updateGuide() {
  for (const key of expectedKeys) key.element.classList.remove("expected");
  expectedKeys = [];
  view["next-keys"].replaceChildren();
  const current = characters[cursor];
  const guide = getGuide(passage.text[cursor]);
  if (!guide || !current) {
    view["finger-name"].textContent = "Passage complete";
    view["next-keys"].setAttribute("aria-label", "No next key");
    hands.guide(expectedKeys);
    return;
  }

  current.classList.add("current");
  const { key, shift } = guide;
  expectedKeys = shift ? [shift, key] : [key];
  for (const expected of expectedKeys) expected.element.classList.add("expected");
  view["finger-name"].textContent = shift
    ? `${fingerNames[shift.finger]} on Shift · ${fingerNames[key.finger]}`
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
  keepCurrentVisible(current);
}

function keepCurrentVisible(current) {
  const area = view.passage.getBoundingClientRect();
  const position = current.getBoundingClientRect();
  if (position.bottom > area.bottom - 12) {
    view.passage.scrollTop += position.bottom - area.bottom + 24;
  } else if (position.top < area.top + 7) {
    view.passage.scrollTop -= area.top + 10 - position.top;
  }
  if (position.right > area.right - 12) {
    view.passage.scrollLeft += position.right - area.right + 18;
  } else if (position.left < area.left + 8) {
    view.passage.scrollLeft -= area.left + 12 - position.left;
  }
}

function updateStats() {
  view.progress.value = cursor / passage.text.length;
  view["progress-label"].textContent = `${Math.floor(view.progress.value * 100)}%`;
  view.accuracy.textContent = attempts ? `Accuracy ${Math.round(cursor / attempts * 100)}%` : "Accuracy —";
}

function setFeedback(message, type = "") {
  if (view.feedback.textContent !== message) view.feedback.textContent = message;
  view.feedback.className = type ? `feedback ${type}` : "feedback";
}

function keyDown(event) {
  if (event.target.closest?.("button, a, input, textarea, select, [contenteditable]") ||
    event.metaKey || event.ctrlKey || event.altKey || event.isComposing || cursor >= characters.length) return;

  const physicalKey = physicalKeys.get(event.code);
  if (event.key === "Shift") {
    if (physicalKey && !event.repeat) hands.down(physicalKey);
    return;
  }

  const character = event.key === "Enter" ? "\n" : event.key;
  if (character.length !== 1) return;
  const typed = getGuide(character);
  if (!typed) return;

  event.preventDefault();
  if (event.repeat) return;
  const matches = character === passage.text[cursor];
  // Use the character's US QWERTY key for the illustration, including when
  // a remapped key or the numeric keypad produced that character.
  hands.down(typed.key, !matches);
  if (event.code !== typed.key.code) hands.up(typed.key.code);

  if (document.activeElement === document.body) view.passage.focus({ preventScroll: true });
  attempts += 1;
  const current = characters[cursor];
  if (matches) {
    current.classList.remove("current", "error");
    current.classList.add("correct");
    cursor += 1;
    updateGuide();
    if (cursor === characters.length) {
      setFeedback("Passage complete. Choose Next passage to continue.", "complete");
    } else {
      setFeedback("");
    }
  } else {
    current.classList.add("error");
    setFeedback("Try the highlighted character again.", "error");
  }
  updateStats();
}

modeButtons.forEach(button => button.addEventListener("click", () => {
  if (mode !== button.dataset.mode) {
    mode = button.dataset.mode;
    passageIndex = 0;
    for (const option of modeButtons) option.setAttribute("aria-pressed", String(option === button));
    loadPassage(true);
  } else {
    view.passage.focus({ preventScroll: true });
  }
}));

view.restart.addEventListener("click", () => loadPassage(true));
view.next.addEventListener("click", () => {
  passageIndex = (passageIndex + 1) % passageGroups[mode].length;
  loadPassage(true);
});
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", event => hands.up(event.code));
window.addEventListener("blur", () => hands.clear());
loadPassage();
