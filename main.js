let seeds = [];
const charges = [];
const lastFrameTimestamp = new Date();

const spacing = 20;
const k = 1e-6; // Electric constant

let capturer;
window.capturer = capturer;
let canvas;
let startTime;

const eForce = (a, b, qa, qb) => {
  // a and b are vectors
  const denom = Math.pow(p5.Vector.sub(a, b).magSq() + 1, 1);
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

  charges.push({
    pos: createVector(width / 2, height / 2),
    q: -20,
  });
  charges.push({
    pos: createVector(width / 2 - 300, height / 2),
    q: 30,
  });
  charges.push({
    pos: createVector(width / 2 + 300, height / 2),
    q: -10,
  });
};

window.draw = () => {
  if (frameCount === 1) {
    // capturer.start();
    startTime = Date.now();
  } else if (frameCount === endFrame) {
    capturer.stop();
    capturer.save();
  }
  const t = (Date.now() - startTime) / 1000;

  background(250);
  strokeWeight(2);

  const theta = t / 2 + Math.PI / 2;
  endFrame = Math.ceil(240 * 2 * Math.PI);
  // charges[0].pos.x = Math.cos(theta) * 350 + width / 2;
  // charges[0].pos.y = Math.sin(theta) * 350 + height / 2;

  charges[0].pos.x = mouseX;
  charges[0].pos.y = mouseY;

  for (let seed of seeds) {
    // Calculate accelerations
    let acc = createVector(0, 0);
    for (let charge of charges) {
      acc = p5.Vector.add(acc, eForce(charge.pos, seed.pos, charge.q, 1e10));
    }

    // strokeWeight(Math.max(1, Math.min(acc.mag() / 100, 2)));
    stroke(Math.max(128, 196 - acc.mag() / 4));

    if (acc.mag() < 10) {
      acc.mult(10 / acc.mag());
    }
    acc.limit(50);
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
      stroke(128, 64, 64);
    } else {
      stroke(64, 64, 128);
    }
    strokeWeight(Math.sqrt(Math.abs(charge.q)) * 10);
    point(charge.pos.x, charge.pos.y);
  }

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
