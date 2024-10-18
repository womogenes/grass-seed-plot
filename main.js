let seeds = [];
const charges = [];
const lastFrameTimestamp = new Date();

const spacing = 40;
const k = 1e6; // Electric constant

let capturer;
window.capturer = capturer;
let canvas;
let startTime;
let prevT, t;
let recording = false;

const eForce = (a, b, qa, qb) => {
  // a and b are vectors
  const denom = Math.pow(p5.Vector.sub(a, b).magSq() + 10, 1.5);
  return createVector(
    (k * (b.x - a.x) * qa * qb) / denom,
    (k * (b.y - a.y) * qa * qb) / denom
  );
};

window.setup = () => {
  capturer = new CCapture({
    framerate: 60,
    format: 'webm',
    autoSaveTime: 1,
  });

  canvas = createCanvas(1080, 1920);
  pixelDensity(1);
  for (let x = 0; x <= width; x += spacing) {
    for (let y = 0; y <= height; y += spacing) {
      seeds.push({
        pos: createVector(
          x + (Math.random() * spacing) / 2,
          y + (Math.random() * spacing) / 2
        ),
        vel: createVector(0, 0),
      });
    }
  }
  console.log(`Generated ${seeds.length} seeds`);

  let s = 100;
  let q = 2;
  charges.push(
    ...[
      {
        pos: [width / 2, height / 2],
        vel: [0, 0],
        q: q,
        fixed: true,
      },
      {
        pos: [width / 2 + 400, height / 2],
        vel: [0, s],
        q: -q,
        fixed: false,
      },
    ]
  );

  for (let charge of charges) {
    charge.pos = createVector(...charge.pos);
    charge.vel = createVector(...charge.vel);
    charge.r = Math.max(10, Math.sqrt(Math.abs(charge.q)) * 30);
  }

  startTime = Date.now();
};

window.draw = () => {
  endFrame = 360; // Math.ceil(240 * 2 * Math.PI);

  if (frameCount === 1 && recording) {
    capturer.start();
    prevT = t;
  } else if (frameCount === endFrame && recording) {
    capturer.stop();
    capturer.save();
    recording = false;
  }
  prevT = t;
  t = (Date.now() - startTime) / 1000;
  const dt = 1 / 30;

  background(250);
  strokeWeight(2);

  const theta = t / 2 + Math.PI / 2;
  // charges[0].pos.x = Math.cos(theta) * 350 + width / 2;
  // charges[0].pos.y = Math.sin(theta) * 350 + height / 2;

  // charges[0].pos.x = mouseX;
  // charges[0].pos.y = mouseY;

  // Move charges
  for (let charge of charges) {
    if (!charge.fixed) charge.pos.add(p5.Vector.mult(charge.vel, dt));

    // Bounce against edges
    if (charge.pos.x > width - charge.r) {
      charge.pos.x = width - charge.r;
      charge.vel.x *= -1;
    }
    if (charge.pos.x < charge.r) {
      charge.pos.x = charge.r;
      charge.vel.x *= -1;
    }
    if (charge.pos.y > height - charge.r) {
      charge.pos.y = height - charge.r;
      charge.vel.y *= -1;
    }
    if (charge.pos.y < charge.r) {
      charge.pos.y = charge.r;
      charge.vel.y *= -1;
    }
  }

  // Make charges orbit each other
  for (let i = 0; i < charges.length; i++) {
    for (let j = i + 1; j < charges.length; j++) {
      const a = charges[i];
      const b = charges[j];
      let acc = eForce(a.pos, b.pos, a.q, b.q);

      const dp = p5.Vector.sub(b.pos, a.pos);
      const d = dp.mag();
      if (d < a.r + b.r) {
        const mtd = (a.r + b.r - d) / 2;
        if (!a.fixed) a.pos.sub(p5.Vector.mult(dp, mtd / d));
        if (!b.fixed) b.pos.add(p5.Vector.mult(dp, mtd / d));
        acc = dp;
      }

      acc.limit(500);
      a.vel.sub(p5.Vector.mult(acc, dt));
      b.vel.add(p5.Vector.mult(acc, dt));
    }
  }

  for (let seed of seeds) {
    let acc = createVector(0, 0);
    for (let charge of charges) {
      acc = p5.Vector.add(acc, eForce(charge.pos, seed.pos, charge.q, 1e2));
    }

    // strokeWeight(Math.max(1, Math.min(acc.mag() / 100, 2)));
    stroke(Math.max(128, 196 - acc.mag() / 4));

    if (acc.mag() < 10) {
      acc.mult(10 / acc.mag());
    }
    acc.limit(60);
    let startPos = p5.Vector.sub(seed.pos, p5.Vector.mult(acc, 0.5));
    let endPos = p5.Vector.add(seed.pos, p5.Vector.mult(acc, 0.5));

    const hashSeed = (seed.pos.x + 1000 * seed.pos.y) % 1;

    // Animation timer from 0 to 1
    const prog = (hashSeed + t / 2) % 1;
    const startLerp = prog < 0.5 ? (1 - Math.cos(2 * Math.PI * prog)) / 2 : 0;
    const endLerp =
      prog < 0.5 ? 1 : (1 - Math.cos(2 * Math.PI * prog + Math.PI)) / 2;

    const actualStartPos = p5.Vector.lerp(startPos, endPos, startLerp);
    const actualEndPos = p5.Vector.lerp(startPos, endPos, endLerp);

    line(actualStartPos.x, actualStartPos.y, actualEndPos.x, actualEndPos.y);
  }

  for (let charge of charges) {
    if (charge.q > 0) {
      stroke(196, 100, 100);
    } else {
      stroke(100, 100, 196);
    }
    strokeWeight(charge.r * 2);
    point(charge.pos.x, charge.pos.y);
  }

  if (recording) capturer.capture(canvas.elt);

  let secElapsed = (new Date() - startTime) / 1000;
  let secETA = ((endFrame - frameCount) * secElapsed) / frameCount;
  document.querySelector(
    '#stats'
  ).innerText = `Frame ${frameCount}/${endFrame} | Elapsed: ${secElapsed.toFixed(
    2
  )} s | ${(secElapsed / frameCount).toFixed(2)} s/it | ETA: ${Math.floor(
    secETA / 60
  )
    .toString()
    .padStart(2, '0')}:${(secETA % 60).toFixed(0).padStart(2, '0')}`;
};
