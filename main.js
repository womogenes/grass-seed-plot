let seeds = [];
const charges = [];
const lastFrameTimestamp = new Date();

const spacing = 10;
const k = 1e-6; // Electric constant

const distSq = (a, b) => {
  return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
};

const eForce = (a, b, qa, qb) => {
  // a and b are vectors
  const denom = Math.pow(distSq(a, b) + 1, 1.5);
  return {
    x: (k * (b.x - a.x) * qa * qb) / denom,
    y: (k * (b.y - a.y) * qa * qb) / denom,
  };
};

const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

window.setup = () => {
  createCanvas(600, 600);
  for (let x = 0; x <= width; x += spacing) {
    for (let y = 0; y <= height; y += spacing) {
      seeds.push({ x, y, vx: 0, vy: 0 });
    }
  }
  console.log(`Generated ${seeds.length} seeds`);

  charges.push({
    x: width / 2 - 100,
    y: height / 2 + spacing / 2,
    q: 1,
  });
  charges.push({
    x: width / 2 + 100 + spacing / 2,
    y: height / 2 + spacing / 2,
    q: -1,
  });
};

window.draw = () => {
  const dt = Math.min(Date.now() - lastFrameTimestamp, 10000);

  background(255, 10);

  // Add random seeds
  if (frameCount % 1 === 0) {
    const theta = Math.random() * 2 * Math.PI;
    const r = randomGaussian() * 5 + 20;
    seeds.push({
      x: Math.cos(theta) * r + charges[0].x + 20,
      y: Math.sin(theta) * r + charges[0].y,
      vx: 0,
      vy: 0,
    });
  }

  stroke(128);
  strokeWeight(2);
  for (let seed of seeds) {
    point(seed.x, seed.y);
  }

  for (let charge of charges) {
    if (charge.q > 0) {
      stroke(255, 128, 128);
    } else {
      stroke(128, 128, 255);
    }
    strokeWeight(Math.abs(charge.q) * 10);
    point(charge.x, charge.y);
  }

  // Move seeds according to charges
  for (let seed of seeds) {
    // Calculate accelerations
    let acc = { x: 0, y: 0 };
    for (let charge of charges) {
      acc = add(acc, eForce(charge, seed, charge.q, 1));
    }

    seed.vx = seed.vx * 0.9 + acc.x * dt * 100 * 0.1;
    seed.vy = seed.vy * 0.9 + acc.y * dt * 100 * 0.1;

    /* const mag = Math.sqrt(seed.vx * seed.vx + seed.vy * seed.vy);
    if (mag > 5) {
      seed.vx *= 5 / mag;
      seed.vy *= 5 / mag;
    } */

    // Update positions
    seed.x += seed.vx * dt;
    seed.y += seed.vy * dt;
  }

  // Remove bad seeds
  seeds = seeds.filter((seed) => {
    if (!(0 <= seed.x && seed.x <= width && 0 <= seed.y && seed.y <= height)) {
      return false;
    }
    for (let charge of charges) {
      if (distSq(charge, seed) < 10 * 10) return false;
    }
    return true;
  });
};
