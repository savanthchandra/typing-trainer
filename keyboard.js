"use strict";

const fingerNames = {
  LP: "Left pinky", LR: "Left ring finger", LM: "Left middle finger", LI: "Left index finger", LT: "Left thumb",
  RP: "Right pinky", RR: "Right ring finger", RM: "Right middle finger", RI: "Right index finger", RT: "Right thumb"
};
const physicalKeys = new Map();
const characterKeys = new Map();
const homeCodes = new Set(["KeyA", "KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL", "Semicolon"]);
const rowLabels = [
  [
    ["Backquote", "`", "~", "LP"],
    ["Digit1", "1", "!", "LP"], ["Digit2", "2", "@", "LR"], ["Digit3", "3", "#", "LM"],
    ["Digit4", "4", "$", "LI"], ["Digit5", "5", "%", "LI"], ["Digit6", "6", "^", "RI"],
    ["Digit7", "7", "&", "RI"], ["Digit8", "8", "*", "RM"], ["Digit9", "9", "(", "RR"],
    ["Digit0", "0", ")", "RP"], ["Minus", "-", "_", "RP"], ["Equal", "=", "+", "RP"],
    ["Backspace", "Backspace", "", "RP", 2]
  ],
  [
    ["Tab", "Tab", "", "LP", 1.5],
    ...letterRow("QWERTYUIOP", "LP LR LM LI LI RI RI RM RR RP"),
    ["BracketLeft", "[", "{", "RP"], ["BracketRight", "]", "}", "RP"],
    ["Backslash", "\\", "|", "RP", 1.5]
  ],
  [
    ["CapsLock", "Caps", "", "LP", 1.75],
    ...letterRow("ASDFGHJKL", "LP LR LM LI LI RI RI RM RR"),
    ["Semicolon", ";", ":", "RP"], ["Quote", "'", '"', "RP"], ["Enter", "Enter", "", "RP", 2.25, "\n"]
  ],
  [
    ["ShiftLeft", "Shift", "", "LP", 2.25],
    ...letterRow("ZXCVBNM", "LP LR LM LI LI RI RI"),
    ["Comma", ",", "<", "RM"], ["Period", ".", ">", "RR"], ["Slash", "/", "?", "RP"],
    ["ShiftRight", "Shift", "", "RP", 2.75]
  ],
  [
    ["ControlLeft", "Ctrl", "", "LP", 1.25], ["MetaLeft", "Cmd", "", "LT", 1.25], ["AltLeft", "Alt", "", "LT", 1.25],
    ["Space", "Space", "", "RT", 7.5, " "],
    ["AltRight", "Alt", "", "RT", 1.25], ["MetaRight", "Cmd", "", "RT", 1.25], ["ControlRight", "Ctrl", "", "RP", 1.25]
  ]
];

function letterRow(letters, fingers) {
  const fingerCodes = fingers.split(" ");
  return [...letters].map((letter, index) => [`Key${letter}`, letter.toLowerCase(), letter, fingerCodes[index]]);
}

function addKeys(keyboard) {
  const unit = 63.5;
  const gap = 6;
  rowLabels.forEach((row, rowIndex) => {
    let x = 27;
    const y = 23 + 54 * rowIndex;
    for (const [code, label, shifted, finger, units = 1, character = label] of row) {
      const width = unit * units - gap;
      const key = { code, label, shifted, finger, x, y, width };
      const element = document.createElement("div");
      element.className = "key";
      if (homeCodes.has(code)) element.classList.add("home");
      if (code === "KeyF" || code === "KeyJ") element.classList.add("anchor");
      element.style.cssText = `left:${x / 10}%;top:${y / 3.76}%;width:${width / 10}%;height:${47 / 3.76}%`;
      element.textContent = code.startsWith("Key") ? shifted : label;
      if (shifted && !code.startsWith("Key")) {
        const symbol = document.createElement("small");
        symbol.textContent = shifted;
        element.append(symbol);
      }
      key.element = element;
      keyboard.append(element);
      physicalKeys.set(code, key);
      if (character.length === 1) characterKeys.set(character, { key, needsShift: false });
      if (shifted) characterKeys.set(shifted, { key, needsShift: true });
      x += unit * units;
    }
  });
}

function getGuide(character) {
  const entry = characterKeys.get(character);
  if (!entry) return null;
  const { key, needsShift } = entry;
  const shift = needsShift ? physicalKeys.get(key.finger.startsWith("L") ? "ShiftRight" : "ShiftLeft") : null;
  return { key, shift };
}

function fingerTarget(key) {
  if (key.code === "Space") return [563, key.y + 29];
  if (key.code === "ShiftLeft") return [135, key.y + 25];
  if (key.code === "ShiftRight") return [864, key.y + 25];
  return [key.x + key.width / 2, key.y + 31];
}

class HandDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.hands = [
      { side: "L", center: 262, sign: 1, keys: ["KeyA", "KeyS", "KeyD", "KeyF"] },
      { side: "R", center: 680, sign: -1, keys: ["Semicolon", "KeyL", "KeyK", "KeyJ"] }
    ];
    this.fingers = new Map();
    this.presses = new Map();
    this.expected = new Set();
    this.frame = null;
    for (const hand of this.hands) {
      hand.fingers = hand.keys.map((code, index) => {
        const finger = hand.side + "PRMI"[index];
        const home = fingerTarget(physicalKeys.get(code));
        const joint = [hand.center + hand.sign * [-81, -34, 15, 64][index], [258, 245, 241, 248][index]];
        return this.addFinger(finger, home, joint, [22, 25, 27, 28][index]);
      });
      const thumbHome = hand.side === "L" ? [438, 264] : [563, 268];
      hand.fingers.push(this.addFinger(hand.side + "T", thumbHome, [hand.center + hand.sign * 76, 304], 29));
    }
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  addFinger(id, home, joint, width) {
    const finger = { id, home, joint, width, point: [...home] };
    this.fingers.set(id, finger);
    return finger;
  }

  resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * scale));
    this.canvas.height = Math.max(1, Math.round(this.canvas.clientHeight * scale));
    this.draw(performance.now());
  }

  guide(keys) {
    this.expected = new Set(keys.map(key => key.finger));
    this.schedule();
  }

  down(key, wrong = false) {
    this.presses.set(key.code, { key, wrong, at: performance.now(), release: Infinity });
    this.schedule();
  }

  up(code) {
    const press = this.presses.get(code);
    if (!press) return;
    press.release = Math.max(performance.now(), press.at + 95);
    this.schedule();
  }

  clear() {
    for (const press of this.presses.values()) press.key.element.classList.remove("pressed", "wrong");
    this.presses.clear();
    this.schedule();
  }

  schedule() {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(time => {
      this.frame = null;
      this.draw(time);
    });
  }

  draw(time) {
    const ctx = this.context;
    const pressedFingers = new Map();
    let keepMoving = false;
    for (const [code, press] of this.presses) {
      const active = time < press.release;
      press.key.element.classList.toggle("pressed", active);
      press.key.element.classList.toggle("wrong", active && press.wrong);
      if (!active) {
        this.presses.delete(code);
      } else {
        pressedFingers.set(press.key.finger, press);
        keepMoving ||= Number.isFinite(press.release);
      }
    }

    ctx.setTransform(this.canvas.width / 1000, 0, 0, this.canvas.height / 376, 0, 0);
    ctx.clearRect(0, 0, 1000, 376);
    for (const hand of this.hands) this.drawPalm(hand);
    for (const finger of this.fingers.values()) {
      const press = pressedFingers.get(finger.id);
      const expected = this.expected.has(finger.id);
      const target = press ? fingerTarget(press.key) : finger.home;
      const eased = this.motion.matches ? 1 : press ? .51 : .31;
      finger.point = finger.point.map((coord, axis) => {
        const distance = target[axis] - coord;
        if (Math.abs(distance) < .6) return target[axis];
        keepMoving = true;
        return coord + distance * eased;
      });
      this.drawFinger(finger, press, expected);
    }
    if (keepMoving) this.schedule();
  }

  drawPalm({ center, sign }) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(center, 0);
    ctx.scale(sign, 1);
    const gradient = ctx.createLinearGradient(0, 226, 0, 373);
    gradient.addColorStop(0, "rgba(150,126,220,.35)");
    gradient.addColorStop(.67, "rgba(120,97,184,.43)");
    gradient.addColorStop(1, "rgba(96,73,143,.53)");
    ctx.beginPath();
    ctx.moveTo(-54, 365);
    ctx.bezierCurveTo(-51, 337, -91, 308, -93, 279);
    ctx.bezierCurveTo(-98, 244, -57, 237, -34, 234);
    ctx.bezierCurveTo(3, 225, 61, 227, 79, 253);
    ctx.bezierCurveTo(98, 278, 112, 290, 95, 316);
    ctx.bezierCurveTo(77, 335, 62, 342, 59, 365);
    ctx.quadraticCurveTo(4, 375, -54, 365);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(193,173,251,.44)";
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-56, 330);
    ctx.quadraticCurveTo(-7, 343, 55, 331);
    ctx.moveTo(10, 273);
    ctx.quadraticCurveTo(44, 269, 58, 290);
    ctx.strokeStyle = "rgba(197,181,250,.16)";
    ctx.stroke();
    ctx.restore();
  }

  drawFinger(finger, press, expected) {
    const ctx = this.context;
    const [x, y] = finger.point;
    const [jx, jy] = finger.joint;
    const color = press?.wrong ? "#ff9ba7" : press ? "#a5f0cb" : expected ? "#d7c7ff" : "#ad94e4";
    const fill = press?.wrong ? "rgba(218,112,137,.60)" : press ? "rgba(117,216,172,.54)" :
      expected ? "rgba(183,155,247,.54)" : "rgba(156,128,220,.34)";

    ctx.beginPath();
    ctx.moveTo(jx, jy);
    ctx.quadraticCurveTo(jx + (x - jx) * .39, y + (jy - y) * .53, x, y);
    ctx.lineCap = "round";
    ctx.lineWidth = finger.width + .7;
    ctx.strokeStyle = color;
    ctx.globalAlpha = press || expected ? .81 : .56;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = finger.width - 2.7;
    ctx.strokeStyle = "#272739";
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, press || expected ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (press || expected) {
      ctx.beginPath();
      ctx.arc(x, y, finger.width * .59, 0, Math.PI * 2);
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
}
