"use strict";

const keyboardWidth = 1000;
const keyboardHeight = 426;

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
      element.dataset.keyCode = code;
      if (homeCodes.has(code)) element.classList.add("home");
      if (code === "KeyF" || code === "KeyJ") element.classList.add("anchor");
      element.style.cssText = `left:${x / keyboardWidth * 100}%;top:${y / keyboardHeight * 100}%;width:${width / keyboardWidth * 100}%;height:${47 / keyboardHeight * 100}%`;
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

const heightProjection = .32;
const restingHeight = 12;
const pressingHeight = 3;
const fingerShapes = [
  { name: "P", knuckle: [-105, 244], lengths: [47, 28, 21] },
  { name: "R", knuckle: [-62, 238], lengths: [56, 32, 24] },
  { name: "M", knuckle: [-17, 231], lengths: [60, 35, 26] },
  { name: "I", knuckle: [34, 231], lengths: [55, 33, 24] },
  { name: "T", knuckle: [65, 322], lengths: [41, 34, 25] }
];

function keyContact(key, resting = false) {
  if (key.code === "Space") return [518, key.y + (resting ? 18 : 34)];
  if (key.code === "ShiftLeft") return [132, key.y + 32];
  if (key.code === "ShiftRight") return [867, key.y + 32];
  return [key.x + key.width / 2, key.y + (resting ? 29 : 34)];
}

function createHand(side, homeKeys) {
  const homeRowArc = [7, -1, -5, 2];
  const rest = homeKeys.map((code, index) => {
    const [x, y] = keyContact(physicalKeys.get(code), true);
    return [x, y + homeRowArc[index]];
  });
  const center = (rest[0][0] + rest[3][0]) / 2;
  const sign = side === "L" ? 1 : -1;
  rest.push([center + sign * 126, 257]);
  return {
    center, sign, pose: [0, 0, 0],
    fingers: fingerShapes.map((shape, i) => {
      const [x, y] = rest[i];
      const home = [sign * (x - center), y];
      const finger = { ...shape, id: side + shape.name, home, rest: [x, y], contact: [...home, restingHeight] };
      finger.restJoints = projectFinger(finger);
      return finger;
    })
  };
}

function handPoint(hand, [x, y], pose = hand.pose) {
  const [dx, dy, angle] = pose;
  const localX = x * hand.sign;
  const localY = y - 270;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [hand.center + dx + localX * cos - localY * sin, 270 + dy + localX * sin + localY * cos];
}

function handLocalPoint(hand, [x, y]) {
  const [dx, dy, angle] = hand.pose;
  const translatedX = x - hand.center - dx;
  const translatedY = y - 270 - dy;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    hand.sign * (translatedX * cos + translatedY * sin),
    270 - translatedX * sin + translatedY * cos
  ];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function moveToward(point, target, amount, thirdTolerance = .22) {
  let moving = false;
  for (let i = 0; i < point.length; i++) {
    const distance = target[i] - point[i];
    const threshold = i === 2 ? thirdTolerance : .22;
    if (Math.abs(distance) <= threshold || amount === 1) {
      point[i] = target[i];
    } else {
      point[i] += distance * amount;
      moving = true;
    }
  }
  return moving;
}

function along(point, direction, distance) {
  return point.map((coordinate, i) => coordinate + direction[i] * distance);
}

function inTypingPlane(from, to) {
  const [dx, dy, dz] = to.map((coordinate, i) => coordinate - from[i]);
  const horizontal = Math.hypot(dx, dy);
  const distance = Math.hypot(horizontal, dz);
  if (horizontal < .001) {
    return { distance, direction: [0, 0, dz >= 0 ? 1 : -1], up: [0, -1, 0] };
  }
  return {
    distance,
    direction: [dx / distance, dy / distance, dz / distance],
    up: [-dx * dz / (horizontal * distance), -dy * dz / (horizontal * distance), horizontal / distance]
  };
}

// Solve three fixed-length bones in the plane facing the key. The middle joint
// arches above the keyboard, so shorter reaches curve instead of shrinking.
function fingerJoints(root, contact, [first, second, third]) {
  const tip = [contact[0], contact[1] + contact[2] * heightProjection, contact[2]];
  const plane = inTypingPlane(root, tip);
  const length = first + second + third;
  const curl = clamp((1 - plane.distance / length) * 1.7, .025, .84);
  const tail = Math.hypot(second + third * Math.cos(curl), third * Math.sin(curl));
  const reach = clamp(plane.distance, Math.abs(first - tail) + .1, first + tail - .1);
  const end = along(root, plane.direction, reach);
  const forward = (first ** 2 + reach ** 2 - tail ** 2) / (2 * reach);
  const bend = Math.sqrt(Math.max(0, first ** 2 - forward ** 2));
  const middle = along(along(root, plane.direction, forward), plane.up, bend);
  const tailPlane = inTypingPlane(middle, end);
  const tailForward = (second ** 2 + tail ** 2 - third ** 2) / (2 * tail);
  const tailBend = Math.sqrt(Math.max(0, second ** 2 - tailForward ** 2));
  const distal = along(along(middle, tailPlane.direction, tailForward), tailPlane.up, tailBend);
  return [root, middle, distal, end];
}

function projectFinger(finger) {
  const [x, y] = finger.knuckle;
  const height = finger.name === "T" ? 16 : 25;
  return fingerJoints([x, y + height * heightProjection, height], finger.contact, finger.lengths)
    .map(([jointX, jointY, jointZ]) => [jointX, jointY - jointZ * heightProjection]);
}

class HandDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.artwork = new HandArtwork(canvas, document.getElementById("hand-illustration"), () => this.schedule());
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.hands = [
      createHand("L", ["KeyA", "KeyS", "KeyD", "KeyF"]),
      createHand("R", ["Semicolon", "KeyL", "KeyK", "KeyJ"])
    ];
    this.presses = new Map();
    this.expected = new Set();
    this.frame = null;
    this.lastFrame = null;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
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
    press.release = Math.max(performance.now(), press.at + 105);
    this.schedule();
  }

  clear() {
    for (const { key } of this.presses.values()) key.element.classList.remove("pressed", "wrong");
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
    const elapsed = clamp(time - (this.lastFrame ?? time), 8, 32);
    this.lastFrame = time;
    const pressedFingers = new Map();
    let keepMoving = false;
    for (const [code, press] of this.presses) {
      const active = time < press.release;
      press.key.element.classList.toggle("pressed", active);
      press.key.element.classList.toggle("wrong", active && press.wrong);
      if (active) {
        const previous = pressedFingers.get(press.key.finger);
        if (!previous || previous.at <= press.at) pressedFingers.set(press.key.finger, press);
        if (Number.isFinite(press.release)) keepMoving = true;
      } else {
        this.presses.delete(code);
      }
    }

    const fingers = this.hands.map(hand => {
      const pose = this.poseHand(hand, pressedFingers, elapsed);
      if (pose.moving) keepMoving = true;
      return pose.digits;
    });
    this.artwork.draw(this.hands, fingers);
    if (keepMoving) {
      this.schedule();
    } else {
      this.lastFrame = null;
    }
  }

  poseHand(hand, pressedFingers, elapsed) {
    let reach = null;
    for (const finger of hand.fingers) {
      const press = pressedFingers.get(finger.id);
      if (press && (!reach || reach.press.at <= press.at)) reach = { finger, press };
    }

    const desiredPose = [0, 0, 0];
    if (reach) {
      const [x, y] = keyContact(reach.press.key);
      const dx = x - reach.finger.rest[0];
      const dy = y - reach.finger.rest[1];
      desiredPose[0] = dx * .68;
      desiredPose[1] = dy * (dy < 0 ? .76 : .49);
      desiredPose[2] = clamp(dx * .00052, -.075, .075);

      // Move the palm enough to leave some bend in the finger at far keys.
      const [knuckleX, knuckleY] = handPoint(hand, reach.finger.knuckle, desiredPose);
      const distance = Math.hypot(x - knuckleX, y - knuckleY);
      const comfortableReach = reach.finger.lengths.reduce((total, bone) => total + bone, 0) * .89;
      if (distance > comfortableReach) {
        const adjustment = 1 - comfortableReach / distance;
        desiredPose[0] += (x - knuckleX) * adjustment;
        desiredPose[1] += (y - knuckleY) * adjustment;
      }
    }

    const easing = duration => this.motion.matches ? 1 : 1 - Math.exp(-elapsed / duration);
    let moving = moveToward(hand.pose, desiredPose, easing(reach ? 21 : 46), .0002);
    const digits = hand.fingers.map(finger => {
      const press = pressedFingers.get(finger.id);
      const target = press
        ? [...handLocalPoint(hand, keyContact(press.key)), pressingHeight]
        : [...finger.home, restingHeight];
      if (moveToward(finger.contact, target, easing(press ? 17 : 33))) moving = true;
      const tone = press?.wrong ? -1 : press || this.expected.has(finger.id) ? 1 : 0;
      return { joints: projectFinger(finger), tone };
    });
    return { digits, moving };
  }
}
