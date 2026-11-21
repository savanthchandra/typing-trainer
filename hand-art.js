"use strict";

const artworkSize = 1254;
// The joints and nail centers of the original left-hand illustration, in source pixels.
const artworkJoints = [
  [[245, 591], [316, 273], [350, 203], [370, 168]],
  [[402, 591], [476, 230], [510, 164], [535, 125]],
  [[551, 572], [655, 201], [684, 134], [705, 102]],
  [[732, 550], [859, 250], [893, 175], [917, 133]],
  [[843, 841], [1018, 676], [1041, 545], [1065, 473]]
];
const artworkCenter = (artworkJoints[0][3][0] + artworkJoints[3][3][0]) / 2;
const artworkScale = (63.5 * 3) / (artworkJoints[3][3][0] - artworkJoints[0][3][0]);

function artworkPosition(x, y) {
  // The last part of the forearm continues below the visible keyboard, even
  // when a hand moves up to the number row.
  return [(x - artworkCenter) * artworkScale, 124 + y * .277 + Math.max(0, y - 985) * .64];
}

function artworkInfluences(x, y) {
  const nearest = artworkJoints.map((joints, finger) => {
    let best = { distance: Infinity };
    for (let segment = 0; segment < joints.length - 1; segment++) {
      const [startX, startY] = joints[segment];
      const dx = joints[segment + 1][0] - startX;
      const dy = joints[segment + 1][1] - startY;
      const along = clamp(((x - startX) * dx + (y - startY) * dy) / (dx * dx + dy * dy), 0, 1);
      const distance = Math.hypot(x - startX - along * dx, y - startY - along * dy);
      if (distance < best.distance) best = { finger, segment, along, distance };
    }
    return best;
  }).sort((a, b) => a.distance - b.distance);

  const [first, second] = nearest;
  const blend = .5 * (1 - clamp((second.distance - first.distance) / 75, 0, 1));
  return [{ ...first, weight: 1 - blend }, { ...second, weight: blend }];
}

function buildHandMesh(divisions) {
  const points = [];
  const faces = [];
  for (let row = 0; row <= divisions; row++) {
    for (let column = 0; column <= divisions; column++) {
      const u = column / divisions;
      const v = row / divisions;
      const x = u * artworkSize;
      const y = v * artworkSize;
      points.push({ u, v, position: artworkPosition(x, y), influences: artworkInfluences(x, y) });
      if (row < divisions && column < divisions) {
        const topLeft = row * (divisions + 1) + column;
        const bottomLeft = topLeft + divisions + 1;
        faces.push(topLeft, topLeft + 1, bottomLeft, topLeft + 1, bottomLeft + 1, bottomLeft);
      }
    }
  }
  return { points, faces };
}

function knitHand(mesh, hand, fingers) {
  const [offsetX, offsetY, angle] = hand.pose;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const digits = fingers.map((finger, index) => {
    const tip = artworkPosition(...artworkJoints[index][3]);
    const ax = hand.fingers[index].home[0] - tip[0];
    const ay = hand.fingers[index].home[1] - tip[1];
    const shifts = finger.joints.map(([x, y], joint) => {
      const [restX, restY] = hand.fingers[index].restJoints[joint];
      const falloff = [0, .49, .8, 1][joint];
      return [x - restX + ax * falloff, y - restY + ay * falloff];
    });
    return { shifts, tone: finger.tone };
  });

  return mesh.points.map(({ position, u, v, influences }) => {
    let [x, y] = position;
    let tone = 0;
    for (const { finger, segment, along, weight } of influences) {
      const { shifts, tone: digitTone } = digits[finger];
      const from = shifts[segment];
      const to = shifts[segment + 1];
      x += weight * (from[0] + along * (to[0] - from[0]));
      y += weight * (from[1] + along * (to[1] - from[1]));
      const highlight = segment === 0 ? clamp((along - .16) / .68, 0, 1) : 1;
      tone += digitTone * weight * highlight;
    }
    x *= hand.sign;
    y -= 270;
    return [
      hand.center + offsetX + x * cosine - y * sine,
      270 + offsetY + x * sine + y * cosine,
      u, v, tone
    ];
  });
}

const handShaders = [
  [
    "attribute vec2 position;",
    "attribute vec2 texturePoint;",
    "attribute float fingerTone;",
    "uniform vec2 stageSize;",
    "varying vec2 uv;",
    "varying float tone;",
    "void main() {",
    "  gl_Position = vec4(position / stageSize * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);",
    "  uv = texturePoint;",
    "  tone = fingerTone;",
    "}"
  ],
  [
    "precision mediump float;",
    "uniform sampler2D artwork;",
    "varying vec2 uv;",
    "varying float tone;",
    "void main() {",
    "  vec4 skin = texture2D(artwork, uv);",
    "  float light = dot(skin.rgb, vec3(0.299, 0.587, 0.114));",
    "  vec3 accent = tone < 0.0 ? vec3(1.0, 0.38, 0.43) : vec3(0.66, 0.41, 1.0);",
    "  accent *= 0.52 + 0.70 * light;",
    "  gl_FragColor = vec4(mix(skin.rgb, accent, clamp(abs(tone) * 0.88, 0.0, 1.0)), skin.a);",
    "}"
  ]
];

function createHandGraphics(mesh, image) {
  const surface = document.createElement("canvas");
  const gl = surface.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) return null;

  const program = gl.createProgram();
  for (const [index, lines] of handShaders.entries()) {
    const shader = gl.createShader(index === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, lines.join("\n"));
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const stageSize = gl.getUniformLocation(program, "stageSize");

  const vertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  for (const [label, count, offset] of [["position", 2, 0], ["texturePoint", 2, 8], ["fingerTone", 1, 16]]) {
    const attribute = gl.getAttribLocation(program, label);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, count, gl.FLOAT, false, 20, offset);
  }

  const faces = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.faces), gl.STATIC_DRAW);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    surface,
    draw(width, height, hands) {
      if (surface.width !== width || surface.height !== height) {
        surface.width = width;
        surface.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(stageSize, keyboardWidth, keyboardHeight);
      for (const hand of hands) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hand.flat()), gl.DYNAMIC_DRAW);
        gl.drawElements(gl.TRIANGLES, mesh.faces.length, gl.UNSIGNED_SHORT, 0);
      }
    }
  };
}

class HandArtwork {
  constructor(canvas, image, onReady) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.image = image;
    this.mesh = buildHandMesh(36);
    this.graphics = null;
    if (image.complete && image.naturalWidth) {
      this.prepare();
    } else {
      image.addEventListener("load", () => {
        this.prepare();
        onReady();
      }, { once: true });
    }
  }

  prepare() {
    this.graphics = createHandGraphics(this.mesh, this.image);
    if (!this.graphics) this.mesh = buildHandMesh(11);
    this.canvas.dataset.renderer = this.graphics ? "webgl" : "canvas";
  }

  draw(hands, fingers) {
    const { width, height } = this.canvas;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, width, height);
    if (!this.image.naturalWidth) return;
    const posed = hands.map((hand, index) => knitHand(this.mesh, hand, fingers[index]));
    if (this.graphics) {
      this.graphics.draw(width, height, posed);
      this.context.drawImage(this.graphics.surface, 0, 0);
    } else {
      this.context.setTransform(width / keyboardWidth, 0, 0, height / keyboardHeight, 0, 0);
      for (const hand of posed) this.drawCanvasHand(hand);
      for (const hand of posed) this.tintCanvasHand(hand);
    }
  }

  drawCanvasHand(hand) {
    const ctx = this.context;
    const faces = this.mesh.faces;
    for (let i = 0; i < faces.length; i += 3) {
      const [a, b, c] = [hand[faces[i]], hand[faces[i + 1]], hand[faces[i + 2]]];
      const du1 = (b[2] - a[2]) * artworkSize;
      const dv1 = (b[3] - a[3]) * artworkSize;
      const du2 = (c[2] - a[2]) * artworkSize;
      const dv2 = (c[3] - a[3]) * artworkSize;
      const dx1 = b[0] - a[0];
      const dy1 = b[1] - a[1];
      const dx2 = c[0] - a[0];
      const dy2 = c[1] - a[1];
      const determinant = du1 * dv2 - du2 * dv1;
      const u = [(dx1 * dv2 - dx2 * dv1) / determinant, (dy1 * dv2 - dy2 * dv1) / determinant];
      const v = [(du1 * dx2 - du2 * dx1) / determinant, (du1 * dy2 - du2 * dy1) / determinant];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.closePath();
      ctx.clip();
      ctx.transform(u[0], u[1], v[0], v[1],
        a[0] - (u[0] * a[2] + v[0] * a[3]) * artworkSize,
        a[1] - (u[1] * a[2] + v[1] * a[3]) * artworkSize);
      ctx.drawImage(this.image, 0, 0, artworkSize, artworkSize);
      ctx.restore();
    }
  }

  tintCanvasHand(hand) {
    const ctx = this.context;
    const faces = this.mesh.faces;
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    for (let i = 0; i < faces.length; i += 3) {
      const [a, b, c] = [hand[faces[i]], hand[faces[i + 1]], hand[faces[i + 2]]];
      const tone = (a[4] + b[4] + c[4]) / 3;
      if (Math.abs(tone) < .06) continue;
      ctx.globalAlpha = Math.abs(tone) * .69;
      ctx.fillStyle = tone < 0 ? "#e37682" : "#9a62f3";
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.fill();
    }
    ctx.restore();
  }
}
