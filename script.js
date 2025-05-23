const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

let outlineColor = "white"; // default outline color
let rainbowHue = 0;
let isRainbow = false;
let paused = false;

// Add UI controls dynamically using JS
const controlDiv = document.createElement("div");
controlDiv.style.position = "absolute";
controlDiv.style.top = "10px";
controlDiv.style.right = "10px";
controlDiv.style.background = "black";
controlDiv.style.padding = "10px";
controlDiv.style.border = "1px solid white";
controlDiv.style.color = "white";
controlDiv.style.display = "flex";
controlDiv.style.flexDirection = "column";
controlDiv.style.gap = "10px";
controlDiv.style.userSelect = "none";
controlDiv.style.fontFamily = "monospace";
controlDiv.style.fontSize = "14px";

controlDiv.innerHTML = `
  <label for="colorSelect">Outline Color:</label>
  <select id="colorSelect">
    <option value="white">White</option>
    <option value="red">Red</option>
    <option value="green">Green</option>
    <option value="blue">Blue</option>
    <option value="rainbow">Rainbow</option>
  </select>
  <button id="pauseBtn">Pause</button>
`;
document.body.appendChild(controlDiv);

const colorSelect = document.getElementById("colorSelect");
colorSelect.addEventListener("change", (e) => {
  if (e.target.value === "rainbow") {
    isRainbow = true;
  } else {
    isRainbow = false;
    outlineColor = e.target.value;
  }
});

const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("click", () => {
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
});

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

class Ship {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.angle = 0;
    this.vel = { x: 0, y: 0 };
    this.radius = 10;
    this.shootCooldown = 0;
  }

  update() {
    if (keys["ArrowLeft"]) this.angle -= 0.05;
    if (keys["ArrowRight"]) this.angle += 0.05;
    if (keys["ArrowUp"]) {
      this.vel.x += Math.cos(this.angle) * 0.1;
      this.vel.y += Math.sin(this.angle) * 0.1;
    }

    this.x += this.vel.x;
    this.y += this.vel.y;

    this.x = (this.x + canvas.width) % canvas.width;
    this.y = (this.y + canvas.height) % canvas.height;

    if (this.shootCooldown > 0) this.shootCooldown--;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
    ctx.restore();
  }

  shoot() {
    if (this.shootCooldown === 0) {
      bullets.push(new Bullet(this.x, this.y, this.angle));
      this.shootCooldown = 10;
    }
  }
}

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vel = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5,
    };
    this.radius = 2;
    this.life = 60;
  }

  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;
    this.x = (this.x + canvas.width) % canvas.width;
    this.y = (this.y + canvas.height) % canvas.height;
    this.life--;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = outlineColor;
    ctx.fill();
  }
}

class Asteroid {
  constructor(x, y, size = 40, speedMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = size;
    this.vel = {
      x: randRange(-1.5, 1.5) * speedMultiplier,
      y: randRange(-1.5, 1.5) * speedMultiplier,
    };
  }

  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;
    this.x = (this.x + canvas.width) % canvas.width;
    this.y = (this.y + canvas.height) % canvas.height;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
  }
}

const ship = new Ship();
let bullets = [];
let asteroids = [];

function spawnAsteroids(count = 5, speedMultiplier = 1) {
  for (let i = 0; i < count; i++) {
    const x = randRange(0, canvas.width);
    const y = randRange(0, canvas.height);
    asteroids.push(new Asteroid(x, y, 40, speedMultiplier));
  }
}

function collision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.hypot(dx, dy);
  return dist < a.radius + b.radius;
}

let spawnCooldown = 0;
let frames = 0;
let difficultyLevel = 1;

function updateOutlineColor() {
  if (isRainbow) {
    rainbowHue = (rainbowHue + 1) % 360;
    outlineColor = `hsl(${rainbowHue}, 100%, 50%)`;
  }
}

function update() {
  updateOutlineColor();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!paused) {
    ship.update();

    if (keys["Space"]) {
      ship.shoot();
    }

    bullets = bullets.filter(b => b.life > 0);
    bullets.forEach(b => b.update());

    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();

      for (let j = bullets.length - 1; j >= 0; j--) {
        if (collision(a, bullets[j])) {
          bullets.splice(j, 1);
          asteroids.splice(i, 1);
          if (a.size > 20) {
            asteroids.push(new Asteroid(a.x, a.y, a.size / 2, difficultyLevel));
            asteroids.push(new Asteroid(a.x, a.y, a.size / 2, difficultyLevel));
          }
          break;
        }
      }

      if (collision(a, ship)) {
        alert("Game Over!");
        window.location.reload();
      }
    }

    frames++;
    if (frames % 600 === 0) {
      difficultyLevel++;
    }

    if (asteroids.length < 3 && spawnCooldown <= 0) {
      spawnAsteroids(4 + difficultyLevel, difficultyLevel);
      spawnCooldown = 120;
    }

    if (spawnCooldown > 0) spawnCooldown--;
  }

  ship.draw();
  bullets.forEach(b => b.draw());
  asteroids.forEach(a => a.draw());

  requestAnimationFrame(update);
}

spawnAsteroids();
update();
