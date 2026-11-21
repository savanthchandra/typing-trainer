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
  { name: "P", knuckle: [-105, 244], lengths: [47, 28, 21], width: 42 },
  { name: "R", knuckle: [-62, 238], lengths: [56, 32, 24], width: 48 },
  { name: "M", knuckle: [-17, 231], lengths: [60, 35, 26], width: 50 },
  { name: "I", knuckle: [34, 231], lengths: [55, 33, 24], width: 46 },
  { name: "T", knuckle: [65, 322], lengths: [41, 34, 25], width: 51 }
];

function keyContact(key, resting = false) {
  if (key.code === "Space") return [530, key.y + (resting ? 18 : 34)];
  if (key.code === "ShiftLeft") return [132, key.y + 32];
  if (key.code === "ShiftRight") return [867, key.y + 32];
  return [key.x + key.width / 2, key.y + (resting ? 29 : 34)];
}

function createHand(side, homeKeys) {
  const rest = homeKeys.map(code => keyContact(physicalKeys.get(code), true));
  const center = (rest[0][0] + rest[3][0]) / 2;
  const sign = side === "L" ? 1 : -1;
  rest.push([center + sign * 113, 257]);
  return {
    center, sign, pose: [0, 0, 0],
    fingers: fingerShapes.map((shape, i) => {
      const [x, y] = rest[i];
      const home = [sign * (x - center), y];
      return { ...shape, id: side + shape.name, home, rest: [x, y], contact: [...home, restingHeight] };
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

function fingerOutline(points, width) {
  const radii = [.55, .50, .44, .39].map(ratio => width * ratio);
  const left = [];
  const right = [];
  let direction = [0, -1];
  points.forEach(([x, y], index) => {
    const before = points[Math.max(index - 1, 0)];
    const after = points[Math.min(index + 1, points.length - 1)];
    const distance = Math.hypot(after[0] - before[0], after[1] - before[1]);
    if (distance > .01) direction = [(after[0] - before[0]) / distance, (after[1] - before[1]) / distance];
    const radius = radii[index];
    left.push([x - direction[1] * radius, y + direction[0] * radius]);
    right.push([x + direction[1] * radius, y - direction[0] * radius]);
  });
  right.reverse();
  return { left, right, direction, tipRadius: radii.at(-1) };
}

function traceEdge(ctx, points) {
  ctx.quadraticCurveTo(points[1][0], points[1][1], (points[1][0] + points[2][0]) / 2,
    (points[1][1] + points[2][1]) / 2);
  ctx.quadraticCurveTo(...points[2], ...points[3]);
}

class HandDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
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
    const ctx = this.context;
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

    ctx.setTransform(this.canvas.width / keyboardWidth, 0, 0, this.canvas.height / keyboardHeight, 0, 0);
    ctx.clearRect(0, 0, keyboardWidth, keyboardHeight);
    for (const hand of this.hands) {
      if (this.drawHand(hand, pressedFingers, elapsed)) keepMoving = true;
    }
    if (keepMoving) {
      this.schedule();
    } else {
      this.lastFrame = null;
    }
  }

  drawHand(hand, pressedFingers, elapsed) {
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
    const drawnFingers = hand.fingers.map(finger => {
      const press = pressedFingers.get(finger.id);
      const target = press
        ? [...handLocalPoint(hand, keyContact(press.key)), pressingHeight]
        : [...finger.home, restingHeight];
      if (moveToward(finger.contact, target, easing(press ? 17 : 33))) moving = true;
      const base = handPoint(hand, finger.knuckle);
      const height = finger.name === "T" ? 16 : 25;
      const root = [base[0], base[1] + height * heightProjection, height];
      const contact = [...handPoint(hand, finger.contact), finger.contact[2]];
      const joints = fingerJoints(root, contact, finger.lengths)
        .map(([x, y, z]) => [x, y - z * heightProjection]);
      return { joints, width: finger.width, press, expected: this.expected.has(finger.id) };
    });
    this.drawPalm(hand);
    this.drawWebbing(drawnFingers);
    for (const { joints, width, press, expected } of drawnFingers) {
      this.drawFinger(joints, width, press, expected);
    }
    return moving;
  }

  drawWebbing(fingers) {
    const ctx = this.context;
    const connect = (base, tip, fraction) => [
      base[0] + (tip[0] - base[0]) * fraction,
      base[1] + (tip[1] - base[1]) * fraction
    ];
    for (let i = 0; i < 3; i++) {
      const [first, second] = fingers.slice(i, i + 2).map(finger => finger.joints);
      const firstTip = first.at(-1);
      const secondTip = second.at(-1);
      const spread = Math.hypot(firstTip[0] - secondTip[0], firstTip[1] - secondTip[1]);
      const height = (i === 2 ? .54 : .89) - clamp((spread - 67) / 95, 0, .43);
      const a = connect(first[0], firstTip, height);
      const b = connect(second[0], secondTip, height);
      const dip = Math.max(a[1], b[1]) + (i === 2 ? 23 : 11);
      ctx.beginPath();
      ctx.moveTo(...first[0]);
      ctx.lineTo(...a);
      ctx.bezierCurveTo(a[0] + (b[0] - a[0]) * .32, dip, b[0] - (b[0] - a[0]) * .32, dip, ...b);
      ctx.lineTo(...second[0]);
      ctx.lineTo(second[0][0], second[0][1] + 26);
      ctx.lineTo(first[0][0], first[0][1] + 26);
      ctx.closePath();
      ctx.fillStyle = "#c59182";
      ctx.fill();
    }
  }

  drawPalm(hand) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(hand.center + hand.pose[0], 270 + hand.pose[1]);
    ctx.rotate(hand.pose[2]);
    ctx.scale(hand.sign, 1);
    ctx.translate(0, -270);

    const skin = ctx.createLinearGradient(0, 217, -38, 468);
    skin.addColorStop(0, "#c59182");
    skin.addColorStop(.50, "#c79582");
    skin.addColorStop(.75, "#ad7e6f");
    skin.addColorStop(1, "#7a5a59");
    ctx.beginPath();
    ctx.moveTo(-184, 560);
    ctx.bezierCurveTo(-199, 490, -202, 449, -181, 385);
    ctx.bezierCurveTo(-162, 333, -161, 313, -147, 284);
    ctx.bezierCurveTo(-135, 260, -128, 235, -107, 233);
    ctx.quadraticCurveTo(-91, 235, -80, 229);
    ctx.quadraticCurveTo(-69, 218, -54, 224);
    ctx.quadraticCurveTo(-39, 231, -30, 221);
    ctx.quadraticCurveTo(-20, 211, -3, 222);
    ctx.quadraticCurveTo(13, 229, 24, 220);
    ctx.quadraticCurveTo(48, 207, 53, 233);
    ctx.bezierCurveTo(60, 252, 41, 284, 54, 301);
    ctx.bezierCurveTo(69, 315, 88, 320, 89, 342);
    ctx.bezierCurveTo(92, 379, 71, 403, 47, 434);
    ctx.bezierCurveTo(20, 469, -6, 510, -4, 560);
    ctx.closePath();
    ctx.fillStyle = skin;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-137, 274);
    ctx.bezierCurveTo(-167, 309, -165, 351, -181, 385);
    ctx.quadraticCurveTo(-199, 433, -198, 480);
    ctx.bezierCurveTo(-168, 438, -154, 392, -144, 338);
    ctx.quadraticCurveTo(-136, 300, -119, 252);
    ctx.closePath();
    ctx.fillStyle = "rgba(108,65,74,.15)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(51, 293);
    ctx.quadraticCurveTo(43, 318, 51, 341);
    ctx.moveTo(-85, 277);
    ctx.quadraticCurveTo(-71, 269, -56, 271);
    ctx.moveTo(-28, 263);
    ctx.quadraticCurveTo(-14, 255, 1, 259);
    ctx.strokeStyle = "rgba(112,63,69,.24)";
    ctx.lineWidth = 1.45;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  drawFinger(points, width, press, expected) {
    const ctx = this.context;
    const { left, right, direction, tipRadius } = fingerOutline(points, width);
    const end = points.at(-1);
    const cap = tipRadius * 1.12;
    const leftTip = left.at(-1);
    const rightTip = right[0];
    const skin = ctx.createLinearGradient(...points[0], ...end);
    skin.addColorStop(0, "#c59182");
    if (press?.wrong) {
      skin.addColorStop(.57, "#d18f89");
      skin.addColorStop(1, "#e6818c");
    } else if (press || expected) {
      skin.addColorStop(.44, "#a782ca");
      skin.addColorStop(1, "#9b62f7");
    } else {
      skin.addColorStop(.58, "#ce9c87");
      skin.addColorStop(1, "#c59182");
    }
    ctx.beginPath();
    ctx.moveTo(...left[0]);
    traceEdge(ctx, left);
    ctx.bezierCurveTo(...along(leftTip, direction, cap), ...along(rightTip, direction, cap), ...rightTip);
    traceEdge(ctx, right);
    ctx.closePath();
    ctx.fillStyle = skin;
    ctx.fill();
    const joint = points[1];
    const across = [left[1][0] - right[2][0], left[1][1] - right[2][1]];
    ctx.beginPath();
    ctx.moveTo(...along(joint, across, -.19));
    ctx.quadraticCurveTo(joint[0], joint[1] - 2.25, ...along(joint, across, .19));
    ctx.strokeStyle = "rgba(115,74,76,.35)";
    ctx.stroke();

    ctx.save();
    ctx.translate(...end);
    ctx.rotate(Math.atan2(direction[1], direction[0]) + Math.PI / 2);
    const nailWidth = width * .49;
    const nailHeight = width * .53;
    ctx.beginPath();
    ctx.roundRect(-nailWidth / 2, -width * .22, nailWidth, nailHeight, nailWidth * .36);
    ctx.fillStyle = press?.wrong ? "#ffadad" : press ? "#b6e8cb" : expected ? "#e6d6ff" : "#e1b4a7";
    ctx.fill();
    ctx.strokeStyle = press?.wrong ? "#7a4755" : press ? "#44665b" : expected ? "#886ab8" : "#a57273";
    ctx.lineWidth = expected || press ? 1.4 : .7;
    ctx.stroke();
    ctx.restore();
  }
}
