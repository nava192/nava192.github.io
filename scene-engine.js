(() => {
  const canvas = document.querySelector("canvas.full");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const scene = document.body.dataset.scene || "sky";
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const TAU = Math.PI * 2;
  let W = 0;
  let H = 0;
  let items = [];
  let extra = [];
  let pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  let bursts = [];
  let running = new URLSearchParams(location.search).get("preload") !== "1";
  let sceneStartedAt = running ? performance.now() : 0;
  let sceneElapsedBeforePause = 0;
  let rafId = 0;
  const viewWidth = () => Math.max(1, Math.floor(window.visualViewport?.width || innerWidth));
  const viewHeight = () => Math.max(1, Math.floor(window.visualViewport?.height || innerHeight));

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const snoopyDurations = { sky: 14000, blocks: 14000, gardenJewels: 15000, cinemaSpace: 14000, sea: 14000, sweetMusic: 14000, painting: 14000, portal: 17000 };
  const snoopyAsset = new Image();
  let snoopyAssetReady = false;
  let snoopySprite = null;
  let snoopySpriteSize = 0;
  snoopyAsset.onload = () => {
    snoopyAssetReady = true;
    rebuildSnoopySprite();
    if (!running) drawFrame(performance.now());
  };
  snoopyAsset.src = "assets/snoopy-casita-sprite-transparent.png?v=1";

  function resize() {
    W = viewWidth();
    H = viewHeight();
    pointer.x = pointer.tx = W * .5;
    pointer.y = pointer.ty = H * .5;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    rebuildSnoopySprite();
    seed();
  }

  function rebuildSnoopySprite() {
    if (!snoopyAssetReady || !W || !H) return;
    const size = Math.ceil(Math.min(W, H) * .25 * DPR);
    if (snoopySprite && snoopySpriteSize === size) return;
    snoopySpriteSize = size;
    snoopySprite = document.createElement("canvas");
    snoopySprite.width = size;
    snoopySprite.height = size;
    const spriteCtx = snoopySprite.getContext("2d");
    spriteCtx.imageSmoothingEnabled = false;
    spriteCtx.clearRect(0, 0, size, size);
    spriteCtx.drawImage(snoopyAsset, 0, 0, size, size);
  }

  function seed() {
    items = [];
    extra = [];
    if (scene === "sky") {
      const labels = ["snoopy", "oso", "gato", "nutria", "foca", "corazon", "titulo", "estrella"];
      const lanes = [.09, .16, .25, .34, .44, .53];
      const count = 16;
      for (let i = 0; i < count; i++) {
        const s = rand(58, 132);
        const span = W * 2.05 + s * 4;
        const spacing = span / count;
        const baseX = i * spacing + rand(spacing * .12, spacing * .48);
        const lane = lanes[(i * 5) % lanes.length];
        items.push({ baseX, span, y: H * lane + rand(-H * .018, H * .018), s, v: rand(.018, .038), layer: rand(.7, 1.28), label: labels[i % labels.length], p: rand(0, 8) });
      }
      for (let i = 0; i < 110; i++) extra.push({ ...starData(), type: "spark" });
      for (let i = 0; i < 68; i++) extra.push({ type: "blade", x: rand(0, W), h: rand(40, 120), p: rand(0, 8), c: pick(["#fffaf0", "#ffd36b", "#ffb6d5"]) });
      for (let i = 0; i < 12; i++) extra.push({ type: "flower", x: rand(0, W), y: rand(H * .76, H * .93), s: rand(8, 18), p: rand(0, 8), color: pick(["#ff7aa8", "#ffd36b", "#fffaf0", "#ffb6d5"]) });
    }
    if (scene === "blocks") {
      for (let i = 0; i < 72; i++) {
        items.push({ x: rand(0, W), y: rand(-H * .4, H), size: rand(24, 54), v: rand(.18, .75), kind: i % 3 === 0 ? "minecraft" : "lego", color: pick(["#ff7aa8", "#ffd36b", "#8ee8ff", "#93f5bd", "#bda7ff"]), p: rand(0, 8) });
      }
      for (let i = 0; i < 70; i++) extra.push(starData());
    }
    if (scene === "gardenJewels") {
      const flowers = ["gerbera", "rose", "gardenia", "daisy", "tulip"];
      for (let i = 0; i < 160; i++) {
        const depth = rand(.05, 1);
        items.push({ x: rand(-W * .06, W * 1.06), y: H * (.54 + depth * .44), s: rand(8, 23) * (.62 + depth * .72), v: rand(.18, .7), type: flowers[i % flowers.length], p: rand(0, 8), spin: rand(-.014, .014), depth });
      }
      for (let i = 0; i < 34; i++) extra.push({ r: rand(.18, .5), a: rand(0, TAU), bead: rand(4, 9), color: pick(["#ffd36b", "#ffb6d5", "#8ee8ff", "#fffaf0"]) });
    }
    if (scene === "cinemaSpace") {
      for (let i = 0; i < 180; i++) items.push(starData());
      const motifs = ["arrow", "robot", "green", "wormhole", "starship", "film", "heart", "crown", "book", "planet"];
      for (let i = 0; i < 22; i++) {
        extra.push({ kind: motifs[i % motifs.length], a: i / 22 * TAU, r: rand(.22, .5), speed: rand(.00028, .00072), s: rand(.55, 1.05), p: rand(0, 8) });
      }
    }
    if (scene === "sea") {
      for (let i = 0; i < 68; i++) items.push({ x: (i / 68) * (W + 280) + rand(-120, 120), y: rand(H * .58, H * .9), s: rand(14, 36), v: rand(.24, .62), animal: pick(["pez", "pez", "pez", "pez", "pez", "foca", "nutria", "gato", "oso"]), p: rand(0, 8) });
      for (let i = 0; i < 90; i++) extra.push(starData());
    }
    if (scene === "sweetMusic") {
      for (let i = 0; i < 88; i++) items.push({ x: rand(-40, W + 40), y: rand(-H * .2, H * 1.05), s: rand(15, 44), v: rand(.16, .58), kind: pick(["banana", "note", "spark", "cake"]), p: rand(0, 8) });
    }
    if (scene === "painting") {
      const colors = ["#ff7aa8", "#ffd36b", "#8ee8ff", "#93f5bd", "#bda7ff", "#fffaf0"];
      for (let i = 0; i < 90; i++) items.push({ x: rand(0, W), y: rand(0, H), len: rand(60, 180), w: rand(5, 18), color: pick(colors), p: rand(0, 8), v: rand(.2, .9) });
    }
    if (scene === "portal") {
      const motifs = ["cloud", "flower", "block", "music", "wave", "sweet", "paint", "planet", "jewel", "game", "leaf", "star"];
      for (let i = 0; i < 180; i++) items.push(starData());
      for (let i = 0; i < 24; i++) extra.push({ kind: motifs[i % motifs.length], a: i / 24 * TAU, r: rand(.18, .48), speed: rand(.00035, .0009), p: rand(0, 8), s: rand(.7, 1.2) });
    }
  }

  function starData() {
    return { x: rand(0, W), y: rand(0, H), r: rand(.45, 2.3), a: rand(.25, .92), p: rand(0, 8) };
  }

  function background(a, b, c) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, a);
    g.addColorStop(.52, b);
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function glow(x, y, radius, colors) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    colors.forEach(([stop, color]) => g.addColorStop(stop, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function cinematicGrade(t, strength = .55) {
    ctx.save();
    const top = ctx.createLinearGradient(0, 0, 0, H * .2);
    top.addColorStop(0, `rgba(0,0,0,${.38 * strength})`);
    top.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H * .22);

    const bottom = ctx.createLinearGradient(0, H, 0, H * .72);
    bottom.addColorStop(0, `rgba(0,0,0,${.42 * strength})`);
    bottom.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, H * .72, W, H * .28);

    ctx.globalAlpha = .05 * strength;
    ctx.fillStyle = "#fffaf0";
    for (let i = 0; i < 18; i++) {
      const x = (i * 173 + t * .012) % W;
      const y = (i * 97 + Math.sin(t * .0008 + i) * 40 + H) % H;
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    ctx.restore();
  }

  function lightBeam(x, y, w, h, color, sway = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w * .18, 0);
    ctx.lineTo(w * .46, h);
    ctx.lineTo(-w * .46, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFilmStrip(x, y, w, h, t, alpha = .18) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * .0004) * .025);
    roundRect(-w / 2, -h / 2, w, h, w * .045);
    ctx.fillStyle = `rgba(10,14,24,${alpha})`;
    ctx.fill();
    ctx.fillStyle = `rgba(255,250,240,${alpha * 1.15})`;
    const holes = 9;
    for (let i = 0; i < holes; i++) {
      const yy = -h * .42 + (h * .84 / (holes - 1)) * i;
      ctx.fillRect(-w * .42, yy, w * .08, h * .035);
      ctx.fillRect(w * .34, yy, w * .08, h * .035);
    }
    ctx.restore();
  }

  function noteShape(x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, s * .34, s * .22, 0, TAU);
    ctx.fill();
    ctx.fillRect(s * .17, -s * .72, s * .08, s * 1.05);
    ctx.beginPath();
    ctx.moveTo(s * .25, -s * .72);
    ctx.quadraticCurveTo(s * .72, -s * .62, s * .62, -s * .28);
    ctx.lineTo(s * .25, -s * .36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSunRays(x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * .00008);
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      const len = r * (2.2 + (i % 4) * .28);
      ctx.save();
      ctx.rotate(a);
      const g = ctx.createLinearGradient(r * .9, 0, len, 0);
      g.addColorStop(0, "rgba(255,238,156,.28)");
      g.addColorStop(1, "rgba(255,238,156,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(r * .72, -r * .035);
      ctx.lineTo(len, -r * .18);
      ctx.lineTo(len, r * .18);
      ctx.lineTo(r * .72, r * .035);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawDessertPlate(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 28;
    ctx.fillStyle = "rgba(255,250,240,.92)";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.55, s * .48, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(142,232,255,.55)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255,122,168,.28)";
    ctx.fillStyle = "#f6b0c8";
    ctx.beginPath();
    ctx.moveTo(-s * .55, -s * .46);
    ctx.lineTo(s * .48, -s * .18);
    ctx.lineTo(-s * .12, s * .22);
    ctx.lineTo(-s * .68, s * .04);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8a4b31";
    ctx.beginPath();
    ctx.moveTo(-s * .68, s * .04);
    ctx.lineTo(-s * .12, s * .22);
    ctx.lineTo(-s * .12, s * .44);
    ctx.lineTo(-s * .68, s * .24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd7e6";
    ctx.beginPath();
    ctx.moveTo(-s * .55, -s * .46);
    ctx.lineTo(s * .48, -s * .18);
    ctx.lineTo(s * .25, -s * .04);
    ctx.lineTo(-s * .58, -s * .24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff7aa8";
    ctx.beginPath();
    ctx.arc(s * .12, -s * .18, s * .12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fffaf0";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-s * .38 + i * s * .2, -s * .18 + Math.sin(t * .001 + i) * 2, s * .055, 0, TAU);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(s * .12 + i * s * .22, s * .22 - Math.sin(i) * s * .04);
      ctx.rotate(-.26 + i * .08);
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = s * .14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, s * .38, .18, Math.PI * 1.12);
      ctx.stroke();
      ctx.strokeStyle = "rgba(121,70,28,.3)";
      ctx.lineWidth = s * .035;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawChefRat(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .001) * 3);
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#b5adac";
    ctx.beginPath();
    ctx.ellipse(0, s * .18, s * .42, s * .58, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#c9c0bf";
    ctx.beginPath();
    ctx.arc(0, -s * .38, s * .38, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e5d9d8";
    ctx.beginPath();
    ctx.arc(-s * .3, -s * .57, s * .18, 0, TAU);
    ctx.arc(s * .3, -s * .57, s * .18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffd7e6";
    ctx.beginPath();
    ctx.arc(-s * .3, -s * .57, s * .1, 0, TAU);
    ctx.arc(s * .3, -s * .57, s * .1, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.arc(-s * .2, -s * .94, s * .22, 0, TAU);
    ctx.arc(0, -s * 1.02, s * .27, 0, TAU);
    ctx.arc(s * .22, -s * .94, s * .22, 0, TAU);
    ctx.fill();
    roundRect(-s * .33, -s * .9, s * .66, s * .26, s * .06);
    ctx.fill();
    ctx.strokeStyle = "rgba(39,46,58,.28)";
    ctx.lineWidth = Math.max(1, s * .025);
    ctx.stroke();
    ctx.fillStyle = "#26303d";
    ctx.beginPath();
    ctx.arc(-s * .12, -s * .42, s * .035, 0, TAU);
    ctx.arc(s * .12, -s * .42, s * .035, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff7aa8";
    ctx.beginPath();
    ctx.arc(0, -s * .3, s * .055, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(39,46,58,.55)";
    ctx.lineWidth = Math.max(1, s * .018);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * s * .06, -s * .28);
      ctx.lineTo(side * s * .46, -s * .36);
      ctx.moveTo(side * s * .06, -s * .24);
      ctx.lineTo(side * s * .5, -s * .18);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,250,240,.9)";
    roundRect(-s * .28, -s * .04, s * .56, s * .48, s * .06);
    ctx.fill();
    ctx.strokeStyle = "#8ee8ff";
    ctx.lineWidth = s * .035;
    ctx.beginPath();
    ctx.moveTo(-s * .2, s * .08);
    ctx.lineTo(s * .2, s * .08);
    ctx.stroke();
    ctx.strokeStyle = "#ffd36b";
    ctx.lineWidth = s * .045;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s * .26, s * .02);
    ctx.quadraticCurveTo(s * .78, -s * .08 + Math.sin(t * .004) * s * .06, s * .9, -s * .42);
    ctx.stroke();
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.arc(s * .92, -s * .45, s * .09, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,250,240,.85)";
    ctx.lineWidth = s * .04;
    ctx.beginPath();
    ctx.moveTo(-s * .24, s * .5);
    ctx.quadraticCurveTo(-s * .78, s * .7, -s * .95, s * .34 + Math.sin(t * .002) * s * .1);
    ctx.stroke();
    ctx.restore();
  }

  function drawStar(s, t, color = "255,255,255") {
    const a = s.a * (.55 + Math.sin(t * .002 + s.p) * .35);
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 7);
    g.addColorStop(0, `rgba(${color},${a})`);
    g.addColorStop(.35, `rgba(${color},${a * .28})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 7, 0, TAU);
    ctx.fill();
  }

  function updateInteraction(t) {
    pointer.x += (pointer.tx - pointer.x) * .08;
    pointer.y += (pointer.ty - pointer.y) * .08;
    const halo = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.min(W, H) * .28);
    halo.addColorStop(0, pointer.active ? "rgba(255,250,240,.22)" : "rgba(255,250,240,.12)");
    halo.addColorStop(.35, "rgba(255,211,107,.08)");
    halo.addColorStop(1, "rgba(255,211,107,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    bursts = bursts.filter((p) => p.life > 0);
    bursts.forEach((p) => {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += .012;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      if (p.shape === "heart") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * .03);
        ctx.beginPath();
        ctx.moveTo(0, p.s * .45);
        ctx.bezierCurveTo(-p.s, -p.s * .2, -p.s * .36, -p.s, 0, -p.s * .36);
        ctx.bezierCurveTo(p.s * .36, -p.s, p.s, -p.s * .2, 0, p.s * .45);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    });

    if (pointer.active) {
      ctx.save();
      ctx.translate(pointer.x, pointer.y);
      ctx.rotate(t * .002);
      ctx.strokeStyle = "rgba(255,250,240,.38)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 18 + i * 14 + Math.sin(t * .004 + i) * 3, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function burst(x, y) {
    const palette = ["#ffd36b", "#ff7aa8", "#8ee8ff", "#93f5bd", "#fffaf0"];
    const count = bursts.length > 90 ? 10 : 24;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + rand(-.16, .16);
      const speed = rand(1.1, 4.2);
      bursts.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        s: rand(2, 5),
        life: rand(34, 58),
        max: 58,
        color: pick(palette),
        shape: i % 7 === 0 ? "heart" : "dot"
      });
    }
  }

  function cloud(x, y, s, label, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(255,250,240,.82)";
    ctx.shadowColor = "rgba(142,232,255,.28)";
    ctx.shadowBlur = 28;
    const parts = [[-.35, .05, .34], [-.08, -.08, .42], [.25, .02, .35], [.47, .1, .25], [-.55, .12, .24]];
    parts.forEach(([px, py, pr]) => {
      ctx.beginPath();
      ctx.arc(px * s, py * s, pr * s, 0, TAU);
      ctx.fill();
    });
    ctx.fillRect(-.55 * s, .05 * s, 1.1 * s, .24 * s);
    ctx.shadowBlur = 0;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "rgba(32,38,54,.72)";
    ctx.strokeStyle = "rgba(32,38,54,.7)";
    ctx.lineWidth = Math.max(2, s * .035);
    if (label === "snoopy") {
      ctx.lineWidth = Math.max(2.4, s * .045);
      ctx.strokeStyle = "rgba(24,28,38,.86)";
      ctx.fillStyle = "rgba(255,250,240,.96)";
      ctx.beginPath();
      ctx.ellipse(-s * .1, s * .01, s * .35, s * .22, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(s * .27, -s * .07, s * .24, s * .17, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#22283a";
      ctx.beginPath();
      ctx.ellipse(s * .1, -s * .02, s * .085, s * .18, -.35, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * .48, -s * .075, s * .046, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * .28, -s * .12, s * .018, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * .38, -s * .14, s * .014, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(24,28,38,.84)";
      ctx.lineWidth = Math.max(1.8, s * .026);
      ctx.beginPath();
      ctx.moveTo(-s * .3, s * .08);
      ctx.lineTo(-s * .44, -s * .04);
      ctx.moveTo(s * .28, s * .02);
      ctx.quadraticCurveTo(s * .36, s * .09, s * .45, s * .02);
      ctx.stroke();
      ctx.fillStyle = "#ff7aa8";
      ctx.beginPath();
      ctx.arc(-s * .06, s * .1, s * .032, 0, TAU);
      ctx.fill();
    } else if (label === "gato") {
      ctx.beginPath();
      ctx.moveTo(-s * .22, -s * .02);
      ctx.lineTo(-s * .14, -s * .2);
      ctx.lineTo(-s * .04, -s * .02);
      ctx.moveTo(s * .04, -s * .02);
      ctx.lineTo(s * .14, -s * .2);
      ctx.lineTo(s * .22, -s * .02);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * .08, s * .02, s * .025, 0, TAU);
      ctx.arc(s * .08, s * .02, s * .025, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, s * .04);
      ctx.lineTo(-s * .03, s * .1);
      ctx.lineTo(s * .03, s * .1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(32,38,54,.65)";
      ctx.lineWidth = Math.max(1.5, s * .022);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * s * .03, s * .08);
        ctx.lineTo(side * s * .24, s * .04);
        ctx.moveTo(side * s * .03, s * .1);
        ctx.lineTo(side * s * .25, s * .13);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-s * .34, s * .08);
      ctx.quadraticCurveTo(-s * .5, -s * .1, -s * .34, -s * .2);
      ctx.stroke();
    } else if (label === "oso") {
      ctx.beginPath();
      ctx.arc(-s * .2, -s * .1, s * .08, 0, TAU);
      ctx.arc(s * .2, -s * .1, s * .08, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-s * .08, 0, s * .025, 0, TAU);
      ctx.arc(s * .08, 0, s * .025, 0, TAU);
      ctx.arc(0, s * .08, s * .035, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(32,38,54,.62)";
      ctx.beginPath();
      ctx.arc(0, s * .04, s * .16, .2, Math.PI - .2);
      ctx.stroke();
    } else if (label === "nutria" || label === "foca") {
      ctx.lineWidth = Math.max(2, s * .03);
      ctx.beginPath();
      ctx.ellipse(-s * .02, s * .04, s * .36, s * .17, .04, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * .26, -s * .03, s * .12, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * .24, -s * .06, s * .018, 0, TAU);
      ctx.arc(s * .33, -s * .04, s * .018, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * .35, s * .02);
      ctx.lineTo(s * .48, -s * .02);
      ctx.moveTo(s * .35, s * .04);
      ctx.lineTo(s * .49, s * .08);
      ctx.stroke();
      if (label === "nutria") {
        ctx.beginPath();
        ctx.moveTo(-s * .3, s * .04);
        ctx.quadraticCurveTo(-s * .56, s * .2, -s * .28, s * .24);
        ctx.moveTo(-s * .08, s * .16);
        ctx.quadraticCurveTo(s * .02, s * .28, s * .16, s * .16);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-s * .3, s * .04);
        ctx.lineTo(-s * .5, -s * .06);
        ctx.moveTo(-s * .3, s * .04);
        ctx.lineTo(-s * .5, s * .15);
        ctx.moveTo(-s * .04, s * .16);
        ctx.lineTo(s * .08, s * .3);
        ctx.stroke();
      }
    } else if (label === "corazon") {
      ctx.fillStyle = "rgba(255,122,168,.82)";
      ctx.beginPath();
      ctx.moveTo(0, s * .15);
      ctx.bezierCurveTo(-s * .32, -s * .08, -s * .16, -s * .3, 0, -s * .12);
      ctx.bezierCurveTo(s * .16, -s * .3, s * .32, -s * .08, 0, s * .15);
      ctx.fill();
    } else if (label === "titulo") {
      roundRect(-s * .3, -s * .14, s * .6, s * .34, s * .035);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * .18, -s * .02);
      ctx.lineTo(s * .18, -s * .02);
      ctx.moveTo(-s * .14, s * .07);
      ctx.lineTo(s * .14, s * .07);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,211,107,.88)";
      ctx.beginPath();
      ctx.arc(s * .2, s * .16, s * .055, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,122,168,.86)";
      ctx.beginPath();
      ctx.moveTo(s * .2, s * .2);
      ctx.lineTo(s * .14, s * .32);
      ctx.lineTo(s * .2, s * .27);
      ctx.lineTo(s * .26, s * .32);
      ctx.closePath();
      ctx.fill();
    } else {
      sparkleShape(0, s * .02, s * .18, "rgba(255,211,107,.92)");
    }
    ctx.restore();
  }

  function sparkleShape(x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.45);
    ctx.quadraticCurveTo(s * .18, -s * .26, s * 1.35, 0);
    ctx.quadraticCurveTo(s * .18, s * .26, 0, s * 1.45);
    ctx.quadraticCurveTo(-s * .18, s * .26, -s * 1.35, 0);
    ctx.quadraticCurveTo(-s * .18, -s * .26, 0, -s * 1.45);
    ctx.fill();
    ctx.restore();
  }

  function flower(x, y, s, type, t, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t);
    ctx.globalAlpha = alpha;
    const palettes = {
      gerbera: ["#ff8bb7", "#ff4f8d", "#ffd36b"],
      rose: ["#ffc1d8", "#ff7aa8", "#9c164a"],
      gardenia: ["#fffaf0", "#f4efdc", "#ffd36b"],
      daisy: ["#ffffff", "#fff7d8", "#ffd36b"],
      tulip: ["#ff9ec6", "#ff5d93", "#93f5bd"]
    };
    const p = palettes[type] || palettes.gerbera;
    if (type === "tulip") {
      ctx.fillStyle = p[1];
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * .9, -s * .6, s * .68, s * .7, 0, s);
      ctx.bezierCurveTo(-s * .68, s * .7, -s * .9, -s * .6, 0, -s);
      ctx.fill();
      ctx.fillStyle = p[2];
      ctx.fillRect(-1.5, s * .76, 3, s * 1.8);
      ctx.restore();
      return;
    }
    const petals = type === "daisy" ? 12 : type === "gardenia" ? 8 : 16;
    for (let i = 0; i < petals; i++) {
      ctx.rotate(TAU / petals);
      ctx.fillStyle = i % 2 ? p[0] : p[1];
      ctx.beginPath();
      ctx.ellipse(0, -s * .62, s * .2, s * .62, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = p[2];
    ctx.beginPath();
    ctx.arc(0, 0, s * .28, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function block(x, y, size, color, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * .001 + x) * .08);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillRect(-size * .8, -size * .38, size * 1.6, size * .76);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.32)";
    ctx.fillRect(-size * .8, -size * .38, size * 1.6, size * .16);
    ctx.fillStyle = "rgba(0,0,0,.14)";
    ctx.fillRect(-size * .8, size * .2, size * 1.6, size * .18);
    ctx.fillStyle = "rgba(255,255,255,.4)";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * size * .42, -size * .42, size * .18, size * .09, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.12)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function legoBrick(x, y, size, color, t, cols = 2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * .001 + x) * .08);
    const w = size * (.92 * cols);
    const h = size * .7;
    const r = size * .08;
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = 18;
    roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;
    const top = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    top.addColorStop(0, "rgba(255,255,255,.32)");
    top.addColorStop(.45, "rgba(255,255,255,0)");
    top.addColorStop(1, "rgba(0,0,0,.18)");
    roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fillStyle = top;
    ctx.fill();
    for (let i = 0; i < cols; i++) {
      const sx = -w * .25 + i * w * .5;
      ctx.beginPath();
      ctx.ellipse(sx, -h * .55, size * .22, size * .1, 0, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.38)";
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function minecraftCube(x, y, size, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * .001 + x) * .045);
    const top = "#65b84a";
    const left = "#8b5a35";
    const right = "#6b4027";
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, -size * .62);
    ctx.lineTo(size * .62, -size * .28);
    ctx.lineTo(0, size * .06);
    ctx.lineTo(-size * .62, -size * .28);
    ctx.closePath();
    ctx.fillStyle = top;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * .62, -size * .28);
    ctx.lineTo(0, size * .06);
    ctx.lineTo(0, size * .72);
    ctx.lineTo(-size * .62, size * .34);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * .62, -size * .28);
    ctx.lineTo(0, size * .06);
    ctx.lineTo(0, size * .72);
    ctx.lineTo(size * .62, size * .34);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.2)";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-size * .46 + (i % 3) * size * .3, -size * .34 + Math.floor(i / 3) * size * .14, size * .12, size * .08);
    }
    ctx.restore();
  }

  function snoopyWorldProgress(t) {
    if (!sceneStartedAt) return 0;
    const duration = snoopyDurations[scene] || 14000;
    const raw = Math.max(0, Math.min(1, ((running ? t - sceneStartedAt : sceneElapsedBeforePause) || 0) / duration));
    const eased = raw * raw * (3 - 2 * raw);
    return eased;
  }

  function drawFlyingSnoopyHouse(t) {
    const imgSize = Math.min(W, H) * .22;
    const progress = snoopyWorldProgress(t);
    const x = -imgSize * .62 + (W + imgSize * 1.24) * progress;
    const y = H * .12 + Math.sin(t * .00075) * H * .012 + Math.sin(progress * TAU) * H * .018;
    ctx.save();
    ctx.globalAlpha = .18;
    ctx.strokeStyle = "rgba(255,250,240,.88)";
    ctx.lineWidth = Math.max(1, imgSize * .012);
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const lag = imgSize * (.34 + i * .18);
      ctx.beginPath();
      ctx.moveTo(x - imgSize * .34 - lag, y + imgSize * (-.08 + i * .08));
      ctx.lineTo(x - imgSize * .52 - lag * 1.42, y + imgSize * (-.1 + i * .09));
      ctx.stroke();
    }
    ctx.restore();
    if (snoopySprite) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * .00055) * .028);
      ctx.shadowColor = "rgba(16,24,36,.38)";
      ctx.shadowBlur = 22;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(snoopySprite, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
      ctx.restore();
      return;
    }

    const s = Math.min(W, H) * .078;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * .00055) * .035);
    ctx.shadowColor = "rgba(16,24,36,.38)";
    ctx.shadowBlur = 22;

    ctx.strokeStyle = "rgba(19,21,28,.9)";
    ctx.lineWidth = Math.max(2, s * .045);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillStyle = "#f01f1f";
    ctx.beginPath();
    ctx.moveTo(-s * 1.34, s * .38);
    ctx.lineTo(-s * 1, -s * .55);
    ctx.lineTo(s * 1.04, -s * .55);
    ctx.lineTo(s * 1.4, s * .38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d61a1a";
    roundRect(-s * .96, s * .34, s * 1.9, s * .86, s * .05);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(120,0,0,.16)";
    for (let i = 0; i < 5; i++) ctx.fillRect(-s * .82 + i * s * .36, -s * .42, s * .18, s * .72);
    ctx.strokeStyle = "rgba(19,21,28,.72)";
    ctx.lineWidth = Math.max(1.2, s * .018);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 1.06, -s * .22 + i * s * .32);
      ctx.quadraticCurveTo(0, -s * .15 + i * s * .32 + Math.sin(t * .002 + i) * 1.2, s * 1.08, -s * .22 + i * s * .32);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,250,240,.9)";
    ctx.fillRect(s * .84, s * .5, s * .22, s * .16);

    ctx.save();
    ctx.translate(-s * .02, -s * .92);
    ctx.fillStyle = "rgba(255,250,240,.98)";
    ctx.strokeStyle = "rgba(19,21,28,.92)";
    ctx.lineWidth = Math.max(2, s * .04);

    ctx.beginPath();
    ctx.moveTo(-s * .2, s * .6);
    ctx.quadraticCurveTo(-s * .28, s * .8, -s * .42, s * .96);
    ctx.moveTo(s * .06, s * .6);
    ctx.quadraticCurveTo(s * .08, s * .84, s * .22, s * .98);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,250,240,.98)";
    ctx.beginPath();
    ctx.ellipse(-s * .08, s * .18, s * .3, s * .48, -.08, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * .26, -s * .12, s * .43, s * .27, -.13, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * .62, -s * .11, s * .085, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#22283a";
    ctx.beginPath();
    ctx.arc(s * .66, -s * .16, s * .048, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * .06, .02, s * .11, s * .26, -.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-s * .35, s * .2, s * .09, s * .18, .4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#22283a";
    ctx.lineWidth = Math.max(1.4, s * .024);
    ctx.beginPath();
    ctx.moveTo(s * .33, -s * .19);
    ctx.quadraticCurveTo(s * .45, -s * .08, s * .58, -s * .19);
    ctx.stroke();

    ctx.fillStyle = "#6ca64d";
    ctx.strokeStyle = "rgba(19,21,28,.88)";
    ctx.lineWidth = Math.max(1.8, s * .035);
    ctx.beginPath();
    ctx.arc(s * .02, -s * .36, s * .29, Math.PI * .55, Math.PI * 1.62);
    ctx.quadraticCurveTo(s * .2, -s * .58, s * .4, -s * .34);
    ctx.lineTo(s * .18, -s * .17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,250,240,.18)";
    ctx.beginPath();
    ctx.arc(-s * .08, -s * .45, s * .08, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#22283a";
    ctx.lineWidth = Math.max(1.4, s * .026);
    ctx.beginPath();
    ctx.arc(s * .36, -s * .28, s * .13, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * .36, -s * .28, s * .07, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * .21, -s * .28);
    ctx.lineTo(s * .48, -s * .28);
    ctx.stroke();

    ctx.fillStyle = "#ff302c";
    ctx.strokeStyle = "rgba(19,21,28,.84)";
    ctx.lineWidth = Math.max(1.2, s * .02);
    ctx.beginPath();
    ctx.moveTo(-s * .3, s * .18);
    ctx.lineTo(-s * .98, s * .08 + Math.sin(t * .008) * s * .06);
    ctx.lineTo(-s * .65, s * .34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * .44, s * .2);
    ctx.lineTo(-s * .88, s * .42 + Math.sin(t * .007) * s * .05);
    ctx.lineTo(-s * .58, s * .46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,250,240,.42)";
    ctx.lineWidth = Math.max(1.4, s * .02);
    for (let i = 0; i < 4; i++) {
      const lx = -s * (1.65 + i * .36);
      const ly = -s * (.28 - i * .18);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - s * .42, ly + Math.sin(t * .004 + i) * s * .08);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSky(t) {
    background("#76bfff", "#9ed8ff", "#d9f1ff");
    glow(W * .75, H * .18, Math.min(W, H) * .42, [[0, "rgba(255,250,240,.95)"], [.28, "rgba(255,211,107,.28)"], [1, "rgba(255,211,107,0)"]]);
    extra.filter((e) => e.type === "spark").forEach((s, i) => drawStar(s, t, i % 6 ? "255,255,255" : "255,211,107"));
    const grassTop = H * .7;
    drawDistantHills(t, grassTop);
    const groundShift = t * .045;
    const grass = ctx.createLinearGradient(0, grassTop, 0, H);
    grass.addColorStop(0, "#6ee08e");
    grass.addColorStop(1, "#1f7b47");
    ctx.fillStyle = grass;
    ctx.beginPath();
    ctx.moveTo(0, grassTop);
    for (let x = 0; x <= W; x += 34) {
      ctx.lineTo(x, grassTop + Math.sin((x + groundShift) * .012 + t * .0004) * 18);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
    extra.filter((e) => e.type === "blade").forEach((blade, i) => {
      const x = wrapLeft(blade.x, t * .048, W + 90) - 30;
      ctx.strokeStyle = i % 5 === 0 ? "rgba(255,250,240,.32)" : "rgba(255,255,255,.14)";
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.quadraticCurveTo(x + Math.sin(t * .001 + blade.p) * 18, H * .84, x + 8, grassTop + blade.h);
      ctx.stroke();
    });
    extra.filter((e) => e.type === "flower").forEach((f) => {
      const x = wrapLeft(f.x, t * .04, W + 90) - 30;
      flower(x + Math.sin(t * .001 + f.p) * 6, f.y, f.s, "daisy", t * .0004 + f.p, .85);
    });
    items.forEach((c) => {
      const travel = t * c.v * (c.layer || 1) * (1.05 + c.s / 230);
      const x = wrapLeft(c.baseX, travel, c.span || W + c.s * 3) - c.s * 1.55;
      cloud(x, c.y, c.s, c.label, t);
    });
    drawRoadAndCar(t);
  }

  function wrapLeft(base, travel, span) {
    return ((base - travel) % span + span) % span;
  }

  function drawDistantHills(t, grassTop) {
    const layers = [
      { y: grassTop - H * .08, color: "rgba(75,145,138,.34)", speed: .018, amp: 24 },
      { y: grassTop - H * .035, color: "rgba(58,126,95,.32)", speed: .028, amp: 18 }
    ];
    layers.forEach((layer, li) => {
      const shift = (t * layer.speed) % 84;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = -100; x <= W + 100; x += 42) {
        const worldX = x + shift;
        const y = layer.y + Math.sin(worldX * .012 + li) * layer.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawRoadAndCar(t) {
    const roadY = H * .91;
    const roadH = Math.max(42, H * .07);
    ctx.fillStyle = "rgba(42,48,50,.86)";
    ctx.fillRect(0, roadY, W, roadH);
    ctx.fillStyle = "rgba(255,250,240,.24)";
    ctx.fillRect(0, roadY + roadH * .08, W, 2);
    ctx.fillStyle = "rgba(255,211,107,.86)";
    const dashW = 46;
    const gap = 60;
    const offset = (t * .18) % (dashW + gap);
    for (let x = -dashW - offset; x < W + dashW; x += dashW + gap) {
      ctx.fillRect(x, roadY + roadH * .55, dashW, 4);
    }
    const carScale = Math.min(W, H) * .052;
    const carX = W * .5;
    const carY = roadY + roadH * .18;
    drawSpeedLines(carX, carY, carScale, t);
    drawTinyCar(carX, carY, carScale, t);
  }

  function drawSpeedLines(x, y, s, t) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,250,240,.26)";
    ctx.lineWidth = Math.max(1, s * .06);
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      const drift = ((t * .16 + i * 31) % 150) - 75;
      const yy = y + s * (.04 + i * .12);
      ctx.beginPath();
      ctx.moveTo(x - s * 2.25 - drift, yy);
      ctx.lineTo(x - s * 3.1 - drift, yy + Math.sin(t * .004 + i) * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTinyCar(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff7b45";
    ctx.beginPath();
    ctx.moveTo(-s * 1.8, s * .38);
    ctx.lineTo(-s * 1.28, -s * .22);
    ctx.quadraticCurveTo(-s * .74, -s * .72, s * .34, -s * .66);
    ctx.lineTo(s * 1.38, -s * .18);
    ctx.quadraticCurveTo(s * 1.8, -s * .04, s * 1.95, s * .38);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#b04731";
    ctx.fillRect(-s * 1.55, s * .26, s * 3.2, s * .52);
    ctx.fillStyle = "#79d8ff";
    ctx.beginPath();
    ctx.moveTo(-s * .88, -s * .24);
    ctx.lineTo(-s * .42, -s * .54);
    ctx.lineTo(s * .12, -s * .52);
    ctx.lineTo(s * .2, -s * .12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * .32, -s * .5);
    ctx.lineTo(s * .95, -s * .18);
    ctx.lineTo(s * .36, -s * .12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,250,240,.88)";
    ctx.fillRect(s * 1.35, s * .12, s * .34, s * .18);
    ctx.fillStyle = "#121820";
    for (const wx of [-s * 1.08, s * 1.04]) {
      ctx.beginPath();
      ctx.arc(wx, s * .78, s * .34, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#d5f3ff";
      ctx.beginPath();
      ctx.arc(wx, s * .78, s * .18, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#121820";
      ctx.save();
      ctx.translate(wx, s * .78);
      ctx.rotate(t * .012);
      ctx.strokeStyle = "rgba(18,24,32,.42)";
      ctx.lineWidth = Math.max(1, s * .035);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(TAU / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(s * .16, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.fillStyle = "#2e5f7d";
    ctx.fillRect(-s * .18, -s * 1.34, s * .18, s * .66);
    ctx.fillStyle = "#6fbf8f";
    ctx.fillRect(-s * .6, -s * 1.08, s * 1.1, s * .42);
    sparkleShape(-s * .05, -s * .86, s * .13, "rgba(255,211,107,.95)");
    ctx.restore();
  }

  function blockRect(x, y, w, h, color, stroke = "rgba(23,28,32,.24)") {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1, Math.min(w, h) * .035);
      ctx.strokeRect(x, y, w, h);
    }
  }

  function blockyCloud(x, y, s, alpha = .78) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fffaf0";
    blockRect(x - s * .72, y, s * .48, s * .22, "#fffaf0", null);
    blockRect(x - s * .45, y - s * .18, s * .62, s * .4, "#fffaf0", null);
    blockRect(x + s * .12, y - s * .08, s * .58, s * .3, "#fffaf0", null);
    blockRect(x - s * .2, y + s * .14, s * .86, s * .18, "rgba(230,243,248,.94)", null);
    ctx.restore();
  }

  function drawMinecraftTree(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .001 + x) * 1.8);
    blockRect(-s * .13, -s * 1.28, s * .26, s * 1.28, "#8b5a2b", "rgba(47,32,18,.28)");
    const leaves = [
      [-.52, -1.72, .46], [-.15, -1.9, .58], [.35, -1.68, .46],
      [-.38, -1.38, .52], [.12, -1.42, .62], [.58, -1.32, .4]
    ];
    leaves.forEach(([lx, ly, ls], i) => {
      blockRect(lx * s + Math.sin(t * .0012 + i) * s * .025, ly * s, ls * s, ls * s, i % 2 ? "#2f9b48" : "#48b75b", "rgba(20,74,40,.22)");
    });
    ctx.restore();
  }

  function drawMinecraftHouse(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    blockRect(-s * 1.1, -s * 1.15, s * 2.2, s * 1.15, "#c99b55", "rgba(62,38,18,.28)");
    for (let i = 0; i < 5; i++) blockRect(-s * 1.08 + i * s * .44, -s * 1.1, s * .04, s * 1.08, "rgba(78,49,25,.28)", null);
    blockRect(-s * .96, -s * .48, s * .42, s * .48, "#6b3f22", "rgba(30,24,16,.32)");
    blockRect(s * .44, -s * .82, s * .42, s * .32, "#9be7ff", "rgba(24,54,70,.24)");
    blockRect(-s * .22, -s * .82, s * .38, s * .3, "#9be7ff", "rgba(24,54,70,.24)");
    blockRect(-s * 1.32, -s * 1.52, s * 2.64, s * .42, "#9a672f", "rgba(45,27,12,.28)");
    blockRect(-s * 1.08, -s * 1.88, s * 2.16, s * .42, "#87592b", "rgba(45,27,12,.28)");
    blockRect(-s * .78, -s * 2.22, s * 1.56, s * .42, "#724820", "rgba(45,27,12,.28)");
    ctx.restore();
  }

  function drawTerrainStep(x, y, w, h, t, shade = 0) {
    ctx.save();
    const top = shade ? "#5bbd56" : "#69d467";
    const side = shade ? "#795033" : "#8a5c37";
    blockRect(x, y, w, h, side, "rgba(45,31,18,.2)");
    blockRect(x, y - h * .2, w, h * .24, top, "rgba(34,96,45,.18)");
    ctx.fillStyle = "rgba(74,45,27,.25)";
    for (let i = 0; i < Math.max(3, w / 70); i++) {
      blockRect(x + i * 62 + Math.sin(t * .001 + i) * 2, y + h * (.18 + (i % 3) * .18), 22, 8, "rgba(74,45,27,.2)", null);
    }
    ctx.restore();
  }

  function drawTallGrass(x, y, s, t) {
    ctx.save();
    ctx.strokeStyle = "rgba(66,157,64,.82)";
    ctx.lineWidth = Math.max(1, s * .08);
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const dx = (i - 3) * s * .16;
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.quadraticCurveTo(x + dx + Math.sin(t * .0015 + i + x) * s * .24, y - s * .55, x + dx * .65, y - s * (.9 + (i % 3) * .18));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawVoxelSheep(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .0012 + x) * 2);
    ctx.shadowColor = "rgba(0,0,0,.22)";
    ctx.shadowBlur = 10;
    blockRect(-s * .82, -s * .4, s * 1.34, s * .62, "#fffaf0", "rgba(35,37,40,.18)");
    blockRect(-s * .94, -s * .24, s * .28, s * .42, "#f4eadc", "rgba(35,37,40,.16)");
    blockRect(s * .42, -s * .3, s * .42, s * .48, "#efe6d9", "rgba(35,37,40,.22)");
    blockRect(s * .48, -s * .2, s * .3, s * .28, "#2f3440", null);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(-s * .62, -s * .56, s * .22, s * .22);
    ctx.fillRect(-s * .2, -s * .58, s * .28, s * .2);
    ctx.fillRect(s * .1, -s * .52, s * .25, s * .2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#222832";
    ctx.fillRect(s * .7, -s * .12, s * .045, s * .045);
    ctx.fillStyle = "#2e2b28";
    [-.56, -.2, .18, .48].forEach((lx, i) => {
      blockRect(lx * s, s * .16, s * .12, s * .45 + (i % 2) * s * .05, "#3a312b", null);
    });
    ctx.restore();
  }

  function drawVoxelBird(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .002 + x) * 8);
    ctx.fillStyle = "rgba(255,250,240,.85)";
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(-s * .38, -s * .36, 0, 0);
    ctx.quadraticCurveTo(s * .38, -s * .36, s, 0);
    ctx.strokeStyle = "rgba(255,250,240,.85)";
    ctx.lineWidth = Math.max(1, s * .12);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoyalCrown(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffd36b";
    ctx.strokeStyle = "rgba(104,70,18,.32)";
    ctx.lineWidth = Math.max(1, s * .035);
    ctx.beginPath();
    ctx.moveTo(-s, s * .46);
    ctx.lineTo(-s * .72, -s * .34);
    ctx.lineTo(-s * .28, s * .05);
    ctx.lineTo(0, -s * .58);
    ctx.lineTo(s * .28, s * .05);
    ctx.lineTo(s * .72, -s * .34);
    ctx.lineTo(s, s * .46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.34)";
    ctx.fillRect(-s * .62, s * .28, s * 1.24, s * .12);
    ctx.restore();
  }

  function drawRoyalTower(x, y, s, t, king = false) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .00055 + x) * s * .025);
    ctx.globalAlpha = king ? .72 : .56;
    ctx.shadowColor = "rgba(20,28,48,.22)";
    ctx.shadowBlur = s * .2;
    const w = s * (king ? 1.55 : 1.16);
    const h = s * (king ? 1.62 : 1.25);
    blockRect(-w * .5, -h * .54, w, h, "#7a8493", "rgba(35,39,47,.28)");
    blockRect(-w * .42, -h * .68, w * .84, h * .22, "#eef0e8", "rgba(35,39,47,.18)");
    for (let i = -2; i <= 2; i++) {
      blockRect(i * w * .18 - w * .045, -h * .78, w * .09, h * .16, "#f3f0df", "rgba(35,39,47,.16)");
    }
    blockRect(-w * .54, -h * .2, w * 1.08, h * .18, "#d63f3f", "rgba(102,24,24,.32)");
    blockRect(-w * .28, h * .02, w * .56, h * .48, "#4d5968", "rgba(26,30,38,.28)");
    blockRect(-w * .16, h * .15, w * .32, h * .22, "#252b34", null);
    ctx.fillStyle = "rgba(38,43,51,.38)";
    for (let i = 0; i < 7; i++) {
      blockRect(-w * .42 + (i % 4) * w * .25, -h * .42 + Math.floor(i / 4) * h * .34, w * .12, h * .06, "rgba(38,43,51,.22)", null);
    }
    if (king) {
      blockRect(-w * .18, -h * .95, w * .36, h * .42, "#f0b36f", "rgba(84,45,20,.22)");
      drawRoyalCrown(0, -h * 1.02, s * .34);
      ctx.fillStyle = "#372a25";
      ctx.fillRect(-w * .08, -h * .79, w * .045, w * .045);
      ctx.fillRect(w * .04, -h * .79, w * .045, w * .045);
      ctx.strokeStyle = "rgba(82,50,32,.65)";
      ctx.lineWidth = Math.max(1, s * .035);
      ctx.beginPath();
      ctx.arc(0, -h * .68, w * .1, 0, Math.PI);
      ctx.stroke();
      blockRect(-w * .1, -h * .02, w * .2, h * .5, "#2b303a", "rgba(0,0,0,.22)");
      ctx.fillStyle = "#1b1e25";
      ctx.beginPath();
      ctx.arc(0, h * .48, w * .18, 0, TAU);
      ctx.fill();
    } else {
      drawRoyalCrown(0, -h * .92, s * .24);
      blockRect(-w * .12, -h * .02, w * .24, h * .3, "#292f38", "rgba(0,0,0,.2)");
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawRoyalArenaBackdrop(t) {
    const s = Math.min(W, H);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = .9;
    const arenaY = H * .48;
    ctx.fillStyle = "rgba(83,105,132,.16)";
    for (let i = 0; i < 8; i++) {
      const x = W * (.25 + i * .07);
      blockRect(x, arenaY + H * .02 + (i % 2) * H * .018, W * .035, H * .018, "rgba(83,105,132,.16)", null);
    }
    drawRoyalTower(W * .5, H * .42, s * .095, t, true);
    drawRoyalTower(W * .33, H * .49, s * .068, t + 500, false);
    drawRoyalTower(W * .67, H * .49, s * .068, t + 1000, false);
    ctx.restore();
  }

  function drawMinecraftVillage(t) {
    background("#75c8ff", "#bdefff", "#86d17a");
    glow(W * .74, H * .2, Math.min(W, H) * .48, [[0, "rgba(255,244,169,.8)"], [.28, "rgba(255,211,107,.24)"], [1, "rgba(255,211,107,0)"]]);
    const sunR = Math.min(W, H) * .052;
    ctx.fillStyle = "#ffd36b";
    ctx.beginPath();
    ctx.arc(W * .8, H * .17, sunR, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const x = wrapLeft(i * W * .26 + W * .16, t * (.018 + i * .003), W * 1.35) - W * .12;
      blockyCloud(x, H * (.13 + (i % 3) * .075), Math.min(W, H) * (.07 + (i % 2) * .025), .54);
    }
    for (let i = 0; i < 5; i++) drawVoxelBird(W * (.12 + i * .18), H * (.19 + (i % 2) * .06), Math.min(W, H) * .018, t + i * 300);
    drawRoyalArenaBackdrop(t);
    const horizon = H * .52;
    ctx.fillStyle = "#7edc65";
    ctx.fillRect(0, horizon, W, H - horizon);
    drawTerrainStep(W * .02, H * .58, W * .3, H * .13, t, 1);
    drawTerrainStep(W * .18, H * .52, W * .26, H * .1, t + 100, 0);
    drawTerrainStep(W * .58, H * .56, W * .34, H * .12, t + 200, 0);
    drawTerrainStep(W * .76, H * .49, W * .22, H * .1, t + 300, 1);
    drawTerrainStep(W * .34, H * .71, W * .28, H * .12, t + 400, 1);
    for (let i = 0; i < 18; i++) {
      const x = i * W / 17 + Math.sin(t * .00045 + i) * 6;
      drawTallGrass(x, horizon + H * (.08 + (i % 4) * .05), Math.min(W, H) * (.016 + (i % 3) * .003), t + i * 50);
    }
    for (let i = 0; i < 13; i++) {
      const p = i / 12;
      const y = horizon + H * .07 + Math.pow(p, 1.45) * (H * .42);
      const x = W * (.52 - p * .11 + Math.sin(i * 1.7) * .006);
      const size = Math.min(W, H) * (.025 + p * .018);
      blockRect(x - size * .6, y, size * 1.2, size * .34, i % 2 ? "#c69b5c" : "#a98355", "rgba(72,49,28,.18)");
    }
    drawMinecraftHouse(W * .73, H * .55, Math.min(W, H) * .082);
    drawMinecraftTree(W * .11, H * .58, Math.min(W, H) * .052, t + 500);
    drawMinecraftTree(W * .29, H * .52, Math.min(W, H) * .058, t + 900);
    drawMinecraftTree(W * .61, H * .58, Math.min(W, H) * .066, t);
    drawMinecraftTree(W * .88, H * .56, Math.min(W, H) * .06, t + 300);
    drawMinecraftTree(W * .95, H * .66, Math.min(W, H) * .048, t + 800);
    drawVoxelSheep(W * .63, H * .65, Math.min(W, H) * .048, t);
    drawVoxelSheep(W * .83, H * .63, Math.min(W, H) * .043, t + 500);
    drawVoxelSheep(W * .91, H * .54, Math.min(W, H) * .035, t + 1000);
    for (let i = 0; i < 22; i++) {
      const x = W * .1 + (i % 11) * W * .07 + Math.sin(i) * 8;
      const y = H * (.63 + Math.floor(i / 11) * .11) + (i % 4) * 5;
      drawTallGrass(x, y, Math.min(W, H) * (.018 + (i % 3) * .004), t + i * 80);
    }
    for (let i = 0; i < 18; i++) {
      const x = W * .16 + (i % 9) * W * .035;
      const y = H * .64 + Math.floor(i / 9) * H * .035;
      blockRect(x, y, W * .022, H * .03, i % 2 ? "#d2b84f" : "#66bf56", "rgba(45,84,35,.16)");
    }
    ["#fffaf0", "#ff7aa8", "#ffd36b"].forEach((color, i) => {
      flower(W * (.55 + i * .045), H * (.69 + (i % 2) * .04), Math.min(W, H) * .018, i === 1 ? "tulip" : "daisy", t * .0004 + i, .78);
    });
    extra.forEach((s, i) => drawStar(s, t, i % 6 ? "255,255,255" : "255,211,107"));
  }

  function drawBlocks(t) {
    drawMinecraftVillage(t);

    const floorY = H * .52;

    items.forEach((b, index) => {
      const y = ((b.y + t * b.v * .08) % (H + 160)) - 80;
      const depth = Math.max(.45, Math.min(1.45, (y - floorY) / (H - floorY) + .75));
      const drift = Math.sin(t * .0009 + b.p) * 18;
      const x = wrapLeft(b.x + drift, t * (.02 + b.v * .012), W + 180) - 90;
      ctx.globalAlpha = y < floorY ? .34 : .58;
      if (b.kind === "minecraft") {
        minecraftCube(x, y, b.size * depth * .68, t + index * 40);
      } else {
        legoBrick(x, y, b.size * depth * .68, b.color, t + index * 40, b.p > 4 ? 3 : 2);
      }
      ctx.globalAlpha = 1;
    });
    cinematicGrade(t, .48);
  }

  function drawFlowerTrainTrack(y, t) {
    ctx.save();
    ctx.globalAlpha = .58;
    ctx.lineCap = "round";
    for (let rail = 0; rail < 2; rail++) {
      ctx.strokeStyle = rail ? "rgba(68,54,47,.72)" : "rgba(255,250,240,.72)";
      ctx.lineWidth = rail ? 3 : 2;
      ctx.beginPath();
      for (let x = -60; x <= W + 80; x += 30) {
        const yy = y + rail * 12 + Math.sin((x + t * .018) * .012) * 5;
        if (x === -60) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(90,64,45,.68)";
    ctx.lineWidth = 4;
    for (let i = -2; i < 36; i++) {
      const x = i * W / 28 + ((t * .01) % 38);
      const yy = y + 6 + Math.sin((x + t * .018) * .012) * 5;
      ctx.beginPath();
      ctx.moveTo(x - 18, yy + 14);
      ctx.lineTo(x + 18, yy - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSteamPuff(x, y, s, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fffaf0";
    ctx.shadowColor = "rgba(255,250,240,.5)";
    ctx.shadowBlur = s * .3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + Math.cos(i * 1.7) * s * .22, y + Math.sin(i * 1.2) * s * .14, s * (.26 + i * .025), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFlowerTrain(t) {
    const s = Math.min(W, H) * .064;
    const trackY = H * .6;
    const trainW = s * 5.85;
    const span = W + trainW + s * 3;
    const localT = Math.max(0, (running ? t - sceneStartedAt : sceneElapsedBeforePause) || 0);
    const x = -trainW * .22 + (localT * .18) % span;
    const y = trackY - s * .16 + Math.sin(t * .0014) * 2;
    drawFlowerTrainTrack(trackY, t);

    for (let i = 0; i < 7; i++) {
      const p = ((t * .00055 + i * .16) % 1);
      drawSteamPuff(x + s * .78 - p * s * 2.1, y - s * .92 - p * s * .95, s * (.32 + p * .28), (1 - p) * .42);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = .88;
    ctx.shadowColor = "rgba(42,36,48,.25)";
    ctx.shadowBlur = s * .22;
    const wheel = (wx, wy, r) => {
      ctx.fillStyle = "#26303b";
      ctx.beginPath();
      ctx.arc(wx, wy, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fffaf0";
      ctx.beginPath();
      ctx.arc(wx, wy, r * .45, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,250,240,.55)";
      ctx.lineWidth = Math.max(1, r * .12);
      ctx.beginPath();
      ctx.moveTo(wx - r * .74, wy);
      ctx.lineTo(wx + r * .74, wy);
      ctx.moveTo(wx, wy - r * .74);
      ctx.lineTo(wx, wy + r * .74);
      ctx.stroke();
    };
    blockRect(-s * 1.38, -s * .48, s * 1.68, s * .86, "#e93f75", "rgba(90,22,45,.28)");
    blockRect(-s * 1.06, -s * .88, s * .52, s * .42, "#f26b95", "rgba(90,22,45,.24)");
    blockRect(-s * .52, -s * .72, s * .44, s * .25, "#ffd36b", "rgba(98,69,20,.2)");
    blockRect(s * .02, -s * .28, s * .5, s * .34, "#f2456f", "rgba(90,22,45,.28)");
    blockRect(s * .34, -s * .62, s * .24, s * .32, "#2e3740", "rgba(0,0,0,.2)");
    ctx.fillStyle = "#f6c1d1";
    ctx.beginPath();
    ctx.arc(-s * 1.46, -s * .07, s * .35, Math.PI * .5, Math.PI * 1.5);
    ctx.lineTo(-s * 1.15, -s * .42);
    ctx.lineTo(-s * 1.15, s * .28);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const cx = s * (.78 + i * 1.05);
      blockRect(cx, -s * .5, s * .88, s * .82, i % 2 ? "#cf386a" : "#e34b7f", "rgba(90,22,45,.28)");
      blockRect(cx + s * .16, -s * .34, s * .25, s * .23, "#9be7ff", "rgba(32,59,70,.2)");
      blockRect(cx + s * .5, -s * .34, s * .25, s * .23, "#9be7ff", "rgba(32,59,70,.2)");
    }
    blockRect(-s * 1.48, s * .28, s * 4.98, s * .14, "#3c3037", null);
    [-1.03, -.38, .85, 1.45, 2.0, 2.5, 3.04].forEach((wx, i) => wheel(s * wx, s * .44, s * (i < 2 ? .22 : .18)));
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawGardenJewels(t) {
    background("#73c6ff", "#aee7ff", "#92e090");
    const sunX = W * .86;
    const sunY = H * .15;
    const sunR = Math.min(W, H) * .06;
    glow(sunX, sunY, Math.min(W, H) * .42, [[0, "rgba(255,246,190,.78)"], [.32, "rgba(255,211,107,.26)"], [1, "rgba(255,211,107,0)"]]);
    drawSunRays(sunX, sunY, sunR, t);
    ctx.fillStyle = "#ffd36b";
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();

    for (let i = 0; i < 7; i++) {
      const x = wrapLeft(i * W * .22 + W * .08, t * (.016 + i * .003), W * 1.28) - W * .12;
      const y = H * (.13 + (i % 3) * .085) + Math.sin(t * .00032 + i) * 3;
      blockyCloud(x, y, Math.min(W, H) * (.07 + (i % 2) * .018), .48);
    }

    const grassTop = H * .5;
    drawDistantHills(t, grassTop + H * .12);
    const skyBloom = ctx.createLinearGradient(0, grassTop, 0, H);
    skyBloom.addColorStop(0, "#7dde84");
    skyBloom.addColorStop(.48, "#3eaf63");
    skyBloom.addColorStop(1, "#1d7b46");
    ctx.fillStyle = skyBloom;
    ctx.beginPath();
    ctx.moveTo(0, grassTop);
    for (let x = 0; x <= W; x += 28) {
      ctx.lineTo(x, grassTop + Math.sin((x + t * .026) * .013) * 18);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    drawFlowerTrain(t);

    ctx.save();
    ctx.globalAlpha = .18;
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 15; i++) {
      const y = H * (.56 + i * .028);
      ctx.beginPath();
      for (let x = -40; x <= W + 40; x += 34) {
        const yy = y + Math.sin((x + t * .04) * .011 + i) * 9;
        if (x === -40) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    const sorted = items.slice().sort((a, b) => a.y - b.y);
    sorted.forEach((f, index) => {
      const wind = Math.sin(t * .00115 + f.p + f.y * .012) * f.s * .34;
      const lift = Math.sin(t * .0009 + index) * 2.5;
      const x = f.x + Math.sin(t * .0005 + f.p) * 8;
      const y = f.y + lift;
      const stem = f.s * (1.7 + f.depth * .9);
      ctx.save();
      ctx.globalAlpha = .45 + f.depth * .42;
      ctx.strokeStyle = "rgba(36,123,62,.72)";
      ctx.lineWidth = Math.max(1, f.s * .07);
      ctx.beginPath();
      ctx.moveTo(x, y + stem * .35);
      ctx.quadraticCurveTo(x + wind * .3, y - stem * .25, x + wind, y - stem * .55);
      ctx.stroke();
      ctx.restore();
      flower(x + wind, y - stem * .58, f.s, f.type, Math.sin(t * .001 + f.p) * .16 + f.spin * 5, .64 + f.depth * .34);
    });

    const foreground = [
      [W * .08, H * .88, "gerbera", .115],
      [W * .2, H * .84, "rose", .096],
      [W * .78, H * .88, "gardenia", .105],
      [W * .9, H * .83, "tulip", .108],
      [W * .66, H * .91, "daisy", .078]
    ];
    foreground.forEach(([x, y, type, size], index) => {
      const sway = Math.sin(t * .001 + index) * Math.min(W, H) * .012;
      ctx.strokeStyle = "rgba(30,118,58,.78)";
      ctx.lineWidth = Math.max(2, Math.min(W, H) * .006);
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.quadraticCurveTo(x + sway * .4, y + 44, x + sway, y);
      ctx.stroke();
      flower(x + sway, y, Math.min(W, H) * size, type, t * .00018 + index + Math.sin(t * .001 + index) * .1, .98);
    });
    cinematicGrade(t, .32);
  }

  function drawCinemaSpace(t) {
    background("#173f7f", "#273e79", "#5c3a72");
    glow(W * .58, H * .5, Math.min(W, H) * .62, [[0, "rgba(142,232,255,.3)"], [.42, "rgba(255,211,107,.14)"], [1, "rgba(0,0,0,0)"]]);
    lightBeam(W * .28, -40, W * .46, H * .96, "rgba(142,232,255,.13)", .18);
    lightBeam(W * .82, -40, W * .42, H * .96, "rgba(255,122,168,.12)", -.2);
    items.forEach((s, i) => drawStar(s, t, i % 5 ? "255,255,255" : "255,211,107"));

    drawFilmStrip(W * .07, H * .5, W * .11, H * .86, t, .22);
    drawFilmStrip(W * .92, H * .5, W * .1, H * .82, t + 1200, .18);

    const cx = W * .6 + Math.sin(t * .0004) * W * .025;
    const cy = H * .52;
    drawWormhole(cx, cy, Math.min(W, H) * .28, t);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * .00032);
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = i % 2 ? "rgba(255,122,168,.22)" : "rgba(142,232,255,.22)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.min(W, H) * (.09 + i * .045), Math.min(W, H) * (.035 + i * .021), i * .32, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    const shipX = wrapLeft(W * 1.15, t * .08, W * 1.45) - W * .16;
    drawCinemaIcon("starship", shipX, H * .27 + Math.sin(t * .001) * 16, Math.min(W, H) * .055, t);

    drawGentleRobot(W * .26, H * .62, Math.min(W, H) * .14, t);
    drawBraveBow(W * .38, H * .34, Math.min(W, H) * .13, t);
    drawGreenStory(W * .8, H * .62, Math.min(W, H) * .14, t);
    extra.forEach((m) => {
      m.a += m.speed;
      const r = Math.min(W, H) * m.r;
      const x = cx + Math.cos(m.a) * r * 1.25;
      const y = cy + Math.sin(m.a) * r * .62;
      const s = Math.min(W, H) * .05 * m.s;
      drawCinemaIcon(m.kind, x, y, s, t + m.p * 1000);
    });
    cinematicGrade(t, .62);
  }

  function drawCinemaIcon(kind, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .001) * 5);
    ctx.rotate(Math.sin(t * .0008) * .15);
    ctx.globalAlpha = .9;
    ctx.shadowColor = "rgba(255,250,240,.28)";
    ctx.shadowBlur = 20;
    if (kind === "arrow") {
      drawBraveBow(0, 0, s * 1.6, t);
    } else if (kind === "robot") {
      drawGentleRobot(0, 0, s * 1.35, t);
    } else if (kind === "green") {
      drawGreenStory(0, 0, s * 1.45, t);
    } else if (kind === "wormhole") {
      drawWormhole(0, 0, s * 2.2, t);
    } else if (kind === "starship") {
      ctx.fillStyle = "rgba(255,250,240,.82)";
      ctx.beginPath();
      ctx.moveTo(s * 1.2, 0);
      ctx.lineTo(-s * .7, -s * .36);
      ctx.lineTo(-s * .35, 0);
      ctx.lineTo(-s * .7, s * .36);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(142,232,255,.72)";
      ctx.beginPath();
      ctx.arc(-s * .15, 0, s * .16, 0, TAU);
      ctx.fill();
    } else if (kind === "film") {
      ctx.fillStyle = "rgba(255,250,240,.78)";
      roundRect(-s, -s * .55, s * 2, s * 1.1, s * .12);
      ctx.fill();
      ctx.fillStyle = "rgba(28,36,55,.75)";
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(i * s * .38, -s * .46, s * .16, s * .16);
        ctx.fillRect(i * s * .38, s * .3, s * .16, s * .16);
      }
    } else if (kind === "heart") {
      ctx.fillStyle = "rgba(255,122,168,.9)";
      ctx.beginPath();
      ctx.moveTo(0, s * .55);
      ctx.bezierCurveTo(-s * 1.1, -s * .2, -s * .38, -s * 1.05, 0, -s * .38);
      ctx.bezierCurveTo(s * .38, -s * 1.05, s * 1.1, -s * .2, 0, s * .55);
      ctx.fill();
    } else if (kind === "crown") {
      ctx.fillStyle = "rgba(255,211,107,.92)";
      ctx.beginPath();
      ctx.moveTo(-s, s * .45);
      ctx.lineTo(-s * .72, -s * .42);
      ctx.lineTo(-s * .22, s * .08);
      ctx.lineTo(0, -s * .62);
      ctx.lineTo(s * .22, s * .08);
      ctx.lineTo(s * .72, -s * .42);
      ctx.lineTo(s, s * .45);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "book") {
      ctx.fillStyle = "rgba(147,245,189,.86)";
      ctx.beginPath();
      ctx.moveTo(-s, -s * .62);
      ctx.quadraticCurveTo(-s * .35, -s * .78, 0, -s * .45);
      ctx.quadraticCurveTo(s * .35, -s * .78, s, -s * .62);
      ctx.lineTo(s, s * .62);
      ctx.quadraticCurveTo(s * .35, s * .42, 0, s * .72);
      ctx.quadraticCurveTo(-s * .35, s * .42, -s, s * .62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(28,36,55,.38)";
      ctx.beginPath();
      ctx.moveTo(0, -s * .45);
      ctx.lineTo(0, s * .72);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(142,232,255,.85)";
      ctx.beginPath();
      ctx.arc(0, 0, s * .62, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,211,107,.72)";
      ctx.lineWidth = s * .08;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.05, s * .38, -.25, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWormhole(x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * .00045);
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = i % 2 ? "rgba(255,211,107,.18)" : "rgba(142,232,255,.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * (.18 + i * .045), r * (.06 + i * .02), i * .22, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGentleRobot(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .0015) * 8);
    ctx.fillStyle = "rgba(255,250,240,.92)";
    ctx.shadowColor = "rgba(142,232,255,.35)";
    ctx.shadowBlur = 28;
    roundRect(-s * .42, -s * .34, s * .84, s * .62, s * .28);
    ctx.fill();
    roundRect(-s * .52, s * .12, s * 1.04, s * .72, s * .3);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(33,42,58,.76)";
    ctx.lineWidth = s * .045;
    ctx.beginPath();
    ctx.moveTo(-s * .18, -s * .08);
    ctx.lineTo(s * .18, -s * .08);
    ctx.stroke();
    ctx.fillStyle = "rgba(33,42,58,.82)";
    ctx.beginPath();
    ctx.arc(-s * .26, -s * .08, s * .055, 0, TAU);
    ctx.arc(s * .26, -s * .08, s * .055, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,122,168,.85)";
    ctx.beginPath();
    ctx.moveTo(0, s * .48);
    ctx.bezierCurveTo(-s * .22, s * .32, -s * .1, s * .16, 0, s * .28);
    ctx.bezierCurveTo(s * .1, s * .16, s * .22, s * .32, 0, s * .48);
    ctx.fill();
    ctx.restore();
  }

  function drawBraveBow(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .001 + 2) * 8);
    ctx.strokeStyle = "rgba(255,211,107,.9)";
    ctx.lineWidth = s * .06;
    ctx.beginPath();
    ctx.arc(0, 0, s * .58, -1.15, 1.15);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,250,240,.78)";
    ctx.lineWidth = s * .018;
    ctx.beginPath();
    ctx.moveTo(s * .25, -s * .52);
    ctx.lineTo(s * .25, s * .52);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,122,168,.92)";
    ctx.beginPath();
    ctx.moveTo(-s * .58, 0);
    ctx.lineTo(s * .38, -s * .08);
    ctx.lineTo(s * .38, s * .08);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,211,107,.95)";
    ctx.beginPath();
    ctx.moveTo(s * .5, 0);
    ctx.lineTo(s * .28, -s * .12);
    ctx.lineTo(s * .32, 0);
    ctx.lineTo(s * .28, s * .12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGreenStory(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .001 + 4) * 8);
    ctx.fillStyle = "rgba(147,245,189,.82)";
    ctx.shadowColor = "rgba(147,245,189,.32)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(0, 0, s * .42, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(147,245,189,.82)";
    ctx.beginPath();
    ctx.arc(-s * .36, -s * .2, s * .14, 0, TAU);
    ctx.arc(s * .36, -s * .2, s * .14, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(28,36,55,.72)";
    ctx.beginPath();
    ctx.arc(-s * .15, -s * .06, s * .04, 0, TAU);
    ctx.arc(s * .15, -s * .06, s * .04, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(28,36,55,.58)";
    ctx.lineWidth = s * .035;
    ctx.beginPath();
    ctx.arc(0, s * .08, s * .16, .15, Math.PI - .15);
    ctx.stroke();
    ctx.restore();
  }

  function drawLeapingFish(x, y, s, angle, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = "rgba(255,250,240,.35)";
    ctx.shadowBlur = 14;
    const body = ctx.createLinearGradient(-s, 0, s * 1.1, 0);
    body.addColorStop(0, "rgba(210,230,236,.82)");
    body.addColorStop(1, "rgba(255,250,240,.96)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.05, s * .42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(210,230,236,.9)";
    ctx.beginPath();
    ctx.moveTo(-s * .72, -s * .04);
    ctx.lineTo(-s * 1.18, -s * .34 - Math.sin(t * .008) * s * .06);
    ctx.lineTo(-s * 1.08, 0);
    ctx.lineTo(-s * 1.18, s * .34 + Math.sin(t * .008) * s * .06);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(158,184,194,.82)";
    ctx.beginPath();
    ctx.moveTo(-s * .06, -s * .34);
    ctx.lineTo(s * .22, -s * .8);
    ctx.lineTo(s * .3, -s * .24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(20,24,35,.72)";
    ctx.beginPath();
    ctx.arc(s * .62, -s * .1, s * .055, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSea(t) {
    background("#75d4ff", "#bbefff", "#ffd2a3");
    const sunY = H * .47;
    glow(W * .74, sunY, Math.min(W, H) * .55, [[0, "rgba(255,245,186,.96)"], [.3, "rgba(255,174,104,.42)"], [1, "rgba(255,174,104,0)"]]);
    drawSunRays(W * .72, sunY, Math.min(W, H) * .075, t);
    ctx.fillStyle = "rgba(255,211,107,.95)";
    ctx.beginPath();
    ctx.arc(W * .72, sunY, Math.min(W, H) * .075, 0, TAU);
    ctx.fill();
    extra.forEach((s, i) => drawStar(s, t, i % 7 ? "255,255,255" : "255,211,107"));
    const horizon = H * .54;
    ctx.fillStyle = "rgba(255,246,190,.55)";
    ctx.fillRect(0, horizon - 2, W, 4);

    for (let i = 0; i < 7; i++) {
      const blues = [
        "rgba(87,195,221,.42)",
        "rgba(57,174,214,.5)",
        "rgba(40,150,199,.58)",
        "rgba(28,128,184,.66)",
        "rgba(22,106,168,.74)",
        "rgba(17,88,151,.8)",
        "rgba(12,72,132,.86)"
      ];
      const y0 = horizon + i * 33;
      ctx.fillStyle = blues[i];
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= W; x += 24) {
        ctx.lineTo(x, y0 + Math.sin((x + t * (.04 + i * .02)) * .018 + i) * (9 + i * 2));
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,250,240,${.13 + i * .018})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 28) {
        const y = y0 + Math.sin((x + t * (.06 + i * .025)) * .018 + i) * (8 + i * 1.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const reflection = ctx.createLinearGradient(W * .74, horizon, W * .74, H);
    reflection.addColorStop(0, "rgba(255,225,128,.48)");
    reflection.addColorStop(.52, "rgba(255,181,112,.18)");
    reflection.addColorStop(1, "rgba(255,181,112,0)");
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.moveTo(W * .62, horizon);
    ctx.lineTo(W * .86, horizon);
    ctx.lineTo(W * .82, H);
    ctx.lineTo(W * .55, H);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const phase = (t * (.00012 + i * .000006) + i * .19) % 1;
      const x = phase * (W + 240) - 120;
      const arc = Math.sin(phase * Math.PI);
      const y = horizon + 54 - arc * (74 + (i % 3) * 18);
      if (arc > .08) {
        const angle = -.78 + phase * 1.56;
        drawLeapingFish(x, y, Math.min(W, H) * (.018 + (i % 2) * .006), angle, t + i * 200);
        ctx.strokeStyle = "rgba(255,250,240,.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - 18, horizon + 44, 18 + i * 2, Math.PI * .1, Math.PI * .7);
        ctx.stroke();
      }
    }

    items.forEach((a, index) => {
      const depth = .68 + Math.max(0, (a.y - horizon) / (H - horizon)) * .48;
      const x = wrapLeft(a.x, -t * a.v * (.09 + depth * .045), W + 280) - 110;
      const y = a.y + Math.sin(t * .0018 + index) * 8;
      ctx.save();
      ctx.translate(x, y);
      const swimLean = Math.sin(t * .005 + a.p) * .08;
      ctx.rotate(swimLean);
      ctx.strokeStyle = "rgba(255,250,240,.2)";
      ctx.lineWidth = Math.max(1, a.s * .05);
      ctx.beginPath();
      ctx.moveTo(-a.s * 1.65, a.s * .08);
      ctx.quadraticCurveTo(-a.s * 1.1, -a.s * .12, -a.s * .45, a.s * .03);
      ctx.stroke();
      if (a.animal === "pez") {
        const body = ctx.createLinearGradient(-a.s, 0, a.s * 1.2, 0);
        body.addColorStop(0, "rgba(233,248,244,.72)");
        body.addColorStop(1, "rgba(255,250,240,.94)");
        ctx.fillStyle = body;
        ctx.shadowColor = "rgba(255,250,240,.32)";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(0, 0, a.s * 1.12 * depth, a.s * .46 * depth, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,250,240,.86)";
        ctx.beginPath();
        ctx.moveTo(-a.s * 1.02 * depth, 0);
        ctx.lineTo(-a.s * 1.55 * depth, (-a.s * .36 - Math.sin(t * .006 + index) * a.s * .08) * depth);
        ctx.lineTo(-a.s * 1.44 * depth, 0);
        ctx.lineTo(-a.s * 1.55 * depth, (a.s * .36 + Math.sin(t * .006 + index) * a.s * .08) * depth);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(20,24,35,.75)";
        ctx.beginPath();
        ctx.arc(a.s * .72 * depth, -a.s * .1 * depth, a.s * .06 * depth, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(142,232,255,.62)";
        ctx.lineWidth = a.s * .07 * depth;
        ctx.beginPath();
        ctx.moveTo(-a.s * .1 * depth, a.s * .22 * depth);
        ctx.quadraticCurveTo(a.s * .16 * depth, a.s * .48 * depth, a.s * .42 * depth, a.s * .22 * depth);
        ctx.stroke();
        ctx.restore();
        return;
      }
      ctx.fillStyle = a.animal === "gato" ? "rgba(35,32,42,.8)" : a.animal === "oso" ? "rgba(120,82,55,.78)" : "rgba(255,250,240,.72)";
      ctx.shadowColor = "rgba(255,250,240,.3)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, a.s * 1.2, a.s * .52, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(a.s * .72, -a.s * .12, a.s * .38, 0, TAU);
      ctx.fill();
      if (a.animal === "gato") {
        ctx.beginPath();
        ctx.moveTo(a.s * .5, -a.s * .38);
        ctx.lineTo(a.s * .62, -a.s * .78);
        ctx.lineTo(a.s * .76, -a.s * .34);
        ctx.moveTo(a.s * .88, -a.s * .34);
        ctx.lineTo(a.s * 1.04, -a.s * .76);
        ctx.lineTo(a.s * 1.08, -a.s * .26);
        ctx.strokeStyle = "rgba(35,32,42,.8)";
        ctx.lineWidth = a.s * .12;
        ctx.stroke();
      } else if (a.animal === "oso") {
        ctx.beginPath();
        ctx.arc(a.s * .45, -a.s * .43, a.s * .18, 0, TAU);
        ctx.arc(a.s * .95, -a.s * .43, a.s * .18, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(-a.s * .95, 0);
        ctx.lineTo(-a.s * 1.35, -a.s * .25);
        ctx.moveTo(-a.s * .95, 0);
        ctx.lineTo(-a.s * 1.35, a.s * .25);
        ctx.strokeStyle = "rgba(255,250,240,.72)";
        ctx.lineWidth = a.s * .12;
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(20,24,35,.75)";
      ctx.beginPath();
      ctx.arc(a.s * .82, -a.s * .18, a.s * .055, 0, TAU);
      ctx.arc(a.s * 1.04, -a.s * .1, a.s * .055, 0, TAU);
      ctx.fill();
      ctx.restore();
    });

    const beachY = H * .84;
    const sand = ctx.createLinearGradient(0, beachY, 0, H);
    sand.addColorStop(0, "rgba(255,221,156,.82)");
    sand.addColorStop(1, "rgba(196,142,91,.94)");
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.moveTo(0, beachY);
    for (let x = 0; x <= W; x += 26) {
      ctx.lineTo(x, beachY + Math.sin((x + t * .05) * .014) * 12);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,250,240,.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 22) {
      const y = beachY + Math.sin((x + t * .08) * .017) * 11;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    cinematicGrade(t, .42);
  }

  function drawSweetMusic(t) {
    background("#190d18", "#40234d", "#17243c");
    glow(W * .58, H * .48, Math.min(W, H) * .62, [[0, "rgba(255,211,107,.26)"], [.34, "rgba(255,122,168,.2)"], [1, "rgba(0,0,0,0)"]]);
    lightBeam(W * .48, -20, W * .5, H * .9, "rgba(255,211,107,.12)", Math.sin(t * .0003) * .08);

    ctx.save();
    ctx.strokeStyle = "rgba(255,250,240,.16)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      for (let x = -80; x <= W + 80; x += 28) {
        const y = H * .25 + i * 28 + Math.sin((x + t * .04) * .01 + i) * 10;
        if (x === -80) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    items.forEach((d, index) => {
      const y = ((d.y + t * d.v * .05) % (H + 120)) - 60;
      const x = d.x + Math.sin(t * .0009 + d.p) * 22;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * .001 + d.p) * .45);
      ctx.globalAlpha = .78;
      if (d.kind === "banana") {
        ctx.strokeStyle = "#ffd36b";
        ctx.lineWidth = d.s * .24;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, d.s, .25, Math.PI * 1.18);
        ctx.stroke();
        ctx.strokeStyle = "rgba(121,70,28,.45)";
        ctx.lineWidth = d.s * .06;
        ctx.stroke();
      } else if (d.kind === "note") {
        noteShape(0, 0, d.s * .82, index % 2 ? "#8ee8ff" : "#ffb6d5");
      } else if (d.kind === "cake") {
        ctx.fillStyle = "#ffb6d5";
        roundRect(-d.s * .62, -d.s * .26, d.s * 1.24, d.s * .58, d.s * .12);
        ctx.fill();
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(-d.s * .52, -d.s * .45, d.s * 1.04, d.s * .18);
      } else {
        sparkleShape(0, 0, d.s * .2, "#fffaf0");
      }
      ctx.restore();
    });

    const plateX = W * .68;
    const plateY = H * .65 + Math.sin(t * .0007) * 4;
    drawDessertPlate(plateX, plateY, Math.min(W, H) * .115, t);
    drawChefRat(plateX - Math.min(W, H) * .22, plateY + Math.min(W, H) * .02, Math.min(W, H) * .11, t);
    noteShape(plateX + Math.min(W, H) * .19, plateY - Math.min(W, H) * .13, Math.min(W, H) * .045, "#8ee8ff");
    cinematicGrade(t, .62);
  }

  function drawSchoolKid(x, y, s, color, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .0012 + x) * 2);
    ctx.fillStyle = "rgba(0,0,0,.12)";
    ctx.beginPath();
    ctx.ellipse(0, s * .86, s * .55, s * .12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffe0c8";
    ctx.beginPath();
    ctx.arc(0, -s * .2, s * .28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(-s * .34, s * .08, s * .68, s * .58, s * .1);
    ctx.fill();
    ctx.fillStyle = "rgba(38,43,55,.82)";
    ctx.beginPath();
    ctx.arc(-s * .09, -s * .24, s * .025, 0, TAU);
    ctx.arc(s * .09, -s * .24, s * .025, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(38,43,55,.45)";
    ctx.lineWidth = Math.max(1, s * .018);
    ctx.beginPath();
    ctx.arc(0, -s * .12, s * .08, .2, Math.PI - .2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = s * .12;
    ctx.beginPath();
    ctx.moveTo(-s * .3, s * .22);
    ctx.lineTo(-s * .62, s * .44);
    ctx.moveTo(s * .3, s * .22);
    ctx.lineTo(s * .62, s * .44);
    ctx.stroke();
    ctx.strokeStyle = "rgba(38,43,55,.55)";
    ctx.lineWidth = s * .1;
    ctx.beginPath();
    ctx.moveTo(-s * .16, s * .64);
    ctx.lineTo(-s * .24, s * 1.02);
    ctx.moveTo(s * .16, s * .64);
    ctx.lineTo(s * .24, s * 1.02);
    ctx.stroke();
    ctx.restore();
  }

  function drawClassroom(t) {
    background("#ffe4bb", "#ffd9e6", "#d7f2ff");
    ctx.fillStyle = "rgba(255,250,240,.45)";
    ctx.fillRect(0, 0, W, H * .58);
    const floorY = H * .62;
    ctx.fillStyle = "#c9905a";
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = "rgba(91,54,28,.18)";
    ctx.lineWidth = 1;
    for (let i = -8; i < 18; i++) {
      const y = floorY + i * H * .035;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + H * .08);
      ctx.stroke();
    }
    const boardX = W * .63;
    const boardY = H * .2;
    const boardW = W * .42;
    const boardH = H * .22;
    ctx.shadowColor = "rgba(0,0,0,.2)";
    ctx.shadowBlur = 18;
    blockRect(boardX - boardW / 2, boardY - boardH / 2, boardW, boardH, "#2f8065", "rgba(58,37,18,.38)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,250,240,.32)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(boardX - boardW * .36, boardY - boardH * .02);
    ctx.quadraticCurveTo(boardX - boardW * .08, boardY - boardH * .22, boardX + boardW * .18, boardY - boardH * .04);
    ctx.moveTo(boardX - boardW * .22, boardY + boardH * .18);
    ctx.lineTo(boardX + boardW * .28, boardY + boardH * .18);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,211,107,.8)";
    sparkleShape(boardX + boardW * .36, boardY - boardH * .22, Math.min(W, H) * .018, "rgba(255,211,107,.85)");

    const winW = W * .16;
    const winH = H * .23;
    blockRect(W * .12, H * .12, winW, winH, "#8fd7ff", "rgba(255,250,240,.8)");
    ctx.strokeStyle = "rgba(255,250,240,.82)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * .12 + winW / 2, H * .12);
    ctx.lineTo(W * .12 + winW / 2, H * .12 + winH);
    ctx.moveTo(W * .12, H * .12 + winH * .5);
    ctx.lineTo(W * .12 + winW, H * .12 + winH * .5);
    ctx.stroke();

    const kidColors = ["#ff7aa8", "#8ee8ff", "#ffd36b", "#93f5bd", "#bda7ff", "#ff9f66"];
    for (let i = 0; i < 12; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = W * .2 + col * W * .115 + (row ? W * .035 : 0);
      const y = H * (.66 + row * .13);
      const s = Math.min(W, H) * (.042 + row * .008);
      blockRect(x - s * .8, y + s * .34, s * 1.6, s * .24, "#8a5a35", "rgba(49,31,18,.28)");
      blockRect(x - s * .68, y + s * .54, s * .16, s * .5, "#6f4528", null);
      blockRect(x + s * .52, y + s * .54, s * .16, s * .5, "#6f4528", null);
      drawSchoolKid(x, y, s, kidColors[i % kidColors.length], t + i * 130);
    }
  }

  function drawPainting(t) {
    drawClassroom(t);
    glow(W * .58, H * .54, Math.min(W, H) * .6, [[0, "rgba(255,250,240,.56)"], [.45, "rgba(142,232,255,.18)"], [1, "rgba(0,0,0,0)"]]);
    lightBeam(W * .64, -30, W * .5, H * .95, "rgba(255,250,240,.2)", -.08);
    const px = W * .6;
    const py = H * .52 + Math.sin(t * .00045) * 5;
    const pw = Math.min(W * .5, 560);
    const ph = Math.min(H * .5, 360);
    ctx.save();
    ctx.shadowColor = "rgba(73,55,36,.24)";
    ctx.shadowBlur = 34;
    ctx.fillStyle = "rgba(118,77,46,.88)";
    ctx.fillRect(px - pw * .02, py + ph * .5, pw * .04, H * .32);
    ctx.beginPath();
    ctx.moveTo(px - pw * .38, py + ph * .5);
    ctx.lineTo(px - pw * .56, H);
    ctx.moveTo(px + pw * .38, py + ph * .5);
    ctx.lineTo(px + pw * .56, H);
    ctx.strokeStyle = "rgba(118,77,46,.88)";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,250,240,.94)";
    ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
    ctx.strokeStyle = "rgba(255,211,107,.82)";
    ctx.lineWidth = 9;
    ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    ctx.restore();
    items.forEach((s, index) => {
      const progress = (Math.sin(t * .001 + s.p) + 1) / 2;
      ctx.save();
      ctx.translate((s.x + t * s.v * .02) % W, s.y);
      ctx.rotate(Math.sin(t * .0008 + s.p) * .4);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = .35 + progress * .45;
      ctx.lineWidth = s.w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-s.len / 2, 0);
      ctx.quadraticCurveTo(0, Math.sin(index) * 34, s.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(px, py);
    const doc = Math.min(W, H) * .18;
    ctx.fillStyle = "rgba(255,250,240,.9)";
    roundRect(-doc * .5, -doc * .52, doc, doc * .9, doc * .05);
    ctx.fill();
    ctx.strokeStyle = "rgba(31,42,58,.28)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-doc * .3, -doc * .2);
    ctx.lineTo(doc * .3, -doc * .2);
    ctx.moveTo(-doc * .24, -doc * .02);
    ctx.lineTo(doc * .24, -doc * .02);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,211,107,.9)";
    ctx.beginPath();
    ctx.arc(doc * .22, doc * .28, doc * .09, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,122,168,.88)";
    ctx.beginPath();
    ctx.moveTo(doc * .22, doc * .36);
    ctx.lineTo(doc * .13, doc * .55);
    ctx.lineTo(doc * .22, doc * .48);
    ctx.lineTo(doc * .31, doc * .55);
    ctx.closePath();
    ctx.fill();
    ["gerbera", "tulip", "daisy"].forEach((type, i) => {
      flower(-doc * .72 + i * doc * .72, doc * .72, doc * .18, type, t * .00035 + i, .9);
    });
    ctx.restore();

    ctx.save();
    ctx.translate(W * .28, H * .72);
    ctx.rotate(-.4);
    ctx.fillStyle = "rgba(80,48,32,.78)";
    roundRect(-Math.min(W, H) * .015, -Math.min(W, H) * .22, Math.min(W, H) * .03, Math.min(W, H) * .36, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(142,232,255,.9)";
    ctx.beginPath();
    ctx.moveTo(-Math.min(W, H) * .04, Math.min(W, H) * .12);
    ctx.lineTo(Math.min(W, H) * .04, Math.min(W, H) * .12);
    ctx.lineTo(0, Math.min(W, H) * .22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    cinematicGrade(t, .34);
  }

  function drawPortal(t) {
    background("#02040b", "#090e24", "#180b18");
    items.forEach((s, i) => drawStar(s, t, i % 6 ? "255,255,255" : "255,211,107"));
    const cx = W * .58;
    const cy = H * .5;
    glow(cx, cy, Math.min(W, H) * .56, [[0, "rgba(255,211,107,.22)"], [.35, "rgba(255,122,168,.12)"], [1, "rgba(0,0,0,0)"]]);
    lightBeam(cx, 0, W * .5, H * .8, "rgba(142,232,255,.1)", Math.sin(t * .0003) * .06);

    for (let i = 0; i < 12; i++) {
      const pulse = Math.sin(t * .001 + i) * 8;
      ctx.strokeStyle = i % 2 ? "rgba(255,122,168,.2)" : "rgba(142,232,255,.24)";
      ctx.lineWidth = 1.2 + i * .08;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(W, H) * (.07 + i * .033) + pulse, 0, TAU);
      ctx.stroke();
    }

    ctx.save();
    ctx.fillStyle = "rgba(255,250,240,.08)";
    ctx.beginPath();
    ctx.moveTo(W * .18, H);
    ctx.lineTo(cx - Math.min(W, H) * .1, cy + Math.min(W, H) * .12);
    ctx.lineTo(cx + Math.min(W, H) * .1, cy + Math.min(W, H) * .12);
    ctx.lineTo(W * .82, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,211,107,.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const p = i / 8;
      const y = cy + Math.min(W, H) * .12 + Math.pow(p, 1.7) * (H - cy);
      ctx.beginPath();
      ctx.moveTo(W * (.42 - p * .24), y);
      ctx.lineTo(W * (.58 + p * .24), y);
      ctx.stroke();
    }
    ctx.restore();

    extra.forEach((m) => {
      m.a += m.speed;
      const r = Math.min(W, H) * m.r;
      const pull = .82 + Math.sin(t * .00055 + m.p) * .12;
      const x = cx + Math.cos(m.a) * r * 1.35 * pull;
      const y = cy + Math.sin(m.a) * r * .72 * pull;
      drawPortalIcon(m.kind, x, y, Math.min(W, H) * .046 * m.s, t + m.p * 1000);
    });
    cinematicGrade(t, .7);
  }

  function drawPortalIcon(kind, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * .001) * 6);
    ctx.rotate(Math.sin(t * .0009) * .18);
    ctx.shadowColor = "rgba(255,250,240,.3)";
    ctx.shadowBlur = 18;
    ctx.globalAlpha = .88;
    if (kind === "cloud") {
      ctx.fillStyle = "rgba(255,250,240,.86)";
      ctx.beginPath();
      ctx.arc(-s * .42, 0, s * .34, 0, TAU);
      ctx.arc(0, -s * .16, s * .42, 0, TAU);
      ctx.arc(s * .44, 0, s * .32, 0, TAU);
      ctx.fill();
      ctx.fillRect(-s * .72, 0, s * 1.44, s * .26);
    } else if (kind === "flower") {
      flower(0, 0, s * .7, "tulip", t * .001, .95);
    } else if (kind === "block") {
      minecraftCube(0, 0, s * .75, t);
    } else if (kind === "music") {
      ctx.fillStyle = "#8ee8ff";
      ctx.font = `900 ${s * 1.6}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("♪", 0, s * .4);
    } else if (kind === "wave") {
      ctx.strokeStyle = "rgba(142,232,255,.9)";
      ctx.lineWidth = s * .16;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.bezierCurveTo(-s * .5, -s * .55, 0, s * .55, s, 0);
      ctx.stroke();
    } else if (kind === "sweet") {
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = s * .24;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, s * .72, .2, Math.PI * 1.18);
      ctx.stroke();
    } else if (kind === "paint") {
      ctx.fillStyle = "rgba(255,250,240,.88)";
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * .68, 0, 0, TAU);
      ctx.fill();
      ["#ff7aa8", "#ffd36b", "#8ee8ff", "#93f5bd"].forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(-s * .44 + i * s * .3, -s * .08 + (i % 2) * s * .18, s * .14, 0, TAU);
        ctx.fill();
      });
    } else if (kind === "planet") {
      ctx.fillStyle = "rgba(142,232,255,.84)";
      ctx.beginPath();
      ctx.arc(0, 0, s * .62, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,211,107,.78)";
      ctx.lineWidth = s * .1;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.05, s * .36, -.25, 0, TAU);
      ctx.stroke();
    } else if (kind === "jewel") {
      ctx.fillStyle = "#ffb6d5";
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * .8, -s * .15);
      ctx.lineTo(s * .38, s);
      ctx.lineTo(-s * .38, s);
      ctx.lineTo(-s * .8, -s * .15);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "game") {
      legoBrick(0, 0, s * .85, "#ff7aa8", t, 2);
    } else if (kind === "leaf") {
      ctx.fillStyle = "#93f5bd";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * .44, s, .65, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = "#ffd36b";
      ctx.font = `900 ${s * 1.6}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("✦", 0, s * .48);
    }
    ctx.restore();
  }

  function drawFrame(t) {
    if (scene === "sky") drawSky(t);
    if (scene === "blocks") drawBlocks(t);
    if (scene === "gardenJewels") drawGardenJewels(t);
    if (scene === "cinemaSpace") drawCinemaSpace(t);
    if (scene === "sea") drawSea(t);
    if (scene === "sweetMusic") drawSweetMusic(t);
    if (scene === "painting") drawPainting(t);
    if (scene === "portal") drawPortal(t);
    drawFlyingSnoopyHouse(t);
    updateInteraction(t);
  }

  function frame(t) {
    if (!running) {
      rafId = 0;
      return;
    }
    drawFrame(t);
    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (!running || !sceneStartedAt) {
      sceneStartedAt = performance.now() - sceneElapsedBeforePause;
    }
    running = true;
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function pauseLoop() {
    if (running && sceneStartedAt) {
      sceneElapsedBeforePause = Math.max(0, performance.now() - sceneStartedAt);
    }
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  addEventListener("pointermove", (event) => {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
  }, { passive: true });
  addEventListener("pointerdown", (event) => {
    pointer.active = true;
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    burst(event.clientX, event.clientY);
  }, { passive: true });
  addEventListener("pointerup", () => {
    pointer.active = false;
  }, { passive: true });
  addEventListener("pointercancel", () => {
    pointer.active = false;
  }, { passive: true });
  addEventListener("message", (event) => {
    if (!event.data || event.data.type !== "scene-control") return;
    if (event.data.action === "pause") pauseLoop();
    if (event.data.action === "resume") startLoop();
  });
  resize();
  if (running) {
    startLoop();
  } else {
    drawFrame(performance.now());
  }
})();
